import Tx, { RpcTxObject } from "./Transaction/Tx";
import * as Constants from "./Config/Constants";
import { DataStore, RpcFee, Utxo, ValueStore, WalletType } from "./types/Types";

export interface PolledTxObject {
    tx: Tx;
    txHash: string;
    isMined: Boolean;
}

export interface PendingTxObject {
    txHash: string;
    wait: (maxWait?: number) => Promise<PolledTxObject> | Promise<null>;
}

/**
 * Transaction handler
 * @class
 * @property {WalletType} wallet - Circular Wallet reference
 * @property {Tx} transaction - The transaction object to be sent
 * @property {RpcFee} fees - Fees Object - Contains associated transaction fees
 * @property {Array} outValue - Collection of out values
 */
export class Transaction {
    private wallet: WalletType;
    private transaction: Tx;
    private fees: RpcFee;
    private outValue: any[];

    /**
     * Creates an instance of Transaction.
     * @param {WalletType} wallet - Circular wallet reference to use internally of Transaction class
     */
    constructor(wallet: WalletType) {
        this.wallet = wallet;
        this.transaction = new Tx(wallet);
        this.fees = undefined;
        this.outValue = [];
    }

    /**
     * Creates a polled transaction object
     * @param {hex} txHash - TxHash that was polled
     * @param {Boolean} isMined - Was the TxHash found to be mined
     * @param {RpcTxObject} Tx - The Tx Object from the RPC
     * @returns {PolledTxObject} Polled Transaction Object
     */
    async PolledTxObject(
        txHash: string,
        isMined: Boolean,
        tx: Tx
    ): Promise<PolledTxObject> {
        return {
            tx,
            txHash,
            isMined,
        };
    }

    /**
     * Monitor pending transaction
     * @param {string} txHash - Transaction hash to return a Pending Object of
     * @returns {PendingTxObject} Pending transaction object
     */
    async PendingTxObject(txHash: string): Promise<PendingTxObject> {
        return {
            txHash: txHash,
            /**
             * @param {Number} maxWait - Max amount of time in ms to wait for a Tx to mine -- Defaults to 2 minutes
             * @returns {Promise<PolledTxObject>}
             */
            wait: async (maxWait = 120000) => {
                try {
                    // Use the txHash to await resolution of status to mined
                    let resolved = false;
                    let waited = 0; // Time waited for Tx to resolve

                    // Don't wait more than maxWait for transactions via this method
                    while (!resolved) {
                        let txStatus = await this.wallet.rpc.getTxStatus(
                            txHash
                        );

                        if (waited >= maxWait - 2000) {
                            return this.PolledTxObject(
                                txHash,
                                false,
                                txStatus.Tx
                            );
                        }

                        if (txStatus.IsMined) {
                            return this.PolledTxObject(
                                txHash,
                                true,
                                txStatus.Tx
                            );
                        } else {
                            waited += 2000;
                            await this.wallet.utils.sleep(2000);

                            return null;
                        }
                    }
                } catch (ex) {
                    throw new Error("PendingTxObj: " + ex.message);
                }
            },
        };
    }

    /**
     * Create TxIns and send the current this.transaction object via RPC method -- Does not wait for mining
     * @param {hex} [changeAddress=false]
     * @param {hex} [changeAddressCurve=false]
     * @param {Object} [UTXOIDs=[]]
     * @throws No Tx fee added
     * @throws No Vouts for transaction
     * @throws No RPC to send transaction
     * @returns {hex} Transaction hash
     */
    async sendTx(
        changeAddress: string,
        changeAddressCurve: string,
        UTXOIDs: any[] = []
    ): Promise<string> {
        try {
            if (this.transaction.fee === "0") throw "No Tx fee added";
            if (this.transaction.vout.length <= 0) {
                throw "No Vouts for transaction";
            }
            if (!this.wallet.rpc.rpcServer) throw "No RPC to send transaction";

            await this._createTxIns(changeAddress, changeAddressCurve, UTXOIDs);
            await this.transaction._createTx();

            const txHash = await this.wallet.rpc.sendTransaction(
                this.transaction.getTx()
            );

            await this._reset();

            return txHash;
        } catch (ex) {
            this._reset();

            throw new Error("Transaction.sendTx\r\n" + String(ex));
        }
    }

