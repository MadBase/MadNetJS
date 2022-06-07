import madnetjs from '../index.js';
import ethersutil from 'ethereumjs-util';
// const runtimeListener = require('./runtimeListener');
//require('dotenv').config({ path: process.cwd() + '/.env' });
import 'dotenv/config.js';
/**
 * Used for on the fly debugging of ValueStore ||| DataStores
 */

main();

async function main() {

    ///////////////////
    // Init Env     //
    /////////////////
    const madWallet = new madnetjs(false, process.env.RPC);
    const account1 = await madWallet.Account.addAccount(process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY);
    const account2 = await madWallet.Account.addAccount(process.env.OPTIONAL_TEST_SUITE_SECONDARY_PRIVATE_KEY);
    const account3 = await madWallet.Account.addAccount(process.env.OPTIONAL_TEST_SUITE_TERTIARY_PRIVATE_KEY);

    ///////////////////////
    // Main func to run //
    /////////////////////
    await valueStoreTest(); // Run a value store test?
    await dataStoreTest(); // Run a data store test?

    //////////////////
    //   Helpers   //
    ////////////////

    async function getBalance(address, curve = 1) {
        let [, balance] = await madWallet.Rpc.getValueStoreUTXOIDs(address, curve);
        balance = String(parseInt(balance, 16));
        return balance;
    }

    async function sendDataStore(index, data, duration, from) {
        await madWallet.Transaction.createTxFee(from, 1, false); // Set tx fee
        await madWallet.Transaction.createDataStore(from, index, duration, data); // create DataStore
        let txResponse = await madWallet.Transaction.sendWaitableTx();
        return txResponse;
    }

    async function sendValueStore(amount, fromAccount, toAddress, toCurve = 1) {
        await madWallet.Transaction.createValueStore(fromAccount.address, amount, toAddress, toCurve);
        await madWallet.Transaction.createTxFee(fromAccount.address, fromAccount.curve);
        return await madWallet.Transaction.sendWaitableTx();
    }

    function generatePseudo32BHex() {
        let root = Buffer.from(String(Math.floor(Math.random() * 999999999)));
        let prand = ethersutil.keccak256(root).toString('hex');
        return "0x" + prand;
    }

    async function waitNBlocksFromTxHashInclusion(blocksToWait, txHash, attempt = 0) {
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //////////////////////
    // DATA STORE TEST //
    ////////////////////

    // Attempt 
    async function dataStoreTest() {

        console.log(`Running datastore test with account1. . .\n`);

        // Check balance
        console.log(`Checking initial balance for public address ${account1.address} ... `);
        let initBalance = await getBalance(account1.address);
        console.log(`Balance:${initBalance}`);

        // Create DataStore1
        let idx1 = generatePseudo32BHex();
        let val1 = "value1";
        console.log(`\nSending and awaiting mining of 1st datastore(${idx1}, "${val1}") ...\n`);
        let tx = await sendDataStore(idx1, val1, 15, account1.address);
        console.log(`Awaiting DStore mining for hash: ${tx.txHash} ...`);
        let txResp = await tx.wait();
        if (!txResp.isMined) { throw new Error("Fail, DataStore tx not mined") }
        console.log("Succes, DStore mined!")

        // Check post1 balance
        let post1Balance = await getBalance(account1.address);
        console.log(`\nPost 1st DataStore Bal: ${post1Balance}`);
    }

    ///////////////////////
    // VALUE STORE TEST //
    /////////////////////

    async function valueStoreTest() {
        // Send 10 from 1 => 2
        console.log("Sending ValueStore TX1...");
        let tx1 = await sendValueStore("10", account1, account2.address);
        console.log(`Awaiting txHash: ${tx1.txHash}`)
        let tx1Receipt = await tx1.wait();
        console.log("TX1 Receipt:\n", JSON.stringify(tx1Receipt, false, 2));

        // Send 5 from 2 => 3
        console.log("Sending ValueStore TX2...");
        let tx2 = await sendValueStore("5", account2, account3.address);
        console.log(`Awaiting txHash: ${tx2.txHash}`)
        let tx2Receipt = await tx2.wait();
        console.log("TX2 Receipt:\n", JSON.stringify(tx2Receipt, false, 2));

        // Send 5 from 2 => 1
        console.log("Sending ValueStore TX3...");
        let tx3 = await sendValueStore("5", account2, account1.address);
        console.log(`Awaiting txHash: ${tx3.txHash}`)
        let tx3Receipt = await tx3.wait();
        console.log("TX3 Receipt:\n", JSON.stringify(tx3Receipt, false, 2));

        // Send 5 from 3 => 1
        console.log("Sending ValueStore TX4...");
        let tx4 = await sendValueStore("5", account3, account1.address);
        console.log(`Awaiting txHash: ${tx3.txHash}`)
        let tx4Receipt = await tx4.wait();
        console.log("TX4 Receipt:\n", JSON.stringify(tx4Receipt, false, 2));
    }

}