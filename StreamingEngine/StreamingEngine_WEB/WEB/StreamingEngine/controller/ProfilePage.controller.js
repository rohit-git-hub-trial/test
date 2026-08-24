/*-----------------------------------------------------------------------------------
Streaming Engine - Profile Page
Creation Date: 2020.09.08 / By: E0445955
Reference Document: 
Description:Profile Page Preferences
-------------------------------------------------------------------------------------*/

var oProfilePageController;
var oDialog;
var iAdminIndex;
var iBsoIndex;
var iUserIndex;
var oResourceBundle;
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/MessageToast",
	"sap/m/Popover",
	"sap/ui/model/Filter",
	"sap/ui/core/routing/History",
	"sap/ui/core/Item",
], function (Controller, Dialog, Button, Text, MessageToast, Popover, Filter, History, Item) {
	"use strict";

	return Controller.extend("StreamingEngine.StreamingEngine.controller.ProfilePage", {
		onInit: function () {
			oProfilePageController = this;
			oDialog = this.getView().byId("BusyDialog");
			this.getView().byId("list-digital-apps").setModel(this.oModelDigitalApps);			
			this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("ProfilePage").attachPatternMatched(this._onObjectMatched, this);
			
			var oViewModel = new sap.ui.model.json.JSONModel({
                isTechnicalMonitoringSelected: false // Initial visibility of the MultiComboBox
            });
            this.getView().setModel(oViewModel, "viewModel");
			
			// Attach selectionChange event to the MultiComboBox
			var oMultiComboBox = this.getView().byId("combobox-data-source");
			oMultiComboBox.attachSelectionChange(this.onDataSourceSelectionChange.bind(this));
		},
		oModelDigitalApps: new sap.ui.model.json.JSONModel(),
		oModelDataSource: new sap.ui.model.json.JSONModel(),
		onAfterRendering: function () {
			oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			/******************** Below Part for Authorisation***********************/
			var sRoles = document.getElementById('input-roles').value;
			var sAdminRole = "STREAMING_ENGINE_ADMIN";
			var sBsoRole = "STREAMING_ENGINE_BUSINESS_OWNER";
			var sUserRole = "STREAMING_ENGINE_USER";
			iAdminIndex = sRoles.indexOf(sAdminRole);
			iBsoIndex = sRoles.indexOf(sBsoRole);
			iUserIndex = sRoles.indexOf(sUserRole);
			if (iAdminIndex < 0 && iUserIndex < 0  && iBsoIndex<0) {
				this.fnShowNoAccess();
				return;
			} else {
				this.getView().byId("page-profile-information").setVisible(true);
			}
			/***********************************************************************/
			this.fnLoadProfileValues();
			this.fnLoadDataSource();
							
		},
		
		onTechnicalMonitoringSelect: function (oEvent) {
            var bSelected = oEvent.getParameter("selected"); // Check if checkbox is selected
            var oViewModel = this.getView().getModel("viewModel"); // Access the view model

            // Update the visibility of the MultiComboBox
            oViewModel.setProperty("/isTechnicalMonitoringSelected", bSelected);

            // If unselected, clear all selections in the MultiComboBox
            if (!bSelected) {
                var oMultiComboBox = this.getView().byId("combobox-data-source");
                oMultiComboBox.setSelectedKeys([]); // Deselect all items
            }
        },
		onDataSourceSelectionChange: function(oEvent) {
			var oMultiComboBox = oEvent.getSource();
			var bSelected = oEvent.getParameter("selected"); // Check if the item is selected or deselected
			var sKey = oEvent.getParameter("changedItem").getKey(); // Get the key of the changed item
			
			// If "commonAll" (identified by key "%") is selected or deselected
			if (sKey === "%") {
				if (bSelected) {
					// Select all items
					oMultiComboBox.getItems().forEach(function(item) {
						oMultiComboBox.addSelectedItem(item);
					});
				} else {
					// Deselect all items
					oMultiComboBox.removeAllSelectedItems();
				}
			}
			},
		fnShowNoAccess: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("NoAccess");
		},
		_onObjectMatched: function (oEvent) {
			oAppController.fnUpdate(this, oResourceBundle.getText("MyProfileTitle"));
			oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
		},
		fnLoadProfileValues: function () {
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserProfile/Query/CurrentProfileXacuteQuery&Content-Type=text/json",

				success: function (result) {
					if (result.Rowsets.Rowset) {

						oProfilePageController.getView().byId("checkbox-Technical").setSelected(false);
						oProfilePageController.getView().byId("checkbox-Queue").setSelected(false);
						var i;
						var data = result.Rowsets.Rowset[0];
						var sFullName = data.Row[0].FullName;
						var sLoginName = data.Row[0].LoginName;
						var sTitle = data.Row[0].Title;
						var sEmail = data.Row[0].DS_EMAIL;
						var sPlant = data.Row[0].SE_Plant;
						var sLoginRoles = data.Row[0].LoginRoles;
						var arrRoles = sLoginRoles.split(",");
						var oList = oProfilePageController.getView().byId("list-roles");
						oList.removeAllItems();
						for (i = 0; i < arrRoles.length; i++) {
							var sText = arrRoles[i].replace(/'/g, '');
							var oItem = new Item({
								text: sText
							});
							oList.addItem(oItem);
							//console.log(arrRoles[i]);
						}
						var sUserLanguage = data.Row[0].DS_LANGUAGE;
						var iTechnicalFlag = 0;
						if(data.Row[0].FL_ALERT_JOBS==1 && data.Row[0].FL_ALERT_AGENTS==1) iTechnicalFlag = 1;
						var iQueueFlag = data.Row[0].FL_ALERT_QUEUE;
						var iHistoricalFlag = data.Row[0].FL_ALERT_HISTORICAL;

						oProfilePageController.getView().byId("combobox-language").setSelectedKey(sUserLanguage);
						if (iTechnicalFlag == 1) {
							oProfilePageController.getView().byId("checkbox-Technical").setSelected(true);
							oProfilePageController.fnLoadDataSource();
							oProfilePageController.getView().byId("combobox-data-source").setVisible(true);
							
										
										// Fetch the ID_SOURCE values from rowset 2
								var aRowset2 = result.Rowsets.Rowset[1].Row; // Assuming rowset 2 is at index 1
								var aSelectedSources = aRowset2.map(function(item) {
									return item.ID_SOURCE;
								});

								// Set the selected keys in the MultiComboBox
								var oMultiComboBox = oProfilePageController.getView().byId("combobox-data-source");
								oMultiComboBox.setSelectedKeys(aSelectedSources);
								oMultiComboBox.setVisible(true);
										
						}	else {
								oProfilePageController.getView().byId("combobox-data-source").setVisible(false);
						}			
						if (iQueueFlag == 1) {
							oProfilePageController.getView().byId("checkbox-Queue").setSelected(true);
						}
						if (iHistoricalFlag == 1) {
							oProfilePageController.getView().byId("checkbox-HistoricalUpload").setSelected(true);
						}
						var sLanguageDefault = data.Row[0].LanguageDefault;
						oProfilePageController.getView().byId("object-header-profile").setTitle(sFullName);
						oProfilePageController.getView().byId("object-header-profile").setIntro(sTitle);
						oProfilePageController.getView().byId("attribute-email").setValue(sEmail);
						oProfilePageController.getView().byId("attribute-defaultLanguage").setText(sLanguageDefault);
						oProfilePageController.getView().byId("text-plant").setText(sPlant);
						//oProfilePageController.getView().byId("text-login-roles").setText(sLoginRoles);
						oProfilePageController.fnLoadDigitalApps(sLoginName);
					} else if (result.Rowsets.FatalError) {
						var errorMsg = result.Rowsets.FatalError;
						MessageToast.show(errorMsg);
					}
				}
			});

		},
		fnLoadDigitalApps: function (sLoginName) {
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserProfile/Query/UserDigitalAppListSelectQuery&Content-Type=text/json",
				data: {
					'Param.1': sLoginName
				},
				success: function (result) {
					if (result.Rowsets.Rowset) {
						var data = result.Rowsets.Rowset[0];
						oProfilePageController.oModelDigitalApps.setData(data);
						oProfilePageController.oModelDigitalApps.refresh();

					} else if (result.Rowsets.FatalError) {
						var errorMsg = result.Rowsets.FatalError;
						MessageToast.show(errorMsg);
					}
				}
			});

		},
		fnValidateInputs: function () {
			var bValidInputs = true;

			return bValidInputs;

		},

		fnAddUpdateProfilePage: function () {
			/*var bIsValid = this.fnValidateInputs();
			if (bIsValid) {}*/
			var sUserLanguage = oProfilePageController.getView().byId("combobox-language").getSelectedKey();
			var iTechnicalFlag = oProfilePageController.getView().byId("checkbox-Technical").getSelected() ? 1 : 0;
			var iQueueFlag = oProfilePageController.getView().byId("checkbox-Queue").getSelected() ? 1 : 0;
			var iHistoricalFlag = oProfilePageController.getView().byId("checkbox-HistoricalUpload").getSelected() ? 1 : 0;
			var sEmail = oProfilePageController.getView().byId("attribute-email").getValue();
			
			var oEmailInput = oProfilePageController.getView().byId("attribute-email");
			var sEmail = oEmailInput.getValue();

			// Reset any previous error state
			oEmailInput.setValueState("None");
			oEmailInput.setValueStateText("");

			// Email validation: Empty check
			if (!sEmail) {
				oEmailInput.setValueState("Error");
				oEmailInput.setValueStateText("Email cannot be empty");
				MessageToast.show("Email cannot be empty");
				return;
			}

			// Email format check
			var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(sEmail)) {
				oEmailInput.setValueState("Error");
				oEmailInput.setValueStateText("Please enter a valid email address");
				MessageToast.show("Please enter a valid email address");
				return;
			}

			
			var iJobsFlag = 0;
			var iAgentsFlag = 0;
			if (iTechnicalFlag==1) {
				iJobsFlag = 1;
				iAgentsFlag = 1;
			}
			// Get selected data sources
				var oMultiComboBox = oProfilePageController.getView().byId("combobox-data-source");
				var aSelectedKeys = oMultiComboBox.getSelectedKeys(); // Array of selected data source keys
				var sSelectedDataSources = aSelectedKeys.join(','); // Convert array to a comma-separated string

			oDialog.open();
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserProfile/Query/UserProfileXacuteQuery&Content-Type=text/json",
				data: {
					"Param.1": sUserLanguage,
					"Param.2": iJobsFlag,
					"Param.3": iQueueFlag,
					"Param.4": iAgentsFlag,
					"Param.5": sSelectedDataSources,
					"Param.6": sEmail,
					"Param.7": iHistoricalFlag
				},
				success: function (result) {
					if (result.Rowsets.Rowset) {
						var data = result.Rowsets.Rowset[0];
						var successMsg = data.Row[0].Output;
						if (successMsg == "{##SUCCESS_MESSAGE}") {
							successMsg = oResourceBundle.getText("ProfilePageSaveSuccess");
						}
						oDialog.close();
						MessageToast.show(successMsg);
					} else if (result.Rowsets.FatalError) {
						var errorMsg = result.Rowsets.FatalError;
						oDialog.close();
						MessageToast.show(errorMsg);
					}
				}
			});
		},
		
		fnLoadDataSource: function () {
            //var inputPlantId = oQueueMonitoringController.getView().byId("combobox-plant").getSelectedKeys();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/SourceListAllSelectQuery&Content-Type=text/json",
                data: {
                    //"Param.1": "*",
                    "Param.2": "%",
                    "Param.20": "*"
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("ProfilePageSaveSuccess"),
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
                        oProfilePageController.oModelDataSource.setData(data);
                        oProfilePageController.oModelDataSource.refresh();
                        //oProfilePageController.getView().byId("combobox-data-source").setSelectedKeys("%");
						
                      
                    }
                }
            });
		},
		fnNavigateBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("Launchpad", true);
			}
		}
	});
});