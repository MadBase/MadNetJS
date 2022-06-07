import Eth from './Eth.js';
import Generic from './Generic.js';
import Hash from './Hash.js';
import Tx from './Tx.js';
import Validator from './Validator.js';
import String from './String.js';
import VerifySignature from './VerifySignature.js';

/**
 * @typedef UtilityCollection - Collection of all utility functions
 */
export default {
    ...Eth,
    ...Generic,
    ...Hash,
    ...String,
    ...Tx,
    ...Validator,
    ...VerifySignature
};