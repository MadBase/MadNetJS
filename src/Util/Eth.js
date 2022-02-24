module.exports = {
    hexToUint256Array: (hex) => {
        try {
            if (hex.startsWith("0x")) {
                hex = hex.slice(2);
            }
            if (hex.length % 64 != 0) {
                throw "Invalid length";
            }
            let uint256 = [];
            for (let i = 0; i < hex.length; i += 64) {
                uint256.push(BigInt("0x" + hex.slice(i, i + 64)).toString());
            }
            return uint256;
        }
        catch (ex) {
            throw new Error("hexToUint256Array: ", ex)
        }
    },
    removePubFromSig: (sig) => {
        try {
            return sig.slice(sig.length - 128);
        }
        catch(ex) {
            throw new Error("removePubFromSig: ", sig)
        }
    }
}
