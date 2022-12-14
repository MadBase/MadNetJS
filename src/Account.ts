import MultiSig from "./Signers/MultiSig";
import BNSigner from "./Signers/BNSigner";
import SecpSigner from "./Signers/SecpSigner";
// Below import for intellisense and type support on jsdoc
// const Wallet = require('./Wallet.js'); //eslint-disable-line

// TODO Move to Wallet.ts
type Wallet = {
    _initializeParams: () => {};
    Rpc: any;
    Utils: any;
}

/**
 * Account handler
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {Array} accounts - A list of associated account objects
 */
class Account {
    private Wallet: Wallet;
    public accounts: Array<Object>;

    /**
     * Creates an instance of Accounts.
     * @param {Wallet} Wallet - Circular wallet reference to use internally of Account class
     */
    constructor(Wallet: Wallet) {
        this.Wallet = Wallet;
        this.accounts = [];        
    }

    /**
     * Build account object
     * @param {number} curve
     * @param {hex} address
     * @param {hex} signer
     * @returns {Object} Account Object
     */
    async _buildAccountObject(curve: number, address: string, signer: string): Promise<Object> {
        const utxo = { 
            "DataStores": [], 
            "ValueStores": [], 
            "ValueStoreIDs": [], 
            "DataStoreIDs": [], 
            "Value": "" 
        };

        const account = { 
            "UTXO": utxo, 
            "curve": curve, 
            "address": address, 
            "signer": signer,
            "getAccountUTXOs": async (minValue: number) => this._getAccountUTXOs(address, minValue), 
            "getAccountUTXOsByIds": async (utxoIds: Array<string>) => this._getAccountUTXOsByIds(address, utxoIds), 
            "getAccountValueStores": async (minValue: number) => this._getAccountValueStores(address, minValue), 
            "getAccountDataStores": async (minValue: number) => {
                const dataStoreUTXOs = await this.Wallet.Rpc.getDataStoreUTXOIDsAndIndices(address, curve, minValue, false);
                return dataStoreUTXOs;
            },
            "getAccountBalance": async () => {
                const [,balance] = await this.Wallet.Rpc.getValueStoreUTXOIDs(address, curve, false);
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
     * @returns {Object} Account Object
     */
    async addAccount(privateKey, curve = 1) {
        try {
            privateKey = this.Wallet.Utils.isPrivateKey(privateKey);
            curve = this.Wallet.Utils.isCurve(curve);

            if (!privateKey || !curve) {
                throw "Bad argument";
            }

            let signer;
            if (curve === 1) {
                signer = new SecpSigner(this.Wallet, privateKey);
            }
            else {
                signer = new BNSigner(this.Wallet, privateKey);
                signer.multiSig = new MultiSig(this.Wallet, signer);
            }
            const address = await signer.getAddress();

            const existingAccount = this.accounts.find(a => a.address === address);
            if(existingAccount) {
                throw "Account already added";
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
     * @returns {Object} Account Object
     */
    async addMultiSig(publicKeys) {
        try {
            if (!publicKeys || !Array.isArray(publicKeys) || publicKeys.length <= 0) {
                throw "Invalid public key array";
            }
            let pubs = [];
            for (let i = 0; i < publicKeys.length; i++) {
                const pCheck = this.Wallet.Utils.isHex(publicKeys[i]);
                pubs.push(pCheck);
            }
            const bnSigner = new BNSigner(this.Wallet);
            const signer = new MultiSig(this.Wallet, bnSigner);
            const multiPub = await signer.addPublicKeys(publicKeys);
            const multiAddr = await signer.getAddress(multiPub);
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
            const acctIdx = await this._getAccountIndex(address);
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
     * @returns {Object} Account Object
     */
    async getAccount(address) {
        try {
            address = this.Wallet.Utils.isAddress(address);
            const account = this.accounts.find(a => a.address === address);
            if(account) 
                return account;
            else 
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
     * @returns {number} Index for the provided address
     */
    async _getAccountIndex(address) {
        try {
            address = this.Wallet.Utils.isAddress(address);
            const accountIndex = this.accounts.findIndex(a => a.address === address);
            if(accountIndex === -1){
                throw "Could not find account index";
            } 
            else {
                return accountIndex;
            }
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
            address = this.Wallet.Utils.isAddress(address);
            const accountIndex = await this._getAccountIndex(address);
            this.accounts[accountIndex].UTXO = { "DataStores": [], "ValueStores": [], "ValueStoreIDs": [], "DataStoreIDs": [], "Value": "" };
            let UTXOIDs = [];
            const [valueUTXOIDs, TotalValue] = await this.Wallet.Rpc.getValueStoreUTXOIDs(address, this.accounts[accountIndex].curve, minValue);
            this.accounts[accountIndex].UTXO.ValueStoreIDs = valueUTXOIDs;
            this.accounts[accountIndex].UTXO.Value = BigInt("0x" + TotalValue);
            UTXOIDs = UTXOIDs.concat(valueUTXOIDs);
            const dataUTXOIDs = await this.Wallet.Rpc.getDataStoreUTXOIDs(address, this.accounts[accountIndex].curve, false, false);
            this.accounts[accountIndex].UTXO.DataStoreIDs = dataUTXOIDs;
            UTXOIDs = UTXOIDs.concat(dataUTXOIDs);
            const [DS, VS] = await this.Wallet.Rpc.getUTXOsByIds(UTXOIDs);
            this.accounts[accountIndex].UTXO.DataStores = DS;
            this.accounts[accountIndex].UTXO.ValueStores = VS;
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
            address = this.Wallet.Utils.isAddress(address);
            const accountIndex = await this._getAccountIndex(address);
            this.accounts[accountIndex].UTXO = { "DataStores": [], "ValueStores": [], "ValueStoreIDs": [], "DataStoreIDs": [], "Value": "" };
            const [DS, VS] = await this.Wallet.Rpc.getUTXOsByIds(utxoIds);
            if (DS.length > 0) {
                this.accounts[accountIndex].UTXODataStores = DS;
            }
            if (VS.length > 0) {
                this.accounts[accountIndex].UTXO.ValueStores = VS;
            }
            let totalValue = BigInt(0);
            for (let i = 0; i < this.accounts[accountIndex].UTXO.ValueStores.length; i++) {
                totalValue += BigInt("0x" + this.accounts[accountIndex].UTXO.ValueStores[i].VSPreImage.Value);
            }
            this.accounts[accountIndex].UTXO.Value = totalValue;
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
            address = this.Wallet.Utils.isAddress(address);
            const accountIndex = await this._getAccountIndex(address);
            this.accounts[accountIndex].UTXO = { "DataStores": [], "ValueStores": [], "ValueStoreIDs": [], "DataStoreIDs": [], "Value": "" };
            const [valueUTXOIDs, TotalValue] = await this.Wallet.Rpc.getValueStoreUTXOIDs(address, this.accounts[accountIndex]["curve"], minValue);
            this.accounts[accountIndex].UTXO.ValueStoreIDs = valueUTXOIDs;
            this.accounts[accountIndex].UTXO.Value = BigInt("0x" + TotalValue);
            const [,VS] = await this.Wallet.Rpc.getUTXOsByIds(valueUTXOIDs);
            this.accounts[accountIndex].UTXO.ValueStores = VS;
        }
        catch (ex) {
            throw new Error("Account._getAccountValueStores\r\n" + String(ex));
        }
    }
}

module.exports = Account;
