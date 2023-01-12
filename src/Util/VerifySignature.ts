import { HexData, PublicKey } from "../types/Types";
import { toBuffer, keccak256, ecrecover, fromRpcSig } from "ethereumjs-util";

const BNSignerWrapper = require('../GoWrappers/BNSignerWrapper');
const validator = require('./Validator');

module.exports = {
    /**
     * Verify a msg was signed with a BN Elliptic Curve -- This Will fail if message was signed with a secp256k1 or other EC
     * @param {HexData} msg - The message to verify that was signed by sig
     * @param {HexData} sig - The signature to verify the msg
     * @returns
     */
    BNSignerVerify: async (msg: HexData, sig: HexData) => {
        try {
            if (!msg || !sig) {
                throw "Arguments cannot be empty";
            }
            msg = validator.isHex(msg);
            sig = validator.isHex(sig);
            const verifiedSignature = await BNSignerWrapper.Verify(String(msg), String(sig));
            return verifiedSignature;
        }
        catch (ex) {
            throw new Error("BNSigner.verify:" + String(ex));
        }
    },

    /**
     * Verify a msg was signed with a secp256k1 Elliptic Curve -- This Will fail if message was signed with a BN or other EC
     * @param {HexData} msg - The message to verify that was signed by sig
     * @param {HexData} sig - The signature to verify the msg
     * @param {HexData} pubKey - Public key of the private key used to sign msg
     * @returns {HexData} - Verified Signature
     */
    SecpSignerVerify: async (msg:HexData, sig:HexData, pubKey:PublicKey) => {
        try {
            if (!msg || !sig || !pubKey) {
                throw "Arguments cannot be empty";
            }
            msg = validator.isHex(msg);
            sig = validator.isHex(sig);
            msg = toBuffer("0x" + String(msg));
            const msgHash = keccak256(msg);
            const signature = toBuffer("0x" + String(sig)).toString();
            const sigParams = fromRpcSig(signature);
            const publicKeyRecovered = ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s).toString("hex");
            if (publicKeyRecovered !== pubKey) {
                throw "Public Keys don't match";
            }
            return publicKeyRecovered;
        } catch (ex) {
            throw new Error("SecpSignerVerify:" + String(ex));
        }
    },

    /**
     * Verify that an aggregated group signatured (sig) signed a message (msg)
     * @param {HexData} msg
     * @param {HexData} sig
     * @returns {HexData} verified signature
     */
    MultiSigVerifyAggregate: async (msg, sig) => {
        try {
            return module.exports.BNSignerVerify(msg, sig);
        }
        catch (ex) {
            throw new Error("MultiSigVerifyAggregate:" + String(ex));
        }
    },

    /**
     * Verify that a message (msg) was signed by an aggregate signing groups member X by using X's
     * solo signature (sig) and the group public key (groupPubKey)
     * @param {HexData} msg - The msg to verify
     * @param {HexData} groupPubKey - The public group key
     * @param {HexData} sig - The signature of msg by group member X
     * @returns
     */
    MultiSigVerifyAggregateSingle: async (msg: HexData, groupPubKey: HexData, sig: HexData) => {
        try {
            sig = validator.isHex(sig);
            const verifiedSignature = await BNSignerWrapper.AggregateVerifySingle(msg, groupPubKey, sig);
            return verifiedSignature;
        }
        catch (ex) {
            throw new Error("MultiSigVerifyAggregateSingle:" + String(ex));
        }
    }
}
