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

describe('Util/Hash', () => {
    before(async function(){});

    // TODO Easy - Test hash() for Success and Errors
    
    it('Fail: Failing Test', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey.slice(0, -1), 1)
        ).to.eventually.be.rejectedWith(Error);
    });
});
