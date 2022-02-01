import axios from 'axios';
import fs from "fs";
import path from "path";

import Table from 'cli-table';

export default class App {
    constructor(accessToken, collectionId) {
        this.host = 'https://developer.api.autodesk.com';
        this.accessToken = accessToken;
    }

    getRequestHeaders() {
        return {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + this.accessToken
        }
    };

    /**
     * Uses Data Exchange API to get the exchange container having the item urn
     * @param  {String} exchangeFileUrn Urn of the exchange item
     * @return {Object}  Exchange container metadata
     */
    getExchange = async (exchangeFileUrn) => {
        const response = await axios({
            method: 'GET',
            url: `${this.host}/exchange/v1/exchanges?filters=attribute.exchangeFileUrn==${exchangeFileUrn}`,
            headers: this.getRequestHeaders()
        })
        let exchanges = []
        response.data.results.forEach(exchange => {
            exchanges.push(exchange)
        })
        return exchanges[0];
    }


    /**
     * Compiles all paginated results on requested relationships
     * @param  {String} collectionId The id of the collection where the graph is located
     * @param  {String} exchangeId The id of the exchange container
     * @return {Array}  An array with all relationships
     */
    getAllRelationships = async (collectionId, exchangeId) => {

        let data = await this.getRelationshipsPage(collectionId, exchangeId, "")
        let relationships = data.results;
        let cursor = data.pagination.cursor;
        while (cursor.length !== 0) {
            let data = await this.getRelationshipsPage(collectionId, exchangeId, cursor)
            cursor = data.pagination.cursor;
            relationships.push(...data.results);
        }

        return relationships;
    }


    /**
     * Compiles all paginated results on requested assets
     * @param  {String} collectionId The id of the collection where the graph is located
     * @param  {String} exchangeId The id of the exchange container
     * @return {Array}  An array with all assets
     */
    getAllAssets = async (collectionId, exchangeId) => {

        let data = await this.getAssetsPage(collectionId, exchangeId, "")
        let assets = data.results;
        let cursor = data.pagination.cursor;
        while (cursor.length !== 0) {
            let data = await this.getAssetsPage(collectionId, exchangeId, cursor)
            cursor = data.pagination.cursor;
            assets.push(...data.results);
        }

        return assets;
    }


    /**
     * Saves the relationships into a `relationships.json` file in folder with name provided by exchangeId
     * @param  {String} exchangeId The id of the exchange container
     * @param  {Array}  data An array with all relationships
     * @return none
     */
    saveRelationships = async (exchangeId, data) => {
        let dirpath = path.join(process.cwd(), exchangeId);
        if (!fs.existsSync(dirpath)) {
            fs.mkdirSync(dirpath);
        }
        fs.writeFileSync(path.join(dirpath, 'relationships.json'), JSON.stringify(data));
        console.log(`Relationships saved in "${exchangeId}" folder as 'relationships.json'`);
    }

    /**
     * Saves the assets into a `assets.json` file in folder with name provided by exchangeId
     * @param  {String} exchangeId The id of the exchange container
     * @param  {Array}  data An array with all assets
     * @return none
     */
    saveAssets = async (exchangeId, data) => {
        let dirpath = path.join(process.cwd(), exchangeId);
        if (!fs.existsSync(dirpath)) {
            fs.mkdirSync(dirpath);
        }
        fs.writeFileSync(path.join(dirpath, 'assets.json'), JSON.stringify(data));
        console.log(`Assets saved in "${exchangeId}" folder as 'assets.json'`);
    }


    /**
     * Extracts attributes from the entity
     * @param  {Object} entity Data Exchange entity from which to extract the attributes
     * @return {Map}  A map of attributes with attribute name as key
     */
    getAttributeMapForEntity = (entity) => {
        let attributeMap = {}
        entity.attributes.data.forEach(attribute => {
            attributeMap[attribute.name] = attribute
        })
        return attributeMap;
    }


    /**
     * Using Data Exchange API, retrieves the relationships
     * @param  {String} collectionId The id of the collection where the graph is located
     * @param  {String} exchangeId The id of the exchange container
     * @param  {String} cursor used to retrieve the next page
     * @return {Array}  An array with relationships contained in retrieved page
     */
    getRelationshipsPage = async (collectionId, exchangeId, cursor) => {
        const response = await axios({
            method: 'GET',
            url: `${this.host}/exchange/v1/collections/${collectionId}/exchanges/${exchangeId}/relationships:sync?cursor=${cursor}`,
            headers: this.getRequestHeaders()
        })
        return response.data
    }

