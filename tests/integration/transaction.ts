import * as dotenv from 'dotenv';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

dotenv.config({ path: process.cwd() + '/.env' });
chai.use(chaiAsPromised);
const expect = chai.expect;
import MadWalletJS from '../../index';

describe('Integration/Transaction:', function () {
    let privateKey, madWallet,  madWalletSigned;
    let secpAccount, bnAccount, secpAccountSigned, bnAccountSigned;
    let invalidHexFrom, fees;

    before(async function() {
        madWallet = (process.env.RPC && process.env.CHAIN_ID) ? new MadWalletJS(process.env.CHAIN_ID, process.env.RPC) : new MadWalletJS();
        privateKey = process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY;

        await madWallet.account.addAccount(privateKey, 1);
        await madWallet.account.addAccount(privateKey, 2);

        secpAccount = madWallet.account.accounts[0];
        bnAccount = madWallet.account.accounts[1];

        invalidHexFrom = '0xc2f89cbbcdcc7477442e7250445f0fdb3238259b';

        fees = await madWallet.Rpc.getFees();

        const balance = await madWallet.account.accounts[0].getAccountBalance();

        if(balance === '00' ){
            console.log(`Balance is ${balance}`, '\nInsufficient funds, skipping tests.');
            this.skip();
        }
    });

    beforeEach(async function() {
        madWalletSigned = new MadWalletJS(process.env.CHAIN_ID, process.env.RPC);

        await madWalletSigned.account.addAccount(privateKey, 1);
        await madWalletSigned.account.addAccount(privateKey, 2);

        secpAccountSigned = madWalletSigned.account.accounts[0];
        bnAccountSigned = madWalletSigned.account.accounts[1];
    });

    describe('Fee Estimates', () => {
        it('Fail: Reject to get current fees when RPC server is invalid', async () => {
            const madWalletWithoutRPC = new MadWalletJS(process.env.CHAIN_ID, null);
            await madWalletWithoutRPC.account.addAccount(privateKey, 1);
            await expect(
                madWalletWithoutRPC.transaction._getFees()
            ).to.eventually.be.rejectedWith('No rpc provider');
        });

        it('Success: Get the current fees and store them', async () => {
            await madWallet.transaction._getFees();
            const currentFees = madWallet.transaction.fees;
            expect(currentFees.hasOwnProperty('MinTxFee')).to.true;
            expect(currentFees.hasOwnProperty('ValueStoreFee')).to.true;
            expect(currentFees.hasOwnProperty('DataStoreFee')).to.true;
        });
    });

    describe('UTXO', () => {
        it('Fail: Cannot consume UTXOs if highest value not found', async () => {
            const account = await madWallet.account.getAccount(secpAccount.address);
            await expect(
                madWallet.transaction._spendUTXO(account.UTXO, secpAccount)
            ).to.eventually.be.rejectedWith('Could not find highest value UTXO');
        });

        it('Fail: Cannot consume UTXOs when argument accountUTXO is invalid', async () => {
            await expect(
                madWallet.transaction._spendUTXO(null)
            ).to.eventually.be.rejectedWith("TypeError: Cannot read properties of null (reading 'ValueStores')");
        });
    });

    describe('Data Store', () => {
         it('Success: Send DataStore with SECP address', async () => {
            await madWallet.transaction.createTxFee(secpAccount.address, secpAccount.curve, false);
            await madWallet.transaction.createDataStore(secpAccount.address, '0x02', 1, '0x02');
            await expect(madWallet.transaction.sendTx()).to.eventually.be.fulfilled;
        });

        it('Success: Send DataStore with BN address', async () => {
            await madWallet.transaction.createDataStore(bnAccount.address, '0x03', 2, '0x02');
            await madWallet.transaction.createTxFee(bnAccount.address, bnAccount.curve, false);
            await expect(madWallet.transaction.sendTx()).to.eventually.be.fulfilled;
        });

        it('Success: Create DataStore with SECP address', async () => {
            const { DataStore: SecpDatStore = null } = await madWallet.transaction.createDataStore(secpAccount.address, '0x02', 1, '0x02');
            const expectedOwner = await madWallet.Utils.prefixSVACurve(3, secpAccount.curve, secpAccount.address);
            expect(SecpDatStore).to.be.an('object').that.has.all.keys('DSLinker', 'Signature');
            expect(SecpDatStore.DSLinker.DSPreImage.Owner).to.equal(expectedOwner);
        });

        it('Success: Create DataStore with BN address', async () => {
            const { DataStore: BnDataStore = null } = await madWallet.transaction.createDataStore(bnAccount.address, '0x03', 2, '0x02');
            const expectedOwner = await madWallet.Utils.prefixSVACurve(3, bnAccount.curve, bnAccount.address);
            expect(BnDataStore).to.be.an('object').that.has.all.keys('DSLinker', 'Signature');
            expect(BnDataStore.DSLinker.DSPreImage.Owner).to.equal(expectedOwner);
        });

        it('Fail: Reject createDataStore when duration is invalid', async () => {
            await expect(
                madWallet.transaction.createDataStore(secpAccount.address, 'stringwithlessthan64', BigInt(-1), 'rawData', 1, 8)
            ).to.eventually.be.rejectedWith('Invalid duration');
        });

        it('Fail: Reject createDataStore without a valid account', async () => {
            const wrongFromAddress = '91f174784ba0edd9df3051deb0a53fddca8a150e';
            await expect(
                madWallet.transaction.createDataStore(wrongFromAddress, 'stringwithlessthan64', BigInt(1), 'rawData', 1, 8)
            ).to.eventually.be.rejectedWith('Could not find account');
        });

        it('Fail: Reject createDataStore when issuedAt is invalid', async () => {
            const madWalletWithoutRPC = new MadWalletJS(process.env.CHAIN_ID, null);
            await madWalletWithoutRPC.account.addAccount(privateKey, 1);
            const secpAccountWRPC = madWalletWithoutRPC.account.accounts[0];
            await expect(
                madWalletWithoutRPC.transaction.createDataStore(secpAccountWRPC.address, 'stringwithlessthan64', BigInt(1), 'rawData', false, 8)
            ).to.eventually.be.rejectedWith('RPC server must be set to fetch epoch');
        });

        it('Success: Create a DataStore with issuedAt', async () => {
            await expect(
                madWallet.transaction.createDataStore(secpAccount.address, 'stringwithlessthan64', BigInt(1), 'rawData', 1, 8)
            ).to.eventually.be.fulfilled;
        });

        it('Success: Create a DataStore with index length less than 64', async () => {
            const { DataStore = null } = await madWallet.transaction.createDataStore(secpAccount.address, 'stringwithlessthan64', BigInt(1), 'rawData', false, 8);
            expect(DataStore.DSLinker.DSPreImage.Index).to.have.lengthOf(64);
        });

        it('Fail: Reject createDataStore when index length higher than 64', async () => {
            await expect(
                madWallet.transaction.createDataStore(secpAccount.address, 'stringwithlengthofsixtyfourcharacters', BigInt(1), 'rawData', false, 8)
            ).to.eventually.be.rejectedWith('Index too large');
        });

        it('Success: Create a DataStore with fee', async () => {
            await expect(
                madWallet.transaction.createDataStore(secpAccount.address, 'index', BigInt(1), 'rawData', false, 8)
            ).to.eventually.be.fulfilled;
        });

        it('Fail: Reject createDataStore when fee is invalid', async () => {
            await expect(
                madWallet.transaction.createDataStore(secpAccount.address, 'index', BigInt(1), 'rawData', false, 100)
            ).to.eventually.be.rejectedWith('Invalid fee');
        });

        it('Success: Create a DataStore with fee undefined and non-hex rawData', async () => {
            const duration = BigInt(1);
            const rawData = 'rawData';
            const { DataStore = null } = await madWallet.transaction.createDataStore(secpAccount.address, 'index', duration, rawData, false, undefined);
            const currentDSFee = madWallet.Utils.numToHex(
                await madWallet.Utils.calculateFee(
                    madWallet.Utils.hexToInt(
                        madWallet.transaction.fees.DataStoreFee
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
                madWallet.transaction.createDataStore('0x0')
            ).to.eventually.be.rejectedWith('Missing arguments');
        });

        it('Fail: Cannot create DataStore with invalid address', async () => {
            await expect(
                madWallet.transaction.createDataStore(invalidHexFrom, '0xA', 1, '0xC0FFEE', 1)
            ).to.eventually.be.rejectedWith('Could not find account');
        });

        it('Fail: Cannot create DataStore with invalid index hex', async () => {
            await expect(
                madWallet.transaction.createDataStore(secpAccount.address, '0xZ', 1, '0xC0FFEE', 1)
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });

        it('Fail: Cannot create DataStore with invalid duration', async () => {
            await expect(
                madWallet.transaction.createDataStore(secpAccount.address, '0xA', 'a', '0xC0FFEE', 1)
            ).to.eventually.be.rejectedWith('Cannot convert a to a BigInt');
        });

        it('Fail: Cannot create DataStore with invalid data hex', async () => {
            await expect(
                madWallet.transaction.createDataStore(secpAccount.address, '0xA', 1, '0xCOFFEE', 1)
            ).to.eventually.be.rejectedWith('Invalid hex character');
        });

        it('Success: Created DataStore with hex index', async () => {
            const index = '0xA';
            const { DataStore = null } = await madWallet.transaction.createDataStore(secpAccount.address, index, 1, 'COFFEE', 1);
            expect(DataStore.DSLinker.DSPreImage.Index).to.equal(
                madWallet.Utils.isHex(index).padStart(64, '0')
            );
        });

        it('Success: Created DataStore with hex Data', async () => {
            const hexData = '0xC0FFEE';
            const { DataStore = null } = await madWallet.transaction.createDataStore(secpAccount.address, '0xA', 1, hexData, 1);
            expect(DataStore.DSLinker.DSPreImage.RawData).to.equal(
                madWallet.Utils.isHex(hexData)
            );
        });

        it('Success: Created DataStore with string index', async () => {
            const stringIndex = 'Hello';
            const { DataStore = null } = await madWallet.transaction.createDataStore(secpAccount.address, stringIndex, 1, '0xC0FFEE', 1);
            expect(DataStore.DSLinker.DSPreImage.Index).to.equal(
                madWallet.Utils.txtToHex(stringIndex).padStart(64, '0')
            );
        });

        it('Success: Created DataStorewith string Data', async () => {
            const stringData = 'COFFEE';
            const { DataStore = null } = await madWallet.transaction.createDataStore(secpAccount.address, 'World', 1, stringData, 1);
            expect(DataStore.DSLinker.DSPreImage.RawData).to.equal(
                madWallet.Utils.txtToHex(stringData)
            );
        });

        it('Success: Vout length is correct', async () => {
            await madWalletSigned.transaction.createDataStore(secpAccountSigned.address, 'World', 1, 'stringData', 1);
            expect(madWalletSigned.transaction.Tx.Vout).to.have.lengthOf(1);
        });
    });

    describe('Tx Hash and Sign', () => {
        it('Success: Sign Transaction', async () => {
            await madWallet.transaction.createValueStore(secpAccount.address, 1, secpAccount.address, 1);
            await madWallet.transaction._createTxIns(secpAccount.address, 1);
            await madWallet.transaction.Tx._createTx();
            expect(madWallet.transaction.Tx.Vin).to.be.an('array').that.is.not.empty;
            madWallet.transaction.Tx.Vin.forEach(vin => expect(vin).to.have.all.keys('Signature', 'TXInLinker'));
        });

        it('Success: Vout length is correct', async () => {
            await madWalletSigned.transaction.createValueStore(secpAccountSigned.address, 1, secpAccountSigned.address, 1);
            expect(madWalletSigned.transaction.Tx.Vout).to.have.lengthOf(1);
        });

        it('Fail: Reject sendSignedTx when Vouts length is less than or equal 0', async () => {
            await expect(
                madWalletSigned.transaction.sendSignedTx(madWalletSigned.transaction.Tx.getTx())
            ).to.eventually.be.rejectedWith('No Vouts for transaction');
        });

        it('Fail: Reject sendSignedTx when Vins length is less than or equal 0', async () => {
            await madWalletSigned.transaction.createValueStore(secpAccountSigned.address, BigInt(1), bnAccountSigned.address, 1, 1);
            await expect(
                madWalletSigned.transaction.sendSignedTx(madWalletSigned.transaction.Tx.getTx())
            ).to.eventually.be.rejectedWith('No Vins for transaction');
        });

        it('Fail: Reject createTxFee with missing arguments', async () => {
            await expect( madWallet.transaction.createTxFee()).to.eventually.be.rejectedWith('Missing arugments');
        });

        it('Fail: Reject _createValueTxIn with invalid arguments', async () => {
            await expect(
                madWallet.transaction._createValueTxIn('invalidaddress')
            ).to.eventually.be.rejectedWith("TypeError: Cannot read properties of undefined (reading 'TxHash')");
        });

        it('Fail: Reject _createDataTxIn with invalid arguments', async () => {
            await expect(
                madWallet.transaction._createDataTxIn('invalidaddress')
            ).to.eventually.be.rejectedWith("TypeError: Cannot read properties of undefined (reading 'DSLinker')");
        });
    });

    describe('ValueStore', () => {
        it('Fail: Reject createValueStore when value is less than 0', async () => {
            await expect(
                madWallet.transaction.createValueStore(secpAccount.address, BigInt(-1), bnAccount.address, 1, 1)
            ).to.eventually.be.rejectedWith('Invalid value');
        });

        it('Fail: Reject createValueStore without Fee', async () => {
            const madWalletWithoutRPC = new MadWalletJS(process.env.CHAIN_ID, null);
            await madWalletWithoutRPC.account.addAccount(privateKey, 1);
            await expect(
                madWalletWithoutRPC.transaction.createValueStore(secpAccount.address, BigInt(1), bnAccount.address, 1, undefined)
            ).to.eventually.be.rejectedWith('RPC server must be set to fetch fee');
        });

        it('Fail: Reject createValueStore when Fee is too low', async () => {
            await expect(
                madWallet.transaction.createValueStore(secpAccount.address, BigInt(1), bnAccount.address, 1, 5)
            ).to.eventually.be.rejectedWith('Fee too low');
        });

        it('Fail: Reject createValueStore when account curve is invalid', async () => {
            secpAccountSigned.curve = null;
            await expect(
                madWalletSigned.transaction.createValueStore(secpAccountSigned.address, BigInt(1), bnAccountSigned.address, 1, undefined)
            ).to.eventually.be.rejectedWith('Cannot get curve');
        });

        it('Fail: Cannot create ValueStore with missing arguments', async () => {
            await expect(
                madWallet.transaction.createValueStore(secpAccount.address, 1, secpAccount.address)
            ).to.eventually.be.rejectedWith('Missing arugments');
        });

        it('Fail: Cannot create ValueStore with invalid address length', async () => {
            await expect(
                madWallet.transaction.createValueStore('0x0', 1, secpAccount.address, 1)
            ).to.eventually.be.rejectedWith('Invalid length');
        });

        it('Fail: Cannot create ValueStore with invalid value', async () => {
            await expect(
                madWallet.transaction.createValueStore(secpAccount.address, 'A', secpAccount.address, 1)
            ).to.eventually.be.rejectedWith('Cannot convert A to a BigInt');
        });

        it('Fail: Cannot create ValueStore with invalid address', async () => {
            await expect(
                madWallet.transaction.createValueStore(secpAccount.address, 1, '0x0', 1)
            ).to.eventually.be.rejectedWith('Invalid length');
        });

        it('Fail: Cannot create ValueStore with invalid curve', async () => {
            await expect(
                madWallet.transaction.createValueStore(secpAccount.address, 1, secpAccount.address, 3)
            ).to.eventually.be.rejectedWith('Invalid curve');
        });

        it('Fail: Cannot create ValueStore from address not added to account', async () => {
            await expect(
                madWallet.transaction.createValueStore(invalidHexFrom, 1, secpAccount.address, 1)
            ).to.eventually.be.rejectedWith('Could not find account');
        });

        it('Fail: Insufficient funds', async () => {
            await madWallet.transaction.createValueStore(secpAccount.address, 1000000000000000000000000000000, bnAccount.address, bnAccount.curve);
            await expect(madWallet.transaction.sendTx()).to.eventually.be.rejectedWith('Insufficient funds');
        });

        it('Success: Create ValueStore with SECP address', async () => {
            const { ValueStore: SecpValueStore = null } = await madWallet.transaction.createValueStore(secpAccount.address, 1, bnAccount.address, bnAccount.curve);
            const expectedOwner = await madWallet.Utils.prefixSVACurve(1, bnAccount.curve, bnAccount.address);
            expect(SecpValueStore).to.be.an('object').that.has.all.keys('TxHash', 'VSPreImage');
            expect(SecpValueStore.VSPreImage.Owner).to.equal(expectedOwner);
        });

        it('Success: Create ValueStore with BN address', async () => {
            const { ValueStore: BnValueStore = null } = await madWallet.transaction.createValueStore(bnAccount.address, 1, secpAccount.address, secpAccount.curve);
            const expectedOwner = await madWallet.Utils.prefixSVACurve(1, secpAccount.curve, secpAccount.address);
            expect(BnValueStore).to.be.an('object').that.has.all.keys('TxHash', 'VSPreImage');
            expect(BnValueStore.VSPreImage.Owner).to.equal(expectedOwner);
        });

        it('Success: Create a ValueStore with acceptable Fee', async () => {
            const { ValueStore = null } = await madWallet.transaction.createValueStore(secpAccount.address, BigInt(1), bnAccount.address, 1, 1);
            expect(ValueStore.VSPreImage.Fee).to.equal(madWallet.Utils.numToHex(1));
        });

        it('Success: Send ValueStore with SECP address', async () => {
            await madWallet.transaction.createTxFee(secpAccount.address, secpAccount.curve, false);
            await madWallet.transaction.createValueStore(secpAccount.address, 9995, bnAccount.address, bnAccount.curve);
            await expect(madWallet.transaction.sendTx()).to.eventually.be.fulfilled;
        });

        it('Success: Send ValueStore with BN address', async () => {
            await madWallet.transaction.createValueStore(bnAccount.address, 1, secpAccount.address, secpAccount.curve);
            await madWallet.transaction.createTxFee(bnAccount.address, bnAccount.curve, false);
            await expect(madWallet.transaction.sendTx()).to.eventually.be.fulfilled;
        });
    });
});

