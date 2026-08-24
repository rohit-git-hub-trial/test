/*-----------------------------------------------------------------------------------
Streaming Engine - Tag Information
Creation Date: 2020.05.28 / By: E0445955
Reference Document: 
Description:Displays the drilldown information of all the selected tag in the tag catalog screen
Option to edit the tag information is available
-------------------------------------------------------------------------------------*/
var oTagInformationController;
var sAction;
var sInputHierarchy1;
var sInputHierarchy2;
var sInputHierarchy3;
var sInputHierarchy4;
var sInputHierarchy5;
var sFinalHierarchy;
var arrayofHierarchyId;
var sInputRenamedTag1;
var sInputRenamedTag2;
var sInputRenamedTag3;
var sInputRenamedTag4;
var bSwitchRealTime;
var sComboBoxPCoDestination;
var bSwitchArchive;
var bSwitchWatch;
var sTagDescription;
var sTagUOM;
var sTagId;
var sTagName;
var sMIIDataServer;
var oDialog;
var oResourceBundle;
var sLastStartDate;
var sLastEndDate;
var sLastDuration;
var sLastDurationUnits;
var sPrevStartDate;
var sPrevEndDate;
var sPrevDuration;
var sPrevDurationUnits;
var sDescription;
var sUOM;
var iChartVisible;
var iWatchFeatureOn;
var sLimitCapture;
var sLimitVisualize;
var bStreamAfterWatch;
var bShowCommentDialog = true;
var sYesLabel;
var sNoLabel;
var bQualisteo;
/*****Below Variables are for Restore functionality******/
var oCurrentControl;
var sCurrentColumnName;
var iCurrentControlCount;
var arrCurrentItems;
var sCurrentLabel;
var sIDPlant;
var sTagCatalogTable = "SE_TAG";
/******************************************************/

