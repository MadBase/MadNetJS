require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const Validator = require("../../src/Util/Validator");

let privateKey, address, validHex;

describe('Util/Validator', () => {
    before(async function() {
        privateKey = process.env.PRIVATE_KEY || "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A";
        address = '91f174784ba0edd9df3051deb0a53fddca8a150e';
        validHex = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';
    });
    
    it('Fail: Calls isPrivateKey with invalid Private Key length', () => {
        expect(() => Validator.isPrivateKey(privateKey.slice(0, -1))).to.throw('Invalid length');
    });

    it('Fail: Calls isNumber with invalid Number', () => {
        expect(() => Validator.isNumber('not a number')).to.throw('Invalid number');
    });
    
    it('Fail: calls isAddress with invalid Address length', () => {
        expect(() => Validator.isAddress(address.slice(0, -2))).to.throw('Invalid length');
    });
    
    it('Fail: Calls hexToInt with Invalid Hex', () => {
        expect(() => Validator.hexToInt('notAHex')).to.throw();
    });
    
    it('Fail: Calls hexToTxt with invalid argument', () => {
        expect(() => Validator.hexToTxt(Number('notAHex'))).to.throw();
    });
    
    it('Success: Calls hexToTxt with valid argument', () => {
        const validHexresult = Buffer.from(validHex, "hex").toString("utf8"); 
        expect(Validator.hexToTxt(validHex)).to.equal(validHexresult);
    });
    
    it('Fail: Calls txtToHex with invalid argument', () => {
        expect(() => Validator.txtToHex(Number('notAHex'))).to.throw();
    });
});
