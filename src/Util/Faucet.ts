import Axios from 'axios';
import Validator from '../../src/Util/Validator';

/**
 * Basic utilities for Faucet requests.
 * @module Faucet
 */
export default {
    /**
     * Request funds for an address on Testnet only. This function does not provide funds on Mainnet.
     * @param {hex} address - Address to be funded
     * @param {Boolean} [ isBN = false ] isBN - BN address
     * @param {number} [ timeout = 5000 ] time to wait for a response
     * @returns {object}
     */
    requestTestnetFunds: async (address?: string, isBN: boolean = false, faucetServer?: string, timeout: any = 5000) => {
        try {
            if (!address || !faucetServer) {
                throw "Arguments address and faucetServer cannot be empty";
            }
            const validAddress = Validator.isAddress(address);
            const res: any = await Axios.post(faucetServer + "/faucet/", {
                address: validAddress,
                curve: isBN ? 2 : 1
            },{
                timeout
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
