const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const expect = chai.expect
let MadWalletJS = require("../index.js");

require('dotenv').config({ path: process.cwd() + '/tests/.env' });

let privateKey, madWallet;
if (process.env.PRIVATE_KEY &&
    process.env.RPC &&
    process.env.CHAIN_ID
) {
    privateKey = process.env.PRIVATE_KEY;
    madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
}

let blockNumber;

describe('RPC: Query Data', () => {
    before(async function() {
        if (!privateKey) {
            this.skip();
        }
    });

    it('Success: Get Block Number', async () => {
        await expect(
            madWallet.Rpc.getBlockNumber()
        ).to.eventually.be.fulfilled;
    });

    it('Success: Get Block Header', async () => {
        blockNumber = await madWallet.Rpc.getBlockNumber()
        await expect(
            madWallet.Rpc.getBlockHeader(blockNumber)
        ).to.eventually.be.fulfilled;
    });

    it('Fail: Get Block Header for bad block number', async () => {
        await expect(
            madWallet.Rpc.getBlockHeader("6666666666666666666666666666666666666")
        ).to.eventually.be.rejected;
    });

    it('Success: Get Chain ID', async () => {
        await expect(
            madWallet.Rpc.getChainId()
        ).to.eventually.be.fulfilled;
    });

    it('Success: Get Chain ID', async () => {
        await expect(
            madWallet.Rpc.getEpoch()
        ).to.eventually.be.fulfilled;
    });

});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let fees;
describe('RPC: Send Transaction', () => {

    before(async () => {
        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(privateKey, 2);
        fees = await madWallet.Rpc.getFees();
    });
    
    it('Fail: Insufficient funds', async () => {
        await madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1000000000, madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"])
        await expect(
            madWallet.Transaction.sendTx()
        ).to.eventually.be.rejected;
    });

    it('Success: SECP Create & Send DataStore', async () => {
        await madWallet.Transaction.createTxFee(madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"], BigInt("0x" + fees["MinTxFee"]).toString())
        await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0x02", 1, "0x02")
        await expect(
            madWallet.Transaction.sendTx()
        ).to.eventually.be.fulfilled;

    }).timeout(100 * 1000);

    it('Success: SECP Create & Send ValueStore', async () => {
        await wait(40 * 1000);
        await madWallet.Transaction.createTxFee(madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"], BigInt("0x" + fees["MinTxFee"]).toString())
        await madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 9995, madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"])
        
        await expect(
            madWallet.Transaction.sendTx()
        ).to.eventually.be.fulfilled;
    }).timeout(100 * 1000);

    
    it('Success: BN Create & Send DataStore', async () => {
        await wait(40 * 1000);
        await madWallet.Transaction.createDataStore(madWallet.Account.accounts[1]["address"], "0x03", 2, "0x02")
        await madWallet.Transaction.createTxFee(madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"], BigInt("0x" + fees["MinTxFee"]).toString())
        await expect(
            madWallet.Transaction.sendTx()
        ).to.eventually.be.fulfilled;
    }).timeout(100 * 1000);

    it('Success: BN Create & Send ValueStore', async () => {
        await wait(40 * 1000);
        await madWallet.Transaction.createValueStore(madWallet.Account.accounts[1]["address"], 1, madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"])
        await madWallet.Transaction.createTxFee(madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"], BigInt("0x" + fees["MinTxFee"]).toString())
        await expect(
            madWallet.Transaction.sendTx()
        ).to.eventually.be.fulfilled;
    }).timeout(100 * 1000);
    
});
