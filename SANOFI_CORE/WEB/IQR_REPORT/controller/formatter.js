sap.ui.define(["IQR_REPORT/controller/formatter"], function () {
	"use strict";
	return {
		displayByPass : function(status) {
			if(status == "1"){
				return(true);
			} else  {
				return(false);
			}
		},

	}; // end return
});