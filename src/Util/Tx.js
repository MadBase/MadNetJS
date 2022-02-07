const constant = require("../Constants.js");
const validator = require("./Validator.js");
var self = module.exports = {
    /**
     * Extract SVA | Curve | PubHash
     * @param {hex} owner
     * @return {Object} 
     */
    extractOwner: async(owner) => {
        try {
            owner = validator.isHex(owner);
            if (!owner) {
                throw "Bad argument";
            }
            let ownerBuf = Buffer.from(owner, "hex");
            if (ownerBuf.length != 22) {
                throw 'Invalid owner'
            }
            let validation = ownerBuf.slice(0, 1).toString("hex");
            let curve = ownerBuf.slice(1, 2).toString("hex");
            let pubHash = ownerBuf.slice(2, 22).toString("hex");
            return [validator.isNumber(validation), validator.isNumber(curve), validator.isHex(pubHash)];
        } catch (ex) {
            throw "Transaction.extractOwner: " + String(ex);
        }
    },

    /**
     * Create owner string
     * @param {number} validation
     * @param {number} curve
     * @param {hex} base
     * @return {hex} owner 
     */
    prefixSVACurve: async(validation, curve, base) => {
        try {
            validation = validator.numToHex(validation);
            curve = validator.numToHex(curve);
            base = validator.isHex(base);
            if (!validation || !curve || !base) {
                throw "Bad argument type"
            }
            let v = Buffer.from(validation, "hex");
            let c = Buffer.from(curve, "hex");
            let p = Buffer.from(base, "hex");
            let prefixed = Buffer.concat([v, c, p]);
            return prefixed.toString("hex");
        } catch (ex) {
            throw "Transaction.prefixSVACurve: " + String(ex);
        }
    },

    /**
     * Calculate DataStore deposit cost
     * @param {hex} data
     * @param {number} duration
     * @return {number} deposit
     */
    calculateDeposit: async(data, duration) => {
        try {
            // dspi.go - BaseDepositEquation
            data = validator.isHex(data);
            let dataSize = BigInt(Buffer.from(data, "hex").length)
            if (dataSize > BigInt(constant.MaxDataStoreSize)) {
                throw "Data size is too large"
            }
            let deposit = BigInt((BigInt(dataSize) + BigInt(constant.BaseDatasizeConst)) * (BigInt(2) + BigInt(duration)))
            return deposit;
        } catch (ex) {
            throw "Transaction.calculateDeposit: " + String(ex)
        }
    },

    /**
     * Get remaing DataStore deposit value
     * @param {Object} DataStore
     * @return {number} deposit
     */
    remainingDeposit: async(DataStore, thisEpoch) => {
        try {
            // dspi.go - RemainingValue
            let issuedAt = DataStore["DSLinker"]["DSPreImage"]["IssuedAt"]
            let deposit = BigInt("0x" + DataStore["DSLinker"]["DSPreImage"]["Deposit"])
            let rawData = DataStore["DSLinker"]["DSPreImage"]["RawData"]
            let dataSize = BigInt(Buffer.from(rawData, "hex").length)
            if (BigInt(thisEpoch) < BigInt(issuedAt)) {
                throw "thisEpoch < issuedAt"
            }
            let epochDiff = BigInt(BigInt(thisEpoch) - BigInt(issuedAt));
            let epochCost = BigInt(BigInt(dataSize) + BigInt(constant.BaseDatasizeConst));
            let numEpochs = await self.calculateNumEpochs(dataSize, deposit);
            let expEpoch = (BigInt(issuedAt) + BigInt(numEpochs))
            if (BigInt(thisEpoch) > BigInt(expEpoch)) {
                return false;
            }
            if (epochDiff > numEpochs) {
                return epochCost;
            }
            let currentDep = await self.calculateDeposit(rawData, epochDiff);
            let newDep = BigInt(deposit) - BigInt(currentDep);
            let remainder = BigInt(BigInt(newDep) + (BigInt(2) * BigInt(epochCost)))
            return remainder;
        } catch (ex) {
            throw "Transaction.rewardDeposit: " + String(ex);
        }
    },

    /**
     * Calculate number of epochs in DataStore
     * @param {number} dataSize 
     * @param {number} deposit 
     * @return {number} epochs
     */
    calculateNumEpochs: async(dataSize, deposit) => {
        try {
            if (BigInt(dataSize) > BigInt(constant.MaxDataStoreSize)) {
                throw "Data size is too large"
            }
            let epoch = BigInt(deposit) / BigInt((BigInt(dataSize) + BigInt(constant.BaseDatasizeConst)))
            if (BigInt(epoch) < BigInt(2)) {
                throw "invalid dataSize and deposit causing integer overflow"
            }
            let numEpochs = BigInt(BigInt(epoch) - BigInt(2));
            return numEpochs
        } catch (ex) {
            throw "Transaction.calculateNumEpochs: " + String(ex);
        }
    },

    /**
     * Calculate the DataStore Fee
     * @param {number} dsFee 
     * @param {number} numEpochs 
     * @returns {number} dsFee
     */
    calculateFee: async(dsFee, numEpochs) => {
        try {
            return BigInt(BigInt(dsFee) * BigInt(BigInt(numEpochs) + BigInt(2))).toString(10);
        }
        catch(ex) {
            throw "Transaction.calculateFee: " + String(ex);
        }
    }
}