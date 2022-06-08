const TxHasher = require('../GoWrappers/TxHasher.js');
const MultiSig = require("../Signers/MultiSig.js")
const utils = require('../Util/Tx.js');

/**
 * Transaction object creation
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {Array} Vin - Vin
 * @property {Array} Vout - Vout
 * @property {number} Fee - Fee
 * @property {Array} txInOwners - Owners
 */
class Tx {
    /**
     * Creates an instance of Tx.
     * @param {Object} Wallet - Circular wallet reference to use internally of Account class
     */
    constructor(Wallet) {
        this.Wallet = Wallet;

        this.Vin = [];
        this.Vout = [];
        this.Fee = "0";

        this.txInOwners = [];
    }

    /**
     * Get transaction object with Vin and Vout
     * @returns {RpcTxObject} Tx 
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
     * Import a finalized transaction
     * @param {RpcTxObject} tx - The Tx Object from the RPC
     */
    async importTransaction(tx) {
        try {
            this.Vin = tx["Tx"]["Vin"];
            this.Vout = tx["Tx"]["Vout"];
            this.Fee = tx["Tx"]["Fee"];
        }
        catch (ex) {
            throw new Error("Tx.importTransaction\r\n" + String(ex));
        }
    }


    /**
     * Import a transaction preSigned
     * @param {RpcTxObject} tx - The Tx Object from the RPC 
     * @throws RPC server must be set to fetch Vin data
     */
    async importRawTransaction(tx) {
        try {
            if (!this.Wallet.Rpc.rpcServer) {
                throw "RPC server must be set to fetch Vin data"
            }
            this.Vin = tx["Tx"]["Vin"];
            this.Vout = tx["Tx"]["Vout"];
            this.Fee = tx["Tx"]["Fee"];
            for (let i = 0; i < tx["Tx"]["Vin"].length; i++) {
                let cTx = await this.Wallet.Rpc.getMinedTransaction(tx["Tx"]["Vin"][i]["TXInLinker"]["TXInPreImage"]["ConsumedTxHash"])
                let isValueStore, address;
                if (cTx["Tx"]["Vout"][parseInt(tx["Tx"]["Vin"][i]["TXInLinker"]["TXInPreImage"]["ConsumedTxIdx"])]["ValueStore"]) {
                    isValueStore = true;
                    let owner = cTx["Tx"]["Vout"][parseInt(tx["Tx"]["Vin"][i]["TXInLinker"]["TXInPreImage"]["ConsumedTxIdx"])]["ValueStore"]["VSPreImage"]["Owner"];
                    address = owner[2]
                }
                else {
                    let owner = cTx["Tx"]["Vout"][parseInt(tx["Tx"]["Vin"][i]["TXInLinker"]["TXInPreImage"]["ConsumedTxIdx"])]["DataStore"]["DSLinker"]["DSPreImage"]["Owner"];
                    address = owner[2]
                }
                this.txInOwners.push({
                    "address": address,
                    "txOutIdx": isValueStore ? (
                        tx["Tx"]["Vin"][i]["VSPreImage"]["TXOutIdx"] ?
                            tx["Tx"]["Vin"][i]["VSPreImage"]["TXOutIdx"] :
                            0
                    ) :
                        (
                            tx["Tx"]["Vin"][i]["DSLinker"]["DSPreImage"]["TXOutIdx"] ?
                                tx["Tx"]["Vin"][i]["DSLinker"]["DSPreImage"]["TXOutIdx"] :
                                0
                        ),
                    "txHash": tx["Tx"]["Vin"][i]["TXInLinker"]["TXInPreImage"]["ConsumedTxHash"],
                    "isDataStore": isValueStore
                });
            }
        }
        catch (ex) {
            throw new Error("Tx.importRawTransaction\r\n" + String(ex));
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
     * @returns {Object} TxHash, TXInPreImage
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
     * @returns {Object} ChainID, ConsumedTxIdx, ConsumedTxHash
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
     * @param {number} fee
     * @returns {Object} Vout
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
     * @param {number} fee
     * @returns {Object} 
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
     * @param {number} fee
     * @returns {Object} Vout
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
     * @param {number} fee
     * @returns {Object} TxHash, DSPreImage
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
     * @param {number} fee
     * @returns {Object} DSPreImage
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
     * @param {number} fee
     * @returns {Object} Vout
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
     * @param {number} fee
     * @returns {Object} ASPreImage
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
     * @throws Cannot estimate fees without RPC
     * @throws Could not inject get fee for undefined Vout object
     * @returns {Object} Fee Estimates
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
                case 'ValueStore': {
                    thisTotal = BigInt("0x" + fees["ValueStoreFee"]);
                    total = BigInt(total) + BigInt(thisTotal)
                    voutCost.push(thisTotal.toString())
                    break;
                }
                case 'DataStore': {
                    let rawData = this.Vout[i]["DataStore"]["DSLinker"]["DSPreImage"]["RawData"]
                    let dataSize = BigInt(Buffer.from(rawData, "hex").length)
                    let dsEpochs = await utils.calculateNumEpochs(dataSize, BigInt("0x" + this.Vout[i]["DataStore"]["DSLinker"]["DSPreImage"]["Deposit"]))
                    thisTotal = await utils.calculateFee(BigInt("0x" + fees["DataStoreFee"]), BigInt(dsEpochs))
                    thisTotal = BigInt(thisTotal) + BigInt(BigInt("0x" + this.Vout[i]["DataStore"]["DSLinker"]["DSPreImage"]["Deposit"]));
                    let owner = await utils.extractOwner(this.Vout[i]["DataStore"]["DSLinker"]["DSPreImage"]["Owner"])
                    let DS = await this.Wallet.Rpc.getDataStoreByIndex(owner[2], owner[1], this.Vout[i]["DataStore"]["DSLinker"]["DSPreImage"]["Index"]);
                    if (DS && DS["DSLinker"]["DSPreImage"]["Index"] == this.Vout[i]["DataStore"]["DSLinker"]["DSPreImage"]["Index"]) {
                        let reward = await utils.remainingDeposit(DS, this.Vout[i]["DataStore"]["DSLinker"]["DSPreImage"]["IssuedAt"]);
                        if (reward) {
                            thisTotal = BigInt(thisTotal) - BigInt(reward);
                        }
                    }
                    total = BigInt(total) + BigInt(thisTotal)
                    voutCost.push(thisTotal.toString())
                    break;
                }
                case 'AtomicSwap': {
                    thisTotal = BigInt("0x" + fees["AtomicSwapFee"]);
                    total = BigInt(total) + BigInt(thisTotal)
                    voutCost.push(thisTotal.toString())
                    break;
                }
                default: {
                    throw "Could not inject get fee for undefined Vout object"
                }
            }
        }
        total = BigInt(total) + BigInt("0x" + fees["MinTxFee"])
        total = total.toString()
        let feesInt = JSON.parse(JSON.stringify(fees));
        for (let i = 0; i < Object.keys(feesInt).length; i++) {
            feesInt[Object.keys(feesInt)[i]] = BigInt("0x" + feesInt[Object.keys(feesInt)[i]]);
        }
        return {
            "baseFees": feesInt,
            "totalFees": total,
            "costByVoutIdx": voutCost
        }
    }

    /**
     * Hash the transaction and return it with the TxHash and signature (unsigned) fields filled 
     * @returns {RpcTxObject} Tx 
     */
    async createRawTx() {
        try {
            let tx = this.getTx()["Tx"]
            let injected = await TxHasher.TxHasher(JSON.stringify(tx))
            let Tx = JSON.parse(injected)
            this.Vin = Tx["Vin"]
            this.Vout = Tx["Vout"]
            return this.getTx();
        } catch (ex) {
            throw new Error("Tx.getPreSignedTx\r\n" + String(ex));
        }
    }

    /**
     * return the signature fields of a transaction
     * @returns {Object} Vin, Vout
     */
    async getSignatures() {
        try {
            let vinSignatures = [];
            let voutSignatures = []
            let tx = this.getTx()
            let vin = tx["Tx"]["Vin"]
            let vout = tx["Tx"]["Vout"]
            for (let l = 0; l < vin.length; l++) {
                let sign = vin[l]["Signature"]
                vinSignatures.push(sign)
            }
            for (let i = 0; i < vout.length; i++) {
                if (!vout[i]["DataStore"]) {
                    continue;
                }
                let sign = vout[i]["DataStore"]["Signature"];
                voutSignatures.push(sign)
            }
            return { "Vin": vinSignatures, "Vout": voutSignatures };
        }
        catch (ex) {
            throw new Error("Tx.getSignatures\r\n" + String(ex));
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
            throw new Error("Tx.createTx\r\n" + String(ex));
        }
    }

    /**
     * Sign required messages for signature fields
     * @throws TxIn owner could not be found
     * @param {RpcTxObject} Tx - The Tx Object from the RPC
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
                let signed = await ownerAccount.signer.sign("0x" + txIn["Signature"]);
                let signature;
                if (txInObj.isDataStore) {
                    signature = await utils.prefixSVACurve(3, ownerAccount["curve"], signed);
                } else {
                    signature = await utils.prefixSVACurve(1, ownerAccount["curve"], signed);
                }
                txIn["Signature"] = signature;
                this.Vin[i] = txIn;
            }
            for (let i = 0; i < tx["Tx"]["Vout"].length; i++) {
                let txOut = JSON.parse(JSON.stringify(tx["Tx"]["Vout"][i]))
                if (txOut["DataStore"]) {
                    let owner = await utils.extractOwner(txOut["DataStore"]["DSLinker"]["DSPreImage"]["Owner"])
                    let ownerAccount = await this.Wallet.Account.getAccount(owner[2]);
                    let signed = await ownerAccount.signer.sign("0x" + txOut["DataStore"]["Signature"]);
                    let signature = await utils.prefixSVACurve(3, ownerAccount["curve"], signed);
                    txOut["DataStore"]["Signature"] = signature;
                }
                this.Vout[i] = txOut;
            }
        }
        catch (ex) {
            throw new Error("Tx.sign\r\n" + String(ex));
        }
    }

    /**
     * Aggreate the signatures from multiple signers and inject them into the transaction
     * [ [txidx_0_signature, txidx_1_signature] signer1 , txidx_0_signature, txidx_1_signature] signer2 ] vinSignatures
     * [ [txidx_0_signature, txidx_1_signature] signer1 , txidx_0_signature, txidx_1_signature] signer2 ] voutSignatures
     * @param {Array<hex>} vinSignatures - Array<hex> 
     * @param {Array<hex>} voutSignatures - Array<hex>
     * @throws TxIn owner could not be found
     * @throws Missing signature in Vin
     * @throws Missing signature in Vout
     */
    async injectSignaturesAggregate(vinSignatures, voutSignatures) {
        try {
            let Tx = this.getTx()
            let multiSig = new MultiSig();
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
                let idxSig = []
                for (let j = 0; j < vinSignatures.length; j++) {
                    if (!vinSignatures[j] || !vinSignatures[j][i]) {
                        throw "Missing signature in Vin"
                    }
                    idxSig.push(vinSignatures[j][i])
                }
                let signed = await multiSig.aggregateSignatures(idxSig)
                let signature;
                if (txInObj.isDataStore) {
                    signature = await utils.prefixSVACurve(3, 2, signed);
                } else {
                    signature = await utils.prefixSVACurve(1, 2, signed);
                }
                txIn["Signature"] = signature;
                this.Vin[i] = txIn;
            }
            for (let i = 0; i < tx["Tx"]["Vout"].length; i++) {
                let txOut = JSON.parse(JSON.stringify(tx["Tx"]["Vout"][i]))
                if (txOut["DataStore"]) {
                    let idxSig = []
                    for (let j = 0; j < voutSignatures.length; j++) {
                        if (!voutSignatures[j] || !voutSignatures[j][i]) {
                            throw "Missing signature in Vout"
                        }
                        idxSig.push(voutSignatures[j][i])
                    }
                    let signed = await multiSig.aggregateSignatures(idxSig)
                    let signature = await utils.prefixSVACurve(3, 2, signed);
                    txOut["DataStore"]["Signature"] = signature;
                }
                this.Vout[i] = txOut;
            }
        }
        catch (ex) {
            throw new Error("Tx.injectSignaturesAggregate\r\n" + String(ex));
        }
    }

    /**
     * Inject the signature fields with the signed messages
     * [ txidx_0_signature, txidx_1_signature] ] vinSignatures
     * [ txidx_0_signature, txidx_1_signature] ] voutSignatures 
     * @param {Array<hex>} vinSignatures 
     * @param {Array<hex>} voutSignatures 
     * @throws TxIn owner could not be found
     */
    async injectSignatures(vinSignatures, voutSignatures) {
        try {
            let Tx = this.getTx()
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
                let signed = vinSignatures[i];
                let signature;
                if (txInObj.isDataStore) {
                    signature = await utils.prefixSVACurve(3, ownerAccount["curve"], signed);
                } else {
                    signature = await utils.prefixSVACurve(1, ownerAccount["curve"], signed);
                }
                txIn["Signature"] = signature;
                this.Vin[i] = txIn;
            }
            for (let i = 0; i < tx["Tx"]["Vout"].length; i++) {
                let txOut = JSON.parse(JSON.stringify(tx["Tx"]["Vout"][i]))
                if (txOut["DataStore"]) {
                    let owner = await utils.extractOwner(txOut["DataStore"]["DSLinker"]["DSPreImage"]["Owner"])
                    let ownerAccount = await this.Wallet.Account.getAccount(owner[2]);
                    let signed = voutSignatures[i]
                    let signature = await utils.prefixSVACurve(3, ownerAccount["curve"], signed);
                    txOut["DataStore"]["Signature"] = signature;
                }
                this.Vout[i] = txOut;
            }
        }
        catch (ex) {
            throw new Error("Tx.injectSignatures\r\n" + String(ex));
        }
    }
}
module.exports = Tx;