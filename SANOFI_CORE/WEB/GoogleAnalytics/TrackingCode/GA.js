/*-----------------------------------------------------------------------------------
Google Analytics code
Final merged version - Option A (Real action timestamps for InputChange)
Creation Date: 2023-07-06 / By: E0427320
Updates: merged timezone/server-alignment patches + InputChange real-action timestamps
Description: This file must be included to all application pages
-------------------------------------------------------------------------------------*/
// U1044724 - updated and hardened by assistant
jQuery.sap.declare("SanofiCore.GoogleAnalytics.TrackingCode.GA");

(function () {
  "use strict";

  function fmtLocal(dt) {
    try {
      var d = dt instanceof Date ? dt : new Date(dt);
      var z = function (n) { return String(n).padStart(2, "0"); };
      return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + " " +
             z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds());
    } catch (e) { return null; }
  }

  function nowMs() { return Date.now(); }
  
  function msToHMS(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    // Format avec zéro devant si nécessaire
    return (
        hours.toString().padStart(2, '0') + ':' +
        minutes.toString().padStart(2, '0') + ':' +
        seconds.toString().padStart(2, '0')
    );
  }

  function safePush(obj) { try { window.dataLayer = window.dataLayer || []; window.dataLayer.push(obj); } catch (e) {} }

  async function sha256Hex(input) {
    try {
      if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        var enc = new TextEncoder().encode(String(input));
        var digest = await window.crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {}
    return null;
  }

  var CONTAINER = "";
  var ENABLED = false;
  var INITIALIZED = false;
  var AGG = null;
  var LAST_PAGE = { path: null, ts: 0 };
  var PAGE_DEDUPE_MS = 1500;
  var VP_DEDUPE_MS = 1500;
  var FLUSH_LOCK_MS = 1200;

  window.__SANOFI_GA_LAST_VP_KEY = window.__SANOFI_GA_LAST_VP_KEY || null;
  window.__SANOFI_GA_LAST_VP_TS = window.__SANOFI_GA_LAST_VP_TS || 0;
  window.__SANOFI_GA_FLUSH_LOCK_TS = window.__SANOFI_GA_FLUSH_LOCK_TS || 0;
  window.__SANOFI_GA_LAST_VP_END_TS = window.__SANOFI_GA_LAST_VP_END_TS || 0;
  window.__SANOFI_GA_LAST_VP_START_TS = window.__SANOFI_GA_LAST_VP_START_TS || 0;
  window.__SANOFI_GA_LAST_IC_KEY = window.__SANOFI_GA_LAST_IC_KEY || null;
  window.__SANOFI_GA_LAST_IC_TS = window.__SANOFI_GA_LAST_IC_TS || 0;

  window.__SANOFI_GA_LAST_LOGIN_CLIENT_TS = window.__SANOFI_GA_LAST_LOGIN_CLIENT_TS || null;
  window.__SANOFI_GA_LAST_LOGIN_SERVER_TS = window.__SANOFI_GA_LAST_LOGIN_SERVER_TS || null;
  window.__SANOFI_GA_SERVER_OFFSET_MS = window.__SANOFI_GA_SERVER_OFFSET_MS || 0;

  var NAV_OCCURRED = false;

  function sanitizeContainer(s) {
    if (!s) return "";
    if (typeof s !== "string") s = String(s);
    try { if (s.startsWith('"') && s.endsWith('"')) return JSON.parse(s); } catch (e) {}
    return s.replace(/^"+|"+$/g, '');
  }

  function loadGTM(id) {
    if (!id) return;
    if (window.__SANOFI_GTM_ID === id && window.__SANOFI_GTM_LOADED) return;
    (function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', id);
    window.__SANOFI_GTM_ID = id;
    window.__SANOFI_GTM_LOADED = true;
  }

  function createIframe(id) {
    if (!id) return;
    if (document.getElementById("GA4_IFRAME")) return;
    var ifr = document.createElement('iframe'); ifr.id = "GA4_IFRAME";
    ifr.src = "https://www.googletagmanager.com/ns.html?id=" + id; ifr.style.display = "none";
    try { document.body.appendChild(ifr); } catch (e) { setTimeout(function () { try { document.body.appendChild(ifr); } catch (e) {} }, 300); }
  }

  function startAgg(meta) {
    meta = meta || {};
    var startTs;
    if ((meta && meta.firstLoad) || meta.refreshType === "loading") {
      try {
        if (typeof meta.startTs !== 'number') {
          var nav = performance?.getEntriesByType('navigation')?.[0];
          if (nav && performance.timing?.navigationStart)
            startTs = Math.floor(performance.timing.navigationStart + (nav.startTime || 0));
          else if (performance.timing?.navigationStart)
            startTs = performance.timing.navigationStart;
          else startTs = nowMs();
        } else startTs = meta.startTs;
      } catch (e) { startTs = (typeof meta.startTs === 'number') ? meta.startTs : nowMs(); }
    } else {
      startTs = (typeof meta.startTs === 'number') ? meta.startTs : nowMs();
    }

    try {
      if (window.__SANOFI_GA_LAST_VP_END_TS && startTs <= window.__SANOFI_GA_LAST_VP_END_TS) {
        startTs = window.__SANOFI_GA_LAST_VP_END_TS + 1;
      }
    } catch (e) {}

    AGG = { startTs: startTs, pages: [], refreshType: meta.refreshType || "unknown", firstLoad: !!meta.firstLoad };
    try { window.__SANOFI_GA_LAST_VP_START_TS = AGG.startTs; } catch (e) {}
  }

  function recordPage(path, title) {
    try {
      var p = path || (window.location.pathname + window.location.search + window.location.hash);
      var t = nowMs();
      if (LAST_PAGE.path === p && (t - LAST_PAGE.ts) < PAGE_DEDUPE_MS) return;
      LAST_PAGE = { path: p, ts: t };
      if (!AGG) startAgg({ refreshType: "unknown", firstLoad: false });
      AGG.pages.push({
        pagePath: p,
        pageTitle: title || document.title,
        pageLocation: window.location.href,
        timestampISO: (new Date()).toISOString()
      });
      try { if (CONTAINER) gtag('config', CONTAINER, { 'send_page_view': false, 'page_referrer': document.referrer || window.location.href, 'page_location': p, 'update': true }); } catch (e) {}
    } catch (e) {}
  }

  function endAgg(meta) {
    var now = nowMs();
    if (now - (window.__SANOFI_GA_FLUSH_LOCK_TS || 0) < FLUSH_LOCK_MS) {
      AGG = null;
      return;
    }
    window.__SANOFI_GA_FLUSH_LOCK_TS = now;

    if (!AGG) return;
    meta = meta || {};
    if (meta.refreshType) AGG.refreshType = meta.refreshType;
    if (typeof meta.firstLoad !== 'undefined') AGG.firstLoad = !!meta.firstLoad;

    var endTs = nowMs();
    if (AGG.firstLoad || AGG.refreshType === "loading") {
      try {
        var nav = performance?.getEntriesByType('navigation')?.[0];
        if (nav && nav.loadEventEnd > 0 && performance.timing?.navigationStart)
          endTs = Math.floor(performance.timing.navigationStart + nav.loadEventEnd);
        else if (performance.timing?.loadEventEnd > 0)
          endTs = performance.timing.loadEventEnd;
      } catch (e) {}
    } else {
      endTs = nowMs();
    }

    AGG.endTs = endTs;
    var computedDuration = Math.max(0, AGG.endTs - AGG.startTs);

    if (computedDuration <= 0 || computedDuration < 50) {
      try {
        var nav2 = performance?.getEntriesByType('navigation')?.[0];
        if (nav2 && performance.timing?.navigationStart && nav2.loadEventEnd > 0) {
          var candidateEnd = Math.floor(performance.timing.navigationStart + nav2.loadEventEnd);
          if (candidateEnd > AGG.startTs) computedDuration = candidateEnd - AGG.startTs;
        } else if (nav2 && typeof nav2.startTime === 'number' && performance.timing?.navigationStart) {
          var estEnd = Math.floor(performance.timing.navigationStart + (nav2.startTime || 0));
          if (estEnd > AGG.startTs) computedDuration = Math.max(0, nowMs() - AGG.startTs, estEnd - AGG.startTs);
        }
      } catch (e) {}
      if (!computedDuration || computedDuration <= 0) computedDuration = nowMs() - AGG.startTs;
      if (computedDuration < 1000) computedDuration = 1000;
      AGG.endTs = AGG.startTs + computedDuration;
    }

    AGG.durationMs = computedDuration;

    // Align to server time if login mapping exists (only when mapping is valid)
    var serverOffset = 0;
    try {
      var loginClient = window.__SANOFI_GA_LAST_LOGIN_CLIENT_TS || null;
      var loginServer = window.__SANOFI_GA_LAST_LOGIN_SERVER_TS || null;
      if (loginClient && loginServer && Math.abs(loginClient - nowMs()) < (1000 * 60 * 60 * 24)) {
        serverOffset = window.__SANOFI_GA_SERVER_OFFSET_MS || (loginClient - loginServer);
      } else {
        serverOffset = window.__SANOFI_GA_SERVER_OFFSET_MS || 0;
      }
    } catch (e) { serverOffset = window.__SANOFI_GA_SERVER_OFFSET_MS || 0; }

    var vpStartMs = AGG.startTs - (serverOffset || 0);
    var vpEndMs = AGG.endTs - (serverOffset || 0);
    var serverAlignedDurationMs = Math.max(0, vpEndMs - vpStartMs);
    if (serverAlignedDurationMs < 1) serverAlignedDurationMs = Math.max(1000, AGG.durationMs);

    var vp = {
      event: "virtualPageView",
      timestamp: new Date(vpStartMs).toISOString(),
      startTime: new Date(vpStartMs).toISOString(),
      endTime: new Date(vpEndMs).toISOString(),
      durationMs: serverAlignedDurationMs,
      duration: msToHMS(serverAlignedDurationMs),   //(serverAlignedDurationMs / 1000).toFixed(2) + " s",
      refreshType: AGG.refreshType,
      firstLoad: !!AGG.firstLoad,
      pages: AGG.pages.slice(),
      pagePath: (AGG.pages.length ? AGG.pages[0].pagePath : (window.location.pathname + window.location.search + window.location.hash)),
      pageTitle: (AGG.pages.length ? AGG.pages[0].pageTitle : document.title),
      pageLocation: window.location.href,
      pageReferrer: document.referrer || window.location.href
    };

    try {
      var key = vp.refreshType + "|" + vp.pagePath + "|" + vp.startTime + "|" + vp.endTime + "|" + vp.durationMs;
      var gnow = nowMs();
      if (window.__SANOFI_GA_LAST_VP_KEY === key && (gnow - (window.__SANOFI_GA_LAST_VP_TS || 0)) < VP_DEDUPE_MS) {
        AGG = null;
        return;
      }
      window.__SANOFI_GA_LAST_VP_KEY = key;
      window.__SANOFI_GA_LAST_VP_TS = gnow;
    } catch (e) {}

    safePush(vp);
    try { window.__SANOFI_GA_LAST_VP_END_TS = AGG.endTs || nowMs(); } catch (e) {}
    AGG = null;
  }

  function attachNav() {
    if (window.__SANOFI_GA_NAV_ATTACHED) return;
    window.__SANOFI_GA_NAV_ATTACHED = true;

    var NAV_FALLBACK_END_MS = 400;
    var scheduledEndHandle = null;
    function scheduleFallbackEnd() {
      if (scheduledEndHandle) clearTimeout(scheduledEndHandle);
      scheduledEndHandle = setTimeout(function () {
        try { endAgg({ refreshType: "navigation" }); } catch (e) {}
        scheduledEndHandle = null;
      }, NAV_FALLBACK_END_MS);
    }
    function cancelFallbackEnd() {
      if (scheduledEndHandle) { clearTimeout(scheduledEndHandle); scheduledEndHandle = null; }
    }

    function cycle(route) {
      NAV_OCCURRED = true;
      try {
        startAgg({ refreshType: "navigation", firstLoad: false, startTs: nowMs() });
        recordPage();
        scheduleFallbackEnd();
      } catch (e) {}
    }

    var poll = setInterval(function () {
      try {
        if (window.sap && sap.ui && sap.ui.core && sap.ui.core.UIComponent) {
          var comp = sap.ui.core.UIComponent.getRouterFor && sap.ui.core.UIComponent.getRouterFor();
          if (comp && comp.attachRouteMatched) {
            comp.attachRouteMatched(function (e) {
              try {
                cycle(e.getParameter && e.getParameter('name'));
                setTimeout(function () {
                  try { endAgg({ refreshType: "navigation" }); } catch (err) {}
                }, 300);
              } catch (err) {}
            });
            clearInterval(poll); return;
          }
        }
      } catch (e) {}
    }, 300);

    window.addEventListener('popstate', function () { cycle('popstate'); });
    try {
      var op = history.pushState;
      if (op && !op.__sanofi_wrapped) {
        history.pushState = function () { op.apply(this, arguments); cycle('pushState'); };
        history.pushState.__sanofi_wrapped = true;
      }
      var or = history.replaceState;
      if (or && !or.__sanofi_wrapped) {
        history.replaceState = function () { or.apply(this, arguments); cycle('replaceState'); };
        history.replaceState.__sanofi_wrapped = true;
      }
    } catch (e) {}

    window.addEventListener('load', function () {
      cancelFallbackEnd();
      try { endAgg({ refreshType: "loading", firstLoad: false }); } catch (e) {}
    });
  }

  var pendingICTimer = null, pendingICPayload = null;
  var IC_COALESCE_MS = 400, DEDUPE_WINDOW_MS = 2500, FLOOD_GUARD_MS = 250;

  function normalizePayloadForKey(p) {
    try {
      return JSON.stringify({
        event: p.event || null,
        LineId: p.LineId || null,
        LineDescription: p.LineDescription || null,
        DashboardId: p.DashboardId || null,
        DashboardDescription: p.DashboardDescription || null,
        client: (p.client === "N/A" || typeof p.client === "undefined") ? null : p.client,
        plant: (p.plant === "N/A" || typeof p.plant === "undefined") ? null : p.plant,
        nodeId: p.nodeId || null,
        userId: (p.userId === "N/A" || typeof p.userId === "undefined") ? null : p.userId,
        encoded_user_id: p.encoded_user_id || null
      });
    } catch (e) { return null; }
  }

  function doPushPendingIC() {
    try {
      if (!pendingICPayload) return;
      var payload = pendingICPayload; pendingICPayload = null;
      if (pendingICTimer) { clearTimeout(pendingICTimer); pendingICTimer = null; }

      var key = normalizePayloadForKey(payload);
      var now = Date.now();

      if (now - (window.__SANOFI_GA_LAST_IC_TS || 0) < FLOOD_GUARD_MS) return;
      if (window.__SANOFI_GA_LAST_IC_KEY === key && (now - (window.__SANOFI_GA_LAST_IC_TS || 0)) < DEDUPE_WINDOW_MS) return;

      window.__SANOFI_GA_LAST_IC_KEY = key;
      window.__SANOFI_GA_LAST_IC_TS = now;

      var startClientMs = payload._actionClientTs || (now - 3000); // fallback
      var endClientMs = now;

      var serverOffset = 0;
      try {
        var loginClient = window.__SANOFI_GA_LAST_LOGIN_CLIENT_TS || null;
        var loginServer = window.__SANOFI_GA_LAST_LOGIN_SERVER_TS || null;
        if (loginClient && loginServer && loginClient <= endClientMs + 2000) {
          serverOffset = window.__SANOFI_GA_SERVER_OFFSET_MS || (loginClient - loginServer);
        } else {
          serverOffset = window.__SANOFI_GA_SERVER_OFFSET_MS || 0;
        }
      } catch (e) { serverOffset = window.__SANOFI_GA_SERVER_OFFSET_MS || 0; }

      var startServerAlignedMs = startClientMs - (serverOffset || 0);
      var endServerAlignedMs = endClientMs - (serverOffset || 0);
      var durationServer = Math.max(0, endServerAlignedMs - startServerAlignedMs);
      if (!durationServer || durationServer < 1) durationServer = Math.max(1000, endClientMs - startClientMs);

      payload.startTime = new Date(startServerAlignedMs).toISOString();
      payload.endTime = new Date(endServerAlignedMs).toISOString();
      payload.timestamp = payload.startTime;
      payload.durationMs = durationServer;
      payload.duration = msToHMS(durationServer); // (durationServer / 1000).toFixed(2) + " s";

      payload.pages = payload.pages || [];
      if (payload.pages.length === 0) {
        payload.pages.push({
          pagePath: window.location.pathname + window.location.search + window.location.hash,
          pageTitle: document.title,
          pageLocation: window.location.href,
          timestampISO: new Date(startServerAlignedMs).toISOString()
        });
      } else {
        try { payload.pages[0].timestampISO = new Date(startServerAlignedMs).toISOString(); } catch (e) {}
      }

      safePush(payload);
    } catch (e) {}
  }

  function scheduleInputChangePush(snapshot) {
    pendingICPayload = snapshot;
    if (pendingICTimer) clearTimeout(pendingICTimer);
    pendingICTimer = setTimeout(doPushPendingIC, IC_COALESCE_MS);
  }

  var watchSetup = false;
  function setupSelectionWatch() {
    if (watchSetup) return; watchSetup = true;
    var keys = ['LineId','LineDescription','DashboardId','DashboardDescription'];
    var last = {}; keys.forEach(k => { try { last[k] = window[k]; } catch (e) { last[k] = undefined; } });

    function fireSnapshot(trigger) {
      if (!NAV_OCCURRED && trigger !== 'manual') return;
      var snapshot = {
        event: 'InputChange',
        LineDescription: window.LineDescription || last.LineDescription || null,
        DashboardDescription: window.DashboardDescription || last.DashboardDescription || null,
        LineId: window.LineId || last.LineId || null,
        DashboardId: window.DashboardId || last.DashboardId || null,
          ActivityID: window.ActivityID || null,
          ActivityDescription: window.ActivityDescription || null,
        client: (typeof window.client !== 'undefined' ? window.client : (window.appData && window.appData.client)) || "N/A",
        plant: (typeof window.PlantParam !== 'undefined' ? window.PlantParam : (window.appData && window.appData.plant)) || "N/A",
        nodeId: window.nodeId || window.LineId || null,
        userId: (window.userId || (window.appData && window.appData.user && (window.appData.user.userId || window.appData.user.id))) || "N/A",
        encoded_user_id: null,
        _trigger: (trigger || "nav:change"),
        _actionClientTs: Date.now()
      };

      var raw = window.userId || (window.appData && window.appData.user && (window.appData.user.userId || window.appData.user.id)) || null;
      if (raw) {
        sha256Hex(raw).then(hex => { snapshot.encoded_user_id = hex; scheduleInputChangePush(snapshot); }).catch(() => scheduleInputChangePush(snapshot));
      } else {
        scheduleInputChangePush(snapshot);
      }
    }

    try {
      keys.forEach(k => {
        (function (key) {
          var v = last[key];
          Object.defineProperty(window, key, {
            configurable: true, enumerable: true,
            get: function () { return v; },
            set: function (n) { v = n; last[key] = v; fireSnapshot('auto'); }
          });
        })(k);
      });
      var attempts = 0;
      var poll = setInterval(function () {
        attempts++;
        var ch = false;
        keys.forEach(function (k) { try { if (window[k] !== last[k]) { last[k] = window[k]; ch = true; } } catch (e) {} });
        if (ch) fireSnapshot('poll');
        if (attempts > 40) clearInterval(poll);
      }, 200);
    } catch (e) {
      var poll2 = setInterval(function () {
        var ch=false;
        keys.forEach(function (k) { try { if (window[k] !== last[k]) { last[k] = window[k]; ch=true; } } catch (e) {} });
        if (ch) fireSnapshot('poll2');
      }, 300);
      setTimeout(function () { clearInterval(poll2); }, 10000);
    }
  }

  var module = {
    fnInit: function (ctx) {
      if (INITIALIZED) return; INITIALIZED = true;
      var model = new sap.ui.model.json.JSONModel();

      model.attachRequestCompleted(async function (ev) {
        try {
          var row = ev.oSource.oData?.Rowsets?.Rowset?.[0]?.Row?.[0];
          if (!row) return;
          ENABLED = !!row.GAEnable;
          CONTAINER = sanitizeContainer(row.GAContainerCode || "");
          if (ENABLED && CONTAINER) {
            loadGTM(CONTAINER);
            createIframe(CONTAINER);

           var rawUser = window.userId || (window.appData?.user?.userId || window.appData?.user?.id) || null;
            var encoded = rawUser ? await sha256Hex(rawUser) : null;

            var serverIso = (new Date()).toISOString();
            safePush({ event: "user_login", userId: rawUser, encoded_user_id: encoded, timestamp: serverIso });

            try {
              var parsed = Date.parse(serverIso);
              if (!isNaN(parsed)) {
                window.__SANOFI_GA_LAST_LOGIN_CLIENT_TS = Date.now();
                window.__SANOFI_GA_LAST_LOGIN_SERVER_TS = parsed;
                window.__SANOFI_GA_SERVER_OFFSET_MS = window.__SANOFI_GA_LAST_LOGIN_CLIENT_TS - parsed;
              }
            } catch (e) {}

            // initial loading aggregation
            startAgg({ refreshType: "loading", firstLoad: true });
            if (document.readyState === "complete") {
              endAgg({ refreshType: "loading", firstLoad: true });
            } else {
              var onL = function () { window.removeEventListener('load', onL); endAgg({ refreshType: "loading", firstLoad: true }); };
              window.addEventListener('load', onL);
            }

            recordPage();
            attachNav();
            setupSelectionWatch();
            NAV_OCCURRED = true;
          }
        } catch (e) {}
      }, this);

      model.loadData("/XMII/Illuminator?QueryTemplate=SANOFI_CORE/GoogleAnalytics/Query/GetGoogleAnalyticsInfoXquery&Content-Type=text/json");
    },

    handleChange: function () {
      try {
      //  if (!NAV_OCCURRED) return;
        var rawUser = window.userId || (window.appData && window.appData.user && (window.appData.user.userId || window.appData.user.id)) || null;
        var snapshot = {
          event: 'InputChange',
          LineDescription: window.LineDescription || null,
          DashboardDescription: window.DashboardDescription || null,
          LineId: window.LineId || null,
          DashboardId: window.DashboardId || null,
          ActivityID: window.ActivityID || null,
          ActivityDescription: window.ActivityDescription || null,
          client: (typeof window.client !== 'undefined' ? window.client : (window.appData && window.appData.client)) || "N/A",
          plant: (typeof window.PlantParam !== 'undefined' ? window.PlantParam : (window.appData && window.appData.plant)) || "N/A",
          nodeId: window.nodeId || window.LineId || null,
          userId: rawUser || "N/A",
          encoded_user_id: null,
          _trigger: "manual",
          _actionClientTs: Date.now()
        };
        if (rawUser) {
          sha256Hex(rawUser).then(hex => { snapshot.encoded_user_id = hex; scheduleInputChangePush(snapshot); }).catch(() => scheduleInputChangePush(snapshot));
        } else scheduleInputChangePush(snapshot);
      } catch (e) {}
    },

    pushEvent: function (name, params) {
      try {
        params = params || {};
        if (name === "Start_Refresh") { startAgg(params || {}); return; }
        if (name === "End_Refresh") { endAgg(params || {}); return; }
        var p = Object.assign({
          event: name,
          pagePath: window.location.pathname + window.location.search + window.location.hash,
          pageTitle: document.title,
          pageLocation: window.location.href,
          pageReferrer: document.referrer || window.location.href,
          timestamp: (new Date()).toISOString()
        }, params || {});
        safePush(p);
      } catch (e) {}
    }
  };

  window.SanofiCore = window.SanofiCore || {};
  window.SanofiCore.GoogleAnalytics = window.SanofiCore.GoogleAnalytics || {};
  window.SanofiCore.GoogleAnalytics.TrackingCode = window.SanofiCore.GoogleAnalytics.TrackingCode || {};
  window.SanofiCore.GoogleAnalytics.TrackingCode.GA = module;
})();
