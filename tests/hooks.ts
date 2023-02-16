/**
 * A Root Hook Plugin is loaded via --require which “registers” one or more root hooks to be used across all test files.
 */
import * as dotenv from 'dotenv';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

dotenv.config({ path: process.cwd() + '/.env' });
chai.use(chaiAsPromised);

export default {
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
