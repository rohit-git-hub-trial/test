sap.ui.define([], function () {
	"use strict";
	return {
		statusTransferOrder: function (sStatus) {
			switch (sStatus) {
				case "7":
					return "orange";
				case "3":
					return "red";
				case "2":
					return "#00CC00";
				case "4":
					return "blue";
				case "6":
					return "blue";
				default:
					return "black";
			}
		},

		statusTransferOrderIcon: function (sStatus) {
			switch (sStatus) {
				case "7":
					return "sap-icon://forward";
				case "3":
					return "sap-icon://alert";
				case "2":
					return "sap-icon://message-success";
				case "4":
					return "sap-icon://pending";
				case "6":
					return "sap-icon://pending";
				default:
					return "sap-icon://circle-task-2";
			}
		}
	};
});