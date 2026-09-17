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
	"SelfServiceConfiguration/controller/formatter"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment,formatter) {
	"use strict";

	return Controller.extend("SelfServiceConfiguration.controller.Wizard", {
		formatter: formatter,
		onInit: function () {
			this._wizard = this.byId("CreateProductWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			
			window.that =this;


			this.oPlantModel = new sap.ui.model.json.JSONModel();
			this.oTaskModel = new sap.ui.model.json.JSONModel(); 
			
			this.getView().setModel(this.oPlantModel,"PlantList");// assign model to view
			this.getView().setModel(this.oTaskModel,"TaskList");// assign model to view
			this.loadPlantList();
			this.loadTaskList();
			
			
		},
		onAfterRendering: function() {	
			this.loadWizardStep();
			
		},
		loadWizardStep: function() {
			var oWizardModel  = new sap.ui.model.json.JSONModel();			
			var sURL = "/XMII/Illuminator";
			var sQuery ="SANOFI_CORE/SelfServiceConfiguration/Query/getGroupFOrDomainSelected";
			var oParam = {
				"QueryTemplate": sQuery,
//				"Param.2":this.getView().byId("OEE").getSelected(),
//				"Param.3":this.getView().byId("SE").getSelected(),
//				"Param.4":this.getView().byId("platform").getSelected(),
				"Content-Type": "text/JSON"
			}
			oWizardModel.loadData(sURL, oParam);
	

			that = this;
			oWizardModel.attachRequestCompleted(function() {   

				that._wizard.removeAllSteps();
				var rowsets = oWizardModel.getData().Rowsets.Rowset[0].Row;
				

				var newStep =  new sap.m.WizardStep("PlantChooseStep", {
				title:"Choose a plant",
				
 				  activate:function(){
					that.onChangePlant()
               		             },
				content : [
					new sap.m.MessageStrip({ text:"Please select the Plant." }) ,
					 new sap.m.ComboBox("plantId", {
						showSecondaryValues:true, 
						items: {
						path: "PlantList>/Rowsets/Rowset/0/Row",
						template:  new sap.ui.core.ListItem({
								key: "{PlantList>ID_PLANT}",
								text: "{PlantList>ID_PLANT}",
								additionalText: "{PlantList>OEE_PLANT}"
							})
						}, 
						selectionChange:function() { 
							that.onChangePlant()
						}
					}),
					new sap.m.CheckBox("PLATFORM", 
							{text:"Platform", selected:"true" ,
						 select:function() {
							that.onDomainChange()
					}     }
					) ,
					new sap.m.CheckBox("OEE", {text:"EOEE", selected:"true" }) ,
					new sap.m.CheckBox("SE", {text:"Streaming Engine", selected:"true",disabled:"true" })

				]
				}	
				)
				
					that._wizard.addStep( newStep);

				for (var i=0;i < rowsets.length;i++) { 
				var idTable = rowsets[i].ID_GROUP +"_table"
					  var oTable = new sap.ui.table.Table(idTable,{
  							  selectionMode : sap.ui.table.SelectionMode.Single,
 							   selectionBehavior: sap.ui.table.SelectionBehavior.Row
					  });
			
					  oTable.addColumn(new sap.ui.table.Column({
  							  label: new sap.ui.commons.Label({text: "Domain"}),
							    template: new sap.ui.commons.TextView({text:"{ID_DOMAIN}"})
					  }));
 					oTable.addColumn(new sap.ui.table.Column({
  							  label: new sap.ui.commons.Label({text: "Task"}),
							    template: new sap.ui.commons.TextView({text:"{ID_TASK}"})
					  }));
					oTable.addColumn(new sap.ui.table.Column({
  							  label: new sap.ui.commons.Label({text: "Execute"}),
							    template: new sap.m.Button({text:"run" ,press:function() { 
								that.onExecuteJobTask } })
					  }));
					oTable.addColumn(new sap.ui.table.Column({
  							  label: new sap.ui.commons.Label({text: "Result"}),
							   template: new sap.ui.commons.TextView({text:""})
					  }));

					oTable.setModel(that.oTaskModel);
					oTable.bindRows("/Rowsets/Rowset/0/Row")
				var newStep =  new sap.m.WizardStep(rowsets[i].ID_GROUP, 	{
				title:rowsets[i].ID_GROUP, 
				content : [ 
					oTable
				]}
				)
				
				that._wizard.addStep( newStep);
				}

			 });
					
		},	
		onDomainChange:function() {
			this._wizard.getSteps()[1].setVisible(false)
		},
		onChangePlant:function() {
			//this._wizard =  sap.ui.getCore().byId("CreateProductWizard");
			var sPlant = sap.ui.getCore().byId("plantId").getSelectedKey()
			if (sPlant!="") {
				this._wizard.validateStep(	this._wizard.getSteps()[0]);
				sap.ui.getCore().byId("plantId").setEnabled(false);
				sap.ui.getCore().byId("OEE").setEnabled(false);
				sap.ui.getCore().byId("SE").setEnabled(false);
				sap.ui.getCore().byId("PLATFORM").setEnabled(false);
					
			} else {
				this._wizard.invalidateStep(	this._wizard.getSteps()[0]);
			}

		},
		loadTaskList:function() {
			var sURL = "/XMII/Illuminator";
			var sQuery ="SANOFI_CORE/SelfServiceConfiguration/Query/getTaskListGroupDomain";
			var oParam = {
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON",
				"Param.1:":"PRE_CHECK_SERVER"
			}
			this.oTaskModel.loadData(sURL, oParam);


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
