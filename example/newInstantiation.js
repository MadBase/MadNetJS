require('dotenv').config({ path: process.cwd() + '/.env' });
const MadWalletJS = require("../index.js");

async function main() {
    try {
        try {
            console.log('// Current instantiation');
            const oldMadWallet = new MadWalletJS(1, process.env.RPC);
            console.log({ chainId: oldMadWallet.chainId, rpcServer: oldMadWallet.Rpc.rpcServer });

            console.log('// Object config instantiation');
            const objMadWallet = new MadWalletJS({ 
                rpcTimeout: 1000,
                chainId: 46,
                rpcServer: "https://catmad.duckdns.org/v1"
            });
            console.log({ chainId: objMadWallet.chainId, rpcServer: objMadWallet.Rpc.rpcServer });

            console.log('// String rpcEndpoint instantiation');
            const strMadWallet = new MadWalletJS("https://catmad.duckdns.org/v1");
            console.log({ chainId: strMadWallet.chainId, rpcServer: strMadWallet.Rpc.rpcServer });
        } catch (ex) {
            console.log('/////// New Instantiation error message:' + String(ex));
        }
    }
    catch (ex) {
        console.log('Catch: ' + String(ex));
    }
}

main();