import Account from "./Account";
import Transaction from "./Transaction";
import RPC from "./RPC";
import { isNumber } from "./Util/Validator";
import Util from "./Util";

interface WalletConstructorParams {
    chainId?: number | string | undefined;
    account?: Account;
    transaction?: Transaction;
    rpc?: RPC;
    utils?: any;
    rpcServer?: any;
    rpcTimeout?: any;
}

/**
 * Wallet handler
 * @class
 * @alias module:Wallet
 * @property {Number} chainId - ChainID of the network to be connected to
 * @property {Account} Account - Main Account Handler Instance
 * @property {Transaction} Transaction - Main Transaction Handler Instance
 * @property {RPC} RPC - Main RPC Handler Instance
 * @property {UtilityCollection} Utils - Utility Collection
 */
export default class Wallet {
    chainId: number | string | undefined;
    account: Account;
    transaction: Transaction;
    rpc: RPC;
    utils: any;

    /**
     * Creates an instance of Wallet.
     * @param {WalletType} params
     */
    constructor(...params: WalletConstructorParams[]) {
        const { chainId, rpcServer, rpcTimeout } =
            this._initializeParams(params);

        this.chainId = chainId ? isNumber(chainId) : undefined;
        this.account = new Account(this);
        this.transaction = new Transaction(this);
        this.rpc = new RPC(this, rpcServer, rpcTimeout);
        this.utils = Util;
    }

    /**
     * Initializes Wallet parameters.
     * @param {WalletParams} params - Accepts a chainId and rpcServer arguments for backwards compatibility, a shorthand instancing w/ RPC endpoint only or object Based configuration
     * @returns {Object<WalletType>} Wallet parameters
     */
    _initializeParams(params: WalletConstructorParams[]) {
        let chainId, rpcServer, rpcTimeout;

        // Backwards compatibility catch
        if (params.length === 2) {
            chainId = params[0];
            rpcServer = params[1];
        }

        // Object Based configuration
        if (params.length === 1 && typeof params[0] === "object") {
            chainId = params[0].chainId;
            rpcServer = params[0].rpcServer;
            rpcTimeout = params[0].rpcTimeout;
        }

        // Shorthand instancing w/ RPC only
        if (params.length === 1 && typeof params[0] === "string") {
            rpcServer = params[0];
        }

        if (!rpcServer) {
            console.warn(
                "The RPC requests will not work properly if an endpoint is not provided."
            );
        }

        return {
            chainId,
            rpcServer,
            rpcTimeout,
        };
    }
}
