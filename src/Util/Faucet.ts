import { PublicAddress } from "../types/Types";

import Axios from "axios";
import { isAddress } from "./Validator";

/**
 * Basic utilities for Faucet requests.
 * @module Faucet
 */
/**
 * Request funds for an address on Testnet only. This function does not provide funds on Mainnet.
 * @param {hex} address - Address to be funded
 * @param {Boolean} [ isBN = false ] is a BN address
 * @param {string} faucetServer - URL for the faucetServer
 * @param {number} [ timeout = 5000 ] time to wait for a response
 * @returns {object}
 */
export const requestTestnetFunds = async (
    address: PublicAddress,
    isBN: boolean = false,
    faucetServer: string,
    timeout: number = 5000
) => {
    try {
        if (!address || !faucetServer) {
            throw "Arguments address and faucetServer cannot be empty";
        }
        const validAddress = isAddress(address);
        const res: any = await Axios.post( // TODO type any here for tests only
            faucetServer + "/faucet/",
            {
                address: validAddress,
                curve: isBN ? 2 : 1,
            },
            {
                timeout,
            }
        );
        if (res.error) {
            throw new Error(res.error);
        }
        return res.data;
    } catch (ex) {
        throw new Error("Faucet.requestTestnetFunds:" + String(ex));
    }
};

export default {
    requestTestnetFunds,
};
