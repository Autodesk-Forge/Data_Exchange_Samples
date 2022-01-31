import axios from 'axios';
import Table from 'cli-table';

export default class App {
    constructor(accessToken, collectionId) {
        this.host = 'https://developer.api.autodesk.com';
        this.graphAPI = `${this.host}assetgraph/`;
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
     * @return {Array}  An array with exchange container metadata
     */
    getExchanges = async (exchangeFileUrn) => {
        const response = await axios({
            method: 'GET',
            url: `${this.host}/exchange/v1/exchanges?filters=attribute.exchangeFileUrn==${exchangeFileUrn}`,
            headers: this.getRequestHeaders()
        })
        let exchanges = []
        response.data.results.forEach(exchange => {
            exchanges.push(exchange)
        })
        return exchanges;
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
     * Uses Data Management API to get the filename of the item
     * @param  {String} projectUrn Project URN where the item is located
     * @param  {String} itemUrn URN of the item
     * @return {String}  The filename of the item as it appears in ACC
     */
    getItemNameUsingUrn = async (projectUrn, itemUrn) => {
        const url = `${this.host}/data/v1/projects/${projectUrn}/items/${itemUrn}`;
        const response = await axios({
            method: 'GET',
            url,
            headers: this.getRequestHeaders()
        })
        return response.data.data.attributes.displayName;
    }


    /**
     * Compiles all exchange info into a formatted table
     * @param  {Array} exchanges Array of exchange containers to be displayed
     * @return {String}  A formatted table to be displayed in console
     */
    format = async (exchanges) => {
        let exchangeTable = new Table();

        for (const exchange of exchanges) {
            let projectUrn = exchange.components.data.insert["autodesk.fdx:source.acc-1.0.0"].source.String.projectUrn;
            let sourceFileUrn = exchange.components.data.insert["autodesk.fdx:source.acc-1.0.0"].source.String.fileUrn;
            let sourceFileVersion = exchange.components.data.insert["autodesk.fdx:source.acc-1.0.0"].source.String.versionUrn.split('=')[1];
            let sourceView = exchange.components.data.insert["autodesk.fdx:contract.revitViewGeometry-1.0.0"].contract.String.viewName;
            let sourceRevitFile = await this.getItemNameUsingUrn(projectUrn, sourceFileUrn) + ` [v${sourceFileVersion}]`;

            exchangeTable.push(
                {"File Name": exchange.components.data.insert["autodesk.fdx:host.acc-1.0.0"].host.String.fileName},
                {"Create On": exchange.createdBy.date},
                {"ID": exchange.id},
                {"CollectionID": exchange.collection.id},
                {"ExchangeFileUrn": this.getAttributeMapForEntity(exchange)["exchangeFileUrn"].value},
                {"SourceRevitFile": sourceRevitFile},
                // {"sourceRevitVersion": sourceFileVersion},
                {"SourceRevitView": sourceView},
                {"": ""}
            )
        }
        return exchangeTable.toString();
    }
}