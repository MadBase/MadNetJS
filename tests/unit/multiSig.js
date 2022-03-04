require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");
const MultiSig = require("../../src/Signers/MultiSig");
const SecpSigner = require("../../src/Signers/SecpSigner.js");

describe('Unit/MultiSig:', () => {
    let privateKey, msgHex, madWallet, secpSigner, multiSigSecp;

    const publicKeys = [
        '2c4f0713d07005ea95b0174ef7bfd34a1d2ba2ed40a315fa969664717a3d6746149bac51ff10f4fb3285805ae7f9ee62a41cd9353d3f36c86b2f8157eb194e9b229471a343bf20962ea5e71a944c90a2e07d4fb085382c13d6d6df1e2870c13803ada9e55fb719c4d5cf015b819fc3df5e0d381b9c928fef9970366d6f8f5379', 
        '0928b847ee0c4e5851ea6e9943dc8fd3c0cd463e35844fcac6ec303cf7c6796d137bdb1da527b9b822be3d14c866081857a6711e98807b112d3d77bfd434c3be02ed582a08c08c7ddb5355c7f742c1581288e9c43552b16b7ffa16b826d2839116c6c3bea6c0cef1b38088c4ab31daa51eade02a9b8100e04e7de7d88b7b8fb9'
    ];
    const signatures = [
        '14909a6ab1c19ad26264cb1491885a8ba9a936264ab7c71d4cc58f889419b458289da71e04086b804a4b74b358ef923e2f6cba9bf87310724d72571efcd49e0802390d2d1dc0715f9a7d0f36d5b511baf5e0833bf3f0db881457ce5b523e1d0512dba7a1a0d623805fc79c642efb77fd3286747bbaa71c4365fa3f64a80fc83c2cbccc0e2f548ee60fc5f6cb407b63b281be07068cd3b4dbc6f7aaf983471d2318f1bc95df4b1bb3cf82d2e45b64b9d461b902c59b8d85c9b71761445b72b37d', 
        '14909a6ab1c19ad26264cb1491885a8ba9a936264ab7c71d4cc58f889419b458289da71e04086b804a4b74b358ef923e2f6cba9bf87310724d72571efcd49e0802390d2d1dc0715f9a7d0f36d5b511baf5e0833bf3f0db881457ce5b523e1d0512dba7a1a0d623805fc79c642efb77fd3286747bbaa71c4365fa3f64a80fc83c2cbccc0e2f548ee60fc5f6cb407b63b281be07068cd3b4dbc6f7aaf983471d2318f1bc95df4b1bb3cf82d2e45b64b9d461b902c59b8d85c9b71761445b72b37d'
    ];

    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        msgHex = Buffer.from("hello world", "utf8").toString("hex").toLowerCase();
        madWallet = new MadWalletJS();
        secpSigner = new SecpSigner(madWallet, privateKey);
        multiSigSecp = new MultiSig(madWallet, secpSigner);
    });

    describe('Public Key and Address', () => {
        it('Fail: Reject getPubK when no Public Key is added', async () => {
            await expect(
                multiSigSecp.getPubK()
            ).to.eventually.be.rejectedWith('Need public keys');
        });

        it('Fail: Reject getAddress when no Public Key is added', async () => {
            await expect(
                multiSigSecp.getAddress()
            ).to.eventually.be.rejectedWith('Need public keys');
        });

        it('Fail: Reject addPublicKeys when called with invalid Public Key', async () => {
            await expect(
                multiSigSecp.addPublicKeys(null)
            ).to.eventually.be.rejectedWith('Need public keys');
        });

        it('Success: Add Public Keys', async () => {
            await expect(
                multiSigSecp.addPublicKeys(publicKeys)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Get Public Key when one was previously added', async () => {
            await expect(
                multiSigSecp.getPubK()
            ).to.eventually.be.fulfilled;
        });

        it('Success: Get Address when a Public Key exists', async () => {
            await multiSigSecp.addPublicKeys(publicKeys)
            await expect(
                multiSigSecp.getAddress()
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Sign and Multi Sign', () => {
        it('Fail: Reject Sign when called with invalid rawMsg', async () => {
            await expect(
                multiSigSecp.sign(null)
            ).to.eventually.be.rejectedWith('Missing input');
        });
            
        it('Fail: Reject Sign Multi when called with invalid rawMsgs', async () => {
            await expect(
                multiSigSecp.signMulti(null)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Sign one message', async () => {
            await multiSigSecp.addPublicKeys(publicKeys)
            await expect(
                multiSigSecp.sign('0000ffeebabe')
            ).to.eventually.be.fulfilled;
        });

        it('Success: Sign Multi messages', async () => {
            await multiSigSecp.addPublicKeys(publicKeys)
            await expect(
                multiSigSecp.signMulti(['0000ffeebabe', '0000ffeebabe'])
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Aggregate and Verify Signatures', () => {
        it('Fail: Reject Aggregate Signatures when called with invalid argument', async () => {
            await expect(
                multiSigSecp.aggregateSignatures(null)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Reject Aggregate Multi Signatures when called with invalid argument', async () => {
            await expect(
                multiSigSecp.aggregateSignaturesMulti(null)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Reject Verify Aggregate when called with invalid argument', async () => {
            await expect(
                multiSigSecp.verifyAggregate(null)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Reject Verify Aggregate when called with invalid sig hex length', async () => {
            await expect(
                multiSigSecp.verifyAggregate(msgHex, '0xc0ffeebab')
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Aggregate Signatures', async () => {
            await expect(
                multiSigSecp.aggregateSignatures(signatures)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Aggregate Multi Signatures', async () => {
            await expect(
                multiSigSecp.aggregateSignaturesMulti([signatures])
            ).to.eventually.be.fulfilled;
        });
    });
});
