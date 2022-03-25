const { default: Axios } = require('axios');
const constant = require("./Constants.js");

/**
 * RPC request handler
 * @class RPC
 */
class RPC {
    /**
     * Creates an instance of RPC.
     * @param {Object} Wallet
     * @param {string} [rpcServer=false]
     */
    constructor(Wallet, rpcServer) {
        this.Wallet = Wallet;
        this.rpcServer = rpcServer ? rpcServer : false;
    }

    /**
     * Set RPC provider
     * @param {string} rpcServer
     */
    async setProvider(rpcServer) {
        try {
            if (!rpcServer) {
                throw "RPC server not provided"
            }
            this.rpcServer = rpcServer;
            let chainId = await this.getChainId();
            this.Wallet.chainId = chainId;
            return chainId;
        } catch (ex) {
            throw new Error("RPC.setProvider\r\n" + String(ex));
        }
    }


    /**
     * Get block header by height
     * @param {number} height
     * @return {number}
     */
    async getBlockHeader(height) {
        height = this.Wallet.Utils.isNumber(height)
        try {
            let BH = await this.request("get-block-header", { "Height": height });
            if (!BH["BlockHeader"]) {
                throw "Block header not found"
            }
            return BH["BlockHeader"];
        } catch (ex) {
            throw new Error("RPC.getBlockHeader\r\n" + String(ex));
        }
    }

    /**
     * Get current block height
     * @return {number} block height
     */
    async getBlockNumber() {
        try {
            let BN = await this.request("get-block-number")
            if (!BN["BlockHeight"]) {
                throw "Block height not found"
            }
            return BN["BlockHeight"]
        } catch (ex) {
            throw new Error("RPC.getBlockNumber\r\n" + String(ex));
        }
    }

    /**
     * Get current chain id
     * @return {number} chain id
     */
    async getChainId() {
        try {
            let CI = await this.request("get-chain-id");
            if (!CI["ChainID"]) {
                throw "Chain id not found"
            }
            return CI["ChainID"]
        } catch (ex) {
            throw new Error("RPC.getChainId\r\n" + String(ex));
        }
    }

    /**
     * Get current epoch
     * @return {number} epoch
     */
    async getEpoch() {
        try {
            let epoch = await this.request("get-epoch-number")
            if (!epoch["Epoch"]) {
                throw "Epoch not found"
            }
            return epoch["Epoch"]
        } catch (ex) {
            throw new Error("RPC.getEpoch\r\n" + String(ex));
        }
    }

    /**
     * Get fees for this epoch
     * @returns {Object} Fees
     */
    async getFees() {
        try {
            let fees = await this.request("get-fees")
            if (!fees["MinTxFee"]) {
                throw "Could not get fees"
            }
            return fees;
        } catch (ex) {
            throw new Error("RPC.getFees\r\n" + String(ex));
        }
    }

    /**
     * Get UTXOs for account by array of utxo ids
     * @param {hex} address
     * @param {Object} UTXOIDs
     */
    async getUTXOsByIds(UTXOIDs) {
        try {
            let isArray = Array.isArray(UTXOIDs)
            if (!isArray) {
                throw "Invalid arguments"
            }
            let minrequests = Math.ceil(UTXOIDs.length / constant.MaxUTXOs);
            let DataStores = [];
            let ValueStores = [];
            let AtomicSwaps = [];
            for (let i = 0; i < minrequests; i++) {
                let reqData = { "UTXOIDs": UTXOIDs.slice((i * constant.MaxUTXOs), ((i + 1) * constant.MaxUTXOs)) }
                let utxos = await this.request("get-utxo", reqData)
                if (!utxos["UTXOs"]) {
                    utxos["UTXOs"] = []
                }
                for await (let utxo of utxos["UTXOs"]) {
                    if (utxo["DataStore"]) {
                        DataStores.push(utxo["DataStore"]);
                    } else if (utxo["ValueStore"]) {
                        ValueStores.push(utxo["ValueStore"]);
                    } else if (utxo["AtomicSwap"]) {
                        AtomicSwaps.push(utxo["AtomicSwap"]);
                    }
                }
            }
            return [DataStores, ValueStores, AtomicSwaps];
        } catch (ex) {
            throw new Error("RPC.getUTXOsByIds\r\n" + String(ex));
        }
    }

