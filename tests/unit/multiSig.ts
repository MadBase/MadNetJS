import * as dotenv from 'dotenv';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import MadWalletJS from '../../index';
import MultiSig from '../../src/Signers/MultiSig';
import BNSigner from '../../src/Signers/BNSigner';

dotenv.config({ path: process.cwd() + '/.env' });
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Unit/MultiSig:', () => {
    let privateKey, secondaryPrivateKey, msgHex, madWallet, multiSigBn, bnAccount, bnAccount2, signatures;
    let bnSigner, secpSigner, publicKeys;
    before(async function () {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        secondaryPrivateKey = process.env.OPTIONAL_TEST_SUITE_SECONDARY_PRIVATE_KEY;
        msgHex = Buffer.from('hello world', 'utf8').toString('hex').toLowerCase();
        madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);

        bnSigner = new BNSigner(madWallet, privateKey);
        multiSigBn = new MultiSig(madWallet, bnSigner);

        await madWallet.account.addAccount(privateKey, 2);
        await madWallet.account.addAccount(secondaryPrivateKey, 2);

        bnAccount = madWallet.account.accounts[0];
        bnAccount2 = madWallet.account.accounts[1];

        publicKeys = [await bnAccount.signer.getPubK(), await bnAccount2.signer.getPubK()];

        let multiAccount = await madWallet.account.addMultiSig(publicKeys);
        let multiPubK = await multiAccount.signer.getPubK()

        let signatureOne = await bnAccount.signer.multiSig.sign(msgHex, multiPubK);
        let signatureTwo = await bnAccount2.signer.multiSig.sign(msgHex, multiPubK);

        signatures = [ signatureOne, signatureTwo ];

    });

    describe('Public Key and Address', () => {
        it('Fail: Reject getPubK when no Public Key is added', async () => {
            await expect(multiSigBn.getPubK()).to.eventually.be.rejectedWith('Need public keys');
        });

        it('Fail: Reject getAddress when no Public Key is added', async () => {
            await expect(multiSigBn.getAddress()).to.eventually.be.rejectedWith('Need public keys');
        });

        it('Fail: Reject addPublicKeys when called with invalid Public Key', async () => {
            await expect(multiSigBn.addPublicKeys(null)).to.eventually.be.rejectedWith('Need public keys');
        });

        it('Success: Add Public Keys', async () => {
            await expect(
                multiSigBn.addPublicKeys(publicKeys)
            ).to.eventually.match(/^[0-9a-fA-F]+$/).and.have.length(256);
        });

        it('Success: Get Public Key when one was previously added', async () => {
            await expect(
                multiSigBn.getPubK()
            ).to.eventually.match(/^[0-9a-fA-F]+$/).and.have.length(256);
        });

        it('Success: Get Address when a Public Key exists', async () => {
            await multiSigBn.addPublicKeys(publicKeys)
            await expect(
                multiSigBn.getAddress()
            ).to.eventually.match(/^[0-9a-fA-F]+$/).and.have.length(40);
        });
    });

    describe('Sign and Multi Sign', () => {
        it('Fail: Reject Sign when called with invalid rawMsg', async () => {
            await expect(multiSigBn.sign(null)).to.eventually.be.rejectedWith('Missing input');
        });

        it('Fail: Reject Sign Multi when called with invalid rawMsgs', async () => {
            await multiSigBn.addPublicKeys(publicKeys)
            await expect(multiSigBn.sign('0000ffeebabe')).to.eventually.be.fulfilled;
        });

        it('Success: Sign Multi messages', async () => {
            await multiSigBn.addPublicKeys(publicKeys)
            await expect(multiSigBn.signMulti(['0000ffeebabe', '0000ffeebabe'])).to.eventually.have.length(2);
        });
    });

    describe('Aggregate and Verify Signatures', () => {

        it('Fail: Reject Aggregate Signatures when called with invalid argument', async () => {
            await expect(
                multiSigBn.aggregateSignatures(null)
            ).to.eventually.be.rejectedWith('Call using zero Value argument');
        });

        it('Fail: Reject Aggregate Multi Signatures when called with invalid argument', async () => {
            await expect(
                multiSigBn.aggregateSignaturesMulti(null)
            ).to.eventually.be.rejectedWith("TypeError: Cannot read properties of null (reading 'length')");
        });

        it('Fail: Reject Verify Aggregate when called with invalid argument', async () => {
            await expect(
                multiSigBn.verifyAggregate(null)
            ).to.eventually.be.rejectedWith('Arguments cannot be empty');
        });

        it('Fail: Reject Verify Aggregate when called with invalid sig hex length', async () => {
            await expect(
                multiSigBn.verifyAggregate(msgHex, '0xc0ffeebab')
            ).to.eventually.be.rejectedWith('incorrect byte length');
        });

        it('Fail: Aggregate Signatures should fail unless an array is provided ', async () => {
            await expect(multiSigBn.aggregateSignatures({})).to.eventually.be.rejectedWith('Call using map[string]interface {} as type []interface {}');
        });

        it('Success: Aggregate Signatures', async () => {
            await expect(multiSigBn.aggregateSignatures(signatures)).to.eventually.be.fulfilled;
        });

        it('Success: Aggregate Multi Signatures', async () => {
            await expect(multiSigBn.aggregateSignaturesMulti([signatures])).to.eventually.be.fulfilled;
        });

        it('Success: Verify Aggregate Signature', async () => {
            const sig = await bnSigner.sign(msgHex);
            const verifiedSig = await multiSigBn.verifyAggregate(msgHex, sig);
            expect(verifiedSig).to.be.a('string');
        });

        it('Success: Verify Aggregate Single', async () => {
            const sig = await bnSigner.sign(msgHex);
            const pubKey = await bnSigner.getPubK();
            const verifiedSig = await multiSigBn.verifyAggregateSingle(msgHex, pubKey, sig);
            expect(verifiedSig).to.be.a('string');
        });

        it('Success: Verify BN Signature', async () => {
            const accountBN = await madWallet.account.getAccount(bnAccount.address);
            const signature = await accountBN.signer.sign(msgHex);
            expect(signature).to.be.a('string');
        });

        it('Success: Sign Multiple Messages', async () => {
            const accountBN = await madWallet.account.getAccount(bnAccount.address);
            const signatures = await accountBN.signer.signMulti([msgHex, msgHex]);
            expect(signatures).to.be.an('array');
        });

        it('Fail: Fail if signer in MultiSig constructor is not an instance of BnSigner', async () => {
            expect(() => new MultiSig(madWallet, secpSigner)).to.throw(Error);
        });
    });

});
