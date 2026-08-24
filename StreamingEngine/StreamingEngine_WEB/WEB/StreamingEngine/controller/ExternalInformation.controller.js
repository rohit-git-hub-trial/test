/*-----------------------------------------------------------------------------------
Streaming Engine - External Flows Information
Creation Date: 2022.12.06 / By: E0499160
Reference Document: 
Description:This screen is used Add, Edit or Delete a selected External Flow.
-------------------------------------------------------------------------------------*/
var sFlowID;
var sMode;
var sAction;
var oExternalInformationController;
var oDialog;
var sInputFlowId;
var sComboDataSource;
var sInputDataFlowName;
var sInputDescription;
var sComboFlowType;
var sInputGasSupplier;
var aInputGasCodeTokens;
var sCountry;
var sProjectID;
var sFrequencyGas;
var sFrequencyPower;
var sComboGasRefCondition;
var sInputPowerSupplier;
var aInputPowerCodeTokens;
var bStreamGasData;
var bStreamPowerData;
var sDataDestination;
var sOldDataDestination = "";
var iCompressed;
var iEnabled;
var oResourceBundle;
var bShowCommentDialog = true;
var sYesLabel;
var sNoLabel;
var sGasOperatorCode;
var sPowerOperatorCode;
var sGTag;
var sPTag;
var sPlantId;
var _aInitialGasRows;
var _aInitialPowerRows;

