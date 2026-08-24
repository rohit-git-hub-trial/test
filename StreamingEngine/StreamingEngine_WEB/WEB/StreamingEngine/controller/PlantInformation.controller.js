/*-----------------------------------------------------------------------------------
Streaming Engine - Plant Infirmation
Creation Date: 2020.05.11 / By: E0445955
Modification Date: 2024.08.16 / By: U1021424
Reference Document: 
Description:This screen is used to Add, Edit or Delete the selected Plant's parameters
from the Plant Parameter Screen
-------------------------------------------------------------------------------------*/
var sPlantID;
var sMode;
var sAction;
var sInputPlantId;
var sInputPlantDescription;
var sInputMaxTagsPerJob;
var sInputJobDuration;
var sInputJobFlowMaxFileSize;
var sInputMaxQueryRetry;
var iInputMaxQueueRowCountRetry;
var sInputMaxTagsPerAgent;
var iInputAuditLogRetention;
var iInputConnectionTimeout;
var iPCoDestinationName;
var iMaxWatchDataCapturePts;
var iMaxWatchDataCaptureDays;
var iMaxWatchDataVizDays;
var iMaxTagsHistoricalUpload;
var iSuccessQueueSize;
var oPlantInformationController;
var oDialog;
var sInputSemarchyLocationId;
var iAdminIndex = -1;
var iUserIndex = -1;
var oResourceBundle;
var bShowCommentDialog = true;
/*****Below Variables are for Restore functionality******/
var oCurrentControl;
var sCurrentColumnName;
var iCurrentControlCount;
var arrCurrentItems;
var sCurrentLabel;
var sTagCatalogTable = "SE_PLANT";
var sTagCatalogWatchPCoDestTable = "SE_PCO_DESTINATION";

var parameterData;
var Maximum_Tags_per_Agent_Min;
var Maximum_Tags_per_Agent_Max;
var Maximum_Tags_per_Agent_Default;
let parameterValues = {};

