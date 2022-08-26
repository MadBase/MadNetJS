require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require('../../index.js');
const MultiSig = require('../../src/Signers/MultiSig');
const SecpSigner = require('../../src/Signers/SecpSigner.js');
const BNSigner = require('../../src/Signers/BNSigner.js');

describe('Unit/MultiSig:', () => {
    let privateKey, secondaryPrivateKey, msgHex, madWallet, secpSigner;
    let bnSigner, publicKeys, signatures;
    let secpAccount, bnAccount;

    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        secondaryPrivateKey = process.env.OPTIONAL_TEST_SUITE_SECONDARY_PRIVATE_KEY;
        msgHex = Buffer.from('hello world', 'utf8').toString('hex').toLowerCase();
        madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
        secpSigner = new SecpSigner(madWallet, privateKey);
        bnSigner = new BNSigner(madWallet, privateKey);

        await madWallet.Account.addAccount(privateKey, 2);
        await madWallet.Account.addAccount(secondaryPrivateKey, 2);

        secpAccount = madWallet.Account.accounts[0];
        bnAccount = madWallet.Account.accounts[1];

        let account = await madWallet.Account.getAccount(secpAccount.address);
        let accountPK = await account.signer.getPubK();
        let accountTwo = await madWallet.Account.getAccount(bnAccount.address);
        let accountTwoPK = await accountTwo.signer.getPubK();

        publicKeys = [ accountPK, accountTwoPK ];

        let multiAccount = await madWallet.Account.addMultiSig(publicKeys);
        let multiPubK = await multiAccount.signer.getPubK()
        let signatureOne = await account.signer.multiSig.sign(msgHex, multiPubK);
        let signatureTwo = await accountTwo.signer.multiSig.sign(msgHex, multiPubK);

        signatures = [ signatureOne, signatureTwo ];
    });

    describe('Aggregate and Verify Signatures', () => {

        it('Success: Verify Secp Signature', async () => {
            const sig = await secpSigner.sign(msgHex);
            const recoverdePubK = await secpSigner.verify(msgHex, sig);
            expect(recoverdePubK).to.be.a('string');
        });

        it('Success: Verify BN Signature', async () => {
            const signature = await bnSigner.sign(msgHex);
            expect(signature).to.be.a('string');
        });

        it('Fail: Verify bnSigner in MultiSig constructor is an instance of BnSigner', async () => {
            expect(() => new MultiSig(madWallet, secpSigner)).to.throw(Error);
        });

    });
});