/*****Below Variables are for Restore functionality******/
var oCurrentControl;
var sCurrentColumnName;
var iCurrentControlCount;
var arrCurrentItems;
var sCurrentLabel;
/******************************************************/
sap.ui.define([
    "../controller/BaseController",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/MessageToast",
    'sap/ui/model/Filter',
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
], function (BaseController, Dialog, Button, Text, MessageToast, Filter, FilterOperator, MessageBox) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.ExternalInformation", {
        onInit: function () {
            this._bPageLoaded = false;
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            sYesLabel = oResourceBundle.getText("commonYes").toUpperCase();
            sNoLabel = oResourceBundle.getText("commonNo").toUpperCase();

            oExternalInformationController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            this.fnLoadDataSource();
            
            this.fnLoadDataDestination();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ExternalInformation").attachPatternMatched(this._onObjectMatched, this);
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
             var oVisibilityObject = {
                "GasSwitchVisible": false,
                "GasParamsVisible": false,
                "PowerSwitchVisible": false,
                "PowerParamsVisible": false,
                "EditMode": false,
                "QualisteoProjects": false
            }
            
            this.oFieldsVisibilityModel = new sap.ui.model.json.JSONModel(oVisibilityObject);
            this.getView().setModel(this.oFieldsVisibilityModel, "FieldsVisibility");

            this.oEnergyDataModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.oEnergyDataModel, "EnergyDataModel");
      
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
                this.getView().byId("page-external-information").setVisible(true);
                
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        oModelDataSource: new sap.ui.model.json.JSONModel(),
        oModelEngieParameters : new sap.ui.model.json.JSONModel(),
        oModelEngieFrequencies : new sap.ui.model.json.JSONModel(),
        oModelEngieUnits:  new sap.ui.model.json.JSONModel(),
        oModelEngieCountries:  new sap.ui.model.json.JSONModel(),
        
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleExternalFlowInfo"));
            sMode = oEvent.getParameter("arguments").MODE;
            var sNewExternalFlowLabel = oResourceBundle.getText("flowInfoNewExternal");
            this.fnShowHideTitles(false);
            if (sMode == "U") {
                this.oFieldsVisibilityModel.setProperty("/EditMode", true);

                sOldDataDestination = oEvent.getParameter("arguments").ID_DATA_DESTINATION;
                sFlowID = oEvent.getParameter("arguments").ID_DATA_FLOW;
                var sSourceID = oEvent.getParameter("arguments").ID_SOURCE;
                var sPlant = oEvent.getParameter("arguments").PLANT;
                var sSourceName = oEvent.getParameter("arguments").SOURCE_NAME;
                var sFlowName = oEvent.getParameter("arguments").DS_NAME;
                var sFlowType = oEvent.getParameter("arguments").FLOW_TYPE;
                var sDescription = oEvent.getParameter("arguments").DS_DESCRIPTION;
                var bCurrentCompressed = oEvent.getParameter("arguments").FL_COMPRESSED == 1 ? true : false;
                var sDataDestination = oEvent.getParameter("arguments").ID_DATA_DESTINATION;
                var bCurrentEnabled = oEvent.getParameter("arguments").FL_ENABLED == 1 ? true : false;
                sGasOperatorCode = ((oEvent.getParameter("arguments").DS_GAS_OPERATOR_CODE == 'NA') || (oEvent.getParameter("arguments").DS_GAS_OPERATOR_CODE == undefined)) ? "" : decodeURIComponent(oEvent.getParameter("arguments").DS_GAS_OPERATOR_CODE);
                var sReferenceConditions = oEvent.getParameter("arguments").DS_REFERENCE_CONDITION == 'NA' ? "" : decodeURIComponent(oEvent.getParameter("arguments").DS_REFERENCE_CONDITION);
                sPowerOperatorCode = ((oEvent.getParameter("arguments").DS_POWER_OPERATOR_CODE == 'NA') || (oEvent.getParameter("arguments").DS_POWER_OPERATOR_CODE == undefined)) ? "" : decodeURIComponent(oEvent.getParameter("arguments").DS_POWER_OPERATOR_CODE);
         //       var sCountry = oEvent.getParameter("arguments").DS_COUNTRY == 'NA' ? "" : decodeURIComponent(oEvent.getParameter("arguments").DS_COUNTRY);
                var sProjectID = oEvent.getParameter("arguments").ID_QUALISTEO_PROJECT == 'NA' ? "" : decodeURIComponent(oEvent.getParameter("arguments").ID_QUALISTEO_PROJECT);
       //         var sFrequencyGas = ((oEvent.getParameter("arguments").DS_FREQUENCY_GAS == 'NA') || (oEvent.getParameter("arguments").DS_FREQUENCY_GAS == 'NA' == undefined)) ? "" : decodeURIComponent(oEvent.getParameter("arguments").DS_FREQUENCY_GAS);
       //         var sFrequencyPower = ((oEvent.getParameter("arguments").DS_FREQUENCY_POWER == 'NA') || (oEvent.getParameter("arguments").DS_FREQUENCY_POWER == 'NA' == undefined)) ? "" : decodeURIComponent(oEvent.getParameter("arguments").DS_FREQUENCY_POWER);

                if (bRequireChangeComment) {
                    this.oModelChangeMessages.getData().Row = [
                        { columnName: "DS_NAME", name: oResourceBundle.getText("flowInfoName"), old: sFlowName, new: null, message: "" },
                        { columnName: "DS_DESCRIPTION", name: oResourceBundle.getText("flowDesc"), old: sDescription, new: null, message: "" },
                        { columnName: "ID_DATA_DESTINATION", name: oResourceBundle.getText("dataDestination"), old: sDataDestination, new: null, message: "" },
                        { columnName: "FL_COMPRESSED", name: oResourceBundle.getText("flowCompressed"), old: (bCurrentCompressed ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "FL_ENABLED", name: oResourceBundle.getText("flowEnabled"), old: (bCurrentEnabled ? sYesLabel : sNoLabel), new: null, message: "" },
                        { columnName: "ID_FLOW_TYPE", name: oResourceBundle.getText("externalFlowType"), old: sFlowType, new: null, message: "" },
                        { columnName: "DS_GAS_OPERATOR_CODE", name: oResourceBundle.getText("externalFlowGasSupplierName"), old: sGasOperatorCode, new: null, message: "" },
                        { columnName: "DS_REFERENCE_CONDITION", name: oResourceBundle.getText("externalFlowRefCond"), old: sReferenceConditions, new: null, message: "" },
                        { columnName: "DS_POWER_OPERATOR_CODE", name: oResourceBundle.getText("externalFlowPowerSupplierName"), old: sPowerOperatorCode, new: null, message: "" },
               //         { columnName: "DS_COUNTRY", name: oResourceBundle.getText("externalFlowCountry"), old: sCountry, new: null, message: "" },
                        { columnName: "ID_QUALISTEO_PROJECT", name: oResourceBundle.getText("externalFlowProjectName"), old: sProjectID, new: null, message: "" }
             //           { columnName: "DS_FREQUENCY_GAS", name: oResourceBundle.getText("externalFlowGasFrequency"), old: sFrequencyGas, new: null, message: "" },
           //             { columnName: "DS_FREQUENCY_POWER", name: oResourceBundle.getText("externalFlowPowerFrequency"), old: sFrequencyPower, new: null, message: "" }
                    ];
                }
                this.fnLoadEngieLists(sSourceID);
                this.getView().byId("input-flow-id").setEnabled(false);
                this.getView().byId("combobox-data-source").setEnabled(false);
                this.getView().byId("button-delete").setVisible(true);
                this.getView().byId("input-flow-id").setValue(sFlowID);
                this.getView().byId("header-plant-name").setText(sPlant);
                this.getView().byId("header-data-source").setText(sSourceName);
                this.getView().byId("object-header-external-info").setTitle(sFlowName);
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
                this.getView().byId("combobox-flow-type").setSelectedKey(sFlowType);
            //    this.getView().byId("combobox-Country").setSelectedKey(sCountry);
                this.getView().byId("combobox-ProjectId").setSelectedKey(sProjectID);
                /////
               this.getView().byId("input-gas-operator-code").setValue(sGasOperatorCode);
                this.getView().byId("combobox-refCondition").setSelectedKey(sReferenceConditions);
                this.getView().byId("input-pwr-operator-code").setValue(sPowerOperatorCode);
        //        this.getView().byId("combobox-gasFrequency").setSelectedKey(sFrequencyGas);
            //    this.getView().byId("combobox-PowerFequency").setSelectedKey(sFrequencyPower);
                this.getView().byId("input-pwr-code").removeAllTokens();
                this.getView().byId("input-gas-code").removeAllTokens();
                /////

                //load energy meters for engie data flows                       
                if (sFlowType && sFlowType === "ENERGY") {
                    oExternalInformationController.fnLoadEnergyMeters(sFlowID, sGasOperatorCode, sPowerOperatorCode);
                }

                //Check Data Destination Enablement
                var iIsDestinationEnabled = oEvent.getParameter("arguments").DESTINATION_ENABLED == 1 ? true : false;
                if (!iIsDestinationEnabled) {
                    var sDestinationName = decodeURIComponent(oEvent.getParameter("arguments").DESTINATION_NAME);
                    this.getView().byId("combobox-datadestination").setValue(sDestinationName);
                    this.getView().byId("combobox-datadestination").setValueState("Warning");
                    this.getView().byId("combobox-datadestination").setValueStateText(oResourceBundle.getText("dataDestinationsDisabled"));
                    this.getView().byId("objectStatus-dd-disabled").setVisible(true);
                }

                // /********************Below are Restore Buttons********************/
                // this.getView().byId("button-restore-flow-name").setVisible(true);
                // this.getView().byId("button-restore-description").setVisible(true);
                // this.getView().byId("button-restore-datadestination").setVisible(true);
                // this.getView().byId("button-restore-compressed").setVisible(true);
                // this.getView().byId("button-restore-enabled").setVisible(true);
                // this.getView().byId("button-restore-flow-type").setVisible(true);
                // this.getView().byId("button-restore-Country").setVisible(true);
                /*****************************************************************/

                this.getView().byId("combobox-flow-type").fireChange();

            } else if (sMode == "I") {
                this.oFieldsVisibilityModel.setProperty("/EditMode", false);
                this.oFieldsVisibilityModel.setProperty("/GasSwitchVisible", false);
                this.oFieldsVisibilityModel.setProperty("/GasParamsVisible", false);
                this.oFieldsVisibilityModel.setProperty("/PowerSwitchVisible", false);
                this.oFieldsVisibilityModel.setProperty("/PowerParamsVisible", false);
                this.oFieldsVisibilityModel.setProperty("/QualisteoProjects", false);

                this.getView().byId("input-flow-id").setEnabled(false);
                this.getView().byId("combobox-data-source").setEnabled(true);
                this.getView().byId("button-delete").setVisible(false);
                this.getView().byId("header-plant-name").setText("");
                this.getView().byId("header-data-source").setText("");
                this.getView().byId("header-plant-name").setVisible(false);
                this.getView().byId("header-data-source").setVisible(false);
                this.getView().byId("input-flow-id").setValue("");
                this.getView().byId("object-header-external-info").setTitle(sNewExternalFlowLabel);
                this.getView().byId("combobox-data-source").setSelectedKey("");
                this.getView().byId("input-data-flow-name").setValue("");
                this.getView().byId("input-description").setValue("");
                this.getView().byId("combobox-datadestination").setSelectedKey("");
                this.getView().byId("switch-compressed").setState(false);
                this.getView().byId("switch-enabled").setState(false);
                this.getView().byId("objectStatus-dd-disabled").setVisible(false);
                this.getView().byId("combobox-datadestination").setValueState("None");
                //////
                this.getView().byId("combobox-flow-type").setSelectedKey("");
                this.getView().byId("combobox-ProjectId").setSelectedKey("");

                this.getView().byId("input-gas-operator-code").setValue("");
              this.getView().byId("input-gas-code").removeAllTokens();
               this.getView().byId("combobox-refCondition").setSelectedKey("");
                this.getView().byId("input-pwr-operator-code").setValue("");
                this.getView().byId("input-pwr-code").removeAllTokens();
                this.getView().byId("table-gas-tags").removeAllItems();
                this.getView().byId("table-power-tags").removeAllItems();
                //////

                /********************Below are Restore Buttons********************/
                // this.getView().byId("button-restore-flow-name").setVisible(false);
                // this.getView().byId("button-restore-description").setVisible(false);
                // this.getView().byId("button-restore-datadestination").setVisible(false);
                // this.getView().byId("button-restore-compressed").setVisible(false);
                // this.getView().byId("button-restore-enabled").setVisible(false);
                // this.getView().byId("button-restore-flow-type").setVisible(false);
                // this.getView().byId("button-restore-Country").setVisible(false);
                /*****************************************************************/

            }
            this._bPageLoaded = true;

        },
        fnShowHideTitles(bShow) {
            if (bShow) {
                this.byId("ext-gas-section").setText(oResourceBundle.getText("externalFlowGasInfo"));
                this.byId("ext-gas-section").setIcon("sap-icon://mileage");
                this.byId("ext-power-section").setText(oResourceBundle.getText("externalFlowPowerInformation"));
                this.byId("ext-power-section").setIcon("sap-icon://lightbulb");
            } else {
                this.byId("ext-gas-section").setText("");
                this.byId("ext-gas-section").setIcon("");
                this.byId("ext-power-section").setText("");
                this.byId("ext-power-section").setIcon("");
            }

        },
fnLoadEngieLists: function (sSourceId) {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/GetEngieParametersXacuteQuery&Content-Type=text/json",
                 data: {
                    "Param.1": sSourceId,
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                            oResourceBundle.getText("dataSourcesLoadDataSources"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        var sValueF = data.Row[0].Frequencies;
                        var sValueU = data.Row[0].Units;
                        var sValueC = data.Row[0].Countries;
                         sGTag = data.Row[0].Gas;
                         sPTag = data.Row[0].Power;
                         sPlantId = data.Row[0].PlantID;
                        var aDataF = sValueF.split(",").map(function (sItem) {
    return { value: sItem.trim() };
});
var aDataU = sValueU.split(",").map(function (sItem) {
    return { value: sItem.trim() };
});
var aDataC = sValueC.split(",").map(function (sItem) {
    return { value: sItem.trim() };
});

                       oExternalInformationController.oModelEngieFrequencies.setData({
    items: aDataF
});
      oExternalInformationController.oModelEngieUnits.setData({
    items: aDataU
});
      oExternalInformationController.oModelEngieCountries.setData({
    items: aDataC
});
                        oExternalInformationController.oModelEngieFrequencies.refresh();
                        that.getView().setModel(
    oExternalInformationController.oModelEngieUnits,
    "Units"
);
oExternalInformationController.oModelEngieFrequencies.refresh();
                        that.getView().setModel(
    oExternalInformationController.oModelEngieCountries,
    "Countries"
);
oExternalInformationController.oModelEngieFrequencies.refresh();
                        that.getView().setModel(
    oExternalInformationController.oModelEngieFrequencies,
    "freq"
);
                    }
                }
            });
        },
        fnLoadDataSource: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": "%",
                    "Param.6": 1,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                            oResourceBundle.getText("dataSourcesLoadDataSources"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oExternalInformationController.oModelDataSource.setData(data);
                        oExternalInformationController.oModelDataSource.refresh();
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
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
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
        handleTokenRemoved: function (sTokenText, sId) {
    
   
    if(sId == 'input-gas-code')
        { var oTable = this.byId("table-gas-tags");
        var oModel = oTable.getModel("GasMeters");
    }
    else {var oTable = this.byId("table-power-tags");
        var oModel = oTable.getModel("PowerMeters");

    }

    if (!oModel) {
        return;
    }

    var aRows = oModel.getProperty("/Row") || [];

    // Filter out the row with matching DS_CODE
    aRows = aRows.filter(function (oRow) {
        return oRow.DS_CODE !== sTokenText;
    });

    // Update model
    oModel.setProperty("/Row", aRows);
    oModel.refresh(true);
},
        _onTokenChange: function (oEvent) {
            var sTokenDeleted = oEvent.mParameters.type;
         
             if(sTokenDeleted == 'removed'){
                  var oControl = oEvent.getSource();          // MultiInput
                    var oView = this.getView();

                var sLocalId = oView.getLocalId(oControl.getId())
                 var sTokenRemoved = oEvent.mParameters.token.mProperties.text;
     
        this.handleTokenRemoved(sTokenRemoved, sLocalId);
             }
   
},

_onTokenUpdate: function(oEvent) {
   
},
        fnLoadEnergyMeters: function (sFlowID, sGasOperatorCode, sPowerOperatorCode) {
            var that = this;
            var oModelGasMeters = new sap.ui.model.json.JSONModel();
            var oModelPowerMeters = new sap.ui.model.json.JSONModel();

            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ExternalFlowMetersSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sFlowID,
                    "Param.2": sGasOperatorCode,
                    "Param.3": sPowerOperatorCode
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                            oResourceBundle.getText("externalFlowLoadMeters"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        // ************** Gas Data **************/
                        var oGasData = result.Rowsets.Rowset[0];
                        oModelGasMeters.setData(oGasData);
                        oModelGasMeters.refresh(true);
                         that._aInitialGasRows = JSON.parse(
                    JSON.stringify(oGasData.Row || [])
                );
                        that.byId("table-gas-tags").setModel(oModelGasMeters, "GasMeters");
                        that.fnBindTagsTable(that.byId("table-gas-tags"), "GasMeters>/Row","GasMeters");
                        that.fnBindMeteringPoints(that.byId("input-gas-code"), oGasData, oResourceBundle.getText("externalFlowGasMeteringPoint"));
                        // ************** Power Data **************/
                        var oPowerData = result.Rowsets.Rowset[1];
                        oModelPowerMeters.setData(oPowerData);
                        oModelPowerMeters.refresh(true);
                        that._aInitialPowerRows = JSON.parse(
                    JSON.stringify(oPowerData.Row || [])
                );
                        that.byId("table-power-tags").setModel(oModelPowerMeters, "PowerMeters");
                        that.fnBindTagsTable(that.byId("table-power-tags"), "PowerMeters>/Row", "PowerMeters");
                        that.fnBindMeteringPoints(that.byId("input-pwr-code"), oPowerData, oResourceBundle.getText("externalFlowPowerMeteringPoint"));
                        // Fields visibility //
                        that.fnEngieParamsVisibility(true);
                    }
                }
            });
        },
        fnBindMeteringPoints: function (oControl, oData, sText) {
            for (var i in oData.Row) {
              this.fnAddNewToken(oControl, oData.Row[i].DS_CODE);
                if (bRequireChangeComment && bShowCommentDialog) {
                    var sColumnName = oData.Row[i].DS_OPERATOR_CODE + "." + oData.Row[i].DS_CODE;
                    var sTag = oData.Row[i].DS_TAG;
                    this.oModelChangeMessages.getData().Row.push(
                        { columnName: sTag, name: sText + "-Tag", old: oData.Row[i].DS_CODE, new: null, message: "" }
                    )
                    this.oModelChangeMessages.getData().Row.push(
                        { columnName: sTag + "-Country", name: sTag + "-Country", old: oData.Row[i].DS_COUNTRY, new: null, message: "" }
                    )
                    this.oModelChangeMessages.getData().Row.push(
                        { columnName: sTag + "-Frequency", name: sTag + "-Frequency", old: oData.Row[i].DS_FREQUENCY, new: null, message: "" }
                    )
                    this.oModelChangeMessages.getData().Row.push(
                        { columnName: sTag + "-Unit", name: sTag + "-Unit", old: oData.Row[i].DS_UNIT, new: null, message: "" }
                    )
                }
            }
        },
        fnBindTagsTable: function (oControl, sModel, sModelName) {
            var that = this;
    oControl.removeAllItems();
    oControl.bindItems(sModel, function (sId, oContext) {
        return new sap.m.ColumnListItem({
            cells: [
                new sap.m.Text({
                    text: oContext.getProperty("DS_CODE")
                }),

                new sap.m.Text({
                    text: oContext.getProperty("DS_TAG")
                }),

                // Frequency ComboBox
                new sap.m.ComboBox({
                    width: "100%",
                  selectedKey: oContext.getProperty("DS_FREQUENCY"),
                  valueState: "{"+sModelName+">DS_FREQUENCY_STATE}",
                   items: {
        path: "freq>/items",
        template: new sap.ui.core.Item({
            key: "{freq>value}",
            text: "{freq>value}"
        })
    },
                    change: function (oEvent) {
                        oContext.getModel().setProperty(
                            oContext.getPath() + "/DS_FREQUENCY",
                            oEvent.getSource().getSelectedKey()
                        );
                    }
                }),

                // Unit ComboBox
                new sap.m.ComboBox({
                    width: "100%",
                    selectedKey: oContext.getProperty("DS_UNIT"),
                    valueState: "{"+sModelName+">DS_UNIT_STATE}",
                    items: {
        path: "Units>/items",
        template: new sap.ui.core.Item({
            key: "{Units>value}",
            text: "{Units>value}"
        })
    },
                    change: function (oEvent) {
                        oContext.getModel().setProperty(
                            oContext.getPath() + "/DS_UNIT",
                            oEvent.getSource().getSelectedKey()
                        );
                    }
                }),
                new sap.m.ComboBox({
                    width: "100%",
                    selectedKey: oContext.getProperty("DS_COUNTRY"),
                    valueState: "{"+sModelName+">DS_COUNTRY_STATE}",
                    items: {
        path: "Countries>/items",
        template: new sap.ui.core.Item({
            key: "{Countries>value}",
            text: "{Countries>value}"
        })
    },
                    change: function (oEvent) {
                        oContext.getModel().setProperty(
                            oContext.getPath() + "/DS_COUNTRY",
                            oEvent.getSource().getSelectedKey()
                        );
                    }
                }),
             new sap.m.Button({
                    visible: "{FieldsVisibility>/EditMode}",
                    icon: "sap-icon://past",
                    type: "Transparent",
                    tooltip: "{i18n>commonRestore}",
                    press: function (oEvent) {
                        that.fnOpenRestorePopupTable(oEvent);
                    }.bind(this)
                })   

            ]
        });
    });
},
        onChangeFlowType: function (oEvent) {
            var sSelectedKey = oEvent.getSource().getSelectedKey();
            if (sSelectedKey == "ENERGY") {
                this.fnEngieParamsVisibility(true);
            } else {
                this.fnEngieParamsVisibility(false);
            }
            if (sSelectedKey == "QUALISTEO") {
                this.oFieldsVisibilityModel.setProperty("/QualisteoProjects", true);
                this.fnLoadProjectList()
            } else {
                this.oFieldsVisibilityModel.setProperty("/QualisteoProjects", false)
            }
        },

        fnEngieParamsVisibility: function (bVisible) {
            if (bVisible === true) {
                //an energy data flow => configure params visibility accordengly 
                if (sMode == "U") {
                 var sGasCd = this.getView().byId("input-gas-code").getTokens().length > 0 ? true : false;
                 var sGasRefCd = this.getView().byId("combobox-refCondition").getSelectedKey();
                    var sPowerCd = this.getView().byId("input-pwr-code").getTokens().length > 0 ? true : false;
                    this.oFieldsVisibilityModel.setProperty("/GasSwitchVisible", true)
                this.oFieldsVisibilityModel.setProperty("/GasParamsVisible", sGasCd && sGasRefCd ? true : false)
                    this.oFieldsVisibilityModel.setProperty("/PowerSwitchVisible", true)
                    this.oFieldsVisibilityModel.setProperty("/PowerParamsVisible", sPowerCd ? true : false)
                    this.fnShowHideTitles(true);
                } else {
                 this.oFieldsVisibilityModel.setProperty("/GasSwitchVisible", bVisible)
                   this.oFieldsVisibilityModel.setProperty("/GasParamsVisible", !bVisible)
                    this.oFieldsVisibilityModel.setProperty("/PowerSwitchVisible", bVisible)
                    this.oFieldsVisibilityModel.setProperty("/PowerParamsVisible", !bVisible)
                    this.fnShowHideTitles(bVisible);
                }
            } else {
                //not an energy data flow => hide all params
             this.oFieldsVisibilityModel.setProperty("/GasSwitchVisible", bVisible)
           this.oFieldsVisibilityModel.setProperty("/GasParamsVisible", bVisible)
                this.oFieldsVisibilityModel.setProperty("/PowerSwitchVisible", bVisible)
                this.oFieldsVisibilityModel.setProperty("/PowerParamsVisible", bVisible)
                this.fnShowHideTitles(bVisible);
            }
        },

        onValueHelpRequested: function (oEvent) {
            var sControlId = oEvent.getParameter("id"),
                sDialogTitle,
                sCurrentValue,
                sFilterKey,
                sFilterValue,
                bMultiSelect;
            if (sControlId.includes("input-gas-operator-code")) {
                sDialogTitle = oResourceBundle.getText("externalFlowGasSupplierName");
                sCurrentValue = this.byId("input-gas-operator-code").getValue();
                sFilterKey = "commodity";
                sFilterValue = "gas";
                bMultiSelect = false;
            }
            if (sControlId.includes("input-gas-code")) {
                sDialogTitle = oResourceBundle.getText("externalFlowGasMeteringPoint");
                sCurrentValue = this.byId("input-gas-code").getTokens();
                sFilterKey = "grid_operator_code";
                sFilterValue = this.byId("input-gas-operator-code").getValue();
                bMultiSelect = true;
            }
            if (sControlId.includes("input-pwr-operator-code")) {
                sDialogTitle = oResourceBundle.getText("externalFlowPowerSupplierName");
                sCurrentValue = this.byId("input-pwr-operator-code").getValue();
                sFilterKey = "commodity";
                sFilterValue = "power";
                bMultiSelect = false;
            }
            if (sControlId.includes("input-pwr-code")) {
                sDialogTitle = oResourceBundle.getText("externalFlowPowerMeteringPoint");
                sCurrentValue = this.byId("input-pwr-code").getTokens();
                sFilterKey = "grid_operator_code";
                sFilterValue = this.byId("input-pwr-operator-code").getValue();
                bMultiSelect = true;
            }
            this.fnOpenValueHelp(sDialogTitle, sCurrentValue, sFilterKey, sFilterValue, bMultiSelect);
        },

        fnOpenValueHelp: function (sDialogTitle, sCurrentValue, sFilterKey, sFilterValue, bMultiSelect) {
            var oEnergyModel = this.getView().getModel("EnergyDataModel");
            var oView = this.getView();
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.EnergyDataPoints", this);
                oView.addDependent(this._oValueHelpDialog);
                this._oValueHelpDialog.setModel(oEnergyModel, "EnergyDataModel");

            }
            this._oValueHelpDialog.setMultiSelect(bMultiSelect);

            sap.ui.getCore().byId("energySelectFragment").setTitle(sDialogTitle);
            if (jQuery.isEmptyObject(oEnergyModel.getData())) {
                this.loadEnergyPoints(sCurrentValue, sFilterKey, sFilterValue);
                this.fnBindSelectDialog(sFilterKey);
            } else {
                this._configValueHelpDialog(sFilterKey, sCurrentValue);
                this.fnBindSelectDialog(sFilterKey);
                //filter dialog binding
                var aFilter = this.fnFilterResult(sFilterKey, sFilterValue);
                this._oValueHelpDialog.getBinding("items").filter(aFilter);
                this._oValueHelpDialog.getBinding("items").refresh(true);

            }

            this._oValueHelpDialog.open();
        },
        loadEnergyPoints: function (sCurrentValue, sFilterKey, sFilterValue) {
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.setBusy(true);
            }
            var oEnergyModel = this.getView().getModel("EnergyDataModel");
            oEnergyModel.setData([]);

            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/EnergyNetworkPointsXacuteQuery&Content-Type=text/json",
                success: function (result) {
                    if (that._oValueHelpDialog) {
                        that._oValueHelpDialog.setBusy(false);
                    }
                    if (result.Rowsets.Rowset) {
                        try {
                            var aData = result.Rowsets.Rowset[0].Row[0].NetworkPoints;
                            var aJSONData = JSON.parse(aData);
                            var aCleanedData = that.fnSortDuplicatedSuppliers(aJSONData);
                            oEnergyModel.setData(aCleanedData);
                            oEnergyModel.refresh(true);
                            //filter dialog binding
                            var aFilter = that.fnFilterResult(sFilterKey, sFilterValue);
                            that._oValueHelpDialog.getBinding("items").filter(aFilter);
                            that._oValueHelpDialog.getBinding("items").refresh(true);
                        } catch {
                            oEnergyModel.setData([]);
                            oEnergyModel.refresh(true);
                            MessageToast.show(oResourceBundle.getText("externalFlowErrorRetreivingData"));
                        }
                    } else {
                        var errorMsg = "";
                        if (result.Rowsets.FatalError) {
                            errorMsg = result.Rowsets.FatalError;
                        } else if (result.Rowsets.Messages && result.Rowsets.Messages[0] && result.Rowsets.Messages[0].Message) {
                            errorMsg = result.Rowsets.Messages[0].Message;
                        }
                        oDialog.close();
                        MessageToast.show(errorMsg);
                    }
                    that._configValueHelpDialog(sFilterKey, sCurrentValue);
                }
            });
        },
        fnSortDuplicatedSuppliers: function (aJSONData) {
            var aEnergySuppliers = [];
            if (aJSONData.length > 0) {
                aJSONData.forEach(function (oEnergyPt) {
                    if (aEnergySuppliers.indexOf(oEnergyPt.grid_operator_code) > -1) {
                        oEnergyPt.duplicated = "1";
                    } else {
                        oEnergyPt.duplicated = "0";
                        aEnergySuppliers.push(oEnergyPt.grid_operator_code);
                    }
                });
            }
            return aJSONData;
        },
        _configValueHelpDialog: function (sFilterKey, sCurrentValue) {
            var oEnergyModel = this.getView().getModel("EnergyDataModel"),
                aEnergyData = oEnergyModel.getData();

            if (aEnergyData.length > 0) {
                if (sFilterKey === "commodity") {
                    aEnergyData.forEach(function (oEnergyPt) {
                        oEnergyPt.selected = (oEnergyPt.grid_operator_code === sCurrentValue);
                    });
                } else {
                    if (Array.isArray(sCurrentValue)) {
                        var aSelectedValues = sCurrentValue.map(elt => elt.getText());
                        aEnergyData.forEach(function (oEnergyPt) {
                            if (aSelectedValues.indexOf(oEnergyPt.code) > -1) oEnergyPt.selected = true;
                            else oEnergyPt.selected = false;
                        });
                    } else {
                        aEnergyData.forEach(function (oEnergyPt) {
                            oEnergyPt.selected = (oEnergyPt.code === sCurrentValue);
                        });
                    }

                }
                oEnergyModel.setData(aEnergyData);
            }
        },
        fnBindSelectDialog: function (sFilterKey) {
            var oSelectDialog = sap.ui.getCore().byId("energySelectFragment");
            oSelectDialog.bindAggregation("items", {
                path: 'EnergyDataModel>/',
                sorter: {
                    path: sFilterKey,
                    descending: false
                },
                factory: function (sId, oContext) {
                    if (sFilterKey === "commodity") {
                        //supplier doesn't exist on the list
                        return new sap.m.StandardListItem({
                            selected: oContext.getProperty("selected"),
                            title: oContext.getProperty("grid_operator_code"),
                            description: oContext.getProperty("commodity"),
                            visible: true,
                            iconInset: false,
                            type: "Active",
                        });
                    } else {
                        return new sap.m.StandardListItem({
                            selected: oContext.getProperty("selected"),
                            title: oContext.getProperty("code"),
                            description: oContext.getProperty("grid_operator_code"),
                            iconInset: false,
                            type: "Active",
                        });
                    }
                }
            });
        },

        fnFilterResult: function (sFilterKey, sFilterValue) {
            switch (sFilterKey) {
                case ("commodity"):
                    if (sFilterValue == "gas") {
                        return new Filter({
                            filters: [
                                new Filter("commodity", FilterOperator.Contains, "gas"),
                                new Filter("duplicated", FilterOperator.EQ, "0")
                            ],
                            and: true
                        });
                    } else if (sFilterValue == "power") {
                        return new Filter({
                            filters: [
                                new Filter("commodity", FilterOperator.Contains, "power"),
                                new Filter("duplicated", FilterOperator.EQ, "0")
                            ],
                            and: true
                        });
                    }
                case ("grid_operator_code"):
                    return new Filter("grid_operator_code", FilterOperator.Contains, sFilterValue);
            }
        },
        handleSearch: function (oEvent) {
            var sDialogTitle = oEvent.getSource().getTitle();
            var sValue = oEvent.getParameter("value");
            var oFilter;
            switch (sDialogTitle) {
                case oResourceBundle.getText("externalFlowGasSupplierName"):
                    oFilter = new Filter({
                        filters: [
                            new Filter("commodity", FilterOperator.Contains, "gas"),
                            new Filter("grid_operator_code", FilterOperator.Contains, sValue),
                            new Filter("duplicated", FilterOperator.EQ, "0")
                        ],
                        and: true
                    });
                    break;
                case oResourceBundle.getText("externalFlowGasMeteringPoint"):
                    var sGasSupplier = this.byId("input-gas-operator-code").getValue();
                    oFilter = new Filter({
                        filters: [
                            new Filter("grid_operator_code", FilterOperator.EQ, sGasSupplier),
                            new Filter("code", FilterOperator.Contains, sValue)
                        ],
                        and: true
                    });
                    break;
                case oResourceBundle.getText("externalFlowPowerSupplierName"):
                    oFilter = new Filter({
                        filters: [
                            new Filter("commodity", FilterOperator.Contains, "power"),
                            new Filter("grid_operator_code", FilterOperator.Contains, sValue),
                            new Filter("duplicated", FilterOperator.EQ, "0")
                        ],
                        and: true
                    });
                    break;
                case oResourceBundle.getText("externalFlowPowerMeteringPoint"):
                    var sPowerSupplier = this.byId("input-pwr-operator-code").getValue();
                    oFilter = new Filter({
                        filters: [
                            new Filter("grid_operator_code", FilterOperator.EQ, sPowerSupplier),
                            new Filter("code", FilterOperator.Contains, sValue)
                        ],
                        and: true
                    });
                    break;
            }

            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },
   createTagGenerator: function (aExistingRows, sTagPattern) {
    var rLastToken = /^(.+?)(\d+)\./;
    var iCurrent = 0;

    aExistingRows.forEach(function (oRow) {
        var m = oRow.DS_TAG && oRow.DS_TAG.match(rLastToken);
        if (m) {
            iCurrent = Math.max(iCurrent, Number(m[2]));
        }
    });

    return function () {
        iCurrent++;
        return sTagPattern.replace(rLastToken, function (_, prefix, number) {
            return prefix + String(iCurrent).padStart(number.length, "0") + ".";
        });
    };
},

      handleTableBindClose: function (aSelectedItems, sId) {
    var that = this;
    var sNewTag;
   
    

    // Get existing rows (if any)
   
        

         if(sId == "input-gas-code"){
        var sModelname = "GasMeters"
        var oTable = that.byId("table-gas-tags");
              var oExistingModel = oTable.getModel(sModelname);
    var aExistingRows = oExistingModel ? oExistingModel.getProperty("/Row") || []
        : [];
        if (aExistingRows == [])
        {sNewTag = sPlantId +sGTag}   
             else{
        sNewTag = that.createTagGenerator(aExistingRows ,sPlantId + sGTag);}
        
    }else {
       var sModelname = "PowerMeters" 
        var oTable = that.byId("table-power-tags");
              var oExistingModel = oTable.getModel(sModelname);
    var aExistingRows = oExistingModel ? oExistingModel.getProperty("/Row") || []
        : [];
              if (aExistingRows == [])
        {sNewTag = sPlantId +sPTag}   
             else{
        sNewTag = that.createTagGenerator(aExistingRows ,sPlantId + sPTag);}
      
    }

    // Build lookup by DS_CODE
    var mExistingByCode = {};
    aExistingRows.forEach(function (oRow) {
        mExistingByCode[oRow.DS_CODE] = oRow;
    });

  // Start with existing rows (preserve order)
var aRows = aExistingRows.slice(); // clone

// Append only NEW selections at the end
aSelectedItems.forEach(function (oItem) {

    var sCode = oItem.getTitle(); // DS_CODE

    // skip if already exists → keep order untouched
    if (mExistingByCode[sCode]) {
        return;
    }

    aRows.push({
        DS_CODE: sCode,
        DS_TAG: sNewTag(),
        DS_FREQUENCY: "",
        DS_UNIT: "",
        DS_COUNTRY: "",
        FREQUENCY_State: "None",
        UNIT_State: "None",
        Country_State: "None"
    });

});


    // Set model
    var oModelGasMeters = new sap.ui.model.json.JSONModel({
        Row: aRows
    });

 oTable.setModel(oModelGasMeters, sModelname);

that.fnBindTagsTable(oTable, sModelname + ">/Row", sModelname);
},

        handleValueHelpClose: function (oEvent) {
            if (oEvent.sId == "confirm") {
                oEvent.getSource().getBinding("items").filter([]);
                var sDialogTitle = oEvent.getSource().getTitle();

                if (sDialogTitle == oResourceBundle.getText("externalFlowGasSupplierName") || sDialogTitle == oResourceBundle.getText("externalFlowPowerSupplierName")) {
                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    var oInput, sInputOriginalValue;
                    // Gas or Power Supplier => Simple Input Field
                    if (sDialogTitle == oResourceBundle.getText("externalFlowGasSupplierName")) oInput = this.byId("input-gas-operator-code");
                    else oInput = this.byId("input-pwr-operator-code");
                    // Store the input original value
                    sInputOriginalValue = oInput.getValue();
                    // Check selected item
                    if (oSelectedItem) {
                      if (oSelectedItem.getTitle() !== sInputOriginalValue) {

    if (sDialogTitle === oResourceBundle.getText("externalFlowGasSupplierName")) {

        // clear tokens
        this.byId("input-gas-code").removeAllTokens();

        // clear table
     var oGasTable = this.byId("table-gas-tags");
var oGasModel = oGasTable.getModel("GasMeters");

if (!oGasModel) {
    oGasModel = new sap.ui.model.json.JSONModel();
    oGasTable.setModel(oGasModel, "GasMeters");
}

oGasModel.setData({
    Row: []
});

    } else if (sDialogTitle === oResourceBundle.getText("externalFlowPowerSupplierName")) {

        // clear tokens
        this.byId("input-pwr-code").removeAllTokens();

        // clear table
        var oPowerTable = this.byId("table-power-tags");
var oPowerModel = oPowerTable.getModel("PowerMeters");

if (!oPowerModel) {
    oPowerModel = new sap.ui.model.json.JSONModel();
    oPowerTable.setModel(oPowerModel, "PowerMeters");
}

oPowerModel.setData({
    Row: []
});
    }
}

                        oInput.setValue(oSelectedItem.getTitle());
                    } else {
                        oInput.setValue(sInputOriginalValue);
                    }
                } else {
                    var aSelectedItems = oEvent.getParameter("selectedItems");
                    var oMultiInput, aInputOriginalValues, that = this;
                    // Gas or Power Metering Point => Multi Input Field
                    if (sDialogTitle == oResourceBundle.getText("externalFlowGasMeteringPoint")) oMultiInput = this.byId("input-gas-code");
                    else oMultiInput = this.byId("input-pwr-code");
                    // Store the multi input original tokens
                    aInputOriginalValues = oMultiInput.getTokens();
                    var iIndex;
                    for (var i in aSelectedItems) {
                        iIndex = aInputOriginalValues.findIndex(oElt => { return oElt.getText() == aSelectedItems[i].getTitle() });
                        if (iIndex == -1) {
                            that.fnAddNewToken(oMultiInput, aSelectedItems[i].getTitle());
                            
                        } else {
                            aInputOriginalValues.splice(iIndex, 1);
                        }
                        
                    }
                    for (var j in aInputOriginalValues) {
                        that.fnRemoveToken(oMultiInput, aInputOriginalValues[j]);
                    }
                    var sGlobalId = oMultiInput.getId();                
                    var sLocalId  = this.getView().getLocalId(sGlobalId);
                    this.handleTableBindClose(aSelectedItems, sLocalId);
                }
            }
        },
        fnAddNewToken: function (oControl, sTokenValue) {
            var oToken = new sap.m.Token({
                key: sTokenValue,
                text: sTokenValue
            });
            oControl.addToken(oToken);
        },
        fnRemoveToken: function (oControl, oToken) {
            oControl.removeToken(oToken);
        },

        fnValidateInputs: function () {
            var that = this;
            var bValidInputs = true;
            var bValidGasInputs = true;
            var bValidPowerInputs = true;
            sInputFlowId = this.getView().byId("input-flow-id").getValue();
            sComboDataSource = this.getView().byId("combobox-data-source").getSelectedKey();
            sInputDataFlowName = this.getView().byId("input-data-flow-name").getValue();
            sInputDescription = this.getView().byId("input-description").getValue();
            sDataDestination = this.getView().byId("combobox-datadestination").getSelectedKey();
            iCompressed = this.getView().byId("switch-compressed").getState() ? 1 : 0;
            iEnabled = this.getView().byId("switch-enabled").getState() ? 1 : 0;
            sComboFlowType = this.getView().byId("combobox-flow-type").getSelectedKey();
            bStreamGasData = this.getView().byId("switch-stream-gas").getState();
            bStreamPowerData = this.getView().byId("switch-stream-power").getState();
            sInputGasSupplier = this.getView().byId("input-gas-operator-code").getValue();
            aInputGasCodeTokens = this.getView().byId("input-gas-code").getTokens();
            sComboGasRefCondition = this.getView().byId("combobox-refCondition").getSelectedKey() !== "" ? this.getView().byId("combobox-refCondition").getSelectedKey() : (bStreamGasData ? "FR_METERING" : "");
            sInputPowerSupplier = this.getView().byId("input-pwr-operator-code").getValue();
            aInputPowerCodeTokens = this.getView().byId("input-pwr-code").getTokens();        
            sProjectID = this.getView().byId("combobox-ProjectId").getSelectedKey();
            var oTableGas = this.byId("table-gas-tags");
var oModelGas = oTableGas.getModel("GasMeters");
var aRowsGas = oModelGas ? oModelGas.getProperty("/Row") : [];
var oTablePower = this.byId("table-power-tags");
var oModelPower = oTablePower.getModel("PowerMeters");
var aRowsPower = oModelPower ? oModelPower.getProperty("/Row") : [];
  
           

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
            if (sComboFlowType !== "") { //external flow type is defined
                if (sComboFlowType === "ENERGY") {//external flow type is ENERGY
                    if (sCountry == "") {
                        this.getView().byId("combobox-Country").setValueState("Error");
                        bValidInputs = false;
                    } else {

                        if (bStreamGasData) {
                            //stream gas data is set to true
                            if (aInputGasCodeTokens.length > 0 && sInputGasSupplier != "") {//both gas params are filled
                                bValidGasInputs = true;
                                this.getView().byId("input-gas-operator-code").setValueState("None");
                                this.getView().byId("input-gas-code").setValueState("None");
                                aRowsGas.forEach(function (oRow) {

    // Frequency
    if (!oRow.DS_FREQUENCY || oRow.DS_FREQUENCY === "NA") {
        oRow.DS_FREQUENCY_STATE = "Error";
        bValidGasInputs = false;
        bValidInputs = false;
    } else {
        oRow.DS_FREQUENCY_STATE = "None";
    }

    // Unit
    if (!oRow.DS_UNIT ||oRow.DS_UNIT === "NA" ) {
        oRow.DS_UNIT_STATE = "Error";
        bValidGasInputs = false;
        bValidInputs = false;
    } else {
        oRow.DS_UNIT_STATE = "None";
    }

    // Country
    if (!oRow.DS_COUNTRY || oRow.DS_COUNTRY ==="NA" ) {
        oRow.DS_COUNTRY_STATE = "Error";
        bValidGasInputs = false;
        bValidInputs = false;
    } else {
        oRow.DS_COUNTRY_STATE = "None";
    }
});

oModelGas.refresh(true);
   that.byId("table-gas-tags").setModel(oModelGas, "GasMeters");


                            } else {
                                bValidGasInputs = false; bValidInputs = false;
                                if (sInputGasSupplier === "") this.getView().byId("input-gas-operator-code").setValueState("Error");
                                if (aInputGasCodeTokens.length == 0) this.getView().byId("input-gas-code").setValueState("Error");

                            }
                            
                        }
                        if (bStreamPowerData) {//stream power data is set to true
                            if (aInputPowerCodeTokens.length > 0 & sInputPowerSupplier != "") {//both power params are filled
                                bValidPowerInputs = true;
                                this.getView().byId("input-pwr-code").setValueState("None");
                                this.getView().byId("input-pwr-operator-code").setValueState("None");
                                aRowsPower.forEach(function (oRow) {

    // Frequency
    if (!oRow.DS_FREQUENCY || oRow.DS_FREQUENCY === "NA") {
        oRow.DS_FREQUENCY_STATE = "Error";
        bValidGasInputs = false;
        bValidInputs = false;
    } else {
        oRow.DS_FREQUENCY_STATE = "None";
    }

    // Unit
    if (!oRow.DS_UNIT ||oRow.DS_UNIT === "NA" ) {
        oRow.DS_UNIT_STATE = "Error";
        bValidGasInputs = false;
        bValidInputs = false;
    } else {
        oRow.DS_UNIT_STATE = "None";
    }

    // Country
    if (!oRow.DS_COUNTRY || oRow.DS_COUNTRY ==="NA" ) {
        oRow.DS_COUNTRY_STATE = "Error";
        bValidGasInputs = false;
        bValidInputs = false;
    } else {
        oRow.DS_COUNTRY_STATE = "None";
    }
});

oModelPower.refresh(true);
   that.byId("table-power-tags").setModel(oModelPower, "PowerMeters");
                            } else {
                                bValidPowerInputs = false; bValidInputs = false;
                                if (aInputPowerCodeTokens.length == 0) this.getView().byId("input-pwr-code").setValueState("Error");
                                if (sInputPowerSupplier === "") this.getView().byId("input-pwr-operator-code").setValueState("Error");
                            }
                           
                        }
                        if (bValidGasInputs || bValidPowerInputs) {
                            this.getView().byId("combobox-flow-type").setValueState("None");
                        } else {
                            this.getView().byId("combobox-flow-type").setValueState("Error");
                        }
                        
                    }
                } else if (sComboFlowType === "QUALISTEO") {
                    if (sProjectID == "") {
                        bValidInputs = false;
                        this.getView().byId("combobox-ProjectId").setValueState("Error");
                    } else {
                        this.getView().byId("combobox-ProjectId").setValueState("None");
                    }
                }
            } else {
                this.getView().byId("combobox-flow-type").setValueState("Error");
            }
            return bValidInputs;
        },
        fnSaveExternalFlow: function () {
            if (sMode == "I") {
                sAction = "INSERT";
            } else if (sMode == "U") {
                sAction = "UPDATE";
            }
            this.fnAddUpdateFlow();
        },
        fnDeleteExternalFlow: function () {
            var sConfirmTitle = oResourceBundle.getText("commonConfirm");
            var sConfirmYes = oResourceBundle.getText("commonYes");
            var sConfirmNo = oResourceBundle.getText("commonNo");
            var sConfirmMessage = oResourceBundle.getText("flowExternalInfoDeleteConfirmation");
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
                        oExternalInformationController.fnDeleteExternalInformation();
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

                var sMeteringPointsPower = this.getMeteringPoints(sInputPowerSupplier, this.byId("input-pwr-code"), this.byId("table-power-tags").getModel("PowerMeters"),this._aInitialPowerRows, oResourceBundle.getText("externalFlowPowerMeteringPoint"), sMode, bStreamPowerData);
                var sMeteringPointsGas = this.getMeteringPoints(sInputGasSupplier, this.byId("input-gas-code"), this.byId("table-gas-tags").getModel("GasMeters"),this._aInitialGasRows, oResourceBundle.getText("externalFlowGasMeteringPoint"), sMode, bStreamGasData);

                var aCommentColumnName = [];
                var aCommentMessage = [];
                var aMeterCommentColumnName = [];
                var aMeterCommentMessage = [];
                if (bRequireChangeComment && sMode === "U") {
                    if (!this.fnValidateChangeComments()) {
                        return;
                    }
                    bShowCommentDialog = true;
                    var oChangeTracker = this.oModelChangeMessages.getData();
                    for (var e of oChangeTracker.Row) {
                        if (e.new != null) {
                            var lastPart = e.columnName.split('.').pop();
                            var hasSuffix = lastPart.split('-').length > 4;
                            if ((e.columnName.includes(".")) && !hasSuffix ) {
                                aMeterCommentColumnName.push("ID_DATA_FLOW");
                                aMeterCommentMessage.push(e.message);
                                aMeterCommentColumnName.push("DS_OPERATOR_CODE");
                                aMeterCommentMessage.push(e.message);
                                aMeterCommentColumnName.push("DS_CODE");
                                aMeterCommentMessage.push(e.message);
                            } else {
                                 aMeterCommentColumnName.push(e.columnName);
                                aMeterCommentMessage.push(e.message);
                                aCommentColumnName.push(e.columnName);
                                aCommentMessage.push(e.message);
                            }

                        }
                    }
                }
                oDialog.open();
                var that = this;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ExternalFlowXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": sAction,
                        "Param.2": sInputFlowId,
                        "Param.3": sComboDataSource,
                        "Param.4": sComboFlowType,
                        "Param.5": sInputDataFlowName,
                        "Param.6": sInputDescription,
                        "Param.7": sDataDestination,
                        "Param.8": iCompressed,
                        "Param.9": iEnabled,
                        "Param.10": sComboFlowType == 'ENERGY' && bStreamPowerData === true ? sInputPowerSupplier : "NA",
                        "Param.11": sComboFlowType == 'ENERGY' && bStreamPowerData === true ? sMeteringPointsPower : "NA",
                        "Param.12": sComboFlowType == 'ENERGY' && bStreamGasData === true ? sInputGasSupplier : "NA",
                        "Param.13": sComboFlowType == 'ENERGY' && bStreamGasData === true ? sMeteringPointsGas : "NA",
                        "Param.14": sComboFlowType == 'ENERGY' && bStreamGasData === true ? sComboGasRefCondition : "NA",
                        "Param.15": sComboFlowType == 'ENERGY' ? sCountry : "",
                        "Param.16": sComboFlowType == 'ENERGY' && bStreamGasData === true ? sFrequencyGas : "NA",
                        "Param.17": sComboFlowType == 'ENERGY' && bStreamPowerData === true ? sFrequencyPower : "NA",
                        "Param.18": sComboFlowType == 'QUALISTEO' ? sProjectID : "",
                        "Param.28": aMeterCommentColumnName.join("\n"),
                        "Param.29": aMeterCommentMessage.join("\n"),
                        "Param.30": aCommentColumnName.join("\n"),
                        "Param.31": aCommentMessage.join("\n")
                    },
                    success: function (result) {
                        if (result.Rowsets.Rowset) {
                            var sMessage = result.Rowsets.Rowset[0].Row[0].Output;
                            oDialog.close();
                            if (sAction === "INSERT") {
                                that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                                    oResourceBundle.getText("externalFlowAdd"),
                                    sMessage,
                                    "Success");

                            } else {
                                that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                                    oResourceBundle.getText("externalFlowUpdate"),
                                    sMessage,
                                    "Success");
                            }
                            oExternalInformationController.fnNavigateBackAndReload();
                        } else if (result.Rowsets.FatalError) {
                            var errorMsg = result.Rowsets.FatalError;
                            oDialog.close();
                            //MessageToast.show(errorMsg);
                            if (sAction === "INSERT") {
                                that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                                    oResourceBundle.getText("externalFlowAdd"),
                                    errorMsg,
                                    "Error");
                            } else {
                                that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                                    oResourceBundle.getText("externalFlowUpdate"),
                                    errorMsg,
                                    "Error");
                            }
                        }
                    }
                });
            }
        },

        getMeteringPoints: function (sSupplier, oMultiInput, oModel, oInitial , sTrackerText, sMode, bFlagStream) {
            var oMeteringPointsXMLObject = '<?xml version="1.0" encoding="UTF-8"?><MeteringPoints>';
            var aUpdatedMeters = oMultiInput.getTokens();
            if(bFlagStream){
            var sTable = oModel?.getData()?.Row?.slice() || []; }
            else {
                var sTable = [];
            }
            var that = this;
    
           if (sAction === "INSERT" && aUpdatedMeters.length > 0) {
                for (var i = 0; i < aUpdatedMeters.length; i++) {
                    oMeteringPointsXMLObject += '<Meter><Action>I</Action><Supplier>' + sSupplier + '</Supplier><Value>' + sTable[i].DS_CODE + '</Value><Tag>' + sTable[i].DS_TAG + '</Tag><Country>' + sTable[i].DS_COUNTRY + '</Country><Frequency>' + sTable[i].DS_FREQUENCY +'</Frequency><Unit>'+ sTable[i].DS_UNIT +'</Unit></Meter>';
                }
            } else if (sAction === "UPDATE") {

    var aInitialRows = oInitial || []; 
                if(bFlagStream){
    var aCurrentRows = oModel.getData().Row || []; 
var aTokens = oMultiInput.getTokens();}
               else {var aCurrentRows = [];
                var aTokens = [];
               }
    

    var sTrackerKey;

    // build quick lookup sets
    var aTokenCodes = aTokens.map(t => t.getText());
    var aInitialCodes = aInitialRows.map(r => r.DS_CODE);
     // -------------------------
     // Update the tokens with parameter change
     // -------------------------
for (var k = 0; k < aCurrentRows.length; k++) {
    var bFlagUpdate=0;
    var currentRow = aCurrentRows[k];

    // Only process if code existed initially
    if (aInitialCodes.includes(currentRow.DS_CODE)) {

        var initialRow = aInitialRows.find(r => r.DS_CODE === currentRow.DS_CODE);

        if (!initialRow) continue;

        sTrackerKey = currentRow.DS_TAG;

        var oChangeTracker = this.oModelChangeMessages.getData();

        // -------- Country --------
        if (initialRow.DS_COUNTRY !== currentRow.DS_COUNTRY) {

        
        oChangeTracker.fnUpdateNewValue(sTrackerKey + "-Country", currentRow.DS_COUNTRY);
            bFlagUpdate=1;
        }

        // -------- Frequency --------
        if (initialRow.DS_FREQUENCY !== currentRow.DS_FREQUENCY) {
            bFlagUpdate=1;
          oChangeTracker.fnUpdateNewValue(sTrackerKey + "-Frequency", currentRow.DS_FREQUENCY);
        }

        // -------- Unit --------
        if (initialRow.DS_UNIT !== currentRow.DS_UNIT) {
bFlagUpdate=1;
            oChangeTracker.fnUpdateNewValue(sTrackerKey + "-Unit", currentRow.DS_UNIT);
        }
        if(bFlagUpdate == 1) {
            oMeteringPointsXMLObject +=
                    '<Meter><Action>U</Action>' +
                    '<Supplier>' + sSupplier + '</Supplier>' +
                    '<Value>' + currentRow.DS_CODE + '</Value>' +
                    '<Tag>' + currentRow.DS_TAG + '</Tag>' +
                    '<Country>' + currentRow.DS_COUNTRY + '</Country>' +
                    '<Frequency>' + currentRow.DS_FREQUENCY + '</Frequency>' +
                    '<Unit>' + currentRow.DS_UNIT + '</Unit>' +
                    '</Meter>';
        }
    }
}



    // -------------------------
    // DELETE = in initial but not in tokens
    // -------------------------
    for (var i = 0; i < aInitialRows.length; i++) {

        var initRow = aInitialRows[i];

        if (!aTokenCodes.includes(initRow.DS_CODE)) {

            sTrackerKey = initRow.DS_TAG;
            
var oChangeTracker = this.oModelChangeMessages.getData();
oChangeTracker.fnUpdateNewValue(sTrackerKey, "NA");
oChangeTracker.fnUpdateNewValue(sTrackerKey + "-Country", "NA");
oChangeTracker.fnUpdateNewValue(sTrackerKey + "-Frequency", "NA");
oChangeTracker.fnUpdateNewValue(sTrackerKey + "-Unit", "NA");

            oMeteringPointsXMLObject +=
                '<Meter><Action>D</Action>' +
                '<Supplier>' + sSupplier + '</Supplier>' +
                '<Value>' + initRow.DS_CODE + '</Value>' +
                '<Tag>' + sTrackerKey + '</Tag>' +
                '</Meter>';
        }
    }

    // -------------------------
    // INSERT = in tokens but not in initial
    // use CURRENT TABLE row for full info
    // -------------------------
    for (var u = 0; u < aTokens.length; u++) {

        var code = aTokens[u].getText();

        if (!aInitialCodes.includes(code)) {

            var row = aCurrentRows.find(r => r.DS_CODE === code);

            if (row) {

                sTrackerKey = row.DS_TAG;

                if (bRequireChangeComment && bShowCommentDialog) {
                    if (this.oModelChangeMessages.getData().Row
                        .findIndex(item => item.columnName === sTrackerKey) === -1) {

                        this.oModelChangeMessages.getData().Row.push({
                            columnName: sTrackerKey,
                            name: sTrackerKey,
                            old: "NA",
                            new: code,
                            message: ""
                        });
                        this.oModelChangeMessages.getData().Row.push({
                            columnName: sTrackerKey + "-Country",
                            name: sTrackerKey + "-Country",
                            old: "NA",
                            new: row.DS_COUNTRY,
                            message: ""
                        });
                        this.oModelChangeMessages.getData().Row.push({
                            columnName: sTrackerKey + "-Frequency",
                            name: sTrackerKey + "-Frequency",
                            old: "NA",
                            new: row.DS_FREQUENCY,
                            message: ""
                        });
                        this.oModelChangeMessages.getData().Row.push({
                            columnName: sTrackerKey + "-Unit",
                            name: sTrackerKey + "-Unit",
                            old: "NA",
                            new: row.DS_UNIT,
                            message: ""
                        });
                    }
                }

                oMeteringPointsXMLObject +=
                    '<Meter><Action>I</Action>' +
                    '<Supplier>' + sSupplier + '</Supplier>' +
                    '<Value>' + row.DS_CODE + '</Value>' +
                    '<Tag>' + row.DS_TAG + '</Tag>' +
                    '<Country>' + row.DS_COUNTRY + '</Country>' +
                    '<Frequency>' + row.DS_FREQUENCY + '</Frequency>' +
                    '<Unit>' + row.DS_UNIT + '</Unit>' +
                    '</Meter>';
            }
        }
    }
}


                

            return oMeteringPointsXMLObject += '</MeteringPoints>'
        },

        fnDeleteExternalInformation: function () {

            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ExternalFlowXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sAction,
                    "Param.2": sFlowID,
                    "Param.4": sComboFlowType
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
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                            oResourceBundle.getText("externalFlowDelete"),
                            successMsg,
                            "Success");
                        oExternalInformationController.fnNavigateBackAndReload();
                    } else if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        oDialog.close();
                        //MessageToast.show(errorMsg);
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                            oResourceBundle.getText("externalFlowDelete"),
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
        fnOpenRestorePopupTable: function (oEvent) {


    var oButton = oEvent.getSource();

    // Get stored row data
    var oRowData = oButton.data("rowData");

    // Get which column triggered restore
    var sColumnName = oButton.data("columnName");

    console.log("Row Data:", oRowData);
    console.log("Column:", sColumnName);

    // Store for later usage
    this._oCurrentRowData = oRowData;
    this._sCurrentColumnName = sColumnName;

    if (!this._oRestoreDialog) {
        this._oRestoreDialog = sap.ui.xmlfragment(
            "StreamingEngine.StreamingEngine.view.RestoreValueSelect",
            this
        );
        this.getView().addDependent(this._oRestoreDialog);
    }

    this._oRestoreDialog.open();
            this.fnInitRestorePopup();
}

