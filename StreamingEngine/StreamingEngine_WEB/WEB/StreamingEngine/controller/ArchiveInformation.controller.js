/*-----------------------------------------------------------------------------------
Streaming Engine - Archive Flows Information
Creation Date: 2020.05.27 / By: E0445955
Reference Document: 
Description:This screen is used Add, Edit or Delete a selected Archive Flow. Also to
run the flow manually
-------------------------------------------------------------------------------------*/
var sFlowID;
var sMode;
var sAction;
var oArchiveInformationController;
var oDialog;
var sInputFlowId;
var sComboDataSource;
var sInputDataFlowName;
var sInputDescription;
var sDataDestination;
var sOldDataDestination;
var iCompressed;
var iEnabled;
var oResourceBundle;
var bShowCommentDialog = true;
var sYesLabel;
var sNoLabel;
/*****Below Variables are for Restore functionality******/
var oCurrentControl;
var sCurrentColumnName;
var iCurrentControlCount;
var arrCurrentItems;
var sCurrentLabel;
var sTagCatalogTable = "SE_DATA_FLOW";
/******************************************************/
sap.ui.define([
    "../controller/BaseController",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/Popover",
    "sap/m/MessageToast",
    'sap/ui/model/Filter',
    "sap/m/MessageBox",
], function (BaseController, Dialog, Button, Text, Popover, MessageToast, Filter, MessageBox) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.ArchiveInformation", {
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            sYesLabel = oResourceBundle.getText("commonYes").toUpperCase();
            sNoLabel = oResourceBundle.getText("commonNo").toUpperCase();

            oArchiveInformationController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            this.fnLoadDataSource();
            this.fnLoadDataDestination();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ArchiveInformation").attachPatternMatched(this._onObjectMatched, this);
            if (bRequireChangeComment) {
                this.oModelChangeMessages = new sap.ui.model.json.JSONModel({
                    Row: [],
                    fnUpdateNewValue: function (columnName, value) {
                        var e;
                        if (e = this.Row.find(e => e.columnName === columnName)) {
                            if (e.old != value) {
                                e.new = value;
                            } else {
                                e.new = null;
                            }
                        }
                    }
                });
            }

        },
        onAfterRendering: function () {
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
                this.getView().byId("page-archive-information").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        oModelDataSource: new sap.ui.model.json.JSONModel(),
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleArchiveFlowInfo"));
            sMode = oEvent.getParameter("arguments").MODE;
            var sNewArchiveFlowLabel = oResourceBundle.getText("flowInfoNewArchive");
            if (sMode == "U") {
                sOldDataDestination = oEvent.getParameter("arguments").ID_DATA_DESTINATION;
                sFlowID = oEvent.getParameter("arguments").ID_DATA_FLOW;
                var sSourceID = oEvent.getParameter("arguments").ID_SOURCE;
                var sPlant = oEvent.getParameter("arguments").PLANT;
                var sSourceName = oEvent.getParameter("arguments").SOURCE_NAME;
                var sFlowName = oEvent.getParameter("arguments").DS_NAME;
                var sDescription = oEvent.getParameter("arguments").DS_DESCRIPTION;
                var bCurrentCompressed = oEvent.getParameter("arguments").FL_COMPRESSED == 1 ? true : false;
                var sDataDestination = oEvent.getParameter("arguments").ID_DATA_DESTINATION;
                var bCurrentEnabled = oEvent.getParameter("arguments").FL_ENABLED == 1 ? true : false;

                if (bRequireChangeComment) {
                    this.oModelChangeMessages.getData().Row = [
                        { columnName: "DS_NAME", name: oResourceBundle.getText("flowInfoName"), old: sFlowName, new: null, message: "" },
                        { columnName: "DS_DESCRIPTION", name: oResourceBundle.getText("flowDesc"), old: sDescription, new: null, message: "" },
                        { columnName: "ID_DATA_DESTINATION", name: oResourceBundle.getText("dataDestination"), old: sDataDestination, new: null, message: "" },
                        { columnName: "FL_COMPRESSED", name: oResourceBundle.getText("flowCompressed"), old: (bCurrentCompressed ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "FL_ENABLED", name: oResourceBundle.getText("flowEnabled"), old: (bCurrentEnabled ? sYesLabel : sNoLabel), new: null, message: "" }
                    ];
                }

                this.getView().byId("input-flow-id").setEnabled(false);
                this.getView().byId("combobox-data-source").setEnabled(false);
                this.getView().byId("button-delete").setVisible(true);
                this.getView().byId("input-flow-id").setValue(sFlowID);
                this.getView().byId("header-plant-name").setText(sPlant);
                this.getView().byId("header-data-source").setText(sSourceName);
                this.getView().byId("object-header-archive-info").setTitle(sFlowName);
                this.getView().byId("header-plant-name").setVisible(true);
                this.getView().byId("header-data-source").setVisible(true);
                this.getView().byId("combobox-data-source").setSelectedKey(sSourceID);
                this.getView().byId("input-data-flow-name").setValue(sFlowName);
                this.getView().byId("input-description").setValue(sDescription);
                this.getView().byId("combobox-datadestination").setSelectedKey(sDataDestination);
                this.getView().byId("switch-compressed").setState(bCurrentCompressed);
                this.getView().byId("switch-enabled").setState(bCurrentEnabled);
                this.getView().byId("objectStatus-dd-disabled").setVisible(false);
                this.getView().byId("combobox-datadestination").setValueState("None");

                //Check Data Destination Enablement
                var iIsDestinationEnabled = oEvent.getParameter("arguments").DESTINATION_ENABLED == 1 ? true : false;
                if (!iIsDestinationEnabled) {
                    var sDestinationName = decodeURIComponent(oEvent.getParameter("arguments").DESTINATION_NAME);
                    this.getView().byId("combobox-datadestination").setValue(sDestinationName);
                    this.getView().byId("combobox-datadestination").setValueState("Warning");
                    this.getView().byId("combobox-datadestination").setValueStateText(oResourceBundle.getText("dataDestinationsDisabled"));
                    this.getView().byId("objectStatus-dd-disabled").setVisible(true);
                }

                /********************Below are Restore Buttons********************/
                sTagCatalogTable = "SE_DATA_FLOW";
                this.getView().byId("button-restore-flow-name").setVisible(true);
                this.getView().byId("button-restore-description").setVisible(true);
                this.getView().byId("button-restore-datadestination").setVisible(true);
                this.getView().byId("button-restore-compressed").setVisible(true);
                this.getView().byId("button-restore-enabled").setVisible(true);
                /*****************************************************************/

            } else if (sMode == "I") {
                this.getView().byId("input-flow-id").setEnabled(false);
                this.getView().byId("combobox-data-source").setEnabled(true);
                this.getView().byId("button-delete").setVisible(false);
                this.getView().byId("header-plant-name").setText("");
                this.getView().byId("header-data-source").setText("");
                this.getView().byId("header-plant-name").setVisible(false);
                this.getView().byId("header-data-source").setVisible(false);
                this.getView().byId("input-flow-id").setValue("");
                this.getView().byId("object-header-archive-info").setTitle(sNewArchiveFlowLabel);
                this.getView().byId("combobox-data-source").setSelectedKey("");
                this.getView().byId("input-data-flow-name").setValue("");
                this.getView().byId("input-description").setValue("");
                this.getView().byId("combobox-datadestination").setSelectedKey("");
                this.getView().byId("switch-compressed").setState(false);
                this.getView().byId("switch-enabled").setState(false);
                this.getView().byId("objectStatus-dd-disabled").setVisible(false);
                this.getView().byId("combobox-datadestination").setValueState("None");

                /********************Below are Restore Buttons********************/
                this.getView().byId("button-restore-flow-name").setVisible(false);
                this.getView().byId("button-restore-description").setVisible(false);
                this.getView().byId("button-restore-datadestination").setVisible(false);
                this.getView().byId("button-restore-compressed").setVisible(false);
                this.getView().byId("button-restore-enabled").setVisible(false);
                /*****************************************************************/
            }

        },

        fnLoadDataSource: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": "%",
                    "Param.3": 1,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
                            oResourceBundle.getText("dataSourcesLoadDataSources"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oArchiveInformationController.oModelDataSource.setData(data);
                        oArchiveInformationController.oModelDataSource.refresh();
                    }
                }
            });
        },

        fnLoadDataDestination: function () {
            var that = this;
            var oModelDataDestinations = new sap.ui.model.json.JSONModel();
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/DestinationListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": "%"
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
                            oResourceBundle.getText("dataDestinationsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oModelDataDestinations.setData(data);
                        that.getView().byId("combobox-datadestination").setModel(oModelDataDestinations);
                        oModelDataDestinations.refresh(true);
                    }
                }
            });
        },

        fnValidateInputs: function () {
            var bValidInputs = true;
            sInputFlowId = this.getView().byId("input-flow-id").getValue();
            sComboDataSource = this.getView().byId("combobox-data-source").getSelectedKey();
            sInputDataFlowName = this.getView().byId("input-data-flow-name").getValue();
            sInputDescription = this.getView().byId("input-description").getValue();
            sDataDestination = this.getView().byId("combobox-datadestination").getSelectedKey();
            iCompressed = this.getView().byId("switch-compressed").getState() ? 1 : 0;
            iEnabled = this.getView().byId("switch-enabled").getState() ? 1 : 0;

            if (sComboDataSource == "") {
                bValidInputs = false;
                this.getView().byId("combobox-data-source").setValueState("Error");
            } else {
                this.getView().byId("combobox-data-source").setValueState("None");
            }

            if (sInputDataFlowName == "") {
                bValidInputs = false;
                this.getView().byId("input-data-flow-name").setValueState("Error");
            } else {
                this.getView().byId("input-data-flow-name").setValueState("None");
            }

            if (sInputDescription == "") {
                bValidInputs = false;
                this.getView().byId("input-description").setValueState("Error");
            } else {
                this.getView().byId("input-description").setValueState("None");
            }

            if (sDataDestination == "") {
                bValidInputs = false;
                this.getView().byId("combobox-datadestination").setValueState("Error");
            } else {
                this.getView().byId("combobox-datadestination").setValueState("None");
            }

            return bValidInputs;

        },
        fnSaveArchiveFlow: function () {
            if (sMode == "I") {
                sAction = "INSERT";
            } else if (sMode == "U") {
                sAction = "UPDATE";
            }
            this.fnAddUpdateFlow();
        },
        fnDeleteArchiveFlow: function () {
            var sConfirmTitle = oResourceBundle.getText("commonConfirm");
            var sConfirmYes = oResourceBundle.getText("commonYes");
            var sConfirmNo = oResourceBundle.getText("commonNo");
            var sConfirmMessage = oResourceBundle.getText("flowArchiveInfoDeleteConfirmation");
            var dialog = new Dialog({
                title: sConfirmTitle,
                type: 'Message',
                content: new Text({
                    text: sConfirmMessage
                }),
                beginButton: new Button({
                    text: sConfirmYes,
                    press: function () {
                        sAction = "DELETE";
                        oArchiveInformationController.fnDeleteArchiveInformation();
                        dialog.close();
                    }
                }),
                endButton: new Button({
                    text: sConfirmNo,
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
        fnAddUpdateFlow: function () {
            var bIsValid = this.fnValidateInputs();
            if (bIsValid) {
                var aCommentColumnName = [];
                var aCommentMessage = [];
                if (bRequireChangeComment && sMode === "U") {
                    if (!this.fnValidateChangeComments()) {
                        return;
                    }
                    bShowCommentDialog = true;
                    var oChangeTracker = this.oModelChangeMessages.getData();
                    for (var e of oChangeTracker.Row) {
                        if (e.new != null) {
                            aCommentColumnName.push(e.columnName);
                            aCommentMessage.push(e.message);
                        }
                    }
                }
                oDialog.open();
                var that = this;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ArchiveFlowXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": sAction,
                        "Param.2": sInputFlowId,
                        "Param.3": sComboDataSource,
                        "Param.4": sInputDataFlowName,
                        "Param.5": sInputDescription,
                        "Param.6": sDataDestination,
                        "Param.7": iCompressed,
                        "Param.8": iEnabled,
                        "Param.30": aCommentColumnName.join("\n"),
                        "Param.31": aCommentMessage.join("\n")
                    },
                    success: function (result) {
                        if (result.Rowsets.Rowset) {
                            var data = result.Rowsets.Rowset[0];
                            var successMsg = data.Row[0].Output;
                            if (successMsg == "{##SUCCESS_MESSAGE}") {
                                successMsg = oResourceBundle.getText("commonInfoSuccess");
                            }
                            oDialog.close();
                            //MessageToast.show(successMsg);
                            if (sAction === "INSERT") {
                                that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
                                    oResourceBundle.getText("archiveFlowAdd"),
                                    successMsg,
                                    "Success");
                            } else {
                                that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
                                    oResourceBundle.getText("archiveFlowUpdate"),
                                    successMsg,
                                    "Success");
                            }
                            oArchiveInformationController.fnNavigateBackAndReload();
                        } else if (result.Rowsets.FatalError) {
                            var errorMsg = result.Rowsets.FatalError;
                            oDialog.close();
                            //MessageToast.show(errorMsg);
                            if (sAction === "INSERT") {
                                that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
                                    oResourceBundle.getText("archiveFlowAdd"),
                                    errorMsg,
                                    "Error");
                            } else {
                                that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
                                    oResourceBundle.getText("archiveFlowUpdate"),
                                    errorMsg,
                                    "Error");
                            }
                        }
                    }
                });
            }
        },

        fnDeleteArchiveInformation: function () {

            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ArchiveFlowXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sAction,
                    "Param.2": sFlowID
                },
                success: function (result) {
                    if (result.Rowsets.Rowset) {
                        var data = result.Rowsets.Rowset[0];
                        var successMsg = data.Row[0].Output;
                        if (successMsg == "{##SUCCESS_MESSAGE}") {
                            successMsg = oResourceBundle.getText("commonInfoSuccess");
                        }
                        oDialog.close();
                        //MessageToast.show(successMsg);
                        that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
                            oResourceBundle.getText("archiveFlowDelete"),
                            successMsg,
                            "Success");
                        oArchiveInformationController.fnNavigateBackAndReload();
                    } else if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        oDialog.close();
                        //MessageToast.show(errorMsg);
                        that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
                            oResourceBundle.getText("archiveFlowDelete"),
                            errorMsg,
                            "Error");
                    }
                }
            });
        },

        /****************Below Functions are for Restore Values (Common to all pages)*****************/
        oModelRestoreValue: new sap.ui.model.json.JSONModel(),
        fnOpenRestorePopup: function (oEvent) {
            var oFlexContainer = oEvent.getSource().getParent();
            arrCurrentItems = oFlexContainer.getItems();
            iCurrentControlCount = arrCurrentItems.length;
            if (iCurrentControlCount == 2) {
                oCurrentControl = arrCurrentItems[0];
                sCurrentColumnName = oCurrentControl.data("columnName");
            } else if (iCurrentControlCount > 2) {
                oCurrentControl = arrCurrentItems[0];
                sCurrentColumnName = oCurrentControl.data("columnName");
            }
            sCurrentLabel = oCurrentControl.getParent().getParent().getLabel().getText();
            this._oRestoreDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.RestoreValueSelect", this);
            this.getView().addDependent(this._oRestoreDialog);
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oRestoreDialog);
            this._oRestoreDialog.open();
            this.fnInitRestorePopup();
        },
        fnInitRestorePopup: function () {
            sap.ui.getCore().byId("table-select-restore-value").setModel(this.oModelRestoreValue);
            sap.ui.getCore().byId("table-select-restore-value").setTitle(sCurrentLabel);
            this.fnLoadrestoreValues();
        },
        fnCancelRestore: function () {
            this._oRestoreDialog.destroy();
        },
        fnSearchRestorePopup: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("DS_VALUE_NEW", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },
        fnConfirmRestore: function (oEvent) {
            var sSelectedValue = oEvent.getSource()._aSelectedItems[0].getCells()[2].getText();
            if (iCurrentControlCount == 2) {
                var sControlName = arrCurrentItems[0].getMetadata().getName();
                if (sControlName == "sap.m.Input") {
                    arrCurrentItems[0].setValue(sSelectedValue);
                } else if (sControlName == "sap.m.Switch") {
                    if (sSelectedValue == sYesLabel) {
                        arrCurrentItems[0].setState(true);
                    } else {
                        arrCurrentItems[0].setState(false);
                    }
                } else if (sControlName == "sap.m.ComboBox") {
                    arrCurrentItems[0].setSelectedKey(sSelectedValue);
                }
            } else {
                if (sCurrentColumnName == "DS_NAME_RENAMED") {
                    var arrayofRenamedTags = sSelectedValue.split("-");
                    arrCurrentItems[0].setValue(arrayofRenamedTags[0]);
                    arrCurrentItems[1].setValue(arrayofRenamedTags[1]);
                    arrCurrentItems[2].setValue(arrayofRenamedTags[2]);
                    arrCurrentItems[3].setValue(arrayofRenamedTags[3]);
                } else if (sCurrentColumnName == "PLANT_HIERARCHY") {
                    var arrayofHierarchy = sSelectedValue.split("-");
                    arrCurrentItems[0].setValue(arrayofHierarchy[0].slice(0, 2));
                    arrCurrentItems[1].setValue(arrayofHierarchy[0].slice(-4));
                    arrCurrentItems[2].setValue(arrayofHierarchy[1]);
                    arrCurrentItems[3].setValue(arrayofHierarchy[2]);
                    arrCurrentItems[4].setValue(arrayofHierarchy[3]);
                }
            }
            this._oRestoreDialog.destroy();
        },
        /*****************************************************************************/

        /****************Below Function is for Restore Values (specific to this page)*****************/
        fnLoadrestoreValues: function () {
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLogRestoreValueSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sTagCatalogTable,
                    "Param.2": sCurrentColumnName,
                    "Param.3": sFlowID
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
                            oResourceBundle.getText("plantInfoRestoreValueMsg"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        if (data.Row && sCurrentColumnName.startsWith("FL_")) {
                            data.Row = data.Row.map(function (oElt) {
                                return {
                                    DS_USERNAME: oElt.DS_USERNAME,
                                    DS_VALUE_NEW: oElt.DS_VALUE_NEW == "1" ? sYesLabel : sNoLabel,
                                    DT_TIMESTAMP: oElt.DT_TIMESTAMP
                                }
                            });
                        }
                        oArchiveInformationController.oModelRestoreValue.setData(data);
                        oArchiveInformationController.oModelRestoreValue.refresh();
                        oDialog.close();
                    }

                }
            });
        },
        /*****************************************************************************/

        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("ArchiveFlows", {
                Refresh: "N"
            });

        },
        fnNavigateBackAndReload: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("ArchiveFlows", {
                Refresh: "Y"
            });

        },
        fnValidateChangeComments: function () {
            var oChangeTracker = this.oModelChangeMessages.getData();

            oChangeTracker.fnUpdateNewValue("DS_NAME", sInputDataFlowName);
            oChangeTracker.fnUpdateNewValue("DS_DESCRIPTION", sInputDescription);
            oChangeTracker.fnUpdateNewValue("ID_DATA_DESTINATION", sDataDestination);
            oChangeTracker.fnUpdateNewValue("FL_COMPRESSED", (iCompressed == 1 ? sYesLabel : sNoLabel));
            oChangeTracker.fnUpdateNewValue("FL_ENABLED", (iEnabled == 1 ? sYesLabel : sNoLabel));

            if (bShowCommentDialog && oChangeTracker.Row.filter(e => e.new != null).length > 0) {
                this.fnChangeCommentDialog();
                return false;
            }
            var bValid = oChangeTracker.Row.every(e => {
                if (e.new != null) {
                    return e.message.length > 0 && e.message.length < 255
                }
                return true
            })
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
                        oArchiveInformationController.fnAddUpdateFlow();
                        oChangeCommentDialog.close();
                    } else {
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
                        that.handleMessage(oResourceBundle.getText("commonTitleArchiveFlowInfo"),
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
        },
        onChangeDestination: function () {
            this.getView().byId("objectStatus-dd-disabled").setVisible(false);
            var sDestinationVal = this.getView().byId("combobox-datadestination").getSelectedKey();
            if (sDestinationVal.startsWith("SE_PRD")) {
                MessageBox.confirm(oResourceBundle.getText("commonPRDDatadestinationConfirmation"), {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === "NO") {
                            oArchiveInformationController.getView().byId("combobox-datadestination").setSelectedKey(sOldDataDestination);
                        }
                    }
                });
            }
        }
    });
});