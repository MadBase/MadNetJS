const validator = require('./Validator.js');
const utils = require('./Transaction/Utils.js');
const Tx = require('./Transaction/Tx.js');
const Constants = require('./Constants.js')
/**
 * Transaction handler
 * @class Transaction
 */
class Transaction {
    /**
     * Creates an instance of Transaction.
     * @param {Object} Wallet
     */
    constructor(Wallet) {
        this.Wallet = Wallet;
        this.Tx = new Tx(Wallet);
        this.Utils = utils;

        this.outValue = [];
    }

    /**
     * Create TxIns and send the transaction
     * @param {hex} [changeAddress=false]
     * @param {hex} [changeAddressCurve=false]
     * @param {Object} [UTXOIDs=[]]
     * @return {hex} Transaction hash
     */
    async sendTx(changeAddress, changeAddressCurve, UTXOIDs = []) {
        try {
            // TODO: create tx fee in Vout
            // create new method addBaseFee()
            let feeEst = await this.Tx.estimateFees();
            console.log(JSON.stringify(feeEst))
            await this._addOutValue(feeEst["totalFees"], this.Wallet.Account.accounts[0]["address"]);
            //

            await this._createTxIns(changeAddress, changeAddressCurve, UTXOIDs);
            await this.Tx._createTx();
            let txHash = await this.Wallet.Rpc.sendTransaction(this.Tx.getTx())
            await this._reset();
            return txHash;
        } catch (ex) {
            this._reset();
            throw new Error("Transaction.sendTx: " + String(ex));
        }
    }



    /**
     * Create a ValueStore
     * @param {hex} from
     * @param {number} value
     * @param {hex} to
     * @param {number} toCurve
     * @return ValueStore
     */
    async createValueStore(from, value, to, toCurve) {
        // TODO: Add fee
        try {
            if (!from || !to || !value || !toCurve) {
                throw "Missing arugments";
            }
            from = validator.isAddress(from);
            value = validator.isBigInt(value);
            toCurve = validator.isCurve(toCurve)
            to = validator.isAddress(to);
            if (value <= BigInt(0)) {
                throw "Invalid value"
            }

            let account = await this.Wallet.Account.getAccount(from);
            if (!account["MultiSigner"]["curve"]) {
                throw "Cannot get curve";
            }
            let owner = await this.Utils.prefixSVACurve(1, toCurve, to);
            // get fee from rpc
            let vStore = this.Tx.ValueStore(
                validator.numToHex(value),
                this.Tx.Vout.length,
                owner
            )
            await this._addOutValue(value, account["address"]);
            return vStore;
        } catch (ex) {
            throw new Error("Transaction.createValueStore: " + String(ex));
        }
    }

    /**
     * Create a DataStore
     * @param {hex} from
     * @param {(string|hex)} index
     * @param {number} duration
     * @param {(string|hex)} rawData
     * @param {number} [issuedAt=false]
     * @return DataStore
     */
    async createDataStore(from, index, duration, rawData, issuedAt = false) {
        // TODO: Add Fee per epoch maths
        try {
            if (!from || !index || !duration || !rawData) {
                throw "Missing arguments";
            }
            from = validator.isAddress(from);
            duration = validator.isBigInt(duration);
            if (duration <= BigInt(0)) {
                throw "Invalid duration"
            }
            let account = await this.Wallet.Account.getAccount(from);
            if (!account) {
                throw "Cannot get account";
            }
            if (issuedAt) {
                issuedAt = validator.isNumber(issuedAt);
            }
            else {
                if (!this.Wallet.Rpc.rpcServer) {
                    throw "RPC server must be set to fetch epoch"
                }
                issuedAt = await this.Wallet.Rpc.getEpoch();
                let blockNumber = await this.Wallet.Rpc.getBlockNumber();
                if ((blockNumber % Constants.EpochBlockSize) > Constants.EpochBoundary ||
                    (blockNumber % Constants.EpochBlockSize) === 0
                ) {
                    issuedAt++
                }
            }
            if (rawData.indexOf("0x") === 0) {
                rawData = validator.isHex(rawData);
            }
            else {
                rawData = validator.txtToHex(rawData);
            }
            let deposit = await this.Utils.calculateDeposit(rawData, duration);
            deposit = validator.isBigInt(deposit)
            let owner = await this.Utils.prefixSVACurve(3, account["MultiSigner"]["curve"], account["address"]);
            let txIdx = this.Tx.Vout.length;
            if (index.indexOf("0x") === 0) {
                index = validator.isHex(index);
            }
            else {
                index = validator.txtToHex(index);
            }
            if (index.length > 64) {
                throw "Index too large";
            }
            else if (index.length != 64) {
                index = index.padStart(64, "0")
            }
            let dStore = this.Tx.DataStore(index,
                issuedAt,
                validator.numToHex(deposit),
                rawData,
                txIdx,
                owner
            )
            await this._addOutValue(deposit, account["address"], { index: index, epoch: issuedAt });
            return dStore;
        } catch (ex) {
            throw new Error("Transaction.createDataStore: " + String(ex));
        }
    }