,
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
                } else if (sControlName == "sap.m.MultiInput") {
                    var aTokens = arrCurrentItems[0].getTokens().map(oElt => oElt.getText());
                    if (aTokens.indexOf(sSelectedValue) == -1) {
                     //   this.fnAddNewToken(arrCurrentItems[0], sSelectedValue);
                    }
                }
            }
            this._oRestoreDialog.destroy();
        },
        /*****************************************************************************/

        /****************Below Function is for Restore Values (specific to this page)*****************/
        fnLoadrestoreValues: function () {
            oDialog.open();
            var sTagCatalogTable;
            var sTableKey;

            if (sCurrentColumnName == "DS_GAS_CODE") {
                sTagCatalogTable = "SE_DATA_FLOW_OPERATOR_MAPPING_CODE";
                sCurrentColumnName = "DS_CODE";
                sTableKey = "GAS." + sGasOperatorCode + "." + sFlowID;
            } else if (sCurrentColumnName == "DS_POWER_CODE") {
                sTagCatalogTable = "SE_DATA_FLOW_OPERATOR_MAPPING_CODE";
                sCurrentColumnName = "DS_CODE";
                sTableKey = "ELS." + sPowerOperatorCode + "." + sFlowID;
            }
            else {
                sTagCatalogTable = "SE_DATA_FLOW";
                sTableKey = sFlowID;
            }

            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLogRestoreValueSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sTagCatalogTable,
                    "Param.2": sCurrentColumnName,
                    "Param.3": sTableKey
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
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
                        oExternalInformationController.oModelRestoreValue.setData(data);
                        oExternalInformationController.oModelRestoreValue.refresh();
                        oDialog.close();
                    }
                }
            });
        },
        /*****************************************************************************/

        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("ExternalFlows", {
                Refresh: "N"
            });

        },
        fnNavigateBackAndReload: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("ExternalFlows", {
                Refresh: "Y"
            });

        },
        fnValidateChangeComments: function () {
            var oChangeTracker = this.oModelChangeMessages.getData();

            oChangeTracker.fnUpdateNewValue("DS_NAME", sInputDataFlowName);
            oChangeTracker.fnUpdateNewValue("DS_DESCRIPTION", sInputDescription);
            oChangeTracker.fnUpdateNewValue("ID_DATA_DESTINATION", sDataDestination);
            oChangeTracker.fnUpdateNewValue("FL_COMPRESSED", iCompressed == 1 ? sYesLabel : sNoLabel);
            oChangeTracker.fnUpdateNewValue("FL_ENABLED", iEnabled == 1 ? sYesLabel : sNoLabel);
            oChangeTracker.fnUpdateNewValue("ID_FLOW_TYPE", sComboFlowType);
            //oChangeTracker.fnUpdateNewValue("DS_GAS_CODE", aInputGasCodeTokens);
            oChangeTracker.fnUpdateNewValue("DS_GAS_OPERATOR_CODE", sInputGasSupplier);
            oChangeTracker.fnUpdateNewValue("DS_REFERENCE_CONDITION", sComboGasRefCondition);
            //oChangeTracker.fnUpdateNewValue("DS_POWER_CODE", aInputPowerCodeTokens);
            oChangeTracker.fnUpdateNewValue("DS_POWER_OPERATOR_CODE", sInputPowerSupplier);
            oChangeTracker.fnUpdateNewValue("DS_COUNTRY", sCountry);
            oChangeTracker.fnUpdateNewValue("ID_QUALISTEO_PROJECT", sProjectID);
            oChangeTracker.fnUpdateNewValue("DS_FREQUENCY_GAS", sFrequencyGas);
            oChangeTracker.fnUpdateNewValue("DS_FREQUENCY_POWER", sFrequencyPower);

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
                        oExternalInformationController.fnAddUpdateFlow();
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
        onChangeDestination: function () {
            this.getView().byId("combobox-datadestination").setValueState("None");
            this.getView().byId("objectStatus-dd-disabled").setVisible(false);
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

                            that.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
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
        onChangeSource: function (oEvent) {
    var sSourceID = oEvent.getSource().getSelectedKey();
    this.fnLoadEngieLists(sSourceID);
},

        fnLoadProjectList: function () {
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ExternalFlowQualisteoProjectListXacuteQuery&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.FatalError != undefined || JSON.parse(result.Rowsets.Rowset[0].Row[0].outputJSON).error !== undefined) {
                        oExternalInformationController.handleMessage(oResourceBundle.getText("commonTitleExternalFlowInfo"),
                            oResourceBundle.getText("externalFlowLoadMeters"),
                            result.error,
                            "Error");
                    } else {
                        if (oExternalInformationController.oModelProjectList == undefined) {
                            oExternalInformationController.oModelProjectList = new sap.ui.model.json.JSONModel();
                            oExternalInformationController.byId("combobox-ProjectId").setModel(oExternalInformationController.oModelProjectList);

                        }
                        oExternalInformationController.oModelProjectList.setData(JSON.parse(result.Rowsets.Rowset[0].Row[0].outputJSON))
                        oExternalInformationController.oModelProjectList.refresh()
                    }
                }
            });
        }
    });
});
//# sourceURL=https://sapdqnjc.pharma.aventis.com:50001/XMII/CM/StreamingEngine/StreamingEngine/controller/ExternalInformation.controller.js?eval