(function () {
    if (window.gtmLoaderAttached) return;
    window.gtmLoaderAttached = true;

    console.log(">>> GtmBootstrap.js attached");

    // Inject gtm-loader.js
    jQuery.sap.includeScript(
        "/XMII/CM/SANOFI_CORE/WEB/GoogleAnalytics/GoogleTagManager/gtm-loader.js"
    );
})();