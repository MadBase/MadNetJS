import validator from './Validator';
import { keccak256 } from "ethereumjs-util";


export default {
    hash: (msg) => {
        try {
            if(!msg) {
                throw "Argument msg cannot be empty.";
            }
            const msgBuffer = Buffer.from(validator.isHex(msg), "hex");
            const msgHash = keccak256(msgBuffer);
            return msgHash.toString("hex");
        }
        catch (ex) {
            throw new Error("MultiSigner.hash\r\n" + String(ex));
        }
    }
}
