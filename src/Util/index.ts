import Eth from './Eth';
import Generic from './Generic';
import Hash from './Hash';
import Tx from './Tx';
import Validator from './Validator';
import String from './String';
import VerifySignature from './VerifySignature';
import Faucet from './Faucet';

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
    ...VerifySignature,
    ...Faucet
}
