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
            const curve = 1;
            const funds = await Faucet.requestTestnetFunds(secpAccount.address, curve);
            expect(funds).to.be.a('number');
        });

        it('Fail: Request testnet funds rejects', async () => {
            const curve = 1;
            const funds = await Faucet.requestTestnetFunds(secpAccount.address, curve);
            expect(funds).to.throw;
        });
    });
});