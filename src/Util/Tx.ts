import { BaseDatasizeConst, MaxDataStoreSize } from "../Config/Constants";
import { AccountCurve, DataStore, HexData } from "../types/Types";
import { isHex, isNumber, numToHex } from "./Validator";

/** @type  */
export type SvaCurvePubhashTuple = [number | string, number | string, string];

/**
 * @typedef TxUtils - Collection of Tx Utilities
 */

/** Extract SVA | Curve | PubHash from a given dsPreImage.Owner "owner"
 * @param owner - The owner string
 */
export const extractOwner = async (
    owner: string
): Promise<SvaCurvePubhashTuple> => {
    try {
        owner = isHex(owner);
        if (!owner) {
            throw "Bad argument";
        }
        const ownerBuf: Buffer = Buffer.from(owner, "hex");
        if (ownerBuf.length !== 22) {
            throw "Invalid owner";
        }
        const validation: string = ownerBuf.slice(0, 1).toString("hex");
        const curve: string = ownerBuf.slice(1, 2).toString("hex");
        const pubHash: string = ownerBuf.slice(2, 22).toString("hex");
        return [isNumber(validation), isNumber(curve), isHex(pubHash)];
    } catch (ex) {
        throw "Transaction.extractOwner: " + String(ex);
    }
};

/** Create owner string prefix for an SVACurve
 * @param validation - "" @Troy -- What is this exactly?
 * @param curve - The account curve 1 || 2
 * @param base - "" @Troy what is this exactly?
 */
export const prefixSVACurve = async (
    validation: string | number | HexData,
    curve: AccountCurve | HexData,
    base: string
) => {
    try {
        validation = numToHex(validation.toString());
        curve = numToHex(curve.toString());
        base = isHex(base);
        if (!validation || !curve || !base) {
            throw "Bad argument type";
        }
        const v = Buffer.from(validation.toString(), "hex");
        const c = Buffer.from(curve.toString(), "hex");
        const p = Buffer.from(base, "hex");
        const prefixed = Buffer.concat([v, c, p]);
        return prefixed.toString("hex");
    } catch (ex) {
        throw "Transaction.prefixSVACurve: " + String(ex);
    }
};

/**
 * Calculate DataStore deposit cost
 * @param {HexData} data - The data to be stored as a DataStore
 * @param {number} duration - How long the DataStore is to be stored
 * @return {number} The deposit cost
 */
export const calculateDeposit = async (
    data: HexData | number,
    duration: number | bigint
) => {
    try {
        // dspi.go - BaseDepositEquation
        const dataSize = BigInt(Buffer.from(isHex(data), "hex").length);
        if (dataSize > BigInt(MaxDataStoreSize)) {
            throw "Data size is too large";
        }
        const deposit = BigInt(
            (BigInt(dataSize) + BigInt(BaseDatasizeConst)) *
                (BigInt(2) + BigInt(duration))
        );
        return deposit;
    } catch (ex) {
        throw "Transaction.calculateDeposit: " + String(ex);
    }
};

/**
 * Get remaing DataStore deposit value
 * @param {Object} dataStore
 * @return {number} deposit
 */
export const remainingDeposit = async (
    dataStore: DataStore,
    thisEpoch: number
) => {
    try {
        // dspi.go - RemainingValue
        const dsPreImage = dataStore.dsLinker.dsPreImage;
        const issuedAt = dsPreImage.issuedAt;
        const deposit = BigInt("0x" + dsPreImage.deposit);
        const rawData = dsPreImage.rawData;
        const dataSize = BigInt(Buffer.from(rawData, "hex").length);
        if (BigInt(thisEpoch) < BigInt(issuedAt)) {
            throw "thisEpoch < issuedAt";
        }
        const epochDiff = BigInt(BigInt(thisEpoch) - BigInt(issuedAt));
        const epochCost = BigInt(BigInt(dataSize) + BigInt(BaseDatasizeConst));
        const numEpochs = await calculateNumEpochs(dataSize, deposit);
        const expEpoch = BigInt(issuedAt) + BigInt(numEpochs);
        if (BigInt(thisEpoch) > BigInt(expEpoch)) {
            return false;
        }
        if (epochDiff > numEpochs) {
            return epochCost;
        }
        const currentDep = await calculateDeposit(rawData, epochDiff);
        const newDep = BigInt(deposit) - BigInt(currentDep);
        const remainder = BigInt(
            BigInt(newDep) + BigInt(2) * BigInt(epochCost)
        );
        return remainder;
    } catch (ex) {
        throw "Transaction.rewardDeposit: " + String(ex);
    }
};

/**
 * Calculate number of epochs in DataStore
 * @param {number} dataSize
 * @param {number} deposit
 * @return {number} epochs
 */
export const calculateNumEpochs = async (
    dataSize: number | bigint,
    deposit: number | bigint
) => {
    try {
        if (BigInt(dataSize) > BigInt(MaxDataStoreSize)) {
            throw "Data size is too large";
        }
        const epoch =
            BigInt(deposit) /
            BigInt(BigInt(dataSize) + BigInt(BaseDatasizeConst));
        if (BigInt(epoch) < BigInt(2)) {
            throw "invalid dataSize and deposit causing integer overflow";
        }
        const numEpochs = BigInt(BigInt(epoch) - BigInt(2));
        return numEpochs;
    } catch (ex) {
        throw "Transaction.calculateNumEpochs: " + String(ex);
    }
};

/**
 * Calculate the DataStore Fee
 * @param {number} dsFee
 * @param {number} numEpochs
 * @returns {number} dsFee
 */
export const calculateFee = async (
    dsFee: number | string | bigint,
    numEpochs: number | bigint
) => {
    try {
        return BigInt(
            BigInt(dsFee) * BigInt(BigInt(numEpochs) + BigInt(2))
        ).toString(10);
    } catch (ex) {
        throw "Transaction.calculateFee: " + String(ex);
    }
};

export default {
    extractOwner,
    prefixSVACurve,
    calculateDeposit,
    remainingDeposit,
    calculateNumEpochs,
    calculateFee,
};
