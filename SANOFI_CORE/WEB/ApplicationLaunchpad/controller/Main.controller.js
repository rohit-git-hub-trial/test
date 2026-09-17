sap.ui.controller("Sanofi.ApplicationLaunchpad.controller.Main", {

/**
* Called when a controller is instantiated and its View controls (if available) are already created. 
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf componentexample.Main
*/
	onInit: function() {

		this.appComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this.getView()));
		this.appData = this.appComponent.getAppGlobalData();
		this.interfaces = this.appComponent.getODataInterface();
		this.router = sap.ui.core.UIComponent.getRouterFor(this);
		this.getView().addStyleClass("oeeComponent");

		this.initializeAppInfo();

	},
	
	updateHelpLinks : function(oEvent){
		var oName = oEvent.getParameter("name"); 
		var oArgument;
		var activityID = "";
        if (oName === "activity") {
  			oArgument = oEvent.getParameter("arguments");
  			if(oArgument != undefined){
  				activityID = oArgument.activityId;
  			}
        }

        var urlToHelpLink = sap.oee.ui.Utils.getHelpLink(activityID);

		this.appData.setCurrentOEEHelpLink(urlToHelpLink);
	},

	refreshOrderDetails : function(channelId, eventId, data){
		   if(eventId === "refreshOrderDetails"){
				this.setSelectedOrderDetails(this.appData.selected.runID);
		   }
	},
	
	openOrderChangePopover : function(channelId, eventId, data){
		   if(eventId === "openOrderChangePopover"){
			   if(data != undefined){
				   this.handleOrderChange();
			   }
		   }
	  },
	  handleCloseButton: function (oEvent) {
	      this.oPopOver.close();
	  },
	  
	  orderSearch : function(oEvent){
		    var properties = [];
			properties.push("order");
			properties.push("routingOperNo");
			properties.push("statusDescription");
			properties.push("material_desc");
			properties.push("productionActivity");

			sap.oee.ui.Utils.fuzzySearch(this,this.oPopOver.getModel(),oEvent.getParameter("value"),
					this.oPopOver.getBinding("items"),oEvent.getSource(),properties);
	  },

	  selectOrder : function(oEvent){
		var oSource = oEvent.getParameter("selectedItem");
		if(oSource != undefined){
		  	var sRunID = oSource.getBindingContext().getProperty("runID");
		  	if(sRunID != undefined){
		  		this.appComponent.getEventBus().publish(this.appComponent.getId(), "orderChange",{runID : sRunID});
		  	}
		}
	  },
	  
	  openDetailsHandler : function(channelId,eventId,data){
		  if (eventId === "openDetailsHandler") {
			  this.detailsHandler(data);
		  }
	  },
	  
	  detailsHandler : function(data){
		  var prodRunData;
		  
		  this._detailsDialogPayload = data;
		  
		  var prodRunData = this.getProductionRunDataBasedOnOrderDependency(this._detailsDialogPayload);
		  
		  if(prodRunData.details != undefined && prodRunData.details.results != undefined){
			  if(!data.impactsLineVisibility){
					data.impactsLineVisibility = false ;
				}
		        var oModel = new sap.ui.model.json.JSONModel({ 
		        	firstColumnHeader : data.description,
		        	dcElement : data.dcElement,
		        	prodList : prodRunData.details.results,
		        	isLossType : data.isLossType,
		        	refreshMethodToInvoke : data.dataRefreshMethod,
		        	oContextOfController : data.oMainController,
		        	data : data.isOrderIndependent,
		        	impactsLineVisibility:data.impactsLineVisibility});

		        if(this.detailsDialog == undefined){
		        	this.detailsDialog = sap.ui.xmlfragment("detailsTableFragment","sap.oee.ui.fragments.showDetailsRecords",this);
			        this.getView().addDependent(this.detailsDialog);
		        }
		        this.detailsDialog.setModel(oModel);
		    }
		    this.detailsDialog.open();
	  },
	  
	  getProductionRunDataBasedOnOrderDependency : function(dataPayload){
		  var dcElement = dataPayload.dcElement,isOrderIndependent = dataPayload.isOrderIndependent,runForDataRetreival = dataPayload.runForDataRetreival,nodeId = dataPayload.nodeId;
		  var timeInterval = dataPayload.timeInterval,shiftDetailsForOrderIndependentData = dataPayload.shiftDetailsForOrderIndependentData,isMachineDataCollection = dataPayload.isMachineDataCollection;
		  
		  //For Order Independent Data Retrieval
		  if(isOrderIndependent){
			  if(shiftDetailsForOrderIndependentData == undefined){
				  return this.interfaces.interfacesGetOrderIndependentDataCollection(this.appData.client,this.appData.plant, this.appData.shift.shiftID, this.appData.node.nodeID,this.appData.shift.shiftGrouping,this.appData.shift.startTimestamp,this.appData.shift.endTimestamp,[{dcElement : dcElement, client : this.appData.client}]);
			  }else{
				  //If Shift is different from current shift pass parameters for it used in case of standalone revieworder/shift for example
				  return this.interfaces.interfacesGetOrderIndependentDataCollection(this.appData.client,this.appData.plant, shiftDetailsForOrderIndependentData.shiftID, this.appData.node.nodeID,shiftDetailsForOrderIndependentData.shiftGrouping,shiftDetailsForOrderIndependentData.startTimestamp,shiftDetailsForOrderIndependentData.endTimestamp,[{dcElement : dcElement, client : this.appData.client}]);
			  }
		  }else if(isMachineDataCollection){
			  var runs = [];
			  if(runForDataRetreival != undefined){
				  runs = [{runID : runForDataRetreival}];
			  }else{
				 if(this.appData.selected.runID != undefined){
					 runs = [{runID : this.appData.selected.runID}];
				  }
			  }
				  return this.interfaces.interfacesGetDataCollectionForNodeAndRunAndDcElementAndTimePeriod(runs,nodeId,[{dcElement : dcElement, client : this.appData.client}],timeInterval.startTimestamp,timeInterval.endTimestamp,false);
			  }
		//If Time Interval based data needed use timeInterval Passed
			  else if(timeInterval != undefined){
					  return this.interfaces.getProductionRunDataForRunAndDcElemsAndTimeInterval([{dcElement : dcElement, client : this.appData.client}], timeInterval);
			  }
			  else{
				  var selectedRunID = this.appData.selected.runID; 
				  if(runForDataRetreival != undefined){
					  //If Data Retrieval needed is not for selected/current order use this parameter runForDataRetreival.
					  selectedRunID = runForDataRetreival;
				  }

				  return this.interfaces.getProductionRunDataForAnyRunAndDcElems([{dcElement : dcElement}],selectedRunID,dataPayload.materialList); // Material List is passed only if needed (optional parameter).
			  }
	  },
	  
	  onSelectEnableDeleteButton : function(){
			var oDetailsTable = sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","detailsTable"));
			if(oDetailsTable.getSelectedItems().length > 0){
				sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","deleteButton")).setEnabled(true);
			} else {
				sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","deleteButton")).setEnabled(false);
			}
	  },
	  
	  handleCancel : function(oEvent){
			if(this.detailsDialog != undefined){
				sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","detailsSearchField")).setValue("");
				sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","deleteButton")).setEnabled(false);
				this._selectedProdRunData = undefined;
			}
		    oEvent.getSource().getParent().close();
	  },
	  
	  onClickReasonCode : function(oEvent) {
			var reasonCodeLink = oEvent.getSource();
			this._selectedProdRunData = oEvent.getSource().getBindingContext().getObject();
			
			var reasonCodeAttachedCallback = jQuery.proxy(this.reasonCodeAttached,this);
			sap.oee.ui.rcUtility.createReasonCodeToolPopup( 
					this, reasonCodeLink, this.appData.client, this.appData.plant, 
					this.appData.node.nodeID, this._selectedProdRunData.dcElement, this._selectedProdRunData,
			        'reasonCode',undefined,reasonCodeAttachedCallback);
		},
		
		reasonCodeAttached : function(){
			if(this._selectedProdRunData.reasonCode != undefined){ // He hasn't skipped assignment.
				var updatedData = this.interfaces.interfacesUpdateDataCollection(this.appData.client,[this._selectedProdRunData]); // Update Data Collection
				var oDetailsTable = sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","detailsTable"));
		        var data = this.detailsDialog.getModel().getData();
				var aSelectedContextObjects = oDetailsTable.getSelectedContexts();
				if(updatedData != undefined){
					if(updatedData.entryID != undefined){
						oDetailsTable.removeSelections(true);
						var prodRunData = this.getProductionRunDataBasedOnOrderDependency(this._detailsDialogPayload);
					    if(prodRunData.details != undefined && prodRunData.details.results != undefined){
					    	data.prodList = prodRunData.details.results;
							this.detailsDialog.getModel().setData(data);
					    }
			            this.detailsDialog.getModel().checkUpdate(); 
			            this.detailsDialog.rerender();
			            this._selectedProdRunData = undefined;
			            if(data.refreshMethodToInvoke != undefined && data.oContextOfController != undefined){
			            	if(typeof data.refreshMethodToInvoke == 'function'){
			            		data.refreshMethodToInvoke.call(data.oContextOfController);
			            	}
			            }
			        }
			    }
			}
		},
		
		onClickAddComments : function(oEvent){  
			this._selectedProdRunData  = oEvent.getSource().getBindingContext().getObject();
			
			if(this.oCommentsDialog == undefined){
				this.oCommentsDialog = sap.ui.xmlfragment("detailsCommentPopup","sap.oee.ui.fragments.commentPopup", this);
		        this.getView().addDependent(this.oCommentsDialog);
		    }
			var commentBox = sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsCommentPopup","comment"));
		    commentBox.setValue(""); // Clear 
		    
		    if(this._selectedProdRunData  != undefined){
		    	if(this._selectedProdRunData .comments != ""){
		    		commentBox.setValue(this._selectedProdRunData.comments);
				}
			}
		    
			this.oCommentsDialog.open();
		},
		
		onCommentDialogCancelButton : function(oEvent){
			this._selectedProdRunData  = undefined;
			this.oCommentsDialog.close();
		},
		
		onCommentDialogSaveButton : function(oEvent){
		    var oCommentBox = sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsCommentPopup","comment"));
		    
		    if(this._selectedProdRunData){
			    this._selectedProdRunData.comments = oCommentBox.getValue();
		    	var updatedData = this.interfaces.interfacesUpdateDataCollection(this.appData.client,[this._selectedProdRunData]); // Update Data Collection
				var oDetailsTable = sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","detailsTable"));
		        var data = this.detailsDialog.getModel().getData();
				var aSelectedContextObjects = oDetailsTable.getSelectedContexts();
				if(updatedData != undefined){
					if(updatedData.entryID != undefined){
						oDetailsTable.removeSelections(true);
						var prodRunData = this.getProductionRunDataBasedOnOrderDependency(this._detailsDialogPayload);
					    if(prodRunData.details != undefined && prodRunData.details.results != undefined){
					    	data.prodList = prodRunData.details.results;
							this.detailsDialog.getModel().setData(data);
					    }
			            this.detailsDialog.getModel().checkUpdate(); 
			            this.detailsDialog.rerender();
			            this._selectedProdRunData = undefined;
			            data.refreshMethodToInvoke.call(data.oContextOfController);
			        }
			    }
		    }
		    
		    this.oCommentsDialog.close();
		    
		},
		
	    handleDeletion : function(oEvent){
			var oController = this.getView().getController();
			var deleteAfterConfirm = function(bConfirm){
				if(bConfirm == sap.m.MessageBox.Action.OK){
					var oDetailsTable = sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","detailsTable"));
		            var data = oController.detailsDialog.getModel().getData();
					var aSelectedContextObjects = oDetailsTable.getSelectedContexts();
					var response = oController.interfaces.interfacesDeleteDataCollection(sap.oee.ui.Utils.convertContextToJSONObjects(aSelectedContextObjects));
				    if(response != undefined){
						if(response.outputCode == 0){
							oDetailsTable.removeSelections(true);
							var matchedList = $.grep(data.prodList,function(element,elementindex){var i;for(i in aSelectedContextObjects){var entryID = aSelectedContextObjects[i].getObject().entryID; if(element.entryID === entryID)return false;else continue;}return true;});
							if(matchedList.length == 0){
								oController.detailsDialog.close();
							}
							
							var oModelData = oController.detailsDialog.getModel().getData();
							oModelData.prodList = matchedList;
							oController.detailsDialog.getModel().setData(oModelData);
				            oController.detailsDialog.getModel().checkUpdate(); 
				            oController.detailsDialog.rerender();
				            data.refreshMethodToInvoke.call(data.oContextOfController);
				        }
				    }
				    if(oDetailsTable.getSelectedItems().length > 0){
						sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","deleteButton")).setEnabled(true);
					} else {
						sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","deleteButton")).setEnabled(false);
					}
				}
			};
			
			sap.m.MessageBox.confirm(this.appComponent.oBundle.getText("OEE_MESSAGE_DELETE"),deleteAfterConfirm);
		},

	  handleOrderChange : function(){ 
	  	var ordersModel = new sap.ui.model.json.JSONModel();
	  	var outputOrderStatusList = this.interfaces.interfacesGetOrderStatusForRunsStartedInShiftInputSync(this.appData.node.nodeID,this.appData.client,this.appData.plant,this.appData.shift.shiftID,this.appData.shift.shiftGrouping,this.appData.shift.startTimestamp,this.appData.shift.endTimestamp,false);
	  	if(outputOrderStatusList != undefined){
	  		if(outputOrderStatusList.orderStatusList != undefined){
	  			if(outputOrderStatusList.orderStatusList.results != undefined){
	  				if(outputOrderStatusList.orderStatusList.results.length != 0){
	  					ordersModel.setData({orders : outputOrderStatusList.orderStatusList.results});
	  				}
	  			}
	  		}
	  	}
	  	
	  	if(this.oPopOver == undefined){
	  		this.oPopOver = sap.ui.xmlfragment("popover","sap.oee.ui.fragments.orderChangeDialog",this);
	  		this.oPopOver.setTitle(this.appComponent.oBundle.getText("OEE_HEADING_SELECT_ORDER"));
	  	  	var buttonTemplate = new sap.m.ObjectListItem({title : "{parts : [{path: 'order'},{path: 'routingOperNo'}], formatter : 'sap.oee.ui.Formatter.formatOrderNumber'}",attributes : [new sap.m.ObjectAttribute({text : "{material_desc}"}),new sap.m.ObjectAttribute({text : "{parts : [{path: 'orderStartTimestamp'},{path: 'appData>/plantTimezoneOffset'},{path : 'appData>/plantTimezoneKey'}], formatter : 'sap.oee.ui.Formatter.formatTimeStampWithoutLabel'}"})],type : "Active",firstStatus : new sap.m.ObjectStatus({text:"{parts : [{path: 'statusDescription'},{path: 'productionActivity'}], formatter : 'sap.oee.ui.Formatter.formatStatusTextAndActivity'}"})});
	  	  	 
	  	  	this.oPopOver.bindAggregation("items","/orders",buttonTemplate);
	  	  	this.oPopOver.attachConfirm(this.selectOrder,this);
	  	    this.oPopOver.attachSearch(this.orderSearch,this);
	  	    this.oPopOver.attachLiveChange(this.orderSearch,this);
	  	}
	  	
	  	this.oPopOver.setModel(ordersModel);
	  	this.oPopOver.open();
	  },

	  handleShiftChange : function(channelId, eventId, data){
		if (eventId === "shiftChange") {
			var fromOrder = this.appData.selected.order.orderNo;
			var fromOperation = this.appData.selected.operationNo;
			this.appComponent.getEventBus().publish(this.appComponent.getId(), "clearOrderContext");
			sap.oee.ui.Utils.setShiftInformationForApplication(data.shiftInfoJSON,this.appData,this.appComponent.getModel("appData"));
			this.setInitialOrderInformationIfAny(fromOrder, fromOperation);
			if(this.router.oHashChanger.getHash() === ""){
			    this.appComponent.getEventBus().publish(this.appComponent.getId(), "refreshPOD"); // Refresh POD Again If on  Home Screen
			}
		}
		
	    this.appComponent.getEventBus().publish(this.appComponent.getId(), "shiftChanged");
	},
	
	setSelectedOrderDetails : function(sRunID){
		  	if(sRunID != undefined){
			    var orderStatusJSON =  this.interfaces.interfacesGetOrderStatusForListOfRunsInputSync([sRunID]);
				
			    if(orderStatusJSON.orderStatusList !=undefined && orderStatusJSON.orderStatusList.results != undefined && orderStatusJSON.orderStatusList.results.length > 0){
			    	var selectedOrderDetailsJSON = orderStatusJSON.orderStatusList.results[0];
			    	if(this.appData.defaultUom != null){
			    		   if(this.appData.defaultUom.value == sap.oee.ui.oeeConstants.uomType.productionUom){
			    			   selectedOrderDetailsJSON.quantityReleasedUOMText = selectedOrderDetailsJSON.productionUOMDesc;
			    			   selectedOrderDetailsJSON.quantityReleased = selectedOrderDetailsJSON.productionUomQuantity;
			    			   selectedOrderDetailsJSON.totalQuantityProducedInRun = selectedOrderDetailsJSON.totalQuantityProducedInProductionUomInRun; 
			    			   selectedOrderDetailsJSON.totalProducedQuantity = selectedOrderDetailsJSON.totalProducedInProductionUom; 
			    			   selectedOrderDetailsJSON.totalRemainngQuantity = selectedOrderDetailsJSON.totalRemainingQuantityInProductionUom;
			    			   selectedOrderDetailsJSON.totalRejectedQuantity = selectedOrderDetailsJSON.totalRejectedQuantityInProductionUom;
			    		   }
			    		}
			    		if(!selectedOrderDetailsJSON.quantityReleasedUOMText)
			    			selectedOrderDetailsJSON.quantityReleasedUOMText = selectedOrderDetailsJSON.quantityReleasedUOMDesc;
			    		
			    		selectedOrderDetailsJSON.timeUom = this.interfaces.interfacesGetTextForUOM(selectedOrderDetailsJSON.timeUom);
			    	}  
			    	
			    this.appData.setSelectedOrderDetails(selectedOrderDetailsJSON);
			    sap.oee.ui.Utils.updateModel(this.appComponent.getModel("appData"));
		  	 }
	},

	changeOrder : function(channelId, eventId, data){
		   if(eventId === "orderChange"){
				this.appComponent.getEventBus().publish(this.appComponent.getId(), "clearOrderContext");
				this.appData.PHNodeDataForDowntimeScreen = undefined; //clear cached Plant Hierarchy Node Details for Downtime Screen
			    var sRunID = data.runID;
				if(sRunID != undefined){
				    this.setSelectedOrderDetails(sRunID);
				    if(this.router.oHashChanger.getHash() == ""){
				    	   this.appComponent.getEventBus().publish(this.appComponent.getId(), "refreshPOD"); // Refresh POD Again If on Home Screen
				    }
				    this.appComponent.getEventBus().publish(this.appComponent.getId(), "orderChanged");
				}
		   }
	},
	   
	checkForAlerts : function(){
		   var parameters = {"service":"alert","mode":"GetAlerts","content-type":"text/json","containerPropertyName":"nodeId,nodeId,Success","containerPropertyValue":"*;"+this.appData.node.nodeID+";True"};
		   var result = null;
		   var oController = this.getView().getController();
		   oController.latestAlertIDs = [];
		   
		   $.ajax({
			   	type: 'POST',
			   	url: "/XMII/Illuminator",
		   		data : parameters,
		   		dataType: 'json',
		   		cache: false,
		   		async: true,
		   		success: function(data, textStatus, jqXHR){
			   		var hasHighAlerts = false;
		   			if(data.Rowsets.Rowset.length > 0)
		   				if(data.Rowsets.Rowset[0].Row !== undefined){
		   					data.Rowsets.Rowset[0].Row.sort();
		   					for(var i in data.Rowsets.Rowset[0].Row){
		   						if(data.Rowsets.Rowset[0].Row[i].Status != 'Acknowledged' && data.Rowsets.Rowset[0].Row[i].Status != 'Expired')
		   						{
			   						oController.latestAlertIDs.push(data.Rowsets.Rowset[0].Row[i].ID);
			   						if(data.Rowsets.Rowset[0].Row[i].Severity == "High"){
			   							hasHighAlerts = true;
			   						}
		   						}
		   					}
		   				}
		   			
		   			if(oController.latestAlertIDs.length > 0)
		   			{
		   				oController.appData.hasNewAlerts = true;
		   			}
		   			else
		   				oController.appData.hasNewAlerts = false;
		   			
		   			sap.oee.ui.Utils.updateModel(oController.appComponent.getModel("appData"));
		   			
		   			if(hasHighAlerts){
		   				oController.openAlertsDialog();
		   			}else{
		   				if(oController.alertDialog && oController.alertDialog.isOpen()){
		   					oController.alertDialog.close();
		   				}
		   			}
		   		},
		   		headers : {"Access-Control-Allow-Origin" : "*"},
		   		crossDomain : true,
		   		error : function(data, textStatus, jqXHR){
		   		}
		   });
	},
	
	openAlertsDialog : function(){
		var oPanel;
		if(this.alertDialog == undefined){
			this.alertDialog = new sap.ui.xmlfragment("sap.oee.ui.fragments.alertDialog",this);
			this.getView().addDependent(this.alertDialog);
		}
		else
			this.alertDialog.destroyContent();
		

		this.createAlertDialogContent();
	},
	
	createAlertDialogContent : function(){
		var oController = this.getView().getController();
		if(this.latestAlertIDs.length > 0){
			var aResults = [];
			   for(i in this.latestAlertIDs){
				   var latestAlertID = this.latestAlertIDs[i];
				   if(latestAlertID !== undefined){
					   var parameters = {"service":"alert","mode":"GetDetails","id":latestAlertID,"content-type":"text/xml"};
					   $.ajax({
						   type: 'GET',
						   url: "/XMII/Illuminator",
						   data : parameters,
						   dataType: 'xml',
						   cache: false,
						   async: false,
						   success: function(data, textStatus, jqXHR){
						   	  var alertDesc = jQuery(data).find("ShortText").contents().first().text();
						   	  var alertLongDesc = jQuery(data).find("LongText").contents().first().text();
						   	  var alertSeverity = jQuery(data).find("Severity").contents().first().text();
						   	  var containerPropertySuccess = (jQuery(data).find("ContainerProperties").find("ContainerProperty").find("Name:contains('Success')").length)?true:false;
						   	  var statusInProcess = jQuery(data).find("Status").contents().first().text()=="In Process" ? true : false; 
						   	  if(!containerPropertySuccess){
							   	  oPanel = new sap.m.Panel({
							   		  headerToolbar : new sap.m.Toolbar({
							   			  	content : [
							   			  	            new sap.m.Text({text : alertDesc}),
							   			  	            new sap.m.ToolbarSpacer(),
							   			  	           	new sap.m.Text({text : jQuery(data).find("Status").contents().first().text() + " (" + alertSeverity + ")"})
							   			  	           ]
							   		  }),
							   		  expanded : false,
							   		  expandable : true,
							   		  content : [new sap.ui.layout.VerticalLayout({
							   		              		content : [
							   		              		           		new sap.m.Text({text : alertLongDesc , width : "100%"}).addStyleClass("textPadding"),
							   		              		           		new sap.ui.layout.HorizontalLayout({content : [new sap.m.Button({visible : !statusInProcess, text : oController.appComponent.oBundle.getText("OEE_LABEL_SET_TO_IN_PROCESS"),icon : 'sap-icon://initiative', press : [oController.setAlertStatus,oController] }).addStyleClass("marginRight").addCustomData(new sap.ui.core.CustomData({key : "alertID",value : latestAlertID})).addCustomData(new sap.ui.core.CustomData({key : "status",value : 1})),
							   		              		           		new sap.m.Button({text : oController.appComponent.oBundle.getText("OEE_LABEL_ACKNOWLEDGE"),icon : 'sap-icon://accept',press : [oController.setAlertStatus,oController]}).addStyleClass("marginRight").addCustomData(new sap.ui.core.CustomData({key : "alertID",value : latestAlertID})).addCustomData(new sap.ui.core.CustomData({key : "status",value : 2}))]})
							   		              		           ]
							   		              	})
							   		              ]					   		             
							   	  });
						   	  }else{
						   		 oPanel = new sap.m.Panel({
							   		  headerToolbar : new sap.m.Toolbar({
							   			  	content : [
							   			  	            new sap.m.Text({text : alertDesc}),
							   			  	            new sap.m.ToolbarSpacer(),
							   			  	           	new sap.m.Text({text : "Success"})
							   			  	           ]
							   		  }),
							   		  expanded : false,
							   		  expandable : true,
							   		  content : [new sap.ui.layout.VerticalLayout({
							   		              		content : [
							   		              		           		new sap.ui.layout.HorizontalLayout({content : [new sap.m.Button({text : "Done",icon : 'sap-icon://accept',press : [oController.setAlertStatus,oController]}).addStyleClass("marginRight").addCustomData(new sap.ui.core.CustomData({key : "alertID",value : latestAlertID})).addCustomData(new sap.ui.core.CustomData({key : "status",value : 2}))]})
							   		              		           ]
							   		              	})
							   		              ]					   		             
							   	  });
						   	  }
						   	  
						   	  oController.alertDialog.addContent(oPanel);
						   },
						   headers : {"Access-Control-Allow-Origin" : "*"},
						   crossDomain : true,
						   error : function(data, textStatus, jqXHR){
						   }
					   });
				   }
			   }
		}

		this.alertDialog.open();
	},
	
	setAlertStatus : function(oEvent){
		var oSource = oEvent.getSource();
		var parameters = {"service":"alert","mode":"SetStatus","id":oSource.data("alertID"),"content-type":"text/xml",Status : oSource.data("status")};
		
		var oController = this.getView().getController();
		$.ajax({
			   type: 'GET',
			   url: "/XMII/Illuminator",
			   data : parameters,
			   dataType: 'xml',
			   cache: false,
			   async: false,
			   success: function(data, textStatus, jqXHR){
					oController.checkForAlerts();
			   },
			   headers : {"Access-Control-Allow-Origin" : "*"},
			   crossDomain : true,
			   error : function(data, textStatus, jqXHR){
			   }
		   });
	},
	
	initializeAppInfo : function(){
		this.setAppUserAndTimeZoneInfo();
		
		this.setUserWorkcenterAssignmentsAndSetDefaultWorkcenter();
		
		this.setPODsAssignedToUserForCurrentWorkcenter();
		
		this.initializeGetAllActivitiesForClientAndPlant();
		
		this.setDefaultCustomizations();
		
	 	this.initializeShiftInformationInitially();
	 	
	 	this.setInitialOrderInformationIfAny();
	},
	
	initializeShiftInformationInitially : function(){
	    var currentShift_json= this.interfaces.interfacesGetCurrentShift();
	    sap.oee.ui.Utils.setShiftInformationForApplication(currentShift_json,this.appData,this.appComponent.getModel("appData"));

	 	jQuery.sap.intervalCall(1000* 60, this, this.refreshShiftDetails); // Check and Refresh Shift Details every minute.
	},
	
	refreshShiftDetails : function(){
		var currentTimestamp = new Date().getTime();
	 	if(this.appData.shift.isCurrentShift || this.appData.shift.shiftID == undefined){ 
	        this.interfaces.interfacesGetCurrentShift(currentTimestamp,true,this.checkForAutoRestartRun,this);
		} // In Current Shift Boundaries Then Refresh Shift Info else assume Mass Mode Operation.
	},
	
	checkForAutoRestartRun : function(currentShift_json){
		if(currentShift_json && currentShift_json.shiftDefinition){
			var hasShiftChanged = this.appData.shift.shiftID !== currentShift_json.shiftDefinition;
			sap.oee.ui.Utils.setShiftInformationForApplication(currentShift_json,this.appData,this.appComponent.getModel("appData"));
			
			if(hasShiftChanged){ //Check For Auto Restart Run.
				this.interfaces.interfacesGetOrderStatusForRunsStartedInShiftInputSync(this.appData.node.nodeID,this.appData.client,this.appData.plant,this.appData.shift.shiftID,this.appData.shift.shiftGrouping,this.appData.shift.startTimestamp,this.appData.shift.endTimestamp,false);
			  	
				this.appComponent.getEventBus().publish(this.appComponent.getId(), "clearOrderContext",{orderChangePublish : true});
				
				this.appComponent.getEventBus().publish(this.appComponent.getId(), "refreshAndCheckForInitialOrderInformation");
			}
		}
	},
	
	initializeGetAllActivitiesForClientAndPlant : function(){
		if(this.appData.activityList == undefined){
			this.appData.activityList = this.interfaces.interfacesGetAllActivities(this.appData.client,this.appData.plant);
		}
	},
	
	setLineBehaviour : function(){
		var lineBehavior = this.appData.getCustomizationValues(this.appData.node.nodeID, sap.oee.ui.oeeConstants.customizationNames.lineBehavior);
		
		if(lineBehavior != null){
			this.appData.node.lineBehavior = lineBehavior.value;
		}else{
			this.appData.node.lineBehavior = sap.oee.ui.oeeConstants.serialLineBehaviourConstant; // Default Behaviour
		}
		
	},
	setCrewSize : function(){
		var crewSize = this.appData.getCustomizationValues(this.appData.node.nodeID, sap.oee.ui.oeeConstants.customizationNames.crewSize);  
		if(crewSize != null){
			if(crewSize.value === "YES" ){
				this.appData.node.crewSize = "T" ;
			}else{
				this.appData.node.crewSize = "F"; 
			}
		}
		
	},
	setMicroStoppagesReporting : function(){
		var microStoppages = this.appData.getCustomizationValues(this.appData.node.nodeID, sap.oee.ui.oeeConstants.customizationNames.enableMicroStoppagesReporting);  
		if(microStoppages != null){
			if(microStoppages.value === "YES" ){
				this.appData.node.microStoppages = sap.oee.ui.oeeConstants.check_boolean.TRUE ;
			}else{
				this.appData.node.microStoppages = sap.oee.ui.oeeConstants.check_boolean.FALSE; 
			}
		}
	},
	setDowntimeEntryType : function(){
		var downtimeEntryType = this.appData.getCustomizationValues(this.appData.node.nodeID, sap.oee.ui.oeeConstants.customizationNames.downtimeEntryType);  
		if(downtimeEntryType != null){
			if(downtimeEntryType.value === sap.oee.ui.oeeConstants.downtimeEntryType.durationBased){
				this.appData.node.downtimeEntryType = sap.oee.ui.oeeConstants.downtimeEntryType.durationBased; 
			}else{
				this.appData.node.downtimeEntryType = sap.oee.ui.oeeConstants.downtimeEntryType.timeIntervalBased;
			}
		}
	},
	
	setDefaultCustomizations : function(){
		var allCustomizations = [];
		if(this.appData.customizationValues[this.appData.node.nodeID] === undefined) {
			allCustomizations = this.getAllCustomizationValues();
			this.appData.setCustomizationValues(allCustomizations.nodeId, allCustomizations.customizationValues.results);
		}
		//Set Line Behaviour affects availibility calculation
		this.setLineBehaviour();
		this.setCrewSize();
		this.setMicroStoppagesReporting();
		this.setDowntimeEntryType();
		//Set Decimal Precision For Line , customization used to set precision of values shown in Worker UI.
		this.setDecimalPrecisionCustomizationForLine();
		this.setDefaultUomCustomizationForLine();
	},
	
	setDefaultUomCustomizationForLine : function(){
		if(this.appData.defaultUom == undefined || this.appData.defaultUom == null){
			this.appData.defaultUom = this.appData.getCustomizationValues(this.appData.node.nodeID, sap.oee.ui.oeeConstants.customizationNames.defaultuomforproductionreporting);  
		}
	},
	
	setDecimalPrecisionCustomizationForLine : function(){
		var decimalPrecision = this.appData.getCustomizationValues(this.appData.node.nodeID, sap.oee.ui.oeeConstants.customizationNames.decimalPrecision);
		
		if(decimalPrecision != null){
			this.appData.decimalPrecision = parseInt(decimalPrecision.value);
		}else{
			this.appData.decimalPrecision = 2;
		}
	},
	
	setPODsAssignedToUserForCurrentWorkcenter : function(){
		if(this.appData.node.nodeID != undefined){
			/*
			 * Get the POD Details assigned for the logged in user.
			 * If the default POD is assigned as one of them, set the default POD
			 * Else, set the first entry of the result as the POD for the dashboard
			 */
			var podData = this.interfaces.getUserGroupPodAssignmentDataForLoggedInUser(
					this.appData.client, 
					this.appData.plant,
					this.appData.node.nodeID);
			
			var podAssigned = false;
			if(podData !=  undefined && podData.userGroupAndPods != undefined){
				for (var i = 0; i < podData.userGroupAndPods.results.length; i++){
					if (podData.userGroupAndPods.results[i].podId == this.appData.user.defaultPod) {
						this.appData.podID = podData.userGroupAndPods.results[i].podId;
						this.appData.podDescription = podData.userGroupAndPods.results[i].podDescription;
						this.appData.podType = podData.userGroupAndPods.results[i].podType;
						if(podData.userGroupAndPods.results[i].podImage != "" && podData.userGroupAndPods.results[i].podImage != " ")
						{
							this.appData.iconForShell = decodeURI(podData.userGroupAndPods.results[i].podImage);
						}else{
							this.appData.iconForShell = sap.oee.ui.oeeConstants.defaultSAPLogo;
						}
						podAssigned = true;
						break;
					}
				}
				
				if (podAssigned == false) {
					if (podData.userGroupAndPods.results.length > 0) {
						for(var index=0;index<podData.userGroupAndPods.results.length;index++){
			        		if(podData.userGroupAndPods.results[index].podType == "R"){
			        			this.appData.podID = podData.userGroupAndPods.results[index].podId;
								this.appData.podDescription = podData.userGroupAndPods.results[index].podDescription;
								this.appData.podType = podData.userGroupAndPods.results[index].podType;
								if(podData.userGroupAndPods.results[index].podImage != "" && podData.userGroupAndPods.results[index].podImage != " ")
								{
									this.appData.iconForShell = decodeURI(podData.userGroupAndPods.results[index].podImage);
								}else{
									this.appData.iconForShell = sap.oee.ui.oeeConstants.defaultSAPLogo;
								}
								//Update User Preferences
							    this.interfaces.interfacesUpdateUserPreferences(this.appData.client, this.appData.plant, sap.oee.ui.oeeConstants.USERDEFAULTPARAMS.POD, this.appData.podID,true);
							    break;
			        		}
			        	}
			      	}
				}
				this.appData.noOfPODAssigned = podData.userGroupAndPods.results.length;
				//TODO Set Line Customizations
			
		  }
		}
	},
	
	setUserWorkcenterAssignmentsAndSetDefaultWorkcenter : function(){
		var workunitJSON = this.interfaces.interfacesGetPHNodesForUserInput(this.appData.client, this.appData.plant);
		var workunitAssigned = false;
		if(workunitJSON != undefined){
			if(workunitJSON.nodes != undefined){
				for (var i = 0; i < workunitJSON.nodes.results.length; i++) {
					if (workunitJSON.nodes.results[i].nodeID == this.appData.user.defaultWorkUnit) {
						this.appData.node.nodeID = workunitJSON.nodes.results[i].nodeID;
						this.appData.node.description = workunitJSON.nodes.results[i].description;
						this.appData.node.capacityID = workunitJSON.nodes.results[i].capacityID;
						this.appData.node.workcenterID = workunitJSON.nodes.results[i].workcenterID;
						workunitAssigned = true;
						this.setDefaultCustomizations();
						break;
					}
				}
				
				if (	workunitAssigned == false &&
						workunitJSON.nodes.results.length > 0) {
					this.appData.node.nodeID = workunitJSON.nodes.results[0].nodeID;
					this.appData.node.description = workunitJSON.nodes.results[0].description;
					this.appData.node.capacityID = workunitJSON.nodes.results[0].capacityID;
					this.appData.node.workcenterID = workunitJSON.nodes.results[0].workcenterID;
				    //Update User Preferences
				    this.interfaces.interfacesUpdateUserPreferences(this.appData.client, this.appData.plant, sap.oee.ui.oeeConstants.USERDEFAULTPARAMS.WORKCENTER, this.appData.node.nodeID,true);
				      
					this.setDefaultCustomizations();
				}
				this.appData.noOfworkunitAssigned = workunitJSON.nodes.results.length;
			}
		}
	},
	
	setAppUserAndTimeZoneInfo : function(){
		var userInfoJSON,plantTimezoneKey;
		
		if(jQuery.sap.getUriParameters().get("client") != "" && jQuery.sap.getUriParameters().get("client") != undefined && jQuery.sap.getUriParameters().get("plant") != "" && jQuery.sap.getUriParameters().get("plant") != undefined){
			userInfoJSON = this.interfaces.interfacesGetLogonUserInformationForClientAndPlant(jQuery.sap.getUriParameters().get("client"),jQuery.sap.getUriParameters().get("plant"));
			this.appData.client = jQuery.sap.getUriParameters().get("client");
			this.appData.plant = jQuery.sap.getUriParameters().get("plant");
			if(userInfoJSON.defaultWorkUnit){
				//Update User Preferences so that the plant preference is saved
			    this.interfaces.interfacesUpdateUserPreferences(this.appData.client, this.appData.plant, sap.oee.ui.oeeConstants.USERDEFAULTPARAMS.WORKCENTER, userInfoJSON.defaultWorkUnit,true);
			}
			clientPlantURIOverriden = true;
		}
		else{ 
			userInfoJSON = this.interfaces.interfacesGetLogonUserInformation();
			this.appData.client = userInfoJSON.defaultClient;
			this.appData.plant = userInfoJSON.defaultPlant;
		}
		
		this.appData.user.firstName = userInfoJSON.firstName;
		this.appData.user.lastName = userInfoJSON.lastName;
		this.appData.user.userID = userInfoJSON.uniqueName;
		
		var clientPlantURIOverriden;
		
		if(clientPlantURIOverriden && jQuery.sap.getUriParameters().get("defaultWorkcenter") != "" && jQuery.sap.getUriParameters().get("defaultWorkcenter") != undefined){
			this.appData.user.defaultWorkUnit = jQuery.sap.getUriParameters().get("defaultWorkcenter");
		}
		else{ 
			this.appData.user.defaultWorkUnit = userInfoJSON.defaultWorkUnit;
		}
		if(clientPlantURIOverriden && jQuery.sap.getUriParameters().get("defaultPod") != "" && jQuery.sap.getUriParameters().get("defaultPod") != undefined){
			this.appData.user.defaultPod = jQuery.sap.getUriParameters().get("defaultPod");
		}
		else{
			this.appData.user.defaultPod = userInfoJSON.defaultPod;
		}
		
		var plantTimezoneObject = this.interfaces.getPlantTimezoneOffset();
		if (plantTimezoneObject.currentTimezoneOffset != undefined) {
			this.appData.plantTimezoneOffset = parseFloat(plantTimezoneObject.currentTimezoneOffset);
		}	
		
		if(plantTimezoneObject.plantTimezoneKey != undefined && plantTimezoneObject.plantTimezoneKey  != ""){
			var zoneObject = moment.tz.zone(plantTimezoneObject.plantTimezoneKey);
			if(zoneObject && zoneObject != null){
				this.appData.plantTimezoneKey = plantTimezoneObject.plantTimezoneKey;
			}			
		}	
	},
	
	
	handleClose : function(oEvent){
		oEvent.getSource().getParent().close();
	},
	
	wcChange : function(oControlEvent) {
		var selectWorkunitPop = new sap.ui.xmlfragment("sap.oee.ui.fragments.selectionChangeFragment",this);

		selectWorkunitPop.setTitle(this.appComponent.oBundle.getText("OEE_LABEL_SELECT_WORKUNIT"));
		selectWorkunitPop.attachConfirm(this.selectedWorkunit,this);
		var template = new sap.m.StandardListItem({
            title : "{parts : [{path: 'description'},{path: 'workcenterID'}], formatter : 'sap.oee.ui.Formatter.formatIDAndDescriptionText'}"
		});
		
		template.addCustomData(new sap.ui.core.CustomData({key : 'nodeID', value : '{nodeID}'}));
        template.addCustomData(new sap.ui.core.CustomData({key : 'description', value : '{description}'}));
        template.addCustomData(new sap.ui.core.CustomData({key : 'parentNodeID', value : '{parentNodeID}'}));
        template.addCustomData(new sap.ui.core.CustomData({key : 'workcenterID', value : '{workcenterID}'}));
        template.addCustomData(new sap.ui.core.CustomData({key : 'capacityID', value : '{capacityID}'}));
        
        var workunitJSON = this.interfaces.interfacesGetPHNodesForUserInput(this.appData.client, this.appData.plant);
        
        // Remove Line nodes with Line behaviour as MCML
        
        var workunitCount = workunitJSON.nodes.results.length;
        while (workunitCount--) {
        	if(workunitJSON.nodes.results[workunitCount].isCapacity === false &&
        			workunitJSON.nodes.results[workunitCount].lineBehavior === sap.oee.ui.oeeConstants.multiLineMultiCapacity ){
        		workunitJSON.nodes.results.splice(workunitCount, 1);
        	}
        }
        
        var wcModel = new sap.ui.model.json.JSONModel();
        if(workunitJSON.nodes != undefined){
	        if(workunitJSON.nodes.results != undefined){
	        	var wcNodes = workunitJSON.nodes.results;
				wcNodes.sort(function(node1,node2){
					if(parseFloat(node1.sequenceNumber) < parseFloat(node2.sequenceNumber)){
						return -1;
					}else{
						return 1;
					}
				});
	        	wcModel.setData({workCenters : wcNodes});
	        }
        }

        var doSearch = function(oEvent){
        	var properties = [];
    		properties.push("description");
    		properties.push("workcenterID");

    		sap.oee.ui.Utils.fuzzySearch(this,wcModel,oEvent.getParameter("value"),
    				selectWorkunitPop.getBinding("items"),oEvent.getSource(),properties);
        };
        
        selectWorkunitPop.attachSearch(doSearch);
        selectWorkunitPop.attachLiveChange(doSearch);
		selectWorkunitPop.bindAggregation("items","/workCenters",template);
		selectWorkunitPop.setModel(wcModel);
		selectWorkunitPop.open();
  },
  
  selectedWorkunit: function(oEvent){
	  if(oEvent.getParameter("selectedItem") != undefined){
		  var selected = oEvent.getParameter("selectedItem");
		  this.appData.node.nodeID = selected.data('nodeID');
		  this.appData.node.description = selected.data('description');
		  this.appData.node.capacityID = selected.data('capacityID');
		  this.appData.node.workcenterID = selected.data('workcenterID');
		  this.setDefaultCustomizations();
		  this.appData.machineListForCurrentWC = undefined; //Clear Cached machine lists which are shown in order-independent and generic machine data collection Screen
		  this.appData.PODButtons = undefined; // Clear Cached POD Details
		  this.appData.productionActivities = undefined; //Clear Cached Production Activities
		  this.appData.PHNodeDataForDowntimeScreen = undefined; //clear cached Plant Hierarchy Node Details for Downtime Screen
		  this.shiftHandOverEndTimeCustomizationForReviewShift = undefined; //clear Cached shiftHandover End time Customization value 
		  this.appData.defaultUom = undefined;//clear cached value for default Uom Customization
		  this.appData.PODs = undefined;
		  this.appData.podID = undefined;
		  this.appData.podDescription = undefined;
		  this.setPODsAssignedToUserForCurrentWorkcenter();
		  sap.oee.ui.Utils.updateModel(this.appComponent.getModel("appData"));

		  this.checkForAlerts();
		  var router = sap.ui.core.UIComponent.getRouterFor(this);
		  //Update User Preferences
		  this.interfaces.interfacesUpdateUserPreferences(this.appData.client, this.appData.plant, sap.oee.ui.oeeConstants.USERDEFAULTPARAMS.WORKCENTER, this.appData.node.nodeID,true);
		  //Update Shift Information
		  this.initializeShiftInformationInitially();
		  
		  var currentHashBeforeNavigation = router.oHashChanger.getHash();
		  this.handleWorkunitChangeEventBasedOnNavigation(currentHashBeforeNavigation);
		  
		  router.navTo("contentArea");
	  }
  },

  handleWorkunitChangeEventBasedOnNavigation: function(oHash){
	  /*Fix for continuous busy indicator on changing workunit 
	  */
	  //Publish wcChange only when user is changing from main screen
	  // If workcenter is changed from any particular screen, clear context, rest will be taken care in method onRouteMatched of contentArea()
	  if(oHash == ""){	      
		  this.appComponent.getEventBus().publish(this.appComponent.getId(), "wcChange");
	  }else{
		  this.appComponent.getEventBus().publish(this.appComponent.getId(), "clearOrderContext");
	  }
  },

	startClock : function(oClockTextField) {
	    oClockTextField.setText(sap.oee.ui.Formatter.formatTimeWithLocale(new Date().getTime(),this.appData.plantTimezoneOffset));
	    var oController = this.getView().getController();
	    this.clockTimer = setTimeout(function(){oController.startClock(oClockTextField);},500);
	},
	
	podChange : function(){
			var podData = this.interfaces.getUserGroupPodAssignmentDataForLoggedInUser(
	                  this.appData.client, 
	                  this.appData.plant,
	                  this.appData.node.nodeID);
			
			if(podData.userGroupAndPods != undefined){
			for(var index=0;index<podData.userGroupAndPods.results.length;index++){
			for(var innerIndex=index+1;innerIndex<podData.userGroupAndPods.results.length;innerIndex++){
			      if(podData.userGroupAndPods.results[index].podId===podData.userGroupAndPods.results[innerIndex].podId)
			      {
			            podData.userGroupAndPods.results.splice(innerIndex,1);
			      }
			}
			}
			
			var selectPODPopup = new sap.ui.xmlfragment("sap.oee.ui.fragments.selectionChangeFragment",this);
			selectPODPopup.setTitle(this.appComponent.oBundle.getText("OEE_HEADING_SELECT_POD"));
			
			selectPODPopup.attachConfirm(this.selectedPOD,this);
			var template = new sap.m.StandardListItem({
	            title : "{parts : [{path: 'podDescription'},{path: 'podId'}], formatter : 'sap.oee.ui.Formatter.formatIDAndDescriptionText'}"
			});
			
			template.addCustomData(new sap.ui.core.CustomData({key : 'podID', value : "{podId}"}));
			template.addCustomData(new sap.ui.core.CustomData({key : 'podImage', value : "{podImage}"}));
	        template.addCustomData(new sap.ui.core.CustomData({key : 'podDescription', value : "{podDescription}"}));
	        template.addCustomData(new sap.ui.core.CustomData({key : 'podType', value : "{podType}"}));
	        var podList = [];
	        var podModel = new sap.ui.model.json.JSONModel();
	        if( podData.userGroupAndPods != undefined){
	        if(podData.userGroupAndPods.results != undefined){
	        	for(var index=0;index<podData.userGroupAndPods.results.length;index++){
	        		if(podData.userGroupAndPods.results[index].podType == "R"){
	        			podList.push(podData.userGroupAndPods.results[index]);
	        		}
	        	}
	        	podList.sort( function( list1, list2 ) {
	        	    return list1.podDescription < list2.podDescription ? -1 : list1.podDescription > list2.podDescription ? 1 : 0;
	        	});
	        		podModel.setData({pods : podList});
	        	}
	        }
	        
			selectPODPopup.bindAggregation("items","/pods",template);
			selectPODPopup.setModel(podModel);
			
			var doSearch = function(oEvent){
	        	var properties = [];
	    		properties.push("podId");
	    		properties.push("podDescription");

	    		sap.oee.ui.Utils.fuzzySearch(this,podModel,oEvent.getParameter("value"),
	    				selectPODPopup.getBinding("items"),oEvent.getSource(),properties);
	        };
	        
	        selectPODPopup.attachSearch(doSearch);
	        selectPODPopup.attachLiveChange(doSearch);
	        
			selectPODPopup.open();
		}
	},
	
	selectedPOD : function(oEvent){
		if(oEvent.getParameter("selectedItem") != undefined){
			var selected =  oEvent.getParameter("selectedItem");
	        this.appData.podID = selected.data('podID');
	        this.appData.podDescription = selected.data('podDescription');
	        this.appData.podType = selected.data('podType');
	        // Set POD Image
	        if(selected.data('podImage') != "" && selected.data('podImage') != " ")
			{
				this.appData.iconForShell = decodeURI(selected.data('podImage'));
			}else{
				this.appData.iconForShell = sap.oee.ui.oeeConstants.defaultSAPLogo;
			}
	        this.appData.PODButtons = undefined;  // Clear Cached POD Details
	        this.appData.PODs = undefined;
		    sap.oee.ui.Utils.updateModel(this.appComponent.getModel("appData"));
		    
		    this.checkForAlerts();
		    var router = sap.ui.core.UIComponent.getRouterFor(this);
		    
		    //Update User Preferences
		    this.interfaces.interfacesUpdateUserPreferences( this.appData.client, this.appData.plant, sap.oee.ui.oeeConstants.USERDEFAULTPARAMS.POD, this.appData.podID,true);
		    this.bindMaster();
		      
		    this.appComponent.getEventBus().publish(this.appComponent.getId(), "podChange");
			router.navTo("contentArea");
		}
	},
	
	prepareShiftDetailsDialog: function(){
		if(!this.shiftSelectionDialog){
			this.shiftSelectionDialog = sap.ui.xmlfragment("shift","sap.oee.ui.fragments.shiftSelectionDialog",this);
			this.getView().addDependent(this.shiftSelectionDialog);
		}
		
		if(!this.shiftModel){
			this.shiftModel = new sap.ui.model.json.JSONModel();
			this.shiftSelectionDialog.setModel(this.shiftModel);
		}
	},
	
	shiftChange : function(oEvent){
		var allShiftsJSON,index,shiftIndex, offsetInMinutes, dateTimeString, plantTimezoneOffset = this.appData.plantTimezoneOffset;
		//var dateInShiftPopup = oEvent.getSource().getText().split(' ')[0];
		var dateInShiftPopup = this.appData.shift.startDate;
		var dDefaultDate, shiftDateAndTimeInPlantTimeZone;
		var shiftInputDate,hours,minutes,seconds;
		if(this.appData.shift.startTimestamp != undefined && this.appData.shift.startTimestamp != ""){
	//	 	allShiftsJSON = this.interfaces.interfacesGetCurrentAndPreviousShiftsInput(this.appData.client, this.appData.plant, this.appData.node.capacityID, this.appData.node.workcenterID,this.appData.shift.startTimestamp);
			
		   /*Current Date in plant time zone : 07/10/2016
			* Current Time in plant time zone : 02:00:00 AM
			* Shift Name : 06/10/2016 Night Shift
			* Date passed should be 07/10/2016 in dDefaultDate default date 
			
			* Cannot rely on selected shift Name and pass 06/10/2016 to dDefaultDate default date */
			
			//This will return current date in plant time zone
			//shiftDateAndTimeInPlantTimeZone = new Date(sap.oee.ui.Utils.getPlantTimezoneTime(new Date().getTime(),this.appData.plantTimezoneOffset));
			
			shiftDateAndTimeInPlantTimeZone = new Date(dateInShiftPopup);
			
			/*hours = shiftDateAndTimeInPlantTimeZone.getHours() * 3600 * 1000;
			minutes = shiftDateAndTimeInPlantTimeZone.getMinutes() * 60 * 1000;
			seconds = shiftDateAndTimeInPlantTimeZone.getSeconds() * 1000;
			shiftDateAndTimeInPlantTimeZone = shiftDateAndTimeInPlantTimeZone - hours - minutes - seconds;*/
			
			/*Date picker gives time in browser timezone
			 * Remove browser timezone offset to convert time into UTC
			 * Then add plant time zone as service expects time according to Plant time zone set in supported plants
			 * No Manipulations are done in service. It expects epoch value as per time in plant time zone
			*/

			
			/*
			 * Adjusting plantTimezoneOffset based on DST if applicable
			 */
			if(this.appData){
				dateTimeString = sap.oee.ui.Utils.getDateTimeStringFromTimestamp(shiftDateAndTimeInPlantTimeZone.getTime());
				offsetInMinutes = sap.oee.ui.Utils.getPlantTimezoneOffsetBasedOnTimezoneKey(dateTimeString, this.appData.plantTimezoneKey);
				if(offsetInMinutes){
					plantTimezoneOffset = parseFloat(offsetInMinutes);
				}
			}
			
			shiftInputDate = shiftDateAndTimeInPlantTimeZone - ((new Date(shiftDateAndTimeInPlantTimeZone.getTime()).getTimezoneOffset() * 60 * 1000) + plantTimezoneOffset);
			
			dDefaultDate = new Date(shiftDateAndTimeInPlantTimeZone);
			this.openShiftPopup(dDefaultDate);
			allShiftsJSON = this.interfaces.interfacesGetShiftsForWorkCenter(this.appData.client, this.appData.plant, this.appData.node.capacityID, this.appData.node.workcenterID,shiftInputDate);
			//dDefaultDate = new Date(this.interfaces.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp(this.appData.shift.startTimestamp));
		}else{
		// 		allShiftsJSON = this.interfaces.interfacesGetCurrentAndPreviousShiftsInput(this.appData.client, this.appData.plant, this.appData.node.capacityID, this.appData.node.workcenterID);
				dDefaultDate = new Date();
				this.openShiftPopup(dDefaultDate);
		 		allShiftsJSON = this.interfaces.interfacesGetShiftsForWorkCenter(this.appData.client, this.appData.plant, this.appData.node.capacityID, this.appData.node.workcenterID);
		 	}
			
			if(isNaN(dDefaultDate.getTime())){
				sap.oee.ui.Utils.createMessage(this.appComponent.oBundle.getText("OEE_MSG_SHIFT_DEF_INVALID"),"Error");
				dDefaultDate = new Date(); // Default to new Date
				return;
			}
			
			/* We are not using currentShift flag returned from service.
			 * Below logic is used to check which is current shift after comparing in global context
			 */
			if(allShiftsJSON && allShiftsJSON.currentShiftOutputList && allShiftsJSON.currentShiftOutputList.results){
				 this.shiftModel.setData({shifts: allShiftsJSON.currentShiftOutputList.results,dateValue:dDefaultDate});
			 }else{
				 this.shiftModel.setData({shifts: [],dateValue:dDefaultDate});
			 }
			if(allShiftsJSON.currentShiftOutputList){
				for(index=0;index<allShiftsJSON.currentShiftOutputList.results.length;index++){
					if(allShiftsJSON.currentShiftOutputList.results[index].shiftGrouping === this.appData.shift.shiftGrouping &&
							allShiftsJSON.currentShiftOutputList.results[index].shiftDefinition === this.appData.shift.shiftID &&
							allShiftsJSON.currentShiftOutputList.results[index].startTimestamp == this.appData.shift.startTimestamp &&
							allShiftsJSON.currentShiftOutputList.results[index].endTimestamp == this.appData.shift.endTimestamp){
						shiftIndex = index;
						break;
					}
				}
			}
			 var shiftList = sap.ui.core.Fragment.byId("shift", "oList");
			 shiftListItems = shiftList.getItems();
			 shiftList.setSelectedItem(shiftListItems[shiftIndex]);
			 sap.oee.ui.Utils.updateModel(this.appComponent.getModel(this.shiftModel));
			 
	},
	
	openShiftPopup: function(defaultDate){
		if(this.shiftModel != undefined && this.shiftSelectionDialog != undefined){
			this.shiftModel.setData({shifts: [],dateValue:defaultDate});
			this.shiftSelectionDialog.open();
		}
	},
	
	changeHandler : function(oEvent){
		var offsetInMinutes, dateTimeString, plantTimezoneOffset = this.appData.plantTimezoneOffset;
		var oShiftSelectionPicker = oEvent.getSource();
		var shiftList = sap.ui.core.Fragment.byId("shift", "oList");
		//var shiftInputDate = sap.oee.ui.Utils.removeBrowserTimezoneTimeOffsetAndSendUTC(oShiftSelectionPicker.getDateValue().getTime(),  this.appData.plantTimezoneOffset);
		var shiftInputDate = oShiftSelectionPicker.getDateValue().getTime() ;
		
		/*Date picker gives time in browser time zone
		* Remove browser time zone offset to convert time into UTC
		* Then add plant time zone as service expects time according to Plant time zone set in supported plants
		* No Manipulations are done in service. It expects epoch value as per time in plant time zone
		*/
		
		/*
		 * Adjust plant time zone offset based on date selected.
		 * Offset should consider DST
		 */
		/*
		 * Adjusting plantTimezoneOffset based on DST if applicable
		 */
		if(this.appData){
			dateTimeString = sap.oee.ui.Utils.getDateTimeStringFromTimestamp(shiftInputDate);
			offsetInMinutes = sap.oee.ui.Utils.getPlantTimezoneOffsetBasedOnTimezoneKey(dateTimeString, this.appData.plantTimezoneKey);
			if(offsetInMinutes){
				plantTimezoneOffset = parseFloat(offsetInMinutes);
			}
		}
		
        shiftInputDate = shiftInputDate - ((new Date(shiftInputDate).getTimezoneOffset() * 60 * 1000) + plantTimezoneOffset);
		
		allShiftsJSON = this.interfaces.interfacesGetShiftsForWorkCenter(this.appData.client, this.appData.plant, this.appData.node.capacityID, this.appData.node.workcenterID,shiftInputDate);
 		//oShiftSelectionPicker.getModel().setData({shifts: allShiftsJSON.currentShiftOutputList.results});
		if(allShiftsJSON.currentShiftOutputList){
			shiftResult = allShiftsJSON.currentShiftOutputList.results;
		}else{
			shiftResult =  [];
		}
		oShiftSelectionPicker.getModel().setData({shifts: shiftResult,dateValue:oShiftSelectionPicker.getDateValue()});
		oShiftSelectionPicker.getModel().checkUpdate();
 		shiftList.removeSelections();
	},
	
	handleOK : function(oEvent){
		//var shiftInfoJSON = oEvent.getSource().getBindingContext().getObject();
		var shiftInfoJSON = oEvent.getParameter('listItem').getBindingContext().getObject(); 
		this.shiftSelectionDialog.close();
		this.appComponent.getEventBus().publish(this.appComponent.getId(), "shiftChange",{shiftInfoJSON : shiftInfoJSON});
	},

	clearOrderContext : function(channelId, eventId, data){
		   if(eventId === "clearOrderContext"){
			   this.appData.clearSelectedOrderContext();
		   }

		   if(data.orderChangePublish){
			   this.appComponent.getEventBus().publish(this.appComponent.getId(), "orderChanged");
		   }
	},
	
	visibleIfListHasMoreThanItem : function(obj){
		if(obj != undefined){
			if(obj > 1){
				return true;
			}
		}
		return false;
	},
	
	visibleIfListHasOnlyOneItem : function(obj){
		if(obj != undefined){
			if(obj == 1){
				return true;
			}
		}
		return false;
	},
	
	onPressShellHeadItem : function(oEvent){
		var oSource = oEvent.getSource();
		var oActionSheet = new sap.m.ActionSheet({placement : sap.m.PlacementType.Bottom});
		var oLogoutItem = new sap.m.Button({
			text : "Logout",
			icon : "sap-icon://log",
			press : [function(oEvent){
				this.interfaces.interfacesLogout("/OEEDashboard/OEEWorkerUI.jsp");
			},this]
		});
		oActionSheet.addButton(oLogoutItem);
		oActionSheet.openBy(oSource);
	},
	navToContentScreen : function(oEvent){
		this.router.navTo("contentArea");
	},
	
	headerChange : function(channelId, eventId, data){
		   if(eventId === "headerChange"){
			    this.byId("shellHeading").setText(data.headerText);
		   }
	  },
	  
	showOrHideNavButton : function(channelId, eventId, data){
		   if(eventId === "showOrHideNavButton"){
				var navButton = this.byId(sap.ui.core.Fragment.createId("header","navButton"));
				if(data.show == undefined){
					navButton.setVisible(true);
					this.byId("homeButton").setVisible(true);
				}
				else{
					navButton.setVisible(data.show);
					this.byId("homeButton").setVisible(data.show);
				}
				
		   }
	},
	
	navBack : function(){
		window.history.back();
	},
	
	setInitialOrderInformationIfAny : function(fromOrder, fromOperation){
		var i; activeOrderFound = false;
		var activeOrderInContext, activeRunInContext, activeOrder, activeRun;
		var completedOrderInContext, completedRunInContext, completedOrder, completedRun;
		if(this.appData.selected.runID == undefined){
			var activeRunsList = this.interfaces.interfacesGetAllActiveHoldAndCompletedRunsForShiftInput(this.appData.node.nodeID,this.appData.client,this.appData.plant,this.appData.shift.shiftID,this.appData.shift.shiftGrouping,this.appData.shift.startTimestamp);
			if(activeRunsList != undefined){
				if(activeRunsList.length != 0){
					activeRunsList.sort();
					var orderStatusJSON;
					if(activeRunsList.length == 1){
						this.appData.selected.runID = activeRunsList[0];
						orderStatusJSON =  this.interfaces.interfacesGetOrderStatusForListOfRunsInputSync([this.appData.selected.runID]);
						orderStatusJSON = orderStatusJSON.orderStatusList.results[0];
					}else{
						orderStatusJSON =  this.interfaces.interfacesGetOrderStatusForListOfRunsInputSync(activeRunsList);
						for(i=0;i < orderStatusJSON.orderStatusList.results.length ; i++){ // Selected Order must always be of status ACT
							if(orderStatusJSON && orderStatusJSON.orderStatusList && orderStatusJSON.orderStatusList.results.length && 
									(orderStatusJSON.orderStatusList.results[i].status == sap.oee.ui.oeeConstants.status.COMPLETED || 
											orderStatusJSON.orderStatusList.results[i].status == sap.oee.ui.oeeConstants.status.HOLD)){
								if(fromOrder && fromOperation && orderStatusJSON.orderStatusList.results[i].order === fromOrder && 
										orderStatusJSON.orderStatusList.results[i].routingOperNo === fromOperation){
									completedOrderInContext = orderStatusJSON.orderStatusList.results[i];
									completedRunInContext = activeRunsList[i];
								}else{
									completedOrder = orderStatusJSON.orderStatusList.results[i];
									completedRun = activeRunsList[i];
								}
							}
							else{
								activeOrderFound = true;
								if(fromOrder && fromOperation && orderStatusJSON.orderStatusList.results[i].order === fromOrder && 
										orderStatusJSON.orderStatusList.results[i].routingOperNo === fromOperation){
									activeOrderInContext = orderStatusJSON.orderStatusList.results[i];
									activeRunInContext = activeRunsList[i];
									break;
								}else{
									activeOrder = orderStatusJSON.orderStatusList.results[i];
									activeRun = activeRunsList[i];
								}
							}
						}
						/*
						 * If there are no active orders in selected shift, 
						 * select the order which was selected in previous selected shift(if same order exists)
						 * 
						 * Shift A(Current Shift) : Order 1 Active, Order 2 Completed
						 * Shift B(Current - 1 Shift) : Order 1 Completed, Order 2 Completed
						 * 
						 * Navigation from Shift B to Shift A - Always open active order, If there are two active order, 
						 * open same order which was selected in previous shift
						 * Navigation from Shift A to Shift B - Open same order which was selected before navigation in Shift A
						 */

						if(activeOrderFound === true){
							if(activeOrderInContext && activeRunInContext){
								orderStatusJSON = activeOrderInContext;
								this.appData.selected.runID = activeRunInContext;
							}else{
								orderStatusJSON = activeOrder;
								this.appData.selected.runID = activeRun;
							}
						}else{
							if(completedOrderInContext && completedRunInContext){
								orderStatusJSON = completedOrderInContext;
								this.appData.selected.runID = completedRunInContext;
							}else{
								orderStatusJSON = completedOrder;
								this.appData.selected.runID = completedRun;
							}
						}
					}

					if(orderStatusJSON){
						var selectedOrderDetailsJSON = orderStatusJSON; 
						if(this.appData.defaultUom != null){
							if(this.appData.defaultUom.value == sap.oee.ui.oeeConstants.uomType.productionUom){
								selectedOrderDetailsJSON.quantityReleasedUOMText = selectedOrderDetailsJSON.productionUOMDesc;
								selectedOrderDetailsJSON.quantityReleased = selectedOrderDetailsJSON.productionUomQuantity;
								selectedOrderDetailsJSON.totalQuantityProducedInRun = selectedOrderDetailsJSON.totalQuantityProducedInProductionUomInRun; 
								selectedOrderDetailsJSON.totalProducedQuantity = selectedOrderDetailsJSON.totalProducedInProductionUom; 
								selectedOrderDetailsJSON.totalRemainngQuantity = selectedOrderDetailsJSON.totalRemainingQuantityInProductionUom; 
							}
							else if (this.appData.defaultUom.value == sap.oee.ui.oeeConstants.uomType.standardRateUom){
								selectedOrderDetailsJSON.quantityReleasedUOMText = selectedOrderDetailsJSON.stdRateUOMDesc;
								selectedOrderDetailsJSON.quantityReleased = selectedOrderDetailsJSON.quantityInStdRateUom;
								selectedOrderDetailsJSON.totalQuantityProducedInRun = selectedOrderDetailsJSON.totalQuantityProducedInStdRateUomInRun;
								selectedOrderDetailsJSON.totalProducedQuantity = selectedOrderDetailsJSON.totalProducedInStdRateUom; 
								selectedOrderDetailsJSON.totalRemainngQuantity = selectedOrderDetailsJSON.totalRemainingQuantityInStdRateUom; 
							}
							else{
								selectedOrderDetailsJSON.quantityReleasedUOMText = selectedOrderDetailsJSON.quantityReleasedUOMDesc;
							}
						}
						else{
							selectedOrderDetailsJSON.quantityReleasedUOMText = selectedOrderDetailsJSON.quantityReleasedUOMDesc;
						}
						this.appData.setSelectedOrderDetails(selectedOrderDetailsJSON);
					}
				}
			}
			// Publish order change event if user changes from one shift (with orders)to another shift(without any order) within any activity like
			// Report Speed Loss, Report Production etc.
			this.appComponent.getEventBus().publish(this.appComponent.getId(), "orderChanged");
			sap.oee.ui.Utils.updateModel(this.appComponent.getModel("appData"));
		}
		else{
			this.appComponent.getEventBus().publish(this.appComponent.getId(), "refreshOrderDetails");
			this.appComponent.getEventBus().publish(this.appComponent.getId(), "orderChanged"); // Publish Order Changed Event
		}

		//this.appComponent.getEventBus().publish(this.appComponent.getId(), "orderChanged"); // Publish Order Changed Event
	},
   
   navToHelpLink : function(oEvent){
	   if(this.appData.oeeHelpLink != undefined){
		   window.open(this.appData.oeeHelpLink);
	   }
   },
   
   detailsSearch : function(oEvent){
	   var properties = [];
		properties.push("quantity");
		properties.push("uomDescription");
		properties.push("changedBy");
		properties.push("descriptionOfReasonCode");
		properties.push("comments");
		 
		var oSearchField = oEvent.getSource();
		var oDetailsTable = sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","detailsTable"));
	       
		sap.oee.ui.Utils.fuzzySearch(this,this.detailsDialog.getModel(),oSearchField.getValue(),
				oDetailsTable.getBinding("items"),oSearchField,properties,
				[],true);
   },
   
   onChangeImpactLineOnDetailRecord : function(oEvent){
	    var selectedProdRunData = oEvent.getSource().getBindingContext().getObject();
	    if(selectedProdRunData){
			    
		    	var updatedData = this.interfaces.interfacesUpdateDataCollection(this.appData.client,[selectedProdRunData]);
				var oDetailsTable = sap.ui.getCore().byId(sap.ui.core.Fragment.createId("detailsTableFragment","detailsTable"));
		        var data = this.detailsDialog.getModel().getData();
				
				if(updatedData != undefined){
					if(updatedData.entryID != undefined){
						oDetailsTable.removeSelections(true);
						var prodRunData = this.getProductionRunDataBasedOnOrderDependency(this._detailsDialogPayload);
					    if(prodRunData.details != undefined && prodRunData.details.results != undefined){
					    	data.prodList = prodRunData.details.results;
							this.detailsDialog.getModel().setData(data);
					    }
			            this.detailsDialog.getModel().checkUpdate(); 
			            this.detailsDialog.rerender();
			            
			            data.refreshMethodToInvoke.call(data.oContextOfController);
			        }
			    }
		    
		}
   },
  
	onClickButton : function(oEvent){
		var router = sap.ui.core.UIComponent.getRouterFor(this);
		//var oSource = oEvent.getSource();
		var oSource = oEvent.getParameter('listItem').getBindingContext().getObject();
		var component = sap.ui.getCore().getComponent("__component0");
		var router = component._oRouter;
		if(oSource.activityType === sap.oee.ui.oeeConstants.activityType.UI){

			if(component.byId("contentArea") != undefined)
				component.byId("contentArea").destroyContent();
			
			
			if(component.autoRefreshIntervals != undefined){
				for(i = 0 ;i< component.autoRefreshIntervals.length ; i++){
					jQuery.sap.clearIntervalCall(component.autoRefreshIntervals[i]);
				}
			}
			
			component.autoRefreshIntervals = [];
			
			router.navTo("activity", {
				activityId : oSource.activityId
			});
		}else if(oSource.activityType === sap.oee.ui.oeeConstants.activityType.EXTERNAL){
			var deleteAfterConfirm = function(bConfirm){
				if(bConfirm == sap.m.MessageBox.Action.OK){
					window.open(oSource.activityAssigned1.urlProgram , oSource.activityAssigned1.activityDesc);
				}
			};
			
			sap.m.MessageBox.confirm(component.oBundle.getText("OEE_MESSAGE_DISCLAIMER_EXTERNAL_NAV"),deleteAfterConfirm);
		}
	},
	
	bindMaster: function(){
		var that = this;
		var type = 'list';
		var headerText = this.appComponent.oBundle.getText("Navigate To");
		var properties = {firstStatus:"activityId",description:"description"};
		var fragmentId = "idShell";
		var helpLink = "/83/1E69FF75C24D00877E8D502C7671F3";
		var errorMessage = this.appComponent.oBundle.getText("OEE_PAGES_AVAILABLE");
		var searchFields = {field1 : "urlProgram"}
		var masterModel = new sap.ui.model.json.JSONModel();
		if(this.appData.PODs == undefined){
			this.podDetails = this.interfaces.getPODButtonDetails(
								this.appData.client,
								this.appData.plant,
								this.appData.podID);
			this.appData.PODs = this.podDetails;
		}
		else
		{
			this.podDetails = this.appData.PODs;
		}
		
		//var node = new sap.m.List({mode:"SingleSelectMaster",noDataText:errorMessage});
		var node = new sap.m.Tree({
			items: {
				path: "/root",
				template: new sap.m.StandardTreeItem({
					title: "{description}"
				})
			},
			mode:"SingleSelectMaster",
		});
		
		
		
		var buttons;
		var template;
		var subButtons = this.podDetails.subButtons;
		var buttonPrefix = "button_";
		var data;
		
		/*var template =  new sap.m.ObjectListItem({ 
			type : "Active", press:[this.onClickButton]});
		 template.bindProperty("title","description");
		 
		 node.bindItems("/root",template);*/
		 var jsonData;
		 var linkArray = [];
		
		for ( var i = 0; i < subButtons; i++) {
			
			
			var buttonDetails = this.podDetails[buttonPrefix + i];
			if(buttonDetails.buttonType == "G"){
				var myObject1 = {};
				myObject1.description = buttonDetails.description;
				var subButtons1 = buttonDetails.subButtons;
				for ( var x = 0; x < subButtons1; x++) {
					var objectID = "myObject"+x; 
					myObject1[objectID] = {};
					var buttonDetails2 = buttonDetails[buttonPrefix + x];
					myObject1[objectID].description = buttonDetails2.description;
					myObject1[objectID].activityId = buttonDetails2.activityAssigned1.activityId;
					myObject1[objectID].urlProgram = buttonDetails2.activityAssigned1.urlProgram;
					myObject1[objectID].activityDesc = buttonDetails2.activityAssigned1.activityDesc;
					myObject1[objectID].activityType = buttonDetails2.activityAssigned1.activityType;
					//myObject1.objectID.activityId = buttonDetails2.activityAssigned1.activityId;
				}
				
				linkArray[i] = myObject1; 
			}else{
				var myObject = {};
				myObject.description = buttonDetails.description;
				//myObject.activityAssigned1 = {};
				myObject.activityId = buttonDetails.activityAssigned1.activityId;
				myObject.urlProgram =  buttonDetails.activityAssigned1.urlProgram;
				myObject.activityDesc = buttonDetails.activityAssigned1.activityDesc;
				myObject.activityType = buttonDetails.activityAssigned1.activityType;
				linkArray[i] = myObject;                      
			}
			     	
		}
		
		masterModel.setData({root: linkArray});
		node.setModel(masterModel);
		node.attachSelectionChange(this.onClickButton);
		var masterpage = this.byId("masterPage");
		masterpage.destroyContent();
		masterpage.addContent(node);

		this.oAllActivityList = this.bindNavigationScreens(this,this.onSelectMaster,this.onSelectClientAndPlant,type,
				fragmentId,masterModel,properties,searchFields,node);
			},	
	
	bindNavigationScreens : function(controller,sItemSelect,sSelectClientAndPlant,type,sFragmentId,model,properties,searchFields,node) {
		try {
			var template,selectedNode,selected,map;
			var masterModel,listStatus,menuButton,userButton,setItemSelected,searchItem;
			if (controller) {
					var oShell = controller.byId("oeeShell");
					var masterpage = controller.byId(sap.ui.core.Fragment.createId(sFragmentId, "masterPage"));
					var oSearchField = controller.byId("searchList");
					if(model){
						 masterModel = model;
					}
			
						if(searchFields){
							if(searchFields.field1){
								properties.field1 = searchFields.field1
							}
							if(searchFields.field2){
								properties.field2 = searchFields.field2
							}
						}
						var searchTriggered = function(oEvent){
							sap.oee.ui.Utils.fuzzySearch(null,masterModel,oEvent.getSource().getValue(),
									node.getBinding("items"),oEvent.getSource(),properties);
							if(searchItem === "nodes" && controller.selectedMasterNode && oEvent.getSource().getValue() === ""){
								selectedNode = node;
								for(index=0;index<controller.selectedMasterNode.length;index++){
									selected = parseFloat(controller.selectedMasterNode[index]);
									selectedNode = selectedNode.getNodes()[selected];
								}
								map = {};
								map.node = selectedNode;
								map["node"].setIsSelected(true);
							}
						};
						
					oSearchField.attachSearch(searchTriggered).attachLiveChange(searchTriggered);
					}
					menuButton = controller.byId("shellPane");
					
					if(menuButton.mEventRegistry.press == undefined)
					menuButton.attachPress(this.showMaster.bind(this,oShell));
		
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message,sap.ui.core.MessageType.Error);
		}

	},
	
	showMaster: function(shell){
		var bState = shell.getShowPane();
		shell.setShowPane(!bState);
	},
	
	getAllCustomizationValues: function() {
		var customHeaders = [
		                     sap.oee.ui.oeeConstants.customizationNames.lineBehavior,
		                     sap.oee.ui.oeeConstants.customizationNames.crewSize,
		                     sap.oee.ui.oeeConstants.customizationNames.enableMicroStoppagesReporting,
		                     sap.oee.ui.oeeConstants.customizationNames.downtimeEntryType,
		                     sap.oee.ui.oeeConstants.customizationNames.defaultuomforproductionreporting,
		                     sap.oee.ui.oeeConstants.customizationNames.decimalPrecision,
		                     sap.oee.ui.oeeConstants.customizationNames.batchNumberMandatory,
		                     sap.oee.ui.oeeConstants.customizationNames.serialNumberMandatory
		                     ];
		var i, currentStream;
		var inputStream = [];
		for(i=0; i<customHeaders.length; i++) {
			currentStream = {
					client : this.appData.client,
					plant : this.appData.plant,
					nodeID : this.appData.node.nodeID,
					customizationName : customHeaders[i]
			}
			inputStream.push(currentStream);
		}
		return this.interfaces.getCustomizationValueForNodeList(inputStream, this.appData.node.nodeID);
	},

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf componentexample.Main
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf componentexample.Main
*/
	onAfterRendering: function() {
	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf componentexample.Main
*/
	onExit: function() {
	    clearTimeout(this.clockTimer);
		
		if(this.alertDialog != undefined){
			this.alertDialog.destroy();
		}
		
		if(this.oPopOver != undefined){
			this.oPopOver.destroy();
	    }
		
		if(this.oCommentsDialog != undefined){
			this.oCommentsDialog.destroy();
		}
		    
		if(this.detailsDialog != undefined){
			this.detailsDialog.destroy();
		} 
	}

});