    /**
     * Create TxIns and send the current this.transaction object via RPC method with a returned hash and object with wait() for mining.
     * @property {Function} sendTx - Create TxIns and send the current this.transaction object via RPC method
     * @param {hex} [changeAddress=false] - Optional
     * @param {hex} [changeAddressCurve=false] - Optional
     * @param {Object} [UTXOIDs=[]] - Optional will be fetched if not provided
     * @throws No Tx fee added
     * @throws No Vouts for transaction
     * @throws No RPC to send transaction
     * @returns {Promise<PendingTxObject>} Pending Transaction Object
     */
    async sendWaitableTx(
        changeAddress: string,
        changeAddressCurve: string,
        UTXOIDs: any[] = []
    ): Promise<Tx> {
        try {
            if (this.transaction.fee === "0") throw "No Tx fee added";
            if (this.transaction.vout.length <= 0) {
                throw "No Vouts for transaction";
            }
            if (!this.wallet.rpc.rpcServer) throw "No RPC to send transaction";

            await this._createTxIns(changeAddress, changeAddressCurve, UTXOIDs);
            await this.transaction._createTx();

            const txHash = await this.wallet.rpc.sendTransaction(
                this.transaction.getTx()
            );

            await this._reset();

            // Return a TX Object that can be wait()ed
            return this.PendingTxObject(txHash);
        } catch (ex) {
            this._reset();
            throw new Error("Transaction.sendTx: " + String(ex));
        }
    }

    /**
     * Send Signed Tx Object
     * @param {RpcTxObject} Tx
     * @throws No Tx fee added
     * @throws No Vouts for transaction
     * @throws No Vins for transaction
     * @returns {hex} Transaction hash
     */
    async sendSignedTx(rpcTx: RpcTxObject): Promise<string> {
        try {
            if (rpcTx.fee === "0") throw "No Tx fee added";
            if (rpcTx.vout.length <= 0) throw "No Vouts for transaction";
            if (rpcTx.vin.length <= 0) throw "No Vins for transaction";

            const txHash = await this.wallet.rpc.sendTransaction(Tx);

            await this._reset();

            return txHash;
        } catch (ex) {
            this._reset();

            throw new Error("Transaction.sendSignedTx\r\n" + String(ex));
        }
    }

    /**
     * Create a raw Transaction that requires signing
     * @throws No Tx fee added
     * @throws No Vouts for transaction
     * @returns {RpcTxObject} Transaction object
     */
    async createRawTransaction(): Promise<RpcTxObject> {
        try {
            if (this.transaction.fee === "0") {
                throw "No Tx fee added";
            }

            if (this.transaction.vout.length <= 0) {
                throw "No Vouts for transaction";
            }

            await this._createTxIns();

            const ptx = await this.transaction.createRawTx();

            return ptx;
        } catch (ex) {
            throw new Error(
                "Transaction.createRawTransaction\r\n" + String(ex)
            );
        }
    }

    /**
     * Create temporary TxIns and run tx.EstimateFees on the expected Tx state
     * TxOuts must already be added for this function call
     * Resets Tx state after running
     * @param {String} changeAddress - Change address for the Tx
     * @param {Int} changeAddressCurve - Curve of the change address == 1 (SECP256k1) || 2 (BN)
     * @param {Array<String>} UTXOIDs - Array of UTXO ID strings
     * @param {Boolean} - returnInsufficientOnGas - Return insufficient amount error in object form for insufficient funds per account, rather than throwing error
     * @throws No Tx fee added to tx
     * @throws No Vouts for fee estimation
     * @returns {Object} Fees from Tx.estimateFees()
     */
    async getTxFeeEstimates(
        changeAddress: string,
        changeAddressCurve: string,
        UTXOIDs: String[] = [],
        returnInsufficientOnGas: Boolean
    ): Promise<RpcFee> {
        try {
            if (this.transaction.fee === "0") throw "No Tx fee added to tx";
            if (this.transaction.vout.length <= 0) {
                throw "No Vouts for fee estimation";
            }

            // Make deep copy here for Tx state to restore it
            const vout = this.transaction.vout.slice();
            const outValue = this.outValue.slice();

            const createTxIns = await this._createTxIns(
                changeAddress,
                changeAddressCurve,
                UTXOIDs,
                returnInsufficientOnGas
            );
            const fees = await this.transaction.estimateFees();

            // If createTxIns hoists an insufficient funds error, add that to the available estimates
            if (!!createTxIns && createTxIns.errors) {
                fees.errors = createTxIns.errors;
            }

            this.transaction.vin = [];
            this.transaction.txInOwners = [];
            this.outValue = outValue;
            this.transaction.vout = vout;

            return fees;
        } catch (ex) {
            this._reset();
            throw new Error("Transaction.getTxFeeEstimates\r\n" + String(ex));
        }
    }

