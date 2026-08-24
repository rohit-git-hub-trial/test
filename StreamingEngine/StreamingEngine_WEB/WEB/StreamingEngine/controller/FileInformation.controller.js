/*-----------------------------------------------------------------------------------
Streaming Engine - File Flows Information
Creation Date: 2022.08.18 / By: E0427320
Reference Document: 
Description:This screen is used Add, Edit or Delete a selected File Flow. Also to
run the flow manually
-------------------------------------------------------------------------------------*/
var sFlowID;
var sMode;
var sAction;
var oFileInformationController;
var oDialog;
var sInputFlowId;
var sComboDataSource;
var sInputDataFlowName;
var sInputDescription;
var sInputPCODestinationId;
var sDataDestination;
var sOldDataDestination = "";
var bSynchType;
var sCurrentSynchType;
var iSSynchType;
var iCompressed;
var iEnabled;
var bTransform;
var sInputFormat;
var sOutputFormat;
var sFileMIITransaction;
var oResourceBundle;
var sYesLabel;
var sNoLabel;
var bShowCommentDialog = true;
/*****Below Variables are for JSON parsing functionality******/
var sTopParent;
var sPaths;
var aObjectsArray = [];
/*****Below Variables are for file uploader******/
var Uploaded = 0;
var bFilefilter = 0;
var sFileUploaded
var sContent;
var oDataT = {
    DS_JSON_TEMPLATE: "",
    DS_JSON_TEMPLATE_PATHS: ""
};


