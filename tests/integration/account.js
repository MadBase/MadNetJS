require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require('../../index.js');

describe('Integration/Account:', () => {
    let privateKey, madWallet, wrongAccountAddress;
    let secpAccount, bnAccount;
    let secpAccountSigned, bnAccountSigned;
    
    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
        wrongAccountAddress = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';

        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(privateKey, 2);

        const balance = await madWallet.Account.accounts[0].getAccountBalance();

        if(balance === '00' ){
            console.log(`Balance is ${balanceSECP}`, '\nInsufficient funds, skipping tests.');
            this.skip();
        }
        
        secpAccount = madWallet.Account.accounts[0];
        bnAccount = madWallet.Account.accounts[1];
    });

    beforeEach(async function() {
        const madWalletSigned = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);

        await madWalletSigned.Account.addAccount(privateKey, 1);
        await madWalletSigned.Account.addAccount(privateKey, 2);
        
        secpAccountSigned = madWalletSigned.Account.accounts[0];
        bnAccountSigned = madWalletSigned.Account.accounts[1];
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
                madWallet.Account.addAccount(privateKey.slice(0, -1) + 'Z', 1)
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });

        it('Fail: Reject when called with invalid Curve spec', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey, 3)
            ).to.eventually.be.rejectedWith('Invalid curve');
        });

        it('Success: Add Account when Private Key is valid and curve = 1', async () => {
            const madWalletInstance = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
            await expect(madWalletInstance.Account.addAccount(privateKey, 1)).to.eventually.be.fulfilled;
        });

        it('Success: Add Account when Private Key is valid and curve = 2', async () => {
            const madWalletInstance = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
            await expect(madWalletInstance.Account.addAccount(privateKey, 2)).to.eventually.be.fulfilled;
        });

        it('Success: Add Account when Private Key starting with 0x', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey.slice(0, -1) + 'B', 1)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Add Account when Private Key is valid and no Curve spec (default = 1)', async () => {
            await expect(
                madWallet.Account.addAccount(privateKey.slice(0, -1) + 'C')
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
            const accountTwo = await madWallet.Account.getAccount(bnAccount.address);
            const accountTwoPK = await accountTwo.signer.getPubK();
            await expect(madWallet.Account.addMultiSig([ accountTwoPK ])).to.eventually.be.fulfilled;
        });
    });

    describe('Get Account', () => {
        it('Fail: Reject when address not added', async () => {
            await expect(
                madWallet.Account.getAccount(wrongAccountAddress)
            ).to.eventually.be.rejectedWith('Could not find account');
        });

        it('Success: Get Account when address is valid', async () => {
            await expect(madWallet.Account.getAccount(secpAccount.address)).to.eventually.be.fulfilled;
        });

        it('Success: Get account balance', async () => {
            await expect(secpAccount.getAccountBalance()).to.eventually.be.fulfilled;
        });
    });

    describe('Get Account Index', () => {
        it('Fail: Reject when address index not found', async () => {
            await expect(
                madWallet.Account._getAccountIndex(wrongAccountAddress)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        it('Success: Get index for account by address', async () => {
            await expect(madWallet.Account._getAccountIndex(secpAccount.address)).to.eventually.be.fulfilled;
        });
    });

    describe('Signatures', () => {
        it('Success: Sign a message with BN signer', async () => {
            await expect(bnAccountSigned.signer.sign('0xc0ffee')).to.eventually.be.fulfilled;
        });

        it('Success: Sign a message with SECP signer', async () => {
            await expect(secpAccountSigned.signer.sign('0xc0ffee')).to.eventually.be.fulfilled;
        });

        it('Success: Sign and verify a SECP message with Signer.sign() & .verify()', async () => {
            let msg = '0xc0ffee';
            let signature = await secpAccountSigned.signer.sign(msg);
            let verify = secpAccountSigned.signer.verify(msg, signature);
            expect(verify).to.eventually.be.fulfilled;
        })

        it('Fail: An incorrect verifacation request for \'caffee\' will fail for a signed SECP message of \'c0ffee\'', async () => {
            let msg = '0xc0ffee';
            let wrongVerifyMsg = '0xcafee';
            let signature = await secpAccountSigned.signer.sign(msg);
            await expect(
                secpAccountSigned.signer.verify(wrongVerifyMsg, signature)
            ).to.eventually.be.rejectedWith('Public Keys don\'t match');
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
            await expect(secpAccount.getAccountUTXOs(0)).to.eventually.be.fulfilled;
        });

        it('Success: Poll UTXOs for an added account', async () => {
            await expect(madWallet.Account._getAccountUTXOs(secpAccount.address, 0)).to.eventually.be.fulfilled;
        });

        it('Success: Poll UTXOs by utxoIds from account helper', async () => {
            const utxoids = await madWallet.Rpc.getDataStoreUTXOIDs(secpAccount.address, 1);
            await expect(secpAccount.getAccountUTXOsByIds(utxoids)).to.eventually.be.fulfilled;
        });

        it('Success: Poll UTXOs for an added account by utxoIds', async () => {
            const utxoids = await madWallet.Rpc.getDataStoreUTXOIDs(secpAccount.address, 1);
            await expect(madWallet.Account._getAccountUTXOsByIds(secpAccount.address, utxoids)).to.eventually.be.fulfilled;
        });
    });

    describe('Value Stores', () => {
        it('Fail: Cannot get value stores for non-added account', async () => {
            await expect(
                madWallet.Account._getAccountValueStores(wrongAccountAddress, 0)
            ).to.eventually.be.rejectedWith('Could not find account index');
        });

        it('Success: Get value stores from account helper', async () => {
            await secpAccount.getAccountValueStores(0);
            const account = await madWallet.Account.getAccount(secpAccount.address);
            expect(account.UTXO.ValueStoreIDs.length).to.be.greaterThan(0);
        });

        it('Success: Get account value stores for an added account', async () => {
           await expect(madWallet.Account._getAccountValueStores(secpAccount.address, 0)).to.eventually.be.fulfilled;
        });

        it('Success: Get account value stores for an added account with minValue greater than 0', async () => {
            await madWallet.Account._getAccountValueStores(secpAccount.address, 1);
            const account = await madWallet.Account.getAccount(secpAccount.address);
            expect(account.UTXO.ValueStoreIDs.length).to.be.greaterThan(0);
        });
    });

    describe('Data Stores', () => {
        it('Success: Get data stores from account helper', async () => {
            await expect(secpAccount.getAccountDataStores(0)).to.eventually.be.fulfilled;
        });
    });

    describe('Remove Account', () => {
        it('Fail: Reject when called with invalid Address', async () => {
            await expect(madWallet.Account.removeAccount(null)).to.eventually.be.rejectedWith('No input provided');
        });

        it('Success: Remove existing account by address', async () => {
            await expect(madWallet.Account.removeAccount(secpAccount.address)).to.eventually.be.fulfilled;
        });
    });
});