sap.ui.define([
	"../controller/BaseController",
	"sap/m/MessageToast",
	"sap/m/Popover",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/MessageBox",
	"sap/m/Text",
	'sap/ui/model/Filter',
], function (BaseController, MessageToast, Popover, Button, Dialog, MessageBox, Text, Filter) {
	"use strict";

	return BaseController.extend("StreamingEngine.StreamingEngine.controller.TagInformation", {
		onInit: function () {

			// set message manager model
			var oMessageManager = sap.ui.getCore().getMessageManager();
			var oView = this.getView();
			oView.setModel(oMessageManager.getMessageModel(), "message");
			oMessageManager.registerObject(oView, true);

			oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			sYesLabel = oResourceBundle.getText("commonYes").toUpperCase();
			sNoLabel = oResourceBundle.getText("commonNo").toUpperCase();

			oTagInformationController = this;
			oDialog = this.getView().byId("BusyDialog");
			this.getView().byId("combobox-destination").setModel(this.oModelPCoDestination);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("TagInformation").attachPatternMatched(this._onObjectMatched, this);
			this.getView().byId("combobox-uom").setModel(this.oModelUOM);
			this.getView().byId("combo-hierarchy-1").setModel(this.oModelHierarchy_1);
			this.getView().byId("combo-hierarchy-2").setModel(this.oModelHierarchy_2);
			this.getView().byId("combo-hierarchy-3").setModel(this.oModelHierarchy_3);
			this.getView().byId("combo-hierarchy-4").setModel(this.oModelHierarchy_4);
			this.getView().byId("combo-hierarchy-5").setModel(this.oModelHierarchy_5);
			this.getView().setModel(this.oAppModel, "AppModel");

			this.fnLoadUOM();

			/********* Below Part for Viz Chart*************/
			var oVizFrame = this.getView().byId("idVizFrame");
			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: "Timestamp",
					value: "{DateTime}",
					dataType: "date"
				}],
				measures: [{
					name: "Tag",
					value: '{TAG}'
				}],
				data: {
					path: "/Row"
				}
			});
			oVizFrame.setDataset(oDataset);
			oVizFrame.setModel(oTagInformationController.oModelReport);
			oVizFrame.setVizType("timeseries_line");
			oVizFrame.setVizProperties({
				title: {
					text: "Trend Chart"
				},
				dataLabel: {
					visible: false
				},
				legend: {
					visible: false
				},
				plotArea: {
					adjustScale: true,
					window: {
						start: "firstDataPoint",
						end: "lastDataPoint"
					},
					marker: {
						visible: false
					}
				},
				timeAxis: {
					levels: ["second", "minute", "hour", "day", "month", "year"]
				},
				interaction: {
					selectability: {
						mode: "EXCLUSIVE"
					},
					zoom: {
						direction: 'timeAxis',
						enablement: 'enabled'
					}
				},
				valueAxis: {
					title: {
						visible: false
					}
				}
			});
			var feedvalueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
				'uid': "valueAxis",
				'type': "Measure",
				'values': ["Tag"]
			}),
				feedcategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "timeAxis",
					'type': "Dimension",
					'values': ["Timestamp"]
				});
			oVizFrame.addFeed(feedcategoryAxis);
			oVizFrame.addFeed(feedvalueAxis);
			/****************************************************/
			if (bRequireChangeComment) {
				this.oModelChangeMessages = new sap.ui.model.json.JSONModel({
					Row: [],
					fnUpdateNewValue: function (columnName, value) {
						var e;
						if (e = this.Row.find(e => e.columnName === columnName)) {
							if (e.old != value) {
								e.new = value;
							} else {
								e.new = null;
							}
						}
					}
				});
			}

		},
		oModelReport: new sap.ui.model.json.JSONModel(),
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
				this.getView().byId("page-tag-information").setVisible(true);
			}

			/***********************************************************************/

		},
		fnShowNoAccess: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("NoAccess");
		},
		
		oModelUOM: new sap.ui.model.json.JSONModel(),
		oModelHierarchy_1: new sap.ui.model.json.JSONModel(),
		oModelHierarchy_2: new sap.ui.model.json.JSONModel(),
		oModelHierarchy_3: new sap.ui.model.json.JSONModel(),
		oModelHierarchy_4: new sap.ui.model.json.JSONModel(),
		oModelHierarchy_5: new sap.ui.model.json.JSONModel(),
		oModelPCoDestination: new sap.ui.model.json.JSONModel(),
		oModelRestoreValue: new sap.ui.model.json.JSONModel(),
		oAppModel: new sap.ui.model.json.JSONModel(),

		_onObjectMatched: function (oEvent) {
			oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleTagInformation"));
			oDialog.setText("");
			oDialog.open();
			var sSourceName = decodeURIComponent(oEvent.getParameter("arguments").SOURCE_NAME);
			sTagName = decodeURIComponent(oEvent.getParameter("arguments").DS_NAME_ORIGINAL);
			var sRenamedTagName = decodeURIComponent(oEvent.getParameter("arguments").DS_NAME_RENAMED);
			var sHierarchy = decodeURIComponent(oEvent.getParameter("arguments").PLANT_HIERARCHY);
			var idHierarchy = decodeURIComponent(oEvent.getParameter("arguments").PLANT_HIERARCHY_ID);
			var sColorStatus = oEvent.getParameter("arguments").COLOR_STATUS;
			sDescription = decodeURIComponent(oEvent.getParameter("arguments").DS_DESCRIPTION);
			sUOM = decodeURIComponent(oEvent.getParameter("arguments").ID_UOM);
			var iRealtime = oEvent.getParameter("arguments").FLAG_REALTIME;
			var iArchive = oEvent.getParameter("arguments").FLAG_ARCHIVE;
			var sIDPcoDestination = oEvent.getParameter("arguments").ID_PCO_DESTINATION;
			sIDPlant = oEvent.getParameter("arguments").ID_PLANT;
			sMIIDataServer = oEvent.getParameter("arguments").DS_MII_DATA_SERVER_PROCESS;
			sTagId = oEvent.getParameter("arguments").ID_TAG;
			iChartVisible = oEvent.getParameter("arguments").FL_WATCH_VISUALIZATION;
			iWatchFeatureOn = oEvent.getParameter("arguments").FL_WATCH_DATA_CAPTURE;
			sLimitCapture = decodeURIComponent(oEvent.getParameter("arguments").LIMIT_CAPTURE);
			sLimitVisualize = decodeURIComponent(oEvent.getParameter("arguments").LIMIT_VISUALIZATION);
			bStreamAfterWatch = oEvent.getParameter("arguments").FL_SEND_DATA_AFTER_WATCH;
			bQualisteo = oEvent.getParameter("arguments").FL_ENERGY;

			if (bRequireChangeComment) {
				this.oModelChangeMessages.getData().Row = [
					{ columnName: "DS_DESCRIPTION", name: oResourceBundle.getText("tagInfoDesc"), old: sDescription, new: null, message: "" },
					{ columnName: "ID_UOM", name: oResourceBundle.getText("tagInfoUOM"), old: sUOM, new: null, message: "" },
					{ columnName: "ID_PLANT_HIERARCHY", name: oResourceBundle.getText("tagCatalogPlantHierarchy"), old: sHierarchy, new: null, message: "" },
					{ columnName: "DS_NAME_RENAMED", name: oResourceBundle.getText("commonLabelRenamedTag"), old: sRenamedTagName, new: null, message: "" },
					{ columnName: "FL_WATCH_DATA_CAPTURE", name: oResourceBundle.getText("tagInfoWatchLabel"), old: (iWatchFeatureOn == "1" ? sYesLabel : sNoLabel), new: null, message: "" },
					{ columnName: "FLAG_REALTIME", name: oResourceBundle.getText("commonLabelRealtime"), old: (iRealtime == "1" ? sYesLabel : sNoLabel), new: null, message: "" },
					{ columnName: "FLAG_ARCHIVE", name: oResourceBundle.getText("commonLabelArchive"), old: (iArchive == "1" ? sYesLabel : sNoLabel), new: null, message: "" }
				];
			}

			this.getView().byId("tagInfo-RestBtn").setEnabled(this.fnFormatRestBtn(sUOM, sRenamedTagName, sHierarchy));
			this.getView().byId("attribute-datasource").setText(sSourceName);
			this.getView().byId("tag-info-object-header").setTitle(sTagName);
			this.getView().byId("tag-info-hierarchy").setText(sHierarchy);
			this.getView().byId("attribute-renamed-tag").setText(sRenamedTagName);
			this.getView().byId("input-original-tag-name").setValue(sTagName);
			this.getView().byId("input-tag-id").setValue(sTagId);

			if (sDescription != "---" && sDescription != "" && sDescription != "NA") {
				this.getView().byId("input-description").setValue(sDescription);
			} else {
				this.getView().byId("input-description").setValue("");
			}
			if (sUOM != "---" && sUOM != "" && sUOM != "NA") {
				this.getView().byId("combobox-uom").setSelectedKey(sUOM);
			} else {
				this.getView().byId("combobox-uom").setSelectedKey("");
			}
			if (iRealtime == 1) {
				this.getView().byId("switch-realtime").setState(true);
				this.getView().byId("combobox-destination").setEnabled(true);
			} else {
				this.getView().byId("switch-realtime").setState(false);
				this.getView().byId("combobox-destination").setEnabled(false);
			}
			if (iArchive == 1) {
				this.getView().byId("switch-archive").setState(true);
			} else {
				this.getView().byId("switch-archive").setState(false);
			}
			if (sColorStatus == "red") {
				this.getView().byId("tag-info-status").setState("Error");
				this.getView().byId("tag-info-status").setIcon("sap-icon://error");

			} else if (sColorStatus == "yellow") {
				this.getView().byId("tag-info-status").setState("Warning");
				this.getView().byId("tag-info-status").setIcon("sap-icon://alert");
			} else if (sColorStatus == "green") {
				this.getView().byId("tag-info-status").setState("Success");
				this.getView().byId("tag-info-status").setIcon("sap-icon://color-fill");
			} else {
				this.getView().byId("tag-info-status").setState("None");
				this.getView().byId("tag-info-status").setIcon("sap-icon://activate");
			}
			if (sRenamedTagName != "---" && sRenamedTagName != "" && sRenamedTagName != "NA") {
				var arrayofRenamedTags = sRenamedTagName.split("-");
				this.getView().byId("input-renamed-tag-1").setValue(arrayofRenamedTags[0]);
				this.getView().byId("input-renamed-tag-2").setValue(arrayofRenamedTags[1]);
				this.getView().byId("input-renamed-tag-3").setValue(arrayofRenamedTags[2]);
				this.getView().byId("input-renamed-tag-4").setValue(arrayofRenamedTags[3]);
			} else {
				this.getView().byId("input-renamed-tag-1").setValue("");
				this.getView().byId("input-renamed-tag-2").setValue("");
				this.getView().byId("input-renamed-tag-3").setValue("");
				this.getView().byId("input-renamed-tag-4").setValue("");
			}
			if (iWatchFeatureOn == 1) {
				oTagInformationController.getView().byId("switch-watch").setState(true);
				this.getView().byId("switch-realtime").setEnabled(false);
				this.getView().byId("switch-archive").setEnabled(false);
			} else {
				oTagInformationController.getView().byId("switch-watch").setState(false);
				this.getView().byId("switch-realtime").setEnabled(true);
				this.getView().byId("switch-archive").setEnabled(true);
			}
			if (bStreamAfterWatch = bStreamAfterWatch == 1) {
				oTagInformationController.getView().byId("switch-stream-data").setState(true);
			} else {
				oTagInformationController.getView().byId("switch-stream-data").setState(false);
			}
			if (iChartVisible == 1) {
				oTagInformationController.fnShowAndLoadReport();
				var sStripMessagePart1 = "";
				var sStripMessagePart2 = "";
				sStripMessagePart2 = oResourceBundle.getText("tagInfoWatchVisualLimitMessage");
				sStripMessagePart2 = sStripMessagePart2 + " " + sLimitVisualize;
				oTagInformationController.getView().byId("switch-stream-data").setEnabled(false);
				if (iWatchFeatureOn == 1) {
					oTagInformationController.getView().byId("switch-stream-data").setEnabled(true);
					sStripMessagePart1 = oResourceBundle.getText("tagInfoWatchCaptureLimitMessage");
					sStripMessagePart1 = sStripMessagePart1 + " " + sLimitCapture + "\n";
				}
				var sStripMessage = sStripMessagePart1 + sStripMessagePart2;
				oTagInformationController.getView().byId("switch-stream-data").setVisible(true);
				oTagInformationController.getView().byId("message-chart-on").setVisible(true);
				oTagInformationController.getView().byId("message-chart-on").setText(sStripMessage);
			} else {
				oTagInformationController.getView().byId("switch-stream-data").setVisible(false);
				oTagInformationController.getView().byId("panel-chart-container").setVisible(false);
				oTagInformationController.getView().byId("message-chart-on").setVisible(false);
			}
			this.fnLoadPCoDestination(sIDPlant, sIDPcoDestination);
			this.fnGetTagRealTimeValue(sMIIDataServer, sTagName);
			this.fnSetAllErrorFree();

			arrayofHierarchyId = idHierarchy.split("-");
			this.fnLoadHierarchy(1, "loc", "");

			/*************************Restore Values*****************************/
			sTagCatalogTable = "SE_TAG";
			this.getView().byId("button-restore-description").setVisible(true);
			this.getView().byId("button-restore-renamed-tag").setVisible(true);
			this.getView().byId("button-restore-combo-hierarchy").setVisible(true);
			this.getView().byId("button-restore-uom").setVisible(true);
			oDialog.close();

			this.fnTagAllowEdit(sColorStatus);
		},
		fnTagAllowEdit: function (sColorStatus) {
			if (sColorStatus == "green") {
				var that = this;
				$.ajax({
					url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagAllowEditSelectQuery&Content-Type=text/json",
					data: {
						"Param.1": document.getElementById("input-username").value,
						"Param.2": sTagId
					},
					success: function (result) {
						if (result.Rowsets.FatalError) {
							that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
								"",
								result.Rowsets.FatalError,
								"Error");
						} else {
							var bEditAllowed;
							if (result.Rowsets.Rowset[0].Row) {
								bEditAllowed = false;
								var sMsgText = oResourceBundle.getText("userManagEditMsg");
								for(var a in result.Rowsets.Rowset[0].Row){
									sMsgText = sMsgText + result.Rowsets.Rowset[0].Row[a].ID_DIGITAL_APP + ", ";
								}
								that.byId("msg-strip-tag-edit").setText(sMsgText.substring(0, sMsgText.length - 2)); 
								//set Archive, Realtime and watch config switches non-editable
								oTagInformationController.getView().byId("switch-realtime").setEnabled(false);
								oTagInformationController.getView().byId("switch-archive").setEnabled(false);
								oTagInformationController.getView().byId("switch-watch").setEnabled(false);
								oTagInformationController.getView().byId("switch-stream-data").setEnabled(false);
							} else { 
								bEditAllowed = true;
								//set Archive, Realtime and watch config switches editable
								oTagInformationController.getView().byId("switch-realtime").setEnabled(true);
								oTagInformationController.getView().byId("switch-archive").setEnabled(true);
								oTagInformationController.getView().byId("switch-watch").setEnabled(true);
								oTagInformationController.getView().byId("switch-stream-data").setEnabled(true);
								// Qualisteo can only support Archvie (no real time, no watch)
								if (bQualisteo == 1) {
									oTagInformationController.byId("switch-realtime").setEnabled(false);
									oTagInformationController.byId("switch-watch").setEnabled(false);
									oTagInformationController.byId("switch-stream-data").setEnabled(false);
								}
							}
							oTagInformationController.oAppModel.setData({
								"Edit": bEditAllowed
							});
						}
					}
				});
			} else {
				//No apps assigned to the tag
				oTagInformationController.oAppModel.setData({
					"Edit": true
				});
				if (bQualisteo == 1) {
					oTagInformationController.byId("switch-realtime").setEnabled(false);
					oTagInformationController.byId("switch-watch").setEnabled(false);
					oTagInformationController.byId("switch-stream-data").setEnabled(false);
				}
			}

		},
		onOpenValueHelp: function () {

			var that = this;
    $.ajax({
        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogDescriptionFetchXacuteQuery&Content-Type=text/json",
        data: {
            "Param.1": sTagName,
	  "Param.2": sMIIDataServer
        },
        success: function (result) {
	    // --- 1) Show any messages returned by Xacute (handles array or object) ---
            var msgText = "";
            if (result && result.Rowsets && result.Rowsets.Messages) {
                var msgs = result.Rowsets.Messages;

                if (Array.isArray(msgs)) {
                    // Shape: Rowsets.Messages = [{ Message: "..." }, ...] or ["...", ...]
                    var parts = [];
                    for (var i = 0; i < msgs.length; i++) {
                        var entry = msgs[i];
                        if (entry) {
                            if (typeof entry === "string") {
                                parts.push(entry);
                            } else if (entry.Message) {
                                if (Array.isArray(entry.Message)) {
                                    for (var j = 0; j < entry.Message.length; j++) {
                                        if (entry.Message[j]) parts.push(String(entry.Message[j]));
                                    }
                                } else {
                                    parts.push(String(entry.Message));
                                }
                            }
                        }
                    }
                    msgText = parts.join("\n");
                } else if (msgs.Message) {
                    // Shape: Rowsets.Messages.Message = "..." or ["...", ...]
                    msgText = Array.isArray(msgs.Message) ? msgs.Message.join("\n") : String(msgs.Message);
                }
            }

            if (msgText) {
                that.handleMessage(
                    oResourceBundle.getText("commonTitleTagInformation"),
                    "Warning",
                    msgText,          // e.g., "No Data Returned"
                    "Error"     // keep consistent with message types
                );
               // return; // stop here, do not try to read description
            }

            // 2) Normal path: extract Description from Rowset[1]
              if (result.Rowsets && result.Rowsets.Rowset) {
                // Description is present in Rowset[1]
                var rs2 = result.Rowsets.Rowset[1];
                // Normalize to first row whether Row is an array or an object
                var row = rs2 && rs2.Row ? (Array.isArray(rs2.Row) ? rs2.Row[0] : rs2.Row) : null;

                // Safely read and trim Description
                sTagDescription = row && row.Description != null ? String(row.Description).trim() : "";

                // Update UI if available; else show popup when blank/NA
                if (sTagDescription && sTagDescription.toUpperCase() !== "NA") {
                    that.getView().byId("input-description").setValue(sTagDescription);
                } else {
                    sap.m.MessageBox.information("No description found. Please, enter it manually.",
                        { title: oResourceBundle.getText("commonTitleTagInformation") }
                    );
                }

                // (Optional) If backend added a status message, can surface it  to other places
                 var msg = result.Rowsets.Messages && result.Rowsets.Messages.Message;
                 if (msg) { that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"), "Warning", msg, "Error"); }
            } else if (result.Rowsets.FatalError) {
                var errorMsg = result.Rowsets.FatalError;
                that.handleMessage(
                    oResourceBundle.getText("commonTitleTagInformation"),
                    "Failed to fetch tag catalog description",
                    errorMsg,
                    "Error"
                );
            }
        },
        error: function (xhr, status, error) {
            that.handleMessage(
                oResourceBundle.getText("commonTitleTagInformation"),
                "AJAX call failed",
                error,
                "Error"
            );
        }
    });
		},
		/***************************Functions for Viz Chart********************************/
		fnSetChartTitle: function (sFromDate, sToDate, sDuration, sDurationUnits, bNewFilter) {
			var sDefaultTitle = "Trend Chart";
			if (sFromDate == "" && sToDate == "") {
				var sDurationUnitDetail;
				var sSelKey = sDuration + "-" + sDurationUnits;
				switch (sDurationUnits) {
					case "M":
						sDurationUnitDetail = "Minute(s)";
						break;
					case "H":
						sDurationUnitDetail = "Hour(s)";
						break;
					case "D":
						sDurationUnitDetail = "Day(s)";
				}
				sDefaultTitle = sDefaultTitle + " - " + sDuration + " " + sDurationUnitDetail;
				oTagInformationController.getView().byId("combobox-timerange").setSelectedKey("");
				oTagInformationController.getView().byId("combobox-timerange").setSelectedKey(sSelKey);
				this.getView().byId("idVizFrame").setVizProperties({
					title: {
						text: sDefaultTitle
					}
				});
			} else if (sDuration == "" && sDurationUnits == "") {
				oTagInformationController.getView().byId("combobox-timerange").setSelectedKey("");
				sDefaultTitle = sDefaultTitle + " - " + sFromDate + " to " + sToDate;
				this.getView().byId("idVizFrame").setVizProperties({
					title: {
						text: sDefaultTitle
					}
				});
			}
		},
		fnLoadReport: function (sFromDate, sToDate, sDuration, sDurationUnits, bNewFilter) {
			this.fnSetChartTitle(sFromDate, sToDate, sDuration, sDurationUnits, bNewFilter);
			if (bNewFilter) {
				sPrevStartDate = sLastStartDate;
				sPrevEndDate = sLastEndDate;
				sPrevDuration = sLastDuration;
				sPrevDurationUnits = sLastDurationUnits;
			}
			sLastStartDate = sFromDate;
			sLastEndDate = sToDate;
			sLastDuration = sDuration;
			sLastDurationUnits = sDurationUnits;
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagWatch/Query/TagHistoryXacuteQuery&Content-Type=text/json",
				data: {
					"Param.1": sTagId,
					"Param.2": sDuration,
					"Param.3": sDurationUnits,
					"Param.4": sFromDate,
					"Param.5": sToDate
				},
				success: function (result) {
					if (result.Rowsets.FatalError) {
						//MessageToast.show(result.Rowsets.FatalError);
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoLoadTagHistory"),
							result.Rowsets.FatalError,
							"Error");
					} else {
						var data = result.Rowsets.Rowset[0];
						oTagInformationController.oModelReport.setData(data);
						oTagInformationController.oModelReport.refresh();
						oTagInformationController.fnAutoRefreshFunction();
					}
				}
			});
		},
		fnExportCSV: function () {
			var url =
				"/XMII/Illuminator?QueryTemplate=StreamingEngine/TagWatch/Query/TagHistoryXacuteQuery&Content-Type=text/csv&Param.2=" +
				sLastDuration +
				"&Param.3=" + sLastDurationUnits + "&Param.4=" + sLastStartDate + "&Param.5=" + sLastEndDate + "&Param.1=" +
				sTagId;
			var url_encoded = encodeURI(url);
			window.open(url_encoded, "_blank");
		},
		fnAutoRefreshFunction: function () {
			var bRefreshEnabled = this.getView().byId("checkbox-auto-refresh").getSelected();
			if (bRefreshEnabled) {
				//this.getView().byId("input-refresh-seconds").setEnabled(true);
				var sRefreshSeconds = 5;
				var sRefreshRate = sRefreshSeconds * 1000;
				setTimeout(function () {
					oTagInformationController.fnLoadReport(sLastStartDate, sLastEndDate, sLastDuration, sLastDurationUnits, false);
				}, sRefreshRate);
			} else {

			}
		},
		fnRefreshChart: function () {
			oTagInformationController.fnLoadReport(sLastStartDate, sLastEndDate, sLastDuration, sLastDurationUnits, false);
		},
		fnRollBackFilters: function () {
			oTagInformationController.fnLoadReport(sPrevStartDate, sPrevEndDate, sPrevDuration, sPrevDurationUnits, true);
		},
		fnQuickLoadReport: function () {
			var sTimeRange = this.getView().byId("combobox-timerange").getSelectedKey();
			var arrTimeRangeString = sTimeRange.split("-");
			var sDuration = arrTimeRangeString[0];
			var sDurationUnits = arrTimeRangeString[1];
			oTagInformationController.fnLoadReport("", "", sDuration, sDurationUnits, true);
		},
		fnDateRangePopUp: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.DateRangeSelect", this);
			}
			this._oDialog.open();
			oTagInformationController.fnInitPopup();
		},
		fnInitPopup: function () {
			var sTimeRange = this.getView().byId("combobox-timerange").getSelectedKey();
			var arrTimeRangeString = sTimeRange.split("-");
			var sDuration = arrTimeRangeString[0];
			var sDurationUnits = arrTimeRangeString[1];
			sap.ui.getCore().byId("input-duration").setValue(sDuration);
			if (sDurationUnits == "M") {
				sap.ui.getCore().byId("radiogroup-duration-units").setSelectedIndex(0);
			} else if (sDurationUnits == "H") {
				sap.ui.getCore().byId("radiogroup-duration-units").setSelectedIndex(1);
			} else if (sDurationUnits == "D") {
				sap.ui.getCore().byId("radiogroup-duration-units").setSelectedIndex(2);
			}

			var sDateTimeNow = new Date();
			sap.ui.getCore().byId("date-time-from").setMaxDate(sDateTimeNow);
			sap.ui.getCore().byId("date-time-to").setMaxDate(sDateTimeNow);
		},
		fnClosePopOver: function () {
			this._oDialog.close();
		},
		fnFromDateChanged: function () {
			var sFromDate = sap.ui.getCore().byId("date-time-from").getDateValue();
			sap.ui.getCore().byId("date-time-to").setMinDate(sFromDate);
		},
		fnApplyDateRange: function () {
			var sFromDate = sap.ui.getCore().byId("date-time-from").getValue();
			var sToDate = sap.ui.getCore().byId("date-time-to").getValue();
			if (sFromDate != "" && sToDate != "") {
				oTagInformationController.fnLoadReport(sFromDate, sToDate, "", "", true);
				this._oDialog.close();
				oTagInformationController.getView().byId("combobox-timerange").setSelectedKey("");
			} else if (sFromDate != "" || sToDate != "") {

			} else {
				var sDuration = sap.ui.getCore().byId("input-duration").getValue();
				var sDurationUnitsIndex = sap.ui.getCore().byId("radiogroup-duration-units").getSelectedIndex();
				var sDurationUnits = "";
				switch (sDurationUnitsIndex) {
					case 0:
						sDurationUnits = "M";
						break;
					case 1:
						sDurationUnits = "H";
						break;
					case 2:
						sDurationUnits = "D";
				}
				if (sDuration != "" && sDurationUnits != "") {
					oTagInformationController.fnLoadReport("", "", sDuration, sDurationUnits);
					this._oDialog.close();
				} else {
					var oMsgDateRange = oResourceBundle.getText("tagInfoDateRange");
					MessageToast.show(oMsgDateRange);
					this.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
						oMsgDateRange,
						"",
						"Error");
				}
			}
		},
		fnClearDates: function () {
			sap.ui.getCore().byId("date-time-from").setValue("");
			sap.ui.getCore().byId("date-time-to").setValue("");
		},
		fnChartSelected: function (oEvent) {
			var arrSelectedData = oEvent.getSource().vizSelection();
			var iSelectedDataPoints = arrSelectedData.length;
			var i;
			var j;
			var dates = [];
			if (iSelectedDataPoints > 1) {
				for (i = 0; i < arrSelectedData.length; i++) {
					dates.push(arrSelectedData[i].data.Timestamp);
				}
				var minIdx = 0,
					maxIdx = 0;
				for (j = 0; j < dates.length; j++) {
					if (dates[j] > dates[maxIdx]) maxIdx = j;
					if (dates[j] < dates[minIdx]) minIdx = j;
				}
				oTagInformationController.fnLoadReport(dates[minIdx], dates[maxIdx], "", "", true);
			}
		},
		fnShowAndLoadReport: function () {
			this.getView().byId("panel-chart-container").setVisible(true);
			oTagInformationController.fnQuickLoadReport();

		},
		/*******************************End of Functions for Viz Chart*************************/

		/********************************Watch Feature Function Start*************************/

		fnWatchStateChanged: function () {
			var sConfirmTitle = oResourceBundle.getText("commonConfirm");
			var sConfirmYes = oResourceBundle.getText("commonYes");
			var sConfirmNo = oResourceBundle.getText("commonNo");
			var sConfirmMessage = oResourceBundle.getText("tagInfoWatchConfirmation");
			var sConfirmMessageDisable = oResourceBundle.getText("tagInfoWatchConfirmationDisable");

			var bChangedState = this.getView().byId("switch-watch").getState();
			if (bChangedState) {
				var dialog = new Dialog({
					title: sConfirmTitle,
					type: 'Message',
					content: new Text({
						text: sConfirmMessage
					}),
					beginButton: new Button({
						text: sConfirmYes,
						press: function () {
							oTagInformationController.fnEnableWatchFeature();
							dialog.close();
						}
					}),
					endButton: new Button({
						text: sConfirmNo,
						press: function () {
							oTagInformationController.getView().byId("switch-watch").setState(false);
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});

				dialog.open();
			} else {
				var dialog2 = new Dialog({
					title: sConfirmTitle,
					type: 'Message',
					content: new Text({
						text: sConfirmMessageDisable
					}),
					beginButton: new Button({
						text: sConfirmYes,
						press: function () {
							oTagInformationController.fnDisableWatchFeature();
							dialog2.close();
						}
					}),
					endButton: new Button({
						text: sConfirmNo,
						press: function () {
							oTagInformationController.getView().byId("switch-watch").setState(true);
							dialog2.close();
						}
					}),
					afterClose: function () {
						dialog2.destroy();
					}
				});

				dialog2.open();
			}

		},
		fnEnableWatchFeature: function () {

			this.fnSaveTagInformationAfterWatch(true);
		},
		fnDisableWatchFeature: function () {

			this.fnSaveTagInformationAfterWatch(false);
		},
		fnSaveTagInformationAfterWatch: function (bWatchCapture) {
			var sSaveWaitMessage = oResourceBundle.getText("tagInfoSaveWaitMessage");
			bSwitchWatch = this.getView().byId("switch-watch").getState();
			sAction = "UPDATE";
			oDialog.open();
			oDialog.setText(sSaveWaitMessage);
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogXacuteQuery&Content-Type=text/json",
				data: {
					"Param.1": sAction,
					"Param.2": sTagId,
					"Param.3": "",
					"Param.4": "",
					"Param.5": "",
					"Param.6": false,
					"Param.7": false,
					"Param.8": "",
					"Param.9": "",
					"Param.10": "",
					"Param.11": bSwitchWatch,
					"Param.12": true
				},
				success: function (result) {
					if (result.Rowsets.Rowset) {
						var data = result.Rowsets.Rowset[0];
						var successMsg = data.Row[0].Output;
						if (successMsg == "{##SUCCESS_MESSAGE}") {
							successMsg = oResourceBundle.getText("tagInfoSuccessSave");
							if (bWatchCapture) {
								oTagInformationController.getView().byId("switch-realtime").setState(false);
								oTagInformationController.getView().byId("switch-archive").setState(false);
								oTagInformationController.getView().byId("switch-realtime").setEnabled(false);
								oTagInformationController.getView().byId("switch-archive").setEnabled(false);
								oTagInformationController.getView().byId("switch-stream-data").setEnabled(true);
								oTagInformationController.fnShowAndLoadReport();
								oTagInformationController.fnRealtimeSwitched();
							}
							else {
								oTagInformationController.getView().byId("switch-realtime").setEnabled(true);
								oTagInformationController.getView().byId("switch-archive").setEnabled(true);
								oTagInformationController.getView().byId("switch-stream-data").setEnabled(false);
								$.ajax({
									url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogByIDSelectQuery&Content-Type=text/json",
									data: {
										"Param.1": sTagId
									},
									success: function (result) {
										if (result.Rowsets.Rowset) {
											var data = result.Rowsets.Rowset[0].Row[0];
											oTagInformationController.getView().byId("switch-realtime").setState(data.FL_REALTIME == 1);
											oTagInformationController.getView().byId("switch-archive").setState(data.FL_ARCHIVE == 1);
											oTagInformationController.fnRealtimeSwitched();
										}
									}
								});
							}
						}
						oDialog.close();
						//MessageToast.show(successMsg);
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoSaveTagInfo"),
							successMsg,
							"Success");
						oTagInformationController.getView().byId("switch-stream-data").setVisible(true);
						oTagInformationController.fnGetTimestamps(bWatchCapture);
					} else if (result.Rowsets.FatalError) {
						oTagInformationController.getView().byId("switch-watch").setState(false);
						var errorMsg = result.Rowsets.FatalError;
						oDialog.close();
						//MessageToast.show(errorMsg);
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoSaveTagInfo"),
							errorMsg,
							"Error");
					}
				}
			});
		},

		fnGetTimestamps: function (bWatchCapture) {
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagWatch/Query/TagWatchStatusSelectQuery&Content-Type=text/json",
				data: {
					"Param.1": sTagId
				},
				success: function (result) {
					if (result.Rowsets.Rowset) {
						var data = result.Rowsets.Rowset[0];
						var sLimitCaptureN = data.Row[0].LIMIT_CAPTURE;
						var sLimitVisualizeN = data.Row[0].LIMIT_VISUALIZATION;
						var sStripMessagePart1 = "";
						var sStripMessagePart2 = "";
						sStripMessagePart2 = oResourceBundle.getText("tagInfoWatchVisualLimitMessage");
						sStripMessagePart2 = sStripMessagePart2 + " " + sLimitVisualizeN;
						if (bWatchCapture) {
							sStripMessagePart1 = oResourceBundle.getText("tagInfoWatchCaptureLimitMessage");
							sStripMessagePart1 = sStripMessagePart1 + " " + sLimitCaptureN + "\n";
						}
						var sStripMessage = sStripMessagePart1 + sStripMessagePart2;
						oTagInformationController.getView().byId("message-chart-on").setVisible(true);
						oTagInformationController.getView().byId("message-chart-on").setText(sStripMessage);
						//MessageToast.show(sLimitCaptureN+","+sLimitVisualizeN);
					} else if (result.Rowsets.FatalError) {
						var errorMsg = result.Rowsets.FatalError;
						//MessageToast.show(errorMsg);
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoTagWatchStatus"),
							errorMsg,
							"Error");
					}
				}
			});
		},

		fnStreamStateChanged: function (oEvent) {
			var sConfirmTitle = oResourceBundle.getText("commonConfirm");
			var sConfirmYes = oResourceBundle.getText("commonYes");
			var sConfirmNo = oResourceBundle.getText("commonNo");
			var sConfirmMessage = oResourceBundle.getText("tagInfoStreamAfterWatchConfirmation");
			var sConfirmMessageDisable = oResourceBundle.getText("tagInfoStreamAfterWatchConfirmationDisable");

			var bChangedState = this.getView().byId("switch-stream-data").getState();
			var dialog = new Dialog({
				title: sConfirmTitle,
				type: 'Message',
				content: new Text({
					text: bChangedState ? sConfirmMessage : sConfirmMessageDisable
				}),
				beginButton: new Button({
					text: sConfirmYes,
					press: function () {
						dialog.setBusy(true);
						$.ajax({
							url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogStreamDataAfterWatch&Content-Type=text/json",
							data: {
								"Param.1": bChangedState ? "ENABLE" : "DISABLE",
								"Param.2": sTagId
							},
							success: function (result) {
								if (result.Rowsets.Messages) {
									oTagInformationController.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
										oResourceBundle.getText("tagInfoSaveTagInfo"),
										oResourceBundle.getText("tagInfoSuccessSave"),
										"Success");
								} else if (result.Rowsets.FatalError) {
									var errorMsg = result.Rowsets.FatalError;
									oTagInformationController.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
										oResourceBundle.getText("tagInfoSaveTagInfo"),
										errorMsg,
										"Error");
									oTagInformationController.getView().byId("switch-stream-data").setState(!bChangedState);
								}
							},
							complete: function () {
								dialog.close();
							}
						});
					}
				}),
				endButton: new Button({
					text: sConfirmNo,
					press: function () {
						oTagInformationController.getView().byId("switch-stream-data").setState(!bChangedState);
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},
		/*******************************Watch Feature Function End*************************/

		fnLoadUOM: function () {
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/UOMListSelectQuery&Content-Type=text/json",
				data: {

				},
				success: function (result) {
					if (result.Rowsets.FatalError !== undefined) {
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoLoadUoM"),
							result.Rowsets.FatalError,
							"Error");
					} else {
						var data = result.Rowsets.Rowset[0];
						oTagInformationController.oModelUOM.setSizeLimit(1000);
						oTagInformationController.oModelUOM.setData(data);
						oTagInformationController.oModelUOM.refresh();
					}
				}
			});
		},

		fnLoadHierarchy: function (level, type, filter) {
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PlantHierarchy/Query/PlantHierarchySelectQuery&Content-Type=text/json",
				data: {
					"Param.1": type,
					"Param.2": filter,
					"Param.3": sIDPlant
				},
				success: function (result) {
					if (result.Rowsets.FatalError !== undefined) {
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoLoadPlantHierarchy"),
							result.Rowsets.FatalError,
							"Error");
					} else {
						var data = result.Rowsets.Rowset[0];
						eval("oTagInformationController.oModelHierarchy_" + level + ".setData(data)");
						eval("oTagInformationController.oModelHierarchy_" + level + ".refresh()");
						oTagInformationController.getView().byId("combo-hierarchy-" + level).setSelectedKey("");
						if (arrayofHierarchyId[level - 1] != "" && arrayofHierarchyId[level - 1] != "NA" && arrayofHierarchyId[level - 1] != undefined) {
							oTagInformationController.getView().byId("combo-hierarchy-" + level).setSelectedKey(arrayofHierarchyId[level - 1]);
						}
						else {
							if (level == 1) {
								try {
									var comboBox = oTagInformationController.getView().byId("combo-hierarchy-" + level);
									var comboBoxItems = comboBox.getItems();
									comboBox.setSelectedItem(comboBoxItems[0]);
								} catch (err) { };
							}
						}
						try {
							eval("oTagInformationController.changeHier_" + level + "()");
						} catch (err) { };
						if (level == 5) arrayofHierarchyId = "";
					}
				}
			});
		},

		changeHier_1: function () {
			this.fnLoadHierarchy(2, 'bld', this.getView().byId("combo-hierarchy-1").getSelectedKey());
		},

		changeHier_2: function () {
			this.fnLoadHierarchy(3, 'prm', this.getView().byId("combo-hierarchy-2").getSelectedKey());
		},

		changeHier_3: function () {
			this.fnLoadHierarchy(4, 'mnf', this.getView().byId("combo-hierarchy-3").getSelectedKey());
		},

		changeHier_4: function () {
			this.fnLoadHierarchy(5, 'sbf', this.getView().byId("combo-hierarchy-4").getSelectedKey());
		},


		fnLoadPCoDestination: function (selectedPlant, sIDPcoDestination) {
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PCoDestinationListSelectQuery&Content-Type=text/json",
				data: {
					"Param.1": selectedPlant
				},
				success: function (result) {
					if (result.Rowsets.FatalError !== undefined) {
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoLoadPcoDestination"),
							result.Rowsets.FatalError,
							"Error");
					} else {
						var data = result.Rowsets.Rowset[0];
						var sDefaultDestinationKey = "---";
						oTagInformationController.getView().byId("combobox-destination").setSelectedItem("");
						oTagInformationController.getView().byId("combobox-destination").setSelectedKey("");
						try {
							sDefaultDestinationKey = data.Row[0].ID_PCO_DESTINATION;
						} catch (err) { }
						oTagInformationController.oModelPCoDestination.setData(data);
						oTagInformationController.oModelPCoDestination.refresh();
						if (sIDPcoDestination != "---" && sIDPcoDestination != "NA") {
							oTagInformationController.getView().byId("combobox-destination").setSelectedKey(sIDPcoDestination);
							if (bRequireChangeComment) {
								oTagInformationController.oModelChangeMessages.getData().Row.push({
									columnName: "ID_PCO_DESTINATION",
									name: oResourceBundle.getText("tagInfoDestination"),
									old: oTagInformationController.getView().byId("combobox-destination").getValue(),
									new: null,
									message: ""
								});
							}
						} else {
							oTagInformationController.getView().byId("combobox-destination").setSelectedKey(sDefaultDestinationKey);
							if (bRequireChangeComment) {
								oTagInformationController.oModelChangeMessages.getData().Row.push({
									columnName: "ID_PCO_DESTINATION",
									name: oResourceBundle.getText("tagInfoDestination"),
									old: 'NA',
									new: null,
									message: ""
								});
							}
						}
					}
				}
			});
		},
		fnRealtimeSwitched: function () {
			var bRealtimeStatus = this.getView().byId("switch-realtime").getState();
			if (bRealtimeStatus) {
				this.getView().byId("combobox-destination").setEnabled(true);

			} else {
				this.getView().byId("combobox-destination").setEnabled(false);
			}
		},

		fnGetTagRealTimeValue: function (sDataServer, sTag) {
			oTagInformationController.getView().byId("tag-last-value").setValue("");
			var that = this;
			$.ajax({
				url: "/XMII/Runner?Content-Type=text/json",
				data: {
					Transaction: "StreamingEngine/TagCatalog/Transaction/TagValueTransaction",
					DataServer: sDataServer,
					TagName: sTag,
					OutputParameter: "OutputJSON"
				},
				success: function (result) {
					if (result.Rowsets) {
						if (result.Rowsets.Messages) {
							var msg = result.Rowsets.Messages.Message;
							that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
								oResourceBundle.getText("tagInfoGetTagRealTimeValue"),
								msg,
								"Error");
						} else if (result.Rowsets.Rowset) {
							var data = result.Rowsets.Rowset[0];
							var sDateTime = data.Row[0].DateTime;
							var sTagValue = data.Row[0].TAG_VALUE;
							var sTagValueWithTimestamp = "[" + sDateTime + "] " + sTagValue;
							oTagInformationController.getView().byId("tag-last-value").setValue(sTagValueWithTimestamp);
						}

					} else if (result.Rowsets.FatalError) {
						var msg = result.Rowsets.FatalError;
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoGetTagRealTimeValue"),
							msg,
							"Error");
					}
				},
				error: function (oError) {
					var xmlDoc;
					if (window.DOMParser) {
						var oParser = new DOMParser();
						xmlDoc = oParser.parseFromString(oError.responseText, "text/xml");
					}
					else // Internet Explorer
					{
						xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
						xmlDoc.async = false;
						xmlDoc.loadXML(oError.responseText);
					}
					var msg = xmlDoc.getElementsByTagName('FatalError')[0].textContent;
					that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
						oResourceBundle.getText("tagInfoGetTagRealTimeValue"),
						msg,
						"Error");
				}
			});
			/*var oModelTest = new sap.ui.model.json.JSONModel();
			var sURL = "/XMII/Runner?Transaction=StreamingEngine/TagCatalog/Transaction/TagValueTransaction&OutputParameter=Output&Content-Type=text/xml";
			oModelTest.loadData(sURL);
			oModelTest.attachRequestCompleted(function (oRequest) {
				var oDa = 1 ;
			});*/
		},
		fnValidateInputs: function () {
			var bValidInputs = true;
			sInputHierarchy1 = this.getView().byId("combo-hierarchy-1").getSelectedKey();
			sInputHierarchy2 = this.getView().byId("combo-hierarchy-2").getSelectedKey();
			sInputHierarchy3 = this.getView().byId("combo-hierarchy-3").getSelectedKey();
			sInputHierarchy4 = this.getView().byId("combo-hierarchy-4").getSelectedKey();
			sInputHierarchy5 = this.getView().byId("combo-hierarchy-5").getSelectedKey();
			sInputRenamedTag1 = this.getView().byId("input-renamed-tag-1").getValue();
			sInputRenamedTag2 = this.getView().byId("input-renamed-tag-2").getValue();
			sInputRenamedTag3 = this.getView().byId("input-renamed-tag-3").getValue();
			sInputRenamedTag4 = this.getView().byId("input-renamed-tag-4").getValue();
			bSwitchRealTime = this.getView().byId("switch-realtime").getState();
			sComboBoxPCoDestination = this.getView().byId("combobox-destination").getSelectedKey();
			bSwitchArchive = this.getView().byId("switch-archive").getState();
			bSwitchWatch = this.getView().byId("switch-watch").getState();
			sTagDescription = this.getView().byId("input-description").getValue();
			sTagUOM = this.getView().byId("combobox-uom").getSelectedKey();

			if (bSwitchRealTime) {
				if (sComboBoxPCoDestination == "") {
					bValidInputs = false;
					this.getView().byId("combobox-destination").setValueState("Error");
				} else {
					this.getView().byId("combobox-destination").setValueState("None");
				}
			} else {
				sComboBoxPCoDestination = "";
				this.getView().byId("combobox-destination").setValueState("None");
			}

			if (sInputHierarchy1.length <= 0) {
				bValidInputs = false;
				this.getView().byId("combo-hierarchy-1").setValueState("Error");
			} else {
				this.getView().byId("combo-hierarchy-1").setValueState("None");
				sFinalHierarchy = this.getView().byId("combo-hierarchy-1").getValue();
			}
			if (sInputHierarchy2.length <= 0) {
				bValidInputs = false;
				this.getView().byId("combo-hierarchy-2").setValueState("Error");
			} else {
				sFinalHierarchy += this.getView().byId("combo-hierarchy-2").getValue();
				this.getView().byId("combo-hierarchy-2").setValueState("None");
			}
			if (sInputHierarchy3.length <= 0) {
				bValidInputs = false;
				this.getView().byId("combo-hierarchy-3").setValueState("Error");
			} else {
				sFinalHierarchy += "-" + this.getView().byId("combo-hierarchy-3").getValue();
				this.getView().byId("combo-hierarchy-3").setValueState("None");
			}
			if (sInputHierarchy4.length <= 0) {
				bValidInputs = false;
				this.getView().byId("combo-hierarchy-4").setValueState("Error");
			} else {
				sFinalHierarchy += "-" + this.getView().byId("combo-hierarchy-4").getValue();
				this.getView().byId("combo-hierarchy-4").setValueState("None");
			}
			if (sInputHierarchy5.length <= 0) {
				bValidInputs = false;
				this.getView().byId("combo-hierarchy-5").setValueState("Error");
			} else {
				sFinalHierarchy += "-" + this.getView().byId("combo-hierarchy-5").getValue();
				this.getView().byId("combo-hierarchy-5").setValueState("None");
			}

			if (sInputRenamedTag1.length < 3) {
				bValidInputs = false;
				this.getView().byId("input-renamed-tag-1").setValueState("Error");
			} else {
				this.getView().byId("input-renamed-tag-1").setValueState("None");
			}

			if (sInputRenamedTag2.length < 3) {
				bValidInputs = false;
				this.getView().byId("input-renamed-tag-2").setValueState("Error");
			} else {
				this.getView().byId("input-renamed-tag-2").setValueState("None");
			}

			if (sInputRenamedTag3.length < 3) {
				bValidInputs = false;
				this.getView().byId("input-renamed-tag-3").setValueState("Error");
			} else {
				this.getView().byId("input-renamed-tag-3").setValueState("None");
			}

			if (sInputRenamedTag4.length < 3) {
				bValidInputs = false;
				this.getView().byId("input-renamed-tag-4").setValueState("Error");
			} else {
				this.getView().byId("input-renamed-tag-4").setValueState("None");
			}

			if (sTagUOM == "") {
				bValidInputs = false;
				this.getView().byId("combobox-uom").setValueState("Error");
			} else {
				this.getView().byId("combobox-uom").setValueState("None");
			}

			return bValidInputs;

		},

		fnSetAllErrorFree: function () {
			this.getView().byId("combobox-destination").setValueState("None");
			this.getView().byId("combobox-uom").setValueState("None");
			this.getView().byId("input-renamed-tag-1").setValueState("None");
			this.getView().byId("input-renamed-tag-2").setValueState("None");
			this.getView().byId("input-renamed-tag-3").setValueState("None");
			this.getView().byId("input-renamed-tag-4").setValueState("None");
			this.getView().byId("combo-hierarchy-1").setValueState("None");
			this.getView().byId("combo-hierarchy-2").setValueState("None");
			this.getView().byId("combo-hierarchy-3").setValueState("None");
			this.getView().byId("combo-hierarchy-4").setValueState("None");
			this.getView().byId("combo-hierarchy-5").setValueState("None");
		},
		fnSaveTagInformation: function () {
			var sSaveWaitMessage = oResourceBundle.getText("tagInfoSaveWaitMessage");
			sAction = "UPDATE";
			var bIsValid = this.fnValidateInputs();
			if (bIsValid) {
				var validFullTagName = false;
				var sRenamedTag = sInputRenamedTag1 + "-" + sInputRenamedTag2 + "-" + sInputRenamedTag3 + "-" + sInputRenamedTag4;
				var that = this;
				$.ajax({
					async: false,
					url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogListSelectQuery&Content-Type=text/json",
					data: {
						"Param.1": `T.ID_PLANT_HIERARCHY = '${sInputHierarchy5}' AND T.DS_NAME_RENAMED = '${sRenamedTag}' AND `,
						"Param.2": `T.ID_TAG != '${sTagId}' AND `,
						"Param.3": "T2.ID_TAG IS NULL AND (T.FL_HIDDEN = 0 OR T.FL_HIDDEN = '1') AND",
						"Param.20": "*"
					},
					success: function (result) {
						if (result.Rowsets.Rowset) {
							var data = result.Rowsets.Rowset[0];
							if (data.Row && data.Row.length > 0) {
								sap.ui.require(["sap/m/MessageBox"]);
								sap.m.MessageBox.confirm(`${oResourceBundle.getText("tagInfoNavigateToDuplicate")} '${data.Row[0].SOURCE_NAME}'-'${data.Row[0].DS_NAME_ORIGINAL}'`, {
									title: `${oResourceBundle.getText("tagInfoDuplicateName")} (${oResourceBundle.getText("tagCatalogPlantHierarchy")} + ${oResourceBundle.getText("commonLabelRenamedTag")})`,
									onClose: function (sActionClicked) {
										if (sActionClicked === sap.m.MessageBox.Action.OK) {
											sap.ui.core.UIComponent.getRouterFor(oTagInformationController).navTo("TagInformation", {
												ID_TAG: data.Row[0].ID_TAG,
												ID_SOURCE: encodeURIComponent(data.Row[0].ID_SOURCE),
												ID_PLANT_HIERARCHY: encodeURIComponent(data.Row[0].ID_PLANT_HIERARCHY),
												ID_PLANT: data.Row[0].ID_PLANT,
												PLANT: data.Row[0].PLANT,
												DS_NAME_ORIGINAL: encodeURIComponent(data.Row[0].DS_NAME_ORIGINAL),
												DS_NAME_RENAMED: encodeURIComponent(data.Row[0].DS_NAME_RENAMED),
												DS_DESCRIPTION: ((data.Row[0].DS_DESCRIPTION == "") ? 'NA' : encodeURIComponent(data.Row[0].DS_DESCRIPTION)),
												ID_UOM: encodeURIComponent(data.Row[0].ID_UOM),
												ID_PCO_DESTINATION: data.Row[0].ID_PCO_DESTINATION,
												SOURCE_NAME: encodeURIComponent(data.Row[0].SOURCE_NAME),
												DS_MII_DATA_SERVER_PROCESS: data.Row[0].DS_MII_DATA_SERVER_PROCESS,
												PLANT_HIERARCHY_ID: encodeURIComponent(data.Row[0].PLANT_HIERARCHY_ID),
												PLANT_HIERARCHY: encodeURIComponent(data.Row[0].PLANT_HIERARCHY),
												FLAG_REALTIME: data.Row[0].FLAG_REALTIME,
												FLAG_ARCHIVE: data.Row[0].FLAG_ARCHIVE,
												COLOR_STATUS: data.Row[0].COLOR_STATUS,
												LIMIT_CAPTURE: encodeURIComponent(data.Row[0].LIMIT_CAPTURE),
												LIMIT_VISUALIZATION: encodeURIComponent(data.Row[0].LIMIT_VISUALIZATION),
												FL_WATCH_DATA_CAPTURE: data.Row[0].FL_WATCH_DATA_CAPTURE,
												FL_WATCH_VISUALIZATION: data.Row[0].FL_WATCH_VISUALIZATION
											});
										} else {
											//MessageToast.show(oResourceBundle.getText("tagInfoFailedSave"));
											that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
												oResourceBundle.getText("tagInfoSaveTagInfo"),
												oResourceBundle.getText("tagInfoFailedSave"),
												"Error");
										}
									}
								});
							} else {
								validFullTagName = true;
							}
						} else if (result.Rowsets.FatalError) {
							//MessageToast.show(result.Rowsets.FatalError);
							that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
								oResourceBundle.getText("tagInfoSaveTagInfo"),
								result.Rowsets.FatalError,
								"Error");
						}
					}
				});
				if (!validFullTagName) {
					return;
				}
				var aCommentColumnName = [];
				var aCommentMessage = [];
				if (bRequireChangeComment) {
					if (!this.fnValidateChangeComments()) {
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
				oDialog.open();
				oDialog.setText(sSaveWaitMessage);
				$.ajax({
					url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogXacuteQuery&Content-Type=text/json",
					data: {
						"Param.1": sAction,
						"Param.2": sTagId,
						"Param.3": sTagDescription,
						"Param.4": sTagName,
						"Param.5": sRenamedTag,
						"Param.6": bSwitchRealTime,
						"Param.7": bSwitchArchive,
						"Param.8": sInputHierarchy5,
						"Param.9": sComboBoxPCoDestination,
						"Param.10": sTagUOM,
						"Param.11": bSwitchWatch,
						"Param.12": false,
						"Param.30": aCommentColumnName.join("\n"),
						"Param.31": aCommentMessage.join("\n")
					},
					success: function (result) {
						if (result.Rowsets.Rowset) {
							var data = result.Rowsets.Rowset[0];
							var successMsg = data.Row[0].Output;
							if (successMsg == "{##SUCCESS_MESSAGE}") {
								successMsg = oResourceBundle.getText("tagInfoSuccessSave");
							}
							oDialog.close();
							//MessageToast.show(successMsg);
							that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
								oResourceBundle.getText("tagInfoSaveTagInfo"),
								successMsg,
								"Success");
							oTagInformationController.fnNavigateBack();
						} else if (result.Rowsets.FatalError) {
							var errorMsg = result.Rowsets.FatalError;
							oDialog.close();
							//MessageToast.show(errorMsg);
							that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
								oResourceBundle.getText("tagInfoSaveTagInfo"),
								errorMsg,
								"Error");
						}
					}
				});
			}
		},
		fnFormatRestBtn: function (sUOM, sRenamedTagName, sHierarchy) {
			if (sUOM && sUOM != 'NA' && sRenamedTagName && sRenamedTagName != 'NA' && sHierarchy && sHierarchy != 'NA') return true;
			else return false;
		},
		fnResetTagConfiguration: function () {
			sap.ui.require(["sap/m/MessageBox"]);
			var that = this;
			sap.m.MessageBox.warning(oResourceBundle.getText("tagInfoRestMsg"), {
				title: oResourceBundle.getText("tagInfoResetConfig"),
				actions: [oResourceBundle.getText("tagInfoReset"), sap.m.MessageBox.Action.CANCEL],
				onClose: function (sActionClicked) {
					if (sActionClicked === oResourceBundle.getText("tagInfoReset")) that.fnResetTagConfigurationSubmit();
				}
			});
		},
		fnResetTagConfigurationSubmit: function () {
			sAction = "DELETE", sTagDescription = "", sInputRenamedTag1 = "", sInputRenamedTag2 = "", sInputRenamedTag3 = "", sInputRenamedTag4 = "", bSwitchRealTime = false, bSwitchArchive = false, sFinalHierarchy = "", sTagUOM = "", bSwitchWatch = false, sComboBoxPCoDestination = "";
			var sRenamedTag = "";
			var aCommentColumnName = [];
			var aCommentMessage = [];
			var that =this;
			if (bRequireChangeComment) {
				if (!this.fnValidateChangeComments()) {
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
			MessageBox.confirm(oResourceBundle.getText("tagInfoSecondResetMsg"), {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (sCaction) {
					if (sCaction == "YES") {
			oDialog.open();
			var sSaveWaitMessage = oResourceBundle.getText("tagInfoResetWaitMessage");
			oDialog.setText(sSaveWaitMessage);
			
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogXacuteQuery&Content-Type=text/json",
				data: {
					"Param.1": sAction,
					"Param.2": sTagId,
					"Param.3": sTagDescription,
					"Param.4": sTagName,
					"Param.5": sRenamedTag,
					"Param.6": bSwitchRealTime,
					"Param.7": bSwitchArchive,
					"Param.8": sInputHierarchy5,
					"Param.9": sComboBoxPCoDestination,
					"Param.10": sTagUOM,
					"Param.11": bSwitchWatch,
					"Param.12": false,
					"Param.30": aCommentColumnName.join("\n"),
					"Param.31": aCommentMessage.join("\n")
				},
				success: function (result) {
					if (result.Rowsets.Rowset) {
						var data = result.Rowsets.Rowset[0];
						var successMsg = data.Row[0].Output;
						if (successMsg == "{##SUCCESS_MESSAGE}") {
							successMsg = oResourceBundle.getText("tagInfoSuccessSave");
						}
						oDialog.close();
						//MessageToast.show(successMsg);
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoResetConfig"),
							successMsg,
							"Success");
						oTagInformationController.fnNavigateBack();
					} else if (result.Rowsets.FatalError) {
						var errorMsg = result.Rowsets.FatalError;
						oDialog.close();
						//MessageToast.show(errorMsg);
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("tagInfoResetConfig"),
							errorMsg,
							"Error");
					}
				}
			}); 

			}}}	);
		
	
		},
		fnOpenRestorePopup: function (oEvent) {
			var oFlexContainer = oEvent.getSource().getParent();
			arrCurrentItems = oFlexContainer.getItems();
			iCurrentControlCount = arrCurrentItems.length;
			if (iCurrentControlCount == 2) {
				oCurrentControl = arrCurrentItems[0];
				sCurrentColumnName = oCurrentControl.data("columnName");
			} else if (iCurrentControlCount > 2) {
				oCurrentControl = arrCurrentItems[0];
				sCurrentColumnName = oCurrentControl.data("columnName");
			}
			sCurrentLabel = oCurrentControl.getParent().getParent().getLabel().getText();
			this._oRestoreDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.view.RestoreValueSelect", this);
			this.getView().addDependent(this._oRestoreDialog);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oRestoreDialog);
			this._oRestoreDialog.open();
			this.fnInitRestorePopup();
		},
		fnInitRestorePopup: function () {
			sap.ui.getCore().byId("table-select-restore-value").setModel(this.oModelRestoreValue);
			sap.ui.getCore().byId("table-select-restore-value").setTitle(sCurrentLabel);
			this.fnLoadrestoreValues();
		},
		fnCancelRestore: function () {
			this._oRestoreDialog.destroy();
		},
		fnLoadrestoreValues: function () {
			oDialog.open();
			var sQry = "StreamingEngine/AuditLog/Query/AuditLogRestoreValueSelectQuery";

			if (sCurrentColumnName == "ID_PLANT_HIERARCHY") {
				sQry = "StreamingEngine/AuditLog/Query/AuditLogRestoreHierarchySelectQuery";
			}
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=" + sQry + "&Content-Type=text/json",
				data: {
					"Param.1": sTagCatalogTable,
					"Param.2": sCurrentColumnName,
					"Param.3": sTagId
				},
				success: function (result) {
					if (result.Rowsets.FatalError) {
						var sErrorMessage = result.Rowsets.FatalError;
						//MessageToast.show(sErrorMessage);
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
							oResourceBundle.getText("plantInfoRestoreValueMsg"),
							sErrorMessage,
							"Error");
						oDialog.close();
					} else {
						var data = result.Rowsets.Rowset[0];
						if (data.Row && (sCurrentColumnName.startsWith("FL_") || sCurrentColumnName.startsWith("FLAG_"))) {
							data.Row = data.Row.map(function (oElt) {
								return {
									DS_USERNAME: oElt.DS_USERNAME,
									DS_VALUE_NEW: oElt.DS_VALUE_NEW == "1" ? sYesLabel : sNoLabel,
									DT_TIMESTAMP: oElt.DT_TIMESTAMP
								}
							});
						}
						oTagInformationController.oModelRestoreValue.setData(data);
						oTagInformationController.oModelRestoreValue.refresh();
						oDialog.close();
					}

				}
			});
		},
		fnConfirmRestore: function (oEvent) {
			var sSelectedValue = oEvent.getSource()._aSelectedItems[0].getCells()[2].getText();
			if (iCurrentControlCount == 2) {
				var sControlName = arrCurrentItems[0].getMetadata().getName();
				if (sControlName == "sap.m.Input") {
					arrCurrentItems[0].setValue(sSelectedValue);
				} else if (sControlName == "sap.m.Switch") {
					if (sSelectedValue == sYesLabel) {
						arrCurrentItems[0].setState(true);
					} else {
						arrCurrentItems[0].setState(false);
					}
				} else if (sControlName == "sap.m.ComboBox") {
					arrCurrentItems[0].setSelectedKey(sSelectedValue);
				}
			} else {
				if (sCurrentColumnName == "DS_NAME_RENAMED") {
					var arrayofRenamedTags = sSelectedValue.split("-");
					arrCurrentItems[0].setValue(arrayofRenamedTags[0]);
					arrCurrentItems[1].setValue(arrayofRenamedTags[1]);
					arrCurrentItems[2].setValue(arrayofRenamedTags[2]);
					arrCurrentItems[3].setValue(arrayofRenamedTags[3]);
				} else if (sCurrentColumnName == "ID_PLANT_HIERARCHY") {
					var arrayofHierarchy = sSelectedValue.split("-");
					var that = this;
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PlantHierarchy/Query/PlantHierarchyByFullNameSelectQuery&Content-Type=text/json",
						data: {

							"Param.1": arrayofHierarchy[0].slice(0, 3),
							"Param.2": arrayofHierarchy[0].slice(-4),
							"Param.3": arrayofHierarchy[1],
							"Param.4": arrayofHierarchy[2],
							"Param.5": arrayofHierarchy[3],
							"Param.6": sIDPlant
						},
						success: function (result) {
							if (result.Rowsets.Rowset) {
								var data = result.Rowsets.Rowset[0];
								var sHierarchyFullID = data.Row[0].ID_PLANT_HIERARCHY_FULL;
								arrayofHierarchyId = sHierarchyFullID.split("-");
								oTagInformationController.fnLoadHierarchy(1, "loc", "");
							} else if (result.Rowsets.FatalError) {
								var errorMsg = result.Rowsets.FatalError;
								oDialog.close();
								//MessageToast.show(errorMsg);
								that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
									oResourceBundle.getText("tagInfoGetPlantHierarchyByFullName"),
									errorMsg,
									"Error");
							}
						}
					});

				}
			}
			this._oRestoreDialog.destroy();
		},
		fnSearchRestorePopup: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("DS_VALUE_NEW", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		fnNavigateBack: function () {
			this.getView().byId("checkbox-auto-refresh").setSelected(false);
			this.getView().byId("combobox-timerange").setSelectedKey("15-M");
			var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisrouter.navTo("TagCatalog");
		},
		/*
		fnNavigateHome: function () {
			this.getView().byId("checkbox-auto-refresh").setSelected(false);
			this.getView().byId("combobox-timerange").setSelectedKey("15-M");
			var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisrouter.navTo("Launchpad");

		},
		*/
		fnValidateChangeComments: function () {
			var oChangeTracker = this.oModelChangeMessages.getData();

			oChangeTracker.fnUpdateNewValue("DS_DESCRIPTION", sTagDescription);
			oChangeTracker.fnUpdateNewValue("ID_UOM", sTagUOM);
			oChangeTracker.fnUpdateNewValue("ID_PLANT_HIERARCHY", sFinalHierarchy);
			oChangeTracker.fnUpdateNewValue("DS_NAME_RENAMED", (sInputRenamedTag1 && sInputRenamedTag2 && sInputRenamedTag3 && sInputRenamedTag4) ? sInputRenamedTag1 + "-" + sInputRenamedTag2 + "-" + sInputRenamedTag3 + "-" + sInputRenamedTag4 : "");
			oChangeTracker.fnUpdateNewValue("FLAG_REALTIME", bSwitchRealTime ? sYesLabel : sNoLabel);
			oChangeTracker.fnUpdateNewValue("FLAG_ARCHIVE", bSwitchArchive ? sYesLabel : sNoLabel);
			oChangeTracker.fnUpdateNewValue("FL_WATCH_DATA_CAPTURE", bSwitchWatch ? sYesLabel : sNoLabel);
			if (bSwitchRealTime) {
				oChangeTracker.fnUpdateNewValue("ID_PCO_DESTINATION", oTagInformationController.getView().byId("combobox-destination").getValue());
			} else {
				oChangeTracker.fnUpdateNewValue("ID_PCO_DESTINATION", 'NA');
			}

			if (bShowCommentDialog && oChangeTracker.Row.filter(e => e.new != null).length > 0) {
				this.fnChangeCommentDialog();
				return false;
			}
			var bValid = oChangeTracker.Row.every(e => {
				if (e.new != null) {
					return e.message.length > 0 && e.message.length < 255
				}
				return true
			})
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
						if (sAction === "UPDATE") oTagInformationController.fnSaveTagInformation();
						else oTagInformationController.fnResetTagConfigurationSubmit();
						oChangeCommentDialog.close();
					} else {
						MessageToast.show(oResourceBundle.getText("commonCheckCommentMessages"));
						that.handleMessage(oResourceBundle.getText("commonTitleTagInformation"),
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
		fnRenamedTagDialog: function () {
			if (this.oRenamedTagDialog == undefined) {
				this.oRenamedTagDialog = sap.ui.xmlfragment(this.getView().getId(), "StreamingEngine.StreamingEngine.fragment.RenamedTagDialog", this);
				this.getView().addDependent(this.oRenamedTagDialog);
				this.oRenamedTagDialog.setModel(this.mRenamedTagDialog.oModelDomain, "Domain");
				this.oRenamedTagDialog.setModel(this.mRenamedTagDialog.oModelSystem, "System");
				this.oRenamedTagDialog.setModel(this.mRenamedTagDialog.oModelSub, "Sub");
				this.oRenamedTagDialog.setModel(this.mRenamedTagDialog.oModelTagName, "TagName");
				$.ajax({
					url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagName/Query/TagNameListDomainSelectQuery&Content-Type=text/json",
					success: function (result) {
						if (result.Rowsets.Rowset) {
							oTagInformationController.mRenamedTagDialog.oModelDomain.setData(result.Rowsets.Rowset[0]);
						} else if (result.Rowsets.FatalError) {
							var errorMsg = result.Rowsets.FatalError;
							MessageToast.show(errorMsg);
						}
					}
				});
			}
			this.mRenamedTagDialog.oModelTagName.setData({ Row: [] });
			this.mRenamedTagDialog.oModelSystem.setData({ Row: [] });
			this.mRenamedTagDialog.oModelSub.setData({ Row: [] });
			this.byId("combobox-domain").setSelectedItem(null);
			this.mRenamedTagDialog.fnResetUOM();

			this.oRenamedTagDialog.open();
		},
		mRenamedTagDialog: {
			fnConfirm: function (oEvent) {
				var aRenamedTag;
				if (this.mRenamedTagDialog.oSelectedTagName == null) {
					aRenamedTag = ["", "", "", ""];
				} else {
					aRenamedTag = this.mRenamedTagDialog.oSelectedTagName.DS_TAGNAME.split("-");
					if (this.byId("togglebutton-set-uom").getPressed()) {
						this.byId("combobox-uom").setSelectedKey(this.mRenamedTagDialog.oSelectedTagName.ID_UOM)
					}
				}
				for (var i = 0; i < 4; i++) {
					this.byId(`input-renamed-tag-${i + 1}`).setValue(aRenamedTag[i]);
				}
				oEvent.getSource().getParent().close();
			},
			fnCancel: function (oEvent) {
				oEvent.getSource().getParent().close();
			},
			fnToggleUoM: function (oEvent) {
				var oToggleButton = oEvent.getSource();
				oToggleButton.setIcon(oToggleButton.getPressed() ? "sap-icon://complete" : "sap-icon://border");
			},
			fnChangeDomain: function (oEvent) {
				this.mRenamedTagDialog.fnResetUOM();
				this.byId("RenamedTagTable").getBinding("items").filter([]);
				this.mRenamedTagDialog.oModelSub.setData({ Row: [] });
				this.mRenamedTagDialog.oModelSystem.setData({ Row: [] });
				this.mRenamedTagDialog.oModelTagName.setData({ Row: [] });
				if (oEvent.getParameter("selectedItem") != null) {
					var sKey = oEvent.getParameter("selectedItem").getKey();
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagName/Query/TagNameListSystemByDomainSelectQuery&Content-Type=text/json",
						data: {
							"Param.1": sKey
						},
						success: function (result) {
							if (result.Rowsets.Rowset) {
								oTagInformationController.mRenamedTagDialog.oModelSystem.setData(result.Rowsets.Rowset[0]);
							} else if (result.Rowsets.FatalError) {
								var errorMsg = result.Rowsets.FatalError;
								MessageToast.show(errorMsg);
							}
						}
					})
				}
			},
			fnChangeSystem: function (oEvent) {
				this.mRenamedTagDialog.fnResetUOM();
				this.byId("RenamedTagTable").getBinding("items").filter([]);
				this.mRenamedTagDialog.oModelSub.setData({ Row: [] });
				this.mRenamedTagDialog.oModelTagName.setData({ Row: [] });
				if (oEvent.getParameter("selectedItem") != null) {
					$.ajax({
						url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagName/Query/TagNameListSelectQuery&Content-Type=text/json",
						data: {
							"Param.1": this.byId("combobox-domain").getSelectedItem().getKey(),
							"Param.2": oEvent.getParameter("selectedItem").getKey()
						},
						success: function (result) {
							if (result.Rowsets.Rowset) {
								oTagInformationController.mRenamedTagDialog.oModelTagName.setData(result.Rowsets.Rowset[0]);
								oTagInformationController.mRenamedTagDialog.oModelSub.setData({
									Row: Array.from(new Set(result.Rowsets.Rowset[0].Row.map(e => e.DS_SUB))).map(function (e) { return { DS_SUB: e } })
								});
							} else if (result.Rowsets.FatalError) {
								var errorMsg = result.Rowsets.FatalError;
								MessageToast.show(errorMsg);
							}
						}
					})
				}
			},
			fnChangeSub: function (oEvent) {
				if (oEvent.getParameter("selectedItem") != null) {
					var sKey = oEvent.getParameter("selectedItem").getKey();
					var aFilters = [new sap.ui.model.Filter("DS_SUB", sap.ui.model.FilterOperator.EQ, sKey)];
				} else {
					var aFilters = [];
				}
				this.byId("RenamedTagTable").getBinding("items").filter(aFilters);
			},
			fnSelectionChange: function (oEvent) {
				this.mRenamedTagDialog.oSelectedTagName = oEvent.getParameter("listItem").getBindingContext("TagName").getObject();
				if (this.mRenamedTagDialog.oSelectedTagName.ID_UOM === "NA") {
					this.mRenamedTagDialog.fnResetUOM(false);
				} else {
					this.byId("togglebutton-set-uom").setEnabled(true);
				}
			},
			fnResetUOM: function (bResetSelection = true) {
				oTagInformationController.byId("togglebutton-set-uom").setPressed(false);
				oTagInformationController.byId("togglebutton-set-uom").setEnabled(false);
				oTagInformationController.byId("togglebutton-set-uom").setIcon("sap-icon://border");
				if (bResetSelection) {
					oTagInformationController.byId("RenamedTagTable").removeSelections(true);
					this.oSelectedTagName = null;
				}
			},
			oSelectedTagName: null,
			oModelDomain: new sap.ui.model.json.JSONModel(),
			oModelSystem: new sap.ui.model.json.JSONModel(),
			oModelSub: new sap.ui.model.json.JSONModel(),
			oModelTagName: new sap.ui.model.json.JSONModel()
		}
	});
});
//# sourceURL=https://sapwdawsemea.pharma.aventis.com:9100/XMII/CM/StreamingEngine/StreamingEngine/controller/TagInformation.controller.js?eval