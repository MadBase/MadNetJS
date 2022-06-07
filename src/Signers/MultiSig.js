const BNSignerWrapper = require('../GoWrappers/BNSignerWrapper.js');
/**
 * MultiSig
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {Object} bnSigner - Signer
 * @property {Array} publicKeys - Public Keys
 */
class MultiSig {
    /**
     * Creates an instance of MultiSig.
     * @param {Object} Wallet - Circular wallet reference to use internally of Account class 
     * @param {Object} signer - Signer instance
     */
    constructor(Wallet, bnSigner) {
        this.Wallet = Wallet;
        this.bnSigner = bnSigner;
        this.publicKeys = [];
    }

    /**
     * Add public keys
     * @param {Array<hex>} publicKeys 
     * @throws Need public keys
     * @returns {hex} publicKey
     */
    async addPublicKeys(publicKeys) {
        try {
            if (!publicKeys || publicKeys.length == 0) {
                throw "Need public keys"
            }
            this.publicKeys = this.publicKeys.concat(publicKeys)
            let pub = await BNSignerWrapper.AggregatePublicKeys(publicKeys)
            this.publicKey = pub;
            return pub;
        }
        catch (ex) {
            throw new Error("BNAggregate.addPublicKeys\r\n" + String(ex));
        }
    }

    /**
     * Get the multsig public key
     * @throws Need public keys
     * @returns {hex} Public Key
     */
    async getPubK() {
        try {
            if (!this.publicKeys || this.publicKeys.length == 0) {
                throw "Need public keys"
            }
            let pub = await BNSignerWrapper.AggregatePublicKeys(this.publicKeys)
            return pub;
        }
        catch (ex) {
            throw new Error("BNAggregate.getPubK" + String(ex));
        }
    }

    /**
     * Get the multisig address
     * @throws Need public keys
     * @returns {hex} address
     */
    async getAddress() {
        try {
            if (!this.publicKeys || this.publicKeys.length == 0) {
                throw "Need public keys"
            }
            let pubKey = await this.getPubK();
            let pub = await this.bnSigner.getAddress(pubKey)
            return pub;
        }
        catch (ex) {
            throw new Error("BNAggregate.getAddress" + String(ex));
        }
    }

    /**
     * Sign a message
     * @param {hex} rawMsg
     * @throws Missing input
     * @returns {hex} signature
     */
    async sign(rawMsg, groupPubKey = false) {
        try {
            if (!rawMsg) {
                throw "Missing input";
            }
            if (!groupPubKey) {
                groupPubKey = await this.getPubK()
            }
            let sig = await BNSignerWrapper.AggregateSign(rawMsg, groupPubKey, this.bnSigner.privK);
            await this.verifyAggregateSingle(rawMsg, groupPubKey, sig);
            return sig;
        }
        catch (ex) {
            throw new Error("BNAggregate.sign\r\n" + String(ex));
        }
    }

    /**
     * Sign multiple messages
     * @param {hex} rawMsg
     * @returns {hex} signature
     */
    async signMulti(rawMsgs, groupPubKey = false) {
        try {
            let signedMsgs = [];
            for (let i = 0; i < rawMsgs.length; i++) {
                let sig = await this.sign(rawMsgs[i], groupPubKey)
                signedMsgs.push(sig)
            }
            return signedMsgs;
        }
        catch (ex) {
            throw new Error("BNAggregate.aggregateMulti\r\n" + String(ex));
        }
    }

    /**
     * Aggregate signatures from multiple parties
     * @param {Array<hex>} signature
     * @returns {Array<hex>} signature
     */
    async aggregateSignatures(signatures) {
        try {
            let sig = await BNSignerWrapper.AggregateSignatures(signatures)
            return sig;
        }
        catch (ex) {
            throw new Error("BNAggregate.signatures\r\n" + String(ex));
        }
    }

    /**
     * Aggregate multiple signatures
     * @param {Array<hex>} signatures Array<hex>
     * @returns {Array}
     */
    async aggregateSignaturesMulti(signatures) {
        console.log(signatures)
        try {
            let signed = [];
            for (let i = 0; i < signatures.length; i++) {
                let sig = await this.aggregateSignatures(signatures[i])
                signed.push(sig)
            }
            return signed;
        }
        catch (ex) {
            throw new Error("BNAggregate.signaturesMulti\r\n" + String(ex));
        }
    }

    /**
     * Verify aggregate signature
     * @param {hex} msg 
     * @param {hex} sig 
     * @returns {hex} 
     */
    async verifyAggregate(msg, sig) {
        try {
            const signature = await this.Wallet.Utils.MultiSigVerifyAggregate(msg,sig);
            return signature;
        }
        catch (ex) {
            throw new Error("BNAggregate.verifyAggregateSingle\r\n" + String(ex));
        }
    }

    /**
     * Verify a solo signed aggregated message 
     * @param {hex} msg 
     * @param {hex} sig 
     * @returns {hex} signature
     */
    async verifyAggregateSingle(msg, groupPubKey, sig) {
        try {
            const signature = await this.Wallet.Utils.MultiSigVerifyAggregateSingle(msg, groupPubKey, sig);
            return signature;
        }
        catch (ex) {
            throw new Error("BNAggregate.verifyAggregateSingle\r\n" + String(ex));
        }
    }
}
module.exports = MultiSig;