    /**
     * Create the transaction fee and account that will be paying it
     * @param {hex} payeerAddress
     * @param {number} payeerCurve
     * @param {number|bigint} fee
     * @throws Missing arugments
     * @throws Invalid value
     */
    async createTxFee(
        payeerAddress: string,
        payeerCurve: Number,
        fee: number | bigint
    ) {
        try {
            if (!payeerAddress || !payeerCurve) throw "Missing arguments";

            payeerAddress = this.wallet.utils.isAddress(payeerAddress);
            payeerCurve = this.wallet.utils.isCurve(payeerCurve);

            if (!fee) {
                if (!this.fees.minTxFee) await this._getFees();

                fee = BigInt("0x" + this.fees.minTxFee);
            } else {
                fee = this.wallet.utils.isBigInt(fee);

                if (fee <= BigInt(0)) throw "Invalid value";
            }

            const account = await this.wallet.account.getAccount(payeerAddress);

            this.transaction.txFee(this.wallet.utils.numToHex(fee));

            await this._addOutValue(fee, account.address);
        } catch (ex) {
            throw new Error("Transaction.createTxFee\r\n" + String(ex));
        }
    }

    /**
     * Create a ValueStore
     * @param {hex} from
     * @param {number|bigint|string} value
     * @param {hex} to
     * @param {number} toCurve
     * @param {number} fee
     * @throws Missing arugments
     * @throws Invalid value
     * @throws Fee too low
     * @throws RPC server must be set to fetch fee
     * @throws Cannot get curve
     * @returns {Object} Value Store
     */
    async createValueStore(
        from: string,
        value: number | bigint | string,
        to: string,
        toCurve: Number,
        fee?: string
    ): Promise<ValueStore> {
        try {
            if (!from || !to || !value || !toCurve) throw "Missing arugments";

            from = this.wallet.utils.isAddress(from);
            value = this.wallet.utils.isBigInt(value);
            toCurve = this.wallet.utils.isCurve(toCurve);
            to = this.wallet.utils.isAddress(to);

            if (value <= BigInt(0)) throw "Invalid value";

            if (fee) {
                fee = this.wallet.utils.numToHex(fee);
                if (this.wallet.rpc.rpcServer) {
                    if (!this.fees.valueStoreFee) {
                        await this._getFees();
                    }
                    if (
                        BigInt("0x" + this.fees.valueStoreFee) <
                        BigInt("0x" + fee)
                    ) {
                        throw "Fee too low";
                    }
                }
            } else {
                if (this.wallet.rpc.rpcServer) {
                    if (!this.fees.valueStoreFee) {
                        await this._getFees();
                    }
                    fee = this.fees.valueStoreFee;
                } else {
                    throw "RPC server must be set to fetch fee";
                }
            }

            const account = await this.wallet.account.getAccount(from);

            if (!account.curve) throw "Cannot get curve";

            const owner = await this.wallet.utils.prefixSVACurve(
                1,
                toCurve,
                to
            );

            const vStore = this.transaction.ValueStore(
                this.wallet.utils.numToHex(value),
                this.transaction.vout.length,
                owner,
                fee
            );

            const total = BigInt(value) + BigInt("0x" + fee);

            await this._addOutValue(total, account.address);

            return vStore;
        } catch (ex) {
            throw new Error("Transaction.createValueStore\r\n" + String(ex));
        }
    }

