require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const expect = chai.expect
const MadWalletJS = require("../../index.js");

let privateKey;

if (process.env.PRIVATE_KEY) {
    privateKey = process.env.PRIVATE_KEY;
}
else {
    privateKey = "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A"
}

const madWallet = new MadWalletJS();

describe('Transaction/Tx', () => {
    before(async function(){});

    // TODO Easy - Test importTransaction(tx) for Success and Errors
    // TODO Easy - Test AtomicSwap(...args) for Success and Errors
    // TODO Easy - Test ASPreImage(...args) for Success and Errors
    // TODO Medium - Test estimateFees() for Errors
    // TODO Medium - Test estimateFees() for if (reward)
    // TODO Medium - Test estimateFees() for case 'AtomicSwap' and default throw
    // TODO Medium - Test estimateFees() for feesInt[Object.keys(feesInt)[i]]..
    // TODO Easy - Test createRawTx() for Success and Errors
    // TODO Easy - Test getSignatures() for Success and Errors
    // TODO Medium - Test _createTx() for Errors
    // TODO Easy - Test _signTx(Tx) for Errors
    // TODO Hard - Test injectSignaturesAggregate(vinSignatures, voutSignatures) for Success and Errors
    // TODO Hard - Test injectSignatures(vinSignatures, voutSignatures) for Success and Errors

    it('Fail: Failing Test', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey.slice(0, -1), 1)
        ).to.eventually.be.rejectedWith(Error);
    });
});
