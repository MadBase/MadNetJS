import { HexData, PrivateKeyString, PublicAddress } from "../types/Types";

/**
 * Basic utilities for input validation and mutation
 */
const validHex = /^[0-9a-fA-F]+$/;

/**
 * Verifies that a passed string is valid hexadecimal and formats it to lowercase
 * @param str
 * @returns { string }
 */
export const isHex = (str: string): string => {
    try {
        if (!str || typeof str != "string") {
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
    } catch (ex) {
        throw new Error("Validator.isHex\r\n" + String(ex));
    }
};

/**
 * Verifies that a passed string is a privateKey by validating and returning the passed key
 * @param str - AN expected private key string to validate
 * @returns { string }
 */
export const isPrivateKey = (str: PrivateKeyString): PrivateKeyString => {
    try {
        if (!str) {
            throw "No input provided";
        }
        if (str.length !== 64 && str.length !== 66) {
            throw "Invalid length";
        }
        str = isHex(str);
        if (!str || str.length !== 64) {
            throw "Invalid length";
        }
        return str;
    } catch (ex) {
        throw new Error("Validator.isPrivateKey\r\n" + String(ex));
    }
};

/**
 * Verifies that a passed number is a number and formats it as a Number or BigInt string
 * @param num - The number to validate
 * @returns {string|Number}
 */
export const isNumber = (
    num: string | bigint | number | boolean
): string | number => {
    try {
        if (!num || typeof num === "boolean") {
            throw "No input or boolean provided";
        }
        if (typeof num === "bigint") {
            num = num.toString();
            return num;
        }
        if (typeof num === "string") {
            if (!parseInt(num) || !Number.isInteger(parseInt(num))) {
                throw "Invalid number";
            }
            return parseInt(num);
        }
        if (typeof num === "number") {
            return num;
        }
    } catch (ex) {
        throw new Error("Validator.isNumber\r\n" + String(ex));
    }
};

/**
 * Determine if a passed number represents a valid curve and returns it -- Expects a number
 * @param num
 * */
export const isCurve = (num: number | string) => {
    try {
        num = isNumber(num);
        if (num !== 1 && num !== 2) {
            throw "Invalid curve";
        }
        return num;
    } catch (ex) {
        throw new Error("Validator.isCurve\r\n" + String(ex));
    }
};

/**
 * Takes in an expected address and validates & formats it accordingly
 * @param str - The expected address to verify
 * @returns {PublicAddress}
 */
export const isAddress = (str: string): PublicAddress => {
    try {
        if (!str) {
            throw "No input provided";
        }
        str = isHex(str);
        if (str.length !== 40 && str.length !== 42) {
            throw "Invalid length";
        }
        str = isHex(str);
        if (str.length !== 40) {
            throw "Invalid length";
        }
        return str.toLowerCase();
    } catch (ex) {
        throw new Error("Validator.isAddress\r\n" + String(ex));
    }
};

/**
 * Takes an expected BigInt and validated * formats it
 * @param bn - The expcted BigInt
 * @returns {BigInt}
 */
export const isBigInt = (bn): BigInt => {
    try {
        return BigInt(bn);
    } catch (ex) {
        throw new Error("Validator.isBigInt\r\n" + String(ex));
    }
};

/**
 * Takes a number and converts it to hexadecimal format
 * @param num - The number to convert to a hexadecimal string
 * @returns Hex
 */
export const numToHex = (num: string | number | bigint | boolean): HexData => {
    try {
        let decimal = isNumber(num);
        if (!decimal) {
            throw "Not a number";
        }
        let h = BigInt(num).toString(16);
        if (h.length % 2 !== 0) {
            h = "0" + h;
        }
        return h;
    } catch (ex) {
        throw new Error("Validator.numToHex\r\n" + String(ex));
    }
};

/** Takes in hexadecimal data and returns an integer string representation
 * @param hex - The hex to convert to an integer
 * @returns {string}
 */
export const hexToInt = (hex: string): string => {
    try {
        hex = isHex(hex);
        const bn = BigInt("0x" + hex).toString(10);
        return bn;
    } catch (ex) {
        throw new Error("Validator.hexToInt\r\n" + String(ex));
    }
};

/**
 * Takes a hexadecimal blob and converts it to a text string
 * @param hex - The hex to convert to a text string
 * @returns {string}
 */
export const hexToTxt = (hex: HexData): string => {
    try {
        return Buffer.from(hex, "hex").toString("utf8");
    } catch (ex) {
        throw new Error("Validator.hexToTxt\r\n" + String(ex));
    }
};

/**
 * Takes a text string and converts it to a valid hexidecimal string
 * @param str - The string to convert to HexData
 * @returns {HexData}
 */
export const txtToHex = (str: string): HexData => {
    try {
        return Buffer.from(str, "utf8").toString("hex").toLowerCase();
    } catch (ex) {
        throw new Error("Validator.txtToHex\r\n" + String(ex));
    }
};

export default {
    isHex,
    isPrivateKey,
    isNumber,
    isCurve,
    isAddress,
    isBigInt,
    numToHex,
    hexToInt,
    hexToTxt,
    txtToHex,
};
