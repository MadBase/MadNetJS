const ethUtil = require('ethereumjs-util');
const { ecdsaSign, ecdsaRecover } = require('secp256k1');
/**
 * SECP256k1 signer
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {hex} privK - Private Key
 */
class SecpSigner {
    /**
     * Creates an instance of SecpSigner.
     * @param {Object} Wallet - Circular wallet reference to use internally of Account class 
     * @param {hex} privK - Private Key
     */
    constructor(Wallet, privK) {
        this.Wallet = Wallet;
        this.privK = this.Wallet.Utils.isHex(privK);
    }

    /**
     * Sign a message
     * @param {hex} msg
     * @throws Bad argument type
     * @throws Private key not set
     * @returns {hex} Signature 
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
            let signature = ecdsaSign(msg, privK);
            // Add recid byte to end (v)
            signature = Buffer.from(signature.signature).toString('hex') + Buffer.from(String(signature.recid)).toString().padStart(2, "0");
            return signature;
        }
        catch (ex) {
            throw new Error("SecpSigner.sign\r\n" + String(ex));
        }
    }

    /**
     * Sign multiple messages
     * @param {hex} msgs 
     * @returns {Array<hex>} Signed messages
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
            throw new Error("BNSigner.signMulti\r\n" + String(ex));
        }
    }

    /**
     * Verify a signature
     * @param {hex} msg
     * @param {hex} sig
     * @throws Bad argument type
     * @throws Public Keys don't match
     * @returns {hex} Recovered Public Key 
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
            throw new Error("SecpSigner.verify\r\n" + String(ex));
        }
    }

    /**
     * Get the public key from the private key
     * @throws Private key not set
     * @returns {hex} Public Key
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
            throw new Error("SecpSigner.getPubK\r\n" + String(ex));
        }
    }

    /**
     * Public key to Ethereum Address
     * @returns {hex} Address
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
            throw new Error("MultiSigner.getAddress\r\n" + String(ex));
        }
    }

}
module.exports = SecpSigner;
