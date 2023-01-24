import { HexData, PublicKey } from "../types/Types";
import ethUtil from "ethereumjs-util";
import { isHex } from "./Validator";

const BNSignerWrapper = require("../GoWrappers/BNSignerWrapper.js");

/**
 * Verify a msg was signed with a BN Elliptic Curve -- This Will fail if message was signed with a secp256k1 or other EC
 * @param {HexData} msg - The message to verify that was signed by sig
 * @param {HexData} sig - The signature to verify the msg
 * @returns
 */
export const BNSignerVerify = async (msg: HexData, sig: HexData) => {
    try {
        if (!msg || !sig) {
            throw "Arguments cannot be empty";
        }
        msg = isHex(msg);
        sig = isHex(sig);
        const verifiedSignature = await BNSignerWrapper.Verify(
            String(msg),
            String(sig)
        );
        return verifiedSignature;
    } catch (ex) {
        throw new Error("BNSigner.verify:" + String(ex));
    }
};

/**
 * Verify a msg was signed with a secp256k1 Elliptic Curve -- This Will fail if message was signed with a BN or other EC
 * @param {HexData} msg - The message to verify that was signed by sig
 * @param {HexData} sig - The signature to verify the msg
 * @param {HexData} pubKey - Public key of the private key used to sign msg
 * @returns {HexData} - Verified Signature
 */
export const SecpSignerVerify = async (
    msg: HexData,
    sig: HexData,
    pubKey: PublicKey
) => {
    try {
        if (!msg || !sig || !pubKey) {
            throw "Arguments cannot be empty";
        }
        msg = isHex(msg);
        sig = isHex(sig);
        msg = ethUtil.toBuffer("0x" + String(msg));
        const msgHash = ethUtil.keccak256(msg);
        const signature = ethUtil.toBuffer("0x" + String(sig));
        const sigParams = ethUtil.fromRpcSig(signature);
        const publicKeyRecovered = ethUtil
            .ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s)
            .toString("hex");
        if (publicKeyRecovered !== pubKey) {
            throw "Public Keys don't match";
        }
        return publicKeyRecovered;
    } catch (ex) {
        throw new Error("SecpSignerVerify:" + String(ex));
    }
};

/**
 * Verify that an aggregated group signatured (sig) signed a message (msg)
 * @param {HexData} msg
 * @param {HexData} sig
 * @returns {HexData} verified signature
 */
export const MultiSigVerifyAggregate = async (msg, sig) => {
    try {
        return module.exports.BNSignerVerify(msg, sig);
    } catch (ex) {
        throw new Error("MultiSigVerifyAggregate:" + String(ex));
    }
};

/**
 * Verify that a message (msg) was signed by an aggregate signing groups member X by using X's
 * solo signature (sig) and the group public key (groupPubKey)
 * @param {HexData} msg - The msg to verify
 * @param {HexData} groupPubKey - The public group key
 * @param {HexData} sig - The signature of msg by group member X
 * @returns
 */
export const MultiSigVerifyAggregateSingle = async (
    msg: HexData,
    groupPubKey: HexData,
    sig: HexData
) => {
    try {
        sig = isHex(sig);
        const verifiedSignature = await BNSignerWrapper.AggregateVerifySingle(
            msg,
            groupPubKey,
            sig
        );
        return verifiedSignature;
    } catch (ex) {
        throw new Error("MultiSigVerifyAggregateSingle:" + String(ex));
    }
};

export default {
    BNSignerVerify,
    SecpSignerVerify,
    MultiSigVerifyAggregate,
    MultiSigVerifyAggregateSingle,
};
