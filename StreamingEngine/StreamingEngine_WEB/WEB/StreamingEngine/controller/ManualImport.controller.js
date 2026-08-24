/*-----------------------------------------------------------------------------------
Streaming Engine - Manual Import
-------------------------------------------------------------------------------------*/
var oManualImportController;
var oDialog;
var oResourceBundle;
var initFinished = false;
var selectedImportItem;

sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageToast",
    'sap/ui/model/Sorter',
    "StreamingEngine/StreamingEngine/model/formatter",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text"
    ,
], function (BaseController, MessageToast, Sorter, formatter, Popover, Button, Dialog, Text) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.ManualImport", {
        formatter: formatter,
        onInit: function () {
  	// set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
	
            oManualImportController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("table-manual-import").setModel(this.oModelManualImport);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ManualImport").attachPatternMatched(this._onObjectMatched, this);
            this.mGroupFunctions = {
                PLANT: function (oContext) {
                    var plant = oContext.getProperty("PLANT");
                    return {
                        key: plant,
                        text: plant
                    };
                },
                SOURCE_NAME: function (oContext) {
                    var source = oContext.getProperty("SOURCE_NAME");
                    return {
                        key: source,
                        text: source
                    };
                }
            };
          
        },
        onAfterRendering: function () {
            oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            /******************** Below Part for Authorisation***********************/
            var sRoles = document.getElementById('input-roles').value;
            var sAdminRole = "STREAMING_ENGINE_ADMIN";
            var sUserRole = "STREAMING_ENGINE_USER";
            var iAdminIndex = sRoles.indexOf(sAdminRole);
            var iUserIndex = sRoles.indexOf(sUserRole);
            if (iAdminIndex < 0 && iUserIndex < 0) {
                this.fnShowNoAccess();
                return;
            } else {
                this.getView().byId("page-manual-import").setVisible(true);
                if (iAdminIndex > 0) {

                }
                else {

                }
            }
            /***********************************************************************/
            initFinished = true;
            oManualImportController.fnLoadManualImport();
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function () {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleManualImport"));
            //this function executes every time you navigate to this page
            oManualImportController.fnLoadManualImport();
            this.getView().byId("table-manual-import").getBinding("items").sort(new sap.ui.model.Sorter("DS_FILE_NAME", false));
            if (this.oSortDialog) {
                this.oSortDialog.destroy();
                this.oSortDialog = undefined;
            }
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");

        },

        oModelManualImport: new sap.ui.model.json.JSONModel(),

        onSearch: function () {
            this.fnLoadManualImport();
        },

        fnImportFromExcel: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("ManualImportUpload");
        },

        fnExportToExcel: function () {
            var url =
                "/XMII/Illuminator?QueryTemplate=StreamingEngine/ManualImport/Query/ManualImportCSVTemplateXacuteQuery&Content-Type=text/csv&RowCount=200000";
            var url_encoded = encodeURI(url);
            window.open(url_encoded, "_blank");
        },

        fnRowDelete: function (oEvent) {
            var selectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            var importID = selectedItem.ID_IMPORT;
            var fileName = selectedItem.DS_FILE_NAME;
            var dialog = new Dialog({
                title: 'Confirm',
                type: 'Message',
                content: new Text({
                    text: 'Are you sure you want to delete the CSV file ' + fileName + '?'
                }),
                beginButton: new Button({
                    text: 'Yes',
                    press: function () {
                        oManualImportController.fnRowDeleteConfirmed(importID);
                        dialog.close();
                    }
                }),
                endButton: new Button({
                    text: 'No',
                    press: function () {
                        dialog.close();
                    }
                }),
                afterClose: function () {
                    dialog.destroy();
                }
            });

            dialog.open();
        },

        fnRowDeleteConfirmed: function (importID) {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/ManualImport/Query/ManualImportDeleteXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": importID
                },
                success: function (result) {
                    if (result.Rowsets.Rowset) {
                        var data = result.Rowsets.Rowset[0];
                        var successMsg = data.Row[0].Output;
                        if (successMsg == "{##SUCCESS_MESSAGE}") {
                            successMsg = oResourceBundle.getText("commonInfoSuccess");
                        }
                        //MessageToast.show(successMsg);
                        that.handleMessage(oResourceBundle.getText("commonTitleManualImport"),
                            oResourceBundle.getText("manualImportDeleteCSVFile"),
                            successMsg,
                            "Success");
                        oManualImportController.fnLoadManualImport();
                    } else if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        oDialog.close();
                        //MessageToast.show(errorMsg);
                        that.handleMessage(oResourceBundle.getText("commonTitleManualImport"),
                            oResourceBundle.getText("manualImportDeleteCSVFile"),
                            errorMsg,
                            "Error");
                    }
                }
            });
        },

        fnLoadManualImport: function () {
            if (!initFinished) return false;
            var sBatchsLoading = oResourceBundle.getText("manualImportLoadingText");
            oDialog.setText(sBatchsLoading);
            this.showBusyIndicator();
            var UserName = document.getElementById("input-username").value;
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/ManualImport/Query/ManualImportListSelectQuery&Param.1=" + UserName + "&Content-Type=text/json",
                data: {

                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleManualImport"),
                            "",
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oManualImportController.oModelManualImport.setData(data);
                        oManualImportController.oModelManualImport.refresh();
                        oManualImportController.getView().byId("table-manual-import").removeSelections(true);
                        oManualImportController.hideBusyIndicator();
                    }
                }
            });
        },

        hideBusyIndicator: function () {
            oDialog.close();
        },

        showBusyIndicator: function () {
            oDialog.open();
        },
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>commonFileName}", key: "DS_FILE_NAME", selected: true },
                { text: "{i18n>commonUploadDate}", key: "DT_UPLOAD" },
                { text: "{i18n>commonUsername}", key: "DS_USERNAME" },
                { text: "{i18n>commonRunningJobs}", key: "RUNNING_JOBS" },
                { text: "{i18n>commonPendingQueue}", key: "PENDING_QUEUE" },
                { text: "{i18n>commonPendingRecords}", key: "PENDING_RECORDS" },
                { text: "{i18n>commonStatus}", key: "DS_STATUS" },
                { text: "{i18n>commonMessage}", key: "DS_MESSAGE" }
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