    /**
     * Get account balance
     * @param {hex} address
     * @param {number} curve
     * @param {number} minValue !optional
     * @return {Array}
     */
    async getValueStoreUTXOIDs(address, curve, minValue = false) {
        try {
            if (!address || !curve) {
                throw "Invalid arguments"
            }
            address = this.Wallet.Utils.isAddress(address)
            curve = this.Wallet.Utils.isNumber(curve)
            if (!minValue) {
                minValue = constant.MaxValue;
            } else {
                minValue = this.Wallet.Utils.numToHex(minValue)
            }
            let valueForOwner = { "CurveSpec": curve, "Account": address, "Minvalue": minValue, "PaginationToken": "" }
            let runningUtxos = [];
            let runningTotal = BigInt("0");
            while (true) {
                let value = await this.request("get-value-for-owner", valueForOwner)
                if (!value["UTXOIDs"] || value["UTXOIDs"].length == 0 || !value["TotalValue"]) {
                    break;
                }
                runningUtxos = runningUtxos.concat(value["UTXOIDs"]);
                runningTotal = BigInt(BigInt("0x" + value["TotalValue"]) + BigInt(runningTotal));
                if (!value["PaginationToken"]) {
                    break;
                }
                valueForOwner["PaginationToken"] = value["PaginationToken"];
            }
            runningTotal = runningTotal.toString(16)
            if (runningTotal.length % 2) {
                runningTotal = '0' + runningTotal;
            }
            return [runningUtxos, runningTotal];
        } catch (ex) {
            throw new Error("RPC.getBalance\r\n" + String(ex));
        }
    }

    /**
     * Get Data Store UTXO IDs and Indices for account
     * @param {hex} address
     * @param {number} limit
     * @param {number} offset
     * @returns {Array<DataStoreAndIndexObject>} - Object[] containing UTXOID and Index {@link DataStoreAndIndexObject}
     */
    async getDataStoreUTXOIDsAndIndices(address, curve, limit, offset) {
        try {
            if (!address || !curve) {
                throw "Invalid arguments"
            }
            address = this.Wallet.Utils.isAddress(address)
            curve = this.Wallet.Utils.isNumber(curve)
            let getAll = false;
            if (!limit || limit > constant.MaxUTXOs) {
                if (!limit) {
                    getAll = true;
                }
                limit = constant.MaxUTXOs;
            } else {
                limit = this.Wallet.Utils.isNumber(limit);
            }
            if (!offset) {
                offset = "";
            } else {
                offset = this.Wallet.Utils.isHex(offset)
            }
            let DataStoreUTXOResults = [];
            while (true) {
                let reqData = { "CurveSpec": curve, "Account": address, "Number": limit, "StartIndex": offset }
                let dataStoreIDs = await this.request("iterate-name-space", reqData);
                if (!dataStoreIDs["Results"].length) {
                    break
                }
                DataStoreUTXOResults = DataStoreUTXOResults.concat(dataStoreIDs["Results"]);
                if (dataStoreIDs["Results"].length <= limit && !getAll) {
                    break;
                }
                offset = dataStoreIDs["Results"][dataStoreIDs["Results"].length - 1]["Index"];
            }
            /** @type { DataStoreAndIndexObject } */
            return DataStoreUTXOResults;
        } catch (ex) {
            throw new Error("RPC.getDataStoreUTXOIDsAndIndices\r\n" + String(ex));
        }

    }

    /**
     * Get Data Store UTXO IDs for account
     * @param {hex} address
     * @param {number} limit
     * @param {number} offset
     * @returns {Array<DataStoreAndIndexObject>} - Array of Objects containing UTXOID and Index
     */
    async getDataStoreUTXOIDs(address, curve, limit, offset) {
        try {
            let dsAndIndices = await this.getDataStoreUTXOIDsAndIndices(address, curve, limit, offset);
            let DataStoreUTXOIDs = [];
            // Filter out the datastore UTXOIDs, don't return indices that are in the results objects
            dsAndIndices.forEach(dsAndIdx => {
                DataStoreUTXOIDs.push(dsAndIdx["UTXOID"]);
            })
            return DataStoreUTXOIDs;
        } catch (ex) {
            throw new Error("RPC.getDataStoreUTXOIDs\r\n" + String(ex));
        }
    }

    /**
     * Get raw data for a data store
     * @param {hex} address
     * @param {hex} index
     * @return {hex} raw data
     */
    async getData(address, curve, index) {
        try {
            address = this.Wallet.Utils.isAddress(address)
            curve = this.Wallet.Utils.isNumber(curve);
            index = this.Wallet.Utils.isHex(index);
            if (!address || !index || !curve) {
                throw "Invalid arguments"
            }
            let reqData = { "Account": address, "CurveSpec": curve, "Index": index }
            let dataStoreData = await this.request("get-data", reqData);
            if (!dataStoreData["Rawdata"]) {
                throw "Data not found"
            }
            return dataStoreData["Rawdata"];
        } catch (ex) {
            throw new Error("RPC.getData\r\n" + String(ex));
        }
    }

    /**
     *
     * @param {hex} address
     * @param {number} curve
     * @param {hex} index
     * @return {Object} DataStore
     */
    async getDataStoreByIndex(address, curve, index) {
        try {
            let dsUTXOIDS = await this.getDataStoreUTXOIDs(address, curve, 1, index);
            if (dsUTXOIDS.length > 0) {
                let [DS] = await this.getUTXOsByIds(dsUTXOIDS);
                if (DS.length > 0) {
                    return DS[0];
                }
            }
            return false;
        } catch (ex) {
            throw new Error("RPC.getDataStoreByIndex\r\n" + String(ex));
        }
    }

