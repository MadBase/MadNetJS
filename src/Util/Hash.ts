import { Keccak256Hash } from "../types/Types";

const validator = require('./Validator');
const ethUtil = require('ethereumjs-util');

module.exports = {
    /**
     * Returns a keccak256 hash string of the given msg
     * @param msg - Msg to get the keccask256 hash from
     * @returns {Keccak256Hash}
     */
    hash: (msg: string): Keccak256Hash => {
        try {
            if(!msg) {
                throw "Argument msg cannot be empty.";
            }
            const msgBuffer: Buffer = Buffer.from(validator.isHex(msg), "hex");
            const msgHash: Buffer = ethUtil.keccak256(msgBuffer);
            return msgHash.toString("hex");
        }
        catch (ex) {
            throw new Error("MultiSigner.hash\r\n" + String(ex));
        }
    }
}
