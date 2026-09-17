sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment,formatter) {
	"use strict";

	return Controller.extend("CODE_REVIEW.controller.codeReview", {
		formatter: formatter,
		onInit: function () {
		                                this.loadProjects();


                        },	
		loadProjects: function() {
		         var projectsList = new sap.ui.model.json.JSONModel();
                               this.getView().setModel(projectsList, "projectsList");
   	                  var url = "/XMII/Illuminator?service=CombineQueryRowsets&QueryTemplate=SANOFI_CORE/CODE_REVIEW/QUERY/SELECT_EXISTING_PROJECTS&Content-Type=text/json";
                                var model = new sap.ui.model.json.JSONModel();
                                model.loadData(url, '', false, "POST");
                                projectsList = model.getData().Rowsets;
		       this.getView().getModel("projectsList").setData(projectsList);
		       model.destroy();
		},
		handleCodeReviewPress: function(oEvent) {
		         var listErrorsModel = new sap.ui.model.json.JSONModel();
                                this.getView().setModel(listErrorsModel, "listErrorsModel");
			var projectName = this.getView().byId("selectionList").getSelectedKey()
		
 		   var url = "/XMII/Illuminator?QueryTemplate=SANOFI_CORE/CODE_REVIEW/QUERY/XCT_AUTOMATIC_CODE_REVIEW&Content-Type=text/json";
                                var model = new sap.ui.model.json.JSONModel();
		       var param = {
                                        "Param.1": projectName,
                                        "Param.2":  this.getView().byId("FL_QUERY").getSelected(),
                                        "Param.3": this.getView().byId("FL_TRANSACTION").getSelected(),
                                        "Param.4": this.getView().byId("FL_WEB").getSelected(),

                                };

                                model.loadData(url, param, false, "POST");
                                listErrorsModel = model.getData().Rowsets;
		       this.getView().getModel("listErrorsModel").setData(listErrorsModel);
			this.getView().byId("reportPanel").setVisible(true)
		       model.destroy();
		}, 
		handleStatisticPress: function(oEvent) {
     
                                                          var listStatsModel = new sap.ui.model.json.JSONModel();
                               this.getView().setModel(listStatsModel, "listStatsModel");
			var projectName = this.getView().byId("selectionList").getSelectedKey()
 			   var url = "/XMII/Illuminator?service=CombineQueryRowsets&QueryTemplate=SANOFI_CORE/CODE_REVIEW/QUERY/SELECT_STATISTIC_FOR_ONE_PROJECT&Content-Type=text/json";
                                var model = new sap.ui.model.json.JSONModel();
		       var param = {
                                        "Param.1": projectName
                                };

                                model.loadData(url, param, false, "POST");
                                listStatsModel = model.getData().Rowsets;
		       this.getView().getModel("listStatsModel").setData(listStatsModel);
			this.getView().byId("listStatsModel").setVisible(true)
		       model.destroy();
		}
	});
});
