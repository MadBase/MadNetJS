const constant = require("./Constants.js");
const Api = require("./Http/Api.js");
const { addTrailingSlash } = require("./Util");
// Below import for intellisense and type support on jsdoc
const Wallet = require('./Wallet.js'); //eslint-disable-line

/**
 * RPC request handler
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {String|Boolean} rpcServer - (Optional) - RPC Endpoint to use for RPC requests 
 * @property {String|Boolean} rpcTimeout - (Optional) - RPC Endpoint to use for RPC requests 
 */
class RPC {
    /**
     * Creates an instance of RPC.
     * @param {Wallet} Wallet - Circular wallet reference to use internally of RPC class
     * @param {String|Boolean} [rpcServer=false] - (Optional - Rpc endpoint to use for RPC requests)
     * @param {number} [rpcTimeout=false] - (Optional - Maximum time to wait for RPC requests)
     */
    constructor(Wallet, rpcServer, rpcTimeout = false) {
        this.Wallet = Wallet;
        this.rpcServer = rpcServer ? addTrailingSlash(rpcServer) : false;
        this.rpcTimeout = rpcTimeout || constant.ReqTimeout; 
    }

    /**
     * Set RPC provider
     * @param {string} rpcServer
     * @throws RPC server not provided
     * @returns {number} ChainId
     */
    async setProvider(rpcServer) {
        try {
            if (!rpcServer) {
                throw "RPC server not provided"
            }
            this.rpcServer = addTrailingSlash(rpcServer);
            const chainId = await this.getChainId();
            this.Wallet.chainId = chainId;
            return chainId;
        } catch (ex) {
            throw new Error("RPC.setProvider\r\n" + String(ex));
        }
    }

    /**
     * Get block header by height
     * @param {number} height
     * @throws Block header not found
     * @returns {number} Block Header
     */
    async getBlockHeader(height) {
        height = this.Wallet.Utils.isNumber(height)
        try {
            const BH = await this.request("get-block-header", { "Height": height });
            if (!BH.BlockHeader) {
                throw "Block header not found";
            }
            return BH.BlockHeader;
        } catch (ex) {
            throw new Error("RPC.getBlockHeader\r\n" + String(ex));
        }
    }

    /**
     * Get current block height
     * @throws Block height not found
     * @returns {number} Block Height
     */
    async getBlockNumber() {
        try {
            const BN = await this.request("get-block-number");
            if (!BN.BlockHeight) {
                throw "Block height not found";
            }
            return BN.BlockHeight;
        } catch (ex) {
            throw new Error("RPC.getBlockNumber\r\n" + String(ex));
        }
    }

    /**
     * Get current chain id
     * @throws Chain id not found
     * @returns {number} ChainId
     */
    async getChainId() {
        try {
            // Directly call API for chainID to avoid recursive loop from this.request()'s chainID dependency
            const { data: { ChainID = null }} = await Api.post(this.rpcServer + "get-chain-id", {}, {
                timeout: this.rpcTimeout
            });
            if (!ChainID) {
                throw "Chain id not found";
            }
            return ChainID;
        } catch (ex) {
            throw new Error("RPC.getChainId\r\n" + String(ex));
        }
    }

    /**
     * Get current epoch
     * @throws Epoch not found
     * @returns {number} Epoch
     */
    async getEpoch() {
        try {
            const epoch = await this.request("get-epoch-number");
            if (!epoch.Epoch) {
                throw "Epoch not found";
            }
            return epoch.Epoch;
        } catch (ex) {
            throw new Error("RPC.getEpoch\r\n" + String(ex));
        }
    }

