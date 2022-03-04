require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");
const { tryIt } = require('../tryIt.js');

describe('Integration/RPC:', () => {
    let privateKey, madWallet, txHash, blockNumber, fees, wait;
    const waitingTime = 40 * 1000; 
    const testTimeout = 100 * 1000;

    before(async function() {
        if (process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY && process.env.RPC && process.env.CHAIN_ID) {
            privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
            madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
        }

        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(privateKey, 2);

        fees = await madWallet.Rpc.getFees(); 
        txHash = '59e792f9409d45701f2505ef27bf0f2c15e6f24e51bd8075323aa846a98b37d4';
        wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    });

    describe('Set Provider', () => {
        it('Fail: Set Provider', async () => {

            // tryIt( async () => {await madWallet.Rpc.setProvider() });
            // Check for specific Error Message -- used above to print it for you here ^

            await expect(
                madWallet.Rpc.setProvider()
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Set Provider', async () => {
            await expect(
                madWallet.Rpc.setProvider(process.env.RPC)
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Get Block', () => {

        
        it('Fail: Get TX BlockHeihgt with invalid argument', async () => {
            // tryIt( async () => {await madWallet.Rpc.getTxBlockHeight(null) });
            // check for expected message 
            await expect(
                madWallet.Rpc.getTxBlockHeight(null)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Get Block Header for bad block number', async () => {
            await expect(
                madWallet.Rpc.getBlockHeader("6987234012981234981273128721312987312")
            ).to.eventually.be.rejected;
        });

        it('Success: Get TX BlockHeihgt with valid argument', async () => {
            await expect(
                madWallet.Rpc.getTxBlockHeight(txHash)
            ).to.eventually.be.fulfilled;
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
    });
    
    describe('Chain ID, Epochs, Fees', () => {
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
    });
    
    describe('UTXOs', () => {
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

        it('Fail: Get Data Store UTXO invalid arguments', async () => {
            await expect(
                madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Get Data Store UTXO invalid arguments', async () => {
            await expect(
                madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1, 1)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Get UTXO by Ids', async () => {
            await expect(
                madWallet.Rpc.getUTXOsByIds([])
            ).to.eventually.be.fulfilled;
        });
    });
    
    describe('Data', () => {
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

    describe('Monitoring', () => {
        it('Fail: Monitor Pending with invalid argument', async () => {
            await expect(
                madWallet.Rpc.monitorPending(null, 1, 1, 30)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Monitor Pending with invalid argument', async () => {
            await expect(
                madWallet.Rpc.monitorPending(txHash)
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Transaction', () => {
        it('Fail: Get Mined Transaction with invalid argument', async () => {
            await expect(
                madWallet.Rpc.getMinedTransaction(null)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Get Pending Transaction with invalid argument', async () => {
            await expect(
                madWallet.Rpc.getPendingTransaction(null)
            ).to.eventually.be.rejectedWith(Error);
        });

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
