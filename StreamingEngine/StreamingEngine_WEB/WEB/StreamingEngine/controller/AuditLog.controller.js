/*-----------------------------------------------------------------------------------
Streaming Engine - Audit Log
Creation Date: 2020.06.01 / By: E0445955
Reference Document: 
Description:Displays all the audit logs
-------------------------------------------------------------------------------------*/
var oAuditLogController;
var oDialog;
var oResourceBundle;
sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageBox",
    "StreamingEngine/StreamingEngine/model/formatter",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/MessageToast",
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV",
], function (BaseController, MessageBox, formatter, Popover, Button, Dialog, Text, MessageToast, Export, ExportTypeCSV) {
    "use strict";

    
    return BaseController.extend("StreamingEngine.StreamingEngine.controller.AuditLog", {
        formatter: formatter,
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oAuditLogController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("table-audit-log").setModel(this.oModelAuditLog);
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("AuditLog").attachPatternMatched(this._onObjectMatched, this);

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
                this.getView().byId("page-audit-log").setVisible(true);
            }

            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonAuditLogTitle"));
            // this.fnResetSelection();
            oAuditLogController.fnLoadPlant();
            //var sDateTimeNow = new Date();
            //this.getView().byId("datetime-from").setMaxDate(sDateTimeNow);
            //this.getView().byId("datetime-to").setMaxDate(sDateTimeNow);
        },
        fnFromDateChanged: function () {
            var sFromDate = this.getView().byId("datetime-from").getDateValue();
            this.getView().byId("datetime-to").setMinDate(sFromDate);
        },
        fnApplyDate: function () {
            var sTo = oResourceBundle.getText("auditLogTO");
            var sDateNotSelected = oResourceBundle.getText("auditLogDateNotSelected");
            var sFromDate = this.getView().byId("datetime-from").getValue();
            var sToDate = this.getView().byId("datetime-to").getValue();
            if (sFromDate != "" && sToDate != "") {
                oAuditLogController.fnLoadAuditLog(sFromDate, sToDate);
                this.getView().byId("title-time").setText("( " + sFromDate + " " + sTo + " " + sToDate + " )");
            } else {
                MessageToast.show(sDateNotSelected);
            }
        },
        fnClearDates: function () {
            this.getView().byId("datetime-from").setValue("");
            this.getView().byId("datetime-to").setValue("");
            oAuditLogController.fnLoadAuditLog("", "");
            this.getView().byId("title-time").setText("(Last 24 hours)");
        },
        fnSearch: function () {
            var sTo = oResourceBundle.getText("auditLogTO");
            var sFromDate = this.getView().byId("datetime-from").getValue();
            var sToDate = this.getView().byId("datetime-to").getValue();
            if (sFromDate != "" && sToDate != "") {
                oAuditLogController.fnLoadAuditLog(sFromDate, sToDate);
                this.getView().byId("title-time").setText("( " + sFromDate + " " + sTo + " " + sToDate + " )");
            } else {
                oAuditLogController.fnClearDates();
            }
        },
        /*fnResetSelection: function () {
            this.getView().byId("button-last-status").setEnabled(false);
            this.getView().byId("table-audit-log").removeSelections();
        },*/
        oModelAuditLog: new sap.ui.model.json.JSONModel(),
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
                        that.handleMessage(oResourceBundle.getText("commonAuditLogTitle"),
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
                        oAuditLogController.oModelPlant.setData(data);
                        oAuditLogController.oModelPlant.refresh();
                        oAuditLogController.getView().byId("combobox-plant").setSelectedKey("%");
                        oAuditLogController.fnLoadAuditLog("", "");
                    }
                }
            });
        },

        /*fnSelectionChanged: function (oEvent) {
            bSelectedJob = 1;
            this.getView().byId("button-last-status").setEnabled(true);
            var selectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            sLastMessage = selectedItem.DS_MESSAGE;
        },
        fnViewLastMessage: function () {
            if (bSelectedJob == 1) {
                MessageBox.information(sLastMessage, {
                    icon: MessageBox.Icon.INFORMATION,
                    title: "Last Status"
                });
            }
        },*/
        fnLoadAuditLog: function (sStartDate, sEndDate) {
            oDialog.open();
            var inputPlantId = oAuditLogController.getView().byId("combobox-plant").getSelectedKey();
            var inputAction = oAuditLogController.getView().byId("combobox-action").getSelectedKey();
            var inputDbTable = '%' + oAuditLogController.getView().byId("input-db-table").getValue().replace(/ /gi, '%') + '%';
            var inputDbColumn = '%' + oAuditLogController.getView().byId("input-db-column").getValue().replace(/ /gi, '%') + '%';
            var inputDbKey = '%' + oAuditLogController.getView().byId("input-db-key").getValue().replace(/ /gi, '%') + '%';
            var inputPreviousValue = '%' + oAuditLogController.getView().byId("input-previous-value").getValue().replace(/ /gi, '%') + '%';
            var inputCurrentValue = '%' + oAuditLogController.getView().byId("input-current-value").getValue().replace(/ /gi, '%') + '%';
            var inputMessage = '%' + oAuditLogController.getView().byId("input-message").getValue().replace(/ /gi, '%') + '%';
            var inputUser = '%' + oAuditLogController.getView().byId("input-user").getValue().replace(/ /gi, '%') + '%';
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLogListSelectQuery&Content-Type=text/json",
                type: "POST",
                data: {
                    "Param.1": inputPlantId,
                    "Param.2": inputAction,
                    "Param.3": inputDbTable,
                    "Param.4": inputDbColumn,
                    "Param.5": inputDbKey,
                    "Param.6": inputPreviousValue,
                    "Param.7": inputCurrentValue,
                    "Param.8": inputMessage,
                    "Param.9": inputUser,
                    "StartDate": sStartDate,
                    "EndDate": sEndDate,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonAuditLogTitle"),
                            oResourceBundle.getText("auditLogLoadAuditLog"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        if (data.Row) {
                            var oData = that.fnSetTextsToCodes(data);
                            oAuditLogController.oModelAuditLog.setData(oData);
                        } else {
                            oAuditLogController.oModelAuditLog.setData(data);
                        }
                        oAuditLogController.oModelAuditLog.refresh();
                        oDialog.close();
                    }
                }
            });
        },
        getLocation: function () {
            return location.origin;
        },
        fnSetTextsToCodes: function (aData) {
            var aColumnsWithCodes = ["CD_TYPE", "CD_AUTHENTICATION_METHOD"];
            for (var i = 0; i < aData.Row.length; i++) {
                var sCurrentTableName = aData.Row[i].DS_DB_TABLE;
                var sCurrentColumnName = aData.Row[i].DS_DB_COLUMN;
                if (aColumnsWithCodes.includes(sCurrentColumnName) && sCurrentTableName === "SE_DATA_DESTINATION") {
                    aData.Row[i].DS_VALUE_OLD = oResourceBundle.getText(aData.Row[i].DS_VALUE_OLD);
                    aData.Row[i].DS_VALUE_NEW = oResourceBundle.getText(aData.Row[i].DS_VALUE_NEW);
                }
                if(sCurrentColumnName.startsWith("FL_") || sCurrentColumnName.startsWith("FLAG_")){
                    switch(aData.Row[i].DS_VALUE_OLD){
                        case "1": aData.Row[i].DS_VALUE_OLD = oResourceBundle.getText("commonYes").toUpperCase(); break;
                        case "0": aData.Row[i].DS_VALUE_OLD =  oResourceBundle.getText("commonNo").toUpperCase(); break;
                        case 'NA': aData.Row[i].DS_VALUE_OLD = "NA"; break;
                    }
                    switch(aData.Row[i].DS_VALUE_NEW){
                        case "1": aData.Row[i].DS_VALUE_NEW =  oResourceBundle.getText("commonYes").toUpperCase(); break;
                        case "0": aData.Row[i].DS_VALUE_NEW =  oResourceBundle.getText("commonNo").toUpperCase(); break;
                        case 'NA': aData.Row[i].DS_VALUE_NEW = "NA"; break;
                    }
                }
            }
            return aData;
        },
          
