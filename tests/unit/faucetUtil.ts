import * as dotenv from 'dotenv';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import MadWalletJS from '../../index';
import Faucet from '../../src/Util/Faucet';

dotenv.config({ path: process.cwd() + '/.env' });
chai.use(chaiAsPromised);
const expect = chai.expect;
const FAUCET_SERVER = process.env.FAUCET_API_URL;

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
            const funds = await Faucet.requestTestnetFunds(secpAccount.address, isBN, FAUCET_SERVER, 45000);
            expect(funds.error).to.be.false;
        });

        it('Fail: Cannnot request funds with a invalid Secp address', async () => {
            const isBN = false;
            await expect(
                Faucet.requestTestnetFunds(
                    "wrongaddressformat",
                    isBN,
                    FAUCET_SERVER,
                    45000
                )
            ).to.eventually.be.rejectedWith("Invalid hex character");
        });

        it('Success: Request testnet funds for a BN address', async () => {
            const isBN = true;
            const funds = await Faucet.requestTestnetFunds(bnAccount.address, isBN, FAUCET_SERVER, 45000);
            expect(funds.error).to.be.false;
        });

        it('Fail: Cannnot request funds with a invalid BN address', async () => {
            const isBN = true;
            await expect(
                Faucet.requestTestnetFunds('wrongaddressformat', isBN, FAUCET_SERVER, 45000)
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });

        it('Fail: Cannot request testnet funds without arguments', async () => {
            await expect(
                Faucet.requestTestnetFunds()
            ).to.eventually.be.rejectedWith('Arguments address and faucetServer cannot be empty');
        });
    });
});
