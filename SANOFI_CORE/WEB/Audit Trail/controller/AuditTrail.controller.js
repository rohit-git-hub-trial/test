/*-----------------------------------------------------------------------------------
Audit Trail Interface
Creation Date: 2022.03.21 / By: E0458228
Jira Card: MII-48
Description: API Audit Trail - Implementation
-------------------------------------------------------------------------------------*/

var oResourceBundle;

sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/DateFormat"
], function(JSONModel, Controller,DateFormat) {
	"use strict";

	return Controller.extend("AuditTrail.controller.AuditTrail", {
		
		oDateFormater: DateFormat.getDateTimeInstance({pattern: "dd/MM/yyyy HH:mm:ss"}),
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			//this.oRouter.getRoute("AuditTrail").attachPatternMatched(this._onObjectMatched, this);
			oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this._initDates();
		},

		onAfterRendering: function() {
			this.fnLoadAuditTrailList();
			/******************** Below Part for Authorisation***********************/
			/* 
			var sRoles = document.getElementById('input-roles').value;
			var sAdminRole = "MODULE_LOCALIZATION_ADMIN";
			var sUserRole = "MODULE_LOCALIZATION_USER";
			iAdminIndex = sRoles.indexOf(sAdminRole);
			iUserIndex = sRoles.indexOf(sUserRole);
			if (iAdminIndex < 0) {
				this.fnShowNoAccess();
				return;
				this.getView().byId("page-audit-trail").setVisible(false);
			} else {
				this.getView().byId("page-audit-trail").setVisible(true);
			}
			*/
			/***********************************************************************/
		},
		
		

		_onObjectMatched: function(oEvent) {
			var sMode = oEvent.getParameter("arguments").Refresh;
			this.fnLoadAuditTrailList();
			//       this.getView().byId("table-plant-parameters").getBinding("items").sort(new sap.ui.model.Sorter("ID_PLANT", false));
			if (this.oSortDialog) {
				this.oSortDialog.destroy();
				this.oSortDialog = undefined;
			}			
		},
		
		_initDates: function () {		
			if (this.getView().byId("datetime-from").getValue() =="")		
				this.getView().byId("datetime-from").setValue(this.oDateFormater.format(new Date(new Date() - 24 * 3600* 1000)));
			if (this.getView().byId("datetime-to").getValue() =="")				
				this.getView().byId("datetime-to").setValue(this.oDateFormater.format((new Date())));
		},

		fnLoadAuditTrailList: function() {		
			this._initDates();
			this.getView().byId("page-audit-trail").setBusy(true);
			var oModelAuditTrailParameters = new JSONModel();
			var inputPlantId = this.getView().byId("input-plant-id").getValue() !="" ? this.getView().byId("input-plant-id").getValue() : "%%";
			var inputPlantListIds = "*";
			var inputAction = this.getView().byId("input-action").getValue() !="" ? this.getView().byId("input-action").getValue() : "%%";
			var inputDbTable = this.getView().byId("input-db-table").getValue() !="" ? this.getView().byId("input-db-table").getValue() : "%%";
			var inputValueOld = this.getView().byId("input-value-old").getValue() !="" ? this.getView().byId("input-value-old").getValue() : "%%";
			var inputValueNew = this.getView().byId("input-value-new").getValue()  !="" ? this.getView().byId("input-value-new").getValue() : "%%";
			var inputMessage = this.getView().byId("input-message").getValue() !="" ? this.getView().byId("input-message").getValue() : "%%";
			var inputUserID = this.getView().byId("input-userID").getValue() !="" ?  this.getView().byId("input-userID").getValue() : "%%";			
			var oUrlParams = new URLSearchParams(location.search);
			var sApplication =  "%%";		
			var sStartDate = this.getView().byId("datetime-from")._getInputValue();
			var sEndDate = this.getView().byId("datetime-to")._getInputValue();
			if (inputPlantId.includes(",")) {
				inputPlantListIds = inputPlantId;
				inputPlantId = "%%";
			}
			var that = this;
			var oParams = {
				"Param.1": inputPlantId,
				"Param.2": inputAction,
				"Param.3": inputDbTable,
				"Param.4": inputValueOld,
				"Param.5": inputValueNew,
				"Param.6": inputMessage,
				"Param.7": inputUserID,
				"Param.8": sApplication,
				"Param.20": "*",
				"StartDate": sStartDate,
				"EndDate": sEndDate,
				"QueryTemplate": "SANOFI_CORE/Audit Trail/Query/AuditLogListSelectQuery",
				"Content-Type": "text/JSON"
			};			
			oModelAuditTrailParameters.loadData("/XMII/Illuminator", oParams);
			oModelAuditTrailParameters.attachRequestCompleted(function () {
				if (oModelAuditTrailParameters.getProperty("/Rowsets/FatalError")) 
					sap.m.MessageToast.show(oModelAuditTrailParameters.getProperty("/Rowsets/FatalError"));				
				that.getView().byId("table-audit-trail").setModel(oModelAuditTrailParameters);
				that.getView().byId("page-audit-trail").setBusy(false);	
			});
		},

		fnFromDateChanged: function() {
			var sFromDate = this.getView().byId("datetime-from").getDateValue();
			this.getView().byId("datetime-to").setMinDate(sFromDate);
		},

		fnApplyDate: function() {
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

		fnClearDates: function() {
			this.getView().byId("datetime-from").setValue("");
			this.getView().byId("datetime-to").setValue("");
			oAuditLogController.fnLoadAuditLog("", "");
			this.getView().byId("title-time").setText("(Last 24 hours)");
		}

	});
});