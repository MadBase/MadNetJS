const ethUtil = require('ethereumjs-util');
const { ecdsaSign, ecdsaRecover } = require('ethereum-cryptography/secp256k1');
/**
 * SECP256k1 signer
 * @class SecpSigner
 */
class SecpSigner {
    /**
     * Creates an instance of SecpSigner.
     * @param {hex} privK
     */
    constructor(Wallet, privK) {
        this.Wallet = Wallet;
        this.privK = this.Wallet.Utils.isHex(privK);
    }

    /**
     * Sign a message
     * @param {hex} msg
     * @return {hex} signature 
     */
    async sign(msg) {
        try {
            msg = this.Wallet.Utils.isHex(msg);
            if (!msg) {
                throw "Bad argument type";
            }
            if (!this.privK) {
                throw "Private key not set";
            }
            msg = Buffer.from(msg, "hex")
            msg = ethUtil.keccak256(msg)
            let privK = Buffer.from(this.privK, "hex")
            let sig = ecdsaSign(msg, privK)
            sig = {
                r: Buffer.from(sig.signature.slice(0, 32)),
                s: Buffer.from(sig.signature.slice(32, 64)),
                v: Buffer.from(Buffer.from(new Uint8Array([sig.recid]).buffer), "hex"),
            }
            let signature = Buffer.concat([sig.r, sig.s, sig.v]).toString("hex");
            return signature;
        }
        catch (ex) {
            throw new Error("SecpSigner.sign: " + String(ex));
        }
    }

    /**
     * 
     * @param {hex} msgs 
     * @returns {Array.hex} signedMsgs
     */
    async signMulti(msgs) {
        try {
            let signed = [];
            for (let i = 0; i < msgs.length; i++) {
                let sig = await this.sign(msgs[i])
                signed.push(sig)
            }
            return signed;
        }
        catch (ex) {
            throw new Error("BNSigner.signMulti: " + String(ex));
        }
    }

    /**
     *
     * Verify a signature
     * @param {hex} msg
     * @param {hex} sig
     * @return {hex} Recovered Public Key 
     */
    async verify(msg, sig) {
        try {
            msg = this.Wallet.Utils.isHex(msg);
            sig = this.Wallet.Utils.isHex(sig);
            if (!msg || !sig) {
                throw "Bad argument type";
            }
            // Get and parse recid from last byte of passed hexadecimal signature from this.sign() method 
            let recidByteString = sig.slice(sig.length - 2);
            let recid = parseInt(Buffer.from(recidByteString, 'hex').toString('hex'), 16);
            // Split off last byte (recidByte) from hexadecimal signature
            sig = sig.slice(0, sig.length - 2);
            // Get buffer represenation of msg, and hash as keccak256, just as sign() does
            msg = ethUtil.keccak256(Buffer.from(msg, 'hex'))
            // Get msg and sig as Uint8Arrays for ecdsaRecover
            let uint8Msg = Uint8Array.from(msg);
            let uint8Sig = Uint8Array.from(Buffer.from(sig, 'hex'));
            // Request recovered pubkey with sig, recid, and msg -- Do not use compressed key
            let recoveredPubKey = ecdsaRecover(uint8Sig, recid, uint8Msg, false);
            // Strip out 04 from beginning that signifies non-compressed form and parse as hex
            recoveredPubKey = recoveredPubKey.slice(1); // Only 1 for 1st byte, as this is a uint8Array
            recoveredPubKey = Buffer.from(recoveredPubKey).toString('hex');
            // Fetch the publickey for the associated account to compare against
            let accountPubKey = await this.getPubK();
            // Verify associated public key === recovered ecdsa key
            if (accountPubKey !== recoveredPubKey) {
                throw "Public Keys don't match";
            }
            return recoveredPubKey;
        }
        catch (ex) {
            throw new Error("SecpSigner.verify: " + String(ex));
        }
    }

    /**
     * Get the public key from the private key
     * @return {hex} 
     */
    async getPubK() {
        try {
            if (!this.privK) {
                throw "Private key not set";
            }
            let pubKey = ethUtil.privateToPublic(Buffer.from(this.privK, "hex"));
            return pubKey.toString("hex");
        }
        catch (ex) {
            throw new Error("SecpSigner.getPubK: " + String(ex));
        }
    }

    /**
     * Public key to Ethereum Address
     * @param {hex} pubK
     * @return {hex} address
     */
    async getAddress() {
        try {
            let pubK = await this.getPubK();
            pubK = Buffer.from(pubK, "hex");
            if (pubK.length === 32) {
                return pubK.slice(12);
            }
            let address = ethUtil.pubToAddress(pubK);
            return address.toString("hex");
        }
        catch (ex) {
            throw new Error("MultiSigner.getAddress: " + String(ex));
        }
    }

}
module.exports = SecpSigner;