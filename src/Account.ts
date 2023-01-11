import MultiSig from "./Signers/MultiSig";
import BNSigner from "./Signers/BNSigner";
import SecpSigner from "./Signers/SecpSigner";
import { DataStore, Utxo, ValueStore, WalletType } from "./types/Types";

// TODO Multisig.js or BNSigner.js
export interface Signer {
    multiSig?: () => {};
    getAddress: () => {};
    addPublicKeys: (publicKeys: any) => Promise<any>;
}

export interface AccountObject {
    utxo: Utxo;
    utxoDataStores?: string;
    curve: number;
    address: string;
    signer: Signer;
    getAccountUTXOs: (minValue: number) => Promise<Utxo>;
    getAccountUTXOsByIds: (utxoIds: Array<string>) => Promise<Utxo>;
    getAccountValueStores: (minValue: number) => Promise<ValueStore[]>;
    getAccountDataStores: (minValue: number) => Promise<DataStore[]>;
    getAccountBalance: () => Promise<string>;
}

/**
 * Account handler
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {Array} accounts - A list of associated account objects
 */
export default class Account {
    private Wallet: WalletType;
    public accounts: Array<AccountObject>;

    /**
     * Creates an instance of Accounts.
     * @param {Wallet} Wallet - Circular wallet reference to use internally of Account class
     */
    constructor(Wallet: WalletType) {
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
    async _buildAccountObject(
        curve: number,
        address: string,
        signer: Signer
    ): Promise<AccountObject> {
        const utxo: Utxo = {
            dataStores: [],
            valueStores: [],
            valueStoreIDs: [],
            dataStoreIDs: [],
            value: "",
        };

        const account: AccountObject = {
            utxo: utxo,
            curve: curve,
            address: address,
            signer: signer,
            getAccountUTXOs: async (minValue: number) =>
                this._getAccountUTXOs(address, minValue),
            getAccountUTXOsByIds: async (utxoIds: Array<string>) =>
                this._getAccountUTXOsByIds(address, utxoIds),
            getAccountValueStores: async (minValue: number) =>
                this._getAccountValueStores(address, minValue),
            getAccountDataStores: async (minValue: number) => {
                const dataStoreUTXOs =
                    await this.Wallet.rpc.getDataStoreUTXOIDsAndIndices(
                        address,
                        curve,
                        minValue,
                        false
                    );
                return dataStoreUTXOs;
            },

            getAccountBalance: async () => {
                const [, balance] = await this.Wallet.rpc.getValueStoreUTXOIDs(
                    address,
                    curve,
                    false
                );
                return balance;
            },
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
    async addAccount(
        privateKey: string,
        curve: number = 1
    ): Promise<AccountObject> {
        try {
            privateKey = this.Wallet.utils.isPrivateKey(privateKey);
            curve = this.Wallet.utils.isCurve(curve);

            if (!privateKey || !curve) {
                throw "Bad argument";
            }

            let signer;

            if (curve === 1) {
                signer = new SecpSigner(this.Wallet, privateKey);
            } else {
                signer = new BNSigner(this.Wallet, privateKey);
                signer.multiSig = new MultiSig(this.Wallet, signer);
            }

            const address = await signer.getAddress();

            const existingAccount = this.accounts.find(
                (a) => a.address === address
            );

            if (existingAccount) throw "Account already added";

            const account = this._buildAccountObject(curve, address, signer);

            return account;
        } catch (ex) {
            throw new Error("Account.addAccount\r\n" + String(ex));
        }
    }

    /**
     * Add multisig account
     * @param {Array<hex>} publicKeys
     * @throws Invalid public key array
     * @returns {Object} Account Object
     */
    async addMultiSig(publicKeys: Array<string>): Promise<AccountObject> {
        try {
            if (
                !publicKeys ||
                !Array.isArray(publicKeys) ||
                publicKeys.length <= 0
            ) {
                throw "Invalid public key array";
            }

            let pubs = [];

            for (let i = 0; i < publicKeys.length; i++) {
                const pCheck = this.Wallet.utils.isHex(publicKeys[i]);
                pubs.push(pCheck);
            }

            const bnSigner = new BNSigner(this.Wallet);
            const signer = new MultiSig(this.Wallet, bnSigner);
            const multiPub = await signer.addPublicKeys(publicKeys);
            // TODO: Expects no params, why is it being passed multiPub?
            const multiAddr = await signer.getAddress(multiPub);
            const account = this._buildAccountObject(2, multiAddr, signer);

            return account;
        } catch (ex) {
            throw new Error("Account.addMultiSig\r\n" + String(ex));
        }
    }

    /**
     * Remove account by address
     * @param {hex} address
     */
    async removeAccount(address: string): Promise<void> {
        try {
            const acctIdx = await this._getAccountIndex(address);
            this.accounts.splice(acctIdx, 1);
        } catch (ex) {
            throw new Error("Account.removeAccount\r\n" + String(ex));
        }
    }

    /**
     * Get account object by address
     * @param {hex} address
     * @throws Could not find account
     * @returns {Object} Account Object
     */
    async getAccount(address: string): Promise<AccountObject> {
        try {
            address = this.Wallet.utils.isAddress(address);

            const account = this.accounts.find((a) => a.address === address);

            if (!account) throw "Could not find account";

            return account;
        } catch (ex) {
            throw new Error("Account.getAccount\r\n" + String(ex));
        }
    }

    /**
     * Get account index in accounts array by address
     * @param {hex} address
     * @throws Could not find account index
     * @returns {number} Index for the provided address
     */
    async _getAccountIndex(address: string): Promise<number> {
        try {
            address = this.Wallet.utils.isAddress(address);

            const accountIndex = this.accounts.findIndex(
                (a) => a.address === address
            );

            if (accountIndex === -1) throw "Could not find account index";

            return accountIndex;
        } catch (ex) {
            throw new Error("Account._getAccountIndex\r\n" + String(ex));
        }
    }

    /**
     * Get UTXOs for account
     * @param {hex} address
     * @param {number} minValue
     * @returns {Object}
     */
    async _getAccountUTXOs(address: string, minValue: number): Promise<Utxo> {
        try {
            address = this.Wallet.utils.isAddress(address);

            const accountIndex = await this._getAccountIndex(address);

            this.accounts[accountIndex].utxo = {
                dataStores: [],
                valueStores: [],
                valueStoreIDs: [],
                dataStoreIDs: [],
                value: "",
            };

            let UTXOIDs = [];

            const [valueUTXOIDs, TotalValue] =
                await this.Wallet.rpc.getValueStoreUTXOIDs(
                    address,
                    this.accounts[accountIndex].curve,
                    minValue
                );

            this.accounts[accountIndex].utxo.valueStoreIDs = valueUTXOIDs;
            this.accounts[accountIndex].utxo.value = BigInt("0x" + TotalValue);

            UTXOIDs = UTXOIDs.concat(valueUTXOIDs);

            const dataUTXOIDs = await this.Wallet.rpc.getDataStoreUTXOIDs(
                address,
                this.accounts[accountIndex].curve,
                false,
                false
            );

            this.accounts[accountIndex].utxo.dataStoreIDs = dataUTXOIDs;

            UTXOIDs = UTXOIDs.concat(dataUTXOIDs);

            const [DS, VS] = await this.Wallet.rpc.getUTXOsByIds(UTXOIDs);

            this.accounts[accountIndex].utxo.dataStores = DS;
            this.accounts[accountIndex].utxo.valueStores = VS;

            return this.accounts[accountIndex].utxo;
        } catch (ex) {
            throw new Error("Account._getAccountUTXOs\r\n" + String(ex));
        }
    }

    /**
     * Get specific UTXOs for account
     * @param {hex} address
     * @param {Array<hex>} utxoIds
     * @returns {Object}
     */
    async _getAccountUTXOsByIds(
        address: string,
        utxoIds: string[]
    ): Promise<Utxo> {
        try {
            if (!Array.isArray(utxoIds)) {
                utxoIds = [utxoIds];
            }

            address = this.Wallet.utils.isAddress(address);

            const accountIndex = await this._getAccountIndex(address);

            this.accounts[accountIndex].utxo = {
                dataStores: [],
                valueStores: [],
                valueStoreIDs: [],
                dataStoreIDs: [],
                value: "",
            };

            const [DS, VS] = await this.Wallet.rpc.getUTXOsByIds(utxoIds);

            if (DS.length > 0) {
                this.accounts[accountIndex].utxoDataStores = DS;
            }

            if (VS.length > 0) {
                this.accounts[accountIndex].utxo.valueStores = VS;
            }

            let totalValue = BigInt(0);

            for (
                let i = 0;
                i < this.accounts[accountIndex].utxo.valueStores.length;
                i++
            ) {
                // TODO: vsPreImage type is currently empty. We'll need to test out
                // what is expected here
                totalValue += BigInt(
                    "0x" +
                        this.accounts[accountIndex].utxo.valueStores[i]
                            .vsPreImage.Value
                );
            }

            this.accounts[accountIndex].utxo.value = totalValue;

            return this.accounts[accountIndex].utxo;
        } catch (ex) {
            throw new Error("Account._getAccountUTXOsByIds\r\n" + String(ex));
        }
    }

    /**
     * Get Value Stores for account
     * @param {hex} address
     * @param {number} minValue
     * @returns {Array<Object>}
     */
    async _getAccountValueStores(
        address: string,
        minValue: number
    ): Promise<ValueStore[]> {
        try {
            address = this.Wallet.utils.isAddress(address);

            const accountIndex = await this._getAccountIndex(address);

            this.accounts[accountIndex].utxo = {
                dataStores: [],
                valueStores: [],
                valueStoreIDs: [],
                dataStoreIDs: [],
                value: "",
            };

            const [valueUTXOIDs, TotalValue] =
                await this.Wallet.rpc.getValueStoreUTXOIDs(
                    address,
                    this.accounts[accountIndex]["curve"],
                    minValue
                );

            this.accounts[accountIndex].utxo.valueStoreIDs = valueUTXOIDs;
            this.accounts[accountIndex].utxo.value = BigInt("0x" + TotalValue);

            const [, VS] = await this.Wallet.rpc.getUTXOsByIds(valueUTXOIDs);

            this.accounts[accountIndex].utxo.valueStores = VS;

            return this.accounts[accountIndex].utxo.valueStores;
        } catch (ex) {
            throw new Error("Account._getAccountValueStores\r\n" + String(ex));
        }
    }
}
