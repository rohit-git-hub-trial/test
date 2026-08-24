/*-----------------------------------------------------------------------------------
Streaming Engine - Contextual Flows
Creation Date: 2020.05.19 / By: E0445955
Reference Document: 
Description:This screen is used to view all the available contextual flows
-------------------------------------------------------------------------------------*/
var oContextualFlowsController;
var selectedContextualFlowPlant;
var selectedContextualFlowDataSource;
var oDialog;
var selectedContextualFlowTypeUpper = "";
var selectedContextualFlowID = "";
var oResourceBundle;
var sHistoricalDataUploadSelectedStartDate = "";
var sHistoricalDataUploadSelectedEndDate = "";
var iHistoricalDataUploadMaxRequestTimeframe = "";
var iFlowLoggingStartDate = "";
var iFlowLoggingEndDate = "";
var oFlowLoggingStartDatejs="";
var sCachedUserEmail = null;

sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/MessageBox",
    "StreamingEngine/StreamingEngine/model/formatter",
], function (BaseController, MessageToast, Popover, Button, Dialog, Text, MessageBox, formatter) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.ContextualFlows", {
        formatter: formatter,
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oContextualFlowsController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            this.getView().byId("table-contextual-flows").setModel(this.oModelContextualFlows);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ContextualFlows").attachPatternMatched(this._onObjectMatched, this);
            this.byId("button-flow-logging").setEnabled(false);
            this.byId("button-desactivate-flow-logging").setEnabled(false);

        },
        onAfterRendering: function () {
            oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            /******************** Below Part for Authorisation***********************/
            var sRoles = document.getElementById('input-roles').value;
            var sAdminRole = "STREAMING_ENGINE_ADMIN";
            var sUserRole = "STREAMING_ENGINE_USER";
            var iAdminIndex = sRoles.indexOf(sAdminRole);
            var iUserIndex = sRoles.indexOf(sUserRole);
            if (iAdminIndex < 0) {
                this.fnShowNoAccess();
                return;
            } else {
                this.getView().byId("page-contextual-flows").setVisible(true);
            }

            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleConextualFlow"));
            oContextualFlowsController.getView().byId("messagestrip-run-flow-manually").setVisible(false);
            var sMode = oEvent.getParameter("arguments").Refresh;
            if (sMode == "Y") {
                oContextualFlowsController.fnLoadPlant();
                this.getView().byId("table-contextual-flows").getBinding("items").sort(new sap.ui.model.Sorter("PLANT", false));
                if (this.oSortDialog) {
                    this.oSortDialog.destroy();
                    this.oSortDialog = undefined;
                }
            } else if (sMode == "N") {

            }
        },
        oModelPlant: new sap.ui.model.json.JSONModel(),
        oModelDataSource: new sap.ui.model.json.JSONModel(),
        oModelContextualFlows: new sap.ui.model.json.JSONModel(),
        fnLoadPlant: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
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
                        oContextualFlowsController.oModelPlant.setData(data);
                        oContextualFlowsController.oModelPlant.refresh();
                        oContextualFlowsController.getView().byId("combobox-plant").setSelectedKey("%");
                        oContextualFlowsController.fnLoadContextualFlows();
                        oContextualFlowsController.fnPlantSelected();
                    }
                }
            });
        },
        fnPlantSelected: function () {
            this.fnLoadDataSource();
        },
        fnLoadDataSource: function () {
            var sselectedContextualFlowPlant = oContextualFlowsController.getView().byId("combobox-plant").getSelectedKey();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sselectedContextualFlowPlant,
                    "Param.4": 1,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
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
                        oContextualFlowsController.oModelDataSource.setData(data);
                        oContextualFlowsController.oModelDataSource.refresh();
                        oContextualFlowsController.getView().byId("combobox-data-source").setSelectedKey("%");
                        oContextualFlowsController.fnLoadContextualFlows();
                    }
                }
            });
        },
        onSearch: function () {
            this.fnLoadContextualFlows();
        },
        fnLoadContextualFlows: function () {
            oDialog.open();
            selectedContextualFlowPlant = oContextualFlowsController.getView().byId("combobox-plant").getSelectedKey();
            selectedContextualFlowDataSource = oContextualFlowsController.getView().byId("combobox-data-source").getSelectedKey();
            var sContextualFlow = oContextualFlowsController.getView().byId("input-data-flow").getValue();
            var sContextualFlowFilter = "%" + sContextualFlow.replace(/ /gi, '%') + "%";
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ContextualFlowListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": selectedContextualFlowPlant,
                    "Param.2": selectedContextualFlowDataSource,
                    "Param.3": sContextualFlowFilter,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                            oResourceBundle.getText("flowLoadContextualFlowsList"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oContextualFlowsController.oModelContextualFlows.setData(data);
                        oContextualFlowsController.oModelContextualFlows.refresh();
                        oDialog.close();
                    }
                }
            });
        },
        fnRowPress: function (oEvent) {
            var oPath = oEvent.getSource().getBindingContextPath();
            var selectedItem = oEvent.getSource().getBindingContext().oModel.getProperty(oPath);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("ContextualInformation", {
                MODE: "U",
                ID_DATA_FLOW: selectedItem.ID_DATA_FLOW,
                ID_SOURCE: selectedItem.ID_SOURCE,
                PLANT: selectedItem.PLANT,
                ID_DATA_DESTINATION: selectedItem.ID_DATA_DESTINATION,
                DESTINATION_NAME: encodeURIComponent(selectedItem.DESTINATION_NAME),
                DESTINATION_ENABLED: selectedItem.DESTINATION_ENABLED,
                SOURCE_NAME: selectedItem.SOURCE_NAME,
                FLOW_TYPE: selectedItem.FLOW_TYPE,
                DS_SQL_QUERY: encodeURIComponent(selectedItem.DS_SQL_QUERY),
                DS_NAME: selectedItem.DS_NAME,
                DS_DESCRIPTION: selectedItem.DS_DESCRIPTION,
                FL_COMPRESSED: selectedItem.FL_COMPRESSED,
                DS_MII_TRANSACTION: encodeURIComponent(selectedItem.DS_MII_TRANSACTION),
                FL_ENABLED: selectedItem.FL_ENABLED,
                ID_BATCH_SOURCE: selectedItem.ID_BATCH_SOURCE
            });
        },
        fnSelectionChanged: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();
            selectedContextualFlowID = oSelectedItem.ID_DATA_FLOW;
            var sFlowType = oSelectedItem.FLOW_TYPE;
            selectedContextualFlowTypeUpper = sFlowType.toUpperCase();
            var sMIITransaction = oSelectedItem.DS_MII_TRANSACTION;
            var sMIIQuery = oSelectedItem.DS_SQL_QUERY;
            var bFlowLogging = oSelectedItem.FL_FLOW_LOGGING;
            if (oSelectedItem.FL_ENABLED == "0") {
              this.byId("button-enable-data-upload").setEnabled(false);
              this.byId("button-disable-data-upload").setEnabled(false);
            } else if (
              ((sMIITransaction === "NA" && sMIIQuery !== "NA") ||
                sMIITransaction.includes("BatchInformation.trx") ||
                sMIITransaction.includes("ProcessEventInformation.trx") ||
                sMIITransaction.includes("ProcessEventInformationV2.trx") ||
                sMIITransaction.includes("DeltaV.trx") ||
                sMIITransaction.includes("JurongFlatFileEvents.trx")) &&
              oSelectedItem.ID_INITIAL_LOAD_PARENT == "NA"
            ) {
              this.byId("button-enable-data-upload").setEnabled(true);
              this.byId("button-disable-data-upload").setEnabled(false);
            } else if (
              ((sMIITransaction === "NA" && sMIIQuery !== "NA") ||
                sMIITransaction.includes("BatchInformation.trx") ||
                sMIITransaction.includes("ProcessEventInformation.trx") ||
                sMIITransaction.includes("ProcessEventInformationV2.trx") ||
                sMIITransaction.includes("DeltaV.trx") ||
                sMIITransaction.includes("JurongFlatFileEvents.trx")) &&
              oSelectedItem.ID_INITIAL_LOAD_PARENT != "NA"
            ) {
              this.byId("button-enable-data-upload").setEnabled(false);
              this.byId("button-disable-data-upload").setEnabled(true);
            } else {
              this.byId("button-enable-data-upload").setEnabled(false);
              this.byId("button-disable-data-upload").setEnabled(false);
            }
            if (bFlowLogging != "NA" && bFlowLogging != 0) {
              this.byId("button-flow-logging").setEnabled(false);
              this.byId("button-desactivate-flow-logging").setEnabled(true);
            } else if (bFlowLogging == "NA" || bFlowLogging == 0) {
              this.byId("button-flow-logging").setEnabled(true);
              this.byId("button-desactivate-flow-logging").setEnabled(false);
            } else {
              this.byId("button-flow-logging").setEnabled(false);
              this.byId("button-desactivate-flow-logging").setEnabled(false);
            }
            if (
              ((sMIITransaction === "NA" && sMIIQuery !== "NA") ||
                sMIITransaction.includes("BatchInformation.trx") ||
                sMIITransaction.includes("ProcessEventInformation.trx") ||
                sMIITransaction.includes("DeltaV.trx") ||
                sMIITransaction.includes("JurongFlatFileEvents.trx")) &&
              oSelectedItem.ID_INITIAL_LOAD_PARENT != "NA"
            ) {
              this.byId("button-flow-logging").setEnabled(false);
              this.byId("button-desactivate-flow-logging").setEnabled(false);
            }
        },
        fnFlowLogging: function (oEvent) {
            if (!this._oLoggingDialog) {
                this._oLoggingDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.FlowLogging", this);
                this._oLoggingDialog.setModel(this.getView().getModel("i18n"), "i18n");
            }
            var oStartDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "MM/dd/yyyy HH:mm:ss"
            });
            var oDate = new Date();

            //convert to UTC
            oDate.setHours(oDate.getUTCHours());
            oDate.setMinutes(oDate.getUTCMinutes());
            oDate = new Date(oDate.getTime());
            oFlowLoggingStartDatejs = oDate;
            sap.ui.getCore().byId("flow-logging-time-from").setValue(oStartDateFormat.format(oDate));
            this._oLoggingDialog.open();
        },
        fnSaveFlowLogging: function () {
            var that = this;
            var oFlowLoggingEndDatejs = sap.ui.getCore().byId("flow-logging-time-to").getDateValue();
            iFlowLoggingEndDate = sap.ui.getCore().byId("flow-logging-time-to").getValue();
            if ((oFlowLoggingStartDatejs > oFlowLoggingEndDatejs) || (oFlowLoggingEndDatejs.setDate(oFlowLoggingEndDatejs.getDate() - 15) > oFlowLoggingStartDatejs)) {
                this.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                    oResourceBundle.getText("contextualFlowLoggingDetails"),
                    oResourceBundle.getText("contextualFlowLoggingValidDate"),
                    "Error");
                MessageToast.show(oResourceBundle.getText("contextualFlowLoggingValidDate"), {
                    width: "25em"
                });
            }
            else {
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ContextualFlowUpdateLoggingQuery&Content-Type=text/json",
                    type: "POST",
                    async: true,
                    data: {
                        "Param.1": 1,
                        "Param.2": iFlowLoggingEndDate,
                        "Param.3": selectedContextualFlowID
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            //MessageToast.show(sErrorMessage);
                            that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                                oResourceBundle.getText("flowLogging"),
                                sErrorMessage,
                                "Error");
                            oDialog.close();
                        } else {

                            that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                                oResourceBundle.getText("flowLogging"),
                                oResourceBundle.getText("flowLoggingstart"),
                                "Success");
                        }
                    },
                    error: function () {

                    }
                });
                this.fnLoadContextualFlows();
                oContextualFlowsController._oLoggingDialog.close();
            }
        },
        fnFlowLoggingClearEntries: function () {
            sap.ui.getCore().byId("flow-logging-time-to").setValue("");
        },
        fnFlowLoggingClose: function () {
            if (this._oLoggingDialog) {
                this.fnFlowLoggingClearEntries();
                this._oLoggingDialog.close();
            }
        },
        fnCancelConfirm: function () {
            MessageBox.confirm(oResourceBundle.getText("cancelflowLoggingMsg"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === "YES") {
                        oContextualFlowsController.fnCancelLogging();
                    }
                }
            }
            );
        },
        fnCancelLogging: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataFlow/Query/ContextualFlowUpdateLoggingQuery&Content-Type=text/json",
                type: "POST",
                async: true,
                data: {
                    "Param.1": 0,
                    "Param.2": null,
                    "Param.3": selectedContextualFlowID
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                            oResourceBundle.getText("flowLogging"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {

                        that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                            oResourceBundle.getText("flowLogging"),
                            oResourceBundle.getText("stopflowLogging"),
                            "Success");
                    }
                },
                error: function () {

                }
            });
            this.fnLoadContextualFlows();
        },
        fnHistoricalDataUpload: function (oEvent) {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.HistoricalDataUpload", this);
                this._oDialog.setModel(this.getView().getModel("i18n"), "i18n");
            }
            this._oDialog.open();
			 
			var oRadioGroup = sap.ui.getCore().byId("rbEmailNotification");
			if (oRadioGroup) {
				oRadioGroup.setSelectedIndex(0);
			}

			this._triggerEmailFetchOnLoad();
		},
        fnHistoricalDataUploadClearEntries: function (bDisableButtons = false) {
            sap.ui.getCore().byId("historical-upload-time-from").setValue("");
            sap.ui.getCore().byId("historical-upload-time-to").setValue("");
            sap.ui.getCore().byId("historical-upload-max-timeframe").setValue("30");
            if (bDisableButtons == true) {
                this.byId("button-enable-data-upload").setEnabled(false);
                this.byId("button-disable-data-upload").setEnabled(false);
            }
        },
        fnHistoricalDataUploadClosePopOver: function () {
            if (this._oDialog) {
                this.fnHistoricalDataUploadClearEntries();
                this._oDialog.close();
            }
        },
		
		_triggerEmailFetchOnLoad: function () {

			var oEmailInput = sap.ui.getCore().byId("emailInput");

			if (!oEmailInput) return;

			oEmailInput.setVisible(true);
			oEmailInput.setEnabled(false);
			oEmailInput.setValue("");
			oEmailInput.setPlaceholder("Fetching email...");

			if (sCachedUserEmail !== null) {
				this._handleEmailResult(sCachedUserEmail, oEmailInput);
				return;
			}

			sap.ui.core.BusyIndicator.show(0);

			var sUserLocal = document.getElementById("input-username").value;

			var that = this;

			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserProfile/Query/UserProfileSelectQuery&Content-Type=text/json",
				type: "POST",
				data: { "Param.1": sUserLocal },

				success: function (result) {
					sap.ui.core.BusyIndicator.hide();

					try {
						var oRow = result.Rowsets.Rowset[0].Row[0];
						var sEmail = oRow.DS_EMAIL;

						sCachedUserEmail = sEmail || "";

						that._handleEmailResult(sEmail, oEmailInput);

					} catch (e) {
						that._handleEmailError(oEmailInput);
					}
				},

				error: function () {
					sap.ui.core.BusyIndicator.hide();
					that._handleEmailError(oEmailInput);
				}
			});
		},
		onEmailNotificationChange: function (oEvent) {

			var iSelectedIndex = oEvent.getParameter("selectedIndex");
			var oEmailInput = sap.ui.getCore().byId("emailInput");

			if (iSelectedIndex === 0) {
				
				oEmailInput.setVisible(true);

				oEmailInput.setEnabled(false);
				oEmailInput.setValue("");
				oEmailInput.setPlaceholder("Fetching email...");

				if (sCachedUserEmail !== null) {
					this._handleEmailResult(sCachedUserEmail, oEmailInput);
					return;
				}

				sap.ui.core.BusyIndicator.show(0);

				var sUserLocal = document.getElementById("input-username").value;

				var that = this;

				$.ajax({
					url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserProfile/Query/UserProfileSelectQuery&Content-Type=text/json",
					type: "POST",
					data: { "Param.1": sUserLocal },

					success: function (result) {

						sap.ui.core.BusyIndicator.hide();

						try {
							var oRow = result.Rowsets.Rowset[0].Row[0];
							var sEmail = oRow.DS_EMAIL;

							sCachedUserEmail = sEmail || "";

							that._handleEmailResult(sEmail, oEmailInput);

						} catch (e) {
							that._handleEmailError(oEmailInput);
						}
					},

					error: function () {
						sap.ui.core.BusyIndicator.hide();
						that._handleEmailError(oEmailInput);
					}
				});

			} else {
				oEmailInput.setVisible(false);
			}
		},
		_handleEmailResult: function (sEmail, oEmailInput) {

			if (this._isValidEmail(sEmail)) {

				oEmailInput.setValue(sEmail);
				oEmailInput.setPlaceholder("Email Address");

			} else {

				oEmailInput.setValue("");
				oEmailInput.setPlaceholder("Your email address is not maintained in profile, please enter your email address");
			}

			oEmailInput.setEnabled(true);
		},
		_handleEmailError: function (oEmailInput) {

			oEmailInput.setValue("");
			oEmailInput.setPlaceholder("Unable to fetch email, please enter manually");
			oEmailInput.setEnabled(true);
		},
		_isValidEmail: function (sEmail) {
			if (!sEmail) return false;

			var oRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			return oRegex.test(sEmail);
		},
		
        fnStartHistoricalDataUpload: function () {
            sHistoricalDataUploadSelectedStartDate = sap.ui.getCore().byId("historical-upload-time-from").getValue();
            sHistoricalDataUploadSelectedEndDate = sap.ui.getCore().byId("historical-upload-time-to").getValue();
            iHistoricalDataUploadMaxRequestTimeframe = sap.ui.getCore().byId("historical-upload-max-timeframe").getValue();
			
			var iSelectedIndex = sap.ui.getCore().byId("rbEmailNotification").getSelectedIndex();
			var sEmail = sap.ui.getCore().byId("emailInput").getValue();
			var sUserLocal = document.getElementById("input-username").value;
			var bSendEmail = (iSelectedIndex === 0);
			if (bSendEmail) {
				if (!this._isValidEmail(sEmail)) {
					MessageBox.error("Email address is not valid, please enter a valid email address.");
					return; 
				}
			}
			this._bSendEmail = bSendEmail;
			this._sEmail = bSendEmail ? sEmail : "";
			this._sUserLocal = bSendEmail ? sUserLocal : "";

            var oStartDateJs = sap.ui.getCore().byId("historical-upload-time-from").getDateValue();
            var oEndDateJs = sap.ui.getCore().byId("historical-upload-time-to").getDateValue();

            if (sHistoricalDataUploadSelectedStartDate && sHistoricalDataUploadSelectedEndDate && iHistoricalDataUploadMaxRequestTimeframe) {
                if (oStartDateJs < oEndDateJs) {
                    if (iHistoricalDataUploadMaxRequestTimeframe > 5) {
                        this._oDialog.close();
                        oContextualFlowsController.fnEnableHistoricalDataUploadSubmit("ENABLE");
                    } else {
                        MessageToast.show(oResourceBundle.getText("contextualFlowMinimumFive") + ": " + oResourceBundle.getText("contextualFlowMaxTimeframePerRequest"), {
                            width: "25em"
                        });

                        this.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                            oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                            oResourceBundle.getText("contextualFlowMinimumFive") + ": " + oResourceBundle.getText("contextualFlowMaxTimeframePerRequest"),
                            "Error");
                    }
                } else {
                    MessageToast.show(oResourceBundle.getText("tagErrorDatesMsg"), {
                        width: "25em"
                    });

                    this.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                        oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                        oResourceBundle.getText("tagErrorDatesMsg"),
                        "Error");

                }
            } else {
                MessageToast.show(oResourceBundle.getText("contextualFlowEmptyMandValues"), {
                    width: "25em"
                });
                this.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                    oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                    oResourceBundle.getText("contextualFlowEmptyMandValues"),
                    "Error");
            }
        },
        oModelHistoricalDataLoad: new sap.ui.model.json.JSONModel(),
        fnEnableHistoricalDataUploadSubmit: function (sAction) {
            var sProcessingText = oResourceBundle.getText("commonBackgroundProcessMessage");
            oDialog.setText(sProcessingText);
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/HistoricalUpload/Query/HistoricalUploadXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": sAction,
                    "Param.2": selectedContextualFlowID,
                    "Param.3": sHistoricalDataUploadSelectedStartDate,
                    "Param.4": sHistoricalDataUploadSelectedEndDate,
                    "Param.5": iHistoricalDataUploadMaxRequestTimeframe,
					"Param.6": this._sUserLocal || "",
					"Param.7": this._sEmail || ""
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                            oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        oDialog.close();
                        if (!oContextualFlowsController.getView()._oDialog) {
                            oContextualFlowsController.getView()._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.HistoricalUploadReport", oContextualFlowsController);
                        }
                        oContextualFlowsController.getView().addDependent(oContextualFlowsController.getView()._oDialog);
                        jQuery.sap.syncStyleClass("sapUiSizeCompact", oContextualFlowsController.getView(), oContextualFlowsController.getView()._oDialog);
                        oContextualFlowsController.getView()._oDialog.open();
                        sap.ui.getCore().byId("historical-upload-report").setModel(oContextualFlowsController.oModelHistoricalDataLoad);
                        var data = result.Rowsets.Rowset[0];
                        oContextualFlowsController.oModelHistoricalDataLoad.setData(data);
                        oContextualFlowsController.oModelHistoricalDataLoad.refresh();
                        that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                            oResourceBundle.getText("contextualFlowHistoricalDataUploadEnable"),
                            data.Row[0].ResponseMessage,
                            data.Row[0].Status === "S" ? "Success" : data.Row[0].Status === "W" ? "Warning" : "Error");
                    }
                },
                error: function () {
                }
            });
            this.fnHistoricalDataUploadClearEntries();

        },
        fnCloseHistoricalUploadPopUp: function () {
            oContextualFlowsController.getView()._oDialog.close();
            oContextualFlowsController.getView().byId("table-contextual-flows").removeSelections(true);
            oContextualFlowsController.fnLoadContextualFlows();
        },
        fnCancelHistoricalDataUpload: function () {
            MessageBox.confirm(oResourceBundle.getText("contextualFlowCancelUploadMsg"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction === "YES") {
                        oContextualFlowsController.fnEnableHistoricalDataUploadSubmit("DISABLE");
                    }
                }
            }
            );
        },
        fnHistoricalTimeFrameChange: function (oEvent) {
            if (oEvent.getParameter("newValue") < 5) {
                oEvent.getSource().setValue(5)
            }
        },
        fnRunFlowManually: function () {
            if (selectedContextualFlowID != "" && selectedContextualFlowTypeUpper != "") {
                var that = this;
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/JobEngine/Query/EngineExecution_JobXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    async: true,
                    data: {
                        "Param.1": selectedContextualFlowTypeUpper,
                        "Param.2": selectedContextualFlowID
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                            //MessageToast.show(sErrorMessage);
                            that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                                oResourceBundle.getText("flowRunManually"),
                                sErrorMessage,
                                "Error");
                            oDialog.close();
                        } else {
                            oContextualFlowsController.getView().byId("messagestrip-run-flow-manually").setVisible(true);
                            that.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                                oResourceBundle.getText("flowRunManually"),
                                oResourceBundle.getText("commonBackgroundProcessMessage"),
                                "Success");
                        }
                    },
                    error: function () {

                    }
                });
            } else {
                var sErrorMessage = oResourceBundle.getText("flowSelectContextualFlow");
                //MessageToast.show(sErrorMessage);
                this.handleMessage(oResourceBundle.getText("commonTitleConextualFlow"),
                    oResourceBundle.getText("flowRunManually"),
                    sErrorMessage,
                    "Error");
            }

        },
        fnAddNew: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("ContextualInformation", {
                MODE: "I"
            });
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");
        },
        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>commonLabelPlant}", key: "PLANT", selected: true },
                { text: "{i18n>flowDS}", key: "SOURCE_NAME" },
                { text: "{i18n>flowName}", key: "DS_NAME" },
                { text: "{i18n>flowDesc}", key: "DS_DESCRIPTION" },
                { text: "{i18n>flowCompressed}", key: "FL_COMPRESSED" },
                { text: "{i18n>flowEnabled}", key: "FL_ENABLED" },
            ];
            var oTable = oEvent.getSource().getParent().getParent(); // Table > Toolbar > Button
            if (!this.oSortDialog) {
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>flowContextualSort}",
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