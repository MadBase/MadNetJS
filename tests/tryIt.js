/** 
 * @category Testing 
 * @module TestingSuite
 * */

/**
 * Try/Catch wrap to console the error during debugging
 * @param { Function } fx - The function to attempt to run
 */
module.exports.tryIt = async (fx) => {
    try {
        let fxReturn = fx();
        if (fxReturn instanceof Promise) {
            return await fxReturn;
        } else {
            return fxReturn;
        }
    } catch (ex) {
        console.error(ex);
    }
}