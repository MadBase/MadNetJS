import * as dotenv from 'dotenv';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

dotenv.config({ path: process.cwd() + '/.env' });
chai.use(chaiAsPromised);
const expect = chai.expect;
import MadWalletJS from '../../index';

describe('Integration/Transaction/Tx:', () => {
    let privateKey, validHex;
    let secpAccountTwo, secpAccountThree;
    const madWallet = new MadWalletJS({
        chainId: process.env.CHAIN_ID,
        rpcServer: process.env.RPC,
    });
    const madWalletTwo = new MadWalletJS({
        chainId: 1,
        rpcServer: process.env.RPC,
    });
    const madWalletThree = new MadWalletJS({
        chainId: 11,
        rpcServer: process.env.RPC,
    });

    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';

        await madWallet.account.addAccount(privateKey, 1);
        await madWalletTwo.account.addAccount(privateKey, 1);
        await madWalletThree.account.addAccount(privateKey, 1);

        const balance = await madWallet.account.accounts[0].getAccountBalance();

        // if(balance === '00' ){
        //     console.log(`Balance is ${balance}`, '\nInsufficient funds, skipping tests.');
        //     this.skip();
        // }
        secpAccountTwo = madWalletTwo.account.accounts[0];
        secpAccountThree = madWalletThree.account.accounts[0];
    });

    describe('Signatures', () => {
        it('Success: Inject the signature fields with the signed messages', async () => {
            await expect(
                madWalletTwo.transaction.transaction.injectSignatures([validHex], [validHex])
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject to Inject Signatures when called with invalid owner', async () => {
            await madWalletTwo.transaction.transaction.DataStore(validHex, 1, 1, validHex, 1, secpAccountTwo.address, 5);
            await expect(
                madWalletTwo.transaction.transaction.injectSignatures([validHex], [validHex])
            ).to.eventually.be.rejectedWith('Invalid owner');
            await expect(
                madWallet.transaction.transaction.getSignatures()
            ).to.eventually.include.all.keys('vin', 'vout');
        });

        it('Fail: Reject to Inject Signatures when TxIn owner cannot be found', async () => {
            madWalletTwo.transaction.transaction.TxIn(validHex, validHex);
            await expect(
                madWalletTwo.transaction.transaction.injectSignatures([], [])
            ).to.eventually.be.rejectedWith('TxIn owner could not be found');
        });

        it('Success: Aggregate signatures and to inject into the transaction', async () => {
            await expect(
                madWalletThree.transaction.transaction.injectSignaturesAggregate([validHex], [validHex])
            ).to.eventually.be.fulfilled;
            await expect(madWallet.transaction.transaction.getSignatures()).to.eventually.include.all.keys('vin', 'vout');
        });

        it('Fail: Reject to Inject Signatures Aggregate when voutSignatures is invalid', async () => {
            await madWalletThree.transaction.transaction.DataStore(validHex, 1, 1, validHex, 1, secpAccountThree.address, 5);
            await expect(
                madWalletThree.transaction.transaction.injectSignaturesAggregate([validHex], ["null"])).to.eventually.be.rejectedWith('Missing signature in Vout');
        });

        it('Fail: Reject to Inject Signatures Aggregate when Hex length is invalid', async () => {
            await madWalletThree.transaction.transaction.DataStore(validHex, 1, 1, validHex, 1, secpAccountThree.address, 5);
            await madWalletThree.transaction.transaction.ValueStore(1, 1, secpAccountThree.address, 5);
            await expect(
                madWalletThree.transaction.transaction.injectSignaturesAggregate([validHex], [validHex])
            ).to.eventually.be.rejectedWith('encoding/hex: odd length hex string');
        });

        it('Fail: Reject to Inject Signatures Aggregate when TxIn owner cannot be found', async () => {
            madWalletThree.transaction.transaction.TxIn(validHex, validHex);
            await expect(
                madWalletThree.transaction.transaction.injectSignaturesAggregate([], [])
            ).to.eventually.be.rejectedWith('TxIn owner could not be found');
        });

        it('Success: Get Signatures without DataStore and TxIn', async () => {
            await expect(madWallet.transaction.transaction.getSignatures()).to.eventually.include.all.keys('vin', 'vout');
        });

        it('Success: Get Signatures with DataStore and TxIn', async () => {
            madWalletTwo.transaction.transaction.TxIn(validHex, validHex);
            await madWalletTwo.transaction.transaction.DataStore(validHex, 1, 1, validHex, 1, secpAccountTwo.address, 5);
            await expect(madWallet.transaction.transaction.getSignatures()).to.eventually.include.all.keys('vin', 'vout');
        });
    });

    describe('Tx', () => {
        it('Fail: Reject _signTx without when TxIn owner cannot be found', async () => {
            madWalletTwo.transaction.transaction.TxIn(validHex, validHex);
            await expect(
                madWalletTwo.transaction.transaction._signTx(madWalletTwo.transaction.transaction.getTx())
            ).to.eventually.be.rejectedWith('TxIn owner could not be found');
        });

        it('Success: Hash the transaction and return it with the TxHash', async () => {
            await expect(
                madWallet.transaction.transaction.createRawTx()
            ).to.eventually.be.fulfilled.and.have.property('Tx').and.include.all.keys('vin', 'vout', 'fee');
        });

        it('Fail: Reject createRawTx', async () => {
            madWalletTwo.transaction.transaction.vin = [];
            await expect(madWalletTwo.transaction.transaction.createRawTx()).to.eventually.be.rejected;
        });

        it('Success: Calls ASPreImage', async () => {
            const preImageResult = {
                chainID: Number(process.env.CHAIN_ID),
                value: 1,
                txOutIdx: 2,
                issuedAt: 3,
                exp: 4,
                owner: 5,
                fee: 6
            };
            expect(
                madWallet.transaction.transaction.AsPreImage(1, 2, 3, 4, "5", 6)
            ).to.deep.equal(preImageResult);
        });
    });

    describe('Fees Estimate', () => {
        it('Fail: Reject get estimate of fees when RPC Server is invalid', async () => {
            const madWalletWithoutRPC = new MadWalletJS();
            await expect(
                madWalletWithoutRPC.transaction.transaction.estimateFees()
            ).to.eventually.be.rejectedWith('Cannot estimate fees without RPC');
        });
    });

    describe('Import Transaction', () => {
        it('Success: Import a finalized transaction', async () => {
            const tx = madWallet.transaction.transaction.getTx();
            await expect(madWallet.transaction.transaction.importTransaction(tx)).to.eventually.be.fulfilled;
            expect( madWallet.transaction.transaction.getTx() ).to.deep.equal(tx);
        });

        it('Success: Import a transaction preSigned', async () => {
            const tx = madWallet.transaction.transaction.getTx();
            await expect(madWallet.transaction.transaction.importRawTransaction(tx)).to.eventually.be.fulfilled;
            expect( madWallet.transaction.transaction.getTx() ).to.deep.equal(tx);
        });

        it('Fail: Reject Import Raw Transaction when Tx is invalid', async () => {
            const madWalletWithoutRPC = new MadWalletJS({ chainId: process.env.CHAIN_ID });
            await expect(
                madWalletWithoutRPC.transaction.transaction.importRawTransaction(madWalletWithoutRPC.transaction.transaction.getTx())
            ).to.eventually.be.rejectedWith('RPC server must be set to fetch Vin data');
        });
    });
});
