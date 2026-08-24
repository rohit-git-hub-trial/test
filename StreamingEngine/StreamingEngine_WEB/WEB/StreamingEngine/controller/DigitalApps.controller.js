/*-----------------------------------------------------------------------------------
Streaming Engine - Digital Apps
Creation Date: 2020.06.28 / By: E0445955
Reference Document: 
Description: The transformation for each tags against the digital apps is managed in this page
-------------------------------------------------------------------------------------*/

var oDigitalAppsController;
var oDialog;
var bSelectedDigitalApp = false;
var selectedDigitalApp = "";
var oResourceBundle;
var bShowCommentDialog = true;
sap.ui.define([
    "../controller/BaseController",
    'sap/ui/model/Sorter',
    "StreamingEngine/StreamingEngine/model/formatter",
    'sap/ui/model/Filter',
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
], function (BaseController, Sorter, formatter, Filter, MessageToast, Popover, Button, Dialog, Text) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.DigitalApps", {
        formatter: formatter,
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
            //           //           //
            oDigitalAppsController = this;
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("DigitalApps").attachPatternMatched(this._onObjectMatched, this);
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            this.getView().byId("table-digital-apps").setModel(this.oModelDigitalApps);
            this.getView().byId("combobox-transformation").setModel(this.oModelTransformation);
            var sSelectADigitalApp = "Select a Digital App to continue";
            this.sSortQuery = "S.DS_NAME ASC, T.DS_NAME_ORIGINAL ASC";
            if (!bSelectedDigitalApp) {
                oDialog.open();
                oDigitalAppsController.fnLoadPlant();
                this.getView().byId("link-change-digital-app").setText("[" + sSelectADigitalApp + "]");
            }
            if (bRequireChangeComment) {
                this.oModelChangeMessages = new sap.ui.model.json.JSONModel({ Row: [] });
            }
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
                this.getView().byId("page-digital-apps").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },

        _onObjectMatched: function () {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleDigitalApps"));
            var sSelectADigitalApp = oResourceBundle.getText("digitalAppSelectToContinue");
            if (!bSelectedDigitalApp) {
                oDialog.open();
                oDigitalAppsController.fnLoadPlant();
                this.getView().byId("link-change-digital-app").setText("[" + sSelectADigitalApp + "]");
            }
        },
        fnOpenDigitalAppsSelection: function (oEvent) {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.DigitalAppsSelect", this);
            }
            this._oDialog.setRememberSelections(true);
            this.getView().addDependent(this._oDialog);
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
            this._oDialog.open();
            this.fnInitPopup();
        },
        fnClosePopOver: function (oEvent) {
            oEvent.getSource().getBinding("items").filter([]);
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");
        },
        oModelTransformation: new sap.ui.model.json.JSONModel(),
        oModelDigitalAppsList: new sap.ui.model.json.JSONModel(),
        oModelPlant: new sap.ui.model.json.JSONModel(),
        oModelDataSource: new sap.ui.model.json.JSONModel(),
        oModelDigitalApps: new sap.ui.model.json.JSONModel(),

        fnRowPress: function (oEvent) {

        },

        fnLoadDigitalAppsList: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserProfile/Query/UserDigitalAppListSelectQuery&Content-Type=text/json",
	    data: {
		"Param.1": document.getElementById("input-username").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                        that.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
                            oResourceBundle.getText("digitalAppsDigitalAppsList"),
                            sErrorMessage,
                            "Error");
                        //MessageToast.show(sErrorMessage);
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oDigitalAppsController.oModelDigitalAppsList.setData(data);
                        oDigitalAppsController.oModelDigitalAppsList.refresh();
                        oDialog.close();
                    }

                }
            });
        },

        fnSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("ID_DIGITAL_APP", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },
        fnInitPopup: function () {
            sap.ui.getCore().byId("table-select-digital-app").setModel(this.oModelDigitalAppsList);
            oDigitalAppsController.fnLoadDigitalAppsList();
        },

        fnConfirmSelection: function (oEvent) {
            var sSelectADigitalAppChange = oResourceBundle.getText("digitalAppsChange");
            var aContexts = oEvent.getParameter("selectedContexts");
            selectedDigitalApp = aContexts.map(function (oContext) {
                return oContext.getObject().ID_DIGITAL_APP;
            }).join(", ");
            this.getView().byId("title-selected-digital-app").setText(selectedDigitalApp);
            this.getView().byId("link-change-digital-app").setText("[" + sSelectADigitalAppChange + "]");
            bSelectedDigitalApp = true;
            this.fnLoadDigitalApps();
            this.fnLoadTransformation();

        },

        fnLoadPlant: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                        that.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
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
                        oDigitalAppsController.oModelPlant.setData(data);
                        oDigitalAppsController.oModelPlant.refresh();
                        oDigitalAppsController.getView().byId("combobox-plant").setSelectedKey("%");
                        oDigitalAppsController.fnPlantSelected();
                    }
                }
            });
        },

        fnPlantSelected: function () {
            this.fnLoadDataSource();
        },

        onSearch: function () {
            this.fnLoadDigitalApps();
        },

        fnLoadDigitalApps: function (iOffset=0) {
            if (typeof iOffset !== "number") iOffset = 0;
            var sLoadingTagsText = oResourceBundle.getText("digitalAppsLoadingTags");
            if (selectedDigitalApp != "") {
                oDialog.setText(sLoadingTagsText);
                if (iOffset == 0) oDialog.open();
                var selectedPlant = oDigitalAppsController.getView().byId("combobox-plant").getSelectedKey();
                var selectedTagSource = oDigitalAppsController.getView().byId("combobox-data-source").getSelectedKey();
                var inputOriginalTag = oDigitalAppsController.getView().byId("input-original-tag").getValue();
                var inputRenamedTag = oDigitalAppsController.getView().byId("input-renamed-tag").getValue();
                var flagAssigned = oDigitalAppsController.getView().byId("combobox-assigned").getSelectedKey();
                var OriginalTagFilterValue = inputOriginalTag.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');
                var RenamedTagFilterValue = inputRenamedTag.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DigitalApp/Query/DigitalAppMappingListSelectQuery&Content-Type=text/json",
                    data: {
                        "Param.1": selectedPlant,
                        "Param.2": selectedTagSource,
                        "Param.3": OriginalTagFilterValue,
                        "Param.4": RenamedTagFilterValue,
                        "Param.6": selectedDigitalApp,
                        "Param.5": flagAssigned,
                        "Param.20": document.getElementById("SE_Plant").value,
                        "Param.30": iOffset,
                        "Param.31": this.sSortQuery
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError !== undefined) {
                            oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                            oDigitalAppsController.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
                                oResourceBundle.getText("digitalAppsDigitalAppsMappingList"),
                                result.Rowsets.FatalError,
                                "Error");
                        } else {
                            oDigitalAppsController.getView().byId("table-digital-apps").removeSelections(true);
                            var data = result.Rowsets.Rowset[0];
                            if (iOffset > 0) {
                                oDigitalAppsController.oModelDigitalApps.getData().Row.push(...data.Row);
                            } else {
                                oDigitalAppsController.oModelDigitalApps.setProperty("/Row", []);
                                oDigitalAppsController.oModelDigitalApps.setData(data);
                            }
                            oDigitalAppsController.oModelDigitalApps.refresh();
                            oDigitalAppsController.fnSelectionChanged();
                        }
                        oDialog.close();
                    }
                });
            } else {
                this.fnOpenDigitalAppsSelection();
            }
        },
        fnLoadDataSource: function () {
            var sSelectedPlant = oDigitalAppsController.getView().byId("combobox-plant").getSelectedKey();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sSelectedPlant,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                        that.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
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
                        oDigitalAppsController.oModelDataSource.setData(data);
                        oDigitalAppsController.oModelDataSource.refresh();
                        oDigitalAppsController.getView().byId("combobox-data-source").setSelectedKey("%");
                        oDigitalAppsController.fnLoadDigitalApps();
                    }
                }
            });
        },
        fnSelectionChanged: function (oEvent) {
            var count = oDigitalAppsController.getView().byId("table-digital-apps").getSelectedItems().length;
            if (count > 0) {
                oDigitalAppsController.getView().byId("combobox-transformation").setVisible(true);
                oDigitalAppsController.getView().byId("button-assign-tags").setVisible(true);
                oDigitalAppsController.getView().byId("button-remove-tags").setVisible(true);
                oDigitalAppsController.getView().byId("button-clear-selection").setVisible(true);
                oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
            } else {
                if (count === 0 && this.getView().getModel("message").getData().length > 0) {
                    oDigitalAppsController.getView().byId("combobox-transformation").setVisible(false);
                    oDigitalAppsController.getView().byId("button-assign-tags").setVisible(false);
                    oDigitalAppsController.getView().byId("button-remove-tags").setVisible(false);
                    oDigitalAppsController.getView().byId("button-clear-selection").setVisible(false);
                    oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                } else {
                    oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(false);
                }
            }
        },
        fnLoadTransformation: function () {
            if (selectedDigitalApp != "") {
                var that = this;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DigitalApp/Query/DigitalAppTransformationListSelectQuery&Content-Type=text/json",
                    data: {
                        "Param.1": selectedDigitalApp
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError !== undefined) {
                            that.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
                                oResourceBundle.getText("digitalAppsLoadTransfList"),
                                result.Rowsets.FatalError,
                                "Error");
                            oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                        } else {
                            var data = result.Rowsets.Rowset[0];
                            oDigitalAppsController.oModelTransformation.setData(data);
                            oDigitalAppsController.oModelTransformation.refresh();
                            oDigitalAppsController.getView().byId("combobox-transformation").setSelectedKey("");
                        }
                    }
                });
            }
        },
        fnSelectedGetTagList: function () {
            var i;
            var sTagList = "";
            var arrSelectedItems = oDigitalAppsController.getView().byId("table-digital-apps").getSelectedItems();
            var iCount = arrSelectedItems.length;
            if (iCount > 0) {
                for (i = 0; i < iCount; i++) {
                    if (i == 0) {
                        sTagList = arrSelectedItems[i].getBindingContext().getObject().ID_TAG;
                    } else {
                        sTagList = sTagList + "," + arrSelectedItems[i].getBindingContext().getObject().ID_TAG;
                    }
                }

            }
            return sTagList;
        },

        fnAssignTags: function () {
            var sMandMsg = oResourceBundle.getText("digitalAppsSelATransformation");
            oDialog.open();
            var sMode = "ASSIGN";
            var sTransformation = this.getView().byId("combobox-transformation").getSelectedKey();
            if (sTransformation != "") {
                this.getView().byId("combobox-transformation").setValueState("None");
                this.fnSaveTagsInformation(sMode, sTransformation);
            } else {
                this.getView().byId("combobox-transformation").setValueState("Error");
                //MessageToast.show(sMandMsg);
                oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                this.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
                    oResourceBundle.getText("digitalAppsAssignTags"),
                    sMandMsg,
                    "Error");
                oDialog.close();
            }
        },
        fnRemoveTags: function () {
            oDialog.open();
            var sMode = "REMOVE";
            var sTransformation = "";
            this.fnSaveTagsInformation(sMode, sTransformation);
        },
        fnClearSelection: function () {
            oDigitalAppsController.getView().byId("combobox-transformation").setSelectedKey("");
            oDigitalAppsController.getView().byId("table-digital-apps").removeSelections(true);
            oDigitalAppsController.fnSelectionChanged();
        },
        fnSaveTagsInformation: function (sMode, sTransformation) {
            var sTagsList = this.fnSelectedGetTagList();
            var tagCatalogProcessing = oResourceBundle.getText("tagCatalogProcessing");
            var aCommentColumnName = [];
            var aCommentMessage = [];
            if (bRequireChangeComment && sMode === "ASSIGN") {
                if (!this.fnValidateChangeComments(sMode, sTransformation)) {
                    oDialog.close();
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
            oDialog.setText(tagCatalogProcessing);
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DigitalApp/Query/DigitalAppXacuteQuery&Content-Type=text/json",
                type: "POST",
                data: {
                    "Param.1": sMode,
                    "Param.2": sTagsList,
                    "Param.3": selectedDigitalApp,
                    "Param.4": sTransformation,
                    "Param.30": aCommentColumnName.join("\n"),
                    "Param.31": aCommentMessage.join("\n")
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                        that.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
                            oResourceBundle.getText("digitalAppsSaveTags"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        var aOutput = result.Rowsets.Rowset[0].Row[0].Output.split('\n');
                        var sSuccessMessage = aOutput[0];
                        if (sSuccessMessage == "{##SUCCESS_MESSAGE}") {
                            sSuccessMessage = oResourceBundle.getText("digitalAppsSaveSuccess");
                            if (sMode == "REMOVE") {
                                sSuccessMessage = oResourceBundle.getText("digitalAppsRemoveSuccess");
                            }
                        }
                        oDialog.close();
                        //MessageToast.show(sSuccessMessage);
                        oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                        that.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
                            oResourceBundle.getText("digitalAppsSaveTags"),
                            sSuccessMessage,
                            "Success");
                        oDigitalAppsController.getView().byId("combobox-transformation").setSelectedKey("");
                        oDigitalAppsController.fnLoadDigitalApps();
                        if (aOutput.length > 1) {
                            // sap.m.MessageBox.error(aOutput.slice(1).join('\n'), {
                            //     title: "RealTime - Errors"
                            // });
                            oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                            that.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
                                "RealTime - Errors",
                                aOutput.slice(1).join('\n'),
                                "Error");
                        }
                    }
                },
                error: function () {

                }
            });

        },
        fnValidateChangeComments: function (sMode, sTransformation) {
            var oChangeTracker = this.oModelChangeMessages.getData();
            var aSelectedItems = this.getView().byId("table-digital-apps").getSelectedItems().map(item => item.getBindingContext().getObject());
            var aNewRow = [];
            var oOldItem;
            if (aSelectedItems.length > 0) {
                for (var item of aSelectedItems) {
                    oOldItem = oChangeTracker.Row.find(e => e.columnName === item.ID_TAG && e.name.startsWith(selectedDigitalApp))
                    aNewRow.push({
                        columnName: item.ID_TAG,
                        name: `${selectedDigitalApp}/${item.PLANT_HIERARCHY}.${item.DS_NAME_RENAMED}`,
                        old: item.ID_TRANSFORMATION,
                        new: item.ID_TRANSFORMATION === sTransformation ? null : sTransformation,
                        message: oOldItem == undefined ? "" : oOldItem.message
                    });
                }
                oChangeTracker.Row = aNewRow;
            } else {
                return true;
            }
            if (bShowCommentDialog && oChangeTracker.Row.filter(e => e.new != null).length > 0) {
                this.fnChangeCommentDialog(sMode, sTransformation);
                return false;
            }
            var bValid = oChangeTracker.Row.every(e => {
                if (e.new != null) {
                    return e.message.length > 0 && e.message.length < 255
                }
                return true
            })
            if (!bValid) {
                this.fnChangeCommentDialog(sMode, sTransformation);
            }
            return bValid;
        },
        fnChangeCommentDialog: function (sMode, sTransformation) {
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
                        oDigitalAppsController.fnSaveTagsInformation(sMode, sTransformation);
                        oChangeCommentDialog.close();
                    } else {
                        oDigitalAppsController.getView().byId("page-digital-apps").setShowFooter(true);
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
                        that.handleMessage(oResourceBundle.getText("commonTitleDigitalApps"),
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
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>commonLabelPlant}", key: "PLANT" },
                { text: "{i18n>commonLabelDataSource}", key: "SOURCE_NAME", selected: true },
                { text: "{i18n>commonLabelOriginalTag}", key: "DS_NAME_ORIGINAL" },
                { text: "{i18n>tagCatalogPlantHierarchy}", key: "PLANT_HIERARCHY" },
                { text: "{i18n>commonLabelRenamedTag}", key: "DS_NAME_RENAMED" },
                { text: "{i18n>digitalAppsTransformation}", key: "ID_TRANSFORMATION" },
                { text: "{i18n>digitalAppsAssigned}", key: "COLOR_STATUS" }
            ];
            if (!this.oSortDialog) {
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>digitalAppsSort}",
                    sortItems: mViewSettings.map(function (e) { return new sap.m.ViewSettingsItem(e) }),
                    confirm: function (oEvent) {
                        var mParams = oEvent.getParameters();
                        var sPath = mParams.sortItem.getKey();
                        var bDescending = mParams.sortDescending;

                        oDigitalAppsController.sSortQuery = sPath + " " + (bDescending ? "DESC" : "ASC") + (sPath !== "DS_NAME_ORIGINAL"? ", T.DS_NAME_ORIGINAL ASC" : "");
                        oDigitalAppsController.fnLoadDigitalApps();
                    }
                });
                this.getView().addDependent(this.oSortDialog);
            }
            this.oSortDialog.open();
        },
        fnGrowingStarted: function(oEvent) {
            var iOffset = oEvent.getParameter("total")
            if (oEvent.getParameter("reason") === "Growing" && (iOffset - oEvent.getParameter("actual")) <= 20 ) { // 20 is the growing threshold
                this.fnLoadDigitalApps(iOffset);
            }
        }
    });
});