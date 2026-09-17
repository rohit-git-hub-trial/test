/*-----------------------------------------------------------------------------------
 End to End Monitoring 
Creation Date: 2020.04.14 / By: E0430931
Reference Document: (590 / End to End Monitoring Application Creation)
Description: End to End Monitoring Application Creation
-------------------------------------------------------------------------------------*/

/*global variableArray*/


sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"Sanofi/EndToEndMonitoring/controller/formatter"

], function(JSONModel,Controller,UIComponent,Filter,FilterOperator, MessageBox,formatter ) {

	return Controller.extend("Sanofi.EndToEndMonitoring.controller.EndToEndMonitoring", {
		formatter: formatter,

		onInit: function(oEvent) {
			
			jQuery.sap.require("jquery.sap.resources");
			var sLocale = sap.ui.getCore().getConfiguration().getLanguage().substring(0,2);
			this.oBundle = jQuery.sap.resources({url: "/XMII/CM/SANOFI_CORE/RessourceBundles/SANOFI_COREUITexts.properties", locale: sLocale});		
			var otext = this.oBundle.getText("ETEMTitle")   ;			
			this.onRefreshMonitor();
			window.that =this;
			
		},
		
		onAfterRendering: function() {

		},

		clearTableModel: function(oMonitorModel) {		
			oMonitorModel.setData([]);		
		},
		onSingleAction:function(oEvent) {
			var pathItem = oEvent.getSource().getParent().getBindingContext("MonitorList").sPath
			var dataItem = this.getView().getModel("MonitorList").getObject(pathItem)
			MessageBox.confirm("Do you want to perform action on  " +dataItem.SENSOR_ID + " ? ",  {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: function (sAction) {
					if (sAction == "OK") {
						MessageToast.show("Action selected: " + sAction);
					 }         
				}  
				});
		
			
		} ,
		loadMonitorData: function(oTableMonitor) {

			//var url_string = jQuery.sap.getModulePath("Sanofi.EndToEndMonitoring.mockdata", "/Monitor.json");
			var oMonitorModel = new sap.ui.model.json.JSONModel();
			var sURL = "/XMII/Illuminator";
			var sQuery ="SANOFI_CORE/EndToEndMonitoring/Query/GetPCOAgentListStatus";
			var oParam = {
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON"
			}
			oMonitorModel.loadData(sURL, oParam);

			//var that=this;
			var oBusy = new sap.m.BusyDialog();
			oMonitorModel.attachRequestSent(function() {   oBusy.open();  });

			oMonitorModel.attachRequestCompleted(function() {   
				oBusy.close(); 
					// Adjust Table display
					var oTableMonitor = window.that.getView().byId("tableMonitor");
					var rowsets = oMonitorModel.oData.Rowsets;
					var rows = oMonitorModel.oData.Rowsets.Rowset["0"].Row ;
					var oDisplayLength = rows.length ;
					if ( rows != undefined) {oTableMonitor.setVisibleRowCount(oDisplayLength); return;}
					oTableMonitor.setVisibleRowCount(oDisplayLength);			

			 });
			return (oMonitorModel);
		},

		
		_filter : function () {
			var oFilter = null;
			if (this._oGlobalFilter) {
				oFilter = new sap.ui.model.Filter([this._oGlobalFilter], true);
			} 
			this.byId("tableMonitor").getBinding("rows").filter(oFilter, "Application");
		},
		
		filterGlobally : function(oEvent) {
			var sQuery = oEvent.getParameter("query");
			this._oGlobalFilter = null;

			if (sQuery) {
				this._oGlobalFilter = new Filter([
					new Filter("ID_PCO_AGENT", FilterOperator.Contains, sQuery),
				], false);
			}
			this._filter();
		},  
		
		clearAllSortings : function(oEvent) {
			var oTable = this.byId("tableMonitor");
			oTable.getBinding("rows").sort(null);
			this._resetSortingState(oTable);
		},
		clearAllFilters : function(oEvent) {
			var oTable = this.byId("tableMonitor");
			this.getView().byId("SearchFId").setValue("");

			this._oGlobalFilter = null;
			this._filter();

			var aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				oTable.filter(aColumns[i], null);
			}
			// now reset sortings
			this.clearAllSortings(oEvent);
		},
		_resetSortingState : function(oTable) {
			//var oTable = this.byId("tableMonitor");
			var aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].setSorted(false);
			}
		},
		getRouter : function () {
			return UIComponent.getRouterFor(this);
		},
		onDetailHistory: function (oEvent) {
			var oItem, oSensor;
			oItem = oEvent.getSource().getParent().getIndex();
			oSensor = this.getView().byId("tableMonitor").getBinding().oList[oItem].SENSOR_ID ;
			//this.getRouter().navTo("RouteEndToEndMonitoringDetail");
			this.getRouter().navTo("RouteEndToEndMonitoringDetail",{
				sensorId : oSensor
			});
		},	
		onRefreshMonitor : function () {
			var that=this;
			var oTableMonitor = this.getView().byId("tableMonitor"); // retrieve table 
			var oMonitorModel = this.loadMonitorData(oTableMonitor);	 //retrieve model
			var oTableMonitor = this.getView().byId("tableMonitor"); // retrieve table 
			oTableMonitor.setModel(oMonitorModel, "MonitorList"); // assign model		
			this.getView().setModel(oMonitorModel,"MonitorList");// assign model to view		

		},
		
			
	
	});

});