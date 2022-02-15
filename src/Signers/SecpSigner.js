const ethUtil = require('ethereumjs-util');
const { ecdsaSign } = require('ethereum-cryptography/secp256k1')
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
     *
     * Verify a signature
     * @param {hex} msg
     * @param {hex} sig
     * @return {hex} public key 
     */
    async verify(msg, sig) {
        try {
            msg = this.Wallet.Utils.isHex(msg);
            sig = this.Wallet.Utils.isHex(sig);
            if (!msg || !sig) {
                throw "Bad argument type";
            }
            msg = ethUtil.toBuffer("0x" + String(msg));
            // TODO Check if this is needed
            // sig = ethUtil.toBuffer("0x" + String(sig));
            let msgHash = ethUtil.hashPersonalMessage(msg);
            let signature = ethUtil.toBuffer(sig);
            let sigParams = ethUtil.fromRpcSig(signature);
            let publicKeyRecovered = ethUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s);
            let validate = await this.getPubK();
            if (publicKeyRecovered != validate) {
                throw "Public Keys don't match";
            }
            return publicKeyRecovered;
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