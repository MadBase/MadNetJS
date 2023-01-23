/**
 * Async sleep for specified ms
 * @param ms - How long before the promise resolves
 * @returns { Promise<null> }
 */
export const sleep = async (ms: number): Promise<null> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export default {
    sleep,
};
