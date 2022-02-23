require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const expect = chai.expect
const MadWalletJS = require("../../index.js");

const madWallet = new MadWalletJS(42, process.env.RPC);
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
    });

    // TODO Hard - Test injectSignaturesAggregate(vinSignatures, voutSignatures) for Success and Errors
    // TODO Hard - Test injectSignatures(vinSignatures, voutSignatures) for Success and Errors
    
    // TODO Medium - Test _signTx() for Errors
    it('Fail: Calls _signTx with Invalid Tx', async () => {
        const tx = {};

        await expect(
            madWallet.Transaction.Tx._signTx(tx)
        ).to.eventually.be.rejectedWith(Error);
    });
    
    // TODO Medium - Test estimateFees() for case 'AtomicSwap' and default throw
    // TODO Medium - Test estimateFees() for feesInt[Object.keys(feesInt)[i]]..
    // TODO Medium - Test estimateFees() for if (reward)
    // it('Fail: Calls estimateFees with ValueStore', async () => {
    //     await madWallet.Transaction.Tx.ValueStore(1, 1, 1, 1)
    //     await expect(
    //         madWallet.Transaction.Tx.estimateFees()
    //     ).to.eventually.be.fulfilled;
    // });
    
    // TODO Medium - Test estimateFees() for Errors
    it('Fail: Calls estimateFees without RPC Server', async () => {
        const madWalletWithoutRPC = new MadWalletJS(null, null);

        await expect(
            madWalletWithoutRPC.Transaction.Tx.estimateFees()
        ).to.eventually.be.rejectedWith('Cannot estimate fees without RPC');
    });
    
    // TODO Easy - Test importTransaction(tx) for Success and Errors
    it('Fail: Calls importTransaction with Invalid Tx', async () => {
        const tx = {};

        await expect(
            madWallet.Transaction.Tx.importTransaction(tx)
        ).to.eventually.be.rejectedWith(Error);
    });

    // TODO It seems that the property this.Tx is used wrongly thus the test won't pass. needs checked. 
    // it.only('Success: Calls importTransaction with valid Tx', async () => {
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

    // TODO Easy - Test AtomicSwap(...args) for Success and Errors
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

    // TODO Easy - Test ASPreImage(...args) for Success and Errors
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
    
    // TODO Easy - Test _signTx(Tx) for Errors
    it('Fail: Calls _signTx with Invalid Tx', async () => {
        await expect(
            madWallet.Transaction.Tx._signTx(undefined)
        ).to.eventually.be.rejectedWith(Error);
    });
});
