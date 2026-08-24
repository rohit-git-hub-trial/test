/*-----------------------------------------------------------------------------------
Streaming Engine - Data Destination Information
Creation Date: 2022.06.23 / By: E0449160
Reference Document: 
Description:This screen is used to Add, Edit or Delete a Data Destination. 
-------------------------------------------------------------------------------------*/
var oDataDestinationInformationController;
var oDialog;
var sMode;
var sAction;
var bShowCommentDialog = true;
var oComboHistoricalUpload;
var sHistoricalUploadDestId = "";
var sDataDestinationID;
var bEnabled;
var bDefault;
var sPlantId;
var sDestinationName;
var sDestinationDescription;
var sDestinationType;
var sDestinationUrl;
var sDestinationAuthMethod;
var sDestinationAuthValue;
var sDestinationConnAlias;
var sSSHKey;
var sDestinationHTTPMethod;
var sDestinationHTTPParams;
var bSplit;
var sSplitSizeCompressed;
var sSplitSizeNotCompressed;
var oEnabledSwitch;
var oFileUploaderSSH;
var oInputDesID;
var oInputDesName;
var oInputDestinationDescription;
var oComboDesType;
var oComboConnAlias;
var oInputDesPath;
var oComboDesAuthMeth;
var oInputDesToken;
var oInputUsernameSsh;
var oComboDesMIICred;
var oComboDesHttpMeth;
var oTableDesHeaders;
var oEnabledSwitchSplit;
var oDefaultSwitch;
var oAddHeadersBtn;
var iSwitchEnabled;
var iSwitchDefault;
var iSwitchSplitEnabled;
var oSplitSizeCompressed;
var oSplitSizeNotCompressed;
var oHistoricalUploadV2;

var sTableKey = "";
var sYesLabel;
var sNoLabel;

