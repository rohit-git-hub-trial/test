/*-----------------------------------------------------------------------------------
Streaming Engine - Historical Upload Status
Creation Date: 2026.07.31
Reference Document: Historical Data Upload - Governed Request Workflow Specification
Description: Central tracking / approval interface for Historical Data Upload requests.
NOTE: Backend integration (request list, approve/reject/defer actions) is pending -
      calls below follow the existing Illuminator QueryTemplate convention and are
      commented where the target Query/Transaction does not exist yet. The table is
      seeded from a local mock dataset so the screen is directly demoable.
-------------------------------------------------------------------------------------*/
var oHistoricalUploadStatusController;
var oDialog;
var oCommentDialog;
var oResourceBundle;
var sPendingAction;
sap.ui.define([
	"../controller/BaseController",
	"sap/m/MessageBox",
	"StreamingEngine/StreamingEngine/model/formatter",
	"sap/m/MessageToast",
	"sap/ui/model/Sorter"
], function (BaseController, MessageBox, formatter, MessageToast, Sorter) {
	"use strict";

	return BaseController.extend("StreamingEngine.StreamingEngine.controller.HistoricalUploadStatus", {
		formatter: formatter,
		onInit: function () {
			// set message manager model
			var oMessageManager = sap.ui.getCore().getMessageManager();
			var oView = this.getView();
			oView.setModel(oMessageManager.getMessageModel(), "message");
			oMessageManager.registerObject(oView, true);

			oHistoricalUploadStatusController = this;
			this.sSortQuery = "Q.REQUEST_TIMESTAMP DESC";
			oDialog = this.getView().byId("BusyDialog");

			oView.setModel(this.oModelHistoricalUploadStatus);
			oView.setModel(this.oModelRequestDetail, "RequestDetailView");
			oView.setModel(this.oModelRequestComment, "RequestCommentView");
			this.getView().byId("combobox-plant").setModel(this.oModelPlant);
			this.getView().byId("combobox-data-source").setModel(this.oModelDataSource);
			this.getView().byId("combobox-flow-type").setModel(this.oModelFlowType);
			this.getView().byId("combobox-status").setModel(this.oModelStatus);

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("HistoricalUploadStatus").attachPatternMatched(this._onObjectMatched, this);
		},
		onAfterRendering: function () {
			oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			/******************** Below Part for Authorisation***********************/
			var sRoles = document.getElementById('input-roles').value;
			var sAdminRole = "STREAMING_ENGINE_ADMIN";
			var sUserRole = "STREAMING_ENGINE_USER";
			// TODO: confirm the actual authorization role name used for PlantCo approvers
			// in your environment - "STREAMING_ENGINE_PLANTCO" is assumed here to follow
			// the existing STREAMING_ENGINE_xxx naming convention.
			var sPlantCoRole = "STREAMING_ENGINE_PLANTCO";
			var iAdminIndex = sRoles.indexOf(sAdminRole);
			var iUserIndex = sRoles.indexOf(sUserRole);
			var iPlantCoIndex = sRoles.indexOf(sPlantCoRole);
			if (iAdminIndex < 0 && iUserIndex < 0) {
				this.fnShowNoAccess();
				return;
			} else {
				this.getView().byId("page-historical-upload-status").setVisible(true);
			}
			this.bIsPlantCo = (iAdminIndex >= 0 || iPlantCoIndex >= 0);
			/***********************************************************************/
		},
		fnShowNoAccess: function () {
			var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
			thisRouter.navTo("NoAccess");
		},

		_onObjectMatched: function (oEvent) {
			oAppController.fnUpdate(this, oResourceBundle.getText("historicalUploadStatusTitle"));
			oHistoricalUploadStatusController.fnCloseRequestDetails();
			oHistoricalUploadStatusController.fnLoadPlant();
			oHistoricalUploadStatusController.fnLoadFlowType();
			oHistoricalUploadStatusController.fnLoadStatus();
			oHistoricalUploadStatusController.fnLoadHistoricalUploadStatus();
		},

		oModelHistoricalUploadStatus: new sap.ui.model.json.JSONModel(),
		oModelRequestDetail: new sap.ui.model.json.JSONModel({ Open: false, CanAct: false }),
		oModelRequestComment: new sap.ui.model.json.JSONModel({ Title: "", ConfirmText: "", Comment: "" }),
		oModelPlant: new sap.ui.model.json.JSONModel(),
		oModelDataSource: new sap.ui.model.json.JSONModel(),
		oModelFlowType: new sap.ui.model.json.JSONModel(),
		oModelStatus: new sap.ui.model.json.JSONModel(),

		fnLoadPlant: function () {
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
				data: {
					"Param.20": document.getElementById("SE_Plant").value
				},
				success: function (result) {
					if (result.Rowsets.FatalError !== undefined) {
						that.handleMessage(oResourceBundle.getText("historicalUploadStatusTitle"),
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
						} catch (err) { }
						oHistoricalUploadStatusController.oModelPlant.setData(data);
						oHistoricalUploadStatusController.oModelPlant.refresh();
						oHistoricalUploadStatusController.getView().byId("combobox-plant").setSelectedKeys("%");
						oHistoricalUploadStatusController.fnPlantSelected();
					}
				}
			});
		},
		fnPlantSelected: function () {
			this.fnLoadDataSource();
		},
		fnLoadDataSource: function () {
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataSource/Query/SourceListByPlantSelectQuery&Content-Type=text/json",
				data: {
					"Param.20": document.getElementById("SE_Plant").value
				},
				success: function (result) {
    if (result.Rowsets.FatalError !== undefined) {
        that.handleMessage(oResourceBundle.getText("historicalUploadStatusTitle"),
            oResourceBundle.getText("historicalUploadStatusLoadDataSourceList"),
            result.Rowsets.FatalError,
            "Error");
    } else {
        var data = result.Rowsets.Rowset[0];
        try {
            data.Row.unshift({
                DS_NAME: oResourceBundle.getText("commonAll"),
                ID_SOURCE: "%"
            });
        } catch (err) { }
        oHistoricalUploadStatusController.oModelDataSource.setData(data);
        oHistoricalUploadStatusController.oModelDataSource.refresh();
        oHistoricalUploadStatusController.getView().byId("combobox-data-source").setSelectedKeys("%");
        oHistoricalUploadStatusController.fnLoadHistoricalUploadStatus();
    }
}
			});
		},
		fnLoadFlowType: function () {
			var that = this;
			$.ajax({
				url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/FlowTypeListSelectQuery&Content-Type=text/json",
				success: function (result) {
					if (result.Rowsets.FatalError !== undefined) {
						that.handleMessage(oResourceBundle.getText("historicalUploadStatusTitle"),
							oResourceBundle.getText("historicalUploadStatusLoadFlowTypeList"),
							result.Rowsets.FatalError,
							"Error");
					} else {
						oHistoricalUploadStatusController.oModelFlowType.setData(result.Rowsets.Rowset[0]);
						oHistoricalUploadStatusController.oModelFlowType.refresh();
					}
				}
			});
		},
		// The Request Status domain (Pending/Approved/Rejected/Cancelled/Deferred/Expired) is
		// specific to this new feature and has no backend list query yet - populated locally
		// until Z_HIST_UPLOAD_REQ / a status domain query exists.
		fnLoadStatus: function () {
    this.oModelStatus.setData({
        Row: [
            { ID_STATUS: "%", DS_DESCRIPTION: oResourceBundle.getText("commonAll") },
					{ ID_STATUS: "PE", DS_DESCRIPTION: oResourceBundle.getText("historicalUploadStatusPending") },
					{ ID_STATUS: "AP", DS_DESCRIPTION: oResourceBundle.getText("historicalUploadStatusApproved") },
					{ ID_STATUS: "RJ", DS_DESCRIPTION: oResourceBundle.getText("historicalUploadStatusRejected") },
					{ ID_STATUS: "CA", DS_DESCRIPTION: oResourceBundle.getText("historicalUploadStatusCancelled") },
					{ ID_STATUS: "OH", DS_DESCRIPTION: oResourceBundle.getText("historicalUploadStatusDeferred") },
					{ ID_STATUS: "EX", DS_DESCRIPTION: oResourceBundle.getText("historicalUploadStatusExpired") }
				]
			});
			this.oModelStatus.refresh();
this.getView().byId("combobox-status").setSelectedKeys("%");
},
		// TODO backend integration: replace this mock dataset with:
		// $.ajax({ url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/HistoricalUpload/Query/HistoricalUploadRequestListSelectQuery&Content-Type=text/json", ... })
		// reading Param.1..4 = selected Plant/DataSource/Status/FlowType keys, same pattern as fnLoadQueueMonitoring.
		fnLoadHistoricalUploadStatus: function () {
			oDialog.setText("");
			oDialog.open();
			var aMockRows = oHistoricalUploadStatusController.fnGetMockRequests();
			oHistoricalUploadStatusController.aAllRows = aMockRows;
			oHistoricalUploadStatusController.oModelHistoricalUploadStatus.setData({ Row: aMockRows });
			oHistoricalUploadStatusController.oModelHistoricalUploadStatus.refresh();
			oDialog.close();
		},

		onSearch: function () {
			var aPlant = this.getView().byId("combobox-plant").getSelectedKeys();
			var aSource = this.getView().byId("combobox-data-source").getSelectedKeys();
			var aStatus = this.getView().byId("combobox-status").getSelectedKeys();
			var aFlowType = this.getView().byId("combobox-flow-type").getSelectedKeys();
			var aFiltered = (this.aAllRows || []).filter(function (oRow) {
				return (aPlant.length === 0 || aPlant.indexOf("%") > -1 || aPlant.indexOf(oRow.ID_PLANT) > -1) &&
					(aSource.length === 0 || aSource.indexOf("%") > -1 || aSource.indexOf(oRow.ID_SOURCE) > -1) &&
					(aStatus.length === 0 || aStatus.indexOf("%") > -1 || aStatus.indexOf(oRow.REQ_STATUS) > -1) &&
					(aFlowType.length === 0 || aFlowType.indexOf(oRow.ID_FLOW_TYPE) > -1);
			});
			this.oModelHistoricalUploadStatus.setData({ Row: aFiltered });
			this.oModelHistoricalUploadStatus.refresh();
		},
		fnGrowingStarted: function () { },

		fnToggleDetailPanel: function () {
			var bOpen = this.oModelRequestDetail.getProperty("/Open");
			this.oModelRequestDetail.setProperty("/Open", !bOpen);
		},
		fnCloseRequestDetails: function () {
    this.oModelRequestDetail.setData({ Open: false, CanAct: false });
    this.getView().byId("table-historical-upload-status").removeSelections(true);
},
		fnViewRequestDetails: function (oEvent) {
    oHistoricalUploadStatusController.fnShowRequestDetails(oEvent.getSource().getBindingContext());
},
fnRowSelectionChanged: function (oEvent) {
    var oListItem = oEvent.getParameter("listItem");
    var oContext = oListItem && oListItem.getBindingContext();
    if (oContext) {
        oHistoricalUploadStatusController.fnShowRequestDetails(oContext);
    }
},
fnShowRequestDetails: function (oContext) {
    var oRequest = oContext.getObject();
    var oData = Object.assign({}, oRequest, {
        Open: true,
        CanAct: !!oHistoricalUploadStatusController.bIsPlantCo
    });
    this.oModelRequestDetail.setData(oData);
    this.sSelectedRequestId = oRequest.REQ_ID;
},

		fnApproveRequest: function () {
			var that = this;
			MessageBox.confirm(oResourceBundle.getText("historicalUploadStatusApproveConfirm"), {
				title: oResourceBundle.getText("historicalUploadStatusApprove"),
				onClose: function (sAction) {
					if (sAction === MessageBox.Action.OK) {
						// TODO backend integration: call the Approve action/transaction for
						// Transaction.REQ_ID = that.sSelectedRequestId, then reload the list.
						that.fnApplyMockStatusChange(that.sSelectedRequestId, "AP", "");
						MessageToast.show(oResourceBundle.getText("historicalUploadStatusApproveSuccess"));
					}
				}
			});
		},
		fnRejectRequest: function () {
			sPendingAction = "RJ";
			this.oModelRequestComment.setData({
				Title: oResourceBundle.getText("historicalUploadStatusReject"),
				ConfirmText: oResourceBundle.getText("historicalUploadStatusReject"),
				Comment: ""
			});
			this.fnOpenRequestCommentDialog();
		},
		fnDeferRequest: function () {
			sPendingAction = "OH";
			this.oModelRequestComment.setData({
				Title: oResourceBundle.getText("historicalUploadStatusDefer"),
				ConfirmText: oResourceBundle.getText("historicalUploadStatusDefer"),
				Comment: ""
			});
			this.fnOpenRequestCommentDialog();
		},
		fnOpenRequestCommentDialog: function () {
			if (!oCommentDialog) {
				oCommentDialog = sap.ui.xmlfragment("StreamingEngine.StreamingEngine.fragment.RequestCommentDialog", this);
				this.getView().addDependent(oCommentDialog);
			}
			sap.ui.getCore().byId("text-request-comment-error").setVisible(false);
			oCommentDialog.open();
		},
		fnCommentChanged: function (oEvent) {
			var bEmpty = !oEvent.getParameter("value");
			sap.ui.getCore().byId("text-request-comment-error").setVisible(bEmpty);
		},
		fnCloseRequestCommentDialog: function () {
			oCommentDialog.close();
		},
		fnConfirmRequestComment: function () {
			var sComment = this.oModelRequestComment.getProperty("/Comment");
			if (!sComment) {
				sap.ui.getCore().byId("text-request-comment-error").setVisible(true);
				return;
			}
			// TODO backend integration: call the Reject/Defer action/transaction for
			// Transaction.REQ_ID = this.sSelectedRequestId with Transaction.COMMENT = sComment,
			// then reload the list.
			this.fnApplyMockStatusChange(this.sSelectedRequestId, sPendingAction, sComment);
			MessageToast.show(sPendingAction === "RJ" ?
				oResourceBundle.getText("historicalUploadStatusRejectSuccess") :
				oResourceBundle.getText("historicalUploadStatusDeferSuccess"));
			oCommentDialog.close();
		},

		// Local-only helper (no backend yet): updates the mock dataset in place and refreshes
		// both the table and the open detail panel so the change is immediately visible.
		fnApplyMockStatusChange: function (sReqId, sStatus, sComment) {
			var oStatusDesc = {
				AP: oResourceBundle.getText("historicalUploadStatusApproved"),
				RJ: oResourceBundle.getText("historicalUploadStatusRejected"),
				OH: oResourceBundle.getText("historicalUploadStatusDeferred")
			};
			(this.aAllRows || []).forEach(function (oRow) {
				if (oRow.REQ_ID === sReqId) {
					oRow.REQ_STATUS = sStatus;
					oRow.REQ_STATUS_DESC = oStatusDesc[sStatus];
					oRow.COMMENT = sComment || oRow.COMMENT;
					oRow.STATUS_TIMESTAMP = new Date().toISOString().slice(0, 16).replace("T", " ");
				}
			});
			this.onSearch();
			this.fnCloseRequestDetails();
		},

		// Sample data matching the mock-up (Plant, Data Source, Flow Type, Request Status).
		fnGetMockRequests: function () {
			return [
				{ REQ_ID: "1", ID_PLANT: "FAN", PLANT: "Fanwica", ID_SOURCE: "S1", DATA_SOURCE: "FP_AH_DST", REQUEST_TIMESTAMP: "01-Jul-2025 10:15", REQUESTOR: "Fanwica", REQ_STATUS: "PE", REQ_STATUS_DESC: "Pending", STATUS_TIMESTAMP: "01-Jul-2025 10:20", COMMENT: "Waiting approval", ID_FLOW_TYPE: "HIST", FLOW_TYPE_DESC: "Historical Extract", START_DATETIME: "01-Jun-2025 00:00", END_DATETIME: "30-Jun-2025 00:00", NUM_TAGS: "1,250" },
				{ REQ_ID: "2", ID_PLANT: "JON", PLANT: "Jonchez", ID_SOURCE: "S2", DATA_SOURCE: "Demo", REQUEST_TIMESTAMP: "30-Jun-2025 14:05", REQUESTOR: "Demo", REQ_STATUS: "AP", REQ_STATUS_DESC: "Approved", STATUS_TIMESTAMP: "30-Jun-2025 14:18", COMMENT: "Historical extract", ID_FLOW_TYPE: "HIST", FLOW_TYPE_DESC: "Historical Extract", START_DATETIME: "15-Jun-2025 00:00", END_DATETIME: "29-Jun-2025 00:00", NUM_TAGS: "480" },
				{ REQ_ID: "3", ID_PLANT: "JON", PLANT: "Jonchez", ID_SOURCE: "S3", DATA_SOURCE: "DEV_EOL_SRC", REQUEST_TIMESTAMP: "29-Jun-2025 11:40", REQUESTOR: "Annalez", REQ_STATUS: "OH", REQ_STATUS_DESC: "On Hold", STATUS_TIMESTAMP: "29-Jun-2025 11:50", COMMENT: "Needs clarification", ID_FLOW_TYPE: "HIST", FLOW_TYPE_DESC: "Historical Extract", START_DATETIME: "01-Jun-2025 00:00", END_DATETIME: "28-Jun-2025 00:00", NUM_TAGS: "3,020" },
				{ REQ_ID: "4", ID_PLANT: "JON", PLANT: "Jonchez", ID_SOURCE: "S4", DATA_SOURCE: "GOLD_EOL_SRC", REQUEST_TIMESTAMP: "28-Jun-2025 16:30", REQUESTOR: "Berny", REQ_STATUS: "AP", REQ_STATUS_DESC: "Approved", STATUS_TIMESTAMP: "28-Jun-2025 16:45", COMMENT: "Historical extract", ID_FLOW_TYPE: "HIST", FLOW_TYPE_DESC: "Historical Extract", START_DATETIME: "01-Jun-2025 00:00", END_DATETIME: "27-Jun-2025 00:00", NUM_TAGS: "610" },
				{ REQ_ID: "5", ID_PLANT: "HOR", PLANT: "Horacio", ID_SOURCE: "S5", DATA_SOURCE: "MW21_EOL_SR", REQUEST_TIMESTAMP: "27-Jun-2025 09:10", REQUESTOR: "Horacio", REQ_STATUS: "AP", REQ_STATUS_DESC: "Approved", STATUS_TIMESTAMP: "27-Jun-2025 09:22", COMMENT: "Pilot run", ID_FLOW_TYPE: "HIST", FLOW_TYPE_DESC: "Historical Extract", START_DATETIME: "01-Jun-2025 00:00", END_DATETIME: "26-Jun-2025 00:00", NUM_TAGS: "95" },
				{ REQ_ID: "6", ID_PLANT: "NOU", PLANT: "Nouville", ID_SOURCE: "S6", DATA_SOURCE: "MW_DST_HW", REQUEST_TIMESTAMP: "26-Jun-2025 15:55", REQUESTOR: "Lucas", REQ_STATUS: "AP", REQ_STATUS_DESC: "Approved", STATUS_TIMESTAMP: "26-Jun-2025 16:05", COMMENT: "Historical extract pilot", ID_FLOW_TYPE: "HIST", FLOW_TYPE_DESC: "Historical Extract", START_DATETIME: "01-Jun-2025 00:00", END_DATETIME: "25-Jun-2025 00:00", NUM_TAGS: "1,802" },
				{ REQ_ID: "7", ID_PLANT: "FAN", PLANT: "Fanwica", ID_SOURCE: "S7", DATA_SOURCE: "PL_HIST_SRC", REQUEST_TIMESTAMP: "25-Jun-2025 13:45", REQUESTOR: "Fanwica", REQ_STATUS: "RJ", REQ_STATUS_DESC: "Rejected", STATUS_TIMESTAMP: "25-Jun-2025 13:55", COMMENT: "Invalid tag mapping", ID_FLOW_TYPE: "HIST", FLOW_TYPE_DESC: "Historical Extract", START_DATETIME: "01-Jun-2025 00:00", END_DATETIME: "24-Jun-2025 00:00", NUM_TAGS: "2,140" },
				{ REQ_ID: "8", ID_PLANT: "JON", PLANT: "Jonchez", ID_SOURCE: "S8", DATA_SOURCE: "SITE_DATA_HIST", REQUEST_TIMESTAMP: "24-Jun-2025 10:30", REQUESTOR: "Demo", REQ_STATUS: "PE", REQ_STATUS_DESC: "Pending", STATUS_TIMESTAMP: "24-Jun-2025 10:40", COMMENT: "Review in progress", ID_FLOW_TYPE: "HIST", FLOW_TYPE_DESC: "Historical Extract", START_DATETIME: "01-Jun-2025 00:00", END_DATETIME: "23-Jun-2025 00:00", NUM_TAGS: "760" }
			];
		}
	});
});
