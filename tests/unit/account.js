require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const expect = chai.expect
let MadWalletJS = require("../../index.js");

let privateKey;

if (process.env.PRIVATE_KEY) {
    privateKey = process.env.PRIVATE_KEY;
}
else {
    privateKey = "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A"
}

const madWallet = new MadWalletJS();
const publicKeys = [
    '2c4f0713d07005ea95b0174ef7bfd34a1d2ba2ed40a315fa969664717a3d6746149bac51ff10f4fb3285805ae7f9ee62a41cd9353d3f36c86b2f8157eb194e9b229471a343bf20962ea5e71a944c90a2e07d4fb085382c13d6d6df1e2870c13803ada9e55fb719c4d5cf015b819fc3df5e0d381b9c928fef9970366d6f8f5379', 
    '0928b847ee0c4e5851ea6e9943dc8fd3c0cd463e35844fcac6ec303cf7c6796d137bdb1da527b9b822be3d14c866081857a6711e98807b112d3d77bfd434c3be02ed582a08c08c7ddb5355c7f742c1581288e9c43552b16b7ffa16b826d2839116c6c3bea6c0cef1b38088c4ab31daa51eade02a9b8100e04e7de7d88b7b8fb9'
];
const accountAddress = "0xc2f89cbbcdcc7477442e7250445f0fdb3238259b";

describe('Account', () => {
    before(async function(){});

    describe('Add Account', () => {
        // TODO Undefined - Test addAccount() Any validation error will be thrown in the lines 26,27. 
            // The block of code in line 29 seems to be unreachable - Should it be removed?
        
        it('Fail: Invalid private key length', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey.slice(0, -1), 1)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Invalid private key data type', async () => {
            await expect(
                madWallet.Account.addAccount(Number(privateKey), 1)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Invalid private key character', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey.slice(0, -1) + "Z", 1)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Invalid curve spec', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey, 3)
            ).to.eventually.be.rejectedWith(Error);
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
            ).to.eventually.be.rejectedWith(Error);
        });
    });

    describe('Add MultiSig', () => {
        it('Fail: Invalid publicKeys in addMultiSig', async () => {
            await expect(
                madWallet.Account.addMultiSig(undefined)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Valid publicKeys', async () => {
            await expect(
                madWallet.Account.addMultiSig(publicKeys)
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Remove Account', () => {
        it('Fail: Throw error when null address', async () => {
            await expect(
                madWallet.Account.removeAccount(null)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Remove existing account by address', async () => {
            await expect(
                madWallet.Account.removeAccount(madWallet.Account.accounts[0]["address"])
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Get Account', () => {
        it('Fail: Get account from address not added', async () => {
            await expect(
                madWallet.Account.getAccount(accountAddress)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Get account from address', async () => {
            await expect(
                madWallet.Account.getAccount(madWallet.Account.accounts[0]["address"])
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Get Account Index', () => {
        it('Fail: Get index for account by address not added', async () => {
            await expect(
                madWallet.Account._getAccountIndex(accountAddress)
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Get index for account by address', async () => {
            await expect(
                madWallet.Account._getAccountIndex(madWallet.Account.accounts[0]["address"])
            ).to.eventually.be.fulfilled;
        });
    });

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
});
