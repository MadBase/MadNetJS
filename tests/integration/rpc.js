require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const expect = chai.expect
const MadWalletJS = require("../../index.js");

const waitingTime = 40 * 1000; // 40 * 1000
const testTimeout = 100 * 1000; // 100 * 1000

let privateKey, madWallet;
if (process.env.PRIVATE_KEY &&
    process.env.RPC &&
    process.env.CHAIN_ID
) {
    privateKey = process.env.PRIVATE_KEY;
    madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
}

let blockNumber;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let fees;

describe('RPC', () => {
    before(async () => {
        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(privateKey, 2);
        fees = await madWallet.Rpc.getFees();
    });

    describe('RPC: Query Data', () => {
        // TODO Medium - Test request error for request('get-block-number')
        // TODO Medium - Test request error for request('get-block-header')
        // TODO Medium - Test request error for request('get-chain-id')
        // TODO Medium - Test request error for request('get-epoch-number')
        // TODO Medium - Test request error for request('get-fees')
        // TODO Hard - Test getUTXOsByIds() for utxos["UTXOs"] = []
        // TODO Hard - Test getUTXOsByIds() for utxo["AtomicSwap"]
        // TODO Medium - Test getDataStoreUTXOIDs() for utxo["AtomicSwap"]
        // TODO Medium - Test getData() for Valid Index
        // TODO Medium - Test request error for request('send-transaction')
        // TODO Easy - Test getMinedTransaction(txHasH) for valid and invalid argument
        // TODO Easy - Test getPendingTransaction(txHash) for valid and invalid argument
        // TODO Easy - Test getTxBlockHeight(txHash) for valid and invalid argument
        // TODO Easy - Test monitorPending(tx, countMax = 30, startDelay = 1000, currCount = 1) for valid and invalid argument
        // TODO Medium - Test request(route, data) for !this.Wallet.chainId && this.rpcServer case
        // TODO Medium - Test request(route, data) for !this.rpcServer
        // TODO Medium - Test request(route, data) for !route

        it('Success: Set Provider', async () => {
            await expect(
                madWallet.Rpc.setProvider(process.env.RPC)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Set Provider', async () => {
            await expect(
                madWallet.Rpc.setProvider()
            ).to.eventually.be.rejectedWith(Error);
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

        it('Success: Get Current Epoch', async () => {
            await expect(
                madWallet.Rpc.getEpoch()
            ).to.eventually.be.fulfilled;
        });

        it('Success: Get Fees', async () => {
            await expect(
                madWallet.Rpc.getFees()
            ).to.eventually.be.fulfilled;
        });

        it('Success: Get UTXO by Ids', async () => {
            await expect(
                madWallet.Rpc.getUTXOsByIds([])
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Get UTXO with invalid Ids', async () => {
            await expect(
                madWallet.Rpc.getUTXOsByIds([1])
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Get UTXO by Ids', async () => {
            await expect(
                madWallet.Rpc.getUTXOsByIds()
            ).to.eventually.be.rejectedWith(Error);
        });
        
        it('Fail: Get Value Store UTXO invalid arguments', async () => {
            await expect(
                madWallet.Rpc.getValueStoreUTXOIDs()
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Get Data Store UTXO invalid arguments', async () => {
            await expect(
                madWallet.Rpc.getDataStoreUTXOIDs()
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Get Data Store UTXO invalid arguments', async () => {
            await expect(
                madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1, 1)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Get Data Store UTXO invalid arguments', async () => {
            await expect(
                madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Get Raw Data invalid arguments', async () => {
            await expect(
                madWallet.Rpc.getData(madWallet.Account.accounts[0]['address'])
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Get DataStore by index', async () => {
            await expect(
                madWallet.Rpc.getDataStoreByIndex(madWallet.Account.accounts[0]['address'])
            ).to.eventually.be.rejectedWith(Error);
        });
    });

    describe('RPC: Send Transaction', () => {
        it('Fail: Send Transaction Error', async () => {
            await expect(
                madWallet.Rpc.sendTransaction()
            ).to.eventually.be.rejectedWith(Error);
        })

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
        }).timeout(testTimeout);
    
        it('Success: SECP Create & Send ValueStore', async () => {
            await wait(waitingTime);
            await madWallet.Transaction.createTxFee(madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"], BigInt("0x" + fees["MinTxFee"]).toString())
            await madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 9995, madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"])
            
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.fulfilled;
        }).timeout(testTimeout);
    
        it('Success: BN Create & Send DataStore', async () => {
            await wait(waitingTime);
            await madWallet.Transaction.createDataStore(madWallet.Account.accounts[1]["address"], "0x03", 2, "0x02")
            await madWallet.Transaction.createTxFee(madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"], BigInt("0x" + fees["MinTxFee"]).toString())
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.fulfilled;
        }).timeout(testTimeout);
    
        it('Success: BN Create & Send ValueStore', async () => {
            await wait(waitingTime);
            await madWallet.Transaction.createValueStore(madWallet.Account.accounts[1]["address"], 1, madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"])
            await madWallet.Transaction.createTxFee(madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"], BigInt("0x" + fees["MinTxFee"]).toString())
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.fulfilled;
        }).timeout(testTimeout);
    });
});
