require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const expect = chai.expect
const MadWalletJS = require("../../index.js");

const madWallet = new MadWalletJS(42, process.env.RPC);
const madWalletTwo = new MadWalletJS(1, process.env.RPC);
const madWalletThree = new MadWalletJS(11, process.env.RPC);
let privateKey;

if (process.env.PRIVATE_KEY) {
    privateKey = process.env.PRIVATE_KEY;
}
else {
    privateKey = "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A"
}

describe('Transaction/Tx', () => {
    before(async function(){
        await madWallet.Account.addAccount(privateKey, 1);
        await madWalletTwo.Account.addAccount(privateKey, 1);
        await madWalletThree.Account.addAccount(privateKey, 1);
    });
    
    // TODO Undefined - Unreachable Test estimateFees() for if (reward)

    // Hard - Test injectSignaturesAggregate(vinSignatures, voutSignatures) for Success and Errors
    // Hard - Test injectSignatures(vinSignatures, voutSignatures) for Success and Errors
    it('Success: Calls injectSignatures', async () => {
        const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
        await expect(
            madWalletTwo.Transaction.Tx.injectSignatures(validHex, validHex)
        ).to.eventually.be.fulfilled;
    });

    // TODO Get a valid txHash for this.txInOwners
    // it('Success: Calls injectSignatures with txInOwners', async () => {
    //     const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
    //     madWalletTwo.Transaction.Tx.TxIn(validHex, validHex);
    //     madWalletTwo.Transaction.Tx.importRawTransaction(madWalletTwo.Transaction.Tx.getTx());

    //     await expect(
    //         madWalletTwo.Transaction.Tx.injectSignatures(validHex, validHex)
    //     ).to.eventually.be.fulfilled;
    // });
        
    // TODO Hard - Test failing on a valid address - extractOwner util needs checked
    // it('Success: Calls injectSignatures valid owner', async () => {
    //      const generateHex = size => [...Array(size)].map(
    //          () => Math.floor(Math.random() * 16).toString(16)
    //      ).join('');

    //      const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
    //     // const validOwnerHex = generateHex(43);
        
    //     await madWalletTwo.Transaction.Tx.DataStore(validHex, 1, 1, validHex, 1, madWallet.Account.accounts[0]["address"], 5); 
    //     console.log(madWallet.Account.accounts[0]["address"])
    //     await expect(
    //         madWalletTwo.Transaction.Tx.injectSignatures(validHex, validHex)
    //     ).to.eventually.be.fulfilled;
    // });

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
    
    it('Fail: Calls _signTx without txInOwners', async () => {
        const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
        madWalletTwo.Transaction.Tx.TxIn(validHex, validHex);

        await expect(
            madWalletTwo.Transaction.Tx._signTx(madWalletTwo.Transaction.Tx.getTx())
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
        
    // Medium - Test _signTx() for Errors
    it('Fail: Calls _signTx with Invalid Tx', async () => {
        const tx = {};

        await expect(
            madWallet.Transaction.Tx._signTx(tx)
        ).to.eventually.be.rejectedWith(Error);
    });

    // Medium - Test estimateFees() for feesInt[Object.keys(feesInt)[i]]..
    // Medium - Test estimateFees() for case 'AtomicSwap' and default throw
    it('Success: Calls estimateFees with AtomicSwap', async () => {
        // Clean up here
        const validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
        madWallet.Transaction.Tx.AtomicSwap(1, 1, 1, 1,validHex, validHex);
        
        await expect(
            madWallet.Transaction.Tx.estimateFees()
        ).to.eventually.be.fulfilled;
    });
            
    // Medium - Test estimateFees() for Errors
    it('Fail: Calls estimateFees without RPC Server', async () => {
        const madWalletWithoutRPC = new MadWalletJS(null, null);

        await expect(
            madWalletWithoutRPC.Transaction.Tx.estimateFees()
        ).to.eventually.be.rejectedWith('Cannot estimate fees without RPC');
    });
    
    // Easy - Test importTransaction(tx) for Success and Errors
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

    // TODO It seems that the property this.Tx is used wrongly thus the test won't pass. needs checked. 
    // it('Success: Calls importTransaction with valid Tx', async () => {
    //     const tx = {
    //         "Tx": {
    //             "Vin": [1],
    //             "Fee": [0]
    //         }
    //     };

    //     await expect(
    //         madWallet.Transaction.Tx.importTransaction(tx)
    //     ).to.eventually.be.fulfilled;
    // });

    // Easy - Test AtomicSwap(...args) for Success and Errors
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

    // Easy - Test ASPreImage(...args) for Success and Errors
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
    
    // Easy - Test _signTx(Tx) for Errors
    it('Fail: Calls _signTx with Invalid Tx', async () => {
        await expect(
            madWallet.Transaction.Tx._signTx(undefined)
        ).to.eventually.be.rejectedWith(Error);
    });
});
