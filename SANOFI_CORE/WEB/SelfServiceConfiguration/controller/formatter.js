sap.ui.define(["SelfServiceConfiguration/controller/formatter"], function () {
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