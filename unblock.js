(function () {
  "use strict";

  var CE = [
    "copy", "cut", "paste",
    "beforecopy", "beforecut", "beforepaste",
  ];

  // ---------------------------------------------------------------
  // 1. Neuter preventDefault / stopPropagation on ClipboardEvents
  //    Lets all handlers run (app copy logic still works) but
  //    prevents any handler from actually blocking the action.
  // ---------------------------------------------------------------

  var origPD = Event.prototype.preventDefault;
  var origSP = Event.prototype.stopPropagation;
  var origSIP = Event.prototype.stopImmediatePropagation;

  Event.prototype.preventDefault = function () {
    if (this instanceof ClipboardEvent) return;
    return origPD.call(this);
  };

  Event.prototype.stopPropagation = function () {
    if (this instanceof ClipboardEvent) return;
    return origSP.call(this);
  };

  Event.prototype.stopImmediatePropagation = function () {
    if (this instanceof ClipboardEvent) return;
    return origSIP.call(this);
  };

  var origRVDesc = Object.getOwnPropertyDescriptor(Event.prototype, "returnValue");
  if (origRVDesc && origRVDesc.set) {
    Object.defineProperty(Event.prototype, "returnValue", {
      get: function () { return origRVDesc.get.call(this); },
      set: function (v) {
        if (this instanceof ClipboardEvent && !v) return;
        return origRVDesc.set.call(this, v);
      },
      configurable: true,
    });
  }

  // ---------------------------------------------------------------
  // 2. Block oncopy / oncut / onpaste property setters
  // ---------------------------------------------------------------

  var seal = function (proto, events) {
    events.forEach(function (evt) {
      try {
        Object.defineProperty(proto, "on" + evt, {
          get: function () { return null; },
          set: function () {},
          configurable: true,
        });
      } catch (e) {}
    });
  };

  seal(Document.prototype, CE);
  seal(HTMLElement.prototype, CE);
  seal(Window.prototype, CE);

  // ---------------------------------------------------------------
  // 3. Protect Clipboard API from being overridden
  // ---------------------------------------------------------------

  if (navigator.clipboard) {
    var cp = navigator.clipboard;
    var cproto = cp.constructor.prototype;
    ["read", "readText", "write", "writeText"].forEach(function (m) {
      if (cproto[m]) {
        Object.defineProperty(cproto, m, {
          value: cproto[m],
          writable: false,
          configurable: false,
        });
      }
    });
    Object.defineProperty(navigator, "clipboard", {
      value: cp,
      writable: false,
      configurable: false,
    });
  }

  var ec = document.execCommand.bind(document);
  try {
    Object.defineProperty(Document.prototype, "execCommand", {
      value: function () { return ec.apply(document, arguments); },
      writable: false,
      configurable: false,
    });
  } catch (e) {}

  var gs = window.getSelection.bind(window);
  try {
    Object.defineProperty(window, "getSelection", {
      value: gs,
      writable: false,
      configurable: false,
    });
  } catch (e) {}

  // ---------------------------------------------------------------
  // 4. Auto-remove common DLP / "action blocked" modals
  // ---------------------------------------------------------------

  var markers = [
    "Action blocked",
    "blocked by your organization",
    "Copy/Print action is blocked",
    "DLP Exception Request",
    "CASB as exception type",
    "security policy",
    "Defender for Cloud Apps",
    "action is not allowed",
    "clipboard access denied",
    "copying is disabled",
    "paste is not allowed",
  ];

  var clean = function () {
    var els = document.querySelectorAll(
      'div[class*="modal"], div[class*="dialog"], div[class*="overlay"], ' +
      'div[class*="popup"], div[class*="block"], div[class*="dlp"], ' +
      'div[class*="cas-"], div[class*="mcas"], div[role="dialog"], ' +
      'div[role="alertdialog"]'
    );
    els.forEach(function (el) {
      var t = (el.textContent || "").toLowerCase();
      for (var i = 0; i < markers.length; i++) {
        if (t.indexOf(markers[i].toLowerCase()) !== -1) {
          el.remove();
          document.querySelectorAll(
            'div[class*="backdrop"], div[class*="overlay"], div[class*="mask"]'
          ).forEach(function (b) {
            var s = window.getComputedStyle(b);
            if (s.position === "fixed") b.remove();
          });
          if (document.body) {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
          }
          return;
        }
      }
    });
  };

  var mo = new MutationObserver(function () { clean(); });

  var watch = function () {
    mo.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  if (document.body) watch();
  else document.addEventListener("DOMContentLoaded", watch);

  setInterval(clean, 500);

  // ---------------------------------------------------------------
  // 5. Force text selection enabled via CSS
  // ---------------------------------------------------------------

  var inject = function () {
    var s = document.createElement("style");
    s.textContent =
      "* { -webkit-user-select: text !important; " +
      "-moz-user-select: text !important; " +
      "-ms-user-select: text !important; " +
      "user-select: text !important; }";
    (document.head || document.documentElement).appendChild(s);
  };

  if (document.head) inject();
  else document.addEventListener("DOMContentLoaded", inject);
})();
