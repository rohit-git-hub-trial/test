jQuery.sap.declare("sap.oee.ui.ODataInterface");
sap.oee.ui.ODataInterface = function() {
	this.globalAppData = undefined;
	this.oOEEBundle = undefined;
	this.getOData = function(requestParam, inputData, async, callback,
			controller,isGetMethod, tempRequestOData) {
		try {
			/*
			 * Add Extension related properties
			 */


			if (this.globalAppData.client != undefined) {
				inputData.extensionClient = this.globalAppData.client;
			}

			if (this.globalAppData.plant != undefined) {
				inputData.extensionPlant = this.globalAppData.plant;
			}

			if (this.globalAppData.node.nodeID != undefined) {
				inputData.extensionNodeID = this.globalAppData.node.nodeID;
			}

			if (this.globalAppData.userLocale != undefined) {
				inputData.userLocale = this.globalAppData.userLocale;
			}
			if(isGetMethod !=null && isGetMethod == true && tempRequestOData != undefined){
				tempRequestOData = tempRequestOData + ","+ "extensionClient"+"="+"'"+inputData.extensionClient+"'"+","+"extensionPlant"+"="+"'"+inputData.extensionPlant+"'"+","+"extensionNodeID"+"="+"'"+inputData.extensionNodeID+"'"+","+"userLocale"+"="+"'"+inputData.userLocale+"'";
			}
			// Set current timezone offset in milliseconds
			// inputData.plantTimezoneOffset = -1 * (new Date().getTimezoneOffset() * 60 * 1000);

			inputData.plantTimezoneOffset = 0;

			var inputJSONModel = new sap.ui.model.json.JSONModel();
			inputJSONModel.setData(inputData);
			inputJSON = inputJSONModel.getJSON();

			var servletName = "../../../../../OEEDashboard/DataAccessServlet/";

			if ((this.globalAppData.xsrfid === "" || this.globalAppData.xsrfid !== null)
					&& inputData.inputEntitySet !== "GetCurrentUserDetailsInput") {
				if(isGetMethod != true || isGetMethod == null ||isGetMethod == undefined || isGetMethod == "")
				{
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open("GET", servletName + "?xsrfid=Fetch", false);
					xmlHttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
					xmlHttp.setRequestHeader("Accept", "application/json");
					xmlHttp.send();
					if (this.globalAppData.logEnabled)
						jQuery.sap.log.info("Server Call - "
								+ inputData.inputEntitySet, "Input - "
								+ "Server Call - " + JSON.stringify(inputJSON));
					if (xmlHttp.status === 200) {
						this.globalAppData.xsrfid = xmlHttp
						.getResponseHeader("xsrfid");
					} 
					else {
						this.globalAppData.xsrfid = "";
						this.interfacesLogout();
					}
				} 
			}

			if ((this.globalAppData.xsrfid !== ""
				&& this.globalAppData.xsrfid !== null && this.globalAppData.xsrfid !== undefined)
				|| inputData.inputEntitySet === "GetCurrentUserDetailsInput") {
				var xmlHttp = new XMLHttpRequest();
				if (this.globalAppData.logEnabled)
					jQuery.sap.log.info("Server Call - "
							+ inputData.inputEntitySet, "Input - "
							+ "Server Call - " + JSON.stringify(inputJSON));
				if (inputData.inputEntitySet === "GetCurrentUserDetailsInput") {
					xmlHttp.open("POST", servletName + requestParam
							+ "?loginCall=X", false);
				} else {
					if (async != true) {
						if((isGetMethod != true || isGetMethod == null ||isGetMethod == undefined || isGetMethod == "")||(tempRequestOData == undefined )){
							xmlHttp
							.open("POST", servletName + requestParam
									+ "?xsrfid="
									+ this.globalAppData.xsrfid, false);
						}
						else {
							xmlHttp
							.open("GET", servletName + requestParam
									+ "("
									+ tempRequestOData + ")", false);
						}
					}else // If AJAX Call
					{
						if((isGetMethod != true || isGetMethod == null ||isGetMethod == undefined || isGetMethod == "")||(tempRequestOData == undefined )){
							xmlHttp.open("POST", servletName + requestParam
									+ "?xsrfid=" + this.globalAppData.xsrfid, true);
							xmlHttp.setRequestHeader("Content-type","application/json;charset=UTF-8");
							xmlHttp.setRequestHeader("Accept", "application/json");
							xmlHttp.send(inputJSON);
						}
						else {
							xmlHttp
							.open("GET", servletName + requestParam
									+ "("
									+ tempRequestOData + ")", true);
							//xmlHttp.setRequestHeader("Content-type","application/json;charset=UTF-8");
							xmlHttp.setRequestHeader("Accept", "application/json");
							xmlHttp.send();
						}


						var oReferenceToInterface = this;
						xmlHttp.onreadystatechange = function() {
							if (xmlHttp.status === 403) {
								oReferenceToInterface.globalAppData.xsrfid = "";
								this.interfacesLogout();
								return;
							}
							if (xmlHttp.readyState == 4) {
								// if(xmlHttp.status === 200){
								var responseOData;
								if ((oReferenceToInterface.globalAppData.xsrfid !== ""
									&& oReferenceToInterface.globalAppData.xsrfid !== null && oReferenceToInterface.globalAppData.xsrfid !== undefined)) {
									if (xmlHttp.responseText != "") {
										var result = JSON
										.parse(xmlHttp.responseText);
										responseOData = result["d"];
										if (responseOData != undefined) {
											if (responseOData.outputCode != undefined) {
												if (responseOData.outputCode != 0) {
													sap.oee.ui.Utils
													.createMessage(
															responseOData.outputMessage,
															"Error");
												}
											}
										}
										// alert("Response Received");
									} else {
										hideBusyIndicator();
									}
									if (callback != undefined) {
										callback
										.call(controller, responseOData);
									} else {
										return responseOData;
									}
								}
								// }
							}
						}
					}
				}
				if (async != true) {
					if((isGetMethod != true || isGetMethod == null ||isGetMethod == undefined || isGetMethod == "")||(tempRequestOData == undefined)){
						xmlHttp.setRequestHeader("Content-type","application/json;charset=UTF-8");
						xmlHttp.setRequestHeader("Accept", "application/json");
						xmlHttp.send(inputJSON);
					}else {
						//xmlHttp.setRequestHeader("Content-type","application/json;charset=UTF-8");
						xmlHttp.setRequestHeader("Accept", "application/json");
						xmlHttp.send();
					}


					if (xmlHttp.status === 403) {
						this.globalAppData.xsrfid = "";
						if (this.globalAppData.logEnabled)
							jQuery.sap.log.error("XSRF Validation Failed",
							"XSRF Validation Failed");
						this.interfacesLogout();
						return;
					}
					var result = JSON.parse(xmlHttp.responseText);
					var responseOData = result["d"];
					if (responseOData != undefined) {
						if (responseOData.outputCode != undefined) {
							if (responseOData.outputCode != 0) {
								sap.oee.ui.Utils.createMessage(
										responseOData.outputMessage, "Error");
								if (this.globalAppData.logEnabled)
									jQuery.sap.log.error("ERROR",
											responseOData.outputMessage);
							}
						}
					}
					if (this.globalAppData.logEnabled)
						jQuery.sap.log.info("Server Call -"
								+ inputData.inputEntitySet
								+ " Ended Successfully");
					return responseOData;
				}
			} else {
				this.interfacesLogout();
			}

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, "Error");
			if (this.globalAppData.logEnabled)
				jQuery.sap.log.error("Server Call ERROR");
			return "";
		}
	};
	this.createLoadScheduledDownTime = function(client, scheduledDownTime){

		var requestOData;
		var respOData;
		if(client==null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		} else if(scheduledDownTime==null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_SD"), sap.ui.core.MessageType.Error);
			return;
		}
		try{

			requestOData={

					client:client,
					scheduledDownTime:scheduledDownTime
			};
			respOData= this.getOData("CreateLoadScheduledDownTimeConfigurationInput",requestOData);
			return respOData;

		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetLogonUserInformation = function() {
		try {
			var requestOData = {
					inputEntitySet : "GetCurrentUserDetailsInput"
			};
			var respOData = this.getOData("DefaultInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetAllSupportedClientAndPlant = function() {
		var respOData;
		try {
			var requestOData = {
					inputEntitySet : "GetAllSupportedClientAndPlantInput"
			};
			respOData = this.getOData("DefaultInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetLogonUserInformationForClientAndPlant = function(sClient,sPlant) {
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant
			};
			var respOData = this.getOData("GetCurrentUserDetailsInputForClientAndPlant", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetOrderStatusForRunsStartedInShiftInput = function(sNodeId,
			sClient, sPlant, sShiftId, sShiftGrouping, sStartTimestamp,
			sEndTimestamp, callback, controller, sRestartRunInNextShift,
			asyncTemp) {
		if (sStartTimestamp == undefined || sEndTimestamp == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			throw this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG");
		} else if (sClient == undefined || sPlant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			throw this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG");
		} else if (sNodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ASSIGN_WC"),
					sap.ui.core.MessageType.Error);
			throw this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG");
		}

		try {
			var nodeInput = {
					nodeID : sNodeId,
					client : sClient,
					plant : sPlant,
					shiftId : sShiftId,
					shiftStartTimestamp : sStartTimestamp,
					restartRunInNextShift : sRestartRunInNextShift,
					shiftGrouping : sShiftGrouping
			};

			var async = true;
			if (asyncTemp != undefined && asyncTemp != null) {
				async = asyncTemp;
			}
			var resOData = this.getOData(
					"GetOrderStatusForRunsStartedInShiftInput", nodeInput,
					async, callback, controller);
			if (async == false)
				return resOData;
		} catch (e) {
			throw (e);
			return;
		}
	};
	
	this.interfacesGetOrderStatusForRunsStartedInShift = function(sNodeId,
			sClient, sPlant, sShiftId, sShiftGrouping, sStartTimestamp,
			sEndTimestamp, callback, controller, sRestartRunInNextShift,
			asyncTemp) {
		if (sStartTimestamp == undefined || sEndTimestamp == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			throw this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG");
		} else if (sClient == undefined || sPlant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			throw this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG");
		} else if (sNodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ASSIGN_WC"),
					sap.ui.core.MessageType.Error);
			throw this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG");
		}

		try {
			var nodeInput = {
					nodeID : sNodeId,
					client : sClient,
					plant : sPlant,
					shiftId : sShiftId,
					shiftStartTimestamp : sStartTimestamp,
					restartRunInNextShift : sRestartRunInNextShift,
					shiftGrouping : sShiftGrouping
			};

			var async = true;
			if (asyncTemp != undefined && asyncTemp != null) {
				async = asyncTemp;
			}
			var resOData = this.getOData(
					"GetOrderStatusForRunsStartedInShift", nodeInput,
					async, callback, controller);
			if (async == false)
				return resOData;
		} catch (e) {
			throw (e);
			return;
		}
	};

	this.getPlantTimezoneOffset = function() {
		return this.getPlantTimezoneOffsetForClientAndPlant(
				this.globalAppData.client, this.globalAppData.plant);
	};

	this.getPlantTimezoneOffsetForClientAndPlant = function(client, plant) {
		if (client != undefined && client != '') {
			if (plant != undefined && plant != '') {
				var requestOData = {};
				requestOData.client = client;
				requestOData.plant = plant;
				requestOData.currentDate = new Date().getTime();
				var respOData = this.getOData("GetPlantTimezoneOffsetInput",
						requestOData);
				if (respOData != undefined) {
					if (respOData.outputCode != undefined
							&& respOData.outputCode == 1) {
						//sap.oee.ui.Utils.createMessage(respOData.outputMessage, sap.ui.core.MessageType.Error);
						return;
					}

					if (respOData.currentTimezoneOffset != undefined) {
						return respOData;
					}
				}
			}
		}
	};

	this.interfacesGetPHNodesForUserInput = function(sClient, sPlant) {
		var oGetPHNodesForUserInput = undefined;
		if (sClient == "" || sPlant == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return oGetPHNodesForUserInput;
		}

		try {
			var requestOData = {
					client : sClient,
					plant : sPlant

			};
			var respOData = this.getOData("GetPHNodesForUserInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

		return respOData;
	};

	this.getUserGroupPodAssignmentDataForLoggedInUser = function(client, plant,
			nodeID) {
		var respOData;
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID
			};
			respOData = this.getOData("GetUserGroupAssignmentForUserInput",
					requestOData);

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetBreakScheduleForCurrentShift = function() {

		var sClient = this.globalAppData.client, sPlant = this.globalAppData.plant, sCapacityId = this.globalAppData.node.capacityID, sWorkCenterId = this.globalAppData.node.workcenterID;
		var shiftStartTime = this.globalAppData.shift.startTimestamp;
		if (sClient == "" || sPlant == "" || sCapacityId == ""
			|| sWorkCenterId == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					capacityId : sCapacityId,
					workcenterId : sWorkCenterId,
					currentTime : shiftStartTime

			};
			var respOData = this.getOData("GetCurrentShiftBreakInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

		return respOData;
	};

	this.interfacesGetCurrentShift = function(currentTime,isAsync,callback,controller) {
		var sClient = this.globalAppData.client, sPlant = this.globalAppData.plant, sCapacityId = this.globalAppData.node.capacityID, sWorkCenterId = this.globalAppData.node.workcenterID;

		if (sClient == "" || sPlant == "" || sCapacityId == "" || sWorkCenterId == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					capacityId : sCapacityId,
					workcenterId : sWorkCenterId
			};

			if (currentTime != undefined) {
				requestOData.currentTime = currentTime;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				responseOData = this.getOData("GetCurrentShiftInput", requestOData);
				return responseOData;
			}
			else
			{
				this.getOData("GetCurrentShiftInput", requestOData,isAsync,callback,controller); //Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};

	this.getPODButtonDetails = function(sClient, sPlant, sPODId) {

		if (sClient == null || sPlant == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					podId : sPODId
			};

			var respOData = this.getOData("GetPODButtonDetailsInput",
					requestOData);

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getTopDowntimeDetailsForRunID = function(client, runID, itop, isAsync,
			callback, controller) {
		/*
		 * Getting immediate children for the current client and run Id which are
		 * down
		 */
		var responseOData;

		if (runID == "" || runID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					runID : runID,
					top : itop
			};

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				responseOData = this.getOData("GetTopDowntimeForRunIDInput",
						requestOData);
				return responseOData;
			} else {
				this.getOData("GetTopDowntimeForRunIDInput", requestOData,
						isAsync, callback, controller); // Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetKPITargets = function(requestOData, isAsync, callback,
			controller,isGetMethod) {
		var respOData;
		try {
			if (isAsync != true || isAsync == undefined || isAsync == "") {
				respOData = this.getOData("GetKPITargetInput", requestOData,undefined,undefined,undefined,isGetMethod);
				if (respOData != undefined) {
					if (respOData.kpiTargetList != undefined) {
						return respOData.kpiTargetList.results;
					}
				}
			} else {
				this.getOData("GetKPITargetInput", requestOData, isAsync,
						callback, controller,isGetMethod); // Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getKPIValuesforLine = function(requestOData, isAsync, callback,
			controller,isGetMethod) {

		var respOData;
		if (this.globalAppData.shift.startTimestamp == undefined
				|| this.globalAppData.shift.startTimestamp == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			throw this.oOEEBundle.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE");
		}
		try {
			if (this.globalAppData.shift.startTimestamp != undefined
					&& this.globalAppData.shift.endTimestamp != undefined
					&& requestOData != undefined) {
				//var tempRequestOData = "client"+"="+"'"+requestOData.client+"'"+","+"plant"+"="+"'"+requestOData.plant+"'"+","+"nodeID"+"="+"'"+requestOData.nodeID+"'"+","+"shiftId"+"="+"'"+requestOData.shiftId+"'"+","+"startTimestamp"+"="+requestOData.startTimestamp+","+"endTimestamp"+"="+requestOData.endTimestamp;
				if (isAsync != true || isAsync == undefined || isAsync == "") {
					respOData = this.getOData("GetOEEKpiInput", requestOData,undefined,undefined,undefined,isGetMethod);
					return respOData;
				} else {
					this.getOData("GetOEEKpiInput", requestOData, isAsync,
							callback, controller,isGetMethod); // Make the Async Call
					return;
				}
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetAllActiveHoldAndCompletedRunsForShiftInput = function(
			sNodeId, sClient, sPlant, sShiftId, sShiftGrouping, startTimestamp) {
		if (startTimestamp == undefined || sShiftId == undefined
				|| sShiftGrouping == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sClient == undefined || sPlant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sNodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ASSIGN_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var nodeInput = {
					nodeID : sNodeId,
					client : sClient,
					plant : sPlant,
					shiftId : sShiftId,
					shiftGrouping : sShiftGrouping,
					shiftStartTimestamp : startTimestamp
			};
			var resOData = this.getOData("GetAllActiveRunsForShift", nodeInput);

			if (resOData != undefined && resOData.runIDList != undefined) {
				if (resOData.runIDList.results != undefined) {
					return resOData.runIDList.results;
				} else {
					return resOData.runIDList;
				}
			}
		} catch (e) {
			throw (e);
			return;
		}
	};

	this.interfacesGetOrderStatusForListOfRunsInputSync = function(runList) {
		var sClient = this.globalAppData.client;
		if (runList != undefined) {
			if (runList.length > 0) {
				try {
					var runs = [];
					for (var i = 0; i < runList.length; i++) {
						runs.push( {
							runID : runList[i],
							client : sClient
						});
					}
					var requestOData = {
							client : sClient,
							runs : runs
					};

					respOData = this.getOData(
							"GetOrderStatusForListOfRunsInput", requestOData);
					return respOData;
				} catch (e) {
					sap.oee.ui.Utils.createMessage(e.message,
							sap.ui.core.MessageType.Error);
				}
			}
		}
		return undefined;
	};

	this.interfacesGetCurrentAndPreviousShiftsInput = function(sClient, sPlant,
			sCapacityId, sWorkcenterID, sStartDate) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sPlant == "" || sCapacityId == "" || sClient == ""
			|| sWorkcenterID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var nodeInput;
		if (sStartDate == "" || sStartDate == undefined) {
			nodeInput = {
					plant : sPlant,
					workcenterId : sWorkcenterID,
					capacityId : sCapacityId,
					client : sClient
			};

		} else {
			nodeInput = {
					plant : sPlant,
					workcenterId : sWorkcenterID,
					capacityId : sCapacityId,
					client : sClient,
					currentTime : new Date(sStartDate).getTime()
			};
		}
		var resOData = this.getOData("GetCurrentAndPreviousShiftsInput",
				nodeInput);
		return resOData;
	};

	this.interfacesGetShiftsForWorkCenter = function(sClient, sPlant,
			sCapacityId, sWorkcenterID, sStartDate) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sPlant == "" || sCapacityId == "" || sClient == ""
			|| sWorkcenterID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var nodeInput;
		if (sStartDate == "" || sStartDate == undefined) {
			nodeInput = {
					plant : sPlant,
					workcenterId : sWorkcenterID,
					capacityId : sCapacityId,
					client : sClient
			};

		} else {
			nodeInput = {
					plant : sPlant,
					workcenterId : sWorkcenterID,
					capacityId : sCapacityId,
					client : sClient,
					currentTime : new Date(sStartDate).getTime()
			};
		}
		var resOData = this.getOData("GetShiftsForWorkCenterInput", nodeInput);
		return resOData;
	};

	this.interfacesGetActiveRunsForShiftInput = function(shiftId,
			sShiftStartTimestamp) {
		if (this.globalAppData.client == undefined
				|| this.globalAppData.plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (this.globalAppData.node.nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ASSIGN_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var nodeInput = {
					client : this.globalAppData.client,
					plant : this.globalAppData.plant,
					nodeID : this.globalAppData.node.nodeID,
					shiftGrouping : this.globalAppData.shift.shiftGrouping,
					shiftId : shiftId,
					shiftStartTimestamp : sShiftStartTimestamp
			};
			var resOData = this.getOData("ActiveRunsForShiftInput", nodeInput);
			if (resOData.runIDList != undefined) {
				return resOData.runIDList.results;
			} else {
				return resOData.runIDList;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetActiveRunsForShiftInputWithoutAutoRestartRun = function(
			shiftId, sShiftStartTimestamp) {
		if (this.globalAppData.client == undefined
				|| this.globalAppData.plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (this.globalAppData.node.nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ASSIGN_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var nodeInput = {
					client : this.globalAppData.client,
					plant : this.globalAppData.plant,
					nodeID : this.globalAppData.node.nodeID,
					shiftGrouping : this.globalAppData.shift.shiftGrouping,
					shiftId : shiftId,
					shiftStartTimestamp : sShiftStartTimestamp
			};
			var resOData = this.getOData(
					"ActiveRunsForShiftInputWithoutAutoRestartRun", nodeInput);
			if (resOData.runIDList != undefined) {
				return resOData.runIDList.results;
			} else {
				return resOData.runIDList;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesLogout = function() {
		$.ajax({url : "./DataAccessServlet?action=logout&target="+ window.location.pathname + window.location.search, async : false});
		window.location.reload();
	};

	this.interfacesLogoutToDashboard = function() {
		$.ajax({url : "./DataAccessServlet?action=dashboardCallback", async : false});
		window.location.reload();
	};

	this.interfacesGetTimeInMsAfterTimezoneAdjustments = function(date) {

		var timeInMillisAfterAdjustments = undefined, offsetInMinutes;
		var timeInMillis = date.getTime();
		var plantTimezoneOffset = this.globalAppData.plantTimezoneOffset;
		
		if(this.globalAppData){
			offsetInMinutes = sap.oee.ui.Utils.getPlantTimezoneOffsetBasedOnTimezoneKeyForTimestamp(timeInMillis, this.globalAppData.plantTimezoneKey);
			if(offsetInMinutes){
				plantTimezoneOffset = parseFloat(offsetInMinutes);
			}
		}
		
		if (plantTimezoneOffset !== undefined && plantTimezoneOffset !== '') {
			var browserTimezoneOffset = -1
			* (date.getTimezoneOffset() * 60 * 1000);
			if (plantTimezoneOffset != browserTimezoneOffset) {
				timeInMillisAfterAdjustments = timeInMillis
				+ (plantTimezoneOffset - browserTimezoneOffset);
			} else {
				timeInMillisAfterAdjustments = timeInMillis;
			}
		} else {
			timeInMillisAfterAdjustments = timeInMillis;
		}
		return timeInMillisAfterAdjustments;

	};
	this.interfacesGetTimeInMsAfterTimezoneAdjustmentsForTimeStamp = function(
			timeInMillis) {

		var timeInMillisAfterAdjustments = undefined, offsetInMinutes;
		// var timeInMillis = date.getTime();
		var date = new Date(timeInMillis);
		var plantTimezoneOffset = this.globalAppData.plantTimezoneOffset;
		
		if(this.globalAppData){
			offsetInMinutes = sap.oee.ui.Utils.getPlantTimezoneOffsetBasedOnTimezoneKeyForTimestamp(timeInMillis, this.globalAppData.plantTimezoneKey);
			if(offsetInMinutes){
				plantTimezoneOffset = parseFloat(offsetInMinutes);
			}
		}
		
		if (plantTimezoneOffset !== undefined && plantTimezoneOffset !== '') {
			var browserTimezoneOffset = -1
			* (date.getTimezoneOffset() * 60 * 1000);
			if (plantTimezoneOffset != browserTimezoneOffset) {
				timeInMillisAfterAdjustments = timeInMillis
				+ (plantTimezoneOffset - browserTimezoneOffset);
			} else {
				timeInMillisAfterAdjustments = timeInMillis;
			}
		} else {
			timeInMillisAfterAdjustments = timeInMillis;
		}
		return timeInMillisAfterAdjustments;

	};

	this.interfacesGetCurrentTimeInMsAfterTimeZoneAdjustments = function() {
		return this.interfacesGetTimeInMsAfterTimezoneAdjustments(new Date());
	};

	this.interfacesGetDataCOllectionElementsForGoodQuantity = function(sClient) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var nodeInput = {
				client : sClient
		};
		var resOData = this.getOData("DCElementForGQ", nodeInput);
		return resOData.dataCollectionElements.results;
	};

	this.interfacesGetQuantityCollectedForProductionAndRejectedQuantitiesAndStandardValues = function(
			dcElements) {

		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			requestOData.nodeID = this.globalAppData.node.nodeID;
			requestOData.runID = this.globalAppData.selected.runID;

			if (dcElements != undefined && dcElements.length > 0) {
				requestOData.dataCollectionElements = dcElements;
			}

			respOData = this.getOData(
					"GetQuantityCollectedForProductionAndRejectedQuantities",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.interfacesGetQuantityCollectedForProductionAndRejectedQuantitiesAndStandardValuesForNodeAndRun = function(
			dcElements, nodeID, runID) {

		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;

			if (dcElements != undefined && dcElements.length > 0) {
				requestOData.dataCollectionElements = dcElements;
				requestOData.nodeID = nodeID;
				requestOData.runID = this.globalAppData.selected.runID;
			}

			respOData = this.getOData(
					"GetQuantityCollectedForProductionAndRejectedQuantities",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.interfacesGetTotalQuantityCollectedForDCElementsInBaseUom = function(
			dcElements, nodeID, runID,isGetMethod) {

		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			if (nodeID !== undefined && nodeID !== "") {
				requestOData.nodeID = nodeID;
			} else {
				requestOData.nodeID = this.globalAppData.node.nodeID;
			}
			if (runID !== undefined && runID !== "") {
				requestOData.runID = runID;
			} else {
				if(this.globalAppData.selected.runID != undefined){
					requestOData.runID = this.globalAppData.selected.runID;
				}
			}
			if (dcElements != undefined && dcElements.length > 0) {
				requestOData.dataCollectionElements = dcElements;
			}
			respOData = this.getOData(
					"GetTotalQuantityCollectedForDCElementInBaseUom",
					requestOData,undefined,undefined,undefined,isGetMethod);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetTotalQuantityCollectedForDCElementsInBaseUomForOrderIndependentRun = function(
			runID, dcElements, nodeID) {

		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			if (nodeID !== undefined && nodeID !== "") {
				requestOData.nodeID = nodeID;
			} else {
				requestOData.nodeID = this.globalAppData.node.nodeID;
			}
			requestOData.runID = runID;

			if (dcElements != undefined && dcElements.length > 0) {
				requestOData.dataCollectionElements = dcElements;
			}

			respOData = this.getOData(
					"GetTotalQuantityCollectedForDCElementInBaseUom",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesgetUOMTextsForUOMs = function(uomList) {
		var respOData;

		try {
			var requestOData = {
					client : this.globalAppData.client,
					uomIdList : uomList
			};

			respOData = this.getOData("GetAllUOMTextsForListOfUom",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.interfacesGetUOMTextsFromCache = function(uomList) {

		var uomTextCache = this.globalAppData.uomTextCache;
		var uomTextMap = {};
		var uomNotInCache = [];
		if (uomTextCache != undefined) {
			if (uomList != undefined && uomList.length > 0) {
				for ( var i = 0; i < uomList.length; i++) {
					var uom = uomList[i].uom;
					var uomText = uomTextCache[uom];
					if (uomText == undefined) {
						var temp = {
								uom : uom
						};
						uomNotInCache[uomNotInCache.length] = temp;
					} else {
						uomTextMap[uom] = uomText;
					}
				}
			}
		} else {
			uomNotInCache = uomList;
			uomTextCache = {};
		}

		if (uomNotInCache.length > 0) {
			var uomTextResp = this.interfacesgetUOMTextsForUOMs(uomNotInCache);

			if (uomTextResp != undefined
					&& uomTextResp.uomTextsWrapperList != undefined
					&& uomTextResp.uomTextsWrapperList.results != undefined) {
				var uomTextsWrapperList = uomTextResp.uomTextsWrapperList.results;

				for ( var i = 0; i < uomTextsWrapperList.length; i++) {
					if (uomTextsWrapperList[i].ioUomId != undefined
							&& uomTextsWrapperList[i].ioUomId.uom != undefined) {
						uomTextCache[uomTextsWrapperList[i].ioUomId.uom] = uomTextsWrapperList[i].description;
						uomTextMap[uomTextsWrapperList[i].ioUomId.uom] = uomTextsWrapperList[i].description;
					}

				}
			}

		}

		this.globalAppData.uomTextCache = uomTextCache;
		return uomTextMap;

	};

	this.interfacesGetTextForUOM = function(uom) {

		if (uom != undefined && uom != "" && uom != null) {
			var uomList = [ {
				uom : uom
			} ];
			var uomTextMap = this.interfacesGetUOMTextsFromCache(uomList);
			if (uomTextMap != undefined && uomTextMap[uom] != undefined) {
				return uomTextMap[uom];
			}
		}
		return "";

	};

	this.getCapacityNodesForParentNode = function(parentNodeId, startDate,
			startTime) {
		var result;
		if (parentNodeId == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var startTimeStampInUTC =  new Date(startDate + ' ' + startTime).getTime() - ((new Date().getTimezoneOffset() * 60000) + this.globalAppData.plantTimezoneOffset);
			var nodeInput = {
					nodeId : parentNodeId,
					client : this.globalAppData.client,
					plant : this.globalAppData.plant,
					startTimestamp : startTimeStampInUTC
			};
			result = this.getOData("GetCapacityNodesForParentNodeInput",
					nodeInput);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return result;
	};

	this.interfacesGetDCElementsForRQ = function(sClient) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var nodeInput = {
				client : sClient
		};
		var resOData = this.getOData("DCElementForRQ", nodeInput);
		return resOData.dataCollectionElements.results;
	};

	this.interfacesReportQuantitiesForAllDataCollection = function(quantityList) {
		var requestOData = {};
		var respOData;
		try {
			requestOData.client = this.globalAppData.client;

			requestOData.inputCollectDataForDCElements = quantityList;

			respOData = this.getOData("ReportAllQuantitiesInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(responseOData.outputMessage,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetAllUOMs = function(material,isAsync, callback, controller) {
		try {
			var requestOData = {
					client : this.globalAppData.client,
					matnr : material || this.globalAppData.selected.material.id
			};
			var respOData;
			if (isAsync != true) {
				respOData = this
				.getOData("GetUoMInput",
						requestOData);

				return respOData.uomList;
			} else {
				this.getOData(
						"GetUoMInput",
						requestOData, isAsync, callback, controller);
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(responseOData.outputMessage,
					sap.ui.core.MessageType.Error);
		}

	};

	this.interfacesGetOrderStatusForRunsStartedInShiftInputSync = function(
			sNodeId, sClient, sPlant, sShiftId, sShiftGrouping,
			sStartTimestamp, sEndTimestamp, sRestartRunInNextShift) {
		if (sStartTimestamp == undefined || sEndTimestamp == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sClient == undefined || sPlant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sNodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ASSIGN_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var nodeInput = {
					nodeID : sNodeId,
					client : sClient,
					plant : sPlant,
					shiftId : sShiftId,
					shiftStartTimestamp : sStartTimestamp,
					restartRunInNextShift : sRestartRunInNextShift,
					shiftGrouping : sShiftGrouping
			};
			var resOData = this.getOData(
					"GetOrderStatusForRunsStartedInShiftInput", nodeInput);
			return resOData;
		} catch (e) {
			throw (e);
			return;
		}
		return undefined;
	};

	this.getRCParentHierarchy = function(client, plant, reasonCode) {

		var nodeInput = {
				client : client,
				plant : plant,
				reasonCode1 : reasonCode.rc1,
				reasonCode2 : reasonCode.rc2,
				reasonCode3 : reasonCode.rc3,
				reasonCode4 : reasonCode.rc4,
				reasonCode5 : reasonCode.rc5,
				reasonCode6 : reasonCode.rc6,
				reasonCode7 : reasonCode.rc7,
				reasonCode8 : reasonCode.rc8,
				reasonCode9 : reasonCode.rc9,
				reasonCode10 : reasonCode.rc10

		};
		var resOData = this.getOData("GetParentReasonCodeHierarchyInput",
				nodeInput);
		return resOData;
	};

	this.getPlantHierarchyNodeChildrenWithDownTimeStatus = function(
			CurrentNodeId, Client, Plant, isAsync, callback, controller,isGetMethod) {
		/*
		 * Getting immediate children for the current node Id which are down
		 */
		var responseOData;

		if (Client == "" || Plant == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (CurrentNodeId == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					plant : Plant,
					client : Client,
					nodeID : CurrentNodeId
			};

			if (isAsync != true) {
				responseOData = this
				.getOData("GetOpenDowntimesForNodeAndChildrenInput",
						requestOData,undefined,undefined,undefined,isGetMethod);
			} else {
				respOData = this.getOData(
						"GetOpenDowntimesForNodeAndChildrenInput",
						requestOData, isAsync, callback, controller,isGetMethod);
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return responseOData;
	};

	this.updateDataCollectionInBatch = function(runs, dcElements, updateType,
			sUom, iQuantity, oldReason, newReason) {
		if ((runs == undefined || runs.length == 0)
				|| (dcElements == undefined || dcElements.length == 0
						|| sUom == undefined || iQuantity == undefined)) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : this.globalAppData.client,
					materialID : this.globalAppData.selected.material.id,
					runIDList : runs,
					dcElementList : dcElements,
					uom : sUom,
					quantity : "" + iQuantity,
					updateType : updateType
			};
			if (oldReason != undefined)
				requestOData.prevReasonCode = oldReason;
			if (newReason != undefined)
				requestOData.reasonCode = newReason;

			var respOData = this.getOData(
					"GetUpdateDataCollectionInBatchInput", requestOData); 
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.GetAggregatedDataCollectionForDcElementsAndRunsInput = function(
			sClient, aRuns, aDcElementList, materialID) {
		if (aRuns.length < 0 || aDcElementList.length < 0
				|| sClient == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : this.globalAppData.client,
					runIDList : aRuns,
					dcElementList : aDcElementList
			};
			if(materialID != undefined && "" != materialID){
				requestOData.materialID = materialID;
			}
			var respOData = this.getOData(
					"GetAggregatedDataCollectionForDcElementsAndRunsInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetStandardValuesAndTargets = function(sClient, sPlant,
			sNodeID, sOrder, sOperation, sWorkCenterID, sRunID) {
		var respOData;

		if (sClient == "" || sPlant == "" || sNodeID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sOrder == "" || sOperation == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sWorkCenterID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sRunID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					nodeID : sNodeID,
					order : sOrder,
					operation : sOperation,
					workCenterID : sWorkCenterID,
					runID : sRunID
			};
			respOData = this.getOData("getStandardValuesInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getContextData = function(client, runID, context, dcElements, plant,
			nodeId) {
		var respOData;

		if (client == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (runID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {};
			requestOData = {
					client : client,
					runID : runID,
					context : context,
					dcElementList : dcElements,
					plant : plant,
					nodeId : nodeId
			};
			var respOData = this.getOData("GetContextDetailsInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetReleasedDemandInputForTimePeriodAndPattern = function( 
			sPlant, sCurrentNodeId, sClient, startDate, sStatus, sOrderPattern) { 
		var xmlHttpRequest = new XMLHttpRequest();
		if (sPlant == "" || sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sCurrentNodeId == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sStatus == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_STATUS"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (startDate == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ENTER_START_DATE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var oStatusList = [];
		for ( var i = 0; i < sStatus.length; i++) {
			oStatusList.push( {
				name : sStatus[i]
			});
		}

		var releasedDemandInput;

		if (sOrderPattern != undefined) {
			if (startDate != undefined) {
				releasedDemandInput = {
						client : sClient,
						plant : sPlant,
						nodeID : sCurrentNodeId,
						startTimeStamp : startDate,
						patternOfOrder : sOrderPattern,
						status : oStatusList
				};
			} else {
				releasedDemandInput = {
						client : sClient,
						plant : sPlant,
						nodeID : sCurrentNodeId,
						patternOfOrder : sOrderPattern,
						status : oStatusList
				};
			}
		} else {

			releasedDemandInput = {
					client : sClient,
					plant : sPlant,
					nodeID : sCurrentNodeId,
					startTimeStamp : startDate,
					status : oStatusList
			};
		}
		var releasedDemandDetails = this.getOData(
				"GetReleasedDemandInputForTimePeriodAndPattern",
				releasedDemandInput);

		/*
		 * var nodeInput = { PLANT : Plant, NODE_ID : CurrentNodeId, CLIENT :
		 * Client, STATUS : Status }; var nodeInputModel = new
		 * sap.ui.model.json.JSONModel(); nodeInputModel.setData(nodeInput);
		 * xmlHttpRequest.open("POST", "TransactionDataServices", false);
		 * xmlHttpRequest.setRequestHeader("Content-Type",
		 * "application/x-www-form-urlencoded");
		 * xmlHttpRequest.send("requestType=getReleasedDemandForNodeIdAndStatus&input=" +
		 * nodeInputModel.getJSON());
		 * 
		 * var orderListJSON = undefined; if (xmlHttpRequest.responseText != "") {
		 * orderListJSON = eval("(" + xmlHttpRequest.responseText + ")"); }
		 */
		// console.log(JSON.stringify(releasedDemandDetails));
		return releasedDemandDetails;
	};

	this.interfacesStartProductionRun = function(releasedHeaderID, releasedID,
			shiftID, shiftGrouping, workBreakSchedule, productionActivity,
			orderStartDate, orderStartTime, capacityNodeIDList,crewSize) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (releasedHeaderID == "" || releasedID == "" || orderStartDate == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (shiftID == "" || shiftGrouping == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_SHIFT"),
					sap.ui.core.MessageType.Error);
			return;
		}
		var runStartTimeStamp;
		var respOData;
		if (orderStartTime != '') {
			var runStartTimeStampTemp = new Date(orderStartDate + ' '
					+ orderStartTime).getTime();
			runStartTimeStamp = sap.oee.ui.Utils
			.removePlantTimezoneTimeOffsetAndSendUTC(
					runStartTimeStampTemp,
					this.globalAppData.plantTimezoneOffset);

		}

		try {
			var nodeInput;
			if (orderStartTime != '' && runStartTimeStamp != undefined) {
				nodeInput = {
						releasedHeaderID : releasedHeaderID,
						releasedID : releasedID,
						reportingShiftID : shiftID,
						shiftGrouping : shiftGrouping,
						workBreakSchedule : workBreakSchedule,
						runStartTimestamp : runStartTimeStamp,
						capacityNodeIDList : capacityNodeIDList,
						crewSize  :  crewSize
				};
			} else {
				nodeInput = {
						releasedHeaderID : releasedHeaderID,
						releasedID : releasedID,
						reportingShiftID : shiftID,
						shiftGrouping : shiftGrouping,
						workBreakSchedule : workBreakSchedule,
						capacityNodeIDList : capacityNodeIDList,
						crewSize : crewSize
				};
			}

			if (productionActivity) {
				nodeInput.productionActivity = productionActivity;
			}
			if (capacityNodeIDList) {
				nodeInput.capacityNodeIDList = capacityNodeIDList;
			}

			respOData = this.getOData("GetStartProductionRunInput", nodeInput);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
		// kpiValues();
		// SelectedRunID
	};

	this.startResumeOrder = function(releasedHeaderID, releasedID,
			shiftID, shiftGrouping, workBreakSchedule, productionActivity,
			orderStartTimeStamp, capacityNodeIDList,crewSize , orderEndDateTime , selectedStatus,runIDTemp) {
		var xmlHttpRequest = new XMLHttpRequest();
		var runID;
		if (releasedHeaderID == "" || releasedID == "" || orderStartTimeStamp == "" || releasedHeaderID == null || releasedHeaderID == undefined || releasedID == null || releasedID == undefined || orderStartTimeStamp == null || orderStartTimeStamp == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (shiftID == "" || shiftGrouping == "" || shiftID == null || shiftID == undefined || shiftGrouping == undefined || shiftGrouping == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_SHIFT"),
					sap.ui.core.MessageType.Error);
			return;
		}
			var respOData;

		if(runIDTemp != undefined && runIDTemp != null && runIDTemp != ""){
			runID = runIDTemp;
		}
		
		try {
			var nodeInput;
			if (orderStartTimeStamp != "" && orderStartTimeStamp != undefined && orderStartTimeStamp != null) {
				nodeInput = {
						releasedHeaderID : releasedHeaderID,
						releasedID : releasedID,
						reportingShiftID : shiftID,
						shiftGrouping : shiftGrouping,
						workBreakSchedule : workBreakSchedule,
						startTimestamp : orderStartTimeStamp,
						capacityNodeIDList : capacityNodeIDList,
						crewSize  :  crewSize,
						endTimestamp : orderEndDateTime,
						targetStatus : selectedStatus,
						runID : runID
						
				};
			} 
			if (productionActivity) {
				nodeInput.productionActivity = productionActivity;
			}
			if (capacityNodeIDList) {
				nodeInput.capacityNodeIDList = capacityNodeIDList;
			}

			respOData = this.getOData("StartOrResumeOrder", nodeInput);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
		// kpiValues();
		// SelectedRunID
	};

	this.getKPIValuesForTimeInterval = function(sClient, sPlant, sNodeID,
			runIDs, startTimestamp, endTimestamp, isAsync, callback, controller,isGetMethod) {
		if (startTimestamp == undefined || endTimestamp == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					nodeID : sNodeID,
					startTimestamp : startTimestamp,
					endTimestamp : endTimestamp
			};

			if (runIDs != undefined) {
				if (runIDs.length > 0) { // check to call odata only if the array
					// is non-empty
					requestOData.runIDList = runIDs;
				}
			}
			//var tempRequestOData = "client"+"="+"'"+requestOData.client+"'"+","+"plant"+"="+"'"+requestOData.plant+"'"+","+"nodeID"+"="+"'"+requestOData.nodeID+"'"+","+"shiftId"+"="+"''"+","+"startTimestamp"+"="+requestOData.startTimestamp+","+"endTimestamp"+"="+requestOData.endTimestamp;
			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var respOData = this.getOData("GetOEEKpiInput", requestOData,undefined,undefined,undefined,isGetMethod);
				return respOData;
			} else
				this.getOData("GetOEEKpiInput", requestOData, isAsync,
						callback, controller,isGetMethod);

		} catch (e) {
			this.sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetStandardValuesAndTargets = function(sClient, sPlant,
			sNodeID, sOrder, sOperation, sWorkCenterID, sRunID) {
		var respOData;

		if (sClient == "" || sPlant == "" || sNodeID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sOrder == "" || sOperation == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sWorkCenterID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sRunID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					nodeID : sNodeID,
					order : sOrder,
					operation : sOperation,
					workCenterID : sWorkCenterID,
					runID : sRunID
			};
			respOData = this.getOData("getStandardValuesInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesreportAllQuantitiesAndStandardValueDataCollection = function(
			client, allDataCollection, standardValueDataCollection) {

		var requestOData = {};
		var respOData;
		try {
			requestOData.client = client;

			if (allDataCollection != undefined) {
				if (allDataCollection.length > 0) {
					requestOData.allDataCollection = allDataCollection;
				}
			}

			if (standardValueDataCollection != undefined) {
				if (standardValueDataCollection.length > 0) {
					requestOData.standardValueDataCollection = standardValueDataCollection;
				}
			}

			respOData = this.getOData("ReportAllQuantitiesInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.pauseProductionRun = function(sRunID, sEndTimeStamp) {
		if (sRunID == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}
		var endTimeStamp;
		if (sEndTimeStamp) {
			endTimeStamp = sEndTimeStamp ; /*sap.oee.ui.Utils
			.removePlantTimezoneTimeOffsetAndSendUTC(sEndTimeStamp,
					this.globalAppData.plantTimezoneOffset);*/
		}
		try {
			var requestOData;
			if (sEndTimeStamp !== undefined) {
				requestOData = {
						runID : sRunID,
						endTimestamp : endTimeStamp
				};
			} else {
				requestOData = {
						runID : sRunID
				};
			}
			var respOData = this.getOData("PauseProductionRunInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.resumeProductionRun = function(runId, shiftId, sShiftGrouping,
			sWorkBreakSchedule, sRepShiftDate, sRepShiftTime,
			productionActivity, capacityNodeIDList,crewSize) {
		/*if (runId == undefined) {
			createMessage(oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"), sap.ui.core.MessageType.Error);
			return;
		}else*/
		if (shiftId == undefined || sShiftGrouping == undefined
				|| sRepShiftDate == undefined || sRepShiftTime == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_SHIFT"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var runStartTimeStamp;
			if (sRepShiftDate != '' && sRepShiftTime) {
				var startTimestampTemp = new Date(sRepShiftDate + ' '
						+ sRepShiftTime).getTime();
				runStartTimeStamp = sap.oee.ui.Utils
				.removePlantTimezoneTimeOffsetAndSendUTC(
						startTimestampTemp,
						this.globalAppData.plantTimezoneOffset);
			}
			var requestOData = {
					runID : runId,
					reportingShiftID : shiftId,
					shiftGrouping : sShiftGrouping,
					workBreakSchedule : sWorkBreakSchedule,
					startTimestamp : runStartTimeStamp,
					crewSize : crewSize
			};

			if (productionActivity) {
				requestOData.productionActivity = productionActivity;
			}
			if (capacityNodeIDList) {
				requestOData.capacityNodeIDList = capacityNodeIDList;
			}

			var respOData = this.getOData("ResumeProductionRunInput",
					requestOData);

			return (respOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

	};

	this.interfacesGetAllStatus = function(sClient, sPlant) {
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant
			};
			var respOData = this.getOData("GetAllStatusInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData.statusDTOList.results;
	};

	this.getProductionActivityForNode = function(sClient, sPlant, sNodeID) {
		if (sClient == null || sPlant == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
		} else if (sNodeID == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
		}
		try {

			requestOData = {
					client : sClient,
					plant : sPlant,
					nodeID : sNodeID
			};
			respOData = this.getOData("GetProductionActivitiesForNodeInput",
					requestOData);
			return respOData;

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getDataCollectionElementsForRawMaterial = function(Client, requestType) {
		if (Client == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var nodeInput = {};
		var result;
		try {
			nodeInput.client = Client;
			nodeInput.requestType = requestType;
			result = this.getOData("RawMaterialDCInput", nodeInput);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return result;
	};

	this.getRawMaterials = function(Client, Plant, CurrentOrder,
			CurrentOperationNo, ReleaseOrderQuantity, runID, dcElement,
			timeElementType) {
		if (Client == "" || Plant == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (CurrentOrder == "" || CurrentOperationNo == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (runID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (ReleaseOrderQuantity == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ENTER_RELEASE_QTY"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (dcElement == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		var respOData;
		try {
			var requestOData = {
					client : Client,
					rawMaterialRequestType : "STANDALONE",
					plant : Plant,
					order : CurrentOrder,
					operation : CurrentOperationNo,
					releaseOrderQuantity : ReleaseOrderQuantity,
					runID : runID,
					dcElement : dcElement,
					timeElementType : timeElementType
			};
			respOData = this.getOData("GetRawMaterialDetailsInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.reportOtherQuantities = function(Client, DataCollection) {
		if (Client == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var nodeInput = {};
		var result;
		try {
			nodeInput.client = Client;
			nodeInput.reportQuantityType = "OTHER_QUANTITY";
			if (DataCollection.length > 0) {
				nodeInput.dataCollection = DataCollection;

				var allDataCollection = [];
				allDataCollection.push(nodeInput);
				return this.reportAllQuantities(Client, allDataCollection);
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return;
	};

	this.reportAllQuantities = function(client, allDataCollection) {

		var requestOData = {};
		var respOData;
		try {
			requestOData.client = client;
			if (allDataCollection != undefined) {
				if (allDataCollection.length > 0) {
					requestOData.allDataCollection = allDataCollection;
					respOData = this.getOData("ReportAllQuantitiesInput",
							requestOData);
				}
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getProductionRunDataForRunAndDcElems = function(dcElements, matList) {

		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			requestOData.runID = this.globalAppData.selected.runID;

			if (dcElements != undefined && dcElements.length > 0) {
				requestOData.dataCollectionElements = dcElements;
			}

			if (matList != undefined && matList.length > 0) {
				requestOData.materialList = matList;
			}

			respOData = this.getOData("GetDataCollectionForRunIDAndDCElements",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.getProductionRunDataForRunAndDcElemsAndTimeInterval = function(
			dcElements, timeInterval, isGetMethod) {
		var respOData;
		try {

			var requestOData = {};
			var runIDList = [];
			var runID = {
					client : this.globalAppData.client,
					runID : this.globalAppData.selected.runID
			};
			runIDList.push(runID);
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			requestOData.runIDList = runIDList;
			requestOData.timeInterval = timeInterval;

			if (dcElements != undefined && dcElements.length > 0) {
				requestOData.dcElementList = dcElements;
			}

			respOData = this
			.getOData(
					"GetDataCollectionsForRunIDAndDCElementsAndTimeIntervalInput",
					requestOData,undefined, undefined, undefined, isGetMethod);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesDeleteDataCollection = function(sProductionData) {
		if (sProductionData.length == 0) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var i;
		for (dataRecord in sProductionData) {
			sap.oee.ui.Utils.convertProductionData(sProductionData[dataRecord]);
		}

		try {
			var nodeInput = {
					client : this.globalAppData.client,
					details : sProductionData
			};
			var resOData = this
			.getOData("DeleteDataCollectionInput", nodeInput);
			if (resOData.outputCode == 0) {
				sap.oee.ui.Utils.toast(this.oOEEBundle
						.getText("OEE_LABEL_DELETED"));
				return resOData;
			} else {
				return undefined;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getRC = function(client, plant, nodeId, dcElement) {
		if (client == "" || plant == "" || client == undefined
				|| plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (nodeId == "" || nodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_NODE"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeId : nodeId,
					dcElement : dcElement
			};
			var respOData = this.getOData("GetReasonCodeForNodeIdInput",
					requestOData);
			if (respOData != undefined) {
				if (respOData.rcphDCElemAssocList != undefined) {
					return respOData.rcphDCElemAssocList.results;
				}
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,   
					sap.ui.core.MessageType.Error);
		}
		return;
	};

	this.getNextLevelRC = function(client, plant, reasonCode1, reasonCode2,
			reasonCode3, reasonCode4, reasonCode5, reasonCode6, reasonCode7,
			reasonCode8, reasonCode9, reasonCode10, level) {
		if (client == "" || plant == "" || client == undefined
				|| plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (reasonCode1 == "" || reasonCode2 == "" || reasonCode3 == ""
			|| reasonCode4 == "" || reasonCode1 == undefined
			|| reasonCode2 == undefined || reasonCode3 == undefined
			|| reasonCode4 == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_VALID_RC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					reasonCode1 : reasonCode1,
					reasonCode2 : reasonCode2,
					reasonCode3 : reasonCode3,
					reasonCode4 : reasonCode4,
					reasonCode5 : reasonCode5,
					reasonCode6 : reasonCode6,
					reasonCode7 : reasonCode7,
					reasonCode8 : reasonCode8,
					reasonCode9 : reasonCode9,
					reasonCode10 : reasonCode10,
					level : level
			};
			var respOData = this.getOData("GetReasonCodeForLevelInput",
					requestOData);
			if (respOData != undefined) {
				if (respOData.reasonCode != undefined) {
					return respOData.reasonCode.results;
				}
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return;
	};

	this.getReasonCodeForDCElement = function(sClient, sPlant, sDcElement) {
		var requestOData;
		var respOData;
		if (sClient == null || sPlant == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {

			requestOData = {
					client : sClient,
					plant : sPlant,
					dcElement : sDcElement
			};
			respOData = this.getOData("GetReasonCodeForDCElementInput",
					requestOData);
			if (respOData != undefined) {
				if (respOData.reasonCode != undefined) {
					if (respOData.reasonCode.results != undefined) {
						return respOData.reasonCode.results;
					}
				}
			}
			return;

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.updateOtherDataCollectionInBatch = function(runs, sMaterial,
			dcElements, updateType, sUom, iQuantity, oldReason, newReason,
			isFormulaParameter) {
		if ((runs == undefined || runs.length == 0)
				|| (dcElements == undefined || dcElements.length == 0
						|| sUom == undefined || iQuantity == undefined)) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		if (isFormulaParameter == undefined) {
			isFormulaParameter = false;
		}
		try {
			var requestOData = {
					client : this.globalAppData.client,
					materialID : sMaterial,
					runIDList : runs,
					dcElementList : dcElements,
					uom : sUom,
					quantity : "" + iQuantity,
					updateType : updateType,
					formulaParameterFlag : isFormulaParameter
			};
			if (oldReason != undefined)
				requestOData.prevReasonCode = oldReason;
			if (newReason != undefined)
				requestOData.reasonCode = newReason;

			var respOData = this.getOData(
					"GetUpdateOtherDataCollectionInBatchInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getDefaultDataCollectionElement = function(client, plant, nodeID,
			customizationName) {
		var respOData;
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (customizationName == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID,
					customizationName : customizationName
			};
			respOData = this.getOData("GetDefaultDataCollectionElementInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getCustomizationValueForNode = function(client, plant, nodeID,
			customizationName) {
		var respOData;
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (customizationName == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID,
					customizationName : customizationName
			};
			respOData = this.getOData("GetCustomizationValueForNodeInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};
	
	this.getCustomizationValueForNodeList = function(nodeList, nodeId) {
		var respOData, i, currentNodeData;
		var requestOData = [];
		if(nodeList.length < 1) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		else {
			for(i=0; i<nodeList.length; i++) {
				if(nodeList[i].client == undefined || nodeList[i].plant == undefined) {
					sap.oee.ui.Utils.createMessage(this.oOEEBundle
							.getText("OEE_ERR_MSG_NO_CONFIG"),
							sap.ui.core.MessageType.Error);
					return;
				}
				else if (nodeList[i].nodeID == undefined) {
					sap.oee.ui.Utils.createMessage(this.oOEEBundle
							.getText("OEE_ERR_MSG_NO_WC"),
							sap.ui.core.MessageType.Error);
					return;
				} else if (nodeList[i].customizationName == undefined) {
					sap.oee.ui.Utils.createMessage(this.oOEEBundle
							.getText("OEE_ERR_MSG_NO_CONFIG"),
							sap.ui.core.MessageType.Error);
					return;
				}
				currentNodeData = {
						client : nodeList[i].client,
						plant : nodeList[i].plant,
						nodeID : nodeList[i].nodeID,
						customizationName : nodeList[i].customizationName
				};
				requestOData.push(currentNodeData);
			}
		}
		try {
			var requestODataJson = {
				"nodeId": nodeId,
				"inputList": requestOData
			};
			respOData = this.getOData("GetCustomizationValueForNodeInputList",
					requestODataJson);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getAllCustomizationValuesForNode = function(client, plant, nodeID,
			customizationName) {
		var respOData;
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (customizationName == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID,
					customizationName : customizationName
			};
			respOData = this.getOData("GetAllCustomizationValuesForNodeInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getTimeElementsForTimeElementType = function(client, timeElementType) {
		var respOData;

		if (client == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
		} else if (timeElementType == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_TYPE"),
					sap.ui.core.MessageType.Error);
		}
		try {
			var requestOData = {
					client : client,
					timeElementType : timeElementType
			};
			respOData = this.getOData("GetTimeElementsForTimeElementTypeInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

		return respOData;
	};
	this.stopProductionRun = function(releasedId, releasedHeaderId, sStartDate,
			sStartTime) {
		if (releasedId == undefined || releasedHeaderId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sStartDate == undefined || sStartTime == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_START_DATE"),
					sap.ui.core.MessageType.Error);
			return;
		}
		var endTimestamp;
		if (sStartDate && sStartTime) {
			var endTimestampTemp = new Date(sStartDate + ' ' + sStartTime)
			.getTime();
			endTimestamp = sap.oee.ui.Utils
			.removePlantTimezoneTimeOffsetAndSendUTC(endTimestampTemp,
					this.globalAppData.plantTimezoneOffset);
		}
		try {
			var requestOData = {
					releasedID : releasedId,
					releasedHeaderID : releasedHeaderId,
					endTimestamp : endTimestamp
			};
			var respOData = this.getOData("StopProductionRunInput",
					requestOData);
			return respOData;
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

	};

	this.interfacesGetReleasedDemandInputForTimePeriodAndPatternAsync = function(
			sPlant, sCurrentNodeId, sClient, startDate, endDate, sStatus, isShiftRelated, sOrderPattern,
			callBack, oController) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sPlant == "" || sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sCurrentNodeId == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} // Do not delete this code 
		/*else if (sStatus == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_STATUS"),
					sap.ui.core.MessageType.Error);
			return;}*/
		else if (startDate == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ENTER_START_DATE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var oStatusList = [];
		for ( var i = 0; i < sStatus.length; i++) {
			oStatusList.push( {
				name : sStatus[i]
			});
		}

		var releasedDemandInput;

		if (sOrderPattern != undefined) {
			if (startDate != undefined) {
				releasedDemandInput = {
						client : sClient,
						plant : sPlant,
						nodeID : sCurrentNodeId,
						startTimeStamp : startDate,
						endTimeStamp : endDate,
						patternOfOrder : sOrderPattern,
						status : oStatusList,
						shiftRelated : isShiftRelated
				};
			} else {
				releasedDemandInput = {
						client : sClient,
						plant : sPlant,
						nodeID : sCurrentNodeId,
						patternOfOrder : sOrderPattern,
						status : oStatusList,
						shiftRelated: isShiftRelated
				};
			}
		} else {

			releasedDemandInput = {
					client : sClient,
					plant : sPlant,
					nodeID : sCurrentNodeId,
					startTimeStamp : startDate,
					endTimeStamp : endDate,
					status : oStatusList,
					shiftRelated: isShiftRelated
			};
		}
		var respOData = this.getOData(
				"GetReleasedDemandInputForTimePeriodAndPattern",
				releasedDemandInput, true, callBack, oController);

		return respOData;
	};

	this.reportSpeedLoss = function(data) {
		try {
			var respOData = this.getOData("ReportSpeedLoss", data);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.changeProductionActivity = function(sRunID, sProductionActivity) {
		if (sRunID == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
		} else if (sProductionActivity == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_PROD_ACT"),
					sap.ui.core.MessageType.Error);
		}
		try {

			requestOData = {
					runID : sRunID,
					productionActivity : sProductionActivity
			};
			respOData = this.getOData("ChangeProdActInput", requestOData);
			return respOData;

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetAllActivities = function(sClient, sPlant) {
		if (sClient == null || sPlant == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : sClient,
					plant : sPlant
			};
			var respOData = this.getOData("GetAllActivityInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetOrderDetailsAndProductionRunIntervals = function(sNode,
			sOrder, sOperation, sReleasedID) {
		if (sNode == null || sNode == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
		}
		try {
			var requestOData = {
					plant : this.globalAppData.plant,
					client : this.globalAppData.client,
					workcenterId : this.globalAppData.node.workcenterID,
					capacityId : this.globalAppData.node.capacityID,
					nodeId : sNode,
					orderNumber : sOrder,
					operationNumber : sOperation,
					releasedID : sReleasedID
			};
			var respOData = this.getOData(
					"GetProductionRunIntervalsForOrderSimplificationInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.interfacesPerformOrderSimplificationChanges = function(sNode, sOrder,
			sOperation, sReleasedID, sNewStartTimeStamp, sCompleteTimeStamp) {

		if (sNode == null || sNode == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
		}
		try {
			var requestOData = {};
			if (sNewStartTimeStamp != undefined) {
				requestOData = {
						client : this.globalAppData.client,
						plant : this.globalAppData.plant,
						nodeId : sNode,
						workcenterId : this.globalAppData.node.workcenterID,
						capacityId : this.globalAppData.node.capacityID,
						orderNumber : sOrder,
						operationNumber : sOperation,
						releasedID : sReleasedID,
						newStartTimestamp : sNewStartTimeStamp,
						newEndTimestamp : sCompleteTimeStamp
				};
			}
			/*if(sCompleteTimeStamp != undefined){
				requestOData = {
						client : this.globalAppData.client,
						plant :  this.globalAppData.plant,
						nodeId : sNode,
						workcenterId : this.globalAppData.node.workcenterID,
						capacityId : this.globalAppData.node.capacityID,
						orderNumber : sOrder,
						operationNumber : sOperation,
						newEndTimestamp : sCompleteTimeStamp
				};
			}*/
			var respOData = this.getOData(
					"PerformOrderSimplificationChangesInput", requestOData);
			return respOData;
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

	};

	this.interfacesGetDCElementsForProductionAndRejectedQuantities = function() {

		var respOData;
		try {
			var requestOData = {
					client : this.globalAppData.client
			};
			respOData = this.getOData(
					"GetDCElementsForProductionAndRejectedQuantities",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.reportDowntime = function(Plant, CurrentNodeId, Client,
			selectedDCElement, startTimestamp, endTimestamp, selectedRC1,
			selectedRC2, selectedRC3, selectedRC4, selectedRC5, selectedRC6,
			selectedRC7, selectedRC8, selectedRC9, selectedRC10, comments,
			actsAsBottleneck, technicalObject, notificationType, breakdown) {
		var respOData;
		try {
			var requestOData;
			if (endTimestamp != undefined) {
				requestOData = {
						nodeID : CurrentNodeId,
						client : Client,
						plant : Plant,
						dcElement : selectedDCElement,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						rc1 : selectedRC1,
						rc2 : selectedRC2,
						rc3 : selectedRC3,
						rc4 : selectedRC4,
						rc5 : selectedRC5,
						rc6 : selectedRC6,
						rc7 : selectedRC7,
						rc8 : selectedRC8,
						rc9 : selectedRC9,
						rc10 : selectedRC10,
						comments : comments,
						actsAsBottleneck : actsAsBottleneck
				};
			} else {
				requestOData = {
						nodeID : CurrentNodeId,
						client : Client,
						plant : Plant,
						dcElement : selectedDCElement,
						startTimestamp : startTimestamp,
						rc1 : selectedRC1,
						rc2 : selectedRC2,
						rc3 : selectedRC3,
						rc4 : selectedRC4,
						rc5 : selectedRC5,
						rc6 : selectedRC6,
						rc7 : selectedRC7,
						rc8 : selectedRC8,
						rc9 : selectedRC9,
						rc10 : selectedRC10,
						comments : comments,
						actsAsBottleneck : actsAsBottleneck
				};
			}
			if (technicalObject != null) {
				requestOData.technicalObject = technicalObject;
				requestOData.notificationType = notificationType;
				requestOData.breakdown = breakdown;
			}
			var respOData = this.getOData("GetReportDowntimeInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.reportDowntimeMultiple = function(downtimeList) {
		var respOData;
		try {
			var requestOData = {
					client : this.globalAppData.client,
					downStartEndList : downtimeList
			};

			var respOData = this.getOData("ReportMultipleDowntimeInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.updateDowntimeDataInBatch = function(downtimes) { // Do not use if Dependencies have to be maintained ,noChangeOfDependencies will also be true
		var requestOData;
		var responseOData;

		if (downtimes != undefined && downtimes.length > 0) {
			requestOData = {
					client : this.globalAppData.client
			};

			try {
				var i;
				for (downRecord in downtimes) {
					sap.oee.ui.Utils
					.convertProductionRunDownRecordWithoutDependencies(downtimes[downRecord]);
				}

				requestOData.listOfIoProductionRunDowntime = downtimes;

				responseOData = this.getOData("GetUpdateDowntimeInBatch",
						requestOData);
			} catch (e) {
				sap.oee.ui.Utils.createMessage(e.message,
						sap.ui.core.MessageType.Error);
			}
			return responseOData;
		}
	};

	this.updateDowntimeData = function(newStartTimeStamp, newEndTimeStamp,
			retrievedDowntime, bNoChangeOfDependencies, eventMapList,
			eventNodeMapList, sharingProductionRuns) {
		var requestOData;
		var responseOData;

		try {
			requestOData = {
					client : retrievedDowntime.client,
					plant : retrievedDowntime.plant,
					nodeID : retrievedDowntime.nodeID,
					runID : retrievedDowntime.runID,
					downID : retrievedDowntime.downID,
					dcElement : retrievedDowntime.dcElement,
					startTimestamp : newStartTimeStamp,
					version : retrievedDowntime.version,
					rc1 : retrievedDowntime.rc1,
					rc2 : retrievedDowntime.rc2,
					rc3 : retrievedDowntime.rc3,
					rc4 : retrievedDowntime.rc4,
					rc5 : retrievedDowntime.rc5,
					rc6 : retrievedDowntime.rc6,
					rc7 : retrievedDowntime.rc7,
					rc8 : retrievedDowntime.rc8,
					rc9 : retrievedDowntime.rc9,
					rc10 : retrievedDowntime.rc10,
					comments : retrievedDowntime.comments,
					actsAsBottleneck : retrievedDowntime.actsAsBottleneck,
					eventType : retrievedDowntime.eventType,
					endTimestamp : newEndTimeStamp,
					startTimestampUtc : retrievedDowntime.startTimeStampUtc,
					endTimestampUtc : retrievedDowntime.endTimeStampUtc,
					createdBy : retrievedDowntime.createdBy,
					changedBy : retrievedDowntime.changedBy,
					creationTimestamp : retrievedDowntime.creationTimeStamp,
					changeTimestamp : retrievedDowntime.changeTimeStamp,
					erpSendTimestamp : retrievedDowntime.erpSendTimeStamp,
					baseUom : retrievedDowntime.baseUom,
					quantityInBaseUom : retrievedDowntime.quantityInBaseUom,
					quantity : retrievedDowntime.quantity,
					uom : retrievedDowntime.uom,
					material : retrievedDowntime.material,
					notificationNo : retrievedDowntime.notificationNo,
					hanaSendTimestamp : retrievedDowntime.hanaSendTimeStamp,
					quantityInStandardRateUOM : retrievedDowntime.quantityInStandardRateUOM,
					crewSize : retrievedDowntime.crewSize  ,
					standardDuration : retrievedDowntime.standardDuration, 
					material : retrievedDowntime.material,
					toMaterial : retrievedDowntime.toMaterial,
					effectiveDuration : retrievedDowntime.effectiveDuration,
					frequency : retrievedDowntime.frequency,
					entryType : retrievedDowntime.entryType
			};

			if (bNoChangeOfDependencies != undefined) {
				if (eventMapList != undefined && eventMapList.length > 0)
					requestOData.associatedProductionEvents = eventMapList;
				if (eventNodeMapList != undefined
						&& eventNodeMapList.length > 0)
					requestOData.rootcauseMachines = eventNodeMapList;
				if (sharingProductionRuns != undefined
						&& sharingProductionRuns.length > 0)
					requestOData.sharingProductionRuns = sharingProductionRuns;
			} else {
				requestOData.noChangeOfDependencies = true; //Will be True By Default
			}

			sap.oee.ui.Utils.convertProductionRunDownRecord(requestOData);

			if (requestOData.startTimestamp > requestOData.endTimestamp) {
				sap.oee.ui.Utils.createMessage(this.oOEEBundle
						.getText("OEE_MESSAGE_INVALID_TIME"),
						sap.ui.core.MessageType.Error);
				return;
			}
			if(retrievedDowntime.crewSize === 0){
				requestOData.crewSize = retrievedDowntime.crewSize  ;
			}
			if(retrievedDowntime.standardDuration === 0){
				requestOData.standardDuration = retrievedDowntime.standardDuration  ;
			}
			responseOData = this.getOData("GetUpdateDowntimeInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return responseOData;

	};

	this.deleteDowntimeDataInBatch = function(downtimes) {
		var requestOData;
		var responseOData;

		if (downtimes != undefined && downtimes.length > 0) {
			requestOData = {
					client : this.globalAppData.client
			};

			try {
				var i;
				for (downRecord in downtimes) {
					sap.oee.ui.Utils
					.convertProductionRunDownRecordWithoutDependencies(downtimes[downRecord]);
				}

				requestOData.listOfIoProductionRunDowntime = downtimes;

				responseOData = this.getOData("GetDeleteDowntimeInBatch",
						requestOData);
			} catch (e) {
				sap.oee.ui.Utils.createMessage(e.message,
						sap.ui.core.MessageType.Error);
			}
			return responseOData;
		}
	};

	this.deleteDowntimeData = function(downtimeRecord) {

		if (downtimeRecord.client == "" || downtimeRecord.plant == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (downtimeRecord.nodeID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (downtimeRecord.downID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_DT"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (downtimeRecord.version == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var requestOData;

		var responseOData;
		try {

			requestOData = {
					client : downtimeRecord.client,
					plant : downtimeRecord.plant,
					nodeID : downtimeRecord.nodeID,
					runID : downtimeRecord.runID,
					downID : downtimeRecord.downID,
					version : downtimeRecord.version
			};

			responseOData = this.getOData("GetDeleteDowntimeInput",
					requestOData);
			if (responseOData.outputCode == 0) {
				sap.oee.ui.Utils.toast(this.oOEEBundle
						.getText("OEE_MEASSAGE_SUCCESSFUL_DELETE"));
				return responseOData;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return responseOData;

	};

	this.interfacesGetAllRunsForShiftInput = function(sNodeId, sClient, sPlant,
			sShiftId, sStartTimestamp, sShiftGrouping) {
		if (sStartTimestamp == undefined || sShiftId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sClient == undefined || sPlant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sNodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ASSIGN_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var nodeInput = {
					nodeID : sNodeId,
					client : sClient,
					plant : sPlant,
					shiftId : sShiftId,
					shiftStartTimestamp : sStartTimestamp,
					shiftGrouping : sShiftGrouping
			};
			var resOData = this.getOData("GetAllRunsForShift", nodeInput);

			if (resOData != undefined && resOData.runIDList != undefined) {
				if (resOData.runIDList.results != undefined) {
					return resOData.runIDList.results;
				} else {
					return resOData.runIDList;
				}
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetDCElementsForGQ = function(sClient) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var nodeInput = {
				client : sClient
		};
		var resOData = this.getOData("DCElementForGQ", nodeInput);
		return resOData.dataCollectionElements.results;
	};

	this.getDCElementsForDowntimes = function() {
		var respOData;

		try {
			var requestOData = {
					client : this.globalAppData.client,
					plant : this.globalAppData.plant,
					nodeID : this.globalAppData.node.nodeID
			};
			respOData = this.getOData("DCElementForDowntimes", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetShiftHandoverForCurrentShift = function() {
		try {
			var requestOData = {};
			if (this.globalAppData.shift.shiftID != undefined) {
				requestOData.client = this.globalAppData.client;
				requestOData.plant = this.globalAppData.plant;
				requestOData.nodeID = this.globalAppData.node.nodeID;
				requestOData.shiftID = this.globalAppData.shift.shiftID;
				requestOData.shiftStartTimestamp = this.globalAppData.shift.startTimestamp;
				requestOData.shiftEndTimestamp = this.globalAppData.shift.endTimestamp;
				var respOData = this.getOData(
						"GetShiftHandoverForNodeAndShiftInput", requestOData);
				return respOData;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetOrderIndependentDataCollection = function(sClient,
			sPlant, sShiftId, sNodeID, shiftGrouping, sShiftStartTimestamp,sShiftEndTimestamp,
			dcElementList) {
		var respOData;

		if (sShiftId == "" || shiftGrouping == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sClient == "" || sPlant == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					nodeId : sNodeID,
					startTimestamp : sShiftStartTimestamp,
					endTimestamp : sShiftEndTimestamp
			};

			if (dcElementList != "" && dcElementList != undefined) {
				requestOData.dcElements = dcElementList;
			}

			var respOData = this.getOData(
					"GetOrderIndependentDataCollectionForShift", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesUpdateDataCollection = function(sClient, sProductionData) {
		if (sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sProductionData.length == 0) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_EVENT"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var i;
		for (dataRecord in sProductionData) {
			sap.oee.ui.Utils.convertProductionData(sProductionData[dataRecord]);
		}

		try {
			var nodeInput = {
					client : sClient,
					details : sProductionData
			};
			var resOData = this
			.getOData("UpdateDataCollectionInput", nodeInput);
			if (resOData.details != undefined) {
				sap.oee.ui.Utils.toast(this.oOEEBundle
						.getText("OEE_MESSAGE_SUCCESSFUL_UPDATE"));
				return resOData.details.results[0];
			} else {
				return undefined;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getUnscheduledDowntimes = function() {
		var respOData;
		if (this.globalAppData.client == "" || this.globalAppData.plant == ""
			|| this.globalAppData.node.nodeID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : this.globalAppData.client,
					plant : this.globalAppData.plant,
					nodeID : this.globalAppData.node.nodeID
			};
			respOData = this.getOData("DCElementForUD", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesgetUntaggedEventsForGivenRuns = function(runs) {
		if (runs == undefined || (runs != undefined && runs.length == 0)) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : this.globalAppData.client,
					runIDList : runs
			};
			var respOData = this.getOData("GetUntaggedEventsForGivenRunsInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesCloseShift = function(sNodeId, sClient, sPlant,
			shiftGrouping, sShiftId, sStartDate, sEndDate, sStartTime,
			sEndTime, sRestartRun) {
		if (sStartDate == undefined || sEndDate == undefined
				|| sStartTime == undefined || sEndTime == undefined
				|| sShiftId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sNodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sClient == undefined || sPlant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					nodeID : sNodeId,
					client : sClient,
					plant : sPlant,
					shiftGrouping : shiftGrouping,
					shiftId : sShiftId,
					shiftStartTimestamp : new Date(sStartDate + ' ' + sStartTime)
			.getTime(),
			restartRunInNextShift : sRestartRun

			};
			var respOData = this.getOData("CloseShiftInput", requestOData);
			return respOData;
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesSaveShiftHandover = function(sUserName, shiftHandoverTo,
			sComments) {
		try {
			var requestOData = {};
			if (this.globalAppData.shift.startTimestamp != undefined
					&& this.globalAppData.shift.endTimestamp != undefined) {
				requestOData.client = this.globalAppData.client;
				requestOData.plant = this.globalAppData.plant;
				requestOData.nodeID = this.globalAppData.node.nodeID;
				requestOData.shiftID = this.globalAppData.shift.shiftID;
				requestOData.shiftStartTimestamp = this.globalAppData.shift.startTimestamp;
				requestOData.shiftEndTimestamp = this.globalAppData.shift.endTimestamp;
				requestOData.shiftHandoverTo = shiftHandoverTo;
				requestOData.shiftHandoverBy = sUserName;
				if (sComments != undefined && sComments != "") {
					requestOData.comments = sComments;
				}

				var respOData = this.getOData("SaveShiftHandoverInput",
						requestOData);
				return respOData;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getDowntimeForNode = function(sClient, sPlant, sNode) {
		var requestOData;
		var respOData;
		if (sPlant == null || sClient == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sNode == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_NODE"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			requestOData = {
					plant : sPlant,
					client : sClient,
					nodeID : sNode

			};
			respOData = this.getOData("GetDowntimeForNodeInput", requestOData);
			return respOData;

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getActiveOrdersForNodeAndCurrentShiftForSupervisor = function(sNodeId,
			sClient, sPlant, sShiftId, sStartTimestamp, sEndTimestamp,
			sShiftGrouping) {
		if (sStartTimestamp == undefined || sEndTimestamp == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sClient == undefined || sPlant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sNodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ASSIGN_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var nodeInput = {
					nodeID : sNodeId,
					client : sClient,
					plant : sPlant,
					shiftId : sShiftId,
					shiftStartTimestamp : sStartTimestamp,
					shiftGrouping : sShiftGrouping
			};
			var resOData = this.getOData(
					"ActiveOrderForNodeAndCurrentShiftForSupervisorInput",
					nodeInput);
			return resOData;
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getRawMaterialsForYieldBasedConsumption = function(client, plant,
			nodeID, order, operationNo, runID, dcElement, dcQuantities) {

		var respOData;
		var requestOData = {};
		try {
			requestOData.rawMaterialRequestType = "YIELD_BASED_CONSUMPTION";
			requestOData.client = client;
			requestOData.plant = plant;
			requestOData.nodeID = nodeID;
			requestOData.order = order;
			requestOData.operation = operationNo;
			requestOData.runID = runID;
			requestOData.dcElement = dcElement;
			if (dcQuantities != undefined) {
				if (dcQuantities.length > 0) {
					requestOData.dcQuantities = dcQuantities;
				}
			}
			respOData = this.getOData("GetRawMaterialDetailsInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetHourlyQuantityCollectedForRunByDCElements = function(
			dcElements) {

		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			requestOData.nodeID = this.globalAppData.node.nodeID;
			requestOData.runID = this.globalAppData.selected.runID;
			requestOData.startTimestamp = this.globalAppData.shift.startTimestamp;
			requestOData.endTimestamp = this.globalAppData.shift.endTimestamp;

			if (dcElements != undefined && dcElements.length > 0) {
				requestOData.dataCollectionElements = dcElements;
			}

			respOData = this.getOData(
					"GetHourlyQuantityCollectedForRunByDCElements",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.interfacesGetMachineBreakdownsBetweenTimePeriod = function(client,plant,nodeId,startTimestamp,endTimestamp,timeElementType,isAsync,callback,controller,timeElementTypeList){
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : client,
					plant : plant,
					startTimestamp : startTimestamp,
					endTimestamp : endTimestamp,
					nodeId : nodeId
			};

			if (timeElementType != undefined) {
				requestOData.timeElementType = timeElementType;
			}
			if(timeElementTypeList != undefined){
				var tElementList = [];
				for ( var i = 0; i < timeElementTypeList.length; i++) {
					tElementList.push( {
						value : timeElementTypeList[i]
					});
				}
				requestOData.timeElementTypeList = tElementList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData("GetMachineBreakdownsBetweenTimePeriod", requestOData);;
				return responseOData;
			}
			else
			{
				this.getOData("GetMachineBreakdownsBetweenTimePeriod", requestOData,isAsync,callback,controller); //Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetTopStoppagesBetweenTimePeriod = function(client, plant,
			nodeId, startTimestamp, endTimestamp, timeElementType, runIDList,
			isAsync, callback, controller,isGetMethod) {
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					inputNodeAndTimePeriod : {
						client : client,
						plant : plant,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						timeElementType : timeElementType,
						nodeId : nodeId
					},
					client : client
			};

			if (runIDList != undefined) {
				requestOData.runIDList = runIDList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData(
						"GetTopStoppagesForTimePeriod", requestOData,undefined,undefined,undefined,isGetMethod);
				;
				return responseOData;
			} else {
				this.getOData("GetTopStoppagesForTimePeriod", requestOData,
						isAsync, callback, controller,isGetMethod); // Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetTopMachineDownsForTimePeriod = function(client, plant,
			nodeId, startTimestamp, endTimestamp, timeElementType, runIDList,
			isAsync, callback, controller) {
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					inputNodeAndTimePeriod : {
						client : client,
						plant : plant,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						timeElementType : timeElementType,
						nodeId : nodeId
					},
					client : client
			};

			if (runIDList != undefined) {
				requestOData.runIDList = runIDList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData(
						"GetTopMachineDownsForTimePeriod", requestOData);
				;
				return responseOData;
			} else {
				this.getOData("GetTopMachineDownsForTimePeriod", requestOData,
						isAsync, callback, controller); // Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetTopMachineDownReasonCodesForTimePeriod = function(client,
			plant, nodeId, startTimestamp, endTimestamp, timeElementType,
			runIDList, isAsync, callback, controller) {
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					inputNodeAndTimePeriod : {
						client : client,
						plant : plant,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						timeElementType : timeElementType,
						nodeId : nodeId
					},
					client : client
			};

			if (runIDList != undefined) {
				requestOData.runIDList = runIDList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData(
						"GetTopMachineDownReasonCodesForTimePeriod",
						requestOData);
				;
				return responseOData;
			} else {
				this.getOData("GetTopMachineDownReasonCodesForTimePeriod",
						requestOData, isAsync, callback, controller); //Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetLineAffectingDownsForTimePeriod = function(client,plant,nodeId,startTimestamp,endTimestamp,runIDList,timeElementType,isAsync,callback,controller,isGetMethod){
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					inputNodeAndTimePeriod : {
						client : client,
						plant : plant,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						nodeId : nodeId
					},
					client : client
			};

			if (timeElementType != undefined) {
				requestOData.inputNodeAndTimePeriod.timeElementType = timeElementType;
			}

			if (runIDList != undefined) {
				requestOData.runIDList = runIDList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData("GetLineAffectingDownsForTimePeriod", requestOData,undefined,undefined,undefined,isGetMethod);;
				return responseOData;
			}
			else
			{
				this.getOData("GetLineAffectingDownsForTimePeriod", requestOData,isAsync,callback,controller,isGetMethod); //Make the Async Call
				return;
			}

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetAggregatedMinorStoppagesForWorkcenterAndTimePeriod = function(client,plant,nodeId,startTimestamp,endTimestamp,runIDList,isAsync,callback,controller){
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					inputNodeAndTimePeriod : {
						client : client,
						plant : plant,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						nodeId : nodeId
					},
					client : client
			};

			if (runIDList != undefined) {
				requestOData.runIDList = runIDList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData("GetAggregatedMinorStoppagesForWorkcenterAndTimePeriod", requestOData);;
				return responseOData;
			}
			else
			{
				this.getOData("GetAggregatedMinorStoppagesForWorkcenterAndTimePeriod", requestOData,isAsync,callback,controller); //Make the Async Call
				return;
			}

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetSharedDowntimesBetweenTimePeriod = function(client,plant,nodeId,startTimestamp,endTimestamp,isAsync,callback,controller){
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : client,
					plant : plant,
					startTimestamp : startTimestamp,
					endTimestamp : endTimestamp,
					nodeId : nodeId
			};

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData("GetSharedDowntimesBetweenTimePeriod", requestOData);;
				return responseOData;
			}
			else
			{
				this.getOData("GetSharedDowntimesBetweenTimePeriod", requestOData,isAsync,callback,controller); //Make the Async Call
				return;
			}

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetAggregatedUntaggedDowntimes = function(client, plant,
			nodeId, startTimestamp, endTimestamp, timeElementType, runIDList,
			isAsync, callback, controller,isGetMethod) {
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					inputNodeAndTimePeriod : {
						client : client,
						plant : plant,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						timeElementType : timeElementType,
						nodeId : nodeId
					},
					client : client
			};

			if (runIDList != undefined) {
				requestOData.runIDList = runIDList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData(
						"GetAggregatedUntaggedDowntimes", requestOData,undefined,undefined,undefined,isGetMethod);
				;
				return responseOData;
			} else {
				this.getOData("GetAggregatedUntaggedDowntimes", requestOData,
						isAsync, callback, controller,isGetMethod); // Make the Async Call
				return;
			}

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesBreakdownEvents = function(downtimeToBeCreated,
			downtimeToBeDeleted) {
		if (!downtimeToBeCreated || !downtimeToBeDeleted) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SPLIT_FAIL"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					downtimeToBeCreated : downtimeToBeCreated,
					downtimeToBeDeleted : downtimeToBeDeleted,
					client : this.globalAppData.client
			};

			var responseOData = this.getOData("BreakdownEventsInput",
					requestOData);
			;
			return responseOData;

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetDCElementsForOtherQuantity = function(sClient) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var nodeInput = {
				client : sClient
		};
		var resOData = this.getOData("DCElementForOtherQuantity", nodeInput);
		return resOData.dataCollectionElements.results;
	};

	this.interfacesGetDCElementsForOrderIndependent = function(client) {
		if (client == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client
			};
			respOData = this.getOData("DCElementsForOrderIndependent",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

		return respOData;
	};

	this.interfacesGetTopReasonsBetweenTimePeriod = function(client, plant,
			nodeId, startTimestamp, endTimestamp, timeElementType, runIDList,
			isAsync, callback, controller) {
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					inputNodeAndTimePeriod : {
						client : client,
						plant : plant,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						timeElementType : timeElementType,
						nodeId : nodeId
					},
					client : client
			};

			if (runIDList != undefined) {
				requestOData.runIDList = runIDList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData("GetTopReasonsForTimePeriod",
						requestOData);
				;
				return responseOData;
			} else {
				this.getOData("GetTopReasonsForTimePeriod", requestOData,
						isAsync, callback, controller); // Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getNonSAPDeliveredDCElementsForContext = function(client, context) {
		var respOData;

		if (client == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (context == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONTEXT"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {};
			requestOData = {
					client : client,
					context : context
			};
			var respOData = this.getOData(
					"GetNonSAPDeliveredDCElementsForContext", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getDCElementDetails = function(dcElements) {
		var respOData;

		if (!dcElements) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_DC_ELEMENTS"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {};
			requestOData = {
					client : this.globalAppData.client,
					dataCollectionElements : dcElements
			};
			var respOData = this.getOData("GetDCElementDetails", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.findAllUomsForAGivenUOM = function(client, uom) {
		try {
			var requestOData = {
					client : client,
					uom : uom
			};
			var respOData = this.getOData("FindAllUomsForAGivenUOM",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getWorkcenterPerformanceStripForTimePeriod = function(client, plant,
			nodeId, startTimestamp, endTimestamp, timeElementType, runIDList,
			isAsync, callback, controller) {
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					inputNodeAndTimePeriod : {
						client : client,
						plant : plant,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						timeElementType : timeElementType,
						nodeId : nodeId
					},
					client : client
			};

			if (runIDList != undefined) {
				requestOData.runIDList = runIDList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData(
						"GetWorkCenterPerformanceStripForTimePeriod",
						requestOData);
				;
				return responseOData;
			} else {
				this.getOData("GetWorkCenterPerformanceStripForTimePeriod",
						requestOData, isAsync, callback, controller); //Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getMachinePerformanceStripForTimePeriod = function(client, plant,
			nodeId, startTimestamp, endTimestamp, timeElementType, runIDList,
			isAsync, callback, controller) {
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					inputNodeAndTimePeriod : {
						client : client,
						plant : plant,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp,
						timeElementType : timeElementType,
						nodeId : nodeId
					},
					client : client
			};

			if (runIDList != undefined) {
				requestOData.runIDList = runIDList;
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this
				.getOData("GetMachinePerformanceStripForTimePeriod",
						requestOData);
				;
				return responseOData;
			} else {
				this.getOData("GetMachinePerformanceStripForTimePeriod",
						requestOData, isAsync, callback, controller); //Make the Async Call
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getAffectedProductionDataForOrderSimplificationInput = function(sNode,
			sOrder, sOperation, sReleasedID, sNewStartTimeStamp, sCompleteTimeStamp) {
		if (sNode == null || sNode == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
		}
		try {
			var requestOData = {
					plant : this.globalAppData.plant,
					client : this.globalAppData.client,
					workcenterId : this.globalAppData.node.workcenterID,
					capacityId : this.globalAppData.node.capacityID,
					nodeId : sNode,
					orderNumber : sOrder,
					operationNumber : sOperation,
					releasedID : sReleasedID,
					newStartTimestamp : sNewStartTimeStamp,
					newEndTimestamp : sCompleteTimeStamp
			};
			var respOData = this.getOData(
					"GetAffectedProductionDataForOrderSimplificationInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.getHourlyKPIForWorkcenter = function(sClient, sPlant, sNodeID, runIDs,
			startTimestamp, endTimestamp, isAsync, callback, controller) {
		try {
			if (startTimestamp == undefined || endTimestamp == undefined) {
				sap.oee.ui.Utils.createMessage(this.oOEEBundle
						.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"),
						sap.ui.core.MessageType.Error);
				return;
			}

			var requestOData = {
					client : sClient,
					plant : sPlant,
					nodeID : sNodeID,
					startTimestamp : startTimestamp,
					endTimestamp : endTimestamp
			};

			if (runIDs != undefined) {
				if (runIDs.length > 0) { // check to call odata only if the array
					requestOData.runIDList = runIDs;
				}
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var respOData = this.getOData("GetHourlyOEEKpiInput",
						requestOData);
				return respOData;
			} else
				this.getOData("GetHourlyOEEKpiInput", requestOData, isAsync,
						callback, controller);

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getRunsForOrderAndCheckForUntaggedEventsInput = function(order,
			operation, nodeId) {
		if (order == undefined || operation == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (nodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					nodeID : nodeId,
					order : order,
					routingOperNo : operation
			};
			var respOData = this.getOData(
					"GetRunsAndUntaggedEventsForOrderInput", requestOData);
			if (respOData != undefined) {
				return respOData.runIDList.results;
			} else {
				return respOData;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getOrderIndependentRunForNodeAndTime = function(client, plant, nodeID,
			startTimestamp) {
		if (!client || !plant || !nodeID || !startTimestamp) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeId : nodeID,
					startTimestamp : startTimestamp
			};

			var respOData = this.getOData(
					"GetOrderIndependentProductionRunForNodeInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.getNodeAndImmediateChildrenDetails = function(currentNodeId,
			currentOperationNo, material, runID, dcElement) {
		if (currentNodeId == "" || currentNodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		var nodeInput;
		var respOData;

		try {
			if (runID != undefined && dcElement != undefined) {
				nodeInput = {
						nodeId : currentNodeId,
						routingOperationNo : currentOperationNo,
						material : material,
						runID : runID,
						dcElement : dcElement
				};
			} else {
				nodeInput = {
						nodeId : currentNodeId,
						routingOperationNo : currentOperationNo,
						material : material
				};
			}

			respOData = this.getOData("GetNodeAndImmediateChildrenInput",
					nodeInput);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getNodeAndImmediateChildrenDetailsAsync = function(currentNodeId,
			currentOperationNo, material, runID, dcElement, isAsync, callback, controller) {
		if (currentNodeId == "" || currentNodeId == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		var nodeInput;
		var respOData;

		try {
			if (runID != undefined && dcElement != undefined) {
				nodeInput = {
						nodeId : currentNodeId,
						routingOperationNo : currentOperationNo,
						material : material,
						runID : runID,
						dcElement : dcElement
				};
			} else {
				nodeInput = {
						nodeId : currentNodeId,
						routingOperationNo : currentOperationNo,
						material : material
				};
			}

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				respOData = this.getOData("GetNodeAndImmediateChildrenInput",
						nodeInput);
				return respOData;
			}
			else
			{
				this.getOData("GetNodeAndImmediateChildrenInput", nodeInput,isAsync,callback,controller); //Make the Async Call
				return;
			}

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getDCElementsForFlowTime = function(sClient) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (this.globalAppData.client == ""
			|| this.globalAppData.client == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var nodeInput = {
				client : this.globalAppData.client
		};
		var resOData = this.getOData("DCElementForFlowTime", nodeInput);
		// return resOData.dataCollectionElements.results;
		return resOData;
	};

	this.getProductionRunDataForAnyRunAndDcElems = function(dcElements, runID,
			matList) {

		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			requestOData.runID = runID;

			if (dcElements != undefined && dcElements.length > 0) {
				requestOData.dataCollectionElements = dcElements;
			}

			if (matList != undefined && matList.length > 0) {
				requestOData.materialList = matList;
			}

			respOData = this.getOData("GetDataCollectionForRunIDAndDCElements",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.getRunsForOrderInput = function(sOrder, sOperation, sNode) {
		if (sOrder == undefined || sOperation == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sNode == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					nodeID : sNode,
					order : sOrder,
					routingOperNo : sOperation
			};
			var respOData = this.getOData("GetRunsForOrderInput", requestOData);
			if (respOData.runIDList != undefined) {
				return respOData.runIDList.results;
			} else {
				return respOData.runIDList;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetTotalQuantityCollectedForFormulaParametersInBaseUom = function(
			formulaParameter) {

		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			requestOData.nodeID = this.globalAppData.node.nodeID;
			requestOData.runID = this.globalAppData.selected.runID;

			if (formulaParameter != undefined && formulaParameter.length > 0) {
				requestOData.dataCollectionElements = formulaParameter;
			}

			respOData = this.getOData(
					"GetTotalQuantityCollectedForFormulaParameterInBaseUom",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesRevertOrderAction = function(runID) {
		var respOData;
		try {

			var requestOData = {};
			var respOData;
			requestOData.runID = runID;
			respOData = this.getOData("RevertProductionRunInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.GetAllDowntimesBetweenTimePeriodForANode = function(sClient, sPlant,
			sNodeID, dStartTimestamp, dEndTimestamp, timeElementType) {
		var responseOData;

		if (sClient == "" || sPlant == "" || sNodeID == ""
			|| dStartTimestamp == "" || dEndTimestamp == ""
				|| timeElementType == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sNodeID == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					plant : Plant,
					client : Client,
					nodeID : CurrentNodeId,
					startTimestamp : dStartTimestamp,
					endTimestamp : dEndTimestamp,
					timeElementType : timeElementType
			};

			responseOData = this.getOData(
					"GetAllDowntimesBetweenTimePeriodForANode", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return responseOData;
	};

	this.getCustomizationValueForTimeDimension = function(client, plant,
			nodeID, customizationName) {
		var respOData;
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (customizationName == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID,
					customizationName : customizationName
			};
			respOData = this
			.getOData("GetCustomizationValuesForTimeDimensionInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.abortProductionRun = function(sRunID) {
		if (sRunID == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData;
			requestOData = {
					runID : sRunID
			};

			var respOData = this.getOData("AbortProductionRunInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.createPMNotification = function(client, plant, nodeID, startTimestamp, endTimestamp, technicalObject, notificationType, breakdown,comments,downtimeMapped,downtimeEventID) {
		if (client == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData;
			requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID,
					startTimestamp : startTimestamp,
					endTimestamp : endTimestamp,
					technicalObject : technicalObject,
					notificationType : notificationType,
					breakdown : breakdown,
					downtimeMapped : downtimeMapped,
					downtimeEventID : downtimeEventID,
					comments : comments
			};

			var respOData = this.getOData("CreatePMNotificationInput",requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.retrievePMNotifications = function(client, plant, nodeID, oeeNotificationStatusList, startTimestamp, endTimestamp) {
		if (client == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData;

			if(oeeNotificationStatusList != null){ // Do not send the value if its null : OData Central LIbrary will throw Exception
				requestOData = {
						client : client,
						plant : plant,
						nodeID : nodeID,
						oeeNotificationStatusList : oeeNotificationStatusList,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp
				};
			}
			else{
				requestOData = {
						client : client,
						plant : plant,
						nodeID : nodeID,
						startTimestamp : startTimestamp,
						endTimestamp : endTimestamp
				};
			}


			var respOData = this.getOData("RetrievePMNotificationsInput", requestOData);
		}
		catch( e ){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error); 
		}
		return respOData;
	};

	this.updatePMNotificationDetails = function(client,plant, nodeID, startTimestamp, endTimestamp, technicalObject, notificationType, breakdown,comments, oeeNotificationID, notificationNo, oeeStatus,downtimeMapped, downtimeEventID) {
		if (client == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}

		try{
			var requestOData;
			requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID,
					oeeNotificationID : oeeNotificationID,
					notificationNo : notificationNo,
					startTimestamp : startTimestamp,
					endTimestamp : endTimestamp,
					technicalObject : technicalObject,
					notificationType : notificationType,
					breakdown : breakdown,
					downtimeMapped : downtimeMapped,
					downtimeEventID : downtimeEventID,
					oeeStatus : oeeStatus,
					comments : comments
			};

			var respOData = this.getOData("UpdatePMNotificationDetailsInput",requestOData);

		}
		catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}

		return respOData;
	};

	this.triggerPMNotification = function(oeeNotificationID) {
		if (oeeNotificationID == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error); // TODO : Change the error message
			return;
		}

		try {
			var requestOData = { oeeNotificationID : oeeNotificationID};

			var respOData = this.getOData("TriggerPMNotificationInput",requestOData);
		}
		catch( e ) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.deletePMNotification = function(oeeNotificationID) {
		if (oeeNotificationID == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error); // TODO : Change the error message
			return;
		}

		try {
			var requestOData = { oeeNotificationID : oeeNotificationID};

			var respOData = this.getOData("DeletePMNotificationInput",requestOData);
		}
		catch( e ) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.rejectPMNotification = function(oeeNotificationID) {
		if (oeeNotificationID == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error); // TODO : Change the error message
			return;
		}

		try {
			var requestOData = { oeeNotificationID : oeeNotificationID};

			var respOData = this.getOData("RejectPMNotificationInput",requestOData);
		}
		catch( e ) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.retrieveDowntimePMNotificationMappings = function(oeeNOtificationID, downtimeEventID) {
		if (oeeNotificationID == null && downtimeEventID == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error); // TODO : Change the error message
			return;
		}

		try {
			var requestOData = { oeeNotificationID : oeeNotificationID};

			var respOData = this.getOData("RetrieveDowntimePMNotificationMappingsInput",requestOData);
		}
		catch( e ) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.retrievePMNotificationsForIDList = function(oeeNotificationIDListObject) {
		if (oeeNotificationIDListObject == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_ORDER"),
					sap.ui.core.MessageType.Error); // TODO : Change the error message
			return;
		}

		try {
			var requestOData = oeeNotificationIDListObject;
			var respOData =  this.getOData("RetrievePMNotificationsForIDListDetailsInput",requestOData);
		}
		catch( e ) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};


	this.interfacesGetNonStandardReportEventsForLineAndChildrenForTimePeriod = function(client,plant,nodeId,startTimestamp,endTimestamp,isAsync,callback,controller){
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : client,
					plant : plant,
					startTimestamp : startTimestamp,
					endTimestamp : endTimestamp,
					nodeId : nodeId
			};

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData("GetNonStandardEventsForWorkcenterAndChildrenBetweenTimePeriod", requestOData);;
				return responseOData;
			}
			else
			{
				this.getOData("GetNonStandardEventsForWorkcenterAndChildrenBetweenTimePeriod", requestOData,isAsync,callback,controller); //Make the Async Call
				return;
			}

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetComponentListForOrder = function(oData,isAsync,callback,controller) {
		if (oData.client == "" || oData.plant == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (oData.orderNumber == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var respOData;
		try {
			if(isAsync){
				this.getOData("GetComponentListOfOrderInput",oData,true,callback,controller);
			}else{
				respOData = this.getOData("GetComponentListOfOrderInput",oData);
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesUpdateReservationForOrderInput = function(client,plant,orderNum,reservationNo,reservationItemNumber,material,quantityWithdrawn,baseUom){
		if (client == "" || plant == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (orderNum == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_ORDER"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var respOData;
		try {
			var requestOData = {
					client : client,
					plant : plant,				order : orderNum,
					reservationNumber : reservationNo,
					material : material,
					quantityWithdrawn : quantityWithdrawn,
					reservationItemNumber : reservationItemNumber,
					baseUOM : baseUom
			};
			respOData = this.getOData("UpdateReservationForOrderInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};


	this.interfacesUpdateUserPreferences = function(client,plant,param,paramValue,isAsync){
		if (!client && !plant && !param && !paramValue) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var respOData;
		try {
			var requestOData = {
					client : client,
					plant : plant,
					param : param,
					paramValue : paramValue
			};
			respOData = this.getOData("UpdateUserPreferencesInput",
					requestOData, isAsync);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetDataCollectionForNodeAndRunAndDcElementAndTimePeriod = function(runIDList,nodeId,dcElementList,startTimestamp,endTimestamp,includeConfirmations){
		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			requestOData.nodeId = nodeId;
			requestOData.includeConfirmations = includeConfirmations;
			if (runIDList != undefined && runIDList.length > 0) {
				requestOData.runIdList = runIDList;
			}

			if (dcElementList != undefined && dcElementList.length > 0) {
				requestOData.dcElements = dcElementList;
			}

			if (startTimestamp != undefined) {
				requestOData.startTimestamp = startTimestamp;
			}

			if (endTimestamp != undefined) {
				requestOData.endTimestamp = endTimestamp;
			}

			respOData = this.getOData("GetDataCollectionForNodeAndRunAndDcElementAndTimePeriod",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.interfacesGetTotalRejectedAndProducedQuantityInFinishedMaterialUomForLineAndChildren = function(nodeId,runIDList,shiftStartTimestamp,shiftEndTimestamp){
		var respOData;
		try {

			var requestOData = {};
			requestOData.client = this.globalAppData.client;
			requestOData.plant = this.globalAppData.plant;
			requestOData.nodeId = nodeId;
			if (runIDList != undefined && runIDList.length > 0) {
				requestOData.runIdList = runIDList;
			}

			if (shiftStartTimestamp != undefined) {
				requestOData.startTimestamp = shiftStartTimestamp;
			}

			if (shiftEndTimestamp != undefined) {
				requestOData.endTimestamp = shiftEndTimestamp;
			}

			respOData = this.getOData("GetTotalRejectedAndProducedQuantityInFinishedMaterialUomForLineAndChildren",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.interfacesGetAllDowntimesForWorkcenterAndChildrenBetweenTimePeriod = function(client,plant,nodeId,startTimestamp,endTimestamp,isAsync,callback,controller){
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : client,
					plant : plant,
					startTimestamp : startTimestamp,
					endTimestamp : endTimestamp,
					nodeId : nodeId
			};

			if (isAsync != true || isAsync == undefined || isAsync == "") {
				var responseOData = this.getOData("GetAllDowntimesForWorkcenterAndChildrenBetweenTimePeriod", requestOData);;
				return responseOData;
			}
			else
			{
				this.getOData("GetAllDowntimesForWorkcenterAndChildrenBetweenTimePeriod", requestOData,isAsync,callback,controller); //Make the Async Call
				return;
			}

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesGetAllAlternateUOMs = function(client,material,isAsync, callback, controller) {
		var respOData;
		try {
			var requestOData = {
					client : client || this.globalAppData.client,
					matnr : material || this.globalAppData.selected.material.id
			};
			if (isAsync != true) {
				respOData = this
				.getOData("GetAlternateUoMInput",
						requestOData);

				return respOData.uomList;
			} else {
				this.getOData(
						"GetAlternateUoMInput",
						requestOData, isAsync, callback, controller);
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(respOData.outputMessage,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getAllPackageIDSForOrder = function(requestOData,isAsync,callback,controller){
		var respOData;
		try{
			if (isAsync != true) {
				respOData = this.getOData("SSCReversalInput",requestOData);

				return respOData;
			} else {
				this.getOData("SSCReversalInput",requestOData, isAsync, callback, controller);
			}
		}catch(e){
			sap.oee.ui.Utils.createMessage(respOData.outputMessage,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getPackageIDOrBatchDetails = function(requestOData,isAsync,callback,controller){
		var respOData;
		try{
			if (isAsync != true) {
				respOData = this.getOData("GetPackageIDOrBatchDetails",requestOData);

				return respOData;
			} else {
				this.getOData("GetPackageIDOrBatchDetails",requestOData, isAsync, callback, controller);
			}
		}catch(e){
			sap.oee.ui.Utils.createMessage(respOData.outputMessage,
					sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetReleasedDemandInputForTimePeriodAndPatternWithGRQuantityAsync = function(
			sPlant, sCurrentNodeId, sClient, startDate, sStatus, sOrderPattern,
			callBack, oController) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sPlant == "" || sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sCurrentNodeId == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (sStatus == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_SELECT_STATUS"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (startDate == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_ENTER_START_DATE"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var oStatusList = [];
		for ( var i = 0; i < sStatus.length; i++) {
			oStatusList.push( {
				name : sStatus[i]
			});
		}

		var releasedDemandInput;

		if (sOrderPattern != undefined) {
			if (startDate != undefined) {
				releasedDemandInput = {
						client : sClient,
						plant : sPlant,
						nodeID : sCurrentNodeId,
						startTimeStamp : startDate,
						patternOfOrder : sOrderPattern,
						status : oStatusList
				};
			} else {
				releasedDemandInput = {
						client : sClient,
						plant : sPlant,
						nodeID : sCurrentNodeId,
						patternOfOrder : sOrderPattern,
						status : oStatusList
				};
			}
		} else {

			releasedDemandInput = {
					client : sClient,
					plant : sPlant,
					nodeID : sCurrentNodeId,
					startTimeStamp : startDate,
					status : oStatusList
			};
		}
		var releasedDemandDetails = this.getOData(
				"GetReleasedDemandForTimePeriodAndPatternInputWithGoodsReceiptQuantity",
				releasedDemandInput, true, callBack, oController);

		return releasedDemandDetails;
	};

	this.GetMaterialListForGivenMaterialType = function(requestOData,isAsync,callback,controller){
		var respOData;
		try{
			if (isAsync != true) {
				respOData = this.getOData("GetMaterialListForGivenMaterialType",requestOData);
				return respOData;
			} else {
				this.getOData("GetMaterialListForGivenMaterialType",requestOData, isAsync, callback, controller);
			}
		}catch(e){
			sap.oee.ui.Utils.createMessage(respOData.outputMessage,
					sap.ui.core.MessageType.Error);
		}
	};

	this.reportGoodsMovement = function(requestOData,isAsync,callback,controller){
		var respOData;
		try{
			if (isAsync != true) {
				respOData = this.getOData("ReportGoodsMovementInput",requestOData);
				return respOData;
			} else {
				this.getOData("ReportGoodsMovementInput",requestOData, isAsync, callback, controller);
			}
		}catch(e){
			sap.oee.ui.Utils.createMessage(respOData.outputMessage,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getPlantHierarchyDataForPublishedAndDeleted = function(client, plant){
		var respOData;
		try {
			if (!client && !plant) {
				sap.oee.ui.Utils.createMessage(this.oOEEBundle
						.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
				return;
			} 
			var requestOData = {
					client : client,
					plant : plant
			};
			respOData = this.getOData("CreatePlantHierarchyForPublishedAndDeletedInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getPHNodeDetails = function(sClient,sPlant,sNodeID){
		var requestOData;
		var respOData;
		if(sClient==null||sPlant==null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return ;
		} else if(sNodeID==null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_NODE"), sap.ui.core.MessageType.Error);
			return ;
		}
		try{
			requestOData={
					client:sClient,
					plant:sPlant,
					nodeID:sNodeID
			};
			respOData=this.getOData("GetPHNodeDetailsInput",requestOData);
			return respOData;
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}	
	};

	this.getAllPODs = function(client, plant){
		var respOData;

		try {
			if (client && plant) {
				var requestOData = {
						client : client,
						plant : plant
				};
				respOData = this.getOData("GetAllPodsInput", requestOData);
			} else {
				sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getAllLayouts = function(){
		var respOData;

		try {
			var requestOData = {inputEntitySet: "GetAllLayoutInput"};
			respOData = this.getOData("DefaultInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;

	};
	this.getAllActivitiesWithDesc = function(sClient, sPlant){
		if (!sClient || !sPlant) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}

		var respOData;
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant
			};
			respOData = this.getOData("GetAllActivityWithDescInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getCurrentLoggedInUserDetails =function(){
		var respOData;

		try {
			var requestOData = {
					inputEntitySet : "GetCurrentUserDetailsInput"
			};
			respOData = this.getOData("DefaultInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getClientsAndPlantsAssignedForLoggedInUser = function() {
		var respOData;

		try {
			var requestOData = {
					inputEntitySet : "GetClientsAndPlantsForUserInput"
			};
			respOData = this.getOData("DefaultInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getPODDetails = function(sClient,sPlant,sPODId){

		if (!sClient && !sPlant) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}

		try{
			var requestOData = {
					client : sClient,
					plant:sPlant,
					podId:sPODId
			};

			var respOData = this.getOData("GetPODDetailsInput", requestOData);

		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.updatePODs = function(sclient,splant,spodId,spodType,spodLayout,sVersion,sPODDescList,sPODButtonList,sPODPanelList,podImage){

		if (sclient==null || splant==null || sVersion==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		} else if (spodId==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_ID"), sap.ui.core.MessageType.Error);
			return;
		} else if (spodType==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_TYPE"), sap.ui.core.MessageType.Error);
			return;
		} else if (spodLayout==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_LAYOUT"), sap.ui.core.MessageType.Error);
			return;
		} else if (sPODDescList==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_DESC"), sap.ui.core.MessageType.Error);
			return;
		} else if (sPODButtonList==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_BTN"), sap.ui.core.MessageType.Error);
			return;
		} else if (sPODPanelList.length==0) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_PANEL"), sap.ui.core.MessageType.Error);
			return;
		}
		try{
			if(sPODDescList.length==0 && sPODButtonList.length==0){
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podImage : podImage,
						podLayout:spodLayout,  
						version:sVersion,
						podPanelDTOList:sPODPanelList
				};
			}else if (sPODDescList.length==0 ){
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podImage : podImage,
						podLayout:spodLayout,  
						podButtonDTOList:sPODButtonList,
						podPanelDTOList:sPODPanelList
				};
			}else if(sPODButtonList.length==0){
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podImage : podImage,
						podLayout:spodLayout,  
						podDescDTOList : sPODDescList,
						podPanelDTOList:sPODPanelList
				};
			}else {
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podImage : podImage,
						podLayout:spodLayout,  
						podDescDTOList : sPODDescList,
						podButtonDTOList:sPODButtonList,
						podPanelDTOList:sPODPanelList
				};
			}

			this.removePODNeedlessParams(requestOData);
			var respOData = this.getOData("UpdatePodInput", requestOData);
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}

		return respOData;	
	};

	this.savePODs = function(sclient, splant, spodId, spodType, spodLayout, sPODDescList,
			sPODButtonList, sPODPanelList,podImage){
		if (sclient==null||splant==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		} else if (spodId==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_ID"), sap.ui.core.MessageType.Error);
			return;
		} else if (spodType==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_TYPE"), sap.ui.core.MessageType.Error);
			return;
		} else if (spodLayout==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_LAYOUT"), sap.ui.core.MessageType.Error);
			return;
		} else if (sPODDescList==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_DESC"), sap.ui.core.MessageType.Error);
			return;
		} else if (sPODButtonList==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_BTN"), sap.ui.core.MessageType.Error);
			return;
		} else if (sPODPanelList.length==0) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_PANEL"), sap.ui.core.MessageType.Error);
			return;
		}
		try{
			if(sPODDescList.length==0 && sPODButtonList.length==0){
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podImage : podImage,
						podLayout:spodLayout,  
						podPanelDTOList:sPODPanelList
				};
			}else if (sPODDescList.length==0 ){
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podImage : podImage,
						podType:spodType,
						podLayout:spodLayout,  
						podButtonDTOList:sPODButtonList,
						podPanelDTOList:sPODPanelList
				};
			}else if(sPODButtonList.length==0){
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podImage : podImage,
						podLayout:spodLayout,  
						podDescDTOList : sPODDescList,
						podPanelDTOList:sPODPanelList
				};
			}else {
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podImage : podImage,
						podLayout:spodLayout,  
						podDescDTOList : sPODDescList,
						podButtonDTOList:sPODButtonList,
						podPanelDTOList:sPODPanelList
				};
			}

			this.removePODNeedlessParams(requestOData);
			var respOData = this.getOData("SavePodInput", requestOData);
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;	
	};
	this.interfacesDeleteActivity = function (sClient, sPlant, OActivityDTOList) {
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					activityDTOList : OActivityDTOList
			};


			var respOData = this.getOData("DeleteActivityInput", requestOData);
			if(respOData.outputCode === 1){
				return false ;
			}else if(respOData.outputCode !== 1) {
				return true ; 
			}

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
			return(false);
		}
		//return true;
	};
	this.interfacesSaveActivity = function(sClient, sPlant, OActivityDTOList) {
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					activityDTOList : OActivityDTOList
			};
			var respOData = this.getOData("SaveActivityInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};
	this.interfacesModifyActivity = function(sClient, sPlant, OActivityDTOList) {
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant,
					activityDTOList : OActivityDTOList
			};
			var respOData = this.getOData("UpdateActivityInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.deletePOD = function(sclient, splant, spodId, spodType, spodLayout,sVersion,sPODDescList,
			sPODButtonList, sPODPanelList) {
		if (sclient==null||splant==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		} else if (spodId==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_ID"), sap.ui.core.MessageType.Error);
			return;
		} else if (spodType==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_TYPE"), sap.ui.core.MessageType.Error);
			return;
		} else if (spodLayout==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_LAYOUT"), sap.ui.core.MessageType.Error);
			return;
		} else if (sPODDescList==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_DESC"), sap.ui.core.MessageType.Error);
			return;
		} else if (sPODButtonList==null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_BTN"), sap.ui.core.MessageType.Error);
			return;
		} else if (sPODPanelList.length==0) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_POD_PANEL"), sap.ui.core.MessageType.Error);
			return;
		}
		try{
			if(sPODDescList.length==0 && sPODButtonList.length==0){
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podLayout:spodLayout,  
						version:sVersion,
						podPanelDTOList:sPODPanelList
				};
			}else if (sPODDescList.length==0 ){
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podLayout:spodLayout,
						version:sVersion,
						podButtonDTOList:sPODButtonList,
						podPanelDTOList:sPODPanelList
				};
			}else if(sPODButtonList.length==0){
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podLayout:spodLayout,
						version:sVersion,
						podDescDTOList : sPODDescList,
						podPanelDTOList:sPODPanelList
				};
			}else {
				var requestOData = {
						client : sclient,
						plant : splant,
						podId:spodId,
						podType:spodType,
						podLayout:spodLayout,
						version:sVersion,
						podDescDTOList : sPODDescList,
						podButtonDTOList:sPODButtonList,
						podPanelDTOList:sPODPanelList
				};
			}

			this.removePODNeedlessParams(requestOData);
			var respOData = this.getOData("GetDeletePodInput",requestOData);
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;	
	};

	this.removePODNeedlessParams = function(requestOData){
		if(requestOData.podImage === ""){
			delete requestOData.podImage;
		}
		if(requestOData.podButtonDTOList != undefined && requestOData.podButtonDTOList.length > 0){
			for(var iterator in requestOData.podButtonDTOList){
				if(requestOData.podButtonDTOList[iterator].imageIcon === ""){
					delete requestOData.podButtonDTOList[iterator].imageIcon;
				}
			}
		}
	};

	this.interfacesGetSystemDetailsForClientAndPlant = function(sClient, sPlant) {
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant
			};
			var respOData = this.getOData("GetSystemDetailsForClientAndPlantInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.interfacesgetAllChangeLog = function(sClient,sPlant, oActivityType, oBOType, sStartTimeStamp, sEndTimeStamp ) {
		var respOData;
		if (sClient == "" || sPlant == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData;
			if(oActivityType == null && oBOType == null){
				requestOData = {
						client: sClient,
						plant: sPlant,
						startTimestamp: sStartTimeStamp,
						endTimestamp: sEndTimeStamp
				};
			}
			else if(oActivityType != null && oBOType != null){
				requestOData = {
						client: sClient,
						plant: sPlant,
						boType: oBOType,
						actionType: oActivityType,
						startTimestamp: sStartTimeStamp,
						endTimestamp: sEndTimeStamp 
				};
			}
			else if(oActivityType != null){
				requestOData = {
						client: sClient,
						plant: sPlant,
						actionType: oActivityType,
						startTimestamp: sStartTimeStamp,
						endTimestamp: sEndTimeStamp			
				};
			}
			else if(oBOType != null){
				requestOData = {
						client: sClient,
						plant: sPlant,
						boType: oBOType,
						startTimestamp: sStartTimeStamp,
						endTimestamp: sEndTimeStamp			
				};
			}

			respOData = this.getOData("GetChangeLogInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	},

	this.getPlantHierarchyData = function(client, plant) {
		var respOData;

		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant
			};
			respOData = this.getOData("CreatePlantHierarchyInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getAllUMEUserGroups = function(filter,sizeLimit){
		var respOData;
		try {
			var requestOData = {
					client: "",
					filter: filter,
					sizeLimit: sizeLimit
			};
			respOData = this.getOData("GetAllUserGroupsInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getConfigAdminUserGroupAssignmentData = function(client, plant, nodeID) {
		var respOData;
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		} else if (nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_NODE"), sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID
			};
			respOData = this.getOData("GetConfigAdminUserGroupAssignmentInput",
					requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getUserGroupPodAssignmentData= function(client, plant, nodeID) {
		var respOData;
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		} else if (nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_NODE"), sap.ui.core.MessageType.Error);
			return;
		} 
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID
			};
			respOData = this.getOData("GetUserGroupAssignmentInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.saveUserGroupAssignments = function(saveType, dataToBeCreated, dataToBeModified,dataToBeDeleted) {
		var respOData;
		try {
			if (saveType != undefined) {
				var requestOData = {};
				requestOData.saveType = saveType;
				if (dataToBeCreated != undefined) {
					if (dataToBeCreated.length > 0) {
						requestOData.created = dataToBeCreated;
					}
				}

				if (dataToBeModified != undefined) {
					if (dataToBeModified.length > 0) {
						requestOData.modified = dataToBeModified;
					}
				}

				if (dataToBeDeleted != undefined) {
					if (dataToBeDeleted.length > 0) {
						requestOData.deleted = dataToBeDeleted;
					}
				}

				respOData = this.getOData("SaveUserGroupsInput", requestOData);

			} else {
				sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getAllCustomizationNames = function(client) {
		var respOData;
		try {
			var requestOData = {
					client : client
			};
			respOData = this.getOData("GetCustomizationNameInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getCustomizationValues = function(client, plant, nodeID) {
		var respOData;
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		} else if (nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_NODE"), sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID
			};
			respOData = this.getOData("GetCustomizationValueInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getUOMForDimension = function(dimensionID) {
		try {
			var requestOData = {
					dimid : dimensionID
			};
			var respOData = this.getOData("GetUoMForDimensionInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getAllMaterialsForClient = function(client){
		var respOData;
		try {
			if (client != undefined) {
				var requestOData = {
						client : client
				};
				respOData = this.getOData("GetMaterialForClientInput", requestOData);
			} else {
				sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.saveCustomizationConfigurations = function(dataToBeCreated, dataToBeModified,dataToBeDeleted){
		var respOData;
		try {
			var requestOData = {};
			requestOData.dummy = "";
			if (dataToBeCreated != undefined) {
				if (dataToBeCreated.length > 0) {
					requestOData.created = dataToBeCreated;
				}
			}
			if (dataToBeModified != undefined) {
				if (dataToBeModified.length > 0) {
					requestOData.modified = dataToBeModified;
				}
			}
			if (dataToBeDeleted != undefined) {
				if (dataToBeDeleted.length > 0) {
					requestOData.deleted = dataToBeDeleted;
				}
			}
			respOData = this.getOData("SaveCustomizationValueInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.GetMaterialsForChangeOverForActiveHoldCompleteRuns = function(client,plant,startTimestamp,nodeId){
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var respOData;
			var requestOData = {
					client: client,
					plant: plant,
					startTimestamp: startTimestamp,
					nodeId: nodeId
			};
			respOData = this.getOData("GetMaterialsForChangeOverForActiveHoldCompleteRuns", requestOData);

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;

	};


	this.GetToMaterialsForChangeOverForActiveHoldCompleteRuns = function(client,plant,endTimestamp,nodeId){
		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERROR_MSG_SHIFT_UNAVAILABLE"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var respOData;
			var requestOData = {
					client: client,
					plant: plant,
					startTimestamp: endTimestamp,
					nodeId: nodeId
			};
			respOData = this.getOData("GetToMaterialsForChangeOverForActiveHoldCompleteRuns", requestOData);

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;

	};

	this.getDCElementsForLossCategory = function(client){
		var respOData;

		try {
			var requestOData = {
					client : client
			};
			respOData = this.getOData("DCElementForLossCategory", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getReasonCodeForDCElement =function(sClient, sPlant, sDcElement){
		var requestOData;
		var respOData;
		if(sClient==null||sPlant==null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}
		try{
			requestOData={
					client:sClient,
					plant:sPlant,
					dcElement:sDcElement
			};
			respOData=this.getOData("GetReasonCodeForDCElementInput",requestOData);
			if (respOData != undefined) {
				if (respOData.reasonCode != undefined) {
					if (respOData.reasonCode.results != undefined) {
						return respOData.reasonCode.results;
					}
				} 
			}
			return;

		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};


	this.getRCConfigData = function(client, plant, nodeId) {
		var respOData;
		try {
			if (client == "" || plant == "" || client == undefined || plant == undefined) {
				sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
				return;
			} else if (nodeId != undefined) {
				var requestOData = {
						client : client,
						plant : plant,
						nodeId : nodeId
				};
				respOData = this.getOData("GetAllReasonCodeConfigurationInput",
						requestOData);
			} else {
				sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_WC"), sap.ui.core.MessageType.Error);
				return;
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getNextLevelRC = function(client, plant, reasonCode1, reasonCode2, reasonCode3, reasonCode4, reasonCode5, reasonCode6, reasonCode7, reasonCode8, reasonCode9, reasonCode10, level) {
		if (client == "" || plant == "" || client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		} else if (reasonCode1 == "" || reasonCode2 == "" || reasonCode3 == "" || reasonCode4 == ""
			|| reasonCode1 == undefined || reasonCode2 == undefined || reasonCode3 == undefined || reasonCode4 == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_VALID_RC"), sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					reasonCode1 : reasonCode1,
					reasonCode2 : reasonCode2,
					reasonCode3 : reasonCode3,
					reasonCode4 : reasonCode4,
					reasonCode5 : reasonCode5,
					reasonCode6 : reasonCode6,
					reasonCode7 : reasonCode7,
					reasonCode8 : reasonCode8,
					reasonCode9 : reasonCode9,
					reasonCode10 : reasonCode10,
					level : level
			};
			var respOData = this.getOData("GetReasonCodeForLevelInput", requestOData);
			if (respOData != undefined) {
				if (respOData.reasonCode != undefined) {
					return respOData.reasonCode.results;
				}
			}
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return;
	};


	this.saveRCConfig = function(dataToBeCreated, dataToBeModified,dataToBeDeleted) {
		var respOData;

		try {
			var requestOData = {};
			if (dataToBeCreated != undefined) {
				if (dataToBeCreated.length > 0) {
					requestOData.created = dataToBeCreated;
				}
			}
			if (dataToBeModified != undefined) {
				if (dataToBeModified.length > 0) {
					requestOData.modified = dataToBeModified;
				}
			}
			if (dataToBeDeleted != undefined) {
				if (dataToBeDeleted.length > 0) {
					requestOData.deleted = dataToBeDeleted;
				}
			}
			respOData = this.getOData("SaveReasonCodeConfigurationInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getAllServiceMethods = function (){
		var respOData;

		try {
			var requestOData = {
					inputEntitySet : "GetAllServiceMethodsInput"
			};
			respOData = this.getOData("DefaultInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getExtensionConfigurationData = function(client, plant, nodeID) {
		var respOData;

		if (client == undefined || plant == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		} else if (nodeID == undefined) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_NODE"), sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : client,
					plant : plant,
					nodeID : nodeID
			};
			respOData = this.getOData("GetExtensionConfigurationInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getAllActivitiesForPlant = function(sClient, sPlant) {
		if (sClient == null || sPlant == null) {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}

		try {
			var requestOData = {
					client : sClient,
					plant : sPlant
			};
			var respOData = this.getOData("GetAllActivitiesForPlantInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.getAllExtensionTypes = function() {
		var respOData;

		try {
			var requestOData = {
					inputEntitySet : "GetAllExtensionTypesInput"
			};
			respOData = this.getOData("DefaultInput", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.saveExtensionConfiguration = function(dataToBeCreated, dataToBeModified,
			dataToBeDeleted) {

		var respOData;

		try {		
			var requestOData = {};
			requestOData.dummyKey = "";

			if (dataToBeCreated != undefined) {
				if (dataToBeCreated.length > 0) {
					requestOData.created = dataToBeCreated;
				}
			}

			if (dataToBeModified != undefined) {
				if (dataToBeModified.length > 0) {
					requestOData.modified = dataToBeModified;
				}
			}

			if (dataToBeDeleted != undefined) {
				if (dataToBeDeleted.length > 0) {
					requestOData.deleted = dataToBeDeleted;
				}
			}

			respOData = this.getOData("SaveExtensionsInput", requestOData);

		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};
	
	this.getUOMByFilter = function(srunID,sModeList,snodeID) {
		var respOData;

		try {
			if(sModeList != undefined){
				if(sModeList.length > 0){
					var mode = [];
					for(var i=0;i<sModeList.length;i++){
						mode.push({
							filterCriteria : sModeList[i]
						});
					}
				}
			}
			var requestOData = {						
					runID :srunID,
					fetchMode : mode,
					nodeID :snodeID

			};
			respOData = this.getOData("GetUOMsByFilter", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};
	
	this.GetAllStatusWithLang = function(sClient,sPlant) {
		var respOData;
		if (sClient == "" || sPlant == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
			return;
		}
		try {
			var requestOData = {
					client : sClient,
					plant : sPlant
			};
			respOData = this.getOData("GetAllStatusInputWithLang", requestOData);
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
		return respOData;
	};

	this.updateStatus =function(sClient,sPlant,sStatusKey,sStatusDescList,sVersion){
		var requestOData;
		var respOData;
		if(sClient==null||sPlant==null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
		} else if(sStatusKey==null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_SELECT_STATUS"), sap.ui.core.MessageType.Error);
		} else if(sStatusDescList==null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_ENTER_STATUS_DESC"), sap.ui.core.MessageType.Error);
		}
		try{
			requestOData={
					client:sClient,
					plant:sPlant,
					status:sStatusKey,
					statusDescDTOList:sStatusDescList,
					version:sVersion
			};
			respOData = this.getOData("UpdateStatusInput",requestOData);
			return respOData;

		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};

	this.interfacesGetProductionOrdersFOrTimePeriodAsync = function(
			sClient, sPlant, workCenterId, scheduledDateSelectionTimestamp, sOrderPattern, callBack, oController,operationDetailsRequired,skippedOperationsRequired) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sPlant == "" || sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (workCenterId == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var productionOrderInput;

		if (sOrderPattern == null) {
			if (scheduledDateSelectionTimestamp != undefined) {
				productionOrderInput = {
						client : sClient,
						plant : sPlant,
						operationDetailsRequired : operationDetailsRequired,
						skippedOperationsRequired : skippedOperationsRequired,
						workCenterIdList : [{value : workCenterId}],
						orderStatuses : [
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.CREATED
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED_P
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.COMPLETED
							}
						],
						scheduledDateSelectionTimestamp : scheduledDateSelectionTimestamp,
						nodeId : this.globalAppData.node.nodeID
				};
			} else {
				productionOrderInput = {
						client : sClient,
						plant : sPlant,
						operationDetailsRequired : operationDetailsRequired,
						skippedOperationsRequired : skippedOperationsRequired,
						orderStatuses : [
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.CREATED
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED_P
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.COMPLETED
							}
						],
						workCenterIdList : [{value : workCenterId}]
				};
			}
		}else{
			productionOrderInput = {
					client : sClient,
					plant : sPlant,
					operationDetailsRequired : operationDetailsRequired,
					skippedOperationsRequired : skippedOperationsRequired,
					orderStatuses : [
						{
							value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.CREATED
						},
						{
							value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED
						},
						{
							value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED_P
						},
						{
							value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.COMPLETED
						}
					],
					patternOfOrder  : sOrderPattern
			};
		}

		var respOData = this.getOData(
				"GetOrderDetailsInput",
				productionOrderInput, true, callBack, oController);

		return respOData;
	};

	this.interfacesGetProductionOrdersWithGRQuantityAsync = function(
			sClient, sPlant, workCenterId, scheduledDateSelectionTimestamp, sOrderPattern, callBack, oController) {
		var xmlHttpRequest = new XMLHttpRequest();
		if (sPlant == "" || sClient == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_CONFIG"),
					sap.ui.core.MessageType.Error);
			return;
		} else if (workCenterId == "") {
			sap.oee.ui.Utils.createMessage(this.oOEEBundle
					.getText("OEE_ERR_MSG_NO_WC"),
					sap.ui.core.MessageType.Error);
			return;
		}

		var productionOrderInput;

		if (sOrderPattern == null) {
			if (scheduledDateSelectionTimestamp != undefined) {
				productionOrderInput = {
						client : sClient,
						plant : sPlant,
						workCenterIdList : [{value : workCenterId}],
						orderStatuses : [
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.CREATED
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED_P
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.COMPLETED
							}
						],
						scheduledDateSelectionTimestamp : scheduledDateSelectionTimestamp,
						nodeId : this.globalAppData.node.nodeID
				};
			} else {
				productionOrderInput = {
						client : sClient,
						plant : sPlant,
						workCenterIdList : [{value : workCenterId}],
						orderStatuses : [
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.CREATED
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED_P
							},
							{
								value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.COMPLETED
							}
						],
						nodeId : this.globalAppData.node.nodeID
				};
			}
		}else{
			productionOrderInput = {
					client : sClient,
					plant : sPlant,
					patternOfOrder  : sOrderPattern,
					orderStatuses : [
						{
							value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.CREATED
						},
						{
							value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED
						},
						{
							value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.RELEASED_P
						},
						{
							value : sap.oee.ui.oeeConstants.orderDispatchStatusKeys.COMPLETED
						}
					],
					nodeId : this.globalAppData.node.nodeID
					
			};
		}

		var respOData = this.getOData(
				"GetOrderDetailsInputWithGRQuantityAsync",
				productionOrderInput, true, callBack, oController);

		return respOData;
	};

	this.getOrderMasterList = function(sClient,sPlant,orderStatus,materialList,scheduledStartDateRangeStart,scheduledStartDateRangeEnd,scheduledFinishDateRangeStart,scheduledFinishDateRangeEnd,workCenterIdList){
		var requestOData,respOData;
		if(sClient===null || sPlant === null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
		}
		try{
			requestOData = {
					client:sClient,
					plant:sPlant,
					scheduledStartDateRangeStart:scheduledStartDateRangeStart,
					scheduledStartDateRangeEnd:scheduledStartDateRangeEnd,
					scheduledFinishDateRangeStart:scheduledFinishDateRangeStart,
					scheduledFinishDateRangeEnd:scheduledFinishDateRangeEnd
			}
			if(orderStatus !== null){
				requestOData.orderStatuses = orderStatus;
			}
			if(materialList !== null){
				requestOData.materialList = materialList;
			}
			if(workCenterIdList !== null){
				requestOData.workCenterIdList = workCenterIdList;
			}
			respOData = this.getOData("GetOrderMasterList",requestOData);
			return respOData;
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};

	this.getOrderDetails = function(sClient,sPlant,orderNumber,operationDetailsRequired){
		var requestOData,respOData;
		if(sClient===null || sPlant === null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
		}
		try{
			requestOData = {
					client:sClient,
					plant:sPlant,
					orderNumber:orderNumber,
					operationDetailsRequired:true
			}
			respOData = this.getOData("GetOrderDetailsInput",requestOData);
			return respOData;
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};

	this.createReleaseDemand = function(sClient,sPlant,releaseDemandList){
		if(sClient===null || sPlant === null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
		}
		try{
			requestOData = {
					client:sClient,
					plant:sPlant,
					ioReleasedDemandHeaderList:releaseDemandList
			}
			respOData = this.getOData("CreateReleaseDemand",requestOData);
			return respOData;
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message, sap.ui.core.MessageType.Error);
		}
	};
	
	this.setCrewSizeOrStartTimeOrEndTimeOfOrderInterval = function(data){
		var requestOData;
		var responseOData;

		if(data.client === null || data.plant === null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
		}
		try {
			requestOData = {
					orderNumber: data.orderNumber,
					operationNumber: data.operationNumber,
					plant: data.plant,
					capacityId: data.capacityId,
					client: data.client,
					workcenterId: data.workcenterId,
					nodeId: data.nodeId,
					updatedProdRunInterval: {
						intervalId: data.intervalId,
						productionActivity: data.productionActivity,
						runId: data.runId,
						crewSize: data.crewSize,
						newTimeInterval: {
							startTimestamp:data.intervalStartTimestamp ,
							endTimestamp:data.intervalEndTimestamp
						}
					},
					updatedOrderInterval : {
						startTimestamp: data.orderStartTimestamp,
						endTimestamp: data.orderEndTimestamp
					}
			};

			var respOData = this.getOData(
					"UpdateProductionRunInterval", requestOData);
			return respOData;
		} catch (e) {
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

	};

	this.interfacesForPICUpload = function(client,plant,rootNode){
		var requestOData;
		var responseOData;

		if(client === null || plant === null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
		}
		try{
			requestOData = {	
					client:client,
					plant:plant,
					rootNode:rootNode
			}
			respOData= this.getOData("UploadPlantHierarchyToPIC",requestOData);
			return respOData;
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
	};

	this.getShiftBreaks = function(client,plant,capacityId,workcenterId,startTimestamp,endTimestamp){
		var requestOData;
		var responseOData;

		if(client === null || plant === null){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERR_MSG_NO_CONFIG"), sap.ui.core.MessageType.Error);
		}
		try{
			requestOData = {	
					client:client,
					plant:plant,
					capacityId:capacityId,
					workcenterId:workcenterId,
					startTimestamp:startTimestamp,
					endTimestamp:endTimestamp,
					phNodeConfigForShiftBreaksConsidered: true

			}
			respOData= this.getOData("GetShiftBreaks",requestOData);
			return respOData;
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

	};

	this.copyActivity = function(fromPlant , fromClient , toPlant ,toClient){			
		var requestOData ;
		var responseOData;
		if(fromPlant === null || fromClient === null || toPlant === null || toClient === null || fromPlant === undefined || fromClient === undefined || toPlant === undefined || toClient === undefined ){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERROR_COPYING_FAILED"), sap.ui.core.MessageType.Error);
			return;
		}				
		try {					
			requestOData = {							
					fromPlant : fromPlant,
					fromClient : fromClient,
					toPlant : toPlant,
					toClient : toClient
			}					
			responseOData = this.getOData("CopyActivityInput" , requestOData);
			return responseOData ; 
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

	};
	
	this.copyOrderStatus = function(fromPlant , fromClient , toPlant , toClient){
		var requestOData;
		var responseOData;
		if(fromPlant === null || fromClient === null || toPlant === null || toClient === null || fromPlant === undefined || fromClient === undefined || toPlant === undefined || toClient === undefined ){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERROR_COPYING_FAILED"), sap.ui.core.MessageType.Error);
			return;
		}	
		try {					
			requestOData = {							
					fromPlant : fromPlant,
					fromClient : fromClient,
					toPlant : toPlant,
					toClient : toClient
			}					
			responseOData = this.getOData("CopyOrderStatus" , requestOData);
			return responseOData ; 
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}
		
	};

	this.copyPODFromOnePlantToAnother = function(fromPlant , fromClient , toPlant , toClient){
		var requestOData;
		var responseOData;
		if(fromPlant === null || fromClient === null || toPlant === null || toClient === null || fromPlant === undefined || fromClient === undefined || toPlant === undefined || toClient === undefined ){
			sap.oee.ui.Utils.createMessage(this.oOEEBundle.getText("OEE_ERROR_COPYING_FAILED"), sap.ui.core.MessageType.Error);
			return;
		}	
		try {					
			requestOData = {							
					fromPlant : fromPlant,
					fromClient : fromClient,
					toPlant : toPlant,
					toClient : toClient
			}					
			responseOData = this.getOData("CopyPODInput" , requestOData);
			return responseOData ; 
		}catch(e){
			sap.oee.ui.Utils.createMessage(e.message,
					sap.ui.core.MessageType.Error);
		}

	};

}; // Interface Ends Here
