require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require('../../index.js');

describe('Integration/RPC:', function () {
    let privateKey, secondaryPrivateKey, madWallet; 
    let validTxHash, invalidTxHash, invalidTx, fees;
    let secpAccount, secpSecondaryAccount;

    before(async function() {
        invalidTxHash = '59e792f9409d45701f2505ef27bf0f2c15e6f24e51bd8075323aa846a98b37d7';
        invalidTx = { Tx: {  Vin: [], Vout: [], Fee: '' } };

        if (process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY && process.env.RPC && process.env.CHAIN_ID) {
            privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
            secondaryPrivateKey = process.env.OPTIONAL_TEST_SUITE_SECONDARY_PRIVATE_KEY;
            madWallet = new MadWalletJS({ 
                rpcTimeout: 20000,
                chainId: false,
                rpcServer: process.env.RPC
            });
        }

        await madWallet.Account.addAccount(privateKey, 1);
        
        const balance = await madWallet.Account.accounts[0].getAccountBalance();

        if(balance === '00' ){
            console.log(`Balance is ${balance}`, '\nInsufficient funds, skipping tests.');
            this.skip();
        }
        
        await madWallet.Account.addAccount(secondaryPrivateKey, 1);

        secpAccount = madWallet.Account.accounts[0]; 
        secpSecondaryAccount = madWallet.Account.accounts[1];
       
        // Create value store object for tx
        await madWallet.Transaction.createValueStore(secpAccount.address, 1000, secpSecondaryAccount.address, 1);
        
        // Create tx fee
        await madWallet.Transaction.createTxFee(secpAccount.address, 1, false);
        
        // Wait txHash to be mined
        async function waitForTx(txHash) {
            try {
                await madWallet.Rpc.request('get-mined-transaction', { TxHash: txHash });
                return txHash;
            } catch (ex) {
                if (ex.message.indexOf('unknown transaction:')) {
                    return waitForTx(txHash);
                }
            }
        }

        // Retrieve valid txHash
        try {
            const txHash = await madWallet.Transaction.sendTx(secpAccount.address, 1);
            validTxHash = await waitForTx(txHash);
        } catch (ex) {
            console.log('RPC Test before hook: ' + String(ex));
        }
        
        fees = await madWallet.Rpc.getFees(); 
    });

    describe('Set Provider', () => {
        it('Fail: Cannot set provider with missing argument', async () => {
            await expect(madWallet.Rpc.setProvider()).to.eventually.be.rejectedWith('RPC server not provided');
        });

        it('Success: Set provider with valid argument', async () => {
            await expect(madWallet.Rpc.setProvider(process.env.RPC)).to.eventually.be.fulfilled;
        });
    });

    describe('Get Block', () => {
        it('Fail: Cannot get TX BlockHeight when txHash is invalid', async () => {
            await expect(madWallet.Rpc.getTxBlockHeight(invalidTxHash)).to.eventually.be.rejectedWith('Key not found');
        });

        it('Fail: Get Block Header for bad block number', async () => {
            await expect(
                madWallet.Rpc.getBlockHeader('6987234012981234981273128721312987312')
            ).to.eventually.be.rejectedWith('invalid value for uint32');
        });

        it('Success: Get TX BlockHeihgt with valid argument', async () => {
            await expect(madWallet.Rpc.getTxBlockHeight(validTxHash)).to.eventually.be.fulfilled;
        });

        it('Success: Get Block Number', async () => {
            await expect(madWallet.Rpc.getBlockNumber()).to.eventually.be.fulfilled;
        });
        
        it('Success: Get Block Header', async () => {
            const blockNumber = await madWallet.Rpc.getBlockNumber();
            await expect(madWallet.Rpc.getBlockHeader(blockNumber)).to.eventually.be.fulfilled;
        });
    });
    
    describe('Chain ID, Epochs, Fees', () => {
        it('Success: Get Chain ID', async () => {
            const chainId = await madWallet.Rpc.getChainId();
            expect(chainId).to.equal(Number(process.env.CHAIN_ID));
        });

        it('Success: Get Current Epoch', async () => {
            await expect(madWallet.Rpc.getEpoch()).to.eventually.be.fulfilled;
        });

        it('Success: Return Fees with the correct keys', async () => {
            expect(fees).to.be.an('object').that.has.all.keys(
                'MinTxFee', 
                'ValueStoreFee', 
                'DataStoreFee'
            );
        });

        it('Success: Return Fees with the correct length', async () => {
            expect(Object.keys(fees).length).to.equal(4);
        });
    });
    
    describe('UTXOs', () => {
        it('Fail: Cannot get UTXOs with invalid Ids', async () => {
            await expect(madWallet.Rpc.getUTXOsByIds(['utxoInvalidId'])).to.eventually.be.rejectedWith('invalid length');
        });

        it('Fail: Cannot get UTXOs by Ids with missing argument', async () => {
            await expect(madWallet.Rpc.getUTXOsByIds()).to.eventually.be.rejectedWith('Invalid arguments');
        });
        
        it('Fail: Cannot get Value Store UTXOs with missing arguments', async () => {
            await expect(madWallet.Rpc.getValueStoreUTXOIDs()).to.eventually.be.rejectedWith('Invalid arguments');
        });

        it('Fail: Cannot get Data Store UTXOs with missing arguments', async () => {
            await expect(madWallet.Rpc.getDataStoreUTXOIDs()).to.eventually.be.rejectedWith('Invalid arguments');
        });

        it('Fail: Cannot get Data Store UTXOs IDS and indices with missing arguments', async () => {
            await expect(madWallet.Rpc.getDataStoreUTXOIDsAndIndices()).to.eventually.be.rejectedWith('Invalid arguments');
        });

        it('Success: Get Data Store UTXOs IDS and indices', async () => {
            const dataStoreUTXOIDsAndIndices = await madWallet.Rpc.getDataStoreUTXOIDsAndIndices(secpAccount.address, 2, 1);
            expect(dataStoreUTXOIDsAndIndices).to.be.an('array');
            dataStoreUTXOIDsAndIndices.forEach(dsUTXO => expect(dsUTXO).to.be.an('object').that.has.all.keys('Index', 'UTXOID'));
        });

        it('Success: Get Data Store UTXOs and return an array of strings', async () => {
            const dataStoreUTXOIDs = await madWallet.Rpc.getDataStoreUTXOIDs(secpAccount.address, 2);
            expect(dataStoreUTXOIDs).to.be.an('array');
            dataStoreUTXOIDs.forEach(dsUTXO => expect(dsUTXO).to.be.an('string'));
        });
    });
    
    describe('Data', () => {
        it('Fail: Cannot get Raw Data if curve and index are missing', async () => {
            await expect(madWallet.Rpc.getData(secpAccount.address)).to.eventually.be.rejectedWith('No input provided');
        });

        it('Fail: Cannot get DataStore by index if curve is missing', async () => {
            await expect(
                madWallet.Rpc.getDataStoreByIndex(secpAccount.address, null)
            ).to.eventually.be.rejectedWith('Invalid arguments');
        });

        it('Success: Get DataStore by index with valid arguments', async () => {
            await expect(madWallet.Rpc.getDataStoreByIndex(secpAccount.address, 1)).to.eventually.be.fulfilled;
        });
    });

    describe('Monitoring', () => {
        it('Fail: Monitor pending transaction with a invalid txHash', async () => {
            await expect(madWallet.Rpc.monitorPending(invalidTxHash, 1, 1, 30)).to.eventually.be.rejectedWith('unknown transaction');
        });

        it('Success: Monitor pending transaction with a valid txHash', async () => {
            await expect(madWallet.Rpc.monitorPending(validTxHash)).to.eventually.be.fulfilled;
        });
    });

    describe('Transaction', () => {
        it('Fail: Get Mined Transaction with a invalid argument', async () => {
            await expect(madWallet.Rpc.getMinedTransaction(invalidTxHash)).to.eventually.be.rejectedWith('unknown transaction');
        });

        it('Fail: Cannot get pending transaction with a invalid txHash', async () => {
            await expect(madWallet.Rpc.getPendingTransaction(invalidTxHash)).to.eventually.be.rejectedWith('unknown transaction');
        });
        
        it('Fail: Cannot send transaction with a invalid Tx object', async () => {
            await expect(madWallet.Rpc.sendTransaction(invalidTx)).to.eventually.be.rejectedWith('the object is invalid');
        });

        it('Fail: Cannot poll transaction status without a txHash', async () => {
            await expect(madWallet.Rpc.getTxStatus(null, 1)).to.eventually.be.rejectedWith('Argument txHash cannot be empty');
        });

        it('Fail: Cannot poll transaction status when txHash is invalid', async () => {
            await expect(madWallet.Rpc.getTxStatus(invalidTxHash, 1)).to.eventually.be.rejectedWith('unknown transaction');
        });

        it('Success: Poll transaction current status.', async () => {
            const txStatus = await madWallet.Rpc.getTxStatus(validTxHash);
            expect(txStatus).to.be.an('object').that.has.all.keys('IsMined', 'Tx');
        });
    });
});
