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
    let bnSigner, multiSigSecp, publicKeys, signatures;
    let secpAccount, bnAccount;

    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        secondaryPrivateKey = process.env.OPTIONAL_TEST_SUITE_SECONDARY_PRIVATE_KEY;
        msgHex = Buffer.from('hello world', 'utf8').toString('hex').toLowerCase();
        madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
        secpSigner = new SecpSigner(madWallet, privateKey);
        bnSigner = new BNSigner(madWallet, privateKey);
        multiSigSecp = new MultiSig(madWallet, secpSigner);

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

    describe('Public Key and Address', () => {
        it('Fail: Reject getPubK when no Public Key is added', async () => {
            await expect(multiSigSecp.getPubK()).to.eventually.be.rejectedWith('Need public keys');
        });

        it('Fail: Reject getAddress when no Public Key is added', async () => {
            await expect(multiSigSecp.getAddress()).to.eventually.be.rejectedWith('Need public keys');
        });

        it('Fail: Reject addPublicKeys when called with invalid Public Key', async () => {
            await expect(multiSigSecp.addPublicKeys(null)).to.eventually.be.rejectedWith('Need public keys');
        });

        it('Success: Add Public Keys', async () => {
            await expect(
                multiSigSecp.addPublicKeys(publicKeys)
            ).to.eventually.match(/^[0-9a-fA-F]+$/).and.have.length(256);
        });

        it('Success: Get Public Key when one was previously added', async () => {
            await expect(
                multiSigSecp.getPubK()
            ).to.eventually.match(/^[0-9a-fA-F]+$/).and.have.length(256);
        });

        it('Success: Get Address when a Public Key exists', async () => {
            await multiSigSecp.addPublicKeys(publicKeys)
            await expect(
                multiSigSecp.getAddress()
            ).to.eventually.match(/^[0-9a-fA-F]+$/).and.have.length(40);
        });
    });

    describe('Sign and Multi Sign', () => {
        it('Fail: Reject Sign when called with invalid rawMsg', async () => {
            await expect(multiSigSecp.sign(null)).to.eventually.be.rejectedWith('Missing input');
        });
            
        it('Fail: Reject Sign Multi when called with invalid rawMsgs', async () => {
            await expect(
                multiSigSecp.signMulti(null)
            ).to.eventually.be.rejectedWith('Cannot read properties of null (reading \'length\')');
        });

        it('Success: Sign one message', async () => {
            await multiSigSecp.addPublicKeys(publicKeys)
            await expect(multiSigSecp.sign('0000ffeebabe')).to.eventually.be.fulfilled;
        });

        it('Success: Sign Multi messages', async () => {
            await multiSigSecp.addPublicKeys(publicKeys)
            await expect(multiSigSecp.signMulti(['0000ffeebabe', '0000ffeebabe'])).to.eventually.have.length(2);
        });
    });

    describe('Aggregate and Verify Signatures', () => {
        it('Fail: Reject Aggregate Signatures when called with invalid argument', async () => {
            await expect(
                multiSigSecp.aggregateSignatures(null)
            ).to.eventually.be.rejectedWith('Call using zero Value argument');
        });

        it('Fail: Reject Aggregate Multi Signatures when called with invalid argument', async () => {
            await expect(
                multiSigSecp.aggregateSignaturesMulti(null)
            ).to.eventually.be.rejectedWith('Cannot read properties of null (reading \'length\')');
        });

        it('Fail: Reject Verify Aggregate when called with invalid argument', async () => {
            await expect(
                multiSigSecp.verifyAggregate(null)
            ).to.eventually.be.rejectedWith('Arguments cannot be empty');
        });

        it('Fail: Reject Verify Aggregate when called with invalid sig hex length', async () => {
            await expect(
                multiSigSecp.verifyAggregate(msgHex, '0xc0ffeebab')
            ).to.eventually.be.rejectedWith('incorrect byte length');
        });

        it('Fail: Aggregate Signatures should fail unless an array is provided ', async () => {
            await expect(
                multiSigSecp.aggregateSignatures({})
            ).to.eventually.be.rejectedWith('Call using map[string]interface {} as type []interface {}');
        });

        it('Success: Aggregate Signatures', async () => {
            await expect(multiSigSecp.aggregateSignatures(signatures)).to.eventually.be.fulfilled;
        });

        it('Success: Aggregate Multi Signatures', async () => {
            await expect(multiSigSecp.aggregateSignaturesMulti([signatures])).to.eventually.be.fulfilled;
        });

        it('Success: Verify Secp Signature', async () => {
            const sig = await secpSigner.sign(msgHex);
            const recoverdePubK = await secpSigner.verify(msgHex, sig);
            expect(recoverdePubK).to.be.a('string');
        });

        it('Success: Verify BN Signature', async () => {
            const signature = await bnSigner.sign(msgHex);
            expect(signature).to.be.a('string');
        });

        it('Success: Verify Aggregate Signature', async () => {
            const sig = await bnSigner.sign(msgHex);
            const verifiedSig = await multiSigSecp.verifyAggregate(msgHex, sig);
            expect(verifiedSig).to.be.a('string');
        });

        it('Success: Verify Aggregate Single', async () => {
            const sig = await bnSigner.sign(msgHex);
            const pubKey = await bnSigner.getPubK();
            const verifiedSig = await multiSigSecp.verifyAggregateSingle(msgHex, pubKey, sig);
            expect(verifiedSig).to.be.a('string');
        });
    });
});
