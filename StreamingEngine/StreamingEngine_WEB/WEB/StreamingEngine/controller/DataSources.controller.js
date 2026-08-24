/*-----------------------------------------------------------------------------------
Streaming Engine - Data Sources
Creation Date: 2020.05.14 / By: E0445955
Reference Document: 
Description:This screen is used display all the Data Sources and their configurations
-------------------------------------------------------------------------------------*/
var oDataSourcesController;
var selectedPlant;
var oDialog;
var selectedDataSourceID = "";
var oResourceBundle;
var sPrevSourceType = null;
sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
	"sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/VBox"
], function (BaseController, MessageToast, JSONModel, MessageBox, Dialog, Button, Label, Input, VBox) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.DataSources", {
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
            this._filterDialog = null;

            oDataSourcesController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            this.getView().byId("table-datasources").setModel(this.oModelDataSources);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("DataSources").attachPatternMatched(this._onObjectMatched, this);
        },
        onAfterRendering: function () {
            oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            /******************** Below Part for Authorisation***********************/
            var sRoles = document.getElementById('input-roles').value;
            var sAdminRole = "STREAMING_ENGINE_ADMIN";
            var sUserRole = "STREAMING_ENGINE_USER";
            var iAdminIndex = sRoles.indexOf(sAdminRole);
            var iUserIndex = sRoles.indexOf(sUserRole);
            if (iAdminIndex < 0) {
                this.fnShowNoAccess();
                return;
            } else {
                this.getView().byId("page-data-sources").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        oModelFolderList: new sap.ui.model.json.JSONModel(),
        oModelSelectedFolders: new sap.ui.model.json.JSONModel([]),
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleDataSources"));
            var sMode = oEvent.getParameter("arguments").Refresh;
            oDataSourcesController.getView().byId("messagestrip-download-catalog").setVisible(false);
            if (sMode == "Y") {
                oDataSourcesController.fnLoadPlant();
                this.getView().byId("table-datasources").getBinding("items").sort(new sap.ui.model.Sorter("PLANT", false));
                if (this.oSortDialog) {
                    this.oSortDialog.destroy();
                    this.oSortDialog = undefined;
                }
            } else if (sMode == "N") {

            }
        },
        oModelPlant: new JSONModel(),
        oModelDataSources: new JSONModel(),
        fnLoadPlant: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSources"),
                            oResourceBundle.getText("dataSourcesLoadPlantsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        try {
                            data.Row.unshift({
                                DS_NAME: oResourceBundle.getText("commonAll"),
                                ID_PLANT: "%"
                            });
                        } catch (err) { };
                        oDataSourcesController.oModelPlant.setData(data);
                        oDataSourcesController.oModelPlant.refresh();
                        oDataSourcesController.getView().byId("combobox-plant").setSelectedKey("%");
                        oDataSourcesController.fnLoadDataSources();
                    }
                }
            });
        },
        onSearch: function () {
            this.fnLoadDataSources();
        },
        fnLoadDataSources: function () {
            oDialog.open();
            selectedPlant = oDataSourcesController.getView().byId("combobox-plant").getSelectedKey();
            var sDataSource = oDataSourcesController.getView().byId("input-data-source").getValue();
            var sDataSourceFilter = "%" + sDataSource.replace(/ /gi, '%') + "%";
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/SourceListAllSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": selectedPlant,
                    "Param.2": sDataSourceFilter,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSources"),
                            oResourceBundle.getText("dataSourcesLoadDataSources"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oDataSourcesController.oModelDataSources.setData(data);
                        oDataSourcesController.oModelDataSources.refresh();
                        oDialog.close();
                    }
                }
            });
        },
        fnRowPress: function (oEvent) {
            var oPath = oEvent.getSource().getBindingContextPath();
            var selectedItem = oEvent.getSource().getBindingContext().oModel.getProperty(oPath);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("DataSourceInformation", {
                MODE: "U",
                ID_SOURCE: selectedItem.ID_SOURCE,
                ID_PLANT: selectedItem.ID_PLANT,
                PLANT: selectedItem.PLANT,
                DS_NAME: encodeURIComponent(selectedItem.DS_NAME),
                DS_DESCRIPTION: encodeURIComponent(selectedItem.DS_DESCRIPTION),
                DS_MII_DATA_SERVER_PROCESS: selectedItem.DS_MII_DATA_SERVER_PROCESS,
                DS_MII_DATA_SERVER_CONTEXT: selectedItem.DS_MII_DATA_SERVER_CONTEXT,
                DS_PCO_SERVER_URL: encodeURIComponent(selectedItem.DS_PCO_SERVER_URL),
                DS_PCO_AGENT_PREFIX: selectedItem.DS_PCO_AGENT_PREFIX,
                DS_PCO_CREDENTIAL: selectedItem.DS_PCO_CREDENTIAL,
                FL_REALTIME: selectedItem.FL_REALTIME,
                FL_ARCHIVE: selectedItem.FL_ARCHIVE,
                FL_CONTEXTUAL: selectedItem.FL_CONTEXTUAL,
                FL_ENABLED: selectedItem.FL_ENABLED,
                FL_HISTORY: selectedItem.FL_HISTORY,
                FL_BATCH_INFO: selectedItem.FL_BATCH_INFO,
                ID_BATCH_SOURCE: selectedItem.ID_BATCH_SOURCE,
                DS_BATCH_EQUIPMENT_LEVELS: encodeURIComponent(selectedItem.DS_BATCH_EQUIPMENT_LEVELS),
                DS_MII_DATA_SERVER_C_TYPE: selectedItem.DS_MII_DATA_SERVER_C_TYPE,
                DS_MII_DATA_SERVER_P_TYPE: selectedItem.DS_MII_DATA_SERVER_P_TYPE,
                DS_KEPWARE_CHANNELS: encodeURIComponent(selectedItem.DS_KEPWARE_CHANNELS),
                DS_SQL_QUERY: encodeURIComponent(selectedItem.DS_SQL_QUERY),
                FL_FLAT_FILE: selectedItem.FL_FLAT_FILE,
                FL_ENERGY: selectedItem.FL_ENERGY,
                QT_MAX_HISTORICAL_UPLOADS: selectedItem.QT_MAX_HISTORICAL_UPLOADS,
                DS_MII_DATA_SERVER_FILE: encodeURIComponent(selectedItem.DS_MII_DATA_SERVER_FILE),
                FL_IDOC:selectedItem.FL_IDOC
            });
        },
        fnSelectionChanged: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            selectedDataSourceID = oSelectedItem.ID_SOURCE;
            this.fnCheckButtonsEnablement(oSelectedItem);
        },
        fnCheckButtonsEnablement: function (oItemContext) {
            var oSyncTagCatalogBtn = this.byId("button-tags");
            var oSyncEquiCatalogBtn = this.byId("button-download-batch");
            var oSyncPcoAgentsCatalogBtn = this.byId("button-synchronize-pco-agent");
            var oSyncPCoDestCatalogBtn = this.byId("button-synchronize-pco-destination");
            var oRestartPCoAgentsConnection = this.byId("button-restart-data-server");
        //    var oDownloadTagsByGroup = this.byId("button-DownloadTags-bygroup");
      //      if(oItemContext.DS_MII_DATA_SERVER_PROCESS == "" || oItemContext.DS_MII_DATA_SERVER_PROCESS == "NA" ) oDownloadTagsByGroup.setEnabled(false);
        //    else oDownloadTagsByGroup.setEnabled(true);

            if(oItemContext.FL_ARCHIVE == '1' || oItemContext.FL_REALTIME == '1') oSyncTagCatalogBtn.setEnabled(true);
            else oSyncTagCatalogBtn.setEnabled(false);
            
            if((oItemContext.FL_CONTEXTUAL == '1') && ((oItemContext.DS_SQL_QUERY != 'NA') && (oItemContext.DS_SQL_QUERY != ''))) oSyncEquiCatalogBtn.setEnabled(true);
            else oSyncEquiCatalogBtn.setEnabled(false);
            
            if(oItemContext.FL_REALTIME == '1'){
                oSyncPcoAgentsCatalogBtn.setEnabled(true);
                oSyncPCoDestCatalogBtn.setEnabled(true);
            } else {
                oSyncPcoAgentsCatalogBtn.setEnabled(false);
                oSyncPCoDestCatalogBtn.setEnabled(false);
            }
            if((oItemContext.FL_ENERGY == '0') || oItemContext.FL_IDOC == '0') oRestartPCoAgentsConnection.setEnabled(true);
            else oRestartPCoAgentsConnection.setEnabled(false);
            
        },
        

