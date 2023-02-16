import TxHasher from "../GoWrappers/TxHasher";
import MultiSig from "../Signers/MultiSig";
import {
    AsPreImage,
    DSLinker,
    DsPreImage,
    FeeEstimates,
    Signature,
    TxInLinker,
    TxInOwner,
    TxInPreImage,
    Vin,
    Vout,
    VsPreImage,
    WalletType,
} from "../types/Types";
import {
    calculateNumEpochs,
    prefixSVACurve,
    extractOwner,
    calculateFee,
    remainingDeposit,
} from "../Util/Tx";

export interface RpcTxObject {
    vin: Vin[];
    vout: Vout[];
    fee: string;
}

/**
 * Transaction object creation
 * @class
 * @property {WalletType} wallet - Circular Wallet reference
 * @property {Vin} vin - Vin
 * @property {Vount} vout - Vout
 * @property {string} fee - Fee
 * @property {Array} txInOwners - Owners
 */
export default class Tx {
    wallet: WalletType;
    vin: Vin[];
    vout: Vout[];
    fee: string;
    txInOwners: TxInOwner[];

    /**
     * Creates an instance of Tx.
     * @param {WalletType} Wallet - Circular wallet reference to use internally of Account class
     */
    constructor(Wallet: WalletType) {
        this.wallet = Wallet;
        this.vin = [];
        this.vout = [];
        this.fee = "0";
        this.txInOwners = [];
    }

    /**
     * Get transaction object with Vin and Vout
     * @returns {RpcTxObject} Transaction object
     */
    getTx(): RpcTxObject {
        return {
            vin: this.vin,
            vout: this.vout,
            fee: this.fee,
        };
    }

    /**
     * Import a finalized transaction
     * @param {RpcTxObject} tx - The Tx Object from the RPC
     */
    async importTransaction(rpcTx: RpcTxObject) {
        try {
            this.vin = rpcTx.vin;
            this.vout = rpcTx.vout;
            this.fee = rpcTx.fee;
        } catch (ex) {
            throw new Error("Tx.importTransaction\r\n" + String(ex));
        }
    }

    /**
     * Import a transaction preSigned
     * @param {RpcTxObject} tx - The Tx Object from the RPC
     * @throws RPC server must be set to fetch Vin data
     */
    async importRawTransaction(rpcTx: RpcTxObject) {
        try {
            if (!this.wallet.rpc.rpcServer) {
                throw "RPC server must be set to fetch Vin data";
            }
            this.vin = rpcTx.vin;
            this.vout = rpcTx.vout;
            this.fee = rpcTx.fee;
            for (let i = 0; i < rpcTx.vin.length; i++) {
                const cTx = await this.wallet.rpc.getMinedTransaction(
                    rpcTx.vin[i].txInLinker.txInPreImage.consumedTxHash
                );
                let isValueStore, address;
                if (
                    cTx.Tx.vout[
                        parseInt(
                            rpcTx.vin[i].txInLinker.txInPreImage.consumedTxIdx
                        )
                    ].ValueStore
                ) {
                    isValueStore = true;
                    const owner =
                        cTx.Tx.vout[
                            parseInt(
                                rpcTx.vin[i].txInLinker.TXInPreImage
                                    .consumedTxIdx
                            )
                        ].valueStore.vsPreImage.owner;
                    address = owner[2];
                } else {
                    const owner =
                        cTx.Tx.vout[
                            parseInt(
                                rpcTx.vin[i].txInLinker.TXInPreImage
                                    .consumedTxIdx
                            )
                        ].dataStore.dsLinker.dsPreImage.owner;
                    address = owner[2];
                }
                this.txInOwners.push({
                    address: address,
                    txOutIdx: isValueStore
                        ? rpcTx.vin[i].vsPreImage.txOutIdx
                            ? rpcTx.vin[i].vsPreImage.txOutIdx
                            : 0
                        : rpcTx.vin[i].dsLinker.dsPreImage.txOutIdx
                        ? rpcTx.vin[i].dsLinker.dsPreImage.txOutIdx
                        : 0,
                    txHash: rpcTx.vin[i].txInLinker.txInPreImage.consumedTxHash,
                    isDataStore: isValueStore,
                });
            }
        } catch (ex) {
            throw new Error("Tx.importRawTransaction\r\n" + String(ex));
        }
    }

