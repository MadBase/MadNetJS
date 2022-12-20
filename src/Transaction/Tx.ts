import TxHasher from '../GoWrappers/TxHasher';
import MultiSig from '../Signers/MultiSig';
import utils from '../Util/Tx';

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
     * @returns {RpcTxObject} Transaction object
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
            this.Vin = tx.Tx.Vin;
            this.Vout = tx.Tx.Vout;
            this.Fee = tx.Tx.Fee;
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
                throw "RPC server must be set to fetch Vin data";
            }
            this.Vin = tx.Tx.Vin;
            this.Vout = tx.Tx.Vout;
            this.Fee = tx.Tx.Fee;
            for (let i = 0; i < tx.Tx.Vin.length; i++) {
                const cTx = await this.Wallet.Rpc.getMinedTransaction(tx.Tx.Vin[i].TXInLinker.TXInPreImage.ConsumedTxHash)
                let isValueStore, address;
                if (cTx.Tx.Vout[parseInt(tx.Tx.Vin[i].TXInLinker.TXInPreImage.ConsumedTxIdx)].ValueStore) {
                    isValueStore = true;
                    const owner = cTx.Tx.Vout[parseInt(tx.Tx.Vin[i].TXInLinker.TXInPreImage.ConsumedTxIdx)].ValueStore.VSPreImage.Owner;
                    address = owner[2];
                }
                else {
                    const owner = cTx.Tx.Vout[parseInt(tx.Tx.Vin[i].TXInLinker.TXInPreImage.ConsumedTxIdx)].DataStore.DSLinker.DSPreImage.Owner;
                    address = owner[2];
                }
                this.txInOwners.push({
                    "address": address,
                    "txOutIdx": isValueStore ? (
                        tx.Tx.Vin[i].VSPreImage.TXOutIdx ?
                            tx.Tx.Vin[i].VSPreImage.TXOutIdx :
                            0
                    ) :
                        (
                            txTx.Vin[i].DSLinker.DSPreImage.TXOutIdx ?
                                tx.Tx.Vin[i].DSLinker.DSPreImage.TXOutIdx :
                                0
                        ),
                    "txHash": tx.Tx.Vin[i].TXInLinker.TXInPreImage.ConsumedTxHash,
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
     * @returns {Object} Object containing TxHash and TXInPreImage
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
     * @returns {Object} Object containing ChainID, ConsumedTxIdx and ConsumedTxHash
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
     * @returns {Object} Latest Vout pushed to Vout[]
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
     * @returns {Object} VSPreImage object cotaining ChainID, Value, TXOutIdx, Owner and Fee
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
     * @returns {Object} Latest Vout pushed to Vout[]
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
     * @returns {Object} Object containing TxHash and DSPreImage
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
     * @returns {Object} DSPreImage Object cotaining ChainID, Index, IssuedAt, Deposit, RawData, TXOutIdx, Owner and Fee
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
     * Create ASPreImage
     * @param {number} value
     * @param {number} txOutIdx
     * @param {number} issuedAt
     * @param {number} exp
     * @param {hex} owner
     * @param {number} fee
     * @returns {Object} ASPreImage Object cotaining ChainID, Index, TXOutIdx, IssuedAt, Exp, Owner and Fee
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
            throw 'Cannot estimate fees without RPC';
        }
        const fees = await this.Wallet.Rpc.getFees();
        let total = BigInt(0);
        let thisTotal = BigInt(0);
        let voutCost = [];

        for (let i = 0; i < this.Vout.length; i++) {
            switch (Object.keys(this.Vout[i])[0]) {
                case 'ValueStore': {
                    thisTotal = BigInt("0x" + fees.ValueStoreFee);
                    total = BigInt(total) + BigInt(thisTotal);
                    voutCost.push(thisTotal.toString());
                    break;
                }
                case 'DataStore': {
                    const rawData = this.Vout[i].DataStore.DSLinker.DSPreImage.RawData;
                    const dataSize = BigInt(Buffer.from(rawData, "hex").length);
                    const dsEpochs = await utils.calculateNumEpochs(dataSize, BigInt("0x" + this.Vout[i].DataStore.DSLinker.DSPreImage.Deposit))
                    thisTotal = await utils.calculateFee(BigInt("0x" + fees.DataStoreFee), BigInt(dsEpochs));
                    thisTotal = BigInt(thisTotal) + BigInt(BigInt("0x" + this.Vout[i].DataStore.DSLinker.DSPreImage.Deposit));
                    const owner = await utils.extractOwner(this.Vout[i].DataStore.DSLinker.DSPreImage.Owner);
                    const DS = await this.Wallet.Rpc.getDataStoreByIndex(owner[2], owner[1], this.Vout[i].DataStore.DSLinker.DSPreImage.Index);
                    if (DS && DS.DSLinker.DSPreImage.Index == this.Vout[i].DataStore.DSLinker.DSPreImage.Index) {
                        const reward = await utils.remainingDeposit(DS, this.Vout[i].DataStore.DSLinker.DSPreImage.IssuedAt);
                        if (reward) {
                            thisTotal = BigInt(thisTotal) - BigInt(reward);
                        }
                    }
                    total = BigInt(total) + BigInt(thisTotal);
                    voutCost.push(thisTotal.toString());
                    break;
                }
                default: {
                    throw "Could not inject get fee for undefined Vout object";
                }
            }
        }
        total = BigInt(total) + BigInt("0x" + fees.MinTxFee);
        total = total.toString();
        const feesInt = JSON.parse(JSON.stringify(fees));
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
     * @returns {RpcTxObject} Transaction Object
     */
    async createRawTx() {
        try {
            const tx = this.getTx().Tx;
            const injected = await TxHasher.TxHasher(JSON.stringify(tx));
            const Tx = JSON.parse(injected);
            this.Vin = Tx.Vin;
            this.Vout = Tx.Vout;
            return this.getTx();
        } catch (ex) {
            throw new Error("Tx.getPreSignedTx\r\n" + String(ex));
        }
    }

    /**
     * Get signature fields of a transaction
     * @returns {Object} Object containing Vin and Vout
     */
    async getSignatures() {
        try {
            let vinSignatures = [];
            let voutSignatures = [];
            const tx = this.getTx();
            const vin = tx.Tx.Vin;
            const vout = tx.Tx.Vout;
            for (let l = 0; l < vin.length; l++) {
                const sign = vin[l].Signature;
                vinSignatures.push(sign);
            }
            for (let i = 0; i < vout.length; i++) {
                if (!vout[i].DataStore) {
                    continue;
                }
                let sign = vout[i].DataStore.Signature;
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
            const tx = this.getTx().Tx;
            delete tx.Fee;
            const injected = await TxHasher.TxHasher(JSON.stringify(tx));
            const Tx = { "Tx": JSON.parse(injected) };
            await this._signTx(Tx);
        } catch (ex) {
            throw new Error("Tx.createTx\r\n" + String(ex));
        }
    }

    /**
     * Sign required messages for signature fields
     * @param {RpcTxObject} Tx - The Tx Object from the RPC
     * @throws TxIn owner could not be found
     */
    async _signTx(Tx) {
        try {
            const tx = JSON.parse(JSON.stringify(Tx));
            for (let i = 0; i < tx.Tx.Vin.length; i++) {
                const txIn = JSON.parse(JSON.stringify(tx.Tx.Vin[i]))
                const consumedHash = txIn.TXInLinker.TXInPreImage.ConsumedTxHash;
                const consumedIdx = txIn.TXInLinker.TXInPreImage.ConsumedTxIdx ? txIn.TXInLinker.TXInPreImage.ConsumedTxIdx : "0";
                let txInObj;
                for (let j = 0; j < this.txInOwners.length; j++) {
                    if (String(this.txInOwners[j].txHash) === String(consumedHash) && String(this.txInOwners[j].txOutIdx) == String(consumedIdx)) {
                        txInObj = this.txInOwners[j];
                        break;
                    }
                }
                if (!txInObj) {
                    throw "TxIn owner could not be found";
                }
                const ownerAccount = await this.Wallet.Account.getAccount(txInObj.address)
                const signed = await ownerAccount.signer.sign("0x" + txIn.Signature);
                let signature;
                if (txInObj.isDataStore) {
                    signature = await utils.prefixSVACurve(3, ownerAccount.curve, signed);
                } else {
                    signature = await utils.prefixSVACurve(1, ownerAccount.curve, signed);
                }
                txIn.Signature = signature;
                this.Vin[i] = txIn;
            }
            for (let i = 0; i < tx.Tx.Vout.length; i++) {
                const txOut = JSON.parse(JSON.stringify(tx.Tx.Vout[i]));
                if (txOut.DataStore) {
                    const owner = await utils.extractOwner(txOut.DataStore.DSLinker.DSPreImage.Owner)
                    const ownerAccount = await this.Wallet.Account.getAccount(owner[2]);
                    const signed = await ownerAccount.signer.sign("0x" + txOut.DataStore.Signature);
                    const signature = await utils.prefixSVACurve(3, ownerAccount.curve, signed);
                    txOut.DataStore.Signature = signature;
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
            const Tx = this.getTx();
            const multiSig = new MultiSig();
            const tx = JSON.parse(JSON.stringify(Tx));
            for (let i = 0; i < tx.Tx.Vin.length; i++) {
                const txIn = JSON.parse(JSON.stringify(tx.Tx.Vin[i]))
                const consumedHash = txIn.TXInLinker.TXInPreImage.ConsumedTxHash;
                const consumedIdx = txIn.TXInLinker.TXInPreImage.ConsumedTxIdx ? txIn.TXInLinker.TXInPreImage.ConsumedTxIdx : "0";
                let txInObj;
                for (let j = 0; j < this.txInOwners.length; j++) {
                    if (String(this.txInOwners[j].txHash) === String(consumedHash) && String(this.txInOwners[j].txOutIdx) == String(consumedIdx)) {
                        txInObj = this.txInOwners[j];
                        break;
                    }
                }
                if (!txInObj) {
                    throw "TxIn owner could not be found";
                }
                let idxSig = []
                for (let j = 0; j < vinSignatures.length; j++) {
                    if (!vinSignatures[j] || !vinSignatures[j][i]) {
                        throw "Missing signature in Vin";
                    }
                    idxSig.push(vinSignatures[j][i]);
                }
                const signed = await multiSig.aggregateSignatures(idxSig);
                let signature;
                if (txInObj.isDataStore) {
                    signature = await utils.prefixSVACurve(3, 2, signed);
                } else {
                    signature = await utils.prefixSVACurve(1, 2, signed);
                }
                txIn.Signature = signature;
                this.Vin[i] = txIn;
            }
            for (let i = 0; i < tx.Tx.Vout.length; i++) {
                let txOut = JSON.parse(JSON.stringify(tx.Tx.Vout[i]));
                if (txOut.DataStore) {
                    let idxSig = []
                    for (let j = 0; j < voutSignatures.length; j++) {
                        if (!voutSignatures[j] || !voutSignatures[j][i]) {
                            throw "Missing signature in Vout";
                        }
                        idxSig.push(voutSignatures[j][i]);
                    }
                    const signed = await multiSig.aggregateSignatures(idxSig);
                    const signature = await utils.prefixSVACurve(3, 2, signed);
                    txOut.DataStore.Signature = signature;
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
            const Tx = this.getTx()
            const tx = JSON.parse(JSON.stringify(Tx));
            for (let i = 0; i < tx.Tx.Vin.length; i++) {
                const txIn = JSON.parse(JSON.stringify(tx.Tx.Vin[i]));
                const consumedHash = txIn.TXInLinker.TXInPreImage.ConsumedTxHash;
                const consumedIdx = txIn.TXInLinker.TXInPreImage.ConsumedTxIdx ? txIn.TXInLinker.TXInPreImage.ConsumedTxIdx : "0";
                let txInObj;
                for (let j = 0; j < this.txInOwners.length; j++) {
                    if (String(this.txInOwners[j].txHash) === String(consumedHash) && String(this.txInOwners[j].txOutIdx) == String(consumedIdx)) {
                        txInObj = this.txInOwners[j];
                        break;
                    }
                }
                if (!txInObj) {
                    throw "TxIn owner could not be found";
                }
                const ownerAccount = await this.Wallet.Account.getAccount(txInObj.address)
                const signed = vinSignatures[i];
                let signature;
                if (txInObj.isDataStore) {
                    signature = await utils.prefixSVACurve(3, ownerAccount.curve, signed);
                } else {
                    signature = await utils.prefixSVACurve(1, ownerAccount.curve, signed);
                }
                txIn.Signature = signature;
                this.Vin[i] = txIn;
            }
            for (let i = 0; i < tx.Tx.Vout.length; i++) {
                const txOut = JSON.parse(JSON.stringify(tx.Tx.Vout[i]));
                if (txOut.DataStore) {
                    const owner = await utils.extractOwner(txOut.DataStore.DSLinker.DSPreImage.Owner);
                    const ownerAccount = await this.Wallet.Account.getAccount(owner[2]);
                    const signed = voutSignatures[i];
                    const signature = await utils.prefixSVACurve(3, ownerAccount.curve, signed);
                    txOut.DataStore.Signature = signature;
                }
                this.Vout[i] = txOut;
            }
        }
        catch (ex) {
            throw new Error("Tx.injectSignatures\r\n" + String(ex));
        }
    }
}
export default Tx;
