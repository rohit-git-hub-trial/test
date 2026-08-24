 /*-----------------------------------------------------------------------------------
Streaming Engine - User Management
Creation Date: 2024.01.08 / By: E0449160
Reference Document: 
Description:This screen is used to display all the Streaming Engine Users and their configurations
-------------------------------------------------------------------------------------*/
var oUsersManagementController;
var sSelectedUser;
var oDialog;
var sSelectedUser = "";
var oResourceBundle;
sap.ui.define([
    "../controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.UsersManagement", {
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oUsersManagementController = this;
            oDialog = this.getView().byId("BusyDialog");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            
            oRouter.getRoute("UsersManagement").attachPatternMatched(this._onObjectMatched, this);
            
            this.oModelUsers = this.getOwnerComponent().getModel("UsersModel");
            this.getView().byId("table-users").setModel(this.oModelUsers);

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
                this.getView().byId("page-users-management").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleUsersManagement"));
            var sMode = oEvent.getParameter("arguments").Refresh;
            if (sMode == "Y") {
                oUsersManagementController.fnLoadUsers();
            } else if (sMode == "N") {

            }
        },
        
        fnLoadUsers: function () {
            oDialog.setText(oResourceBundle.getText("userManagUsersList"));
            oDialog.open();
            var that = this;
            var sFullName = oUsersManagementController.getView().byId("input-fullname").getValue();
            var sFullNameFilter = "%" + sFullName.replace(/ /gi, '%') + "%";
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserManagement/Query/UsersListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sFullNameFilter
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleUsersManagement"),
                            oResourceBundle.getText("userManagLoadUsersList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oUsersManagementController.oModelUsers.setData(data);
                        oUsersManagementController.oModelUsers.refresh();
                    }
                    oDialog.close();
                }
            });
        },
        fnSyncUsersList: function(){
            oDialog.setText(oResourceBundle.getText("userManagUsersListSync"));
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserManagement/Query/SyncUsersListXacuteQuery&Content-Type=text/json",
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleUsersManagement"),
                            oResourceBundle.getText("userManagementSyncUsersList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oUsersManagementController.oModelUsers.setData(data);
                        oUsersManagementController.oModelUsers.refresh();
                        that.handleMessage(oResourceBundle.getText("commonTitleUsersManagement"),
                            oResourceBundle.getText("userManagementSyncUsersList"),
                            oResourceBundle.getText("userManagUserListSyncMsg"),
                            "Success");
                    }
                    oDialog.close();
                }
            });
        },
        onSearch: function () {
            this.fnLoadUsers();
        },
        fnRowPress: function (oEvent) {
            var oPath = oEvent.getSource().getBindingContextPath();
            var oSelectedItem = oEvent.getSource().getBindingContext().oModel.getProperty(oPath);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("UserInformation", {
                ID_USERNAME: oSelectedItem.ID_USERNAME
            });
        },
        fnSelectionChanged: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            sSelectedUser = oSelectedItem.ID_USERNAME;
        },
        fnClosePopOver: function () {
            this._oDialog.close();
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");
        },
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>userManagFullName}", key: "DS_FULLNAME", selected: true },
                { text: "{i18n>commonUsername}", key: "ID_USERNAME" },
                { text: "{i18n>userManagSEPlant}", key: "DS_SE_PLANT" },
                { text: "{i18n>ProfileEmailAddress}", key: "DS_EMAIL" }
            ];
            if (!this.oSortDialog) {
                var oTable = oEvent.getSource().getParent().getParent(); // Table > Toolbar > Button
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>userManagSort}",
                    sortItems: mViewSettings.map(function (e) { return new sap.m.ViewSettingsItem(e) }),
                    confirm: function (oEvent) {
                        var mParams = oEvent.getParameters();
                        var oBinding = oTable.getBinding("items");

                        var sPath = mParams.sortItem.getKey();
                        var bDescending = mParams.sortDescending;
                        oBinding.sort(new sap.ui.model.Sorter(sPath, bDescending));
                    }
                });
                this.getView().addDependent(this.oSortDialog);
            }
            this.oSortDialog.open();
        }
    });
});