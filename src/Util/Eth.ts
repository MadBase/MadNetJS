import { PublicKey, Uint256Array } from "../types/Types";

module.exports = {
    /**
     * Convert a hexadecimal string to a collection of 256 Bit Integers returned as an Array
     * If a single 64 Byte Hexadecimal string is passed an array of length 1 will be returned with the uint256 at index 0.
     * Larger hexadecimal groupings will be split into 256 Bit Integer sets
     * @param hex - The hexadecimal string to convert to a Uint256Array
     * @returns { Uint256Array }
     */
    hexToUint256Array: (hex: string): Uint256Array => {
        try {
            if (hex.startsWith("0x")) {
                hex = hex.slice(2);
            }
            if (hex.length % 64 !== 0) {
                throw "Invalid length";
            }
            let uint256: Uint256Array = [];
            for (let i = 0; i < hex.length; i += 64) {
                uint256.push(BigInt("0x" + hex.slice(i, i + 64)).toString());
            }
            return uint256;
        }
        catch (ex) {
            throw new Error("hexToUint256Array: " + ex);
        }
    },
    /**
     * Extracts the public key from a given signature
     * @param sig - The signature to extract the PublicKey from
     * @returns { PublicKey }
     */
    removePubFromSig: (sig: string): PublicKey => {
        try {
            return sig.slice(sig.length - 128);
        }
        catch(ex) {
            throw new Error("removePubFromSig: " + ex);
        }
    }
}
