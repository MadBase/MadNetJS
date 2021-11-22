const TxHasher = require('../GoWrappers/TxHasher.js');
const utils = require('./Utils.js');

/**
 * Transaction object creation
 * @class Tx
 */
class Tx {
    /**
     * Creates an instance of Tx.
     * @param {Object} Wallet
     */
    constructor(Wallet) {
        this.Wallet = Wallet;

        this.Vin = [];
        this.Vout = [];
        this.Fee = "0";

        this.txInOwners = [];
        this.txOutOwners = [];
    }

    /**
     * Get transaction object with Vin and Vout
     * @return {Object} 
     */
    getTx() {
        return {
            "Tx": {
                "Vin": this.Vin,
                "Vout": this.Vout,
                "Fee": this.Fee
            }
        }
    }

    /**
     * Create TxIn
     * @param {hex} consumedTxHash
     * @param {number} consumedTxIdx
     */
    TxIn(consumedTxHash, consumedTxIdx) {
        this.Vin.push({
            "Signature": "C0FFEE",
            "TXInLinker": this.TxInLinker(
                consumedTxHash,
                consumedTxIdx
            )
        })
    }

    /**
     * Create TXInLinker
     * @param {hex} consumedTxHash
     * @param {number} consumedTxIdx
     * @return {Object} 
     */
    TxInLinker(consumedTxHash, consumedTxIdx) {
        return {
            "TxHash": "C0FFEE",
            "TXInPreImage": this.TxInPreImage(
                consumedTxHash,
                consumedTxIdx
            )
        }
    }

    /**
     * Create TXInPreimage
     * @param {hex} consumedTxHash
     * @param {number} consumedTxIdx
     * @return {Object} 
     */
    TxInPreImage(consumedTxHash, consumedTxIdx) {
        return {
            "ChainID": this.Wallet.chainId,
            "ConsumedTxIdx": consumedTxIdx,
            "ConsumedTxHash": consumedTxHash
        }
    }

    /**
     * Create ValueStore
     * @param {number} value
     * @param {number} txOutIdx
     * @param {hex} owner
     * @param {hex} fee
     */
    ValueStore(value, txOutIdx, owner, fee) {
        this.Vout.push({
            "ValueStore": {
                "TxHash": "C0FFEE",
                "VSPreImage": this.VSPreImage(
                    value,
                    txOutIdx,
                    owner,
                    fee
                )
            }
        });
        return this.Vout[this.Vout.length - 1];
    }

    /**
     * Create VSPreImage
     * @param {number} value
     * @param {number} txOutIdx
     * @param {hex} owner
     * @param {hex} fee
     * @return {Object} 
     */
    VSPreImage(value, txOutIdx, owner, fee) {
        return {
            "ChainID": this.Wallet.chainId,
            "Value": value,
            "TXOutIdx": txOutIdx,
            "Owner": owner,
            "Fee": fee
        }
    }

    /**
     * Create DataStore
     * @param {hex} index
     * @param {number} issuedAt
     * @param {number} deposit
     * @param {hex} rawData
     * @param {number} txOutIdx
     * @param {hex} owner
     * @param {hex} fee
     */
    DataStore(index, issuedAt, deposit, rawData, txOutIdx, owner, fee) {
        this.Vout.push({
            "DataStore": {
                "Signature": "C0FFEE",
                "DSLinker": this.DSLinker(
                    index,
                    issuedAt,
                    deposit,
                    rawData,
                    txOutIdx,
                    owner,
                    fee
                )
            }
        })
        return this.Vout[this.Vout.length - 1];
    }

    /**
     * Create DSLinker
     * @param {hex} index
     * @param {number} issuedAt
     * @param {number} deposit
     * @param {hex} rawData
     * @param {number} txOutIdx
     * @param {hex} owner
     * @param {hex} fee
     * @return {Object} 
     */
    DSLinker(index, issuedAt, deposit, rawData, txOutIdx, owner, fee) {
        return {
            "TxHash": "C0FFEE",
            "DSPreImage": this.DSPreImage(
                index,
                issuedAt,
                deposit,
                rawData,
                txOutIdx,
                owner,
                fee
            )
        }
    }

    /**
     * Create DSPreImage
     * @param {hex} index
     * @param {number} issuedAt
     * @param {number} deposit
     * @param {hex} rawData
     * @param {number} txOutIdx
     * @param {hex} owner
     * @param {hex} fee
     * @return {Object} 
     */
    DSPreImage(index, issuedAt, deposit, rawData, txOutIdx, owner, fee) {
        return {
            "ChainID": this.Wallet.chainId,
            "Index": index,
            "IssuedAt": issuedAt,
            "Deposit": deposit,
            "RawData": rawData,
            "TXOutIdx": txOutIdx,
            "Owner": owner,
            "Fee": fee
        }
    }

    /**
     * Create AtomicSwap
     * @param {number} value
     * @param {number} txOutIdx
     * @param {number} issuedAt
     * @param {number} exp
     * @param {hex} owner
     * @param {hex} fee
     * @return {Object}
     */
    AtomicSwap(value, txOutIdx, issuedAt, exp, owner, fee) {
        this.Vout.push({
            "AtomicSwap": {
                "TxHash": "C0FFEE",
                "ASPreImage": this.ASPreImage(
                    value,
                    txOutIdx,
                    issuedAt,
                    exp,
                    owner,
                    fee
                )
            }
        })
        return this.Vout[this.Vout.length - 1];
    }

