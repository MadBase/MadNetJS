const Tx = require('./Tx');
const Hash = require('./Hash');
const Validator = require('./Validator');
const Eth = require('./Eth');

module.exports = {
    ...Tx,
    ...Hash,
    ...Validator,
    ...Eth
}