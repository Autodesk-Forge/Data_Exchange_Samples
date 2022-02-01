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

let exchange = await myForgeApp.getExchange(exchangefileUrn);
let relationships = await myForgeApp.getAllRelationships(exchange.collection.id, exchange.id);
let assets = await myForgeApp.getAllAssets(exchange.collection.id, exchange.id);
let stats = myForgeApp.analyseData(assets, relationships);

let result = await myForgeApp.format(exchange, stats);
console.log(result);
myForgeApp.saveRelationships(exchange.id, relationships);
myForgeApp.saveAssets(exchange.id, assets);



// let exchangeTable = new Table();
// let assetsTable = new Table({head: [ "AssetType", "Count"]})
// let relationshipTable = new Table({head: [ "RelationshipType", "Count"]})
//
//
// exchanges.forEach(exchange => {
//     exchangeTable.push(
//         {"fileName": exchange.components.data.insert["autodesk.fdx:host.acc-1.0.0"].host.String.fileName},
//         {"id": exchange.id},
//         {"collectionId": exchange.collection.id},
//         {"exchangeFileUrn": myForgeApp.getAttributeMapForEntity(exchange)["exchangeFileUrn"].value}
//     )
//
//     let showResults = async() => {
//         let relationships = await myForgeApp.getAllRelationships(exchange.collection.id, exchange.id);
//         let assets = await myForgeApp.getAllAssets(exchange.collection.id, exchange.id);
//         myForgeApp.saveRelationships(exchange.id, relationships);
//         myForgeApp.saveAssets(exchange.id, assets);
//         console.log(`Data saved as JSON in "./${exchange.id}" folder`);
//         console.log(`\nStats on saved data:`);
//         return myForgeApp.analyseData(assets, relationships);
//     }
//
//     showResults().then( result => {
//         exchangeTable.push(
//             {
//                 "Total Assets": result["TotalAssets"]
//             },
//             {
//                 "Total Relationships": result["TotalRelationships"]
//             }
//         )
//         Object.keys(result.assetTypes).forEach(asset =>{
//             assetsTable.push(
//                 {
//                     [asset]:result.assetTypes[asset]
//                 }
//             )
//         })
//
//         Object.keys(result.relationshipsTypes).forEach(rel =>{
//             relationshipTable.push(
//                 {
//                     [rel]:result.relationshipsTypes[rel]
//                 }
//             )
//         })
//         console.log(exchangeTable.toString())
//         console.log(assetsTable.toString())
//         console.log(relationshipTable.toString())
//     })
// })