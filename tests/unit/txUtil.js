require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const Tx = require("../../src/Util/Tx");

const generateHex = size => [...Array(size)].map(
    () => Math.floor(Math.random() * 16).toString(16)
).join('');

describe('Unit/Util/Tx:', () => {
    // TODO - Improve test description
    // TODO - Move common var to before hook when possible or to a helper
    let DataStore;

    before(async function() {
        DataStore = {
            DSLinker: {
                DSPreImage: {
                    IssuedAt: 100,
                    Deposit: 100,
                    RawData: "rawdata"
                }
            }
        }
    });

    describe('Remaining Deposit', () => { 
        it('Fail: Calls remainingDeposit throws when thisEpoch < issuedAt', async () => {
            await expect(
                Tx.remainingDeposit(DataStore, 1)
            ).to.eventually.be.rejectedWith('thisEpoch < issuedAt');
        });
        
        it('Fail: Calls remainingDeposit throws with invalid arguments', async () => {
            await expect(
                Tx.remainingDeposit()
            ).to.eventually.be.rejected;
        });
    });
    
    describe('Extract Owner', () => { 
        it('Fail: Calls extractOwner with Invalid owner', async () => {
            await expect(
                Tx.extractOwner(generateHex(21))
            ).to.eventually.be.rejectedWith('Invalid owner');
        });
    });
            
    describe('Calculate Deposit, Fee and Epochs', () => { 
        it('Fail: Calls calculateDeposit throws when data size is too large', async () => {
            await expect(
                Tx.calculateDeposit(generateHex(1000 * 10000), 1000)
            ).to.eventually.be.rejectedWith('Data size is too large');
        });

        it('Fail: Calls calculateNumEpochs throws when data size is too large', async () => {
            await expect(
                Tx.calculateNumEpochs(1000 * 10000, 1000)
            ).to.eventually.be.rejectedWith('Data size is too large');
        });
        
        it('Fail: Calls calculateNumEpochs throws when invalid dataSize and deposit causing integer overflow', async () => {
            await expect(
                Tx.calculateNumEpochs(0, 0)
            ).to.eventually.be.rejectedWith('invalid dataSize and deposit causing integer overflow');
        });
        
        it('Fail: Calls calculateFee with invalid arguments', async () => {
            await expect(Tx.calculateFee(NaN, NaN)).to.eventually.be.rejected;
        });
    });
});
