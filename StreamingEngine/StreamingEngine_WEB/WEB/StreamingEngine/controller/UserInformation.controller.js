/*-----------------------------------------------------------------------------------
Streaming Engine - User Configuration Information
Creation Date: 2024.01.08 / By: E0449160
Reference Document: 
Description: User Configuration Information is a page from where the users can be managed
-------------------------------------------------------------------------------------*/

var sRefreshNeeded = "N";
var oUserInfoController;
var oDialog;
var oResourceBundle;
var bShowCommentDialog = true;
var sAction;
var sDigitalAppsList
var sDigitalAppToDelete;

sap.ui.define([
	"../controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/Button",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, Button, MessageToast, MessageBox) {
	"use strict";

	return BaseController.extend("StreamingEngine.StreamingEngine.controller.UserInformation", {

		oModelAssignedDigitalApps: new JSONModel(),
		oModelDigitalAppsList: new JSONModel(),

		onInit: function () {
			// set message manager model //
			var oMessageManager = sap.ui.getCore().getMessageManager();
			var oView = this.getView();
			oView.setModel(oMessageManager.getMessageModel(), "message");
			oMessageManager.registerObject(oView, true);
			// ************************* //
			oUserInfoController = this;
			oDialog = this.getView().byId("BusyDialog");
			oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			this.byId("table-digital-apps").setModel(this.oModelAssignedDigitalApps, "AssignedDigitalApps");

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("UserInformation").attachPatternMatched(this._onObjectMatched, this);


		},
		_onObjectMatched: function (oEvent) {
			sRefreshNeeded = "N";
			this.oModelAssignedDigitalApps.setData([]);
			oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleUserInformation"));
			//get route parameters
			var sUsername = oEvent.getParameter("arguments").ID_USERNAME;
			//set binding model to the view		
			var oModel = new JSONModel();
			var oView = this.getView();
			oView.setModel(oModel);
			oView.bindElement("/");

			var oModelData;
			var aUsersModel = oUserInfoController.getOwnerComponent().getModel("UsersModel").getData().Row;
			if (!jQuery.isEmptyObject(aUsersModel)) {
				oModelData = aUsersModel.find(element => element.ID_USERNAME === sUsername);
				if (oModelData) {
					//bind the view with user's data
					oModel.setData(oModelData);
					this.fnLoadAssignedApps(sUsername);
				} else {
					//load user's data from db
					oUserInfoController.fnLoadUserData(sUsername);
				}
			} else {
				//load user's data from db
				oUserInfoController.fnLoadUserData(sUsername);
			}


			this.fnResetChangeDialog();
		},
		fnResetChangeDialog: function () {
			if (bRequireChangeComment) {
				this.oModelChangeMessages = new JSONModel({
					Row: []
				});
			}
		},
		onAfterRendering: function () {
			oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			/******************** Below Part for Authorisation***********************/
			var sRoles = document.getElementById('input-roles').value;
			var sBusinessOwnerRole = "STREAMING_ENGINE_BUSINESS_OWNER";
			var iBusinessOwner = sRoles.indexOf(sBusinessOwnerRole);
			if (iBusinessOwner < 0) {
				this.fnShowNoAccess();
				return;
			} else {
				this.getView().byId("page-user-information").setVisible(true);
			}
		},
		fnShowNoAccess: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("NoAccess");
		},
		fnLoadUserData: function (sUsername) {
			var that = this;
			var oView = this.getView();
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserManagement/Query/UserDataSelectQuery&Content-Type=text/json",
				data: {
					"Param.1": sUsername,
					"Param.20": document.getElementById("SE_Plant").value
				},
				success: function (result) {
					if (result.Rowsets.Rowset) {
						if (result.Rowsets.Rowset[0].Row) {
							var oData = result.Rowsets.Rowset[0].Row[0];
							oView.getModel().setData(oData);
							that.fnLoadAssignedApps(sUsername);
						} else {
							oView.getModel().setData([]); oView.getModel().refresh(true);
							that.oModelAssignedDigitalApps.setData([]);
							that.oModelAssignedDigitalApps.refresh(true);
						}
						oView.getModel().refresh(true);
					} else if (result.Rowsets.FatalError) {
						var errorMsg = result.Rowsets.FatalError;
						MessageToast.show(errorMsg);
					}
				}
			});
		},
		fnLoadAssignedApps: function (sUsername) {
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserProfile/Query/UserDigitalAppListSelectQuery&Content-Type=text/json",
				data: {
					"Param.1": sUsername
				},
				success: function (result) {
					if (result.Rowsets.FatalError) {
						var sErrorMessage = result.Rowsets.FatalError;
						that.handleMessage(oResourceBundle.getText("commonTitleUserInformation"),
							oResourceBundle.getText("tagCatalogLoadDigitalApp"),
							sErrorMessage,
							"Error");
						oDialog.close();
					} else {
						var data = result.Rowsets.Rowset[0];
						that.oModelAssignedDigitalApps.setData(data);
						that.oModelAssignedDigitalApps.refresh();
						oDialog.close();
					}
				}
			});
		},
		fnAssignDigitalApp: function () {
			this.fnResetChangeDialog();
			this.fnLoadDigitalAppsList();
		},
		fnLoadDigitalAppsList: function () {
			var that = this;
			var sUsername = this.getView().getBindingContext().getObject("ID_USERNAME");
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserManagement/Query/UserDigitalAppsToAssignSelectQuery&Content-Type=text/json",
				data: {
					"Param.1": sUsername
				},
				success: function (result) {
					if (result.Rowsets.FatalError) {
						var sErrorMessage = result.Rowsets.FatalError;
						//MessageToast.show(sErrorMessage);
						that.handleMessage(oResourceBundle.getText("commonTitleUserInformation"),
							oResourceBundle.getText("tagCatalogLoadDigitalApp"),
							sErrorMessage,
							"Error");
						oDialog.close();
					} else {
						var data = result.Rowsets.Rowset[0];
						that.oModelDigitalAppsList.setData(data);
						that.oModelDigitalAppsList.refresh();
						oDialog.close();
						that.fnOpenAppSelectionDialog();
					}
				}
			});
		},
		fnOpenAppSelectionDialog: function () {
			var oAppSelectDialog = new sap.m.SelectDialog({
				title: oResourceBundle.getText("digitalAppSelectTitle"),
				search: function (oEvent) {
					var sValue = oEvent.getParameter("value");
					var oFilter = new sap.ui.model.Filter("DS_NAME", sap.ui.model.FilterOperator.Contains, sValue);
					var oBinding = oEvent.getSource().getBinding("items");
					oBinding.filter([oFilter]);
				},
				confirm: function (oEvent) {
					var aSelectedDigApps = oEvent.getParameter("selectedItems");
					if (aSelectedDigApps.length > 0) {
						var sSelectedDigitalAppsToAssign = "<apps>";
						for (var app in aSelectedDigApps) {
							var sDigAppId = aSelectedDigApps[app].getBindingContext().getObject("ID_DIGITAL_APP");
							sSelectedDigitalAppsToAssign += "<appID>" + sDigAppId + "</appID>";
							oUserInfoController.fnFillChangeCommentModel("NA", sDigAppId);
						}
						sSelectedDigitalAppsToAssign += "</apps>";
						sAction = "ASSIGN"; sDigitalAppsList = sSelectedDigitalAppsToAssign; sDigitalAppToDelete = "";
						oUserInfoController.fnUpdateUserProfile();
					}
				},
				multiSelect: true
			});
			oAppSelectDialog.setModel(this.oModelDigitalAppsList);
			var oTemplate = new sap.m.StandardListItem({
				title: "{DS_NAME}",
				description: "{ID_DIGITAL_APP}"
			});
			oAppSelectDialog.bindAggregation("items", { path: "/Row", template: oTemplate });
			oAppSelectDialog.open();
		},
		fnConfirmDeleteDigitalApp: function (oEvent) {
			this.fnResetChangeDialog();
			var oDigitalAppName = oEvent.getSource().getBindingContext("AssignedDigitalApps").getObject().DS_NAME;
			var oDigitalAppID = oEvent.getSource().getBindingContext("AssignedDigitalApps").getObject().ID_DIGITAL_APP;
			var sWarningMsg = oResourceBundle.getText("userManagInfoWarningDeleteApp") + " " + oDigitalAppName;
			MessageBox.warning(sWarningMsg,
				{
					actions: [sap.m.MessageBox.Action.YES, MessageBox.Action.CANCEL],
					onClose: function (sResponse) {
						if (sResponse == "YES") {
							oUserInfoController.fnFillChangeCommentModel(oDigitalAppID, "NA");
							sAction = "UNASSIGN"; sDigitalAppsList = ""; sDigitalAppToDelete = oDigitalAppID;
							oUserInfoController.fnUpdateUserProfile();
						};
					}
				});
		},
		fnUpdateUserProfile: function () {
			var that = this;

			var aCommentColumnName = [];
			var aCommentMessage = [];
			if (bRequireChangeComment) {
				if (!this.fnValidateChangeComments()) {
					return;
				}
				bShowCommentDialog = true;
				var oChangeTracker = this.oModelChangeMessages.getData();
				for (var e of oChangeTracker.Row) {
					if (e.new != null) {
						aCommentColumnName.push(e.columnName);
						aCommentMessage.push(e.message);
					}
				}
			}
			oDialog.open();
			oDialog.setText(oResourceBundle.getText("userManagInfoSavingWaitMessage"));
			var sUsername = this.getView().getBindingContext().getObject("ID_USERNAME");
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserManagement/Query/UserConfigurationXacuteQuery&Content-Type=text/json",
				type: "POST",
				data: {
					"Param.1": sAction,
					"Param.2": sUsername,
					"Param.3": sDigitalAppsList ? sDigitalAppsList : "",
					"Param.4": sDigitalAppToDelete ? sDigitalAppToDelete : "",
					"Param.20": aCommentColumnName.join("\n"),
					"Param.21": aCommentMessage.join("\n")
				},
				success: function (result) {
					if (result.Rowsets.FatalError) {
						var sErrorMessage = result.Rowsets.FatalError;
						if (sAction == "DELETE") {
							that.handleMessage(oResourceBundle.getText("commonTitleUserInformation"),
								oResourceBundle.getText("userManagDigiDeleteUserProfile"),
								sErrorMessage,
								"Error");
						} else {
							that.handleMessage(oResourceBundle.getText("commonTitleUserInformation"),
								oResourceBundle.getText("userManagDigiUpdateUserProfile"),
								sErrorMessage,
								"Error");
						}

						oDialog.close();
					} else {
						var data = result.Rowsets.Rowset[0];
						var sMsg = data.Row[0].OutputMessage;
						if (sMsg == "{##SUCCESS_MESSAGE}") {
							sMsg = oResourceBundle.getText("userManagProfilUpdate");
							if (sAction == "DELETE") {
								that.handleMessage(oResourceBundle.getText("commonTitleUserInformation"),
									oResourceBundle.getText("userManagDigiDeleteUserProfile"),
									sMsg,
									"Success");
							} else {
								that.handleMessage(oResourceBundle.getText("commonTitleUserInformation"),
									oResourceBundle.getText("userManagDigiUpdateUserProfile"),
									sMsg,
									"Success");
							}
						}
						oDialog.close();
						that.fnNavigateBack("Y");
					}
				}
			});
		},
		 /* fnConfirmDeleteUser: function () {
			var that = this;
			var sWarningMsg = oResourceBundle.getText("userManagInfoWarningDeleteUser");
			MessageBox.warning(sWarningMsg,
				{
					actions: [sap.m.MessageBox.Action.YES, MessageBox.Action.CANCEL],
					onClose: function (sUserAction) {
						if (sUserAction == "YES") {
							sAction = "DELETE", sDigitalAppsList = "", sDigitalAppToDelete = "";
							that.fnUpdateUserProfile();
						};
					}
				});
		}, */
		fnFillChangeCommentModel: function (sOldValue, sNewValue) {
			if (bRequireChangeComment) {
				this.oModelChangeMessages.getData().Row.push({
					columnName: "ID_DIGITAL_APP",
					name: oResourceBundle.getText("userManagDigiAppId"),
					old: sOldValue,
					new: sNewValue,
					message: ""
				})
			}

		},
		fnValidateChangeComments: function () {
			var oChangeTracker = this.oModelChangeMessages.getData();

			if (bShowCommentDialog && oChangeTracker.Row.filter(e => e.new != null).length > 0) {
				this.fnChangeCommentDialog();
				return false;
			}
			var bValid = oChangeTracker.Row.every(e => {
				if (e.new != null) {
					return e.message.length > 0 && e.message.length < 255
				}
				return true
			})
			if (!bValid) {
				this.fnChangeCommentDialog();
			}
			return bValid;
		},
		fnChangeCommentDialog: function () {
			var oChangeCommentDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.ChangeMessage", this);
			this.getView().addDependent(oChangeCommentDialog);
			oChangeCommentDialog.attachAfterClose(function (oEvent) {
				this.destroy();
			})
			var that = this;
			oChangeCommentDialog.addButton(new Button({
				text: oResourceBundle.getText("commonSave"),
				press: function () {
					bShowCommentDialog = false;
					var aItems = oChangeCommentDialog.getContent().find(e => e.sId === "table-change-messages").getItems();
					var bValid = true;
					aItems.forEach(e => {
						var oInput = e.getCells()[3];
						if (oInput.getValue().length > 0 && oInput.getValue().length < 255) {
							oInput.setValueState("None");
						} else {
							oInput.setValueState("Error");
							bValid = false;
						}
					});
					if (bValid) {
						oUserInfoController.fnUpdateUserProfile();
						oChangeCommentDialog.close();
					} else {
						MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
						that.handleMessage(oResourceBundle.getText("commonTitleDataDestinationInformation"),
							oResourceBundle.getText("commonCheckCommentMessages"),
							"",
							"Error");
					}
				}
			}));
			oChangeCommentDialog.addButton(new Button({
				text: oResourceBundle.getText("commonCancel"),
				press: function () {
					bShowCommentDialog = true;
					oChangeCommentDialog.close();
				}
			}));
			oChangeCommentDialog.setModel(this.oModelChangeMessages);
			oChangeCommentDialog.open();
		},
		fnNavigateBack: function (sReload) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("UsersManagement", {
				Refresh: sReload ? sReload : "Y"
			});

		}
	});
});