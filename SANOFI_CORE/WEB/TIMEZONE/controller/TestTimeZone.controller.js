sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/table/Table",
	"sap/ui/commons/Label",
	"sap/ui/commons/TextView",
	"sap/ui/table/Column",
	"sap/ui/core/Fragment",
	"TIMEZONE/controller/formatter"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment,formatter) {
	"use strict";

	return Controller.extend("TIMEZONE.controller.TestTimeZone", {
		formatter: formatter,
		onInit: function () {
			window.that =this;
			this.oPlantModel = new sap.ui.model.json.JSONModel();
			this.oTimeZoneSystem= new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.oPlantModel,"PlantList");// assign model to view
		
			this.loadPlantList();
			this.loadTimeZoneSystem();
			
			
		},
		onAfterRendering: function() {	
			//this.loadWizardStep();
			
		},
		
		loadTimeZoneSystem:function() {
			var sURL = "/XMII/Illuminator";
			var sQuery ="SANOFI_CORE/API_COMMON/DATE_TIMEZONE/Query/xctTimeZoneSystem";
			var oParam = {
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON"
			}
			this.oTimeZoneSystem.loadData(sURL, oParam);
			that = this;
			this.oTimeZoneSystem.attachRequestCompleted(function() {   
				that.getView().byId("serverTimeZoneText").setText( that.oTimeZoneSystem.getData().Rowsets.Rowset[0].Row[0].ServerTimezone);
				that.getView().byId("dbTimeZoneText").setText( that.oTimeZoneSystem.getData().Rowsets.Rowset[0].Row[0].dbTimezone);

			})
		},
		onChangePlant:function() {
			var sURL = "/XMII/Illuminator";
			this.oModel = new sap.ui.model.json.JSONModel();
			var plantId = this.getView().byId("plantIdSelect").getSelectedKey()
			var sQuery ="SANOFI_CORE/API_COMMON/DATE_TIMEZONE/Query/xctGetPlantTimeZone";
			var oParam = {
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON", 
				"Param.1":plantId
			}
			this.oModel.loadData(sURL, oParam);
			that = this;
			this.oModel.attachRequestCompleted(function() {   
				that.getView().byId("plantTimeZone").setText( that.oModel.getData().Rowsets.Rowset[0].Row[0].plantTimeZone);


			})

		}, 
		onPress:function() {
			var sURL = "/XMII/Illuminator";
			this.oModel = new sap.ui.model.json.JSONModel();
			var plantId = this.getView().byId("plantIdSelect").getSelectedKey();
			var dateNow= this.getView().byId("dateNow").getSelected();
			var InputDate= this.getView().byId("DTP1").getValue();
			var flag_UTCDate= this.getView().byId("fl_utcDate").getSelected();
			var flag_PlantDate= this.getView().byId("fl_serverDate").getSelected();
			var flag_ServerDate= this.getView().byId("fl_plantDate").getSelected();

			this.getView().byId("plantId").setText("plantId : "  + plantId);


			this.getView().byId("DateNow").setText( "dateNow " + dateNow);
			this.getView().byId("InputDate").setText( "InputDate " + InputDate);
			this.getView().byId("flag_UTCDate").setText( "UTCDate " + flag_UTCDate);
			this.getView().byId("flag_PlantDate").setText( "PlantDate " + flag_PlantDate);
			this.getView().byId("flag_ServerDate").setText( "ServerDate " + flag_ServerDate);
			var sQuery ="SANOFI_CORE/API_COMMON/DATE_TIMEZONE/Query/xctTimeZoneDate";
			var oParam = {
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON", 
				"Param.1":dateNow, 
				"Param.2":InputDate, 
				"Param.3":plantId, 
				"Param.4":flag_UTCDate, 
				"Param.5":flag_ServerDate, 
				"Param.6":flag_PlantDate, 

			}
			this.oModel.loadData(sURL, oParam);
			that = this;
			this.oModel.attachRequestCompleted(function() {   
				that.getView().byId("UTCDate").setText("UTC Date : " + that.oModel.getData().Rowsets.Rowset[0].Row[0].DateUTC);
				that.getView().byId("PLANTDate").setText("Plant Date : " +  that.oModel.getData().Rowsets.Rowset[0].Row[0].DatePlant);
				that.getView().byId("SERVERDate").setText("Server Date : " +  that.oModel.getData().Rowsets.Rowset[0].Row[0].DateServer);


			})
			

		},
		//Function to load Plant List
		loadPlantList: function() {
			var sURL = "/XMII/Illuminator";
			var sQuery ="SANOFI_CORE/API_COMMON/DATE_TIMEZONE/Query/GetPlantList";
			var oParam = {
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON"
			}
			this.oPlantModel.loadData(sURL, oParam);

		},	
		
		
		
	});
});