    /**
     * Send transaction
     * @param {Object} Tx
     * @return {hex} transaction hash
     */
    async sendTransaction(Tx) {
        try {
            let sendTx = await this.request("send-transaction", Tx);
            if (!sendTx["TxHash"]) {
                throw "Transaction Error"
            }
            return sendTx["TxHash"];
        } catch (ex) {
            throw new Error("RPC.sendTransaction\r\n" + String(ex));
        }
    }

    /**
     * Get mined transaction
     * @param {hex} txHash
     * @return {Object} transaction object
     */
    async getMinedTransaction(txHash) {
        try {
            let getMined = await this.request("get-mined-transaction", { "TxHash": txHash });
            if (!getMined["Tx"]) {
                throw "Transaction not mined"
            }
            return getMined;
        } catch (ex) {
            throw new Error("RPC.getMinedTransaction\r\n" + String(ex));
        }
    }

    /**
     * Get pending transaction
     * @param {hex} txHash
     * @return {Object} transaction object
     */
    async getPendingTransaction(txHash) {
        try {
            let getPending = await this.request("get-pending-transaction", { "TxHash": txHash });
            if (!getPending["Tx"]) {
                throw "Transaction not pending"
            }
            return getPending["Tx"];
        } catch (ex) {
            throw new Error("RPC.getPendingTransaction\r\n" + String(ex));
        }
    }

    /**
     * Get block height of a transaction
     * @param {hex} txHash
     * @return {number} Block height
     */
    async getTxBlockHeight(txHash) {
        try {
            let txHeight = await this.request('get-tx-block-number', { "TxHash": txHash });
            if (!txHeight["BlockHeight"]) {
                throw "Block height not found"
            }
            return txHeight['BlockHeight'];
        } catch (ex) {
            throw new Error("RPC.getTxBlockHeight\r\n" + String(ex));
        }
    }

    /**
     * Poll transaction current status
     * @param {hex} txHash
     * @param {number} countMax
     * @param {number} startDelay
     * @param {number} currCount
     *
     * @return {Object} Tx Status
     */
    async getTxStatus(txHash, countMax = 30, startDelay = 1000, currCount = 1) {
        try {
            if (!txHash) {
                throw "Argument txHash cannot be empty";
            }
            const status = await this.request('get-transaction-status', {
                "TxHash": txHash,
                "ReturnTx": true
            });
            return status;
        } catch (ex) {
            if (currCount > countMax) {
                throw new Error("RPC.getTxStatus\r\n" + String(ex));
            }
            await this.sleep(startDelay);
            await this.getTxStatus(txHash, countMax, Math.floor(startDelay * 1.25), (currCount + 1));
        }
    }

    async monitorPending(tx, countMax = 30, startDelay = 1000, currCount = 1) {
        try {
            await this.getMinedTransaction(tx);
            return true;
        } catch (ex) {
            if (currCount > 30) {
                throw new Error("RPC.monitorPending\r\n" + String(ex));
            }
            await this.sleep(startDelay)
            await this.monitorPending(tx, countMax, Math.floor(startDelay * 1.25), (currCount + 1))
        }
    }

    /**
     * Send a request to the rpc server
     * @param {string} route
     * @param {Object} data
     * @return {Object} response
     */
    async request(route, data) {
        try {
            if (!this.Wallet.chainId && this.rpcServer) {
                await this.setProvider(this.provider);
            }
            if (!this.rpcServer) {
                throw "No rpc provider"
            }
            if (!route) {
                throw "No route provided";
            }
            if (!data) {
                data = {};
            }
            let attempts, timeout = false;
            let resp;
            while (true) {
                try {
                    resp = await Axios.post(this.rpcServer + route, data, {
                        timeout: constant.ReqTimeout,
                        validateStatus: function (status) {
                            return status
                        }
                    });
                } catch (ex) {
                    [attempts, timeout] = await this.backOffRetry(attempts, timeout, String(ex));
                    continue;
                }
                if (!resp || !resp.data || resp.data["error"] || resp.data["code"]) {
                    let parsedErr = resp.data ? (resp.data["error"] || resp.data["message"]) : "Unable to parse RPC Error Msg";
                    [attempts, timeout] = await this.backOffRetry(attempts, timeout, parsedErr);
                    continue;
                }
                break
            }
            return resp.data;
        } catch (ex) {
            throw new Error("RPC.request\r\n" + String(ex));
        }
    }

    async backOffRetry(attempts, timeout, latestErr) {
        try {
            if (attempts >= 5) {
                throw new Error("RPC.backOffRetry\r\nRPC request attempt limit reached\r\nLatest error: " + latestErr);
            }
            if (!attempts) {
                attempts = 1
            } else {
                attempts++
            }
            if (!timeout) {
                timeout = 1000;
            } else {
                timeout = Math.floor(timeout * 1.25);
            }
            await this.sleep(timeout)
            return [attempts, timeout];
        } catch (ex) {
            throw new Error("RPC.request\r\n" + String(ex));
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = RPC;