/*-----------------------------------------------------------------------------------
Streaming Engine - Manual Import Upload
-------------------------------------------------------------------------------------*/
var oManualImportUploadController;
var iNoofRecords;
var iInsertedRecords;
var fPercentValue;
var oFileUploader;
var oDialog;
var oResourceBundle;
var flagAbort = false;
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

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.ManualImportUpload", {
        formatter: formatter,
        onInit: function () {
            // set message manager model //
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
            ////////////////////////////////
            iNoofRecords = 0;
            oDialog = this.getView().byId("BusyDialog");
            oManualImportUploadController = this;
            oFileUploader = this.getView().byId("manual-import-fileUploader");
            this.getView().byId("manual-import-table-record-uploaded-data").setModel(this.oModelRecordStatusTable);
            sap.ui.core.UIComponent.getRouterFor(this).getRoute("ManualImportUpload").attachPatternMatched(this._onObjectMatched, this);
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
                this.getView().byId("manual-import-page-record-upload").setVisible(true);
            }
            /***********************************************************************/
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("manualImportTitleCSVUpload"));
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        oModelRecordStatusTable: new sap.ui.model.json.JSONModel(),

        fnUploadFile: function () {
            var sImportWaitMessage = oResourceBundle.getText("manualImportUploadImportMessage");
            var sNoFileSelected = oResourceBundle.getText("manualImportUploadSelectCSV");
            var sWrongFileSelected = oResourceBundle.getText("manualImportUploadWrongFileFormat");
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

            // var BASE64_MARKER = 'data:' + file.type + ';base64,';
            var BASE64_MARKER = ';base64,';

            this.fnPostData(file, BASE64_MARKER, a);
        },

        fnPostData: function (file, BASE64_MARKER, fineName) {
            var reader = new FileReader();

            reader.onload = function (evt) {
                var base64Index = evt.target.result
                    .indexOf(BASE64_MARKER) + BASE64_MARKER.length;

                var sBase64Encoded = evt.target.result.substring(base64Index);
                var sBase64Decoded = atob(sBase64Encoded);
                var lines = sBase64Decoded.split(/\n/).length;

                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/ManualImport/Query/ManualImportUploadXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": sBase64Decoded,
                        "Param.2": fineName,
                        "Param.20": document.getElementById("SE_Plant").value
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            //MessageToast.show(sErrorMessage);
                            oManualImportUploadController.handleMessage(oResourceBundle.getText("manualImportTitleCSVUpload"),
                                oResourceBundle.getText("manualImportPostData"),
                                sErrorMessage,
                                "Error");
                            oDialog.close();
                            new Dialog({
                                title: oResourceBundle.getText("queueMonitoringErrorMessage"),
                                afterClose: function (oEvent) { this.destroy() },
                                content: [
                                    new sap.m.Text({
                                        text: result.Rowsets.FatalError
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
                        else {
                            iNoofRecords = lines - 2;
                            iInsertedRecords = 0;

                            setTimeout(function () {
                                oManualImportUploadController.fnReloadTempTable();
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
                oManualImportUploadController.fnReloadTempTable();
            }, 3000);

        },
        fnMonitorProgressSlowly: function () {
            setTimeout(function () {
                oManualImportUploadController.fnReloadTempTable();
            }, 10000);

        },
        fnReloadTempTable: function () {
            var fPercentValueProcessed;
            var iProcessedRecord;
            var iFailedRecord;
            var iPendingRecord;
            $.ajax({
                async: false,
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/ManualImport/Query/ManualImportUploadStatusXacuteQuery&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.Rowset[0]) {
                        var data = result.Rowsets.Rowset[0];
                        var data2 = result.Rowsets.Rowset[1];
                        if (data2.Row[0].COUNT_UPLOADED == 0) {
                            oManualImportUploadController.getView().byId("manual-import-table-record-uploaded-data").setVisible(false);
                            oManualImportUploadController.getView().byId("manual-import-import-progress-bar").setVisible(false);
                            oManualImportUploadController.getView().byId("manual-import-processing-progress-bar").setVisible(false);
                        } else {
                            iInsertedRecords = data2.Row[0].COUNT_UPLOADED;
                            if (iNoofRecords == 0) {
                                iNoofRecords = iInsertedRecords;
                            }
                            oManualImportUploadController.getView().byId("manual-import-table-record-uploaded-data").setVisible(true);
                            oManualImportUploadController.getView().byId("manual-import-import-progress-bar").setVisible(true);
                            oManualImportUploadController.getView().byId("manual-import-processing-progress-bar").setVisible(true);
                            iProcessedRecord = data2.Row[0].COUNT_PROCESSED;
                            iFailedRecord = data2.Row[0].COUNT_FAILED;
                            iPendingRecord = data2.Row[0].COUNT_PENDING;
                            fPercentValueProcessed = (iProcessedRecord / iInsertedRecords) * 100;

                        }
                        oManualImportUploadController.oModelRecordStatusTable.setData(data);
                        oManualImportUploadController.oModelRecordStatusTable.refresh();
                        if (iInsertedRecords > iNoofRecords) iNoofRecords = iInsertedRecords;
                        fPercentValue = (iInsertedRecords / iNoofRecords) * 100;
                        var sDisplayValue = iInsertedRecords + " of " + iNoofRecords + " rows";
                        var sDisplayValueProcessed = iProcessedRecord + " of " + iInsertedRecords + " rows";
                        oManualImportUploadController.getView().byId("manual-import-import-progress-bar").setPercentValue(fPercentValue);
                        oManualImportUploadController.getView().byId("manual-import-import-progress-bar").setDisplayValue(sDisplayValue);
                        oManualImportUploadController.getView().byId("manual-import-processing-progress-bar").setPercentValue(fPercentValueProcessed);
                        oManualImportUploadController.getView().byId("manual-import-processing-progress-bar").setDisplayValue(sDisplayValueProcessed);
                        oManualImportUploadController.getView().byId("manual-import-text-uploaded-record").setText(iInsertedRecords);
                        oManualImportUploadController.getView().byId("manual-import-text-processed-record").setText(iProcessedRecord);
                        oManualImportUploadController.getView().byId("manual-import-text-pending-record").setText(iPendingRecord);
                        oManualImportUploadController.getView().byId("manual-import-text-failed-record").setText(iFailedRecord);
                        if (data2.Row[0].COUNT_UPLOADED != 0) {
                            oDialog.close();
                        }
                    }
                    if (flagAbort) {
                        oManualImportUploadController.getView().byId("manual-import-import-progress-bar").setPercentValue(0);
                        oManualImportUploadController.getView().byId("manual-import-import-progress-bar").setDisplayValue(0);
                        oManualImportUploadController.getView().byId("manual-import-processing-progress-bar").setPercentValue(0);
                        oManualImportUploadController.getView().byId("manual-import-processing-progress-bar").setDisplayValue(0);
                        oManualImportUploadController.getView().byId("manual-import-text-uploaded-record").setText("");
                        oManualImportUploadController.getView().byId("manual-import-text-processed-record").setText("");
                        oManualImportUploadController.getView().byId("manual-import-text-pending-record").setText("");
                        oManualImportUploadController.getView().byId("manual-import-text-failed-record").setText("");
                        oManualImportUploadController.getView().byId("manual-import-table-record-uploaded-data").setVisible(true);
                        oManualImportUploadController.getView().byId("manual-import-import-progress-bar").setVisible(true);
                        oManualImportUploadController.getView().byId("manual-import-processing-progress-bar").setVisible(true);
                        iInsertedRecords = 0;
                        iNoofRecords = 0;
                        iProcessedRecord = 0;
                        flagAbort = false;
                    } else {
                        //oDialog.close();
                        if (typeof iInsertedRecords === "undefined") iInsertedRecords = 0;
                        if (typeof iNoofRecords === "undefined") iNoofRecords = 0;
                        if (typeof iProcessedRecord === "undefined") iProcessedRecord = 0;
                        if (iInsertedRecords != iNoofRecords) {
                            oManualImportUploadController.fnMonitorProgress();
                        } else if (iProcessedRecord != iInsertedRecords) {
                            oManualImportUploadController.fnMonitorProgressSlowly();
                        }
                    }
                }
            });
        },

        fnAbortFile: function () {
            var ManualImportUploadAbortMessage = oResourceBundle.getText("manualImportUploadAbortMessage");
            oDialog.setText(ManualImportUploadAbortMessage);
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/ManualImport/Query/ManualImportUploadAbortXacuteQuery&Content-Type=text/json",
                type: "POST",
                async: true,
                data: {

                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("manualImportTitleCSVUpload"),
                            oResourceBundle.getText("manualImportAbortFile"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        oManualImportUploadController.fnReloadTempTable();
                        flagAbort = true;
                        oDialog.close();
                    }
                },
                error: function () {
                }
            });
        },

        fnLoadRecordStatusTable: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/ManualImport/Query/ManualImportUploadStatusXacuteQuery&Content-Type=text/json",

                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("manualImportTitleCSVUpload"),
                            oResourceBundle.getText("manualImportLoadRecordStatus"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oManualImportUploadController.oModelRecordStatusTable.setData(data);
                        oManualImportUploadController.oModelRecordStatusTable.refresh();
                    }
                }
            });
        },

        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("ManualImport");

        }
    });
});