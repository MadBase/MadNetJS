require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require('../../index.js');
const MultiSig = require('../../src/Signers/MultiSig');
const SecpSigner = require('../../src/Signers/SecpSigner.js');

describe('Unit/MultiSig:', () => {
    let privateKey, secondaryPrivateKey, msgHex, madWallet, secpSigner, bnAccount;

    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        secondaryPrivateKey = process.env.OPTIONAL_TEST_SUITE_SECONDARY_PRIVATE_KEY;
        msgHex = Buffer.from('hello world', 'utf8').toString('hex').toLowerCase();
        madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
        secpSigner = new SecpSigner(madWallet, privateKey);

        await madWallet.Account.addAccount(privateKey, 2);
        await madWallet.Account.addAccount(secondaryPrivateKey, 2);

        bnAccount = madWallet.Account.accounts[1];
    });

    describe('Aggregate and Verify Signatures', () => {
        it('Success: Verify BN Signature', async () => {
            const accountBN = await madWallet.Account.getAccount(bnAccount.address);
            const signature = await accountBN.signer.sign(msgHex);
            expect(signature).to.be.a('string');
        });

        it('Success: Sign Multiple Messages', async () => {
            const accountBN = await madWallet.Account.getAccount(bnAccount.address);
            const signatures = await accountBN.signer.signMulti([msgHex, msgHex]);
            expect(signatures).to.be.an('array');
        });

        it('Fail: Fail if signer in MultiSig constructor is not an instance of BnSigner', async () => {
            expect(() => new MultiSig(madWallet, secpSigner)).to.throw(Error);
        });
    });
});
