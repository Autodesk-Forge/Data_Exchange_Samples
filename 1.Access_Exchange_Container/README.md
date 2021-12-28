# Access exchange container

This tutorial allows you to use Data Management API to identify the item corresponding to the exchange container, and use the information from the item to get the exchange container using Data Exchange API:

- [Intro](#intro)
- [Workflow explanation](#workflow-explanation)


## Intro

When an exchange is created within Autodesk Construction Cloud, it appears of the `items` type, benefiting from versioning and bearing the same information as any other item.
The only difference between an item of type `items:autodesk.bim360:File` corresponding to (for example) a Revit file, and `items:autodesk.bim360:FDX` specific to an exchange, is that the former (as its type states) is a file that can be downloaded, while an exchange is rather a pointer to the exchange container which holds the exchange data. 


## Workflow explanation

When an exchange is created from a source file (e.g., Revit file), an item of type `items:autodesk.bim360:FDX` is created in the same folder where the source file is located. The newly created item is a pointer to the exchange container, and the `id` of this very item allows you, using Data Exchange API, to retrieve the exchange container. 

Thus, to get the exchange container, you need the item corresponding to the needed exchange located in the same hub, project, and folder as the source file. This can be achieved using Data Management API, having the workflow that can be resumed to the following steps: 

1. Get the Hub ID where the source file resides;
2. Identify the Project ID where the source file resides;
3. Identify the parent Folder ID of the source file;
4. Show the content of the folder and identify the needed item;
5. Use Data Exchange API to get the exchange container having the needed Item ID.
 
-----------

### 1. Get the Hub ID where the source file resides

To get the Hub ID, use the `GET https://developer.api.autodesk.com/project/v1/hubs` call having a token with `data:read` scope.

For example:

```
shell
curl 'https://developer.api.autodesk.com/project/v1/hubs' \
--header 'Authorization: Bearer '$TOKEN
```

where `TOKEN` is the env variable holding your access token.

The above call gives you a response similar to the following:

```
json
{
 
  ...
 
  "data": [
    {
      "type": "hubs",
      "id": "b.5c07c84c-bbd9-476e-8712-547f74c5b76b",
      "attributes": {
        "name": "Some Account",
        
        ...
        
        }
      }
    ]
}
```

In this response payload, you are interested in `id` of the needed hub. 

Note that certain Forge App can be provisioned in multiple accounts. Thus, after retrieving the hubs, it's important to make sure the needed Hub ID is identified from the list of accessible hubs.


### 2. Identify the Project ID where the source file resides

Having the Hub ID, you can now retrieve the list of projects available on that hub by calling this command:

```
shell
curl 'https://developer.api.autodesk.com/project/v1/hubs/'$HUB_ID'/projects' \
--header 'Authorization: Bearer '$TOKEN
```

where `HUB_ID` is the ID in form of `b.5c07c84c-bbd9-476e-8712-547f74c5b76b`.

The above call gives you a response similar to the following:

```
json
{
    ...

    "data": [
        {
            "type": "projects",
            "id": "b.c8d3cf2c-4b31-48ba-9454-06645929876c",
            "attributes": {
                "name": "some_project",
                ...
                "extension": {
                    "type": "projects:autodesk.bim360:Project",
                    ...
                    "data": {
                        "projectType": "ACC"
                    }
                }
            },
            ...
            
        }
    ]
}
```

In this response payload, you are interested in `id` of the needed project.


### 3. Identify the Folder ID where the source file resides

Having the Project ID, you have to get the top folders, out of which you are interested in "Project Files", by calling this command:

```
shell
curl  'https://developer.api.autodesk.com/project/v1/hubs/'$HUB_ID'/projects/'$PROJECT_ID'/topFolders' \
--header 'Authorization: Bearer '$TOKEN
```

This creates an output similar to the following:

```
json
{
    ...
    "data": [
        {
            "type": "folders",
            "id": "urn:adsk.wipprod:fs.folder:co.rzxjppPYRsmNydaxgykFBg",
            "attributes": {
                "name": "Project Files",
                "displayName": "Project Files",
                ...
                
            },
            ...
        },
        ...
    ]
}
```

In this response payload, you are interested in `id` of the "Project Files" top folder.

### 4. Show the content of the folder and identify the needed item

Having the top folder ID readily available, the way to get to the needed folder depends on how the folders are organized and how deep the needed folder is placed inside the folder structure. 
Nevertheless, it resumes to retrieving iteratively, starting with a top folder and followed by its contents, until reaching the desired folder with the needed contents. 

All of these iterative calls have the format like the following:

```
shell
curl 'https://developer.api.autodesk.com/data/v1/projects/'$PROJECT_ID'/folders/'$FOLDER_ID'/contents' \
--header 'Authorization: Bearer '$TOKEN
```

ultimately providing the content of the folder where the item referencing the needed exchange resides:

```
json
{
   ...
    "data": [
        {
            "type": "items",
            "id": "urn: adsk.wipprod:dm.lineage:8nBh35NARrWeJ2AiTwcI1A",
            "attributes": {
                "displayName": "House.rvt",
               ...
                "extension": {
                    "type": "items:autodesk.bim360:File",
                    ...
        }},},
        {
            "type": "items",
            "id": "urn: adsk.wipprod:dm.lineage:EoMIYJ3USSC5lI3lWRG46Q",
            "attributes": {
                "displayName": "House Walls - FDX",
                ...
                "extension": {
                    "type": "items:autodesk.bim360:FDX",
                   ...
                }
            },
            ...
        },
        
}
```

The item pointing to the needed exchange can be identified based on the name given to the exchange; though, make sure that its `attributes.extension.type` is set to `items:autodesk.bim360:FDX`.


### 5. Get the exchange container

Having the needed item, its ID allows you to get the exchange container using the Data Exchange API by calling this command:

```
shell
curl 'https://developer-stg.api.autodesk.com/exchange/v1/exchanges?filters=attribute.exchangeFileUrn=='$ITEM_ID \
--header 'Authorization: Bearer '$TOKEN
```

where `ITEM_ID` is the item ID of `items:autodesk.bim360:FDX` type.

The above call returns an output (trimmed for brevity), similar to the following:

```
json

{
    ...
    "results": [
        {
            ...
            "id": "cad99e7f-4294-35de-96e5-c9b7a8bc332c",
            "collection": {
                "id": "co.cjm3cQPdRBGKft6IWqTDdQ"
            },
            "type": "autodesk.fdx.space:exchangecontainer-1.0.0",
            "attributes": {
                "id": "cad99e7f-4294-35de-96e5-c9b7a8bc332c",
                "url": "/exchanges/cad99e7f-4294-35de-96e5-c9b7a8bc332c/attributes",
                "data": [
                    ...
                    {
                        "name": "baseSourceVersionUrn",
                        "value": "urn:adsk.wipstg:fs.file:vf.8nBh35NARrWeJ2AiTwcI1A?version=1",
                        "type": "",
                        "category": "system"
                    },
                    {
                        "name": "exchangeFileName",
                        "value": "House Walls - FDX",
                        "type": "",
                        "category": "system"
                    },
                    {
                        "name": "exchangeFileUrn",
                        "value": "urn:adsk.wipstg:dm.lineage:EoMIYJ3USSC5lI3lWRG46Q",
                        "type": "",
                        "category": "system"
                    }
                    ...
                ]
            },
            "components": {
                "id": "cad99e7f-4294-35de-96e5-c9b7a8bc332c",
                "url": "/exchanges/cad99e7f-4294-35de-96e5-c9b7a8bc332c/components",
                "data": {
                    "insert": {
                        "autodesk.fdx:contract.revitViewGeometry-1.0.0": {
                            "contract": {
                                "String": {
                                    "viewName": "House Walls",
                                    "viewableId": "b57244e2-7d70-4703-9cce-7a12a2088f7c-0010d509",
                                    "viewGuid": "c05a4777-0bde-778b-6796-6dc299a25589"
                                }
                            }
                        },
                        "autodesk.fdx:host.acc-1.0.0": {
                            "host": {
                                "String": {
                                    "versionUrn": "urn:adsk.wipstg:fs.file:vf.EoMIYJ3USSC5lI3lWRG46Q?version=1",
                                    "fileName": "House Walls - FDX",
                                    "folderUrn": "urn:adsk.wipstg:fs.folder:co.dJszZEJGQCylUeMqYcnOPA",
                                    "projectUrn": "b.c8d3cf2c-4b31-48ba-9454-06645929876c",
                                    "fileUrn": "urn:adsk.wipstg:dm.lineage:EoMIYJ3USSC5lI3lWRG46Q"
                                }
                            }
                        },
                        "autodesk.fdx:source.acc-1.0.0": {
                            "source": {
                                "String": {
                                    "sourceId": "c7006ecd-d76c-3ad1-9afc-963d8232708b",
                                    "versionUrn": "urn:adsk.wipstg:fs.file:vf.8nBh35NARrWeJ2AiTwcI1A?version=1",
                                    "folderUrn": "urn:adsk.wipstg:fs.folder:co.dJszZEJGQCylUeMqYcnOPA",
                                    "projectUrn": "b.c8d3cf2c-4b31-48ba-9454-06645929876c",
                                    "fileUrn": "urn:adsk.wipstg:dm.lineage:8nBh35NARrWeJ2AiTwcI1A"
                                }
                            }
                        }
                    }
                }
            },
            "revisionId": "1640198347910_c9c0fa50-195f-39d9-a1e5-53dda9648033"
        }
    ]
}
```

From this payload, to further use Data Exchange API, you would require these two elements:

-  Exchange ID - the ID of this exchange container. It can be found under `results[0].id` (since we have just one element in the results), and in the above example, it's `cad99e7f-4294-35de-96e5-c9b7a8bc332c`;
-  Collection ID - the ID of the collection where the exchange data is stored. It can be found under `results[0].collection.id`, and in the above example, its value is `co.cjm3cQPdRBGKft6IWqTDdQ`.

These two elements are essential because all subsequent calls made through Data Exchange API will contain the path `v1/collections/{collectionId}/exchanges/{exchangeId}/`, plus the specific endpoints to retrieve assets, relationships, snapshots, etc.

However, the rest of the received payload also contains a lot of useful information, such as the following:

- The type of the exchange container set to `autodesk.fdx.space:exchangecontainer-1.0.0` which indicates that it's a "Space" type item and should contain at least `attributes` and `components`.
- `attributes` are system-specific properties, but can and should be used to filter the item.
	
In the above call, you used the query string `filters=attribute.exchangeFileUrn=='$ITEM_ID` to identify the needed exchange container by the `exchangeFileUrn` attribute. 

**NOTE:** For now, only filtering by `exchangeFileUrn` and `exchangeFileVersionUrn` attributes is allowed, but later, it will be extended to all attributes and components, opening the path forward to workflows like "Give me all exchanges created using this `sourceVersionUrn`."

-  `components` are more complex schema-based properties. In the above payload, you can notice that it contains three properties like the following:

    1. `autodesk.fdx:source.acc-1.0.0`, holding the information about the URN, version, and location of the source file used to create the exchange.
    2. `autodesk.fdx:contract.revitViewGeometry-1.0.0`, holding the data regarding the exchange contract - in this case, it's the name and ID of the view within the source file used to create the exchange.
    3. `autodesk.fdx:host.acc-1.0.0`, holding the data regarding the name, ID, and location of the item pointing to the current exchange container.

In the [next tutorial](../2.Access_Data), you can see how to use the exchange container data to get the list of assets, relationships, snapshots, and revisions.

Refer to this page for more details: [Data Exchange](https://stg.forge.autodesk.com/en/docs/fdxs/v1/reference/quick_reference/?sha=forge_fdxs_master_preview).