    /**
     * _reset transaction Objects
     */
    async _reset() {
        this.Tx = new Tx(this.Wallet)
        this.outValue = [];
    }

    /**
     * Track TxOut running total
     * @param {number} value
     * @param {hex} ownerAddress
     * @param {hex} [dsIndex=false]
     */
    async _addOutValue(value, ownerAddress, dsIndex) {
        try {
            let valueIndex = false;
            for (let i = 0; i < this.outValue.length; i++) {
                if (this.outValue[i]["address"] === ownerAddress) {
                    valueIndex = i;
                    break;
                }
            }

            if (!isNaN(valueIndex) && this.outValue[valueIndex]) {
                this.outValue[valueIndex]["totalValue"] += value;
                if (dsIndex) {
                    this.outValue[valueIndex]["dsIndex"].push(dsIndex)
                }
            } else {
                this.outValue.push({
                    "address": ownerAddress,
                    "totalValue": value,
                    "dsIndex": dsIndex ? [dsIndex] : []
                });
            }
        } catch (ex) {
            throw new Error("Transaction._addOutValue: " + String(ex));
        }
    }

    /**
     * Create all TxIns required for Vin
     * @param {hex} [changeAddress=false]
     * @param {hex} [changeAddressCurve=false]
     * @param {Object} [UTXOIDs=false]
     */
    async _createTxIns(changeAddress, changeAddressCurve, UTXOIDs = []) {
        try {
            let OutValue = this.outValue.slice();
            for (let i = 0; i < OutValue.length; i++) {
                let outValue = OutValue[i];
                let account = await this.Wallet.Account.getAccount(outValue["address"]);
                if (UTXOIDs.length > 0) {
                    await this.Wallet.Account._getAccountUTXOsByIds(account["address"], UTXOIDs);
                }
                else {
                    await this.Wallet.Account._getAccountValueStores(account["address"], outValue["totalValue"]);
                }
                for (let i = 0; i < outValue["dsIndex"].length; i++) {
                    let DS = await this.Wallet.Rpc.getDataStoreByIndex(account["address"], account["curve"], outValue["dsIndex"][i]["index"]);
                    if (DS) {
                        let reward = await this.Utils.remainigDeposit(DS, outValue["dsIndex"][i]["epoch"]);
                        if (reward) {
                            await this._createDataTxIn(account["address"], DS);
                            outValue["totalValue"] = BigInt(outValue["totalValue"]) - BigInt(reward);
                        }
                    }
                }
                if (BigInt(outValue["totalValue"]) > BigInt(account["UTXO"]["Value"])) {
                    throw "Insufficient funds";
                }
                if (BigInt(outValue["totalValue"]) == BigInt(0)) {
                    return;
                }
                else if (BigInt(outValue["totalValue"]) < BigInt(0)) {
                    await this.createValueStore(account["address"], BigInt(BigInt(outValue["totalValue"]) * BigInt(-1)), changeAddress ? changeAddress : account["address"], changeAddressCurve ? changeAddressCurve : account["MultiSigner"]["curve"])
                }
                else {
                    await this._spendUTXO(account["UTXO"], account, outValue["totalValue"], changeAddress, changeAddressCurve);
                }
            }
        } catch (ex) {
            throw new Error("Transaction._createTxIns: " + String(ex));
        }
    }

