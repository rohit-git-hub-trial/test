/*-----------------------------------------------------------------------------------
Streaming Engine - Pco Monitoring
Creation Date: 2020.06.01 / By: E0445955
Reference Document: 
Description:Used to monitor the pco agents
-------------------------------------------------------------------------------------*/
var oPcoMonitoringController;
var oDialog;
var bSelectedAgent;
var selectedAgentID;
var sTagsList;
var oResourceBundle;
sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageBox",
    "StreamingEngine/StreamingEngine/model/formatter",
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
], function (BaseController, MessageBox, formatter, MessageToast, Popover, Button, Dialog, Text) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.PcoMonitoring", {
       formatter: formatter,

/* ================= TAGS DIALOG (Fragment-based) ================= */
oTagsDialog: null,

mTagsDialog: {
    init: function () {
        var aAllTags = (sTagsList || "")
            .split(/\r?\n/)
            .filter(Boolean)
            .map(function (t) {
                return { tag: t, selected: false };
            });

        var oModel = this.oTagsDialog.getModel("TagsDialog");
        oModel.setData({
            showMismatchOnly: false,
	listMode: "None",
            all: aAllTags,
            mismatch: [],
            current: aAllTags,
            selectedDestination: "",
	selectedDigitalApp: "",
    	selectedTransformation: ""

        });

        this.mTagsDialog._loadDestinations.call(this);
        this.mTagsDialog._loadDigitalApps.call(this);
        this.mTagsDialog._resize.call(this, aAllTags.length);
    },

    onToggleMismatch: function () {
        var oModel = this.oTagsDialog.getModel("TagsDialog");
        var bMismatch = oModel.getProperty("/showMismatchOnly");

        if (!bMismatch) {
            oModel.setProperty("/current", oModel.getProperty("/all"));
	oModel.setProperty("/listMode", "None");
           // this.mTagsDialog._resize.call(this, oModel.getProperty("/all").length);
            return;
        }

        var that = this;
	
        $.ajax({
            url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PCoAgent/Query/GetMismatchTagsByAgentXacuteQuery&Content-Type=text/json",
            data: { "Param.1": selectedAgentID },
            success: function (res) {
                var rows = res?.Rowsets?.Rowset?.[0]?.Row || [];
                var aMismatch = rows.map(function (r) {
                    return {
                        tag: r.DISPLAY_NAME,
                        TAG_ID: r.ID_TAG,
                        selected: false
                    };
                });

                oModel.setProperty("/mismatch", aMismatch);
                oModel.setProperty("/current", aMismatch);
	    oModel.setProperty("/listMode", "MultiSelect");
              //  that.mTagsDialog._resize.call(that, aMismatch.length);
            }
        });
    },

    onDestinationChange: function (oEvent) {
        this.oTagsDialog
            .getModel("TagsDialog")
            .setProperty("/selectedDestination", oEvent.getSource().getSelectedKey());
    },
   onDigitalAppChange: function (oEvent) {
    var sDigitalApp = oEvent.getSource().getSelectedKey();
    var oTagsModel = this.oTagsDialog.getModel("TagsDialog");

    // Store selected Digital App
    oTagsModel.setProperty("/selectedDigitalApp", sDigitalApp);

    // Clear previous Transformation
    oTagsModel.setProperty("/selectedTransformation", "");
    this.oModelTransformations.setData({ Row: [] });

    // Load transformations for selected digital app
    this.mTagsDialog._loadTransformations.call(this, sDigitalApp);
},

    onApprove: function () {
	
    var oModel = this.oTagsDialog.getModel("TagsDialog");
    var sDest = oModel.getProperty("/selectedDestination");
    var sDigitalApp = oModel.getProperty("/selectedDigitalApp");
    var sTransformation = oModel.getProperty("/selectedTransformation");
	

 
  
   var oList = sap.ui.getCore().byId(
        this.getView().getId() + "--tagsList"
    );


 
    var aSelectedItems = oList.getSelectedItems();

    if (!sDest || aSelectedItems.length === 0) {
        sap.m.MessageBox.error(
            "Please select a destination and at least one tag."
        );
        return;
    }
    if (!sDigitalApp || !sTransformation) {
        sap.m.MessageBox.error(
            "Please select Digital App and Transformation."
        );
        return;
    }

 
    var sTagIdsCSV = aSelectedItems
        .map(function (oItem) {
            return oItem
                .getBindingContext("TagsDialog")
                .getObject()
                .TAG_ID;
        })
        .join(",");
	
    this.fnApplyTagMapping(sTagIdsCSV, sDest,sDigitalApp,sTransformation);
    this.oTagsDialog.close();
},

    onReject: function () {

var oList = sap.ui.core.Fragment.byId(
        this.getView().getId(),
        "tagsList"
    );


    var aSelectedItems = oList.getSelectedItems();

    if (aSelectedItems.length === 0) {
        sap.m.MessageBox.error(
            "Please select at least one tag to reject."
        );
        return;
    }

    var aSelectedTags = [];
    var aSelectedTagIds = [];

    aSelectedItems.forEach(function (oItem) {
        var oData = oItem
            .getBindingContext("TagsDialog")
            .getObject();

        aSelectedTags.push(oData.tag);
        aSelectedTagIds.push(oData.TAG_ID);
    });

    this.fnRejectTagSync(
        selectedAgentID,
        aSelectedTags,
        aSelectedTagIds
    );

    this.oTagsDialog.close();
},

    onCancel: function () {
        this.oTagsDialog.close();
    },

_loadDestinations: function () {
    var oDestModel = new sap.ui.model.json.JSONModel();
    this.oTagsDialog.setModel(oDestModel, "Dest");


    var that = this;
   $.ajax({
    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PCoAgent/Query/GetPlantIDByAgentIDSelectQuery&Content-Type=text/json",
    data: {
        "Param.1": selectedAgentID   // Using alert value
    },
    success: function (res1) {

        // Step 2: Extract Plant ID
        var sPlantID = "";
        if (res1.Rowsets && res1.Rowsets.Rowset && res1.Rowsets.Rowset[0].Row.length > 0) {
            sPlantID = res1.Rowsets.Rowset[0].Row[0].ID_PLANT;
        }

    $.ajax({
        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DataDestination/Query/PCoDestinationListAllPlantSelectQuery&Content-Type=text/json",
        data: {
            "Param.1": sPlantID
        },
        success: function (res) {
            var oData = res.Rowsets && res.Rowsets.Rowset
                ? res.Rowsets.Rowset[0]
                : { Row: [] };

            oDestModel.setData(oData);
            oDestModel.refresh();

            // AUTO-SELECT FIRST DESTINATION
            if (oData.Row && oData.Row.length > 0) {
                var sFirstKey = oData.Row[0].ID_PCO_DESTINATION;

                var oTagsModel = that.oTagsDialog.getModel("TagsDialog");
                oTagsModel.setProperty("/selectedDestination", sFirstKey);
            }
        }
    });
  }
});
},

_loadDigitalApps: function () {
    var that = this;

    // Clear existing selections
    that.oTagsDialog.getModel("TagsDialog").setProperty("/selectedDigitalApp", "");
    that.oTagsDialog.getModel("TagsDialog").setProperty("/selectedTransformation", "");
    that.oModelTransformations.setData({ Row: [] });

    $.ajax({
        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/UserProfile/Query/UserDigitalAppListSelectQuery&Content-Type=text/json",
        data: {
            "Param.1": document.getElementById("input-username").value
        },
        success: function (res) {
            var oData = (res.Rowsets && res.Rowsets.Rowset)
                ? res.Rowsets.Rowset[0]
                : { Row: [] };

            that.oModelDigitalApps.setData(oData);
            that.oModelDigitalApps.refresh();
        }
    });
},
_loadTransformations: function (sDigitalApp) {
    var that = this;

    if (!sDigitalApp) {
        that.oModelTransformations.setData({ Row: [] });
        return;
    }

    $.ajax({
        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/DigitalApp/Query/DigitalAppTransformationListSelectQuery&Content-Type=text/json",
        data: {
            "Param.1": sDigitalApp
        },
        success: function (res) {
            var oData = (res.Rowsets && res.Rowsets.Rowset)
                ? res.Rowsets.Rowset[0]
                : { Row: [] };

            that.oModelTransformations.setData(oData);
            that.oModelTransformations.refresh();
        }
    });
},


    _resize: function (iCount) {
        var h = Math.min(520, Math.max(200, 120 + iCount * 28));
        this.oTagsDialog.setContentHeight(h + "px");
    }
},
/* =============================================================== */
        onInit: function () {
            // set message manager model
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);

            oPcoMonitoringController = this;
            oDialog = this.getView().byId("BusyDialog");
            this.getView().byId("table-pco-monitoring").setModel(this.oModelPcoMonitoring);
            this.getView().byId("combobox-plant").setModel(this.oModelPlant);
	
 // NEW: run after items are rendered/updated
  var oTable = this.getView().byId("table-pco-monitoring");
  oTable.attachUpdateFinished(this._applyOrangeHighlight, this);

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("PcoMonitoring").attachPatternMatched(this._onObjectMatched, this);

        },

