module.exports = {
    addTrailingSlash: (string) => {
        try {
            return string.replace(/\/$|$/, '/');
        }
        catch (ex) {
            throw new Error(`Can't add trailing slash to: ${string}`);
        }
    }
}