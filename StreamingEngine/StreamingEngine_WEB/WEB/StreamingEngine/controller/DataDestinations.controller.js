/*-----------------------------------------------------------------------------------
Streaming Engine - Data Destinations
Creation Date: 2022.06.21 / By: E0449160
Reference Document: 
Description:This screen is used display all the Data Destinations and their configurations
-------------------------------------------------------------------------------------*/
var oDataDestinationsController;
var selectedPlant;
var oDialog;
var selectedDataDestinationID = "";
var oResourceBundle;
sap.ui.define([
    "../controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
], function (BaseController, Filter, FilterOperator, JSONModel) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.DataDestinations", {
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oDataDestinationsController = this;
            oDialog = this.getView().byId("BusyDialog");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            
            oRouter.getRoute("DataDestinations").attachPatternMatched(this._onObjectMatched, this);
            //load destination type
            var sPathDestinationType = jQuery.sap.getModulePath("StreamingEngine.StreamingEngine", "/model/destinationType.json"),
                oModelDataDesType = new JSONModel(sPathDestinationType);
            this.getView().byId("combobox-data-dest-type").setModel(oModelDataDesType);
            this.oModelDataDestinations = this.getOwnerComponent().getModel("DataDestinationModel");
            this.getView().byId("table-datadestinations").setModel(this.oModelDataDestinations);

        },
        onAfterRendering: function () {
            oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            /******************** Below Part for Authorisation***********************/
            var sRoles = document.getElementById('input-roles').value;
            var sAdminRole = "STREAMING_ENGINE_ADMIN";
            var iAdminIndex = sRoles.indexOf(sAdminRole);
            if (iAdminIndex < 0) {
                this.fnShowNoAccess();
                return;
            } else {
                this.getView().byId("page-data-destinations").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleDataDestinations"));
            var sMode = oEvent.getParameter("arguments").Refresh;
            if (sMode == "Y") {
                oDataDestinationsController.fnLoadDataDestinations();
            } else if (sMode == "N") {

            }
        },
        
        fnLoadDataDestinations: function () {
            var that = this;
            var sDataDestination = oDataDestinationsController.getView().byId("input-data-destination").getValue();
            var sDataDestinationFilter = "%" + sDataDestination.replace(/ /gi, '%') + "%";
            var sDestinationTypeTypeFilter = this.byId("combobox-data-dest-type").getSelectedKey();
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/DestinationsAllSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sDataDestinationFilter,
                    "Param.2": sDestinationTypeTypeFilter,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleDataDestinations"),
                            oResourceBundle.getText("dataDestinationsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oDataDestinationsController.oModelDataDestinations.setData(data);
                        oDataDestinationsController.oModelDataDestinations.refresh();
                    }
                }
            });
        },
        onSearch: function () {
            this.fnLoadDataDestinations();
        },
        fnRowPress: function (oEvent) {
            var oPath = oEvent.getSource().getBindingContextPath();
            var selectedItem = oEvent.getSource().getBindingContext().oModel.getProperty(oPath);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("DataDestinationInformation", {
                MODE: "U",
                ID_DATA_DESTINATION: selectedItem.ID_DATA_DESTINATION
            });
        },
        fnSelectionChanged: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            selectedDataDestinationID = oSelectedItem.ID_DATA_DESTINATION;
        },
        fnClosePopOver: function () {
            this._oDialog.close();
        },
        fnAddNew: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("DataDestinationInformation", {
                MODE: "I",               
                ID_DATA_DESTINATION: "00000000-0000-0000-0000-000000000000"
            });
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");
        },
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>dataDestinationName}", key: "DS_NAME", selected: true },
                { text: "{i18n>dataDestinationType}", key: "CD_TYPE" },
                { text: "{i18n>dataDestinationUrl}", key: "DS_PATH" },
                { text: "{i18n>dataDestinationHttpMethod}", key: "CD_HTTP_METHOD" },
                { text: "{i18n>dataDestinationAuthenMethod}", key: "CD_AUTHENTICATION_METHOD" }
            ];
            if (!this.oSortDialog) {
                var oTable = oEvent.getSource().getParent().getParent(); // Table > Toolbar > Button
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>dataDestinationsSort}",
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
        },
        getText: function (sText) {
            return oResourceBundle.getText(sText);
        },
        getDestinationName: function (sName, sType, sPlant) {
            if(sType == "DD_TYPE_PCO") return sName + " [ " + sPlant + " ]";
            else return sName;
        }
    });
});
//# sourceURL=https://sapwdawsemea.pharma.aventis.com:9100/XMII/CM/StreamingEngine/StreamingEngine/controller/DataDestinations.controller.js?eval