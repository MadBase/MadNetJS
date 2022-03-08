require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");

describe('Integration/Account:', () => {
    let privateKey, madWallet, wrongAccountAddress;
    
    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        madWallet = new MadWalletJS(42, process.env.RPC);
        wrongAccountAddress = "0xc2f89cbbcdcc7477442e7250445f0fdb3238259b";
        await madWallet.Account.addAccount(privateKey, 1);
    });

    describe('UTXOs', () => {
        it('Fail: Non-added account cannot poll for UTXOs', async () => {
            await expect(
                madWallet.Account._getAccountUTXOs(wrongAccountAddress, 0)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        it('Fail: Non-added account cannot poll for UTXOs by utxoIds', async () => {
            await expect(
                madWallet.Account._getAccountUTXOsByIds(wrongAccountAddress, 1)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        // TODO These tests below should if fixed -> Error: RPC.getDataStoreUTXOIDs: TypeError: Cannot read property \‘Index\’ of undefined’
        // it.only('Success: Poll UTXOs for an added account', async () => {
        //     await expect(
        //         madWallet.Account._getAccountUTXOs(madWallet.Account.accounts[0]['address'], 0)
        //     ).to.eventually.be.fulfilled;
        // });

        // it.only('Success: Poll UTXOs for an added account by utxoIds', async () => {
        //     await expect(
        //         madWallet.Account._getAccountUTXOsByIds(madWallet.Account.accounts[0]['address'], '8b3e48e84656f2aff164370bfc62bd282d21bf18c66006de863ce6427b800287')
        //     ).to.eventually.be.fulfilled;
        // });
    });

    describe('Value Stores', () => {
        it('Fail: Cannot get value stores for non-added account', async () => {
            await expect(
                madWallet.Account._getAccountValueStores(wrongAccountAddress, 0)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        it('Success: Get account value stores for an added account', async () => {
           await expect(
                madWallet.Account._getAccountValueStores(madWallet.Account.accounts[0]["address"], 0)
            ).to.eventually.be.fulfilled;
        });

        // TODO Check if constant.MinValue will change at some point -- if so this test can be affected
        it('Success: Get account value stores for an added account with minValue higher than 0', async () => {
            await madWallet.Account._getAccountValueStores(madWallet.Account.accounts[0]["address"], 255)
            expect(madWallet.Account.accounts[0]['UTXO']['ValueStoreIDs']).to.not.have.lengthOf(256);
        });
    });
});