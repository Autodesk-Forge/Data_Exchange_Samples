# Access data using exchange container

This tutorial will allow you, having the Collection ID and Exchange ID found within the exchange container, to further use the Data Exchange API to retrieve assets, relationships, snapshots, and revisions:

- [Intro](#intro)
- [Workflow explanation](#workflow-explanation)


## Intro

As mentioned at the end of [Access exchange container](../1.Access_Exchange_Container) tutorial, all Data Exchange APIs contain the path `v1/collections/{collectionId}/exchanges/{exchangeId}/` and consequently require the following attributes:

-  Exchange ID - the ID of the exchange container;
-  Collection ID - the ID of the collection where the exchange data is stored.

You can find these two IDs within the exchange container that can be retrieved by following the [Access exchange container](../1.Access_Exchange_Container) tutorial.


## Workflow explanation

An exchange container is the entry point for exchange data that consists of collection of assets connected through relationships and forming a graph whose states are captured into snapshots.
A more in-depth walk through the data, how it's structured, and what information it holds is discussed in the [next tutorial](https://stg.forge.autodesk.com/en/docs/fdxs/v1/tutorials/3_explore_data_and_relationships/?sha=forge_fdxs_master_preview), while here you can concentrate on ways of retrieving the data.

There are two ways of retrieving the data as follows:

1. Download all data for processing on the client side;
2. Download only parts you need by specifying filters or using the closure queries.

-----------

### 1. Download all data for processing on the client side

Downloading the entire data is intuitive, and each type of entity (e.g., assets, relationships, or snapshots) has its own endpoint.


#### a. Downloading assets

To download the assets, use [v1/collections/{collectionId}/exchanges/{exchangeId}/assets:sync](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getassets-GET/?sha=forge_fdxs_master_preview), and apply a token with the `data:read` scope as follows:

```shell
curl 'https://developer.api.autodesk.com/exchange/v1/collections/'$COLLECTION_ID'/exchanges/'$EXCHANGE_ID'/assets:sync' \
--header 'Authorization: Bearer '$TOKEN
```

where `TOKEN` is the env variable holding your access token, and `COLLECTION_ID` with `EXCHANGE_ID` are the IDs retrieved from the exchange container.

The above call provides a response similar to the following:

```json
{
    "pagination": {
        "cursor": "7b22637...7d",
       ...
    },
    "results": [
        {
            "createdBy": {
                "serviceId": "CsBcAd522LYGDZmszDtALE8iuzpKPtXX",
                "date": "2021-12-22T21:08:42.225778Z"
            },
            "lastModifiedBy": {
                "serviceId": "CsBcAd522LYGDZmszDtALE8iuzpKPtXX",
                "date": "2021-12-22T21:08:42.225778Z"
            },
            "id": "6B0A5D3C0C0FA85885A89FAED0C1AD9691D29AB9",
            "revisionId": "1640207302775_a3fa4471-229c-3265-818d-d2c87dbf2a8d",
            "type": "autodesk.design:assets.instance-1.0.0",
            "space": {
                "id": "c7006ecd-d76c-3ad1-9afc-963d8232708b",
                "url": "/collections/co.cjm3cQPdRBGKft6IWqTDdQ/spaces/c7006ecd-d76c-3ad1-9afc-963d8232708b"
            },
            "attributes": {},
            "components": {},
            "operation": "INSERT"
        },
        ...
    ],
    "root": "1F27591A01D9596B97522612977B7BCF88F33EA0"
}
```

For brevity, the output was trimmed. You can see more details on asset data in the [next tutorial](https://stg.forge.autodesk.com/en/docs/fdxs/v1/tutorials/3_explore_data_and_relationships/?sha=forge_fdxs_master_preview), but for now, the most important thing to understand is that you get back pages of results (by default, a page returns 50 assets). As long as the `cursor` field is not empty, a page to receive (having provided the cursor as a query parameter) is like the following:

```shell
curl --location --request GET 'https://developer-stg.api.autodesk.com/exchange/v1/collections/co.cjm3cQPdRBGKft6IWqTDdQ/exchanges/474b17e1-0a39-3577-a349-0dccfd8680f4/assets:sync?cursor='$CURSOR \
--header 'Authorization: Bearer '$TOKEN 
```

This kind of sequential query could be daunting, especially if the source view contains many elements. You can expect hundreds of elements which require dozens of sequential calls to retrieve all the data.

For this very purpose, there is a way to facilitate a parallel retrieval of data by calling [v1/collections/{collectionId}/exchanges/{exchangeId}/assets:sync-urls](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getassetsyncurls-GET/?sha=forge_fdxs_master_preview) as follows:

```shell
curl 'https://developer.api.autodesk.com/exchange/v1/collections/'$COLLECTION_ID'/exchanges/'$EXCHANGE_ID'/assets:sync-url' \
--header 'Authorization: Bearer '$TOKEN
```

This call requests the data in the form of a list of URLs to pages containing the data, creating an output similar to the following:

```json
{
    "pagination": {
        "cursor": "",
        "nextUrl": ""
    },
    "results": {
        "parallelUrls": [
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=1_6e756c6c",
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=2_6e756c6c",
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=3_6e756c6c",
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=4_6e756c6c",
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=5_6e756c6c",
            ...,
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=26_6e756c6c",
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=27_6e756c6c",
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=28_6e756c6c",
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=29_6e756c6c",
            "http://developer.api.autodesk.com//v1/collections/co.c...dQ/exchanges/47....0f4/assets:sync?cursor=30_6e756c6c"
        ]
    }
}
```

These URLs can then be used concurrently to get all the pages and concatenate the results, increasing the speed of retrieving the data.

At first sight, the `assets:sync-urls` (parallel) way of retrieving data seems to be the best, but paginated approach `assets:sync` has its own benefits too.

**TIP:** In case you expect to get a lot of assets as a result of the request, the best approach is to use the `assets:sync-urls` to get the list of pages. 
However, in case you expect a smaller number of assets (e.g., when using filters), it's more optimal to use `assets:sync` returning a single page of results.


#### b. Downloading relationships

To download the relationships, use [v1/collections/{collectionId}/exchanges/{exchangeId}/relationships:sync](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getrelationships-GET/?sha=forge_fdxs_master_preview), and apply a token with the `data:read` scope:

```shell
curl 'https://developer.api.autodesk.com/exchange/v1/collections/'$COLLECTION_ID'/exchanges/'$EXCHANGE_ID'/relationships:sync' \
--header 'Authorization: Bearer '$TOKEN
```

The above call provides a response similar to the following:

```json
{
    "pagination": {
        "cursor": "7b226...764227d",
        ...
    },
    "results": [
        {
           ...
            "id": "031ea155-28de-389e-b519-59ab68b0bf4c",
            "type": "autodesk.design:relationship.containment-1.0.0",
            "from": {
                "asset": {
                    "id": "1F27591A01D9596B97522612977B7BCF88F33EA0",
                    "url": "/collections/co.cjm...dQ/assets/1F275....CF88F33EA0"
                }
            },
            "to": {
                "asset": {
                    "id": "D5148FDAC14A89EFF21063A3816415608FB3D2A9",
                    "url": "/collections/co.cjm...dQ/assets/D5148F....5608FB3D2A9"
                }
            },
            "category": "REL",
            "revisionId": "1640207302775_a3fa4471-229c-3265-818d-d2c87dbf2a8d",
            "operation": "INSERT",
            "attributes": {},
            "components": {}
        },
        
    ],
    "root": "1F27591A01D9596B97522612977B7BCF88F33EA0"
}
```

The results in the structure are similar to those when getting the assets. The same options are also available when retrieving the full data, either iterating through paginated results `relationships:sync` using the `cursor`, or using the `relationships:sync-urls` to get the links to data pages for concurrent retrieving. 
The structure of `relationships:sync-urls` results is similar to those of `assets:sync-urls`, and is omitted here.


### 2. Download only parts you need by specifying filters or using the closure queries

In case of assets and relationships, even for smaller designs, the number of entities will be quite big. 

The approach of downloading everything (`assets:sync` and `relationships:sync`) and dealing with it on the client side is a viable approach, and it's facilitated by an option of getting everything concurrently through a provided list of URLs (`assets:sync-urls` and `relationships:sync-urls`).

However, a lot of effort and time can be saved if everything is performed at a server level, especially when you know what you're looking for.

To perform `search and retrieve` on the server side, there are two approaches as follows:

&nbsp;&nbsp;&nbsp;a. Use filtering when creating requests; <br/>
&nbsp;&nbsp;&nbsp;b. Use closure-queries for a more advanced search.

Let's dive deeper into each approach to better understand the benefits and limitations.

#### a. Use filtering when creating requests

To be able to use filtering at its best, it's important to know the structure of an entity. 
In context of Data Exchange,- collections, scenes, assets, relationships, and snapshots are the named entities and have the same kernel:

```json
{
    "id": "123abc",
    "type": "autodesk.fdx:exchange.<<entity>>-1.0.0",
    "attributes": {
        "id": "123abc",
        "url": "<<path>>/attributes",
        "data": []
    },
    "components": {
        "id": "123abc",
        "url": "<<path>>/components",
        "data": {}
    }
}
```

Thus, the common and important parts of any entity type, besides its `id`, are the `attributes` and `components`. 
The attributes are mainly used to store key-value system data. Components, on the other hand, is the place where the properties of the model parts are stored using a certain schema.

***Note:*** For the time being, the filtering using attributes and components is limited and will be soon extended.

#### b. Use closure-queries for a more advanced search

Using filters (when it will be avaialble) will be useful, but might be limited to providing only data (e.g., assets, relationships) belonging to a certain set with common properties (e.g. of same types, having the same attributes, components etc.).
However, when it comes to traversing the data graph, having a starting point like a given asset and getting other assets related to the starting asset (by traversing the relationships it's part of) is a way more complex task.

In context of Data Exchange, this task of traversing the graph is made through closure queries and can be performed through [v1/collections/{collectionId}/exchanges/{exchangeId}/assets:get-closure](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getassetclosure-POST/?sha=forge_fdxs_master_preview) call by passing a certain set of parameters to the request body.

For example, the minimum request body is like the following:

```json
{
        "startAssets": [
          {
            "assetId": "045CE617E7DF23C864EADB6BB5245823DE1D6043"
          }
        ]
}
```

and returns all assets related to the starting assets along with relationships they're part of (between `from` and `to` relationships), as well as the sub-graph topology:

```json
{
    "topology": {
        "nodes": [
            {
                "assetId": "1F27591A01D9596B97522612977B7BCF88F33EA0",
                "snapshotContextId": "1640207302775_a3fa4471-229c-3265-818d-d2c87dbf2a8d",
                "assetInSnapshot": true
            },
            {
                "assetId": "06ABD198A79A45305394B0D22389D473E0397BF0",
                "snapshotContextId": "1640207302775_a3fa4471-229c-3265-818d-d2c87dbf2a8d",
                "assetInSnapshot": true
            },
            {
                "assetId": "5A5BA839488FD363B2C45645FB834282BB5A06E2",
                "snapshotContextId": "1640207302775_a3fa4471-229c-3265-818d-d2c87dbf2a8d",
                "assetInSnapshot": true
            }
        ],
        "edges": [
            {
                "relationshipId": "0aedf67b-8b61-38c3-baa7-88a7c828aaf9",
                "fromNode": "1F27591A01D9596B97522612977B7BCF88F33EA0",
                "toNode": "06ABD198A79A45305394B0D22389D473E0397BF0"
            },
            {
                "relationshipId": "3f84e26f-d3b7-316e-9746-52cb94a79119",
                "fromNode": "1F27591A01D9596B97522612977B7BCF88F33EA0",
                "toNode": "5A5BA839488FD363B2C45645FB834282BB5A06E2"
            }
        ]
    },
    "relationships": [],
    "assets": [],
    "traversedLevels": 1,
    ...
}
```

The `topology` part includes the information on `nodes` (e.g., assets) related to a starting asset, as well as the `edges` (e.g., relationships) which the starting assets are part of. The body response also includes the entities in the `relationships` and `assets` fields so that it saves time in further retrieving these.

In this case, the result is not significantly big, but it also can end up having dozens of assets and even more relationships. Note that bi-directional relationships are represented by two relationships with opposite directions. 

***Not:e*** To narrow down the results, the closure queries will support `assetFilters` and `relationshipFilters`, which will help with filtering even further the results, to contain just assets and relationships respecting the filtering criteria.

-------

***Note:*** For samples illustrating the use of the Data Exchange API mentioned in this tutorial, please check [samples folder](./samples).


-------   
	   
In the [next tutorial](https://stg.forge.autodesk.com/en/docs/fdxs/v1/tutorials/3_explore_data_and_relationships/?sha=forge_fdxs_master_preview), you will better understand the structure of each entity, and how they form the data graph together.

Refer to this page for more details: [Data Exchange](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/?sha=forge_fdxs_master_preview).