/******************************************************/
sap.ui.define([
    "../controller/BaseController",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/ui/model/Filter",
	 "sap/m/MessageBox",
], function (BaseController, Dialog, Button, Text, MessageToast, Popover, Filter, MessageBox) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.PlantInformation", {
        onInit: function () {
	// set message manager model
			 var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
			
			 $.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PlantParameter/Query/PlantParameterDefaultValueSelectQuery&Content-Type=text/json",
				data: {},
				async: false,
				success: function (data) {
					if (data.Rowsets.FatalError !== undefined) {
						this.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"), oResourceBundle.getText("plantInfoPlantHierarchySuggModelLoad"), data.Rowsets.FatalError, "Error");
					} else if (data.Rowsets.Rowset[0]) {
						data = data.Rowsets.Rowset[0];

						const parameters = [
							"Maximum_Tags_per_Agent", "Job_Duration", "Maximum_Tags_per_Job", "Flow_Timeout", 
							"Max_Message_Size", "Success_Queue_Size", "Max_Historical_Upload_Tags" ,"MDM_Location_Name", "Max_Queue_Retry", 
							"Max_Queue_Row_Count_Retry", "Destination", "Max_Watch_Data_Capture_Points", 
							"Max_Watch_Data_Capture_Days", "Max_Watch_Data_Visualization_Days", "Audit_Log_Retention"
						];

						parameters.forEach(param => {
							let parameterData = data.Row.find(row => row.PARAMETER === param);
							if (parameterData) {
								parameterValues[param] = {
									Min: parameterData.MIN,
									Max: parameterData.MAX,
									Default: parameterData.DEFAULT
								};
							}
						});
						console.log(parameterValues);
					}
				}.bind(this)
			});
			
			oPlantInformationController = this;
				oDialog = this.getView().byId("BusyDialog");
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("PlantInformation").attachPatternMatched(this._onObjectMatched, this);
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
            oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            /******************** Below Part for Authorisation***********************/
            var sRoles = document.getElementById('input-roles').value;
            var sAdminRole = "STREAMING_ENGINE_ADMIN";
            var sUserRole = "STREAMING_ENGINE_USER";
            iAdminIndex = sRoles.indexOf(sAdminRole);
            iUserIndex = sRoles.indexOf(sUserRole);
            if (iAdminIndex < 0) {
                this.fnShowNoAccess();
                return;
            } else {
                this.getView().byId("page-plant-information").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitlePlantInformation"));
            var sNewPlantLabel = oResourceBundle.getText("plantInfoNewPlant");
            sMode = oEvent.getParameter("arguments").MODE;

            if (sMode == "U") {
                sPlantID = oEvent.getParameter("arguments").ID_PLANT;
                var sPlantDescription = oEvent.getParameter("arguments").DS_NAME;
                var iMaxTagsPerJobs = oEvent.getParameter("arguments").QT_MAX_TAGS_PER_JOBS;
                var iMaxTagsPerAgents = oEvent.getParameter("arguments").QT_MAX_TAGS_PER_AGENTS;
                var iRunDuration = oEvent.getParameter("arguments").QT_RUN_DURATION_IN_MINS;
                //var iFlowMaxFileSize = oEvent.getParameter("arguments").QT_FLOW_MAX_FILE_SIZE;
                var iMaxQueueRetry = oEvent.getParameter("arguments").QT_MAX_QUEUE_RETRY;
                var iRowCountRetry = oEvent.getParameter("arguments").QT_ROWCOUNT_RETRY;
                var sSemarchyLocationId = oEvent.getParameter("arguments").DS_SEMARCHY_LOCATION_ID;
                //var iAuditLogRetention = oEvent.getParameter("arguments").QT_AUDIT_LOG_RETENTION;
                var iConnectionTimeout = oEvent.getParameter("arguments").QT_CONNECTION_TIMEOUT;
                var bIsLocal = oEvent.getParameter("arguments").FL_IS_LOCAL;
                iPCoDestinationName = oEvent.getParameter("arguments").DS_PCO_DESTINATION_NAME;
                iMaxWatchDataCapturePts = oEvent.getParameter("arguments").QT_WATCH_MAX_DATA_POINT;
                iMaxWatchDataCaptureDays = oEvent.getParameter("arguments").QT_WATCH_EXP_CAPTURE_DAYS;
                iMaxWatchDataVizDays = oEvent.getParameter("arguments").QT_WATCH_EXP_VISUAL_DAYS;
                iSuccessQueueSize = oEvent.getParameter("arguments").QT_SUCCESS_QUEUE_SIZE;
                iMaxTagsHistoricalUpload = oEvent.getParameter("arguments").QT_HISTORICAL_UPLOAD_MAXIMUM_TAGS;

                if (bRequireChangeComment) {
					
					
                    this.oModelChangeMessages.getData().Row = [
                        { columnName: "DS_NAME", name: oResourceBundle.getText("plantInfoPlantName"), old: sPlantDescription, new: null, message: "" },
                        { columnName: "QT_MAX_TAGS_PER_JOBS", name: oResourceBundle.getText("plantInfoMaxTagsPerJob"), old: iMaxTagsPerJobs, new: null, message: "" },
                        { columnName: "QT_MAX_TAGS_PER_AGENTS", name: oResourceBundle.getText("plantInfoMaxTagsPerAgent"), old: iMaxTagsPerAgents, new: null, message: "" },
                        { columnName: "QT_RUN_DURATION_IN_MINS", name: oResourceBundle.getText("plantInfoJobDuration"), old: iRunDuration, new: null, message: "" },
                        //{ columnName: "QT_FLOW_MAX_FILE_SIZE", name: oResourceBundle.getText("plantParamsFlowMaxFileSizeKB"), old: //iFlowMaxFileSize, new: null, message: "" },
                        { columnName: "QT_MAX_QUEUE_RETRY", name: oResourceBundle.getText("plantParamsMaxQueueRetry"), old: iMaxQueueRetry, new: null, message: "" },
                        { columnName: "QT_ROWCOUNT_RETRY", name: oResourceBundle.getText("plantInfoMaxQueueRowCountRetry"), old: iRowCountRetry, new: null, message: "" },
                        //{ columnName: "QT_AUDIT_LOG_RETENTION", name: oResourceBundle.getText("plantParamsAuditLogRetention"), old: //iAuditLogRetention, new: null, message: "" },
                        { columnName: "QT_FLOW_TIMEOUT", name: oResourceBundle.getText("plantParamsFlowTimeout"), old: iConnectionTimeout, new: null, message: "" },
                        { columnName: "QT_WATCH_MAX_DATA_POINT", name: oResourceBundle.getText("plantInfoMaxWatchDataCapturePoints"), old: iMaxWatchDataCapturePts, new: null, message: "" },
                        { columnName: "QT_WATCH_EXP_CAPTURE_DAYS", name: oResourceBundle.getText("plantInfoMaxWatchDataCaptureDays"), old: iMaxWatchDataCaptureDays, new: null, message: "" },
                        { columnName: "QT_WATCH_EXP_VISUAL_DAYS", name: oResourceBundle.getText("plantInfoMaxWatchDataVizDays"), old: iMaxWatchDataVizDays, new: null, message: "" },
                        { columnName: "DS_SEMARCHY_LOCATION_ID", name: oResourceBundle.getText("plantInfoSemarchyLocationId"), old: sSemarchyLocationId, new: null, message: "" },
                        { columnName: "FL_IS_LOCAL", name: oResourceBundle.getText("plantInfoConnectionToSPB"), old: bIsLocal == "0", new: null, message: "" },
                        { columnName: "DS_PCO_DESTINATION_NAME", name: oResourceBundle.getText("plantInfoWatchPCoDestinations"), old: iPCoDestinationName, new: null, message: "" },
                        { columnName: "QT_SUCCESS_QUEUE_SIZE", name: oResourceBundle.getText("plantInfoSuccessQueueSize"), old: iSuccessQueueSize, new: null, message: "" },
                        { columnName: "QT_HISTORICAL_UPLOAD_MAXIMUM_TAGS", name: oResourceBundle.getText("plantInfoHistoricalUploadMaximumTags"), old: iMaxTagsHistoricalUpload, new: null, message: "" }
                    ];
                }

                this.getView().byId("input-plant-id").setEnabled(false);
                this.getView().byId("button-delete").setVisible(true);
                this.getView().byId("input-plant-id").setValue(sPlantID);
                // this.getView().byId("attribute-plant-name").setText(sPlantDescription);
                this.getView().byId("object-header-plant-info").setTitle(sPlantDescription);
                // this.getView().byId("attribute-plant-name").setVisible(true);
                this.getView().byId("input-plant-description").setValue(sPlantDescription);
                this.getView().byId("input-max-tags-per-job").setValue(iMaxTagsPerJobs);
                this.getView().byId("input-max-tags-per-agent").setValue(iMaxTagsPerAgents);
                this.getView().byId("input-job-duration").setValue(iRunDuration);
                //this.getView().byId("input-job-catchup-multiplier").setValue(iFlowMaxFileSize);
                this.getView().byId("input-max-query-retry").setValue(iMaxQueueRetry);
                this.getView().byId("input-max-queue-rowcount-retry").setValue(iRowCountRetry);
                this.getView().byId("input-semarchy-location-id").setValue(sSemarchyLocationId);
                //this.getView().byId("input-audit-log-retention").setValue(iAuditLogRetention);
                this.getView().byId("input-connection-timeout").setValue(iConnectionTimeout);
                this.getView().byId("input-watch-pco-dest-name").setValue(iPCoDestinationName);
                this.getView().byId("input-max-watch-data-capture-points").setValue(iMaxWatchDataCapturePts);
                this.getView().byId("input-max-watch-data-capture-days").setValue(iMaxWatchDataCaptureDays);
                this.getView().byId("input-max-watch-data-viz-days").setValue(iMaxWatchDataVizDays);
                this.getView().byId("switch-connection-to-spb").setState(bIsLocal == "0");
                this.getView().byId("input-success-queue-size").setValue(iSuccessQueueSize);
                this.getView().byId("input-Historical-Max-Tags").setValue(iMaxTagsHistoricalUpload);

                /********************Below are Restore Buttons********************/
                sTagCatalogTable = "SE_PLANT";
                this.getView().byId("button-restore-plant-name").setVisible(true);
                this.getView().byId("button-restore-max-tags-per-job").setVisible(true);
                this.getView().byId("button-restore-max-tags-per-agent").setVisible(true);
                this.getView().byId("button-restore-job-duration").setVisible(true);
                this.getView().byId("button-restore-semarchy-location-id").setVisible(true);
                //this.getView().byId("button-restore-job-catchup-multiplier").setVisible(true);
                this.getView().byId("button-restore-connection-timeout").setVisible(true);
                //this.getView().byId("button-restore-audit-log-retention").setVisible(true);
                this.getView().byId("button-restore-max-queue-rowcount-retry").setVisible(true);
                this.getView().byId("button-restore-max-query-retry").setVisible(true);
                this.getView().byId("button-restore-success-queue-size").setVisible(true);
                //Added for Watch Feature
                this.getView().byId("button-restore-watch-pco-dest").setVisible(false);
                this.getView().byId("button-restore-max-watch-data-capture-pts").setVisible(true);
                this.getView().byId("button-restore-max-watch-data-capture-days").setVisible(true);
                this.getView().byId("button-restore-max-watch-data-viz-days").setVisible(true);
                this.getView().byId("button-restore-Historical-Max-Tags").setVisible(true);

                /*****************************************************************/

            } else if (sMode == "I") {
                this.getView().byId("button-delete").setVisible(false);
                this.getView().byId("input-plant-id").setEnabled(true);
                this.getView().byId("input-plant-id").setValue("");
                // this.getView().byId("attribute-plant-name").setText("");
                this.getView().byId("object-header-plant-info").setTitle(sNewPlantLabel);
                // this.getView().byId("attribute-plant-name").setVisible(false);
                this.getView().byId("input-plant-description").setValue("");
                this.getView().byId("input-max-tags-per-job").setValue(parameterValues.Maximum_Tags_per_Job.Default);
                this.getView().byId("input-max-tags-per-agent").setValue(parameterValues.Maximum_Tags_per_Agent.Default);
                this.getView().byId("input-job-duration").setValue(parameterValues.Job_Duration.Default);
                //this.getView().byId("input-job-catchup-multiplier").setValue(parameterValues.Max_Message_Size.Default);
                this.getView().byId("input-max-query-retry").setValue(parameterValues.Max_Queue_Retry.Default);
                this.getView().byId("input-max-queue-rowcount-retry").setValue(parameterValues.Max_Queue_Row_Count_Retry.Default);
                this.getView().byId("input-semarchy-location-id").setValue("");
                //this.getView().byId("input-audit-log-retention").setValue(parameterValues.Audit_Log_Retention.Default);
                this.getView().byId("input-connection-timeout").setValue(parameterValues.Flow_Timeout.Default);
                this.getView().byId("input-watch-pco-dest-name").setValue("");
                this.getView().byId("input-max-watch-data-capture-points").setValue(parameterValues.Max_Watch_Data_Capture_Points.Default);
                this.getView().byId("input-max-watch-data-capture-days").setValue(parameterValues.Max_Watch_Data_Capture_Days.Default);
                this.getView().byId("input-max-watch-data-viz-days").setValue(parameterValues.Max_Watch_Data_Visualization_Days.Default);
                this.getView().byId("switch-connection-to-spb").setState(false);
                this.getView().byId("input-success-queue-size").setValue(parameterValues.Success_Queue_Size.Default);
                this.getView().byId("input-Historical-Max-Tags").setValue(parameterValues.Max_Historical_Upload_Tags.Default);

                /********************Below are Restore Buttons********************/
                this.getView().byId("button-restore-plant-name").setVisible(false);
                this.getView().byId("button-restore-max-tags-per-job").setVisible(false);
                this.getView().byId("button-restore-max-tags-per-agent").setVisible(false);
                this.getView().byId("button-restore-job-duration").setVisible(false);
                this.getView().byId("button-restore-semarchy-location-id").setVisible(false);
                //this.getView().byId("button-restore-job-catchup-multiplier").setVisible(false);
                this.getView().byId("button-restore-connection-timeout").setVisible(false);
                //this.getView().byId("button-restore-audit-log-retention").setVisible(false);
                this.getView().byId("button-restore-max-queue-rowcount-retry").setVisible(false);
                this.getView().byId("button-restore-max-query-retry").setVisible(false);
                this.getView().byId("button-restore-success-queue-size").setVisible(false);
                //Added for Watch Feature
                this.getView().byId("button-restore-watch-pco-dest").setVisible(false);
                this.getView().byId("button-restore-max-watch-data-capture-pts").setVisible(false);
                this.getView().byId("button-restore-max-watch-data-capture-days").setVisible(false);
                this.getView().byId("button-restore-max-watch-data-viz-days").setVisible(false);
                this.getView().byId("button-restore-Historical-Max-Tags").setVisible(false);

                /*****************************************************************/
            }

            /******************PlantHierarchySuggestionsModel*****************/
            var oModelPlantHierarchySuggestions = new sap.ui.model.json.JSONModel();
            this.getView().byId("input-semarchy-location-id").setModel(oModelPlantHierarchySuggestions);
            this.getView().byId("input-semarchy-location-id").setFilterFunction(function (sQuery, oColumn) {
                var oData = oColumn.getModel().getProperty(oColumn.getBindingContextPath());
                var bSwitchSPB = oPlantInformationController.getView().byId("switch-connection-to-spb").getState();
                if (bSwitchSPB ^ oData.ID_PLANT_HIERARCHY.startsWith("MAN_")) {
                    for (var k in oData) {
                        if (oData[k].match(new RegExp(sQuery, 'i'))) {
                            return true;
                        }
                    }
                }
                return false;
            })
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PlantHierarchy/Query/PlantHierarchyByTypeSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": 'loc',
                    "Param.2": '1'
                },
                success: function (data) {
                    if (data.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"), oResourceBundle.getText("plantInfoPlantHierarchySuggModelLoad"), data.Rowsets.FatalError, "Error");
                    } else if (data.Rowsets.Rowset[0]) {
                        data = data.Rowsets.Rowset[0];
                        data.spb = data.Row.filter(v => !v.ID_PLANT_HIERARCHY.startsWith("MAN_"));
                        data.man = data.Row.filter(v => v.ID_PLANT_HIERARCHY.startsWith("MAN_"));
                        oModelPlantHierarchySuggestions.setData(data);
                        oModelPlantHierarchySuggestions.refresh();
                    }
                }
            })
            /*****************************************************************/

        },
        fnValidateInputs: function () {
            var bValidInputs = true;
            sInputPlantId = this.getView().byId("input-plant-id").getValue();
            sInputPlantDescription = this.getView().byId("input-plant-description").getValue();
            sInputMaxTagsPerJob = this.getView().byId("input-max-tags-per-job").getValue();
            sInputMaxTagsPerAgent = this.getView().byId("input-max-tags-per-agent").getValue();
            sInputJobDuration = this.getView().byId("input-job-duration").getValue();
            //sInputJobFlowMaxFileSize = this.getView().byId("input-job-catchup-multiplier").getValue();
            sInputMaxQueryRetry = this.getView().byId("input-max-query-retry").getValue();
            iInputMaxQueueRowCountRetry = this.getView().byId("input-max-queue-rowcount-retry").getValue();
            sInputSemarchyLocationId = this.getView().byId("input-semarchy-location-id").getValue();
            //iInputAuditLogRetention = this.getView().byId("input-audit-log-retention").getValue();
            iInputConnectionTimeout = this.getView().byId("input-connection-timeout").getValue();
            iPCoDestinationName = this.getView().byId("input-watch-pco-dest-name").getValue();
            iMaxWatchDataCapturePts = this.getView().byId("input-max-watch-data-capture-points").getValue();
            iMaxWatchDataCaptureDays = this.getView().byId("input-max-watch-data-capture-days").getValue();
            iMaxWatchDataVizDays = this.getView().byId("input-max-watch-data-viz-days").getValue();
            iSuccessQueueSize = this.getView().byId("input-success-queue-size").getValue();
            iMaxTagsHistoricalUpload = this.getView().byId("input-Historical-Max-Tags").getValue();
			
			 
			
            

            if (iInputConnectionTimeout == "" || iInputConnectionTimeout < parameterValues.Flow_Timeout.Min || iInputConnectionTimeout> parameterValues.Flow_Timeout.Max ) {
                bValidInputs = false;
                this.getView().byId("input-connection-timeout").setValueState("Error");
				MessageBox.error("Please enter 'Flow Timeout (Secs)' data within the range of Min: " + parameterValues.Flow_Timeout.Min + " and Max: " + parameterValues.Flow_Timeout.Max + ".");
            } else {
                this.getView().byId("input-connection-timeout").setValueState("None");
            }

            if (sInputSemarchyLocationId == "" ) {
                bValidInputs = false;
                this.getView().byId("input-semarchy-location-id").setValueState("Error");
            } else {
                this.getView().byId("input-semarchy-location-id").setValueState("None");
            }

            if (sInputPlantId.length < 3) {
                bValidInputs = false;
                this.getView().byId("input-plant-id").setValueState("Error");
            } else {
                this.getView().byId("input-plant-id").setValueState("None");
            }

            if (sInputPlantDescription == "") {
                bValidInputs = false;
                this.getView().byId("input-plant-description").setValueState("Error");
				
            } else {
                this.getView().byId("input-plant-description").setValueState("None");
            }

            if (sInputMaxTagsPerJob == "" || sInputMaxTagsPerJob < parameterValues.Maximum_Tags_per_Job.Min || sInputMaxTagsPerJob> parameterValues.Maximum_Tags_per_Job.Max ) {
                bValidInputs = false;
                this.getView().byId("input-max-tags-per-job").setValueState("Error");
				MessageBox.error("Please enter 'Maximum Tags per Job' data within the range of Min: " + parameterValues.Maximum_Tags_per_Job.Min + " and Max: " + parameterValues.Maximum_Tags_per_Job.Max + ".");
            } else {
                this.getView().byId("input-max-tags-per-job").setValueState("None");
            }

            if (sInputMaxTagsPerAgent == "" || sInputMaxTagsPerAgent < parameterValues.Maximum_Tags_per_Agent.Min || sInputMaxTagsPerAgent> parameterValues.Maximum_Tags_per_Agent.Max  ) {
                bValidInputs = false;
                this.getView().byId("input-max-tags-per-agent").setValueState("Error");
				
				MessageBox.error("Please enter 'Maximum Tags per Agent' data within the range of Min: " + parameterValues.Maximum_Tags_per_Agent.Min + " and Max: " + parameterValues.Maximum_Tags_per_Agent.Max + ".");
            } else {
                this.getView().byId("input-max-tags-per-agent").setValueState("None");
            }

            if (sInputJobDuration == "" || sInputJobDuration < parameterValues.Job_Duration.Min || sInputJobDuration> parameterValues.Job_Duration.Max ) {
                bValidInputs = false;
                this.getView().byId("input-job-duration").setValueState("Error");
				MessageBox.error("Please enter 'Job Duration (min)' data within the range of Min: " + parameterValues.Job_Duration.Min + " and Max: " + parameterValues.Job_Duration.Max + ".");
            } else {
                this.getView().byId("input-job-duration").setValueState("None");
            }

            
            if (sInputMaxQueryRetry == "" || sInputMaxQueryRetry < parameterValues.Max_Queue_Retry.Min || sInputMaxQueryRetry> parameterValues.Max_Queue_Retry.Max ) {
                bValidInputs = false;
                this.getView().byId("input-max-query-retry").setValueState("Error");
				MessageBox.error("Please enter 'Max Queue Retry' data within the range of Min: " + parameterValues.Max_Queue_Retry.Min + " and Max: " + parameterValues.Max_Queue_Retry.Max + ".");
            } else {
                this.getView().byId("input-max-query-retry").setValueState("None");
            }
            if (iInputMaxQueueRowCountRetry == "" || iInputMaxQueueRowCountRetry < parameterValues.Max_Queue_Row_Count_Retry.Min || iInputMaxQueueRowCountRetry> parameterValues.Max_Queue_Row_Count_Retry.Max ) {
                bValidInputs = false;
                this.getView().byId("input-max-queue-rowcount-retry").setValueState("Error");
				MessageBox.error("Please enter 'Max Queue Row Count Retry' data within the range of Min: " + parameterValues.Max_Queue_Row_Count_Retry.Min + " and Max: " + parameterValues.Max_Queue_Row_Count_Retry.Max + ".");
            } else {
                this.getView().byId("input-max-queue-rowcount-retry").setValueState("None");
            }

            if (iPCoDestinationName == "" ) {
                bValidInputs = false;
                this.getView().byId("input-watch-pco-dest-name").setValueState("Error");
            } else {
                this.getView().byId("input-watch-pco-dest-name").setValueState("None");
            }

            if (iMaxWatchDataCapturePts == "" || iMaxWatchDataCapturePts < parameterValues.Max_Watch_Data_Capture_Points.Min || iMaxWatchDataCapturePts> parameterValues.Max_Watch_Data_Capture_Points.Max ) {
                bValidInputs = false;
                this.getView().byId("input-max-watch-data-capture-points").setValueState("Error");
				MessageBox.error("Please enter 'Max Watch Data Capture Points' data within the range of Min: " + parameterValues.Max_Watch_Data_Capture_Points.Min + " and Max: " + parameterValues.Max_Watch_Data_Capture_Points.Max + ".");
            } else {
                this.getView().byId("input-max-watch-data-capture-points").setValueState("None");
            }

            if (iMaxWatchDataCaptureDays == "" || iMaxWatchDataCaptureDays < parameterValues.Max_Watch_Data_Capture_Days.Min || iMaxWatchDataCaptureDays> parameterValues.Max_Watch_Data_Capture_Days.Max ) {
                bValidInputs = false;
                this.getView().byId("input-max-watch-data-capture-days").setValueState("Error");
				MessageBox.error("Please enter 'Max Watch Data Capture Days' data within the range of Min: " + parameterValues.Max_Watch_Data_Capture_Days.Min + " and Max: " + parameterValues.Max_Watch_Data_Capture_Days.Max + ".");
            } else {
                this.getView().byId("input-max-watch-data-capture-days").setValueState("None");
            }

            if (iMaxWatchDataVizDays == "" || iMaxWatchDataVizDays < parameterValues.Max_Watch_Data_Visualization_Days.Min || iMaxWatchDataVizDays> parameterValues.Max_Watch_Data_Visualization_Days.Max ) {
                bValidInputs = false;
                this.getView().byId("input-max-watch-data-viz-days").setValueState("Error");
				MessageBox.error("Please enter 'Max Watch Data Visualisation Days' data within the range of Min: " + parameterValues.Max_Watch_Data_Visualization_Days.Min + " and Max: " + parameterValues.Max_Watch_Data_Visualization_Days.Max + ".");
            } else {
                this.getView().byId("input-max-watch-data-viz-days").setValueState("None");
            }

            if (iSuccessQueueSize == "" || iSuccessQueueSize < parameterValues.Success_Queue_Size.Min || iSuccessQueueSize> parameterValues.Success_Queue_Size.Max ) {
                bValidInputs = false;
                this.getView().byId("input-success-queue-size").setValueState("Error");
				MessageBox.error("Please enter 'Success Queue Size' data within the range of Min: " + parameterValues.Success_Queue_Size.Min + " and Max: " + parameterValues.Success_Queue_Size.Max + ".");
            } else {
                this.getView().byId("input-success-queue-size").setValueState("None");
            }

                        if (iMaxTagsHistoricalUpload == "" || iMaxTagsHistoricalUpload < parameterValues.Max_Historical_Upload_Tags.Min || iMaxTagsHistoricalUpload> parameterValues.Max_Historical_Upload_Tags.Max ) {
                bValidInputs = false;
                this.getView().byId("input-Historical-Max-Tags").setValueState("Error");
				MessageBox.error("Please enter 'Maximum Tags per Historical Upload' within the range of Min: " + parameterValues.Max_Historical_Upload_Tags.Min + " and Max: " + parameterValues.Max_Historical_Upload_Tags.Max + ".");
            } else {
                this.getView().byId("input-Historical-Max-Tags").setValueState("None");
            }

            return bValidInputs;

        },
        fnSavePlantInformation: function () {
            if (sMode == "I") {
                sAction = "INSERT";
            } else if (sMode == "U") {
                sAction = "UPDATE";
            }
            this.fnAddUpdatePlantInformation();
        },
        fnDeletePlant: function () {
            var sConfirmTitle = oResourceBundle.getText("commonConfirm");
            var sConfirmYes = oResourceBundle.getText("commonYes");
            var sConfirmNo = oResourceBundle.getText("commonNo");
            var sConfirmMessage = oResourceBundle.getText("plantInfoDeleteConfirmation");
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
                        oPlantInformationController.fnDeletePlantInformation();
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

        fnAddUpdatePlantInformation: function () {
            var bIsValid = this.fnValidateInputs();
            if (bIsValid) {
                if (!this.fnValidateLocationHierarchy()) {
                    return;
                }
                var bIsLocal = !this.getView().byId("switch-connection-to-spb").getState();
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
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PlantParameter/Query/PlantParameterXacuteQuery&Content-Type=text/json",
                    data: {
                        "Param.1": sAction,
                        "Param.2": sInputPlantId,
                        "Param.3": sInputPlantDescription,
                        "Param.4": sInputJobDuration,
                        "Param.5": sInputMaxTagsPerAgent,
                        "Param.6": sInputMaxTagsPerJob,
                        "Param.7": sInputMaxQueryRetry,
                        "Param.8": iInputMaxQueueRowCountRetry,
                        "Param.9": parameterValues.Max_Message_Size.Default,
                        "Param.10": sInputSemarchyLocationId,
                        "Param.11": parameterValues.Audit_Log_Retention.Default,
                        "Param.12": iInputConnectionTimeout,
                        "Param.13": iPCoDestinationName,
                        "Param.14": iMaxWatchDataCapturePts,
                        "Param.15": iMaxWatchDataCaptureDays,
                        "Param.16": iMaxWatchDataVizDays,
                        "Param.17": bIsLocal,
                        "Param.18": iSuccessQueueSize,
                        "Param.19": iMaxTagsHistoricalUpload,
                        "Param.20": document.getElementById("SE_Plant").value,
                        "Param.30": aCommentColumnName.join("\n"),
                        "Param.31": aCommentMessage.join("\n")
                    },
                    success: function (result) {
                        if (result.Rowsets.Rowset) {
                            var data = result.Rowsets.Rowset[0];
                            var successMsg = data.Row[0].Output;
                            if (successMsg == "{##SUCCESS_MESSAGE}") {
                                successMsg = oResourceBundle.getText("plantInfoSaveSuccess");
                            }
                            that.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"),
                                oResourceBundle.getText("plantInfoSaveMsg"),
                                successMsg,
                                "Success");
                            //MessageToast.show(successMsg);
                            oPlantInformationController.fnNavigateBackAndReload();
                        } else if (result.Rowsets.FatalError !== undefined) {
                            var errorMsg = result.Rowsets.FatalError;
                            that.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"),
                                oResourceBundle.getText("plantInfoSaveMsg"),
                                errorMsg,
                                "Error");
                            //MessageToast.show(errorMsg);
                        }
                        oDialog.close();
                    }
                });
            }
        },

        fnDeletePlantInformation: function () {
            var that = this;
            oDialog.open();
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PlantParameter/Query/PlantParameterXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sAction,
                    "Param.2": sPlantID,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.Rowset) {
                        var data = result.Rowsets.Rowset[0];
                        var successMsg = data.Row[0].Output;
                        if (successMsg == "{##SUCCESS_MESSAGE}") {
                            successMsg = oResourceBundle.getText("plantInfoDeleteSuccess");
                            that.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"),
                                oResourceBundle.getText("plantInfoDeleteMsg"),
                                successMsg,
                                "Success");
                        }
                        oDialog.close();
                        //MessageToast.show(successMsg);
                        oPlantInformationController.fnNavigateBackAndReload();
                    } else if (result.Rowsets.FatalError !== undefined) {
                        var errorMsg = result.Rowsets.FatalError;
                        oDialog.close();
                        that.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"),
                            oResourceBundle.getText("plantInfoDeleteMsg"),
                            errorMsg,
                            "Error");
                        //MessageToast.show(errorMsg);
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
                    if (sSelectedValue == 1) {
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
            var sTableName = sTagCatalogTable;
            if (sCurrentColumnName == "DS_PCO_DESTINATION_NAME") {
                sTableName = sTagCatalogWatchPCoDestTable;
            }
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/AuditLog/Query/AuditLogRestoreValueSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sTableName,
                    "Param.2": sCurrentColumnName,
                    "Param.3": sPlantID
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        that.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"),
                            oResourceBundle.getText("plantInfoRestoreValueMsg"),
                            sErrorMessage,
                            "Error");
                        //MessageToast.show(sErrorMessage);
                        oDialog.close();
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oPlantInformationController.oModelRestoreValue.setData(data);
                        oPlantInformationController.oModelRestoreValue.refresh();
                        oDialog.close();
                    }

                }
            });
        },
        /*****************************************************************************/
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("PlantParameters", {
                Refresh: "N"
            });

        },
        fnNavigateBackAndReload: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("PlantParameters", {
                Refresh: "Y"
            });

        },
        fnHierarchyDialog: function (oEvent) {
            sap.ui.require(["sap/ui/comp/valuehelpdialog/ValueHelpDialog"]);

            var bSwitchSPB = oPlantInformationController.getView().byId("switch-connection-to-spb").getState();
            var oSuggestDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                title: oResourceBundle.getText("plantInfoSemarchyLocationId"),
                supportMultiselect: false,
                key: "ID_PLANT_HIERARCHY"
            })
            this.getView().addDependent(oSuggestDialog);
            var oInput = oEvent.oSource;
            var oModel = oInput.getModel();
            var oTable = oSuggestDialog.getTable();
            oTable.setTitle("")
            oTable.setModel(oModel);
            oTable.bindRows(bSwitchSPB ? "/spb" : "/man");
            oTable.addColumn(new sap.ui.table.Column({
                label: new sap.m.Label({ text: oResourceBundle.getText("plantInfoLocationSiteID") }),
                template: new sap.m.Label({ text: "{ID_PLANT_HIERARCHY}" }),
                width: "30%"
            }))
            oTable.addColumn(new sap.ui.table.Column({
                label: new sap.m.Label({ text: oResourceBundle.getText("plantInfoLocationShortLabel") }),
                template: new sap.m.Label({ text: "{DS_NAME}" }),
                width: "30%"
            }))
            oTable.addColumn(new sap.ui.table.Column({
                label: new sap.m.Label({ text: oResourceBundle.getText("plantInfoLocationDescription") }),
                template: new sap.m.Label({ text: "{DS_DESCRIPTION}" }),
                width: "40%"
            }))
            oTable.addExtension(new sap.m.SearchField({
                showSearchButton: false,
                liveChange: function (oEvent) {
                    var sQuery = oEvent.getParameter("newValue");
                    var oFilter = null;
                    if (sQuery) {
                        oFilter = new sap.ui.model.Filter([
                            new sap.ui.model.Filter("ID_PLANT_HIERARCHY", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("DS_NAME", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("DS_DESCRIPTION", sap.ui.model.FilterOperator.Contains, sQuery)
                        ])
                    }
                    oTable.getBinding().filter(oFilter)
                }
            }))
            oSuggestDialog.attachCancel(function (oEvent) {
                oEvent.oSource.close();
            })
            oSuggestDialog.attachOk(function (oEvent) {
                oInput.setValue(oEvent.getParameter("tokens")[0].getKey());
                oEvent.oSource.close();
            })
            oSuggestDialog.attachAfterClose(function (oEvent) {
                oEvent.oSource.destroy();
            })
            oSuggestDialog.update();
            oSuggestDialog.open();
        },
        fnValidateLocationHierarchy: function () {
            sap.ui.require(["sap/m/MessageBox"]);
            // var bSwitchSPB = this.getView().byId("switch-connection-to-spb").getState();
            var oInput = this.getView().byId("input-semarchy-location-id");
            var sLocation = oInput.getValue();
            var aLocationsHierarchy = oInput.getModel().getProperty(/*bSwitchSPB ? "/spb" : */"/man") || [];
            if (aLocationsHierarchy.find(e => e.ID_PLANT_HIERARCHY === sLocation)) {
                oInput.setValueState("None");
                return true;
            } else {
                sap.m.MessageBox.error(oResourceBundle.getText("plantInfoBadLocationText"), {
                    title: oResourceBundle.getText("plantInfoBadLocationError")
                });
                oInput.setValueState("Error");
                return false;
            }
            /*if (bSwitchSPB) {
                sap.m.MessageBox.error(oResourceBundle.getText("plantInfoBadLocationText"), {
                    title: oResourceBundle.getText("plantInfoBadLocationError")
                });
                oInput.setValueState("Error");
                //add the error msg to the message popover
                var oMsgText = oResourceBundle.getText("plantInfoBadLocationError") + ". " + oResourceBundle.getText("plantInfoBadLocationText") + "!";
                this.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"),
                    oResourceBundle.getText("plantInfoBadLocationError"),
                    oMsgText,
                    "Error");
                return false;
            } else {
                sLocation = sLocation.toUpperCase();
                var sSiteID, sShortLabel, sDescription;
                var that = this;
                if (sLocation.startsWith("MAN_") && sLocation.length == 7) {
                    sSiteID = sLocation;
                    sShortLabel = sLocation.substr(4);
                } else {
                    oInput.setValueState("Error");
                    return false;
                }
                sDescription = "Location " + sShortLabel;
                sap.m.MessageBox.confirm(`'${sSiteID}' ${oResourceBundle.getText("plantInfoNewLocationText")}`, {
                    title: oResourceBundle.getText("plantInfoNewLocation"),
                    onClose: function (sActionClicked) {
                        if (sActionClicked === sap.m.MessageBox.Action.OK) {
                            oInput.setValue(sSiteID);
                            if (aLocationsHierarchy.find(e => e.ID_PLANT_HIERARCHY === sSiteID)) { // Second check to avoid conflicts
                                oInput.setValueState("None");
                                return
                            }
                            $.ajax({
                                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PlantHierarchy/Query/PlantHierarchyInsertQuery&Content-Type=text/json",
                                data: {
                                    "Param.1": sSiteID,
                                    "Param.2": "",
                                    "Param.3": sShortLabel,
                                    "Param.4": sDescription,
                                    "Param.5": "loc",
                                    "Param.6": "MANUAL",
                                    "Param.7": "MANUAL",
                                    "Param.8": "1",
                                    "Param.9": new Date().toISOString().split(".")[0]
                                },
                                success: function (data) {
                                    if (data.Rowsets.FatalError !== undefined) {
                                        //MessageToast.show(data.Rowsets.FatalError);
                                        that.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"),
                                            oResourceBundle.getText("plantInfoLocationInsert"),
                                            data.Rowsets.FatalError,
                                            "Error");
                                        oInput.setValueState("Error");
                                    } else {
                                        var newLoc, oModel = oInput.getModel();
                                        //MessageToast.show(oResourceBundle.getText("plantInfoLocationSuccess"));
                                        that.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"),
                                            oResourceBundle.getText("plantInfoLocationInsert"),
                                            oResourceBundle.getText("plantInfoLocationSuccess"),
                                            "Success");
                                        sInputSemarchyLocationId = sSiteID;
                                        oInput.setValueState("None");
                                        newLoc = {
                                            ID_PLANT_HIERARCHY: sSiteID,
                                            DS_NAME: sShortLabel,
                                            DS_DESCRIPTION: sDescription
                                        }
                                        aLocationsHierarchy.push(newLoc);
                                        oModel.getData().Row.push(newLoc);
                                        oModel.refresh()
                                        oPlantInformationController.fnAddUpdatePlantInformation();
                                    }
                                }
                            });

                        } else {
                            oInput.setValueState("Error");
                        }
                    }
                });
                return false;
            }*/
        },
        fnValidateChangeComments: function () {
            var oChangeTracker = this.oModelChangeMessages.getData();
            //oChangeTracker.fnUpdateNewValue("QT_AUDIT_LOG_RETENTION", iInputAuditLogRetention);
            oChangeTracker.fnUpdateNewValue("QT_FLOW_TIMEOUT", iInputConnectionTimeout);
            oChangeTracker.fnUpdateNewValue("DS_SEMARCHY_LOCATION_ID", sInputSemarchyLocationId);
            oChangeTracker.fnUpdateNewValue("DS_NAME", sInputPlantDescription);
            oChangeTracker.fnUpdateNewValue("QT_MAX_TAGS_PER_JOBS", sInputMaxTagsPerJob);
            oChangeTracker.fnUpdateNewValue("QT_MAX_TAGS_PER_AGENTS", sInputMaxTagsPerAgent);
            oChangeTracker.fnUpdateNewValue("QT_RUN_DURATION_IN_MINS", sInputJobDuration);
            //oChangeTracker.fnUpdateNewValue("QT_FLOW_MAX_FILE_SIZE", sInputJobFlowMaxFileSize);
            oChangeTracker.fnUpdateNewValue("QT_MAX_QUEUE_RETRY", sInputMaxQueryRetry);
            oChangeTracker.fnUpdateNewValue("QT_ROWCOUNT_RETRY", iInputMaxQueueRowCountRetry);
            oChangeTracker.fnUpdateNewValue("DS_PCO_DESTINATION_NAME", iPCoDestinationName);
            oChangeTracker.fnUpdateNewValue("QT_WATCH_MAX_DATA_POINT", iMaxWatchDataCapturePts);
            oChangeTracker.fnUpdateNewValue("QT_WATCH_EXP_CAPTURE_DAYS", iMaxWatchDataCaptureDays);
            oChangeTracker.fnUpdateNewValue("QT_WATCH_EXP_VISUAL_DAYS", iMaxWatchDataVizDays);
            oChangeTracker.fnUpdateNewValue("QT_SUCCESS_QUEUE_SIZE", iSuccessQueueSize);
            oChangeTracker.fnUpdateNewValue("QT_HISTORICAL_UPLOAD_MAXIMUM_TAGS", iMaxTagsHistoricalUpload);
            oChangeTracker.fnUpdateNewValue("FL_IS_LOCAL", this.getView().byId("switch-connection-to-spb").getState());
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
                        oPlantInformationController.fnAddUpdatePlantInformation();
                        oChangeCommentDialog.close()
                    } else {
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"))
                        that.handleMessage(oResourceBundle.getText("commonTitlePlantInformation"),
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
                    oChangeCommentDialog.close()
                }
            }));
            oChangeCommentDialog.setModel(this.oModelChangeMessages);
            oChangeCommentDialog.open();
        }
    });
});
//# sourceURL=https://sapdqnjc.pharma.aventis.com:50001/XMII/CM/StreamingEngine/StreamingEngine/controller/PlantInformation.controller.js?eval