onDataExport: sap.m.Table.prototype.exportData || function () {

    // --- STEP 0: Capture logged-in username
    var sUserLocal = document.getElementById("input-username").value;
    console.log("Logged In sUserLocal:", sUserLocal);

    // --- Helper: Convert UI date (DD/MM/YYYY HH:mm:ss) → SQL format (YYYY-MM-DD HH:mm:ss)
function convertToSQLTimestamp(uiDateTime) {
    if (!uiDateTime) return "";

    // uiDateTime format: "MM/DD/YYYY HH:mm:ss"
    var parts = uiDateTime.split(" ");
    var datePart = parts[0];     // MM/DD/YYYY
    var timePart = parts[1];     // HH:mm:ss

    var datePieces = datePart.split("/"); 
    var MM = datePieces[0];
    var DD = datePieces[1];
    var YYYY = datePieces[2];

    return `${YYYY}-${MM}-${DD} ${timePart}`;
}

    // --- STEP A: Wrapped Email Validation Function (called only when rowCount > LIMIT)
    function runEmailValidation() {
        $.ajax({
            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLog_EmailAddressVerificationXacuteQuery&Content-Type=text/json",
            type: "POST",
            data: { "Param.1": sUserLocal },
            success: function (result) {
                var output = "";
                try {
                    output = result.Rowsets.Rowset[0].Row[0].Output;
                } catch (e) {
                    console.warn("Unexpected Email Verification Output", e);
                }

                // Missing email → show dialog
                if (output === "No email") {
                    try { if (oDialog && oDialog.close) { oDialog.close(); } } catch (e) {}

                    var oEmailInput = new sap.m.Input({
                        placeholder: "Enter your email address",
                        type: sap.m.InputType.Email,
                        width: "100%"
                    });

                    var isValidEmail = function (s) {
                        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
                    };

                    var oNoEmailDialog = new sap.m.Dialog({
                        title: "Email Required",
                        type: sap.m.DialogType.Message,
                        contentWidth: "25rem",
                        content: [
                            new sap.m.Text({
                                text: "No email ID is maintained for your profile. Please provide a valid email to continue or click cancel to abort the export."
                            }),
                            new sap.m.VBox({
                                width: "100%",
                                items: [
                                    new sap.m.Label({ text: "E-mail", required: true }),
                                    oEmailInput
                                ]
                            }).addStyleClass("sapUiSmallMarginTop")
                        ],
                        beginButton: new sap.m.Button({
                            text: "Save",
                            type: sap.m.ButtonType.Emphasized,
                            press: function () {
                                var sEmail = (oEmailInput.getValue() || "").trim();

                                if (!sEmail || !isValidEmail(sEmail)) {
                                    oEmailInput.setValueState(sap.ui.core.ValueState.Error);
                                    oEmailInput.setValueStateText("Please enter a valid e-mail address.");
                                    return;
                                }
                                oEmailInput.setValueState(sap.ui.core.ValueState.None);

                                oNoEmailDialog.setBusy(true);
                                oNoEmailDialog.getBeginButton().setEnabled(false);
                                oNoEmailDialog.getEndButton().setEnabled(false);

                                $.ajax({
                                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLogEmailUpdateQuery&Content-Type=text/json",
                                    type: "POST",
                                    data: {
                                        "Param.1": sEmail,
                                        "Param.2": sUserLocal
                                    },
                                    success: function () {
                                        oNoEmailDialog.setBusy(false);
                                        oNoEmailDialog.close();
                                        MessageToast.show("Email saved. Export process resumed.");
                                        proceedWithExport();
                                    },
                                    error: function () {
                                        oNoEmailDialog.setBusy(false);
                                        oNoEmailDialog.getBeginButton().setEnabled(true);
                                        oNoEmailDialog.getEndButton().setEnabled(true);
                                        MessageBox.error("Unable to update your email. Please try again.");
                                    }
                                });
                            }
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: function () {
                                oNoEmailDialog.close();
                                MessageToast.show("Email not saved. Please run the export process again.");
                            }
                        }).addStyleClass("importantColorRedFont"),
                        afterClose: function () {
                            oNoEmailDialog.destroy();
                        }
                    });

                    oNoEmailDialog.open();
                    return; // STOP until email saved or cancelled
                }

                // Email exists → proceed
                proceedWithExport();
            },

            error: function (err) {
                console.error("Email verification error", err);
                MessageBox.error("Unable to verify your email address. Please try again later.");
            }
        });
    }

    // --- STEP B: Main export logic (unchanged)
    var proceedWithExport = function () {
        var msg = "Data size is being calculated. Please, wait.";
        MessageToast.show(msg);
        oDialog.open();

        var inputPlantId = oAuditLogController.getView().byId("combobox-plant").getSelectedKey();
        var inputAction = oAuditLogController.getView().byId("combobox-action").getSelectedKey();
        var inputDbTable = '%' + oAuditLogController.getView().byId("input-db-table").getValue().replace(/ /gi, '%') + '%';
        var inputDbColumn = '%' + oAuditLogController.getView().byId("input-db-column").getValue().replace(/ /gi, '%') + '%';
        var inputDbKey = '%' + oAuditLogController.getView().byId("input-db-key").getValue().replace(/ /gi, '%') + '%';
        var inputPreviousValue = '%' + oAuditLogController.getView().byId("input-previous-value").getValue().replace(/ /gi, '%') + '%';
        var inputCurrentValue = '%' + oAuditLogController.getView().byId("input-current-value").getValue().replace(/ /gi, '%') + '%';
        var inputMessage = '%' + oAuditLogController.getView().byId("input-message").getValue().replace(/ /gi, '%') + '%';
        var inputUser = '%' + oAuditLogController.getView().byId("input-user").getValue().replace(/ /gi, '%') + '%';

        var rawStartDate = this.getView().byId("datetime-from").getValue();
        var rawEndDate = this.getView().byId("datetime-to").getValue();
        var startDate = convertToSQLTimestamp(rawStartDate);
        var endDate = convertToSQLTimestamp(rawEndDate);

        var sLink = oAuditLogController.getLocation() + "/XMII/CM";

        $.ajax({
            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/FullAuditLogsXacuteQuery&Content-Type=text/json",
            type: "POST",
            data: {
                "Param.1": inputPlantId,
                "Param.2": inputAction,
                "Param.3": inputDbTable,
                "Param.4": inputDbColumn,
                "Param.5": inputDbKey,
                "Param.6": inputPreviousValue,
                "Param.7": inputCurrentValue,
                "Param.8": inputMessage,
                "Param.9": inputUser,
                "Param.10": rawStartDate,
                "Param.11": rawEndDate,
                "Param.12": sLink,
                "Param.20": document.getElementById("SE_Plant").value
            },
            success: function (result) {
                var data = result.Rowsets.Rowset[0].Row[0].Status;

                if (data == "1") {
                    var oExport = new Export({
                        exportType: new ExportTypeCSV({
                            fileExtension: "csv",
                            separatorChar: ","
                        }),
                        models: oAuditLogController.oModelAuditLog,
                        rows: { path: "/Row" },
                        columns: [
                            { name: oResourceBundle.getText("commonLabelPlant"), template: { content: "{ID_PLANT}" } },
                            { name: oResourceBundle.getText("auditLogAction"), template: { content: "{DS_ACTION}" } },
                            { name: oResourceBundle.getText("auditLogTable"), template: { content: "{DS_DB_TABLE}" } },
                            { name: oResourceBundle.getText("auditLogColumn"), template: { content: "{DS_DB_COLUMN}" } },
                            { name: oResourceBundle.getText("auditLogKey"), template: { content: "{DS_DB_KEY}" } },
                            { name: oResourceBundle.getText("auditLogPreviousValue"), template: { content: "{DS_VALUE_OLD}" } },
                            { name: oResourceBundle.getText("auditLogCurrentValue"), template: { content: "{DS_VALUE_NEW}" } },
                            { name: oResourceBundle.getText("auditLogMessage"), template: { content: "{DS_MESSAGE}" } },
                            { name: oResourceBundle.getText("commentMessage"), template: { content: "{DS_COMMENT}" } },
                            { name: oResourceBundle.getText("auditLogUserName"), template: { content: "{DS_USERNAME}" } },
                            { name: oResourceBundle.getText("queueMonitoringPendingMessage"), template: { content: "{DT_TIMESTAMP}" } }
                        ]
                    });

                    oExport.saveFile().catch(function () { }).then(function () {
                        oExport.destroy();
                        oDialog.close();
                    });

                } else {
                    oDialog.close();
                    MessageBox.information(
                        "Data will be downloaded and mailed to you. Please, wait & check your inbox.",
                        { icon: MessageBox.Icon.INFORMATION, title: "Export Status" }
                    );
                }
            },
            error: function () {
                oDialog.close();
                MessageBox.error("Failed to trigger export. Please try again.");
            }
        });
    }.bind(this);

    // --- STEP X: Row Count Gate (Only large datasets require email validation)
    var LIMIT = 100000;

    // Collect same filter values again (consistent with existing patterns)
    var inputPlantId = this.getView().byId("combobox-plant").getSelectedKey();
    var inputAction = this.getView().byId("combobox-action").getSelectedKey();
    var inputDbTable = '%' + this.getView().byId("input-db-table").getValue().replace(/ /gi, '%') + '%';
    var inputDbColumn = '%' + this.getView().byId("input-db-column").getValue().replace(/ /gi, '%') + '%';
    var inputDbKey = '%' + this.getView().byId("input-db-key").getValue().replace(/ /gi, '%') + '%';
    var inputPreviousValue = '%' + this.getView().byId("input-previous-value").getValue().replace(/ /gi, '%') + '%';
    var inputCurrentValue = '%' + this.getView().byId("input-current-value").getValue().replace(/ /gi, '%') + '%';
    var inputMessage = '%' + this.getView().byId("input-message").getValue().replace(/ /gi, '%') + '%';
    var inputUser = '%' + this.getView().byId("input-user").getValue().replace(/ /gi, '%') + '%';

    var rawStartDate = this.getView().byId("datetime-from").getValue();
    var rawEndDate = this.getView().byId("datetime-to").getValue();
    var startDate = convertToSQLTimestamp(rawStartDate);
    var endDate = convertToSQLTimestamp(rawEndDate);

   
// Show busy indicator while the COUNT query is running
  try {
    oDialog.open();
  } catch (e) {
    // fallback: set the page busy if dialog missing
    this.getView().setBusy(true);
  }

    $.ajax({
        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLogCountSelectQuery&Content-Type=text/json",
        type: "POST",
        data: {
            "Param.1": inputPlantId,
            "Param.2": inputAction,
            "Param.3": inputDbTable,
            "Param.4": inputDbColumn,
            "Param.5": inputDbKey,
            "Param.6": inputPreviousValue,
            "Param.7": inputCurrentValue,
            "Param.8": inputMessage,
            "Param.9": inputUser,
            "Param.10": startDate,
            "Param.11": endDate,
            "Param.20": document.getElementById("SE_Plant").value
        },
        success: function (result) {
            var rowCount = 0;
	console.log("DEBUG Row Object:", result.Rowsets.Rowset[0].Row[0]);
            try {
               
var rowObj = result.Rowsets.Rowset[0].Row[0];
var firstKey = Object.keys(rowObj)[0];
var rowCount = Number(rowObj[firstKey]);

console.log("Detected Count Key:", firstKey, "→ RowCount:", rowCount);

            } catch (e) {
                console.warn("Failed to parse RowCount", e);
            }

            console.log("FullAuditLogListCountSelectQuery → RowCount =", rowCount);

            if (rowCount <= LIMIT) {
                console.log("RowCount ≤ LIMIT (" + LIMIT + "). Direct CSV export.");
                
// Close the COUNT busy and continue to export (which shows its own busy)
       try { oDialog.close(); } catch (e) { this.getView().setBusy(false); }
       proceedWithExport();

                return;
            }

            console.log("RowCount > LIMIT (" + LIMIT + "). Email validation required.");
            
// Close the COUNT busy before opening email dialog
      try { oDialog.close(); } catch (e) { this.getView().setBusy(false); }
      runEmailValidation();

 }.bind(this),
     error: function () {

      MessageBox.error("Unable to retrieve row count. Please try again.");
     },
   complete: function () {
      // Safety: ensure busy is closed even on unusual paths
      try { oDialog.close(); } catch (e) { this.getView().setBusy(false); }
    }.bind(this)
   });
 },

      onResetTagExport: function () {
    oDialog.open(); // Show busy indicator
    setTimeout(function () {
        window.open("/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLogResetTagsSelectQuery&Content-Type=text/csv&Param.20=" + document.getElementById("SE_Plant").value, "_blank");
        oDialog.close(); // Close busy indicator after short delay
    }, 1000); // Delay to ensure busy dialog is visible
},
     
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");

        }
    });
});