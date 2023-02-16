require('dotenv').config({ path: process.cwd() + '/.env' });
const MadWalletJS = require("../index.js");
const madWallet = new MadWalletJS(false, process.env.RPC);

async function waitForTx(txHash) {
    try {
        console.log('// Wait txHash to be mined');
        await madWallet.Rpc.request('get-mined-transaction', { TxHash: txHash });
        return txHash;
    } catch (ex) {
        console.log('Catch wait tx error: ' + String(ex));
        if (ex.message.indexOf('unknown transaction:')) {
            return waitForTx(txHash);
        }
    }
}

async function main() {
    try {
        const privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;
        const secondaryPrivateKey = process.env.OPTIONAL_TEST_SUITE_SECONDARY_PRIVATE_KEY;

        await madWallet.account.addAccount(privateKey, 1);
        await madWallet.account.addAccount(secondaryPrivateKey, 1);

        const secpAccount = madWallet.account.accounts[0];
        const secpSecondaryAccount = madWallet.account.accounts[1];

        try {
            console.log('// Create value store object for tx');
            await madWallet.Transaction.createValueStore(secpAccount.address, 1000, secpSecondaryAccount.address, 1);

            console.log('// Create tx fee');
            await madWallet.Transaction.createTxFee(secpAccount.address, 1, false);

            console.log('// Sending transaction..');
            const txHash = await madWallet.Transaction.sendTx(secpAccount.address, 1);

            console.log('// Retrieve valid txHash');
            const validTxHash = await waitForTx(txHash);

            console.log(validTxHash);
        } catch (ex) {
            console.log('RPC error message:' + String(ex));
        }
    }
    catch (ex) {
        console.log('Catch: ' + String(ex));
    }
}

main();
