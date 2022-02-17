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

describe('Util/Tx', () => {
    before(async function(){});

    // TODO Easy - Test extractOwner(owner) for !owner
    // TODO Easy - Test extractOwner(owner) for ownerBuf.length != 22
    // TODO Easy - Test prefixSVACurve(validation, curve, base) for !validation || !curve || !base
    // TODO Easy - Test calculateDeposit(data, duration) for dataSize > BigInt(constant.MaxDataStoreSize)
    // TODO Easy - Test remainingDeposit(DataStore, thisEpoch) for BigInt(thisEpoch) < BigInt(issuedAt)
    // TODO Easy - Test remainingDeposit(DataStore, thisEpoch) for BigInt(thisEpoch) > BigInt(expEpoch)
    // TODO Easy - Test remainingDeposit(DataStore, thisEpoch) for epochDiff > numEpochs
    // TODO Easy - Test calculateNumEpochs(dataSize, deposit) for BigInt(dataSize) > BigInt(constant.MaxDataStoreSize)
    // TODO Easy - Test calculateNumEpochs(dataSize, deposit) for BigInt(epoch) < BigInt(2)
    // TODO Easy - Test calculateFee(dsFee, numEpochs) for Errors
    
    it('Fail: Failing Test', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey.slice(0, -1), 1)
        ).to.eventually.be.rejectedWith(Error);
    });
});
