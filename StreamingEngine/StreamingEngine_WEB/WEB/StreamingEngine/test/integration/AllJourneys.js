/* global QUnit*/

sap.ui.define([
	"sap/ui/test/Opa5",
	"StreamingEngine/StreamingEngine/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"StreamingEngine/StreamingEngine/test/integration/pages/App",
	"StreamingEngine/StreamingEngine/test/integration/navigationJourney"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "StreamingEngine.StreamingEngine.view.",
		autoWait: true
	});
});