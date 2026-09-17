sap.ui.define(["sap/ui/core/IconColor"], function (IconColor) {
  "use strict";

  return {

    // Semantic colour formatter (theme-aware)
    formatIcon: function (status) {
      // Normalize input (case, spaces)
      var s = (status || "").toString().trim().toLowerCase();

      if (s === "stopped") {
        return IconColor.Negative;   // 🔴 Red - stopped / error
      }
      if (s === "faulted") {
        return IconColor.Critical;   // 🟠 Yellow/Orange - warning
      }
      return IconColor.Positive;     // 🟢 Green - running / healthy
    },

    // === Other formatters (no change) ===
    displayButtonRun: function (mode, status) {
      if (mode === "Automatic") return false;
      return (status === "Stopped");
    },

    displayAction: function (mode) {
      return (mode === "Automatic");
    },

    iconButton: function (status) {
      if (status === "Stopped") return "sap-icon://media-play";
      if (status === "Faulted") return "sap-icon://restart";
      return "sap-icon://stop";
    },

    displayButtonReStart: function (status) {
      return (status === "Faulted");
    }

  };
});
