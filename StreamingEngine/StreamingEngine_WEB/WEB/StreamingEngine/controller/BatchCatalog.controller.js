/*-----------------------------------------------------------------------------------
Streaming Engine - Batch Catalog
Creation Date: 2020.04.28 / By: E0445955
Reference Document: 
Description: Batch catalog is a page from where the batchs can be managed
-------------------------------------------------------------------------------------*/
var selectedPlant;
var selectedBatchSource;
var inputOriginalBatch;
var inputRenamedBatch;
var flagMapped;
var OriginalBatchFilterValue;
var RenamedBatchFilterValue;
var oBatchCatalogController;
var oDialog;
var oResourceBundle;
var initFinished = false;
var selectedBatchItem;
var sIDPlant;
var bShowCommentDialog = true;

sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageToast",
    'sap/ui/model/Sorter',
    "StreamingEngine/StreamingEngine/model/formatter",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text"
    ,
], function (BaseController, MessageToast, Sorter, formatter, Popover, Button, Dialog, Text) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.BatchCatalog", {
        formatter: formatter,
        onInit: function () {
            // set message manager model /
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
			this.oModelSelectedEquipment = new sap.ui.model.json.JSONModel([]);

            // // // // // // // // // //
            oBatchCatalogController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            this.getView().byId("table-batch-catalog").setModel(this.oModelBatchCatalog);
            this.oModelBatchCatalog = this.getOwnerComponent().getModel("BatchCatalogModel");
            ////
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("BatchCatalog").attachPatternMatched(this._onObjectMatched, this);
            ////
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
                this.getView().byId("page-batch-catalog").setVisible(true);
                if (iAdminIndex > 0) {

                }
                else {

                }
            }
            /***********************************************************************/
            initFinished = true;
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            //this function executes every time you navigate to this page
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleBatchCatalog"));
            var sMode = oEvent.getParameter("arguments").Refresh;
            if (sMode == "Y") {
                this.sSortQuery = "PLANT ASC, SOURCE ASC, EQUIPMENT_PATH ASC, EQUIPMENT_NAME ASC"
                if (this.oSortDialog) {
                    this.oSortDialog.destroy();
                    this.oSortDialog = undefined;
                }
                oBatchCatalogController.fnLoadPlant();
            } else if (sMode == "N") {

            }
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");
        },

        fnImportFromExcel: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("BatchCatalogUpload");
        },

      fnExportToExcel: function () {
    var sBatchCatalogSelectUpto150Equipment = oResourceBundle.getText("batchCatalogSelectUpto150Equipment");
    var sEquipmentList = this.fnSelectedGetBatchList();
    var sAll = "";

    if (sEquipmentList === "") {
        sAll = "ALL";
    } else if (sEquipmentList.split(",").length > 150) {
        this.handleMessage(
            oResourceBundle.getText("commonTitleBatchCatalog"),
            oResourceBundle.getText("batchCatalogExportExcel"),
            sBatchCatalogSelectUpto150Equipment,
            "Error"
        );
        return false;
    }

    // Show busy indicator before starting export
    this.showBusyIndicator();

    selectedPlant = this.getView().byId("combobox-plant").getSelectedKey();
    selectedBatchSource = this.getView().byId("combobox-data-source").getSelectedKey();
    inputOriginalBatch = this.getView().byId("input-original-batch").getValue();
    inputRenamedBatch = this.getView().byId("input-renamed-batch").getValue();

    OriginalBatchFilterValue = inputOriginalBatch.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');
    RenamedBatchFilterValue = inputRenamedBatch.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');

    flagMapped = this.getView().byId("combobox-mapped").getSelectedKey();

    var Param1 = (selectedPlant !== "%" ? "S.ID_PLANT LIKE '" + selectedPlant + "' AND" : "");
    var Param2 = (selectedBatchSource !== "%" ? "S.ID_SOURCE LIKE '" + selectedBatchSource + "' AND" : "");
    var Param3 = (OriginalBatchFilterValue !== "" ? "(B.DS_PATH || ' ' || B.DS_NAME LIKE_REGEXP '" + OriginalBatchFilterValue + "' FLAG 'i') AND" : "");
    var Param4 = (RenamedBatchFilterValue !== "" ? "((l1.DS_NAME || '' || l2.DS_NAME || '-' || l3.DS_NAME || '-' || l4.DS_NAME || '-' || l5.DS_NAME LIKE_REGEXP '" + RenamedBatchFilterValue + "' FLAG 'i') OR (l2.DS_NAME || '' || l3.DS_NAME || '-' || l4.DS_NAME || '-' || l5.DS_NAME LIKE_REGEXP '" + RenamedBatchFilterValue + "' FLAG 'i')) AND" : "");
    var Param5 = (flagMapped === "0" ? "B.ID_PLANT_HIERARCHY IS NULL AND" : (flagMapped === "1" ? "B.ID_PLANT_HIERARCHY IS NOT NULL AND" : ""));

    var url =
        "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogListExcelExportSelectQuery&Content-Type=text/csv&RowCount=200000" +
        "&Param.1=" + Param1 +
        "&Param.2=" + Param2 +
        "&Param.3=" + Param3 +
        "&Param.4=" + Param4 +
        "&Param.5=" + Param5 +
        "&Param.6=" + (sEquipmentList.split(",").length ? "'" + sEquipmentList.split(",").join("','") + "'" : "''") +
        "&Param.7=" + sAll +
        "&Param.20=" + document.getElementById("SE_Plant").value;

    var url_encoded = encodeURI(url);

    // Trigger download and hide busy indicator after a short delay
    setTimeout(function () {
        window.open(url_encoded, "_blank");
        oBatchCatalogController.hideBusyIndicator();
    }, 1000); // Adjust delay if needed
},

        oModelPlant: new sap.ui.model.json.JSONModel(),
        oModelDataSource: new sap.ui.model.json.JSONModel(),

        fnRowPress: function (oEvent) {
            var oPath = oEvent.getSource().getBindingContextPath();
            var selectedItem = oEvent.getSource().getBindingContext("BatchCatalogModel").oModel.getProperty(oPath);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("BatchInformation", {
                ID_BATCH_CATALOG: selectedItem.ID_BATCH_CATALOG
            });
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
                        that.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
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
                        oBatchCatalogController.oModelPlant.setData(data);
                        oBatchCatalogController.oModelPlant.refresh();
                        oBatchCatalogController.getView().byId("combobox-plant").setSelectedKey("%");
                        oBatchCatalogController.fnPlantSelected();
                    }
                }
            });
        },

        fnPlantSelected: function () {
            this.fnLoadDataSource();
        },

        onSearch: function () {
            this.fnLoadPlant();
        },

        fnSelectedGetBatchList: function () {
            var i;
            var sBatchList = "";
            var arrSelectedItems = oBatchCatalogController.getView().byId("table-batch-catalog").getSelectedItems();
            var iCount = arrSelectedItems.length;
            if (iCount > 0) {
                for (i = 0; i < iCount; i++) {
                    if (i == 0) {
                        sBatchList = arrSelectedItems[i].getBindingContext("BatchCatalogModel").getObject().ID_BATCH_CATALOG;
                    } else {
                        sBatchList = sBatchList + "," + arrSelectedItems[i].getBindingContext("BatchCatalogModel").getObject().ID_BATCH_CATALOG;
                    }
                }
            }
            return sBatchList;
        },

        onSelectionChange: function (oEvent) {
			var oTable = this.getView().byId("table-batch-catalog");
			var aSelectedItems = oTable.getSelectedItems() || [];
			var aSelectedObjects = aSelectedItems.map(function (oItem) {
				return oItem.getBindingContext("BatchCatalogModel").getObject();
			});

			// Save selected objects (whole object or just ID_BATCH_CATALOG)
			this.oModelSelectedEquipment.setData(aSelectedObjects);
			this.oModelSelectedEquipment.refresh(true);

			// Existing UI feedback
			var iCount = aSelectedItems.length;
			var sMessage = iCount > 0 ? iCount + " " + oResourceBundle.getText("batchCatalogBatchSelected") : "";
			MessageToast.show(sMessage);
			this.getView().byId("SelectedEquipment").setText(sMessage);
		},
		
		fnReSelectEquipment: function () {
			var oTable = this.getView().byId("table-batch-catalog");
			if (!oTable) return;

			var aSelected = this.oModelSelectedEquipment.getData() || [];
			if (!Array.isArray(aSelected) || aSelected.length === 0) {
				// nothing to reselect
				return;
			}

			// Build quick lookup by ID
			var mSelectedById = {};
			aSelected.forEach(function (s) {
				if (s && s.ID_BATCH_CATALOG) {
					mSelectedById[s.ID_BATCH_CATALOG] = true;
				}
			});

			
			var aItems = oTable.getItems() || [];
			for (var i = 0; i < aItems.length; i++) {
				var oItem = aItems[i];
				var oCtx = oItem.getBindingContext("BatchCatalogModel");
				if (!oCtx) continue;
				var oRow = oCtx.getObject();
				if (oRow && mSelectedById[oRow.ID_BATCH_CATALOG]) {
					
					if (typeof oItem.setSelected === "function") {
						oItem.setSelected(true);
					} else {
						
						if (typeof oTable.setSelectedItem === "function") {
							oTable.setSelectedItem(oItem, true);
						}
					}
				} else {
					
					if (typeof oItem.setSelected === "function") {
						oItem.setSelected(false);
					}
				}
			}
		},


        fnLoadBatchCatalog: function (iOffset = 0) {
            if (!initFinished) return false;
            if (typeof iOffset !== "number") iOffset = 0;
            var sBatchsLoading = oResourceBundle.getText("batchCatalogLoadingText");
            oDialog.setText(sBatchsLoading);
            if (iOffset == 0) this.showBusyIndicator();
            selectedPlant = oBatchCatalogController.getView().byId("combobox-plant").getSelectedKey();
            if (selectedPlant == "") return false;
            selectedBatchSource = oBatchCatalogController.getView().byId("combobox-data-source").getSelectedKey();
            if (selectedBatchSource == "") return false;
            inputOriginalBatch = oBatchCatalogController.getView().byId("input-original-batch").getValue();
            inputRenamedBatch = oBatchCatalogController.getView().byId("input-renamed-batch").getValue();
            OriginalBatchFilterValue = inputOriginalBatch.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');
            RenamedBatchFilterValue = inputRenamedBatch.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');
            flagMapped = oBatchCatalogController.getView().byId("combobox-mapped").getSelectedKey();
            var Param1 = (selectedPlant != "%" ? "S.ID_PLANT LIKE '" + selectedPlant + "' AND" : "");
            var Param2 = (selectedBatchSource != "%" ? "S.ID_SOURCE LIKE '" + selectedBatchSource + "' AND" : "");
            var Param3 = (OriginalBatchFilterValue != "" ? "(B.DS_PATH || ' ' || B.DS_NAME LIKE_REGEXPR '" + OriginalBatchFilterValue + "' FLAG 'i') AND" : "");
            var Param4 = (RenamedBatchFilterValue != "" ? "((l1.DS_NAME || '' || l2.DS_NAME || '-' || l3.DS_NAME || '-' || l4.DS_NAME || '-' || l5.DS_NAME LIKE_REGEXPR '" + RenamedBatchFilterValue + "' FLAG 'i') OR (l2.DS_NAME || '' || l3.DS_NAME || '-' || l4.DS_NAME || '-' || l5.DS_NAME LIKE_REGEXPR '" + RenamedBatchFilterValue + "' FLAG 'i')) AND" : "");
            var Param5 = (flagMapped == "0" ? "B.ID_PLANT_HIERARCHY IS NULL AND" : (flagMapped == "1" ? "B.ID_PLANT_HIERARCHY IS NOT NULL AND" : ""));
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/BatchInformation/Query/BatchCatalogListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": Param1,
                    "Param.2": Param2,
                    "Param.3": Param3,
                    "Param.4": Param4,
                    "Param.5": Param5,
                    "Param.20": document.getElementById("SE_Plant").value,
                    "Param.30": iOffset,
                    "Param.31": this.sSortQuery
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        oBatchCatalogController.handleMessage(oResourceBundle.getText("commonTitleBatchCatalog"),
                            oResourceBundle.getText("batchCatalogLoadBatchCatalog"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        if (iOffset > 0) {
                            oBatchCatalogController.oModelBatchCatalog.getData().Row.push(...data.Row);
                        } else {
                            oBatchCatalogController.oModelBatchCatalog.setProperty("/Row", []);
                            oBatchCatalogController.oModelBatchCatalog.setData(data);
                        }
                        oBatchCatalogController.oModelBatchCatalog.refresh();
                        oBatchCatalogController.getView().byId("table-batch-catalog").removeSelections(true);
						oBatchCatalogController.fnReSelectEquipment();
                    }
					
                    oBatchCatalogController.hideBusyIndicator();
                }
            });
        },

        fnReloadBatchs: function () {
            this.fnLoadBatchCatalog();
        },

        hideBusyIndicator: function () {
            oDialog.close();
        },

        showBusyIndicator: function () {
            oDialog.open();
        },

        fnLoadDataSource: function () {
            var sSelectedPlant = oBatchCatalogController.getView().byId("combobox-plant").getSelectedKey();
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
                        oBatchCatalogController.oModelDataSource.setData(data);
                        oBatchCatalogController.oModelDataSource.refresh();
                        oBatchCatalogController.getView().byId("combobox-data-source").setSelectedKey("%");
                        oBatchCatalogController.fnLoadBatchCatalog();
                    }
                }
            });
        },
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>commonLabelPlant}", key: "PLANT", selected: true },
                { text: "{i18n>commonLabelDataSource}", key: "SOURCE" },
                { text: "{i18n>commonLabelEquipmentPath}", key: "EQUIPMENT_PATH" },
                { text: "{i18n>commonLabelEquipmentName}", key: "EQUIPMENT_NAME" },
                { text: "{i18n>commonLabelLevel}", key: "EQUIPMENT_LEVEL" },
                { text: "{i18n>batchCatalogPlantHierarchy}", key: "PLANT_HIERARCHY" },
                { text: "{i18n>batchCatalogConfigStatus}", key: "COLOR_STATUS" }
            ];
            if (!this.oSortDialog) {
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>batchCatalogSort}",
                    sortItems: mViewSettings.map(function (e) { return new sap.m.ViewSettingsItem(e) }),
                    confirm: function (oEvent) {
                        var mParams = oEvent.getParameters();
                        var sPath = mParams.sortItem.getKey();
                        var bDescending = mParams.sortDescending;
                        oBatchCatalogController.sSortQuery = sPath + " " + (bDescending ? "DESC" : "ASC");

                        oBatchCatalogController.fnLoadBatchCatalog();
                    }
                });
                this.getView().addDependent(this.oSortDialog);
            }
            this.oSortDialog.open();
        },

        fnGrowingStarted: function (oEvent) {
            var iOffset = oEvent.getParameter("total")
            if (oEvent.getParameter("reason") === "Growing" && (iOffset - oEvent.getParameter("actual")) <= 20) { // 20 is the growing threshold
                this.fnLoadBatchCatalog(iOffset);
            }
        }
    });
});
//# sourceURL=https://sapdqnjc.pharma.aventis.com:50001/XMII/CM/StreamingEngine/StreamingEngine/controller/BatchCatalog.controller.js?eval