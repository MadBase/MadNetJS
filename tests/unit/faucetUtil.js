require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require('../../index.js');
const BNSigner = require('../../src/Signers/BNSigner.js');
const SecpSigner = require('../../src/Signers/SecpSigner.js');
const Faucet = require('../../src/Util/Faucet');

describe('Unit/Util/Faucet:', () => {
    let privateKey, madWallet, bnAccount, secpAccount;

    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);

        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(privateKey, 2);

        secpAccount = madWallet.Account.accounts[0];
        bnAccount = madWallet.Account.accounts[1];
    });
    
    describe('Faucet', () => {  
        it('Success: Request testnet funds for a Secp address', async () => {
            const isBN = false;
            const funds = await Faucet.requestTestnetFunds(secpAccount.address, isBN);
            expect(funds.error).to.be.false;
        });

        it('Fail: Cannnot request funds with a invalid Secp address', async () => {
            const isBN = false;
            await expect(
                Faucet.requestTestnetFunds('wrongaddressformat', isBN)
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });

        it('Success: Request testnet funds for a BN address', async () => {
            const isBN = true;
            const funds = await Faucet.requestTestnetFunds(bnAccount.address, isBN);
            expect(funds.error).to.be.false;
        });

        it('Fail: Cannnot request funds with a invalid BN address', async () => {
            const isBN = true;
            await expect(
                Faucet.requestTestnetFunds('wrongaddressformat', isBN)
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });

        it('Fail: Cannot request testnet funds without arguments', async () => {
            await expect(
                Faucet.requestTestnetFunds()
            ).to.eventually.be.rejectedWith('Arguments cannot be empty');
        });
    });
});