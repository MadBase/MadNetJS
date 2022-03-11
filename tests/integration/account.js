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
        madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
        wrongAccountAddress = "0xc2f89cbbcdcc7477442e7250445f0fdb3238259b";
        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(privateKey, 2);
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

        it('Success: Poll UTXOs for an added account', async () => {
            await expect(
                madWallet.Account._getAccountUTXOs(madWallet.Account.accounts[0]['address'], 0)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Poll UTXOs for an added account by utxoIds', async () => {
            const utxoids = await madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1);
            await expect(
                madWallet.Account._getAccountUTXOsByIds(madWallet.Account.accounts[0]['address'], utxoids)
            ).to.eventually.be.fulfilled;
        });
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

        it('Success: Get account value stores for an added account with minValue greater than 0', async () => {
            await madWallet.Account._getAccountValueStores(madWallet.Account.accounts[0]["address"], 1);
            expect(
                madWallet.Account.accounts[0]['UTXO']['ValueStoreIDs'].length
            ).to.be.greaterThan(0);
        });
    });
});