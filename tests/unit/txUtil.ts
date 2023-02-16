import * as dotenv from 'dotenv';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Tx from '../../src/Util/Tx';

dotenv.config({ path: process.cwd() + '/.env' });
chai.use(chaiAsPromised);
const expect = chai.expect;

const generateHex = size => [...Array(size)].map(
    () => Math.floor(Math.random() * 16).toString(16)
).join('');

describe('Unit/Util/Tx:', () => {
    let dataStore;

    before(async function() {
        dataStore = {
            dsLinker: {
                dsPreImage: {
                    issuedAt: 100,
                    deposit: 100,
                    rawData: 'rawdata'
                }
            }
        }
    });

    describe('Remaining Deposit', () => {
        it('Fail: Reject when thisEpoch is lower than issuedAt', async () => {
            await expect(Tx.remainingDeposit(dataStore, 1)).to.eventually.be.rejectedWith('thisEpoch < issuedAt');
        });

        it('Fail: Reject when called with invalid arguments', async () => {
            await expect(
                Tx.remainingDeposit(dataStore, 9999)
            ).to.eventually.be.rejectedWith(
                "Transaction.rewardDeposit: Transaction.calculateNumEpochs: invalid dataSize and deposit causing integer overflow"
            );
        });
    });

    describe('Extract Owner', () => {
        it('Fail: Reject when called with invalid owner', async () => {
            await expect(Tx.extractOwner(generateHex(21))).to.eventually.be.rejectedWith('Invalid owner');
        });
    });

    describe('Calculate Deposit, Fee and Epochs', () => {
        it('Fail: Reject calculateDeposit when data size is too large', async () => {
            await expect(
                Tx.calculateDeposit(generateHex(1000 * 10000), BigInt(1000))
            ).to.eventually.be.rejectedWith("Data size is too large");
        });

        it('Fail: Reject calculateNumEpochs when data size is too large', async () => {
            await expect(Tx.calculateNumEpochs(BigInt(1000 * 10000), BigInt(1000))).to.eventually.be.rejectedWith('Data size is too large');
        });

        it('Fail: Reject calculateNumEpochs when called with invalid dataSize and deposit', async () => {
            await expect(
                Tx.calculateNumEpochs(BigInt(0), BigInt(0))
            ).to.eventually.be.rejectedWith('invalid dataSize and deposit causing integer overflow');
        });
    });
});
