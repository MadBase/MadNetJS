require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");

describe('Integration/Transaction/Tx:', () => {
    // TODO - Improve test description
    // TODO - Move common var to before hook when possible or to a helper
    let privateKey;
    const madWallet = new MadWalletJS(42, process.env.RPC);
    const madWalletTwo = new MadWalletJS(1, process.env.RPC);
    const madWalletThree = new MadWalletJS(11, process.env.RPC);

    before(async function() {
        if (process.env.PRIVATE_KEY) {
            privateKey = process.env.PRIVATE_KEY;
        }
        else {
            privateKey = "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A";
        }

        await madWallet.Account.addAccount(privateKey, 1);
        await madWalletTwo.Account.addAccount(privateKey, 1);
        await madWalletThree.Account.addAccount(privateKey, 1);
    });
    
    describe('Signatures', () => {
        it('Success: Calls injectSignatures', async () => {
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
            await expect(
                madWalletTwo.Transaction.Tx.injectSignatures(validHex, validHex)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Calls injectSignatures invalid owner', async () => {
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
            
            await madWalletTwo.Transaction.Tx.DataStore(validHex, 1, 1, validHex, 1, madWalletTwo.Account.accounts[0]['address'], 5); 
            await expect(
                madWalletTwo.Transaction.Tx.injectSignatures(validHex, validHex)
            ).to.eventually.be.rejectedWith('Invalid owner');
        });

        it('Fail: Calls injectSignatures TxIn owner could not be found', async () => {
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
            madWalletTwo.Transaction.Tx.TxIn(validHex, validHex);

            await expect(
                madWalletTwo.Transaction.Tx.injectSignatures([], [])
            ).to.eventually.be.rejectedWith('TxIn owner could not be found');
        });

        it('Success: Calls injectSignaturesAggregate', async () => {
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';

            await expect(
                madWalletThree.Transaction.Tx.injectSignaturesAggregate(validHex, validHex)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Calls injectSignaturesAggregate DataStore without voutSignatures', async () => {
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
            await madWalletThree.Transaction.Tx.DataStore(validHex, 1, 1, validHex, 1, madWalletThree.Account.accounts[0]["address"], 5); 
            
            await expect(
                madWalletThree.Transaction.Tx.injectSignaturesAggregate(validHex, [null])
            ).to.eventually.be.rejectedWith('Missing signature in Vout');
        });

        it('Fail: Calls injectSignaturesAggregate ValueStore', async () => {
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
            await madWalletThree.Transaction.Tx.DataStore(validHex, 1, 1, validHex, 1, madWalletThree.Account.accounts[0]["address"], 5); 
            await madWalletThree.Transaction.Tx.ValueStore(1, 1, madWalletThree.Account.accounts[0]["address"], 5); 
            
            await expect(
                madWalletThree.Transaction.Tx.injectSignaturesAggregate(validHex, validHex)
            ).to.eventually.be.rejectedWith('encoding/hex: odd length hex string');
        });

        it('Fail: Calls injectSignaturesAggregate TxIn owner could not be found', async () => {
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
            madWalletThree.Transaction.Tx.TxIn(validHex, validHex);

            await expect(
                madWalletThree.Transaction.Tx.injectSignaturesAggregate([], [])
            ).to.eventually.be.rejectedWith('TxIn owner could not be found');
        });
        
        it('Success: Calls getSignatures Without DataStore and TxIn', async () => {
            await expect(
                madWallet.Transaction.Tx.getSignatures()
            ).to.eventually.be.fulfilled;
        });
        
        it('Success: Calls getSignatures With DataStore and TxIn', async () => {
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
            madWalletTwo.Transaction.Tx.TxIn(validHex, validHex);
            await madWalletTwo.Transaction.Tx.DataStore(validHex, 1, 1, validHex, 1, madWalletTwo.Account.accounts[0]["address"], 5); 
            
            await expect(
                madWalletTwo.Transaction.Tx.getSignatures()
            ).to.eventually.be.fulfilled;
        });
    });
        
    describe('Tx', () => { 
        it('Fail: Calls _signTx without txInOwners', async () => {
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
            madWalletTwo.Transaction.Tx.TxIn(validHex, validHex);

            await expect(
                madWalletTwo.Transaction.Tx._signTx(madWalletTwo.Transaction.Tx.getTx())
            ).to.eventually.be.rejectedWith('TxIn owner could not be found');
        });

        it('Success: Calls createRawTx', async () => {
            await expect(
                madWallet.Transaction.Tx.createRawTx()
            ).to.eventually.be.fulfilled;
        });
            
        it('Fail: Calls createRawTx', async () => {
            madWalletTwo.Transaction.Tx.Vin = null;

            await expect(
                madWalletTwo.Transaction.Tx.createRawTx()
            ).to.eventually.be.rejected;
        });
            
        it('Fail: Calls _signTx with Invalid Tx', async () => {
            const tx = {};

            await expect(
                madWallet.Transaction.Tx._signTx(tx)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Calls AtomicSwap with valid arguments', async () => {
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

        it('Fail: Calls ASPreImage with valid arguments', async () => {
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
        
        it('Fail: Calls _signTx with Invalid Tx', async () => {
            await expect(
                madWallet.Transaction.Tx._signTx(undefined)
            ).to.eventually.be.rejectedWith(Error);
        });
    });

    describe('Fees Estimate', () => {  
        it('Success: Calls estimateFees with AtomicSwap', async () => {
            // Clean up here
            const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
            madWallet.Transaction.Tx.AtomicSwap(1, 1, 1, 1,validHex, validHex);
            
            await expect(
                madWallet.Transaction.Tx.estimateFees()
            ).to.eventually.be.fulfilled;
        });
                
        it('Fail: Calls estimateFees without RPC Server', async () => {
            const madWalletWithoutRPC = new MadWalletJS(null, null);

            await expect(
                madWalletWithoutRPC.Transaction.Tx.estimateFees()
            ).to.eventually.be.rejectedWith('Cannot estimate fees without RPC');
        });
    });

    describe('Import Transaction', () => { 
        it('Success: Calls importTransaction with valid Tx', async () => {
            await expect(
                madWallet.Transaction.Tx.importTransaction(madWallet.Transaction.Tx.getTx())
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Calls importTransaction with Invalid Tx', async () => {
            const tx = {};

            await expect(
                madWallet.Transaction.Tx.importTransaction(tx)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Calls importRawTransaction with valid Tx', async () => {
            madWallet.Transaction.Tx.getTx();

            await expect(
                madWallet.Transaction.Tx.importRawTransaction(madWallet.Transaction.Tx.getTx())
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Calls importRawTransaction with Invalid Tx', async () => {
            const madWalletWithoutRPC = new MadWalletJS(42, null);

            await expect(
                madWalletWithoutRPC.Transaction.Tx.importRawTransaction(madWalletWithoutRPC.Transaction.Tx.getTx())
            ).to.eventually.be.rejectedWith(Error);
        });
    });
});