_applyOrangeHighlight: function () {
  var oTable = this.getView().byId("table-pco-monitoring");
  var aItems = oTable.getItems();

  aItems.forEach(function (oItem) {
    var ctx = oItem.getBindingContext();     // binding ctx of this row (path: /Row/N)
    if (!ctx) { return; }

    // Exact field name from your Xacute payload
    var status = ctx.getProperty("TAG_SYNC_STATUS");
    //console.log(status);
    // accept 1/'1'/true/'X' variants
    var shouldMark = (status === 1 || status === "1" || status === true || status === "X");

    // Toggle a CSS class on the ColumnListItem (<tr class="sapMListTblRow ...">)
    oItem.toggleStyleClass("seOrangeRow", shouldMark);
   
 // Add tooltip for highlighted rows
        if (shouldMark) {
            oItem.setTooltip("This agent has some changes. Please, review & sync.");
        } else {
            oItem.setTooltip(null); // remove tooltip if not highlighted
        }

  });
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
                this.getView().byId("page-pco-monitoring").setVisible(true);
                if (iAdminIndex > 0) this.getView().byId("button-restart-agent").setVisible(true);
                if(iUserIndex > 0) this.getView().byId("button-restart-agent").setVisible(true);
            }
            /***********************************************************************/
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },

        _onObjectMatched: function (oEvent) {
            oAppController.fnUpdate(this, oResourceBundle.getText("commonPCoMonitoringTitle"));
            this.fnResetSelection();
            oPcoMonitoringController.fnLoadPlant();
        },
        fnResetSelection: function () {
            bSelectedAgent = 0;
            sTagsList = "";
            this.getView().byId("button-tag-list").setEnabled(false);
            this.getView().byId("button-restart-agent").setEnabled(false);
            this.getView().byId("table-pco-monitoring").removeSelections();
            selectedAgentID = "";
        },
        oModelPcoMonitoring: new sap.ui.model.json.JSONModel(),
        oModelPlant: new sap.ui.model.json.JSONModel(),
        oModelDigitalApps: new sap.ui.model.json.JSONModel(),
        oModelTransformations: new sap.ui.model.json.JSONModel(),

        fnLoadPlant: function () {
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/Common/Query/PlantListSelectQuery&Content-Type=text/json",
                data: {
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError !== undefined) {
                        that.handleMessage(oResourceBundle.getText("commonPCoMonitoringTitle"),
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
                        oPcoMonitoringController.oModelPlant.setData(data);
                        oPcoMonitoringController.oModelPlant.refresh();
                        oPcoMonitoringController.getView().byId("combobox-plant").setSelectedKey("%");
                        oPcoMonitoringController.fnLoadPcoMonitoring();
                    }
                }
            });
        },
        fnSelectionChanged: function (oEvent) {
            bSelectedAgent = 1;
            this.getView().byId("button-tag-list").setEnabled(true);
            this.getView().byId("button-restart-agent").setEnabled(true);
            var selectedItem = oEvent.getParameter("listItem").getBindingContext().getObject();

            selectedAgentID = selectedItem.ID_AGENT;
            sTagsList = selectedItem.TAG_LIST.replace(/,/g, '\n');
        },
