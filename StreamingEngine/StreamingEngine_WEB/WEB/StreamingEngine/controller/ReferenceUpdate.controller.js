/*-----------------------------------------------------------------------------------
Streaming Engine - Contextual Flows
Creation Date: 2020.05.04 / By: E0445955
Reference Document: 
Description:This page is used to bulk upload tags configuration through a csv file. It displays 
the progress of upload into the database and Processing progress as well
-------------------------------------------------------------------------------------*/
var oReferenceUpdateController;
var iNoofRecords;
var iInsertedRecords;
var fPercentValue;
var oFileUploader;
var oComboBox;
var oDialog;
var oResourceBundle;
var flagAbort = false;
var bShowCommentDialog = true;
sap.ui.define([
    "../controller/BaseController",
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/m/MessageBox",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
    "StreamingEngine/StreamingEngine/model/formatter"
], function (BaseController, MessageToast, Popover, MessageBox, Button, Dialog, Text, formatter) {
    "use strict";

    return BaseController.extend("StreamingEngine.StreamingEngine.controller.ReferenceUpdate", {
        formatter: formatter,
        onInit: function () {
oFileUploader = this.getView().byId("fileUploader");
oReferenceUpdateController = this;
  var oMessageManager = sap.ui.getCore().getMessageManager();
            var oView = this.getView();
            oView.setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(oView, true);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ReferenceUpdate").attachPatternMatched(this._onObjectMatched, this);
            oComboBox = this.getView().byId("Combobox-TableType");
oDialog = this.getView().byId("BusyDialog");
         var oVisibilityObject = {
                "FileUploader": false,
               
            }
              this.oFieldsVisibilityModel = new sap.ui.model.json.JSONModel(oVisibilityObject);
            this.getView().setModel(this.oFieldsVisibilityModel, "FieldsVisibility");
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
                this.getView().byId("page-Reference-upload").setVisible(true);
            }
            /***********************************************************************/
        },
        _onObjectMatched: function (oEvent) {
          oAppController.fnUpdate(this, oResourceBundle.getText("commonTitleReferenceUpdate"));
        },
        fnShowNoAccess: function () {
            var thisRouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisRouter.navTo("NoAccess");
        },

         fnUploaderVisibility: function (bVisible) {
           
               this.oFieldsVisibilityModel.setProperty("/FileUploader", bVisible)
           
            
        },
        OnChangeTableType: function (oEvent) {
    var oValidatedComboBox = oEvent.getSource(),
        sSelectedKey = oValidatedComboBox.getSelectedKey(),
        sValue = oValidatedComboBox.getValue();

    switch (sSelectedKey) {
        case "UoM":
            // Example: show uploader and maybe do something specific for UoM
            this.fnUploaderVisibility(true);
            break;

        case "DigitalApps":
            // Example: hide uploader or perform a specific logic
            this.fnUploaderVisibility(true);
            break;

        case "TagNames":
            this.fnUploaderVisibility(true);
            break;

        case "HierarchyTrigrams":
            this.fnUploaderVisibility(true);
            break;

        default:
            this.fnUploaderVisibility(false);
            break;
    }
},


        fnUploadFile: function () {
            var sImportWaitMessage = oResourceBundle.getText("tagUploadImportMessage");
            var sNoFileSelected = oResourceBundle.getText("tagUploadSelectCSV");
            var sWrongFileSelected = oResourceBundle.getText("tagUploadWrongFileFormat");
            oDialog.open();
            oDialog.setText(sImportWaitMessage);
            iNoofRecords = 0;
            var file = jQuery.sap.domById(oFileUploader.getId() + "-fu").files[0];
            if (!file) {
                MessageToast.show(sNoFileSelected);
                oDialog.close();
                return;
            }
            var a = file.name;

            var len = (a.split(".").length) - 1;

            if ((a.split(".")[len].toLowerCase()) != "csv") {
                MessageToast.show(sWrongFileSelected);
                oDialog.close();
                oFileUploader.setValue("");
                return;
            }

            

            // var BASE64_MARKER = 'data:' + file.type + ';base64,';
            var BASE64_MARKER = ';base64,';

            this.fnPostData(file, BASE64_MARKER);
        },

        fnPostData: function (file, BASE64_MARKER) {
            var reader = new FileReader();
            var that = this;
            reader.onload = function (evt) {
                var base64Index = evt.target.result
                    .indexOf(BASE64_MARKER) + BASE64_MARKER.length;

                var sBase64Encoded = evt.target.result.substring(base64Index);
                var sBase64Decoded = atob(sBase64Encoded);
                var sURIEncoded = encodeURI(sBase64Decoded);
                var lines = sBase64Decoded.split(/\n/).length;
                var sPlant = document.getElementById("SE_Plant").value;
                var sTable = oComboBox.getSelectedKey();
                $.ajax({
                    url: "/XMII/Illuminator?QueryTemplate=StreamingEngine/ReferenceUpdate/Query/ReferenceUpdateXacuteQuery&Content-Type=text/json",
                    type: "POST",
                    data: {
                        "Param.1": sURIEncoded,
                        "Param.2": sTable
                    },
                    success: function (result) {
                        if (result.Rowsets.FatalError) {
                            var sErrorMessage = result.Rowsets.FatalError;
                           oReferenceUpdateController.handleMessage(oResourceBundle.getText("commonTitleReferenceUpdate"),
                                oResourceBundle.getText("Referenceupdatefailed"),
                                sErrorMessage,
                                "Error");
                            
                        } else {
var successMsg = result.Rowsets.Rowset[0].Row[0].ReturnMessage;
 oReferenceUpdateController.handleMessage(oResourceBundle.getText("commonTitleReferenceUpdate"),
                            oResourceBundle.getText("Referenceupdatesuccess"),
                            successMsg,
                            "Success");
    
}
                    },
                    
                });
oDialog.close();
                oFileUploader.setValue("");
            };

            if (file) {
                reader.readAsDataURL(file);
            }
        },
      
       fnDownloadTemplate: function () {
    var sSelectedKey = this.byId("Combobox-TableType").getSelectedKey();
    var url =
        "/XMII/Illuminator?QueryTemplate=StreamingEngine/ReferenceUpdate/Query/ReferenceUpdateCSVTemplateXacuteQuery" +
        "&Content-Type=text/csv" +
        "&RowCount=200000" +
        "&Param.1=" + encodeURIComponent(sSelectedKey);
    
    var url_encoded = encodeURI(url);
    window.open(url_encoded, "_blank");
},
     


      



        fnNavigateBack: function () {
            var thisrouter = sap.ui.core.UIComponent.getRouterFor(this);
            thisrouter.navTo("Launchpad");
        },
        
        

    });
});
//# sourceURL=https://sapdqnjc.pharma.aventis.com:50001/XMII/CM/StreamingEngine/StreamingEngine/controller/ReferenceUpdate.controller.js?eval