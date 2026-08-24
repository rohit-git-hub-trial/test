/*-----------------------------------------------------------------------------------
Streaming Engine - Archive Flows
Creation Date: 2020.05.27 / By: E0445955
Reference Document: 
Description:This screen is used to view all the available archive flows
-------------------------------------------------------------------------------------*/
var oArchiveFlowsController;
var selectedArchiveFlowPlant;
var selectedArchiveFlowDataSource;
var oDialog;
var selectedArchiveFlowID = "";
var selectedArchiveFlowTypeUpper = "";
var oResourceBundle;
sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
], function (BaseController, MessageToast, Popover, Button, Dialog, Text) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.ArchiveFlows", {
        onInit: function () {
 	// set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oArchiveFlowsController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            this.getView().byId("table-archive-flows").setModel(this.oModelArchiveFlows);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ArchiveFlows").attachPatternMatched(this._onObjectMatched, this);
           
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
                this.getView().byId("page-archive-flows").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            oArchiveFlowsController.getView().byId("messagestrip-run-flow-manually").setVisible(false);
            var sMode = oEvent.getParameter("arguments").Refresh;
            if (sMode == "Y") {
                oArchiveFlowsController.fnLoadPlant();
                this.getView().byId("table-archive-flows").getBinding("items").sort(new sap.ui.model.Sorter("PLANT", false));
                if (this.oSortDialog) {
                    this.oSortDialog.destroy();
                    this.oSortDialog = undefined;
                }
            } else if (sMode == "N") {
            }
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleArchiveFlow"));
        },
        oModelPlant: new sap.ui.model.json.JSONModel(),
        oModelDataSource: new sap.ui.model.json.JSONModel(),
        oModelArchiveFlows: new sap.ui.model.json.JSONModel(),
        fnLoadPlant: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlow"),
                            oResourceBundle.getText("dataSourcesLoadPlantsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        data.Row.unshift({ DS_NAME: oResourceBundle.getText("commonAll"), ID_PLANT: "%" });
                        oArchiveFlowsController.oModelPlant.setData(data);
                        oArchiveFlowsController.oModelPlant.refresh();
                        oArchiveFlowsController.getView().byId("combobox-plant").setSelectedKey("%");
                        //oArchiveFlowsController.fnLoadArchiveFlows();
                        oArchiveFlowsController.fnPlantSelected();
                    }
                }
            });
        },
        fnPlantSelected: function () {
            this.fnLoadDataSource();
        },
        fnLoadDataSource: function () {
            var sselectedArchiveFlowPlant = oArchiveFlowsController.getView().byId("combobox-plant").getSelectedKey();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sselectedArchiveFlowPlant,
                    "Param.3": 1,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlow"),
                            oResourceBundle.getText("dataSourcesLoadDataSources"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        try {
                            data.Row.unshift({ DS_NAME: oResourceBundle.getText("commonAll"), ID_SOURCE: "%" });
                        } catch (err) { };
                        oArchiveFlowsController.oModelDataSource.setData(data);
                        oArchiveFlowsController.oModelDataSource.refresh();
                        oArchiveFlowsController.getView().byId("combobox-data-source").setSelectedKey("%");
                        oArchiveFlowsController.fnLoadArchiveFlows();
                    }
                }
            });
        },
        onSearch: function () {
            this.fnLoadArchiveFlows();
        },
        fnLoadArchiveFlows: function () {
            oDialog.open();
            selectedArchiveFlowPlant = oArchiveFlowsController.getView().byId("combobox-plant").getSelectedKey();
            selectedArchiveFlowDataSource = oArchiveFlowsController.getView().byId("combobox-data-source").getSelectedKey();
            var sArchiveFlow = oArchiveFlowsController.getView().byId("input-data-flow").getValue();
            var sArchiveFlowFilter = "%" + sArchiveFlow.replace(/ /gi, '%') + "%";
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ArchiveFlowListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": selectedArchiveFlowPlant,
                    "Param.2": selectedArchiveFlowDataSource,
                    "Param.3": sArchiveFlowFilter,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlow"),
                            oResourceBundle.getText("flowLoadArchiveFlowsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oArchiveFlowsController.oModelArchiveFlows.setData(data);
                        oArchiveFlowsController.oModelArchiveFlows.refresh();
                        oDialog.close();
                    }
                }
            });
        },
        fnRowPress: function (oEvent) {
            var oPath = oEvent.getSource().getBindingContextPath();
            var selectedItem = oEvent.getSource().getBindingContext().oModel.getProperty(oPath);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("ArchiveInformation", {
                MODE: "U",
                ID_DATA_FLOW: selectedItem.ID_DATA_FLOW,
                ID_SOURCE: selectedItem.ID_SOURCE,
                PLANT: selectedItem.PLANT,
                ID_DATA_DESTINATION: selectedItem.ID_DATA_DESTINATION,
 	    DESTINATION_NAME: encodeURIComponent(selectedItem.DESTINATION_NAME),
                DESTINATION_ENABLED: selectedItem.DESTINATION_ENABLED,
                SOURCE_NAME: selectedItem.SOURCE_NAME,
                FLOW_TYPE: selectedItem.FLOW_TYPE,
                DS_NAME: selectedItem.DS_NAME,
                DS_DESCRIPTION: selectedItem.DS_DESCRIPTION,
                FL_COMPRESSED: selectedItem.FL_COMPRESSED,
                FL_ENABLED: selectedItem.FL_ENABLED
            });
        },
        fnSelectionChanged: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            selectedArchiveFlowID = oSelectedItem.ID_DATA_FLOW;
            var sFlowType = oSelectedItem.FLOW_TYPE;
            selectedArchiveFlowTypeUpper = sFlowType.toUpperCase();
        },
        fnRunFlowManually: function () {
            if (selectedArchiveFlowID != "" && selectedArchiveFlowTypeUpper != "") {
                var that = this;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/EngineExecution_JobXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    async: true,
                    data: {
                        "Param.1": selectedArchiveFlowTypeUpper,
                        "Param.2": selectedArchiveFlowID
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            //MessageToast.show(sErrorMessage);
                            that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlow"),
                                oResourceBundle.getText("flowRunManually"),
                                sErrorMessage,
                                "Error");
                            oDialog.close();
                        } else {
                            oArchiveFlowsController.getView().byId("messagestrip-run-flow-manually").setVisible(true);
                            that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlow"),
                                oResourceBundle.getText("flowRunManually"),
                                oResourceBundle.getText("commonBackgroundProcessMessage"),
                                "Success");
                        }
                    },
                    error: function () {

                    }
                });
            } else {
                var sErrorMessage = oResourceBundle.getText("flowSelectArchiveFlow");
                //MessageToast.show(sErrorMessage);
                this.handleMessage(oResourceBundle.getText("commonTitleArchiveFlow"),
                    oResourceBundle.getText("flowRunManually"),
                    sErrorMessage,
                    "Error");
            }

        },
        fnAddNew: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("ArchiveInformation", {
                MODE: "I"
            });
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");

        },
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>commonLabelPlant}", key: "PLANT", selected: true },
                { text: "{i18n>flowDS}", key: "SOURCE_NAME" },
                { text: "{i18n>flowType}", key: "FLOW_TYPE" },
                { text: "{i18n>flowName}", key: "DS_NAME" },
                { text: "{i18n>flowDesc}", key: "DS_DESCRIPTION" },
                { text: "{i18n>flowCompressed}", key: "FL_COMPRESSED" },
                { text: "{i18n>flowEnabled}", key: "FL_ENABLED" },
            ];
            var oTable = oEvent.getSource().getParent().getParent(); // Table > Toolbar > Button
            if (!this.oSortDialog) {
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>flowArchiveSort}",
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