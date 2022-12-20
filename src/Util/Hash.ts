import validator from './Validator';
import ethUtil from 'ethereumjs-util';

export default {
    hash: (msg) => {
        try {
            if(!msg) {
                throw "Argument msg cannot be empty.";
            }
            const msgBuffer = Buffer.from(validator.isHex(msg), "hex");
            const msgHash = ethUtil.keccak256(msgBuffer);
            return msgHash.toString("hex");
        }
        catch (ex) {
            throw new Error("MultiSigner.hash\r\n" + String(ex));
        }
    }
}
