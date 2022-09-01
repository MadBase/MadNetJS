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
     * @param {Boolean} [ isBN = false ] isBN - BN address
     * @returns {object}
     */
    requestTestnetFunds: async (address, isBN = false) => {
        try {
            if (!address) {
                throw "Arguments cannot be empty";
            }
            const validAddress = Validator.isAddress(address);
            const res = await Axios.post(FAUCET_SERVER + "/faucet/", {
                address: validAddress,
                curve: isBN ? 2 : 1
            });
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