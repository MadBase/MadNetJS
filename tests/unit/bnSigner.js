require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");
const MultiSig = require("../../src/Signers/MultiSig");
const BNSigner = require("../../src/Signers/BNSigner.js");

describe('Unit/BNSigner:', () => {
    // TODO - Improve test description
    // TODO - Move common var to before hook when possible or to a helper
    let privateKey, madWallet, bnSigner, multiSigBN;

    before(async function() {
        if (process.env.PRIVATE_KEY) {
            privateKey = process.env.PRIVATE_KEY;
        }
        else {
            privateKey = "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A"
        }

        madWallet = new MadWalletJS();
        bnSigner = new BNSigner(madWallet, privateKey);
        multiSigBN = new MultiSig(madWallet, bnSigner);
    });

    describe('Public Key', () => {
        it('Fail: Get Public Key', async () => {
            await expect(
                multiSigBN.getPubK()
            ).to.eventually.be.rejectedWith(Error);
        });
    });
});
