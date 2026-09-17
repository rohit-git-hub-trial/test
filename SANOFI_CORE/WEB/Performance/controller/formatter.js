sap.ui.define(["Sanofi/EndToEndMonitoring/controller/formatter"], function () {
	"use strict";
	return {

		formatIcon : function(status) {
			if(status == "Stopped"){
				return("RED");
			} else if ( status=="Faulted") {
				return("YELLOW");
			} else {
				return("GREEN");
			}
		},
		displayButtonRun : function(mode, status) {
			if(mode == "Automatic"){
				return(false);
			} else  {
			if(status == "Stopped"){
				return(true);
			} else if ( status=="Faulted") {
				return(false);
			} else  {
				return(false);
			}
			}
		},
		displayAction : function(mode) {
			if(status == "Automatic"){
				return(true);
			} else  {
				return(false);
			}
		},
		iconButton: function(status) {
			if(status == "Stopped"){
				return("sap-icon://media-play");
			} else if ( status=="Faulted") {
				return("sap-icon://restart");
			} else  {
				return("sap-icon://stop");
			}
		},
		displayButtonReStart : function(status) {
			if(status == "Stopped"){
				return(false);
			} else if ( status=="Faulted") {
				return(true);
			} else  {
				return(false);
			}
		},
	}; // end return
});