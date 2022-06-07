const MultiSig = require("./Signers/MultiSig.js");
const BNSigner = require("./Signers/BNSigner.js");
const SecpSigner = require("./Signers/SecpSigner.js");
// Below import for intellisense and type support on jsdoc
const Wallet = require('./Wallet.js'); //eslint-disable-line

/**
 * Account handler
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {Array} accounts - A list of associated account objects
 */
class Accounts {
    /**
     * Creates an instance of Accounts.
     * @param {Wallet} Wallet - Circular wallet reference to use internally of Account class
     */
    constructor(Wallet) {
        this.Wallet = Wallet;
        this.accounts = [];        
    }

    /**
     * Build account object
     * @param {number} curve
     * @param {hex} address
     * @param {hex} signer
     * @returns {Object} account
     */
    async _buildAccountObject(curve, address, signer) {
        const utxo = { 
            "DataStores": [], 
            "ValueStores": [], 
            "AtomicSwaps": [], 
            "ValueStoreIDs": [], 
            "DataStoreIDs": [], 
            "AtomicSwapIDs": [], 
            "Value": "" 
        };

        const account = { 
            "UTXO": utxo, 
            "curve": curve, 
            "address": address, 
            "signer": signer,
            "getAccountUTXOs": async (minValue) => this._getAccountUTXOs(address, minValue), 
            "getAccountUTXOsByIds": async (utxoIds) => this._getAccountUTXOsByIds(address, utxoIds), 
            "getAccountValueStores": async (minValue) => this._getAccountValueStores(address, minValue), 
            "getAccountDataStores": async (minValue) => {
                let dataStoreUTXOs = await this.Wallet.Rpc.getDataStoreUTXOIDsAndIndices(address, curve, minValue, false);
                return dataStoreUTXOs;
            },
            "getAccountBalance": async () => {
                let [,balance] = await this.Wallet.Rpc.getValueStoreUTXOIDs(address, curve, false);
                return balance;
            }
        };
        
        this.accounts.push(account);
        return account;
    }

    /**
     * Add account to accounts array
     * @param {hex} privateKey
     * @param {number} [curve=1]
     * @throws Bad argument
     * @throws Account already added
     * @returns {Object} account
     */
    async addAccount(privateKey, curve = 1) {
        try {
            privateKey = this.Wallet.Utils.isPrivateKey(privateKey)
            curve = this.Wallet.Utils.isCurve(curve)

            if (!privateKey || !curve) {
                throw "Bad argument"
            }

            let signer;
            if (curve === 1) {
                signer = new SecpSigner(this.Wallet, privateKey)
            }
            else {
                signer = new BNSigner(this.Wallet, privateKey)
                signer.multiSig = new MultiSig(this.Wallet, signer);
            }
            let address = await signer.getAddress();
            for (let i = 0; i < this.accounts.length; i++) {
                if (this.accounts[i]["address"] === address) {
                    throw "Account already added"
                }
            }
            const account = this._buildAccountObject(curve, address, signer);
            return account;
        }
        catch (ex) {
            throw new Error("Account.addAccount\r\n" + String(ex));
        }
    }

    /**
     * Add multisig account
     * @param {Array<hex>} publicKeys
     * @throws Invalid public key array
     * @returns {Object} account
     */
    async addMultiSig(publicKeys) {
        try {
            if (!publicKeys || !Array.isArray(publicKeys) || publicKeys.length <= 0) {
                throw "Invalid public key array"
            }
            let pubs = []
            for (let i = 0; i < publicKeys.length; i++) {
                let pCheck = this.Wallet.Utils.isHex(publicKeys[i]);
                pubs.push(pCheck);
            }
            let bnSigner = new BNSigner(this.Wallet)
            let signer = new MultiSig(this.Wallet, bnSigner);
            let multiPub = await signer.addPublicKeys(publicKeys);
            let multiAddr = await signer.getAddress(multiPub);
            const account = this._buildAccountObject(2, multiAddr, signer);
            return account;
        }
        catch(ex) {
            throw new Error("Account.addMultiSig\r\n" + String(ex));
        }
    }

    /**
     * Remove account by address
     * @param {hex} address
     */
    async removeAccount(address) {
        try {
            let acctIdx = await this._getAccountIndex(address)
            this.accounts.splice(acctIdx, 1);
        }
        catch (ex) {
            throw new Error("Account.removeAccount\r\n" + String(ex));
        }
    }

    /**
     * Get account object by address
     * @param {hex} address
     * @throws Could not find account
     * @returns {Object}
     */
    async getAccount(address) {
        try {
            address = this.Wallet.Utils.isAddress(address)
            for (let i = 0; i < this.accounts.length; i++) {
                if (this.accounts[i]["address"] === address) {
                    return this.accounts[i];
                }
            }
            throw "Could not find account";
        }
        catch (ex) {
            throw new Error("Account.getAccount\r\n" + String(ex));
        }
    }

    /**
     * Get account index in accounts array by address
     * @param {hex} address
     * @throws Could not find account index
     * @returns {Promise<Number>}
     */
    async _getAccountIndex(address) {
        try {
            address = this.Wallet.Utils.isAddress(address)
            for (let i = 0; i < this.accounts.length; i++) {
                if (this.accounts[i]["address"] === address) {
                    return i;
                }
            }
            throw "Could not find account index";
        }
        catch (ex) {
            throw new Error("Account._getAccountIndex\r\n" + String(ex));
        }
    }

    /**
     * Get UTXOs for account
     * @param {hex} address
     * @param {number} minValue
     */
    async _getAccountUTXOs(address, minValue) {
        try {
            address = this.Wallet.Utils.isAddress(address)
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
            throw new Error("Account._getAccountUTXOs\r\n" + String(ex));
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
            address = this.Wallet.Utils.isAddress(address)
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
            throw new Error("Account._getAccountUTXOsByIds\r\n" + String(ex));
        }
    }

    /**
     * Get Value Stores for account
     * @param {hex} address
     * @param {number} minValue
     */
    async _getAccountValueStores(address, minValue) {
        try {
            address = this.Wallet.Utils.isAddress(address)
            let accountIndex = await this._getAccountIndex(address)
            this.accounts[accountIndex]["UTXO"] = { "DataStores": [], "ValueStores": [], "AtomicSwaps": [], "ValueStoreIDs": [], "DataStoreIDs": [], "AtomicSwapIDs": [], "Value": "" }
            let [valueUTXOIDs, TotalValue] = await this.Wallet.Rpc.getValueStoreUTXOIDs(address, this.accounts[accountIndex]["curve"], minValue)
            this.accounts[accountIndex]["UTXO"]["ValueStoreIDs"] = valueUTXOIDs;
            this.accounts[accountIndex]["UTXO"]["Value"] = BigInt("0x" + TotalValue);
            let [,VS] = await this.Wallet.Rpc.getUTXOsByIds(valueUTXOIDs)
            this.accounts[accountIndex]["UTXO"]["ValueStores"] = VS;
        }
        catch (ex) {
            throw new Error("Account._getAccountValueStores\r\n" + String(ex));
        }
    }
}

module.exports = Accounts;