    /**
     * Using Data Exchange API, retrieves the assets
     * @param  {String} collectionId The id of the collection where the graph is located
     * @param  {String} exchangeId The id of the exchange container
     * @param  {String} cursor used to retrieve the next page
     * @return {Array}  An array with assets contained in retrieved page
     */
    getAssetsPage = async (collectionId, exchangeId, cursor) => {
        const response = await axios({
            method: 'GET',
            url: `${this.host}/exchange/v1/collections/${collectionId}/exchanges/${exchangeId}/assets:sync?cursor=${cursor}`,
            headers: this.getRequestHeaders()
        })
        return response.data
    }

    /**
     * Process the assets and relationships to get basic statistics on number and nature of assets and relationships
     * @param  {Array}  assets An array with all assets
     * @param  {Array}  relationships An array with all relationships
     * @return {Object} basic stats on number and nature of assets and relationships
     */
    analyseData = (assets, relationships) => {

        let asset_map = {}
        assets.forEach((asset) => {

            asset_map[asset.id] = asset;
        })

        let countTypes = (data) => {
            let results = {}
            data.forEach(entity => {
                let type = entity.type;
                if (results[type]) {
                    results[type] += 1
                } else {
                    results[type] = 1;
                }
            })
            return results;
        }

        let findAsset = (assetId) => {
            let result;
            assets.forEach(asset => {
                if (asset.id === assetId) {
                    result = asset
                }
            });
            return result;
        }

        let findAssetsByType = (asset_type) => {
            let result = [];
            assets.forEach(asset => {
                if (asset.type === asset_type) {
                    result.push(asset);
                }
            });
            return result;
        }

        let findRelationships = (assetId) => {
            let result = {
                "from": [],
                "to": []
            }
            relationships.forEach(relationship => {
                if (relationship.to.asset.id === assetId) {
                    result["to"].push(relationship)
                    console.log(relationship);
                }
                if (relationship.from.asset.id === assetId) {
                    result["from"].push(relationship)
                }
            });
            return result;
        }

        let getEntitiesTypes = (data) => {
            let results = {}
            data.forEach(entity => {
                let type = entity.type;
                if (results[type]) {
                    results[type].push(entity)
                } else {
                    results[type] = [entity]; //TODO: test it
                }
            })
            return results;
        }

        let getComponentsTypes = (data) => {
            let results = {}
            data.forEach(entity => {
                let insertKeys = []
                let modifyKeys = []
                if (entity.components.data.insert) {
                    insertKeys.push(...Object.keys(entity.components.data.insert))
                }
                if (entity.components.data.modify) {
                    modifyKeys.push(...Object.keys(entity.components.data.modify))
                }

                let components = insertKeys.concat(modifyKeys);
                components.forEach(comp => {
                    if (results[comp]) {
                        results[comp] += 1
                    } else {
                        results[comp] = 1;
                    }
                })
            })
            return results;
        }


        return {
            "TotalAssets": assets.length,
            "TotalRelationships": relationships.length,
            "assetTypes": countTypes(assets),
            "relationshipsTypes": countTypes(relationships)
        };

    }


    /**
     * Compiles all exchange container info and stats on assets and relationships into a formatted table
     * @param  {Object} exchanges Array of exchange containers to be displayed
     * @param  {Object} stats Information on structure and quantity of assets and relationships
     * @return {String}  A formatted table to be displayed in console
     */
    format = async (exchange, stats) => {
        let exchangeTable = new Table();
        let assetsTable = new Table({head: ["AssetType", "Count"]})
        let relationshipTable = new Table({head: ["RelationshipType", "Count"]})

        exchangeTable.push(
            {"fileName": exchange.components.data.insert["autodesk.fdx:host.acc-1.0.0"].host.String.fileName},
            {"id": exchange.id},
            {"collectionId": exchange.collection.id},
            {"exchangeFileUrn": this.getAttributeMapForEntity(exchange)["exchangeFileUrn"].value},
            {"Total Assets": stats["TotalAssets"]},
            {"Total Relationships": stats["TotalRelationships"]}
        )

        Object.keys(stats.assetTypes).forEach(asset => {
            assetsTable.push(
                {
                    [asset]: stats.assetTypes[asset]
                }
            )
        })

        Object.keys(stats.relationshipsTypes).forEach(rel => {
            relationshipTable.push(
                {
                    [rel]: stats.relationshipsTypes[rel]
                }
            )
        })

        return `${exchangeTable.toString()}\n${assetsTable.toString()}\n${relationshipTable.toString()}`;
    }
}