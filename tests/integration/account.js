require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");
const { tryIt } = require('../tryIt.js');

describe('Integration/Account:', () => {
    let privateKey, madWallet, wrongAccountAddress;
    
    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        madWallet = new MadWalletJS(42, process.env.RPC);
        wrongAccountAddress = "0xc2f89cbbcdcc7477442e7250445f0fdb3238259b";
        await madWallet.Account.addAccount(privateKey, 1);
    });

    describe('UTXOs', () => {
        it('Fail: Get UTXO', async () => {
            // NOTE: this is the same error as below
            // tryIt( async () => { await madWallet.Account._getAccountUTXOs(wrongAccountAddress, 0) })
            await expect(
                madWallet.Account._getAccountUTXOs(wrongAccountAddress, 0)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Get Account UTXO by ids', async () => {
            // NOTE: this is the same error as above
            // tryIt( async () => { await madWallet.Account._getAccountUTXOsByIds(wrongAccountAddress, 1) })
            await expect(
                madWallet.Account._getAccountUTXOsByIds(wrongAccountAddress, 1)
            ).to.eventually.be.rejectedWith(Error);
        });
    });

    describe('Value Stores', () => {
        it('Fail: Get account value stores', async () => {
            // tryIt( async () => {
            //     let res = await madWallet.Account._getAccountUTXOsByIds(wrongAccountAddress, 1)
            //     console.log(res);
            // }) 
            await expect(
                madWallet.Account._getAccountValueStores(null, 0)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Get account value stores', async () => {
            // tryIt( async () => {
            //     let res = await madWallet.Account._getAccountValueStores(madWallet.Account.accounts[0]["address"], 0)
            //     console.log(res)
            // })
            await expect(
                madWallet.Account._getAccountValueStores(madWallet.Account.accounts[0]["address"], 0)
            ).to.eventually.be.fulfilled;
        });
    });
});
