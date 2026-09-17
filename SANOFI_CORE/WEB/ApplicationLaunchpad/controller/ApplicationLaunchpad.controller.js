jQuery.sap.declare("sap.oee.ui.Component");

sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/m/MessagePopoverItem',	
	'sap/m/MessagePopover',
	'sap/m/Dialog',
	'sap/m/Button',
	'sap/m/Text',
    	"sap/m/MessageBox"

], function(JSONModel,Controller,Filter,FilterOperator,HDialogHelper, MessagePopoverItem, MessagePopover, Dialog, Button, Text, MessageBox) {
	//"use strict";

	return Controller.extend("Sanofi.ApplicationLaunchpad.controller.ApplicationLaunchpad", {

		onInit: function(oEvent) {
			

		},


		
		onPressTile: function(oEvent) {
			
			switch(oEvent.getParameter('id').split("--")[1]) {

				case "WIZARD": 
					window.open(
 						'/XMII/CM/SANOFI_CORE/SelfServiceConfiguration/index.irpt',
  						'_blank'
					);
					break;

				case "SERVER_STATUS": 
					window.open(
 						'/XMII/CM/eOEE/ExternalApps/SMEDConfig/index.irpt',
  						'_blank'
					);
					break;
					
					
				case "pcoMonitoring": 
					window.open(
 						"/XMII/CM/SANOFI_CORE/EndToEndMonitoring/index.irpt",
  						'_blank'
					);
					break;

				case "auditTrail": 
					window.open(
 						'/XMII/CM/SANOFI_CORE/Audit Trail/index.irpt',
  						'_blank'
					);
					break;
				case "LogApp": 
					window.open(
 						'/XMII/CM/SANOFI_CORE/ApplicationLog/ApplicationLog.irpt',
  						'_blank'
					);
					break;
				case "E2E": 
					window.open(
 						'/XMII/CM/eOEE/ExternalApps/MonitoringServers/index.irpt',
  						'_blank'
					);
					break;

				case "MACHINE_STATUS": 
					window.open(
 						'/XMII/CM/eOEE/ExternalApps/StatusReport/index.irpt',
  						'_blank'
					);
					break;

				case "UOM_MANAGEMENT": 
					window.open(
 						'/XMII/CM/eOEE/ExternalApps/AquisitionTranscodification/index.irpt',
  						'_blank'
					);
					break;

				case "GENERAL_CONFIG": 
					window.open(
 						'/OEEDashboard/UserGroupAssignment.jsp',
  						'_blank'
					);
					break;
				
				case "APP_LOG": 
					window.open(
 						'/XMII/CM/SANOFI_CORE/ApplicationLog/ApplicationLog.irpt',
  						'_blank'
					);
					break;
				case "EXPENSIVE": 
					window.open(
 						'/XMII/CM/SANOFI_CORE/Performance/index.irpt',

  						'_blank'
					);
					break;
				
				case "DYNAMC_CNTR_N_STATUS": 
					window.open(
 						'/XMII/CM/eOEE/ExternalApps/DynamicCountStatusConfig/index.irpt',
  						'_blank'
					);
					break;
				case "CodeReview": 
					window.open(
 						'/XMII/CM/SANOFI_CORE/CODE_REVIEW/index.irpt',
  						'_blank'
					);
					break;
				Default:
					break;;
			}

			
		},


	// End functions
	});

});