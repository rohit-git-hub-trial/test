sap.ui.define([], function () {
    "use strict";
    return {
        statusIcon: function (sColor) {
            switch (sColor) {
                case "red":
                    return "sap-icon://error";
                case "yellow":
                    return "sap-icon://alert";
                case "green":
                    return "sap-icon://color-fill";
                default:
                    return "sap-icon://circle-task-2";
            }
        },
        statusIconTagCatalog: function (sColor) {
            switch (sColor) {
                case "red":
                    return "sap-icon://error";
                case "yellow":
                    return "sap-icon://alert";
                case "green":
                    return "sap-icon://color-fill";
                case "watch":
                    return "sap-icon://fob-watch";
                case "load":
                    return "sap-icon://database";
                default:
                    return "sap-icon://activate";
            }
        },
        statusColorTagCatalog: function (sColor) {
            switch (sColor) {
                case "red":
                    return "red";
                case "yellow":
                    return "orange";
                case "green":
                    return "green";
                case "watch":
                    return "blue";
                case "load":
                    return "#FF4500";
                default:
                    return "#5e696e";
            }
        },
        statusIconInitialLoad: function (sColor) {
            switch (sColor) {
                case "E":
                    return "sap-icon://error";
                case "W":
                    return "sap-icon://alert";
                case "S":
                    return "sap-icon://database";
                default:
                    return "sap-icon://activate";
            }
        },
        statusColorInitialLoad: function (sColor) {
            switch (sColor) {
                case "E":
                    return "red";
                case "W":
                    return "orange";
                case "S":
                    return "green";
                default:
                    return "#5e696e";
            }
        },
        statusJobsMonitoring: function (sColor) {
            switch (sColor) {
                case "R":
                    return "red";
                case "Y":
                    return "orange";
                case "G":
                    return "green";
                case "W":
                    return "lightgray";
                case "B":
                    return "blue";
                case "L":
                    return "#FF4500";
                case "I":
                    return "darkorange";
                default:
                    return "black";
            }
        },
        statusJobsMonitoringIcon: function (sColor) {
            switch (sColor) {
                case "R":
                    return "sap-icon://error";
                case "Y":
                    return "sap-icon://alert";
                case "G":
                    return "sap-icon://color-fill";
                case "W":
                    return "sap-icon://circle-task-2";
                case "B":
                    return "sap-icon://gantt-bars";
                case "L":
                    return "sap-icon://database";
                case "I":
                    return "sap-icon://excel-attachment";
                default:
                    return "sap-icon://circle-task-2";
            }
        },
        statusQueueMonitoring: function (sStatus) {
            switch (sStatus) {
                case "EXPIRED":
                    return "red";
                case "PENDING":
                    return "orange";
                case "RUNNING":
                    return "green";
                case "SUCCESS":
                    return "green";
                case "INGESTING":
                    return "grey";
                case "W":
                    return "lightgray";
                default:
                    return "black";
            }
        },
        statusIconTagUpload: function (sColor) {
            switch (sColor) {
                case "E":
                    return "sap-icon://error";
                case "W":
                    return "sap-icon://alert";
                case "I":
                    return "sap-icon://message-information";
                case "S":
                    return "sap-icon://color-fill";
                default:
                    return "sap-icon://activate";
            }
        },
        statusColorTagUpload: function (sColor) {
            switch (sColor) {
                case "E":
                    return "red";
                case "W":
                    return "orange";
                case "I":
                    return "blue";
                case "S":
                    return "green";
                default:
                    return "#5e696e";
            }
        },
        statusIconBatchCatalogUpload: function (sColor) {
            switch (sColor) {
                case "E":
                    return "sap-icon://error";
                case "W":
                    return "sap-icon://alert";
                case "I":
                    return "sap-icon://message-information";
                case "S":
                    return "sap-icon://color-fill";
                default:
                    return "sap-icon://activate";
            }
        },
        statusIconManualImportUpload: function (sColor) {
            switch (sColor) {
                case "E":
                    return "sap-icon://error";
                case "W":
                    return "sap-icon://alert";
                case "I":
                    return "sap-icon://message-information";
                case "S":
                    return "sap-icon://color-fill";
                default:
                    return "sap-icon://activate";
            }
        },
        statusColorBatchCatalogUpload: function (sColor) {
            switch (sColor) {
                case "E":
                    return "red";
                case "W":
                    return "orange";
                case "I":
                    return "blue";
                case "S":
                    return "green";
                default:
                    return "#5e696e";
            }
        },
        statusColorManualImportUpload: function (sColor) {
            switch (sColor) {
                case "E":
                    return "red";
                case "W":
                    return "orange";
                case "I":
                    return "blue";
                case "S":
                    return "green";
                default:
                    return "#5e696e";
            }
        },
        statusQueueMonitoringIcon: function (sStatus) {
            switch (sStatus) {
                case "EXPIRED":
                    return "sap-icon://error";
                case "PENDING":
                    return "sap-icon://alert";
                case "RUNNING":
                    return "sap-icon://color-fill";
                case "SUCCESS":
                    return "sap-icon://circle-task-2";
	    case "SPLITTING":
	       return "sap-icon://message-information";
                case "W":
                    return "sap-icon://circle-task-2";
                default:
                    return "sap-icon://circle-task-2";
            }
        },
        statusQueueMonitoringGetState: function (sStatus) {
            switch (sStatus) {
                case "EXPIRED":
                    return "Error";
                case "PENDING":
                    return "Warning";
                case "RUNNING":
                    return "Success";
                case "SUCCESS":
                    return "Success";
                case "W":
                    return "None";
                default:
                    return "None";
            }
        },
        statusPcoMonitoringIcon: function (sStatus) {
			switch (sStatus) {
				case "Started":
					return "sap-icon://circle-task-2";
				case "Stopped":
					return "sap-icon://error";
				case "Faulted":
					return "sap-icon://alert";
				case "Starting":
					return "sap-icon://process";
				case "Stopping":
					return "sap-icon://sys-back";
				case "Unknown":
				case "":
				case null:
				case undefined:
					return "sap-icon://question-mark";
				default:
					return "sap-icon://question-mark";
			}
		},

		statusPcoMonitoring: function (sStatus) {
			switch (sStatus) {
				case "Started":
					return "#28a745";
				case "Stopped":
					return "#dc3545";
				case "Faulted":
					return "#ff9800";
				case "Starting":
					return "#2196f3";
				case "Stopping":
					return "#9c27b0";
				case "Unknown":
				case "":
				case null:
				case undefined:
					return "#6c757d";
				default:
					return "#6c757d";
			}
		},

		statusPcoMonitoringText: function (sStatus) {
			switch (sStatus) {
				case "Started":
					return "Running";
				case "Stopped":
					return "Stopped";
				case "Faulted":
					return "Faulted";
				case "Starting":
					return "Starting";
				case "Stopping":
					return "Stopping";
				case "Unknown":
				case "":
				case null:
				case undefined:
					return "Unknown";
				default:
					return "sStatus";
			}
		},
        actionIconAuditLog: function (sAction) {
            switch (sAction) {
                case "INSERT":
                    return "sap-icon://add-document";
                case "UPDATE":
                    return "sap-icon://user-edit";
                case "DELETE":
                    return "sap-icon://sys-minus";
                case "DEBUG":
                    return "sap-icon://technical-object";
                default:
                    return "sap-icon://circle-task-2";
            }
        },
        actionColorAuditLog: function (sAction) {
            switch (sAction) {
                case "INSERT":
                    return "green";
                case "UPDATE":
                    return "orange";
                case "DELETE":
                    return "red";
                case "DEBUG":
                    return "blue";
                default:
                    return "grey";
            }
        },
        statusIconBatchCatalog: function (sColor) {
            switch (sColor) {
                case "red":
                    return "sap-icon://error";
                case "yellow":
                    return "sap-icon://alert";
                case "green":
                    return "sap-icon://color-fill";
                case "watch":
                    return "sap-icon://fob-watch";
                case "load":
                    return "sap-icon://database";
                default:
                    return "sap-icon://activate";
            }
        },
        statusIconManualImport: function (sColor) {
            switch (sColor) {
                case "red":
                    return "sap-icon://error";
                case "yellow":
                    return "sap-icon://alert";
                case "green":
                    return "sap-icon://color-fill";
                default:
                    return "sap-icon://error";
            }
        },
        statusColorBatchCatalog: function (sColor) {
            switch (sColor) {
                case "red":
                    return "red";
                case "yellow":
                    return "orange";
                case "green":
                    return "green";
                case "watch":
                    return "blue";
                case "load":
                    return "#FF4500";
                default:
                    return "#5e696e";
            }
        },
        statusColorManualImport: function (sColor) {
            switch (sColor) {
                case "red":
                    return "red";
                case "yellow":
                    return "orange";
                case "green":
                    return "green";
                default:
                    return "red";
            }
        },
        formatHistorical: function (sParentId) {
            if(sParentId !== "NA"){
                return "load";
            } else {
                return "";
            }
        }
    };
});