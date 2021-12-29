# Access data

This tutorial allows you, having the `collection id` and `exchange id` found within exchange container, to further use Data Exchange API to retrieve assets, relationships, snapshots and revisions.

- [Intro](#intro)

- [Workflow explanation](#workflow-explanation)



## Intro

As mentioned at the end of [Access the exchange container](../1.Access_Exchange_Container) tutorial, all Data Exchange API contain the path `v1/collections/{collectionId}/exchanges/{exchangeId}/` and consequently require:

-  `exchange id` - the id of the exchange container.
-  `collection id` - the id of the collection where, the exchange data is stored.

These two ids can be found within exchange container, which can be retrieved following [Access the exchange container](../1.Access_Exchange_Container) tutorial.




## Workflow explanation

An exchange container is the entry point for exchange data. The exchange data consists of collection of assets, connected through relationships - forming a graph, whose states are captured into snapshots.
A more indepth walk through the data, how it is structured and what information it holds, will be discussed in the next tutorial, while in this tutorial we will concentrante on ways of retrieving the data.

There are two ways of retrieving the data:

1. download all data and process on the client side;
2. download only parts you need by specifying filters or using the closure queries.


 
-----------

### 1. Download all data and process on the client side;

Downloading the entire data is intuitive and each type of entity, be it assets, relationships or snapshots, each has their own endpoint:


#### a. Downloading assets:

To download the assets we have to use [v1/collections/{collectionId}/exchanges/{exchangeId}/assets:sync](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getassets-GET/?sha=forge_fdxs_master_preview), using. a token with `data:read` scope:

```shell
curl 'https://developer.api.autodesk.com/exchange/v1/collections/'$COLLECTION_ID'/exchanges/'$EXCHANGE_ID'/assets:sync' \
--header 'Authorization: Bearer '$TOKEN
```
where `TOKEN` is the env variable holding our access token and `COLLECTION_ID` with `EXCHANGE_ID` are the ids retrieved from the exchange container.


The above call will give a response similar to the following:

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
For brevity, the output was trimmed. We will go into more details on asset data in next tutorial, but for now, the most important thing is that we will get back pages of results (by default a page will return 50 assets) and as long as the `cursor` field is not empty, there is a page to receive by providing that cursor as query parameter, like:

```shell
curl --location --request GET 'https://developer-stg.api.autodesk.com/exchange/v1/collections/co.cjm3cQPdRBGKft6IWqTDdQ/exchanges/474b17e1-0a39-3577-a349-0dccfd8680f4/assets:sync?cursor='$CURSOR \
--header 'Authorization: Bearer '$TOKEN 
```

This kind of sequential query could be dounting, especially if the source view contains many elements, you can expect hundreds of elements, which will require dozens of sequential calls, to retrieve all data.

For this very purpose, there is a way to facilitate parallel retrieving of the data, by calling [v1/collections/{collectionId}/exchanges/{exchangeId}/assets:sync-urls](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getassetsyncurls-GET/?sha=forge_fdxs_master_preview) like:

```shell
curl 'https://developer.api.autodesk.com/exchange/v1/collections/'$COLLECTION_ID'/exchanges/'$EXCHANGE_ID'/assets:sync-url' \
--header 'Authorization: Bearer '$TOKEN
```
This call will request the data in form of list of urls to pages containing the data, proving an output similar to:

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

These urls then, can be used concurently to get all the pages and concatenate the results, increasing the speed of retrieving the data.


At first sight, the `assets:sync-urls` (parallel) way of retrieving data seems to be the best, but paginated approach `assets:sync` has it's own benefits, too.

**TIP**: In case we expect to get a lot of assets as result of a request, the best approach is to use the `assets:sync-urls`, to get the list of pages. However, in case we expect a small (max 50) number of assets (e.g. when using filters), it is more optimal to use `assets:sync`, returning the page with results.


#### b. Downloading relationships:

To download the relationships we have to use [v1/collections/{collectionId}/exchanges/{exchangeId}/relationships:sync](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getrelationships-GET/?sha=forge_fdxs_master_preview), using. a token with `data:read` scope:

```shell
curl 'https://developer.api.autodesk.com/exchange/v1/collections/'$COLLECTION_ID'/exchanges/'$EXCHANGE_ID'/relationships:sync' \
--header 'Authorization: Bearer '$TOKEN
```

The above call will give a response similar to the following:

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

The results in structure are similar to those when getting the assets. The same options are also available when retrieving the full data, either iterate through paginated results `relationships:sync`, using the `cursor`, or use the `relationships:sync-urls` to get the links to data pages and use it for concurent retrieving. The structure of `relationships:sync-urls` results is similar to those of `assets:sync-urls` and are omitted here.


#### c. Downloading snapshot:

An exchange snapshot is a specification of what is included in each exchange fulfillment. The exchange snapshot provides a count of what is created, modified, and removed in that snapshot. Thus, in case of one exchange container, there will be just  one snapshot, and any changes made made to an exchange, will not create another snapshot, but another revision of the snapshot. A revision can be seen as a sort of version, but we will see that it is more than that in another tutorial where we will have a closer look at structure of snapshot and revisions.

To get the snapshot, we have to use [v1/collections/{collectionId}/exchanges/{exchangeId}/snapshots:exchange](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getexchangesnapshot-GET/?sha=forge_fdxs_master_preview), using. a token with `data:read` scope:

```shell
curl 'https://developer.api.autodesk.com/exchange/v1/collections/'$COLLECTION_ID'/exchanges/'$EXCHANGE_ID'/snapshots:exchange' \
--header 'Authorization: Bearer '$TOKEN

```

The above call will give a response similar to the following:

TODO: THIS IS EMPTY. REPLACE WHEN THE IMPLEMENTATION WILL BE READY

```json
{
    "createdBy": {
        "serviceId": "CsBcAd522LYGDZmszDtALE8iuzpKPtXX",
        "date": "2021-12-22T21:08:42.225778Z"
    },
    "lastModifiedBy": {
        "serviceId": "CsBcAd522LYGDZmszDtALE8iuzpKPtXX",
        "date": "2021-12-22T21:08:42.225778Z"
    },
    "id": "00170fe4-d9f3-32a1-98b0-921db384a71a",
    "type": "autodesk.fdx:exchange.snapshot-1.0.0",
    "attributes": {
        "id": "00170fe4-d9f3-32a1-98b0-921db384a71a",
        "url": "/spaces/474b...680f4/snapshots/001...71a/attributes",
        "data": []
    },
    "components": {
        "id": "00170fe4-d9f3-32a1-98b0-921db384a71a",
        "url": "/spaces/474b...680f4/snapshots/00170...84a71a/components",
        "data": {}
    },
    "revisionId": "1640207302775_a3fa4471-229c-3265-818d-d2c87dbf2a8d",
    "deleted": false
}

```

TODO: WHEN IMPLEMENTATION READY, OUTLINE THE IMPORTANT PARTS.
TODO: WHEN IMPLEMENTATION READY, EXPLAIN THE REVISION CONCEPT.





### 2. Download only parts you need by specifying filters or using the closure queries.

In case of snapshot and its revisions, we have to deal with a single entity. In case of assets and relationships, even in case of small designes, the number of entities will be quite big. 

The approach of downloading everything (`assets:sync` and `relationships:sync`)and deal with it on the client size is a viable approach and it is facilitated by option of getting everything concurently through provided list of urls (`assets:sync-urls` and `relationships:sync-urls`).

However, a lot of effort and time will be saved if everything will be performed at server level, especially when we know what we are looking for.

To perform `search and retrieve` on the server side, there are two aproaches:

a. use filtering when doing requests;

b. use closure-queries for a more advanced search.

Let us dive deeper into each approach, to better understand the benefits and limitations.

#### a. Use filtering when doing requests

To be able to use filtering at its best, it is important to know the structure of an entity. 
In context of Data Exchange, collections, scenes, assets, relationships and snapshots are named entities and have the same kernel:

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
Thus, the common and important parts of any entity type, besides its `id` are the `attributes` and `components`. The attributes are mainly used to store key-value system data.
Components on the other hand, is the place where the properties of model parts are stored, using a certain schema.

For filterning purposes, it is important to understand that both, attributes and components fields can be used as a filter.

For example.	

TODO: WHEN IT WILL BE IMPLEMENTD ADD EXAMPLES FOR:
			- assetId=="045CE617E7DF23C864EADB6BB5245823DE1D6043"
		   - has.component.type=="autodesk.design:components.parameter-1.0.0"
    		- attribute.ExternalId=="bac06658-19d8-494b-b87a-559081499f8f-000e5925"
    		- entitytype=="autodesk.design:assets.instance-1.0.0"
ENDTODO

#### b. use closure-queries for a more advanced search

Using filters is useful, but might the limited to providing only data (assets, relationships) bellonging to a certain set with common properties (types, attributes, components).

However, when it comes to traversing the data graph, having a starting point, like a given asset, and get other assets related to the starting asset by traversing the relationships it is part of - this is way more complex task.

In context of Data exchange, this task of traversing the graph is made through closure queries and can be performed throug [v1/collections/{collectionId}/exchanges/{exchangeId}/assets:get-closure](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getassetclosure-POST/?sha=forge_fdxs_master_preview) call, by passing through request body a certain set of parameters.

For example, the minimum body is :
```shell
{
        "startAssets": [
          {
            "assetId": "045CE617E7DF23C864EADB6BB5245823DE1D6043"
          }
        ]
}
```
and this will return all assets relatied to the start assets, along with relationships it is part of (bw it `from` or `to` relationships), as well as the sub-graph topology:

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
The `topology` part will include the information on `nodes` (assets) related to starting asset, as well as the `edges` (relationships) in which the starting assets is part of.
The body response will also include in the field `relationships` and `assets` the entities themselves, so it saves time in further retrieving the involved enteties.

In this case, the result is not very big, but it also can end up having dozens of assets and even more relationships (bidirectional relationships are represented by two relationships with oposite direction). Thus, to norrow down the results, the closure queries supports `assetFilters ` and `relationshipFilters ` which helps limiting the results to assets and relationships respecting filtering criteria.

TODO: DEVELOP THIS PART WHEN CLOSURE QUERIES WILL BE FINISHED.
	CURRENT STATE THROWS FOLLOWING ERRORS:
			
			- "The maximum number of assets that can be supplied is 1”, but "startAssets": [] is an array.
			- "The maximum number of asset filters that can be applied is 0"
			- "The maximum number of relationship filters that can be applied is 0"

ENDTODO

	   

In [next tutorial](), we will go deeper in undestanding the structure of each entity and how they form together the data graph.


Please refer to this page for more details: [Data Exchange](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/fdxs-getrelationshipsyncurls-GET/?sha=forge_fdxs_master_preview)