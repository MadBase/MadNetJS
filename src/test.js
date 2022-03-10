const madnetjs = require('./Wallet');

let madwallet = new madnetjs();

main();

async function main() {
    
    await madwallet.Account.addAccount('1526c9f8cd3727aa034c7d2f6f85e9b069f84bc33743d60dd5ae939c44ab171e', 1);
    await madwallet.Account.addAccount('1526c9f8cd3727aa034c7d2f6f85e9b069f84bc33743d60dd5ae939c44ab171e', 2);
    
    
    console.log(madwallet.Account.accounts);

} 