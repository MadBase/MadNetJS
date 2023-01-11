import { HexData, PrivateKeyString, PublicAddress } from "../types/Types";

/**
 * Basic utilities for input validation and mutation
 */
const validHex = /^[0-9a-fA-F]+$/;
var self = module.exports = {
    /**
     * Verifies that a passed string is valid hexadecimal and formats it to lowercase
     * @param str
     * @returns { string }
     */
    isHex: (str: string): string => {
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
            if (str.length % 2 !== 0) {
                str = "0" + str;
            }
            return str.toLowerCase();
        }
        catch (ex) {
            throw new Error("Validator.isHex\r\n" + String(ex));
        }
    },
    /**
     * Verifies that a passed string is a privateKey by validating and returning the passed key
     * @param str - AN expected private key string to validate
     * @returns { string }
     */
    isPrivateKey: (str: PrivateKeyString): PrivateKeyString => {
        try {
            if (!str) {
                throw "No input provided";
             }
            if (str.length !== 64 && str.length !== 66) {
                throw "Invalid length";
            }
            str = self.isHex(str);
            if (!str ||
                str.length !== 64
            ) {
                throw "Invalid length";
            }
            return str;
        }
        catch (ex) {
            throw new Error("Validator.isPrivateKey\r\n" + String(ex));
        }

    },
    /**
     * Verifies that a passed number is a number and formats it as a Number or BigInt string
     * @param num - The number to validate
     * @returns {string|Number}
     */
    isNumber: (num: string|bigint|number|boolean): string|number => {
        try {
            if (!num || typeof num === "boolean") {
                throw "No input or boolean provided";
            }
            if (typeof num === "bigint") {
                num = num.toString();
                return num;
            }
            if (typeof num === "string") {
                if (!parseInt(num) ||
                !Number.isInteger(parseInt(num))
                ) {
                    throw "Invalid number";
                }
                return parseInt(num);
            }
            if (typeof num === 'number') {
                return num;
            }
        }
        catch (ex) {
            throw new Error("Validator.isNumber\r\n" + String(ex));
        }
    },
    /**
     * Determine if a passed number represents a valid curve and returns it -- Expects a number
     * @param num
     * */
    isCurve: (num: number|string) => {
        try {
            num = self.isNumber(num);
            if (num !== 1 &&
                num !== 2
            ) {
                throw "Invalid curve";
            }
            return num;
        }
        catch (ex) {
            throw new Error("Validator.isCurve\r\n" + String(ex));
        }
    },
    /**
     * Takes in an expected address and validates & formats it accordingly
     * @param str - The expected address to verify
     * @returns {PublicAddress}
     */
    isAddress: (str: string): PublicAddress => {
        try {
            if (!str) {
                throw "No input provided";
            }
            str = self.isHex(str);
            if (str.length !== 40 && str.length !== 42) {
                throw "Invalid length";
            }
            str = self.isHex(str);
            if (str.length !== 40) {
                throw "Invalid length";
            }
            return str.toLowerCase();
        }
        catch (ex) {
            throw new Error("Validator.isAddress\r\n" + String(ex));
        }
    },
    /**
     * Takes an expected BigInt and validated * formats it
     * @param bn - The expcted BigInt
     * @returns {BigInt}
     */
    isBigInt: (bn): BigInt => {
        try {
            return BigInt(bn);
        }
        catch(ex) {
            throw new Error("Validator.isBigInt\r\n" + String(ex));
        }
    },
    /**
     * Takes a number and converts it to hexadecimal format
     * @param num - The number to convert to a hexadecimal string
     * @returns Hex
     */
    numToHex: (num: string|number|bigint|boolean): HexData => {
        try {
            let decimal = self.isNumber(num);
            if (!decimal) {
                throw "Not a number";
            }
            let h = BigInt(num).toString(16);
            if (h.length % 2 !== 0) {
                h = "0" + h;
            }
            return h;
        }
        catch (ex) {
            throw new Error("Validator.numToHex\r\n" + String(ex));
        }
    },
    /** Takes in hexadecimal data and returns an integer string representation
     * @param hex - The hex to convert to an integer
     * @returns {string}
    */
    hexToInt: (hex: string): string => {
        try {
            hex = self.isHex(hex);
            const bn = BigInt("0x" + hex).toString(10);
            return bn;
        }
        catch(ex) {
            throw new Error("Validator.hexToInt\r\n" + String(ex));
        }
    },
    /**
     * Takes a hexadecimal blob and converts it to a text string
     * @param hex - The hex to convert to a text string
     * @returns {string}
     */
    hexToTxt: (hex:HexData):string => {
        try {
            return Buffer.from(hex, "hex").toString("utf8");
        }
        catch (ex) {
            throw new Error("Validator.hexToTxt\r\n" + String(ex));
        }
    },
    /**
     * Takes a text string and converts it to a valid hexidecimal string
     * @param str - The string to convert to HexData
     * @returns {HexData}
     */
    txtToHex: (str: string):HexData => {
        try {
            return Buffer.from(str, "utf8").toString("hex").toLowerCase();
        }
        catch (ex) {
            throw new Error("Validator.txtToHex\r\n" + String(ex));
        }
    }
}
