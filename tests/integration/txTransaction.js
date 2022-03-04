require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");

describe('Integration/Transaction/Tx:', () => {
    let privateKey, validHex;
    const madWallet = new MadWalletJS(42, process.env.RPC);
    const madWalletTwo = new MadWalletJS(1, process.env.RPC);
    const madWalletThree = new MadWalletJS(11, process.env.RPC);

    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';

        await madWallet.Account.addAccount(privateKey, 1);
        await madWalletTwo.Account.addAccount(privateKey, 1);
        await madWalletThree.Account.addAccount(privateKey, 1);
    });
    
    describe('Signatures', () => {
        it('Success: Inject the signature fields with the signed messages', async () => {
            await expect(
                madWalletTwo.Transaction.Tx.injectSignatures(validHex, validHex)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject to Inject Signatures when called with invalid owner', async () => {
            await madWalletTwo.Transaction.Tx.DataStore(validHex, 1, 1, validHex, 1, madWalletTwo.Account.accounts[0]['address'], 5); 
            await expect(
                madWalletTwo.Transaction.Tx.injectSignatures(validHex, validHex)
            ).to.eventually.be.rejectedWith('Invalid owner');
        });

        it('Fail: Reject to Inject Signatures when TxIn owner cannot be found', async () => {
            madWalletTwo.Transaction.Tx.TxIn(validHex, validHex);
            await expect(
                madWalletTwo.Transaction.Tx.injectSignatures([], [])
            ).to.eventually.be.rejectedWith('TxIn owner could not be found');
        });

        it('Success: Aggreate signatures and to inject into the transaction', async () => {
            await expect(
                madWalletThree.Transaction.Tx.injectSignaturesAggregate(validHex, validHex)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject to Inject Signatures Aggregate when voutSignatures is invalid', async () => {
            await madWalletThree.Transaction.Tx.DataStore(validHex, 1, 1, validHex, 1, madWalletThree.Account.accounts[0]["address"], 5); 
            await expect(
                madWalletThree.Transaction.Tx.injectSignaturesAggregate(validHex, [null])
            ).to.eventually.be.rejectedWith('Missing signature in Vout');
        });

        it('Fail: Reject to Inject Signatures Aggregate when Hex length is invalid', async () => {
            await madWalletThree.Transaction.Tx.DataStore(validHex, 1, 1, validHex, 1, madWalletThree.Account.accounts[0]["address"], 5); 
            await madWalletThree.Transaction.Tx.ValueStore(1, 1, madWalletThree.Account.accounts[0]["address"], 5); 
            await expect(
                madWalletThree.Transaction.Tx.injectSignaturesAggregate(validHex, validHex)
            ).to.eventually.be.rejectedWith('encoding/hex: odd length hex string');
        });

        it('Fail: Reject to Inject Signatures Aggregate when TxIn owner connot be found', async () => {
            madWalletThree.Transaction.Tx.TxIn(validHex, validHex);
            await expect(
                madWalletThree.Transaction.Tx.injectSignaturesAggregate([], [])
            ).to.eventually.be.rejectedWith('TxIn owner could not be found');
        });
        
        it('Success: Get Signatures without DataStore and TxIn', async () => {
            await expect(
                madWallet.Transaction.Tx.getSignatures()
            ).to.eventually.be.fulfilled;
        });
        
        it('Success: Get Signatures with DataStore and TxIn', async () => {
            madWalletTwo.Transaction.Tx.TxIn(validHex, validHex);
            await madWalletTwo.Transaction.Tx.DataStore(validHex, 1, 1, validHex, 1, madWalletTwo.Account.accounts[0]["address"], 5); 
            await expect(
                madWalletTwo.Transaction.Tx.getSignatures()
            ).to.eventually.be.fulfilled;
        });
    });
        
    describe('Tx', () => { 
        it('Fail: Reject _signTx without when TxIn owner cannot be found', async () => {
            madWalletTwo.Transaction.Tx.TxIn(validHex, validHex);
            await expect(
                madWalletTwo.Transaction.Tx._signTx(madWalletTwo.Transaction.Tx.getTx())
            ).to.eventually.be.rejectedWith('TxIn owner could not be found');
        });

        it('Success: Hash the transaction and return it with the TxHash', async () => {
            await expect(
                madWallet.Transaction.Tx.createRawTx()
            ).to.eventually.be.fulfilled;
        });
            
        it('Fail: Reject createRawTx', async () => {
            madWalletTwo.Transaction.Tx.Vin = null;
            await expect(
                madWalletTwo.Transaction.Tx.createRawTx()
            ).to.eventually.be.rejected;
        });
            
        it('Fail: Reject _signTx when Tx is invalid', async () => {
            const tx = {};
            await expect(
                madWallet.Transaction.Tx._signTx(tx)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Create AtomicSwap', async () => {
            const atomicSwapResult = {
                "AtomicSwap": {
                    "ASPreImage": {
                        "ChainID": 42,
                        "Exp": 4,
                        "Fee": 6,
                        "IssuedAt": 3,
                        "Owner": 5,
                        "TXOutIdx": 2,
                        "Value": 1
                    },
                    "TxHash": "C0FFEE"
                }
            };
            expect(
                madWallet.Transaction.Tx.AtomicSwap(1,2,3,4,5,6)
            ).to.deep.eql(atomicSwapResult);
        });

        it('Success: Calls ASPreImage', async () => {
            const preImageResult = {
                "ChainID": 42,
                "Value": 1,
                "TXOutIdx": 2,
                "IssuedAt": 3,
                "Exp": 4,
                "Owner": 5,
                "Fee": 6
            };
            expect(
                madWallet.Transaction.Tx.ASPreImage(1,2,3,4,5,6)
            ).to.deep.eql(preImageResult);
        });
        
        it('Fail: Reject _signTx when Tx is invalid', async () => {
            await expect(
                madWallet.Transaction.Tx._signTx(undefined)
            ).to.eventually.be.rejectedWith(Error);
        });
    });

    describe('Fees Estimate', () => {  
        it('Success: Get estimate of fees with AtomicSwap', async () => {
            madWallet.Transaction.Tx.AtomicSwap(1, 1, 1, 1,validHex, validHex);
            await expect(
                madWallet.Transaction.Tx.estimateFees()
            ).to.eventually.be.fulfilled;
        });
                
        it('Fail: Reject get estimate of fees when RPC Server is invalid', async () => {
            const madWalletWithoutRPC = new MadWalletJS(null, null);
            await expect(
                madWalletWithoutRPC.Transaction.Tx.estimateFees()
            ).to.eventually.be.rejectedWith('Cannot estimate fees without RPC');
        });
    });

    describe('Import Transaction', () => { 
        it('Success: Import a finalized transaction', async () => {
            await expect(
                madWallet.Transaction.Tx.importTransaction(madWallet.Transaction.Tx.getTx())
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject Import Transaction when Tx is invalid', async () => {
            const tx = {};
            await expect(
                madWallet.Transaction.Tx.importTransaction(tx)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Import a transaction preSigned', async () => {
            madWallet.Transaction.Tx.getTx();
            await expect(
                madWallet.Transaction.Tx.importRawTransaction(madWallet.Transaction.Tx.getTx())
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject Import Raw Transaction when Tx is invalid', async () => {
            const madWalletWithoutRPC = new MadWalletJS(42, null);
            await expect(
                madWalletWithoutRPC.Transaction.Tx.importRawTransaction(madWalletWithoutRPC.Transaction.Tx.getTx())
            ).to.eventually.be.rejectedWith(Error);
        });
    });
});
