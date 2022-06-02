require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const appRoot = require('app-root-path');
const MadWalletJS = require(appRoot + '/index.js');
const VerifySignature = require(appRoot + '/src/Util/VerifySignature');
const SecpSigner = require(appRoot + '/src/Signers/SecpSigner.js');
const BNSigner = require(appRoot + '/src/Signers/BNSigner.js');

describe('Unit/Util/VerifySignature:', () => {
    let privateKey, msgHex, madWallet, bnSigner, secpSigner;

    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
        bnSigner = new BNSigner(madWallet, privateKey);
        secpSigner = new SecpSigner(madWallet, privateKey);
        msgHex = Buffer.from('hello world', 'utf8').toString('hex').toLowerCase();
    });
    
    describe('BNSignerVerify', () => {  
        it('Success: Verify BNSigner sig', async () => {
            const sig = await bnSigner.sign(msgHex);
            const validateSig = await VerifySignature.BNSignerVerify(msgHex, sig);
            expect(validateSig).to.be.a('string');
        });

        it('Fail: Cannot verify BNSigner sig with empty arguments', async () => {
            await expect(
                VerifySignature.BNSignerVerify()
            ).to.eventually.be.rejectedWith('Arguments cannot be empty');
        });

        it('Fail: Cannot verify BNSigner sig with bad arguments', async () => {
            const sig = await bnSigner.sign(msgHex);
            await expect(
                VerifySignature.BNSignerVerify(msgHex + 'bad hex', sig + 'bad hex')
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });
    });

    describe('SecpSignerVerify', () => {  
        it('Success: Verify SecpSignerVerify sig', async () => {
            const sig = await secpSigner.sign(msgHex);
            const pubKey = await secpSigner.getPubK();
            const pubKeyRecovered = await VerifySignature.SecpSignerVerify(msgHex, sig, pubKey);
            expect(pubKeyRecovered).to.be.a('string');
        });

        it('Fail: Cannot verify SecpSignerVerify sig with empty arguments', async () => {
            await expect(
                VerifySignature.SecpSignerVerify()
            ).to.eventually.be.rejectedWith('Arguments cannot be empty');
        });

        it('Fail: Cannot verify SecpSignerVerify sig with bad arguments', async () => {
            const sig = await secpSigner.sign(msgHex);
            const pubKey = await secpSigner.getPubK();
            await expect(
                VerifySignature.SecpSignerVerify(msgHex+ 'bad hex', sig + 'bad hex', pubKey)
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });

        it('Fail: Cannot verify SecpSignerVerify if Public Keys don\'t match', async () => {
            const sig = await secpSigner.sign(msgHex);
            const pubKey = await secpSigner.getPubK();
            await expect(
                VerifySignature.SecpSignerVerify(msgHex, sig, pubKey + 'badpubkey')
            ).to.eventually.be.rejectedWith('Public Keys don\'t match');
        });
    });

    describe('MultiSigVerify', () => {  
        it('Success: verify MultiSigVerifyAggregate sig', async () => {
            const sig = await bnSigner.sign(msgHex);
            const aSig = await VerifySignature.MultiSigVerifyAggregate(msgHex, sig);
            expect(aSig).to.be.a('string');
        });

        it('Fail: verify MultiSigVerifyAggregate sig with bad arguments', async () => {
            const sig = await bnSigner.sign(msgHex);
            await expect(
                VerifySignature.MultiSigVerifyAggregate(msgHex + 'bad hex', sig + 'bad hex')
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });

        it('Success: verify MultiSigVerifyAggregateSingle sig', async () => {
            const sig = await bnSigner.sign(msgHex);
            const pubKey = await bnSigner.getPubK();
            const aSig = await VerifySignature.MultiSigVerifyAggregateSingle(msgHex, pubKey, sig);
            expect(aSig).to.be.a('string');
        });

        it('Fail: verify MultiSigVerifyAggregateSingle sig with bad arguments', async () => {
            const sig = await bnSigner.sign(msgHex);
            const pubKey = await bnSigner.getPubK();
            await expect(
                VerifySignature.MultiSigVerifyAggregateSingle(msgHex + 'bad hex', pubKey, sig + 'bad hex')
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });
    });
});