require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const expect = chai.expect
let MadWalletJS = require("../../index.js");

let privateKey, madWallet;
if (
    process.env.RPC &&
    process.env.CHAIN_ID
) {

    madWallet = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
}
else {
    madWallet = new MadWalletJS();
}
if (process.env.PRIVATE_KEY) {
    privateKey = process.env.PRIVATE_KEY
}
else {
    privateKey = "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A"
}

describe('Transaction: DataStore', () => {

    before(async () => {
        await madWallet.Account.addAccount(privateKey, 1);
    });

    // TODO Medium - Test sendSignedTx(Tx) for this.Tx.Vin.length <= 0
    // TODO Medium - Test createTxFee(payeerAddress, payeerCurve, fee = false) for Errors
    // TODO Medium - Test createValueStore(...args) for value <= BigInt(0)
    // TODO Medium - Test createValueStore(...args) for if (fee)
    // TODO Medium - Test createValueStore(...args) for if (!fee) Error
    // TODO Medium - Test createValueStore(...args) for !account["curve"] Error
    // TODO Medium - Test createDataStore(...args) for duration <= BigInt(0) Error
    // TODO Medium - Test createDataStore(...args) for !account Error
    // TODO Medium - Test createDataStore(...args) for !this.Wallet.Rpc.rpcServer Error
    // TODO Medium - Test createDataStore(...args) for issuedAt++
    // TODO Medium - Test createDataStore(...args) for index.length > 64 Error
    // TODO Medium - Test createDataStore(...args) for if (fee)
    // TODO Easy - Test createDataStore(...args) for if (!fee) Error
    // TODO Medium - Test _getFees() for Errors
    // TODO Easy - Test _addOutValue(value, ownerAddress, dsIndex) for Errors
    // TODO Medium - Test _createTxIns(..args) for UTXOIDs.length > 0
    // TODO Medium - Test _createTxIns(..args) for !this.fees
    // TODO Medium - Test _createTxIns(..args) for insufficientFunds && returnInsufficientOnGas
    // TODO Medium - Test _createTxIns(..args) for BigInt(outValue["totalValue"]) == BigInt(0)
    // TODO Medium - Test _createTxIns(..args) for BigInt(outValue["totalValue"]) < BigInt(0)
    // TODO Easy - Test _createValueTxIn(address, utxo) for Errors
    // TODO Easy - Test _createDataTxIn(address, utxo) for Errors
    // TODO Medium - Test _spendUTXO(...args) for !highestUnspent Errors
    // TODO Medium - Test _spendUTXO(...args) for remaining > BigInt(0)
    // TODO Easy - Test _spendUTXO(...args) for Errors

    it('Fail: Create DataStore - Missing inputs', async () => {
        await expect(
            madWallet.Transaction.createDataStore("0x0")
        ).to.eventually.be.rejected;
    });

    it('Fail: Create DataStore - Invalid address', async () => {
        await expect(
            madWallet.Transaction.createDataStore("0xc2f89cbbcdcc7477442e7250445f0fdb3238259b", "0xA", 1, "0xC0FFEE", 1)
        ).to.eventually.be.rejected;
    });

    it('Fail: Create DataStore - Invalid index hex', async () => {
        await expect(
            madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xZ", 1, "0xC0FFEE", 1)
        ).to.eventually.be.rejected;
    });

    it('Fail: Create DataStore - Invalid duration', async () => {
        await expect(
            madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xA", "a", "0xC0FFEE", 1)
        ).to.eventually.be.rejected;
    });

    it('Fail: Create DataStore - Invalid data hex', async () => {
        await expect(
            madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xA", 1, "0xCOFFEE", 1)
        ).to.eventually.be.rejected;
    });
    
    it('Success: Created DataStore - Hex index', async () => {
        await expect(
            madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xA", 1, "COFFEE", 1)
        ).to.eventually.be.fulfilled;
    });

    it('Success: Created DataStore - Hex Data', async () => {
        await expect(
            madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xA", 1, "0xC0FFEE", 1)
        ).to.eventually.be.fulfilled;
    });

    it('Success: Created DataStore - String index', async () => {
        await expect(
            madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "Hello", 1, "0xC0FFEE", 1)
        ).to.eventually.be.fulfilled;
    });

    it('Success: Created DataStore - String Data', async () => {
        await expect(
            madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "World", 1, "COFFEE", 1)
        ).to.eventually.be.fulfilled;
    });

    it('Success: Vout length is correct', () => {
        expect(madWallet.Transaction.Tx.Vout).to.have.lengthOf(4) //account for fee object
    });
});

describe('Transaction: ValueStore', () => {

    it('Fail: Create ValueStore - Missing inputs', async () => {
        await expect(
            madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, madWallet.Account.accounts[0]["address"])
        ).to.eventually.be.rejected;
    });

    it('Fail: Create ValueStore - Invalid from address', async () => {
        await expect(
            madWallet.Transaction.createValueStore("0x0", 1, madWallet.Account.accounts[0]["address"], 1)
        ).to.eventually.be.rejected;
    });

    it('Fail: Create ValueStore - Invalid value', async () => {
        await expect(
            madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], "A", madWallet.Account.accounts[0]["address"], 1)
        ).to.eventually.be.rejected;
    });

    it('Fail: Create ValueStore - Invalid to address', async () => {
        await expect(
            madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, "0x0", 1)
        ).to.eventually.be.rejected;
    });

    it('Fail: Create ValueStore - Invalid to curve', async () => {
        await expect(
            madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, madWallet.Account.accounts[0]["address"], 3)
        ).to.eventually.be.rejected;
    });

    it('Fail: Create ValueStore - From address not added to account', async () => {
        await expect(
            madWallet.Transaction.createValueStore("0xc2f89cbbcdcc7477442e7250445f0fdb3238259b", 1, madWallet.Account.accounts[0]["address"], 1)
        ).to.eventually.be.rejected;
    });

    it('Success: Created ValueStore', async () => {
        await expect(
            madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, madWallet.Account.accounts[0]["address"], 1)
        ).to.eventually.be.fulfilled;
    });

    it('Success: Vout length is correct', async () => {
        await madWallet.Transaction._createTxIns()
        await madWallet.Transaction.Tx._createTx()
        expect(madWallet.Transaction.Tx.Vout).to.have.lengthOf(6)
    });

});
if (process.env.RPC) {
    describe('Transaction: GetFeeEstiamtes', () => {
        it('Success: Get Fees', async () => {
            await expect(
                madWallet.Transaction.Tx.estimateFees()
            ).to.eventually.be.fulfilled;
        });
    });
}
describe('Transaction: Hash and Sign', () => {
    it('Success: Sign Transaction', async () => {
        await expect(
            madWallet.Transaction.Tx._createTx()
        ).to.eventually.be.fulfilled;
    });
});