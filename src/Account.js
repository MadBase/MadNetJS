const MultiSigner = require("./MultiSigner.js");
const validator = require("./Validator.js");
/**
 * Account handler
 * @class Accounts
 */
class Accounts {
    /**
     * Creates an instance of Accounts.
     * @param {Object} Wallet
     */
    constructor(Wallet) {
        this.Wallet = Wallet;
        this.accounts = [];
    }

    /**
     * Add account to accounts array
     * @param {hex} privateKey
     * @param {number} [curve=1]
     */
    async addAccount(privateKey, curve = 1) {
        try {
            privateKey = validator.isPrivateKey(privateKey)
            curve = validator.isCurve(curve)
            if (!privateKey || !curve) {
                throw "Bad argument"
            }
            let multiSigner = new MultiSigner(privateKey, curve);
            let address = await multiSigner.getAddress();
            for (let i = 0; i < this.accounts.length; i++) {
                if (this.accounts[i]["address"] === address) {
                    throw "Account already added"
                }
            }
            let utxo = { "DataStores": [], "ValueStores": [], "AtomicSwaps": [], "ValueStoreIDs": [], "DataStoreIDs": [], "AtomicSwapIDs": [], "Value": "" }
            let acct = { "UTXO": utxo, "curve": curve, "address": address, "MultiSigner": multiSigner };
            this.accounts.push(acct);
        }
        catch (ex) {
            throw new Error("Account.addAccount: " + String(ex));
        }
    }

    /**
     * Remove account from accounts array
     * @param {hex} address
     */
         async removeAccount(address) {
            try {
                acctIdx = _getAccountIndex(address)
                this.accounts.splice(acctIdx);
            }
            catch (ex) {
                throw new Error("Account.removeAccount: " + String(ex));
            }
        }

    /**
     * Get account object by address
     * @param {hex} address
     * @return {Object}
     */
    async getAccount(address) {
        try {
            address = validator.isAddress(address)
            for (let i = 0; i < this.accounts.length; i++) {
                if (this.accounts[i]["address"] === address) {
                    return this.accounts[i];
                }
            }
            throw "Could not find account";
        }
        catch (ex) {
            throw new Error("Account.getAccount: " + String(ex));
        }
    }

    /**
     * Get account index in accounts array by address
     * @param {hex} address
     * @return {number}
     */
    async _getAccountIndex(address) {
        try {
            address = validator.isAddress(address)
            for (let i = 0; i < this.accounts.length; i++) {
                if (this.accounts[i]["address"] === address) {
                    return i;
                }
            }
            throw "Could not find account index";
        }
        catch (ex) {
            throw new Error("Account._getAccountIndex: " + String(ex));
        }
    }

    /**
     * Get UTXOs for account
     * @param {hex} address
     * @param {number} minValue
     */
    async _getAccountUTXOs(address, minValue) {
        try {
            address = validator.isAddress(address)
            let accountIndex = await this._getAccountIndex(address)
            this.accounts[accountIndex]["UTXO"] = { "DataStores": [], "ValueStores": [], "AtomicSwaps": [], "ValueStoreIDs": [], "DataStoreIDs": [], "AtomicSwapIDs": [], "Value": "" }
            let UTXOIDs = [];
            let [valueUTXOIDs, TotalValue] = await this.Wallet.Rpc.getValueStoreUTXOIDs(address, this.accounts[accountIndex]["curve"], minValue)
            this.accounts[accountIndex]["UTXO"]["ValueStoreIDs"] = valueUTXOIDs;
            this.accounts[accountIndex]["UTXO"]["Value"] = BigInt("0x" + TotalValue);
            UTXOIDs = UTXOIDs.concat(valueUTXOIDs)
            let dataUTXOIDs = await this.Wallet.Rpc.getDataStoreUTXOIDs(address, this.accounts[accountIndex]["curve"], false, false)
            this.accounts[accountIndex]["UTXO"]["DataStoreIDs"] = dataUTXOIDs;
            UTXOIDs = UTXOIDs.concat(dataUTXOIDs)
            let [DS, VS, AS] = await this.Wallet.Rpc.getUTXOsByIds(UTXOIDs)
            this.accounts[accountIndex]["UTXO"]["DataStores"] = DS;
            this.accounts[accountIndex]["UTXO"]["ValueStores"] = VS;
            this.accounts[accountIndex]["UTXO"]["AtomicSwaps"] = AS;
        }
        catch (ex) {
            throw new Error("Account._getAccountUTXOs: " + String(ex))
        }
    }

    /**
     * Get specific UTXOs for account
     * @param {hex} address
     * @param {hex} utxoIds
     */
    async _getAccountUTXOsByIds(address, utxoIds) {
        try {
            if (!Array.isArray(utxoIds)) {
                utxoIds = [utxoIds];
            }
            address = validator.isAddress(address)
            let accountIndex = await this._getAccountIndex(address)
            this.accounts[accountIndex]["UTXO"] = { "DataStores": [], "ValueStores": [], "AtomicSwaps": [], "ValueStoreIDs": [], "DataStoreIDs": [], "AtomicSwapIDs": [], "Value": "" }
            let [DS, VS, AS] = await this.Wallet.Rpc.getUTXOsByIds(utxoIds)
            if (DS.length > 0) {
                this.accounts[accountIndex]["UTXO"]["DataStores"] = DS;
            }
            if (VS.length > 0) {
                this.accounts[accountIndex]["UTXO"]["ValueStores"] = VS;
            }
            if (AS.length > 0) {
                this.accounts[accountIndex]["UTXO"]["AtomicSwaps"] = AS;
            }
            let totalValue = BigInt(0);
            for (let i = 0; i < this.accounts[accountIndex]["UTXO"]["ValueStores"].length; i++) {
                totalValue += BigInt("0x" + this.accounts[accountIndex]["UTXO"]["ValueStores"][i]["VSPreImage"]["Value"]);
            }
            this.accounts[accountIndex]["UTXO"]["Value"] = totalValue;
        }
        catch (ex) {
            throw new Error("Account._getAccountUTXOsByIds: " + String(ex));
        }
    }

    async _getAccountValueStores(address, minValue) {
        try {
            address = validator.isAddress(address)
            let accountIndex = await this._getAccountIndex(address)
            this.accounts[accountIndex]["UTXO"] = { "DataStores": [], "ValueStores": [], "AtomicSwaps": [], "ValueStoreIDs": [], "DataStoreIDs": [], "AtomicSwapIDs": [], "Value": "" }
            let [valueUTXOIDs, TotalValue] = await this.Wallet.Rpc.getValueStoreUTXOIDs(address, this.accounts[accountIndex]["curve"], minValue)
            this.accounts[accountIndex]["UTXO"]["ValueStoreIDs"] = valueUTXOIDs;
            this.accounts[accountIndex]["UTXO"]["Value"] = BigInt("0x" + TotalValue);
            let [DS, VS, AS] = await this.Wallet.Rpc.getUTXOsByIds(valueUTXOIDs)
            this.accounts[accountIndex]["UTXO"]["ValueStores"] = VS;
        }
        catch (ex) {
        }
    }
}
module.exports = Accounts;
