const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const expect = chai.expect
require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const MadWalletJS = require("../../index.js");
const MultiSig = require("../../src/Signers/MultiSig");
const SecpSigner = require("../../src/Signers/SecpSigner.js");

let privateKey;
const publicKeys = [
    '2c4f0713d07005ea95b0174ef7bfd34a1d2ba2ed40a315fa969664717a3d6746149bac51ff10f4fb3285805ae7f9ee62a41cd9353d3f36c86b2f8157eb194e9b229471a343bf20962ea5e71a944c90a2e07d4fb085382c13d6d6df1e2870c13803ada9e55fb719c4d5cf015b819fc3df5e0d381b9c928fef9970366d6f8f5379', 
    '0928b847ee0c4e5851ea6e9943dc8fd3c0cd463e35844fcac6ec303cf7c6796d137bdb1da527b9b822be3d14c866081857a6711e98807b112d3d77bfd434c3be02ed582a08c08c7ddb5355c7f742c1581288e9c43552b16b7ffa16b826d2839116c6c3bea6c0cef1b38088c4ab31daa51eade02a9b8100e04e7de7d88b7b8fb9'
];
const signatures = [
    '14909a6ab1c19ad26264cb1491885a8ba9a936264ab7c71d4cc58f889419b458289da71e04086b804a4b74b358ef923e2f6cba9bf87310724d72571efcd49e0802390d2d1dc0715f9a7d0f36d5b511baf5e0833bf3f0db881457ce5b523e1d0512dba7a1a0d623805fc79c642efb77fd3286747bbaa71c4365fa3f64a80fc83c2cbccc0e2f548ee60fc5f6cb407b63b281be07068cd3b4dbc6f7aaf983471d2318f1bc95df4b1bb3cf82d2e45b64b9d461b902c59b8d85c9b71761445b72b37d', 
    '14909a6ab1c19ad26264cb1491885a8ba9a936264ab7c71d4cc58f889419b458289da71e04086b804a4b74b358ef923e2f6cba9bf87310724d72571efcd49e0802390d2d1dc0715f9a7d0f36d5b511baf5e0833bf3f0db881457ce5b523e1d0512dba7a1a0d623805fc79c642efb77fd3286747bbaa71c4365fa3f64a80fc83c2cbccc0e2f548ee60fc5f6cb407b63b281be07068cd3b4dbc6f7aaf983471d2318f1bc95df4b1bb3cf82d2e45b64b9d461b902c59b8d85c9b71761445b72b37d'
];

if (process.env.PRIVATE_KEY) {
    privateKey = process.env.PRIVATE_KEY;
}
else {
    privateKey = "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A"
}

const madWallet = new MadWalletJS();
const secpSigner = new SecpSigner(madWallet, privateKey);
const multiSigSecp = new MultiSig(madWallet, secpSigner);

// TODO Create new instance for tests that need no public key to fail
describe('MultiSig', () => {
    before(async function(){});

    it('Fail: Get Public Key', async () => {
        await expect(
            multiSigSecp.getPubK()
        ).to.eventually.be.rejectedWith(Error);
    });

    it('Fail: Get Address', async () => {
        await expect(
            multiSigSecp.getAddress()
        ).to.eventually.be.rejectedWith(Error);
    });

    it('Success: Add Public Keys', async () => {
        await expect(
            multiSigSecp.addPublicKeys(publicKeys)
        ).to.eventually.be.fulfilled;
    });

    it('Success: Get Public Key', async () => {
        await expect(
            multiSigSecp.getPubK()
        ).to.eventually.be.fulfilled;
    });

    it('Fail: Add null Public Key', async () => {
        await expect(
            multiSigSecp.addPublicKeys(null)
        ).to.eventually.be.rejectedWith(Error);
    });

    it('Success: Get Address', async () => {
        await expect(
            multiSigSecp.getAddress()
        ).to.eventually.be.fulfilled;
    });

    it('Success: Sign', async () => {
        await expect(
            multiSigSecp.sign('0000ffeebabe')
        ).to.eventually.be.fulfilled;
    });

    it('Fail: Sign', async () => {
        await expect(
            multiSigSecp.sign()
        ).to.eventually.be.rejectedWith(Error);
    });

    it('Success: Sign Multi', async () => {
        await expect(
            multiSigSecp.signMulti(['0000ffeebabe', '0000ffeebabe'])
        ).to.eventually.be.fulfilled;
    });

    it('Fail: Sign Multi', async () => {
        await expect(
            multiSigSecp.signMulti()
        ).to.eventually.be.rejectedWith(Error);
    });

    it('Success: Aggregate Signatures', async () => {
        await expect(
            multiSigSecp.aggregateSignatures(signatures)
        ).to.eventually.be.fulfilled;
    });

    it('Fail: Aggregate Signatures', async () => {
        await expect(
            multiSigSecp.aggregateSignatures()
        ).to.eventually.be.rejectedWith(Error);
    });

    it('Success: Aggregate Multi Signatures', async () => {
        await expect(
            multiSigSecp.aggregateSignaturesMulti([signatures])
        ).to.eventually.be.fulfilled;
    });

    it('Fail: Aggregate Multi Signatures', async () => {
        await expect(
            multiSigSecp.aggregateSignaturesMulti()
        ).to.eventually.be.rejectedWith(Error);
    });

    it.only('Success: Verify Aggregate', async () => {
        await expect(
            multiSigSecp.verifyAggregate('0xc0ffeebabe', ['0xc0ffeebabe'])
        ).to.eventually.be.fulfilled;
    });

    it('Fail: Verify Aggregate', async () => {
        await expect(
            multiSigSecp.verifyAggregate()
        ).to.eventually.be.rejectedWith(Error);
    });
});
