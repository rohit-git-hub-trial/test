/*-----------------------------------------------------------------------------------
Streaming Engine - Contextual Flows
Creation Date: 2020.05.04 / By: E0445955
Reference Document: 
Description:This page is used to bulk upload tags configuration through a csv file. It displays 
the progress of upload into the database and Processing progress as well
-------------------------------------------------------------------------------------*/
var oTagUploadController;
var iNoofRecords;
var iInsertedRecords;
var fPercentValue;
var oFileUploader;
var oDialog;
var oResourceBundle;
var flagAbort = false;
var bShowCommentDialog = true;
sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/m/MessageBox",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
    "StreamingEngine/StreamingEngine/model/formatter"
], function (BaseController, MessageToast, Popover, MessageBox, Button, Dialog, Text, formatter) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.TagUpload", {
        formatter: formatter,
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
            // // //
            iNoofRecords = 0;
            oDialog = this.getView().byId("BusyDialog");
            oTagUploadController = this;
            oFileUploader = this.getView().byId("fileUploader");
            this.getView().byId("table-tag-uploaded-data").setModel(this.oModelTagStatusTable);
            sap.ui.core.UIComponent.getRouterFor(this).getRoute("TagUpload").attachPatternMatched(this._onObjectMatched, this);
            if (bRequireChangeComment) {
                this.oModelChangeMessages = new sap.ui.model.json.JSONModel({ Row: [] });
            }
	this.oModelLocationHierarchyAutoCreation = new sap.ui.model.json.JSONModel();
            this.oModelLocationHierarchyAutoCreation.setSizeLimit(1000000);
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
                this.getView().byId("page-tag-upload").setVisible(true);
            }
            /***********************************************************************/
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleTagExcelUpload"));
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },

        oModelTagStatusTable: new sap.ui.model.json.JSONModel(),
        

        fnUploadFile: function () {
            var sImportWaitMessage = oResourceBundle.getText("tagUploadImportMessage");
            var sNoFileSelected = oResourceBundle.getText("tagUploadSelectCSV");
            var sWrongFileSelected = oResourceBundle.getText("tagUploadWrongFileFormat");
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
                    oDialog.close();
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
            var that = this;
            reader.onload = function (evt) {
                var base64Index = evt.target.result
                    .indexOf(BASE64_MARKER) + BASE64_MARKER.length;

                var sBase64Encoded = evt.target.result.substring(base64Index);
                var sBase64Decoded = atob(sBase64Encoded);
                var lines = sBase64Decoded.split(/\n/).length;
                var sPlant = document.getElementById("SE_Plant").value;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagImportXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": sBase64Encoded,
                        "Param.20": sPlant,
                        "Param.31": bRequireChangeComment ? oTagUploadController.oModelChangeMessages.getData().Row[0].message : undefined
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            //MessageToast.show(sErrorMessage);
                            oTagUploadController.handleMessage(oResourceBundle.getText("commonTitleTagExcelUpload"),
                                oResourceBundle.getText("tagUploadTagImport"),
                                sErrorMessage,
                                "Error");
                            oDialog.close();
                        } else {
  

  var splantFile = result.Rowsets.Rowset[0].Row[0].PlantFile;
var sDefaultDestination = result.Rowsets.Rowset[0].Row[0].DefaultDestination;
var sImportID = result.Rowsets.Rowset[0].Row[0].ImportID;
var bFlagRealTime = result.Rowsets.Rowset[0].Row[0].Flag_RealTime;

if(bFlagRealTime){
if (!sDefaultDestination || sDefaultDestination.trim() === "") {
    MessageBox.warning(
        "No default destination is configured for plant " + splantFile + ".",
        {
            actions: [MessageBox.Action.OK],
            onClose: function () {
                oDialog.close();
            }
        }
    );
} else {
    MessageBox.confirm(
        "The Realtime default destination for the plant " + splantFile + " is: " + sDefaultDestination + ". Would you like to proceed?",
        {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (sAction) {
                if (sAction === "YES") {
                    that.fnAfterCheckImport(sImportID, 1, sPlant, lines);
                } else {
                    that.fnAfterCheckImport(sImportID, 0, sPlant, lines);
                    oDialog.close();
                }
            }
        }
    );
}
}else{
    that.fnAfterCheckImport(sImportID, 1, sPlant, lines);
}
                                }            },
                    
                });

                oFileUploader.setValue("");
            };

            if (file) {
                reader.readAsDataURL(file);
            }
        },
        fnAfterCheckImport: function (ImportID, FlagImport, SE_PLANT, lines) {
            $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagImportAfterCheckXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": ImportID,
                        "Param.2": FlagImport,
                        "Param.3": SE_PLANT
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            //MessageToast.show(sErrorMessage);
                            oTagUploadController.handleMessage(oResourceBundle.getText("commonTitleTagExcelUpload"),
                                oResourceBundle.getText("tagUploadTagImport"),
                                sErrorMessage,
                                "Error");
                            oDialog.close();
                        } else {
    iNoofRecords = lines - 2;
    iInsertedRecords = 0;

    setTimeout(function () {
                        oTagUploadController.fnReloadTempTable();
                    }, 3000);
   
}
                    },
                    
                });
        },

        fnMonitorProgress: function () {
            setTimeout(function () {
                oTagUploadController.fnReloadTempTable();
            }, 3000);

        },
        fnMonitorProgressSlowly: function () {
            setTimeout(function () {
                oTagUploadController.fnReloadTempTable();
            }, 10000);

        },
        fnReloadTempTable: function () {
            var fPercentValueProcessed;
            var iProcessedTags;
            var iFailedTags;
            var iPendingtags;
            $.ajax({
                async: false,
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagImportStatusXacuteQuery&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.Rowset[0]) {
                        var data = result.Rowsets.Rowset[0];
                        var data2 = result.Rowsets.Rowset[1];
                        if (data2.Row[0].COUNT_UPLOADED == 0) {
                            oTagUploadController.getView().byId("table-tag-uploaded-data").setVisible(false);
                            oTagUploadController.getView().byId("tag-import-progress-bar").setVisible(false);
                            oTagUploadController.getView().byId("processing-progress-bar").setVisible(false);
                        } else {
                            iInsertedRecords = data2.Row[0].COUNT_UPLOADED;
                            if (iNoofRecords == 0) {
                                iNoofRecords = iInsertedRecords;
                            }
                            oTagUploadController.getView().byId("table-tag-uploaded-data").setVisible(true);
                            oTagUploadController.getView().byId("tag-import-progress-bar").setVisible(true);
                            oTagUploadController.getView().byId("processing-progress-bar").setVisible(true);
                            iProcessedTags = data2.Row[0].COUNT_PROCESSED;
                            iFailedTags = data2.Row[0].COUNT_FAILED;
                            iPendingtags = data2.Row[0].COUNT_PENDING;
                            fPercentValueProcessed = (iProcessedTags / iInsertedRecords) * 100;

                        }
                        oTagUploadController.oModelTagStatusTable.setData(data);
                        oTagUploadController.oModelTagStatusTable.refresh();
                        if (iInsertedRecords > iNoofRecords) iNoofRecords = iInsertedRecords;
                        fPercentValue = (iInsertedRecords / iNoofRecords) * 100;
                        var sDisplayValue = iInsertedRecords + " of " + iNoofRecords + " tags";
                        var sDisplayValueProcessed = iProcessedTags + " of " + iInsertedRecords + " tags";
                        oTagUploadController.getView().byId("tag-import-progress-bar").setPercentValue(fPercentValue);
                        oTagUploadController.getView().byId("tag-import-progress-bar").setDisplayValue(sDisplayValue);
                        oTagUploadController.getView().byId("processing-progress-bar").setPercentValue(fPercentValueProcessed);
                        oTagUploadController.getView().byId("processing-progress-bar").setDisplayValue(sDisplayValueProcessed);
                        oTagUploadController.getView().byId("text-uploaded-tags").setText(iInsertedRecords);
                        oTagUploadController.getView().byId("text-processed-tags").setText(iProcessedTags);
                        oTagUploadController.getView().byId("text-pending-tags").setText(iPendingtags);
                        oTagUploadController.getView().byId("text-failed-tags").setText(iFailedTags);
                        if (data2.Row[0].COUNT_UPLOADED != 0) {
                            oDialog.close();
                        }
                        if (iProcessedTags == iInsertedRecords && data2.Row[0].COUNT_HIERARCHY_CREATION > 0) {
                            oTagUploadController.fnCreateHierarchyPopUp();
                        }
                    }
                    if (flagAbort) {
                        oTagUploadController.getView().byId("tag-import-progress-bar").setPercentValue(0);
                        oTagUploadController.getView().byId("tag-import-progress-bar").setDisplayValue(0);
                        oTagUploadController.getView().byId("processing-progress-bar").setPercentValue(0);
                        oTagUploadController.getView().byId("processing-progress-bar").setDisplayValue(0);
                        oTagUploadController.getView().byId("text-uploaded-tags").setText("");
                        oTagUploadController.getView().byId("text-processed-tags").setText("");
                        oTagUploadController.getView().byId("text-pending-tags").setText("");
                        oTagUploadController.getView().byId("text-failed-tags").setText("");
                        oTagUploadController.getView().byId("table-tag-uploaded-data").setVisible(true);
                        oTagUploadController.getView().byId("tag-import-progress-bar").setVisible(true);
                        oTagUploadController.getView().byId("processing-progress-bar").setVisible(true);
                        iInsertedRecords = 0;
                        iNoofRecords = 0;
                        iProcessedTags = 0;
                        flagAbort = false;
                    } else {
                        //oDialog.close();
                        if (typeof iInsertedRecords === "undefined") iInsertedRecords = 0;
                        if (typeof iNoofRecords === "undefined") iNoofRecords = 0;
                        if (typeof iProcessedTags === "undefined") iProcessedTags = 0;
                        if (iInsertedRecords != iNoofRecords) {
                            oTagUploadController.fnMonitorProgress();
                        } else if (iProcessedTags != iInsertedRecords) {
                            oTagUploadController.fnMonitorProgressSlowly();
                        }
                    }
                }
            });
        },

        fnLoadHierarchyPopUp: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagImportFailedAutoCreationSelectQuery&Content-Type=text/json",
                type: "POST",
                async: false,
                data: {
                    "Param.1": document.getElementById("input-username").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleTagExcelUpload"),
                            oResourceBundle.getText("tagUploadTagImport"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        that.oModelLocationHierarchyAutoCreation.setData(data);
                        that.oModelLocationHierarchyAutoCreation.refresh();
                    }
                }
            });
        },

        fnCreateHierarchyPopUp: function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.TagUploadHierarchy", this);
                this._oDialog.setModel(this.getView().getModel("i18n"), "i18n");
                sap.ui.getCore().byId("table-location-hierarchy").setModel(this.oModelLocationHierarchyAutoCreation);
                this.getView().addDependent(this.getView()._oDialog);
            }
            this._oDialog.open();
            sap.ui.getCore().byId("table-location-hierarchy").removeSelections(true);
            oTagUploadController.fnLoadHierarchyPopUp();
        },

        fnCreateForSelectedItems: function () {
            var i;
            var sLocationList = "";
            var arrSelectedItems = sap.ui.getCore().byId("table-location-hierarchy").getSelectedItems();
            var iCount = arrSelectedItems.length;
            if (iCount > 0) {
                for (i = 0; i < iCount; i++) {
                    if (i == 0) {
                        sLocationList = arrSelectedItems[i].getBindingContext().getObject().DS_PLANT_HIERARCHY;
                    } else {
                        sLocationList = sLocationList + "\n" + arrSelectedItems[i].getBindingContext().getObject().DS_PLANT_HIERARCHY;
                    }
                }
            }
            oTagUploadController.fnSaveLocationHierarchy(sLocationList);
        },

        fnIgnoreAll: function () {
            oTagUploadController.fnSaveLocationHierarchy("");
        },

        fnSaveLocationHierarchy: function (sLocationList) {
            var sSaveWaitMessage = oResourceBundle.getText("commonBackgroundProcessMessage");
            oDialog.setText(sSaveWaitMessage);
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagImportFailedAutoCreationXacuteQuery&Content-Type=text/json",
                type: "POST",
                data: {
                    "Param.1": "INSERT",
                    "Param.2": sLocationList,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.Rowset) {
                        var data = result.Rowsets.Rowset[0];
                        var successMsg = data.Row[0].Output;
                        if (successMsg == "{##SUCCESS_MESSAGE}") {
                            successMsg = oResourceBundle.getText("commonInfoSuccess");
                        }
                        that.handleMessage(oResourceBundle.getText("commonTitleTagExcelUpload"),
                            oResourceBundle.getText("tagUploadTagImport"),
                            successMsg,
                            "Success");
                        //MessageToast.show(successMsg);
                        setTimeout(function () {
                            oTagUploadController.fnReloadTempTable();
                        }, 100);
                    } else if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        that.handleMessage(oResourceBundle.getText("commonTitleTagExcelUpload"),
                            oResourceBundle.getText("tagUploadTagImport"),
                            errorMsg,
                            "Error");
                        //MessageToast.show(errorMsg);
                    }
                }
            });
            this._oDialog.close();
        },

        fnAbortFile: function () {
            var tagUploadAbortMessage = oResourceBundle.getText("tagUploadAbortMessage");
            oDialog.setText(tagUploadAbortMessage);
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagImportAbortXacuteQuery&Content-Type=text/json",
                type: "POST",
                async: true,
                data: {

                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleTagExcelUpload"),
                            oResourceBundle.getText("tagUploadTagImport"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        flagAbort = true;
                        oTagUploadController.fnReloadTempTable();
                        oDialog.close();
                    }
                },
                error: function () {
                }
            });
        },

        fnLoadTagStatusTable: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagImportStatusXacuteQuery&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleTagExcelUpload"),
                            oResourceBundle.getText("tagUploadTagImport"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oTagUploadController.oModelTagStatusTable.setData(data);
                        oTagUploadController.oModelTagStatusTable.refresh();
                    }
                }
            });
        },

        fnDownloadFailedItems: function () {
            var url =
                "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagImportDownloadFailedXacuteQuery&Content-Type=text/csv";
            var url_encoded = encodeURI(url);
            window.open(url_encoded, "_blank");
        },

        fnDownloadMisconfiguredItems: function () {
            var url =
                "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagImportDownloadMisconfiguredXacuteQuery&Content-Type=text/csv";
            var url_encoded = encodeURI(url);
            window.open(url_encoded, "_blank");
        },

        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("TagCatalog");
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
                        oTagUploadController.fnUploadFile();
                        oChangeCommentDialog.close();
                    } else {
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
                        that.handleMessage(oResourceBundle.getText("commonTitleTagExcelUpload"),
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
//# sourceURL=https://sapdqnjc.pharma.aventis.com:50001/XMII/CM/StreamingEngine/StreamingEngine/controller/TagUpload.controller.js?eval