/**
 * A Root Hook Plugin is loaded via --require which “registers” one or more root hooks to be used across all test files.
 */
//require('dotenv').config({ path: process.cwd() + '/.env' });
import 'dotenv/config.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

export const mochaHooks = {
	async beforeAll() {
		try {
			if(!process.env.OPTIONAL_TEST_SUITE_PRIVATE_KEY) {
				throw 'You need to setup a funded Private Key in your .env file to run tests properly.';
			}
		}
		catch (ex) {
			console.trace(ex);
			throw new Error(ex);
		}
	}
};