/*****Below Variables are for Restore functionality******/
var oCurrentControl;
var sCurrentColumnName;
var iCurrentControlCount;
var sCurrentLabel;
var sCatalogTable = "SE_DATA_DESTINATION";
/******************************************************/
sap.ui.define([
    "../controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text"
], function (BaseController, Filter, FilterOperator, JSONModel, MessageBox, Dialog, Button, Text) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.DataDestinationInformation", {
        onInit: function () {
            // set message manager model

            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            sYesLabel = oResourceBundle.getText("commonYes").toUpperCase();
            sNoLabel = oResourceBundle.getText("commonNo").toUpperCase();

            oDataDestinationInformationController = this;
            oDialog = this.getView().byId("BusyDialog");

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("DataDestinationInformation").attachPatternMatched(this._onObjectMatched, this);
            if (bRequireChangeComment) {
                this.oModelChangeMessages = new JSONModel({
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
            var iAdminIndex = sRoles.indexOf(sAdminRole);
            if (iAdminIndex < 0) {
                this.fnShowNoAccess();
                return;
            } else {
                this.getView().byId("page-data-destinationInformation").setVisible(true);
            }
oSplitSizeCompressed = this.getView().byId("input-dd-splitsizecompressed");
            oSplitSizeNotCompressed = this.getView().byId("input-dd-splitsizeNotCompressed");
	oHistoricalUploadV2 = this.getView().byId("combobox-dd-historicalUpload");
                        var sMiiRole = "MII_DEVELOPER";
                        var bAdminSupport = ((sRoles.indexOf(sMiiRole) > 0) ? true : false);
                        if(bAdminSupport){
                            oSplitSizeCompressed.setEnabled(true);
		oSplitSizeNotCompressed.setEnabled(true);
		oHistoricalUploadV2.setEnabled(true);
                        }
                        else {oSplitSizeCompressed.setEnabled(false);
		oSplitSizeNotCompressed.setEnabled(false);
oHistoricalUploadV2.setEnabled(false);}
            /***********************************************************************/
        },
        
isSplitSizeVisible: function(bSplitMessage, sType) {
    // Show only if SplitMessage is true AND type is NOT Historical SFTP
    return !!bSplitMessage && sType !== "DD_TYPE_SFTPforHistoricalUpload";
},

isSplitSizeRestoreVisible: function(bEditMode, bSplitMessage, sType) {
    // Show restore button only if EditMode is true AND SplitMessage is true AND type is NOT Historical SFTP
    return !!bEditMode && !!bSplitMessage && sType !== "DD_TYPE_SFTPforHistoricalUpload";
},

        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleDataDestinationInformation"));
            var oView = this.getView();
            //define view controls
            oInputDesID = this.getView().byId("input-dd-id");
            oInputDesName = this.getView().byId("input-dd-name");
            oInputDestinationDescription = this.getView().byId("input-dd-description");
            oComboDesType = this.getView().byId("combobox-dd-type");
            oInputDesPath = this.getView().byId("input-dd-url");
            oComboDesAuthMeth = this.getView().byId("combobox-dd-authMethod");
            oInputDesToken = this.getView().byId("input-dd-token");
            oInputUsernameSsh = this.getView().byId("input-dd-username");
            oFileUploaderSSH = this.getView().byId("file-uploader-sshkey");
            oComboDesMIICred = this.getView().byId("combobox-dd-miicredential");
            oComboDesHttpMeth = this.getView().byId("combobox-dd-httpMethod");
			oComboHistoricalUpload = this.getView().byId("combobox-dd-historicalUpload");
            oTableDesHeaders = this.getView().byId("table-dd-headers");
            oAddHeadersBtn = this.getView().byId("table-dd-headers-addBtn");
            oEnabledSwitch = this.getView().byId("switch-dd-enabled");
            oComboConnAlias = this.getView().byId("combobox-dd-connection-alias");
            oEnabledSwitchSplit = this.getView().byId("switch-dd-split");
            oSplitSizeCompressed = this.getView().byId("input-dd-splitsizecompressed");
            oSplitSizeNotCompressed = this.getView().byId("input-dd-splitsizeNotCompressed");
            oDefaultSwitch = this.getView().byId("switch-dd-default");

            //get route parameters
            sDataDestinationID = oEvent.getParameter("arguments").ID_DATA_DESTINATION;
            sMode = oEvent.getParameter("arguments").MODE;
            //set binding model to the view		
            var oModel = new JSONModel();
	
	//var oHistoricalUploadModel = new sap.ui.model.json.JSONModel();
	//oHistoricalUploadModel.loadData("model/historicalUploadV2.json"); // adjust path if needed
	//this.getView().setModel(oHistoricalUploadModel, "HistoricalUploadModel");
	this.fnLoadHistoricalUploadDestinations();

            oView.setModel(oModel);
            oView.bindElement("/");

            oFileUploaderSSH.clear();
            oFileUploaderSSH.setPlaceholder(oResourceBundle.getText("dataDestinationNewSSHMessage"));
            this.getView().byId("table-dd-headers").removeAllItems();
            oComboConnAlias = this.getView().byId("combobox-dd-connection-alias");
            oComboDesMIICred = this.getView().byId("combobox-dd-miicredential");
            oComboDesAuthMeth = this.getView().byId("combobox-dd-authMethod");
            var oDestinationHeadername = this.getView().byId("object-header-data-destinationInformation");

            //restrict destination types
            oDataDestinationInformationController.filterDestinationsList();

            var oModelData;
            if (sMode == "U") {
                var aDestinationModel = oDataDestinationInformationController.getOwnerComponent().getModel("DataDestinationModel").getData().Row;
                if (!jQuery.isEmptyObject(aDestinationModel)) {
                    oModelData = aDestinationModel.find(element => element.ID_DATA_DESTINATION === sDataDestinationID);
                    if (oModelData) {
                        //bind the view with destination's data
                        var bStandardSanofiDestination = sDataDestinationID.toUpperCase().startsWith("SE") ? true : false;
                        oModelData.EditMode = sMode === "U" && !bStandardSanofiDestination;
                        oModelData.SanofiStandardDest = bStandardSanofiDestination;
                        oModelData.DestinationEnabled = oModelData.FL_ENABLED == "1" ? true : false;
                        oModelData.DefaultDestination = oModelData.FL_DEFAULT == "1" ? true : false;
                        oModelData.SplitMessage = oModelData.FL_MESSAGE_SPLIT == "1" ? true : false;
                        oModel.setData(oModelData);
		if (Object.prototype.hasOwnProperty.call(oModelData, "CD_HISTORICAL_UPLOAD_DEST")) {
  	var _v = oModelData.CD_HISTORICAL_UPLOAD_DEST;
  	if (typeof _v === "string" && _v.trim().toUpperCase() === "NA") {
    		oModelData.CD_HISTORICAL_UPLOAD_DEST = "";
  		}
	}
		
// Add this flag just before the IIFE
var _didHydrateFromDB = false;

// --- Historical Upload V2 key handling (Update mode) ---
(function ensureHistoricalUploadKeyFromCacheOrDB() {
  var hasHistProp  = Object.prototype.hasOwnProperty.call(oModelData, "CD_HISTORICAL_UPLOAD_DEST");
  var hasNonEmpty  = hasHistProp &&
                     oModelData.CD_HISTORICAL_UPLOAD_DEST != null &&
                     oModelData.CD_HISTORICAL_UPLOAD_DEST !== "";

  // Hydrate when property is missing OR empty in the cached list row
  if (!hasHistProp || !hasNonEmpty) {
    _didHydrateFromDB = true;
    oDataDestinationInformationController.fnLoadDestinationData(sDataDestinationID);
    return; // stop Update-mode path here
  }

  // If present and non-empty, normalize to string so ComboBox selectedKey matches item keys
  oModelData.CD_HISTORICAL_UPLOAD_DEST = String(oModelData.CD_HISTORICAL_UPLOAD_DEST);
})();

// Short-circuit the Update branch after hydration so we don't fall back to "None"
if (_didHydrateFromDB) {
  return;
}

// (keep this block exactly as-is, but ensure it sits AFTER the short-circuit)
if (
  oModelData.CD_TYPE !== "DD_TYPE_SFTPforHistoricalUpload" &&
  Object.prototype.hasOwnProperty.call(oModelData, "CD_HISTORICAL_UPLOAD_DEST") &&
  !oModelData.CD_HISTORICAL_UPLOAD_DEST
) {
  oModelData.CD_HISTORICAL_UPLOAD_DEST = "None";
}

		// oComboHistoricalUpload.setSelectedKey("None");
                        //fill view variables
                        oDataDestinationInformationController.fnFillViewVariables();
		
	

                        //set Header title
                        oDestinationHeadername.setTitle(oModelData.DS_NAME);
                        //load MII Credentials List
                        oDataDestinationInformationController.loadMIICredentialsList();
                        oDataDestinationInformationController.filterAuthenMethod(sDestinationType, false);
                        //load HTTP Params For API destinations                       
                        if (sDestinationType && ((sDestinationType === "DD_TYPE_API") || (sDestinationType === "DD_TYPE_WEBSERVICE"))) {
                            oDataDestinationInformationController.loadDestinationHTTParams(sDataDestinationID);
                        }
                        //load credential alias
                        oDataDestinationInformationController.loadConnectionAliasList();
                        //fill change comment model
                        if (oModelData.CD_HISTORICAL_UPLOAD_DEST !== undefined) {
    oDataDestinationInformationController.fnFillChangeCommentModel();
}
                    } else {
                        //load destination's data from db
                        oDataDestinationInformationController.fnLoadDestinationData(sDataDestinationID);
                    }
                } else {
                    //load destination's data from db
                    oDataDestinationInformationController.fnLoadDestinationData(sDataDestinationID);
                }
		// oComboHistoricalUpload.setSelectedKey("None");
                oFileUploaderSSH.setPlaceholder(oResourceBundle.getText("dataDestinationSSHExistMessage"));
            } else if (sMode == "I") {
                //load MII Credentials List
                oDataDestinationInformationController.loadMIICredentialsList();
                //load credential alias
                oDataDestinationInformationController.loadConnectionAliasList();
                oModelData =
                {
                    "EditMode": false,
                    "InsertMode": true,
                    "SanofiStandardDest": false,
                    "SplitMessage": false,
                    "DestinationEnabled": false,
                    "DefaultDestination": false,
                    "ID_DATA_DESTINATION": "",
                    "PLANT": "",
                    "ID_PLANT": "",
                    "QT_SPLIT_SIZE_COMPRESSED": "",
                    "QT_SPLIT_SIZE_NOT_COMPRESSED": "",
                    "DS_NAME": "",
                    "DS_DESCRIPTION": "",
                    "CD_TYPE": "",
                    "CD_HTTP_METHOD": "",
                    "DS_PATH": "",
                    "CD_AUTHENTICATION_METHOD": "",
                    "DS_AUTHENTICATION_VALUE": "",
                    "CD_CONNECTION_ALIAS": "",
                    "FL_MESSAGE_SPLIT": "",
                    "FL_ENABLED": "0",
                    "FL_DEFAULT": "0",
	       "CD_HISTORICAL_UPLOAD_DEST": "None"
                }
                oModel.setData(oModelData);
                this.getView().byId("object-header-data-destinationInformation").setTitle(oResourceBundle.getText("dataDestinationNew"));
                sSSHKey = "";
            }
        },
     fnLoadHistoricalUploadDestinations: function () {
    var that = this;
    var oModel = new sap.ui.model.json.JSONModel();

    $.ajax({
        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/DestinationsAllSelectQuery&Content-Type=text/json",
        data: {
            "Param.1": "%",
            "Param.2": "DD_TYPE_SFTPforHistoricalUpload", 
            "Param.20": "*"
        },
        success: function (result) {
            var aRows = result?.Rowsets?.Rowset?.[0]?.Row || [];

            // Map to expected structure
            var aMapped = aRows.map(function (row) {
                return {
                  
	 ID_DATA_DESTINATION: row.ID_DATA_DESTINATION,
     	   DS_NAME: row.DS_NAME

                };
            });

            // Add default "None" option
            aMapped.unshift({ 
ID_DATA_DESTINATION: "None",
    DS_NAME: "None"
 });
	
// --- PATCH A START
            aMapped = aMapped.map(function (row) {
                return {
                    ID_DATA_DESTINATION: String(row.ID_DATA_DESTINATION),
                    DS_NAME: row.DS_NAME
                };
            });
            // --- PATCH A END ---

            oModel.setData({ Row: aMapped });
            that.getView().setModel(oModel, "HistoricalUploadModel");
			if (sMode === "U") {
    setTimeout(function () {
        oDataDestinationInformationController.fnFillChangeCommentModel();
    }, 0);
}

            // --- PATCH B START
            try {
                var sKey = String(
                    (that.getView().getModel() && that.getView().getModel().getProperty("/CD_HISTORICAL_UPLOAD_DEST"))
                    || "None"
                );
                that.byId("combobox-dd-historicalUpload").setSelectedKey(sKey);
            } catch (e) {
                // no-op
            }
            // --- PATCH B END ---
        },
        error: function () {
            sap.m.MessageToast.show("Failed to load historical upload destinations.");
        }
    });
},
    fnLoadDestinationData: function (sDestinationId) {
  var oDestinationHeadername = this.getView().byId("object-header-data-destinationInformation");
  var oView = this.getView();

  $.ajax({
    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/DestinationsAllSelectQuery&Content-Type=text/json", // <-- & not &amp;
    data: {
      "Param.1": "",
      "Param.2": "",
      "Param.3": sDestinationId,
      "Param.20": document.getElementById("SE_Plant").value
    },
    success: function (result) {
      if (result.Rowsets.Rowset) {
        if (result.Rowsets.Rowset[0].Row) {
          var oData = result.Rowsets.Rowset[0].Row[0];

          // bind the view with destination's data
          var bStandardSanofiDestination = sDataDestinationID.toUpperCase().startsWith("SE") ? true : false;
          oData.EditMode           = (sMode === "U") && !bStandardSanofiDestination; // <-- && not &amp;&amp;
          oData.SanofiStandardDest = bStandardSanofiDestination;
          oData.DestinationEnabled = oData.FL_ENABLED == "1" ? true : false;
          oData.DefaultDestination = oData.FL_DEFAULT == "1" ? true : false;
          oData.SplitMessage       = oData.FL_MESSAGE_SPLIT == "1" ? true : false;
	// --- Handle backend sentinel "NA": treat as empty so we can default to "None"
	if (Object.prototype.hasOwnProperty.call(oData, "CD_HISTORICAL_UPLOAD_DEST")) {
  	var _val = oData.CD_HISTORICAL_UPLOAD_DEST;
  	if (typeof _val === "string" && _val.trim().toUpperCase() === "NA") {
    	oData.CD_HISTORICAL_UPLOAD_DEST = "";
  		}
	}
          // --- SAFEGUARD #2 (A): normalize to string if present & non-empty
          if (Object.prototype.hasOwnProperty.call(oData, "CD_HISTORICAL_UPLOAD_DEST") &&
              oData.CD_HISTORICAL_UPLOAD_DEST != null &&
              oData.CD_HISTORICAL_UPLOAD_DEST !== "") { // <-- && not &amp;&amp;
            oData.CD_HISTORICAL_UPLOAD_DEST = String(oData.CD_HISTORICAL_UPLOAD_DEST);
          }

          // --- SAFEGUARD #2 (B): default to "None" only if column exists AND truly empty
          if (oData.CD_TYPE !== "DD_TYPE_SFTPforHistoricalUpload" &&
              Object.prototype.hasOwnProperty.call(oData, "CD_HISTORICAL_UPLOAD_DEST") &&
              !oData.CD_HISTORICAL_UPLOAD_DEST) { // <-- && not &amp;&amp;
            oData.CD_HISTORICAL_UPLOAD_DEST = "None";
          }

          // bind to view
	
	var _missingHistCol = !Object.prototype.hasOwnProperty.call(oData, "CD_HISTORICAL_UPLOAD_DEST");
	if (_missingHistCol && oData.CD_TYPE !== "DD_TYPE_SFTPforHistoricalUpload") {
  	oData.CD_HISTORICAL_UPLOAD_DEST = "None";
	}

          oView.getModel().setData(oData);
if (sMode === "U") {
    oFileUploaderSSH.setPlaceholder(oResourceBundle.getText("dataDestinationSSHExistMessage"));
}

          // --- SAFEGUARD #2 (C, optional until SQL updated): hydrate if column is missing
          if (!Object.prototype.hasOwnProperty.call(oData, "CD_HISTORICAL_UPLOAD_DEST")) {
            oDataDestinationInformationController.fnHydrateHistoricalUploadV2(sDestinationId);
          }

          // fill view variables & rest of your existing logic
          oDataDestinationInformationController.fnFillViewVariables();
          oDestinationHeadername.setTitle(oData.DS_NAME);
          oDataDestinationInformationController.loadMIICredentialsList(oData.DS_AUTHENTICATION_VALUE);
          oDataDestinationInformationController.filterAuthenMethod(sDestinationType, false);

          // load HTTP Params For API destinations
          if (sDestinationType && ((sDestinationType === "DD_TYPE_API") || (sDestinationType === "DD_TYPE_WEBSERVICE"))) {
            oDataDestinationInformationController.loadDestinationHTTParams(sDataDestinationID);
          }

          oDataDestinationInformationController.loadConnectionAliasList();
          oDataDestinationInformationController.fnFillChangeCommentModel();

        } else {
          oView.getModel().setData([]);
          oView.getModel().refresh(true);
        }
        oView.getModel().refresh(true);

      } else if (result.Rowsets.FatalError) {
        var errorMsg = result.Rowsets.FatalError;
        MessageToast.show(errorMsg);
      }
    }
  });
},
       fnHydrateHistoricalUploadV2: function (sDestinationId) {
  var that = this;
  $.ajax({
    // TODO: replace with your real query that returns the saved Historical Upload V2 ID
    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/HistoricalUploadDestByDestinationSelectQuery&Content-Type=text/json",
    data: { "Param.1": sDestinationId },
    success: function (result) {
      try {
        var row = result?.Rowsets?.Rowset?.[0]?.Row?.[0];
        var val = row && row.CD_HISTORICAL_UPLOAD_DEST ? String(row.CD_HISTORICAL_UPLOAD_DEST) : "None";
        // Patch the bound model and ensure the ComboBox reflects it
        that.getView().getModel().setProperty("/CD_HISTORICAL_UPLOAD_DEST", val);
        that.byId("combobox-dd-historicalUpload").setSelectedKey(val);
      } catch (e) { /* no-op */ }
    },
    error: function () { /* no-op */ }
  });
},
        fnFillViewVariables: function () {
            var oBindingContext = this.getView().getBindingContext().getObject();
            sDataDestinationID = oBindingContext.ID_DATA_DESTINATION;
            bEnabled = oBindingContext.DestinationEnabled;
            bDefault = oBindingContext.DefaultDestination;
            bSplit = oBindingContext.SplitMessage;
            sDestinationName = oBindingContext.DS_NAME;
			sHistoricalUploadDestId=oBindingContext.CD_HISTORICAL_UPLOAD_DEST;
            sDestinationDescription = oBindingContext.DS_DESCRIPTION;
            sPlantId = oBindingContext.ID_PLANT;
            sDestinationType = oBindingContext.CD_TYPE;
            sDestinationUrl = oBindingContext.DS_PATH;
            sDestinationAuthMethod = oBindingContext.CD_AUTHENTICATION_METHOD;
            sDestinationHTTPMethod = sDestinationType === "DD_TYPE_API" ? oBindingContext.CD_HTTP_METHOD : "NA";
            sDestinationConnAlias = sDestinationType == "DD_TYPE_SFTP" || sDestinationType === "DD_TYPE_SFTPforHistoricalUpload" ? oBindingContext.CD_CONNECTION_ALIAS : "";
            sDestinationAuthValue = sDestinationAuthMethod == "DD_AUTH_NONE" ? "NA" : oBindingContext.DS_AUTHENTICATION_VALUE;
            sSplitSizeCompressed = oBindingContext.QT_SPLIT_SIZE_COMPRESSED;
            sSplitSizeNotCompressed = oBindingContext.QT_SPLIT_SIZE_NOT_COMPRESSED;
        },
        fnFillChangeCommentModel: function () {
            if (bRequireChangeComment) {
                this.oModelChangeMessages.getData().Row = [
                    { columnName: "DS_NAME", name: oResourceBundle.getText("dataDestinationName"), old: sDestinationName, new: null, message: "" },
					{
  columnName: "CD_HISTORICAL_UPLOAD_DEST",
  name: oResourceBundle.getText("historicalUploadLabel"),
  old: (function () {
      if (!oComboHistoricalUpload) return "";

      var oItem = oComboHistoricalUpload.getItemByKey(sHistoricalUploadDestId);
      return oItem ? oItem.getText() : "";
  })(),
  new: null,
  message: ""
},
                    { columnName: "CD_TYPE", name: oResourceBundle.getText("dataDestinationType"), old: oResourceBundle.getText(sDestinationType), new: null, message: "" },
                    { columnName: "DS_PATH", name: oResourceBundle.getText("dataDestinationUrl"), old: sDestinationUrl, new: null, message: "" },
                    { columnName: "CD_HTTP_METHOD", name: oResourceBundle.getText("dataDestinationHttpMethod"), old: sDestinationHTTPMethod, new: null, message: "" },
                    { columnName: "CD_AUTHENTICATION_METHOD", name: oResourceBundle.getText("dataDestinationAuthenMethod"), old: sDestinationAuthMethod ? oResourceBundle.getText(sDestinationAuthMethod) : "", new: null, message: "" },
                    { columnName: "DS_AUTHENTICATION_VALUE", name: oResourceBundle.getText("dataDestinationAuthenValue"), old: sDestinationAuthValue, new: null, message: "" },
                    { columnName: "CD_CONNECTION_ALIAS", name: oResourceBundle.getText("dataDestinationConnectionAlias"), old: sDestinationConnAlias, new: null, message: "" },
                    { columnName: "FL_ENABLED", name: oResourceBundle.getText("dataSourcesEnabled"), old: (bEnabled ? sYesLabel : sNoLabel), new: null, message: "" },
                    { columnName: "FL_MESSAGE_SPLIT", name: oResourceBundle.getText("dataDestinationSplit"), old: (bSplit ? sYesLabel : sNoLabel), new: null, message: "" },
                    { columnName: "QT_SPLIT_SIZE_COMPRESSED", name: oResourceBundle.getText("dataDestinationSplitsizeCompressed"), old: sSplitSizeCompressed, new: null, message: "" },
                    { columnName: "QT_SPLIT_SIZE_NOT_COMPRESSED", name: oResourceBundle.getText("dataDestinationSplitsizeNotCompressed"), old: sSplitSizeNotCompressed, new: null, message: "" },
                    { columnName: "DS_DESCRIPTION", name: oResourceBundle.getText("dataDestinationDescription"), old: sDestinationDescription, new: null, message: "" },
                    { columnName: "FL_DEFAULT", name: oResourceBundle.getText("dataSourcesEnabled"), old: (bDefault ? sYesLabel : sNoLabel), new: null, message: "" },
                ]
            }
        },

        filterDestinationsList: function () {
            var oComboDestinationType = this.byId("combobox-dd-type");
            oComboDestinationType.getBinding("items").filter(new Filter("CD_TYPE", FilterOperator.NE, "DD_TYPE_PCO"));
        },
        onChangeAuthMethod: function () {
            var oBindingContext = this.getView().getBindingContext().getObject();
            oBindingContext.DS_AUTHENTICATION_VALUE = "";
        },
        onChangeDestinationType: function (oEvent) {
            var sDestinationType = oEvent.getSource().getProperty("selectedKey");
	
            if (sDestinationType) {
                this.filterAuthenMethod(sDestinationType, true);
	
  	 // FIX: Reload alias list for SFTP and Historical SFTP
      	  if (sDestinationType === "DD_TYPE_SFTP" || sDestinationType === "DD_TYPE_SFTPforHistoricalUpload") {
         	   this.loadConnectionAliasList()
	   
 // Optional UX improvement: auto-select first alias after loading
            setTimeout(() => {
                var oAliasCombo = this.byId("combobox-dd-connection-alias");
                var aItems = oAliasCombo.getItems();
                if (aItems.length > 0) {
                    oAliasCombo.setSelectedKey(aItems[0].getKey());
                }
            }, 500); // wait for model to bind
	}
            } else {
                this.filterAuthenMethod("", true);
            }
        },
        filterAuthenMethod: function (sDestinationType, bReset) {
            var aFilters = [];
            if (sDestinationType === "DD_TYPE_LocalFolder") {
                var aFilters = [
                    new Filter("CD_AUTHENTICATION_METHOD", FilterOperator.Contains, "DD_AUTH_NONE")
                ];
            } else if (sDestinationType === "DD_TYPE_SFTP") {
                var aFilters = [
                    new Filter("CD_AUTHENTICATION_METHOD", FilterOperator.Contains, "DD_AUTH_USERNAME"),
                    new Filter("CD_AUTHENTICATION_METHOD", FilterOperator.Contains, "DD_AUTH_SSH")
                ];
            }
	
else if (sDestinationType === "DD_TYPE_SFTPforHistoricalUpload") {
        // Historical SFTP should use SSH Key
        aFilters = [
            new Filter("CD_AUTHENTICATION_METHOD", FilterOperator.Contains, "DD_AUTH_SSH")
        ];
    }

	 else if (sDestinationType === "DD_TYPE_API") {
                var aFilters = [
                    new Filter("CD_AUTHENTICATION_METHOD", FilterOperator.Contains, "DD_AUTH_NONE"),
                    new Filter("CD_AUTHENTICATION_METHOD", FilterOperator.Contains, "DD_AUTH_USERNAME"),
                    new Filter("CD_AUTHENTICATION_METHOD", FilterOperator.Contains, "DD_AUTH_TOKEN"),
                    new Filter("CD_AUTHENTICATION_METHOD", FilterOperator.Contains, "DD_AUTH_API_KEY")
                ];
            } else if (sDestinationType === "DD_TYPE_WEBSERVICE") {
                var aFilters = [
                    new Filter("CD_AUTHENTICATION_METHOD", FilterOperator.Contains, "DD_AUTH_USERNAME"),
                    
                ];
            }

            else {
                aFilters = []
            }
            if (bReset) {
                var oBindingContext = this.getView().getBindingContext().getObject();
                oBindingContext.DS_AUTHENTICATION_VALUE = "";
                oBindingContext.CD_AUTHENTICATION_METHOD = (sDestinationType === "DD_TYPE_SFTPforHistoricalUpload") ? "DD_AUTH_SSH" : "";
            }
            oComboDesAuthMeth.getBinding("items").filter(aFilters);
	
 	//ensure UI reflects default immediately
    if (sDestinationType === "DD_TYPE_SFTPforHistoricalUpload") {
        oComboDesAuthMeth.setSelectedKey("DD_AUTH_SSH");
    }

        },
        onAddHeaderParam: function () {
            var that = this;
            var oItem = new sap.m.ColumnListItem({
                cells:
                    [
                        new sap.m.Input(),
                        new sap.m.Input(),
                        new sap.m.Button({
                            icon: "sap-icon://delete",
                            type: "Transparent",
                            press: that.deleteRow.bind(that),
                            tooltip: "{i18n>commonRestore}"
                        })
                    ]
            });
            var oTable = this.getView().byId("table-dd-headers");
            oTable.addItem(oItem);
        },
        deleteRow: function (oEvent) {
            var oTable = this.getView().byId("table-dd-headers"),
                oSelectedItem, sKey, sValue;

            if (oEvent.getSource().getParent().getAggregation("cells")) {
                //case: new header added (only the delete button is displayed)
                oSelectedItem = oEvent.getSource().getParent();
            } else {
                //case: new header added (only the delete button is displayed)
                oSelectedItem = oEvent.getSource().getParent().getParent();
            }
            //if both fields filled, as for user confirmation before deleting the row
            sKey = oSelectedItem.getCells()[0].getValue();
            sValue = oSelectedItem.getCells()[1].getValue();
            if (sKey && sValue) {
                MessageBox.warning(oResourceBundle.getText("dataDestinationsDeleteHeader"), {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (sACTION) {
                        if (sACTION === "YES") {
                            oTable.removeItem(oSelectedItem.getId());
                        }
                    }
                });
            } else {
                oTable.removeItem(oSelectedItem.getId());
            }
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("DataDestinations", {
                Refresh: "Y"
            });
        },
        getText: function (sText) {
            if(sText) return oResourceBundle.getText(sText);
            else return "";           
        },
        loadMIICredentialsList: function () {
            var that = this;
            var oModelDataDestinationMIICredentials = new JSONModel();
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/CredentialListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": "SE%"
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationsMIICredentialsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oModelDataDestinationMIICredentials.setData(data);
                        oModelDataDestinationMIICredentials.refresh(true);
                        oComboDesMIICred.setModel(oModelDataDestinationMIICredentials, "CredentialsListModel");
                    }
                }
            });
        },
        oModelConnectionAlias: new JSONModel(),
        loadConnectionAliasList: function () {
            this.getView().setModel(this.oModelConnectionAlias, "ConnectionAliasModel");
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/ConnectionListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": "SE%"
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        oDataDestinationInformationController.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationsConnectionAliasList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oDataDestinationInformationController.oModelConnectionAlias.setData(data);
                        oComboDesMIICred.getModel("CredentialsListModel").refresh();
                    }
                }
            });
        },
        loadDestinationHTTParams: function (sDataDestinationID) {
            var that = this;
            var oModelDataDestinationHTTPParams = new JSONModel();
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/DestinationHTTPParamsSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sDataDestinationID
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationsHTTPParams"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0].Row;
                        if (data && data.length && bRequireChangeComment) {
                            for (var a of data) {
                                var sColumnName = "DS_HEADER_VALUE" + "." + a.CD_HEADER_KEY;
                                that.oModelChangeMessages.getData().Row.push(
                                    { columnName: sColumnName, name: oResourceBundle.getText("dataDestinationHeaderValue"), old: a.DS_HEADER_VALUE, new: null, message: "" }
                                )
                            }
                        }
                        oModelDataDestinationHTTPParams.setData(data);
                        that.getView().byId("table-dd-headers").setModel(oModelDataDestinationHTTPParams, "HTTPParams");
                        that.bindHTTPParamsTable();
                    }
                }
            });
        },
        bindHTTPParamsTable: function () {
            var oTable = this.getView().byId("table-dd-headers");
            var oBindingContext = this.getView().getBindingContext().getObject();
            var that = this;
            if (!oBindingContext.SanofiStandardDest) {
                oTable.bindItems("HTTPParams>/", function (sId, oContext) {
                    return new sap.m.ColumnListItem({
                        cells:
                            [
                                new sap.m.Input({ value: oContext.getProperty("CD_HEADER_KEY") }),
                                new sap.m.Input({ value: oContext.getProperty("DS_HEADER_VALUE") }),
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.Button({
                                            icon: "sap-icon://delete",
                                            type: "Transparent",
                                            press: that.deleteRow.bind(that),
                                            tooltip: "{i18n>commonRestore}"
                                        }),
                                        new sap.m.Button({
                                            icon: "sap-icon://past",
                                            type: "Transparent",
                                            press: that.fnOpenHTTPParamsRestorePopup.bind(that),
                                            tooltip: "{i18n>commonRestore}"
                                        })
                                    ]
                                })
                            ]
                    })
                })
            } else {
                oTable.bindItems("HTTPParams>/", function (sId, oContext) {
                    return new sap.m.ColumnListItem({
                        cells:
                            [
                                new sap.m.Text({ text: oContext.getProperty("CD_HEADER_KEY") }),
                                new sap.m.Text({ text: oContext.getProperty("DS_HEADER_VALUE") })
                            ]
                    })
                })
            }
        },
        fnSaveDDInformation: function () {
            if (sMode == "I") {
                sAction = "INSERT";
                this.fnAddUpdateDataDestinationInformation();
            } else if (sMode == "U") {
                sAction = "UPDATE";
                //switch enablement flag from ON to OFF
                if (!oEnabledSwitch.getState() && bEnabled == true) {
                    this.fnCheckFlowsUsingCurrentDestination(0);
                } else {
                    if (!oEnabledSwitchSplit.getState() && bSplit == true) {
                        this.fnCheckFlowsUsingCurrentDestination(1);
                    }
                    else {
                        this.fnAddUpdateDataDestinationInformation();
                    }
                }
            }
        },
		fnTestConnection: function () {
			var that = this;
			var oView = this.getView();
			var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oBindingContext = oView.getBindingContext().getObject();

			// Extract parameters
			var sAuthValue = oBindingContext.DS_AUTHENTICATION_VALUE || "";
			var sAuthMethod = oBindingContext.CD_AUTHENTICATION_METHOD || "";
			var sDataDestId = oBindingContext.ID_DATA_DESTINATION || "";
			var sPath = oBindingContext.DS_PATH || "";

			// Validate inputs
			if (!sDataDestId || !sPath) {
				sap.m.MessageToast.show(oResourceBundle.getText("dataDestinationMissingParams"));
				return;
			}

			// Show waiting dialog
			var sWaitMessage = oResourceBundle.getText("dataDestinationTestConnectionWait");
			oDialog.open();
			oDialog.setText(sWaitMessage);

			// Call MII Xacute Query
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/TestConnectionDestinationXacuteQuery&Content-Type=text/json",
				type: "POST",
				data: {
					"Param.1": sAuthValue,
					"Param.2": sAuthMethod,
					"Param.3": sDataDestId,
					"Param.4": sPath
				},
				success: function (result) {
					oDialog.close();

					try {
						var oRow = result?.Rowsets?.Rowset?.[0]?.Row?.[0];

						if (oRow) {
							var sStatus = oRow.StatusCode || "KO";
							var sMessage = oRow.StatusMessage || "No message";
							var sTimestamp = oRow.DateTime || "";

							// Update UI fields
							oView.byId("input-last-known-status").setValue(sStatus + ", "+ sTimestamp);
							
							// Show message with timestamp
							if (sStatus === "OK") {
								sap.m.MessageToast.show(
									oResourceBundle.getText("dataDestinationTestConnectionSuccess") + " (" + sTimestamp + ")"
								);
							} else {
								sap.m.MessageToast.show(
									oResourceBundle.getText("dataDestinationTestConnectionFailed") + ": " + sMessage
								);
							}
						} else if (result?.Rowsets?.FatalError) {
							sap.m.MessageBox.error(result.Rowsets.FatalError);
						} else {
							sap.m.MessageBox.warning(oResourceBundle.getText("dataDestinationTestConnectionUnknownResponse"));
						}
					} catch (err) {
						sap.m.MessageBox.error(oResourceBundle.getText("dataDestinationTestConnectionParseError") + ": " + err.message);
					}
				},
				error: function (xhr, status, error) {
					oDialog.close();
					sap.m.MessageBox.error(oResourceBundle.getText("dataDestinationTestConnectionError") + ": " + error);
				}
			});
		},

        fnAddUpdateDataDestinationInformation: function () {
            var bIsValid = this.fnValidateInputs();
            if (bIsValid) {
                var sWaitMessage = oResourceBundle.getText("dataDestinationsInfoSavingWaitMessage");

                           var that = this;
                sDestinationHTTPParams = this.getHTTPParams();

                if (sDestinationAuthMethod == "DD_AUTH_SSH" && oFileUploaderSSH.FUEl.files.length > 0 && sSSHKey.length < oFileUploaderSSH.FUEl.files[0].size) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        sSSHKey = e.currentTarget.result;
                        if (sSSHKey == "") {
                            sap.m.MessageToast.show("Empty File! Update the file and try again.");
                        } else {
                            oDataDestinationInformationController.fnAddUpdateDataDestinationInformation();
                        }
                    }
                    reader.readAsBinaryString(oFileUploaderSSH.FUEl.files[0]);
                    return;
                }

	if (sMode === "U") {
            	sHistoricalUploadDestId = oComboHistoricalUpload.getSelectedKey();
        		}
	//alert(sHistoricalUploadDestId);
                var aCommentColumnNameStd = [];
                var aCommentMessageStd = [];
                var aCommentColumnNamePCo = [];
                var aCommentMessagePCo = [];
                if (bRequireChangeComment && sMode === "U") {
                    if (!this.fnValidateChangeComments()) {
                        return;
                    }
                    bShowCommentDialog = true;
                    var oChangeTracker = this.oModelChangeMessages.getData();
                    for (var e of oChangeTracker.Row) {
                        if (e.new != null) {
                            if (e.columnName == "DS_DESCRIPTION" || e.columnName == "FL_DEFAULT") {
                                aCommentColumnNamePCo.push(e.columnName);
                                aCommentMessagePCo.push(e.message);
                            } else {
                                aCommentColumnNameStd.push(e.columnName);
                                aCommentMessageStd.push(e.message);
                            }
                        }
                    }
                }

                if (sSplitSizeCompressed == "" || sSplitSizeCompressed == "NA" || sDestinationType != "DD_TYPE_API") { sSplitSizeCompressed = 0; }
                if (sSplitSizeNotCompressed == "" || sSplitSizeNotCompressed == "NA" || sDestinationType != "DD_TYPE_API") { sSplitSizeNotCompressed = 0; }
                oDialog.open();
                oDialog.setText(sWaitMessage);
                var oBindingContext = this.getView().getBindingContext().getObject();
	

                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/DataDestinationXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": sAction,
                        "Param.2": sDataDestinationID,
                        "Param.3": sDestinationName,
                        "Param.4": sDestinationType,
                        "Param.5": sDestinationUrl,
                        "Param.6": sDestinationAuthMethod,
                        "Param.7": sDestinationAuthValue,
                        "Param.8": sDestinationHTTPMethod,
                        "Param.9": sDestinationHTTPParams,
                        "Param.10": oBindingContext.DestinationEnabled ? "1" : "0",
                        "Param.11": sDestinationConnAlias,
                        "Param.12": (sDestinationAuthMethod == "DD_AUTH_SSH") && (oFileUploaderSSH.FUEl.files.length > 0) ? sSSHKey : undefined,
                        "Param.13": oBindingContext.SplitMessage ? "1" : "0",
                        "Param.14": sSplitSizeCompressed,
                        "Param.15": sSplitSizeNotCompressed,
                        "Param.16": sDestinationDescription,
                        "Param.17": oBindingContext.DefaultDestination ? "1" : "0",
                        "Param.18": sPlantId,
                        "Param.20": aCommentColumnNameStd.join("\n"),
                        "Param.21": aCommentMessageStd.join("\n"),
                        "Param.22": aCommentColumnNamePCo.join("\n"),
                        "Param.23": aCommentMessagePCo.join("\n"),
		                "Param.24" : (sHistoricalUploadDestId == "None") ? "" : sHistoricalUploadDestId
		
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var errorMsg = result.Rowsets.FatalError;
                            oDialog.close();
                            if (sAction === "INSERT") {
                                that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                                    oResourceBundle.getText("dataDestinationsAddNewDD"),
                                    errorMsg,
                                    "Error");
                            } else {
                                that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                                    oResourceBundle.getText("dataDestinationsUpdateDateDestinationInfo"),
                                    errorMsg,
                                    "Error");
                            }
                        } else {
                            oDialog.close();
                            if (sAction === "INSERT") {
                                that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                                    oResourceBundle.getText("dataDestinationsAddNewDD"),
                                    oResourceBundle.getText("dataDestinationsSaveDateDestinationInfoMsg"),
                                    "Success");
                            } else {
                                that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                                    oResourceBundle.getText("dataDestinationsUpdateDateDestinationInfo"),
                                    oResourceBundle.getText("dataDestinationsSaveDateDestinationInfoMsg"),
                                    "Success");
                            }
                            oDialog.close();
                            oDataDestinationInformationController.fnNavigateBack();
                        }
                    }
                });
                sSSHKey = oFileUploaderSSH.getPlaceholder() == oResourceBundle.getText("dataDestinationNewSSHMessage") ? "" : "---";
            }
        },
        fnSwitchSplit: function () {
            if (this.getView().byId("switch-dd-split").getState()) {
                this.getView().byId("input-dd-splitsizeNotCompressed").setValue("");
                this.getView().byId("input-dd-splitsizecompressed").setValue("");
            }
        },
        fnValidateInputs: function () {
            var bValidInputs = true;
            //fill view variables
            oDataDestinationInformationController.fnFillViewVariables();

            if (sDestinationType && sDestinationType === "DD_TYPE_PCO") {
                if (sDestinationDescription == "") {
                    oInputDestinationDescription.setValueState("Error");
                    return false;
                } else {
                    oInputDestinationDescription.setValueState("None");
                    return true;
                }
            }

            if (sDestinationName == "") {
                bValidInputs = false;
                oInputDesName.setValueState("Error");
            } else {
                oInputDesName.setValueState("None");
            }

            if (sDestinationType == "") {
                bValidInputs = false;
                oComboDesType.setValueState("Error");
            } else {
                oComboDesType.setValueState("None");
            }

            if (sDestinationUrl == "") {
                bValidInputs = false;
                oInputDesPath.setValueState("Error");
            } else {
                oInputDesPath.setValueState("None");
            }

            if (sDestinationAuthMethod == "") {
                bValidInputs = false;
                oComboDesAuthMeth.setValueState("Error");
            } else {
                oComboDesAuthMeth.setValueState("None");
            }
			var bStandardSanofiDestination = sDataDestinationID.toUpperCase().startsWith("SE") ? true : false;

            if (sDestinationAuthMethod && sDestinationAuthValue == "" && !bStandardSanofiDestination) {
                bValidInputs = false;
                if (sDestinationAuthMethod === "DD_AUTH_TOKEN" || sDestinationAuthMethod === "DD_AUTH_API_KEY") {
                    oInputDesToken.setValueState("Error");
                } else if (sDestinationAuthMethod === "DD_AUTH_SSH") {
                    oInputUsernameSsh.setValueState("Error");
                } else {
                    oComboDesMIICred.setValueState("Error");
                }
            } else {
                if (sDestinationAuthMethod === "DD_AUTH_TOKEN" || sDestinationAuthMethod === "DD_AUTH_API_KEY") {
                    oInputDesToken.setValueState("None");
                } else if (sDestinationAuthMethod === "DD_AUTH_SSH") {
                    oInputUsernameSsh.setValueState("None");
                } else {
                    oComboDesMIICred.setValueState("None");
                }
            }

          var bNoExistingKey = oFileUploaderSSH.getPlaceholder() === oResourceBundle.getText("dataDestinationNewSSHMessage");
	if (sDestinationAuthMethod === "DD_AUTH_SSH" && bNoExistingKey && oFileUploaderSSH.FUEl.files.length == 0) {
   	 bValidInputs = false;
   	 oFileUploaderSSH.setValueState("Error");
	} else {
    	oFileUploaderSSH.setValueState("None");
	}

            if ((sDestinationType === "DD_TYPE_API") && (sDestinationHTTPMethod == "NA" || sDestinationHTTPMethod == "")) {
                bValidInputs = false;
                oComboDesHttpMeth.setValueState("Error");
            } else {
                oComboDesHttpMeth.setValueState("None");
            }

            if ((sDestinationType === "DD_TYPE_SFTP" || sDestinationType === "DD_TYPE_SFTPforHistoricalUpload") && sDestinationConnAlias === "") {
                bValidInputs = false;
                oComboConnAlias.setValueState("Error");
            } else {
                oComboConnAlias.setValueState("None");
            }

           
	if (sDestinationType === "DD_TYPE_SFTPforHistoricalUpload") {
    // Ignore split size validation
    	oSplitSizeCompressed.setValueState("None");
    	oSplitSizeNotCompressed.setValueState("None");
	} else if (iSwitchSplitEnabled && sDestinationType === "DD_TYPE_API") {
                if (sSplitSizeCompressed === "" || sSplitSizeCompressed == "NA") {
                    bValidInputs = false;
                    oSplitSizeCompressed.setValueState("Error");

                } else {
                    oSplitSizeCompressed.setValueState("None");
                    if (sDataDestinationID.toUpperCase().startsWith("SE") && (sSplitSizeCompressed > 18432 || sSplitSizeCompressed < 100)) {
                        bValidInputs = false;
                        oSplitSizeCompressed.setValueState("Error");
                        oSplitSizeCompressed.setValueStateText(oResourceBundle.getText("dataDestinationSplitsizeCompressedDataLakeErrorMessage"));
                        this.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationSplitsizeCompressed"),
                            oResourceBundle.getText("dataDestinationSplitsizeCompressedDataLakeErrorMessage"),
                            "Error");
                    }
                    if (!sDataDestinationID.toUpperCase().startsWith("SE") && (sSplitSizeCompressed < 20)) {
                        bValidInputs = false;
                        oSplitSizeCompressed.setValueState("Error");
                        oSplitSizeCompressed.setValueStateText(oResourceBundle.getText("dataDestinationSplitsizeCompressedErrorMessage"));
                        this.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationSplitsizeCompressed"),
                            oResourceBundle.getText("dataDestinationSplitsizeCompressedErrorMessage"),
                            "Error");
                    }
                }
                if (sSplitSizeNotCompressed === "" || sSplitSizeNotCompressed == "NA") {
                    oSplitSizeNotCompressed.setValueState("Error");
                    bValidInputs = false;
                } else {
                    oSplitSizeNotCompressed.setValueState("None");
                    if (sDataDestinationID.toUpperCase().startsWith("SE") && (sSplitSizeNotCompressed > 4096 || sSplitSizeNotCompressed < 100)) {
                        bValidInputs = false;
                        oSplitSizeNotCompressed.setValueState("Error");
                        oSplitSizeNotCompressed.setValueStateText(oResourceBundle.getText("dataDestinationSplitsizeNotCompressedDataLakeErrorMessage"));

                        this.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationSplitsizeNotCompressed"),
                            oResourceBundle.getText("dataDestinationSplitsizeNotCompressedDataLakeErrorMessage"),
                            "Error");
                    }
                    if (!sDataDestinationID.toUpperCase().startsWith("SE") && (sSplitSizeNotCompressed < 20)) {
                        bValidInputs = false;
                        oSplitSizeNotCompressed.setValueState("Error");
                        oSplitSizeNotCompressed.setValueStateText(oResourceBundle.getText("dataDestinationSplitsizeNotCompressedErrorMessage"));
                        this.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationSplitsizeNotCompressed"),
                            oResourceBundle.getText("dataDestinationSplitsizeNotCompressedErrorMessage"),
                            "Error");
                    }
                }
            }
            return bValidInputs;
        },
        fnCheckFlowsUsingCurrentDestination: function (bFlagSplit) {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/DataFlowsUsingDestinationSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sDataDestinationID
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationsLoadAffectedFlows"),
                            errorMsg,
                            "Error");
                    } else {
                        var oData = result.Rowsets.Rowset;
                        if (!bFlagSplit) {
                            if (oData && oData[0].Row && oData[0].Row.length > 0) {
                                that.fnOpenConfirmationDialogForAffectedFlows(oData[0], 0);
                            } else {
                                that.fnAddUpdateDataDestinationInformation();
                            }
                        }
                        else {
                            if (oData && oData[0].Row && oData[0].Row.length > 0) {
                                that.fnOpenConfirmationDialogForAffectedFlows(oData[0], 1);
                            } else {
                                that.fnAddUpdateDataDestinationInformation();
                            }
                        }
                    }
                }
            })
        },
        fnOpenConfirmationDialogForAffectedFlows: function (aData, bFlagSplit) {
            var oAffectedFlowsModel = new sap.ui.model.json.JSONModel(aData);
            var that = this;
            if (!this._oAffectedFlowsDialog) {
                this._oAffectedFlowsDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.AffectedDataFlows", this);
            }
            this.getView().addDependent(this._oAffectedFlowsDialog);
            this._oAffectedFlowsDialog.setModel(oAffectedFlowsModel);
            this._oAffectedFlowsDialog.open();
            if (bFlagSplit) {
                sap.ui.getCore().byId("affected-flows-confirm").setEnabled(false);
            }
            else {
                sap.ui.getCore().byId("affected-flows-confirm").setEnabled(true);
            }
        },
        fnConfirmDisableDataDestination: function () {
            this.fnAddUpdateDataDestinationInformation();
            this._oAffectedFlowsDialog.close();
        },
        fnCancelDisableDataDestination: function () {
            oEnabledSwitch.setState(true);
            this._oAffectedFlowsDialog.close();
        },
        getHTTPParams: function () {
            var oHTTPParamsXMLObject = '<?xml version="1.0" encoding="UTF-8"?><HTTPParams>';
            var oTableDesHeaders = this.getView().byId("table-dd-headers");
            var oTableItems = oTableDesHeaders.getItems();
            if (sAction === "INSERT" && oTableItems.length > 0) {
                for (var i = 0; i < oTableItems.length; i++) {
                    oHTTPParamsXMLObject += '<Param><Action>I</Action><Key>' + oTableItems[i].getCells()[0].getValue() + '</Key><Value>' + oTableItems[i].getCells()[1].getValue() + '</Value></Param>';
                }
            } else if (sAction === "UPDATE") {
                var aUpdatedHeaders = [];
                var oChangeTracker = this.oModelChangeMessages.getData();
                var oHeaderObject;
                //Create an array containing the updated HTTP Headers of the destination
                for (var i = 0; i < oTableItems.length; i++) {
                    oHeaderObject = {
                        "key": oTableItems[i].getCells()[0].getValue(),
                        "value": oTableItems[i].getCells()[1].getValue()
                    }
                    aUpdatedHeaders.push(oHeaderObject);
                }
                if (oTableDesHeaders.getModel("HTTPParams") && oTableDesHeaders.getModel("HTTPParams").getData()) {
                    //Get initial HTTP Headers of the destination
                    var aInitialHeaders = oTableDesHeaders.getModel("HTTPParams").getData();
                    var iIndexOfKey;
                    //Check the differences between the two arrays and decide regarding the action
                    for (var j = 0; j < aInitialHeaders.length; j++) {
                        iIndexOfKey = aUpdatedHeaders.findIndex(function (oElt) {
                            return oElt.key === aInitialHeaders[j].CD_HEADER_KEY;
                        });
                        if (iIndexOfKey > -1) {
                            var sHeaderKey;
                            if (aUpdatedHeaders[iIndexOfKey].value !== aInitialHeaders[j].CD_HEADER_VALUE) {
                                sHeaderKey = "DS_HEADER_VALUE" + "." + aInitialHeaders[j].CD_HEADER_KEY;
                                oHTTPParamsXMLObject += '<Param><Action>U</Action><Key>' + aInitialHeaders[j].CD_HEADER_KEY + '</Key><Value>' + aUpdatedHeaders[iIndexOfKey].value + '</Value></Param>';
                                oChangeTracker.fnUpdateNewValue(sHeaderKey, aUpdatedHeaders[iIndexOfKey].value);
                            }
                            aUpdatedHeaders.splice(iIndexOfKey, 1);
                        } else {
                            oHTTPParamsXMLObject += '<Param><Action>D</Action><Key>' + aInitialHeaders[j].CD_HEADER_KEY + '</Key><Value>' + aInitialHeaders[j].DS_HEADER_VALUE + '</Value></Param>';
                        }
                    }
                }
                //Loop over the remaining values in the aUpdatedHeaders array to add them with insert Action
                for (var u = 0; u < aUpdatedHeaders.length; u++) {
                    oHTTPParamsXMLObject += '<Param><Action>I</Action><Key>' + aUpdatedHeaders[u].key + '</Key><Value>' + aUpdatedHeaders[u].value + '</Value></Param>';
                }
            }
            return oHTTPParamsXMLObject += '</HTTPParams>'
        },
        fnDeleteDataDestination: function () {
            var sConfirmTitle = oResourceBundle.getText("commonConfirm");
            var sConfirmYes = oResourceBundle.getText("commonYes");
            var sConfirmNo = oResourceBundle.getText("commonNo");
            var sConfirmMessage = oResourceBundle.getText("dataDestinationsInfoDeleteConfirmation");
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
                        oDataDestinationInformationController.fnDeleteDataDestinationInformation();
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
        fnDeleteDataDestinationInformation: function () {
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/DataDestinationXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sAction,
                    "Param.2": sDataDestinationID,
                    "Param.4": sDestinationType
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        oDialog.close();
                        that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationsDeleteDateDestinationInfo"),
                            errorMsg,
                            "Error");
                    } else {
                        oDialog.close();
                        that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("dataDestinationsDeleteDateDestinationInfo"),
                            oResourceBundle.getText("dataDestinationsDeleteSuccDateDestinationInfo"),
                            "Success");
                        oDataDestinationInformationController.fnNavigateBack();
                    }
                }
            });
        },
        /****************Below Functions are for Restore Values (Common to all pages)*****************/
        oModelRestoreValue: new sap.ui.model.json.JSONModel(),
        fnOpenRestorePopup: function (oEvent) {
            var oFormContainer = oEvent.getSource().getParent();
            oCurrentControl = oFormContainer.getAggregation("fields")[0];
            sCurrentColumnName = oCurrentControl.data("columnName");
            sCurrentLabel = oFormContainer.getLabel().getText();
            this._oRestoreDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.RestoreValueSelect", this);
            this.getView().addDependent(this._oRestoreDialog);
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oRestoreDialog);
            this._oRestoreDialog.open();
            this.fnInitRestorePopup();
        },
        fnOpenHTTPParamsRestorePopup: function (oEvent) {
            sCurrentLabel = oResourceBundle.getText("dataDestinationHeaderValue");
            var oSelectedHeader = oEvent.getSource().getParent().getParent();
            sCurrentColumnName = "DS_HEADER_VALUE." + oSelectedHeader.getCells()[0].getValue();
            oCurrentControl = oSelectedHeader.getCells()[1];
            if (oSelectedHeader.getBindingContext()) {
                sTableKey = oSelectedHeader.getBindingContext().getObject().ID_DATA_DESTINATION + "." + oSelectedHeader.getBindingContext().getObject().CD_HEADER_KEY;
            } else {
                sTableKey = "";
            }
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
       fnValidateChangeComments: function () {

    var oChangeTracker = this.oModelChangeMessages.getData();

    var oBindingContext = this.getView().getBindingContext().getObject();

    // Refresh latest values
    oDataDestinationInformationController.fnFillViewVariables();

    // 🔥 GET CURRENT Historical Upload selection SAFELY
    var sSelectedHistoricalUpload = "";

    if (oComboHistoricalUpload) {
        sSelectedHistoricalUpload = oComboHistoricalUpload.getSelectedKey();
    }

    // Normalize "None" to empty string
    if (sSelectedHistoricalUpload === "None") {
        sSelectedHistoricalUpload = "";
    }

   var sHistoricalUploadNewText = "";

if (oComboHistoricalUpload) {
    var oSelectedItem = oComboHistoricalUpload.getSelectedItem();
    if (oSelectedItem) {
        sHistoricalUploadNewText = oSelectedItem.getText();
    }
}

// Update tracker using TEXT (not UUID)
oChangeTracker.fnUpdateNewValue(
    "CD_HISTORICAL_UPLOAD_DEST",
    sHistoricalUploadNewText
);

    // Track remaining fields
    oChangeTracker.fnUpdateNewValue(
        "FL_ENABLED",
        oBindingContext.DestinationEnabled ? sYesLabel : sNoLabel
    );

    oChangeTracker.fnUpdateNewValue("DS_NAME", sDestinationName);

    oChangeTracker.fnUpdateNewValue(
        "CD_TYPE",
        oResourceBundle.getText(sDestinationType)
    );

    oChangeTracker.fnUpdateNewValue("DS_PATH", sDestinationUrl);

    oChangeTracker.fnUpdateNewValue(
        "CD_CONNECTION_ALIAS",
        sDestinationConnAlias
    );

    oChangeTracker.fnUpdateNewValue(
        "CD_AUTHENTICATION_METHOD",
        sDestinationAuthMethod
            ? oResourceBundle.getText(sDestinationAuthMethod)
            : ""
    );

    oChangeTracker.fnUpdateNewValue(
        "DS_AUTHENTICATION_VALUE",
        sDestinationAuthValue
    );

    oChangeTracker.fnUpdateNewValue(
        "CD_HTTP_METHOD",
        sDestinationHTTPMethod
    );

    oChangeTracker.fnUpdateNewValue(
        "FL_MESSAGE_SPLIT",
        oBindingContext.SplitMessage ? sYesLabel : sNoLabel
    );

    oChangeTracker.fnUpdateNewValue(
        "QT_SPLIT_SIZE_COMPRESSED",
        sSplitSizeCompressed != "" ? sSplitSizeCompressed : 0
    );

    oChangeTracker.fnUpdateNewValue(
        "QT_SPLIT_SIZE_NOT_COMPRESSED",
        sSplitSizeNotCompressed != "" ? sSplitSizeNotCompressed : 0
    );

    oChangeTracker.fnUpdateNewValue(
        "DS_DESCRIPTION",
        sDestinationDescription
    );

    oChangeTracker.fnUpdateNewValue(
        "FL_DEFAULT",
        oBindingContext.DefaultDestination ? sYesLabel : sNoLabel
    );

    // Open popup if changes exist
    if (bShowCommentDialog &&
        oChangeTracker.Row.filter(e => e.new != null).length > 0) {
        this.fnChangeCommentDialog();
        return false;
    }

    // Validate comments
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
	var oStaleChangeCommentDialog = sap.ui.getCore().byId("ChangeMessage");
   	 if (oStaleChangeCommentDialog) {
       	 oStaleChangeCommentDialog.destroy();
    	}
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
    var sCommentValue = oInput.getValue();
    var oRowData = e.getBindingContext().getObject();
    oRowData.message = sCommentValue;
    if (sCommentValue.length > 0 && sCommentValue.length < 255) {
        oInput.setValueState("None");
    } else {
        oInput.setValueState("Error");
        bValid = false;
    }
});
                    if (bValid) {
                        oDataDestinationInformationController.fnAddUpdateDataDestinationInformation();
                        oChangeCommentDialog.close();
                    } else {
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
                        that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
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
        fnCancelRestore: function () {
            this._oRestoreDialog.destroy();
        },
        fnConfirmRestore: function (oEvent) {
            var sSelectedValue = oEvent.getParameter("selectedContexts")[0].getObject().DS_VALUE_NEW;
            var sControlName = oCurrentControl.getMetadata().getName();
            if (sControlName == "sap.m.Input") {
                oCurrentControl.setValue(sSelectedValue);
            } else if (sControlName == "sap.m.Switch") {
                if (sSelectedValue == sYesLabel) {
                    oCurrentControl.setState(true);
                } else {
                    oCurrentControl.setState(false);
                }
            } else if (sControlName == "sap.m.ComboBox") {
                oCurrentControl.setSelectedKey(sSelectedValue);
            } else if (sControlName == "sap.m.MultiComboBox") {
                oCurrentControl.setSelectedKeys(sSelectedValue.split(","))
            }

            this._oRestoreDialog.destroy();
        },
        /****************Below Function is for Restore Values (specific to this page)*****************/
        fnLoadrestoreValues: function () {
            oDialog.open();
            var that = this;
            if (sCurrentColumnName.startsWith("DS_HEADER_VALUE")) {
                sCatalogTable = "SE_DATA_DESTINATION_HTTP_PARAMS";
            } else if (sCurrentColumnName == "DS_DESCRIPTION" || sCurrentColumnName == "FL_DEFAULT") {
                sCatalogTable = "SE_PCO_DESTINATION";
                sTableKey = sDataDestinationID;
            } else {
                sCatalogTable = "SE_DATA_DESTINATION";
                sTableKey = sDataDestinationID;
            }
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLogRestoreValueSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sCatalogTable,
                    "Param.2": sCurrentColumnName,
                    "Param.3": sTableKey
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
                            oResourceBundle.getText("plantInfoRestoreValueMsg"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        var data = result.Rowsets.Rowset[0];

                        if (data.Row) {
                            var oRestoreData = that.fnSetTextsToCodes(data);
                            oDataDestinationInformationController.oModelRestoreValue.setData(oRestoreData);
                            if (sCurrentColumnName.startsWith("FL_")) {
                                data.Row = data.Row.map(function (oElt) {
                                    return {
                                        DS_USERNAME: oElt.DS_USERNAME,
                                        DS_VALUE_NEW: oElt.DS_VALUE_NEW == "1" ? sYesLabel : sNoLabel,
                                        DT_TIMESTAMP: oElt.DT_TIMESTAMP
                                    }
                                });
                            }
                        } else {
                            oDataDestinationInformationController.oModelRestoreValue.setData(data);
                        }
                        oDataDestinationInformationController.oModelRestoreValue.refresh();
                        oDialog.close();
                    }
                }
            });
        },
        fnSetTextsToCodes: function (aData) {
            var aColumnsWithCodes = ["CD_TYPE", "CD_AUTHENTICATION_METHOD"];
            for (var i = 0; i < aData.Row.length; i++) {
                if (aColumnsWithCodes.includes(sCurrentColumnName)) {
                    aData.Row[i].DS_VALUE_NEW = oResourceBundle.getText(aData.Row[i].DS_VALUE_NEW);
                }
            }
            return aData;
        }
        /*****************************************************************************/
    });
});

//# sourceURL=https://sapdqnjc.pharma.aventis.com:50001/XMII/CM/StreamingEngine/StreamingEngine/controller/DataDestinationInformation.controller.js?eval