    /**
     * Create a single TxIn consuming a ValueStore
     * @param {hex} address
     * @param {Object} utxo
     */
    async _createValueTxIn(address, utxo) {
        try {
            this.Tx.TxIn(
                utxo["TxHash"],
                utxo["VSPreImage"]["TXOutIdx"] ? utxo["VSPreImage"]["TXOutIdx"] : 0
            )
            this.Tx.txInOwners.push({
                "address": address,
                "txOutIdx": utxo["VSPreImage"]["TXOutIdx"] ? utxo["VSPreImage"]["TXOutIdx"] : 0,
                "txHash": utxo["TxHash"],
                "isDataStore": false
            });
        } catch (ex) {
            throw new Error("Transaction.createTxIn: " + String(ex));
        }
    }

    /**
     * Create a single TxIn consuming a DataStore
     * @param {hex} address
     * @param {Object} utxo
     */
    async _createDataTxIn(address, utxo) {
        try {
            this.Tx.TxIn(
                utxo["DSLinker"]["TxHash"],
                utxo["DSLinker"]["DSPreImage"]["TXOutIdx"] ? utxo["DSLinker"]["DSPreImage"]["TXOutIdx"] : 0
            )
            this.Tx.txInOwners.push({
                "address": address,
                "txOutIdx": utxo["DSLinker"]["DSPreImage"]["TXOutIdx"] ? utxo["DSLinker"]["DSPreImage"]["TXOutIdx"] : 0,
                "txHash": utxo["DSLinker"]["TxHash"],
                "isDataStore": true
            });
        } catch (ex) {
            throw new Error("Transaction.createTxIn: " + String(ex));
        }
    }

    /**
     * Consume UTXOs until required value is met
     * @param {Object} accountUTXO
     * @param {hex} account
     * @param {number} currentValue
     * @param {hex} [changeAddress=false]
     * @param {hex} [changeAddressCurve=false]
     * @return {boolean} exit 
     */
    async _spendUTXO(accountUTXO, account, currentValue, changeAddress, changeAddressCurve) {
        try {
            accountUTXO = accountUTXO["ValueStores"]
            let spent = false;
            while (!spent) {
                let highestUnspent = false
                for (let i = 0; i < accountUTXO.length; i++) {
                    if (!highestUnspent) {
                        highestUnspent = accountUTXO[i];
                        continue;
                    }
                    if (BigInt("0x" + accountUTXO[i]["VSPreImage"]["Value"]) > BigInt("0x" + highestUnspent["VSPreImage"]["Value"])) {
                        highestUnspent = accountUTXO[i];
                    }
                }
                if (!highestUnspent) {
                    throw "Could not find highest value UTXO"
                }
                highestUnspent["VSPreImage"]["Value"] = BigInt("0x" + highestUnspent["VSPreImage"]["Value"])
                await this._createValueTxIn(account["address"], highestUnspent);
                for (let i = 0; i < accountUTXO.length; i++) {
                    if (accountUTXO[i]["TxHash"] === highestUnspent["TxHash"] &&
                    accountUTXO[i]["VSPreImage"]["TXOutIdx"] === highestUnspent["VSPreImage"]["TXOutIdx"]
                    ) {
                        await accountUTXO.splice(i, 1);
                        break;
                    }
                }
                let remaining = BigInt(BigInt(highestUnspent["VSPreImage"]["Value"]) - BigInt(currentValue));
                if (remaining > BigInt(0)) {
                    await this.createValueStore(account["address"], remaining.toString(10), changeAddress ? changeAddress : account["address"], changeAddressCurve ? changeAddressCurve : account["MultiSigner"]["curve"])
                    break;
                }
                currentValue = BigInt(currentValue) - BigInt(highestUnspent["VSPreImage"]["Value"]);
                if (currentValue === BigInt(0)) {
                    break;
                }
            }
        } catch (ex) {
            throw new Error("Trasaction._spendUTXO: " + String(ex));
        }
    }
}
module.exports = Transaction;