fnDownloadByFilter: function () {
    var that = this;

    if (selectedDataSourceID === "") {
        var sErrorMessage = oResourceBundle.getText("dataSourcesSelectDataSourceMsg");
        this.handleMessage(
            oResourceBundle.getText("commonTitleDataSources"),
            oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
            sErrorMessage,
            "Error"
        );
        return;
    }

    var oSyncTagCatalogBtn = this.byId("button-tags");
    oSyncTagCatalogBtn.setEnabled(false);

    var groupFlag = 0;

    // 1️⃣ VALIDATION BEFORE OPENING THE DIALOG
    $.ajax({
        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/DataSourceValidationBeforeExecutingMultipleDownloadsXacuteQuery&Content-Type=text/json",
        async: true,
        data: {
            "Param.1": selectedDataSourceID,
            "Param.2": groupFlag
        },
        success: function (result) {

            // Fatal error
            if (result.Rowsets.FatalError !== undefined) {
                that.handleMessage(
                    oResourceBundle.getText("commonTitleDataSources"),
                    oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
                    result.Rowsets.FatalError,
                    "Error"
                );
                oSyncTagCatalogBtn.setEnabled(true);
                return;
            }

            // Validation not OK
            var statusMessage = result.Rowsets.Rowset[0].Row[0].StatusMessage;
            if (statusMessage !== "OK") {
                sap.m.MessageBox.warning(statusMessage);
                oSyncTagCatalogBtn.setEnabled(true);
                return;
            }

            // 2️⃣ VALIDATION PASSED → BUILD AND OPEN THE DIALOG
            oSyncTagCatalogBtn.setEnabled(true);

            // Create Input field
            const oInput = new sap.m.Input("filterInput", {
                placeholder: "Enter filter value..."
            });

            // Create Label
            const oLabel = new sap.m.Label({
                text: "Please select Filter type and value",
                labelFor: oInput
            });

            // Filter Type Segmented Button
            const oFilterType = new sap.m.SegmentedButton("filterTypeSelect", {
                items: [
                    new sap.m.SegmentedButtonItem({ key: "startsWith", text: "Starts with" }),
                    new sap.m.SegmentedButtonItem({ key: "endsWith", text: "Ends with" }),
                    new sap.m.SegmentedButtonItem({ key: "contains", text: "Contain" })
                ],
                selectedKey: "startsWith"
            });
            oFilterType.setWidth("100%");

            // Container
            const oVBox = new sap.m.VBox({
                items: [oLabel, oFilterType, oInput]
            }).addStyleClass("sapUiSmallMargin");

            // Create dialog
            var oDialog = new sap.m.Dialog({
                title: "Filter",
                contentWidth: "30%",
                contentHeight: "20%",
                content: [oVBox],

                beginButton: new sap.m.Button({
                    text: "Confirm",
                    type: "Emphasized",
                    press: function () {

                        var oFilter = oInput.getValue();
                        var sfilterType = oFilterType.getSelectedKey();

                        // Disable button again before the download starts
                        oSyncTagCatalogBtn.setEnabled(false);

                        // 3️⃣ EXECUTE DOWNLOAD WITH FILTER
                        $.ajax({
                            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/TagCatalogDownloadAsyncXacuteQuery&Content-Type=text/json",
                            type: "POST",
                            async: true,
                            data: {
                                "Param.1": selectedDataSourceID,
                                "Param.3": false,
                                "Param.4": true,
                                "Param.5": oFilter,
                                "Param.6": sfilterType
                            },
                            success: function (result) {
                                if (result.Rowsets.FatalError) {
                                    var sErrorMessage = result.Rowsets.FatalError;
                                    that.handleMessage(
                                        oResourceBundle.getText("commonTitleDataSources"),
                                        oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
                                        sErrorMessage,
                                        "Error"
                                    );
                                } else {
                                    oDataSourcesController.getView()
                                        .byId("messagestrip-download-catalog")
                                        .setVisible(true);

                                    that.handleMessage(
                                        oResourceBundle.getText("commonTitleDataSources"),
                                        oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
                                        oResourceBundle.getText("commonBackgroundProcessMessage"),
                                        "Success"
                                    );
                                }
                                oSyncTagCatalogBtn.setEnabled(true);
                            },
                            error: function () {
                                oSyncTagCatalogBtn.setEnabled(true);
                            }
                        });

                        oDialog.close();
                    }
                }),

                endButton: new sap.m.Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                }),

                afterClose: function () {
                    oDialog.destroy();
                }
            });

            that.getView().addDependent(oDialog);
            oDialog.open();
        },

        error: function () {
            sap.m.MessageBox.error("Validation failed due to network error.");
            oSyncTagCatalogBtn.setEnabled(true);
        }
    });
}
        

        ,
