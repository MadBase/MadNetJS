const madnetjs = require("../index.js");
const ethersutil = require('ethereumjs-util');
const { generatePseudo32BHex, sendValueStore, sendDataStore, getBalance } = require('./helpers');
// const runtimeListener = require('./runtimeListener');
require('dotenv').config({ path: process.cwd() + '/.env' });

/**
 * Used for on the fly debugging of ValueStore ||| DataStores
 */

main();

async function main() {

    console.log(process.argv[2])

    ///////////////////
    // Init Env     //
    /////////////////
    const madWallet = new madnetjs(false, process.env.RPC);
    let fundingAccount = await madWallet.Account.addAccount(process.argv[2]);

    ///////////////////////
    // Main func to run //
    /////////////////////

    let totalAccountsToGen = 127;

    /**
     * 1. Send value to generated account
     * 2. Create datastore with generated account
     * 3. Send remaining value back to funding account 
     * */

    let loopCycle = async () => {
        let gennedAccounts = [];
        // Fund all accounts
        for (let i = 0; i < totalAccountsToGen; i++) {
            console.log(`Generating account ${i+1} of ${totalAccountsToGen}`)
            let someAccount = await madWallet.Account.addAccount(generatePseudo32BHex());
            gennedAccounts.push(someAccount);
        }
        for (let genAccount of gennedAccounts) {
            await madWallet.Transaction.createValueStore(fundingAccount.address, 50000, genAccount.address, 1);
        }
        await madWallet.Transaction.createTxFee(fundingAccount.address, fundingAccount.curve);
        let fundingTx = await madWallet.Transaction.sendWaitableTx();
        console.log("Waiting on funding tx: ", fundingTx.txHash)
        await fundingTx.wait();

        // Send a random amount of txs from genned accounts 0-50
        let txAmount = Math.floor(Math.random() * ((totalAccountsToGen - 1) - 0 + 1)) + 0;
        if (txAmount === 0) {
            txAmount = 5;
        }
        console.log(`Sending ${txAmount} TXs this cycle`);


        let allTxPromises = [];

        for (let i = 0; i < txAmount; i++) {
            let fromAccount = madWallet.Account.accounts[i]; // Determine from account
            let txType = Math.floor(Math.random() * ((totalAccountsToGen - 1) - 0 + 1)) + 0;
            let vStoreToAccount = madWallet.Account.accounts[txType !== i ? txType : i === 0 ? 1 : (totalAccountsToGen - 1)] // Use txType num generated to determine target account for vStore
            // Send value data or both | even / odd / %5 == 0
            let sendType = txType % 5 === 0 ? "both" : txType % 2 === 0 ? "value" : "data";
            
            if (sendType === "value" || "both") {
                await madWallet.Transaction.createValueStore(fromAccount.address, 500, vStoreToAccount.address, 1);
            }
            if (sendType === "data" || "both") {
                let didx = generatePseudo32BHex()
                let dval = generatePseudo32BHex()
                await madWallet.Transaction.createDataStore(fromAccount.address, didx, 1, dval)
            }
            
            await madWallet.Transaction.createTxFee(fromAccount.address, fromAccount.curve);
            let tx = await madWallet.Transaction.sendWaitableTx();
            console.log(`Sending ${sendType} w/ txHash ${tx.txHash} :--: Target Addresses: ${fromAccount.address} => ${vStoreToAccount.address}` )
            allTxPromises.push(tx.wait());
            tx.wait().then( (waitedTx) => {
                console.log(`Tx Mined: ${waitedTx.txHash}`)
            });

        }

        Promise.all(allTxPromises).then(completed => {
            console.log("All TXs sent, spinning again");
            loopCycle();
        })


    }

    loopCycle();

    //////////////////////
    // DATA STORE TEST //
    ////////////////////

    // Attempt 
    // async function dataStoreTest() {

    //     console.log(`Running datastore test with account1. . .\n`);

    //     // Check balance
    //     console.log(`Checking initial balance for public address ${account1.address} ... `);
    //     let initBalance = await getBalance(account1.address);
    //     console.log(`Balance:${initBalance}`);

    //     // Create DataStore1
    //     let idx1 = generatePseudo32BHex();
    //     let val1 = "value1";
    //     console.log(`\nSending and awaiting mining of 1st datastore(${idx1}, "${val1}") ...\n`);
    //     let tx = await sendDataStore(idx1, val1, 15, account1.address);
    //     console.log(`Awaiting DStore mining for hash: ${tx.txHash} ...`);
    //     let txResp = await tx.wait();
    //     if (!txResp.isMined) { throw new Error("Fail, DataStore tx not mined") }
    //     console.log("Succes, DStore mined!")

    //     // Check post1 balance
    //     let post1Balance = await getBalance(account1.address);
    //     console.log(`\nPost 1st DataStore Bal: ${post1Balance}`);
    // }

    ///////////////////////
    // VALUE STORE TEST //
    /////////////////////

    // async function valueStoreTest() {
    //     // Send 10 from 1 => 2
    //     console.log("Sending ValueStore TX1...");
    //     let tx1 = await sendValueStore("10", account1, account2.address);
    //     console.log(`Awaiting txHash: ${tx1.txHash}`)
    //     let tx1Receipt = await tx1.wait();
    //     console.log("TX1 Receipt:\n", JSON.stringify(tx1Receipt, false, 2));

    //     // Send 5 from 2 => 3
    //     console.log("Sending ValueStore TX2...");
    //     let tx2 = await sendValueStore("5", account2, account3.address);
    //     console.log(`Awaiting txHash: ${tx2.txHash}`)
    //     let tx2Receipt = await tx2.wait();
    //     console.log("TX2 Receipt:\n", JSON.stringify(tx2Receipt, false, 2));

    //     // Send 5 from 2 => 1
    //     console.log("Sending ValueStore TX3...");
    //     let tx3 = await sendValueStore("5", account2, account1.address);
    //     console.log(`Awaiting txHash: ${tx3.txHash}`)
    //     let tx3Receipt = await tx3.wait();
    //     console.log("TX3 Receipt:\n", JSON.stringify(tx3Receipt, false, 2));

    //     // Send 5 from 3 => 1
    //     console.log("Sending ValueStore TX4...");
    //     let tx4 = await sendValueStore("5", account3, account1.address);
    //     console.log(`Awaiting txHash: ${tx3.txHash}`)
    //     let tx4Receipt = await tx4.wait();
    //     console.log("TX4 Receipt:\n", JSON.stringify(tx4Receipt, false, 2));
    // }

}