		/*-----------------------------------------------------------------------------------
		Streaming Engine - Queue Monitoring
		Creation Date: 2020.06.02 / By: E0445955
		Reference Document: 
		Description:Used to monitor the queue
		-------------------------------------------------------------------------------------*/
		var oQueueMonitoringController;
		var oDialog;
		var sInputPlantId;
		var oResourceBundle;
		sap.ui.define([
			"../controller/BaseController",
			"sap/m/MessageBox",
			"StreamingEngine/StreamingEngine/model/formatter",
			"sap/m/MessageToast",
			"sap/m/Popover",
			"sap/m/Button",
			"sap/m/Dialog",
			"sap/m/Text",
			"sap/ui/model/Sorter"
		], function (BaseController, MessageBox, formatter, MessageToast, Popover, Button, Dialog, Text, Sorter) {
			"use strict";

			return BaseController.extend("StreamingEngine.StreamingEngine.controller.QueueMonitoring", {
				formatter: formatter,
				onInit: function () {
					// set message manager model
					var oMessageManager = sap.ui.getCore().getMessageManager();
					var oView = this.getView();
					oView.setModel(oMessageManager.getMessageModel(), "message");
					oMessageManager.registerObject(oView, true);

					oQueueMonitoringController = this;
					this.sSortQuery = "Q.DT_CREATED DESC";
					oDialog = this.getView().byId("BusyDialog");
					this.getView().byId("table-queue-monitoring").setModel(this.oModelQueueMonitoring);
					this.getView().byId("combobox-plant").setModel(this.oModelPlant);
					this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
					this.getView().byId("combobox-flow-type").setModel(this.oModelFlowType);
					this.getView().byId("combobox-status").setModel(this.oModelStatus);
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter.getRoute("QueueMonitoring").attachPatternMatched(this._onObjectMatched, this);

				},
				onAfterRendering: function () {
					oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
					/******************** Below Part for Authorisation***********************/
					var sRoles = document.getElementById('input-roles').value;
					var sAdminRole = "STREAMING_ENGINE_ADMIN";
					var sUserRole = "STREAMING_ENGINE_USER";
					var iAdminIndex = sRoles.indexOf(sAdminRole);
					var iUserIndex = sRoles.indexOf(sUserRole);
					if (iAdminIndex < 0 && iUserIndex < 0) {
						this.fnShowNoAccess();
						return;
					} else {
						this.getView().byId("page-queue-monitoring").setVisible(true);
					}
					/***********************************************************************/
				},
				fnShowNoAccess: function () {
					var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
					thisRouter.navTo("NoAccess");
				},

				_onObjectMatched: function (oEvent) {
					oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleQueueMonitoring"));
					this.fnResetSelection();
					oQueueMonitoringController.fnLoadPlant();
					//oQueueMonitoringController.fnLoadDataSource();
					oQueueMonitoringController.fnLoadFlowType();
					oQueueMonitoringController.fnLoadStatus();
					//oQueueMonitoringController.fnLoadPlantPopUp();
					//var sDateTimeNow = new Date();
					//this.getView().byId("datetime-from").setMaxDate(sDateTimeNow);
					//this.getView().byId("datetime-to").setMaxDate(sDateTimeNow);
				},
				fnResetSelection: function () {
					this.getView().byId("button-last-status").setEnabled(false);
					this.getView().byId("table-queue-monitoring").removeSelections();
					this.oModelQueueMonitoring.setProperty("/Selected", 0);
				},
				oModelQueueMonitoring: new sap.ui.model.json.JSONModel(),
				oModelPlant: new sap.ui.model.json.JSONModel(),
				oModelDataSource: new sap.ui.model.json.JSONModel(),
				oModelFlowType: new sap.ui.model.json.JSONModel(),
				oModelStatus: new sap.ui.model.json.JSONModel(),
				oModelPlantPopUp: new sap.ui.model.json.JSONModel(),
				fnLoadPlant: function () {
					var that = this;
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
						data: {
							"Param.20": document.getElementById("SE_Plant").value
						},
						success: function (result) {
							if (result.Rowsets.FatalError !== undefined) {
								that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
									oResourceBundle.getText("dataSourcesLoadPlantsList"),
									result.Rowsets.FatalError,
									"Error");
							} else {
								var data = result.Rowsets.Rowset[0];
								try {
									data.Row.unshift({
										DS_NAME: oResourceBundle.getText("commonAll"),
										ID_PLANT: "%"
									});
								} catch (err) { };
								oQueueMonitoringController.oModelPlant.setData(data);
								oQueueMonitoringController.oModelPlant.refresh();
								oQueueMonitoringController.getView().byId("combobox-plant").setSelectedKeys("%");
								oQueueMonitoringController.fnPlantSelected();
							}
						}
					});
				},
				fnPlantSelected: function () {
					this.fnLoadDataSource();
				},
				
				fnLoadDataSource: function () {
					if (oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys() == '%' || (oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys()[0] != '%' && oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys().includes('%') ) || oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys().length == 0 ) {
						oQueueMonitoringController.getView().byId("combobox-plant").setSelectedKeys("%")
						if (oQueueMonitoringController.oModelPlant.getData().Row) {
							var a= [...new Set(oQueueMonitoringController.oModelPlant.getData().Row.map(obj => obj.ID_PLANT))].map(String).slice(1,oQueueMonitoringController.oModelPlant.getData().Row.length)
							var Plantlist="";
							for (let i = 0; i < a.length; i++) {
								Plantlist +="'" + a[i] + "',"
							}
							var inputPlantId = Plantlist.slice(0, -1);
						}	
					}
					
					else {
					var a= oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys();
					var Plantlist="";
						for (let i = 0; i < a.length; i++) {
						Plantlist +="'" + a[i] + "',"
						}
					var inputPlantId = Plantlist.slice(0, -1);
					if (inputPlantId.includes('%')) {
					oQueueMonitoringController.getView().byId("combobox-plant").setSelectedKeys(a.slice(1,a.length));}
					}
					//var inputPlantId = oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys();
					var that = this;
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/SourceListByPlantSelectQuery&Content-Type=text/json",
						data: {
							"Param.1": inputPlantId,
							"Param.2": "%",
							"Param.20": document.getElementById("SE_Plant").value
						},
						success: function (result) {
							if (result.Rowsets.FatalError !== undefined) {
								that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
									oResourceBundle.getText("dataSourcesLoadDataSources"),
									result.Rowsets.FatalError,
									"Error");
							} else {
								var data = result.Rowsets.Rowset[0];
								try {
									data.Row.unshift({
										DS_NAME: oResourceBundle.getText("commonAll"),
										ID_SOURCE: "%"
									});
								} catch (err) { };
								oQueueMonitoringController.oModelDataSource.setData(data);
								oQueueMonitoringController.oModelDataSource.refresh();
								oQueueMonitoringController.getView().byId("combobox-data-source").setSelectedKeys("%");
								oQueueMonitoringController.fnLoadQueueMonitoring();
							  
							}
						}
					});
				},
				fnLoadFlowType: function () {
					var that = this;
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/FlowTypeListSelectQuery&Content-Type=text/json",
						data: {
						 
						},
						success: function (result) {
							if (result.Rowsets.FatalError !== undefined) {
								that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
									oResourceBundle.getText("dataSourcesLoadFlowType"),
									result.Rowsets.FatalError,
									"Error");
							} else {
								var data = result.Rowsets.Rowset[0];
								try {
									data.Row.unshift({
										DS_DESCRIPTION: oResourceBundle.getText("commonAll"),
										ID_FLOW_TYPE: "%"
									});
								} catch (err) { };
								oQueueMonitoringController.oModelFlowType.setData(data);
								oQueueMonitoringController.oModelFlowType.refresh();
								oQueueMonitoringController.getView().byId("combobox-flow-type").setSelectedKeys("%");
								
							  
							}
						}
					});
				},
				onSearch: function () {
					this.fnLoadQueueMonitoring();
				},
				fnLoadStatus: function () {
					var that = this;
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/StatusListSelectQuery&Content-Type=text/json",
						data: {
						 
						},
						success: function (result) {
							if (result.Rowsets.FatalError !== undefined) {
								that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
									oResourceBundle.getText("dataSourcesLoadFlowType"),
									result.Rowsets.FatalError,
									"Error");
							} else {
								var data = result.Rowsets.Rowset[0];
								try {
									data.Row.unshift({
										DS_DESCRIPTION: oResourceBundle.getText("commonAll"),
										ID_STATUS: "%"
									});
								} catch (err) { };
								oQueueMonitoringController.oModelStatus.setData(data);
								oQueueMonitoringController.oModelStatus.refresh();
								oQueueMonitoringController.getView().byId("combobox-status").setSelectedKeys("%");
								//oQueueMonitoringController.fnLoadQueueMonitoring();
								
							  
							}
						}
					});
				},
				fnLoadPlantPopUp: function () {
					var that = this;
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
						data: {
							"Param.20": document.getElementById("SE_Plant").value
						},
						success: function (result) {
							if (result.Rowsets.FatalError !== undefined) {
								that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
									oResourceBundle.getText("dataSourcesLoadPlantsList"),
									result.Rowsets.FatalError,
									"Error");
							} else {
								var data = result.Rowsets.Rowset[0];
								oQueueMonitoringController.oModelPlantPopUp.setData(data);
								oQueueMonitoringController.oModelPlantPopUp.refresh();
								if (oQueueMonitoringController._oDialog) {
									sap.ui.getCore().byId("combobox-plant-popup").setSelectedKey("");
								}
							}
						}
					});
				},
				fnFromDateChanged: function () {
					var sFromDate = this.getView().byId("datetime-from").getDateValue();
					if (sFromDate == null) { 		
					this.getView().byId("datetime-to").setMinDate(null);}
					else {
					this.getView().byId("datetime-to").setMinDate(sFromDate);}
					oQueueMonitoringController.fnLoadQueueMonitoring();
				},
				fnSelectionChanged: function (oEvent) {
					var aSelectedContexts = oEvent.getSource().getSelectedContexts();
					this.oModelQueueMonitoring.setProperty("/Selected", aSelectedContexts.length);
					this.getView().byId("button-last-status").setEnabled(aSelectedContexts.length === 1);
				},
				fnViewLastMessage: function () {
					var sPendingMessage = oResourceBundle.getText("queueMonitoringPendingMessage");
					var aSelectedContexts = this.byId("table-queue-monitoring").getSelectedContexts();
					if (aSelectedContexts.length == 1) {
						MessageBox.information(aSelectedContexts[0].getObject().DS_PENDING_MESSAGE, {
							icon: MessageBox.Icon.INFORMATION,
							title: sPendingMessage
						});
					}
				},
				fnDownloadMessage: function () {
					this.byId("button-download-message").setBusy(true);
					var aSelectedContexts = this.byId("table-queue-monitoring").getSelectedContexts();
					
					if (aSelectedContexts.length === 1) {
						// this.byId("button-download-message").setBusy(true);
						$.ajax({
							url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/JobQueueMessageSelectQuery&Content-Type=text/json",
							data: {
								"Param.1": aSelectedContexts[0].getObject().ID_QUEUE
							},
							success: function (data) {
								oQueueMonitoringController.byId("button-download-message").setBusy(false);
								if (data.Rowsets.FatalError !== undefined) {
									oQueueMonitoringController.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
										oResourceBundle.getText("queueMonitoringLoadJobMessage"),
										data.Rowsets.FatalError,
										"Error");
								} else {
									var sMessage = data.Rowsets.Rowset[0].Row[0].DS_PENDING_MESSAGE;
									var oAnchor = document.createElement("a");
									var oFile = new Blob([sMessage]);
									var sFileType = oQueueMonitoringController.fnGetFileType(sMessage);
									oAnchor.download = "Message." + sFileType;
									oAnchor.href = window.URL.createObjectURL(oFile);
									oAnchor.click();
								}
							}
						});
					} else if (aSelectedContexts.length > 1) {
						// this.byId("button-download-message").setBusy(true);
						$.ajax({
							url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/JobQueueMessageDownloadZipXacuteQuery&Content-Type=text/json",
							type: "POST",
							data: {
								"Param.1": aSelectedContexts.map(e => e.getObject().ID_QUEUE).join("\n")
							},
							success: function (data) {
								oQueueMonitoringController.byId("button-download-message").setBusy(false);
								if (data.Rowsets.FatalError !== undefined) {
									oQueueMonitoringController.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
										oResourceBundle.getText("queueMonitoringLoadJobMessage"),
										data.Rowsets.FatalError,
										"Error");
								} else {
									var sMessage = data.Rowsets.Rowset[0].Row[0].Output;
									var oAnchor = document.createElement("a");
									var oFile = new Blob([Uint8Array.from(atob(sMessage), e => e.charCodeAt(0))], { type: "application/octet-stream" });
									oAnchor.download = "Messages.zip";
									oAnchor.href = window.URL.createObjectURL(oFile);
									oAnchor.click();
								}
							},
							error: function() {
								oQueueMonitoringController.byId("button-download-message").setBusy(false);
							}
						});
					}
				},
				fnGetFileType: function(sMessage){
					var oXMLParser = new DOMParser();
					var xXmlDoc = oXMLParser.parseFromString(sMessage,"text/xml");
					if(xXmlDoc.querySelector("parsererror") == null){
						//xml type
						return "xml";
					} else {
						try {
							JSON.parse(sMessage);
						} catch (e) {
							return "txt";
						}
						return "json";
					}
				},
				fnLoadQueueMonitoring: function (iOffset=0) {
					if (typeof iOffset !== "number") iOffset = 0;
					if (iOffset == 0) {
						oDialog.open();
						this.fnResetSelection();
					}
					
					if (oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys() == '%' || (oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys()[0] != '%' && oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys().includes('%') ) || oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys().length == 0 ) {
						oQueueMonitoringController.getView().byId("combobox-plant").setSelectedKeys("%")
						if (oQueueMonitoringController.oModelPlant.getData().Row) {
							var a= [...new Set(oQueueMonitoringController.oModelPlant.getData().Row.map(obj => obj.ID_PLANT))].map(String).slice(1,oQueueMonitoringController.oModelPlant.getData().Row.length)
							var Plantlist="";
							for (let i = 0; i < a.length; i++) {
								Plantlist +="'" + a[i] + "',"
							}
							var inputPlantId = Plantlist.slice(0, -1);
						}	
					}
					
					else {
					var a= oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys();
					var Plantlist="";
						for (let i = 0; i < a.length; i++) {
						Plantlist +="'" + a[i] + "',"
						}
					var inputPlantId = Plantlist.slice(0, -1);
					if (inputPlantId.includes('%')) {
					oQueueMonitoringController.getView().byId("combobox-plant").setSelectedKeys(a.slice(1,a.length));}
					}
					
					if (oQueueMonitoringController.getView().byId("combobox-data-source").getSelectedKeys() == '%' || (oQueueMonitoringController.getView().byId("combobox-data-source").getSelectedKeys()[0] != '%' && oQueueMonitoringController.getView().byId("combobox-data-source").getSelectedKeys().includes('%') ) || oQueueMonitoringController.getView().byId("combobox-data-source").getSelectedKeys().length == 0 ) {
						oQueueMonitoringController.getView().byId("combobox-data-source").setSelectedKeys("%")
						if (oQueueMonitoringController.oModelDataSource.getData().Row) {
							var b= [...new Set(oQueueMonitoringController.oModelDataSource.getData().Row.map(obj => obj.ID_SOURCE))].map(String).slice(1,oQueueMonitoringController.oModelDataSource.getData().Row.length)
							var Sourcelist="";
								for (let i = 0; i < b.length; i++) {
								Sourcelist +="'" + b[i] + "',"
								}
							var inputdatasource = Sourcelist.slice(0, -1);
						}
					}
					
					else {
					var b= oQueueMonitoringController.getView().byId("combobox-data-source").getSelectedKeys();
					var Sourcelist="";
						for (let i = 0; i < b.length; i++) {
						Sourcelist +="'" + b[i] + "',"
						}
					var inputdatasource = Sourcelist.slice(0, -1);
					if (inputdatasource.includes('%')) {
					oQueueMonitoringController.getView().byId("combobox-data-source").setSelectedKeys(b.slice(1, b.length));}
					}
					
					
					if (oQueueMonitoringController.getView().byId("combobox-flow-type").getSelectedKeys() == '%' || (oQueueMonitoringController.getView().byId("combobox-flow-type").getSelectedKeys()[0] != '%' && oQueueMonitoringController.getView().byId("combobox-flow-type").getSelectedKeys().includes('%') ) || oQueueMonitoringController.getView().byId("combobox-flow-type").getSelectedKeys().length == 0 ) {
						oQueueMonitoringController.getView().byId("combobox-flow-type").setSelectedKeys("%")
						if (oQueueMonitoringController.oModelFlowType.getData().Row) {
							var c= [...new Set(oQueueMonitoringController.oModelFlowType.getData().Row.map(obj => obj.ID_FLOW_TYPE))].map(String).slice(1,oQueueMonitoringController.oModelFlowType.getData().Row.length)
							var Typelist="";
								for (let i = 0; i < c.length; i++) {
								Typelist +="'" + c[i] + "',"
								}
							var inputflowtype = Typelist.slice(0, -1);
						}
					}
					
					else {
					var c= oQueueMonitoringController.getView().byId("combobox-flow-type").getSelectedKeys();
					var Typelist="";
						for (let i = 0; i < c.length; i++) {
						Typelist +="'" + c[i] + "',"
						}
					var inputflowtype = Typelist.slice(0, -1);
					if (inputflowtype.includes('%')) {
					oQueueMonitoringController.getView().byId("combobox-flow-type").setSelectedKeys(c.slice(1, c.length));}
					}
					
					var inputflowname = oQueueMonitoringController.getView().byId("input-flow-name").getValue();
					var inputflownameFilter = "%" + inputflowname.replace(/ /gi, '%') + "%";
					
					
					if (oQueueMonitoringController.getView().byId("combobox-status").getSelectedKeys() == '%' || (oQueueMonitoringController.getView().byId("combobox-status").getSelectedKeys()[0] != '%' && oQueueMonitoringController.getView().byId("combobox-status").getSelectedKeys().includes('%') ) || oQueueMonitoringController.getView().byId("combobox-status").getSelectedKeys().length == 0 ) {
						oQueueMonitoringController.getView().byId("combobox-status").setSelectedKeys("%")
						if (oQueueMonitoringController.oModelStatus.getData().Row) {
							var d= [...new Set(oQueueMonitoringController.oModelStatus.getData().Row.map(obj => obj.ID_STATUS))].map(String).slice(1,oQueueMonitoringController.oModelStatus.getData().Row.length)
							var Typelist="";
								for (let i = 0; i < d.length; i++) {
								Typelist +="'" + d[i] + "',"
								}
							var inputstatus = Typelist.slice(0, -1);
						}
					}
					
					else {
						var d= oQueueMonitoringController.getView().byId("combobox-status").getSelectedKeys();
						var Typelist="";
							for (let i = 0; i < d.length; i++) {
							Typelist +="'" + d[i] + "',"
							}
						var inputstatus = Typelist.slice(0, -1);
						if (inputstatus.includes('%')) {
						oQueueMonitoringController.getView().byId("combobox-status").setSelectedKeys(d.slice(1, d.length));}
					}
					
					
					var StartDate = this.getView().byId("datetime-from").getValue();
					var EndDate = this.getView().byId("datetime-to").getValue();
					var Param6 = (StartDate != "" ? "Q.DT_CREATED >= TO_TIMESTAMP ('" + StartDate + "','DD/MM/YYYY\" \"HH24:MI:SS') AND" : "");
					var Param7 = (EndDate != "" ? "Q.DT_CREATED < TO_TIMESTAMP ('" + EndDate + "','DD/MM/YYYY\" \"HH24:MI:SS') AND" : "");
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/JobQueueMonitoringListSelectQuery&Content-Type=text/json",
						data: {
							"Param.1": inputPlantId,
							"Param.2": inputdatasource,
							"Param.3": inputflowtype,
							"Param.4": inputflownameFilter,
							"Param.5": inputstatus,
							"Param.6": Param6,
							"Param.7": Param7,
							"Param.20": document.getElementById("SE_Plant").value,
							"Param.30": iOffset,
							"Param.31": this.sSortQuery
						},
						success: function (result) {
							if (result.Rowsets.FatalError !== undefined) {
								oQueueMonitoringController.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
									oResourceBundle.getText("queueMonitoringLoadJobList"),
									result.Rowsets.FatalError,
									"Error");
							} else {
									if (result.Rowsets.Rowset) {
										var data = result.Rowsets.Rowset[0];
									}
								
								if (iOffset > 0) {
									oQueueMonitoringController.oModelQueueMonitoring.getData().Row.push(...data.Row);
								} else {
									oQueueMonitoringController.oModelQueueMonitoring.setProperty("/Row", []);
									oQueueMonitoringController.oModelQueueMonitoring.setData(data);
									oQueueMonitoringController.oModelQueueMonitoring.setProperty("/Selected", 0);
								}
								oQueueMonitoringController.oModelQueueMonitoring.refresh();
								
							}
							oDialog.close();
						}
					});
				},
				
				fnResetQueuePopUp: function () {
					if (!this._oDialog) {
						this._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.ResetQueue", this);
					}
					this.getView().addDependent(this._oDialog);
					this._oDialog.open();
					oQueueMonitoringController.fnInitPopup();

				},
				fnInitPopup: function () {
					sap.ui.getCore().byId("combobox-plant-popup").setModel(this.oModelPlantPopUp);
					oQueueMonitoringController.fnLoadPlantPopUp();
				},
				fnClosePopOver: function () {
					this._oDialog.close();
				},
				fnResetQueue: function () {
					var sQueueResetSuccess = oResourceBundle.getText("queueMonitoringQueueResetSuccess");
					var bValid = this.fnValidateInputs();
					if (bValid) {
						var that = this;
						$.ajax({
							url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/EngineQueueResetXacuteQuery&Content-Type=text/json",
							type: "POST",
							async: true,
							data: {
								"Param.1": sInputPlantId
							},
							success: function (result) {
								if (result.Rowsets.FatalError) {
									var sErrorMessage = result.Rowsets.FatalError;
									//MessageToast.show(sErrorMessage);
									that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
										oResourceBundle.getText("queueMonitoringResetQueue"),
										sErrorMessage,
										"Error");
									oDialog.close();
								} else {
									oQueueMonitoringController.fnClosePopOver();
									var sSuccessMessage = sQueueResetSuccess;
									//MessageToast.show(sSuccessMessage);
									that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
										oResourceBundle.getText("queueMonitoringResetQueue"),
										sSuccessMessage,
										"Success");
									oQueueMonitoringController.fnLoadQueueMonitoring();

								}
							},
							error: function () {

							}
						});
					}

				},



				fnDeleteQueuePopUp: function () {
					if (!this._oDialog2) {
						this._oDialog2 = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.DeleteQueue", this);
					}
					this.getView().addDependent(this._oDialog2);
					this._oDialog2.open();
					oQueueMonitoringController.fnInitPopup2();

				},
				fnInitPopup2: function () {
					sap.ui.getCore().byId("combobox-plant-popup2").setModel(this.oModelPlantPopUp);
					oQueueMonitoringController.fnLoadPlantPopUp2();
				},
				fnLoadPlantPopUp2: function () {
					var that = this;
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
						data: {
							"Param.20": document.getElementById("SE_Plant").value
						},
						success: function (result) {
							if (result.Rowsets.FatalError !== undefined) {
								that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
									oResourceBundle.getText("dataSourcesLoadPlantsList"),
									result.Rowsets.FatalError,
									"Error");
							} else {
								var data = result.Rowsets.Rowset[0];
								oQueueMonitoringController.oModelPlantPopUp.setData(data);
								oQueueMonitoringController.oModelPlantPopUp.refresh();
								if (oQueueMonitoringController._oDialog) {
									sap.ui.getCore().byId("combobox-plant-popup2").setSelectedKey("");
								}
							}
						}
					});
				},
				fnClosePopOver2: function () {
					this._oDialog2.close();
				},
				fnDeleteQueue: function () {
					var sDeleteExpiredSuccess = oResourceBundle.getText("queueMonitoringDeleteExpiredSuccess");
					var bValid = this.fnValidateInputs2();
					if (bValid) {
						var that = this;
						$.ajax({
							url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/EngineQueueDeleteQuery&Content-Type=text/json",
							type: "POST",
							async: true,
							data: {
								"Param.1": sInputPlantId
							},
							success: function (result) {
								if (result.Rowsets.FatalError) {
									var sErrorMessage = result.Rowsets.FatalError;
									//MessageToast.show(sErrorMessage);
									that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
										oResourceBundle.getText("queueMonitoringDeleteExpiredMessages"),
										sErrorMessage,
										"Error");
									oQueueMonitoringController.oDialog2.close();
								} else {
									oQueueMonitoringController.fnClosePopOver2();
									var sSuccessMessage = sDeleteExpiredSuccess;
									//MessageToast.show(sSuccessMessage);
									that.handleMessage(oResourceBundle.getText("commonTitleQueueMonitoring"),
										oResourceBundle.getText("queueMonitoringDeleteExpiredMessages"),
										sSuccessMessage,
										"Success");
									oQueueMonitoringController.fnLoadQueueMonitoring();

								}
							},
							error: function () {

							}
						});
					}

				},
				fnValidateInputs2: function () {
					var bValidInputs = true;

					sInputPlantId = sap.ui.getCore().byId("combobox-plant-popup2").getSelectedKey();

					if (sInputPlantId == "") {
						bValidInputs = false;
						sap.ui.getCore().byId("combobox-plant-popup2").setValueState("Error");
					} else {
						sap.ui.getCore().byId("combobox-plant-popup2").setValueState("None");
					}
					return bValidInputs;

				},


				fnValidateInputs: function () {
					var bValidInputs = true;

					sInputPlantId = sap.ui.getCore().byId("combobox-plant-popup").getSelectedKey();

					if (sInputPlantId == "") {
						bValidInputs = false;
						sap.ui.getCore().byId("combobox-plant-popup").setValueState("Error");
					} else {
						sap.ui.getCore().byId("combobox-plant-popup").setValueState("None");
					}
					return bValidInputs;

				},
				fnNavigateBack: function () {
					var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
					thisrouter.navTo("Launchpad");

				},
				fnViewSettingsButtonPressed: function (oEvent) {
					if (!this._oSortDialog) {
						this._oSortDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.ViewSettingDialogQueueMonitoring", this);
					}
					this.getView().addDependent(this._oSortDialog);
					this._oSortDialog.open();
				},
				fnConfirmSettings: function (oEvent) {
					var mParams = oEvent.getParameters();
					var sPath = mParams.sortItem.getKey();
					var bDescending = mParams.sortDescending;

					oQueueMonitoringController.sSortQuery = sPath + " " + (bDescending ? "DESC" : "ASC");
					oQueueMonitoringController.fnLoadQueueMonitoring();
				},
				fnGrowingStarted: function(oEvent) {
					var iOffset = oEvent.getParameter("total")
					if (oEvent.getParameter("reason") === "Growing" && (iOffset - oEvent.getParameter("actual")) <= 20 ) { // 20 is the growing threshold
						this.fnLoadQueueMonitoring(iOffset);
					}
				}
			});
		});