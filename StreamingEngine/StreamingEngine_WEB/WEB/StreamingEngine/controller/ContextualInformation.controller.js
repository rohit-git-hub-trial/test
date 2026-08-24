/*-----------------------------------------------------------------------------------
Streaming Engine - Contextual Flows Information
Creation Date: 2020.05.20 / By: E0445955
Reference Document: 
Description:This screen is used Add, Edit or Delete a selected Contextual Flow. Also to
run the flow manually
-------------------------------------------------------------------------------------*/
var sFlowID;
var sFlowTypeUpper;
var sMode;
var sAction;
var oContextualInformationController;
var oDialog;
var sInputFlowId;
var sComboDataSource;
var sInputDataFlowName;
var sInputDescription;
var sInputTextAreaSQLQuery;
var sDataDestination;
var sOldDataDestination;
var sComboMiiTransaction;
var bCompressed;
var bEnabled;
var oResourceBundle;
var bShowCommentDialog = true;
var sYesLabel;
var sNoLabel;
var sDestinationVal;
var sTransactionVal;
var saveFlag;
var sTriggerDestinationChanged;
var sTriggerTransactionChanged;
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
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/ui/model/Filter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
], function (BaseController, Dialog, Button, Text, MessageToast, Popover, Filter, JSONModel, MessageBox) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.ContextualInformation", {
        onInit: function () {
            // set message manager model
            sTriggerTransactionChanged = 0;
            sTriggerDestinationChanged = 0;
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            sYesLabel = oResourceBundle.getText("commonYes").toUpperCase();
            sNoLabel = oResourceBundle.getText("commonNo").toUpperCase();

            oContextualInformationController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            this.getView().byId("combobox-mii-transaction").setModel(this.oModelMIITransaction);
            this.fnLoadDataSource();
            this.fnLoadDataDestination();
            this.fnLoadMIITransaction();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ContextualInformation").attachPatternMatched(this._onObjectMatched, this);
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
                this.getView().byId("page-contextual-information").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        oModelDataSource: new sap.ui.model.json.JSONModel(),
        oModelMIITransaction: new sap.ui.model.json.JSONModel(),
        oModelSqlTestResult: new sap.ui.model.json.JSONModel(),
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleContextualFlowInfo"));
            sMode = oEvent.getParameter("arguments").MODE;
            var sNewContextFlowLabel = oResourceBundle.getText("flowInfoNewContextual");
            if (sMode == "U") {
                sFlowID = oEvent.getParameter("arguments").ID_DATA_FLOW;
                sOldDataDestination = oEvent.getParameter("arguments").ID_DATA_DESTINATION;
                var sSourceID = oEvent.getParameter("arguments").ID_SOURCE;
                var sPlant = oEvent.getParameter("arguments").PLANT;
                var sSourceName = oEvent.getParameter("arguments").SOURCE_NAME;
                var sFlowType = oEvent.getParameter("arguments").FLOW_TYPE;
                sFlowTypeUpper = sFlowType.toUpperCase();
                var sFlowName = oEvent.getParameter("arguments").DS_NAME;
                var sDescription = oEvent.getParameter("arguments").DS_DESCRIPTION;
                var bCompressed = oEvent.getParameter("arguments").FL_COMPRESSED == 1 ? true : false;
                var sDataDestination = oEvent.getParameter("arguments").ID_DATA_DESTINATION;
                var bEnabled = oEvent.getParameter("arguments").FL_ENABLED == 1 ? true : false;
                var sSqlQuery = decodeURIComponent(oEvent.getParameter("arguments").DS_SQL_QUERY) == "NA" ? "" : decodeURIComponent(oEvent.getParameter(
                    "arguments").DS_SQL_QUERY);
                var sMiiTransaction = decodeURIComponent(oEvent.getParameter("arguments").DS_MII_TRANSACTION) == "NA" ? "" : decodeURIComponent(
                    oEvent.getParameter("arguments").DS_MII_TRANSACTION);
                var sBatchSource = oEvent.getParameter("arguments").ID_BATCH_SOURCE;

                if (bRequireChangeComment) {
                    this.oModelChangeMessages.getData().Row = [
                        { columnName: "DS_NAME", name: oResourceBundle.getText("flowInfoName"), old: sFlowName, new: null, message: "" },
                        { columnName: "DS_DESCRIPTION", name: oResourceBundle.getText("flowDesc"), old: sDescription, new: null, message: "" },
                        { columnName: "DS_SQL_QUERY", name: oResourceBundle.getText("flowInfoSqlQuery"), old: sSqlQuery, new: null, message: "" },
                        { columnName: "ID_DATA_DESTINATION", name: oResourceBundle.getText("dataDestination"), old: sDataDestination, new: null, message: "" },
                        { columnName: "DS_MII_TRANSACTION", name: oResourceBundle.getText("flowMiiTransaction"), old: sMiiTransaction, new: null, message: "" },
                        { columnName: "FL_COMPRESSED", name: oResourceBundle.getText("flowCompressed"), old: (bCompressed ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "FL_ENABLED", name: oResourceBundle.getText("flowEnabled"), old: (bEnabled ? sYesLabel : sNoLabel), new: null, message: "" }
                    ];
                }

                this.getView().byId("input-flow-id").setEnabled(false);
                this.getView().byId("combobox-data-source").setEnabled(false);
                this.getView().byId("button-delete").setVisible(true);
                this.getView().byId("input-flow-id").setValue(sFlowID);
                this.getView().byId("header-plant-name").setText(sPlant);
                this.getView().byId("header-data-source").setText(sSourceName);
                // this.getView().byId("attribute-flow-name").setText(sFlowName);
                this.getView().byId("object-header-contextual-info").setTitle(sFlowName);
                this.getView().byId("header-plant-name").setVisible(true);
                this.getView().byId("header-data-source").setVisible(true);
                this.getView().byId("attribute-flow-name").setVisible(true);
                this.getView().byId("combobox-data-source").setSelectedKey(sSourceID);
                this.getView().byId("input-data-flow-name").setValue(sFlowName);
                this.getView().byId("input-description").setValue(sDescription);
                this.getView().byId("input-text-area-sql-query").setValue(sSqlQuery);
                this.getView().byId("combobox-datadestination").setSelectedKey(sDataDestination);
                this.getView().byId("combobox-mii-transaction").setSelectedKey(sMiiTransaction);
                this.getView().byId("switch-compressed").setState(bCompressed);
                this.getView().byId("switch-enabled").setState(bEnabled);
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

                this.bCustomQuery = sBatchSource === "CUSTOM";
                this.fnTransactionChanged();
                sTriggerTransactionChanged = 0;
                /********************Below are Restore Buttons********************/
                sTagCatalogTable = "SE_DATA_FLOW";
                this.getView().byId("button-restore-flow-name").setVisible(true);
                this.getView().byId("button-restore-description").setVisible(true);
                this.getView().byId("button-restore-datadestination").setVisible(true);
                this.getView().byId("button-restore-mii-transaction").setVisible(true);
                this.getView().byId("button-restore-compressed").setVisible(true);
                this.getView().byId("button-restore-enabled").setVisible(true);

                /*****************************************************************/

            } else if (sMode == "I") {
                this.getView().byId("input-flow-id").setEnabled(false);
                this.getView().byId("combobox-data-source").setEnabled(true);
                this.getView().byId("button-delete").setVisible(false);
                this.getView().byId("header-plant-name").setText("");
                this.getView().byId("header-data-source").setText("");
                // this.getView().byId("attribute-flow-name").setText("");
                this.getView().byId("header-plant-name").setVisible(false);
                this.getView().byId("header-data-source").setVisible(false);
                this.getView().byId("attribute-flow-name").setVisible(false);
                this.getView().byId("input-flow-id").setValue("");
                this.getView().byId("object-header-contextual-info").setTitle(sNewContextFlowLabel);
                this.getView().byId("combobox-data-source").setSelectedKey("");
                this.getView().byId("input-data-flow-name").setValue("");
                this.getView().byId("input-description").setValue("");
                this.getView().byId("input-text-area-sql-query").setValue("");
                this.getView().byId("combobox-datadestination").setSelectedKey("");
                this.getView().byId("combobox-mii-transaction").setSelectedKey("");
                this.getView().byId("switch-compressed").setState(false);
                this.getView().byId("switch-enabled").setState(false);
                this.getView().byId("objectStatus-dd-disabled").setVisible(false);
                this.getView().byId("combobox-datadestination").setValueState("None");

                /********************Below are Restore Buttons********************/
                this.getView().byId("button-restore-flow-name").setVisible(false);
                this.getView().byId("button-restore-description").setVisible(false);
                this.getView().byId("button-restore-datadestination").setVisible(false);
                this.getView().byId("button-restore-mii-transaction").setVisible(false);
                this.getView().byId("button-restore-compressed").setVisible(false);
                this.getView().byId("button-restore-enabled").setVisible(false);
                /*****************************************************************/
            }

        },

        fnLoadDataSource: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/SourceContextualListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": "%",
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                            oResourceBundle.getText("dataSourcesLoadDataSources"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oContextualInformationController.oModelDataSource.setData(data);
                        oContextualInformationController.oModelDataSource.refresh();
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

        fnLoadMIITransaction: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/FolderListXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": "db://StreamingEngine/DataFlow/ExtendedTransactions"
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                            oResourceBundle.getText("flowLoadMiiTransaction"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        for (var i = 0; i < data.Row.length; i++) {
                            var filename = data.Row[i].Name;
                            if (filename.includes('_')) {
                                var lastUnderscoreIndex = filename.lastIndexOf('_');
                                var extensionIndex = filename.lastIndexOf('.');
                                var extractedWord = filename.substring(lastUnderscoreIndex + 1, extensionIndex);
                            }
                            else {
                                var extensionIndex = filename.lastIndexOf('.');
                                var extractedWord = filename.substring(0, extensionIndex);
                            }
                            var splitWords = extractedWord.match(/[A-Z][a-z0-9]*/g);
                            var finalname = splitWords.join(' ');
                            data.Row[i].filename = finalname;
                        }
                        oContextualInformationController.oModelMIITransaction.setData(data);
                        oContextualInformationController.oModelMIITransaction.refresh();
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
            sInputTextAreaSQLQuery = this.getView().byId("input-text-area-sql-query").getValue();
            sDataDestination = this.getView().byId("combobox-datadestination").getSelectedKey();
            sComboMiiTransaction = this.getView().byId("combobox-mii-transaction").getSelectedKey();
            bCompressed = this.getView().byId("switch-compressed").getState() ? 1 : 0;
            bEnabled = this.getView().byId("switch-enabled").getState() ? 1 : 0;

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
        fnSaveContextualFlow: function () {
            if (sMode == "I") {
                sAction = "INSERT";
            } else if (sMode == "U") {
                sAction = "UPDATE";
            }
            this.fnAddUpdateFlow();
        },
        fnDeleteContextualFlow: function () {
            var sConfirmTitle = oResourceBundle.getText("commonConfirm");
            var sConfirmYes = oResourceBundle.getText("commonYes");
            var sConfirmNo = oResourceBundle.getText("commonNo");
            var sConfirmMessage = oResourceBundle.getText("flowContextualInfoDeleteConfirmation");
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
                        oContextualInformationController.fnDeleteContextualInformation();
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
            ///// Changes for Process Event Begin////////
            sDestinationVal = this.getView().byId("combobox-datadestination").getSelectedKey();
            sTransactionVal = this.getView().byId("combobox-mii-transaction").getSelectedKey();
      if (sTriggerTransactionChanged == 1 || sTriggerDestinationChanged == 1) {
    if (sDestinationVal.endsWith("PROCESS_EVENTS")) {
        if (
            sTransactionVal.endsWith("ProcessEventInformation.trx") ||
            sTransactionVal.endsWith("JurongFlatFileEvents.trx")
        ) {
            saveFlag = 1;
        } else {
            saveFlag = 0;
        }
    } else if (sDestinationVal.endsWith("PROCESS_EVENTS_V2")) {
        if (
            sTransactionVal.endsWith("ProcessEventInformationV2.trx") ||
            sTransactionVal.endsWith("JurongFlatFileEvents.trx")
        ) {
            saveFlag = 1;
        } else {
            saveFlag = 0;
        }
    } else {
        saveFlag = 1; // allow other destinations as is
    }

    if (saveFlag == 0) {
        MessageBox.warning(
            "There is a mismatch between the data destination and contextual data type values. Please verify."
        );
        return;
    }
}

            ///// Changes for Process Event End////////

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
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ContextualFlowXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": sAction,
                        "Param.2": sInputFlowId,
                        "Param.3": sComboDataSource,
                        "Param.4": sInputDataFlowName,
                        "Param.5": sInputDescription,
                        "Param.6": sComboMiiTransaction,
                        "Param.7": sInputTextAreaSQLQuery,
                        "Param.8": sDataDestination,
                        "Param.9": bCompressed,
                        "Param.10": bEnabled,
                        "Param.30": aCommentColumnName.join("\n"),
                        "Param.31": aCommentMessage.join("\n")
                    },
                    success: function (result) {
                        if (result.Rowsets.Rowset) {
                            var data = result.Rowsets.Rowset[0];
                            var successMsg = data.Row[0].Output;
                            if (successMsg == "{##SUCCESS_MESSAGE}") {
                                successMsg = oResourceBundle.getText("flowInfoSaveSuccess");
                            }
                            oDialog.close();
                            //MessageToast.show(successMsg);
                            if (sAction === "INSERT") {
                                that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                                    oResourceBundle.getText("contextualFlowAdd"),
                                    successMsg,
                                    "Success");
                            } else {
                                that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                                    oResourceBundle.getText("contextualFlowUpdate"),
                                    successMsg,
                                    "Success");
                            }
                            oContextualInformationController.fnNavigateBackAndReload();
                        } else if (result.Rowsets.FatalError) {
                            var errorMsg = result.Rowsets.FatalError;
                            oDialog.close();
                            //MessageToast.show(errorMsg);
                            if (sAction === "INSERT") {
                                that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                                    oResourceBundle.getText("contextualFlowAdd"),
                                    errorMsg,
                                    "Error");
                            } else {
                                that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                                    oResourceBundle.getText("contextualFlowUpdate"),
                                    errorMsg,
                                    "Error");
                            }
                        }
                    }
                });
            }
            sTriggerDestinationChanged = 0;
            sTriggerTransactionChanged = 0;
        },

        fnDeleteContextualInformation: function () {

            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ContextualFlowXacuteQuery&Content-Type=text/json",
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
                        that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                            oResourceBundle.getText("contextualFlowDelete"),
                            successMsg,
                            "Success");
                        oContextualInformationController.fnNavigateBackAndReload();
                    } else if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        oDialog.close();
                        //MessageToast.show(errorMsg);
                        that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                            oResourceBundle.getText("contextualFlowDelete"),
                            errorMsg,
                            "Error");
                    }
                }
            });
        },
        fnOpenSqlTest: function (oEvent) {
            var sNoSqlMessage = oResourceBundle.getText("flowNoSqlMessage");
            var sSqlQuery = this.getView().byId("input-text-area-sql-query").getValue();
            if (sSqlQuery != "") {
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.ContextualSqlTest", this);
                }
                this.getView().addDependent(this._oDialog);
                this._oDialog.open();
                this.fnInitSqlPopup();
            } else {
                // MessageToast.show(sNoSqlMessage);
                this.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                    oResourceBundle.getText("flowInfoTestSql"),
                    sNoSqlMessage,
                    "Error");
            }
        },
        fnInitSqlPopup: function () {
            sap.ui.getCore().byId("table-sql-test").setModel(this.oModelSqlTestResult);
            oContextualInformationController.fnLoadSqlTestTable();
        },
        fnLoadSqlTestTable: function () {
            var i;
            var sSqlQuery = this.getView().byId("input-text-area-sql-query").getValue();
            var sDataSourceId = this.getView().byId("combobox-data-source").getSelectedKey();
            if (sSqlQuery != "") {
                var oTable = sap.ui.getCore().byId("table-sql-test");
                var oTableError = sap.ui.getCore().byId("table-sql-test-error");
                var oColumnText = sap.ui.getCore().byId("text-error-column-name");
                var oErrorText = sap.ui.getCore().byId("text-error-text");
                oTable.setVisible(false);
                oTableError.setVisible(false);
                oColumnText.setText("");
                oErrorText.setText("");
                $.ajax({
                    url: "/XMII/Illuminator?Content-Type=text/json",
                    type: "POST",
                    data: {
                        'QueryTemplate': 'StreamingEngine/DataFlow/Query/ContextualSQLTestXacuteQuery',
                        'Param.1': sDataSourceId,
                        'Param.2': sSqlQuery
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            oTable.setVisible(false);
                            oColumnText.setText("FatalError");
                            oErrorText.setText(result.Rowsets.FatalError);
                            oTableError.setVisible(true);
                        } else {
                            let bCustom = oContextualInformationController.bCustomQuery && (
                                sComboMiiTransaction.endsWith("ProcessEventInformation.trx") ||
                                sComboMiiTransaction.endsWith("DeltaV.trx") ||
                                sComboMiiTransaction.endsWith("ProcessEventInformationV2.trx") ||
                                sComboMiiTransaction.endsWith("BatchInformation.trx"))
                            if (bCustom) {
                                sComboMiiTransaction = oContextualInformationController.getView().byId("combobox-mii-transaction").getSelectedKey();
                                var aExpectedColumns = [];
                                if (sComboMiiTransaction.endsWith("ProcessEventInformation.trx")) {
                                    aExpectedColumns = ["BATCH_ID", "EQUIPMENT_ID", "RECIPE_NAME", "START_DATE", "END_DATE", "PARAMETER_NAME", "PARAMETER_VALUE", "MATERIAL_ID", "RECIPE_PATH", "RECIPE_FULL", "CATEGORY", "EQUIPMENT_NAME", "EQUIPMENT_FULL", "EQUIPMENT_PATH", "EQUIPMENT_HIERARCHY_MII", "EventFrameTemplateName", "PARAMETER_UOM", "PARAMETER_FORMAT", "PARAMETER_HL", "PARAMETER_LL", "PARAMETER_TARGET", "PARAMETER_TS"]
                                } else if (sComboMiiTransaction.endsWith("BatchInformation.trx")) {
                                    aExpectedColumns = ["BATCH_ID", "EQUIPMENT_ID", "EQUIPMENT_LEVEL", "EQUIPMENT_NAME", "EQUIPMENT_FULL", "EQUIPMENT_PATH", "PROCEDURE_NAME", "START_DATE", "END_DATE"]
                                } else if (sComboMiiTransaction.endsWith("DeltaV.trx")) {
                                    aExpectedColumns = ["UID", "batchid", "eventType", "eventdescr", "occurtime", "area", "processcell", "unit", "phasemodule", "action", "username", "uniqueid", "description", "EQUIPMENT_ID"];
                                } else if (sComboMiiTransaction.endsWith("ProcessEventInformationV2.trx")) {
                                    aExpectedColumns = ["source_ERP_batch_id", "source_material_id", "source_event_id", "source_event_occurence", "source_event_name", "source_event_description", "source_event_hierarchy", "source_event_start", "source_event_stop", "source_event_category", "source_parameter_name", "source_parameter_value", "source_parameter_ts", "source_parameter_uom", "source_parameter_high_limit", "source_parameter_low_limit", "source_parameter_target_value", "EQUIPMENT_ID"];
                                }
                            }
                            var data = result.Rowsets;
                            var oItem = new sap.m.ColumnListItem();
                            for (i = 0; i < result.Rowsets.Rowset[0].Columns.Column.length; i++) {
                                var name = result.Rowsets.Rowset[0].Columns.Column[i].Name;
                                var oCell = new sap.m.Text({
                                    text: "{" + name + "}"
                                });
                                oItem.addCell(oCell);
                                if (bCustom) {
                                    var iIndex = aExpectedColumns.indexOf(name);
                                    if (iIndex > -1) {
                                        aExpectedColumns.splice(iIndex, 1);
                                        result.Rowsets.Rowset[0].Columns.Column[i].Color = "green"
                                        result.Rowsets.Rowset[0].Columns.Column[i].Icon = "sys-enter"
                                    } else {
                                        result.Rowsets.Rowset[0].Columns.Column[i].Color = "gray"
                                        result.Rowsets.Rowset[0].Columns.Column[i].Icon = "sys-minus"
                                    }
                                }
                            }
                            if (bCustom) {
                                for (let sColumnName of aExpectedColumns) {
                                    result.Rowsets.Rowset[0].Columns.Column.push({
                                        Name: sColumnName,
                                        Color: "red",
                                        Icon: "sys-cancel"
                                    })
                                }
                                var oColumn = new sap.m.Column({
                                    header: new sap.m.VBox({
                                        items: [
                                            new sap.m.Text({
                                                text: "{Name}"
                                            }),
                                            new sap.ui.core.Icon({
                                                src: "sap-icon://{Icon}",
                                                color: "{Color}"
                                            })
                                        ]
                                    })
                                });
                                oTable.bindAggregation("columns", {
                                    path: "/Rowset/0/Columns/Column",
                                    template: oColumn,
                                    templateShareable: false
                                });
                            }
                            oTable.bindItems("/Rowset/0/Row", oItem);
                            oContextualInformationController.oModelSqlTestResult.setData(data);
                            oContextualInformationController.oModelSqlTestResult.refresh();
                            oTable.setVisible(true);
                            oTableError.setVisible(false);
                        }

                    }
                });
            }
        },
        fnClosePopOver: function () {
            this._oDialog.close();
        },
        fnTestTransactionOutput: function () {
            if (!this.oDateDialog) {
                this.oDateDialog = sap.ui.xmlfragment(this.getView().getId(), "StreamingEngine.StreamingEngine.fragment.ContextualDatePickerDialog", this);
                this.getView().addDependent(this.oDateDialog);
                this.oDateDialog.attachAfterClose(function () {
                    this.getParent().byId("datetimepicker-to-date").setValueState("None");
                    this.getParent().byId("datetimepicker-from-date").setValueState("None");
                    this.setBusy(false);
                })
            }
            sInputTextAreaSQLQuery = this.getView().byId("input-text-area-sql-query").getValue();
            let sNoSqlMessage = oResourceBundle.getText("flowNoSqlMessage");
            if (sInputTextAreaSQLQuery != "") {
                this.oDateDialog.open();
            } else {
                // MessageToast.show(sNoSqlMessage);
                this.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                    oResourceBundle.getText("flowInfoTestSql"),
                    sNoSqlMessage,
                    "Error");
            }
        },
        fnDateTimeChanged: function (oEvent) {
            var oDate = oEvent.getSource().getDateValue();
            if (oDate == null) {
                oEvent.getSource().setValueState("Error");
                if (oEvent.getParameter("id").endsWith("from-date")) {
                    this.getView().byId("datetimepicker-to-date").setMinDate(null);
                } else {
                    this.getView().byId("datetimepicker-from-date").setMaxDate(null);
                }
            } else {
                var oFormatter = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-ddTHH:mm:ss" });
                oEvent.getSource().setValueState("None");
                oEvent.getSource().setValue(oFormatter.format(oDate));
                if (oEvent.getParameter("id").endsWith("from-date")) {
                    this.getView().byId("datetimepicker-to-date").setMinDate(oDate);
                } else {
                    this.getView().byId("datetimepicker-from-date").setMaxDate(oDate);
                }
            }
        },
        fnDownloadTransactionOutput: function (oEvent) {
            var oDialog = oEvent.getSource().getParent();
            var oFromDate = this.getView().byId("datetimepicker-from-date");
            var oToDate = this.getView().byId("datetimepicker-to-date");
            var bValid = true;
            if (oFromDate.getDateValue() == null) {
                oFromDate.setValueState("Error");
                bValid = false;
            } else {
                oFromDate.setValueState("None");
            }
            if (oToDate.getDateValue() == null) {
                oToDate.setValueState("Error");
                bValid = false;
            } else {
                oToDate.setValueState("None");
            }
            if (bValid) {
                oDialog.setBusy(true);
                // Get JobID and PlantID
                $.ajax({
                    url: "/XMII/Illuminator?Content-Type=text/json",
                    type: "POST",
                    data: {
                        'QueryTemplate': 'StreamingEngine/JobEngine/Query/JobEnabledListQuery',
                        'Param.1': "CONTEXTUAL",
                        'Param.2': sFlowID
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError !== undefined) {
                            oContextualInformationController.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                                oResourceBundle.getText("flowInfoTestTransaction"),
                                result.Rowsets.FatalError,
                                "Error");
                            oDialog.setBusy(false);
                            oDialog.close();
                        } else {
                            if (result.Rowsets.Rowset[0].Row != undefined) {
                                var oFormatter = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-ddTHH:mm:ss" });
                                $.ajax({
                                    url: "/XMII/Illuminator?Content-Type=text/json",
                                    type: "POST",
                                    data: {
                                        'QueryTemplate': 'StreamingEngine/DataFlow/ExtendedTransactions/Queries/CommonXacuteQuery',
                                        "Transaction": sComboMiiTransaction,
                                        'Param.1': result.Rowsets.Rowset[0].Row[0].ID_PLANT,
                                        'Param.2': result.Rowsets.Rowset[0].Row[0].ID_JOB,
                                        'Param.5': sInputTextAreaSQLQuery,
                                        "StartDate": oFormatter.format(oFromDate.getDateValue()),
                                        "EndDate": oFormatter.format(oToDate.getDateValue())
                                    },
                                    success: function (result) {
                                        oDialog.setBusy(false);

                                        if (result.Rowsets.FatalError !== undefined) {
                                            oContextualInformationController.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                                                oResourceBundle.getText("flowInfoTestTransaction"),
                                                result.Rowsets.FatalError,
                                                "Error");
                                        } else {
                                            var sMessage = result.Rowsets.Rowset[0].Row[0].OutputJSON;
                                            var oAnchor = document.createElement("a");
                                            var oFile = new Blob([sMessage]);
                                            oAnchor.download = "TransactionOutput.json";
                                            oAnchor.href = window.URL.createObjectURL(oFile);
                                            oAnchor.click();
                                            oDialog.close();
                                        }
                                    }
                                });
                            } else {
                                oDialog.setBusy(false);
                                oDialog.close();
                                oContextualInformationController.fnCloseDateDialog();
                                oContextualInformationController.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                                    oResourceBundle.getText("flowInfoTestTransaction"),
                                    "No job was found! Flow must be enabled and linked to a job before testing the transaction!",
                                    "Error");
                            }
                        }
                    }
                })
            }
        },
        fnCloseDateDialog: function () {
            this.oDateDialog.close();
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
                } else if (sControlName == "sap.m.TextArea") {
                    arrCurrentItems[0].setValue(sSelectedValue);
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
                        that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
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
                        oContextualInformationController.oModelRestoreValue.setData(data);
                        oContextualInformationController.oModelRestoreValue.refresh();
                        oDialog.close();
                    }

                }
            });
        },
        /*****************************************************************************/
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("ContextualFlows", {
                Refresh: "N"
            });

        },
        fnNavigateBackAndReload: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("ContextualFlows", {
                Refresh: "Y"
            });

        },
        fnValidateChangeComments: function () {
            var oChangeTracker = this.oModelChangeMessages.getData();

            oChangeTracker.fnUpdateNewValue("DS_NAME", sInputDataFlowName);
            oChangeTracker.fnUpdateNewValue("DS_DESCRIPTION", sInputDescription);
            oChangeTracker.fnUpdateNewValue("ID_DATA_DESTINATION", sDataDestination);
            oChangeTracker.fnUpdateNewValue("DS_SQL_QUERY", sInputTextAreaSQLQuery);
            oChangeTracker.fnUpdateNewValue("DS_MII_TRANSACTION", sComboMiiTransaction);
            oChangeTracker.fnUpdateNewValue("FL_COMPRESSED", (bCompressed == 1 ? sYesLabel : sNoLabel));
            oChangeTracker.fnUpdateNewValue("FL_ENABLED", (bEnabled == 1 ? sYesLabel : sNoLabel));

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
                        oContextualInformationController.fnAddUpdateFlow();
                        oChangeCommentDialog.close();
                    } else {
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
                        that.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
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
        fnTransactionChanged: function () {
            sTriggerTransactionChanged = 1;
            sComboMiiTransaction = this.getView().byId("combobox-mii-transaction").getSelectedKey();
            sTransactionVal = this.getView().byId("combobox-mii-transaction").getSelectedKey();
            if (this.bCustomQuery && (
                sComboMiiTransaction.endsWith("ProcessEventInformation.trx") ||
                sComboMiiTransaction.endsWith("ProcessEventInformationV2.trx") ||
                sComboMiiTransaction.endsWith("DeltaV.trx") ||
                sComboMiiTransaction.endsWith("BatchInformation.trx"))) {
                this.getView().byId("button-test-transaction").setVisible(true);
            } else {
                this.getView().byId("button-test-transaction").setVisible(false);
            }
        },
        onChangeDestination: function () {
            sTriggerDestinationChanged = 1;
            this.getView().byId("objectStatus-dd-disabled").setVisible(false);
            sDestinationVal = this.getView().byId("combobox-datadestination").getSelectedKey();
            if (sDestinationVal.startsWith("SE_PRD")) {
                MessageBox.confirm(oResourceBundle.getText("commonPRDDatadestinationConfirmation"), {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === "NO") {
                            oContextualInformationController.getView().byId("combobox-datadestination").setSelectedKey(sOldDataDestination);
                        }
                    }
                });
            }
        }
    });
});