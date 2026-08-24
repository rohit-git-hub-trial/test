/*-----------------------------------------------------------------------------------
Streaming Engine - Contextual Flows
Creation Date: 2020.05.04 / By: E0445955
Reference Document: 
Description:This page is used to bulk upload equipment configuration through a csv file. It displays 
the progress of upload into the database and Processing progress as well
-------------------------------------------------------------------------------------*/
var oBatchCatalogUploadController;
var iNoofRecords;
var iInsertedRecords;
var fPercentValue;
var oFileUploader;
var oDialog;
var oResourceBundle;
var flagAbort = false;
var bShowCommentDialog = true;
var bRefreshAfterUploadNeeded = "N";
sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
    "StreamingEngine/StreamingEngine/model/formatter",
], function (BaseController, MessageToast, Popover, Button, Dialog, Text, formatter) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.BatchCatalogUpload", {
        formatter: formatter,
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
            // // // // 
            iNoofRecords = 0;
            oDialog = this.getView().byId("BusyDialog");
            oBatchCatalogUploadController = this;
            oFileUploader = this.getView().byId("batch-catalog-fileUploader");
            this.getView().byId("batch-catalog-table-equipment-uploaded-data").setModel(this.oModelEquipmentStatusTable);
            sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this._onObjectMatched, this);
            if (bRequireChangeComment) {
                this.oModelChangeMessages = new sap.ui.model.json.JSONModel({ Row: [] });
            }
            this.fnReloadTempTable();
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
                this.getView().byId("batch-catalog-page-equipment-upload").setVisible(true);
            }
            /***********************************************************************/
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("batchCatalogTitleEquipmentExcelUpload"));
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        oModelEquipmentStatusTable: new sap.ui.model.json.JSONModel(),

        fnUploadFile: function () {
            var sImportWaitMessage = oResourceBundle.getText("batchCatalogUploadImportMessage");
            var sNoFileSelected = oResourceBundle.getText("batchCatalogUploadSelectCSV");
            var sWrongFileSelected = oResourceBundle.getText("batchCatalogUploadWrongFileFormat");
            oDialog.open();
            oDialog.setText(sImportWaitMessage);
            iNoofRecords = 0;
            var file = jQuery.sap.domById(oFileUploader.getId() + "-fu").files[0];
            if (!file) {
                MessageToast.show(sNoFileSelected);
                oDialog.close();
                return;
            }
            var a = file.name;

            var len = (a.split(".").length) - 1;

            if ((a.split(".")[len].toLowerCase()) != "csv") {
                MessageToast.show(sWrongFileSelected);
                oDialog.close();
                oFileUploader.setValue("");
                return;
            }

            if (bRequireChangeComment) {
                if (!this.fnValidateChangeComments(a)) {
                    return;
                }
                bShowCommentDialog = true;
            }

            // var BASE64_MARKER = 'data:' + file.type + ';base64,';
            var BASE64_MARKER = ';base64,';

            this.fnPostData(file, BASE64_MARKER);
        },

        fnPostData: function (file, BASE64_MARKER) {
            var reader = new FileReader();

            reader.onload = function (evt) {
                var base64Index = evt.target.result
                    .indexOf(BASE64_MARKER) + BASE64_MARKER.length;

                var sBase64Encoded = evt.target.result.substring(base64Index);
                var sBase64Decoded = atob(sBase64Encoded);
                var lines = sBase64Decoded.split(/\n/).length;

                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogImportXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": sBase64Decoded,
                        "Param.20": document.getElementById("SE_Plant").value,
                        "Param.31": bRequireChangeComment ? oBatchCatalogUploadController.oModelChangeMessages.getData().Row[0].message : undefined
                    },
                    success: function (result) {
                        bRefreshAfterUploadNeeded = "Y";
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            //MessageToast.show(sErrorMessage);
                            oBatchCatalogUploadController.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                                oResourceBundle.getText("batchCatalogImportBatchCatalog"),
                                sErrorMessage,
                                "Error");
                            oDialog.close();
                        }
                        else {
                            iNoofRecords = lines - 2;
                            iInsertedRecords = 0;

                            setTimeout(function () {
                                oBatchCatalogUploadController.fnReloadTempTable();
                            }, 3000);
                        }
                    },
                    error: function () {
                    }
                });

                oFileUploader.setValue("");
            };

            if (file) {
                reader.readAsDataURL(file);
            }
        },

        fnMonitorProgress: function () {
            setTimeout(function () {
                oBatchCatalogUploadController.fnReloadTempTable();
            }, 3000);

        },
        fnMonitorProgressSlowly: function () {
            setTimeout(function () {
                oBatchCatalogUploadController.fnReloadTempTable();
            }, 10000);

        },
        fnReloadTempTable: function () {
            var fPercentValueProcessed;
            var iProcessedEquipment;
            var iFailedEquipment;
            var iPendingEquipment;
            $.ajax({
                async: false,
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogImportStatusXacuteQuery&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.Rowset[0]) {
                        var data = result.Rowsets.Rowset[0];
                        var data2 = result.Rowsets.Rowset[1];
                        if (data2.Row[0].COUNT_UPLOADED == 0) {
                            oBatchCatalogUploadController.getView().byId("batch-catalog-table-equipment-uploaded-data").setVisible(false);
                            oBatchCatalogUploadController.getView().byId("batch-catalog-import-progress-bar").setVisible(false);
                            oBatchCatalogUploadController.getView().byId("batch-catalog-processing-progress-bar").setVisible(false);
                        } else {
                            iInsertedRecords = data2.Row[0].COUNT_UPLOADED;
                            if (iNoofRecords == 0) {
                                iNoofRecords = iInsertedRecords;
                            }
                            oBatchCatalogUploadController.getView().byId("batch-catalog-table-equipment-uploaded-data").setVisible(true);
                            oBatchCatalogUploadController.getView().byId("batch-catalog-import-progress-bar").setVisible(true);
                            oBatchCatalogUploadController.getView().byId("batch-catalog-processing-progress-bar").setVisible(true);
                            iProcessedEquipment = data2.Row[0].COUNT_PROCESSED;
                            iFailedEquipment = data2.Row[0].COUNT_FAILED;
                            iPendingEquipment = data2.Row[0].COUNT_PENDING;
                            fPercentValueProcessed = (iProcessedEquipment / iInsertedRecords) * 100;

                        }
                        oBatchCatalogUploadController.oModelEquipmentStatusTable.setData(data);
                        oBatchCatalogUploadController.oModelEquipmentStatusTable.refresh();

                        if(iProcessedEquipment == iInsertedRecords && data2.Row[0].COUNT_HIERARCHY_CREATION > 0) {
                            oBatchCatalogUploadController.fnCreateHierarchyDialog();
                        }

                        fPercentValue = (iInsertedRecords / iNoofRecords) * 100;
                        var sDisplayValue = iInsertedRecords + " of " + iNoofRecords + " equipment";
                        var sDisplayValueProcessed = iProcessedEquipment + " of " + iInsertedRecords + " equipment";
                        oBatchCatalogUploadController.getView().byId("batch-catalog-import-progress-bar").setPercentValue(fPercentValue);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-import-progress-bar").setDisplayValue(sDisplayValue);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-processing-progress-bar").setPercentValue(fPercentValueProcessed);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-processing-progress-bar").setDisplayValue(sDisplayValueProcessed);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-text-uploaded-equipment").setText(iInsertedRecords);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-text-processed-equipment").setText(iProcessedEquipment);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-text-pending-equipment").setText(iPendingEquipment);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-text-failed-equipment").setText(iFailedEquipment);
                        if (data2.Row[0].COUNT_UPLOADED != 0) {
                            oDialog.close();
                        }
                    }
                    if (flagAbort) {
                        oBatchCatalogUploadController.getView().byId("batch-catalog-import-progress-bar").setPercentValue(0);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-import-progress-bar").setDisplayValue(0);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-processing-progress-bar").setPercentValue(0);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-processing-progress-bar").setDisplayValue(0);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-text-uploaded-equipment").setText("");
                        oBatchCatalogUploadController.getView().byId("batch-catalog-text-processed-equipment").setText("");
                        oBatchCatalogUploadController.getView().byId("batch-catalog-text-pending-equipment").setText("");
                        oBatchCatalogUploadController.getView().byId("batch-catalog-text-failed-equipment").setText("");
                        oBatchCatalogUploadController.getView().byId("batch-catalog-table-equipment-uploaded-data").setVisible(true);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-import-progress-bar").setVisible(true);
                        oBatchCatalogUploadController.getView().byId("batch-catalog-processing-progress-bar").setVisible(true);
                        iInsertedRecords = 0;
                        iNoofRecords = 0;
                        iProcessedEquipment = 0;
                        flagAbort = false;
                    } else {
                        //oDialog.close();
                        if (typeof iInsertedRecords === "undefined") iInsertedRecords = 0;
                        if (typeof iNoofRecords === "undefined") iNoofRecords = 0;
                        if (typeof iProcessedEquipment === "undefined") iProcessedEquipment = 0;
                        if (iInsertedRecords != iNoofRecords) {
                            oBatchCatalogUploadController.fnMonitorProgress();
                        } else if (iProcessedEquipment != iInsertedRecords) {
                            oBatchCatalogUploadController.fnMonitorProgressSlowly();
                        }
                    }
                }
            });
        },

        fnCreateHierarchyDialog: function () {
            if (this.oModelHierarchyAutoCreation == undefined) {
                this.oModelHierarchyAutoCreation = new sap.ui.model.json.JSONModel();
            }
            if (this.oCreateHierarchyDialog == undefined) {
                this.oCreateHierarchyDialog = sap.ui.xmlfragment(this.getView().getId(), "StreamingEngine.StreamingEngine.view.TagUploadHierarchy", this);
                this.getView().byId("table-location-hierarchy").setModel(this.oModelHierarchyAutoCreation);
                this.getView().addDependent(this.oCreateHierarchyDialog);
            }
            var aHierarchy = Array.from(new Set(this.oModelEquipmentStatusTable.getData().Row.filter(e => e.FL_PLANT_HIERARCHY_CREATION === "1").map(e => e.DS_PLANT_HIERARCHY)));
            //safely assume we have one import id in the table
            var sImportID = this.oModelEquipmentStatusTable.getData().Row[0].ID_IMPORT
            this.oModelHierarchyAutoCreation.setProperty("/Row", aHierarchy.map(function (e) { return { "DS_PLANT_HIERARCHY": e, "ID_IMPORT": sImportID } }));
            this.oCreateHierarchyDialog.open();
            this.getView().byId("table-location-hierarchy").removeSelections(true);
        },

        fnCreateForSelectedItems: function () {
            var aSelectedItems = this.getView().byId("table-location-hierarchy").getSelectedContexts();
            if (aSelectedItems.length > 0) {
                this.fnSaveLocationHierarchy(aSelectedItems.map(e => e.getObject().DS_PLANT_HIERARCHY).join("\n"), aSelectedItems[0].getObject().ID_IMPORT);
            } else {
                this.fnSaveLocationHierarchy("", "");
            }
        },

        fnIgnoreAll: function () {
            this.fnSaveLocationHierarchy("", "");
        },

        fnSaveLocationHierarchy: function (sLocationList, sImportID) {
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogImportFailedAutoCreationXacuteQuery&Content-Type=text/json",
                type: "POST",
                data: {
                    "Param.1": sLocationList,
                    "Param.2": sImportID,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.Rowset) {
                        var data = result.Rowsets.Rowset[0];
                        var successMsg = data.Row[0].Output;
                        if (successMsg == "{##SUCCESS_MESSAGE}") {
                            successMsg = oResourceBundle.getText("commonInfoSuccess");
                        }
                        // MessageToast.show(successMsg);
                        oBatchCatalogUploadController.handleMessage(oResourceBundle.getText("batchCatalogTitleEquipmentExcelUpload"),
                            oResourceBundle.getText("batchCatalogImportBatchCatalogCreateHierarchy"),
                            successMsg,
                            "Success");
                        setTimeout(function () {
                            oBatchCatalogUploadController.fnReloadTempTable();
                        }, 100);
                    } else if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        // MessageToast.show(errorMsg);
                        oBatchCatalogUploadController.handleMessage(oResourceBundle.getText("batchCatalogTitleEquipmentExcelUpload"),
                            oResourceBundle.getText("batchCatalogImportBatchCatalogCreateHierarchy"),
                            errorMsg,
                            "Error");
                    }
                }
            });
            this.oCreateHierarchyDialog.close();
        },


        fnAbortFile: function () {
            var BatchCatalogUploadAbortMessage = oResourceBundle.getText("batchCatalogUploadAbortMessage");
            oDialog.setText(BatchCatalogUploadAbortMessage);
            oDialog.open();

            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogImportAbortXacuteQuery&Content-Type=text/json",
                type: "POST",
                async: true,
                data: {

                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                            oResourceBundle.getText("batchCatalogImportBatchCatalog"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        oBatchCatalogUploadController.fnReloadTempTable();
                        flagAbort = true;
                        oDialog.close();
                    }
                },
                error: function () {
                }
            });
        },

        fnLoadEquipmentStatusTable: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogImportStatusXacuteQuery&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                            oResourceBundle.getText("batchCatalogImportBatchCatalog"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oBatchCatalogUploadController.oModelEquipmentStatusTable.setData(data);
                        oBatchCatalogUploadController.oModelEquipmentStatusTable.refresh();
                    }

                }
            });
        },

        fnDownloadFailedItems: function () {
            var url =
                "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogImportDownloadFailedXacuteQuery&Content-Type=text/csv";
            var url_encoded = encodeURI(url);
            window.open(url_encoded, "_blank");
        },

        fnDownloadMisconfiguredItems: function () {
            var url =
                "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogImportDownloadMisconfiguredXacuteQuery&Content-Type=text/csv";
            var url_encoded = encodeURI(url);
            window.open(url_encoded, "_blank");
        },

        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("BatchCatalog", {
                Refresh: bRefreshAfterUploadNeeded
            });
        },
        fnValidateChangeComments: function (sFilename) {
            var oChangeTracker = this.oModelChangeMessages.getData();
            if (oChangeTracker.Row.length != 1) {
                oChangeTracker.Row = [{
                    name: oResourceBundle.getText("commonAll"),
                    old: "---",
                    new: sFilename,
                    message: ""
                }]
            } else {
                if (oChangeTracker.Row[0].new != sFilename) {
                    oChangeTracker.Row[0].new = sFilename;
                    oChangeTracker.Row[0].message = "";
                }
            }
            if (bShowCommentDialog) {
                this.fnChangeCommentDialog();
                return false;
            }
            var bValid = oChangeTracker.Row[0].message.length > 0 && oChangeTracker.Row[0].message.length < 255

            if (!bValid) {
                this.fnChangeCommentDialog();
            }
            return bValid;
        },
        fnChangeCommentDialog: function () {
            var oChangeCommentDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.ChangeMessage", this);
            this.getView().addDependent(oChangeCommentDialog);
            oChangeCommentDialog.attachAfterClose(function (oEvent) {
                this.destroy();
            })
            var that = this;
            oChangeCommentDialog.addButton(new Button({
                text: oResourceBundle.getText("commonSave"),
                press: function () {
                    bShowCommentDialog = false;
                    var aItems = oChangeCommentDialog.getContent().find(e => e.sId === "table-change-messages").getItems();
                    var bValid = true;
                    aItems.forEach(e => {
                        var oInput = e.getCells()[3];
                        if (oInput.getValue().length > 0 && oInput.getValue().length < 255) {
                            oInput.setValueState("None");
                        } else {
                            oInput.setValueState("Error");
                            bValid = false;
                        }
                    });
                    if (bValid) {
                        oBatchCatalogUploadController.fnUploadFile();
                        oChangeCommentDialog.close();
                    } else {
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));

                        that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                            oResourceBundle.getText("commonCheckCommentMessages"),
                            "",
                            "Error");
                    }
                }
            }));
            oChangeCommentDialog.addButton(new Button({
                text: oResourceBundle.getText("commonCancel"),
                press: function () {
                    bShowCommentDialog = true;
                    oChangeCommentDialog.close();
                }
            }));
            oChangeCommentDialog.setModel(this.oModelChangeMessages);
            oChangeCommentDialog.open();
        }
    });
});