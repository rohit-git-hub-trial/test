/*-----------------------------------------------------------------------------------
Matomo JS Code
Creation Date: 2019-11-25 / By: E0427320
Reference Document: Matomo test case
Description: This file must be included to all application pages
-------------------------------------------------------------------------------------*/

function parse_query_string(query) {
	var vars = query.split("&");
	var query_string = {};
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		var key = decodeURIComponent(pair[0]).toLowerCase();
		var value = decodeURIComponent(pair[1]);
		if (typeof query_string[key] === "undefined") {
			query_string[key] = decodeURIComponent(value);
		} else if (typeof query_string[key] === "string") {
			var arr = [query_string[key], decodeURIComponent(value)];
			query_string[key] = arr;
		} else {
			query_string[key].push(decodeURIComponent(value));
		}
	}
	return query_string;
}

//E0427320 - check if the developer is not sending the plant param from js call
if(typeof PlantParam === 'undefined'){
	var query = window.location.search.substring(1);
	var parsedQueryString = parse_query_string(query);
	var PlantParam=(typeof parsedQueryString.plant !== 'undefined')?parsedQueryString.plant : "N/A";
}

//E0427320 - related to OEE - to prevent the creation of the matomo handler multiple times, I had to define a global variable to control. 
//E0427320 - related to OEE - Multiple matomo handlers where leading to errors
window.listenerCreated=(typeof listenerCreated=== 'undefined')? false : listenerCreated;

//E0427320 - Start tracking the user ID
window.userIdForMatomo = "";

var _paq = window._paq || [];

//E0427320 - setting up custom variables to track the plant
_paq.push(["setCustomVariable", 2, "Plant", PlantParam, "visit"]);
_paq.push(['setCustomDimension', 2, PlantParam]);

//E0427320 - related to OEE - customizing the URL to simulate change of pages, when navigating trough different activities/dashboards
//E0427320 - related to OEE - if the previous url is not set, save with current (initial page load)
if(typeof previousUrl=== 'undefined'){
	window.previousUrl = location.href;
}else{
	var currentUrl = window.location.hash.substr(1);
	if(currentUrl != previousUrl){
		//E0427320 - related to OEE - if current page is different then previous, customize the way matomo tracks it
		_paq.push(['setReferrerUrl', previousUrl]);
		_paq.push(['setCustomUrl', currentUrl]);
		previousUrl = currentUrl;
	}
}

//E0427320 - call shared properties variables for server id and URL
var oQuery = "SANOFI_CORE/Matomo/Query/GetMatomoInfoXquery";

if(listenerCreated == false){
	listenerCreated=true;
	$.ajax({
		type: "POST",
		url: "/XMII/Illuminator?QueryTemplate="+oQuery +"&Content-Type=text/xml",
		dataType: "xml"
	}).done(function(xml) {
		$(xml).find("Rowsets").each(function(){
			var FatalError = $(this).find("FatalError").text();
			if(FatalError != "") console.log(FatalError);
		});
		$(xml).find("Row").each(function(){
			try {
				var matomoSiteId = $(this).find("MatomoSiteId").text();
				var matomoServerURL = $(this).find("MatomoServer").text();
				var MatomoeOEEServer = $(this).find("MatomoeOEEServer").text();
				window.userIdForMatomo = $(this).find("MatomoUserID").text();
				//E0427320 - related to OEE - conditional before setting the handler, to prevent errors
				_paq.push(['setCustomDimension', 1, MatomoeOEEServer]);
				_paq.push(['setUserId', window.userIdForMatomo]);
				_paq.push(['trackPageView']);
				_paq.push(['enableLinkTracking']);

				(function() {
					var u=matomoServerURL;
					_paq.push(['setTrackerUrl', u+'matomo.php']);
					_paq.push(['setSiteId', matomoSiteId]);
					var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
					g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
				})();
			} catch(e) {}
		});
	}).fail(function(jqXHR, textStatus, msg) { 
		console.log("matomo ids connection error");
	});
} else {
	_paq.push(['setUserId', window.userIdForMatomo]);
	_paq.push(['trackPageView']);
	_paq.push(['enableLinkTracking']);
}