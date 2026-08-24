/*-----------------------------------------------------------------------------------
Streaming Engine - Batch Catalog Information
Creation Date: 2020.04.28 / By: E0449160
Reference Document: 
Description: Batch catalog Information is a page from where the batchs can be managed
-------------------------------------------------------------------------------------*/

var sRefreshNeeded = "N";
var oBatchInfoController;
var oDialog;
var oResourceBundle;
var sInputHierarchy1;
var sInputHierarchy2;
var sInputHierarchy3;
var sInputHierarchy4;
var sInputHierarchy5;
var sFinalHierarchy;
var arrayofHierarchyId;
var sIDPlant;
var bShowCommentDialog = true;
var sSelectedDigitalApp = "";

sap.ui.define([
    "../controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/Button",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, Button, MessageToast) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.BatchInformation", {

        oModelHierarchy_1: new JSONModel(),
        oModelHierarchy_2: new JSONModel(),
        oModelHierarchy_3: new JSONModel(),
        oModelHierarchy_4: new JSONModel(),
        oModelHierarchy_5: new JSONModel(),
        oModelDataSource: new JSONModel(),
        oModelNonConfiRelatedTags: new JSONModel(),
        oModelSelectedTags: new JSONModel(),
        oModelDigitalAppsList: new JSONModel(),

        onInit: function () {
            // set message manager model //
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
            // // // // // // // // // //
            oBatchInfoController = this;
            oDialog = this.getView().byId("BusyDialog");
            oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            this.sSortQuery = "SOURCE_NAME ASC, TAG_DESCRIPTION ASC, TAG_UOM ASC, PLANT_HIERARCHY ASC"

            this.byId("batch-combo-hierarchy-1").setModel(this.oModelHierarchy_1, "Level1");
            this.byId("batch-combo-hierarchy-2").setModel(this.oModelHierarchy_2, "Level2");
            this.byId("batch-combo-hierarchy-3").setModel(this.oModelHierarchy_3, "Level3");
            this.byId("batch-combo-hierarchy-4").setModel(this.oModelHierarchy_4, "Level4");
            this.byId("batch-combo-hierarchy-5").setModel(this.oModelHierarchy_5, "Level5");

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("BatchInformation").attachPatternMatched(this._onObjectMatched, this);

            if (bRequireChangeComment) {
                this.oModelChangeMessages = new JSONModel({ Row: [] });
            }
        },
        _onObjectMatched: function (oEvent) {
            sRefreshNeeded = "N";
            this.oModelNonConfiRelatedTags.setData([]);
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleBatchInformation"));
            //get route parameters
            var sBatchId = oEvent.getParameter("arguments").ID_BATCH_CATALOG;
            //set binding model to the view		
            var oModel = new JSONModel();
            var oView = this.getView();
            oView.setModel(oModel);
            oView.bindElement("/");

            var oModelData;
            var aEquipmentModel = oBatchInfoController.getOwnerComponent().getModel("BatchCatalogModel").getData().Row;
            if (!jQuery.isEmptyObject(aEquipmentModel)) {
                oModelData = aEquipmentModel.find(element => element.ID_BATCH_CATALOG === sBatchId);
                if (oModelData) {
                    //bind the view with equipment's data
                    oModel.setData(oModelData);
                    var sLocationHierarchy = oModelData.ID_PLANT_HIERARCHY;
                    if (sLocationHierarchy != "NA") this.fnLoadRelatedTags(sLocationHierarchy);
                    else this.fnLoadRelatedTags();
                    this.fnLoadPlantHierarchy();
                    this.fnFillChangeCommentModel(oModelData.PLANT_HIERARCHY);
                } else {
                    //load equipment's data from db
                    oBatchInfoController.fnLoadEquipmentData(sBatchId);
                }
            } else {
                //load equipment's data from db
                oBatchInfoController.fnLoadEquipmentData(sBatchId);
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
                this.getView().byId("page-batch-information").setVisible(true);
            }
        },
        fnShowNoAccess: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("NoAccess");
        },
        fnNavigateBack: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("BatchCatalog", {
                Refresh: sRefreshNeeded
            });
        },
        fnFillChangeCommentModel: function (sLocationHierarchy) {
            if (bRequireChangeComment) {
                this.oModelChangeMessages.getData().Row = [{
                    columnName: "ID_PLANT_HIERARCHY",
                    name: oResourceBundle.getText("batchCatalogPlantHierarchy"),
                    old: sLocationHierarchy,
                    new: null,
                    message: ""
                }]
            }
	
        },
        fnLoadEquipmentData: function (sBatchId) {
            var that = this;
            var oView = this.getView();
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogItemSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sBatchId,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.Rowset) {
                        if (result.Rowsets.Rowset[0].Row) {
                            var oData = result.Rowsets.Rowset[0].Row[0];
                            oView.getModel().setData(oData);

                            var sLocationHierarchy = oData.ID_PLANT_HIERARCHY;
                            if (sLocationHierarchy != "NA") {
                                that.fnLoadRelatedTags(sLocationHierarchy);
                            } else {
                                that.fnLoadRelatedTags();
                            }
                            that.fnFillChangeCommentModel(oData.PLANT_HIERARCHY);
                            that.fnLoadPlantHierarchy();
                        } else {
                            oView.getModel().setData([]); oView.getModel().refresh(true);
                            that.oModelNonConfiRelatedTags.setData([]);
                            that.oModelNonConfiRelatedTags.refresh(true);
                            that.fnLoadHierarchy(null, null, null);
                            that.fnLoadRelatedTags();
                        }
                        oView.getModel().refresh(true);
                    } else if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        MessageToast.show(errorMsg);
                    }
                }
            });
        },
        fnLoadRelatedTags: function (sLocationHierarchy) {
            var oRelatedTagsModel = new JSONModel();
            this.byId("table-related-tags").setModel(oRelatedTagsModel, "RelatedTags");
            if (sLocationHierarchy) {
                var sThreeLevelsHierarchy = sLocationHierarchy.split("_").splice(0, 4, '').join("_");
                var oBindingContext = this.getView().getBindingContext().getObject();
                var that = this;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogRelatedTagsSelectQuery&Content-Type=text/json",
                    data: {
                        "Param.1": sThreeLevelsHierarchy,
                        "Param.20": oBindingContext.ID_PLANT,
                        "Param.21": this.sSortQuery
                    },
                    success: function (result) {
                        if (result.Rowsets.Rowset) {
                            var data = result.Rowsets.Rowset[0];
                            oRelatedTagsModel.setData(data);
                            oRelatedTagsModel.refresh(true);

                        } else if (result.Rowsets.FatalError) {
                            var errorMsg = result.Rowsets.FatalError;
                            that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                                oResourceBundle.getText("batchCatalogLoadRelatedTags"),
                                errorMsg,
                                "Error");
                        }
                    }
                });
            } else {
                oRelatedTagsModel.setData([]);
                oRelatedTagsModel.refresh();
            }
        },

        fnLoadPlantHierarchy: function () {
            var idHierarchy = this.getView().getBindingContext().getObject().PLANT_HIERARCHY_ID;
            arrayofHierarchyId = idHierarchy.split("-");
            this.fnLoadHierarchy(1, "loc", "");
        },

        fnLoadHierarchy: function (level, type, filter) {
            if (level && type) {
                var that = this;
                var sIDPlant = this.getView().getBindingContext().getObject().ID_PLANT;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PlantHierarchy/Query/PlantHierarchySelectQuery&Content-Type=text/json",
                    data: {
                        "Param.1": type,
                        "Param.2": filter,
                        "Param.3": sIDPlant
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError !== undefined) {
                            that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                                oResourceBundle.getText("tagInfoLoadPlantHierarchy"),
                                result.Rowsets.FatalError,
                                "Error");
                        } else {
                            var data = result.Rowsets.Rowset[0];
                            eval("oBatchInfoController.oModelHierarchy_" + level + ".setData(data)");
                            eval("oBatchInfoController.oModelHierarchy_" + level + ".refresh()");
                            that.byId("batch-combo-hierarchy-" + level).setSelectedKey("");
                            if (arrayofHierarchyId[level - 1] != "" && arrayofHierarchyId[level - 1] != "NA" && arrayofHierarchyId[level - 1] != undefined) {
                                that.byId("batch-combo-hierarchy-" + level).setSelectedKey(arrayofHierarchyId[level - 1]);
                            }
                            else {
                                if (level == 1) {
                                    try {
                                        var comboBox = that.byId("batch-combo-hierarchy-" + level);
                                        var comboBoxItems = comboBox.getItems();
                                        comboBox.setSelectedItem(comboBoxItems[0]);
                                    } catch (err) { };
                                }
                            }
                            try {
                                eval("that.changeHier_" + level + "()");
                            } catch (err) { };
                            if (level == 5) arrayofHierarchyId = "";
                        }
                    }
                });
            } else {
                for (var l = 1; l < 6; l++) {
                    eval("oBatchInfoController.oModelHierarchy_" + l + ".setData([])");
                    eval("oBatchInfoController.oModelHierarchy_" + l + ".refresh()");
                    this.byId("batch-combo-hierarchy-" + l).setSelectedKey("");
                }
            }

        },

        changeHier_1: function () {
            this.fnLoadHierarchy(2, 'bld', this.byId("batch-combo-hierarchy-1").getSelectedKey());
            this.byId("batch-combo-hierarchy-1").setValueState("None");
        },

        changeHier_2: function () {
            this.fnLoadHierarchy(3, 'prm', this.byId("batch-combo-hierarchy-2").getSelectedKey());
            this.byId("batch-combo-hierarchy-2").setValueState("None");
        },

        changeHier_3: function () {
            this.fnLoadHierarchy(4, 'mnf', this.byId("batch-combo-hierarchy-3").getSelectedKey());
            this.byId("batch-combo-hierarchy-3").setValueState("None");
        },

        changeHier_4: function () {
            this.fnLoadHierarchy(5, 'sbf', this.byId("batch-combo-hierarchy-4").getSelectedKey());
            this.byId("batch-combo-hierarchy-4").setValueState("None");
        },

        changeHier_5: function () {
            this.byId("batch-combo-hierarchy-5").setValueState("None");
        },

        fnValidateInputs: function () {
            var bValidInputs = true;
            sInputHierarchy1 = this.byId("batch-combo-hierarchy-1").getSelectedKey();
            sInputHierarchy2 = this.byId("batch-combo-hierarchy-2").getSelectedKey();
            sInputHierarchy3 = this.byId("batch-combo-hierarchy-3").getSelectedKey();
            sInputHierarchy4 = this.byId("batch-combo-hierarchy-4").getSelectedKey();
            sInputHierarchy5 = this.byId("batch-combo-hierarchy-5").getSelectedKey();
            if (sInputHierarchy1.length <= 0) {
                bValidInputs = false;
                this.byId("batch-combo-hierarchy-1").setValueState("Error");
            } else {
                this.byId("batch-combo-hierarchy-1").setValueState("None");
                sFinalHierarchy = this.byId("batch-combo-hierarchy-1").getValue();
            }
            if (sInputHierarchy2.length <= 0) {
                bValidInputs = false;
                this.byId("batch-combo-hierarchy-2").setValueState("Error");
            } else {
                this.byId("batch-combo-hierarchy-2").setValueState("None");
                sFinalHierarchy += this.byId("batch-combo-hierarchy-2").getValue();
            }
            if (sInputHierarchy3.length <= 0) {
                bValidInputs = false;
                this.byId("batch-combo-hierarchy-3").setValueState("Error");
            } else {
                this.byId("batch-combo-hierarchy-3").setValueState("None");
                sFinalHierarchy += "-" + this.byId("batch-combo-hierarchy-3").getValue();
            }
            if (sInputHierarchy4.length > 0) {
                sFinalHierarchy += "-" + this.byId("batch-combo-hierarchy-4").getValue();
            }
            /*if (sInputHierarchy4.length <= 0) {
                bValidInputs = false;
                this.byId("batch-combo-hierarchy-4").setValueState("Error");
            } else {
                this.byId("batch-combo-hierarchy-4").setValueState("None");
                sFinalHierarchy += "-" + this.byId("batch-combo-hierarchy-4").getValue();
            }*/
            if (sInputHierarchy5.length > 0) {
                sFinalHierarchy += "-" + this.byId("batch-combo-hierarchy-5").getValue();
            }
            /*
            if (sInputHierarchy5.length <= 0) {
                bValidInputs = false;
                this.byId("batch-combo-hierarchy-5").setValueState("Error");
            } else {
                this.byId("batch-combo-hierarchy-5").setValueState("None");
            }
            */
            return bValidInputs;

        },

        fnEquipmentMappingSave: function (oEvent) {
            var sSaveWaitMessage = oResourceBundle.getText("commonBackgroundProcessMessage");
            var bIsValid = this.fnValidateInputs();
            if (bIsValid) {
                var sCommentColumnName = "";
                var sCommentMessage = "";
                if (bRequireChangeComment) {
                    if (!this.fnValidateChangeComments("U")) {
                        return;
                    }
                    bShowCommentDialog = true;
                    var oChangeTracker = this.oModelChangeMessages.getData();
                    if (oChangeTracker.Row[0].new != null) {
                        sCommentColumnName = oChangeTracker.Row[0].columnName
                        sCommentMessage = oChangeTracker.Row[0].message
                    }
                }
                oDialog.setText(sSaveWaitMessage);
                var oBindingContext = this.getView().getBindingContext().getObject();
                var that = this;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogXacuteQuery&Content-Type=text/json",
                    data: {
                        "Param.1": "UPDATE",
                        "Param.2": oBindingContext.ID_BATCH_CATALOG,
                        "Param.3": sInputHierarchy5 != "" ? sInputHierarchy5 : sInputHierarchy4 != "" ? sInputHierarchy4 : sInputHierarchy3,
                        "Param.4": oBindingContext.ID_PLANT,
                        "Param.30": sCommentColumnName,
                        "Param.31": sCommentMessage
                    },
                    success: function (result) {
                        sRefreshNeeded = "Y";
                        if (result.Rowsets.Rowset) {
                            var data = result.Rowsets.Rowset[0];
                            var successMsg = data.Row[0].Output;
                            if (successMsg == "{##SUCCESS_MESSAGE}") {
                                successMsg = oResourceBundle.getText("commonInfoSuccess");
                            }
                            that.fnLoadEquipmentData(oBindingContext.ID_BATCH_CATALOG);
                            that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                                oResourceBundle.getText("batchCatalogSaveEquipmentMapping"),
                                successMsg,
                                "Success");
                        } else if (result.Rowsets.FatalError) {
                            var errorMsg = result.Rowsets.FatalError;
                            that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                                oResourceBundle.getText("batchCatalogSaveEquipmentMapping"),
                                errorMsg,
                                "Error");
                        }
                    }
                });
            }
        },

        fnEquipmentMappingDelete: function (oEvent) {
            var sSaveWaitMessage = oResourceBundle.getText("commonBackgroundProcessMessage");
            oDialog.setText(sSaveWaitMessage);
            var sCommentColumnName = "";
            var sCommentMessage = "";
            if (bRequireChangeComment) {
                if (!this.fnValidateChangeComments("D")) {
                    return;
                }
                bShowCommentDialog = true;
                var oChangeTracker = this.oModelChangeMessages.getData();
                if (oChangeTracker.Row[0].new != null) {
                    sCommentColumnName = oChangeTracker.Row[0].columnName
                    sCommentMessage = oChangeTracker.Row[0].message
                }
            }
            var that = this;
            var oBindingContext = this.getView().getBindingContext().getObject();
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": "UPDATE",
                    "Param.2": oBindingContext.ID_BATCH_CATALOG,
                    "Param.3": "",
                    "Param.4": oBindingContext.ID_PLANT,
                    "Param.30": sCommentColumnName,
                    "Param.31": sCommentMessage
                },
                success: function (result) {
                    sRefreshNeeded = "Y";
                    if (result.Rowsets.Rowset) {
                        var data = result.Rowsets.Rowset[0];
                        var successMsg = data.Row[0].Output;
                        if (successMsg == "{##SUCCESS_MESSAGE}") {
                            successMsg = oResourceBundle.getText("commonInfoSuccess");
                        }
                        that.fnLoadEquipmentData(oBindingContext.ID_BATCH_CATALOG);
                        that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                            oResourceBundle.getText("batchCatalogDeleteEquipmentMapping"),
                            successMsg,
                            "Success");
                    } else if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                            oResourceBundle.getText("batchCatalogDeleteEquipmentMapping"),
                            errorMsg,
                            "Error");
                    }
                }
            });
        },
        fnAddTags: function () {
            if (!this._oRelatedTagsDialog) {
                this._oRelatedTagsDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.ConfigureEquipmentRelatedTags", this);
            }
            this.getView().addDependent(this._oRelatedTagsDialog);
            this._oRelatedTagsDialog.setModel(this.oModelNonConfiRelatedTags);
            this._oRelatedTagsDialog.setModel(this.oModelSelectedTags, "SelectedTags");
            this._oRelatedTagsDialog.setModel(this.oModelDataSource, "DataSources");
            this.oModelSelectedTags.setData([]);
            if (!jQuery.isEmptyObject(this.getView().getBindingContext().getObject())) this.fnLoadDataSource();
            this._oRelatedTagsDialog.open();
        },
        onSearch: function () {
            this.fnLoadNonConfigRelatedTags();
        },
        fnLoadDataSource: function () {
            var sSelectedPlant = this.getView().getBindingContext().getObject().ID_PLANT;
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sSelectedPlant,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
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
                        that.oModelDataSource.setData(data);
                        that.oModelDataSource.refresh();
                        sap.ui.getCore().byId("combobox-dataSource-relatedTags").setSelectedKey("%");
                        that.fnLoadNonConfigRelatedTags();
                    }
                }
            });
        },
        fnLoadNonConfigRelatedTags(iOffset = 0) {
            if (!jQuery.isEmptyObject(this.getView().getBindingContext().getObject())) {
                var that = this;
                if (typeof iOffset !== "number") iOffset = 0;
                var sEquipmentPlant = this.getView().getBindingContext().getObject().ID_PLANT;
                var sSelectedDataSource = sap.ui.getCore().byId("combobox-dataSource-relatedTags").getSelectedKey();
                var sTagOriginalName = sap.ui.getCore().byId("input-tag-original").getValue();
                var sSelectedTagOriginalName = "%" + sTagOriginalName.replace(/ /gi, '%') + "%";
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogNonConfigRelatedTagsSelectQuery&Content-Type=text/json",
                    data: {
                        "Param.1": sEquipmentPlant,
                        "Param.2": sSelectedDataSource,
                        "Param.3": sSelectedTagOriginalName,
                        "Param.20": document.getElementById("SE_Plant").value,
                        "Param.30": iOffset
                    },
                    success: function (result) {
                        if (result.Rowsets.Rowset) {
                            var oData = result.Rowsets.Rowset[0];
                            if (oData && oData.Row) {
                                oData.Row.forEach(function (oElement) {
                                    Object.assign(oElement, { TAG_SELECTED: false })
                                });
                                if (iOffset > 0) {
                                    that.oModelNonConfiRelatedTags.getData().push(...oData.Row);
                                } else {
                                    that.oModelNonConfiRelatedTags.setData(oData.Row);
                                }
                                that.oModelNonConfiRelatedTags.refresh(true);
                            } else {
                                if (iOffset == 0) {
                                    that.oModelNonConfiRelatedTags.setData([]);
                                    that.oModelNonConfiRelatedTags.refresh(true);
                                }
                            }
                            that.fnReSelectTags();
                        } else if (result.Rowsets.FatalError) {
                            var errorMsg = result.Rowsets.FatalError;
                            MessageToast.show(errorMsg);
                        }
                    }
                });
            } else {
                this.oModelNonConfiRelatedTags.setData([]);
                this.oModelNonConfiRelatedTags.refresh(true);
            }

        },
        fnReSelectTags: function () {
            var aSelectedTagsList = this.oModelSelectedTags.getData();
            var aOriginalTagsList = this.oModelNonConfiRelatedTags.getData();
            for (var i = 0; i < aSelectedTagsList.length; i++) {
                var iIndexOfSelectedTagInOriginalList = aOriginalTagsList.findIndex((element) => element.ID_TAG === aSelectedTagsList[i].ID_TAG);
                if(iIndexOfSelectedTagInOriginalList > -1){
                    aOriginalTagsList[iIndexOfSelectedTagInOriginalList].TAG_SELECTED = true;
                }
            }
            this.oModelNonConfiRelatedTags.refresh(true);
        },
        fnGrowingStarted: function (oEvent) {
            var iOffset = oEvent.getParameter("total")
            if (oEvent.getParameter("reason") === "Growing" && (iOffset - oEvent.getParameter("actual")) <= 100) { // 100 is the growing threshold
                this.fnLoadNonConfigRelatedTags(iOffset);
            }
        },
        onCloseRelatedTagsDialog: function () {
            this._oRelatedTagsDialog.close();
        },
        onTagSelectionChange: function (oEvent) {
            var aSelectedItems = oEvent.getParameter("listItems");
            for (var i = 0; i < aSelectedItems.length; i++) {
                var bTagSelected = aSelectedItems[i].getSelected();
                var oTagBindingContext = aSelectedItems[i].getBindingContext().getObject();
                if (bTagSelected) { //add binding context to the shopping list
                    this.oModelSelectedTags.getData().push(oTagBindingContext);
                    this.oModelSelectedTags.refresh(true);
                } else { //remove binding context from the shopping list
                    var sSelectedTagIndex = oTagBindingContext.ID_TAG;
                    const iTagIndex = this.oModelSelectedTags.getData().findIndex((element) => element.ID_TAG === sSelectedTagIndex);
                    if (iTagIndex > -1) {
                        this.oModelSelectedTags.getData().splice(iTagIndex, 1);
                        this.oModelSelectedTags.refresh(true);
                    }
                }
            }
        },
        fnShowSelectedTags: function () {
            var oList = new sap.m.List({
                mode: "Delete",
                delete: this.handleRemoveSelectedTag.bind(this)
            });
            var oListItemTemplate = new sap.m.StandardListItem({
                title: "{TAG_ORIGINAL}",
                description: "{SOURCE_NAME}",
                iconDensityAware: false,
                iconInset: false
            }).data("ID_TAG", "{ID_TAG}");
            oList.bindItems({
                path: "/",
                template: oListItemTemplate
            });
            var oCloseButton = new sap.m.Button({
                text: oResourceBundle.getText("commonClose"),
                press: this.onCloseSelectedTagsDialog
            });
            var oSelectionDialog = new sap.m.Dialog({
                title: oResourceBundle.getText("batchSelectedTags"),
                //title: oResourceBundle.getText("batchDownloadSelectedTags"),
                content: oList,
                buttons: oCloseButton
            });
            oSelectionDialog.setModel(this.oModelSelectedTags);
            oSelectionDialog.open();
        },
        onCloseSelectedTagsDialog: function (oEvent) {
            oEvent.getSource().getParent().close();
            oEvent.getSource().getModel().refresh(true);
        },
        handleRemoveSelectedTag: function (oEvent) {
            var iToBeRemovedTagIndex = parseInt(oEvent.getParameter("listItem").getBindingContextPath().replace(/^\D+/g, ''));
            var sSelectedTagId = oEvent.getParameter("listItem").getAggregation("customData")[0].getValue();
            const iTagIndex = this.oModelNonConfiRelatedTags.getData().findIndex((element) => element.ID_TAG === sSelectedTagId);
            if (iTagIndex > -1) {
                this.oModelNonConfiRelatedTags.getData()[iTagIndex].TAG_SELECTED = false;
                this.oModelNonConfiRelatedTags.refresh(true);
            }
            this.oModelSelectedTags.getData().splice(iToBeRemovedTagIndex, 1);
            this.oModelSelectedTags.refresh(true);
            if (this.oModelSelectedTags.getData().length == 0) {
                oEvent.getSource().getParent().close();
            }
        },
        fnExportConfigurationToExcel: function (oEvent) {
            if (!this.oExportDigitalAppDialogBatch || this.oExportDigitalAppDialogBatch.bIsDestroyed) {
                this.oExportDigitalAppDialogBatch = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.TagCatalogDigitalAppsSelect", this);
                var sNone = oResourceBundle.getText("commonNone");
                sap.ui.getCore().byId("table-select-digital-app2")._getCancelButton().setText(sNone);
            }
            this.oExportDigitalAppDialogBatch.setRememberSelections(false);
            this.getView().addDependent(this.oExportDigitalAppDialogBatch);
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oExportDigitalAppDialogBatch);
            this.oExportDigitalAppDialogBatch.open();
            this.fnDigitalAppInitPopup();
        },

        fnDigitalAppInitPopup: function () {
            sap.ui.getCore().byId("table-select-digital-app2").setModel(this.oModelDigitalAppsList);
            this.fnLoadDigitalAppsList();
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
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                            oResourceBundle.getText("tagCatalogLoadDigitalApp"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        that.oModelDigitalAppsList.setData(data);
                        that.oModelDigitalAppsList.refresh();
                        oDialog.close();
                    }

                }
            });
        },

        fnDigitalAppSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new sap.ui.model.Filter("ID_DIGITAL_APP", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        fnDigitalAppSelection: function (oEvent) {
            var aContexts = oEvent.getParameter("selectedContexts");
            sSelectedDigitalApp = aContexts.map(function (oContext) {
                return oContext.getObject().ID_DIGITAL_APP;
            }).join(", ");
            oEvent.getSource().getBinding("items").filter([]);
            this.fnDownloadConfigurationFile();
            this.oExportDigitalAppDialogBatch.destroy();
        },

        fnDigitalAppSelectionNone: function (oEvent) {
            sSelectedDigitalApp = "";
            oEvent.getSource().getBinding("items").filter([]);
            this.fnDownloadConfigurationFile();
            this.oExportDigitalAppDialogBatch.destroy();
        },

        fnDownloadConfigurationFile: function () {
            var sEquipmentPlant = this.getView().getBindingContext().getObject().ID_PLANT;
            var sEquipmentHierarchy = this.getView().getBindingContext().getObject().PLANT_HIERARCHY;
            var sTagList = this.fnGetTagList();
            var sURL =
                "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogTagConfigExcelExportSelectQuery&Content-Type=text/csv&RowCount=200000&Param.1=" +
                sEquipmentPlant + "&Param.2=" + (sTagList.split(",").length ?
                    "'" + sTagList.split(",").join("','") + "'" : "''") + "&Param.3=" + sEquipmentHierarchy + "&Param.4=" + sSelectedDigitalApp + "&Param.20=" + document.getElementById("SE_Plant").value;
            window.open(encodeURI(sURL), "_blank");
        },
        fnGetTagList: function () {
            var sTagList = "";
            var aSelectedItems = this.oModelSelectedTags.getData();
            var iCount = aSelectedItems.length;
            if (iCount > 0) {
                for (var i = 0; i < iCount; i++) {
                    if (i == 0) {
                        sTagList = aSelectedItems[i].ID_TAG;
                    } else {
                        sTagList = sTagList + "," + aSelectedItems[i].ID_TAG;
                    }
                }
            }
            return sTagList;
        },
        fnValidateChangeComments: function (sMode) {
            var oChangeTracker = this.oModelChangeMessages.getData();
            if (sMode === "U") {
                if (oChangeTracker.Row[0].old === sFinalHierarchy) {
                    oChangeTracker.Row[0].new = null;
                    return true;
                } else {
                    oChangeTracker.Row[0].new = sFinalHierarchy
                }
            } else {
                if (oChangeTracker.Row[0].old === "NA") {
                    oChangeTracker.Row[0].new = null;
                    return true;
                } else {
                    oChangeTracker.Row[0].new = "NA"
                }
            }
            if (bShowCommentDialog) {
                this.fnChangeCommentDialog(sMode);
                return false;
            }
            var bValid = oChangeTracker.Row[0].message.length > 0 && oChangeTracker.Row[0].message.length < 255;
            if (!bValid) {
                this.fnChangeCommentDialog(sMode);
            }
            return bValid;
        },
        fnChangeCommentDialog: function (sMode) {
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
                        if (sMode === "U") {
                            that.fnEquipmentMappingSave();
                        } else {
                            that.fnEquipmentMappingDelete();
                        }
                        oChangeCommentDialog.close();
                    } else {
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
                        that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
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
            var oBindingContext = this.getView().getBindingContext().getObject();
            var mViewSettings = [
                { text: "{i18n>batchCatalogTagSourceName}", key: "SOURCE_NAME", selected: true },
                { text: "{i18n>batchCatalogTagDescription}", key: "TAG_DESCRIPTION" },
                { text: "{i18n>batchCatalogTagUoM}", key: "TAG_UOM" },
                { text: "{i18n>batchCatalogTagLoc}", key: "PLANT_HIERARCHY" }
            ];
            if (!this.oSortDialogRelatedTags) {
                this.oSortDialogRelatedTags = new sap.m.ViewSettingsDialog({
                    title: "{i18n>batchCatalogSort}",
                    sortItems: mViewSettings.map(function (e) { return new sap.m.ViewSettingsItem(e) }),
                    confirm: function (oEvent) {
                        var mParams = oEvent.getParameters();
                        var sPath = mParams.sortItem.getKey();
                        var bDescending = mParams.sortDescending;
                        oBatchInfoController.sSortQuery = sPath + " " + (bDescending ? "DESC" : "ASC");
                        oBatchInfoController.fnLoadRelatedTags(oBindingContext.ID_PLANT_HIERARCHY);
                    }
                });
                this.getView().addDependent(this.oSortDialogRelatedTags);
            }
            this.oSortDialogRelatedTags.open();
        },
        onExit: function () {
            if (!this.oExportDigitalAppDialogBatch) {
                this.oExportDigitalAppDialogBatch.destroy();
            }
        }
    });
});
//# sourceURL=https://sapwdawsemea.pharma.aventis.com:9100/XMII/CM/StreamingEngine/StreamingEngine/controller/BatchInformation.controller.js?eval