fnApplyTagMapping: function (sTagId, sDestinationId,sDigitalApp,sTransformation) {
    var that = this;
    var sUser = document.getElementById("input-username").value || "";
	console.log("sTagId value:", sTagId, "type:", typeof sTagId);
    $.ajax({
        url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogUpdateAfterSynchronizationSEPCoXacuteQuery&Content-Type=text/json",
        data: {
            "Param.1": sTagId,          // Tag ID
            "Param.2": sDestinationId,  // PCo Destination
            "Param.3": sDigitalApp,  // Digital App
	"Param.4": sTransformation,  // Transformation
        },
       success: function (result) {

    // 1. Check for FatalError first (same as before)
    if (result.Rowsets && result.Rowsets.FatalError) {
        that.handleMessage(
            "PCo Monitoring",
            "Failed to apply tag mapping",
            result.Rowsets.FatalError,
            "Error"
        );
        return;
    }

    // 2. Extract all <Output> rows from Xacute transaction
    var aRows = [];
    try {
        aRows = result.Rowsets.Rowset[0].Row || [];
    } catch (e) {
        aRows = [];
    }

    // 3. Collect each <Output> message into a clean array
    var aMessages = aRows.map(function (r) {
        return r.Output || "";
    });

    // 4. Build ONE multi-line message string
    var sMessageText = aMessages.join("\n");

    // 5. Choose message type: Success if no FAILURE found
    var bHasFailure = aMessages.some(function (m) {
        return m.toUpperCase().includes("FAILURE");
    });
    var sType = bHasFailure ? "Error" : "Success";

    // 6. Display the dynamic server message
    that.handleMessage(
        "PCo Monitoring",
        "Tag Mapping Result",
        sMessageText,
        sType
    );
},
        error: function (xhr) {
            that.handleMessage(
                "PCo Monitoring",
                "Failed to apply tag mapping",
                xhr.responseText,
                "Error"
            );
        }
    });
},
/**
 * Reject selected mismatch tags for an agent:
 *  - Builds InputTagsXML with <TagID> and <TagName>
 *  - Calls Xacute: StreamingEngine/TagCatalog/Query/TagCatalogResetTagsXacuteQuery
 *  - Passes { InputTagsXML, Comment="Mismatched" }
 *
 * @param {string} sAgentId          Selected Agent ID (kept for audit/log; not sent unless needed)
 * @param {string[]} aSelectedTags   Array of Tag Names (Display)
 * @param {string[]} aSelectedTagIds Array of Tag IDs (same length/order as aSelectedTags)
 */
