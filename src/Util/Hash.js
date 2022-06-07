import validator from './Validator.js';
import ethUtil from 'ethereumjs-util';

export default {
    hash: (msg) => {
        try {
            if(!msg) {
                throw "Argument msg cannot be empty.";
            }
            msg = validator.isHex(msg);
            let msgBuffer = Buffer.from(msg, "hex");
            let msgHash = ethUtil.keccak256(msgBuffer);
            return msgHash.toString("hex");
        }
        catch (ex) {
            throw new Error("MultiSigner.hash\r\n" + String(ex));
        }
    }
};