/**
 * Adds a trailing slash to a given string
 * @param string
 * @returns { string }
 */
export const addTrailingSlash = (string: string): string => {
    try {
        return string.replace(/\/$|$/, "/");
    } catch (ex) {
        throw new Error(`Can't add trailing slash to: ${string}`);
    }
};

export default {
    addTrailingSlash,
};