fnRejectTagSync: function (sAgentId, aSelectedTags, aSelectedTagIds) {
  var that = this;

  // ------------- Guard checks -------------
  if (!Array.isArray(aSelectedTags) || !Array.isArray(aSelectedTagIds) ||
      aSelectedTags.length === 0 || aSelectedTagIds.length === 0 ||
      aSelectedTags.length !== aSelectedTagIds.length) {
    that.handleMessage(
      "PCo Monitoring",
      "Reject: invalid selection set (names/ids mismatch).",
      "",
      "Error"
    );
    return;
  }

  // ------------- Build InputTagsXML -------------
  var sInputXml = this._buildTagsXml(aSelectedTags, aSelectedTagIds);

  // OPTIONAL: log for debugging
  // console.log("Reject InputTagsXML:\n" + sInputXml);

  // ------------- Busy -------------
  if (typeof oDialog !== "undefined" && oDialog && oDialog.open) { oDialog.open(); } // uses your BusyDialog from the view [2](https://sanofi-my.sharepoint.com/personal/rohit_dwivedi_sanofi_com/Documents/Microsoft%20Copilot%20Chat%20Files/PcoMonitoring.view.xml)

  // ------------- Call the Xacute query -------------
  $.ajax({
    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/TagCatalog/Query/TagCatalogResetTagsXacuteQuery&Content-Type=text/json",
    // If your transaction expects named inputs, keep as below.
    // If it expects positional Param.1 / Param.2, use the commented version.
    data: {
      "Param.1": sInputXml,
      "Param.2": "Mismatched"
      // --- If your Xacute expects positional params, use this instead: ---
      // "Param.1": sInputXml,
      // "Param.2": "Mismatched"
    },
    method: "GET",
    success: function (result) {
      var sOut = "";

      // Try to extract OutputXML if returned
      try {
        if (result && result.Rowsets && result.Rowsets.Rowset && result.Rowsets.Rowset[0]) {
          var rs = result.Rowsets.Rowset[0];
          if (rs.Row && rs.Row[0]) {
            sOut = rs.Row[0].OutputXML || "";
          }
        }
      } catch (e) {
        // ignore extraction failures; sOut stays ""
      }

      // Show success message with optional OutputXML in details
      that.handleMessage(
        "PCo Monitoring",
        "Tags reset submitted (Reject).",
        sOut,
        "Success"
      ); 

      if (typeof oDialog !== "undefined" && oDialog && oDialog.close) { oDialog.close(); }
      // Optionally refresh the table after reject:
      // that.fnLoadPcoMonitoring(); 
    },
    error: function (xhr) {
      that.handleMessage(
        "PCo Monitoring",
        "Failed to submit Reject for selected tags.",
        xhr && xhr.responseText ? xhr.responseText : "",
        "Error"
      );
      if (typeof oDialog !== "undefined" && oDialog && oDialog.close) { oDialog.close(); }
    }
  });
},

