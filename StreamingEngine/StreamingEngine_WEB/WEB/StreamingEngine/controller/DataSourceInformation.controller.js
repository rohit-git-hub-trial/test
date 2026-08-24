/*-----------------------------------------------------------------------------------
Streaming Engine - Data Source Information
Creation Date: 2020.05.15 / By: E0445955
Reference Document: 
Description:This screen is used to Add, Edit or Delete a Data Source. Also to  download tag 
Catalog to the database manually
-------------------------------------------------------------------------------------*/
var sPlantID;
var sDataSourceID;
var sMode;
var sAction;
var sInputPlantId;
var sInputDataSourceID;
var sInputDataSourceName;
var sInputDataSourceDescription;
var sComboDataServerProcess;
var sComboDataServerContext;
var sComboDataServerFile;
var sComboDataServerContextType;
var sComboDataServerProcessType;
var sComboBatchSource;
var sInputEquipmentLevel;
var sComboPCoCredential;
var sInputPCoPrefix;
var sInputPCoUrl;
var sInputTextAreaSQLQuery;
var iSwitchArchive;
var iSwitchContextual;
var iSwitchRealTime;
var iSwitchEnabled;
var iSwitchHistory;
var iSwitchBatch;
var iSwitchFlatFile;
var iSwitchEngie;
var iMaxHistoricalUploads;
var oDataSourceInformationController;
var oDialog;
var oResourceBundle;
var bShowCommentDialog = true;
var sYesLabel;
var sNoLabel;
var iSwitchIdoc;
/*****Below Variables are for Restore functionality******/
var oCurrentControl;
var sCurrentColumnName;
var iCurrentControlCount;
var arrCurrentItems;
var sCurrentLabel;
var sTagCatalogTable = "SE_SOURCE";
/******************************************************/
sap.ui.define([
    "../controller/BaseController",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "StreamingEngine/StreamingEngine/model/formatter",
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV"
], function (BaseController, Dialog, Button, Text, MessageToast, JSONModel, Filter, formatter, Export, ExportTypeCSV) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.DataSourceInformation", {
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            sYesLabel = oResourceBundle.getText("commonYes").toUpperCase();
            sNoLabel = oResourceBundle.getText("commonNo").toUpperCase();

            oDataSourceInformationController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            this.getView().byId("combobox-dataserver-process").setModel(this.oModelDataServer);
            this.getView().byId("combobox-dataserver-contextual").setModel(this.oModelDataServer);
            this.getView().byId("combobox-batch-source-system").setModel(this.oModelBatchSource);
            this.getView().byId("combobox-pco-credential").setModel(this.oModelCredentials);
            this.getView().byId("table-pco-agents-data_source").setModel(this.oModelPcoAgents);
            this.fnLoadPlant();
            this.fnLoadDataServer();
            this.fnLoadBatchSource();
            this.fnLoadMIICredentialsList();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("DataSourceInformation").attachPatternMatched(this._onObjectMatched, this);
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
                this.getView().byId("page-data-source-information").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        oModelPlant: new sap.ui.model.json.JSONModel(),
        oModelDataServer: new sap.ui.model.json.JSONModel(),
        oModelBatchSource: new sap.ui.model.json.JSONModel(),
        oModelCredentials: new sap.ui.model.json.JSONModel(),
        oModelPcoAgents: new sap.ui.model.json.JSONModel(),
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleDataSourceInfo"));
            sMode = oEvent.getParameter("arguments").MODE;
            var sNewDSLabel = oResourceBundle.getText("dsInfoNewDataSource");

            this.getView().byId("combobox-plant").setSelectedKey("");
            this.getView().byId("input-source-id").setValue("");
            this.getView().byId("switch-enabled").setState(false);
            this.getView().byId("input-data-source-name").setValue("");
            this.getView().byId("combobox-dataserver-process").setSelectedKey("");
            this.getView().byId("combobox-dataserver-contextual").setSelectedKey("");
            this.getView().byId("input-file-path").setValue("");
            this.getView().byId("combobox-batch-source-system").setSelectedKey("");
            this.getView().byId("input-description").setValue("");
            this.getView().byId("input-pco-server-url").setValue("");
            this.getView().byId("combobox-pco-credential").setSelectedKey("");
            this.getView().byId("input-pco-prefix").setValue("");
            this.getView().byId("switch-realtime").setState(false);
            this.getView().byId("switch-archive").setState(false);
            this.getView().byId("switch-contextual").setState(false);
            this.getView().byId("switch-history").setState(false);
            this.getView().byId("switch-flat-file").setState(false);
            this.getView().byId("switch-engie").setState(false);
            this.getView().byId("input-batch-source-equipment-level").setValue("");

            this.getView().byId("input-pco-server-url").setValueState("None");
            this.getView().byId("combobox-plant").setValueState("None");
            this.getView().byId("input-data-source-name").setValueState("None");
            this.getView().byId("input-description").setValueState("None");
            this.getView().byId("combobox-dataserver-process").setValueState("None");
            this.getView().byId("combobox-dataserver-contextual-type").setValueState("None");
            this.getView().byId("combobox-batch-source-system").setValueState("None");
            this.getView().byId("input-batch-source-equipment-level").setValueState("None");
            this.getView().byId("combobox-pco-credential").setValueState("None");
            this.getView().byId("input-pco-prefix").setValueState("None");
            this.getView().byId("input-text-area-sql-query").setValueState("None");

            if (sMode == "U") {

                sPlantID = oEvent.getParameter("arguments").ID_PLANT;
                sDataSourceID = oEvent.getParameter("arguments").ID_SOURCE;
                var sDataSourceName = decodeURIComponent(oEvent.getParameter("arguments").DS_NAME);
                var sPlantName = oEvent.getParameter("arguments").PLANT;
                var sDataSourceDescription = decodeURIComponent(oEvent.getParameter("arguments").DS_DESCRIPTION);
                var sDataServerProcess = oEvent.getParameter("arguments").DS_MII_DATA_SERVER_PROCESS;
                var sDataServerContextual = oEvent.getParameter("arguments").DS_MII_DATA_SERVER_CONTEXT;
                var sDataServerFile = decodeURIComponent(oEvent.getParameter("arguments").DS_MII_DATA_SERVER_FILE);
                var sComboBatchSource = oEvent.getParameter("arguments").ID_BATCH_SOURCE;
                var sPCoServerURL = decodeURIComponent(oEvent.getParameter("arguments").DS_PCO_SERVER_URL);
                var sPCoAgentPrefix = oEvent.getParameter("arguments").DS_PCO_AGENT_PREFIX;
                var sPCoCredential = oEvent.getParameter("arguments").DS_PCO_CREDENTIAL;
                var bRealtime = oEvent.getParameter("arguments").FL_REALTIME == 1 ? true : false;
                var bArchive = oEvent.getParameter("arguments").FL_ARCHIVE == 1 ? true : false;
                var bContextual = oEvent.getParameter("arguments").FL_CONTEXTUAL == 1 ? true : false;
                var bEnabled = oEvent.getParameter("arguments").FL_ENABLED == 1 ? true : false;
                var bHistory = oEvent.getParameter("arguments").FL_HISTORY == 1 ? true : false;
                var bBatchInfo = oEvent.getParameter("arguments").FL_BATCH_INFO == 1 ? true : false;
                var bFlatFile = oEvent.getParameter("arguments").FL_FLAT_FILE == 1 ? true : false;
                var bEngie = oEvent.getParameter("arguments").FL_ENERGY == 1 ? true : false;
                var bIdoc = oEvent.getParameter("arguments").FL_IDOC == 1 ? true : false;
                var sInputEquipmentLevel = decodeURIComponent(oEvent.getParameter("arguments").DS_BATCH_EQUIPMENT_LEVELS);
                var sComboDataServerContextType = oEvent.getParameter("arguments").DS_MII_DATA_SERVER_C_TYPE;
                var sComboDataServerProcessType = oEvent.getParameter("arguments").DS_MII_DATA_SERVER_P_TYPE;
                var sInputTextAreaSQLQuery = decodeURIComponent(oEvent.getParameter("arguments").DS_SQL_QUERY);
                var iMaxHistoricalUploads = oEvent.getParameter("arguments").QT_MAX_HISTORICAL_UPLOADS;
                if (sComboDataServerProcessType == "NA") sComboDataServerProcessType = "";
                if (sPCoAgentPrefix == "NA") sPCoAgentPrefix = "";
                if (sPCoServerURL == "NA") sPCoServerURL = "";
                if (sDataServerProcess == "NA") sDataServerProcess = "";
                if (sDataServerContextual == "NA") sDataServerContextual = "";
                if (sDataServerFile == "NA") sDataServerFile = "";
                if (sComboBatchSource == "NA") sComboBatchSource = "";
                if (sPCoCredential == "NA") sPCoCredential = "";
                if (sInputTextAreaSQLQuery == "NA") sInputTextAreaSQLQuery = "";
                if (bBatchInfo == false) {
                    sComboBatchSource = "";
                    sInputEquipmentLevel = "";
                }
                if (sDataServerContextual == "") {
                    sComboDataServerContextType = "";
                }
                if (bContextual == true) {
                    this.getView().byId("combobox-batch-source-system").setEnabled(true);
                    this.getView().byId("input-batch-source-equipment-level").setEnabled(true);
                    this.getView().byId("label-batch-source-system").setRequired(true);
                    this.getView().byId("label-batch-source-equipment-level").setRequired(true);
                    this.getView().byId("combobox-batch-source-system").fireSelectionChange();
                    this.getView().byId("title-source-form-batch").setText(oResourceBundle.getText("dataSourceParamsGroupBatch"));
                    this.getView().byId("title-source-form-batch").setIcon("sap-icon://activity-items");
                } else {
                    this.getView().byId("combobox-batch-source-system").setSelectedKey("");
                    this.getView().byId("combobox-batch-source-system").setEnabled(false);
                    this.getView().byId("input-batch-source-equipment-level").setValue("");
                    this.getView().byId("input-batch-source-equipment-level").setEnabled(false);
                    this.getView().byId("label-batch-source-system").setRequired(false);
                    this.getView().byId("label-batch-source-equipment-level").setRequired(false);
                    this.getView().byId("title-source-form-batch").setText("");
                    this.getView().byId("title-source-form-batch").setIcon(null);
                }

                if (bRealtime == true) {
                    this.getView().byId("title-source-form-realtime").setText(oResourceBundle.getText("dsRealtimeInformation"));
                    this.getView().byId("title-source-form-realtime").setIcon("sap-icon://feed");
                    this.getView().byId("table-pco-agents-data_source").setVisible(true);
                    this.fnLoadPCoAgents();
                } else {
                    this.getView().byId("title-source-form-realtime").setText("");
                    this.getView().byId("title-source-form-realtime").setIcon(null);
                    this.getView().byId("table-pco-agents-data_source").setVisible(false);
                }

                var oData = {
                    bVariables: {
                        Contextual: bContextual,
                        External: bEngie,
                        RealTime: bRealtime,
                        FlatFile: bFlatFile,
                        Archive: bArchive,
                        Idoc: bIdoc,
                        DataserverContext: sComboDataServerContextType != "" ? true : false,
                        DataserverProcess: sComboDataServerProcessType != "" ? true : false
                    }
                };
                var oModel = new JSONModel(oData);
                this.getView().setModel(oModel);

                if (bRequireChangeComment) {
                    this.oModelChangeMessages.getData().Row = [
                        { columnName: "DS_NAME", name: oResourceBundle.getText("dsInfoDataSourcename"), old: sDataSourceName, new: null, message: "" },
                        { columnName: "FL_ENABLED", name: oResourceBundle.getText("dataSourcesEnabled"), old: (bEnabled ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "DS_MII_DATA_SERVER_PROCESS", name: oResourceBundle.getText("dataSourcesDataServerProcess"), old: sDataServerProcess, new: null, message: "" },
                        { columnName: "DS_MII_DATA_SERVER_CONTEXT", name: oResourceBundle.getText("dataSourcesDataServerContextual"), old: sDataServerContextual, new: null, message: "" },
                        { columnName: "DS_MII_DATA_SERVER_FILE", name: oResourceBundle.getText("dataSourcesDataServerFile"), old: sDataServerFile, new: null, message: "" },
                        { columnName: "DS_DESCRIPTION", name: oResourceBundle.getText("dataSourcesDesc"), old: sDataSourceDescription, new: null, message: "" },
                        { columnName: "DS_MII_DATA_SERVER_C_TYPE", name: oResourceBundle.getText("dataSourcesDataServerContextual") + " Type", old: sComboDataServerContextType, new: null, message: "" },
                        { columnName: "DS_PCO_SERVER_URL", name: oResourceBundle.getText("dsInfoPcoUrl"), old: sPCoServerURL, new: null, message: "" },
                        { columnName: "DS_PCO_CREDENTIAL", name: oResourceBundle.getText("dsInfoPcoCredential"), old: sPCoCredential, new: null, message: "" },
                        { columnName: "DS_PCO_AGENT_PREFIX", name: oResourceBundle.getText("dsInfoPcoPrefix"), old: sPCoAgentPrefix, new: null, message: "" },
                        { columnName: "FL_HISTORY", name: oResourceBundle.getText("dsInfoHistoricalDataAvailable"), old: (bHistory ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "FL_REALTIME", name: oResourceBundle.getText("dsInfoAllowRealtime"), old: (bRealtime ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "FL_ARCHIVE", name: oResourceBundle.getText("dsInfoAllowArchive"), old: (bArchive ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "FL_CONTEXTUAL", name: oResourceBundle.getText("dsInfoAllowContextual"), old: (bContextual ? sYesLabel : sNoLabel), new: null, message: "" },
                        // { columnName: "FL_BATCH_INFO", name: oResourceBundle.getText("dataSourceEnableBatchCatalog"), old: (bBatchInfo ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "FL_FLAT_FILE", name: oResourceBundle.getText("dsInfoAllowFlatFile"), old: (bFlatFile ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "FL_ENERGY", name: oResourceBundle.getText("dsInfoAllowEngie"), old: (bEngie ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "ID_BATCH_SOURCE", name: oResourceBundle.getText("dataSourceBatchSourceSystem"), old: sComboBatchSource, new: null, message: "" },
                        { columnName: "DS_BATCH_EQUIPMENT_LEVELS", name: oResourceBundle.getText("dataSourceBatchEquipmentLevelList"), old: sInputEquipmentLevel, new: null, message: "" },
                        { columnName: "DS_MII_DATA_SERVER_P_TYPE", name: oResourceBundle.getText("dataSourcesDataServerProcess") + " Type", old: sComboDataServerProcessType, new: null, message: "" },
                        { columnName: "DS_SQL_QUERY", name: oResourceBundle.getText("flowInfoSqlQuery"), old: sInputTextAreaSQLQuery, new: null, message: "" },
                        { columnName: "QT_MAX_HISTORICAL_UPLOADS", name: oResourceBundle.getText("MaximumHistoricalUploads"), old: iMaxHistoricalUploads, new: null, message: "" },
                        { columnName: "FL_IDOC", name: oResourceBundle.getText("dsInfoAllowIdoc"), old: (bIdoc ? sYesLabel : sNoLabel), new: null, message: "" },
                    ];
                }

                this.getView().byId("combobox-plant").setEnabled(false);
                this.getView().byId("button-delete").setVisible(true);
                this.getView().byId("header-plant-name").setText(sPlantName);
                this.getView().byId("object-header-data-source-info").setTitle(sDataSourceName);
                this.getView().byId("header-plant-name").setVisible(true);
                this.getView().byId("combobox-plant").setSelectedKey(sPlantID);
                this.getView().byId("input-source-id").setValue(sDataSourceID);
                this.getView().byId("input-source-id").setEnabled(false);
                this.getView().byId("switch-enabled").setState(bEnabled);
                this.getView().byId("input-data-source-name").setValue(sDataSourceName);
                this.getView().byId("combobox-dataserver-process").setSelectedKey(sDataServerProcess);
                this.getView().byId("combobox-dataserver-contextual").setSelectedKey(sDataServerContextual);
                this.getView().byId("input-file-path").setValue(sDataServerFile);
                this.getView().byId("combobox-dataserver-contextual-type").setSelectedKey(sComboDataServerContextType);
                this.getView().byId("input-description").setValue(sDataSourceDescription);
                this.getView().byId("input-MaxHistoricalUploads").setValue(iMaxHistoricalUploads);
                this.getView().byId("input-pco-server-url").setValue(sPCoServerURL);
                this.getView().byId("combobox-pco-credential").setSelectedKey(sPCoCredential);
                this.getView().byId("input-pco-prefix").setValue(sPCoAgentPrefix);

                this.getView().byId("switch-realtime").setEnabled(false);
                this.getView().byId("switch-archive").setEnabled(false);
                this.getView().byId("switch-contextual").setEnabled(false);
                this.getView().byId("switch-flat-file").setEnabled(false);
                this.getView().byId("switch-engie").setEnabled(false);
                this.getView().byId("switch-idoc").setEnabled(false);
                this.getView().byId("switch-realtime").setState(bRealtime);
                this.getView().byId("switch-archive").setState(bArchive);
                this.getView().byId("switch-contextual").setState(bContextual);
                this.getView().byId("switch-history").setState(bHistory);
                // this.getView().byId("switch-batch-information-enabled").setState(bBatchInfo);
                this.getView().byId("switch-flat-file").setState(bFlatFile);
                this.getView().byId("switch-engie").setState(bEngie);
                this.getView().byId("switch-idoc").setState(bIdoc);
                this.getView().byId("combobox-batch-source-system").setSelectedKey(sComboBatchSource);
                this.getView().byId("input-batch-source-equipment-level").setValue(sInputEquipmentLevel);
                this.getView().byId("combobox-dataserver-process-type").setSelectedKey(sComboDataServerProcessType);
                this.getView().byId("input-text-area-sql-query").setValue(sInputTextAreaSQLQuery);

                // if data source is archive allow editing realtime switch
                if (bArchive) {
                    this.getView().byId("switch-realtime").setEnabled(true);
                }

                /********************Below are Restore Buttons********************/
                sTagCatalogTable = "SE_SOURCE";
                this.getView().byId("button-restore-enabled").setVisible(true);
                this.getView().byId("button-restore-data-source-name").setVisible(true);
                this.getView().byId("button-restore-data-server-process").setVisible(true);
                this.getView().byId("button-restore-data-server-contextual").setVisible(true);
                this.getView().byId("button-restore-data-server-file").setVisible(true);
                this.getView().byId("button-restore-description").setVisible(true);
                this.getView().byId("button-restore-Maxuploads").setVisible(true);
                this.getView().byId("button-restore-pco-server-url").setVisible(true);
                this.getView().byId("button-restore-pco-credential").setVisible(true);
                this.getView().byId("button-restore-pco-prefix").setVisible(true);
                this.getView().byId("button-restore-realtime").setVisible(true);
                this.getView().byId("button-restore-archive").setVisible(true);
                this.getView().byId("button-restore-contextual").setVisible(true);
                this.getView().byId("button-restore-history").setVisible(true);
                // this.getView().byId("button-restore-batch-enabled").setVisible(true);
                this.getView().byId("button-restore-batch-source").setVisible(true);
                this.getView().byId("button-restore-batch-equipment-level").setVisible(true);
                //this.getView().byId("button-restore-kepware-channels").setVisible(true);
                this.getView().byId("button-restore-flat-file").setVisible(true);
                this.getView().byId("button-restore-engie").setVisible(true);
                this.getView().byId("button-restore-idoc").setVisible(true);

                /*****************************************************************/

            } else if (sMode == "I") {
                this.getView().byId("button-delete").setVisible(false);
                this.getView().byId("input-source-id").setEnabled(true);
                this.getView().byId("header-plant-name").setText("");
                this.getView().byId("object-header-data-source-info").setTitle(sNewDSLabel);
                this.getView().byId("header-plant-name").setVisible(false);
                this.getView().byId("combobox-plant").setEnabled(true);
                this.getView().byId("combobox-plant").setSelectedKey("");
                this.getView().byId("input-source-id").setValue("");
                this.getView().byId("input-source-id").setEnabled(false);
                this.getView().byId("switch-enabled").setState(false);
                this.getView().byId("input-data-source-name").setValue("");
                this.getView().byId("combobox-dataserver-process").setSelectedKey("");
                this.getView().byId("combobox-dataserver-contextual").setSelectedKey("");
                this.getView().byId("input-file-path").setValue("");
                this.getView().byId("combobox-dataserver-contextual-type").setSelectedKey("");
                this.getView().byId("combobox-batch-source-system").setSelectedKey("");
                this.getView().byId("input-description").setValue("");
                this.getView().byId("input-pco-server-url").setValue("");
                this.getView().byId("combobox-pco-credential").setSelectedKey("");
                this.getView().byId("input-pco-prefix").setValue("");
                this.getView().byId("switch-realtime").setState(false);
                this.getView().byId("switch-archive").setState(false);
                this.getView().byId("switch-contextual").setState(false);
                this.getView().byId("switch-history").setState(false);
                // this.getView().byId("switch-batch-information-enabled").setState(false);
                this.getView().byId("switch-flat-file").setState(false);
                this.getView().byId("switch-engie").setState(false);
                this.getView().byId("switch-idoc").setState(false);
                this.getView().byId("combobox-batch-source-system").setSelectedKey("");
                this.getView().byId("input-batch-source-equipment-level").setValue("");
                this.getView().byId("combobox-dataserver-process-type").setSelectedKey("");
                this.getView().byId("input-text-area-sql-query").setValue("");

                /********************Below are Restore Buttons********************/
                this.getView().byId("button-restore-enabled").setVisible(false);
                this.getView().byId("button-restore-data-source-name").setVisible(false);
                this.getView().byId("button-restore-data-server-process").setVisible(false);
                this.getView().byId("button-restore-data-server-contextual").setVisible(false);
                this.getView().byId("button-restore-data-server-file").setVisible(false);
                this.getView().byId("button-restore-description").setVisible(false);
                this.getView().byId("button-restore-Maxuploads").setVisible(false);
                this.getView().byId("button-restore-pco-server-url").setVisible(false);
                this.getView().byId("button-restore-pco-credential").setVisible(false);
                this.getView().byId("button-restore-pco-prefix").setVisible(false);
                this.getView().byId("button-restore-realtime").setVisible(false);
                this.getView().byId("button-restore-archive").setVisible(false);
                this.getView().byId("button-restore-contextual").setVisible(false);
                this.getView().byId("button-restore-history").setVisible(false);
                this.getView().byId("button-restore-batch-enabled").setVisible(false);
                this.getView().byId("button-restore-batch-source").setVisible(false);
                this.getView().byId("button-restore-batch-equipment-level").setVisible(false);
                //this.getView().byId("button-restore-kepware-channels").setVisible(false);
                this.getView().byId("button-restore-flat-file").setVisible(false);
                this.getView().byId("button-restore-engie").setVisible(false);
                this.getView().byId("button-restore-idoc").setVisible(false);

                /*****************************************************************/
            }
            this.getView().byId("switch-engie").fireChange();
            this.getView().byId("switch-idoc").fireChange();
            this.getView().byId("switch-flat-file").fireChange();
            this.getView().byId("switch-realtime").fireChange();
            // this.fnBatchInformationSwitched();
            this.fnSourceSystemChanged();

        },

        fnLoadPlant: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                            oResourceBundle.getText("dataSourcesLoadPlantsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oDataSourceInformationController.oModelPlant.setData(data);
                        oDataSourceInformationController.oModelPlant.refresh();
                    }
                }
            });
        },
        fnLoadDataServer: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/GetDataServerXacuteQuery&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                            oResourceBundle.getText("dataSourcesInfoLoadServerList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
						oDataSourceInformationController.oModelDataServer.setSizeLimit(200)
                        oDataSourceInformationController.oModelDataServer.setData(data);
                        oDataSourceInformationController.oModelDataServer.refresh();
                    }
                }
            });
        },
        fnLoadBatchSource: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchSourceListSelectQuery&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                            oResourceBundle.getText("dataSourcesLoadSourceList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oDataSourceInformationController.oModelBatchSource.setData(data);
                        oDataSourceInformationController.oModelBatchSource.refresh();
                    }
                }
            });
        },
        fnLoadMIICredentialsList: function () {
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
                        oDataSourceInformationController.oModelCredentials.setData(data);
                        oDataSourceInformationController.oModelCredentials.refresh();
                    }
                }
            });
        },
        fnLoadPCoAgents: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/RealtimeFlowAgentListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sPlantID,
                    "Param.2": sDataSourceID,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                            oResourceBundle.getText("RealtimeLoadPcoAgent"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oDataSourceInformationController.oModelPcoAgents.setData(data);
                        oDataSourceInformationController.oModelPcoAgents.refresh();
                    }
                }
            });
        },

        fnValidateInputs: function () {
            var bValidInputs = true;

            sInputPlantId = this.getView().byId("combobox-plant").getSelectedKey();
            sInputDataSourceID = this.getView().byId("input-source-id").getValue();
            sInputDataSourceName = this.getView().byId("input-data-source-name").getValue();
            sInputDataSourceDescription = this.getView().byId("input-description").getValue();
            sComboDataServerProcess = this.getView().byId("combobox-dataserver-process").getSelectedKey();
            sComboDataServerContext = this.getView().byId("combobox-dataserver-contextual").getSelectedKey();
            sComboDataServerFile = this.getView().byId("input-file-path").getValue();
            sComboDataServerContextType = this.getView().byId("combobox-dataserver-contextual-type").getSelectedKey();
            sComboDataServerProcessType = this.getView().byId("combobox-dataserver-process-type").getSelectedKey();
            sComboBatchSource = this.getView().byId("combobox-batch-source-system").getSelectedKey();
            sComboPCoCredential = this.getView().byId("combobox-pco-credential").getSelectedKey();
            iMaxHistoricalUploads = this.getView().byId("input-MaxHistoricalUploads").getValue();
            sInputPCoPrefix = this.getView().byId("input-pco-prefix").getValue();
            sInputPCoUrl = this.getView().byId("input-pco-server-url").getValue();
            iSwitchArchive = this.getView().byId("switch-archive").getState() ? 1 : 0;
            iSwitchContextual = this.getView().byId("switch-contextual").getState() ? 1 : 0;
            iSwitchRealTime = this.getView().byId("switch-realtime").getState() ? 1 : 0;
            iSwitchEnabled = this.getView().byId("switch-enabled").getState() ? 1 : 0;
            iSwitchHistory = this.getView().byId("switch-history").getState() ? 1 : 0;
            // iSwitchBatch = this.getView().byId("switch-batch-information-enabled").getState() ? 1 : 0;
            iSwitchFlatFile = this.getView().byId("switch-flat-file").getState() ? 1 : 0;
            iSwitchEngie = this.getView().byId("switch-engie").getState() ? 1 : 0;
            iSwitchIdoc = this.getView().byId("switch-idoc").getState() ? 1 : 0;
            sInputEquipmentLevel = this.getView().byId("input-batch-source-equipment-level").getValue();
            sInputTextAreaSQLQuery = this.getView().byId("input-text-area-sql-query").getValue();

            if (sInputPCoUrl == "" && iSwitchEngie == "0" && iSwitchIdoc =="0" && this.getView().byId("input-pco-server-url").getVisible() == true) {
                bValidInputs = false;
                this.getView().byId("input-pco-server-url").setValueState("Error");
            } else {
                this.getView().byId("input-pco-server-url").setValueState("None");
            }

            if (sInputPlantId == "" && this.getView().byId("combobox-plant").getVisible() == true) {
                bValidInputs = false;
                this.getView().byId("combobox-plant").setValueState("Error");
            } else {
                this.getView().byId("combobox-plant").setValueState("None");
            }

            if (sInputDataSourceName == "" && this.getView().byId("input-data-source-name").getVisible() == true) {
                bValidInputs = false;
                this.getView().byId("input-data-source-name").setValueState("Error");
            } else {
                this.getView().byId("input-data-source-name").setValueState("None");
            }

            if (sInputDataSourceDescription == "" && this.getView().byId("input-description").getVisible() == true) {
                bValidInputs = false;
                this.getView().byId("input-description").setValueState("Error");
            } else {
                this.getView().byId("input-description").setValueState("None");
            }

            if (sComboDataServerProcess == "" && iSwitchFlatFile == "0" && iSwitchEngie == "0" && iSwitchIdoc == "0"&& iSwitchContextual == 0) {
                bValidInputs = false;
                this.getView().byId("combobox-dataserver-process").setValueState("Error");
            } else {
                this.getView().byId("combobox-dataserver-process").setValueState("None");
                /*if (sComboDataServerProcessType == "") {
                    this.getView().byId("combobox-dataserver-process-type").setSelectedKey("Other");
                    sComboDataServerProcessType = "Other"
                }*/
            }

            if (sComboDataServerContext == "" && iSwitchContextual == 1) {
                bValidInputs = false;
                this.getView().byId("combobox-dataserver-contextual").setValueState("Error");
            } else {
                this.getView().byId("combobox-dataserver-contextual").setValueState("None");
            }

            if (sComboDataServerContextType == "" && iSwitchContextual == 1) {
                bValidInputs = false;
                this.getView().byId("combobox-dataserver-contextual-type").setValueState("Error");
            } else {
                this.getView().byId("combobox-dataserver-contextual-type").setValueState("None");
            }

            if ((iSwitchContextual == 1 /*|| iSwitchArchive == 1*/) && (iMaxHistoricalUploads == "" || iMaxHistoricalUploads > 12 || iMaxHistoricalUploads < 1)) {
                bValidInputs = false;
                this.getView().byId("input-MaxHistoricalUploads").setValueState("Error");
            } else {
                this.getView().byId("input-MaxHistoricalUploads").setValueState("None");
            }

            if (sComboBatchSource == "" && this.getView().byId("combobox-batch-source-system").getVisible() == true && iSwitchContextual == 1) {
                bValidInputs = false;
                this.getView().byId("combobox-batch-source-system").setValueState("Error");
            } else {
                this.getView().byId("combobox-batch-source-system").setValueState("None");
            }

            if (sComboBatchSource != "CSV" && sInputEquipmentLevel == "" && this.getView().byId("input-batch-source-equipment-level").getVisible() == true && iSwitchContextual == 1) {
                bValidInputs = false;
                this.getView().byId("input-batch-source-equipment-level").setValueState("Error");
            } else {
                this.getView().byId("input-batch-source-equipment-level").setValueState("None");
            }

            if (sComboPCoCredential == "" && iSwitchEngie == "0" && iSwitchIdoc == "0" && this.getView().byId("combobox-pco-credential").getVisible() == true) {
                bValidInputs = false;
                this.getView().byId("combobox-pco-credential").setValueState("Error");
            } else {
                this.getView().byId("combobox-pco-credential").setValueState("None");
            }
            if (sInputPCoPrefix == "" && iSwitchRealTime == 1 && this.getView().byId("input-pco-prefix").getVisible() == true) {
                bValidInputs = false;
                this.getView().byId("input-pco-prefix").setValueState("Error");
            } else {
                this.getView().byId("input-pco-prefix").setValueState("None");
            }
            if (sComboBatchSource == "CUSTOM" && sInputTextAreaSQLQuery == "" && this.getView().byId("input-text-area-sql-query").getVisible() == true) {
                bValidInputs = false;
                this.getView().byId("input-text-area-sql-query").setValueState("Error");
            } else {
                this.getView().byId("input-text-area-sql-query").setValueState("None");
            }
            return bValidInputs;
        },

        fnSaveDSInformation: function () {
            if (sMode == "I") {
                sAction = "INSERT";
            } else if (sMode == "U") {
                sAction = "UPDATE";
            }
            this.fnAddUpdateDataSourceInformation();
        },
        fnDeleteDS: function () {
            var sConfirmTitle = oResourceBundle.getText("commonConfirm");
            var sConfirmYes = oResourceBundle.getText("commonYes");
            var sConfirmNo = oResourceBundle.getText("commonNo");
            var sConfirmMessage = oResourceBundle.getText("dsInfoDeleteConfirmation");
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
                        oDataSourceInformationController.fnDeleteDataSourceInformation();
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

        /*
        fnAddUpdateDataSourceInformation: function () {
            sComboDataServerContext = this.getView().byId("combobox-dataserver-contextual").getSelectedKey();
            if(sComboDataServerContext=="") {
                sComboDataServerContextType="";
                oDataSourceInformationController.fnAddUpdateDataSourceInformationSubmit();
            } else {
                $.ajax({
                    url: "/XMII/Illuminator?service=SystemInfo&mode=ServerInfo&Name="+sComboDataServerContext+"&Content-Type=text/json",
                    success: function (result) {
                        if (result.Rowsets.Rowset) {
                            var data = result.Rowsets.Rowset[0];
                            for (var i = 0; i < data.Row.length; i++) {
                                if(data.Row[i].Name=="ConnectorType") {
                                    sComboDataServerContextType = data.Row[i].Value;
                                    break;
                                }
                            }
                            oDataSourceInformationController.fnAddUpdateDataSourceInformationSubmit();
                        } else if (result.Rowsets.FatalError) {
                            var errorMsg = result.Rowsets.FatalError;
                            MessageToast.show(errorMsg);
                        }
                    }
                });
            }
        },
        */

        fnAddUpdateDataSourceInformation: function () {
            var bIsValid = this.fnValidateInputs();
            if (iSwitchBatch == 0) {
                sComboBatchSource = "";
                sInputEquipmentLevel = "";
            }
            if (sComboBatchSource != "CUSTOM") {
                sInputTextAreaSQLQuery = ""
            }
            if (bIsValid) {
                var sWaitMessage = oResourceBundle.getText("dsInfoSavingWaitMessage");
                /*********************Check Comments*********************/
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
                oDialog.setText(sWaitMessage);
                if (iSwitchContextual == 1) {
                    iSwitchBatch = 1;
                } else {
                    iSwitchBatch = 0;
                }
                var that = this;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/DataSourceXacuteQuery&Content-Type=text/json",
                    data: {
                        "Param.1": sAction,
                        "Param.2": sInputPlantId,
                        "Param.3": sInputDataSourceID,
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
                        "Param.14": iSwitchEnabled,
                        "Param.15": iSwitchHistory,
                        "Param.16": sComboDataServerContextType,
                        "Param.17": iSwitchBatch,
                        "Param.18": sComboBatchSource,
                        "Param.19": sInputEquipmentLevel,
                        "Param.20": sComboDataServerProcessType,
                        "Param.21": "",
                        "Param.22": sInputTextAreaSQLQuery,
                        "Param.23": iSwitchFlatFile,
                        "Param.24": sComboDataServerFile,
                        "Param.25": iSwitchEngie,
                        "Param.26": iMaxHistoricalUploads,
                        "Param.27": iSwitchIdoc,
                        "Param.30": aCommentColumnName.join("\n"),
                        "Param.31": aCommentMessage.join("\n")
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
                            oDataSourceInformationController.fnNavigateBackAndReload();
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
            }
        },

        fnDeleteDataSourceInformation: function () {
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/DataSourceXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sAction,
                    "Param.3": sDataSourceID
                },
                success: function (result) {
                    if (result.Rowsets.Rowset) {
                        var data = result.Rowsets.Rowset[0];
                        var successMsg = data.Row[0].Output;
                        if (successMsg == "{##SUCCESS_MESSAGE}") {
                            successMsg = oResourceBundle.getText("dsInfoDeleteSuccess");
                        }
                        oDialog.close();
                        //MessageToast.show(successMsg);
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                            oResourceBundle.getText("dataSourcesDeleteDateSourceInfo"),
                            successMsg,
                            "Success");
                        oDataSourceInformationController.fnNavigateBackAndReload();
                    } else if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        oDialog.close();
                        //MessageToast.show(errorMsg);
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                            oResourceBundle.getText("dataSourcesDeleteDateSourceInfo"),
                            errorMsg,
                            "Error");
                    }
                }
            });
        },

        fnBatchInformationSwitched: function () {
            var bBatchInformationStatus = this.getView().byId("switch-batch-information-enabled").getState();
            if (bBatchInformationStatus) {
                this.getView().byId("combobox-batch-source-system").setEnabled(true);
                this.getView().byId("input-batch-source-equipment-level").setEnabled(true);
                this.getView().byId("label-batch-source-system").setRequired(true);
                this.getView().byId("label-batch-source-equipment-level").setRequired(true);
            } else {
                this.getView().byId("combobox-batch-source-system").setSelectedKey("");
                this.getView().byId("combobox-batch-source-system").setEnabled(false);
                this.getView().byId("input-batch-source-equipment-level").setValue("");
                this.getView().byId("input-batch-source-equipment-level").setEnabled(false);
                this.getView().byId("label-batch-source-system").setRequired(false);
                this.getView().byId("label-batch-source-equipment-level").setRequired(false);
            }
            this.getView().byId("combobox-batch-source-system").fireSelectionChange();
        },

       
        fnSourceSystemChanged: function () {
            if (this.getView().byId("combobox-batch-source-system").getSelectedKey() == "CUSTOM") {
                if (this.getView().byId("switch-contextual").getState()) {
                    this.getView().byId("input-text-area-sql-query").setVisible(true);
                    this.getView().byId("label-sql-query").setVisible(true);
                    this.getView().byId("label-sql-query").setRequired(true);
                    this.getView().byId("button-sql-query").setVisible(true);
                }
            } else {
                this.getView().byId("input-text-area-sql-query").setVisible(false);
                this.getView().byId("label-sql-query").setVisible(false);
                this.getView().byId("label-sql-query").setRequired(false);
                this.getView().byId("button-sql-query").setVisible(false);
                this.getView().byId("input-text-area-sql-query").setValue("");
            }
            if (this.getView().byId("combobox-batch-source-system").getSelectedKey() == "CSV") {

                this.getView().byId("button-csv-equipment").setVisible(true);
                this.getView().byId("input-batch-source-equipment-level").getParent().setVisible(false);
                this.getView().byId("label-batch-source-equipment-level").setVisible(false);
            } else {
                this.getView().byId("button-csv-equipment").setVisible(false);
                if (this.getView().byId("switch-contextual").getState()) {
                    this.getView().byId("input-batch-source-equipment-level").getParent().setVisible(true);
                    this.getView().byId("label-batch-source-equipment-level").setVisible(true);
                }
            }
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
        fnSearchRestorePopup: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("DS_VALUE_NEW", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },
        fnCancelRestore: function () {
            this._oRestoreDialog.destroy();
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
                } else if (sControlName == "sap.m.MultiComboBox") {
                    arrCurrentItems[0].setSelectedKeys(sSelectedValue.split(","))
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
                    "Param.3": sDataSourceID
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
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
                        oDataSourceInformationController.oModelRestoreValue.setData(data);
                        oDataSourceInformationController.oModelRestoreValue.refresh();
                        oDialog.close();
                    }

                }
            });
        },
        /*****************************************************************************/
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("DataSources", {
                Refresh: "N"
            });

        },
        fnNavigateBackAndReload: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("DataSources", {
                Refresh: "Y"
            });

        },
        fnValidateChangeComments: function () {
            var oChangeTracker = this.oModelChangeMessages.getData();

            oChangeTracker.fnUpdateNewValue("DS_NAME", sInputDataSourceName);
            oChangeTracker.fnUpdateNewValue("FL_ENABLED", iSwitchEnabled == "1" ? sYesLabel : sNoLabel);
            oChangeTracker.fnUpdateNewValue("DS_MII_DATA_SERVER_PROCESS", sComboDataServerProcess);
            oChangeTracker.fnUpdateNewValue("DS_MII_DATA_SERVER_CONTEXT", sComboDataServerContext);
            oChangeTracker.fnUpdateNewValue("DS_MII_DATA_SERVER_FILE", sComboDataServerFile);
            oChangeTracker.fnUpdateNewValue("DS_DESCRIPTION", sInputDataSourceDescription);
            oChangeTracker.fnUpdateNewValue("DS_MII_DATA_SERVER_C_TYPE", sComboDataServerContextType);
            oChangeTracker.fnUpdateNewValue("DS_PCO_SERVER_URL", sInputPCoUrl);
            oChangeTracker.fnUpdateNewValue("DS_PCO_CREDENTIAL", sComboPCoCredential);
            oChangeTracker.fnUpdateNewValue("DS_PCO_AGENT_PREFIX", sInputPCoPrefix);
            oChangeTracker.fnUpdateNewValue("FL_HISTORY", iSwitchHistory == "1" ? sYesLabel : sNoLabel);
            oChangeTracker.fnUpdateNewValue("FL_REALTIME", iSwitchRealTime == "1" ? sYesLabel : sNoLabel);
            oChangeTracker.fnUpdateNewValue("FL_ARCHIVE", iSwitchArchive == "1" ? sYesLabel : sNoLabel);
            oChangeTracker.fnUpdateNewValue("FL_CONTEXTUAL", iSwitchContextual == "1" ? sYesLabel : sNoLabel);
            // oChangeTracker.fnUpdateNewValue("FL_BATCH_INFO", iSwitchBatch == "1"? sYesLabel : sNoLabel);
            oChangeTracker.fnUpdateNewValue("FL_FLAT_FILE", iSwitchFlatFile == "1" ? sYesLabel : sNoLabel);
            oChangeTracker.fnUpdateNewValue("FL_ENERGY", iSwitchEngie == "1" ? sYesLabel : sNoLabel);
            oChangeTracker.fnUpdateNewValue("ID_BATCH_SOURCE", sComboBatchSource);
            oChangeTracker.fnUpdateNewValue("DS_BATCH_EQUIPMENT_LEVELS", sInputEquipmentLevel);
            oChangeTracker.fnUpdateNewValue("DS_MII_DATA_SERVER_P_TYPE", sComboDataServerProcessType);
            oChangeTracker.fnUpdateNewValue("DS_SQL_QUERY", sInputTextAreaSQLQuery);
            oChangeTracker.fnUpdateNewValue("QT_MAX_HISTORICAL_UPLOADS", iMaxHistoricalUploads);
            oChangeTracker.fnUpdateNewValue("FL_IDOC", iSwitchIdoc == "1" ? sYesLabel : sNoLabel);


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
                        oDataSourceInformationController.fnAddUpdateDataSourceInformation();
                        oChangeCommentDialog.close();
                    } else {
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
                        that.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
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
        fnOpenSqlTest: function (oEvent) {
            var sNoSqlMessage = oResourceBundle.getText("flowNoSqlMessage");
            var sSqlQuery = this.getView().byId("input-text-area-sql-query").getValue();
            if (sSqlQuery != "") {
                this.TestSQLDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.ContextualSqlTest", this);
                this.TestSQLDialog.attachAfterClose(function () { this.destroy(); })
                this.getView().addDependent(this.TestSQLDialog);
                this.TestSQLDialog.open();
                this.oModelSqlTestResult = new sap.ui.model.json.JSONModel();
                sap.ui.getCore().byId("table-sql-test").setModel(this.oModelSqlTestResult);
                this.fnLoadSqlTestTable();
            } else {
                // MessageToast.show(sNoSqlMessage);
                this.handleMessage(oResourceBundle.getText("commonTitleContextualFlowInfo"),
                    oResourceBundle.getText("flowInfoTestSql"),
                    sNoSqlMessage,
                    "Error");
            }
        },
        fnLoadSqlTestTable: function () {
            var i;
            var sSqlQuery = this.getView().byId("input-text-area-sql-query").getValue();
            var sServer = this.getView().byId("combobox-dataserver-contextual").getValue();
            var sLevel = this.getView().byId("input-batch-source-equipment-level").getValue().split(',')[0];
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
                        'QueryTemplate': 'StreamingEngine/JobEngine/Query/ContextualPCoFixedQuery',
                        'Server': sServer,
                        'FixedQuery': sSqlQuery,
                        'Param.1': sLevel
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            oTable.setVisible(false);
                            oColumnText.setText("FatalError");
                            oErrorText.setText(result.Rowsets.FatalError);
                            oTableError.setVisible(true);
                        } else {
                            var aExpectedColumns = ["ID", "PATH", "NAME", "LEVEL"];
                            var data = result.Rowsets;
                            var oItem = new sap.m.ColumnListItem();
                            for (i = 0; i < result.Rowsets.Rowset[0].Columns.Column.length; i++) {
                                var name = result.Rowsets.Rowset[0].Columns.Column[i].Name;
                                var iIndex = aExpectedColumns.indexOf(name);
                                var oCell = new sap.m.Text({
                                    text: "{" + name + "}"
                                });
                                oItem.addCell(oCell);
                                if (iIndex > -1) {
                                    aExpectedColumns.splice(iIndex, 1);
                                    result.Rowsets.Rowset[0].Columns.Column[i].Color = "green"
                                    result.Rowsets.Rowset[0].Columns.Column[i].Icon = "sys-enter"
                                } else {
                                    result.Rowsets.Rowset[0].Columns.Column[i].Color = "gray"
                                    result.Rowsets.Rowset[0].Columns.Column[i].Icon = "sys-minus"
                                }
                            }
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
                            oTable.bindItems("/Rowset/0/Row", oItem);
                            oDataSourceInformationController.oModelSqlTestResult.setData(data);
                            oDataSourceInformationController.oModelSqlTestResult.refresh();
                            oTable.setVisible(true);
                            oTableError.setVisible(false);
                        }

                    }
                });
            }
        },
        fnClosePopOver: function () {
            this.TestSQLDialog.close();
        },
        fnFlatFileEnabled: function (oEvent) {
            if (oEvent.getSource().getState()) {
                //set not required
                this.getView().byId("label-dataserver-process").setRequired(false);
                //set required
                this.getView().byId("label-pco-prefix").setRequired(false);
                //switch context off
                //  this.getView().byId("switch-batch-information-enabled").setState(false);
                //    this.getView().byId("switch-batch-information-enabled").fireChange();
                //     this.getView().byId("switch-batch-information-enabled").setEnabled(false);
                this.getView().byId("combobox-batch-source-system").setSelectedKey("");
                this.getView().byId("combobox-batch-source-system").fireSelectionChange();

                /*
                this.getView().byId("combobox-dataserver-process").setEnabled(false);
                this.getView().byId("combobox-dataserver-process-type").setEnabled(false);
                this.getView().byId("combobox-dataserver-contextual").setEnabled(false);
                this.getView().byId("combobox-dataserver-contextual-type").setEnabled(false);
                this.getView().byId("switch-history").setEnabled(false);
                this.getView().byId("switch-realtime").setEnabled(false);
                this.getView().byId("switch-archive").setEnabled(false);
                this.getView().byId("switch-contextual").setEnabled(false);
         //       this.getView().byId("switch-batch-information-enabled").setEnabled(false);
                this.getView().byId("combobox-batch-source-system").setEnabled(false);
                this.getView().byId("input-batch-source-equipment-level").setEnabled(false);
                this.getView().byId("input-text-area-sql-query").setEnabled(false);
                this.getView().byId("button-sql-query").setEnabled(false);*/
            } else {
                var realTimeEnabled = this.getView().byId("switch-realtime").getState();
                //set required
                this.getView().byId("label-dataserver-process").setRequired(true);
                //set not required
                this.getView().byId("label-pco-prefix").setRequired(realTimeEnabled);
                //enable general fields
                //     this.getView().byId("switch-batch-information-enabled").setEnabled(true);
            }
        },
        fnEngieEnabled: function (oEvent) {

            if (oEvent.getSource().getState()) {
                //set not required
                this.getView().byId("label-dataserver-process").setRequired(false);
                this.getView().byId("label-pco-credential").setRequired(false);
                this.getView().byId("label-pco-server-url").setRequired(false);
                this.getView().byId("label-pco-prefix").setRequired(false);

                //disable and switch all off other options
                this.getView().byId("switch-flat-file").setState(false);
                this.getView().byId("switch-history").setState(false);
                this.getView().byId("switch-realtime").setState(false);
                this.getView().byId("switch-archive").setState(false);
                this.getView().byId("switch-contextual").setState(false);
                this.getView().byId("switch-flat-file").setEnabled(false);
                this.getView().byId("switch-history").setEnabled(false);
                this.getView().byId("switch-realtime").setEnabled(false);
                this.getView().byId("switch-archive").setEnabled(false);
                this.getView().byId("switch-contextual").setEnabled(false);
            } else {
                var realTimeEnabled = this.getView().byId("switch-realtime").getState();
                //set required
                this.getView().byId("label-dataserver-process").setRequired(true);
                this.getView().byId("label-pco-credential").setRequired(true);
                this.getView().byId("label-pco-server-url").setRequired(true);
                this.getView().byId("label-pco-prefix").setRequired(realTimeEnabled);
                //enable all switchs
                /*
                this.getView().byId("switch-flat-file").setEnabled(true);
                this.getView().byId("switch-history").setEnabled(true);
                this.getView().byId("switch-realtime").setEnabled(true);
                this.getView().byId("switch-archive").setEnabled(true);
                this.getView().byId("switch-contextual").setEnabled(true); */
            }
        },

        fnIdocEnabled: function (oEvent) {

            if (oEvent.getSource().getState()) {
                //set not required
                this.getView().byId("label-dataserver-process").setRequired(false);
                this.getView().byId("label-pco-credential").setRequired(false);
                this.getView().byId("label-pco-server-url").setRequired(false);
                this.getView().byId("label-pco-prefix").setRequired(false);

                //disable and switch all off other options
                this.getView().byId("switch-flat-file").setState(false);
                this.getView().byId("switch-history").setState(false);
                this.getView().byId("switch-realtime").setState(false);
                this.getView().byId("switch-archive").setState(false);
                this.getView().byId("switch-contextual").setState(false);
                this.getView().byId("switch-engie").setState(false);
                this.getView().byId("switch-flat-file").setEnabled(false);
                this.getView().byId("switch-history").setEnabled(false);
                this.getView().byId("switch-realtime").setEnabled(false);
                this.getView().byId("switch-archive").setEnabled(false);
                this.getView().byId("switch-contextual").setEnabled(false);
                this.getView().byId("switch-engie").setEnabled(false);
            } else {
                var realTimeEnabled = this.getView().byId("switch-realtime").getState();
                //set required
                this.getView().byId("label-dataserver-process").setRequired(true);
                this.getView().byId("label-pco-credential").setRequired(true);
                this.getView().byId("label-pco-server-url").setRequired(true);
                this.getView().byId("label-pco-prefix").setRequired(realTimeEnabled);

            }
        },
        fnRealTimeChanged: function (oEvent) {
            if (oEvent.getSource().getState())
                this.getView().byId("label-pco-prefix").setRequired(true);
            else
                this.getView().byId("label-pco-prefix").setRequired(false);
        },
        fnKepwareChannelsChange: function (oEvent) {
            if (oEvent.getParameter("changedItem").getKey().includes("/")) {
                var aSelectedChannels = oEvent.getSource().getSelectedKeys();
                aSelectedChannels.splice(aSelectedChannels.indexOf(oEvent.getParameter("changedItem").getKey()), 1);
                oEvent.getSource().setSelectedKeys(aSelectedChannels);
                new Dialog({
                    title: "Invalid Channel Name",
                    afterClose: function (oEvent) { this.destroy() },
                    content: [
                        new sap.m.FormattedText({
                            htmlText: `${oResourceBundle.getText("dsInfoCanNotSelect")} <strong>${oEvent.getParameter("changedItem").getKey()}</strong>.
                            ${oResourceBundle.getText("dsInfoInvalidCharInChannelName")}.`
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
        },
        fnDownloadEquipment: function (oEvent) {
            // if this the creation moment create a message box to say you can't upload now
            if (sMode === "I") {
                new Dialog({
                    title: oResourceBundle.getText("dataSourceDownloadEquipmentFromCSV"),
                    afterClose: function (oEvent) { this.destroy() },
                    content: [
                        new sap.m.Text({
                            text: oResourceBundle.getText("dataSourceCreateTheDataSource")
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
            } else {
                if (this.oDownloadEquipmentDialog == undefined) {
                    this.oDownloadEquipmentDialog = sap.ui.xmlfragment(this.getView().getId(), "StreamingEngine.StreamingEngine.fragment.EquipmentDownloadFromCSV", this);
                    this.oDownloadEquipmentDialog.addButton(new sap.m.Button({
                        text: oResourceBundle.getText("commonClose"),
                        press: function (oEvent) {
                            oEvent.getSource().getParent().close();
                        }
                    }));
                    this.getView().addDependent(this.oDownloadEquipmentDialog);

                }
                this.oDownloadEquipmentDialog.open();
            }
        },
        fnFileChanged: function (oEvent) {
            var files = oEvent.getParameter("files");
            if (files.length == 0) {
                oEvent.getSource().getParent().getItems()[1].setEnabled(false);
            } else {
                oEvent.getSource().getParent().getItems()[1].setEnabled(true);
            }
        },
        fnFileConfirm: function (oEvent) {
            this.oDownloadEquipmentDialog.setBusy(true)
            var file = this.byId("file-uploader-equipment").FUEl.files;
            if (file.length == 0) {
                this.oDownloadEquipmentDialog.setBusy(false)
                MessageToast.show("Please Select a File")
                return
            }
            file = file[0]
            var reader = new FileReader();
            reader.onload = function (e) {
                var sContent = e.currentTarget.result;
                if (sContent == "") {
                    MessageToast.show("Empty File! Update the file and try again.");
                    oDataSourceInformationController.oDownloadEquipmentDialog.setBusy(false);
                    return;
                }
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogDownloadCSVXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": sContent,
                        "Param.2": sPlantID,
                        "Param.3": sDataSourceID
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            oDataSourceInformationController.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                                oResourceBundle.getText("dataSourceDownloadEquipmentFromCSV"),
                                sErrorMessage,
                                "Error");
                            MessageToast.show(sErrorMessage)
                        }
                        else {
                            //oDataSourceInformationController.oDownloadEquipmentDialog.close();
                            oDataSourceInformationController.handleMessage(oResourceBundle.getText("commonTitleDataSourceInfo"),
                                oResourceBundle.getText("dataSourceDownloadEquipmentFromCSV"),
                                "Success",
                                "Success");
                            oDataSourceInformationController.byId("table-equipment-from-csv-summary").setModel(
                                new sap.ui.model.json.JSONModel(result.Rowsets.Rowset[0])
                            )
                        }
                    },
                    complete: function () {
                        oDataSourceInformationController.oDownloadEquipmentDialog.setBusy(false);
                    }
                });
            }
            reader.onerror = function (e) {
                console.log(e);
            }
            reader.readAsBinaryString(file);
        },
        fnDownloadFailedItems: function (oEvent) {
            var oModel = oEvent.getSource().getParent().getParent().getModel();
            if (oModel) {
                var aFailedItems = oModel.getData().Row.filter(e => e.STATUS == "E");
                if (aFailedItems.length > 0) {
                    oModel = new sap.ui.model.json.JSONModel({ Row: aFailedItems });
                    var oExport = new Export({
                        exportType: new ExportTypeCSV({
                            fileExtension: "csv",
                            separatorChar: ","
                        }),
                        models: oModel,
                        rows: {
                            path: "/Row"
                        },
                        columns: [{
                            name: "EQUIPMENT_ID",
                            template: {
                                content: "{EQUIPMENT_ID}"
                            }
                        }, {
                            name: "PLANT",
                            template: {
                                content: "{PLANT}"
                            }
                        }, {
                            name: "EQUIPMENT_PATH",
                            template: {
                                content: "{EQUIPMENT_PATH}"
                            }
                        }, {
                            name: "EQUIPMENT_NAME",
                            template: {
                                content: "{EQUIPMENT_NAME}"
                            }
                        }, {
                            name: "EQUIPMENT_LEVEL",
                            template: {
                                content: "{EQUIPMENT_LEVEL}"
                            }
                        }, {
                            name: "MESSAGE",
                            template: {
                                content: "{DS_MESSAGE}"
                            }
                        },]
                    });
                    oExport.saveFile().catch(function (oError) {

                    }).then(function () {
                        oExport.destroy();
                    });
                }
            }
        },
        formatter: formatter
    });
});