    /**
     * Create a DataStore
     * @param {hex} from
     * @param {(string|hex)} index
     * @param {number|bigint} duration
     * @param {(string|hex)} rawData
     * @param {number|any} [issuedAt=false]
     * @param {number} fee
     * @throws Missing arguments
     * @throws Invalid duration
     * @throws Cannot get account
     * @throws RPC server must be set to fetch epoch
     * @throws Index too large
     * @throws Invalid fee
     * @throws RPC server must be set to fetch fee
     * @returns {Object} Data Store
     */
    async createDataStore(
        from: string,
        index: string,
        duration: number | bigint,
        rawData: string,
        issuedAt: Number | any = 0,
        fee: Number
    ): Promise<DataStore> {
        try {
            if (!from || !index || !duration || !rawData) {
                throw "Missing arguments";
            }

            from = this.wallet.utils.isAddress(from);
            duration = this.wallet.utils.isBigInt(duration);

            if (duration <= BigInt(0)) throw "Invalid duration";

            const account = await this.wallet.account.getAccount(from);

            if (!account) throw "Cannot get account";

            if (issuedAt) {
                issuedAt = this.wallet.utils.isNumber(issuedAt);
            } else {
                if (!this.wallet.rpc.rpcServer) {
                    throw "RPC server must be set to fetch epoch";
                }
                issuedAt = await this.wallet.rpc.getEpoch();
                const blockNumber = await this.wallet.rpc.getBlockNumber();
                if (
                    blockNumber % Constants.EpochBlockSize >
                        Constants.EpochBoundary ||
                    blockNumber % Constants.EpochBlockSize === 0
                ) {
                    issuedAt++;
                }
            }

            rawData =
                rawData.indexOf("0x") === 0
                    ? this.wallet.utils.isHex(rawData)
                    : this.wallet.utils.txtToHex(rawData);

            let deposit = await this.wallet.utils.calculateDeposit(
                rawData,
                duration
            );
            deposit = this.wallet.utils.isBigInt(deposit);

            const owner = await this.wallet.utils.prefixSVACurve(
                3,
                account.curve,
                account.address
            );
            const txIdx = this.transaction.vout.length;

            index =
                index.indexOf("0x") === 0
                    ? this.wallet.utils.isHex(index)
                    : (index = this.wallet.utils.txtToHex(index));

            if (index.length > 64) {
                throw "Index too large";
            } else if (index.length != 64) {
                index = index.padStart(64, "0");
            }

            if (fee) {
                fee = this.wallet.utils.numToHex(fee);
            }

            if (this.wallet.rpc.rpcServer) {
                if (!this.fees.dataStoreFee) await this._getFees();

                let calculatedFee = await this.wallet.utils.calculateFee(
                    this.wallet.utils.hexToInt(this.fees.dataStoreFee),
                    duration
                );

                if (fee) {
                    if (BigInt(calculatedFee) < BigInt("0x" + fee)) {
                        throw "Invalid fee";
                    }
                } else {
                    fee = this.wallet.utils.numToHex(calculatedFee);
                }
            } else {
                if (!fee) throw "RPC server must be set to fetch fee";
            }

            const dStore = this.transaction.DataStore(
                index,
                issuedAt,
                this.wallet.utils.numToHex(deposit),
                rawData,
                txIdx,
                owner,
                fee
            );
            const total = BigInt(deposit) + BigInt("0x" + fee);

            await this._addOutValue(total, account.address, {
                index: index,
                epoch: issuedAt,
            });

            return dStore;
        } catch (ex) {
            throw new Error("Transaction.createDataStore\r\n" + String(ex));
        }
    }

    /**
     * Get the current fees and store them
     */
    async _getFees() {
        try {
            this.fees = await this.wallet.rpc.getFees();
        } catch (ex) {
            throw new Error("Transaction.getFees\r\n" + String(ex));
        }
    }
    /**
     * Reset transaction Objects
     */
    async _reset() {
        this.transaction = new Tx(this.wallet);
        this.outValue = [];
    }

    /**
     * Track TxOut running total
     * @param {number|bigint} value
     * @param {Hex20} ownerAddress
     * @param {hex|any} [dsIndex=false]
     */
    async _addOutValue(
        value: Number | bigint,
        ownerAddress: string,
        dsIndex?: string | any
    ) {
        try {
            const valueIndex = this.outValue.findIndex(
                (a) => a.address === ownerAddress
            );

            if (!isNaN(valueIndex) && this.outValue[valueIndex]) {
                this.outValue[valueIndex].totalValue += value;
                if (dsIndex) {
                    this.outValue[valueIndex].dsIndex.push(dsIndex);
                }
            } else {
                this.outValue.push({
                    address: ownerAddress,
                    totalValue: value,
                    dsIndex: dsIndex ? [dsIndex] : [],
                });
            }
        } catch (ex) {
            throw new Error("Transaction._addOutValue\r\n" + String(ex));
        }
    }