    /**
     * Create TxIn
     * @param {hex} consumedTxHash
     * @param {number} consumedTxIdx
     */
    TxIn(consumedTxHash: string, consumedTxIdx: number | string) {
        this.vin.push({
            signature: "C0FFEE",
            txInLinker: this.txInLinker(consumedTxHash, consumedTxIdx),
        });
    }

    /**
     * Create txInLinker
     * @param {hex} consumedTxHash
     * @param {number} consumedTxIdx
     * @returns {Object} Object containing TxHash and TXInPreImage
     */
    txInLinker(consumedTxHash, consumedTxIdx): TxInLinker {
        return {
            txHash: "C0FFEE",
            txInPreImage: this.TxInPreImage(consumedTxHash, consumedTxIdx),
        };
    }

    /**
     * Create TXInPreimage
     * @param {hex} consumedTxHash
     * @param {number} consumedTxIdx
     * @returns {Object} Object containing ChainID, ConsumedTxIdx and ConsumedTxHash
     */
    TxInPreImage(consumedTxHash, consumedTxIdx): TxInPreImage {
        return {
            chainID: this.wallet.chainId,
            consumedTxIdx: consumedTxIdx,
            consumedTxHash: consumedTxHash,
        };
    }

    /**
     * Create ValueStore
     * @param {number} value
     * @param {number} txOutIdx
     * @param {hex} owner
     * @param {number} fee
     * @returns {Vout} Latest Vout pushed to Vout[]
     */
    ValueStore(
        value: number,
        txOutIdx: number,
        owner: string,
        fee: number | string
    ): Vout {
        this.vout.push({
            valueStore: {
                txHash: "C0FFEE",
                vsPreImage: this.VsPreImage(value, txOutIdx, owner, fee),
            },
        });
        return this.vout[this.vout.length - 1];
    }

