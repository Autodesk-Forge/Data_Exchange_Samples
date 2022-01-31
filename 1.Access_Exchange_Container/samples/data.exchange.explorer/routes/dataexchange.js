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

// getItemNameUsingUrn = async (projectUrn, itemUrn) => {
//     const url = `${this.host}/data/v1/projects/${projectUrn}/items/${itemUrn}`;
//     const response = await axios({
//         method: 'GET',
//         url,
//         headers: assembleRequestHeaders()
//     })
//     return response.data.data.attributes.displayName;
// }

module.exports = router;
