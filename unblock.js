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
  // 4. Intercept DLP network callbacks
  //    MCAS DLP scripts often report the blocked action back to the
  //    server via fetch/XHR, which can cause the portal to freeze
  //    when the report fails or retries. Block these silently.
  // ---------------------------------------------------------------

  var origFetch = window.fetch;
  window.fetch = function () {
    var url = arguments[0];
    if (typeof url === "string" && (
      url.indexOf("mcas") !== -1 && url.indexOf("audit") !== -1 ||
      url.indexOf("cloudappsecurity") !== -1 ||
      url.indexOf("cas-notifier") !== -1 ||
      url.indexOf("dlp") !== -1 && url.indexOf("report") !== -1
    )) {
      return Promise.resolve(new Response("{}", { status: 200 }));
    }
    return origFetch.apply(this, arguments);
  };

  var origXHROpen = XMLHttpRequest.prototype.open;
  var origXHRSend = XMLHttpRequest.prototype.send;
  var blockedXHRs = new WeakSet();

  XMLHttpRequest.prototype.open = function () {
    this._url = arguments[1] || "";
    if (typeof this._url === "string" && (
      this._url.indexOf("mcas") !== -1 && this._url.indexOf("audit") !== -1 ||
      this._url.indexOf("cloudappsecurity") !== -1 ||
      this._url.indexOf("cas-notifier") !== -1 ||
      this._url.indexOf("dlp") !== -1 && this._url.indexOf("report") !== -1
    )) {
      blockedXHRs.add(this);
      return;
    }
    return origXHROpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    if (blockedXHRs.has(this)) {
      Object.defineProperty(this, "readyState", { value: 4 });
      Object.defineProperty(this, "status", { value: 200 });
      Object.defineProperty(this, "responseText", { value: "{}" });
      if (typeof this.onload === "function") {
        try { this.onload(); } catch (e) {}
      }
      return;
    }
    return origXHRSend.apply(this, arguments);
  };

  // ---------------------------------------------------------------
  // 5. Auto-remove DLP / "action blocked" modals (debounced)
  // ---------------------------------------------------------------

  var markers = [
    "action blocked",
    "blocked by your organization",
    "copy/print action is blocked",
    "dlp exception request",
    "casb as exception type",
    "security policy",
    "defender for cloud apps",
    "action is not allowed",
    "clipboard access denied",
    "copying is disabled",
    "paste is not allowed",
  ];

  var cleaning = false;

  var clean = function () {
    if (cleaning) return;
    cleaning = true;

    var els = document.querySelectorAll(
      'div[class*="modal"], div[class*="dialog"], div[class*="overlay"], ' +
      'div[class*="popup"], div[class*="block"], div[class*="dlp"], ' +
      'div[class*="cas-"], div[class*="mcas"], div[role="dialog"], ' +
      'div[role="alertdialog"]'
    );

    var found = false;
    els.forEach(function (el) {
      if (found) return;
      var t = (el.textContent || "").toLowerCase();
      for (var i = 0; i < markers.length; i++) {
        if (t.indexOf(markers[i]) !== -1) {
          found = true;
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

    // Debounce: wait before allowing next clean
    setTimeout(function () { cleaning = false; }, 200);
  };

  var mo = new MutationObserver(function () {
    requestAnimationFrame(clean);
  });

  var watch = function () {
    mo.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  if (document.body) watch();
  else document.addEventListener("DOMContentLoaded", watch);

  // ---------------------------------------------------------------
  // 6. Force text selection enabled via CSS
  // ---------------------------------------------------------------

  var injectStyle = function () {
    var s = document.createElement("style");
    s.textContent =
      "* { -webkit-user-select: text !important; " +
      "-moz-user-select: text !important; " +
      "-ms-user-select: text !important; " +
      "user-select: text !important; }";
    (document.head || document.documentElement).appendChild(s);
  };

  if (document.head) injectStyle();
  else document.addEventListener("DOMContentLoaded", injectStyle);
})();
