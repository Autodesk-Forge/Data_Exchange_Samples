import MyApp from './app.js';

const TOKEN = process.env.TOKEN;

if (TOKEN === undefined) {
    console.warn("ERROR: The TOKEN environment variable is not set. Quitting ...");
    process.exit()
}

const exchangefileUrn = process.argv[2];
if (exchangefileUrn === undefined) {
    console.warn("ERROR: ID of the item pointing to exchange is required. Quitting ...");
    process.exit()
}

console.log("Getting exchange container for", exchangefileUrn)

let myForgeApp = new MyApp(
    TOKEN,
);

let exchanges = await myForgeApp.getExchanges(exchangefileUrn);
let result = await myForgeApp.format(exchanges);
console.log(result);