    /**
     * Create all TxIns required for Vin
     * @param {hex} [changeAddress=false]
     * @param {hex} [changeAddressCurve=false]
     * @param {Object} [UTXOIDs=false]
     * @param {Boolean} - returnInsufficientOnGas - Return insufficient amount errors in object form for insufficient funds per account, rather than throwing error
     * @throws Insufficient funds
     * @returns {Object} Returns an array of funding errors if requested as {}.errors or null for successful pass without a throw
     */
    async _createTxIns(
        changeAddress?: string,
        changeAddressCurve?: string,
        UTXOIDs?: any[],
        returnInsufficientOnGas?: Boolean
    ): Promise<any> {
        let insufficientFundErrors = [];

        try {
            const OutValue = this.outValue.slice();

            for (let i = 0; i < OutValue.length; i++) {
                const outValue = OutValue[i];
                const account = await this.wallet.account.getAccount(
                    outValue.address
                );

                if (!UTXOIDs) UTXOIDs = [];

                if (UTXOIDs.length > 0) {
                    await this.wallet.account._getAccountUTXOsByIds(
                        account.address,
                        UTXOIDs
                    );
                } else {
                    if (!this.fees) {
                        this.fees = await this.wallet.rpc.getFees();
                    }
                    await this.wallet.account._getAccountValueStores(
                        account.address,
                        outValue.totalValue
                    );
                }

                // Copy below for reward 318 - 320 -- See if index exists and calc the reward
                for (let i = 0; i < outValue.dsIndex.length; i++) {
                    const DS = await this.wallet.rpc.getDataStoreByIndex(
                        account.address,
                        account.curve,
                        outValue.dsIndex[i].index
                    );

                    // Skip if the store doesn't equal datastore for spending
                    if (
                        DS &&
                        DS.DSLinker.DSPreImage.Index ==
                            outValue.dsIndex[i].index
                    ) {
                        const reward = await this.wallet.utils.remainingDeposit(
                            DS,
                            outValue.dsIndex[i].epoch
                        );

                        if (reward) {
                            await this._createDataTxIn(account.address, DS);
                            outValue.totalValue =
                                BigInt(outValue.totalValue) - BigInt(reward);
                        }
                    }
                }
                // Control error handling for any accounts with insufficient funds
                const insufficientFunds =
                    BigInt(outValue.totalValue) > BigInt(account.UTXO.Value);

                if (insufficientFunds && returnInsufficientOnGas) {
                    insufficientFundErrors.push({
                        error: {
                            msg: "Insufficient Funds",
                            details: {
                                account: account,
                                outValue: outValue,
                                totalFoundUtxoValue: BigInt(account.UTXO.Value),
                            },
                        },
                    });
                    continue;
                } else if (insufficientFunds) {
                    throw "Insufficient funds";
                }

                if (BigInt(outValue.totalValue) == BigInt(0)) return;

                if (BigInt(outValue.totalValue) < BigInt(0)) {
                    // Don't bother creating a reward value store if the cost for the value store undermines the reward, just use as priortization on the Tx
                    if (
                        BigInt(
                            BigInt(BigInt(outValue.totalValue) * BigInt(-1)) -
                                BigInt("0x" + this.fees.valueStoreFee)
                        ) <= BigInt("0")
                    ) {
                        // console.log("EDGECASE"); -- Needs investigated -- this is exceptionally hard to emulate. A DataStore consumption has to reward <= 4 madbytes on consumption
                        // TODO: This is private, did you mean this.fee?
                        this.transaction.fee = BigInt(
                            BigInt(BigInt(outValue.totalValue) * BigInt(-1)) +
                                BigInt(this.transaction.fee)
                        ).toString(10);
                        continue;
                    }
                    await this.createValueStore(
                        account.address,
                        BigInt(BigInt(outValue.totalValue) * BigInt(-1)),
                        changeAddress ? changeAddress : account.address,
                        changeAddressCurve ? changeAddressCurve : account.curve
                    );
                    await this._spendUTXO(
                        account.UTXO,
                        account,
                        outValue.totalValue,
                        changeAddress,
                        changeAddressCurve
                    );
                } else {
                    await this._spendUTXO(
                        account.UTXO,
                        account,
                        outValue.totalValue,
                        changeAddress,
                        changeAddressCurve
                    );
                }
            }

            // If the for loop hasn't returned on outValue["totalValue"]) == BigInt(0) or above in the two other exit cases, assume an insufficient error has occurred and return them
            return { errors: insufficientFundErrors };
        } catch (ex) {
            throw new Error("Transaction._createTxIns\r\n" + String(ex));
        }
    }

