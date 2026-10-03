/* SLW Hub share button: one shared script for every hub page.
 * Adds an accessible "Share" button at the top right of the page header.
 *  - Uses the Web Share API (navigator.share) where available (phones, Safari, Edge, Chrome on Windows/Android).
 *  - Otherwise copies the page link to the clipboard and shows a brief "Link copied" toast.
 * No external services, no analytics, no tracking.
 * Page tag:  <script src="/assets/share-button.js" defer></script>
 * To remove: delete this file and the one script tag per page.
 */
(function () {
  "use strict";
  if (window.__slwShareButton) return;
  window.__slwShareButton = true;

  var CSS = [
    ".slw-share{display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;order:5;margin:0 0 0 4px;min-height:40px;padding:7px 13px;font-family:var(--font-body,\"Source Sans 3\",\"Segoe UI\",system-ui,sans-serif);font-size:.92rem;font-weight:600;line-height:1.2;color:var(--ink,#f3ead8);background:var(--paper,#1f1b15);border:1px solid var(--rule-bright,#5a4e3c);border-radius:999px;cursor:pointer;-webkit-appearance:none;appearance:none;touch-action:manipulation;text-decoration:none}",
    ".slw-share:hover{border-color:var(--gold,#d4b483);color:var(--gold,#d4b483)}",
    ".slw-share:focus-visible{outline:3px solid var(--gold,#d4b483);outline-offset:2px}",
    ".slw-share svg{width:18px;height:18px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
    ".slw-share.slw-share-fixed{position:fixed;top:10px;right:10px;z-index:70;margin:0}",
    ".slw-share-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,12px);z-index:2147483000;max-width:calc(100vw - 32px);padding:10px 18px;font-family:var(--font-body,\"Source Sans 3\",\"Segoe UI\",system-ui,sans-serif);font-size:1rem;line-height:1.3;color:#110f0c;background:#d4b483;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}",
    ".slw-share-toast.on{opacity:1;transform:translate(-50%,0)}",
    "@media (max-width:860px){.slw-share{order:1;margin:0 -6px 0 auto}.slw-share+.nav-toggle,.slw-share~.nav-toggle{order:2;margin-left:0}}",
    "@media (max-width:1024px){.slw-share{min-height:44px;min-width:44px}}",
    "@media (max-width:420px){.slw-share .slw-share-text{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}.slw-share{padding:7px 11px}}",
    "@media (prefers-reduced-motion:reduce){.slw-share-toast{transition:none}}",
    "@media print{.slw-share,.slw-share-toast{display:none!important}}"
  ].join("\n");

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
    '<line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>';

  function pageUrl() {
    var c = document.querySelector('link[rel="canonical"]');
    if (c && c.href) return c.href;
    return location.href;
  }

  var toast, toastTimer;
  function showToast(msg) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "slw-share-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    // force reflow so the transition runs even on repeated clicks
    void toast.offsetWidth;
    toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("on"); }, 2200);
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.setAttribute("aria-hidden", "true");
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { ta.setSelectionRange(0, text.length); } catch (e) {}
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyLink(url) {
    function done(ok) {
      if (ok) showToast("Link copied");
      else window.prompt("Copy this link:", url);
    }
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () { done(true); },
        function () { done(legacyCopy(url)); });
    } else {
      done(legacyCopy(url));
    }
  }

  function share() {
    var url = pageUrl();
    var data = { title: document.title, url: url };
    if (navigator.share) {
      navigator.share(data).catch(function (err) {
        if (err && err.name === "AbortError") return; // user closed the share sheet
        copyLink(url);
      });
    } else {
      copyLink(url);
    }
  }

  function init() {
    if (document.querySelector(".slw-share")) return;
    var style = document.createElement("style");
    style.id = "slw-share-style";
    style.textContent = CSS;
    document.head.appendChild(style);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slw-share";
    btn.setAttribute("aria-label", "Share this page");
    btn.setAttribute("title", "Share this page");
    btn.innerHTML = ICON + '<span class="slw-share-text">Share</span>';
    btn.addEventListener("click", share);

    var host = document.querySelector("header.site-header .header-inner, header.site .wrap, header.site .header-inner");
    if (host) {
      // Put it just before the main nav in the DOM (so it sits beside the Menu
      // toggle on phones; before the toggle so it can precede it in flex order); CSS `order` moves it to the far right on wide screens.
      var nav = host.querySelector(".nav-toggle") || host.querySelector("nav.primary");
      if (nav && nav.parentNode === host) host.insertBefore(btn, nav);
      else host.appendChild(btn);
    } else {
      btn.className += " slw-share-fixed";
      document.body.appendChild(btn);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
