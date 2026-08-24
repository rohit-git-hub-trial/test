/*-----------------------------------------------------------------------------------
Streaming Engine - Plant Parameters
Creation Date: 2021.05.11 / By: E0393873
Reference Document: 
Description:Displays all the Plant Parameters in a table
-------------------------------------------------------------------------------------*/
var oPlantParametersController;
var oDialog;
var iAdminIndex = -1;
var iUserIndex = -1;
sap.ui.define([
    "../controller/BaseController",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
], function (BaseController, Popover, Button, Dialog, Text) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.PlantParameters", {
        onInit: function () {
	// set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            //The code in else section executes only if the user have access
            oPlantParametersController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("table-plant-parameters").setModel(this.oModelPlantParameters);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("PlantParameters").attachPatternMatched(this._onObjectMatched, this);
            
        },
        onAfterRendering: function () {
            /******************** Below Part for Authorisation***********************/
            var sRoles = document.getElementById('input-roles').value;
            var sAdminRole = "STREAMING_ENGINE_ADMIN";
            var sUserRole = "STREAMING_ENGINE_USER";
            iAdminIndex = sRoles.indexOf(sAdminRole);
            iUserIndex = sRoles.indexOf(sUserRole);
            if (iAdminIndex < 0) {
                this.fnShowNoAccess();
                return;
            }
            else {
                this.getView().byId("page-plant-parameters").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },

        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitlePlantParameters"));
            var sMode = oEvent.getParameter("arguments").Refresh;
            if (sMode == "Y") {
                oPlantParametersController.fnLoadPlantParameters();
                this.getView().byId("table-plant-parameters").getBinding("items").sort(new sap.ui.model.Sorter("ID_PLANT", false));
                if (this.oSortDialog) {
                    this.oSortDialog.destroy();
                    this.oSortDialog = undefined;
                }
            } else if (sMode == "N") {

            }
        },
        oModelPlantParameters: new sap.ui.model.json.JSONModel(),
        fnFilterPlant: function () {
            this.fnLoadPlantParameters();
        },

        fnLoadPlantParameters: function () {
            oDialog.open();
            var inputPlantId = oPlantParametersController.getView().byId("input-plant-id").getValue();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PlantParameter/Query/PlantParameterListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": inputPlantId,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        that.handleMessage(oResourceBundle.getText("commonTitlePlantParameters"), oResourceBundle.getText("plantParametersLoad"), result.Rowsets.FatalError, "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oPlantParametersController.oModelPlantParameters.setData(data);
                        oPlantParametersController.oModelPlantParameters.refresh();
                    }
                    oDialog.close();
                }
            });
        },
        fnRowPress: function (oEvent) {
            var selectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("PlantInformation", {
                MODE: "U",
                ID_PLANT: selectedItem.ID_PLANT,
                DS_NAME: selectedItem.DS_NAME,
                QT_MAX_TAGS_PER_JOBS: selectedItem.QT_MAX_TAGS_PER_JOBS,
                QT_MAX_TAGS_PER_AGENTS: selectedItem.QT_MAX_TAGS_PER_AGENTS,
                QT_RUN_DURATION_IN_MINS: selectedItem.QT_RUN_DURATION_IN_MINS,
                QT_FLOW_MAX_FILE_SIZE: selectedItem.QT_FLOW_MAX_FILE_SIZE,
                QT_MAX_QUEUE_RETRY: selectedItem.QT_MAX_QUEUE_RETRY,
                QT_ROWCOUNT_RETRY: selectedItem.QT_ROWCOUNT_RETRY,
                QT_AUDIT_LOG_RETENTION: selectedItem.QT_AUDIT_LOG_RETENTION,
                QT_CONNECTION_TIMEOUT: selectedItem.QT_FLOW_TIMEOUT,
                DS_PCO_DESTINATION_NAME: selectedItem.DS_PCO_DESTINATION_NAME,
                QT_WATCH_MAX_DATA_POINT: selectedItem.QT_WATCH_MAX_DATA_POINT,
                QT_WATCH_EXP_CAPTURE_DAYS: selectedItem.QT_WATCH_EXP_CAPTURE_DAYS,
                QT_WATCH_EXP_VISUAL_DAYS: selectedItem.QT_WATCH_EXP_VISUAL_DAYS,
                DS_SEMARCHY_LOCATION_ID: selectedItem.DS_SEMARCHY_LOCATION_ID,
                FL_IS_LOCAL: selectedItem.FL_IS_LOCAL,
                QT_SUCCESS_QUEUE_SIZE: selectedItem.QT_SUCCESS_QUEUE_SIZE,
                QT_HISTORICAL_UPLOAD_MAXIMUM_TAGS: selectedItem.QT_HISTORICAL_UPLOAD_MAXIMUM_TAGS
            });
        },
        fnAddNew: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("PlantInformation", {
                MODE: "I"
            });
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");

        },
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>plantParamsPlantID}", key: "ID_PLANT", selected: true },
                { text: "{i18n>plantParamsName}", key: "DS_NAME" },
                { text: "{i18n>plantParamsTagsPerJob}", key: "QT_MAX_TAGS_PER_JOBS" },
                { text: "{i18n>plantParamsTagsPerAgent}", key: "QT_MAX_TAGS_PER_AGENTS" },
                { text: "{i18n>plantParamsJobDuration}", key: "QT_RUN_DURATION_IN_MINS" },
                { text: "{i18n>plantParamsMaxQueueRetry}", key: "QT_MAX_QUEUE_RETRY" },
                { text: "{i18n>plantParamsRowCountRetry}", key: "QT_ROWCOUNT_RETRY" },
                { text: "{i18n>plantInfoSuccessQueueSize}", key: "QT_SUCCESS_QUEUE_SIZE" },
                { text: "{i18n>plantParamsFlowTimeout}", key: "QT_FLOW_TIMEOUT" },
                { text: "{i18n>plantParamsFlowMaxFileSizeKB}", key: "QT_FLOW_MAX_FILE_SIZE" },
            ];
            var oTable = oEvent.getSource().getParent().getParent(); // Table > Toolbar > Button
            if (!this.oSortDialog) {
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>plantParameterSort}",
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