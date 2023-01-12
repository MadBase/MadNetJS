import * as dotenv from 'dotenv';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

dotenv.config({ path: process.cwd() + '/.env' });
chai.use(chaiAsPromised);
const expect = chai.expect;
const Eth = require('../../src/Util/Eth');

const generateHex = size => [...Array(size)].map(
    () => Math.floor(Math.random() * 16).toString(16)
).join('');

describe('Unit/Util/Eth:', () => {
    let validHexLength, sig, invalidHexLength;

    before(async function() {
        validHexLength = generateHex(64);
        sig = generateHex(200);
        invalidHexLength = generateHex(65);
    });

    describe('Eth', () => {
        it('Success: Convert hex to an array of uint256', () => {
            expect(Eth.hexToUint256Array('0x' + validHexLength)).to.be.an('array');
        });

        it('fail: hexToUint256Array throws an error if called with invalid hex', () => {
            expect(() => Eth.hexToUint256Array(invalidHexLength)).to.throws('hexToUint256Array: Invalid length');
        });

        it('Success: Remove pub from sig', () => {
            expect(Eth.removePubFromSig(sig)).to.equal(sig.slice(sig.length - 128));
        });

        it('fail: removePubFromSig throws an error if called with invalid sig', () => {
            expect(() => Eth.removePubFromSig(null)).to.throws('removePubFromSig');
        });
    });
});
