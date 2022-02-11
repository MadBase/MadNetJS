const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const expect = chai.expect
let MadWalletJS = require("../../index.js");
require('dotenv').config({ path: process.cwd() + '/tests/.env' });

let privateKey;
if (process.env.PRIVATE_KEY) {
    privateKey = process.env.PRIVATE_KEY;
}
else {
    privateKey = "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A"
}

let madWallet = new MadWalletJS();

describe('Account', () => {
    before(async() => {
    });

    it('Fail: Invalid private key length', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey.slice(0, -1), 1)
        ).to.eventually.be.rejected;
    });

    it('Fail: Invalid private key character', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey.slice(0, -1) + "Z", 1)
        ).to.eventually.be.rejected;
    });

    it('Fail: Invalid curve spec', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey, 3)
        ).to.eventually.be.rejected;
    });

    it('Success: Valid private key, curve = 1', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey, 1)
        ).to.eventually.be.fulfilled;
    });

    it('Success: Valid private key, curve = 2', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey, 2)
        ).to.eventually.be.fulfilled;
    });

    it('Success: Valid private key starting with 0x', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey.slice(0, -1) + "B", 1)
        ).to.eventually.be.fulfilled;
    });

    it('Success: Valid private key, no curve spec (default = 1)', async () => {
        await expect(
            madWallet.Account.addAccount(privateKey.slice(0, -1) + "C")
        ).to.eventually.be.fulfilled;
    });

    it('Fail: Private key already added', async() => {
        await expect(
            madWallet.Account.addAccount(privateKey, 1)
        ).to.eventually.be.rejected;
    });

    it('Success: Get account from address', async () => {
        await expect(
            madWallet.Account.getAccount(madWallet.Account.accounts[0]["address"])
        ).to.eventually.be.fulfilled;
    });

    it('Fail: Get account from address not added', async () => {
        await expect(
            madWallet.Account.addAccount("0xc2f89cbbcdcc7477442e7250445f0fdb3238259b")
        ).to.eventually.be.rejected;
    });

})

describe('Signatures', () => {
    it('Success: BN', async () => {
        await expect(
            madWallet.Account.accounts[1]["signer"].sign("0xc0ffeebabe")
        ).to.eventually.be.fulfilled;
    });

    it('Success: SECP', async () => {
        await expect(
            madWallet.Account.accounts[0]["signer"].sign("0xc0ffeebabe")
        ).to.eventually.be.fulfilled;
    });
});