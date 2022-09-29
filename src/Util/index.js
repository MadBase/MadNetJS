const Eth = require('./Eth');
const Generic = require('./Generic');
const Hash = require('./Hash');
const Tx = require('./Tx');
const Validator = require('./Validator');
const String = require('./String');
const VerifySignature = require('./VerifySignature');
const Faucet = require('./Faucet');

/**
 * @typedef UtilityCollection - Collection of all utility functions
 */
module.exports = {
    ...Eth,
    ...Generic,
    ...Hash,
    ...String,
    ...Tx,
    ...Validator,
    ...VerifySignature,
    ...Faucet
}