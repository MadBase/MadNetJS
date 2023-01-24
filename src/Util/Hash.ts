import { Keccak256Hash } from "../types/Types";
import ethUtil from "ethereumjs-util";
import { isHex } from "./Validator";

/**
 * Returns a keccak256 hash string of the given msg
 * @param msg - Msg to get the keccask256 hash from
 * @returns {Keccak256Hash}
 */
export const hash = (msg: string): Keccak256Hash => {
    try {
        if (!msg) {
            throw "Argument msg cannot be empty.";
        }
        const msgBuffer: Buffer = Buffer.from(isHex(msg), "hex");
        const msgHash: Buffer = ethUtil.keccak256(msgBuffer);
        return msgHash.toString("hex");
    } catch (ex) {
        throw new Error("MultiSigner.hash\r\n" + String(ex));
    }
};

export default {
    hash,
};
