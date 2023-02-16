import * as BNSignerWrapper from "../GoWrappers/BNSignerWrapper";
import { keccak256 } from "ethereumjs-util";
import { isHex } from "../Util/Validator";
import { BNSignerVerify } from "../Util/VerifySignature";

/**
 * BNSigner
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {Array} multiSig - MultiSig instance
 * @property {hex} privK - Public Key
 */
export default class BNSigner {
    Wallet: any; // TODO: Wallet type
    privK: string | boolean;
    multiSig: any;

    /**
     * Creates an instance of BNSigner.
     * @param {Object} Wallet - Circular wallet reference to use internally of Account class
     * @param {Object} multiSig - (Parameter currently unused)
     * @param {hex} privK - Private Key
     */
    constructor(
        wallet: any /* TODO: Wallet type */,
        privK?: string | boolean,
        multiSig?: any
    ) {
        this.Wallet = wallet;
        this.multiSig = multiSig;
        this.privK = privK ? isHex(privK) : false;
    }

    /**
     * Sign a message
     * @param {hex} msg
     * @throws Bad argument type
     * @throws Private key not set
     * @returns {hex} Signed message
     */
    async sign(msg: string) {
        try {
            if (!isHex(msg)) throw "Bad argument type";
            if (!this.privK) throw "Private key not set";

            let sig = await BNSignerWrapper.Sign(msg, this.privK);

            await this.verify(msg, sig);

            return sig;
        } catch (ex) {
            throw new Error("BNSigner.sign\r\n" + String(ex));
        }
    }

    /**
     * Sign multiple messages
     * @param {Array<hex>} msgs
     * @returns {Array<hex>} Signed messages
     */
    async signMulti(msgs: string[]) {
        try {
            let signed = [];

            for (let i = 0; i < msgs.length; i++) {
                const sig = await this.sign(msgs[i]);
                signed.push(sig);
            }

            return signed;
        } catch (ex) {
            throw new Error("BNSigner.signMulti\r\n" + String(ex));
        }
    }

    /**
     * Verify signature
     * @param {hex} msg
     * @param {hex} sig
     * @returns {hex} Verified Signature
     */
    async verify(msg: string, sig: string) {
        try {
            return await BNSignerVerify(msg, sig);
        } catch (ex) {
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
            if (!this.privK) throw "Private key not set";

            return await BNSignerWrapper.GetPubK(this.privK);
        } catch (ex) {
            throw new Error("BNSigner.getPubK\r\n" + String(ex));
        }
    }

    /**
     * Get the public key from a signature
     * @param {hex} sig
     * @throws Bad argument type
     * @returns {hex} Public key
     */
    async pubFromSig(sig: string) {
        try {
            if (!isHex(sig)) throw "Bad argument type";

            return await BNSignerWrapper.PubFromSig(sig);
        } catch (ex) {
            throw new Error("BNSigner.pubFromSig\r\n" + String(ex));
        }
    }

    /**
     *  Public key to a BN address
     * @param {hex} address
     * @returns {hex} Address
     */
    async getAddress(pubK: string | undefined) {
        try {
            pubK = pubK || (await this.getPubK());

            const pubHash = keccak256(
                Buffer.from(pubK, "hex").slice(1)
            );

            return pubHash.slice(12).toString("hex");
        } catch (ex) {
            throw new Error("MultiSigner.bnPubToAddres\r\n" + String(ex));
        }
    }
}
