var oAppController;
var oResourceBundle;
var iQueueIntervalID;

sap.ui.define([
    "../controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.App", {
        onInit: function () {
            oAppController = this;
            //var sFirstName = document.getElementById('firstName').value;
            //var sLastName = document.getElementById('lastName').value;
            //var sFullName = fnLoadProfileValues ();
			
            //this.getView().byId("button-name").setText(sFullName);
			this.fnLoadProfileValues(function(sFullName) {
				oAppController.getView().byId("button-name").setText(sFullName || "User");
			});
			
            this.getView().byId("fixed-toolbar").setModel(this.oModel);
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oModel.setProperty("/ToolBarEnabled", true);
            //Add Message Manager
            /* var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true); */
            this.checkNotificationQueue();
        },
        onAfterRendering: function () {
            oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
        },
        fnNavigateBack: function () {
            if (this.oCurrentController == null || this.oCurrentController.fnNavigateBack == undefined) {
                if (sap.ui.core.routing.History.getInstance().getPreviousHash() !== undefined) {
                    window.history.go(-1);
                } else {
                    this.oRouter.navTo("Launchpad", true);
                }
            } else {
                this.oCurrentController.fnNavigateBack();
            }
        },
        fnNavigateHome: function () {
            this.oRouter.navTo("Launchpad");
        },
        oModel: new sap.ui.model.json.JSONModel({ HomeVisible: false }),
        fnUserNamePress: function (oEvent) {
            if (this.oPopover == undefined) {
                this.oPopover = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.UserNamePopover", this);
                let oTempModel = new sap.ui.model.json.JSONModel;
                oTempModel.loadData("./version.json", [], false);
                this.oModel.setProperty("/Version", oTempModel.getData()._AppVersion);
                this.oPopover.setModel(this.oModel);
                this.getView().addDependent(this.oPopover);
            }
            this.oPopover.openBy(oEvent.getSource());
        },
        fnHelpPress: function (oEvent) {
            oEvent.getSource().setExpanded(!oEvent.getSource().getExpanded());
        },
        fnNavToProfile: function (oEvent) {
            this.oRouter.navTo("ProfilePage");
        },
        fnLogout: function (oEvent) {
            new sap.m.Dialog({
                title: oResourceBundle.getText("commonConfirm"),
                type: 'Message',
                content: new sap.m.Text({
                    text: oResourceBundle.getText("commonLogoutMessage")
                }),
                beginButton: new sap.m.Button({
                    text: oResourceBundle.getText("commonYes"),
                    press: function (oEvent) {
                        window.open("/XMII/Illuminator?service=Logout&target=/XMII/CM/StreamingEngine/StreamingEngine/index.irpt", "_top");
                        oEvent.getSource().getParent().close();
                    }
                }),
                endButton: new sap.m.Button({
                    text: oResourceBundle.getText("commonNo"),
                    press: function (oEvent) {
                        oEvent.getSource().getParent().close();
                    }
                }),
                afterClose: function () {
                    this.destroy();
                }
            }).open();
        },
        fnSEContributorsPress: function (oEvent) {
            window.open("https://sanofi.atlassian.net/wiki/spaces/SENGINE/pages/64820283161/Streaming+Engine+Credits");
        },
        fnDSWPress: function (oEvent) {
            window.open("https://app.snowflake.com/sanofi/emea_df_ia/#/homepage");
        },
        fnIADCStatusPress: function (oEvent) {
            window.open("https://iadc-status.sanofi.com/");
        },
        fnUserManualPress: function (oEvent) {
            window.open("https://iadc-docs.sanofi.com/iadc/PCo/757268701");
        },
        fnReleasePagePress: function (oEvent) {
            window.open("https://iadc-docs.sanofi.com/iadc/PCo/63638866543");
        },
        fnServiceNowPress: function (oEvent) {
            window.open("https://sanofiservices.service-now.com/onesupport");
        },
        fnStandardChecksPress: function (oEvent) {
            window.open("https://docs.sanofi.com/cpv/wiki/spaces/konviw/pages/63943673100?style=digital");
        },
        oCurrentController: null,
        fnUpdate: function (oController, sTitle) {
            this.oCurrentController = oController;
            this.oModel.setProperty("/Title", sTitle);
            this.oModel.setProperty("/ProfileVisible", oController.getMetadata().getName() != "StreamingEngine.StreamingEngine.controller.ProfilePage");
            this.oModel.setProperty("/HomeVisible", oController.getMetadata().getName() != "StreamingEngine.StreamingEngine.controller.Launchpad");
            this.oModel.setProperty("/ToolBarEnabled", oController.getMetadata().getName() != "StreamingEngine.StreamingEngine.controller.NoAccess");
        },
        fnOpenRatingDialog: function () {
            if (!this._oRatingDialog) {
                this._oRatingDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.RatingDialog", this);
            }
            var sFirstName = document.getElementById('firstName').value;
            var sLastName = document.getElementById('lastName').value;
            var sFullName = sFirstName + " " + sLastName;
            this.getView().addDependent(this._oRatingDialog);
            var oData = {
                "ratingValue": 0.5,
                "comment": "",
                "anonymous": false,
                "action": false,
                "name": sFullName,
                "visibleName": true
            };
            var RatingModel = new sap.ui.model.json.JSONModel(oData);
            this._oRatingDialog.setModel(RatingModel, "Rating");
            this._oRatingDialog.open();
        },
        onChangeAnonymous: function (oEvent) {
            this._oRatingDialog.getModel("Rating").setProperty("/visibleName", !oEvent.getParameter("state"));
            this._oRatingDialog.getModel("Rating").refresh(true);
        },
        onSendFeedback: function () {
            var param = {
                "operationName": "createWhisp",
                "variables": {
                    "whisp": {
                        "type": "GLISTEN",
                        "applicationID": "StreamingEngine",
                        "openedBy": this._oRatingDialog.getModel("Rating").getData().anonymous ? "" : this._oRatingDialog.getModel("Rating").getData().name,
                        "description": this._oRatingDialog.getModel("Rating").getData().comment,
                        "data": {
                            "status": this._oRatingDialog.getModel("Rating").getData().action ? "ACTION_NEEDED" : "NO_ACTION_NEEDED",
                            "anonymous": this._oRatingDialog.getModel("Rating").getData().anonymous,
                            "feedback": this._oRatingDialog.getModel("Rating").getData().comment,
                            "rating": this._oRatingDialog.getModel("Rating").getData().ratingValue,
                            "name": this._oRatingDialog.getModel("Rating").getData().anonymous ? "" : this._oRatingDialog.getModel("Rating").getData().name,
                            "commentSentimentScore": 0,
                            "category": null,
                            "contextPage": "StreamingEngine",
                            "contextPortal": "Streaming Engine Application"
                        }
                    }
                },
                "query": "mutation createWhisp($whisp: WhispInputType!) {\n  createWhisp(whisp: $whisp) {\n    _id\n    openedBy\n    timestamp\n    data\n    __typename\n  }\n}\n"
            };
            var that = this;
            $.ajax({
                type: "POST",
                url: "https://whispr-uat.sanofi.com/graphql",
                data: JSON.stringify(param),
                success: function (data, status) {
                    that.onCloseFeedBackDialog();
                    that.handleMessage(oResourceBundle.getText("commonSEFeedback"),
                        oResourceBundle.getText("commonSEFeedbackSuccess"),
                        "",
                        "Success");
                },
                error: function (data, status) {
                    that.onCloseFeedBackDialog();
                    that.handleMessage(oResourceBundle.getText("commonSEFeedback"),
                        oResourceBundle.getText("commonSEFeedbackError"),
                        "",
                        "Error");
                },
                contentType: "application/json",
                dataType: "json"
            });
        },
        onCloseFeedBackDialog: function () {
            if (this._oRatingDialog) {
                this._oRatingDialog.close();
            }
        },
        checkNotificationQueue: function () {
            var that = this;
            this.iNbrNotifChecks = 0;
            iQueueIntervalID = setInterval(function () {
                that.checkNotificationQueueCallback();
            }, 30000);
        },
		fnLoadProfileValues: function (callback) {
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserProfile/Query/CurrentProfileXacuteQuery&Content-Type=text/json",
				success: function (result) {
					if (result.Rowsets.Rowset) {
						let data = result.Rowsets.Rowset[0];
						let sFirstName = data.Row[0].FirstName;
						let sLastName = data.Row[0].LastName;
						let sFullName = sFirstName + " " + sLastName;
						callback(sFullName);
					} else if (result.Rowsets.FatalError) {
						console.error("Error loading profile:", result.Rowsets.FatalError);
						callback("");
					}
				},
				error: function () {
					console.error("Failed to load profile data.");
					callback("");
				}
			});
		},

        checkNotificationQueueCallback: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/NotificationSystem/Query/NotificationListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": document.getElementById('input-username').value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        that.handleMessage(oResourceBundle.getText("commonTitleNotifications"),
                            oResourceBundle.getText("commonNotificationRefresh"),
                            sErrorMessage,
                            "Error");
                    } else {
                        var oData = result.Rowsets.Rowset[0];
                        var sDeliveredObjects = "";
                        if (oData.Row && oData.Row.length > 0) {
                            var aNotifications = oData.Row;
                            that.iNbrNotifChecks = 0; 
                            for (var iNotif in aNotifications) {
                                that.createNotificationMessage(aNotifications[iNotif]);
                                sDeliveredObjects = sDeliveredObjects + ",'" + aNotifications[iNotif].ID_NOTIFICATION + "'";
                            }
                        } else {
                            that.iNbrNotifChecks =  that.iNbrNotifChecks + 1;
                        }
                        if (sDeliveredObjects.length > 0) {
                            that.deleteDeliveredNotifications("ALL", sDeliveredObjects.substring(1), "commonTitleNotifications", iQueueIntervalID, that.iNbrNotifChecks);
                        } that.checkNotificationProccess(iQueueIntervalID, that.iNbrNotifChecks);
                        
                    }
                },
                error: function () {
                }
            });
        },
    });
});