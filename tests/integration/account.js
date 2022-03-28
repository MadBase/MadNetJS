require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");

describe('Integration/Account:', () => {
    let privateKey, madWallet, wrongAccountAddress;

    // TODO Remove magic values
    const publicKeys = [
        '2c4f0713d07005ea95b0174ef7bfd34a1d2ba2ed40a315fa969664717a3d6746149bac51ff10f4fb3285805ae7f9ee62a41cd9353d3f36c86b2f8157eb194e9b229471a343bf20962ea5e71a944c90a2e07d4fb085382c13d6d6df1e2870c13803ada9e55fb719c4d5cf015b819fc3df5e0d381b9c928fef9970366d6f8f5379',
        '0928b847ee0c4e5851ea6e9943dc8fd3c0cd463e35844fcac6ec303cf7c6796d137bdb1da527b9b822be3d14c866081857a6711e98807b112d3d77bfd434c3be02ed582a08c08c7ddb5355c7f742c1581288e9c43552b16b7ffa16b826d2839116c6c3bea6c0cef1b38088c4ab31daa51eade02a9b8100e04e7de7d88b7b8fb9'
    ];
    
    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
        wrongAccountAddress = "0xc2f89cbbcdcc7477442e7250445f0fdb3238259b";

        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(privateKey, 2);
    });

    describe('Add Account', () => {
        it('Fail: Reject when called with invalid Private Key length', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey.slice(0, -1), 1)
            ).to.eventually.be.rejectedWith('Invalid length');
        });

        it('Fail: Reject when called with invalid Private Key data type', async () => {
            await expect(
                madWallet.Account.addAccount(Number(privateKey), 1)
            ).to.eventually.be.rejectedWith('No input provided');
        });

        it('Fail: Reject when called with invalid Private Key character', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey.slice(0, -1) + "Z", 1)
            ).to.eventually.be.rejectedWith('Invalid hex charater');
        });

        it('Fail: Reject when called with invalid Curve spec', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey, 3)
            ).to.eventually.be.rejectedWith('Invalid curve');
        });

        it('Success: Add Account when Private Key is valid and curve = 1', async () => {
            const madWalletInstance = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
            await expect(
                madWalletInstance.Account.addAccount(privateKey, 1)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Add Account when Private Key is valid and curve = 2', async () => {
            const madWalletInstance = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
            await expect(
                madWalletInstance.Account.addAccount(privateKey, 2)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Add Account when Private Key starting with 0x', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey.slice(0, -1) + "B", 1)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Add Account when Private Key is valid and no Curve spec (default = 1)', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey.slice(0, -1) + "C")
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject when Private key already added', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey, 1)
            ).to.eventually.be.rejectedWith('Account already added');
        });
    });

    describe('Add MultiSig', () => {
        it('Fail: Reject when called with invalid publicKeys', async () => {
            await expect(
                madWallet.Account.addMultiSig(undefined)
            ).to.eventually.be.rejectedWith('Invalid public key array');
        });

        it('Success: Add Multi Sig when called with valid publicKeys', async () => {
            await expect(
                madWallet.Account.addMultiSig(publicKeys)
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Remove Account', () => {
        it('Fail: Reject when called with invalid Address', async () => {
            await expect(
                madWallet.Account.removeAccount(null)
            ).to.eventually.be.rejectedWith('No input provided');
        });

        it('Success: Remove existing account by address', async () => {
            await expect(
                madWallet.Account.removeAccount(madWallet.Account.accounts[0]["address"])
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Get Account', () => {
        it('Fail: Reject when address not added', async () => {
            await expect(
                madWallet.Account.getAccount(wrongAccountAddress)
            ).to.eventually.be.rejectedWith('Could not find account');
        });

        it('Success: Get Account when address is valid', async () => {
            await expect(
                madWallet.Account.getAccount(madWallet.Account.accounts[0]["address"])
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Get Account Index', () => {
        it('Fail: Reject when address index not found', async () => {
            await expect(
                madWallet.Account._getAccountIndex(wrongAccountAddress)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        it('Success: Get index for account by address', async () => {
            await expect(
                madWallet.Account._getAccountIndex(madWallet.Account.accounts[0]["address"])
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Signatures', () => {
        it('Success: Sign a message with BN signer', async () => {
            await expect(
                madWallet.Account.accounts[0]["signer"].sign("0xc0ffee")
            ).to.eventually.be.fulfilled;
        });

        it('Success: Sign a message with SECP signer', async () => {
            await expect(
                madWallet.Account.accounts[1]["signer"].sign("0xc0ffee")
            ).to.eventually.be.fulfilled;
        });

        it("Success: Sign and verify a SECP message with Signer.sign() & .verify()", async () => {
            let msg = "0xc0ffee";
            let signature = await madWallet.Account.accounts[1]["signer"].sign(msg);
            let verify = madWallet.Account.accounts[1]["signer"].verify(msg, signature);
            expect(verify).to.eventually.be.fulfilled;
        })

        it("Fail: An incorrect verifacation request for 'caffee' will fail for a signed SECP message of 'c0ffee'", async () => {
            let msg = "0xc0ffee";
            let wrongVerifyMsg = "0xcafee";
            let signature = await madWallet.Account.accounts[1]["signer"].sign(msg);
            await expect(
                madWallet.Account.accounts[1]["signer"].verify(wrongVerifyMsg, signature)
            ).to.eventually.be.rejectedWith("Public Keys don't match");
        })

    });

    describe('UTXOs', () => {
        it('Fail: Non-added account cannot poll for UTXOs', async () => {
            await expect(
                madWallet.Account._getAccountUTXOs(wrongAccountAddress, 0)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        it('Fail: Non-added account cannot poll for UTXOs by utxoIds', async () => {
            await expect(
                madWallet.Account._getAccountUTXOsByIds(wrongAccountAddress, 1)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        it('Success: Poll UTXOs from account helper', async () => {
            await expect(
                madWallet.Account.accounts[0].getAccountUTXOs(0)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Poll UTXOs for an added account', async () => {
            await expect(
                madWallet.Account._getAccountUTXOs(madWallet.Account.accounts[0]['address'], 0)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Poll UTXOs by utxoIds from account helper', async () => {
            const utxoids = await madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1);
            await expect(
                madWallet.Account.accounts[0].getAccountUTXOsByIds(utxoids)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Poll UTXOs for an added account by utxoIds', async () => {
            const utxoids = await madWallet.Rpc.getDataStoreUTXOIDs(madWallet.Account.accounts[0]['address'], 1);
            await expect(
                madWallet.Account._getAccountUTXOsByIds(madWallet.Account.accounts[0]['address'], utxoids)
            ).to.eventually.be.fulfilled;
        });
    });

    describe('Value Stores', () => {
        it('Fail: Cannot get value stores for non-added account', async () => {
            await expect(
                madWallet.Account._getAccountValueStores(wrongAccountAddress, 0)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        it('Success: Get value stores from account helper', async () => {
            await madWallet.Account.accounts[0].getAccountValueStores(0)
            const account = await madWallet.Account.getAccount(madWallet.Account.accounts[0]['address']);
            expect(
                account['UTXO']['ValueStoreIDs'].length
            ).to.be.greaterThan(0);
        });

        it('Success: Get account value stores for an added account', async () => {
           await expect(
                madWallet.Account._getAccountValueStores(madWallet.Account.accounts[0]["address"], 0)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Get account value stores for an added account with minValue greater than 0', async () => {
            await madWallet.Account._getAccountValueStores(madWallet.Account.accounts[0]["address"], 1);
            const account = await madWallet.Account.getAccount(madWallet.Account.accounts[0]['address']);
            expect(
                account['UTXO']['ValueStoreIDs'].length
            ).to.be.greaterThan(0);
        });
    });

    describe('Data Stores', () => {
        it('Fail: Cannot get data stores for non-added account', async () => {
            await expect(
                madWallet.Account._getAccountDataStores(wrongAccountAddress, 0)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        it('Success: Get data stores from account helper', async () => {
            await madWallet.Account.accounts[0].getAccountDataStores(0);
            const account = await madWallet.Account.getAccount(madWallet.Account.accounts[0]['address']);
            expect(
                account['UTXO']['DataStoreIDs'].length
            ).to.be.greaterThan(0);
        });

        it('Success: Get account data stores for an added account', async () => {
           await expect(
                madWallet.Account._getAccountDataStores(madWallet.Account.accounts[0]["address"], 0)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Get account data stores for an added account with minValue greater than 0', async () => {
            await madWallet.Account._getAccountDataStores(madWallet.Account.accounts[0]["address"], 1);
            const account = await madWallet.Account.getAccount(madWallet.Account.accounts[0]['address']);
            expect(
                account['UTXO']['DataStoreIDs'].length
            ).to.be.greaterThan(0);
        });
    });
});