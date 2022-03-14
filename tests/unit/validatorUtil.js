require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const Validator = require("../../src/Util/Validator");

describe('Unit/Util/Validator:', () => {
    let privateKey, address, validHex;

    before(async function() {
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        address = '91f174784ba0edd9df3051deb0a53fddca8a150e';
        validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
    });
    
    describe('Private Key, Number and Address', () => {  
        it('Fail: isPrivateKey throws and error if Private Key length is invalid', () => {
            expect(() => Validator.isPrivateKey(privateKey.slice(0, -1))).to.throw('Invalid length');
        });

        it('Fail: isNumber throws an error if Number is invalid', () => {
            expect(() => Validator.isNumber('not a number')).to.throw('Invalid number');
        });
        
        it('Fail: isAddress throws an error if Address length is invalid', () => {
            expect(() => Validator.isAddress(address.slice(0, -2))).to.throw('Invalid length');
        });
    });
    
    describe('Hex', () => {  
        it('Fail: hexToInt throws an error if Hex is invalid', () => {
            expect(() => Validator.hexToInt('notAHex')).to.throw('Validator.hexToInt: ');
        });
        
        it('Fail: hexToTxt throws an error if Hex is invalid', () => {
            expect(() => Validator.hexToTxt(Number('notAHex'))).to.throw('Validator.hexToTxt: ');
        });
        
        it('Fail: txtToHex throws an error if string is invalid', () => {
            expect(() => Validator.txtToHex(Number('notAHex'))).to.throw('Validator.txtToHex: ');
        });
        
        it('Success: Call hexToTxt with valid Hex', () => {
            const validHexResult = Buffer.from(validHex, "hex").toString("utf8"); 
            expect(Validator.hexToTxt(validHex)).to.equal(validHexResult);
        });
    });
});
