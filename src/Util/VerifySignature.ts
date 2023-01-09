import * as BNSignerWrapper from '../GoWrappers/BNSignerWrapper';
import { keccak256, toBuffer, fromRpcSig, ecrecover } from "ethereumjs-util";
import validator from './Validator';

export default {
    BNSignerVerify: async (msg, sig) => {
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

    SecpSignerVerify: async (msg, sig, pubKey) => {
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

    MultiSigVerifyAggregate: async (msg, sig) => {
        try {
            return module.exports.BNSignerVerify(msg, sig);
        }
        catch (ex) {
            throw new Error("MultiSigVerifyAggregate:" + String(ex));
        }
    },

    MultiSigVerifyAggregateSingle: async (msg, groupPubKey, sig) => {
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
