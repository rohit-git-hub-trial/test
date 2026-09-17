/*-----------------------------------------------------------------------------------
 End to End Monitoring 
Creation Date: 2020.04.14 / By: E0430931
Reference Document: (590 / End to End Monitoring Application Creation)
Description: End to End Monitoring Application Creation
-------------------------------------------------------------------------------------*/


sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History",
	"Sanofi/EndToEndMonitoring/controller/formatter"
], function(JSONModel,Controller,UIComponent,Filter,FilterOperator, History,formatter) {

	return Controller.extend("Sanofi.EndToEndMonitoring.controller.EndToEndMonitoringDetail", {
		formatter: formatter,
		onInit: function(oEvent) {
			
			jQuery.sap.require("jquery.sap.resources");
			var sLocale = sap.ui.getCore().getConfiguration().getLanguage().substring(0,2);
			this.oBundle = jQuery.sap.resources({url: "/XMII/CM/eOEE/RessourceBundles/OEEUITexts.properties", locale: sLocale});		
			this.getRouter().getRoute("RouteEndToEndMonitoringDetail").attachPatternMatched(this._onRouteMatched, this);
			var otext = this.oBundle.getText("ETEMTitle")   ;		
			window.that =this;

		},

		clearTableModel: function(oMonitorModel) {		
			oMonitorModel.setData([]);		
		},

		loadMonitorDetailData: function(oTableMonitor) {
			var url_string = jQuery.sap.getModulePath("Sanofi.EndToEndMonitoring.mockdata", "/Detail.json");
			var oMonitorModel = new sap.ui.model.json.JSONModel();
			
			oMonitorModel.setData([]); // assign null content 
			var that=this;
			var oBusy = new sap.m.BusyDialog();
			oMonitorModel.attachRequestSent(function() {   oBusy.open();  });

			oMonitorModel.loadData(url_string, "");
			console.log(url_string);
			
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
					new Filter("DURATION", FilterOperator.Contains, sQuery),
					new Filter("START_DATE", FilterOperator.Contains, sQuery),
					new Filter("END_DATE", FilterOperator.Contains, sQuery),
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
		onNavBack: function (oEvent) {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("RouteEndToEndMonitoring");
			}
		},
			

		_onRouteMatched : function (oEvent) {
 			 //this function executes every time you navigate to this page
			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			var oSensor = oArgs.sensorId;
			this.byId("sensorId").setText(oSensor);
			var oTableMonitor = this.getView().byId("tableMonitor"); // retrieve table 
			var oMonitorModel = this.loadMonitorDetailData(oTableMonitor);	 //retrieve model


			oTableMonitor.setModel(oMonitorModel, "MonitorList"); // assign model
			
			this.getView().setModel(oMonitorModel,"MonitorList");// assign model to view		
		},
			
	
	});

});