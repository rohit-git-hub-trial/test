sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/f/library",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, fioriLib, MessageToast, MessageBox, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("PlantManagement.controller.PlantManagement", {

        serviceUrl: "/XMII/Illuminator",

        queries: {
            get: "SANOFI_CORE/PlantManagement/Query/GetPlantDetails",
            create: "SANOFI_CORE/PlantManagement/Query/InsertPlantDetails",
            update: "SANOFI_CORE/PlantManagement/Query/UpdatePlantDetails",
            delete: "SANOFI_CORE/PlantManagement/Query/DeletePlantDetails"
        },

        onInit: function () {

            this.fcl = this.getView().byId("fcl");
            this.table = this.getView().byId("masterTable");
            this.detail = this.getView().byId("detailPage");

            this.model = new JSONModel();
            this.settingsModel = new JSONModel({
                editingActive: false,
                isCreate: false
            });

            this.getView().setModel(this.model);
            this.getView().setModel(this.settingsModel, "settings");

            this.loadData();
        },


        loadData: function () {

            this.table.setBusy(true);

            $.ajax({
                url: this.serviceUrl,
                method: "GET",
                data: {
                    QueryTemplate: this.queries.get,
                    "Content-Type": "text/json"
                },
                success: (data) => {
                    this.model.setData(data);
                },
                error: () => {
                    MessageToast.show("Failed to load data");
                },
                complete: () => this.table.setBusy(false)
            });
        },

        onSearch: function (oEvent) {

            const val = oEvent.getSource().getValue();
            const filters = [];

            if (val) {
                filters.push(new Filter("DS_PLANT", FilterOperator.Contains, val));
            }

            this.table.getBinding("items").filter(filters);
        },
        onRowPress: function (oEvent) {

            const ctx = oEvent.getSource().getBindingContext();
            const path = ctx.getPath();

            this.detail.bindElement(path);

            this.settingsModel.setProperty("/editingActive", false);
            this.settingsModel.setProperty("/isCreate", false);

            this.fcl.setLayout(fioriLib.LayoutType.TwoColumnsMidExpanded);
        },
        onAdd: function () {

            let data = this.model.getData();

            if (!data.Rowsets || !data.Rowsets.Rowset || !data.Rowsets.Rowset[0].Row) {
                data.Rowsets = { Rowset: [{ Row: [] }] };
            }

            const blank = {
                ID_PLANT: "",
                DS_PLANT: "",
                OEE_PLANT: "",
                OEE_SERVER_TZ: "",
                ID_HIERARCHY: ""
            };

            data.Rowsets.Rowset[0].Row.unshift(blank);
            this.model.setData(data);

            this.detail.bindElement("/Rowsets/Rowset/0/Row/0");

            this.settingsModel.setProperty("/editingActive", true);
            this.settingsModel.setProperty("/isCreate", true);

            this.fcl.setLayout(fioriLib.LayoutType.TwoColumnsMidExpanded);
        },

        onEdit: function () {

            const rec = this.detail.getBindingContext().getObject();
            this._backup = JSON.parse(JSON.stringify(rec));

            this.settingsModel.setProperty("/editingActive", true);
        },
        onSave: function () {

			const obj = this.detail.getBindingContext().getObject();
			const creating = this.settingsModel.getProperty("/isCreate");
			if (!obj.ID_PLANT || !obj.DS_PLANT) {
				MessageBox.error("Plant ID and Description are mandatory.");
				return;
			}

			if (obj.ID_PLANT.length >= 20) {
				MessageBox.error("Plant ID must be less than 20 characters.");
				return;
			}
			if (obj.OEE_PLANT && obj.OEE_PLANT.length > 4) {
				MessageBox.error("OEE Plant must not exceed 4 characters.");
				return;
			}

			$.ajax({
				url: this.serviceUrl,
				method: "POST",
				data: {
					QueryTemplate: creating ? this.queries.create : this.queries.update,

					"Param.1": obj.ID_PLANT,
					"Param.2": obj.DS_PLANT,
					"Param.3": obj.OEE_PLANT,
					"Param.4": obj.OEE_SERVER_TZ,
					"Param.5": obj.ID_HIERARCHY,

					"Content-Type": "text/json"
				},
				success: () => {
					MessageToast.show(creating ? "Plant created successfully." : "Plant updated successfully.");

					this.settingsModel.setProperty("/editingActive", false);
					this.settingsModel.setProperty("/isCreate", false);

					this.loadData();
					this.onClose();
				},
				error: () => {
					MessageBox.error("Save failed. Please try again.");
				}
			});
		},

        onDelete: function () {

            const obj = this.detail.getBindingContext().getObject();

            if (!obj.ID_PLANT) {
                MessageToast.show("Invalid Plant ID");
                return;
            }

            MessageBox.confirm(
                "Are you sure you want to delete Plant " + obj.ID_PLANT + "?",
                {
                    onClose: (act) => {

                        if (act !== MessageBox.Action.OK) return;

                        $.ajax({
                            url: this.serviceUrl,
                            method: "POST",
                            data: {
                                QueryTemplate: this.queries.delete,

                                "Param.1": obj.ID_PLANT,

                                "Content-Type": "text/json"
                            },
                            success: () => {
                                MessageToast.show("Plant deleted successfully.");
                                this.loadData();
                                this.onClose();
                            },
                            error: () => {
                                MessageBox.error("Delete failed.");
                            }
                        });
                    }
                }
            );
        },

        onCancel: function () {

            if (this.settingsModel.getProperty("/isCreate")) {
                let data = this.model.getData();
                data.Rowsets.Rowset[0].Row.shift();
                this.model.setData(data);
                this.onClose();
                return;
            }

            const ctx = this.detail.getBindingContext();
            const path = ctx.getPath();

            this.model.setProperty(path, this._backup);
            this.settingsModel.setProperty("/editingActive", false);
        },

       onClose: function () {
            this.fcl.setLayout(fioriLib.LayoutType.OneColumn);
            this.settingsModel.setProperty("/editingActive", false);
        },

        onRefresh: function () {
            this.loadData();
        }

    });
});
