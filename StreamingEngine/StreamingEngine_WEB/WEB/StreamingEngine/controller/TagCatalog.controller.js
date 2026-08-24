/*-----------------------------------------------------------------------------------
Streaming Engine - Tag Catalog
Creation Date: 2020.04.28 / By: E0445955
Reference Document: 
Description: Tag catalog is a page from where the tags can be managed
-------------------------------------------------------------------------------------*/ 
var selectedPlant;
var selectedTagSource;
var inputOriginalTag;
var inputRenamedTag;
var flagRealTime;
var flagArchive;
var flagWatch;
var flagInitialLoad;
var OriginalTagFilterValue;
var RenamedTagFilterValue;
var SwitchHidden;
var oTagCatalogController;
var oDialog;
var oResourceBundle;
var initFinished = false;
var sInitialLoadTagList = "";
var sInitialLoadSelectedStartDate = "";
var sInitialLoadSelectedEndDate = "";
var iInitialLoadMaxTimeframe = "";
var sInitialLoadEmail = "";
var sInitialLoadUserLocal = "";
var bInitialLoadSendEmail = false;
var sCachedUserEmail = null;
var selectedDigitalApp = "";
var iIntervalID;
var bShowCommentDialog = true;
var bUserChoseAllFiltered = false;
var bPendingExport = false;

sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageToast",
    'sap/ui/model/Sorter',
    "StreamingEngine/StreamingEngine/model/formatter",
    "sap/m/Popover",
    "sap/m/MessageBox",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text"
    ,
], function (BaseController, MessageToast, Sorter, formatter, Popover, MessageBox, Button, Dialog, Text) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.TagCatalog", {
        formatter: formatter,

        oModelSelectedTags: new sap.ui.model.json.JSONModel([]),
        onInit: function () {


            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
            // set selected tags model
            this.getView().byId("table-tag-catalog").removeSelections(true);
            this.oModelSelectedTags.setData([]);

            oView.setModel(this.oModelSelectedTags, "SelectedTags");
            this.oModelChangeMessages = new sap.ui.model.json.JSONModel({ Row: [] });
            oTagCatalogController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
            this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
            this.getView().byId("table-tag-catalog").setModel(this.oModelTagCatalog);
            oTagCatalogController.fnLoadPlant();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("TagCatalog").attachPatternMatched(this._onObjectMatched, this);
            this.mGroupFunctions = {
                PLANT: function (oContext) {
                    var plant = oContext.getProperty("PLANT");
                    return {
                        key: plant,
                        text: plant
                    };
                },
                SOURCE_NAME: function (oContext) {
                    var source = oContext.getProperty("SOURCE_NAME");
                    return {
                        key: source,
                        text: source
                    };
                }
            };

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
                this.getView().byId("page-tag-catalog").setVisible(true);

                this.getView().byId("button-enable-data-load").setVisible(true);
                this.getView().byId("button-disable-data-load").setVisible(true);


            }
            /***********************************************************************/
            initFinished = true;
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },
        _onObjectMatched: function () {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleTagCatalog"));
            // reset selected tags
            this.getView().byId("table-tag-catalog").removeSelections(true);
            this.getView().byId("button-reset-tags").setEnabled(false);
            this.oModelSelectedTags.setData([]);

            // Reset Sort to Default
            this.sSortQuery = "T.FL_WATCH_DATA_CAPTURE DESC,T2.ID_SOURCE DESC,T.ID_SOURCE ASC,T.DS_NAME_ORIGINAL ASC"
            if (this.oSortDialog) {
                this.oSortDialog.destroy();
                this.oSortDialog = undefined;
            }
            oTagCatalogController.fnLoadTagCatalog();
        },
        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");

        },
        fnImportFromExcel: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("TagUpload");
        },

        oModelPlant: new sap.ui.model.json.JSONModel(),
        oModelDataSource: new sap.ui.model.json.JSONModel(),
        oModelTagCatalog: new sap.ui.model.json.JSONModel(),
        oModelInitialDataLoad: new sap.ui.model.json.JSONModel(),
        oModelDigitalAppsList: new sap.ui.model.json.JSONModel(),


        fnRowPress: function (oEvent) {
            var oPath = oEvent.getSource().getBindingContextPath();
            var selectedItem = oEvent.getSource().getBindingContext().oModel.getProperty(oPath);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("TagInformation", {
                ID_TAG: selectedItem.ID_TAG,
                ID_SOURCE: encodeURIComponent(selectedItem.ID_SOURCE),
                ID_PLANT_HIERARCHY: encodeURIComponent(selectedItem.ID_PLANT_HIERARCHY),
                ID_PLANT: selectedItem.ID_PLANT,
                PLANT: selectedItem.PLANT,
                DS_NAME_ORIGINAL: encodeURIComponent(selectedItem.DS_NAME_ORIGINAL),
                DS_NAME_RENAMED: encodeURIComponent(selectedItem.DS_NAME_RENAMED),
                DS_DESCRIPTION: ((selectedItem.DS_DESCRIPTION == "") ? 'NA' : encodeURIComponent(selectedItem.DS_DESCRIPTION)),
                ID_UOM: encodeURIComponent(selectedItem.ID_UOM),
                ID_PCO_DESTINATION: selectedItem.ID_PCO_DESTINATION,
                SOURCE_NAME: encodeURIComponent(selectedItem.SOURCE_NAME),
                DS_MII_DATA_SERVER_PROCESS: selectedItem.DS_MII_DATA_SERVER_PROCESS,
                PLANT_HIERARCHY_ID: encodeURIComponent(selectedItem.PLANT_HIERARCHY_ID),
                PLANT_HIERARCHY: encodeURIComponent(selectedItem.PLANT_HIERARCHY),
                FLAG_REALTIME: selectedItem.FLAG_REALTIME,
                FLAG_ARCHIVE: selectedItem.FLAG_ARCHIVE,
                COLOR_STATUS: selectedItem.COLOR_STATUS,
                LIMIT_CAPTURE: encodeURIComponent(selectedItem.LIMIT_CAPTURE),
                LIMIT_VISUALIZATION: encodeURIComponent(selectedItem.LIMIT_VISUALIZATION),
                FL_WATCH_DATA_CAPTURE: selectedItem.FL_WATCH_DATA_CAPTURE,
                FL_WATCH_VISUALIZATION: selectedItem.FL_WATCH_VISUALIZATION,
                FL_SEND_DATA_AFTER_WATCH: selectedItem.FL_SEND_DATA_AFTER_WATCH,
                FL_ENERGY: selectedItem.FL_ENERGY
            });
        },

        fnLoadPlant: function () {
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    var data = result.Rowsets.Rowset[0];
                    try {
                        data.Row.unshift({
                            DS_NAME: oResourceBundle.getText("commonAll"),
                            ID_PLANT: "%"
                        });
                    } catch (err) { };
                    oTagCatalogController.oModelPlant.setData(data);
                    oTagCatalogController.oModelPlant.refresh();
                    oTagCatalogController.getView().byId("combobox-plant").setSelectedKey("%");
                    oTagCatalogController.fnPlantSelected();
                }
            });
        },

        fnPlantSelected: function () {
            this.fnLoadDataSource();
        },

        onSearch: function () {
            this.fnLoadTagCatalog();
        },

        fnSelectedGetTagList: function ()
		/*
		{
			var aSelected = this.oModelSelectedTags.getData();
			return aSelected.map(function (t) { return t.ID_TAG; }).join(",");
		}, */
  {
            var sTagList = "";
            for (var i = 0; i < oTagCatalogController.oModelSelectedTags.getData().length; i++) {
                if (i == 0) {
                    sTagList = oTagCatalogController.oModelSelectedTags.getData()[i].ID_TAG;
                } else {
                    sTagList = sTagList + "," + oTagCatalogController.oModelSelectedTags.getData()[i].ID_TAG;
                }
            }
            return sTagList;
        },

        onSelectionChange: function (oEvent) {
			var sTagsSelected = oResourceBundle.getText("tagCatalogTagsSelected");
			var aSelectedItems = oEvent.getParameter("listItems") || [];
			var aCurrentTags = this.oModelSelectedTags.getData();
			var aUpdatedTags = aCurrentTags.slice(); 

			aSelectedItems.forEach(function (oItem) {
				var oTag = oItem.getBindingContext().getObject();
				var bSelected = oItem.getSelected();

				if (bSelected) {
					var exists = aUpdatedTags.some(function (t) { return t.ID_TAG === oTag.ID_TAG; });
					if (!exists) aUpdatedTags.push(oTag);
				} else {
					aUpdatedTags = aUpdatedTags.filter(function (t) { return t.ID_TAG !== oTag.ID_TAG; });
				}
			});

			this.oModelSelectedTags.setData(aUpdatedTags);
			this.oModelSelectedTags.refresh(true);

			var iCount = aUpdatedTags.length;
			if (iCount > 0) {
				MessageToast.show(iCount + " " + sTagsSelected);
				this.getView().byId("button-reset-tags").setEnabled(true);
			} else {
				this.getView().byId("button-reset-tags").setEnabled(false);
			}
		},

        fnEnableInitialDataLoad: function () {
            var sSelectATag = oResourceBundle.getText("tagCatalogSelectATag");
            sInitialLoadTagList = this.fnSelectedGetTagList();
            if (sInitialLoadTagList == "") {
                //MessageToast.show(sSelectATag);
                this.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                    oResourceBundle.getText("tagCatalogEnableDataLoad"),
                    sSelectATag,
                    "Error");
                return false;
            }
            if (!this.oInitialDataLoadDialog) {
                this.oInitialDataLoadDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.InitialLoadDateRange", this);
                this.oInitialDataLoadDialog.setModel(this.getView().getModel("i18n"), "i18n");
            }
            this.oInitialDataLoadDialog.open();
            oTagCatalogController.fnDateRangeSimpleInitPopup();

            // reset email notification radio group to "Yes" and fetch the user email
            var oRadioGroup = sap.ui.getCore().byId("rbEmailNotificationInitialLoad");
            if (oRadioGroup) {
                oRadioGroup.setSelectedIndex(0);
            }
            this._triggerInitialLoadEmailFetchOnLoad();
        },
        fnDisableInitialDataLoad: function () {
            var sSelectATag = oResourceBundle.getText("tagCatalogSelectATag");
            sInitialLoadTagList = this.fnSelectedGetTagList();
            if (sInitialLoadTagList == "") {
                //MessageToast.show(sSelectATag);
                this.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                    oResourceBundle.getText("tagCatalogDisableDataLoad"),
                    sSelectATag,
                    "Error");
                return false;
            }
            oTagCatalogController.fnDisableInitialDataLoadConfirm();
        },
        fnDisableInitialDataLoadConfirm: function () {
            var sConfirmTitle = oResourceBundle.getText("commonConfirm");
            var sConfirmYes = oResourceBundle.getText("commonYes");
            var sConfirmNo = oResourceBundle.getText("commonNo");
            var sConfirmMessage = oResourceBundle.getText("commonConfirmationDialog");
            var dialog = new Dialog({
                title: sConfirmTitle,
                type: 'Message',
                content: new Text({
                    text: sConfirmMessage
                }),
                beginButton: new Button({
                    text: sConfirmYes,
                    press: function () {
                        oTagCatalogController.fnEnableInitialDataLoadSubmit("DISABLE");
                        dialog.close();
                    }
                }),
                endButton: new Button({
                    text: sConfirmNo,
                    press: function () {
                        dialog.close();
                    }
                }),
                afterClose: function () {
                    dialog.destroy();
                }
            });
            dialog.open();
        },

        fnResetTags: function () {
            var that = this;
            MessageBox.confirm(oResourceBundle.getText("tagResetConfirmation"), {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction) {
                    if (sAction == "YES") {
                        that.fnValidateChangeComments();

                    }
                }
            }
            );




        },
        fnDateRangeSimpleInitPopup: function () {
            // var sDateTimeNow = new Date();
            // sap.ui.getCore().byId("initial-load-date-time-from").setMaxDate(sDateTimeNow);
            // sap.ui.getCore().byId("initial-load-date-time-to").setMaxDate(sDateTimeNow);
        },
        fnDateRangeSimpleClosePopOver: function () {
            this.oInitialDataLoadDialog.close();
        },
        fnDateRangeSimpleFromDateChanged: function () {

        },
        fnDateRangeSimpleToDateChanged: function () {

        },
        fnInitialLoadTimeFrameChange: function (oEvent) {
            if (oEvent.getParameter("newValue") < 5) {
                oEvent.getSource().setValue(5);
            }
        },
        _triggerInitialLoadEmailFetchOnLoad: function () {

            var oEmailInput = sap.ui.getCore().byId("emailInputInitialLoad");

            if (!oEmailInput) return;

            oEmailInput.setVisible(true);
            oEmailInput.setEnabled(false);
            oEmailInput.setValue("");
            oEmailInput.setPlaceholder("Fetching email...");

            if (sCachedUserEmail !== null) {
                this._handleInitialLoadEmailResult(sCachedUserEmail, oEmailInput);
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

                        that._handleInitialLoadEmailResult(sEmail, oEmailInput);

                    } catch (e) {
                        that._handleInitialLoadEmailError(oEmailInput);
                    }
                },

                error: function () {
                    sap.ui.core.BusyIndicator.hide();
                    that._handleInitialLoadEmailError(oEmailInput);
                }
            });
        },
        onInitialLoadEmailNotificationChange: function (oEvent) {

            var iSelectedIndex = oEvent.getParameter("selectedIndex");
            var oEmailInput = sap.ui.getCore().byId("emailInputInitialLoad");

            if (iSelectedIndex === 0) {

                oEmailInput.setVisible(true);
                this._triggerInitialLoadEmailFetchOnLoad();

            } else {
                oEmailInput.setVisible(false);
            }
        },
        _handleInitialLoadEmailResult: function (sEmail, oEmailInput) {

            if (this._isValidEmail(sEmail)) {

                oEmailInput.setValue(sEmail);
                oEmailInput.setPlaceholder("Email Address");

            } else {

                oEmailInput.setValue("");
                oEmailInput.setPlaceholder("Your Email address is not maintained in profile, please enter your Email address");
            }

            oEmailInput.setEnabled(true);
        },
        _handleInitialLoadEmailError: function (oEmailInput) {

            oEmailInput.setValue("");
            oEmailInput.setPlaceholder("Unable to fetch email, please enter manually");
            oEmailInput.setEnabled(true);
        },
        _isValidEmail: function (sEmail) {
            if (!sEmail) return false;

            var oRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return oRegex.test(sEmail);
        },
        fnDateRangeSimpleApplyDateRange: function () {
            sInitialLoadSelectedStartDate = sap.ui.getCore().byId("initial-load-date-time-from").getValue();
            sInitialLoadSelectedEndDate = sap.ui.getCore().byId("initial-load-date-time-to").getValue();
            var oStartDateJs = sap.ui.getCore().byId("initial-load-date-time-from").getDateValue();
            var oEndDateJs = sap.ui.getCore().byId("initial-load-date-time-to").getDateValue();
	var iMaxTimeframe = sap.ui.getCore().byId("historical-upload-max-timeframe-archive").getValue();
	
	iInitialLoadMaxTimeframe = iMaxTimeframe;

            // Read the email notification choice and validate before submitting
            var iSelectedIndex = sap.ui.getCore().byId("rbEmailNotificationInitialLoad").getSelectedIndex();
            var sEmail = sap.ui.getCore().byId("emailInputInitialLoad").getValue();
            var sUserLocal = document.getElementById("input-username").value;
            var bSendEmail = (iSelectedIndex === 0);
            if (bSendEmail) {
                if (!this._isValidEmail(sEmail)) {
                    MessageBox.error("Email address is not valid, please enter a valid Email address.");
                    return;
                }
            }
            bInitialLoadSendEmail = bSendEmail;
            sInitialLoadEmail = bSendEmail ? sEmail : "";
            sInitialLoadUserLocal = bSendEmail ? sUserLocal : "";

            if (sInitialLoadSelectedStartDate != "" && sInitialLoadSelectedEndDate != "") {
                if (oStartDateJs < oEndDateJs) {
                    if (iMaxTimeframe > 5) {
                        this.oInitialDataLoadDialog.close();
                        oTagCatalogController.fnEnableInitialDataLoadSubmit("ENABLE");
                    } else {
                        MessageToast.show(oResourceBundle.getText("contextualFlowMinimumFive") + ": " + oResourceBundle.getText("archiveFlowMaxTimeframePerRequest"), {
                            width: "25em"
                        });
                        this.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                            oResourceBundle.getText("tagCatalogEnableDataLoad"),
                            oResourceBundle.getText("contextualFlowMinimumFive") + ": " + oResourceBundle.getText("archiveFlowMaxTimeframePerRequest"),
                            "Error");
                    }
                } else {
                    MessageToast.show(oResourceBundle.getText("tagErrorDatesMsg"), {
                        width: "25em"
                    });
                    this.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                        oResourceBundle.getText("tagCatalogEnableDataLoad"),
                        oResourceBundle.getText("tagErrorDatesMsg"),
                        "Error");

                }
            } else {
                MessageToast.show(oResourceBundle.getText("tagEmptyDatesMsg"), {
                    width: "25em"
                });
                this.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                    oResourceBundle.getText("tagCatalogEnableDataLoad"),
                    oResourceBundle.getText("tagEmptyDatesMsg"),
                    "Error");
            }
        },
        fnDateRangeSimpleClearDates: function () {
            sap.ui.getCore().byId("initial-load-date-time-from").setValue("");
            sap.ui.getCore().byId("initial-load-date-time-to").setValue("");
            sap.ui.getCore().byId("historical-upload-max-timeframe-archive").setValue("30");
        },
        fnEnableInitialDataLoadSubmit: function (action) {
            //var sProcessingText = oResourceBundle.getText("commonBackgroundProcessMessage");
            //oDialog.setText(sProcessingText);
            //this.showBusyIndicator();
            MessageBox.information(oResourceBundle.getText("commonBackgroundProcessMessageWithNotif"));
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/InitialLoad/Query/InitialLoadXacuteQuery&Content-Type=text/json",
                type: "POST",
                data: {
                    "Param.1": action,
                    "Param.2": sInitialLoadTagList,
                    "Param.3": sInitialLoadSelectedStartDate,
                    "Param.4": sInitialLoadSelectedEndDate,
	        "Param.5": iInitialLoadMaxTimeframe,
                    "Param.6": sInitialLoadUserLocal || "",
                    "Param.7": sInitialLoadEmail || ""
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                            oResourceBundle.getText("tagCatalogEnableDataLoad"),
                            sErrorMessage,
                            "Error");
                        //oDialog.close();
                    } else {
                        oTagCatalogController.hideBusyIndicator();
                    }
                },
                error: function () {
                }
            });
            oTagCatalogController.checkInitialLoadProgress();
        },

        fnCloseInitialLoadPopUp: function () {
            oTagCatalogController.oInitialLoadReportDialog.close();
            oTagCatalogController.getView().byId("table-tag-catalog").removeSelections(true);
            oTagCatalogController.fnLoadTagCatalog();
        },

        checkInitialLoadProgress: function () {
            this.iNbrNotifChecks = 0;
            iIntervalID = setInterval(function () {
                oTagCatalogController.checkInitialLoadProgressCallback();
            }, 30000);
        },

        checkInitialLoadProgressCallback: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/NotificationSystem/Query/NotificationTagHistoricalUploadSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": document.getElementById('input-username').value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
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
                            that.iNbrNotifChecks = that.iNbrNotifChecks + 1;
                        }
                        if (sDeliveredObjects.length > 0) {
                            that.deleteDeliveredNotifications("TAG_HISTORICAL_UPLOAD", sDeliveredObjects.substring(1), "commonTitleTagCatalog", iIntervalID, that.iNbrNotifChecks);
                        } else that.checkNotificationProccess(iIntervalID, that.iNbrNotifChecks);

                    }
                },
                error: function () {
                }
            });
        },


        fnExportToExcel: function (oEvent) {
            if (!this.oExportDigitalAppDialog || this.oExportDigitalAppDialog.bIsDestroyed) {
                this.oExportDigitalAppDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.TagCatalogDigitalAppsSelect", this);
                var sNone = oResourceBundle.getText("commonNone");
                sap.ui.getCore().byId("table-select-digital-app2")._getCancelButton().setText(sNone);
            }
            this.oExportDigitalAppDialog.setRememberSelections(false);
            this.getView().addDependent(this.oExportDigitalAppDialog);
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oExportDigitalAppDialog);
            this.oExportDigitalAppDialog.open();
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
                        oTagCatalogController.oModelDigitalAppsList.setData(data);
                        oTagCatalogController.oModelDigitalAppsList.refresh();
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
            var sSelectADigitalAppChange = oResourceBundle.getText("digitalAppsChange");
            var aContexts = oEvent.getParameter("selectedContexts");
            selectedDigitalApp = aContexts.map(function (oContext) {
                return oContext.getObject().ID_DIGITAL_APP;
            }).join(", ");
            oEvent.getSource().getBinding("items").filter([]);
            this.fnExportToExcelSubmit();
            this.oExportDigitalAppDialog.destroy();
        },

        fnDigitalAppSelectionNone: function (oEvent) {
            selectedDigitalApp = "";
            oEvent.getSource().getBinding("items").filter([]);
            this.fnExportToExcelSubmit();
            this.oExportDigitalAppDialog.destroy();
        },
				
		showSelectAllConfirmation: function (iTagCount) {
			var that = this;
			bPendingExport = true;
			MessageBox.confirm(
				"The applied filter(s) returned more than " + iTagCount + " tags.\n\nWould you like to apply the action to the selected tags only, or to all tags that match the filter?",
				{
					actions: ["Only Selected Tags", "All Filtered Tags"],
					emphasizedAction: "All Filtered Tags",
					onClose: function (oAction) {
						if (oAction === "All Filtered Tags") {
							bUserChoseAllFiltered = true;
						} else {
							bUserChoseAllFiltered = false;
						}

						if (bPendingExport) {
							that.fnExportToExcelSubmit();
							bPendingExport = false;
						}
					}
				}
			);
		},      

        fnExportToExcelSubmit: function () {
			var aFilteredTags = this.fnSelectedGetTagList();
			var aFilteredTagsArr = aFilteredTags.split(",");
			if (aFilteredTagsArr.length >= 100 && !bUserChoseAllFiltered && !bPendingExport) {
				this.showSelectAllConfirmation(aFilteredTagsArr.length);
				return;
			}

			var sSelectUpto150Tags = oResourceBundle.getText("tagCatalogSelectUpto150Tags");
			var sTagList = this.fnSelectedGetTagList();
			var sAll = "";
				selectedTagSource = "%";

			if (bUserChoseAllFiltered) {
				sTagList = "";
				sAll = "ALL";
				selectedTagSource = "%";
			} else {
				if (sTagList === "") {
					sAll = "ALL";
					selectedTagSource = oTagCatalogController.getView().byId("combobox-data-source").getSelectedKey();
				} else {
					var aTagArr = sTagList.split(",");
					if (aTagArr.length > 150) {
						this.handleMessage(
							oResourceBundle.getText("commonTitleTagCatalog"),
							oResourceBundle.getText("auditLogExportToExcel"),
							sSelectUpto150Tags,
							"Error"
						);
						return false;
					}
				}
			}
            oDialog.setText("Exporting CSV...");
            oTagCatalogController.showBusyIndicator();
			bUserChoseAllFiltered = false;
			bPendingExport = false;
			
            selectedPlant = oTagCatalogController.getView().byId("combobox-plant").getSelectedKey();
            //selectedTagSource = oTagCatalogController.getView().byId("combobox-data-source").getSelectedKey();
            inputOriginalTag = oTagCatalogController.getView().byId("input-original-tag").getValue();
            inputRenamedTag = oTagCatalogController.getView().byId("input-renamed-tag").getValue();
            flagRealTime = oTagCatalogController.getView().byId("combobox-real-time").getSelectedKey();
            flagArchive = oTagCatalogController.getView().byId("combobox-archive").getSelectedKey();
            OriginalTagFilterValue = inputOriginalTag.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');
            RenamedTagFilterValue = inputRenamedTag.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');
            SwitchHidden = this.getView().byId("switch-hidden").getState() ? 1 : 0;
            flagWatch = oTagCatalogController.getView().byId("combobox-watch").getSelectedKey();
            flagInitialLoad = oTagCatalogController.getView().byId("combobox-initial-load").getSelectedKey();
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogExcelExportSelectQuery&Content-Type=text/csv&RowCount=200000",
                data: {
                    "Param.1": selectedPlant,
                    "Param.2": selectedTagSource,
                    "Param.3": OriginalTagFilterValue,
                    "Param.4": RenamedTagFilterValue,
                    "Param.5": flagArchive,
                    "Param.6": flagRealTime,
                    "Param.7": sTagList.split(",").length ? "'" + sTagList.split(",").join("','") + "'" : "''",
                    "Param.8": sAll,
                    "Param.9": SwitchHidden,
                    "Param.10": flagWatch,
                    "Param.11": flagInitialLoad,
                    "Param.12": selectedDigitalApp,
                    "Param.20": document.getElementById("SE_Plant").value


                },
                success: function (result) {
                            var oAnchor = document.createElement("a");
                            var oFile = new Blob([result]);
                            var sFileType = "csv"
                            oAnchor.download = "Illuminator." + sFileType;
                            oAnchor.href = window.URL.createObjectURL(oFile);
                            oAnchor.click(); 
				oTagCatalogController.hideBusyIndicator();}
                            
            });
            
        },
        handleRemoveSelectedTag: function (oEvent) {
            var iToBeRemovedTagIndex = parseInt(oEvent.getParameter("listItem").getBindingContextPath().replace(/^\D+/g, ''));
            var sSelectedTagId = oEvent.getParameter("listItem").getAggregation("customData")[0].getValue();
            const iTagIndex = oTagCatalogController.oModelTagCatalog.getData().Row.findIndex((element) => element.ID_TAG === sSelectedTagId);
            if (iTagIndex > -1) {
                oTagCatalogController.oModelTagCatalog.getData().Row[iTagIndex].TAG_SELECTED = false;
                oTagCatalogController.oModelTagCatalog.refresh(true);


            }
            this.oModelSelectedTags.getData().splice(iToBeRemovedTagIndex, 1);
            this.oModelSelectedTags.refresh(true);
            oTagCatalogController.oModelTagCatalog.refresh(true);
            if (this.oModelSelectedTags.getData().length == 0) {
                oEvent.getSource().getParent().close();
            }
        },
        fnShowSelectedTags: function () {
            var oList = new sap.m.List({
                mode: "Delete",
                delete: this.handleRemoveSelectedTag.bind(this)
            });
            var oListItemTemplate = new sap.m.StandardListItem({
                title: "{DS_NAME_ORIGINAL}",
                description: "{PLANT} - {SOURCE_NAME}",
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
        fnLoadTagCatalog: function (iOffset = 0) {
            if (!initFinished) return false;
            if (typeof iOffset !== "number") iOffset = 0;
            var sTagsLoading = oResourceBundle.getText("tagCatalogLoadingText");
            oDialog.setText(sTagsLoading);
            if (iOffset == 0) this.showBusyIndicator();
            selectedPlant = oTagCatalogController.getView().byId("combobox-plant").getSelectedKey();
            if (selectedPlant == "") return false;
            selectedTagSource = oTagCatalogController.getView().byId("combobox-data-source").getSelectedKey();
            if (selectedTagSource == "") return false;
            inputOriginalTag = oTagCatalogController.getView().byId("input-original-tag").getValue();
            inputRenamedTag = oTagCatalogController.getView().byId("input-renamed-tag").getValue();
            flagRealTime = oTagCatalogController.getView().byId("combobox-real-time").getSelectedKey();
            flagArchive = oTagCatalogController.getView().byId("combobox-archive").getSelectedKey();
            OriginalTagFilterValue = inputOriginalTag.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');
            RenamedTagFilterValue = inputRenamedTag.replace(/ AND /gi, '.*').replace(/ and /gi, '.*').replace(/ OR /gi, '|').replace(/ or /gi, '|').replace(/ /gi, '.*');
            SwitchHidden = this.getView().byId("switch-hidden").getState() ? 1 : 0;
            flagWatch = oTagCatalogController.getView().byId("combobox-watch").getSelectedKey();
            flagInitialLoad = oTagCatalogController.getView().byId("combobox-initial-load").getSelectedKey();
            var Param1 = (selectedPlant != "%" ? "S.ID_PLANT LIKE '" + selectedPlant + "' AND" : "");
            var Param2 = (selectedTagSource != "%" ? "S.ID_SOURCE LIKE '" + selectedTagSource + "' AND" : "");
            var Param3 = (OriginalTagFilterValue != "" ? "(T.DS_NAME_ORIGINAL LIKE_REGEXPR '" + OriginalTagFilterValue + "' FLAG 'i') AND" : "");
            var Param4 = (RenamedTagFilterValue != "" ? "(loc.DS_NAME || '' || bld.DS_NAME || '-' || prm.DS_NAME || '-' || mnf.DS_NAME || '-' || sbf.DS_NAME || '.' || T.DS_NAME_RENAMED LIKE_REGEXPR '" + RenamedTagFilterValue + "' FLAG 'i') AND" : "");
            var Param5 = (flagArchive == "0" ? "M.ID_JOB IS NULL AND" : (flagArchive == "1" ? "M.ID_JOB IS NOT NULL AND" : ""));
            var Param6 = (flagRealTime == "0" ? "M.ID_AGENT IS NULL AND" : (flagRealTime == "1" ? "M.ID_AGENT IS NOT NULL AND D.ID_DESTINATION_TYPE = 'REST' AND" : ""));
            var Param7 = (SwitchHidden != "%" ? "(T.FL_HIDDEN = 0 OR T.FL_HIDDEN = '" + SwitchHidden + "') AND" : "");
            var Param8 = (flagWatch != "%" ? "(T.FL_WATCH_DATA_CAPTURE LIKE  '" + flagWatch + "') AND" : "");
            var Param9 = (flagInitialLoad == "1" ? "T2.ID_TAG IS NOT NULL AND" : (flagInitialLoad == "0" ? "T2.ID_TAG IS NULL AND" : ""));
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": Param1,
                    "Param.2": Param2,
                    "Param.3": Param3,
                    "Param.4": Param4,
                    "Param.5": Param5,
                    "Param.6": Param6,
                    "Param.7": Param7,
                    "Param.8": Param8,
                    "Param.9": Param9,
                    "Param.20": document.getElementById("SE_Plant").value,
                    "Param.30": iOffset,
                    "Param.31": this.sSortQuery
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        oTagCatalogController.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                            oResourceBundle.getText("tagCatalogLoadTagCatalog"),
                            result.Rowsets.FatalError,
                            "Error");
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        if (data && data.Row) {
                            data.Row.forEach(function (oElement) {
                                Object.assign(oElement, { TAG_SELECTED: false })
                            });
                        }
                        if (iOffset > 0) {
                            oTagCatalogController.oModelTagCatalog.getData().Row.push(...data.Row);
                        } else {
                            oTagCatalogController.oModelTagCatalog.setProperty("/Row", []);
                            oTagCatalogController.oModelTagCatalog.setData(data);
                        }
                        oTagCatalogController.getView().byId("table-tag-catalog").removeSelections(true);
                        oTagCatalogController.fnReSelectTags();
                        oTagCatalogController.oModelTagCatalog.refresh();


                        oTagCatalogController.hideBusyIndicator();

                    }
                }
            });
        },

        fnHideTags: function () {
            this.fnHideUnhideTags(1);
        },

        fnUnhideTags: function () {
            this.fnHideUnhideTags(0);
        },

        fnHideUnhideTags: function (hiddenFlag) {
            var sSelectATag = oResourceBundle.getText("tagCatalogSelectATag");
            var sProcessingText = oResourceBundle.getText("tagCatalogProcessing");
            var sTagList = this.fnSelectedGetTagList();
            if (sTagList == "") {
                //MessageToast.show(sSelectATag);
                this.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                    oResourceBundle.getText("tagCatalogHideUnhideTags"),
                    sSelectATag,
                    "Error");
                return false;
            }
            oDialog.setText(sProcessingText);
            this.showBusyIndicator();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagHideUnhideUpdateQuery&Content-Type=text/json",
                type: "POST",
                data: {
                    "Param.1": "'" + sTagList.split(",").join("','") + "'",
                    "Param.2": hiddenFlag
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var errorMsg = result.Rowsets.FatalError;
                        oDialog.close();
                        //MessageToast.show(errorMsg);
                        that.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                            oResourceBundle.getText("tagCatalogHideUnhideTags"),
                            errorMsg,
                            "Error");
                    } else {
                        oTagCatalogController.getView().byId("table-tag-catalog").removeSelections(true);
                        oTagCatalogController.fnLoadTagCatalog();
                    }
                },
                error: function () {

                }
            });
        },

        fnViewSettingsButtonPressed: function (oEvent) {
            var mViewSettings = [
                { text: "{i18n>RealtimeDestDefault}", key: "T.FL_WATCH_DATA_CAPTURE DESC,T2.ID_SOURCE DESC,T.ID_SOURCE ASC,T.DS_NAME_ORIGINAL", selected: true },
                { text: "{i18n>commonLabelPlant}", key: "PLANT" },
                { text: "{i18n>commonLabelDataSource}", key: "SOURCE_NAME" },
                { text: "{i18n>commonLabelOriginalTag}", key: "DS_NAME_ORIGINAL" },
                { text: "{i18n>tagCatalogPlantHierarchy}", key: "PLANT_HIERARCHY" },
                { text: "{i18n>commonLabelRenamedTag}", key: "DS_NAME_RENAMED" },
                { text: "{i18n>commonLabelRealtime}", key: "FLAG_REALTIME" },
                { text: "{i18n>commonLabelArchive}", key: "FLAG_ARCHIVE" },
                { text: "{i18n>tagCatalogConfigStatus}", key: "COLOR_STATUS" }
            ];
            if (!this.oSortDialog) {
                this.oSortDialog = new sap.m.ViewSettingsDialog({
                    title: "{i18n>tagCatalogSortTagCatalog}",
                    sortItems: mViewSettings.map(function (e) { return new sap.m.ViewSettingsItem(e) }),
                    confirm: function (oEvent) {
                        var mParams = oEvent.getParameters();
                        var sPath = mParams.sortItem.getKey();
                        var bDescending = mParams.sortDescending;
                        oTagCatalogController.sSortQuery = sPath + " " + (bDescending ? "DESC" : "ASC");

                        oTagCatalogController.fnLoadTagCatalog();
                    }
                });
                this.getView().addDependent(this.oSortDialog);
            }
            this.oSortDialog.open();
        },

        fnReloadTags: function () {
            this.fnLoadTagCatalog();

        },

        hideBusyIndicator: function () {
            oDialog.close();
        },

        showBusyIndicator: function () {
            oDialog.open();
        },
        fnReSelectTags: function () {
            var aSelectedTagsList = this.oModelSelectedTags.getData();
            var aOriginalTagsList = this.oModelTagCatalog.getData();
            if (aOriginalTagsList.Row != undefined) {
                for (var i = 0; i < aSelectedTagsList.length; i++) {
                    var iIndexOfSelectedTagInOriginalList = aOriginalTagsList.Row.findIndex((element) => element.ID_TAG === aSelectedTagsList[i].ID_TAG);
                    if (iIndexOfSelectedTagInOriginalList > -1) {
                        aOriginalTagsList.Row[iIndexOfSelectedTagInOriginalList].TAG_SELECTED = true;

                    }
                }
            }
            oTagCatalogController.oModelTagCatalog.refresh(true);

        },

        fnLoadDataSource: function () {
            var sSelectedPlant = oTagCatalogController.getView().byId("combobox-plant").getSelectedKey();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/SourceListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.1": sSelectedPlant,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
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
                        oTagCatalogController.oModelDataSource.setData(data);
                        oTagCatalogController.oModelDataSource.refresh();
                        oTagCatalogController.getView().byId("combobox-data-source").setSelectedKey("%");
                        oTagCatalogController.fnLoadTagCatalog();
                    }
                }
            });
        },
        fnGrowingStarted: function (oEvent) {
            var iOffset = oEvent.getParameter("total")
            if (oEvent.getParameter("reason") === "Growing" && (iOffset - oEvent.getParameter("actual")) <= 100) { // 100 is the growing threshold
                this.fnLoadTagCatalog(iOffset);
            }
        },
        fnValidateChangeComments: function () {
            var oChangeTracker = this.oModelChangeMessages.getData();
            if (oChangeTracker.Row.length != 1) {
                oChangeTracker.Row = [{
                    name: oResourceBundle.getText("commonAll"),
                    old: "---",
                    new: "Tag reset",
                    message: ""
                }]
            } else {
                if (oChangeTracker.Row[0].new != "") {
                    oChangeTracker.Row[0].new = "Tag reset";
                    oChangeTracker.Row[0].message = "";
                }
            }
            if (bShowCommentDialog) {
                this.fnChangeCommentDialog();
                return false;
            }
            var bValid = oChangeTracker.Row[0].message.length > 0 && oChangeTracker.Row[0].message.length < 255

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
                    var sComment;
                    aItems.forEach(e => {
                        var oInput = e.getCells()[3];
                        sComment = oInput.getValue();
                        if (oInput.getValue().length > 0 && oInput.getValue().length < 255) {
                            oInput.setValueState("None");
                            sComment = oInput.getValue();
                        } else {
                            oInput.setValueState("Error");
                            bValid = false;
                        }
                    });
                    if (bValid) {
                        MessageBox.confirm(oResourceBundle.getText("tagResetSecondConfirmation"), {
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: function (sAction) {
                                if (sAction == "YES") {
                                    oChangeCommentDialog.close();
                                    var ListTagsXML = '<?xml version="1.0" encoding="UTF-8"?><Tags>';
                                    for (var i = 0; i < oTagCatalogController.oModelSelectedTags.getData().length; i++) {
                                        var sTagId = oTagCatalogController.oModelSelectedTags.getData()[i].ID_TAG;
                                        var sTagName = oTagCatalogController.oModelSelectedTags.getData()[i].PLANT_HIERARCHY + "." + oTagCatalogController.oModelSelectedTags.getData()[i].DS_NAME_RENAMED;
                                        ListTagsXML += '<Tag><TagID>' + sTagId + '</TagID><TagName>' + sTagName + '</TagName></Tag>';
                                    }
                                    ListTagsXML += '</Tags>'

                                    oTagCatalogController.showBusyIndicator();
                                    $.ajax({
                                        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogResetTagsXacuteQuery&Content-Type=text/json",
                                        data: {
                                            "Param.1": ListTagsXML,
                                            "Param.2": sComment
                                        },
                                        type: "POST",
                                        success: function (result) {
                                            if (result.Rowsets.FatalError) {
                                                var sErrorMessage = result.Rowsets.FatalError;
                                                //MessageToast.show(sErrorMessage);
                                                that.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                                                    oResourceBundle.getText("tagCatalogResetTags"),
                                                    sErrorMessage,
                                                    "Error");
                                                oDialog.close();
                                            } else {
                                                oTagCatalogController.hideBusyIndicator();
                                                oDialog.close();
                                                oTagCatalogController.oModelSelectedTags.refresh(true);
                                                oTagCatalogController.oModelTagCatalog.refresh(true);
                                                var aMessages = result.Rowsets.Rowset[0].Row;
                                                var iTotalMessages = result.Rowsets.Rowset[0].Row ? result.Rowsets.Rowset[0].Row.length : 0;
                                                for (var m in aMessages) {
                                                    that.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                                                        oResourceBundle.getText("tagCatalogResetTags"),
                                                        aMessages[m].MessageText,
                                                        aMessages[m].MessageType);
                                                }
                                                if(oTagCatalogController.oModelSelectedTags.getData().length != iTotalMessages){
                                                    that.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                                                    oResourceBundle.getText("tagCatalogResetTags"),
                                                    oResourceBundle.getText("tagResetSuccessfulMessage"),
                                                    "Success");
                                                }                                               
                                                oTagCatalogController.fnLoadTagCatalog();
                                            }
                                        },
                                        error: function (err) {
                                            oDialog.close();
                                            oTagCatalogController.hideBusyIndicator();
                                            that.handleMessage(oResourceBundle.getText("commonTitleTagCatalog"),
                                                oResourceBundle.getText("tagCatalogResetTags"),
                                                oResourceBundle.getText("tagResetErrorMessage"),
                                                "Error");

                                        }
                                    });

                                }
                            }
                        });



                    } else {
                        MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
                        that.handleMessage(oResourceBundle.getText("commonTitleTagExcelUpload"),
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
        }
    });
});


//# sourceURL=https://sapdqnjc.pharma.aventis.com:50001/XMII/CM/StreamingEngine/StreamingEngine/controller/TagCatalog.controller.js?eval