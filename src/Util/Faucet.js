require('dotenv').config({ path: process.cwd() + '/.env' });
const { default: Axios } = require('axios');
const Validator = require('../../src/Util/Validator');
const FAUCET_SERVER = process.env.FAUCET_API_URL;

/**
 * Basic utilities for Faucet requests.
 * @module Faucet
 */
module.exports = {
    /**
     * Request funds for an address on Testnet only. This function does not provide funds on Mainnet. 
     * @param {hex} address - Address to be funded
     * @param {number} curve - Secp or BN curve
     * @returns {object}
     */
    requestTestnetFunds: async (address, curve) => {
        try {
            if (!address || !curve) {
                throw "Arguments cannot be empty";
            }
            const validAddress = Validator.isAddress(address);
            // TODO - Add curve to faucet request
            const validCurve = Validator.isCurve(curve);
            const res = await Axios.get(FAUCET_SERVER + "/faucet/" + validAddress);
            if (res.error) { 
                throw new Error(res.error); 
            }
            return res.data;
        }
        catch (ex) {
            throw new Error("Faucet.requestTestnetFunds:" + String(ex));
        }
    },
}