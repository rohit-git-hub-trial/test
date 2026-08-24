/*-----------------------------------------------------------------------------------
Streaming Engine - External Flows
Creation Date: 2022.12.06 / By: E00499160
Reference Document: 
Description:This screen is used to view all the available External flows
-------------------------------------------------------------------------------------*/
var oExternalFlowsController;
var selectedExternalFlowPlant;
var selectedExternalFlowDataSource;
var oDialog;
var selectedExternalFlowID = "";
var selectedExternalFlowTypeUpper = "";
var sHistoricalDataUploadSelectedStartDate ="";
var sHistoricalDataUploadSelectedEndDate="";
var iHistoricalDataUploadMaxRequestTimeframe="";
var oResourceBundle;
sap.ui.define([
    "../controller/BaseController",
     "sap/m/MessageToast",
    "sap/m/MessageBox",
    "StreamingEngine/StreamingEngine/model/formatter",
], function (BaseController, MessageToast, MessageBox, formatter) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.ExternalFlows", {
        formatter: formatter,
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oExternalFlowsController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            this.getView().byId("table-external-flows").setModel(this.oModelExternalFlows);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ExternalFlows").attachPatternMatched(this._onObjectMatched, this);
         
        },
        onAfterRendering: function () {
            oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
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
                this.getView().byId("page-external-flows").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            oExternalFlowsController.getView().byId("messagestrip-run-flow-manually").setVisible(false);
            var sMode = oEvent.getParameter("arguments").Refresh;
            if (sMode == "Y") {
                oExternalFlowsController.fnLoadPlant();
                this.getView().byId("table-external-flows").getBinding("items").sort(new sap.ui.model.Sorter("PLANT", false));
                if (this.oSortDialog) {
                    this.oSortDialog.destroy();
                    this.oSortDialog = undefined;
                }
            } else if (sMode == "N") {
            }
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleExternalFlow"));
        },
        oModelPlant: new sap.ui.model.json.JSONModel(),
        oModelDataSource: new sap.ui.model.json.JSONModel(),
        oModelExternalFlows: new sap.ui.model.json.JSONModel(),
        fnLoadPlant: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                            oResourceBundle.getText("dataSourcesLoadPlantsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        data.Row.unshift({ DS_NAME: oResourceBundle.getText("commonAll"), ID_PLANT: "%" });
                        oExternalFlowsController.oModelPlant.setData(data);
                        oExternalFlowsController.oModelPlant.refresh();
                        oExternalFlowsController.getView().byId("combobox-plant").setSelectedKey("%");
                        //oExternalFlowsController.fnLoadExternalFlows();
                        oExternalFlowsController.fnPlantSelected();
                    }
                }
            });
        },
        fnPlantSelected: function () {
            this.fnLoadDataSource();
        },
        fnLoadDataSource: function () {
            var selectedExternalFlowPlant = oExternalFlowsController.getView().byId("combobox-plant").getSelectedKey();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": selectedExternalFlowPlant,
                    "Param.6": 1,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                            oResourceBundle.getText("dataSourcesLoadDataSources"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        try {
                            data.Row.unshift({ DS_NAME: oResourceBundle.getText("commonAll"), ID_SOURCE: "%" });
                        } catch (err) { };
                        oExternalFlowsController.oModelDataSource.setData(data);
                        oExternalFlowsController.oModelDataSource.refresh();
                        oExternalFlowsController.getView().byId("combobox-data-source").setSelectedKey("%");
                        oExternalFlowsController.fnLoadExternalFlows();
                    }
                }
            });
        },
        onSearch: function () {
            this.fnLoadExternalFlows();
        },
        fnLoadExternalFlows: function () {
            oDialog.open();
            selectedExternalFlowPlant = oExternalFlowsController.getView().byId("combobox-plant").getSelectedKey();
            selectedExternalFlowDataSource = oExternalFlowsController.getView().byId("combobox-data-source").getSelectedKey();
            var sExternalFlow = oExternalFlowsController.getView().byId("input-data-flow").getValue();
            var sExternalFlowFilter = "%" + sExternalFlow.replace(/ /gi, '%') + "%";
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ExternalFlowListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": selectedExternalFlowPlant,
                    "Param.2": selectedExternalFlowDataSource,
                    "Param.3": sExternalFlowFilter,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                            oResourceBundle.getText("flowLoadExternalFlowsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oExternalFlowsController.oModelExternalFlows.setData(data);
                        oExternalFlowsController.oModelExternalFlows.refresh();
                        oDialog.close();
                    }
                }
            });
        },
        fnRowPress: function (oEvent) {
            var oPath = oEvent.getSource().getBindingContextPath();
            var selectedItem = oEvent.getSource().getBindingContext().oModel.getProperty(oPath);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("ExternalInformation", {
                MODE: "U",
                ID_DATA_FLOW: selectedItem.ID_DATA_FLOW,
                ID_SOURCE: selectedItem.ID_SOURCE,
                SOURCE_NAME: selectedItem.SOURCE_NAME,
                PLANT: selectedItem.PLANT,
                ID_DATA_DESTINATION: selectedItem.ID_DATA_DESTINATION,
                DESTINATION_NAME: encodeURIComponent(selectedItem.DESTINATION_NAME),
                DESTINATION_ENABLED: selectedItem.DESTINATION_ENABLED,          
                FLOW_TYPE: selectedItem.FLOW_TYPE_ID,
                DS_NAME: selectedItem.DS_NAME,
                DS_DESCRIPTION: selectedItem.DS_DESCRIPTION,
                DS_GAS_OPERATOR_CODE: encodeURIComponent(selectedItem.DS_GAS_OPERATOR_CODE),
                DS_REFERENCE_CONDITION: selectedItem.DS_REFERENCE_CONDITION,
                DS_POWER_OPERATOR_CODE: encodeURIComponent(selectedItem.DS_POWER_OPERATOR_CODE),
                FL_COMPRESSED: selectedItem.FL_COMPRESSED,
                FL_ENABLED: selectedItem.FL_ENABLED,
                DS_COUNTRY: selectedItem.DS_COUNTRY,
                DS_FREQUENCY_GAS: selectedItem.DS_FREQUENCY_GAS,
                DS_FREQUENCY_POWER: selectedItem.DS_FREQUENCY_POWER,
                ID_QUALISTEO_PROJECT: selectedItem.ID_QUALISTEO_PROJECT
            });
        },
        fnSelectionChanged: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            var sInitialLoadParent = oSelectedItem.ID_INITIAL_LOAD_PARENT;
            selectedExternalFlowID = oSelectedItem.ID_DATA_FLOW;
            var sFlowType = oSelectedItem.FLOW_TYPE;
            selectedExternalFlowTypeUpper = sFlowType.toUpperCase();
            if (sFlowType == "Qualisteo") {
                this.byId("button-enable-data-upload").setEnabled(false);
                this.byId("button-disable-data-upload").setEnabled(false);
            } else {
                if (sInitialLoadParent == "NA") {
                    this.byId("button-enable-data-upload").setEnabled(true);
                    this.byId("button-disable-data-upload").setEnabled(false);
                }
                else {
                    this.byId("button-enable-data-upload").setEnabled(false);
                    this.byId("button-disable-data-upload").setEnabled(true);
                }
            }
        },
        fnRunFlowManually: function () {
            if (selectedExternalFlowID != "" && selectedExternalFlowTypeUpper != "") {
                var that = this;
                $.ajax({
                    url: `/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/EngineExecution_${selectedExternalFlowTypeUpper === 'ENERGY' ? 'Energy' : ''}JobXacuteQuery&Content-Type=text/json`,
                    type: "POST",
                    async: true,
                    data: {
                        "Param.1": selectedExternalFlowTypeUpper,
                        "Param.2": selectedExternalFlowID
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            that.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                                oResourceBundle.getText("flowRunManually"),
                                sErrorMessage,
                                "Error");
                            oDialog.close();
                        } else {
                            oExternalFlowsController.getView().byId("messagestrip-run-flow-manually").setVisible(true);
                            that.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                                oResourceBundle.getText("flowRunManually"),
                                oResourceBundle.getText("commonBackgroundProcessMessage"),
                                "Success");
                        }
                    },
                    error: function () {

                    }
                });
            } else {
                var sErrorMessage = oResourceBundle.getText("flowSelectExternalFlow");
                this.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                    oResourceBundle.getText("flowRunManually"),
                    sErrorMessage,
                    "Error");
            }

        },
        fnAddNew: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("ExternalInformation", {
                MODE: "I"
            });
        },
        fnHistoricalDataUpload: function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment(this.getView().getId(), "StreamingEngine.StreamingEngine.fragment.HistoricalDataUpload", this);
                this.getView().addDependent(this._oDialog);
            }
  	this.getView().byId("historical-upload-max-timeframe").setVisible(false);
            this._oDialog.open();
        	this.getView().byId("historical-upload-max-timeframe").setEnabled(false);
	this.getView().byId("historical-upload-max-timeframe").setValue("10000");
        },
        fnHistoricalDataUploadClearEntries: function (bDisableButtons = false) {
            this.getView().byId("historical-upload-time-from").setValue("");
            this.getView().byId("historical-upload-time-to").setValue("");
            this.getView().byId("historical-upload-max-timeframe").setValue("10000");
            if (bDisableButtons == true) {
                this.byId("button-enable-data-upload").setEnabled(false);
                this.byId("button-disable-data-upload").setEnabled(false);
            }
        },
        fnHistoricalDataUploadClosePopOver: function () {
            if (this._oDialog) {
                this.fnHistoricalDataUploadClearEntries();
                this._oDialog.close();
            }
        },
        fnCancelHistoricalDataUpload: function () {
            MessageBox.confirm(oResourceBundle.getText("contextualFlowCancelUploadMsg"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === "YES") {
                        oExternalFlowsController.fnEnableHistoricalDataUploadSubmit("DISABLE");
                    }
                }
            }
            );
        },
        fnHistoricalTimeFrameChange: function (oEvent) {
            if (oEvent.getParameter("newValue") < 5) {
                oEvent.getSource().setValue(5)
            }
        },
        fnStartHistoricalDataUpload: function () {
            sHistoricalDataUploadSelectedStartDate =  this.getView().byId("historical-upload-time-from").getValue();
            sHistoricalDataUploadSelectedEndDate =  this.getView().byId("historical-upload-time-to").getValue();
            iHistoricalDataUploadMaxRequestTimeframe =  this.getView().byId("historical-upload-max-timeframe").getValue();
            var Datenowtwoyearsago=new Date();
            // Datenow to compare with
            Datenowtwoyearsago.setYear(Datenowtwoyearsago.getFullYear()-2);
            
            var Datenow=new Date();

            var oStartDateJs =this.getView().byId("historical-upload-time-from").getDateValue();
            var oEndDateJs = this.getView().byId("historical-upload-time-to").getDateValue();
            if (sHistoricalDataUploadSelectedStartDate && sHistoricalDataUploadSelectedEndDate && iHistoricalDataUploadMaxRequestTimeframe) {
                if (oStartDateJs < oEndDateJs) {
                    if (iHistoricalDataUploadMaxRequestTimeframe > 5) {
                        if((oStartDateJs > Datenowtwoyearsago) && (oEndDateJs < Datenow)) {
                        this._oDialog.close();
                        oExternalFlowsController.fnEnableHistoricalDataUploadSubmit("ENABLE"); }
                        else {
                            // MessageToast.show(oResourceBundle.getText("ExternalFlowTwoYearsMaximum"), {
                             //   width: "25em"
                           // });
                           MessageToast.show(oResourceBundle.getText("externalFlowTwoYearsMaximum"))


                        }
                    } else {
                        MessageToast.show(oResourceBundle.getText("contextualFlowMinimumFive") + ": " + oResourceBundle.getText("contextualFlowMaxTimeframePerRequest"), {
                            width: "25em"
                        });

                        this.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                            oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                            oResourceBundle.getText("contextualFlowMinimumFive") + ": " + oResourceBundle.getText("contextualFlowMaxTimeframePerRequest"),
                            "Error");
                    }
                   
                
                } else {
                    MessageToast.show(oResourceBundle.getText("tagErrorDatesMsg"), {
                        width: "25em"
                    });

                    this.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                        oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                        oResourceBundle.getText("tagErrorDatesMsg"),
                        "Error");

                }
            } else {
                MessageToast.show(oResourceBundle.getText("contextualFlowEmptyMandValues"), {
                    width: "25em"
                });
                this.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                    oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                    oResourceBundle.getText("contextualFlowEmptyMandValues"),
                    "Error");
            }
        
      
        },
        oModelHistoricalDataLoad: new sap.ui.model.json.JSONModel(),
        fnEnableHistoricalDataUploadSubmit: function (sAction) {
            var sProcessingText = oResourceBundle.getText("commonBackgroundProcessMessage");
            oDialog.setText(sProcessingText);
            oDialog.open();
	iHistoricalDataUploadMaxRequestTimeframe=0;
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/HistoricalUpload/Query/EngieHistoricalUploadXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sAction,
                    "Param.2": selectedExternalFlowID,
                    "Param.3": sHistoricalDataUploadSelectedStartDate,
                    "Param.4": sHistoricalDataUploadSelectedEndDate,
                    "Param.5": iHistoricalDataUploadMaxRequestTimeframe
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                            oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        oDialog.close();
                        if (!oExternalFlowsController.getView()._oDialog) {
                            oExternalFlowsController.getView()._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.HistoricalUploadReport", oExternalFlowsController);
                        }
                        oExternalFlowsController.getView().addDependent(oExternalFlowsController.getView()._oDialog);
                        jQuery.sap.syncStyleClass("sapUiSizeCompact", oExternalFlowsController.getView(), oExternalFlowsController.getView()._oDialog);
                        oExternalFlowsController.getView()._oDialog.open();
                        sap.ui.getCore().byId("historical-upload-report").setModel(oExternalFlowsController.oModelHistoricalDataLoad);
                        var data = result.Rowsets.Rowset[0];
                        oExternalFlowsController.oModelHistoricalDataLoad.setData(data);
                        oExternalFlowsController.oModelHistoricalDataLoad.refresh();
                        that.handleMessage(oResourceBundle.getText("commonTitleExternalFlow"),
                            oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                            data.Row[0].ResponseMessage,
                            data.Row[0].Status === "S" ? "Success" : data.Row[0].Status === "W" ? "Warning" : "Error");
                    }
                },
                error: function () {
                }
            });
            this.fnHistoricalDataUploadClearEntries();

        },
        fnCloseHistoricalUploadPopUp: function () {
            oExternalFlowsController.getView()._oDialog.close();
            oExternalFlowsController.getView().byId("table-external-flows").removeSelections(true);
            oExternalFlowsController.getView().byId("button-enable-data-upload").setEnabled(false);
            oExternalFlowsController.getView().byId("button-disable-data-upload").setEnabled(false); 
            oExternalFlowsController.fnLoadExternalFlows();
            
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");

        },
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>commonLabelPlant}", key: "PLANT", selected: true },
                { text: "{i18n>flowDS}", key: "SOURCE_NAME" },
                { text: "{i18n>flowType}", key: "FLOW_TYPE" },
                { text: "{i18n>flowName}", key: "DS_NAME" },
                { text: "{i18n>flowDesc}", key: "DS_DESCRIPTION" },
                { text: "{i18n>flowCompressed}", key: "FL_COMPRESSED" },
                { text: "{i18n>flowEnabled}", key: "FL_ENABLED" },
            ];
            var oTable = oEvent.getSource().getParent().getParent(); // Table > Toolbar > Button
            if (!this.oSortDialog) {
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>flowExternalSort}",
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
