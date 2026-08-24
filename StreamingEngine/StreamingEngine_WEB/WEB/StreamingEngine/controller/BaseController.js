var oResourceBundle;

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/message/Message",
    "sap/ui/core/MessageType",
    "sap/ui/core/Fragment"
], function (Controller, Message, Fragment, MessageType) {
    "use strict";

    return Controller.extend("StreamingEngine.StreamingEngine.controller.BaseController", {
        onInit: function () {
            oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
        },
        onMessagePopoverPress: function (oEvent) {
            var oView = this.getView();
            if (!this._pMessagePopover) {
                this._pMessagePopover = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.MessagePopover", this);
            }
            oView.addDependent(this._pMessagePopover);
            this._pMessagePopover.openBy(oEvent.getSource());
        },

        handleMessage: function (sMsgText, sAdditionalText, sDescription, sMessageType) {
            var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
            var oMessageManager = sap.ui.getCore().getMessageManager();
            oMessageManager.registerMessageProcessor(oMessageProcessor);
            var oMessage = new Message({
                message: sMsgText,
                additionalText: sAdditionalText,
                description: sDescription,
                type: sMessageType,
                target: "/Target",
                processor: oMessageProcessor
            });
            oMessageManager.addMessages(oMessage);
            //sap.m.MessageToast.show(sDescription);
        },
        onClearPress: function () {
            sap.ui.getCore().getMessageManager().removeAllMessages();
            var oView = this.getView();
            if (oView.getProperty("viewName") === "StreamingEngine.StreamingEngine.view.DigitalApps") {
                if (!oView.byId("combobox-transformation").getVisible() && !oView.byId("button-assign-tags").getVisible() && !oView.byId("button-remove-tags").getVisible()) {
                    oView.byId("page-digital-apps").setShowFooter(false);
                }
            }
        },
        deleteDeliveredNotifications: function (sFlowName, sDeliveredNotifsIds, sPageTitle, iIntervalID, iNbrNotifChecks) {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/NotificationSystem/Query/DeleteDeliveredNotifsAndCheckQueueXacuteQuery&Content-Type=text/json",
                type: "POST",
                data: {
                    "Param.1": sFlowName,
                    "Param.2": document.getElementById('input-username').value,
                    "Param.3": sDeliveredNotifsIds
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        that.handleMessage(oResourceBundle.getText(sPageTitle),
                            oResourceBundle.getText("commonNotificationRefresh"),
                            sErrorMessage,
                            "Error");
                    } else {
                        var iNbrPendingNotifications = result.Rowsets.Rowset[0].Row[0].NbrPendingNotifications;
                        if (iNbrPendingNotifications == 0 && iNbrNotifChecks == 20) clearInterval(iIntervalID);
                    }
                },
                error: function () {
                }
            });
        },
        checkNotificationProccess: function(iIntervalID, iNbrNotifChecks){
            if (iNbrNotifChecks == 20) clearInterval(iIntervalID);
        },
        createNotificationMessage: function (oNotif) {
            this.handleMessage(this.setMessageHeaderTitle(oNotif),
                this.setMessageTitle(oNotif),
                this.setMessageText(oNotif),
                this.setMessageType(oNotif.DS_STATUS));
        },
        setMessageHeaderTitle: function (oNotif) {
            if (oNotif.CD_FLOW == "TAG_HISTORICAL_UPLOAD") {
                return oResourceBundle.getText("commonTitleTagCatalog") + " - " + oResourceBundle.getText("tagCatalogEnableDataLoad");
            } else return "";
        },
        setMessageTitle: function (oNotif) {
            if (oNotif.CD_FLOW == "TAG_HISTORICAL_UPLOAD") {
                return oNotif.DS_NAME_RENAMED + "." + oNotif.PLANT_HIERARCHY;
            } else return "";
        },
        setMessageText: function (oNotif) {
            if (oNotif.CD_FLOW == "TAG_HISTORICAL_UPLOAD") {
                return oResourceBundle.getText("commonLabelPlant") + ": " + oNotif.PLANT + "\n" +
                    oResourceBundle.getText("commonLabelDataSource") + ": " + oNotif.DATA_SOURCE + "\n" +
                    oResourceBundle.getText("commonLabelRenamedTag") + ": " + oNotif.DS_NAME_RENAMED + "\n" +
                    oResourceBundle.getText("commonLabelRenamedBatch") + ": " + oNotif.PLANT_HIERARCHY + "\n" +
                    oResourceBundle.getText("commonMessage") + ": " + oNotif.DS_NOTIF_MESSAGE + "\n" +
                    oResourceBundle.getText("commonUpdatedAt") + ": " + oNotif.DT_CREATED;
            } else return "";
        },
        setMessageType: function (sMsgStatus) {
            switch (sMsgStatus) {
                case "E":
                    return "Error";
                case "W":
                    return "Warning";
                case "S":
                    return "Success";
                default:
                    return "Information"
            }
        }
    })

})