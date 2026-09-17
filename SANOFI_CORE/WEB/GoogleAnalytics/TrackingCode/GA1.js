/*-----------------------------------------------------------------------------------
Google Analitics code
Creation Date: 2023-07-06 / By: E0427320
Reference Document: 
Description: This file must be included to all application pages
-------------------------------------------------------------------------------------*/
// U1044724- updated the code by intoducing different events.
jQuery.sap.declare("SanofiCore.GoogleAnalytics.TrackingCode.GA1");

var GA_DEBUG = false; 
function _log() { if (GA_DEBUG) console.log.apply(console, arguments); }

function fmt(dt){
  try {
    var d = (dt instanceof Date) ? dt : new Date(dt);
    if (isNaN(d.getTime())) return null;
    function pad(n){ return String(n).padStart(2, '0'); }
    return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + " "
         + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  } catch(e) { return null; }
}

function nowMs(){ return Date.now(); }

window.dataLayer = window.dataLayer || [];
function gtag(){ try { dataLayer.push(arguments); } catch(e) {} }

window.listenerCreated = (typeof listenerCreated === 'undefined') ? false : listenerCreated;

SanofiCore = window.SanofiCore || {};
SanofiCore.GoogleAnalytics = SanofiCore.GoogleAnalytics || {};
SanofiCore.GoogleAnalytics.TrackingCode = SanofiCore.GoogleAnalytics.TrackingCode || {};

