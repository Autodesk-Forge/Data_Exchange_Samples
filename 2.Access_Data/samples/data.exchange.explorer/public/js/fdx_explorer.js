class FDX_Explorer extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._exchangeInfoButton = null;
        this._exchangeStatsButton = null;
        this._exchangeStatsPanel = null;
        this.exchangeInfo = null;
        this.exchangeStats = null;
        this.statsUI = null;

        this.getExchangeContainerInfo = this.getExchangeContainerInfo.bind(this);
        this.addRevitFileNameToPanel = this.addRevitFileNameToPanel.bind(this);
        this.getAttributeMapForEntity = this.getAttributeMapForEntity.bind(this);
        this.populateStatsTable = this.populateStatsTable.bind(this);
        this.prepareStatsTable = this.prepareStatsTable.bind(this);
        this.download_assets_n_relationships = this.download_assets_n_relationships.bind(this);
    }

    load() {
        console.log('FDX_Explorer has been loaded');
        return true;
    }

    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._exchangeInfoButton);
            this._group.removeControl(this._exchangeStatsButton);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('FDX_Explorer has been unloaded');
        return true;
    }

    getExchangeContainerInfo(exchangeFileUrn) {
        console.log("FETCHING EXCHANGE INFO using ", exchangeFileUrn);
        fetch(`/api/forge/dataexchange/getexchange?exchangefileurn=${exchangeFileUrn}`)
            .then(result => result.json())
            .then(data => {
                this.exchangeInfo = data;
                console.log(this.exchangeInfo);
                this.getExchangeContainerStats(this.exchangeInfo[0].collection.id, this.exchangeInfo[0].id);
            })
            .catch(err => console.warn("Could not fetch urn: ", err))
    }

    getExchangeContainerStats(collectionid, exchangeid) {
        console.log("FETCHING Data using ", this.exchangeInfo);
        fetch(`/api/forge/dataexchange/getexchangestats?collectionid=${collectionid}&exchangeid=${exchangeid}`)
            .then(result => result.json())
            .then(data => {
                this.exchangeStats = data;
                if (this._exchangeStatsPanel) {
                    this.populateStatsTable(collectionid, exchangeid);
                }
                console.log("Received stats:", this.exchangeStats);
            })
            .catch(err => console.warn("Could not fetch urn: ", err))
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('FDX_ExplorerToolbox');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('FDX_ExplorerToolbox');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add exchange info button to the toolbar group
        this._exchangeInfoButton = new Autodesk.Viewing.UI.Button('exchangeInfoButton');
        this._exchangeInfoButton.onClick = (ev) => {
            // Check if the panel is created or not
            if (this._exchangeInfoPanel == null) {
                this._exchangeInfoPanel = new ExchangeInfoPanel(this.viewer, this.viewer.container, 'exchangeInfoPanel', 'Exchange info');
                this._exchangeInfoPanel.container.dockRight = false;
            }
            // Show/hide docking panel
            this._exchangeInfoPanel.setVisible(!this._exchangeInfoPanel.isVisible());

            // If panel is NOT visible, exit the function
            if (!this._exchangeInfoPanel.isVisible())
                return;

            // this._panel.addProperty("Key", "Value", "GroupName");

            this.exchangeInfo.forEach(exchange => {

                let projectUrn = exchange.components.data.insert["autodesk.fdx:source.acc-1.0.0"].source.String.projectUrn;
                let sourceFileUrn = exchange.components.data.insert["autodesk.fdx:source.acc-1.0.0"].source.String.fileUrn;
                // let sourceFileVersion = exchange.components.data.insert["autodesk.fdx:source.acc-1.0.0"].source.String.versionUrn.split('=')[1];
                let sourceFileVersion = this.getAttributeMapForEntity(exchange)["sourceVersionUrn"].value.split('=')[1];
                let sourceView = exchange.components.data.insert["autodesk.fdx:contract.revitViewGeometry-1.0.0"].contract.String.viewName;


                let filename = exchange.components.data.insert["autodesk.fdx:host.acc-1.0.0"].host.String.fileName;
                this._exchangeInfoPanel.addProperty("Exchange ID", exchange.id, filename);
                this._exchangeInfoPanel.addProperty("Collection ID", exchange.collection.id, filename);
                this._exchangeInfoPanel.addProperty("ExchangeFileUrn", this.getAttributeMapForEntity(exchange)["exchangeFileUrn"].value, filename);
                this._exchangeInfoPanel.addProperty("SourceRevitView", sourceView, filename);

                this.addRevitFileNameToPanel(projectUrn, sourceFileUrn, filename, sourceFileVersion);
                console.log("THIS IS PANEL:", this._exchangeInfoPanel);

            })
        };
        this._exchangeInfoButton.setToolTip('Exchange Container Info');
        this._exchangeInfoButton.addClass('exchangeInfoIcon');
        this._group.addControl(this._exchangeInfoButton);

        // Add exchange data stats button to the toolbar group
        this._exchangeStatsButton = new Autodesk.Viewing.UI.Button('exchangeStatsButton');
        this._exchangeStatsButton.onClick = (ev) => {
            // Check if the panel is created or not
            if (this._exchangeStatsPanel == null) {
                this.prepareStatsTable();
                this._exchangeStatsPanel = new ExchangeDataStatsPanel(this.viewer, this.viewer.container,
                    'exchangeStatsPanel', 'Exchange Data Stats', {"innerDiv": this.statsUI});
            }
            // Show/hide docking panel
            this._exchangeStatsPanel.setVisible(!this._exchangeStatsPanel.isVisible());

            // If panel is NOT visible, exit the function
            if (!this._exchangeStatsPanel.isVisible())
                return;

            // this._panel.addProperty("Key", "Value", "GroupName");
            this.populateStatsTable();


        };
        this._exchangeStatsButton.setToolTip('Exchange Data Downloader');
        this._exchangeStatsButton.addClass('exchangeStatsIcon');
        this._group.addControl(this._exchangeStatsButton);
    }

    addRevitFileNameToPanel(projectUrn, sourceFileUrn, filename, version) {
        console.log("Getting info for item: ", sourceFileUrn);
        fetch(`/api/forge/dataexchange/getitemname?projectid=${projectUrn}&itemid=${sourceFileUrn}`)
            .then(result => result.json())
            .then(data => {
                this._exchangeInfoPanel.addProperty("SourceRevitFile", data.name + ` [v${version}]`, filename);

            })
            .catch(err => console.warn("Could not fetch urn: ", err))
    }

    getAttributeMapForEntity(entity) {
        let attributeMap = {}
        entity.attributes.data.forEach(attribute => {
            attributeMap[attribute.name] = attribute
        })
        return attributeMap;
    }

    prepareStatsTable() {
        this.statsUI = document.createElement("div");
        this.statsUI.id = "stats_data";
        this.statsUI.classList.add("docking-panel-container-solid-color-a");
        this.statsUI.innerHTML = `
<div class="container" id="stats_content">

    <!-- Nav tabs -->
    <ul class="nav nav-tabs" role="tablist">
        <li class="active">
            <a href="#overview" role="tab" data-toggle="tab">
                <icon class="fa fa-home"></icon> Overview
            </a>
        </li>
        <li><a href="#assets" role="tab" data-toggle="tab">
                <i class="fa fa-user"></i> Assets
            </a>
        </li>
        <li>
            <a href="#relationships" role="tab" data-toggle="tab">
                <i class="fa fa-envelope"></i> Relationships
            </a>
        </li>
    </ul>

    <!-- Tab panes -->
    <div class="tab-content">
        <div class="tab-pane fade active in" id="overview">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col"></th>
                        <th scope="col"> </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">Total Assets</th>
                        <td id="total_assets"></td>
                    </tr>
                    <tr>
                        <th scope="row">Total Relationships</th>
                        <td id="total_rels"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="tab-pane fade" id="assets">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Asset Type</th>
                        <th scope="col">Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">autodesk.design:assets.group-1.0.0</th>
                        <td id="assets_group"></td>
                    </tr>
                    <tr>
                        <th scope="row">autodesk.design:assets.design-1.0.0</th>
                        <td id="assets_design"></td>
                    </tr>
                    <tr>
                        <th scope="row">autodesk.design:assets.instance-1.0.0</th>
                        <td id="assets_instance"></td>
                    </tr>
                    <tr>
                        <th scope="row">autodesk.design:assets.geometry-1.0.0</th>
                        <td id="assets_geometry"></td>
                    </tr>
                    <tr>
                        <th scope="row">autodesk.design:assets.renderstyle-1.0.0</th>
                        <td id="assets_renderstyle"></td>
                    </tr>
                    <tr>
                        <th scope="row">autodesk.design:assets.binary-1.0.0</th>
                        <td id="assets_binary"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="tab-pane fade" id="relationships">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Asset Type</th>
                        <th scope="col">Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">autodesk.design:relationship.reference-1.0.0</th>
                        <td id="rel_reference"></td>
                    </tr>
                    <tr>
                        <th scope="row">autodesk.design:relationship.containment-1.0.0</th>
                        <td id="rel_containment"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <div class="row align-items-center justify-content-center">
        <div class="col-md-2 col-md-offset-3 spacer-md">    
            <button type="button" class="btn" id="download_assets_n_rels">Download assets & relationships</button>
        </div>

    </div>
</div>
        `;
    }

    download_assets_n_relationships() {
        // console.log("Downloading based on ",this.exchangeInfo[0].collection.id, this.exchangeInfo[0].id);
        fetch(`/api/forge/dataexchange/downloadexchange?collectionid=${this.exchangeInfo[0].collection.id}&exchangeid=${this.exchangeInfo[0].id}`)
            .then(result => result.json())
            .then(data => {
                let json = JSON.stringify(data);
                const data_blob = new Blob([json], { type: "application/json" });
                const url = window.URL || window.webkitURL;
                let link = url.createObjectURL(data_blob);
                const a = document.createElement("a");
                a.download = `${this.exchangeInfo[0].id}.json`;
                a.href = link;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            })
            .catch(err => console.warn("Could not download assets and relationships: ", err))

    }

    populateStatsTable() {
        if (this.statsUI == null || this.exchangeStats == null) {
            console.log("StatsUI and data is not ready yet");
            return
        }

        $("#total_assets").text(this.exchangeStats["TotalAssets"]);
        $("#total_rels").text(this.exchangeStats["TotalRelationships"]);
        $("#assets_group").text(this.exchangeStats["assetTypes"]["autodesk.design:assets.group-1.0.0"]);
        $("#assets_design").text(this.exchangeStats["assetTypes"]["autodesk.design:assets.design-1.0.0"]);
        $("#assets_instance").text(this.exchangeStats["assetTypes"]["autodesk.design:assets.instance-1.0.0"]);
        $("#assets_geometry").text(this.exchangeStats["assetTypes"]["autodesk.design:assets.geometry-1.0.0"]);
        $("#assets_binary").text(this.exchangeStats["assetTypes"]["autodesk.design:assets.binary-1.0.0"]);
        $("#assets_renderstyle").text(this.exchangeStats["assetTypes"]["autodesk.design:assets.renderstyle-1.0.0"]);
        $("#rel_reference").text(this.exchangeStats["relationshipsTypes"]["autodesk.design:relationship.reference-1.0.0"]);
        $("#rel_containment").text(this.exchangeStats["relationshipsTypes"]["autodesk.design:relationship.containment-1.0.0"]);

        let download_assets_n_rels = document.getElementById("download_assets_n_rels");
        download_assets_n_rels.onclick = this.download_assets_n_relationships;
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('FDX_Explorer', FDX_Explorer);


// *******************************************
// Exchange Info Panel
// *******************************************
class ExchangeInfoPanel extends Autodesk.Viewing.UI.PropertyPanel {
    constructor(viewer, container, id, title, options) {
        super(container, id, title, options);
        this.viewer = viewer;
    }
}

// *******************************************
// Exchange Data Stats Panel
// *******************************************
class ExchangeDataStatsPanel extends Autodesk.Viewing.UI.PropertyPanel {
    constructor(viewer, container, id, title, options) {
        super(container, id, title, options);
        this.viewer = viewer;
        this.container.dockRight = false;
        // let contentContainer = document.getElementById("exchangeStatsPanel-scroll-container");
        // contentContainer.appendChild(this.statsUI);
        this.container.lastElementChild.appendChild(options.innerDiv);
        window.mycontainer = this.container;
    }
}