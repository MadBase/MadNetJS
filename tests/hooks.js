// A Root Hook Plugin is loaded via --require which “registers” one or more root hooks to be used across all test files.
exports.mochaHooks = {
  beforeAll(done) {
    // Check if PRIVATE_KEY is empty in .env file
    if(!process.env.PRIVATE_KEY) {
        throw new Error('You need to setup a funded Private Key in your .env file to run tests properly.');
    }

    done();
  }
};