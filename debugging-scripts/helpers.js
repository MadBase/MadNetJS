const ethersutil = require('ethereumjs-util');
const crypto = require('crypto');

/////////////////////////
//   Script Helpers   //
///////////////////////

module.exports.getBalance = async (address, curve = 1) => {
    let [, balance] = await madWallet.Rpc.getValueStoreUTXOIDs(address, curve);
    balance = String(parseInt(balance, 16));
    return balance;
}

module.exports.sendDataStore = async (index, data, duration, from) => {
    await madWallet.Transaction.createTxFee(from, 1, false); // Set tx fee
    await madWallet.Transaction.createDataStore(from, index, duration, data); // create DataStore
    let txResponse = await madWallet.Transaction.sendWaitableTx();
    return txResponse;
}

module.exports.sendValueStore = async (amount, fromAccount, toAddress, toCurve = 1) => {
    await madWallet.Transaction.createValueStore(fromAccount.address, amount, toAddress, toCurve);
    await madWallet.Transaction.createTxFee(fromAccount.address, fromAccount.curve);
    return await madWallet.Transaction.sendWaitableTx();
}

module.exports.generatePseudo32BHex = () => {
    // let root = Buffer.from(String(Math.floor(Math.random() * 999999999)));
    let prand = crypto.randomBytes(32).toString('hex'); // ethersutil.keccak256(root).toString('hex');
    return "0x" + prand;
}

module.exports.waitNBlocksFromTxHashInclusion = async (blocksToWait, txHash, attempt = 0) => {
    let txBn = await madWallet.Rpc.request("get-tx-block-number", { TxHash: txHash });
    txBn = txBn.BlockHeight;
    try {
        if (attempt > 20) {
            throw new Error("attempt limit for waiting blocks reached")
        }
        attempt++
        let blockNumber = await madWallet.Rpc.getBlockNumber();
        console.log(`Waiting for block ... ${blockNumber} | ${txBn + blocksToWait}`);
        if (parseInt(blockNumber) < txBn + 3) {
            await sleep(3000)
            await waitNBlocksFromTxHashInclusion(blocksToWait, txHash, attempt)
        }
        return true;
    }
    catch (ex) {
        console.log("Child: ", ex.message, "| ", "Waiting blocks failed")
    }
}

module.exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}