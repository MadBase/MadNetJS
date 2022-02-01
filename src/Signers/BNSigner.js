const BNSignerWrapper = require('../GoWrappers/BNSignerWrapper.js')
const ethUtil = require('ethereumjs-util');
/**
 * BNSigner
 * @class BNSigner
 */
class BNSigner {
    /**
     * Creates an instance of BNSigner.
     * @param {hex} privK
     */
    constructor(Wallet, privK, multiSig) {
        this.Wallet = Wallet;
        this.multiSig = multiSig
        this.privK = privK ? this.Wallet.Utils.isHex(privK) : false;
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
            let sig = await BNSignerWrapper.Sign(String(msg), String(this.privK));
            await this.verify(msg, sig);
            return sig;
        }
        catch (ex) {
            throw new Error("BNSigner.sign: " + String(ex));
        }
    }

    /**
    * 
    * @param {hex} msgs 
    * @returns 
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
     * Verify signature
     * @param {hex} msg
     * @param {hex} sig
     * @return {hex} public key
     */
    async verify(msg, sig) {
        try {
            msg = this.Wallet.Utils.isHex(msg);
            sig = this.Wallet.Utils.isHex(sig);
            if (!msg || !sig) {
                throw "Bad argument type"
            }
            let validate = await BNSignerWrapper.Verify(String(msg), String(sig));
            return validate;
        }
        catch (ex) {
            throw new Error("BNSigner.verify: " + String(ex));
        }
    }


    /**
     * Get public key from the private key
     * @return {hex} public key 
     */
    async getPubK() {
        try {
            if (!this.privK) {
                throw "Private key not set";
            }
            let pubK = await BNSignerWrapper.GetPubK(String(this.privK));
            return pubK;
        }
        catch (ex) {
            throw new Error("BNSigner.getPubK: " + String(ex));
        }
    }

    /**
     * Get the public key from a signature
     * @param {hex} sig
     * @return {hex} public key
     */
    async pubFromSig(sig) {
        try {
            sig = this.Wallet.Utils.isHex(sig);
            if (!sig) {
                throw "Bad argument type"
            }
            let pubK = await BNSignerWrapper.PubFromSig(String(sig));
            return pubK;
        }
        catch (ex) {
            throw new Error("BNSigner.pubFromSig: " + String(ex));
        }
    }

    /**
    *  Public key to a BN address
    * @return {hex} address 
    */
    async getAddress(pubK) {
        try {
            if (!pubK) {
                pubK = await this.getPubK();
            }
            let pubHash = ethUtil.keccak256(Buffer.from(pubK, "hex").slice(1));
            let address = pubHash.slice(12);
            return address.toString("hex");
        }
        catch (ex) {
            throw new Error("MultiSigner.bnPubToAddres: " + String(ex));
        }
    }

}
module.exports = BNSigner;