/**
 * Helper: Build the XML payload for Xacute input
 * <?xml version="1.0" encoding="UTF-8"?><Tags>
 *   <Tag><TagID>...</TagID><TagName>...</TagName></Tag>
 *   ...
 * </Tags>
 */
_buildTagsXml: function (aNames, aIds) {
  function xmlEscape(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  var parts = ['<?xml version="1.0" encoding="UTF-8"?>', '<Tags>'];
  for (var i = 0; i < aIds.length; i++) {
    parts.push(
      "<Tag>",
        "<TagID>",   xmlEscape(aIds[i]),   "</TagID>",
        "<TagName>", xmlEscape(aNames[i]), "</TagName>",
      "</Tag>"
    );
  }
  parts.push("</Tags>");
  return parts.join("");
},
fnViewTagsList: function () {
    if (bSelectedAgent !== 1) {
        return;
    }

    if (!this.oTagsDialog) {
        this.oTagsDialog = sap.ui.xmlfragment(
            this.getView().getId(),
            "StreamingEngine.StreamingEngine.fragment.TagsListDialog",
            this
        );

        this.getView().addDependent(this.oTagsDialog);

        this.oTagsDialog.setModel(
            new sap.ui.model.json.JSONModel(),
            "TagsDialog"
        );
	
    this.oTagsDialog.setModel(this.oModelDigitalApps, "DigitalApps");
    this.oTagsDialog.setModel(this.oModelTransformations, "Transformations");

    }

    this.mTagsDialog.init.call(this);
    this.oTagsDialog.open();
},

_resizeTagsDialog: function (iCount) {
    var BASE_HEADER_FOOTER = 120;
    var ROW_HEIGHT = 28;
    var MIN_HEIGHT = 200;
    var MAX_HEIGHT = 520;
    var WIDTH = 520;

    var computed = BASE_HEADER_FOOTER + (Math.max(iCount, 1) * ROW_HEIGHT);
    var height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, computed));

    if (this._oTagsDialog) {
        this._oTagsDialog.setContentHeight(height + "px");
        this._oTagsDialog.setContentWidth(WIDTH + "px");
    }
},
        fnRestartAgent: function () {
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
                        oPcoMonitoringController.fnRestartAgentSubmit();
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
        fnRestartAgentSubmit: function () {
            oDialog.open();
            var that = this;
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PCoAgent/Query/AgentRestartXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": selectedAgentID
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonPCoMonitoringTitle"),
                            oResourceBundle.getText("pcoMonitoringRestartAgent"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        oPcoMonitoringController.fnLoadPcoMonitoring();
                    }
                },
                error: function () {
                }
            });
        },
        fnLoadPcoMonitoring: function () {
            oDialog.open();
            this.fnResetSelection();
            var inputPlantId = oPcoMonitoringController.getView().byId("combobox-plant").getSelectedKey();
            var that = this;
	
	
            $.ajax({
                url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/PCoAgent/Query/AgentMonitoringListXacuteQuery&Content-Type=text/json",
                data: {
                    "Param.1": inputPlantId,
                    "Param.20": document.getElementById("SE_Plant").value
                },
                success: function (result) {
                    if (result.Rowsets.FatalError) {
                        var sErrorMessage = result.Rowsets.FatalError;
                        //MessageToast.show(sErrorMessage);
                        that.handleMessage(oResourceBundle.getText("commonPCoMonitoringTitle"),
                            oResourceBundle.getText("pcoMonitoringLoadPcoMonitoringList"),
                            sErrorMessage,
                            "Error");
                        oDialog.close();
                    } else {
                        var data = result.Rowsets.Rowset[0];
                        oPcoMonitoringController.oModelPcoMonitoring.setData(data);
                        oPcoMonitoringController.oModelPcoMonitoring.refresh();
		
//  DEBUG LOGS: CHECK TAG_SYNC_STATUS IN UI MODEL 
    

                        oDialog.close();
                    }
                }
            });
        },

        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");

        }
    });
});