    /**
     * Get fees for this epoch
     * @throws Could not get fees
     * @returns {Object} Fees
     */
    async getFees() {
        try {
            const fees = await this.request("get-fees");
            if (!fees.MinTxFee) {
                throw "Could not get fees";
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
     * @throws Invalid arguments
     * @returns {Array<Object>} Array containing DataStores and ValueStores
     */
    async getUTXOsByIds(UTXOIDs) {
        try {
            const isArray = Array.isArray(UTXOIDs);
            if (!isArray) {
                throw "Invalid arguments";
            }
            const minrequests = Math.ceil(UTXOIDs.length / constant.MaxUTXOs);
            let DataStores = [];
            let ValueStores = [];
            for (let i = 0; i < minrequests; i++) {
                const reqData = { "UTXOIDs": UTXOIDs.slice((i * constant.MaxUTXOs), ((i + 1) * constant.MaxUTXOs)) };
                let utxos = await this.request("get-utxo", reqData);
                if (!utxos.UTXOs) {
                    utxos.UTXOs = [];
                }
                for await (let utxo of utxos.UTXOs) {
                    if (utxo.DataStore) {
                        DataStores.push(utxo.DataStore);
                    } else if (utxo.ValueStore) {
                        ValueStores.push(utxo.ValueStore);
                    }
                }
            }
            return [DataStores, ValueStores];
        } catch (ex) {
            throw new Error("RPC.getUTXOsByIds\r\n" + String(ex));
        }
    }

    /**
     * Get account balance
     * @param {hex} address
     * @param {number} curve
     * @param {number} [minValue=false] minValue !optional
     * @throws Invalid arguments
     * @returns {Array} Array containing runningUTXOs and totalValue
     */
    async getValueStoreUTXOIDs(address, curve, minValue = false) {
        try {
            if (!address || !curve) {
                throw "Invalid arguments";
            }
            address = this.Wallet.Utils.isAddress(address);
            curve = this.Wallet.Utils.isNumber(curve);
            if (!minValue) {
                minValue = constant.MaxValue;
            } else {
                minValue = this.Wallet.Utils.numToHex(minValue);
            }
            const valueForOwner = { "CurveSpec": curve, "Account": address, "Minvalue": minValue, "PaginationToken": "" };
            let runningUtxos = [];
            let runningTotal = BigInt("0");
            while (true) {
                const value = await this.request("get-value-for-owner", valueForOwner);
                if (!value.UTXOIDs || value.UTXOIDs.length == 0 || !value["TotalValue"]) {
                    break;
                }
                runningUtxos = runningUtxos.concat(value.UTXOIDs);
                runningTotal = BigInt(BigInt("0x" + value.TotalValue) + BigInt(runningTotal));
                if (!value.PaginationToken) {
                    break;
                }
                valueForOwner.PaginationToken = value.PaginationToken;
            }
            runningTotal = runningTotal.toString(16);
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
     * @param {number} curve
     * @param {number} limit
     * @param {number} offset
     * @throws Invalid arguments
     * @returns {Array<DataStoreAndIndexObject>} Object[] containing UTXOID and Index {@link DataStoreAndIndexObject}
     */
    async getDataStoreUTXOIDsAndIndices(address, curve, limit, offset) {
        try {
            if (!address || !curve) {
                throw "Invalid arguments";
            }
            address = this.Wallet.Utils.isAddress(address);
            curve = this.Wallet.Utils.isNumber(curve);
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
                offset = this.Wallet.Utils.isHex(offset);
            }
            let DataStoreUTXOResults = [];
            while (true) {
                let reqData = { "CurveSpec": curve, "Account": address, "Number": limit, "StartIndex": offset }
                let dataStoreIDs = await this.request("iterate-name-space", reqData);
                if (!dataStoreIDs.Results.length) {
                    break
                }
                DataStoreUTXOResults = DataStoreUTXOResults.concat(dataStoreIDs.Results);
                if (dataStoreIDs.Results.length <= limit && !getAll) {
                    break;
                }
                offset = dataStoreIDs.Results[dataStoreIDs.Results.length - 1].Index;
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
     * @param {number} curve
     * @param {number} limit
     * @param {number} offset
     * @returns {Array<DataStoreAndIndexObject>} Array of Objects containing UTXOID and Index
     */
    async getDataStoreUTXOIDs(address, curve, limit, offset) {
        try {
            const dsAndIndices = await this.getDataStoreUTXOIDsAndIndices(address, curve, limit, offset);
            let DataStoreUTXOIDs = [];
            // Filter out the datastore UTXOIDs, don't return indices that are in the results objects
            dsAndIndices.forEach(dsAndIdx => {
                DataStoreUTXOIDs.push(dsAndIdx.UTXOID);
            })
            return DataStoreUTXOIDs;
        } catch (ex) {
            throw new Error("RPC.getDataStoreUTXOIDs\r\n" + String(ex));
        }
    }

    /**
     * Get raw data for a data store
     * @param {hex} address
     * @param {hex} curve
     * @param {hex} index
     * @throws Invalid arguments
     * @throws Data not found
     * @returns {hex} Raw Data
     */
    async getData(address, curve, index) {
        try {
            address = this.Wallet.Utils.isAddress(address);
            curve = this.Wallet.Utils.isNumber(curve);
            index = this.Wallet.Utils.isHex(index);
            if (!address || !index || !curve) {
                throw "Invalid arguments";
            }
            const reqData = { "Account": address, "CurveSpec": curve, "Index": index };
            const dataStoreData = await this.request("get-data", reqData);
            if (!dataStoreData.Rawdata) {
                throw "Data not found";
            }
            return dataStoreData.Rawdata;
        } catch (ex) {
            throw new Error("RPC.getData\r\n" + String(ex));
        }
    }

    /**
     * Get Data Store for the provided index
     * @param {hex} address
     * @param {number} curve
     * @param {hex} index
     * @returns {(Object|Boolean)} Data Store or False
     */
    async getDataStoreByIndex(address, curve, index) {
        try {
            const dsUTXOIDS = await this.getDataStoreUTXOIDs(address, curve, 1, index);
            if (dsUTXOIDS.length > 0) {
                const [DS] = await this.getUTXOsByIds(dsUTXOIDS);
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
     * @param {RpcTxObject} Tx
     * @throws Transaction Error
     * @returns {hex} Transaction Hash
     */
    async sendTransaction(Tx) {
        try {
            const sendTx = await this.request("send-transaction", Tx);
            if (!sendTx.TxHash) {
                throw "Transaction Error";
            }
            return sendTx.TxHash;
        } catch (ex) {
            throw new Error("RPC.sendTransaction\r\n" + String(ex));
        }
    }

    /**
     * Get mined transaction
     * @param {hex} txHash
     * @throws Transaction not mined
     * @returns {RpcTxObject} Transaction Object
     */
    async getMinedTransaction(txHash) {
        try {
            const getMined = await this.request("get-mined-transaction", { "TxHash": txHash });
            if (!getMined.Tx) {
                throw "Transaction not mined";
            }
            return getMined;
        } catch (ex) {
            throw new Error("RPC.getMinedTransaction\r\n" + String(ex));
        }
    }

    /**
     * Get pending transaction
     * @param {hex} txHash
     * @throws Transaction not pending
     * @returns {RpcTxObject} Transaction Object
     */
    async getPendingTransaction(txHash) {
        try {
            const getPending = await this.request("get-pending-transaction", { "TxHash": txHash });
            if (!getPending.Tx) {
                throw "Transaction not pending";
            }
            return getPending.Tx;
        } catch (ex) {
            throw new Error("RPC.getPendingTransaction\r\n" + String(ex));
        }
    }

    /**
     * Get block height of a transaction
     * @param {hex} txHash
     * @throws Block height not found
     * @returns {number} Block height
     */
    async getTxBlockHeight(txHash) {
        try {
            const txHeight = await this.request('get-tx-block-number', { "TxHash": txHash });
            if (!txHeight.BlockHeight) {
                throw "Block height not found";
            }
            return txHeight.BlockHeight;
        } catch (ex) {
            throw new Error("RPC.getTxBlockHeight\r\n" + String(ex));
        }
    }

    /**
     * Poll transaction current status
     * @param {hex} txHash
     * @param {number} [countMax = 30] countMax
     * @param {number} [startDelay = 1000] startDelay
     * @param {number} [currCount = 1] currCount
     * @throws Argument txHash cannot be empty
     * @returns {Object} Transaction Status
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

    /**
     * Monitor pending transactions
     * @param {hex} txHash
     * @param {number} [countMax = 30] countMax
     * @param {number} [startDelay = 1000] startDelay
     * @param {number} [currCount = 1] currCount
     * @returns {Boolean} Returns true when a transaction is mined
     */
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
     * @throws No rpc provider
     * @throws No route provided
     * @returns {Object} Response Data
     */
    async request(route, data) {
        try {
            if (!this.Wallet.chainId && this.rpcServer) {
                await this.setProvider(this.rpcServer);
            }
            if (!this.rpcServer) {
                throw "No rpc provider";
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
                    resp = await Api.post(this.rpcServer + route, data, {
                        timeout: this.rpcTimeout,
                        validateStatus: function (status) {
                            return status
                        }
                    });
                } catch (ex) {
                    [attempts, timeout] = await this.backOffRetry(attempts, timeout, String(ex));
                    continue;
                }
                if (!resp || !resp.data || resp.data.error || resp.data.code) {
                    let parsedErr = resp.data ? (resp.data.error || resp.data.message) : "Unable to parse RPC Error Msg";
                    [attempts, timeout] = await this.backOffRetry(attempts, timeout, parsedErr);
                    continue;
                }
                break;
            }
            return resp.data;
        } catch (ex) {
            throw new Error("RPC.request\r\n" + String(ex));
        }
    }

    /**
     * Attempts a request until the timeout is exceeded
     * @param {number} attempts
     * @param {number} timeout
     * @param {string} latestErr
     * @returns {Array<number>} Array containing attempts and timeout 
     */
    async backOffRetry(attempts, timeout, latestErr) {
        try {
            if (attempts >= 5) {
                throw new Error("RPC.backOffRetry\r\nRPC request attempt limit reached\r\nLatest error: " + latestErr);
            }
            if (!attempts) {
                attempts = 1;
            } else {
                attempts++;
            }
            if (!timeout) {
                timeout = 1000;
            } else {
                timeout = Math.floor(timeout * 1.25);
            }
            await this.sleep(timeout);
            return [attempts, timeout];
        } catch (ex) {
            throw new Error("RPC.request\r\n" + String(ex));
        }
    }

    /**
     * Waits for duration in miliseconds
     * @param {number} ms
     * @returns {Promise<void>} A new promise that resolves after the specified miliseconds
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = RPC;