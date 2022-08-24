/**
 * Basic utilities for input validation and mutation
 */
const validHex = /^[0-9a-fA-F]+$/;
var self = module.exports = {
    isHex: (str) => {
        try {
            if (!str ||
                typeof str != "string"    
            ) { 
                throw "No input provided";
             }
            if (str.indexOf("0x") === 0) {
                str = str.slice(2);
            }
            if (!validHex.test(str)) {
                throw "Invalid hex character";
            }
            if (str.length % 2 != 0) {
                str = "0" + str;
            }
            return str.toLowerCase();
        }
        catch (ex) {
            throw new Error("Validator.isHex\r\n" + String(ex));
        }
    },

    isPrivateKey: (str) => {
        try {
            if (!str) { 
                throw "No input provided";
             }
            if (str.length != 64 && str.length != 66) {
                throw "Invalid length";
            }
            str = self.isHex(str);
            if (!str ||
                str.length != 64
            ) {
                throw "Invalid length";
            }
            return str;
        }
        catch (ex) {
            throw new Error("Validator.isPrivateKey\r\n" + String(ex));
        }

    },

    isNumber: (num) => {
        try {
            if (!num) { 
                throw "No input provided";
             }
            if (typeof num === "bigint") {
                num = num.toString();
                return num;
            }
            if (!parseInt(num) ||
                !Number.isInteger(parseInt(num))
            ) {
                throw "Invalid number";
            }
            return parseInt(num);
        }
        catch (ex) {
            throw new Error("Validator.isNumber\r\n" + String(ex));
        }
    },

    isCurve: (num) => {
        try {
            num = self.isNumber(num);
            if (num != 1 &&
                num != 2
            ) {
                throw "Invalid curve";
            }
            return num;
        }
        catch (ex) {
            throw new Error("Validator.isCurve\r\n" + String(ex));
        }
    },

    isAddress: (str) => {
        try {
            if (!str) { 
                throw "No input provided";
            }
            str = self.isHex(str);
            if (str.length != 40 && str.length != 42) {
                throw "Invalid length";
            }
            str = self.isHex(str);
            if (str.length != 40) {
                throw "Invalid length";
            }
            return str.toLowerCase();
        }
        catch (ex) {
            throw new Error("Validator.isAddress\r\n" + String(ex));
        }
    },

    isBigInt: (bn) => {
        try {
            bn = BigInt(bn);
            return bn;
        }
        catch(ex) {
            throw new Error("Validator.isBigInt\r\n" + String(ex));
        }
    },

    numToHex: (num) => {
        try {
            let decimal = self.isNumber(num);
            if (!decimal) {
                throw "Not a number";
            }
            let h = BigInt(num).toString(16);
            if (h.length % 2 != 0) {
                h = "0" + h;
            }
            return h;
        }
        catch (ex) {
            throw new Error("Validator.numToHex\r\n" + String(ex));
        }
    },

    hexToInt: (hex) => {
        try {
            hex = self.isHex(hex);
            let bn = BigInt('0x' + hex).toString(10);
            return bn;
        }
        catch(ex) {
            throw new Error("Validator.hexToInt\r\n" + String(ex));
        }
    },

    hexToTxt: (hex) => {
        try {
            return Buffer.from(hex, "hex").toString("utf8");
        }
        catch (ex) {
            throw new Error("Validator.hexToTxt\r\n" + String(ex));
        }
    },

    txtToHex: (str) => {
        try {
            return Buffer.from(str, "utf8").toString("hex").toLowerCase();
        }
        catch (ex) {
            throw new Error("Validator.txtToHex\r\n" + String(ex));
        }
    }
}