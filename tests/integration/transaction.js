require('dotenv').config({ path: process.cwd() + '/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const MadWalletJS = require("../../index.js");

describe('Integration/Transaction:', () => {
    let privateKey,  madWallet, madWalletWithoutRPC, madWalletSigned, fees;
    let invalidHexFrom, wait;
    const waitingTime = 40 * 1000; 
    const testTimeout = 100 * 1000;

    before(async function() {
        madWallet = (process.env.RPC && process.env.CHAIN_ID) ? new MadWalletJS(process.env.CHAIN_ID, process.env.RPC) : new MadWalletJS();
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;

        await madWallet.Account.addAccount(privateKey, 1);
        await madWallet.Account.addAccount(privateKey, 2);

        invalidHexFrom = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';

        fees = await madWallet.Rpc.getFees(); 
        wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    });

    beforeEach(async function() {
        madWalletWithoutRPC = new MadWalletJS(process.env.CHAIN_ID, null);
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
            await madWallet.Transaction._getFees();
            const currentFees = madWallet.Transaction.fees;
            expect(currentFees).to.be.an('object').that.has.all.keys(
                'MinTxFee', 
                'ValueStoreFee', 
                'DataStoreFee', 
                'AtomicSwapFee'
            );
        });
    });

    describe('UTXO', () => {
        it('Fail: Cannot consume UTXOs if highest value not found', async () => {
            const account = await madWallet.Account.getAccount(madWallet.Account.accounts[0]['address']);
            await expect(
                madWallet.Transaction._spendUTXO(account['UTXO'], madWallet.Account.accounts[0])
            ).to.eventually.be.rejectedWith('Could not find highest value UTXO');
        });
    
        it('Fail: Cannot consume UTXOs when argument accountUTXO is invalid', async () => {
            await expect(
                madWallet.Transaction._spendUTXO(null)
            ).to.eventually.be.rejectedWith('Cannot read property');
        });

        // TODO Test the inverse of the above fail examples
    });
    
    describe('Data Store', () => {
        it('Fail: Reject createDataStore when duration is invalid', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'stringwithlessthan64', BigInt(-1), 'rawData', 1, 8)
            ).to.eventually.be.rejectedWith('Invalid duration');
        });

        it('Fail: Reject createDataStore without a valid account', async () => {
            const wrongFromAddress = '91f174784ba0edd9df3051deb0a53fddca8a150e';
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

        it('Success: Create a DataStore with index length less than 64', async () => {
            const { DataStore = null } = await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'stringwithlessthan64', BigInt(1), 'rawData', false, 8);
            expect(DataStore.DSLinker.DSPreImage.Index).to.have.lengthOf(64);
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

        it('Success: Create a DataStore with fee undefined and non-hex rawData', async () => {
            const duration = BigInt(1);
            const rawData = 'rawData';
            const { DataStore = null } = await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]['address'], 'index', duration, rawData, false, undefined);
            const currentDSFee = madWallet.Utils.numToHex(
                await madWallet.Utils.calculateFee(
                    madWallet.Utils.hexToInt(
                        madWallet.Transaction.fees['DataStoreFee']
                    ),
                    duration
                )
            );
            const rawDataToHex = madWallet.Utils.txtToHex(rawData);
            expect(DataStore.DSLinker.DSPreImage.Fee).to.equal(currentDSFee);
            expect(DataStore.DSLinker.DSPreImage.RawData).to.equal(rawDataToHex);
        });

        it('Fail: Cannot create DataStore with missing arguments', async () => {
            await expect(
                madWallet.Transaction.createDataStore("0x0")
            ).to.eventually.be.rejectedWith('Missing arguments');
        });

        it('Fail: Cannot create DataStore with invalid address', async () => {
            await expect(
                madWallet.Transaction.createDataStore(invalidHexFrom, "0xA", 1, "0xC0FFEE", 1)
            ).to.eventually.be.rejectedWith('Could not find account');
        });

        it('Fail: Cannot create DataStore with invalid index hex', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xZ", 1, "0xC0FFEE", 1)
            ).to.eventually.be.rejectedWith('Invalid hex charater');
        });

        it('Fail: Cannot create DataStore with invalid duration', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xA", "a", "0xC0FFEE", 1)
            ).to.eventually.be.rejectedWith('Cannot convert a to a BigInt');
        });

        it('Fail: Cannot create DataStore with invalid data hex', async () => {
            await expect(
                madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xA", 1, "0xCOFFEE", 1)
            ).to.eventually.be.rejectedWith('Invalid hex charater');
        });
        
        it('Success: Created DataStore with hex index', async () => {
            const index = '0xA';
            const { DataStore = null } = await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], index, 1, "COFFEE", 1);
            expect(DataStore.DSLinker.DSPreImage.Index).to.equal(
                madWallet.Utils.isHex(index).padStart(64, "0")
            );
        });

        it('Success: Created DataStore with hex Data', async () => {
            const hexData = '0xC0FFEE';
            const { DataStore = null } = await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0xA", 1, hexData, 1);
            expect(DataStore.DSLinker.DSPreImage.RawData).to.equal(
                madWallet.Utils.isHex(hexData)
            );
        });

        it('Success: Created DataStore with string index', async () => {
            const stringIndex = 'Hello';
            const { DataStore = null } = await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], stringIndex, 1, "0xC0FFEE", 1);
            expect(DataStore.DSLinker.DSPreImage.Index).to.equal(
                madWallet.Utils.txtToHex(stringIndex).padStart(64, "0")
            );
        });

        it('Success: Created DataStorewith string Data', async () => {
            const stringData = 'COFFEE';
            const { DataStore = null } = await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "World", 1, stringData, 1);
            expect(DataStore.DSLinker.DSPreImage.RawData).to.equal(
                madWallet.Utils.txtToHex(stringData)
            );
        });

        it('Success: Vout length is correct', async () => {
            await madWalletSigned.Account.addAccount(privateKey, 1);
            await madWalletSigned.Transaction.createDataStore(madWalletSigned.Account.accounts[0]["address"], "World", 1, 'stringData', 1);
            expect(madWalletSigned.Transaction.Tx.Vout).to.have.lengthOf(1);
        });
    });

    describe('Tx Hash and Sign', () => {
        it('Success: Sign Transaction', async () => {
            await madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, madWallet.Account.accounts[0]["address"], 1);
            await madWallet.Transaction._createTxIns(madWallet.Account.accounts[0]['address'], 1);
            await madWallet.Transaction.Tx._createTx();
            expect(madWallet.Transaction.Tx.Vin).to.be.an('array').that.is.not.empty;
            madWallet.Transaction.Tx.Vin.forEach(vin => expect(vin).to.have.all.keys(
                'Signature', 
                'TXInLinker'
            ));
        });
    
        it('Success: Vout length is correct', async () => {
            await madWalletSigned.Account.addAccount(privateKey, 1);
            await madWalletSigned.Transaction.createValueStore(madWalletSigned.Account.accounts[0]["address"], 1, madWalletSigned.Account.accounts[0]["address"], 1);
            expect(madWalletSigned.Transaction.Tx.Vout).to.have.lengthOf(1);
        });

        it('Fail: Reject sendSignedTx when Vouts length is less than or equal 0', async () => {
            await madWalletSigned.Account.addAccount(privateKey, 1);
            await expect(
                madWalletSigned.Transaction.sendSignedTx(madWalletSigned.Transaction.Tx.getTx())
            ).to.eventually.be.rejectedWith('No Vouts for transaction');
        });

        it('Fail: Reject sendSignedTx when Vins length is less than or equal 0', async () => {
            await madWalletSigned.Account.addAccount(privateKey, 1);
            await madWalletSigned.Account.addAccount(privateKey, 2);
            await madWalletSigned.Transaction.createValueStore(madWalletSigned.Account.accounts[0]['address'], BigInt(1), madWalletSigned.Account.accounts[1]['address'], 1, 1); 
            await expect(
                madWalletSigned.Transaction.sendSignedTx(madWalletSigned.Transaction.Tx.getTx())
            ).to.eventually.be.rejectedWith('No Vins for transaction');
        });

        it('Fail: Reject createTxFee with missing arguments', async () => {
            await expect(
                madWallet.Transaction.createTxFee()
            ).to.eventually.be.rejectedWith('Missing arugments');
        });

        it('Fail: Reject _createValueTxIn with invalid arguments', async () => {
            await expect(
                madWallet.Transaction._createValueTxIn('invalidaddress')
            ).to.eventually.be.rejectedWith('Cannot read property');
        });

        it('Fail: Reject _createDataTxIn with invalid arguments', async () => {
            await expect(
                madWallet.Transaction._createDataTxIn('invalidaddress')
            ).to.eventually.be.rejectedWith('Cannot read property');
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
            const { ValueStore = null } = await madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]['address'], BigInt(1), madWallet.Account.accounts[1]['address'], 1, 1); 
            expect(ValueStore.VSPreImage.Fee).to.equal(madWallet.Utils.numToHex(1));
        });
    
        it('Fail: Reject createValueStore when Fee is too low', async () => {
            await expect(
                madWallet.Transaction.createValueStore(
                    madWallet.Account.accounts[0]['address'], BigInt(1), madWallet.Account.accounts[1]['address'], 1, 5
                )
            ).to.eventually.be.rejectedWith('Fee too low');
        });
    
        it('Fail: reject createValueStore when account curve is invalid', async () => {
            await madWalletSigned.Account.addAccount(privateKey, 1);
            await madWalletSigned.Account.addAccount(privateKey, 2);
            madWalletSigned.Account.accounts[0]['curve'] = null;
            await expect(
                madWalletSigned.Transaction.createValueStore(madWalletSigned.Account.accounts[0]['address'], BigInt(1), madWalletSigned.Account.accounts[1]['address'], 1, undefined)
            ).to.eventually.be.rejectedWith('Cannot get curve');
        });
    
        it('Fail: Cannot create ValueStore with missing arguments', async () => {
            await expect(
                madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, madWallet.Account.accounts[0]["address"])
            ).to.eventually.be.rejectedWith('Missing arugments');
        });
    
        it('Fail: Cannot create ValueStore with invalid address length', async () => {
            await expect(
                madWallet.Transaction.createValueStore("0x0", 1, madWallet.Account.accounts[0]["address"], 1)
            ).to.eventually.be.rejectedWith('Invalid length');
        });
    
        it('Fail: Cannot create ValueStore with invalid value', async () => {
            await expect(
                madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], "A", madWallet.Account.accounts[0]["address"], 1)
            ).to.eventually.be.rejectedWith('Cannot convert A to a BigInt');
        });
    
        it('Fail: Cannot create ValueStore with invalid address', async () => {
            await expect(
                madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, "0x0", 1)
            ).to.eventually.be.rejectedWith('Invalid length');
        });
    
        it('Fail: Cannot create ValueStore with invalid curve', async () => {
            await expect(
                madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, madWallet.Account.accounts[0]["address"], 3)
            ).to.eventually.be.rejectedWith('Invalid curve');
        });
    
        it('Fail: Cannot create ValueStore from address not added to account', async () => {
            await expect(
                madWallet.Transaction.createValueStore(invalidHexFrom, 1, madWallet.Account.accounts[0]["address"], 1)
            ).to.eventually.be.rejectedWith('Could not find account');
        });
    
        it('Success: Created ValueStore', async () => {
            await expect(
                madWallet.Transaction.createValueStore(madWallet.Account.accounts[0]["address"], 1, madWallet.Account.accounts[0]["address"], 1)
            ).to.eventually.be.fulfilled;
        });

        // TODO Organize better these
        it('Fail: Insufficient funds', async () => {
            await madWallet.Transaction.createValueStore(
                madWallet.Account.accounts[0]["address"], 1000000000, madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"]
            );
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.rejectedWith('Insufficient funds');
        });
    
        it('Success: SECP Create & Send DataStore', async () => {
            await madWallet.Transaction.createTxFee(
                madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"], BigInt("0x" + fees["MinTxFee"]).toString()
            );
            await madWallet.Transaction.createDataStore(madWallet.Account.accounts[0]["address"], "0x02", 1, "0x02");
            const transactionHash = await madWallet.Transaction.sendTx()

            expect(transactionHash).to.exist;
            expect(transactionHash).to.be.an('string');
        }).timeout(testTimeout);

        // TODO abstract and check values and object structures
        /**
         *  -- From github comment --
         * We may want to add test cases that individually check the ability to create data or value stores so that we can verify the 
         * integrity of those objects as a test case itself rather than assuming that those objects are correct and passing them forward
         */
    
        it('Success: SECP Create & Send ValueStore', async () => {
            await wait(waitingTime);
            await madWallet.Transaction.createTxFee(
                madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"], BigInt("0x" + fees["MinTxFee"]).toString()
            );
            await madWallet.Transaction.createValueStore(
                madWallet.Account.accounts[0]["address"], 9995, madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"]
            );
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.fulfilled;
        }).timeout(testTimeout);
    
        it('Success: BN Create & Send DataStore', async () => {
            await wait(waitingTime);
            await madWallet.Transaction.createDataStore(madWallet.Account.accounts[1]["address"], "0x03", 2, "0x02");
            await madWallet.Transaction.createTxFee(
                madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"], BigInt("0x" + fees["MinTxFee"]).toString()
            );
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.fulfilled;
        }).timeout(testTimeout);
    
        /**
         * -- From github comment --
         * Same thing here possibly have test abstractions like: can create data stores with BN. Address, can create value stores with BN address, etc
         */
        it('Success: BN Create & Send ValueStore', async () => {
            await wait(waitingTime);
            await madWallet.Transaction.createValueStore(
                madWallet.Account.accounts[1]["address"], 1, madWallet.Account.accounts[0]["address"], madWallet.Account.accounts[0]["curve"]
            );
            await madWallet.Transaction.createTxFee(
                madWallet.Account.accounts[1]["address"], madWallet.Account.accounts[1]["curve"], BigInt("0x" + fees["MinTxFee"]).toString()
            );
            await expect(
                madWallet.Transaction.sendTx()
            ).to.eventually.be.fulfilled;
        }).timeout(testTimeout);
    });  
});

