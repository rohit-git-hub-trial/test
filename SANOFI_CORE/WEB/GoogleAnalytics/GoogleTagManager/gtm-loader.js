/*-----------------------------------------------------------------------------------
 Google Tag Manager Loader
 Description: Loads GTM dynamically from MII config and pushes lifecycle events
-----------------------------------------------------------------------------------*/

(function loadGTMOnce() {
    if (window.gtmLoaded) return;
    window.gtmLoaded = true;

    window.dataLayer = window.dataLayer || [];
    var lastPage = window.location.href;

    // ---------- Helpers ----------
    function pushEvent(eventName, params) {
        var payload = Object.assign({
            event: eventName,
            pagePath: window.location.pathname + window.location.search + window.location.hash,
            pageTitle: document.title,
            pageLocation: window.location.href,
            pageReferrer: document.referrer || lastPage,
            timestamp: new Date().toISOString()
        }, params || {});
        window.dataLayer.push(payload);
    }
    window.pushGTMEvent = pushEvent; // expose globally for controllers if needed

    function fireVirtualPageView(path, title) {
        var newUrl = path || (window.location.pathname + window.location.search + window.location.hash);
        var oldUrl = lastPage;
        window.dataLayer.push({
            event: "virtualPageView",
            pagePath: newUrl,
            pageTitle: title || document.title,
            pageLocation: window.location.href,
            pageReferrer: oldUrl,
            timestamp: new Date().toISOString()
        });
        lastPage = window.location.href;
    }

    // ---------- Hard refresh events ----------
    pushEvent("Start_Refresh", { refreshType: "hard", firstLoad: true });

    function pushEndRefresh() {
        pushEvent("End_Refresh", { refreshType: "hard", firstLoad: true });
    }
    if (document.readyState === "complete") {
        pushEndRefresh();
    } else {
        window.addEventListener("load", pushEndRefresh);
    }

    // ---------- GTM bootstrap ----------
    var sQuery = "SANOFI_CORE/GoogleAnalytics/Query/GetGoogleAnalyticsInfoXquery";
    var sURL = "/XMII/Illuminator?QueryTemplate=" + sQuery + "&Content-Type=text/json";

    fetch(sURL)
        .then(r => r.json())
        .then(data => {
            var row = data?.Rowsets?.Rowset?.[0]?.Row?.[0];
            var enabled = row?.GAEnable;
            var gtmId = row?.GAContainerCode;

            if (enabled !== 1 || !gtmId) return;

            var script = document.createElement("script");
            script.async = true;
            script.src = "https://www.googletagmanager.com/gtm.js?id=" + gtmId;

            script.onload = function () {
                fireVirtualPageView();

                // Track SPA navigation
                window.addEventListener("hashchange", function () {
                    pushEvent("Start_Refresh", { refreshType: "spa" });
                    setTimeout(function () {
                        pushEvent("End_Refresh", { refreshType: "spa" });
                        fireVirtualPageView();
                    }, 800);
                });

                var pushState = history.pushState;
                history.pushState = function () {
                    pushState.apply(this, arguments);
                    pushEvent("Start_Refresh", { refreshType: "spa" });
                    setTimeout(function () {
                        pushEvent("End_Refresh", { refreshType: "spa" });
                        fireVirtualPageView();
                    }, 800);
                };
                var replaceState = history.replaceState;
                history.replaceState = function () {
                    replaceState.apply(this, arguments);
                    pushEvent("Start_Refresh", { refreshType: "spa" });
                    setTimeout(function () {
                        pushEvent("End_Refresh", { refreshType: "spa" });
                        fireVirtualPageView();
                    }, 800);
                };
                window.addEventListener("popstate", function () {
                    pushEvent("Start_Refresh", { refreshType: "spa" });
                    setTimeout(function () {
                        pushEvent("End_Refresh", { refreshType: "spa" });
                        fireVirtualPageView();
                    }, 800);
                });

                // SAPUI5 router detection
                var checkRouterInterval = setInterval(function () {
                    try {
                        if (sap && sap.ui && sap.ui.core && sap.ui.core.UIComponent) {
                            var comp = sap.ui.core.UIComponent.getRouterFor && sap.ui.core.UIComponent.getRouterFor();
                            if (comp && comp.attachRouteMatched) {
                                comp.attachRouteMatched(function (oEvent) {
                                    var routeName = oEvent.getParameter("name");
                                    pushEvent("Start_Refresh", { refreshType: "spa", routeName: routeName });

                                    var ended = false;
                                    var view = oEvent.getParameter("view");
                                    if (view && view.addEventDelegate) {
                                        view.addEventDelegate({
                                            onAfterRendering: function () {
                                                if (!ended) {
                                                    pushEvent("End_Refresh", { refreshType: "spa", routeName: routeName });
                                                    fireVirtualPageView();
                                                    ended = true;
                                                }
                                            }
                                        });
                                    }
                                    setTimeout(function () {
                                        if (!ended) {
                                            pushEvent("End_Refresh", { refreshType: "spa", routeName: routeName });
                                            fireVirtualPageView();
                                            ended = true;
                                        }
                                    }, 800);
                                });
                                clearInterval(checkRouterInterval);
                            }
                        }
                    } catch (e) {
                        // wait until UI5 router available
                    }
                }, 1000);
            };

            var firstScript = document.getElementsByTagName("script")[0];
            firstScript.parentNode.insertBefore(script, firstScript);
        })
        .catch(err => console.error(">>> Error fetching GTM ID:", err));
})();