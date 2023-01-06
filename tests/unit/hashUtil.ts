require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const Hash = require('../../src/Util/Hash');

describe('Unit/Util/Hash:', () => {
    let validHex, expectedHash;

    before(async function() {
        validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
        expectedHash = '5334c38c9df86b4aff51886d8a068388945e8be09ec397f72a4fe45ee1e56aa5';
    });
    
    describe('Hash', () => {  
        it('Success: Return the correct hash', () => {
            expect(Hash.hash(validHex)).to.equal(expectedHash);
        });
        
        it('fail: Throws an error if called with invalid msg', () => {
            expect(() => Hash.hash('invalidhexmsg')).to.throws('Invalid hex character');
        });
        
        it('fail: Throws an error if called without a msg', () => {
            expect(() => Hash.hash(null)).to.throws();
        });
    });
});
