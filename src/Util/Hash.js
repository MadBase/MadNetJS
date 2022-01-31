const validator = require('./Validator.js')
const ethUtil = require('ethereumjs-util');
module.exports = {
    hash: (msg) => {
        try {
            msg = validator.isHex(msg);
            if(!msg) {
                throw "Bad argument type"
            }
            let msgBuffer = Buffer.from(msg, "hex");
            let msgHash = ethUtil.keccak256(msgBuffer);
            return msgHash.toString("hex")
        }
        catch (ex) {
            throw new Error("MultiSigner.hash: " + String(ex));
        }
    }
}