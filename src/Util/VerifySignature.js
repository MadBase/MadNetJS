const BNSignerWrapper = require('../GoWrappers/BNSignerWrapper.js')
const ethUtil = require('ethereumjs-util');
const validator = require('./Validator');

module.exports = {
    BNSignerVerify: async (msg, sig) => {
        try {
            msg = validator.isHex(msg);
            sig = validator.isHex(sig);
            if (!msg || !sig) {
                throw "Bad argument type"
            }
            const validate = await BNSignerWrapper.Verify(String(msg), String(sig));
            return validate;
        }
        catch (ex) {
            throw new Error("BNSigner.verify:" + String(ex));
        }
    },

    SecpSignerVerify: async (msg, sig, pubKey) => {
        try {
            if (!msg || !sig || !pubKey) {
                throw "Bad argument type";
            }
            msg = ethUtil.toBuffer("0x" + String(msg));
            const msgHash = ethUtil.hashPersonalMessage(msg);
            const signature = ethUtil.toBuffer("0x" + String(sig));
            const sigParams = ethUtil.fromRpcSig(signature);
            const publicKeyRecovered = ethUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s).toString("hex");
            console.log({ 
                publicKeyRecovered,
                pubKey
            })
            if (publicKeyRecovered !== pubKey) {
                throw "Public Keys don't match";
            }
            return publicKeyRecovered;
        } catch (ex) {
            throw new Error("SecpSignerVerify:" + String(ex))
        }
    },

    MultiSigVerifyAggregate: async (msg, sig) => {
        try {
            sig = validator.isHex(sig);
            const aSig = await module.exports.BNSignerVerify(msg, sig)
            return aSig;
        }
        catch (ex) {
            throw new Error("MultiSigVerifyAggregate:" + String(ex));
        }
    },

    MultiSigVerifyAggregateSingle: async (msg, groupPubKey, sig) => {
        try {
            sig = validator.isHex(sig);
            const aSig = await BNSignerWrapper.AggregateVerifySingle(msg, groupPubKey, sig)
            return aSig;
        }
        catch (ex) {
            throw new Error("MultiSigVerifyAggregateSingle:" + String(ex));
        }
    }
}