SanofiCore.GoogleAnalytics.TrackingCode.GA = (function(){

  var sContainerCode = "";
  var bEnabled = false;

  var PAGE_DEDUPE_MS = 2000;
  var __lastRecordedPage = { path: null, ts: 0 };

  var __agg_session = null; 
  var __lastEventKey = null, __lastEventTs = 0, EVENT_DEDUPE_MS = 1500;
  var __navAttached = false;
  var __inputWatchSetup = false;

  function _startGTM(id){
    if (!id) return;
    (function(w,d,s,l,i){
      w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0], j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
      j.async=true; j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer', id);
  }

  function _createIframe(id){
    if (!id) return;
    if (document.getElementById("GA4_IFRAME")) return;
    var ifr = document.createElement('iframe');
    ifr.id = "GA4_IFRAME";
    ifr.src = "https://www.googletagmanager.com/ns.html?id="+id;
    ifr.width='0'; ifr.height='0'; ifr.frameBorder = 0; ifr.style.display = 'none';
    (document.body || document.documentElement).appendChild(ifr);
  }

  function _startAgg(meta){
    if (__agg_session) _endAgg();
    var startTs = nowMs();
    try {
      if (performance && performance.getEntriesByType) {
        var nav = performance.getEntriesByType('navigation')[0];
        if (nav && performance.timing && performance.timing.navigationStart) startTs = Math.floor(performance.timing.navigationStart + (nav.startTime||0));
        else if (performance && performance.timing && performance.timing.navigationStart) startTs = performance.timing.navigationStart;
      } else if (performance && performance.timing && performance.timing.navigationStart) {
        startTs = performance.timing.navigationStart;
      }
    } catch(e) {}
    __agg_session = {
      startTs: startTs,
      pages: [],
      refreshType: (meta && meta.refreshType) || "unknown",
      firstLoad: !!(meta && meta.firstLoad)
    };
    _log("agg started", __agg_session);
  }

  function _recordPage(path, title){
    try {
      var pagePath = path || (window.location.pathname + window.location.search + window.location.hash);
      var t = nowMs();
      if (__lastRecordedPage.path === pagePath && (t - __lastRecordedPage.ts) < PAGE_DEDUPE_MS) {
        _log("page deduped", pagePath);
        return;
      }
      __lastRecordedPage.path = pagePath;
      __lastRecordedPage.ts = t;

      if (!__agg_session) _startAgg({ refreshType: "unknown", firstLoad: false });

      __agg_session.pages.push({
        pagePath: pagePath,
        pageTitle: title || document.title,
        pageLocation: window.location.href,
        timestampISO: new Date().toISOString()
      });

      // update GA4 config silently if available
      try {
        if (sContainerCode) gtag('config', sContainerCode, { 'send_page_view': false, 'page_referrer': document.referrer || window.location.href, 'page_location': pagePath, 'update': true });
      } catch(e) {}
      _log("recorded page", pagePath);
    } catch(e) { _log("recordPage error", e); }
  }

  function _endAgg(meta){
    if (!__agg_session) { _log("no agg to end"); return; }
    if (meta && meta.refreshType) __agg_session.refreshType = meta.refreshType;
    if (meta && typeof meta.firstLoad !== 'undefined') __agg_session.firstLoad = !!meta.firstLoad;

    var endTs = nowMs();
    try {
      if (performance && performance.getEntriesByType) {
        var nav = performance.getEntriesByType('navigation')[0];
        if (nav && typeof nav.loadEventEnd === 'number' && nav.loadEventEnd > 0 && performance.timing && performance.timing.navigationStart) {
          endTs = Math.floor(performance.timing.navigationStart + nav.loadEventEnd);
        } else if (performance && performance.timing && performance.timing.loadEventEnd && performance.timing.loadEventEnd > 0) {
          endTs = performance.timing.loadEventEnd;
        }
      } else if (performance && performance.timing && performance.timing.loadEventEnd && performance.timing.loadEventEnd > 0) {
        endTs = performance.timing.loadEventEnd;
      }
    } catch(e) {}

    __agg_session.endTs = endTs;
    __agg_session.durationMs = (__agg_session.endTs - __agg_session.startTs);
    var durationLabel = (__agg_session.durationMs / 1000).toFixed(2) + " s";

    // client/plant/node/user if present
    var client = window.client || null;
    var plant = window.plant || null;
    var nodeId = window.nodeId || (window.appData && window.appData.node && window.appData.node.nodeID) || null;
    var userId = (window.appData && window.appData.user && (window.appData.user.userId || window.appData.user.id)) || null;

    var vp = {
      event: "virtualPageView",
      startTime: fmt(new Date(__agg_session.startTs)),
      endTime: fmt(new Date(__agg_session.endTs)),
      durationMs: __agg_session.durationMs,
      duration: durationLabel,
      refreshType: __agg_session.refreshType,
      firstLoad: !!__agg_session.firstLoad,
      pages: __agg_session.pages.slice(),
      pagePath: (__agg_session.pages.length ? __agg_session.pages[0].pagePath : (window.location.pathname + window.location.search + window.location.hash)),
      pageTitle: (__agg_session.pages.length ? __agg_session.pages[0].pageTitle : document.title),
      pageLocation: window.location.href,
      pageReferrer: document.referrer || window.location.href,
      client: client, plant: plant, nodeId: nodeId, userId: userId
    };

    // dedupe key (small window)
    try {
      var key = vp.refreshType + "|" + vp.pagePath + "|" + vp.startTime + "|" + vp.endTime + "|" + vp.pages.length;
      var now = Date.now();
      if (__lastEventKey === key && (now - __lastEventTs) < EVENT_DEDUPE_MS) { _log("vp deduped", key); __agg_session = null; return; }
      __lastEventKey = key; __lastEventTs = now;
    } catch(e) {}

    window.dataLayer.push(vp);
    _log("virtualPageView pushed", vp);
    __agg_session = null;
  }

  function _attachNavigation(){
    if (__navAttached) return;
    __navAttached = true;

    function safeCycle(routeName){
      try {
        _startAgg({ refreshType: 'navigation' });
        _recordPage();
        _endAgg({ refreshType: 'navigation', routeName: routeName });
      } catch(e) { _log("safeCycle err", e); }
    }

    var attempts = 0;
    var poll = setInterval(function(){
      attempts++;
      try {
        if (window.sap && sap.ui && sap.ui.core && sap.ui.core.UIComponent) {
          var comp = sap.ui.core.UIComponent.getRouterFor && sap.ui.core.UIComponent.getRouterFor();
          if (comp && comp.attachRouteMatched) {
            comp.attachRouteMatched(function(e){ safeCycle(e.getParameter && e.getParameter('name')); });
            clearInterval(poll); return;
          }
        }
      } catch(e) {}
      if (attempts > 20) clearInterval(poll);
    }, 300);

    window.addEventListener("popstate", function(){ safeCycle('popstate'); });

    (function(){
      var op = history.pushState;
      if (op && !op.__ga_wrapped) {
        history.pushState = function(){
          op.apply(this, arguments);
          safeCycle('pushState');
        };
        history.pushState.__ga_wrapped = true;
      }
      var or = history.replaceState;
      if (or && !or.__ga_wrapped) {
        history.replaceState = function(){
          or.apply(this, arguments);
          safeCycle('replaceState');
        };
        history.replaceState.__ga_wrapped = true;
      }
    })();
  }

  // ---------- InputChange watcher ----------
  function _setupInputWatch(){
    if (__inputWatchSetup) return;
    __inputWatchSetup = true;

    var keys = ['LineId','LineDescription','DashboardId','DashboardDescription'];
    var last = {};
    keys.forEach(function(k){ try { last[k] = window[k]; } catch(e){ last[k] = undefined; } });

    // debounced push
    var debounceTimer = null;
    function fireHandleChange(){
      try {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function(){
          try { SanofiCore.GoogleAnalytics.TrackingCode.GA.handleChange(); } catch(e) {}
        }, 120);
      } catch(e) {}
    }

    // try defineProperty for immediate capture
    var defined = true;
    try {
      keys.forEach(function(k){
        (function(key){
          var v = last[key];
          Object.defineProperty(window, key, {
            configurable: true,
            enumerable: true,
            get: function(){ return v; },
            set: function(val){ v = val; fireHandleChange(); }
          });
        })(k);
      });
    } catch(e) {
      defined = false;
    }

    if (!defined) {
      // fallback: poll
      var attempts = 0;
      var poll = setInterval(function(){
        attempts++;
        var changed = false;
        keys.forEach(function(k){
          try { if (window[k] !== last[k]) { last[k] = window[k]; changed = true; } } catch(e) {}
        });
        if (changed) fireHandleChange();
        if (attempts > 50) clearInterval(poll);
      }, 200);
    } else {
      // if any watched global already has a value -> trigger one immediate InputChange
      try {
        var anySet = keys.some(function(k){ return typeof window[k] !== 'undefined' && window[k] !== null && window[k] !== ''; });
        if (anySet) fireHandleChange();
      } catch(e) {}
    }
  }

  // ---------- public API ----------
  return {
    fnInit: function(oContext){
      if (window.listenerCreated) return;
      window.listenerCreated = true;

      var model = new sap.ui.model.json.JSONModel();
      model.attachRequestCompleted(function(res){
        try {
          var row = res.oSource.oData.Rowsets.Rowset?.[0]?.Row?.[0];
          if (!row) { _log("GA: no config row"); return; }

          bEnabled = !!row.GAEnable;
          sContainerCode = row.GAContainerCode || "";
          try {
            if (typeof sContainerCode === "string" && sContainerCode.startsWith('"') && sContainerCode.endsWith('"')) {
              sContainerCode = JSON.parse(sContainerCode);
            } else if (typeof sContainerCode === "string") {
              sContainerCode = sContainerCode.replace(/^"+|"+$/g, '');
            }
          } catch(e) {
            sContainerCode = (sContainerCode || "").replace(/^"+|"+$/g, '');
          }

          if (bEnabled && sContainerCode) {
            _startGTM(sContainerCode);
            _createIframe(sContainerCode);

            // lifecycle for hard load
            _startAgg({ refreshType: "loading", firstLoad: true });
            if (document.readyState === "complete") {
              _endAgg({ refreshType: "loading", firstLoad: true });
            } else {
              var onL = function(){ window.removeEventListener('load', onL); _endAgg({ refreshType: "loading", firstLoad: true }); };
              window.addEventListener('load', onL);
            }

            // initial virtual page entry into the session
            _recordPage();

            // attach SPA navigation + watchers
            _attachNavigation();
            _setupInputWatch();
          } else {
            _log("GA disabled or container missing", bEnabled, sContainerCode);
          }
        } catch(e) { _log("fnInit error", e); }
      }, this);

      var sQuery = "SANOFI_CORE/GoogleAnalytics/Query/GetGoogleAnalyticsInfoXquery";
      model.loadData("/XMII/Illuminator?QueryTemplate=" + sQuery + "&Content-Type=text/json");
    },

    // allow manual GTM start/frame (kept for compatibility)
    fnStartGA: function(c){ _startGTM(c); },
    fnCreateFrame: function(c){ _createIframe(c); },

    // InputChange is still exposed for manual push if needed
    handleChange: function(){
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'InputChange',
          LineDescription: window.LineDescription,
          DashboardDescription: window.DashboardDescription,
          LineId: window.LineId,
          DashboardId: window.DashboardId,
          client: window.client || null,
          plant: window.plant || null,
          nodeId: window.nodeId || (window.appData && window.appData.node && window.appData.node.nodeID) || null,
          userId: (window.appData && window.appData.user && (window.appData.user.userId || window.appData.user.id)) || null,
          timestamp: new Date().toISOString()
        });
        _log("InputChange pushed");
      } catch(e) {
        _log("handleChange error", e);
      }
    },

    // pushEvent/virtualPageView kept as public API
    pushEvent: function(eventName, params){
      try {
        params = params || {};
        if (eventName === "Start_Refresh") { _startAgg({ refreshType: params.refreshType || "navigation", firstLoad: !!params.firstLoad }); return; }
        if (eventName === "End_Refresh") { _endAgg({ refreshType: params.refreshType || "navigation", firstLoad: !!params.firstLoad }); return; }
        var payload = Object.assign({
          event: eventName,
          pagePath: window.location.pathname + window.location.search + window.location.hash,
          pageTitle: document.title,
          pageLocation: window.location.href,
          pageReferrer: document.referrer || document.location.href,
          timestamp: new Date().toISOString()
        }, params);
        window.dataLayer.push(payload);
      } catch(e) { _log("pushEvent error", e); }
    },

    fireVirtualPageView: function(path, title){
      try { _recordPage(path, title); } catch(e) { _log("fireVirtualPageView error", e); }
    }
  };
})();