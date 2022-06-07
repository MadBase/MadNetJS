import BNSignerWrapper from '../GoWrappers/BNSignerWrapper.cjs';
import ethUtil from 'ethereumjs-util';
import validator from './Validator.js';

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
            msg = ethUtil.toBuffer("0x" + String(msg));
            const msgHash = ethUtil.keccak256(msg);
            const signature = ethUtil.toBuffer("0x" + String(sig));
            const sigParams = ethUtil.fromRpcSig(signature);
            const publicKeyRecovered = ethUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s).toString("hex");
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
            return BNSignerVerify(msg, sig);
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
};