/*****Below Variables are for Restore functionality******/
var oCurrentControl;
var sCurrentColumnName;
var iCurrentControlCount;
var arrCurrentItems;
var sCurrentLabel;
var sTagCatalogTable = "SE_DATA_FLOW";
/******************************************************/
sap.ui.define(
    [
        "../controller/BaseController",
        "sap/m/Dialog",
        "sap/m/Button",
        "sap/m/Text",
        "sap/m/MessageToast",
        "sap/ui/model/Filter",
        "sap/m/MessageBox",
    ],
    function (
        BaseController,
        Dialog,
        Button,
        Text,
        MessageToast,
        Filter,
        MessageBox,
    ) {
        "use strict";

        return BaseController.extend(
            "StreamingEngine.StreamingEngine.controller.FileInformation",
            {
                onInit: function () {

                    // set message manager model
                    var oMessageManager = sap.ui.getCore().getMessageManager();
                    var oView = this.getView();
                    oView.setModel(oMessageManager.getMessageModel(), "message");
                    oMessageManager.registerObject(oView, true);

                    oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                    sYesLabel = oResourceBundle.getText("commonYes").toUpperCase();
                    sNoLabel = oResourceBundle.getText("commonNo").toUpperCase();

                    oFileInformationController = this;
                    oDialog = this.getView().byId("BusyDialog");
                    this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
                    this.getView().byId("combobox-mii-transaction").setModel(this.oModelMIITransaction);
                    this.fnLoadDataSource();
                    this.fnLoadDataDestination();
                    this.fnLoadFileTransformationFormats();
                    this.fnLoadMIITransaction();
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.getRoute("FileInformation").attachPatternMatched(this._onObjectMatched, this);
                    // Visibility Model will be used to set to better manipulate the view
                    this.oModelVisibility = new sap.ui.model.json.JSONModel({
                        sDataSourceType: "",
                        sSynchronousMode: ""
                    });
                    this.getView().setModel(this.oModelVisibility, "visibility");
                    if (bRequireChangeComment) {
                        this.oModelChangeMessages = new sap.ui.model.json.JSONModel({
                            Row: [],
                            fnUpdateNewValue: function (columnName, value) {
                                var e;
                                if ((e = this.Row.find(e => e.columnName === columnName))) {
                                    if (e.old != value) {
                                        e.new = value;
                                    } else {
                                        e.new = null;
                                    }
                                }
                            }
                        });
                    }
                    this.oModelParamMap.attachPropertyChange(function() {
                        oFileInformationController.oModelChangeMessages.getData().fnUpdateNewValue("FLOW_PARAM_MAP", "Changed");
                    })

                },
                onAfterRendering: function () {
                    /******************** Below Part for Authorisation***********************/
                    var sRoles = document.getElementById("input-roles").value;
                    var sAdminRole = "STREAMING_ENGINE_ADMIN";
                    var sUserRole = "STREAMING_ENGINE_USER";
                    var iAdminIndex = sRoles.indexOf(sAdminRole);
                    var iUserIndex = sRoles.indexOf(sUserRole);
                    if (iAdminIndex < 0) {
                        this.fnShowNoAccess();
                        return;
                    } else {
                        this.getView().byId("page-file-information").setVisible(true);
                    }
                    /***********************************************************************/
                },
                fnShowNoAccess: function () {
                    var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    thisRouter.navTo("NoAccess");
                },
                oModelDataSource: new sap.ui.model.json.JSONModel(),
                oModelMIITransaction: new sap.ui.model.json.JSONModel(),
                _onObjectMatched: function (oEvent) {
                    oAppController.fnUpdate(
                        this,
                        oResourceBundle.getText("commonTitleFileFlowInfo")
                    );
                    sMode = oEvent.getParameter("arguments").MODE;
                    var sNewFileFlowLabel = oResourceBundle.getText("flowInfoNewFile");
                    if (sMode == "U") {
                        sFlowID = oEvent.getParameter("arguments").ID_DATA_FLOW;
                        sOldDataDestination = oEvent.getParameter("arguments").ID_DATA_DESTINATION;
                        var sSourceID = oEvent.getParameter("arguments").ID_SOURCE;
                        var sPlant = oEvent.getParameter("arguments").PLANT;
                        var sSourceName = oEvent.getParameter("arguments").SOURCE_NAME;
                        var sFlowName = oEvent.getParameter("arguments").DS_NAME;
                        var sDescription = oEvent.getParameter("arguments").DS_DESCRIPTION;
                        var sPCODestinationId = oEvent.getParameter("arguments").CD_PCO_DESTINATION_ID || "";
                        var bCurrentCompressed = oEvent.getParameter("arguments").FL_COMPRESSED == 1 ? true : false;
                        var sDataDestination = oEvent.getParameter("arguments").ID_DATA_DESTINATION;
                        var bCurrentEnabled = oEvent.getParameter("arguments").FL_ENABLED == 1 ? true : false;
                        var bCurrentSynchType = oEvent.getParameter("arguments").FL_SYNCHRONOUS;
                        var bTransform = oEvent.getParameter("arguments").FL_TRANSFORMATION == 1 ? true : false;
                        var sInputFormat = oEvent.getParameter("arguments").CD_INPUT_FORMAT || "";
                        var sOutputFormat = oEvent.getParameter("arguments").CD_OUTPUT_FORMAT || "";
                        var bSwitchfilter = oEvent.getParameter("arguments").FL_JSON_FILTERING == 1 ? true : false;
                        var sMiiTransaction = decodeURIComponent(oEvent.getParameter("arguments").DS_MII_TRANSACTION || "");
                        sPaths = "";
						sCurrentSynchType = bCurrentSynchType;
						

                        if (bSwitchfilter == true) {
                            $.ajax({
                                url:
                                    "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/FileFlowTemplateSelectQuery&Content-Type=text/json",
                                data: {
                                    "Param.1": sFlowID
                                },
                                success: function (result) {
                                    if (result.Rowsets.FatalError !== undefined) {//error
                                    }
                                    else {
                                        if ((result.Rowsets.Rowset[0].Row[0].DS_JSON_TEMPLATE_PATHS != "") && (result.Rowsets.Rowset[0].Row[0].DS_JSON_TEMPLATE_PATHS != "NA")) {
                                            oDataT.DS_JSON_TEMPLATE = result.Rowsets.Rowset[0].Row[0].DS_JSON_TEMPLATE;
                                            oDataT.DS_JSON_TEMPLATE_PATHS = result.Rowsets.Rowset[0].Row[0].DS_JSON_TEMPLATE_PATHS;
                                        }
                                        else {
                                            oDataT.DS_JSON_TEMPLATE = "";
                                            oDataT.DS_JSON_TEMPLATE_PATHS = "";
                                            sPaths = "";
                                        }
                                    }
                                }
                            });
                        }
                        if (bRequireChangeComment) {
                            this.oModelChangeMessages.getData().Row = [
                                { columnName: "DS_NAME", name: oResourceBundle.getText("flowInfoName"), old: sFlowName, new: null, message: ""},
                                { columnName: "DS_DESCRIPTION", name: oResourceBundle.getText("flowDesc"), old: sDescription, new: null, message: ""},
                                { columnName: "CD_PCO_DESTINATION_ID", name: oResourceBundle.getText("flowPCoDestinationId"), old: sPCODestinationId, new: null, message: ""},
                                { columnName: "ID_DATA_DESTINATION", name: oResourceBundle.getText("dataDestination"), old: sDataDestination, new: null, message: ""},
                                { columnName: "FL_SYNCHRONOUS", name: oResourceBundle.getText("fileFlowSynchType"), old: bCurrentSynchType, new: null, message: "" },
                                { columnName: "FL_COMPRESSED", name: oResourceBundle.getText("flowCompressed"), old: (bCurrentCompressed ? sYesLabel : sNoLabel), new: null, message: ""},
                                { columnName: "FL_ENABLED", name: oResourceBundle.getText("flowEnabled"), old: (bCurrentEnabled ? sYesLabel : sNoLabel), new: null, message: ""},
                                { columnName: "FL_TRANSFORMATION", name: oResourceBundle.getText("flowEnabled"), old: (bTransform ? sYesLabel : sNoLabel), new: null, message: ""},
                                { columnName: "CD_INPUT_FORMAT", name: oResourceBundle.getText("fileInputFormat"), old: sInputFormat, new: null, message: ""},
                                { columnName: "CD_OUTPUT_FORMAT", name: oResourceBundle.getText("fileOutputFormat"), old: sOutputFormat, new: null, message: ""},
                                { columnName: "DS_MII_TRANSACTION", name: oResourceBundle.getText("flowWSTransformationAlgorithm"), old: sMiiTransaction, new: null, message: ""},
                                { columnName: "FLOW_PARAM_MAP", name: oResourceBundle.getText("FlowParamMapTitle"), old: "", new: null, message: ""},
                                /*------------Filter json -----------*/
                                { columnName: "FL_JSON_FILTERING", name: oResourceBundle.getText("fileFilter"), old: (bSwitchfilter ? sYesLabel : sNoLabel), new: null, message: ""}
                            ];
                        }

                        this.getView().byId("input-flow-id").setEnabled(false);
                        this.getView().byId("combobox-data-source").setEnabled(false);
                        this.getView().byId("button-delete").setVisible(true);
                        this.getView().byId("input-flow-id").setValue(sFlowID);
                        this.getView().byId("header-plant-name").setText(sPlant);
                        this.getView().byId("header-data-source").setText(sSourceName);
                        this.getView().byId("object-header-file-info").setTitle(sFlowName);
                        this.getView().byId("header-plant-name").setVisible(true);
                        this.getView().byId("header-data-source").setVisible(true);
                        this.getView().byId("combobox-data-source").setSelectedKey(sSourceID);
                        this.getView().byId("input-data-flow-name").setValue(sFlowName);
                        this.getView().byId("input-description").setValue(sDescription);
                        this.getView().byId("input-pco-destination-id").setValue(sPCODestinationId);
                        this.getView().byId("combobox-datadestination").setSelectedKey(sDataDestination);
                        this.getView().byId("combobox-synch-type").setSelectedKey(bCurrentSynchType);
                        this.getView().byId("switch-compressed").setState(bCurrentCompressed);
                        this.getView().byId("switch-enabled").setState(bCurrentEnabled);
                        this.getView().byId("combobox-mii-transaction").setSelectedKey(sMiiTransaction);

                        this.getView().byId("switch-fileFilter").setState(false);
                        this.getView().byId("label-Templatejsonfile").setVisible(false);
                        this.getView().byId("objectStatus-dd-Importjson").setVisible(false);
                        this.getView().byId("fileFilter-FileUploader").setVisible(false);
                        this.getView().byId("button-file-filter-upload").setVisible(false);
                        this.getView().byId("objectStatus-dd-msgsuccess").setVisible(false);
                        this.getView().byId("button-Download-template").setVisible(false);
                        this.getView().byId("button-Change-template").setVisible(false);
                        this.getView().byId("switch-fileFilter").setVisible(false);
                        this.getView().byId("label-fileFilter").setVisible(false);
                        this.getView().byId("button-restore-transformation").setVisible(false);
                        sContent = "";
                        this.getView().byId("fileFilter-FileUploader").setValue("");
                        this.getView().byId("objectStatus-ff-dd-disabled").setVisible(false);
                        this.getView().byId("combobox-datadestination").setValueState("None");

                        this.getView().byId("switch-transformation").setState(bTransform);

                        if (bTransform) {
                            this.fnShowHideSwitchInputFormat(true);
                            this.fnShowHideSwitchOutputFormat(true);
                            this.getView().byId("combobox-fileInputFormat").setSelectedKey(sInputFormat);
                            this.getView().byId("combobox-fileOutputFormat").setSelectedKey(sOutputFormat);
                            this.getView().byId("combobox-fileInputFormat").fireChange();

                            this.getView().byId("switch-fileFilter").setState(bSwitchfilter);
                            if (bSwitchfilter) {
                                this.getView().byId("objectStatus-dd-msgsuccess").setVisible(true);
                                this.getView().byId("button-Download-template").setVisible(true);
                                this.getView().byId("button-Change-template").setVisible(true);
                                this.getView().byId("label-Templatejsonfile").setVisible(false);
                                this.getView().byId("objectStatus-dd-Importjson").setVisible(false);
                                this.getView().byId("fileFilter-FileUploader").setVisible(false);
                                this.getView().byId("button-file-filter-upload").setVisible(false);
                            }
                            if (sInputFormat == "IDOC" || sOutputFormat == "W_S") {
                                this.fnLoadFlowParamMap();
                            }
                        } else {
                            this.getView().byId("combobox-fileInputFormat").setSelectedKey("");
                            this.getView().byId("combobox-fileOutputFormat").setSelectedKey("");
                            this.getView().byId("combobox-fileInputFormat").fireChange();
                            this.fnShowHideSwitchInputFormat(false);
                            this.fnShowHideSwitchOutputFormat(false);
                        }

                        //Check Data Destination Enablement
                        var iIsDestinationEnabled = oEvent.getParameter("arguments").DESTINATION_ENABLED == 1 ? true : false;
                        if (!iIsDestinationEnabled) {
                            var sDestinationName = decodeURIComponent(oEvent.getParameter("arguments").DESTINATION_NAME);
                            this.getView().byId("combobox-datadestination").setValue(sDestinationName);
                            this.getView().byId("combobox-datadestination").setValueState("Warning");
                            this.getView().byId("combobox-datadestination").setValueStateText(oResourceBundle.getText("dataDestinationsDisabled"));
                            this.getView().byId("objectStatus-ff-dd-disabled").setVisible(true);
                        }

                        /********************Below are Restore Buttons********************/
                        sTagCatalogTable = "SE_DATA_FLOW";
                        this.getView().byId("button-restore-flow-name").setVisible(true);
                        this.getView().byId("button-restore-description").setVisible(true);
                        this.getView().byId("button-restore-pco-destination-id").setVisible(true);
                        this.getView().byId("button-restore-datadestination").setVisible(true);
                        this.getView().byId("button-restore-synch-type").setVisible(true);
                        this.getView().byId("button-restore-compressed").setVisible(true);
                        this.getView().byId("button-restore-enabled").setVisible(true);
                        this.getView().byId("button-restore-mii-transaction").setVisible(true);
                        if (this.getView().byId("switch-fileFilter").getVisible()) {
                            this.getView().byId("button-restore-filter").setVisible(true);
                        }
                        else {
                            this.getView().byId("button-restore-filter").setVisible(false);
                        }

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
                        this.getView().byId("object-header-file-info").setTitle(sNewFileFlowLabel);
                        this.getView().byId("combobox-data-source").setSelectedKey("");
                        this.getView().byId("input-data-flow-name").setValue("");
                        this.getView().byId("input-description").setValue("");
                        this.getView().byId("input-pco-destination-id").setValue("");
                        this.getView().byId("combobox-datadestination").setSelectedKey("");
                        this.getView().byId("combobox-synch-type").setSelectedKey("");
                        this.getView().byId("switch-compressed").setState(false);
                        this.getView().byId("switch-enabled").setState(false);
                        this.getView().byId("switch-transformation").setState(false);
                        this.getView().byId("combobox-fileInputFormat").setSelectedKey("");
                        this.getView().byId("combobox-fileOutputFormat").setSelectedKey("");
                        this.fnShowHideSwitchInputFormat(false);
                        this.fnShowHideSwitchOutputFormat(false);
                        this.getView().byId("label-Templatejsonfile").setVisible(false);
                        this.getView().byId("fileFilter-FileUploader").setVisible(false);
                        this.getView().byId("fileFilter-FileUploader").setValue("");
                        this.getView().byId("objectStatus-dd-Importjson").setVisible(false);
                        this.getView().byId("button-file-filter-upload").setVisible(false);
                        this.getView().byId("switch-fileFilter").setVisible(false);
                        this.getView().byId("label-fileFilter").setVisible(false);
                        this.getView().byId("switch-fileFilter").setState(false);
                        this.getView().byId("objectStatus-dd-msgsuccess").setVisible(false);
                        this.getView().byId("button-Download-template").setVisible(false);
                        this.getView().byId("button-Change-template").setVisible(false);
                        this.getView().byId("objectStatus-ff-dd-disabled").setVisible(false);
                        this.getView().byId("combobox-datadestination").setValueState("None");
                        this.getView().byId("combobox-mii-transaction").setSelectedKey("");
                        Uploaded = 0;
                        sContent = "";
                        this.oModelParamMap.oData.Row = [];



                        /********************Below are Restore Buttons********************/
                        this.getView().byId("button-restore-flow-name").setVisible(false);
                        this.getView().byId("button-restore-description").setVisible(false);
                        this.getView().byId("button-restore-pco-destination-id").setVisible(false);
                        this.getView().byId("button-restore-datadestination").setVisible(false);
                        this.getView().byId("button-restore-synch-type").setVisible(false);
                        this.getView().byId("button-restore-compressed").setVisible(false);
                        this.getView().byId("button-restore-enabled").setVisible(false);
                        this.getView().byId("button-restore-transformation").setVisible(false);
                        this.getView().byId("button-restore-fileInputFormat").setVisible(false);
                        this.getView().byId("button-restore-fileOutputFormat").setVisible(false);
                        this.getView().byId("button-restore-mii-transaction").setVisible(false);
                        this.getView().byId("button-restore-filter").setVisible(false);
                        /*****************************************************************/
                    }
                    this.getView().byId("combobox-synch-type").fireSelectionChange();
                    this.onDataSourceChanged();
                    this.fnOnChangeOutputFormat();
                },

                fnLoadDataSource: function () {
                    // Load data source type file
                    $.ajax({
                        url:
                            "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                        data: {
                            "Param.1": "%",
                            "Param.5": 1,
                            "Param.20": document.getElementById("SE_Plant").value
                        },
                        async: false,
                        success: function (result) {
                            if (result.Rowsets.FatalError !== undefined) {
                                oFileInformationController.handleMessage(
                                    oResourceBundle.getText("commonTitleFileFlowInfo"),
                                    oResourceBundle.getText("dataSourcesLoadDataSources"),
                                    result.Rowsets.FatalError,
                                    "Error"
                                );
                            } else {
                                var data = result.Rowsets.Rowset[0];
                                data.Row.forEach(e => e.TYPE = 'File');
                                oFileInformationController.oModelDataSource.setData(data);
                                oFileInformationController.oModelDataSource.refresh();
                            }
                        }
                    });
                    // Load data sources type IDOC
                    $.ajax({
                        url:
                            "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                        data: {
                            "Param.1": "%",
                            "Param.7": 1,
                            "Param.20": document.getElementById("SE_Plant").value
                        },
                        success: function (result) {
                            if (result.Rowsets.FatalError !== undefined) {
                                oFileInformationController.handleMessage(
                                    oResourceBundle.getText("commonTitleFileFlowInfo"),
                                    oResourceBundle.getText("dataSourcesLoadDataSources"),
                                    result.Rowsets.FatalError,
                                    "Error"
                                );
                            } else {
                                var data = result.Rowsets.Rowset[0];
                                if (data.Row != undefined) {
                                    data.Row.forEach(e => e.TYPE = 'IDOC');
                                    oFileInformationController.oModelDataSource.oData.Row.push(...data.Row);
                                    oFileInformationController.oModelDataSource.refresh();
                                }
                            }
                        }
                    });
                },

                fnLoadDataDestination: function () {
                    var that = this;
                    var oModelDataDestinations = new sap.ui.model.json.JSONModel();
                    $.ajax({
                        url:
                            "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/DestinationListSelectQuery&Content-Type=text/json",
                        data: {
                            "Param.1": "%"
                        },
                        success: function (result) {
                            if (result.Rowsets.FatalError !== undefined) {
                                that.handleMessage(
                                    oResourceBundle.getText("commonTitleFileFlowInfo"),
                                    oResourceBundle.getText("dataDestinationsList"),
                                    result.Rowsets.FatalError,
                                    "Error"
                                );
                            } else {
                                var data = result.Rowsets.Rowset[0];
                                oModelDataDestinations.setData(data);
                                that.getView().byId("combobox-datadestination").setModel(oModelDataDestinations);
                                oModelDataDestinations.refresh(true);
                            }
                        }
                    });
                },
                fnLoadFileTransformationFormats: function () {
                    var sTransformFormats = jQuery.sap.getModulePath(
                        "StreamingEngine.StreamingEngine",
                        "/model/fileTransformation.json"
                    );
                    var oModelTransfFormats = new sap.ui.model.json.JSONModel(sTransformFormats);
                    this.getView().byId("combobox-fileInputFormat").setModel(oModelTransfFormats);
                    this.getView().byId("combobox-fileOutputFormat").setModel(oModelTransfFormats);
                },
                fnLoadMIITransaction: function() {
                    $.ajax({
                        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/FolderListXacuteQuery&Content-Type=text/json",
                        data: {
                            "Param.1": "db://StreamingEngine/DataFlow/FileFlowExtendedTransactions"
                        },
                        success: function (result) {
                            if (result.Rowsets.FatalError !== undefined) {
                                that.handleMessage(oResourceBundle.getText("commonTitleFileFlowInfo"),
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
                                    data.Row[i].Name = finalname;
                                }
                                oFileInformationController.oModelMIITransaction.setData(data);
                                oFileInformationController.oModelMIITransaction.refresh();
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
                    sInputPCODestinationId = this.getView().byId("input-pco-destination-id").getValue();
                    sDataDestination = this.getView().byId("combobox-datadestination").getSelectedKey();
                    bSynchType = this.getView().byId("combobox-synch-type").getSelectedKey();
                    iCompressed = this.getView().byId("switch-compressed").getState() ? 1 : 0;
                    iEnabled = this.getView().byId("switch-enabled").getState() ? 1 : 0;
                    bTransform = this.getView().byId("switch-transformation").getState() ? 1 : 0;
                    bFilefilter = this.getView().byId("switch-fileFilter").getState() ? 1 : 0;
                    sFileUploaded = this.getView().byId("fileFilter-FileUploader").getValue();
                    sInputFormat = this.getView().byId("combobox-fileInputFormat").getSelectedKey();
                    sOutputFormat = this.getView().byId("combobox-fileOutputFormat").getSelectedKey();
                    sFileMIITransaction = this.getView().byId("combobox-mii-transaction").getSelectedKey();

                    if (sComboDataSource == "") {
                        bValidInputs = false;
                        this.getView().byId("combobox-data-source").setValueState("Error");
                    } else {
                        this.getView().byId("combobox-data-source").setValueState("None");
                        // if source type is IDOC pco destination and sync type must be empty
                        if (this.oModelVisibility.oData.sDataSourceType === 'IDOC') {
                            bSynchType = "2";
                            sInputPCODestinationId = "";
                            iCompressed = 0;
                        }
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

                    if (sInputPCODestinationId == "" && (bSynchType === "1") && (this.oModelVisibility.oData.sDataSourceType === 'File')) {
                        bValidInputs = false;
                        this.getView().byId("input-pco-destination-id").setValueState("Error");
                    } else {
                        this.getView().byId("input-pco-destination-id").setValueState("None");
                    }

                    if (sDataDestination == "") {
                        bValidInputs = false;
                        this.getView().byId("combobox-datadestination").setValueState("Error");
                    } else {
                        this.getView().byId("combobox-datadestination").setValueState("None");
                    }

                    if (bSynchType == "" && (this.oModelVisibility.oData.sDataSourceType === 'File')) {
                          bValidInputs = false;
                          this.getView().byId("combobox-synch-type").setValueState("Error");
                      } else {
                          this.getView().byId("combobox-synch-type").setValueState("None");
                      }

                    if (bTransform === 1) {
                        if (sInputFormat === "") {
                            bValidInputs = false;
                            this.getView().byId("combobox-fileInputFormat").setValueState("Error");
                        } else {
                            this.getView().byId("combobox-fileInputFormat").setValueState("None");

                        }
                        if (sOutputFormat === "") {
                            bValidInputs = false;
                            this.getView().byId("combobox-fileOutputFormat").setValueState("Error");
                        } else {
                            this.getView().byId("combobox-fileOutputFormat").setValueState("None");
                        }
                        if (bFilefilter == 1) {
                            if (sFileUploaded === "" && (this.getView().byId("fileFilter-FileUploader").getVisible() == true)) {
                                this.getView().byId("fileFilter-FileUploader").setValueState("Error");
                                bValidInputs = false;
                            }
                            else if ((sFileUploaded != "") && (this.getView().byId("fileFilter-FileUploader").getVisible() == true)) {
                                bValidInputs = false;
                                this.handleMessage(oResourceBundle.getText("commonTitleFileFlowInfo"),
                                    oResourceBundle.getText("TemplateUpload"),
                                    oResourceBundle.getText("TemplateNotUploaded"),
                                    "Error");
                            } else { 
                                this.getView().byId("fileFilter-FileUploader").setValueState("None");
                            }
                        }
                        if (sOutputFormat == "W_S" && sFileMIITransaction == "") {
                            bValidInputs = false;
                            this.getView().byId("combobox-mii-transaction").setValueState("Error");
                        } else {
                            this.getView().byId("combobox-mii-transaction").setValueState("None");
                        }
                        if (sOutputFormat == "W_S" || sInputFormat == "IDOC") {
                            if (this.oModelParamMap && this.oModelParamMap.oData.Row.length == 0) {
                                bValidInputs = false;
                                this.getView().byId("button-flow-param-map").setType("Reject");
                            } else {
                                this.getView().byId("button-flow-param-map").setType("Default");
                            }
                        }
                    } else {
                        sInputFormat = "";
                        sOutputFormat = "";
                    }

                    return bValidInputs;
                },
                fnSaveFileFlow: function () {
                    if (sMode == "I") {
                        sAction = "INSERT";
                    } else if (sMode == "U") {
                        sAction = "UPDATE";
                    }
                    this.fnAddUpdateFlow();
                },
                fnDeleteFileFlow: function () {
                    var sConfirmTitle = oResourceBundle.getText("commonConfirm");
                    var sConfirmYes = oResourceBundle.getText("commonYes");
                    var sConfirmNo = oResourceBundle.getText("commonNo");
                    var sConfirmMessage = oResourceBundle.getText("flowFileInfoDeleteConfirmation");
                    var dialog = new Dialog({
                        title: sConfirmTitle,
                        type: "Message",
                        content: new Text({
                            text: sConfirmMessage
                        }),
                        beginButton: new Button({
                            text: sConfirmYes,
                            press: function () {
                                sAction = "DELETE";
                                oFileInformationController.fnDeleteFileInformation();
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
                fnOnSwitchFileTransformation: function (oEvent) {
                    var bTransformState = oEvent.getSource().getState();
                    if (bTransformState) {
                        this.fnShowHideSwitchInputFormat(true);
                        this.fnShowHideSwitchOutputFormat(true);
                        var sOutputFormat = this.getView().byId("combobox-fileOutputFormat").getSelectedKey();
                        var sInputFormat = this.getView().byId("combobox-fileInputFormat").getSelectedKey();
                        var sSwitchfileOn = this.getView().byId("switch-fileFilter").getState();
                        if (sInputFormat == "JSON" && sOutputFormat == "XML") {
                            this.getView().byId("switch-fileFilter").setVisible(true);
                            this.getView().byId("label-fileFilter").setVisible(true);
                            if (sMode === "U") {
                                this.getView().byId("button-restore-filter").setVisible(true);
                            }

                            if (sSwitchfileOn == true && Uploaded == 0) {
                                this.getView().byId("label-Templatejsonfile").setVisible(true);
                                this.getView().byId("fileFilter-FileUploader").setVisible(true);
                                this.getView().byId("objectStatus-dd-Importjson").setVisible(true);
                                this.getView().byId("button-file-filter-upload").setVisible(true);
                            }
                            else if (sSwitchfileOn == true && Uploaded == 1) {
                                this.getView().byId("objectStatus-dd-msgsuccess").setVisible(true);
                                this.getView().byId("button-Download-template").setVisible(true);
                                this.getView().byId("button-Change-template").setVisible(true);
                            }
                        }

                        if (
                            this.getView().byId("combobox-fileOutputFormat").getSelectedKey() !== ""
                        ) {
                            this.getView().byId("combobox-fileOutputFormat").setEnabled(true);
                        } else {
                            this.getView().byId("combobox-fileOutputFormat").setEnabled(false);
                        }
                    } else {
                        this.fnShowHideSwitchInputFormat(false);
                        this.fnShowHideSwitchOutputFormat(false);
                        this.getView().byId("combobox-fileInputFormat").setSelectedKey("");
                        this.getView().byId("combobox-fileOutputFormat").setSelectedKey("");

                        this.getView().byId("label-Templatejsonfile").setVisible(false);
                        this.getView().byId("fileFilter-FileUploader").setVisible(false);
                        this.getView().byId("fileFilter-FileUploader").setValue("");
                        this.getView().byId("switch-fileFilter").setState(false);
                        this.getView().byId("objectStatus-dd-Importjson").setVisible(false);
                        this.getView().byId("button-file-filter-upload").setVisible(false);
                        this.getView().byId("switch-fileFilter").setVisible(false);
                        this.getView().byId("label-fileFilter").setVisible(false);
                        this.getView().byId("objectStatus-dd-msgsuccess").setVisible(false);
                        this.getView().byId("button-Download-template").setVisible(false);
                        this.getView().byId("button-Change-template").setVisible(false);
                        this.getView().byId("button-restore-filter").setVisible(false);
                        sContent = "";
                        sPaths = "";
                    }
                },
                fnOnChangeInputFormat: function (oEvent) {
                    var sInputFormat;
                    if (oEvent) {
                        sInputFormat = oEvent.getSource().getProperty("selectedKey");
                    } else {
                        sInputFormat = this.getView().byId("combobox-fileOutputFormat").getSelectedKey();
                    }

                    var oOutputCombobox = this.getView().byId(
                        "combobox-fileOutputFormat"
                    );
                    if (sInputFormat !== "") {
                        var oFilter = new sap.ui.model.Filter(
                            "CD_INPUT_FORMAT",
                            sap.ui.model.FilterOperator.Contains,
                            sInputFormat
                        );
                        oOutputCombobox.getBinding("items").filter(oFilter);
                        oOutputCombobox.setEnabled(true);
                    } else {
                        oOutputCombobox.getBinding("items").filter([]);
                        oOutputCombobox.setSelectedKey("");
                        oOutputCombobox.setEnabled(false);
                    }
                    // file filter
                    if (
                        sInputFormat == "JSON" &&
                        oOutputCombobox.getSelectedKey() == "XML"
                    ) {
                        this.getView().byId("switch-fileFilter").setVisible(true);
                        this.getView().byId("label-fileFilter").setVisible(true);
                        if (sMode === "U") {
                            this.getView().byId("button-restore-filter").setVisible(true);
                        }
                        var sSwitchfileOn = this.getView().byId("switch-fileFilter").getState();
                        if (sSwitchfileOn == true && Uploaded == 0) {
                            this.getView().byId("label-Templatejsonfile").setVisible(true);
                            this.getView().byId("fileFilter-FileUploader").setVisible(true);
                            this.getView().byId("button-file-filter-upload").setVisible(true);
                        } else if (sSwitchfileOn == true && Uploaded == 1) {
                            this.getView().byId("objectStatus-dd-msgsuccess").setVisible(true);
                            this.getView().byId("button-Download-template").setVisible(true);
                            this.getView().byId("button-Change-template").setVisible(true);

                        }
                    } else {
                        this.getView().byId("switch-fileFilter").setState(false);
                        this.getView().byId("switch-fileFilter").setVisible(false);
                        this.getView().byId("label-fileFilter").setVisible(false);
                        this.getView().byId("label-Templatejsonfile").setVisible(false);
                        this.getView().byId("fileFilter-FileUploader").setVisible(false);
                        this.getView().byId("objectStatus-dd-Importjson").setVisible(false);
                        this.getView().byId("button-file-filter-upload").setVisible(false);
                        this.getView().byId("fileFilter-FileUploader").setValue("");
                        this.getView().byId("objectStatus-dd-msgsuccess").setVisible(false);
                        this.getView().byId("button-Download-template").setVisible(false);
                        this.getView().byId("button-Change-template").setVisible(false);
                        this.getView().byId("button-restore-filter").setVisible(false);
                        sContent = "";
                        sPaths = "";
                    }
                    // IDOC Param Map
                    if (oOutputCombobox.getSelectedKey() == "W_S") {
                        this.byId("flexbox-mii-transaction").setVisible(true);
                    } else {
                        this.byId("flexbox-mii-transaction").setVisible(false);
                    }
                    if (sInputFormat == "IDOC" || oOutputCombobox.getSelectedKey() == "W_S") {
                        this.byId("button-flow-param-map").setVisible(true);
                    } else {
                        this.byId("button-flow-param-map").setVisible(false);
                    }
                },

                fnOnChangeOutputFormat: function (oEvent) {
                    var sInputFormat = this.getView().byId("combobox-fileInputFormat").getSelectedKey();
                    var sOutputFormat = this.getView().byId("combobox-fileOutputFormat").getSelectedKey();
                    if (sInputFormat == "JSON" && sOutputFormat == "XML") {
                        this.getView().byId("switch-fileFilter").setVisible(true);
                        this.getView().byId("label-fileFilter").setVisible(true);
                        if (sMode === "U") {
                            this.getView().byId("button-restore-filter").setVisible(true);
                        }
                        var sSwitchfileOn = this.getView().byId("switch-fileFilter").getState();
                        if (sSwitchfileOn == true && sMode == "I") {
                            this.getView().byId("label-Templatejsonfile").setVisible(true);
                            this.getView().byId("fileFilter-FileUploader").setVisible(true);
                            this.getView().byId("objectStatus-dd-Importjson").setVisible(true);
                            this.getView().byId("button-file-filter-upload").setVisible(true);
                        }
                    } else {
                        this.getView().byId("switch-fileFilter").setState(false);
                        this.getView().byId("switch-fileFilter").setVisible(false);
                        this.getView().byId("label-fileFilter").setVisible(false);
                        this.getView().byId("button-restore-filter").setVisible(false);
                        sContent = "";
                        sPaths = "";
                    }
                    if (sOutputFormat == "W_S") {
                        this.byId("flexbox-mii-transaction").setVisible(true);
                    } else {
                        this.byId("flexbox-mii-transaction").setVisible(false);
                    }
                    if (sInputFormat == "IDOC" || sOutputFormat == "W_S") {
                        this.byId("button-flow-param-map").setVisible(true);
                    } else {
                        this.byId("button-flow-param-map").setVisible(false);
                    }
                },
                fnOnSwitchFileFilter: function (oEvent) {
                    var bTransformState = oEvent.getSource().getState();
                    if (bTransformState && (sContent == "")) {
                        this.getView().byId("label-Templatejsonfile").setVisible(true);
                        this.getView().byId("fileFilter-FileUploader").setVisible(true);
                        this.getView().byId("objectStatus-dd-Importjson").setVisible(true);
                        this.getView().byId("button-file-filter-upload").setVisible(true);
                    } else if (bTransformState && (sContent != "")) {
                        this.getView().byId("objectStatus-dd-msgsuccess").setVisible(true);
                        this.getView().byId("button-Download-template").setVisible(true);
                        this.getView().byId("button-Change-template").setVisible(true);

                    }
                    else {
                        this.getView().byId("fileFilter-FileUploader").setValue("");
                        this.getView().byId("label-Templatejsonfile").setVisible(false);
                        this.getView().byId("fileFilter-FileUploader").setVisible(false);
                        this.getView().byId("objectStatus-dd-Importjson").setVisible(false);
                        this.getView().byId("button-file-filter-upload").setVisible(false);
                        this.getView().byId("objectStatus-dd-msgsuccess").setVisible(false);
                        this.getView().byId("button-Download-template").setVisible(false);
                        this.getView().byId("button-Change-template").setVisible(false);
                        sContent = "";
                        sPaths = "";
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

                fnOnclickUpload: function (oEvent) {
                    var that = this;

                    var file = this.byId("fileFilter-FileUploader").FUEl.files;
                    if (file.length == 0) {
                        MessageToast.show(oResourceBundle.getText("Please Select a File"));
                        return;
                    }
                    file = file[0];
                    //transaction
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        sContent = e.currentTarget.result;
                        if (sContent == "") {
                            that.handleMessage(oResourceBundle.getText("commonTitleFileFlowInfo"),
                                oResourceBundle.getText("TemplateUpload"),
                                oResourceBundle.getText("EmptyFile"),
                                "Error");

                            return;
                        }
                        $.ajax({
                            url:
                                "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/JsonTemplateCheckerXacuteQuery&Content-Type=text/json",
                            type: "POST",
                            data: {
                                "Param.1": sContent
                            },
                            success: function (result) {
                                if (result.Rowsets.Rowset[0].Row[0].VALID_FLAG == 0) {
                                    that.handleMessage(oResourceBundle.getText("commonTitleFileFlowInfo"),
                                        oResourceBundle.getText("TemplateUpload"),
                                        oResourceBundle.getText("InvalidJson"),
                                        "Error");
                                } else {
                                    Uploaded = 1;
                                    that.getView().byId("label-Templatejsonfile").setVisible(false);
                                    that.getView().byId("fileFilter-FileUploader").setVisible(false);
                                    that.getView().byId("objectStatus-dd-Importjson").setVisible(false);
                                    that.getView().byId("button-file-filter-upload").setVisible(false);
                                    that.getView().byId("objectStatus-dd-msgsuccess").setVisible(true);
                                    that.getView().byId("button-Download-template").setVisible(true);
                                    that.getView().byId("button-Change-template").setVisible(true);

                                    var oContent = JSON.parse(e.target.result);
                                    aObjectsArray = [];
                                    var aResult = that.buildObject("", oContent);
                                    var aNodesHierarchy = that.buildHierarchy(aResult);
                                    sPaths = "";
                                    that.buildPaths("", aNodesHierarchy);
                                }
                            },
                            complete: function () {
                                //   oDataSourceInformationController.oDownloadEquipmentDialog.setBusy(false);
                            }
                        });
                    };
                    reader.onerror = function (e) {

                    };
                    reader.readAsBinaryString(file);
                },

                buildPaths: function (sparent, aHierarchy) {
                    for (var i = 0; i < aHierarchy.length; i++) {
                        if (jQuery.isEmptyObject(aHierarchy[i].children)) {
                            //node has no children
                            var sPath = sparent + "/" + aHierarchy[i].node;
                            if (sparent) this.fnAddPathToPathsList(sPath);
                            else {
                                this.fnAddPathToPathsList(aHierarchy[i].node);
                                sTopParent = "";
                            }
                        } else {
                            //check that the last node parent is the correct parent
                            var aLastNodeParent = sTopParent.split("/");
                            if (
                                sTopParent &&
                                aLastNodeParent[aLastNodeParent.length - 1] ===
                                aHierarchy[i].parent
                            );
                            else {
                                var iLastParentIndex = sTopParent.lastIndexOf(
                                    aHierarchy[i].parent
                                );
                                if (iLastParentIndex == 0 || aHierarchy[i].parent == "")
                                    sTopParent = aHierarchy[i].parent;
                                else
                                    sTopParent =
                                        sTopParent.substring(0, iLastParentIndex - 1) +
                                        "/" +
                                        aHierarchy[i].parent;
                            } //append current node to the path
                            if (sTopParent)
                                sTopParent = sTopParent + "/" + aHierarchy[i].node;
                            else sTopParent = aHierarchy[i].node;
                            this.buildPaths(sTopParent, aHierarchy[i].children);
                        }
                    }
                },
                fnAddPathToPathsList(sPath) {
                    if (sPaths) sPaths = sPaths + "," + sPath;
                    else sPaths = sPath;
                },

                buildHierarchy: function (aNodesIn) {
                    var aNodes = [];
                    var oNodeMap = {};
                    if (aNodesIn) {
                        var oNodeOut;
                        var sParent;
                        for (var i = 0; i < aNodesIn.length; i++) {
                            var oNodeIn = aNodesIn[i];
                            oNodeOut = {
                                node: oNodeIn.node,
                                value: oNodeIn.value,
                                parent: oNodeIn.parent,
                                children: []
                            };
                            sParent = oNodeIn.parent;
                            if (sParent.length > 0) {
                                var oParentNode = oNodeMap[oNodeIn.parent];
                                if (oParentNode) {
                                    oParentNode.children.push(oNodeOut);
                                }
                            } else {
                                //there is no parent, must be top level
                                aNodes.push(oNodeOut);
                            } //add the node to the node map, which is a simple 1-level list of all nodes
                            oNodeMap[oNodeOut.node] = oNodeOut;
                        }
                    }

                    return aNodes;
                },

                buildObject: function (sparent, oObject, bArray) {
                    if (bArray && oObject instanceof Object) {
                        for (var i = 0; i < oObject.length; i++) {
                            var bIsArray = this.checkArray(oObject[i]);
                            var sParent = sparent + "[" + i + "]";
                            aObjectsArray.push({
                                node: sParent,
                                parent: ""
                            });
                            this.buildObject(sParent, oObject[i], bIsArray);
                        }
                    } else {
                        for (var prop in oObject) {
                            var bIsArray = this.checkArray(oObject[prop]);
                            if (!bIsArray)
                                aObjectsArray.push({
                                    node: prop,
                                    parent: sparent
                                });
                            if (oObject[prop] instanceof Object) {
                                this.buildObject(prop, oObject[prop], bIsArray);
                            }
                        }
                    }
                    return aObjectsArray;
                },
                checkArray: function (arr) {
                    const result = Array.isArray(arr);
                    if (result) return true;
                    else return false;
                },
                fnOnDownloadTemplate: function (oEvent) {
                    if (sMode == "I") {
                        oEvent.getSource().getParent().getItems()[1].setEnabled(true);
                        var file = this.byId("fileFilter-FileUploader").FUEl.files;
                        file = file[0];

                        var oAnchor = document.createElement("a");
                        var oFile = new Blob([file]);

                        oAnchor.download = "JsonTemplate." + "json";
                        oAnchor.href = window.URL.createObjectURL(oFile);
                        oAnchor.click();
                    }

                    else {
                        var that = this;
                        $.ajax({
                            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/FileFlowTemplateSelectQuery&Content-Type=text/json",
                            data: {
                                "Param.1": sFlowID
                            },
                            success: function (data) {
                                if (data.Rowsets.FatalError !== undefined) {
                                    that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
                                        oResourceBundle.getText("queueMonitoringLoadJobMessage"),
                                        data.Rowsets.FatalError,
                                        "Error");
                                } else {
                                    var sMessage = data.Rowsets.Rowset[0].Row[0].DS_JSON_TEMPLATE;
                                    var oAnchor = document.createElement("a");
                                    var oFile = new Blob([sMessage]);
                                    var sFileType = "JSON"
                                    oAnchor.download = "JsonTemplate." + sFileType;
                                    oAnchor.href = window.URL.createObjectURL(oFile);
                                    oAnchor.click();
                                }
                            }
                        });
                    }
                },

                fnOnclickReplaceTemplate: function () {
                    Uploaded = 0;
                    this.getView().byId("fileFilter-FileUploader").clear();
                    this.getView().byId("fileFilter-FileUploader").setValue("");
                    this.getView().byId("objectStatus-dd-msgsuccess").setVisible(false);
                    this.getView().byId("button-Download-template").setVisible(false);
                    this.getView().byId("button-Change-template").setVisible(false);
                    this.getView().byId("label-Templatejsonfile").setVisible(true);
                    this.getView().byId("fileFilter-FileUploader").setVisible(true);
                    this.getView().byId("objectStatus-dd-Importjson").setVisible(true);
                    this.getView().byId("button-file-filter-upload").setVisible(true);
                },
                fnShowHideSwitchInputFormat: function (bShow) {
                    if (bShow) {
                        this.getView().byId("label-fileInputFormat").setVisible(true);
                        this.getView().byId("combobox-fileInputFormat").setVisible(true);
                        if (sMode === "U") {
                            this.getView().byId("button-restore-fileInputFormat").setVisible(true);
                        } else {
                            this.getView().byId("button-restore-fileInputFormat").setVisible(false);
                        }
                    } else {
                        this.getView().byId("label-fileInputFormat").setVisible(false);
                        this.getView().byId("combobox-fileInputFormat").setVisible(false);
                        this.getView().byId("button-restore-fileInputFormat").setVisible(false);
                    }
                },
                fnShowHideSwitchOutputFormat: function (bShow) {
                    if (bShow) {
                        this.getView().byId("label-fileOutputFormat").setVisible(true);
                        this.getView().byId("combobox-fileOutputFormat").setVisible(true);
                        if (sMode === "U") {
                            this.getView().byId("button-restore-fileOutputFormat").setVisible(true);
                        } else {
                            this.getView().byId("button-restore-fileOutputFormat").setVisible(false);
                        }
                    } else {
                        this.getView().byId("label-fileOutputFormat").setVisible(false);
                        this.getView().byId("combobox-fileOutputFormat").setVisible(false);
                        this.getView().byId("button-restore-fileOutputFormat").setVisible(false);
                    }
                },
                fnAddUpdateFlow: function () {
                    var bIsValid = this.fnValidateInputs();
                    if (sPaths && iEnabled == 1 && sMode == "U") {
                        this.handleMessage(oResourceBundle.getText("commonTitleFileFlowInfo"),
                            oResourceBundle.getText("TemplateUpload"),
                            oResourceBundle.getText("DisableFlow"),
                            "Error");
                    }
					if ((bSynchType!==sCurrentSynchType) && iEnabled == 1 && sMode == "U") {
                        this.handleMessage(oResourceBundle.getText("commonTitleFileFlowInfo"),
                            oResourceBundle.getText("TemplateUpload"),
                            oResourceBundle.getText("DisableFlowSyncType"),
                            "Error");
                    }					else {
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

                            if ((bFilefilter == true) && (sPaths == "" || sPaths == "undefined")) {
                                sPaths = oDataT.DS_JSON_TEMPLATE_PATHS;
                                sContent = oDataT.DS_JSON_TEMPLATE;
                            }

                            $.ajax({
                                url:
                                    "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/FileFlowXacuteQuery&Content-Type=text/json",
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
                                    "Param.9": bTransform,
                                    "Param.10": sInputFormat,
                                    "Param.11": sOutputFormat,
                                    "Param.12": sInputPCODestinationId,
                                    "Param.13": bSynchType,
                                    "Param.14": bFilefilter,
                                    "Param.15": sContent,
                                    "Param.16": sPaths,
                                    "Param.17": this.fnFlowParamMap2XML(),
                                    "Param.18": sFileMIITransaction,
                                    "Param.30": aCommentColumnName.join("\n"),
                                    "Param.31": aCommentMessage.join("\n")
                                },
                                success: function (result) {
                                    oDialog.close();
                                    if (result.Rowsets.Rowset) {
                                        var data = result.Rowsets.Rowset[0];
                                        var successMsg = data.Row[0].Output;
                                        if (successMsg == "{##SUCCESS_MESSAGE}") {
                                            successMsg = oResourceBundle.getText("commonInfoSuccess");
                                        }
                                        if (sAction === "INSERT") {
                                            oFileInformationController.handleMessage(
                                                oResourceBundle.getText("commonTitleFileFlowInfo"),
                                                oResourceBundle.getText("fileFlowAdd"),
                                                successMsg,
                                                "Success"
                                            );
                                        } else {
                                            oFileInformationController.handleMessage(
                                                oResourceBundle.getText("commonTitleFileFlowInfo"),
                                                oResourceBundle.getText("fileFlowUpdate"),
                                                successMsg,
                                                "Success"
                                            );
                                        }
                                        oFileInformationController.fnNavigateBackAndReload();
                                    } else if (result.Rowsets.FatalError) {
                                        var errorMsg = result.Rowsets.FatalError;
                                        if (sAction === "INSERT") {
                                            oFileInformationController.handleMessage(
                                                oResourceBundle.getText("commonTitleFileFlowInfo"),
                                                oResourceBundle.getText("fileFlowAdd"),
                                                errorMsg,
                                                "Error"
                                            );
                                        } else {
                                            oFileInformationController.handleMessage(
                                                oResourceBundle.getText("commonTitleFileFlowInfo"),
                                                oResourceBundle.getText("fileFlowUpdate"),
                                                errorMsg,
                                                "Error"
                                            );
                                        }
                                    }
                                }
                            });
                        }
                    }
                },

                fnDeleteFileInformation: function () {
                    oDialog.open();
                    var that = this;
                    $.ajax({
                        url:
                            "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/FileFlowXacuteQuery&Content-Type=text/json",
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
                                that.handleMessage(
                                    oResourceBundle.getText("commonTitleFileFlowInfo"),
                                    oResourceBundle.getText("fileFlowDelete"),
                                    successMsg,
                                    "Success"
                                );
                                oFileInformationController.fnNavigateBackAndReload();
                            } else if (result.Rowsets.FatalError) {
                                var errorMsg = result.Rowsets.FatalError;
                                oDialog.close();
                                //MessageToast.show(errorMsg);
                                that.handleMessage(
                                    oResourceBundle.getText("commonTitleFileFlowInfo"),
                                    oResourceBundle.getText("fileFlowDelete"),
                                    errorMsg,
                                    "Error"
                                );
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
                    this._oRestoreDialog = sap.ui.xmlfragment(
                        "StreamingEngine.StreamingEngine.view.RestoreValueSelect",
                        this
                    );
                    this.getView().addDependent(this._oRestoreDialog);
                    jQuery.sap.syncStyleClass(
                        "sapUiSizeCompact",
                        this.getView(),
                        this._oRestoreDialog
                    );
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
                    var oFilter = new Filter(
                        "DS_VALUE_NEW",
                        sap.ui.model.FilterOperator.Contains,
                        sValue
                    );
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
                        url:
                            "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLogRestoreValueSelectQuery&Content-Type=text/json",
                        data: {
                            "Param.1": sTagCatalogTable,
                            "Param.2": sCurrentColumnName,
                            "Param.3": sFlowID
                        },
                        success: function (result) {
                            if (result.Rowsets.FatalError) {
                                var sErrorMessage = result.Rowsets.FatalError;
                                //MessageToast.show(sErrorMessage);
                                that.handleMessage(
                                    oResourceBundle.getText("commonTitleFileFlowInfo"),
                                    oResourceBundle.getText("plantInfoRestoreValueMsg"),
                                    sErrorMessage,
                                    "Error"
                                );
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
                                oFileInformationController.oModelRestoreValue.setData(data);
                                oFileInformationController.oModelRestoreValue.refresh();
                                oDialog.close();
                            }
                        }
                    });
                },
                /*****************************************************************************/
                onChangeDestination: function () {
                    this.getView().byId("objectStatus-ff-dd-disabled").setVisible(false);
                    var str = this.getView().byId("combobox-datadestination").getSelectedKey();
                    if (str.startsWith("SE_UAT")) {
                        var that = this;
                        var bProd = 0;
                        $.ajax({
                            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/FlowSelectEnvironmentQuery&Content-Type=text/json",
                            async: false,
                            success: function (result) {
                                if (result.Rowsets.Rowset) {
                                    var data = result.Rowsets.Rowset[0].Row[0].USAGE;
                                    if (data == 'PRODUCTION') {
                                        bProd = 1;
                                    }
                                } else if (result.Rowsets.FatalError) {
                                    var errorMsg = result.Rowsets.FatalError;
                                    that.handleMessage(oResourceBundle.getText("commonTitleFileFlowInfo"),
                                        oResourceBundle.getText("commonRetrieveEnvironment"),
                                        errorMsg,
                                        "Error");
                                }
                            }
                        });
                        if (bProd) {
                            MessageBox.confirm(oResourceBundle.getText("commonUATDatadestinationConfirmation"), {
                                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                                onClose: function (sAction) {
                                    if (sAction === "NO") {
                                        that.getView().byId("combobox-datadestination").setSelectedKey(sOldDataDestination);
                                    }
                                }
                            }
                            );
                        }
                    }
                },
                onDataSourceChanged: function() {
                    var oSelected = oFileInformationController.byId("combobox-data-source").getSelectedItem();
                    if (oSelected == null) {
                        oFileInformationController.oModelVisibility.oData.sDataSourceType = "";
                    } else {
                        oFileInformationController.oModelVisibility.oData.sDataSourceType = oSelected.getBindingContext().getObject().TYPE;
                    }
                    oFileInformationController.oModelVisibility.refresh();
                },
                oModelParamMap: new sap.ui.model.json.JSONModel({Row: []}),
                fnAddParamMap: function () {
                    this.oModelParamMap.oData.Row.push({
                        DS_SOURCE_MAP: "",
                        DS_DESTINATION_MAP: "",
                        FL_DYNAMIC: false,
                        FL_REPEAT: false
                    });
                    this.oModelParamMap.refresh();
                    this.oModelChangeMessages.getData().fnUpdateNewValue("FLOW_PARAM_MAP", "Changed");
                },
                fnDeleteParamMap: function (oEvent) {
                    let oRow = oEvent.getSource().getBindingContext().getObject();
                    let iIndex = this.oModelParamMap.oData.Row.indexOf(oRow);
                    if (iIndex > -1) {
                        this.oModelParamMap.oData.Row.splice(iIndex, 1);
                        this.oModelParamMap.refresh();
                    }
                    this.oModelChangeMessages.getData().fnUpdateNewValue("FLOW_PARAM_MAP", "Changed");
                },
                fnFlowParamMap2XML: function () {
                    var sParamMapXML = `<?xml version="1.0" encoding="UTF-8"?><Params>`;
                    this.oModelParamMap.oData.Row.forEach(e => {
                        sParamMapXML += `<Param><ID>${e.ID_DATA_FLOW_PARAM_MAP || ""}</ID><Source>${e.DS_SOURCE_MAP}</Source><Dest>${e.DS_DESTINATION_MAP}</Dest><Dynamic>${e.FL_DYNAMIC ? 1: 0}</Dynamic><Repeat>${e.FL_REPEAT? 1: 0}</Repeat></Param>`;
                    });
                    sParamMapXML += "</Params>";
                    return sParamMapXML;
                },
                fnOpenFlowParamMap: function() {
                    if (this.oParamMapDialog == undefined) {
                        this.oParamMapDialog = sap.ui.xmlfragment(this.getView().getId(), "StreamingEngine.StreamingEngine.fragment.FlowParamMap", this);
                        this.getView().addDependent(this.oParamMapDialog);
                        this.oParamMapDialog.setModel(this.oModelParamMap);
                        this.oParamMapDialog.addButton(
                            new Button({
                                text: "{i18n>commonClose}",
                                icon: "sap-icon://sys-cancel",
                                press: function () {
                                    this.getParent().close();
                                }
                            })
                        );
                    }
                    this.oParamMapDialog.open();
                    this.oModelParamMap.oData.Repeat = this.byId("combobox-fileOutputFormat").getSelectedKey() == "W_S";
                    this.oModelParamMap.refresh();
                },
                fnLoadFlowParamMap: function() {
                    if (this.byId("input-flow-id").getValue() != '') {
                        $.ajax({
                            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/FileFlowParamMapListByIDSelectQuery&Content-Type=text/json",
                            data: {
                                "Param.1": this.byId("input-flow-id").getValue()
                            },
                            success: function (result) {
                                if (result.Rowsets.FatalError !== undefined) {
                                    oFileInformationController.handleMessage(
                                        oResourceBundle.getText("commonTitleFileFlowInfo"),
                                        oResourceBundle.getText("IDOCParamMapTitle"),
                                        result.Rowsets.FatalError,
                                        "Error"
                                    );
                                } else {
                                    var data = result.Rowsets.Rowset[0];
                                    if (data.Row != undefined) {
                                        // checked must be boolean
                                        data.Row.forEach(e => {
                                            e.FL_DYNAMIC = e.FL_DYNAMIC == '1';
                                            e.FL_REPEAT = e.FL_REPEAT == '1';
                                        });
                                        oFileInformationController.oModelParamMap.oData.Row = data.Row;
                                        oFileInformationController.oModelParamMap.refresh();
                                    }
                                }
                            }
                        });
                    }
                },
                fnNavigateBack: function () {
                    var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
                    thisrouter.navTo("FileFlows", {
                        Refresh: "N"
                    });
                },
                fnNavigateBackAndReload: function () {
                    var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
                    thisrouter.navTo("FileFlows", {
                        Refresh: "Y"
                    });
                },
                fnValidateChangeComments: function () {
                    var oChangeTracker = this.oModelChangeMessages.getData();

                    oChangeTracker.fnUpdateNewValue("DS_NAME", sInputDataFlowName);
                    oChangeTracker.fnUpdateNewValue("DS_DESCRIPTION", sInputDescription);
                    oChangeTracker.fnUpdateNewValue("CD_PCO_DESTINATION_ID", sInputPCODestinationId);
                    oChangeTracker.fnUpdateNewValue("ID_DATA_DESTINATION", sDataDestination);
                    oChangeTracker.fnUpdateNewValue("FL_SYNCHRONOUS", bSynchType);
                    oChangeTracker.fnUpdateNewValue("FL_COMPRESSED", (iCompressed == 1 ? sYesLabel : sNoLabel));
                    oChangeTracker.fnUpdateNewValue("FL_ENABLED", (iEnabled ? sYesLabel : sNoLabel));
                    oChangeTracker.fnUpdateNewValue("FL_TRANSFORMATION", (bTransform == 1 ? sYesLabel : sNoLabel));
                    oChangeTracker.fnUpdateNewValue("CD_INPUT_FORMAT", sInputFormat);
                    oChangeTracker.fnUpdateNewValue("CD_OUTPUT_FORMAT", sOutputFormat);
                    oChangeTracker.fnUpdateNewValue("DS_MII_TRANSACTION", sFileMIITransaction);
                    oChangeTracker.fnUpdateNewValue("FL_JSON_FILTERING", (bFilefilter == 1 ? sYesLabel : sNoLabel));

                    if (bShowCommentDialog && oChangeTracker.Row.filter(e => e.new != null).length > 0) {
                        this.fnChangeCommentDialog();
                        return false;
                    }
                    var bValid = oChangeTracker.Row.every(e => {
                        if (e.new != null) {
                            return e.message.length > 0 && e.message.length < 255;
                        }
                        return true;
                    });
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
                    });
                    var that = this;
                    oChangeCommentDialog.addButton(
                        new Button({
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
                                    oFileInformationController.fnAddUpdateFlow();
                                    oChangeCommentDialog.close();
                                } else {
                                    MessageToast.show(
                                        oResourceBundle.getText("commonCheckCommentMessages")
                                    );
                                    that.handleMessage(
                                        oResourceBundle.getText("commonTitleFileFlowInfo"),
                                        oResourceBundle.getText("commonCheckCommentMessages"),
                                        "",
                                        "Error"
                                    );
                                }
                            }
                        })
                    );
                    oChangeCommentDialog.addButton(
                        new Button({
                            text: oResourceBundle.getText("commonCancel"),
                            press: function () {
                                bShowCommentDialog = true;
                                oChangeCommentDialog.close();
                            }
                        })
                    );
                    oChangeCommentDialog.setModel(this.oModelChangeMessages);
                    oChangeCommentDialog.open();
                },
                onSyncTypeChange: function(oEvent) {
                    oFileInformationController.oModelVisibility.oData.sSynchronousMode = oEvent.getSource().getSelectedKey();
                    oFileInformationController.oModelVisibility.refresh();
                },
                fnGetOutput: function(sOutput) {
                    if (sOutput == "W_S") {
                        return "WebService";
                    } else {
                        return sOutput;
                    }
                }
            }
        );
    }
);