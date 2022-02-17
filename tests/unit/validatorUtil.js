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

describe('Util/Validator', () => {
    before(async function(){});

    // TODO Easy - Test isPrivateKey(str) for else case of !str || str.length != 64
    // TODO Easy - Test isNumber(num) for else case of !parseInt(num) || !Number.isInteger(parseInt(num)
    // TODO Easy - Test isAddress(str) for str.length != 40
    // TODO Easy - Test numToHex(num) for !decimal
    // TODO Easy - Test hexToInt(hex) for Errors
    // TODO Easy - Test hexToTxt(hex) for Success and Errors
    // TODO Easy - Test txtToHex(str) for Errors
    
    it('Fail: Failing Test', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey.slice(0, -1), 1)
        ).to.eventually.be.rejectedWith(Error);
    });
});