fnDownloadTagCatalog: function () {
    if (selectedDataSourceID !== "") {
        var that = this;
        
	var oSyncTagCatalogBtn = this.byId("button-tags");

        // Disable the button before starting
        oSyncTagCatalogBtn.setEnabled(false);

        // Validation logic before download
	var groupFlag = 0;
        $.ajax({
            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/DataSourceValidationBeforeExecutingMultipleDownloadsXacuteQuery&Content-Type=text/json",
            async: false,
            data: {
                "Param.1": selectedDataSourceID,
	     "Param.2": groupFlag
            },
            success: function (result) {
                if (result.Rowsets.FatalError !== undefined) {
                    that.handleMessage(
                        oResourceBundle.getText("commonTitleDataSources"),
                        oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
                        result.Rowsets.FatalError,
                        "Error"
                    );
		oSyncTagCatalogBtn.setEnabled(true); // Re-enable on error
                    return;
                } else {
                    var statusMessage = result.Rowsets.Rowset[0].Row[0].StatusMessage;
                    if (statusMessage !== "OK") {
		//alert("not OK");
                        sap.m.MessageBox.warning(statusMessage);
		oSyncTagCatalogBtn.setEnabled(true); // Re-enable on warning
                        return;
                    }
                }

                // Proceed with tag catalog download
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/TagCatalogDownloadAsyncXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    async: true,
                    data: {
                        "Param.1": selectedDataSourceID,
                        "Param.3": false
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            that.handleMessage(
                                oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
                                sErrorMessage,
                                "Error"
                            );
                            oDialog.close();
                        } else {
                            oDataSourcesController.getView().byId("messagestrip-download-catalog").setVisible(true);
                            that.handleMessage(
                                oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
                                oResourceBundle.getText("commonBackgroundProcessMessage"),
                                "Success"
                            );
                        }
                    },
                    error: function () {
                        // Optional error handling
		oSyncTagCatalogBtn.setEnabled(true); // Re-enable on error
                    }
                });
            }
        });
    } else {
        var sErrorMessage = oResourceBundle.getText("dataSourcesSelectDataSourceMsg");
        this.handleMessage(
            oResourceBundle.getText("commonTitleDataSources"),
            oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
            sErrorMessage,
            "Error"
        );
    }
},

        fnFindAncestors: function(selectedRows, row) {
            if(row == undefined ){
            return false;
        }
        
        
        var lastDotIndex = String((row.Node)).lastIndexOf(".");
        var result = String(row.Node);
                  
        while(lastDotIndex !== -1){
            
                // Found a dot, remove it and what comes after it
                 result = result.substring(0, lastDotIndex);
                lastDotIndex = result.lastIndexOf('.');
               
                
                
            
           
        
            
              if(selectedRows.some(selectedRow => selectedRow.Node == result)){
                return true;
              };
        
        
           
                
        }
                        if(selectedRows.some(selectedRow => selectedRow.Node == result)){
                return true;
              };
        return false;
        },
                fnFindChildren: function(selectedRows, row) {
            if (row === undefined || !row.Row || row.Row.length === 0 ||(row.Row[0].Name)=="Loading...") {
                return false;
            }
        
            var treetable = sap.ui.getCore().byId("table-Folderlist").oModels.undefined.oData.Row;
            
            
            const childrenRows = row.Row;
        
           
            return (
                childrenRows.some(childRow => selectedRows.some(selectedRow => selectedRow.Node === childRow.Node)) ||
                childrenRows.some(childRow => this.fnFindChildren(selectedRows, childRow))
            );
        
        
        
        }, 
        
        
        fnDownloadClose: function(){
            oDataSourcesController.oModelSelectedFolders.setData([]);
        this.oFolders.close();
        this.oFolders.destroy();
        
        },
                fnDisplayFolders: function (){
                    var sSelectedProcessServer = this.byId("table-datasources").getSelectedItem().getBindingContext().getObject().DS_MII_DATA_SERVER_PROCESS
                        
                // Validate data source status before triggering download by groups
                       var sSelectedDataSourceID = this.byId("table-datasources").getSelectedItem().getBindingContext().getObject().ID_SOURCE
		var groupFlag = 1;
		//alert(sSelectedDataSourceID);
		var that = this; 
		$.ajax({
                            url: "/XMII/Illuminator?&QueryTemplate=StreamingEngine/DataSource/Query/DataSourceValidationBeforeExecutingMultipleDownloadsXacuteQuery&Content-Type=text/json",
                            async: false,
                            data: {
                                "Param.1":sSelectedDataSourceID,
		        "Param.2":groupFlag
                            },
                            success: function (result) {
							
                                if (result.Rowsets.FatalError !== undefined) {
                                    that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                                    oResourceBundle.getText("dataSourcesTagDownloadRunningValidationError"),
                                        result.Rowsets.FatalError,
                                        "Error");
                                } else {
									var statusMessage = result.Rowsets.Rowset[0].Row[0].StatusMessage;
											
								if (statusMessage === "OK") {
									sap.m.MessageToast.show("Please select folder(s).");
									                        that.oFolders = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.OPCUAFolders", that);
                        that.getView().addDependent(that.oFolders);
                        that.oFolders.open();
                        $.ajax({
                            url: "/XMII/Illuminator?&QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogOpcUA_GroupListPCoQuery&Content-Type=text/json",
                            async: false,
                            data: {
                                "Param.1":"",
                                "Param.2":100000,
                                "Param.20":"",
                                "Server": sSelectedProcessServer
                            },
                            success: function (result) {
                                if (result.Rowsets.FatalError !== undefined) {
                                    that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                                    oResourceBundle.getText("dataSourcesTagDownloadRunningValidationError"),
                                        result.Rowsets.FatalError,
                                        "Error");
                                } else {
                                    var data=result;
                                    data.Rowsets.Rowset[0].Row.forEach(function(value, index){
                                        value.ParentNode = null;
                                        value.Node = index + 1; 
                                        value.Row = [{Name: "Loading..."}];
                                    })
                                    
                                    
                                    
                                    oDataSourcesController.oModelFolderList.setData(data.Rowsets.Rowset[0]);
                                    oDataSourcesController.oModelFolderList.refresh();
                                    sap.ui.getCore().byId("table-Folderlist").setModel(oDataSourcesController.oModelFolderList);
                                    
                                    
                                    
                                }
                            }
                        });
								} else {
									sap.m.MessageBox.warning(statusMessage);
								}
								}
								}
								})
		// Validation ends here
                       
                    },        
        fnShowSelectedFolders: function () {
            var oList = new sap.m.List({
            });
            var oListItemTemplate = new sap.m.StandardListItem({
                title: "{Source}",
                iconDensityAware: false,
                iconInset: false
            }).data("Name", "{Name}");
            oList.bindItems({
                path: "/",
                template: oListItemTemplate
            });
            var oCloseButton = new sap.m.Button({
                text: oResourceBundle.getText("commonClose"),
                press: this.onCloseSelectedFoldersDialog
            });
            var oSelectionDialog = new sap.m.Dialog({
                title: oResourceBundle.getText("batchSelectedTags"),
                content: oList,
                buttons: oCloseButton
            });
            oSelectionDialog.setModel(this.oModelSelectedFolders);
            oSelectionDialog.open();
        },
        onCloseSelectedFoldersDialog: function (oEvent) {
            
            oEvent.getSource().getParent().close();
            oEvent.getSource().getModel().refresh(true);
        },
        onTableSelectionChange: function(oEvent){      
            var sFoldersSelected = oResourceBundle.getText("tagCatalogTagsSelected");
            var arrSelectedItems = oDataSourcesController.oModelSelectedFolders.getData();
            var aSelectedItem = oEvent.getParameter("rowContext").getObject();
            var oTable =sap.ui.getCore().byId("table-Folderlist");
            var iCount = arrSelectedItems.length + 1;
            var sMessage = "";
         
            
            if(arrSelectedItems.length>0){
            var bSelected = false;
            var i=0;
            
            while(bSelected ==false && i<arrSelectedItems.length)
            {if(aSelectedItem.Name ==arrSelectedItems[i].Name){
                bSelected = true;
                this.oModelSelectedFolders.getData().splice(i, 1);
                this.oModelSelectedFolders.refresh(true);

             
            }
            else { i++; }

            }
            if(bSelected ==false){
            var bchildren = this.fnFindChildren(arrSelectedItems,aSelectedItem);
       var bparent = this.fnFindAncestors(arrSelectedItems,aSelectedItem);
             if(!bchildren && !bparent) {      
            this.oModelSelectedFolders.getData().push(aSelectedItem);
            this.oModelSelectedFolders.refresh(true);
            if (iCount > 1) {
                sMessage = iCount + " Folders" ;
                MessageToast.show(sMessage);
            }
            else if (iCount == 1) {
                sMessage = iCount + " Folders";
                MessageToast.show(sMessage);
            } }
                    else if(bchildren){ 
                    
                        if(oTable.getSelectedIndices().find(item => item === oEvent.mParameters.rowIndex)){
                            oTable.removeSelectionInterval(oEvent.mParameters.rowIndex,oEvent.mParameters.rowIndex); }
                            MessageToast.show(oResourceBundle.getText("dataSourcesChildrenFolderSelected")); 
                this.oModelSelectedFolders.refresh(true);
                            oDataSourcesController.oModelFolderList.refresh();
                            
                       
                    } else if(bparent){
                        if(oTable.getSelectedIndices().find(item => item === oEvent.mParameters.rowIndex)){
                            oTable.removeSelectionInterval(oEvent.mParameters.rowIndex,oEvent.mParameters.rowIndex); }
                            MessageToast.show(oResourceBundle.getText("dataSourcesParentFolderSelected")); 
                this.oModelSelectedFolders.refresh(true);
                            oDataSourcesController.oModelFolderList.refresh();
                     
                    
                    }


            }
        
        }else{
                this.oModelSelectedFolders.getData().push(aSelectedItem);
            this.oModelSelectedFolders.refresh(true);
            if (iCount > 1) {
                sMessage = iCount + " Folders" ;
                MessageToast.show(sMessage);
            }
            else if (iCount == 1) {
                sMessage = iCount + " Folders";
                MessageToast.show(sMessage);
            } 

            }

            
         


    },
    fnDownloadgroups: function(){
              
            var sFolderList = "";    
            var selectedDataSourceID = this.byId("table-datasources").getSelectedItem().getBindingContext().getObject().ID_SOURCE;      
	var oDownloadTagsByGroupBtn = this.byId("button-tags");
	 // Disable the button at the start
    oDownloadTagsByGroupBtn.setEnabled(false);  
                for (var i = 0; i < oDataSourcesController.oModelSelectedFolders.getData().length; i++) {
                    if (i == 0) {
                        sFolderList = oDataSourcesController.oModelSelectedFolders.getData()[i].Source;
                    } else {
                        sFolderList = sFolderList + "," + oDataSourcesController.oModelSelectedFolders.getData()[i].Source;
                    }
            }
            if (selectedDataSourceID != "" && sFolderList!="") {
                var that = this;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/TagCatalogDownloadAsyncXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    async: true,
                    data: {
                        "Param.1": selectedDataSourceID,
                        "Param.2": sFolderList,
                        "Param.3": true
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            //MessageToast.show(sErrorMessage);
                            that.handleMessage(oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
                                sErrorMessage,
                                "Error");
		        oDownloadTagsByGroupBtn.setEnabled(true); // Re-enable on error
                                that.oFolders.close();
                                that.oFolders.destroy();
                        } else {
                            that.handleMessage(oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
                                oResourceBundle.getText("commonBackgroundProcessMessage"),
                                "Success");
                                oDataSourcesController.oModelSelectedFolders.setData([]);
                                that.oFolders.close();
                                that.oFolders.destroy();
                        }
                    },
                    error: function () {
			oDownloadTagsByGroupBtn.setEnabled(true); // Re-enable on AJAX error
                    }
                });
            } else {
                var sErrorMessage = oResourceBundle.getText("dataSourcesSelectDataSourceMsg");
                //MessageToast.show(sErrorMessage);
                this.handleMessage(oResourceBundle.getText("commonTitleDataSources"),
                    oResourceBundle.getText("dataSourcesDownloadTagCatalog"),
                    sErrorMessage,
                    "Error");
	oDownloadTagsByGroupBtn.setEnabled(true); // Re-enable if validation fails
            }		
        
    },

  fnDownloadBatchCatalog: function () {
    if (selectedDataSourceID != "") {
        var that = this;
        var oSyncEquiCatalogBtn = this.byId("button-download-batch");
        var type = "Eq";

        // Disable the button at the start
        oSyncEquiCatalogBtn.setEnabled(false);

        // Step 1: Validation check via StopMultipleExecutionSelectBySourceQuery
        $.ajax({
            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/StopMultipleExecutionBySourceXacuteQuery&Content-Type=text/json",
            async: false,
            data: {
                "Param.1": selectedDataSourceID,
	    "Param.2": type	
            },
            success: function (result) {
                if (result.Rowsets.FatalError !== undefined) {
                    that.handleMessage(
                        oResourceBundle.getText("commonTitleDataSources"),
                        oResourceBundle.getText("dataSourcesDownloadBatchCatalog"),
                        result.Rowsets.FatalError,
                        "Error"
                    );
                    oSyncEquiCatalogBtn.setEnabled(true); // Re-enable on error
                    return;
                }

                var status = result.Rowsets.Rowset[0].Row[0].Status;
	 var statusMessage = result.Rowsets.Rowset[0].Row[0].StatusMessage;	
                if (statusMessage !== "OK") {
                    // Block execution with popup
                    sap.m.MessageBox.warning(statusMessage);
                    oSyncEquiCatalogBtn.setEnabled(true); // Re-enable
                    return;
                }
	//alert(type);
                // Step 2: Proceed with batch catalog download
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogDownloadAsyncXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    async: true,
                    data: {
                        "Param.1": selectedDataSourceID,
		  "Param.2": type
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            that.handleMessage(
                                oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesDownloadBatchCatalog"),
                                sErrorMessage,
                                "Error"
                            );
                        } else {
                            oDataSourcesController.getView().byId("messagestrip-download-catalog").setVisible(true);
                            that.handleMessage(
                                oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesDownloadBatchCatalog"),
                                oResourceBundle.getText("commonBackgroundProcessMessage"),
                                "Success"
                            );
                        }
                       
                    },
                    error: function () {
                        oSyncEquiCatalogBtn.setEnabled(true); // Re-enable on AJAX error
                    }
                });
            },
            error: function () {
                oSyncEquiCatalogBtn.setEnabled(true); // Re-enable on AJAX error
            }
        });
    } else {
        var sErrorMessage = oResourceBundle.getText("dataSourcesSelectDataSourceMsg");
        this.handleMessage(
            oResourceBundle.getText("commonTitleDataSources"),
            oResourceBundle.getText("dataSourcesDownloadBatchCatalog"),
            sErrorMessage,
            "Error"
        );
    }
},
        onToggleOpenState: function(oEvent){
            var sSelectedProcessServer = this.byId("table-datasources").getSelectedItem().getBindingContext().getObject().DS_MII_DATA_SERVER_PROCESS
            var that = this;
        if (oEvent.getParameter("expanded")) {
        var oObject = oEvent.getParameter("rowContext").getObject();
        oDialog.setBusy(true);
       $.ajax({
            url: "/XMII/Illuminator?&QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogOpcUA_GroupListPCoQuery&Content-Type=text/json",
            async: false,
            data: {
                "Param.1":oObject.Source,
                    "Param.2":100000,
                    "Param.20":"",
                    "Server": sSelectedProcessServer
            },
            success: function (result) {
                if (result.Rowsets.FatalError !== undefined) {
                    that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                    oResourceBundle.getText("dataSourcesFoldersListError"),
                        result.Rowsets.FatalError,
                        "Error");
                } else {
                    if(result.Rowsets.Rowset[0].Row){
                    var data=result;
                        data.Rowsets.Rowset[0].Row.forEach(function(value,index){
                            value.ParentNode = oObject.Node;    
                            value.Node = String(oObject.Node)+"."+String(index + 1);    
                            value.Row = [{Name: "Loading..."}];
                        })
                    oObject.Row = result.Rowsets.Rowset[0].Row;
                  //  oDataSourcesController.oModelFolderList.getData();
                   oDataSourcesController.oModelFolderList.refresh();
                   sap.ui.getCore().byId("table-Folderlist").setModel(oDataSourcesController.oModelFolderList); }
                   else{
                    oObject.Row = [];
                    oDataSourcesController.oModelFolderList.refresh();
                    sap.ui.getCore().byId("table-Folderlist").setModel(oDataSourcesController.oModelFolderList); 
                   }
                    
                    
                    
                }
            }
        }); 
    }
    oDialog.setBusy(false);
                
    },

        fnRestartDataServer: function () {
            if (selectedDataSourceID != "") {
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.DataSourceRestart", this);
                }
                this.getView().addDependent(this._oDialog);
                this._oDialog.open();
            } else {
                //var sErrorMessage = "Please select a Data Source";
                //MessageToast.show(sErrorMessage);
                var sErrorMessage = oResourceBundle.getText("dataSourcesSelectDataSourceMsg");
                this.handleMessage(oResourceBundle.getText("commonTitleDataSources"),
                    oResourceBundle.getText("dataSourcesRestartPCoConnection"),
                    sErrorMessage,
                    "Error");
            }
        },

        fnClosePopOver: function () {
            this._oDialog.close();
        },

        fnRestart: function () {
            var processFlag = sap.ui.getCore().byId("FLAG_PROCESS").getSelected();
            var contextualFlag = sap.ui.getCore().byId("FLAG_CONTEXTUAL").getSelected();
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/DataSourceRestartXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": selectedDataSourceID,
                    "Param.2": processFlag,
                    "Param.3": contextualFlag
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSources"),
                            oResourceBundle.getText("dataSourcesRestartPCoConnection"),
                            sErrorMessage,
                            "Error");
                        //MessageToast.show(sErrorMessage);
                        oDialog.close();
                        oDataSourcesController.fnClosePopOver();
                    } else {
                        this.handleMessage(oResourceBundle.getText("commonTitleDataSources"),
                            oResourceBundle.getText("dataSourcesRestartPCoConnection"),
                            oResourceBundle.getText("commonInfoSuccess"),
                            "Success");
                        //MessageToast.show(oResourceBundle.getText("commonInfoSuccess"));
                        oDialog.close();
                        oDataSourcesController.fnClosePopOver();
                    }
                },
                error: function () {
                }
            });
        },

        // fnAddNew: function () {
        //     var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        //     oRouter.navTo("DataSourceInformation", {
        //         MODE: "I"
        //     });
        // },
        //*    ************************************************************************************* *//
        //*                               WIZARD LOGIC  START BLOC                                   *//
        //*    ************************************************************************************* *//

        fnAddNewWizard: function () {
            if (!this._oWizardDialog || this._oWizardDialog.bIsDestroyed) {
                this._oWizardDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.DataSourceCreationWizard", this);
            }
            this.getView().addDependent(this._oWizardDialog);
            var oCreationModel = new JSONModel();
            this._oWizard = sap.ui.getCore().byId("DataSourceCreationWizard");
            this._oWizard.setModel(oCreationModel, "creationModel");
            this._oWizardModel = this._oWizard.getModel("creationModel");

            this._oNavContainer = sap.ui.getCore().byId("DataSourceWizardNavContainer");
            this._oWizardContentPage = sap.ui.getCore().byId("wizardContentPage");
            if (!this._oWizardReviewPage || this._oWizardReviewPage.bIsDestroyed) {
                this._oWizardReviewPage = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.DataSourceReviewWizard", this);
            }
            this._oWizardReviewPage.setModel(oCreationModel, "creationModel");
            this._oNavContainer.addPage(this._oWizardReviewPage);

            this.prepareWizardData();

            this._oWizardModel.setProperty("/dataServerKepware", false);
            this._oWizardModel.refresh(true);

            this._oWizardDialog.open();
        },
        prepareWizardData: function () {
            //plant step
            this.fnLoadPlantList();
            //source step 
            var oDataSourceType = jQuery.sap.getModulePath("StreamingEngine.StreamingEngine", "/model/dataSourceType.json"),
                oSourceTypeModel = new sap.ui.model.json.JSONModel(oDataSourceType);
            this._oWizard.setModel(oSourceTypeModel, "Sources");
            //data server step
            var oDataServersModel = new JSONModel();
            this._oWizard.setModel(oDataServersModel, "DataServers");
            this.fnLoadDataServer(oDataServersModel);
            var oPCoCredModel = new JSONModel();
            this._oWizard.setModel(oPCoCredModel, "PCoCredentials");
            this.fnLoadPCOCredentialsList(oPCoCredModel);
        },
        fnLoadPlantList: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSources"),
                            oResourceBundle.getText("dataSourcesLoadPlantsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        if (data.Row[0]) {
                            that._oWizardModel.setProperty("/plant", data.Row[0].ID_PLANT);
                            that._oWizardModel.refresh(true);
                            that._oWizard.setModel(new JSONModel(data), "Plants");
                            that._oWizard.validateStep(sap.ui.getCore().byId("plantStep"));
                        }
                    }
                }
            });
        },
        fnLoadDataServer: function (oDataServersModel) {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?service=SystemInfo&mode=ServerList&Mask=Enabled&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                            oResourceBundle.getText("dataSourcesInfoLoadServerList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oDataServersModel.setData(data);
                        oDataServersModel.refresh(true);
                    }
                }
            });
        },
        fnLoadPCOCredentialsList: function (oPCoCredModel) {
            var that = this;
            var sQueryPath = "StreamingEngine/Common/Query/CredentialListSelectQuery";
            var sURL = "/XMII/Illuminator?QueryTemplate=" + sQueryPath + "&Content-Type=text/json";
            $.ajax({
                url: sURL,
                data: {
                    "Param.1": "SE_PCO%",
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                            oResourceBundle.getText("dataSourceMIICredentialsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oPCoCredModel.setData(data);
                        oPCoCredModel.refresh();
                    }
                }
            });
        },
        checkPlantStep: function () {
            var sPlant = this._oWizardModel.getProperty("/plant") || "";
            if (sPlant.length == 0) {
                this._oWizard.invalidateStep(sap.ui.getCore().byId("plantStep"));
            } else {
                this._oWizard.validateStep(sap.ui.getCore().byId("plantStep"));
            }
        },
        setDifferentDataSourceType: function (oEvent) {
            var sSourceType = this._oWizardModel.getProperty("/sourceType") || "";
            var oDiscardStep = sap.ui.getCore().byId("dataSourceTypeStep")
            if (sSourceType.length == 0) {
                this._oWizard.invalidateStep(sap.ui.getCore().byId("dataSourceTypeStep"));
                this.discardProgress(oDiscardStep);
            } else {
                var that = this;
                if (sap.ui.getCore().byId("dataSourceTypeStep").getNextStep()) {
                    MessageBox.warning(oResourceBundle.getText("dsWizardDataSrcChanged"), {
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction === MessageBox.Action.YES) {
                                that.discardProgress(oDiscardStep);
                                that._oWizard.validateStep(sap.ui.getCore().byId("dataSourceTypeStep"));
                                sPrevSourceType = sSourceType;
                            } else {
                                sap.ui.getCore().byId("data-source-type").setSelectedKey(sPrevSourceType);
                            }
                        }
                    });
                } else {
                    that._oWizard.validateStep(sap.ui.getCore().byId("dataSourceTypeStep"));
                    sPrevSourceType = sSourceType;
                }
            }
        },
        discardProgress: function (oDiscardStep) {
            this._oWizard.discardProgress(oDiscardStep);
            this._oWizardModel.setProperty("/sourceName", "");
            this._oWizardModel.setProperty("/sourceDescription", "");
            this._oWizardModel.setProperty("/dataServer", "");
            this._oWizardModel.setProperty("/dataServerType", "");
            this._oWizardModel.setProperty("/pcoCredential");
            this._oWizardModel.setProperty("/pcoUrl", "");
            this._oWizardModel.setProperty("/pcoPoolPrefix", "");
            this._oWizardModel.setProperty("/kepChannels", "");
        },
        checkDescriptionStep1: function (oEvent) {
            var sSourceName = this._oWizardModel.getProperty("/sourceName") || "";
            var sSourceDescription = this._oWizardModel.getProperty("/sourceDescription") || "";
            if (sSourceName.length > 0 && sSourceDescription.length > 0) {
                this._oWizard.validateStep(sap.ui.getCore().byId("dataSourceDescriptionStep1"));
            } else {
                this._oWizard.invalidateStep(sap.ui.getCore().byId("dataSourceDescriptionStep1"));
            }

        },
        checkDescriptionStep2: function (oEvent) {
            var sSourceName = this._oWizardModel.getProperty("/sourceName") || "";
            var sSourceDescription = this._oWizardModel.getProperty("/sourceDescription") || "";
            if (sSourceName.length > 0 && sSourceDescription.length > 0) {
                this._oWizard.validateStep(sap.ui.getCore().byId("dataSourceDescriptionStep2"));
            } else {
                this._oWizard.invalidateStep(sap.ui.getCore().byId("dataSourceDescriptionStep2"));
            }

        },
        checkSourceStep: function () {
            var sSourceType = this._oWizardModel.getProperty("/sourceType") || "";
            if (sSourceType.length == 0) {
                this._oWizard.invalidateStep(sap.ui.getCore().byId("dataSourceTypeStep"));
            } else {
                this._oWizard.validateStep(sap.ui.getCore().byId("dataSourceTypeStep"));
            }
        },
        completeSourceStep: function (oEvent) {
            //sap.ui.getCore().byId("data-source-type").setEnabled(false);
            if ((this._oWizardModel.getProperty("/sourceType") === "DS_TYPE_ENGIE") || (this._oWizardModel.getProperty("/sourceType") === "DS_TYPE_IDOC") ) {
                oEvent.getSource().setNextStep(sap.ui.getCore().byId("dataSourceDescriptionStep2"));
            } else {
                oEvent.getSource().setNextStep(sap.ui.getCore().byId("dataSourceDescriptionStep1"));
            }
        },
        fnDataServerChanged: function () {
            var sServerName = this._oWizardModel.getProperty("/dataServer");
            var sServerType = this._oWizardModel.getProperty("/dataServerType");
            if (sServerType === "Kepware") {
                this._oWizardModel.setProperty("/dataServerKepware", true);
                this._oWizardModel.refresh(true);
                if (!sServerName) {
                    sap.ui.getCore().byId("multicombobox-kepware-channels").setEnabled(false);
                    sap.ui.getCore().byId("multicombobox-kepware-channels").setSelectedKeys(null);
                } else {
                    sap.ui.getCore().byId("multicombobox-kepware-channels").setEnabled(true);
                    sap.ui.getCore().byId("multicombobox-kepware-channels").setBusy(true);
                    var oKepChannelsModel = new JSONModel();
                    this._oWizard.setModel(oKepChannelsModel, "KepChannels");

                    var that = this;
                    $.ajax({
                        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogOpcUA_GroupListPCoQuery&Content-Type=text/json",
                        data: {
                            "Param.2": 200,
                            "Param.20": "",
                            "Server": sServerName
                        },
                        success: function (result) {
                            sap.ui.getCore().byId("multicombobox-kepware-channels").setBusy(false);
                            if (result.Rowsets.FatalError == undefined && result.Rowsets.Rowset[0].Row != undefined) {
                                var data = result.Rowsets.Rowset[0];
                                oKepChannelsModel.setData({ Row: data.Row.filter(e => !e.Name.startsWith("_")) })
                                oKepChannelsModel.refresh();
                            } else {
                                oKepChannelsModel.setData({ Row: [] })
                                oKepChannelsModel.refresh();
                            }
                            that.autoFillDataServerURL(sServerName);
                        }
                    });
                }
            } else {
                this._oWizardModel.setProperty("/dataServerKepware", false);
                this._oWizardModel.refresh(true);
                this.autoFillDataServerURL(sServerName);
            }
        },
        autoFillDataServerURL: function (sServerName) {
            var oPCoURL = sap.ui.getCore().byId("wzd-pco-server-url");
            oPCoURL.setBusy(true);
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?service=SystemInfo&mode=ServerInfo&name=" + sServerName + "&Content-Type=text/json",
                success: function (result) {
                    oPCoURL.setBusy(false);
                    if (result.Rowsets.FatalError !== undefined) {

                    } else {
                        var data = result.Rowsets.Rowset[0];
                        var oMgtConsoleInfo = data.Row.find(elt => elt.Name === "PCoMgmtServiceURL");
                        if (oMgtConsoleInfo) {
                            that._oWizardModel.setProperty("/pcoUrl", oMgtConsoleInfo.Value);
                            that._oWizardModel.refresh();
                        } else {
                            that._oWizardModel.setProperty("/pcoUrl", "");
                            that._oWizardModel.refresh();
                        }
                    }
                    that.checkDataServerStep();
                }
            });
        },
        checkDataServerStep: function () {
            // getting values to validate input
            var sDataServer = this._oWizardModel.getProperty("/dataServer") || "";
            var sDataServerType = this._oWizardModel.getProperty("/dataServerType") || "";
            var sPcoCred = this._oWizardModel.getProperty("/pcoCredential") || "";
            var sServerURL = this._oWizardModel.getProperty("/pcoUrl") || "";
            var sDataSourceType = this._oWizardModel.getProperty("/sourceType");
            var sPcoPoolPrefix = this._oWizardModel.getProperty("/pcoPoolPrefix") || "";
            
            //force unrequired values to NA
            if (sDataSourceType != "DS_TYPE_REALTIME") {
                sPcoPoolPrefix = 'NA';
            }
            if (sDataSourceType == "DS_TYPE_FILE") {
                sDataServerType = 'NA';
                sDataServer = 'NA';
            }
            if (sDataServer.length > 0 && sDataServerType.length > 0 && sServerURL.length > 0 && 
                sPcoPoolPrefix.length > 0 && sPcoCred.length > 0) {
                this._oWizard.validateStep(sap.ui.getCore().byId("dataServerConfigStep"));
            } else {
                this._oWizard.invalidateStep(sap.ui.getCore().byId("dataServerConfigStep"));
            }
        },
        getSourceTypeText: function (sTypeKey) {
            return oResourceBundle.getText(sTypeKey);
        },

        onSaveDataSource: function () {
            this.fnAddDataSourceInformation();
            this._oWizardDialog.close();
            this._oWizardDialog.destroy();
            this._oWizardReviewPage.destroy();
        },
        wizardCompletedHandler: function () {
            this._oNavContainer.to(this._oWizardReviewPage);
        },
        editPlantStep: function () {
            this._handleNavigationToStep(0);
        },
        editSourceStep: function () {
            this._handleNavigationToStep(1);
        },
        editDescriptionStep: function () {
            this._handleNavigationToStep(2);
        },
        editDataServerStep: function () {
            this._handleNavigationToStep(3);
        },
        _handleNavigationToStep: function (iStepNumber) {
            var that = this;
            function fnAfterNavigate() {
                that._oWizard.goToStep(that._oWizard.getSteps()[iStepNumber]);
                that._oNavContainer.detachAfterNavigate(fnAfterNavigate);
            }

            this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
            this.backToWizardContent();
        },
        backToWizardContent: function () {
            this._oNavContainer.backToPage(this._oWizardContentPage.getId());
        },
        onCloseWizard: function () {
            var that = this;
            MessageBox.warning(oResourceBundle.getText("dsWizardConfirmation"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        that.onConfirmCloseWizard();
                    }
                }
            });
        },
        onConfirmCloseWizard: function () {
            sPrevSourceType = null;
            this._oWizardDialog.close();
            this._oWizardDialog.destroy();
            this._oWizardReviewPage.destroy();
        },
        fnAddDataSourceInformation: function () {
            var oCreationModel = this._oWizardModel.getData();
            var sAction = "INSERT",
                //plant
                sInputPlantId = oCreationModel.plant,
                //source description
                sInputDataSourceName = oCreationModel.sourceName,
                sInputDataSourceDescription = oCreationModel.sourceDescription,
                //server config
                sComboDataServerProcess = oCreationModel.sourceType !== "DS_TYPE_CONTEXTUAL" ? oCreationModel.dataServer : "",
                sComboDataServerProcessType = oCreationModel.sourceType !== "DS_TYPE_CONTEXTUAL" ? oCreationModel.dataServerType : "",
                sComboDataServerContext = oCreationModel.sourceType === "DS_TYPE_CONTEXTUAL" ? oCreationModel.dataServer : "",
                sComboDataServerContextType = oCreationModel.sourceType === "DS_TYPE_CONTEXTUAL" ? oCreationModel.dataServerType : "",
                sComboDataServerFile = oCreationModel.sourceType === "DS_TYPE_FILE" ? oCreationModel.dataServer : "",
                sComboPCoCredential = oCreationModel.pcoCredential,
                sKepwareChannels = oCreationModel.kepChannels ? oCreationModel.kepChannels.join(",") : "",
                sInputPCoPrefix = oCreationModel.pcoPoolPrefix,
                sInputPCoUrl = oCreationModel.pcoUrl,
                //source config
                iSwitchArchive = oCreationModel.sourceType === "DS_TYPE_ARCHIVE" ? 1 : 0,
                iSwitchContextual = oCreationModel.sourceType === "DS_TYPE_CONTEXTUAL" ? 1 : 0,
                iSwitchRealTime = oCreationModel.sourceType === "DS_TYPE_REALTIME" ? 1 : 0,
                iSwitchHistory = (oCreationModel.sourceType === "DS_TYPE_CONTEXTUAL" || oCreationModel.sourceType === "DS_TYPE_ARCHIVE") ? 1 : 0,
                iSwitchFlatFile = oCreationModel.sourceType === "DS_TYPE_FILE" ? 1 : 0,
                iSwitchEngie = oCreationModel.sourceType === "DS_TYPE_ENGIE" ? 1 : 0,
				iSwitchIdoc = oCreationModel.sourceType === "DS_TYPE_IDOC" ? 1 : 0;

            oDialog.open();
            oDialog.setText(oResourceBundle.getText("dsInfoSavingWaitMessage"));
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/DataSourceXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sAction,
                    "Param.2": sInputPlantId,
                    "Param.3": "", //data source id
                    "Param.4": sInputDataSourceName,
                    "Param.5": sInputDataSourceDescription,
                    "Param.6": sComboDataServerProcess,
                    "Param.7": sComboDataServerContext,
                    "Param.8": sComboPCoCredential,
                    "Param.9": sInputPCoPrefix,
                    "Param.10": sInputPCoUrl,
                    "Param.11": iSwitchArchive,
                    "Param.12": iSwitchContextual,
                    "Param.13": iSwitchRealTime,
                    "Param.14": 1, //enabled
                    "Param.15": iSwitchHistory,
                    "Param.16": sComboDataServerContextType,
                    "Param.17": 0, //switch batch catalog
                    "Param.18": "", //batch source
                    "Param.19": "", //equip level
                    "Param.20": sComboDataServerProcessType,
                    "Param.21": sKepwareChannels,
                    "Param.22": "", //batch SQL query
                    "Param.23": iSwitchFlatFile,
                    "Param.24": sComboDataServerFile,
                    "Param.25": iSwitchEngie,
                    "Param.26": 12,
					"Param.27": iSwitchIdoc
                },
                success: function (result) {
                    if (result.Rowsets.Rowset) {
                        var data = result.Rowsets.Rowset[0];
                        var successMsg = data.Row[0].Output;
                        if (successMsg == "{##SUCCESS_MESSAGE}") {
                            successMsg = oResourceBundle.getText("dsInfoSaveSuccess");
                        }
                        oDialog.close();
                        //MessageToast.show(successMsg);
                        if (sAction === "INSERT") {
                            that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                                oResourceBundle.getText("dataSourcesAddDateSourceInfo"),
                                successMsg,
                                "Success");
                        } else {
                            that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                                oResourceBundle.getText("dataSourcesUpdateDateSourceInfo"),
                                successMsg,
                                "Success");
                        }
                        that.fnLoadPlant();
                    } else if (result.Rowsets.FatalError !== undefined) {
                        var errorMsg = result.Rowsets.FatalError;
                        oDialog.close();
                        //MessageToast.show(errorMsg);
                        if (sAction === "INSERT") {
                            that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                                oResourceBundle.getText("dataSourcesAddDateSourceInfo"),
                                errorMsg,
                                "Error");
                        } else {
                            that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                                oResourceBundle.getText("dataSourcesUpdateDateSourceInfo"),
                                errorMsg,
                                "Error");
                        }
                        // Show Dialog if the error is about Kepware channels or duplicate data source
                        var sDialogTitle, sHTMLtext = "";
                        if (errorMsg.startsWith("Channel")) {
                            sDialogTitle = oResourceBundle.getText("dsInfoChannelsRemoveTitle");
                            sHTMLtext = result.Rowsets.FatalError.replace(/'(.+?)'/, "<strong>$1</strong>");
                        } else if (errorMsg.startsWith("Data Source")) {
                            sDialogTitle = oResourceBundle.getText("dsDuplicateDataSource");
                            sHTMLtext = result.Rowsets.FatalError;
                        }
                        if (sHTMLtext.length > 1) {
                            new Dialog({
                                title: sDialogTitle,
                                afterClose: function (oEvent) { this.destroy() },
                                content: [
                                    new sap.m.FormattedText({
                                        htmlText: sHTMLtext
                                    })
                                ],
                                type: "Message",
                                state: "Error",
                                buttons: new sap.m.Button({
                                    text: oResourceBundle.getText("commonClose"),
                                    press: function (oEvent) {
                                        oEvent.getSource().getParent().close();
                                    }
                                })
                            }).open();
                        }
                    }

                }
            });

        },

     fnSynchronizePCoDestinations: function () {
    if (selectedDataSourceID !== "") {
        var that = this;
        var oSyncPCoDestCatalogBtn = this.byId("button-synchronize-pco-destination");
        var type="PCoDest";

        // Disable the button at the start
        oSyncPCoDestCatalogBtn.setEnabled(false);

        // Step 1: Validation check via StopMultipleExecutionBySourceXacuteQuery
        $.ajax({
            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/StopMultipleExecutionBySourceXacuteQuery&Content-Type=text/json",
            async: false,
            data: {
                "Param.1": selectedDataSourceID,
	    "Param.2": type
            },
            success: function (result) {
                if (result.Rowsets.FatalError !== undefined) {
                    that.handleMessage(
                        oResourceBundle.getText("commonTitleDataSources"),
                        oResourceBundle.getText("dataSourcesSynchronizePCoDestinations"),
                        result.Rowsets.FatalError,
                        "Error"
                    );
                    oSyncPCoDestCatalogBtn.setEnabled(true);
                    return;
                }

                var statusMessage = result.Rowsets.Rowset[0].Row[0].StatusMessage;
                if (statusMessage !== "OK") {
                    sap.m.MessageBox.warning(statusMessage);
                    oSyncPCoDestCatalogBtn.setEnabled(true);
                    return;
                }

                // Step 2: Proceed with PCo Destinations synchronization
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/PCoDestinationCatalogDownloadAsyncXacuteQuery&Content-Type=text/json",
                    data: {
                        "Param.1": selectedDataSourceID,
		  "Param.2": type
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            that.handleMessage(
                                oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesSynchronizePCoDestinations"),
                                sErrorMessage,
                                "Error"
                            );
                        } else {
                            oDataSourcesController.getView().byId("messagestrip-download-catalog").setVisible(true);
                            that.handleMessage(
                                oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesSynchronizePCoDestinations"),
                                oResourceBundle.getText("commonInfoSuccess"),
                                "Success"
                            );
                        }
                    },
                    error: function () {
                        oSyncPCoDestCatalogBtn.setEnabled(true);
                    }
                });
            },
            error: function () {
                oSyncPCoDestCatalogBtn.setEnabled(true);
            }
        });
    } else {
        var sErrorMessage = oResourceBundle.getText("dataSourcesSelectDataSourceMsg");
        this.handleMessage(
            oResourceBundle.getText("commonTitleDataSources"),
            oResourceBundle.getText("dataSourcesSynchronizePCoDestinations"),
            sErrorMessage,
            "Error"
        );
    }
},

      fnSynchronizePCoAgents: function () {
    if (selectedDataSourceID !== "") {
        var that = this;
        var oSyncPcoAgentsCatalogBtn = this.byId("button-synchronize-pco-agent");
        var type="PCoAgent";

        // Disable the button at the start
        oSyncPcoAgentsCatalogBtn.setEnabled(false);

        // Step 1: Validation check via StopMultipleExecutionBySourceXacuteQuery
        $.ajax({
            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/StopMultipleExecutionBySourceXacuteQuery&Content-Type=text/json",
            async: false,
            data: {
                "Param.1": selectedDataSourceID,
	     "Param.2": type
            },
            success: function (result) {
                if (result.Rowsets.FatalError !== undefined) {
                    that.handleMessage(
                        oResourceBundle.getText("commonTitleDataSources"),
                        oResourceBundle.getText("dataSourcesSynchronizePCoAgents"),
                        result.Rowsets.FatalError,
                        "Error"
                    );
                    oSyncPcoAgentsCatalogBtn.setEnabled(true);
                    return;
                }

                var statusMessage = result.Rowsets.Rowset[0].Row[0].StatusMessage;
                if (statusMessage !== "OK") {
                    sap.m.MessageBox.warning(statusMessage);
                    oSyncPcoAgentsCatalogBtn.setEnabled(true);
                    return;
                }

                // Step 2: Proceed with PCo Agents synchronization
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/AgentCatalogDownloadAsyncXacuteQuery&Content-Type=text/json",
                    data: {
                        "Param.1": selectedDataSourceID,
		 "Param.2": type
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            that.handleMessage(
                                oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesSynchronizePCoAgents"),
                                sErrorMessage,
                                "Error"
                            );
                            oDialog.close();
                        } else {
                            oDataSourcesController.getView().byId("messagestrip-download-catalog").setVisible(true);
                            that.handleMessage(
                                oResourceBundle.getText("commonTitleDataSources"),
                                oResourceBundle.getText("dataSourcesSynchronizePCoAgents"),
                                oResourceBundle.getText("commonInfoSuccess"),
                                "Success"
                            );
                        }
                    },
                    error: function () {
                        oSyncPcoAgentsCatalogBtn.setEnabled(true);
                    }
                });
            },
            error: function () {
                oSyncPcoAgentsCatalogBtn.setEnabled(true);
            }
        });
    } else {
        var sErrorMessage = oResourceBundle.getText("dataSourcesSelectDataSourceMsg");
        this.handleMessage(
            oResourceBundle.getText("commonTitleDataSources"),
            oResourceBundle.getText("dataSourcesSynchronizePCoAgents"),
            sErrorMessage,
            "Error"
        );
    }
},

        //*    ************************************************************************************* *//
        //*                                 WIZARD LOGIC END BLOC                                    *//
        //*    ************************************************************************************* *//
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");
        },
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>commonLabelPlant}", key: "PLANT", selected: true },
                { text: "{i18n>dataSourcesDS}", key: "DS_NAME" },
                { text: "{i18n>dataSourcesDesc}", key: "DS_DESCRIPTION" },
                { text: "{i18n>dataSourcesDataServerProcess}", key: "DS_MII_DATA_SERVER_PROCESS" },
                { text: "{i18n>dataSourcesDataServerContextual}", key: "DS_MII_DATA_SERVER_CONTEXT" },
                { text: "{i18n>dataSourcesAgents}", key: "AGENT_COUNT" },
                { text: "{i18n>dataSourcesTags}", key: "TAG_COUNT" },
                { text: "{i18n>dataSourcesBatchEquip}", key: "BATCH_COUNT" },
                { text: "{i18n>dataSourcsLastTagListSync}", key: "DT_TAG_LIST_LAST_SYNC" },
                { text: "{i18n>dataSourcesRealtime}", key: "FL_REALTIME" },
                { text: "{i18n>dataSourcesArchive}", key: "FL_ARCHIVE" },
                { text: "{i18n>dataSourcesContext}", key: "FL_CONTEXTUAL" },
                { text: "{i18n>dataSourcesFlatFile}", key: "FL_FLAT_FILE" },
				{ text: "{i18n>dataSourcesIdoc}", key: "FL_IDOC" },
                { text: "{i18n>dataSourcesEnabled}", key: "FL_ENABLED" }
            ];
            if (!this.oSortDialog) {
                var oTable = oEvent.getSource().getParent().getParent(); // Table > Toolbar > Button
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>dataSourcesSort}",
                    sortItems: mViewSettings.map(function (e) { return new sap.m.ViewSettingsItem(e) }),
                    confirm: function (oEvent) {
                        var mParams = oEvent.getParameters();
                        var oBinding = oTable.getBinding("items");

                        var sPath = mParams.sortItem.getKey();
                        var bDescending = mParams.sortDescending;
                        oBinding.sort(new sap.ui.model.Sorter(sPath, bDescending));
                    }
                });
                this.getView().addDependent(this.oSortDialog);
            }
            this.oSortDialog.open();
        }
    });
});
//# sourceURL=https://sapwdawsemea.pharma.aventis.com:9100/XMII/CM/StreamingEngine/StreamingEngine/controller/DataSources.controller.js?eval

//# sourceURL=https://sapdqnjc.pharma.aventis.com:50001/XMII/CM/StreamingEngine/StreamingEngine/controller/DataSources.controller.js?eval