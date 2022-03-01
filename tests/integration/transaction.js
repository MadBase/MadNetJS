require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");

describe('Integration/Transaction:', () => {
    let privateKey, secondPrivateKey, madWallet, madWalletWithoutRPC, madWalletSigned;
    let wrongFromAddress, accountUTXO, valueStoreVoutLength, dataStoreVoutLength, hexFrom;
   
    before(async function() {
        madWallet = (process.env.RPC && process.env.CHAIN_ID) ? new MadWalletJS(process.env.CHAIN_ID, process.env.RPC) : new MadWalletJS();
        privateKey = process.env.PRIVATE_KEY || "6B59703273357638792F423F4528482B4D6251655468576D5A7134743677397A";
        secondPrivateKey = '6aea45ee1273170fb525da34015e4f20ba39fe792f486ba74020bcacc9badfc2';
        wrongFromAddress = '91f174784ba0edd9df3051deb0a53fddca8a150e';
        accountUTXO = {
            "ValueStores": {
                "VSPreImage": {
                    "Value": 1
                }
            },
        };
        valueStoreVoutLength = 11;
        dataStoreVoutLength = 8;
        hexFrom = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';

        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(privateKey, 2);
        await madWallet.Account.addAccount(secondPrivateKey, 1);
        await madWallet.Account.addAccount(secondPrivateKey, 2);
    });

    beforeEach(async function() {
        madWalletWithoutRPC = new MadWalletJS(42, null);
        madWalletSigned = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);
    });

    describe('Fee Estimates', () => {
        it('Fail: Reject to get current fees when RPC server is invalid', async () => {
            await madWalletWithoutRPC.Account.addAccount(privateKey, 1);
            await expect(
                madWalletWithoutRPC.Transaction._getFees()
            ).to.eventually.be.rejectedWith('No rpc provider');
        });

        it('Success: Get the current fees and store them', async () => {
            await expect(
                madWallet.Transaction.Tx.estimateFees()
            ).to.eventually.be.fulfilled;
        });
    });

    describe('UTXO', () => {
        it('Fail: Reject _spendUTXO when highest unspent is invalid', async () => {
            await expect(
                madWallet.Transaction._spendUTXO(accountUTXO, madWallet.Account.accounts[0])
            ).to.eventually.be.rejectedWith('Could not find highest value UTXO');
        });
    
        it('Fail: Reject _spendUTXO when arguments are invalid', async () => {
            await expect(
                madWallet.Transaction._spendUTXO('wrongAccountUTXO')
            ).to.eventually.be.rejectedWith(Error);
        });
    });
    
    describe('Data Store', () => {
        it('Fail: Reject createDataStore when duration is invalid', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'stringwithlessthan64', BigInt(-1), 'rawData', 1, 8)
            ).to.eventually.be.rejectedWith('Invalid duration');
        });

        it('Fail: Reject createDataStore without a valid account', async () => {
            await expect(
                madWallet.Transaction.createDataStore(wrongFromAddress, 'stringwithlessthan64', BigInt(1), 'rawData', 1, 8)
            ).to.eventually.be.rejectedWith('Could not find account');
        });

        it('Fail: Reject createDataStore when issuedAt is invalid', async () => {
            await madWalletWithoutRPC.Account.addAccount(privateKey, 1);
            await expect(
                madWalletWithoutRPC.Transaction.createDataStore(madWalletWithoutRPC.Account.accounts[0].address, 'stringwithlessthan64', BigInt(1), 'rawData', false, 8)
            ).to.eventually.be.rejectedWith('RPC server must be set to fetch epoch');
        });
        
        it('Success: Create a DataStore with issuedAt', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'stringwithlessthan64', BigInt(1), 'rawData', 1, 8)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Create a DataStore with index length different than 64', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'stringwithlessthan64', BigInt(1), 'rawData', false, 8)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject createDataStore when index length higher than 64', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'stringwithlengthofsixtyfourcharacters', BigInt(1), 'rawData', false, 8)
            ).to.eventually.be.rejectedWith('Index too large');
        });

        it('Success: Create a DataStore with fee', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'index', BigInt(1), 'rawData', false, 8)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject createDataStore when fee is invalid', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'index', BigInt(1), 'rawData', false, 100)
            ).to.eventually.be.rejectedWith('Invalid fee');
        });

        it('Success: Create a DataStore with fee not definded', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'index', BigInt(1), 'rawData', false, undefined)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Create DataStore - Missing inputs', async () => {
            await expect(
                madWallet.Transaction.createDataStore("0x0")
            ).to.eventually.be.rejected;
        });

        it('Fail: Create DataStore - Invalid address', async () => {
            await expect(
                madWallet.Transaction.createDataStore(hexFrom, "0xA", 1, "0xC0FFEE", 1)
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
    });

    describe('Tx Hash and Sign', () => {
        it('Success: Create all TxIns required for Vin', async () => {
            await madWalletSigned.Account.addAccount(privateKey, 1);
            await madWalletSigned.Account.addAccount(privateKey, 2);
            madWalletSigned.Transaction.Tx.Vin = -1;
            madWalletSigned.Transaction.outValue.push({ 
                address: madWalletSigned.Account.accounts[0]['address'],
                totalValue: 0,
                dsIndex: []
            });
            await expect(
                madWalletSigned.Transaction._createTxIns(madWalletSigned.Account.accounts[0]['address'], madWalletSigned.Account.accounts[1]['address'], [], false)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject sendSignedTx when Vin length is less than 0', async () => {
            await madWalletSigned.Account.addAccount(privateKey, 1);
            madWalletSigned.Transaction.Tx.Vin = -1;
            await expect(
                madWalletSigned.Transaction.sendSignedTx(madWalletSigned.Transaction.Tx.getTx())
            ).to.eventually.be.rejectedWith('No Vouts for transaction');
        });

        it('Fail: Reject createTxFee with invalid arguments', async () => {
            await expect(
                madWallet.Transaction.createTxFee('invalidpayeraddress')
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Reject _createValueTxIn with invalid arguments', async () => {
            await expect(
                madWallet.Transaction._createValueTxIn('invalidaddress')
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Fail: Reject _createDataTxIn with invalid arguments', async () => {
            await expect(
                madWallet.Transaction._createDataTxIn('invalidaddress')
            ).to.eventually.be.rejectedWith(Error);
        });

        it('Success: Vout length is correct', () => {
            expect(madWallet.Transaction.Tx.Vout).to.have.lengthOf(dataStoreVoutLength);
        });

        it('Success: Sign Transaction', async () => {
            await expect(
                madWallet.Transaction.Tx._createTx()
            ).to.eventually.be.fulfilled;
        });
    });

    describe('ValueStore', () => {
        it('Fail: Reject createValueStore when value is less than 0', async () => {
            await expect(
                madWallet.Transaction.createValueStore(
                    madWallet.Account.accounts[0]['address'], BigInt(-1), madWallet.Account.accounts[1]['address'], 1, 1
                )
            ).to.eventually.be.rejectedWith('Invalid value');
        });
    
        it('Fail: Reject createValueStore without Fee', async () => {
            await madWalletWithoutRPC.Account.addAccount(privateKey, 1);
            await expect(
                madWalletWithoutRPC.Transaction.createValueStore(
                    madWallet.Account.accounts[0]['address'], BigInt(1), madWallet.Account.accounts[1]['address'], 1, undefined
                )
            ).to.eventually.be.rejectedWith('RPC server must be set to fetch fee');
        });
        
        it('Success: Create a ValueStore with acceptable Fee', async () => {
            await expect(
                madWallet.Transaction.createValueStore(
                    madWallet.Account.accounts[0]['address'], BigInt(1), madWallet.Account.accounts[1]['address'], 1, 1
                )
            ).to.eventually.be.fulfilled;
        });
    
        it('Fail: Reject createValueStore when Fee is too low', async () => {
            await expect(
                madWallet.Transaction.createValueStore(
                    madWallet.Account.accounts[0]['address'], BigInt(1), madWallet.Account.accounts[1]['address'], 1, 5
                )
            ).to.eventually.be.rejectedWith('Fee too low');
        });
    
        it('Fail: reject createValueStore when account curve is invalid', async () => {
            madWallet.Account.accounts[2]['curve'] = null;
            await expect(
                madWallet.Transaction.createValueStore(madWallet.Account.accounts[2]['address'], BigInt(1), madWallet.Account.accounts[3]['address'], 1, undefined)
            ).to.eventually.be.rejectedWith('Cannot get curve');
        });
    
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
                madWallet.Transaction.createValueStore(hexFrom, 1, madWallet.Account.accounts[0]["address"], 1)
            ).to.eventually.be.rejected;
        });
    
        it('Success: Created ValueStore', async () => {
            await expect(
                madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, madWallet.Account.accounts[0]["address"], 1)
            ).to.eventually.be.fulfilled;
        });
    
        it('Success: Vout length is correct', async () => {
            await madWallet.Transaction._createTxIns();
            await madWallet.Transaction.Tx._createTx();
            expect(madWallet.Transaction.Tx.Vout).to.have.lengthOf(valueStoreVoutLength)
        });
    });  
});

