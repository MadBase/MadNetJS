/**
 * A Root Hook Plugin is loaded via --require which “registers” one or more root hooks to be used across all test files.
 */
require('dotenv').config({ path: process.cwd() + '/tests/.env' });
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const MadWalletJS = require("../index.js");
const madWallet = new MadWalletJS(42, process.env.PRIVATE_KEY || "http://127.0.0.1:8884/v1/");

exports.mochaHooks = {
	async beforeAll() {
		// Check if PRIVATE_KEY is empty in .env file
		if(!process.env.PRIVATE_KEY) {
			throw new Error('You need to setup a funded Private Key in your .env file to run tests properly.');
		}

		try {
			// add 2 bn curve addresses
			await madWallet.Account.addAccount("6aea45ee1273170fb525da34015e4f20ba39fe792f486ba74020bcacc9badfc1", 2);
			await madWallet.Account.addAccount("6aea45ee1273170fb525da34015e4f20ba39fe792f486ba74020bcacc9badfc2", 2);
			await madWallet.Account.addAccount("6aea45ee1273170fb525da34015e4f20ba39fe792f486ba74020bcacc9badfc1", 1);
	
			let acct1 = await madWallet.Account.getAccount(madWallet.Account.accounts[0]["address"]);
			let acct1p = await acct1.signer.getPubK();
			let acct2 = await madWallet.Account.getAccount(madWallet.Account.accounts[1]["address"]);
			let acct2p = await acct2.signer.getPubK();
			console.log("Public Key #1:", acct1p);
			console.log("Public Key #2:", acct2p);
			console.log("-------------------");
	
			let multiAcct = await madWallet.Account.addMultiSig([acct1p, acct2p]);
	
			console.log("Aggregated Public Key:", await multiAcct.signer.getPubK());
			console.log("----------------");
	
			console.log("Aggregated Address:", multiAcct.address);
			console.log("--------------");
	
			let msgHex = Buffer.from("hello world", "utf8").toString("hex").toLowerCase();
			let multiPubK = await multiAcct.signer.getPubK();
	
			let sig1 = await acct1.signer.multiSig.sign(msgHex, multiPubK);
			console.log("Hello World Signature #1", sig1);
			console.log("-------------------");
			let sig2 = await acct2.signer.multiSig.sign(msgHex, multiPubK);
			console.log("Hello World Signature #2:", sig2);
			console.log("-------------------");
	
			let verifySig1 = await multiAcct.signer.verifyAggregateSingle(msgHex, multiPubK, sig1);
			console.log("Signature #1 Verified:", verifySig1);
			console.log("-------------------");
			let verifySig2 = await multiAcct.signer.verifyAggregateSingle(msgHex, multiPubK, sig2);
			console.log("Signature #2 Verified:", verifySig2);
			console.log("-------------------");
	
	
			let aSig = await multiAcct.signer.aggregateSignatures([sig1, sig2]);
			console.log("Aggregated Hello World Signature:", aSig);
			console.log("-------------");
	
			let aV = await multiAcct.signer.verifyAggregate(msgHex, aSig);
	
			console.log("Aggregated Hello World Verify:", aV);
			console.log("-------------");
	
			let ava = await multiAcct.signer.getAddress();
			console.log("Aggregated Signature Address From Verify Public Key:", ava);
			console.log("--------------");
	
			let fees = await madWallet.Transaction.Tx.estimateFees();
			console.log("Estimate Fees:", fees);
			console.log("--------------");
	
			console.log("Creating multisig transaction...");
			await madWallet.Transaction.createValueStore(multiAcct.address, 1, acct1.address, 2);
			await madWallet.Transaction.createTxFee(multiAcct.address, 2);
	
			await madWallet.Transaction.createRawTransaction();
			let sigMsgs = await madWallet.Transaction.Tx.getSignatures();
	
			let sigs1Vin = await acct1.signer.multiSig.signMulti(sigMsgs["Vin"], multiPubK);
			let sigs1Vout = await acct1.signer.multiSig.signMulti(sigMsgs["Vout"], multiPubK);
	
			let sigs2Vin = await acct2.signer.multiSig.signMulti(sigMsgs["Vin"], multiPubK);
			let sigs2Vout = await acct2.signer.multiSig.signMulti(sigMsgs["Vout"], multiPubK);

			await madWallet.Transaction.Tx.injectSignaturesAggregate([sigs1Vin, sigs2Vin], [sigs1Vout, sigs2Vout]);
			console.log("Done");
			console.log("--------------------------");
			console.log("Sending multisig transaction...");
			let txHash = await madWallet.Transaction.sendSignedTx(madWallet.Transaction.Tx.getTx());
			console.log("TxHash:", txHash)
	
		}
		catch (ex) {
			console.trace(ex);
		}
	}
};