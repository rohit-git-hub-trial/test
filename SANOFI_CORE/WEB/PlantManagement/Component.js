sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "PlantManagement/model/models"
], function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("PlantManagement.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            this.getRouter().initialize();

            this.setModel(models.createDeviceModel(), "device");
        }
    });
});