    /**
     * Create VsPreImage
     * @param {number} value
     * @param {number} txOutIdx
     * @param {hex} owner
     * @param {number} fee
     * @returns {VsPreImage} VsPreImage object containing ChainID, Value, TXOutIdx, Owner and Fee
     */
    VsPreImage(
        value: number,
        txOutIdx: number,
        owner: string,
        fee: number | string
    ): VsPreImage {
        return {
            chainID: this.wallet.chainId,
            value: value,
            txOutIdx: txOutIdx,
            owner: owner,
            fee: fee,
        };
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
     * @returns {Vout} Latest Vout pushed to Vout[]
     */
    DataStore(
        index: string,
        issuedAt: number,
        deposit: number,
        rawData: string,
        txOutIdx: number,
        owner: string,
        fee: number
    ): Vout {
        this.vout.push({
            dataStore: {
                signature: "C0FFEE",
                dsLinker: this.DSLinker(
                    index,
                    issuedAt,
                    deposit,
                    rawData,
                    txOutIdx,
                    owner,
                    fee
                ),
            },
        });
        return this.vout[this.vout.length - 1];
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
     * @returns {Object} Object containing TxHash and DsPreImage
     */
    DSLinker(
        index: string,
        issuedAt: number,
        deposit: number,
        rawData: string,
        txOutIdx: number,
        owner: string,
        fee: number
    ): DSLinker {
        return {
            txHash: "C0FFEE",
            dsPreImage: this.DsPreImage(
                index,
                issuedAt,
                deposit,
                rawData,
                txOutIdx,
                owner,
                fee
            ),
        };
    }

    /**
     * Create DsPreImage
     * @param {hex} index
     * @param {number} issuedAt
     * @param {number} deposit
     * @param {hex} rawData
     * @param {number} txOutIdx
     * @param {hex} owner
     * @param {number} fee
     * @returns {DsPreImage} DsPreImage Object containing ChainID, Index, IssuedAt, Deposit, RawData, TXOutIdx, Owner and Fee
     */
    DsPreImage(
        index: string,
        issuedAt: number,
        deposit: number,
        rawData: string,
        txOutIdx: number,
        owner: string,
        fee: number
    ): DsPreImage {
        return {
            chainID: this.wallet.chainId,
            index: index,
            issuedAt: issuedAt,
            deposit: deposit,
            rawData: rawData,
            txOutIdx: txOutIdx,
            owner: owner,
            fee: fee,
        };
    }

    /**
     * Create AsPreImage
     * @param {number} value
     * @param {number} txOutIdx
     * @param {number} issuedAt
     * @param {number} exp
     * @param {hex} owner
     * @param {number} fee
     * @returns {Object} AsPreImage Object containing ChainID, Index, TXOutIdx, IssuedAt, Exp, Owner and Fee
     */
    AsPreImage(
        value: number,
        txOutIdx: number,
        issuedAt: number,
        exp: number,
        owner: string,
        fee: number
    ): AsPreImage {
        return {
            chainID: this.wallet.chainId,
            value: value,
            txOutIdx: txOutIdx,
            issuedAt: issuedAt,
            exp: exp,
            owner: owner,
            fee: fee,
        };
    }

    /**
     * Create TxFee
     * @param {string} value
     */
    TxFee(value: string | number | bigint) {
        this.fee = value.toString();
    }

    /**
     * Get estimate of fees
     * @throws Cannot estimate fees without RPC
     * @throws Could not inject get fee for undefined Vout object
     * @returns {Object} Fee Estimates
     */
    async estimateFees(): Promise<FeeEstimates> {
        if (!this.wallet.rpc.rpcServer) {
            throw "Cannot estimate fees without RPC";
        }
        const fees = await this.wallet.rpc.getFees();
        let total = BigInt(0) as any;
        let thisTotal: any = BigInt(0);
        let voutCost = [];

        for (let i = 0; i < this.vout.length; i++) {
            switch (Object.keys(this.vout[i])[0]) {
                case "ValueStore": {
                    thisTotal = BigInt("0x" + fees.valueStoreFee);
                    total = BigInt(total) + BigInt(thisTotal);
                    voutCost.push(thisTotal.toString());
                    break;
                }
                case "DataStore": {
                    const rawData =
                        this.vout[i].dataStore.dsLinker.dsPreImage.RawData;
                    const dataSize = BigInt(Buffer.from(rawData, "hex").length);
                    const dsEpochs = await calculateNumEpochs(
                        dataSize,
                        BigInt(
                            "0x" +
                                this.vout[i].dataStore.dsLinker.DsPreImage
                                    .Deposit
                        )
                    );
                    thisTotal = await calculateFee(
                        BigInt("0x" + fees.dataStoreFee),
                        BigInt(dsEpochs)
                    );
                    thisTotal =
                        BigInt(thisTotal) +
                        BigInt(
                            BigInt(
                                "0x" +
                                    this.vout[i].dataStore.dsLinker.DsPreImage
                                        .Deposit
                            )
                        );
                    const owner = await extractOwner(
                        this.vout[i].dataStore.dsLinker.dsPreImage.owner
                    );
                    const DS = await this.wallet.rpc.getDataStoreByIndex(
                        owner[2],
                        owner[1],
                        this.vout[i].dataStore.dsLinker.dsPreImage.Index
                    );
                    if (
                        DS &&
                        DS.dsLinker.dsPreImage.Index ==
                            this.vout[i].dataStore.dsLinker.dsPreImage.Index
                    ) {
                        const reward = await remainingDeposit(
                            DS,
                            this.vout[i].dataStore.dsLinker.dsPreImage.IssuedAt
                        );
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
            feesInt[Object.keys(feesInt)[i]] = BigInt(
                "0x" + feesInt[Object.keys(feesInt)[i]]
            );
        }
        return {
            baseFees: feesInt,
            totalFees: total,
            costByVoutIdx: voutCost,
        };
    }

    /**
     * Hash the transaction and return it with the TxHash and signature (unsigned) fields filled
     * @returns {RpcTxObject} Transaction Object
     */
    async createRawTx(): Promise<RpcTxObject> {
        try {
            const tx = this.getTx();
            const injected = await TxHasher.TxHasher(JSON.stringify(tx));
            const Tx = JSON.parse(injected);

            this.vin = tx.vin;
            this.vout = tx.vout;

            return this.getTx();
        } catch (ex) {
            throw new Error("Tx.getPreSignedTx\r\n" + String(ex));
        }
    }

    /**
     * Get signature fields of a transaction
     * @returns {Object} Object containing Vin and Vout
     */
    async getSignatures(): Promise<Signature> {
        try {
            let vinSignatures = [];
            let voutSignatures = [];

            const tx = this.getTx();
            const vin = tx.vin;
            const vout = tx.vout;

            for (let l = 0; l < vin.length; l++) {
                const sign = vin[l].signature;
                vinSignatures.push(sign);
            }

            for (let i = 0; i < vout.length; i++) {
                if (!vout[i].dataStore) {
                    continue;
                }
                let sign = vout[i].dataStore.signature;
                voutSignatures.push(sign);
            }

            return { vin: vinSignatures, vout: voutSignatures };
        } catch (ex) {
            throw new Error("Tx.getSignatures\r\n" + String(ex));
        }
    }

    /**
     * Create transaction from generated Vin and Vout
     */
    async _createTx() {
        try {
            const tx = this.getTx();

            delete tx.fee;

            // BUG -- TxHasher failing with json cannot unmarshal
            const injected = await TxHasher.TxHasher(JSON.stringify(tx));
            const Tx = { Tx: JSON.parse(injected) };

            await this._signTx(Tx as any); // TODO Add proper type
        } catch (ex) {
            throw new Error("Tx.createTx\r\n" + String(ex));
        }
    }

    /**
     * Sign required messages for signature fields
     * @param {RpcTxObject} Tx - The Tx Object from the RPC
     * @throws TxIn owner could not be found
     */
    async _signTx(rpcTx: RpcTxObject) {
        try {
            const tx = JSON.parse(JSON.stringify(Tx));
            for (let i = 0; i < rpcTx.vin.length; i++) {
                const txIn = JSON.parse(JSON.stringify(rpcTx.vin[i]));
                const consumedHash =
                    txIn.txInLinker.txInPreImage.consumedTxHash;
                const consumedIdx = txIn.txInLinker.txInPreImage.consumedTxIdx
                    ? txIn.txInLinker.txInPreImage.consumedTxIdx
                    : "0";
                let txInObj;
                for (let j = 0; j < this.txInOwners.length; j++) {
                    if (
                        String(this.txInOwners[j].txHash) ===
                            String(consumedHash) &&
                        String(this.txInOwners[j].txOutIdx) ==
                            String(consumedIdx)
                    ) {
                        txInObj = this.txInOwners[j];
                        break;
                    }
                }
                if (!txInObj) {
                    throw "TxIn owner could not be found";
                }
                const ownerAccount = await this.wallet.account.getAccount(
                    txInObj.address
                );
                const signed = await ownerAccount.signer.sign(
                    "0x" + txIn.Signature
                );
                let signature;
                if (txInObj.isDataStore) {
                    signature = await prefixSVACurve(
                        3,
                        ownerAccount.curve,
                        signed
                    );
                } else {
                    signature = await prefixSVACurve(
                        1,
                        ownerAccount.curve,
                        signed
                    );
                }
                txIn.Signature = signature;
                this.vin[i] = txIn;
            }
            for (let i = 0; i < rpcTx.vout.length; i++) {
                const txOut = JSON.parse(JSON.stringify(rpcTx.vout[i]));
                if (txOut.dataStore) {
                    const owner = await extractOwner(
                        txOut.dataStore.dsLinker.dsPreImage.owner
                    );
                    const ownerAccount = await this.wallet.account.getAccount(
                        owner[2]
                    );
                    const signed = await ownerAccount.signer.sign(
                        "0x" + txOut.dataStore.Signature
                    );
                    const signature = await prefixSVACurve(
                        3,
                        ownerAccount.curve,
                        signed
                    );
                    txOut.dataStore.signature = signature;
                }
                this.vout[i] = txOut;
            }
        } catch (ex) {
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
    async injectSignaturesAggregate(
        vinSignatures: string[],
        voutSignatures: string[]
    ) {
        try {
            const transaction = this.getTx();
            const multiSig = new MultiSig();
            const parsedTransaction = JSON.parse(JSON.stringify(transaction));

            for (let i = 0; i < parsedTransaction.vin.length; i++) {
                const txIn = JSON.parse(
                    JSON.stringify(parsedTransaction.vin[i])
                );
                const consumedHash =
                    txIn.txInLinker.txInPreImage.consumedTxHash;
                const consumedIdx = txIn.txInLinker.txInPreImage.consumedTxIdx
                    ? txIn.txInLinker.txInPreImage.consumedTxIdx
                    : "0";

                let txInObj;

                for (let j = 0; j < this.txInOwners.length; j++) {
                    if (
                        String(this.txInOwners[j].txHash) ===
                            String(consumedHash) &&
                        String(this.txInOwners[j].txOutIdx) ==
                            String(consumedIdx)
                    ) {
                        txInObj = this.txInOwners[j];
                        break;
                    }
                }

                if (!txInObj) throw "TxIn owner could not be found";

                let idxSig = [];

                for (let j = 0; j < vinSignatures.length; j++) {
                    if (!vinSignatures[j] || !vinSignatures[j][i]) {
                        throw "Missing signature in Vin";
                    }
                    idxSig.push(vinSignatures[j][i]);
                }

                const signed = await multiSig.aggregateSignatures(idxSig);

                let signature;

                if (txInObj.isDataStore) {
                    signature = await prefixSVACurve(3, 2, signed);
                } else {
                    signature = await prefixSVACurve(1, 2, signed);
                }

                txIn.signature = signature;
                this.vin[i] = txIn;
            }
            for (let i = 0; i < parsedTransaction.vout.length; i++) {
                let txOut = JSON.parse(
                    JSON.stringify(parsedTransaction.vout[i])
                );

                if (txOut.dataStore) {
                    let idxSig = [];

                    for (let j = 0; j < voutSignatures.length; j++) {
                        if (!voutSignatures[j] || !voutSignatures[j][i]) {
                            throw "Missing signature in Vout";
                        }

                        idxSig.push(voutSignatures[j][i]);
                    }

                    const signed = await multiSig.aggregateSignatures(idxSig);
                    const signature = await prefixSVACurve(3, 2, signed);

                    txOut.dataStore.signature = signature;
                }

                this.vout[i] = txOut;
            }
        } catch (ex) {
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
    async injectSignatures(vinSignatures: string[], voutSignatures: string[]) {
        try {
            const transaction = this.getTx();
            const parsedTransaction = JSON.parse(JSON.stringify(transaction));

            for (let i = 0; i < parsedTransaction.vin.length; i++) {
                const txIn = JSON.parse(
                    JSON.stringify(parsedTransaction.vin[i])
                );
                const consumedHash =
                    txIn.txInLinker.txInPreImage.consumedTxHash;
                const consumedIdx = txIn.txInLinker.txInPreImage.consumedTxIdx
                    ? txIn.txInLinker.txInPreImage.consumedTxIdx
                    : "0";

                let txInObj;

                for (let j = 0; j < this.txInOwners.length; j++) {
                    if (
                        String(this.txInOwners[j].txHash) ===
                            String(consumedHash) &&
                        String(this.txInOwners[j].txOutIdx) ==
                            String(consumedIdx)
                    ) {
                        txInObj = this.txInOwners[j];
                        break;
                    }
                }

                if (!txInObj) throw "TxIn owner could not be found";

                const ownerAccount = await this.wallet.account.getAccount(
                    txInObj.address
                );

                const signed = vinSignatures[i];

                let signature;

                if (txInObj.isDataStore) {
                    signature = await prefixSVACurve(
                        3,
                        ownerAccount.curve,
                        signed
                    );
                } else {
                    signature = await prefixSVACurve(
                        1,
                        ownerAccount.curve,
                        signed
                    );
                }

                txIn.Signature = signature;
                this.vin[i] = txIn;
            }
            for (let i = 0; i < parsedTransaction.vout.length; i++) {
                const txOut = JSON.parse(
                    JSON.stringify(parsedTransaction.vout[i])
                );

                if (txOut.dataStore) {
                    const owner = await extractOwner(
                        txOut.dataStore.dsLinker.dsPreImage.owner
                    );
                    const ownerAccount = await this.wallet.account.getAccount(
                        owner[2]
                    );
                    const signed = voutSignatures[i];
                    const signature = await prefixSVACurve(
                        3,
                        ownerAccount.curve,
                        signed
                    );

                    txOut.dataStore.signature = signature;
                }

                this.vout[i] = txOut;
            }
        } catch (ex) {
            throw new Error("Tx.injectSignatures\r\n" + String(ex));
        }
    }
}
