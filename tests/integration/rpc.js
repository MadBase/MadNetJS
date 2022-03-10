require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");

describe('Integration/RPC:', () => {
    let privateKey, secondaryPrivateKey, madWallet, validTxHash, invalidTxHash, invalidTx,  blockNumber, fees, wait;
    const waitingTime = 40 * 1000; 
    const testTimeout = 100 * 1000;

    before(async function() {
        if (process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY && process.env.RPC && process.env.CHAIN_ID) {
            privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
            secondaryPrivateKey = process.env.OPTIONAL_TEST_SUITE_SECONDARY_PRIVATE_KEY;
            madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
        }

        await madWallet.Account.addAccount(privateKey, 2);
        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(secondaryPrivateKey, 2);
        
        // TODO Check if it could be simplified -- Get txHash programmatically
        // TODO Use Adam's example

        
         // Create value store object for tx
        //     await madwallet.Transaction.createValueStore(madwallet.Account.accounts[0].address, 10000, sendTarget, isBN ? 2 : 1);
        //     // Create tx fee
        //     await madwallet.Transaction.createTxFee(madwallet.Account.accounts[0].address, 1, false);
        //     try {
        //         let txHash = await madwallet.Transaction.sendTx(madwallet.Account.accounts[0].address, 1);
        //         console.log("\nFunding request received for: ", sendTarget, " transfer tx sent w/ respective hash: ", txHash);
        //         return await waitForTx(txHash);
        //     } catch (ex) {
        //         console.log(ex);
        //     }
        //     async function waitForTx(txHash) {
        //     console.log("Polling for txStatus of: ", txHash);
        //     try {
        //         let res = await madwallet.Rpc.request('get-mined-transaction', { TxHash: txHash });
        //         console.log("txhash mined: ", txHash);
        //         return res;
        //     } catch (ex) {
        //         if (ex.message.indexOf("unknown transaction:")) {
        //             console.log(txHash + " not mined yet.");
        //             return waitForTx(txHash);
        //         }
        //     }
        // }

        const acct1 = await madWallet.Account.getAccount(madWallet.Account.accounts[0]["address"]);
        const acct1p = await acct1.signer.getPubK();
        const acct2 = await madWallet.Account.getAccount(madWallet.Account.accounts[2]["address"]);
        const acct2p = await acct2.signer.getPubK();
        const multiAcct = await madWallet.Account.addMultiSig([acct1p, acct2p]);
        const multiPubK = await multiAcct.signer.getPubK();
        await madWallet.Transaction.createValueStore(multiAcct.address, 1, acct1.address, 2);
        await madWallet.Transaction.createTxFee(multiAcct.address, 2);
        await madWallet.Transaction.createRawTransaction();

        const sigMsgs = await madWallet.Transaction.Tx.getSignatures();
        const sigs1Vin = await acct1.signer.multiSig.signMulti(sigMsgs["Vin"], multiPubK);
        const sigs1Vout = await acct1.signer.multiSig.signMulti(sigMsgs["Vout"], multiPubK);
        const sigs2Vin = await acct2.signer.multiSig.signMulti(sigMsgs["Vin"], multiPubK);
        const sigs2Vout = await acct2.signer.multiSig.signMulti(sigMsgs["Vout"], multiPubK);
        await madWallet.Transaction.Tx.injectSignaturesAggregate([sigs1Vin, sigs2Vin], [sigs1Vout, sigs2Vout]);
        validTxHash = await madWallet.Transaction.sendSignedTx(madWallet.Transaction.Tx.getTx());
        invalidTxHash = '59e792f9409d45701f2505ef27bf0f2c15e6f24e51bd8075323aa846a98b37d7';
        invalidTx = { "Tx": {  "Vin": [], "Vout": [], "Fee": "" } };
        fees = await madWallet.Rpc.getFees(); 
        wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    });

    describe('Set Provider', () => {
        it('Fail: Cannot set provider with missing argument', async () => {
            await expect(
                madWallet.Rpc.setProvider()
            ).to.eventually.be.rejectedWith('RPC server not provided');
        });

        it('Success: Set provider with valid argument', async () => {
            await expect(
                madWallet.Rpc.setProvider(process.env.RPC)
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Get Block', () => {
        it('Fail: Cannot get TX BlockHeight when txHash is invalid', async () => {
            await expect(
                madWallet.Rpc.getTxBlockHeight(invalidTxHash)
            ).to.eventually.be.rejectedWith('Key not found');
        });

        it('Fail: Get Block Header for bad block number', async () => {
            await expect(
                madWallet.Rpc.getBlockHeader("6987234012981234981273128721312987312")
            ).to.eventually.be.rejectedWith('invalid value for uint32');
        });

        it('Success: Get TX BlockHeihgt with valid argument', async () => {
            await expect(
                madWallet.Rpc.getTxBlockHeight(validTxHash)
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
            const chainId = await madWallet.Rpc.getChainId();
            expect(chainId).to.equal(Number(process.env.CHAIN_ID));
        });

        it('Success: Get Current Epoch', async () => {
            await expect(
                madWallet.Rpc.getEpoch()
            ).to.eventually.be.fulfilled;
        });

        it('Success: Return Fees with the correct keys', async () => {
            expect(fees).to.be.an('object').that.has.all.keys(
                'MinTxFee', 
                'ValueStoreFee', 
                'DataStoreFee', 
                'AtomicSwapFee'
            );
        });

        it('Success: Return Fees with the correct length', async () => {
            expect(Object.keys(fees).length).to.equal(4);
        });
    });
    
    describe('UTXOs', () => {
        it('Fail: Cannot get UTXOs with invalid Ids', async () => {
            await expect(
                madWallet.Rpc.getUTXOsByIds(['utxoInvalidId'])
            ).to.eventually.be.rejectedWith('invalid length');
        });

        it('Fail: Cannot get UTXOs by Ids with missing argument', async () => {
            await expect(
                madWallet.Rpc.getUTXOsByIds()
            ).to.eventually.be.rejectedWith('Invalid arguments');
        });
        
        it('Fail: Cannot get Value Store UTXOs with missing arguments', async () => {
            await expect(
                madWallet.Rpc.getValueStoreUTXOIDs()
            ).to.eventually.be.rejectedWith('Invalid arguments');
        });

        it('Fail: Cannot get Data Store UTXOs with missing arguments', async () => {
            await expect(
                madWallet.Rpc.getDataStoreUTXOIDs()
            ).to.eventually.be.rejectedWith('Invalid arguments');
        });

        it('Success: Get Data Store UTXO with valid arguments', async () => {
            // TODO Create new Data Store to generate new utxoids
            await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xA", 1, "COFFEE", 1)
            console.log(await madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1))
            await expect(
                madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Get UTXO by Ids', async () => {
            const utxoIds = await madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1, 1);
            console.log(utxoIds);
            await expect(
                madWallet.Rpc.getUTXOsByIds(utxoIds)
            ).to.eventually.be.fulfilled;
        });
    });
    
    describe('Data', () => {
        it('Fail: Cannot get Raw Data if curve and index are missing', async () => {
            await expect(
                madWallet.Rpc.getData(madWallet.Account.accounts[0]['address'])
            ).to.eventually.be.rejectedWith('No input provided');
        });

        it('Fail: Cannot get DataStore by index if curve is missing', async () => {
            await expect(
                madWallet.Rpc.getDataStoreByIndex(madWallet.Account.accounts[0]['address'], null)
            ).to.eventually.be.rejectedWith('Invalid arguments');
        });

        it('Success: Get DataStore by index with valid arguments', async () => {
            await expect(
                madWallet.Rpc.getDataStoreByIndex(madWallet.Account.accounts[0]['address'], 1)
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Monitoring', () => {
        it('Fail: Monitor pending transaction with a invalid txHash', async () => {
            await expect(
                madWallet.Rpc.monitorPending(invalidTxHash, 1, 1, 30)
            ).to.eventually.be.rejectedWith('unknown transaction');
        });

        it('Success: Monitor pending transaction with a valid txHash', async () => {
            await expect(
                madWallet.Rpc.monitorPending(validTxHash)
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Transaction', () => {
        it('Fail: Get Mined Transaction with a invalid argument', async () => {
            await expect(
                madWallet.Rpc.getMinedTransaction(invalidTxHash)
            ).to.eventually.be.rejectedWith('unknown transaction');
        });

        it('Fail: Cannot get pending transaction with a invalid txHash', async () => {
            await expect(
                madWallet.Rpc.getPendingTransaction(invalidTxHash)
            ).to.eventually.be.rejectedWith('unknown transaction');
        });

        it('Fail: Cannot send transaction with a invalid Tx object', async () => {
            await expect(
                madWallet.Rpc.sendTransaction(invalidTx)
            ).to.eventually.be.rejectedWith('the object is invalid');
        })

        it('Fail: Insufficient funds', async () => {
            await madWallet.Transaction.createValueStore(
                madWallet.Account.accounts[0]["address"], 1000000000, madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"]
            );
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.rejectedWith('Insufficient funds');
        });
    
        it('Success: SECP Create & Send DataStore', async () => {
            await madWallet.Transaction.createTxFee(
                madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"], BigInt("0x" + fees["MinTxFee"]).toString()
            );
            await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0x02", 1, "0x02");
            const transactionHash = await madWallet.Transaction.sendTx()

            // TODO Check if exists a txhash format validator
            expect(transactionHash).to.exist;
        }).timeout(testTimeout);

        // TODO abstract and check values and object structures
    
        it('Success: SECP Create & Send ValueStore', async () => {
            await wait(waitingTime);
            await madWallet.Transaction.createTxFee(
                madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"], BigInt("0x" + fees["MinTxFee"]).toString()
            );
            await madWallet.Transaction.createValueStore(
                madWallet.Account.accounts[0]["address"], 9995, madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"]
            );
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.fulfilled;
        }).timeout(testTimeout);
    
        it('Success: BN Create & Send DataStore', async () => {
            await wait(waitingTime);
            await madWallet.Transaction.createDataStore(madWallet.Account.accounts[1]["address"], "0x03", 2, "0x02");
            await madWallet.Transaction.createTxFee(
                madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"], BigInt("0x" + fees["MinTxFee"]).toString()
            );
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.fulfilled;
        }).timeout(testTimeout);
    
        it('Success: BN Create & Send ValueStore', async () => {
            await wait(waitingTime);
            await madWallet.Transaction.createValueStore(
                madWallet.Account.accounts[1]["address"], 1, madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"]
            );
            await madWallet.Transaction.createTxFee(
                madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"], BigInt("0x" + fees["MinTxFee"]).toString()
            );
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.fulfilled;
        }).timeout(testTimeout);
    });
});
