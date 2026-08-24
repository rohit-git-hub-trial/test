
var oFlowMonitoringController;
var oDialog;
var oResourceBundle;
sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageBox",
    "StreamingEngine/StreamingEngine/model/formatter",
    "sap/m/Dialog"
], function (BaseController, MessageBox, formatter, Dialog) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.FlowMonitoring", {
        formatter: formatter,
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oFlowMonitoringController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("table-flow-monitoring").setModel(this.oModelFlowMonitoring);
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("FlowMonitoring").attachPatternMatched(this._onObjectMatched, this);

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
                this.getView().byId("page-flow-monitoring").setVisible(true);
            }

            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, "Flow Monitoring");
            // this.fnResetSelection();
            oFlowMonitoringController.fnLoadPlant();
        },
        oModelFlowMonitoring: new sap.ui.model.json.JSONModel(),
        oModelPlant: new sap.ui.model.json.JSONModel(),
        oModelDataSource: new sap.ui.model.json.JSONModel(),
        fnLoadPlant: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonAuditLogTitle"),
                            oResourceBundle.getText("dataSourcesLoadPlantsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        try {
                            data.Row.unshift({
                                DS_NAME: oResourceBundle.getText("commonAll")
                            });
                        } catch (err) { };
                        oFlowMonitoringController.oModelPlant.setData(data);
                        oFlowMonitoringController.oModelPlant.refresh();
                        oFlowMonitoringController.getView().byId("combobox-plant").setSelectedKey(oResourceBundle.getText("commonAll"));
                        oFlowMonitoringController.fnPlantSelected();
                    }
                }
            });
        },
        fnPlantSelected: function () {
            var sPlantID = oFlowMonitoringController.getView().byId("combobox-plant").getSelectedItem().getBindingContext().getObject().ID_PLANT;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sPlantID == undefined ? "%" : sPlantID,
                    "Param.4": 1,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        oFlowMonitoringController.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                            oResourceBundle.getText("dataSourcesLoadDataSources"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        try {
                            data.Row.unshift({
                                DS_NAME: oResourceBundle.getText("commonAll")
                            });
                        } catch (err) { };
                        oFlowMonitoringController.oModelDataSource.setData(data);
                        oFlowMonitoringController.oModelDataSource.refresh();
                        oFlowMonitoringController.getView().byId("combobox-data-source").setSelectedKey(oResourceBundle.getText("commonAll"));
                        oFlowMonitoringController.fnLoadFlowMonitoring();
                    }
                }
            });
        },
        fnLoadFlowMonitoring: function (iOffset=0) {
            if (typeof iOffset !== "number") iOffset = 0;
            if (iOffset == 0) oDialog.open();
            var sPlantName = oFlowMonitoringController.getView().byId("combobox-plant").getSelectedKey();
            var sDataSourceName = oFlowMonitoringController.getView().byId("combobox-data-source").getSelectedKey();
            var bAggregate = oFlowMonitoringController.getView().byId("switch-aggregate").getState();
            if (bAggregate) {
                var url = "StreamingEngine/DataFlow/Query/FlowMonitoringListAggregateQuery"
                oFlowMonitoringController.getView().byId("combobox-plant").setSelectedKey(oResourceBundle.getText("commonAll"));
                oFlowMonitoringController.getView().byId("combobox-data-source").setSelectedKey(oResourceBundle.getText("commonAll"));
                sPlantName = oResourceBundle.getText("commonAll");
                sDataSourceName = oResourceBundle.getText("commonAll");
            } else {
                var url = "StreamingEngine/DataFlow/Query/FlowMonitoringListSelectQuery"
            }
            $.ajax({
                url: `/XMII/Illuminator?QueryTemplate=${url}&Content-Type=text/json`,
                type: "POST",
                data: {
                    "Param.1": sPlantName === oResourceBundle.getText("commonAll") ? "%" : sPlantName,
                    "Param.2": sDataSourceName === oResourceBundle.getText("commonAll") ? "%" : sDataSourceName,
                    "Param.20": document.getElementById("SE_Plant").value,
                    "Param.30": iOffset
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonAuditLogTitle"),
                            oResourceBundle.getText("auditLogLoadAuditLog"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        if (iOffset > 0) {
                            oFlowMonitoringController.oModelFlowMonitoring.getData().Row.push(...data.Row);
                        } else {
                            oFlowMonitoringController.oModelFlowMonitoring.setData(data);
                        }
                        oFlowMonitoringController.oModelFlowMonitoring.refresh();
                    }
                },
                complete: function() {
                    oDialog.close();
                }
            });
        },
        fnGrowingStarted: function(oEvent) {
            var iOffset = oEvent.getParameter("total")
            if (oEvent.getParameter("reason") === "Growing" && (iOffset - oEvent.getParameter("actual")) <= 20 ) { // 20 is the growing threshold
                this.fnLoadFlowMonitoring(iOffset);
            }
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");

        }
    });
});