const BNSignerWrapper = require('../GoWrappers/BNSignerWrapper.js');
const ethUtil = require('ethereumjs-util');
/**
 * BNSigner
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {Array} multiSig - MultiSig instance
 * @property {hex} privK - Public Key
 */
class BNSigner {
    /**
     * Creates an instance of BNSigner.
     * @param {Object} Wallet - Circular wallet reference to use internally of Account class
     * @param {Object} multiSig - (Parameter currently unused)
     * @param {hex} privK - Private Key
     */
    constructor(Wallet, privK, multiSig) {
        this.Wallet = Wallet;
        this.multiSig = multiSig
        this.privK = privK ? this.Wallet.Utils.isHex(privK) : false;
    }

    /**
     * Sign a message
     * @param {hex} msg
     * @throws Bad argument type
     * @throws Private key not set
     * @returns {hex} Signed message
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
            let sig = await BNSignerWrapper.Sign(String(msg), String(this.privK));
            await this.verify(msg, sig);
            return sig;
        }
        catch (ex) {
            throw new Error("BNSigner.sign\r\n" + String(ex));
        }
    }

    /**
    * Sign multiple messages
    * @param {Array<hex>} msgs 
    * @returns {Array<hex>} Signed messages
    */
    async signMulti(msgs) {
        try {
            let signed = [];
            for (let i = 0; i < msgs.length; i++) {
                const sig = await this.sign(msgs[i]);
                signed.push(sig)
            }
            return signed;
        }
        catch (ex) {
            throw new Error("BNSigner.signMulti\r\n" + String(ex));
        }
    }

    /**
     * Verify signature
     * @param {hex} msg
     * @param {hex} sig
     * @returns {hex} Verified Signature
     */
    async verify(msg, sig) {
        try {
            const signature = await this.Wallet.Utils.BNSignerVerify(msg, sig);
            return signature;
        }
        catch (ex) {
            throw new Error("BNSigner.verify\r\n" + String(ex));
        }
    }

    /**
     * Get public key from the private key
     * @throws Private key not set
     * @returns {hex} Public key 
     */
    async getPubK() {
        try {
            if (!this.privK) {
                throw "Private key not set";
            }
            const pubK = await BNSignerWrapper.GetPubK(String(this.privK));
            return pubK;
        }
        catch (ex) {
            throw new Error("BNSigner.getPubK\r\n" + String(ex));
        }
    }

    /**
     * Get the public key from a signature
     * @param {hex} sig
     * @throws Bad argument type
     * @returns {hex} Public key
     */
    async pubFromSig(sig) {
        try {
            sig = this.Wallet.Utils.isHex(sig);
            if (!sig) {
                throw "Bad argument type";
            }
            const pubK = await BNSignerWrapper.PubFromSig(String(sig));
            return pubK;
        }
        catch (ex) {
            throw new Error("BNSigner.pubFromSig\r\n" + String(ex));
        }
    }

    /**
    *  Public key to a BN address
    * @param {hex} address 
    * @returns {hex} Address 
    */
    async getAddress(pubK) {
        try {
            if (!pubK) {
                pubK = await this.getPubK();
            }
            const pubHash = ethUtil.keccak256(Buffer.from(pubK, "hex").slice(1));
            const address = pubHash.slice(12);
            return address.toString("hex");
        }
        catch (ex) {
            throw new Error("MultiSigner.bnPubToAddres\r\n" + String(ex));
        }
    }

}
module.exports = BNSigner;