    /**
     * Create a single TxIn consuming a ValueStore
     * @param {hex} address
     * @param {Utxo} utxo
     */
    async _createValueTxIn(address: string, utxo: Utxo) {
        try {
            this.transaction.TxIn(
                utxo.txHash,
                utxo.vsPreImage.txOutIdx ? utxo.vsPreImage.txOutIdx : 0
            );

            this.transaction.txInOwners.push({
                address: address,
                txOutIdx: utxo.vsPreImage.txOutIdx
                    ? utxo.vsPreImage.txOutIdx
                    : 0,
                txHash: utxo.txHash,
                isDataStore: false,
            });
        } catch (ex) {
            throw new Error("Transaction.createTxIn\r\n" + String(ex));
        }
    }

    /**
     * Create a single TxIn consuming a DataStore
     * @param {hex} address
     * @param {Utxo} utxo
     */
    async _createDataTxIn(address: string, utxo: Utxo) {
        try {
            this.transaction.txIn(
                utxo.dsLinker.TxHash,
                utxo.dsLinker.DSPreImage.TXOutIdx
                    ? utxo.dsLinker.DSPreImage.TXOutIdx
                    : 0
            );

            this.transaction.txInOwners.push({
                address: address,
                txOutIdx: utxo.dsLinker.DSPreImage.TXOutIdx
                    ? utxo.dsLinker.DSPreImage.TXOutIdx
                    : 0,
                txHash: utxo.dsLinker.TxHash,
                isDataStore: true,
            });
        } catch (ex) {
            throw new Error("Transaction.createTxIn\r\n" + String(ex));
        }
    }

    /**
     * Consume UTXOs until required value is met
     * @param {Object} accountUTXO
     * @param {hex|any} account
     * @param {number|any} currentValue
     * @param {hex} [changeAddress=false]
     * @param {hex} [changeAddressCurve=false]
     * @throws Could not find highest value UTXO
     */
    async _spendUTXO(
        accountUTXO: any,
        account: string | any,
        currentValue: Number | any,
        changeAddress: string,
        changeAddressCurve: string
    ) {
        try {
            accountUTXO = accountUTXO.ValueStores;

            while (true) {
                let highestUnspent: any = false;

                for (let i = 0; i < accountUTXO.length; i++) {
                    if (!highestUnspent) {
                        highestUnspent = accountUTXO[i];
                        continue;
                    }
                    if (
                        BigInt("0x" + accountUTXO[i].VSPreImage.Value) >
                        BigInt("0x" + highestUnspent.VSPreImage.Value)
                    ) {
                        highestUnspent = accountUTXO[i];
                    }
                }

                if (!highestUnspent) throw "Could not find highest value UTXO";

                highestUnspent.VSPreImage.Value = BigInt(
                    "0x" + highestUnspent.VSPreImage.Value
                );

                await this._createValueTxIn(account.address, highestUnspent);

                for (let i = 0; i < accountUTXO.length; i++) {
                    if (
                        accountUTXO[i].TxHash === highestUnspent.TxHash &&
                        accountUTXO[i].VSPreImage.TXOutIdx ===
                            highestUnspent.VSPreImage.TXOutIdx
                    ) {
                        await accountUTXO.splice(i, 1);
                        break;
                    }
                }

                let remaining = BigInt(
                    BigInt(highestUnspent.VSPreImage.Value) -
                        BigInt(currentValue)
                );

                if (remaining > BigInt(0)) {
                    if (
                        BigInt(
                            BigInt(remaining) -
                                BigInt("0x" + this.fees.valueStoreFee)
                        ) <= BigInt(0)
                    ) {
                        // TODO: This is private, did you mean this.fee?
                        this.transaction.fee = BigInt(
                            BigInt(remaining) + BigInt(this.transaction.fee)
                        ).toString(10);
                        break;
                    }

                    remaining = BigInt(
                        BigInt(remaining) -
                            BigInt("0x" + this.fees.valueStoreFee)
                    );

                    await this.createValueStore(
                        account.address,
                        BigInt(remaining).toString(10),
                        changeAddress ? changeAddress : account.address,
                        changeAddressCurve ? changeAddressCurve : account.curve
                    );

                    break;
                }

                currentValue =
                    BigInt(currentValue) -
                    BigInt(highestUnspent.VSPreImage.Value);

                if (currentValue === BigInt(0)) break;
            }
        } catch (ex) {
            throw new Error("Trasaction._spendUTXO\r\n" + String(ex));
        }
    }
}
