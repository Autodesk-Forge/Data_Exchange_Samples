class FDX_Explorer extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
        this.exchangeInfo = null;

        this.getExchangeContainerInfo = this.getExchangeContainerInfo.bind(this);
        this.addRevitFileNameToPanel = this.addRevitFileNameToPanel.bind(this);
        this.getAttributeMapForEntity=this.getAttributeMapForEntity.bind(this);
    }

    load() {
        console.log('FDX_Explorer has been loaded');
        return true;
    }

    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
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
                console.log(this.exchageInfo);
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

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('exchangeInfoButton');
        this._button.onClick = (ev) => {
            // Check if the panel is created or not
            if (this._panel == null) {
                this._panel = new ExchangeInfoPanel(this.viewer, this.viewer.container, 'exchangeInfoPanel', 'Exchange info');
                this._panel.container.dockRight = false;
            }
            // Show/hide docking panel
            this._panel.setVisible(!this._panel.isVisible());

            // If panel is NOT visible, exit the function
            if (!this._panel.isVisible())
                return;

            // this._panel.addProperty("Key", "Value", "GroupName");

            this.exchangeInfo.forEach(exchange => {

                let projectUrn = exchange.components.data.insert["autodesk.fdx:source.acc-1.0.0"].source.String.projectUrn;
                let sourceFileUrn = exchange.components.data.insert["autodesk.fdx:source.acc-1.0.0"].source.String.fileUrn;
                // let sourceFileVersion = exchange.components.data.insert["autodesk.fdx:source.acc-1.0.0"].source.String.versionUrn.split('=')[1];
                let sourceFileVersion =  this.getAttributeMapForEntity(exchange)["sourceVersionUrn"].value.split('=')[1];
                let sourceView = exchange.components.data.insert["autodesk.fdx:contract.revitViewGeometry-1.0.0"].contract.String.viewName;


                let filename= exchange.components.data.insert["autodesk.fdx:host.acc-1.0.0"].host.String.fileName;
                this._panel.addProperty("Exchange ID", exchange.id, filename );
                this._panel.addProperty("Collection ID", exchange.collection.id, filename );
                this._panel.addProperty("ExchangeFileUrn", this.getAttributeMapForEntity(exchange)["exchangeFileUrn"].value, filename );
                this._panel.addProperty("SourceRevitView", sourceView, filename );

                this.addRevitFileNameToPanel(projectUrn, sourceFileUrn, filename, sourceFileVersion);
               console.log("THIS IS PANEL:", this._panel);

            })
        };
        this._button.setToolTip('Exchange Container Info');
        this._button.addClass('exchangeInfoIcon');
        this._group.addControl(this._button);
    }

    addRevitFileNameToPanel(projectUrn, sourceFileUrn, filename, version){
        console.log("Getting info for item: ", sourceFileUrn);
        fetch(`/api/forge/dataexchange/getitemname?projectid=${projectUrn}&itemid=${sourceFileUrn}`)
            .then(result => result.json())
            .then(data => {
                this._panel.addProperty("SourceRevitFile", data.name+ ` [v${version}]`, filename );

            })
    .catch(err => console.warn("Could not fetch urn: ", err))
    }

    getAttributeMapForEntity(entity){
        let attributeMap = {}
        entity.attributes.data.forEach(attribute => {
            attributeMap[attribute.name] = attribute
        })
        return attributeMap;
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
