require('dotenv').config({ path: process.cwd() + '/.env' });
const { default: Axios } = require('axios');
const Validator = require('../../src/Util/Validator');

const faucetServer = process.env.FAUCET_API_URL;
module.exports = {
    requestTestnetFunds: async (address, curve) => {
        try {
            if (!address || !curve) {
                throw "Arguments cannot be empty";
            }
            const validAddress = Validator.isAddress(address);
            const validCurve = Validator.isCurve(curve);
            const res = await Axios.get(faucetServer + "/faucet/" + validAddress);
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