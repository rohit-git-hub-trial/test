(function () {
    if (window.gtmInitAttached) return;
    window.gtmInitAttached = true;

    console.log(">>> GtmBootstrapInjector.js attached");

    // Dynamically load the real bootstrap
    var script = document.createElement("script");
    script.src = "/XMII/CM/SANOFI_CORE/WEB/GoogleAnalytics/GoogleTagManager/GtmBootstrap.js";
    script.async = true;
    document.head.appendChild(script);
})();