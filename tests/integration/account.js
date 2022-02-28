require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");

describe('Integration/Account:', () => {
    // TODO - Improve test description
    // TODO - Move common var to before hook when possible or to a helper
    let privateKey;
    const madWallet = new MadWalletJS(42, process.env.RPC);
    const wrongAccountAddress = "0xc2f89cbbcdcc7477442e7250445f0fdb3238259b";

    before(async function() {
        if (process.env.PRIVATE_KEY) {
            privateKey = process.env.PRIVATE_KEY;
        }
        else {
            privateKey = "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A";
        }

        await madWallet.Account.addAccount(privateKey, 1);
    });

    describe('UTXOs', () => {
        it('Fail: Get UTXO', async () => {
            await expect(
                madWallet.Account._getAccountUTXOs(wrongAccountAddress, 0)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Get Account UTXO by ids', async () => {
            await expect(
                madWallet.Account._getAccountUTXOsByIds(wrongAccountAddress, 1)
            ).to.eventually.be.rejectedWith(Error);
        });
    });

    describe('Value Stores', () => {
        it('Fail: Get account value stores', async () => {
            await expect(
                madWallet.Account._getAccountValueStores(null, 0)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Get account value stores', async () => {
            await expect(
                madWallet.Account._getAccountValueStores(madWallet.Account.accounts[0]["address"], 0)
            ).to.eventually.be.fulfilled;
        });
    });
});
