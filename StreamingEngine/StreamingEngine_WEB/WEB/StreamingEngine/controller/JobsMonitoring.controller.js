/*-----------------------------------------------------------------------------------
Streaming Engine - Jobs Monitoring
Creation Date: 2020.06.01 / By: E0445955
Reference Document: 
Description:Used to monitor the jobs
-------------------------------------------------------------------------------------*/
var oJobsMonitoringController;
var oDialog;
var bSelectedJob;
var sLastMessage;
var sJobID;
var sSelectedEndDate;
var sEndDate;

var oResourceBundle;
sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageBox",
    "StreamingEngine/StreamingEngine/model/formatter",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/ui/model/Sorter",
], function (BaseController, MessageBox, formatter, Popover, Button, Dialog, Text, Sorter) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.JobsMonitoring", {
        formatter: formatter,
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
            // // //
            oJobsMonitoringController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("table-jobs-monitoring").setModel(this.oModelJobsMonitoring);
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("JobsMonitoring").attachPatternMatched(this._onObjectMatched, this);

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
                this.getView().byId("page-jobs-monitoring").setVisible(true);
                if (iAdminIndex > 0) {
                    this.getView().byId("button-update-end-date").setVisible(true);
                    this.getView().byId("button-reload-catchup").setVisible(true);
                }
                else {
                    this.getView().byId("button-update-end-date").setVisible(false);
                    this.getView().byId("button-reload-catchup").setVisible(false);
                }
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },

        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleJobsMonitoring"));
            this.fnResetSelection();
            oJobsMonitoringController.fnLoadPlant();
        },
        fnResetSelection: function () {
            bSelectedJob = 0;
            sLastMessage = "";
            sJobID = "";
            sSelectedEndDate = "";
            sEndDate = "";
            this.getView().byId("button-update-end-date").setEnabled(false);
            this.getView().byId("button-reload-catchup").setEnabled(false);
            this.getView().byId("button-last-status").setEnabled(false);
            this.getView().byId("table-jobs-monitoring").removeSelections();
        },
        oModelJobsMonitoring: new sap.ui.model.json.JSONModel(),
        oModelPlant: new sap.ui.model.json.JSONModel(),
        fnLoadPlant: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleJobsMonitoring"),
                            oResourceBundle.getText("dataSourcesLoadPlantsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        try {
                            data.Row.unshift({
                                DS_NAME: oResourceBundle.getText("commonAll"),
                                ID_PLANT: "%"
                            });
                        } catch (err) { };
                        oJobsMonitoringController.oModelPlant.setData(data);
                        oJobsMonitoringController.oModelPlant.refresh();
                        oJobsMonitoringController.getView().byId("combobox-plant").setSelectedKey("%");
                        oJobsMonitoringController.fnLoadJobsMonitoring();
                    }
                }
            });
        },
        fnSelectionChanged: function (oEvent) {
            bSelectedJob = 1;
            this.getView().byId("button-update-end-date").setEnabled(true);
            this.getView().byId("button-reload-catchup").setEnabled(true);
            this.getView().byId("button-last-status").setEnabled(true);
            var selectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            sLastMessage = selectedItem.DS_MESSAGE;
            sJobID = selectedItem.ID_JOB;
            sEndDate = selectedItem.DT_LAST_RUN_END;
        },
        fnViewLastMessage: function () {
            var sLastStatus = oResourceBundle.getText("jobsMonitoringLastStatus");
            if (bSelectedJob == 1) {
                MessageBox.information(sLastMessage, {
                    icon: MessageBox.Icon.INFORMATION,
                    title: sLastStatus
                });
            }
        },
       

        fnUpdateEndDate: function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.DateSelect", this);
            }
            this._oDialog.open();
            oJobsMonitoringController.fnInitPopup();
        },
        fnUpdateEndDateConfirmation: function () {
            var sConfirmTitle = oResourceBundle.getText("commonConfirm");
            var sConfirmYes = oResourceBundle.getText("commonYes");
            var sConfirmNo = oResourceBundle.getText("commonNo");
            var sConfirmMessage = oResourceBundle.getText("commonConfirmationDialog");
            var dialog = new Dialog({
                title: sConfirmTitle,
                type: 'Message',
                content: new Text({
                    text: sConfirmMessage
                }),
                beginButton: new Button({
                    text: sConfirmYes,
                    press: function () {
                        oJobsMonitoringController.fnUpdateEndDateSubmit();
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
        fnUpdateEndDateSubmit: function () {
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/JobEndDateUpdateXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sJobID,
                    "Param.2": sSelectedEndDate
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageBox.information(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleJobsMonitoring"),
                            oResourceBundle.getText("jobsMonitoringUpdateEndDate"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        oJobsMonitoringController.fnLoadJobsMonitoring();
                    }
                },
                error: function () {
                }
            });
        },
        fnReloadCatchup: function () {
            var sConfirmTitle = oResourceBundle.getText("commonConfirm");
            var sConfirmYes = oResourceBundle.getText("commonYes");
            var sConfirmNo = oResourceBundle.getText("commonNo");
            var sConfirmMessage = oResourceBundle.getText("commonConfirmationDialog");
            var dialog = new Dialog({
                title: sConfirmTitle,
                type: 'Message',
                content: new Text({
                    text: sConfirmMessage
                }),
                beginButton: new Button({
                    text: sConfirmYes,
                    press: function () {
                        oJobsMonitoringController.fnReloadCatchupSubmit();
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
        fnReloadCatchupSubmit: function () {
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/JobCatchupReloadXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sJobID
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageBox.information(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleJobsMonitoring"),
                            oResourceBundle.getText("jobsMonitoringReloadCatchup"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        oJobsMonitoringController.fnLoadJobsMonitoring();
                    }
                },
                error: function () {
                }
            });
        },
        fnInitPopup: function () {
            var sDateTimeNow = new Date();
            sap.ui.getCore().byId("date-time").setMaxDate(sDateTimeNow);
            sap.ui.getCore().byId("date-time").setMinDate(new Date(new Date().setMonth(new Date().getMonth() - 1 )));
            if (sEndDate != "" && sEndDate != "TimeUnavailable" && sEndDate != "---") sap.ui.getCore().byId("date-time").setValue(sEndDate);
        },
        fnClosePopOver: function () {
            this._oDialog.close();
        },
        fnDateChanged: function () {

        },
        fnApplyDate: function () {
            sSelectedEndDate = sap.ui.getCore().byId("date-time").getValue();
            var oMinEndDate = new Date(new Date().setMonth(new Date().getMonth() - 1 ));
            if (sSelectedEndDate != "" && ( new Date(sSelectedEndDate) >  oMinEndDate)) {
                oJobsMonitoringController.fnUpdateEndDateConfirmation();
                this._oDialog.close();
            } else {
                MessageBox.information("Date is not selected properly");
            }
        },
        fnClearDates: function () {
            sap.ui.getCore().byId("date-time").setValue("");
        },
        fnLoadJobsMonitoring: function () {
            oDialog.open();
            this.fnResetSelection();
            var inputPlantId = oJobsMonitoringController.getView().byId("combobox-plant").getSelectedKey();
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/JobMonitoringListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": inputPlantId,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleJobsMonitoring"),
                            oResourceBundle.getText("jobsMonitoringLoadJobList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oJobsMonitoringController.oModelJobsMonitoring.setData(data);
                        oJobsMonitoringController.oModelJobsMonitoring.refresh();
                        oDialog.close();
                    }
                }
            });
        },
        fnRowPress: function (oEvent) {
            var selectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        },
           

        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");
        },
        fnViewSettingsButtonPressed: function (oEvent) {
            if (!this._oSortDialog) {
                this._oSortDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.ViewSettingDialogJobMonitoring", this);
            }
            this.getView().addDependent(this._oSortDialog);
            this._oSortDialog.open();
        },
        fnConfirmSettings: function (oEvent) {

            var oView = this.getView();
            var oTable = oView.byId("table-jobs-monitoring");

            var mParams = oEvent.getParameters();
            var oBinding = oTable.getBinding("items");

            var sPath = mParams.sortItem.getKey();
            var bDescending = mParams.sortDescending;
            var oSorter = new Sorter(sPath, bDescending);

            var r;
            if (sPath === "QT_LAST_RUN_DURATION" || sPath === "QT_TAG_COUNT" || sPath === "QT_LAST_RUN_SIZE" || sPath === "QT_CATCHUP_DURATION_MINS") {
                oSorter.fnCompare = function (val1, val2) {
                    var a, b;
                    a = typeof val1 == "number" ? val1 : -1;
                    b = typeof val2 == "number" ? val2 : -1;
                    if (!a) {
                        a = 0;
                    }
                    if (!b) {
                        b = 0;
                    }
                    if (a < b) {
                        r = -1;
                    }
                    if (a === b) {
                        r = 0;
                    }
                    if (a > b) {
                        r = 1;
                    }
                    return r;
                };
            }
            if (sPath === "DT_LAST_RUN_EXECUTION" || sPath === "DT_LAST_RUN_START" || sPath === "DT_LAST_RUN_END") {
                oSorter.fnCompare = function (val1, val2) {
                    var a, b;
                    var d1 = new Date(val1) instanceof Date && !isNaN(new Date(val1).getTime());
                    var d2 = new Date(val2) instanceof Date && !isNaN(new Date(val2).getTime());
                    a = d1 ? new Date(val1) : new Date("1800/01/01");
                    b = d2 ? new Date(val2) : new Date("1800/01/01");
                    if (!a) {
                        a = 0;
                    }
                    if (!b) {
                        b = 0;
                    }
                    if (a < b) {
                        r = -1;
                    }
                    if (a === b) {
                        r = 0;
                    }
                    if (a > b) {
                        r = 1;
                    }
                    return r;
                };
            }
            oBinding.sort(oSorter);
        }
    });
});