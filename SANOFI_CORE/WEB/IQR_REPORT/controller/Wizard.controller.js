sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"IQR_REPORT/controller/formatter"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment,formatter) {
	"use strict";

	return Controller.extend("IQR_REPORT.controller.Wizard", {
		formatter: formatter,
		onInit: function () {
			this._wizard = this.byId("CreateProductWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");
			this._oWizardReviewPage = sap.ui.xmlfragment("SelfServiceConfiguration.view.ReviewPage", this); 
			this._oNavContainer.addPage(this._oWizardReviewPage);
			//this.getView().byId("plantRevId").setText("");

			window.that =this;
			var oTableBasedTasks = this.getView().byId("tableBasedTasks"); // retrieve table 
			var oBasedTasksModel = this.loadBasedTasks(oTableBasedTasks);	 //retrieve model
			oTableBasedTasks.setModel(oBasedTasksModel, "basedTaskList"); // assign model		
			this.getView().setModel(oBasedTasksModel,"basedTaskList");// assign model to view	

			this.oPlantModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.oPlantModel,"PlantList");// assign model to view

		},
		onAfterRendering: function() {	
			this.loadPlantList();

			var oList =this.getView().byId("tableBasedTasks");
 			oList.addEventDelegate({
			onAfterRendering: function () {
				var items = oList.getRows();						
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					var oResult= item.oBindingContexts.basedTaskList.oModel.oData.Rowsets.Rowset[0].Row[i].RESULT
					if (oResult =="OK"){
						item.$().find(".taskStatusClass").addClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("green");
					} else if (oResult =="NOK"){
						item.$().find(".taskStatusClass").addClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("red");
					}
				}
			}
			})
			
			
			var oList1 =this.getView().byId("tableActivitiesTasks");
 			oList1.addEventDelegate({
			onAfterRendering: function () {
				var items = oList1.getRows();						
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					if (item.oBindingContexts.activitiesTaskList != null) {
						var oResult= item.oBindingContexts.activitiesTaskList.oModel.oData.Rowsets.Rowset[0].Row[i].RESULT
					if (oResult =="OK"){
						item.$().find(".taskStatusClass").addClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("green");
					} else if (oResult =="NOK"){
						item.$().find(".taskStatusClass").addClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("red");
					}
					}
				}
			}
			})
			
		var oList2 =this.getView().byId("tableJobsTasks");
 			oList2.addEventDelegate({
			onAfterRendering: function () {
				var items = oList2.getRows();						
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					if (item.oBindingContexts.jobsTaskList != null) {
						var oResult= item.oBindingContexts.jobsTaskList.oModel.oData.Rowsets.Rowset[0].Row[i].RESULT
					if (oResult =="OK"){
						item.$().find(".taskStatusClass").addClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("green");
					} else if (oResult =="NOK"){
						item.$().find(".taskStatusClass").addClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("red");
					}
					}
				}
			}
			})
			
		var oList3 =this.getView().byId("tablePlantHieTasks");
 			oList3.addEventDelegate({
			onAfterRendering: function () {
				var items = oList3.getRows();						
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					if (item.oBindingContexts.plantHieTaskList != null) {
						var oResult= item.oBindingContexts.plantHieTaskList.oModel.oData.Rowsets.Rowset[0].Row[i].RESULT
					if (oResult =="OK"){
						item.$().find(".taskStatusClass").addClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("green");
					} else if (oResult =="NOK"){
						item.$().find(".taskStatusClass").addClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("red");
					}
					}
				}
			}
			})
		},
		setProductType: function (evt) {
			var productType = evt.getSource().getTitle();
			this.model.setProperty("/productType", productType);
			this.byId("ProductStepChosenType").setText("Chosen product type: " + productType);
			this._wizard.validateStep(this.byId("BasedStep"));
		},

		setProductTypeFromSegmented: function (evt) {
			var productType = evt.getParameters().item.getText();
			this.model.setProperty("/productType", productType);
			this._wizard.validateStep(this.byId("BasedStep"));
		},


		//Function to load Plant List
		loadPlantList: function(oTableBasedTasks) {
			var sURL = "/XMII/Illuminator";
			var sQuery ="SANOFI_CORE/SelfServiceConfiguration/Query/getListSupportedPlantsSelectQuery";
			var oParam = {
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON"
			}
			this.oPlantModel.loadData(sURL, oParam);
		},
		
		
		//Function to load Based Tasks
		loadBasedTasks: function(oTableBasedTasks) {
			var url_string = jQuery.sap.getModulePath("SelfServiceConfiguration.mockdata", "/BasedTasks.json");
			var oBasedTasksModel = new sap.ui.model.json.JSONModel();			
			oBasedTasksModel.setData([]); // assign null content 
			//var that=this;
			var oBusy = new sap.m.BusyDialog();
			oBasedTasksModel.attachRequestSent(function() {   oBusy.open();  });
			oBasedTasksModel.loadData(url_string, "");
			oBasedTasksModel.attachRequestCompleted(function() {   
				oBusy.close(); 
					// Adjust Table display
					var oTableBasedTasks = window.that.getView().byId("tableBasedTasks");
					var rowsets = oBasedTasksModel.oData.Rowsets;
					var rows = oBasedTasksModel.oData.Rowsets.Rowset["0"].Row ;
					var oDisplayLength = rows.length ;
					if ( rows != undefined) {oTableBasedTasks.setVisibleRowCount(oDisplayLength); return;}
					oTableBasedTasks.setVisibleRowCount(oDisplayLength);			

			 });
			return (oBasedTasksModel);
		},

		//Function to load Activities Tasks
		loadActivitiesTasks: function(oTableActivitiesTasks) {
			var url_string = jQuery.sap.getModulePath("SelfServiceConfiguration.mockdata", "/ActivitiesTasks.json");

			var oActivitiesTasksModel = new sap.ui.model.json.JSONModel();
			
			oActivitiesTasksModel.setData([]); // assign null content 
			//var that=this;
			var oBusy = new sap.m.BusyDialog();
			oActivitiesTasksModel.attachRequestSent(function() {   oBusy.open();  });
			oActivitiesTasksModel.loadData(url_string, "");
			oActivitiesTasksModel.attachRequestCompleted(function() {   
				oBusy.close(); 
					// Adjust Table display
					var oTableBasedTasks = window.that.getView().byId("tableActivitiesTasks");
					var rowsets = oActivitiesTasksModel.oData.Rowsets;
					var rows = oActivitiesTasksModel.oData.Rowsets.Rowset["0"].Row ;
					var oDisplayLength = rows.length ;
					if ( rows != undefined) {oTableBasedTasks.setVisibleRowCount(oDisplayLength); return;}
					oTableBasedTasks.setVisibleRowCount(oDisplayLength);	
			 });
			return (oActivitiesTasksModel);
		},
				//Function to load Jobs Tasks
		loadJobsTasks: function(oTableJobsTasks) {
			var url_string = jQuery.sap.getModulePath("SelfServiceConfiguration.mockdata", "/JobsTasks.json");

			var oJobsTasksModel = new sap.ui.model.json.JSONModel();
			
			oJobsTasksModel.setData([]); // assign null content 
			//var that=this;
			var oBusy = new sap.m.BusyDialog();
			oJobsTasksModel.attachRequestSent(function() {   oBusy.open();  });
			oJobsTasksModel.loadData(url_string, "");
			oJobsTasksModel.attachRequestCompleted(function() {   
				oBusy.close(); 
					// Adjust Table display
					var Activities = window.that.getView().byId("tableJobsTasks");
					var rowsets = oJobsTasksModel.oData.Rowsets;
					var rows = oJobsTasksModel.oData.Rowsets.Rowset["0"].Row ;
					var oDisplayLength = rows.length ;
					if ( rows != undefined) {Activities.setVisibleRowCount(oDisplayLength); return;}
					Activities.setVisibleRowCount(oDisplayLength);	
			 });
			return (oJobsTasksModel);
		},
		
		//Function to load Plant Hiera Tasks
		loadPlantHieTasks: function(oTableJobsTasks) {
			var url_string = jQuery.sap.getModulePath("SelfServiceConfiguration.mockdata", "/PlantHieTasks.json");

			var oJobsTasksModel = new sap.ui.model.json.JSONModel();
			
			oJobsTasksModel.setData([]); // assign null content 
			//var that=this;
			var oBusy = new sap.m.BusyDialog();
			oJobsTasksModel.attachRequestSent(function() {   oBusy.open();  });
			oJobsTasksModel.loadData(url_string, "");
			oJobsTasksModel.attachRequestCompleted(function() {   
				oBusy.close(); 
					// Adjust Table display
					var Activities = window.that.getView().byId("tablePlantHieTasks");
					var rowsets = oJobsTasksModel.oData.Rowsets;
					var rows = oJobsTasksModel.oData.Rowsets.Rowset["0"].Row ;
					var oDisplayLength = rows.length ;
					if ( rows != undefined) {Activities.setVisibleRowCount(oDisplayLength); return;}
					Activities.setVisibleRowCount(oDisplayLength);	
			 });
			return (oJobsTasksModel);
		},
		//Function to change Plant
		onChangePlant: function() {
			this.goToBasedStep();
		},

		onExecuteByPass: function (event) {
			var oIndex = event.getSource().getParent().getIndex();
				this.getView().byId("tableBasedTasks").getRows()[oIndex].getCells()[2].setText("OK");
				this.goToActivitiesConfig();
				this.colorBasedTaskFormatter();
		},
		//Function to execute Based task
		onExecuteBasedTask: function (event) {
			var oIndex = event.getSource().getParent().getIndex();
			var sPlant=this.getView().byId("plantId")._getSelectedItemText();
			var sClient=this.getView().byId("plantId").getSelectedKey();
			var sURL = "/XMII/Illuminator";
			var sQuery =event.getSource().getParent().oBindingContexts.basedTaskList.oModel.oData.Rowsets.Rowset[0].Row[event.getSource().getParent().getIndex()].RUN;
			var oParam = {
				"Param.1": sPlant,
				"Param.2": sClient,
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON"
			}
			var oTaskModel = new sap.ui.model.json.JSONModel();
			var oBusy = new sap.m.BusyDialog();
			var that = this;
			oTaskModel.attachRequestSent(function() {   oBusy.open();  });
			oTaskModel.loadData(sURL, oParam);
			oTaskModel.attachRequestCompleted(function() {  
				oBusy.close(); 
				var oData =oTaskModel.oData;
				var oRows = oData.Rowsets.Rowset["0"].Row ;
				that.getView().byId("tableBasedTasks").getRows()[oIndex].getCells()[2].setText(oRows[0].Status);
				that.goToActivitiesConfig();
				that.colorBasedTaskFormatter();
			 });

		},


		//Function to execute Activity task
		onExecuteActivityTask: function (event) {
			var oIndex = event.getSource().getParent().getIndex();
			var sPlant=this.getView().byId("plantId")._getSelectedItemText();
			var sClient=this.getView().byId("plantId").getSelectedKey();
			var sURL = "/XMII/Illuminator";
			var sQuery =event.getSource().getParent().oBindingContexts.activitiesTaskList.oModel.oData.Rowsets.Rowset[0].Row[event.getSource().getParent().getIndex()].RUN;
			var oParam = {
				"Param.1": sPlant,
				"Param.2": sClient,
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON"
			}
			var oTaskModel = new sap.ui.model.json.JSONModel();
			var oBusy = new sap.m.BusyDialog();
			var that = this;

			oTaskModel.attachRequestSent(function() {   oBusy.open();  });
			oTaskModel.loadData(sURL, oParam);
			oTaskModel.attachRequestCompleted(function() {  
				oBusy.close(); 
				var oData =oTaskModel.oData;
				var oRows = oData.Rowsets.Rowset["0"].Row ;

				that.getView().byId("tableActivitiesTasks").getRows()[oIndex].getCells()[2].setText(oRows[0].Status);
				that.goToJobConfig();
				that.colorActivityTaskFormatter();
			 });
		},
		//Function to execute Job task
		onExecuteJobTask: function (event) {
			var oIndex = event.getSource().getParent().getIndex();
			var sPlant=this.getView().byId("plantId")._getSelectedItemText();
			var sClient=this.getView().byId("plantId").getSelectedKey();
			var sURL = "/XMII/Illuminator";
			var sQuery =event.getSource().getParent().oBindingContexts.jobsTaskList.oModel.oData.Rowsets.Rowset[0].Row[event.getSource().getParent().getIndex()].RUN;
			var oParam = {
				"Param.1": sPlant,
				"Param.2": sClient,
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON"
			}
			var oTaskModel = new sap.ui.model.json.JSONModel();
			var oBusy = new sap.m.BusyDialog();
			var that = this;

			oTaskModel.attachRequestSent(function() {   oBusy.open();  });
			oTaskModel.loadData(sURL, oParam);
			oTaskModel.attachRequestCompleted(function() {  
				oBusy.close(); 
				var oData =oTaskModel.oData;
				var oRows = oData.Rowsets.Rowset["0"].Row ;

				that.getView().byId("tableJobsTasks").getRows()[oIndex].getCells()[2].setText(oRows[0].Status);
				that.goToPlantHierarchyConfig();
				that.colorJobTaskFormatter();
			 });
		},
		//Function to execute Plant Hierarchy task
		onExecutePlantHieTask: function (event) {
			var oIndex = event.getSource().getParent().getIndex();
			var sPlant=this.getView().byId("plantId")._getSelectedItemText();
			var sClient=this.getView().byId("plantId").getSelectedKey();
			var sURL = "/XMII/Illuminator";
			var sQuery =event.getSource().getParent().oBindingContexts.plantHieTaskList.oModel.oData.Rowsets.Rowset[0].Row[event.getSource().getParent().getIndex()].RUN;
			var oParam = {
				"Param.1": sPlant,
				"Param.2": sClient,
				"QueryTemplate": sQuery,
				"Content-Type": "text/JSON"
			}
			var oTaskModel = new sap.ui.model.json.JSONModel();
			var oBusy = new sap.m.BusyDialog();
			var that = this;

			oTaskModel.attachRequestSent(function() {   oBusy.open();  });
			oTaskModel.loadData(sURL, oParam);
			oTaskModel.attachRequestCompleted(function() {  
				oBusy.close(); 
				var oData =oTaskModel.oData;
				var oRows = oData.Rowsets.Rowset["0"].Row ;

				that.getView().byId("tablePlantHieTasks").getRows()[oIndex].getCells()[2].setText(oRows[0].Status);
				that.validateConfig();
				that.colorPlantHieTaskFormatter();
			 });
		},
		
		//Function to go to Step 2
		goToBasedStep: function () {
			var sPlant = this.byId("plantId").getSelectedKey();
			if (sPlant!="") {
				this._wizard.validateStep(this.byId("PlantChooseStep"));
				this.getView().byId("plantId").setEnabled(false);
				
			} else {
				this._wizard.invalidateStep(this.byId("PlantChooseStep"));
			}
		},
		//Function to go to Step 2
		goToActivitiesConfig: function () {
			var sLength= this.getView().byId("tableBasedTasks").getBinding().oList.length;
			if (sLength !="0") { var sValidate=Boolean(true);} else { var sValidate=Boolean(false); }
			for (var i=0; i<sLength;i++){
				var sResult= this.getView().byId("tableBasedTasks").getBinding().oList[i].RESULT;
				if (sResult ==undefined || sResult =="NOK") {
					sValidate=sValidate*Boolean(false);
				}else {
					sValidate=sValidate*Boolean(true);
				}
			}
			if (sValidate==1) {
				this._wizard.validateStep(this.byId("BasedStep"));
				window.that =this;
				var oTableActivitiesTasks = this.getView().byId("tableActivitiesTasks"); // retrieve table 
				var oActivitiesTasksModel = this.loadActivitiesTasks(oTableActivitiesTasks);	 //retrieve model
				oTableActivitiesTasks.setModel(oActivitiesTasksModel, "activitiesTaskList"); // assign model		
				this.getView().setModel(oActivitiesTasksModel,"activitiesTaskList");// assign model to view	
			} else {
				this._wizard.invalidateStep(this.byId("BasedStep"));
			}
		},
		//Function to go to Step 3
		goToJobConfig: function () {
			var sLength= this.getView().byId("tableActivitiesTasks").getBinding().oList.length;
			var sValidate=Boolean(true);
			for (var i=0; i<sLength;i++){
				var sResult= this.getView().byId("tableActivitiesTasks").getBinding().oList[i].RESULT;
				if (sResult ==undefined || sResult =="NOK") {
					sValidate=sValidate*Boolean(false);
				}else {
					sValidate=sValidate*Boolean(true);
				}
			}
			if (sValidate==1) {
				this._wizard.validateStep(this.byId("ActivitiesStep"));
				window.that =this;
				var oTableJobsTasks = this.getView().byId("tableJobsTasks"); // retrieve table 
				var oJobsTasksModel = this.loadJobsTasks(oTableJobsTasks);	 //retrieve model
				oTableJobsTasks.setModel(oJobsTasksModel, "jobsTaskList"); // assign model		
				this.getView().setModel(oJobsTasksModel,"jobsTaskList");// assign model to view	

			} else {
				this._wizard.invalidateStep(this.byId("ActivitiesStep"));
			}
		},
		
		//Function to go to Step 4
		goToPlantHierarchyConfig: function () {
			var sLength= this.getView().byId("tableJobsTasks").getBinding().oList.length;
			var sValidate=Boolean(true);
			for (var i=0; i<sLength;i++){
				var sResult= this.getView().byId("tableJobsTasks").getBinding().oList[i].RESULT;
				if (sResult ==undefined || sResult =="NOK") {
					sValidate=sValidate*Boolean(false);
				}else {
					sValidate=sValidate*Boolean(true);
				}
			}
			if (sValidate==1) {
				this._wizard.validateStep(this.byId("JobsStep"));
				window.that =this;
				var oTablePlantHieTasks = this.getView().byId("tablePlantHieTasks"); // retrieve table 
				var oPlantHieTasksModel = this.loadPlantHieTasks(oTablePlantHieTasks);	 //retrieve model
				oTablePlantHieTasks.setModel(oPlantHieTasksModel, "plantHieTaskList"); // assign model		
				this.getView().setModel(oPlantHieTasksModel,"plantHieTaskList");// assign model to view	

			} else {
				this._wizard.invalidateStep(this.byId("JobsStep"));
			}
		},


		optionalStepCompletion: function () {
			MessageToast.show(
				'This event is fired on complete of Step3. You can use it to gather the information, and lock the input data.'
			);
		},

		validateConfig: function () {
			var sLength= this.getView().byId("tablePlantHieTasks").getBinding().oList.length;
			var sValidate=Boolean(true);
			for (var i=0; i<sLength;i++){
				var sResult= this.getView().byId("tablePlantHieTasks").getBinding().oList[i].RESULT;
				if (sResult ==undefined || sResult =="NOK") {
					sValidate=sValidate*Boolean(false);
				}else {
					sValidate=sValidate*Boolean(true);
				}
			}
			if (sValidate==1) {
				this._wizard.validateStep(this.byId("PlantHierarchyStep"));

			} else {
				this._wizard.invalidateStep(this.byId("PlantHierarchyStep"));
			}
		},

		configComplete: function () {
			this.model.setProperty("/navApiEnabled", false);
		},

		scrollFrom4to2: function () {
			this._wizard.goToStep(this.byId("ActivitiesStep"));
		},

		goFrom4to3: function () {
			if (this._wizard.getProgressStep() === this.byId("PricingStep")) {
				this._wizard.previousStep();
			}
		},

		goFrom4to5: function () {
			if (this._wizard.getProgressStep() === this.byId("PricingStep")) {
				this._wizard.nextStep();
			}
		},

		wizardCompletedHandler: function () {
			this._oNavContainer.to(this._oWizardReviewPage);
			var sPlant=this.getView().byId("plantId")._getSelectedItemText();
			sap.ui.getCore().byId("plantRevId").setText(sPlant);
		},

		backToWizardContent: function () {
			this._oNavContainer.backToPage(this._oWizardContentPage.getId());
		},

		editStepOne: function () {
			this._handleNavigationToStep(0);
		},

		editStepTwo: function () {
			this._handleNavigationToStep(1);
		},

		editStepThree: function () {
			this._handleNavigationToStep(2);
		},

		editStepFour: function () {
			this._handleNavigationToStep(3);
		},

		_handleNavigationToStep: function (iStepNumber) {
			var fnAfterNavigate = function () {
				this._wizard.goToStep(this._wizard.getSteps()[iStepNumber]);
				this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
			}.bind(this);

			this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
			this.backToWizardContent();
		},

		_handleMessageBoxOpen: function (sMessage, sMessageBoxType) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						this._handleNavigationToStep(0);
						this._wizard.discardProgress(this._wizard.getSteps()[0]);
					}
				}.bind(this)
			});
		},

		/*_setEmptyValue: function (sPath) {
			this.model.setProperty(sPath, "n/a");
		},*/

		handleWizardCancel: function () {
			this._handleMessageBoxOpen("Are you sure you want to cancel your report?", "warning");
		},

		handleWizardSubmit: function () {
			this._handleMessageBoxOpen("Are you sure you want to submit your report?", "confirm");
		},

		discardProgress: function () {
			this._wizard.discardProgress(this.byId("BasedStep"));

			var clearContent = function (content) {
				for (var i = 0; i < content.length; i++) {
					if (content[i].setValue) {
						content[i].setValue("");
					}

					if (content[i].getContent) {
						clearContent(content[i].getContent());
					}
				}
			};

			//this.model.setProperty("/productWeightState", "Error");
			//this.model.setProperty("/productNameState", "Error");
			clearContent(this._wizard.getSteps());
		},
		displayByPass: function() {


		},
		colorBasedTaskFormatter: function() {
			var oList =this.getView().byId("tableBasedTasks");
				var items = oList.getRows();						
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					var oResult= item.oBindingContexts.basedTaskList.oModel.oData.Rowsets.Rowset[0].Row[i].RESULT
					if (oResult =="OK"){
						item.$().find(".taskStatusClass").removeClass("red");
						item.$().find(".taskStatusClass").addClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).removeClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("green");
					} else if (oResult =="NOK"){
						item.$().find(".taskStatusClass").removeClass("green");
						item.$().find(".taskStatusClass").addClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).removeClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("red");
					}
				}
		},
		colorActivityTaskFormatter: function() {
			var oList =this.getView().byId("tableActivitiesTasks");
				var items = oList.getRows();						
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					var oResult= item.oBindingContexts.activitiesTaskList.oModel.oData.Rowsets.Rowset[0].Row[i].RESULT
					if (oResult =="OK"){
						item.$().find(".taskStatusClass").removeClass("red");
						item.$().find(".taskStatusClass").addClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).removeClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("green");
					} else if (oResult =="NOK"){
						item.$().find(".taskStatusClass").removeClass("green");
						item.$().find(".taskStatusClass").addClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).removeClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("red");
					}
				}
		},
		colorJobTaskFormatter: function() {
			var oList =this.getView().byId("tableJobsTasks");
				var items = oList.getRows();						
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					var oResult= item.oBindingContexts.jobsTaskList.oModel.oData.Rowsets.Rowset[0].Row[i].RESULT
					if (oResult =="OK"){
						item.$().find(".taskStatusClass").removeClass("red");
						item.$().find(".taskStatusClass").addClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).removeClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("green");
					} else if (oResult =="NOK"){
						item.$().find(".taskStatusClass").removeClass("green");
						item.$().find(".taskStatusClass").addClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).removeClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("red");
					}
				}
		},
		colorPlantHieTaskFormatter: function() {
			var oList =this.getView().byId("tablePlantHieTasks");
				var items = oList.getRows();						
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					var oResult= item.oBindingContexts.plantHieTaskList.oModel.oData.Rowsets.Rowset[0].Row[i].RESULT
					if (oResult =="OK"){
						item.$().find(".taskStatusClass").removeClass("red");
						item.$().find(".taskStatusClass").addClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).removeClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("green");
					} else if (oResult =="NOK"){
						item.$().find(".taskStatusClass").removeClass("green");
						item.$().find(".taskStatusClass").addClass("red");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).removeClass("green");
						item.$().find("#"+item.$().find(".taskStatusClass").context.childNodes[3].id).addClass("red");
					}
				}
		}
	});
});