    /**
     * Create ASPreImage
     * @param {number} value
     * @param {number} txOutIdx
     * @param {number} issuedAt
     * @param {number} exp
     * @param {hex} owner
     * @param {hex} fee
     * @return {Object} 
     */
    ASPreImage(value, txOutIdx, issuedAt, exp, owner, fee) {
        return {
            "ChainID": this.Wallet.chainId,
            "Value": value,
            "TXOutIdx": txOutIdx,
            "IssuedAt": issuedAt,
            "Exp": exp,
            "Owner": owner,
            "Fee": fee
        }
    }

    /**
     * Create TxFee
     * @param {number} value
     */
    TxFee(value) {
        this.Fee = value;
    }


    /**
     * Get estimate of fees
     * @return {Object} Fee Estimates
     */
    async estimateFees() {
        if (!this.Wallet.Rpc.rpcServer) {
            throw 'Cannot estimate fees without RPC'
        }
        let fees = await this.Wallet.Rpc.getFees();
        let total = BigInt(0);
        let thisTotal = BigInt(0)
        let voutCost = [];
        for (let i = 0; i < this.Vout.length; i++) {
            switch (Object.keys(this.Vout[i])[0]) {
                case 'ValueStore':
                    thisTotal = BigInt("0x" + fees["ValueStoreFee"]);
                    total = BigInt(total) + BigInt(thisTotal)
                    voutCost.push(thisTotal.toString())
                    break;;
                case 'DataStore':
                    let rawData = this.Vout[i]["DataStore"]["DSLinker"]["DSPreImage"]["RawData"]
                    let dataSize = BigInt(Buffer.from(rawData, "hex").length)
                    let dsEpochs = await utils.calculateNumEpochs(dataSize, BigInt("0x" + this.Vout[i]["DataStore"]["DSLinker"]["DSPreImage"]["Deposit"]))
                    thisTotal= await utils.calculateFee(BigInt("0x" + fees["DataStoreFee"]), BigInt(dsEpochs))
                    total = BigInt(total) + BigInt(thisTotal)
                    voutCost.push(thisTotal.toString())
                    break;;
                case 'AtomicSwap':
                    thisTotal = BigInt("0x" + fees["AtomicSwapFee"]);
                    total = BigInt(total) + BigInt(thisTotal)
                    voutCost.push(thisTotal.toString())
                    break;;
                default:
                    throw "Could not inject get fee for undefined Vout object"
            }
        }
        total = BigInt(total) + BigInt("0x" + fees["MinTxFee"])
        total = total.toString()
        let feesInt = JSON.parse(JSON.stringify(fees));
        for (let i = 0; i < Object.keys(feesInt); i++) {
            feesInt[Object.keys(feesInt)[i]] = BigInt("0x" + feesInt[Object.keys(feesInt)[i]]);
        }
        return {
            "baseFees": feesInt,
            "totalFees": total,
            "costByVoutIdx": voutCost
        }
    }

    /**
     * Create transaction from generated Vin and Vout
     */
    async _createTx() {
        try {
            let tx = this.getTx()["Tx"]
            delete tx["Fee"]
            let injected = await TxHasher.TxHasher(JSON.stringify(tx))
            let Tx = { "Tx": JSON.parse(injected) }
            await this._signTx(Tx)
        } catch (ex) {
            throw new Error("Tx.createTx: " + String(ex));
        }
    }

    /**
     * Sign required messages for signature fields
     */
    async _signTx(Tx) {
        try {
            let tx = JSON.parse(JSON.stringify(Tx));
            for (let i = 0; i < tx["Tx"]["Vin"].length; i++) {
                let txIn = JSON.parse(JSON.stringify(tx["Tx"]["Vin"][i]))
                let consumedHash = txIn["TXInLinker"]["TXInPreImage"]["ConsumedTxHash"];
                let consumedIdx = txIn["TXInLinker"]["TXInPreImage"]["ConsumedTxIdx"] ? txIn["TXInLinker"]["TXInPreImage"]["ConsumedTxIdx"] : "0";
                let txInObj;
                for (let j = 0; j < this.txInOwners.length; j++) {
                    if (String(this.txInOwners[j]["txHash"]) === String(consumedHash) && String(this.txInOwners[j]["txOutIdx"]) == String(consumedIdx)) {
                        txInObj = this.txInOwners[j];
                        break;
                    }
                }
                if (!txInObj) {
                    throw "TxIn owner could not be found"
                }
                let ownerAccount = await this.Wallet.Account.getAccount(txInObj["address"])
                let signed = await ownerAccount["MultiSigner"].sign("0x" + txIn["Signature"]);
                let signature;
                if (txInObj.isDataStore) {
                    signature = await utils.prefixSVACurve(3, ownerAccount["MultiSigner"]["curve"], signed);
                } else {
                    signature = await utils.prefixSVACurve(1, ownerAccount["MultiSigner"]["curve"], signed);
                }
                txIn["Signature"] = signature;
                this.Vin[i] = txIn;
            }
            for (let i = 0; i < tx["Tx"]["Vout"].length; i++) {
                let txOut = JSON.parse(JSON.stringify(tx["Tx"]["Vout"][i]))
                if (txOut["DataStore"]) {
                    let owner = await utils.extractOwner(txOut["DataStore"]["DSLinker"]["DSPreImage"]["Owner"])
                    let ownerAccount = await this.Wallet.Account.getAccount(owner[2]);
                    let signed = await ownerAccount["MultiSigner"].sign("0x" + txOut["DataStore"]["Signature"]);
                    let signature = await utils.prefixSVACurve(3, ownerAccount["MultiSigner"]["curve"], signed);
                    txOut["DataStore"]["Signature"] = signature;
                }
                this.Vout[i] = txOut;
            }
        }
        catch (ex) {
            throw new Error("Tx.sign: " + String(ex));
        }
    }
}
module.exports = Tx;