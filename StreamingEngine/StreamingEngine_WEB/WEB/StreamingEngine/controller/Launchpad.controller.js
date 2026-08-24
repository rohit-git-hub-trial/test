/*-----------------------------------------------------------------------------------
Streaming Engine - Launchpad
Creation Date: 2020.04.27 / By: E0445955
Reference Document: 
Description: Launchpad of Streaming Engine, which will have tiles using which user can 
navigate to differet pages of the solution
-------------------------------------------------------------------------------------*/
var oDialog;
var oLaunchPadController;
var iPlants = 0;
var iDataSources = 0;
var iArchiveFlowEnabled = 0;
var iFileFlowEnabled = 0;
var iContextualEnabled = 0;
var iJobsRunning = 0;
var iJobsError = 0;
var iJobsAll = 0;
var iQueuePending = 0;
var iQueueExpired = 0;
var iQueueAll = 0;
var iLogAll = 0;
var iTagsEnabled = 0;
var iEquipmentMapped = 0;
var iFilesInProcess = 0;
var iTagsAssignedApp = 0;
var iTagsAll = 0;
var iLogchanges24h = 0;
var iFlowRealtimeAgentsRunning = 0;
var iFlowRealtimeAgentsError = 0;
var iFlowRealtimeAgentsAll = 0;
var iDataDestinations = 0;
var iDataFlowExternal = 0;
var iUsers = 0;
var oResourceBundle;
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/Popover",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Text",
], function (Controller, MessageToast, Popover, Button, Dialog, Text) {
	"use strict";

	return Controller.extend("StreamingEngine.StreamingEngine.controller.Launchpad", {
		onInit: function () {
			oLaunchPadController = this;
			oDialog = this.getView().byId("BusyDialog");

			/******************** Below Part for Authorisation***********************/
			var sRoles = document.getElementById('input-roles').value;
			this.getView().byId("panel-admin").setVisible(false);
			this.getView().byId("panel-bso").setVisible(false);
			this.getView().byId("panel-configuration").setVisible(false);
			this.getView().byId("panel-monitoring").setVisible(false);
			var sAdminRole = "STREAMING_ENGINE_ADMIN";
			var sBsoRole = "STREAMING_ENGINE_BUSINESS_OWNER";
			var sUserRole = "STREAMING_ENGINE_USER";
			var iAdminIndex = sRoles.indexOf(sAdminRole);
			var iBsoIndex = sRoles.indexOf(sBsoRole);
			var iUserIndex = sRoles.indexOf(sUserRole);
			if (iAdminIndex > 0 || iUserIndex > 0 || iBsoIndex > 0) {
				if (iAdminIndex > 0) {
					this.getView().byId("panel-admin").setVisible(true);
					this.getView().byId("panel-configuration").setVisible(true);
					this.getView().byId("panel-monitoring").setVisible(true);
					this.getView().byId("panel-sap-mii").setVisible(true);
				}
				if (iUserIndex > 0) {
					this.getView().byId("panel-configuration").setVisible(true);
					this.getView().byId("panel-monitoring").setVisible(true);
				}
				if (iBsoIndex > 0) {
					this.getView().byId("panel-bso").setVisible(true);
				}
			} else {
				this.fnShowNoAccess();
				return;
			}
			/***********************************************************************/

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Launchpad").attachPatternMatched(this._onObjectMatched, this);
		},
		onAfterRendering: function () {
			oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			//oLaunchPadController.fnLoadKPIS(true);
		},
		_onObjectMatched: function (oEvent) {
			oAppController.fnUpdate(this, oResourceBundle.getText("launchPadStreamingEngine"));
			var sCurrentPageName = oEvent.getParameter("name");
			if (sCurrentPageName == "Launchpad") {
				oLaunchPadController.fnLoadKPIS(false);
			}
		},
		fnShowNoAccess: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("NoAccess");
		},
		onClickTagCatalog: function () {
			var tagCatalogRouter = sap.ui.core.UIComponent.getRouterFor(this);
			tagCatalogRouter.navTo("TagCatalog");
		},
		onClickBatchCatalog: function () {
			var tagCatalogRouter = sap.ui.core.UIComponent.getRouterFor(this);
			tagCatalogRouter.navTo("BatchCatalog", {
				Refresh: "Y"
			});
		},
		onClickManualImport: function () {
			var tagManualImportRouter = sap.ui.core.UIComponent.getRouterFor(this);
			tagManualImportRouter.navTo("ManualImport");
		},
		onClickPlantParameters: function () {
			var PlantParameterRouter = sap.ui.core.UIComponent.getRouterFor(this);
			PlantParameterRouter.navTo("PlantParameters", {
				Refresh: "Y"
			});
		},
		onClickDataSources: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("DataSources", {
				Refresh: "Y"
			});
		},
		onClickDataDestinations: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("DataDestinations", {
				Refresh: "Y"
			});
		},
		onClickContextualFlows: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("ContextualFlows", {
				Refresh: "Y"
			});
		},
		onClickRealtimeFlows: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("RealtimeFlows", {
				Refresh: "Y"
			});
		},
		onClickArchiveFlows: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("ArchiveFlows", {
				Refresh: "Y"
			});
		},
		onClickFileFlows: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("FileFlows", {
				Refresh: "Y"
			});
		},
		onClickExternalFlows: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("ExternalFlows", {
				Refresh: "Y"
			});
		},
        		onClickUsersManagement: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("UsersManagement", {
				Refresh: "Y"
			});
		},
		onClickJobsMonitoring: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("JobsMonitoring");
		},
		onClickQueueMonitoring: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("QueueMonitoring");
		},
		onClickPcoMonitoring: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("PcoMonitoring");
		},
		onClickHistoricalUploadStatus: function () {
   			 var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
   			 thisRouter.navTo("HistoricalUploadStatus");
		},
		onClickDigitalApps: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("DigitalApps");
		},
		onClickReferenceUpdate: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("ReferenceUpdate");
		},
		onClickAuditLog:function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("AuditLog");
		},
		getLocation: function () {
            		return location.origin;
       		 },
		onClickApplicationLog:function() {
			var sAuditUrl = this.getLocation() + "/XMII/CM/SANOFI_CORE/ApplicationLog/ApplicationLog.irpt";
            		window.open(sAuditUrl, "_top");
		},
		onClickTransactionManager:function(){
			window.open('/webdynpro/resources/sap.com/xapps~xmii~ui~admin~navigation/NavigationApplication?view=com.sap.itsam.cfg.mii.admin.TransactionManager&deployable=sap.com/xapps~xmii~ui~admin~syscfg&component=com.sap.xapps.xmii.ui.admin.syscfg.syscfgcomp.sysconfigcomp.SysConfigComp&title=Transaction%20Manager#', '_blank', 'location=yes,height=800,width=1200,scrollbars=yes,status=yes');
		},
		onClickScheduledJobs:function(){
			window.open('/webdynpro/resources/sap.com/xapps~xmii~ui~admin~navigation/NavigationApplication?view=com.sap.itsam.cfg.mii.admin.Scheduler&deployable=sap.com/xapps~xmii~ui~admin~sysmon&component=com.sap.xapps.xmii.ui.admin.sysmon.sysmoncomp.SysMonCompController&title=Scheduler#', '_blank', 'location=yes,height=800,width=1200,scrollbars=yes,status=yes');
		},
		onClickLogViewer:function(){
			window.open('/webdynpro/dispatcher/sap.com/tc~lm~itsam~ui~lv~client_ui/LVApp?conn=view[Last%2024%20Hours%20(Java)]#', '_blank', 'location=yes,height=800,width=1200,scrollbars=yes,status=yes');
		},
		onClickCustomAttributeMapping:function(){
			window.open('/webdynpro/resources/sap.com/xapps~xmii~ui~admin~navigation/NavigationApplication?view=com.sap.itsam.cfg.mii.admin.CustomAttributeMap&deployable=sap.com/xapps~xmii~ui~admin~syscfg&component=com.sap.xapps.xmii.ui.admin.syscfg.syscfgcomp.sysconfigcomp.SysConfigComp&title=Custom%20Attribute%20Mapping#', '_blank', 'location=yes,height=800,width=1200,scrollbars=yes,status=yes');
		},
		onClickDataServers:function(){
			window.open('/webdynpro/resources/sap.com/xapps~xmii~ui~admin~navigation/NavigationApplication?view=com.sap.itsam.cfg.mii.admin.DataServers&deployable=sap.com/xapps~xmii~ui~admin~dataservices&component=com.sap.xapps.xmii.ui.admin.dataservices.dataservercomp.DataServicesComp&title=Data%20Servers#', '_blank', 'location=yes,height=800,width=1200,scrollbars=yes,status=yes');
		},
		onClickConnectionStatus:function(){
			window.open('/webdynpro/resources/sap.com/xapps~xmii~ui~admin~navigation/NavigationApplication?view=com.sap.itsam.cfg.mii.admin.ConnectionStatus&deployable=sap.com/xapps~xmii~ui~admin~sysmon&component=com.sap.xapps.xmii.ui.admin.sysmon.sysmoncomp.SysMonCompController&title=Connection%20Status#', '_blank', 'location=yes,height=800,width=1200,scrollbars=yes,status=yes');
		},
		onClickSharedMemory:function(){
			window.open('/webdynpro/resources/sap.com/xapps~xmii~ui~admin~navigation/NavigationApplication?view=com.sap.itsam.cfg.mii.admin.SharedMemory&deployable=sap.com/xapps~xmii~ui~admin~dataservices&component=com.sap.xapps.xmii.ui.admin.dataservices.dataservercomp.DataServicesComp&title=Shared%20Memory#', '_blank', 'location=yes,height=800,width=1200,scrollbars=yes,status=yes');
		},
		fnLoadKPIS: function (bLoop) {
			var sTotalAgents = oResourceBundle.getText("launchPadTotalAgents");
			var sTotalJobs = oResourceBundle.getText("launchPadTotalJobs");
			var UserName = document.getElementById("input-username").value;
			oDialog.setText("");
			oDialog.open();
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/LaunchPad/Query/LaunchPadKPISelectQuery&Param.1="+UserName+"&Content-Type=text/json",
				data: {
					"Param.20": document.getElementById("SE_Plant").value
				},
				success: function (result) {
					if (result.Rowsets.FatalError) {
						var sErrorMessage = result.Rowsets.FatalError;
						MessageToast.show(sErrorMessage);
						oDialog.close();
					} else {
						var data = result.Rowsets.Rowset[0].Row[0];
						iPlants = data.PLANT_ALL;
						iDataSources = data.SOURCE_ENABLED;
						iArchiveFlowEnabled = data.FLOW_ARCHIVE_ENABLED;
						iFileFlowEnabled = data.FLOW_FILE_ENABLED;
						iContextualEnabled = data.FLOW_CONTEXTUAL_ENABLED;
						iJobsRunning = data.JOBS_RUNNING;
						iJobsError = data.JOBS_ERROR;
						iJobsAll = data.JOBS_ALL;
						iQueuePending = data.QUEUE_PENDING;
						iQueueExpired = data.QUEUE_EXPIRED;
						iQueueAll = data.QUEUE_ALL;
                        iLogAll = data.LOG_ALL;
						iTagsEnabled = data.TAGS_ENABLED;
						iTagsAssignedApp = data.TAGS_ASSIGNED_APP;
						iTagsAll = data.TAGS_ALL;
						iLogchanges24h = data.LOG_CHANGES_24H;
						iFlowRealtimeAgentsRunning = data.FLOW_REALTIME_AGENTS_RUNNING;
						iFlowRealtimeAgentsError = data.FLOW_REALTIME_AGENTS_ERROR;
						iFlowRealtimeAgentsAll = data.FLOW_REALTIME_AGENTS_ALL;
						iEquipmentMapped = data.EQUIPMENT_MAPPED;
						iFilesInProcess = data.FILES_IN_PROCESS;
						iDataDestinations = data.DATA_DESTINATIONS;
						iDataFlowExternal = data.FLOW_EXTERNAL_ENABLED;
                        				iUsers = data.USERS;  
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-plant"), iPlants);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-data-source"), iDataSources);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-data-destination"), iDataDestinations);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-archive-flows"), iArchiveFlowEnabled);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-file-flows"), iFileFlowEnabled);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-external-flows"), iDataFlowExternal);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-contextual-flows"), iContextualEnabled);
                        				oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-users-management"), iUsers);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-plant"), iPlants);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-batch-equipment"), iEquipmentMapped);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-manual-import"), iFilesInProcess);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-jobs"), iJobsError);
						oLaunchPadController.getView().byId("tile-jobs").setSubheader(iJobsAll + " " + sTotalJobs);
						if (iFilesInProcess > 0) {
							oLaunchPadController.getView().byId("numeric-manual-import").setValueColor("Critical");
						} else {
							oLaunchPadController.getView().byId("numeric-manual-import").setValueColor("Good");
						}

						if (iJobsError > 0) {
							oLaunchPadController.getView().byId("numeric-jobs").setValueColor("Error");

						} else {
							oLaunchPadController.getView().byId("numeric-jobs").setValueColor("Good");
						}
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-queue"), iQueueExpired);
						if (iQueueExpired > 0) {
							oLaunchPadController.getView().byId("numeric-queue").setValueColor("Error");

						} else {
							oLaunchPadController.getView().byId("numeric-queue").setValueColor("Good");
						}
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-pco-monitor"), iFlowRealtimeAgentsError);
						oLaunchPadController.getView().byId("tile-pco-monitor").setSubheader(iFlowRealtimeAgentsAll +" "+ sTotalAgents);
						if (iFlowRealtimeAgentsError > 0) {
							oLaunchPadController.getView().byId("numeric-pco-monitor").setValueColor("Error");
						} else {
							oLaunchPadController.getView().byId("numeric-pco-monitor").setValueColor("Good");
						}
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-tags"), iTagsEnabled);
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-digital-apps"), iTagsAssignedApp);
						if (iTagsAssignedApp < iTagsEnabled) {
							oLaunchPadController.getView().byId("numeric-digital-apps").setValueColor("Error");
						} else {
							oLaunchPadController.getView().byId("numeric-digital-apps").setValueColor("Good");
						}
						oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-audit-log"), iLogchanges24h);
                        oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-appllication-log"), iLogAll);
						if (bLoop) {
							setTimeout(oLaunchPadController.fnLoadKPIS, 60000);
						}
						oDialog.close();
					}

				}
			});
			oLaunchPadController.fnLoadHistoricalUploadStatusCountMock();
			},
		fnLoadHistoricalUploadStatusCountMock: function () {
    			var iHistoricalUploadPending = 5;
   			 oLaunchPadController.fnSetValue(oLaunchPadController.getView().byId("numeric-historical-upload-status"), iHistoricalUploadPending);
   			 if (iHistoricalUploadPending > 0) {
   			     oLaunchPadController.getView().byId("numeric-historical-upload-status").setValueColor("Critical");
  			  } else {
   			     oLaunchPadController.getView().byId("numeric-historical-upload-status").setValueColor("Good");
   			 }
		},
		fnSetValue: function (oControl, iValue) {
			if (isNaN(iValue)) {
				oControl.setValue(iValue);
				//oControl.setScale("");
			} else if (iValue < 9999) {
				oControl.setValue(iValue);
				//oControl.setScale("");
			} else if (iValue < 1000000) {
				oControl.setValue(Math.floor(iValue / 1000) + "K");
				//oControl.setScale("K");
			} else if (iValue < 1000000000) {
				oControl.setValue(Math.floor((iValue / 1000000)) + "M");
				//oControl.setScale("M");
			} else if (iValue < 1000000000000) {
				oControl.setValue((Math.floor(iValue / 1000000000)) + "B");
			} else {
				oControl.setValue("1T+");
				//oControl.setScale("T");
			}

		}
	});
});
//# sourceURL=https://sapwdawsemea.pharma.aventis.com:9101/XMII/CM/StreamingEngine/StreamingEngine/controller/Launchpad.controller.js?eval