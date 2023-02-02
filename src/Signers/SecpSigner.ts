import { keccak256, privateToPublic, pubToAddress } from "ethereumjs-util";
import { isHex } from "../Util/Validator";
import pkg from "secp256k1";
const { ecdsaSign, ecdsaRecover } = pkg;

/**
 * SECP256k1 signer
 * @class
 * @property {Wallet} Wallet - Circular Wallet reference
 * @property {hex} privK - Private Key
 */
export default class SecpSigner {
    Wallet: any; // TODO: Wallet type
    privK: string;

    /**
     * Creates an instance of SecpSigner.
     * @param {Object} Wallet - Circular wallet reference to use internally of Account class
     * @param {hex} privK - Private Key
     */
    constructor(Wallet: any /* TODO: Wallet type */, privK: string) {
        this.Wallet = Wallet;
        this.privK = isHex(privK);
    }

    /**
     * Sign a message
     * @param {hex} msg
     * @throws Bad argument type
     * @throws Private key not set
     * @returns {hex} Signature
     */
    async sign(msg: string): Promise<string> {
        try {
            if (!isHex(msg)) throw "Bad argument type";
            if (!this.privK) throw "Private key not set";

            const msgBuffer = keccak256(Buffer.from(msg, "hex"));
            const privK = Buffer.from(this.privK, "hex");
            const signature = ecdsaSign(msgBuffer, privK);

            // Add recid byte to end (v)
            return (
                Buffer.from(signature.signature).toString("hex") +
                Buffer.from(String(signature.recid)).toString().padStart(2, "0")
            );
        } catch (ex) {
            throw new Error("SecpSigner.sign\r\n" + String(ex));
        }
    }

    /**
     * Sign multiple messages
     * @param {Array<hex>} msgs
     * @returns {Array<hex>} Signed messages
     */
    async signMulti(msgs: string[]): Promise<string[]> {
        try {
            let signed: string[] = [];

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
     * Verify a signature
     * @param {hex} msg
     * @param {hex} sig
     * @throws Bad argument type
     * @throws Public Keys don't match
     * @returns {hex} Recovered Public Key
     */
    async verify(msg: string, sig: string): Promise<Uint8Array> {
        try {
            if (!isHex(msg) || !isHex(sig))
                throw "Bad argument type";
            // Get and parse recid from last byte of passed hexadecimal signature from this.sign() method
            const recidByteString = sig.slice(sig.length - 2);

            const recid = parseInt(
                Buffer.from(recidByteString, "hex").toString("hex"),
                16
            );

            // Split off last byte (recidByte) from hexadecimal signature
            sig = sig.slice(0, sig.length - 2);

            // Get buffer represenation of msg, and hash as keccak256, just as sign() does
            const msgBuffer = keccak256(Buffer.from(msg, "hex"));

            // Get msg and sig as Uint8Arrays for ecdsaRecover
            const uint8Msg = Uint8Array.from(msgBuffer);
            const uint8Sig = Uint8Array.from(Buffer.from(sig, "hex"));

            // Request recovered pubkey with sig, recid, and msg -- Do not use compressed key
            let recoveredPubKey = ecdsaRecover(
                uint8Sig,
                recid,
                uint8Msg,
                false
            );

            // Strip out 04 from beginning that signifies non-compressed form and parse as hex
            recoveredPubKey = recoveredPubKey.slice(1); // Only 1 for 1st byte, as this is a uint8Array

            // Convert to hex string
            const recoveredPubKeyHex =
                Buffer.from(recoveredPubKey).toString("hex");

            // Fetch the publickey for the associated account to compare against
            const accountPubKey = await this.getPubK();

            // Verify associated public key === recovered ecdsa key
            if (accountPubKey !== recoveredPubKeyHex) {
                throw "Public Keys don't match";
            }

            return recoveredPubKey;
        } catch (ex) {
            throw new Error("SecpSigner.verify\r\n" + String(ex));
        }
    }

    /**
     * Get the public key from the private key
     * @throws Private key not set
     * @returns {hex} Public Key
     */
    async getPubK(): Promise<string> {
        try {
            if (!this.privK) throw "Private key not set";

            const pubKey = privateToPublic(
                Buffer.from(this.privK, "hex")
            );

            return pubKey.toString("hex");
        } catch (ex) {
            throw new Error("SecpSigner.getPubK\r\n" + String(ex));
        }
    }

    /**
     * Public key to Ethereum Address
     * @returns {hex} Address
     */
    async getAddress(): Promise<Buffer | string> {
        try {
            const pubK = Buffer.from(await this.getPubK(), "hex");

            if (pubK.length === 32) return pubK.slice(12);

            return pubToAddress(pubK).toString("hex");
        } catch (ex) {
            throw new Error("MultiSigner.getAddress\r\n" + String(ex));
        }
    }
}
