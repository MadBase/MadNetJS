const Account = require("./Account.js")
const Transaction = require("./Transaction.js")
const RPC = require("./RPC.js");
const utils = require("./Util");

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
class Wallet {
    /**
     * Creates an instance of Wallet.
     * @param {number} [chainId=1]
     * @param {string} [rpcServer=false]
     */
    constructor(chainId, rpcServer = false) {
        this.chainId = chainId ? utils.isNumber(chainId) : undefined;
        this.Account = new Account(this)
        this.Transaction = new Transaction(this);
        this.Rpc = new RPC(this, rpcServer);
        this.Utils = utils;
    }
}
module.exports = Wallet;