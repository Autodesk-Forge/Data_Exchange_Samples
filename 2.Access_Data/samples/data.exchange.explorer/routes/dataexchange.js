/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

const express = require('express');

const { OAuth } = require('./common/oauth');
const { ItemsApi } = require('forge-apis');
const axios = require('axios');

let local_cache = {};

let assembleRequestHeaders = (token) => {
    return {
        'Content-type': 'application/json',
        'Authorization': 'Bearer ' + token
    }
};

let router = express.Router();

router.get('/dataexchange/getitem', async (req, res) => {
    const oauth = new OAuth(req.session);
    const internalToken = await oauth.getInternalToken();

    const projectId = req.query.projectid;
    const itemid = req.query.itemid;

    let itemAPI = new ItemsApi();
    let item = await itemAPI.getItem(projectId, itemid, oauth.getClient(), internalToken)

    let isfdx = (item.body.data.attributes.extension.type === "items:autodesk.bim360:FDX");

    res.json({
        "isfdx": isfdx,
        "urn": item.body.data.id
    });
});

router.get('/dataexchange/getitemname', async (req, res) => {
    const oauth = new OAuth(req.session);
    const internalToken = await oauth.getInternalToken();

    const projectId = req.query.projectid;
    const itemid = req.query.itemid;

    let itemAPI = new ItemsApi();
    let item = await itemAPI.getItem(projectId, itemid, oauth.getClient(), internalToken)

    res.json({
        name: item.body.data.attributes.displayName
    });
});

router.get('/dataexchange/getexchange', async (req, res) => {
    const oauth = new OAuth(req.session);
    const internalToken = await oauth.getInternalToken();

    const exchangeFileUrn = req.query.exchangefileurn;

    let result = await getExchanges(exchangeFileUrn, internalToken);
    res.json(result);
});

router.get('/dataexchange/getexchangestats', async (req, res) => {
    const collectionid = req.query.collectionid;
    const exchangeid = req.query.exchangeid;
    let result = local_cache[exchangeid]
    if(result == undefined){
        const oauth = new OAuth(req.session);
        const internalToken = await oauth.getInternalToken();

        let assets = await getAllAssets(collectionid, exchangeid, internalToken);
        let relationships = await getAllRelationships(collectionid, exchangeid, internalToken);
        let stats = analyseData(assets, relationships);
        local_cache[exchangeid] = {
            assets,
            relationships,
            stats
        }
        result = local_cache[exchangeid];
    }
    res.json(result.stats);
});


router.get('/dataexchange/downloadexchange', async (req, res) => {
    const collectionid = req.query.collectionid;
    const exchangeid = req.query.exchangeid;
    let result = local_cache[exchangeid]
    if(result == undefined){
        const oauth = new OAuth(req.session);
        const internalToken = await oauth.getInternalToken();

        let assets = await getAllAssets(collectionid, exchangeid, internalToken);
        let relationships = await getAllRelationships(collectionid, exchangeid, internalToken);
        let stats = analyseData(assets, relationships);
        local_cache[exchangeid] = {
            assets,
            relationships,
            stats
        }
        result = local_cache[exchangeid];
    }
    res.json({
        assets:result.assets,
        relationships:result.relationships
    });
});



/**
 * Uses Data Exchange API to get the exchange container having the item urn
 * @param  {String} exchangeFileUrn Urn of the exchange item
 * @return {Array}  An array with exchange container metadata
 */
let getExchanges = async (exchangeFileUrn, token) => {
    const response = await axios({
        method: 'GET',
        url: `https://developer.api.autodesk.com/exchange/v1/exchanges?filters=attribute.exchangeFileUrn==${exchangeFileUrn}`,
        headers: assembleRequestHeaders(token.access_token)
    })
    let exchanges = []
    response.data.results.forEach(exchange => {
        exchanges.push(exchange)
    })
    return exchanges;
}

/**
 * Compiles all paginated results on requested assets
 * @param  {String} collectionId The id of the collection where the graph is located
 * @param  {String} exchangeId The id of the exchange container
 * @return {Array}  An array with all assets
 */
getAllAssets = async (collectionId, exchangeId, internalToken) => {

    let data = await getAssetsPage(collectionId, exchangeId, "",internalToken)
    let assets = data.results;
    let cursor = data.pagination.cursor;
    while (cursor.length !== 0) {
        let data = await getAssetsPage(collectionId, exchangeId, cursor,internalToken)
        cursor = data.pagination.cursor;
        assets.push(...data.results);
    }

    return assets;
}

/**
 * Compiles all paginated results on requested relationships
 * @param  {String} collectionId The id of the collection where the graph is located
 * @param  {String} exchangeId The id of the exchange container
 * @return {Array}  An array with all relationships
 */
getAllRelationships = async (collectionId, exchangeId,internalToken) => {

    let data = await getRelationshipsPage(collectionId, exchangeId, "",internalToken)
    let relationships = data.results;
    let cursor = data.pagination.cursor;
    while (cursor.length !== 0) {
        let data = await getRelationshipsPage(collectionId, exchangeId, cursor,internalToken)
        cursor = data.pagination.cursor;
        relationships.push(...data.results);
    }

    return relationships;
}

/**
 * Using Data Exchange API, retrieves the assets
 * @param  {String} collectionId The id of the collection where the graph is located
 * @param  {String} exchangeId The id of the exchange container
 * @param  {String} cursor used to retrieve the next page
 * @return {Array}  An array with assets contained in retrieved page
 */
getAssetsPage = async (collectionId, exchangeId, cursor,token) => {
    const response = await axios({
        method: 'GET',
        url: `https://developer.api.autodesk.com/exchange/v1/collections/${collectionId}/exchanges/${exchangeId}/assets:sync?cursor=${cursor}`,
        headers: assembleRequestHeaders(token.access_token)
    })
    return response.data
}


/**
 * Using Data Exchange API, retrieves the relationships
 * @param  {String} collectionId The id of the collection where the graph is located
 * @param  {String} exchangeId The id of the exchange container
 * @param  {String} cursor used to retrieve the next page
 * @return {Array}  An array with relationships contained in retrieved page
 */
getRelationshipsPage = async (collectionId, exchangeId, cursor,token) => {
    const response = await axios({
        method: 'GET',
        url: `https://developer.api.autodesk.com/exchange/v1/collections/${collectionId}/exchanges/${exchangeId}/relationships:sync?cursor=${cursor}`,
        headers: assembleRequestHeaders(token.access_token)
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

module.exports = router;
