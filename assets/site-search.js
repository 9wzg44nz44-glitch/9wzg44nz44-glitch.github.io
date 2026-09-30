/* SLW Hub site search: one shared script for every hub page.
 * Injects a search bar at the top of the page and searches /search-index.json
 * entirely in the browser. No external services, no analytics, no tracking.
 * Page tag:  <script src="/assets/site-search.js" defer></script>
 * Rebuild the index after adding/editing pages: python3 tools/build_search_index.py
 */
(function () {
  "use strict";
  if (window.__slwSiteSearch) return;
  window.__slwSiteSearch = true;

  var INDEX_URL = "/search-index.json";
  var RESULTS_URL = "/search.html";
  var RESPONSIVE_CSS = "/assets/site-responsive.css";
  var MAX_DROPDOWN = 8;
  var isResultsPage = /\/search\.html$/.test(location.pathname);

  var CSS = [
    "#site-search{position:relative;z-index:60;margin:0;padding:10px 16px;background:rgba(17,15,12,.97);border-bottom:1px solid #3a3328;font-family:\"Source Sans 3\",\"Segoe UI\",system-ui,-apple-system,sans-serif;font-size:17px;line-height:1.4;color:#f3ead8;text-align:left}",
    "#site-search *,#site-search *::before,#site-search *::after{box-sizing:border-box}",
    "#site-search .ss-inner{position:relative;max-width:640px;margin:0 auto}",
    "#site-search .ss-form{display:flex;gap:8px;margin:0;padding:0;align-items:stretch;width:100%}",
    "#site-search .ss-label{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}",
    "#site-search .ss-input{flex:1 1 auto;min-width:0;width:100%;height:auto;min-height:48px;margin:0;padding:10px 14px;font:inherit;font-size:17px;line-height:1.3;color:#f3ead8;background:#1f1b15;border:1px solid #7d7363;border-radius:10px;-webkit-appearance:none;appearance:none;box-shadow:none}",
    "#site-search .ss-input::placeholder{color:#b7ab95;opacity:1}",
    "#site-search .ss-input:focus{outline:3px solid #d4b483;outline-offset:1px;border-color:#d4b483}",
    "#site-search .ss-btn{flex:0 0 auto;min-width:92px;min-height:48px;margin:0;padding:10px 18px;font:inherit;font-size:17px;font-weight:600;line-height:1.2;color:#110f0c;background:#d4b483;border:1px solid #d4b483;border-radius:10px;cursor:pointer;-webkit-appearance:none;appearance:none;touch-action:manipulation}",
    "#site-search .ss-btn:hover{background:#f3ead8;border-color:#f3ead8}",
    "#site-search .ss-btn:focus-visible{outline:3px solid #f3ead8;outline-offset:2px}",
    "#site-search .ss-results{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:1000;max-height:min(70vh,560px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;margin:0;padding:6px;background:#1f1b15;border:1px solid #5a4e3c;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.55)}",
    "#site-search .ss-results[hidden]{display:none}",
    "#site-search .ss-status{margin:0;padding:8px 12px;font-size:15px;color:#b7ab95}",
    "#site-search .ss-list,#ss-page .ss-list{list-style:none;margin:0;padding:0}",
    ".ss-item{margin:0;padding:0;border-top:1px solid #3a3328}",
    ".ss-item:first-child{border-top:0}",
    ".ss-link{display:block;min-height:44px;padding:10px 12px;border-radius:8px;text-decoration:none!important;color:#f3ead8!important;overflow-wrap:anywhere}",
    ".ss-link:hover,.ss-link:focus{background:#2c261c;outline:none}",
    ".ss-link:focus-visible{outline:2px solid #d4b483;outline-offset:-2px}",
    ".ss-title{display:block;font-size:17px;font-weight:600;line-height:1.3;color:#d4b483}",
    ".ss-url{display:block;margin-top:2px;font-family:\"IBM Plex Mono\",ui-monospace,Menlo,monospace;font-size:13px;color:#9a8f7c;word-break:break-all}",
    ".ss-snip{display:block;margin-top:4px;font-size:15px;line-height:1.45;color:#cfc4ae}",
    ".ss-sec{display:block;margin-top:4px;font-size:14px;color:#9fd0c2}",
    ".ss-item mark{background:rgba(212,180,131,.35);color:inherit;padding:0 1px;border-radius:2px}",
    ".ss-more{display:block;min-height:44px;padding:12px;text-align:center;font-weight:600;color:#d4b483!important;border-top:1px solid #3a3328}",
    "#ss-page{max-width:900px;margin:0 auto;padding:8px 0 40px}",
    "#ss-page .ss-item{background:#1f1b15;border:1px solid #3a3328;border-radius:10px;margin:0 0 10px}",
    "@media (max-width:480px){#site-search{padding:8px 10px}#site-search .ss-btn{min-width:80px;padding:10px 14px}}",
    "@media print{#site-search{display:none!important}}"
  ].join("\n");

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function ensureResponsiveCss() {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if ((links[i].getAttribute("href") || "").indexOf("site-responsive.css") !== -1) return;
    }
    document.head.appendChild(el("link", { rel: "stylesheet", href: RESPONSIVE_CSS }));
  }

  /* ---------- text folding (length-preserving so snippet offsets line up) ---------- */
  function fold(s) {
    var lower = s.toLowerCase();
    if (lower.length !== s.length) {
      var out = "";
      for (var i = 0; i < s.length; i++) { var c = s.charAt(i).toLowerCase(); out += c.length === 1 ? c : s.charAt(i); }
      lower = out;
    }
    return lower.replace(/[^\x00-\x7f]/g, function (c) {
      var f = c.normalize ? c.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : c;
      return f.length === 1 ? f : c;
    });
  }

  function tokenize(q) {
    return fold(q).split(/[\s,;:!?()"'\u201c\u201d\u2018\u2019\[\]{}<>\/\\|+=*]+/)
      .map(function (t) { return t.replace(/^[.\-]+|[.\-]+$/g, ""); })
      .filter(function (t) { return t.length >= 2 || /\d/.test(t); })
      .filter(function (t, i, a) { return a.indexOf(t) === i; })
      .slice(0, 8);
  }

  function count(hay, needle, cap) {
    var n = 0, i = hay.indexOf(needle);
    while (i !== -1 && n < cap) { n++; i = hay.indexOf(needle, i + needle.length); }
    return n;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlight(text, terms) {
    var f = fold(text), marks = [];
    terms.forEach(function (t) {
      var i = f.indexOf(t);
      while (i !== -1) { marks.push([i, i + t.length]); i = f.indexOf(t, i + t.length); }
    });
    marks.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
    var out = "", pos = 0;
    marks.forEach(function (m) {
      if (m[0] < pos) return;
      out += escapeHtml(text.slice(pos, m[0])) + "<mark>" + escapeHtml(text.slice(m[0], m[1])) + "</mark>";
      pos = m[1];
    });
    return out + escapeHtml(text.slice(pos));
  }

  function snippet(doc, terms) {
    var text = doc.text || doc.description || "", f = doc._x, best = -1;
    for (var i = 0; i < terms.length; i++) {
      var p = f.indexOf(terms[i]);
      if (p !== -1 && (best === -1 || p < best)) best = p;
    }
    if (best === -1) {
      if (doc.description) text = doc.description;
      return text.length > 200 ? text.slice(0, text.lastIndexOf(" ", 200) > 0 ? text.lastIndexOf(" ", 200) : 200) + " …" : text;
    }
    var start = Math.max(0, best - 70), end = Math.min(text.length, start + 210);
    if (start > 0) { var sp = text.indexOf(" ", start); if (sp !== -1 && sp < best) start = sp + 1; }
    if (end < text.length) { var ep = text.lastIndexOf(" ", end); if (ep > best) end = ep; }
    return (start > 0 ? "… " : "") + text.slice(start, end) + (end < text.length ? " …" : "");
  }

  /* ---------- index ---------- */
  var docs = null, loading = null, loadError = false;
  function loadIndex() {
    if (docs) return Promise.resolve(docs);
    if (loading) return loading;
    loading = fetch(INDEX_URL, { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        docs = data.map(function (d) {
          d._t = fold(d.title || "");
          d._h = (d.headings || []).map(fold);
          d._d = fold(d.description || "");
          d._x = fold(d.text || "");
          d._u = fold(d.url || "");
          return d;
        });
        return docs;
      })
      .catch(function (e) { loadError = true; loading = null; throw e; });
    return loading;
  }

  function search(q) {
    var terms = tokenize(q);
    if (!terms.length || !docs) return { terms: terms, hits: [] };
    var phrase = fold(q).trim().replace(/\s+/g, " ");
    var scored = docs.map(function (d) {
      var score = 0, matched = 0, sec = null;
      terms.forEach(function (t) {
        var s = count(d._t, t, 5) * 30 + count(d._d, t, 5) * 6 + Math.min(count(d._x, t, 40), 40) + count(d._u, t, 3) * 8;
        d._h.forEach(function (h, i) {
          var c = count(h, t, 3);
          if (c) { s += c * 10; if (sec === null) sec = i; }
        });
        if (s > 0) { matched++; score += s; }
      });
      if (terms.length > 1 && phrase.length > 3) {
        if (d._t.indexOf(phrase) !== -1) score += 60;
        score += Math.min(count(d._x, phrase, 10), 10) * 5;
      }
      return { d: d, score: score, matched: matched, sec: sec };
    }).filter(function (r) { return r.matched > 0; });
    var all = scored.filter(function (r) { return r.matched === terms.length; });
    var hits = all.length ? all : scored;   // AND first, fall back to OR
    hits.sort(function (a, b) { return b.matched - a.matched || b.score - a.score; });
    return { terms: terms, hits: hits, partial: !all.length && hits.length > 0 };
  }

  function resultItem(r, terms) {
    var li = el("li", { "class": "ss-item" });
    var a = el("a", { "class": "ss-link", href: r.d.url });
    var t = el("span", { "class": "ss-title" }); t.innerHTML = highlight(r.d.title, terms);
    var u = el("span", { "class": "ss-url" }, r.d.url);
    var s = el("span", { "class": "ss-snip" }); s.innerHTML = highlight(snippet(r.d, terms), terms);
    a.appendChild(t); a.appendChild(u);
    if (r.sec !== null && r.d.headings[r.sec] && r.d.headings[r.sec] !== r.d.title) {
      var h = el("span", { "class": "ss-sec" }); h.innerHTML = "Section: " + highlight(r.d.headings[r.sec], terms);
      a.appendChild(h);
    }
    a.appendChild(s);
    li.appendChild(a);
    return li;
  }

  function render(container, q, limit) {
    container.innerHTML = "";
    var res = search(q), n = res.hits.length;
    var status = el("p", { "class": "ss-status", role: "status" });
    if (!res.terms.length) status.textContent = "Type a word to search, e.g. sphere, balun or Hively.";
    else if (!n) status.textContent = "No pages match \u201c" + q + "\u201d. Try a shorter or different word.";
    else status.textContent = n + (n === 1 ? " page matches" : " pages match") + " \u201c" + q + "\u201d" + (res.partial ? " (some of the words)" : "") + ".";
    container.appendChild(status);
    if (!n) return res;
    var ul = el("ul", { "class": "ss-list" });
    res.hits.slice(0, limit || n).forEach(function (r) { ul.appendChild(resultItem(r, res.terms)); });
    container.appendChild(ul);
    if (limit && n > limit) {
      container.appendChild(el("a", { "class": "ss-more", href: RESULTS_URL + "?q=" + encodeURIComponent(q) }, "Show all " + n + " results \u2192"));
    }
    return res;
  }


  /* ---------- responsive helper: over-wide tables scroll inside their own box ---------- */
  function inScroller(node) {
    for (var p = node.parentElement; p && p !== document.body; p = p.parentElement) {
      var ox = getComputedStyle(p).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
    }
    return false;
  }
  function wrapWideTables() {
    var vw = document.documentElement.clientWidth;
    var tables = document.querySelectorAll("table");
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i], parent = t.parentElement;
      if (!parent || t.closest("#site-search, svg")) continue;
      var ox = getComputedStyle(t).overflowX;
      if (ox === "auto" || ox === "scroll" || inScroller(t)) continue;
      var r = t.getBoundingClientRect();
      if (!r.width) continue;
      if (r.width > parent.clientWidth + 1 || r.right > vw + 1) {
        var w = el("div", { "class": "ss-scroll-x", tabindex: "0", role: "region", "aria-label": "Table (scroll sideways)" });
        parent.insertBefore(w, t);
        w.appendChild(t);
      }
    }
  }
  function responsiveInit() {
    try { wrapWideTables(); } catch (e) { /* never break the page */ }
    var rt = null;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { try { wrapWideTables(); } catch (e) {} }, 200); });
    window.addEventListener("load", function () { try { wrapWideTables(); } catch (e) {} });
    setTimeout(function () { try { wrapWideTables(); } catch (e) {} }, 1500);
  }

  /* ---------- UI ---------- */
  function buildBar() {
    var wrap = el("div", { id: "site-search" });
    var inner = el("div", { "class": "ss-inner" });
    var form = el("form", { "class": "ss-form", role: "search", action: RESULTS_URL, method: "get", "aria-label": "Search this site" });
    var label = el("label", { "class": "ss-label", "for": "ss-q" }, "Search this site");
    var input = el("input", {
      id: "ss-q", "class": "ss-input", type: "search", name: "q", placeholder: "Search this site\u2026",
      autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false",
      enterkeyhint: "search", "aria-controls": "ss-results", "aria-expanded": "false"
    });
    var btn = el("button", { "class": "ss-btn", type: "submit" }, "Search");
    var results = el("div", { id: "ss-results", "class": "ss-results", hidden: "" });
    form.appendChild(label); form.appendChild(input); form.appendChild(btn);
    inner.appendChild(form); inner.appendChild(results); wrap.appendChild(inner);
    return { wrap: wrap, form: form, input: input, btn: btn, results: results };
  }

  function init() {
    var style = el("style", { id: "site-search-style" }); style.textContent = CSS;
    document.head.appendChild(style);
    ensureResponsiveCss();
    responsiveInit();

    var ui = buildBar();
    var header = document.querySelector("header.site-header, header.site");
    if (header && header.parentNode) header.insertAdjacentElement("afterend", ui.wrap);
    else {
      var skip = document.querySelector("body > a.skip");
      if (skip) skip.insertAdjacentElement("afterend", ui.wrap);
      else document.body.insertAdjacentElement("afterbegin", ui.wrap);
    }

    var params = new URLSearchParams(location.search);
    var pageBox = isResultsPage ? document.getElementById("ss-page") : null;

    function open() { ui.results.hidden = false; ui.input.setAttribute("aria-expanded", "true"); }
    function close() { ui.results.hidden = true; ui.input.setAttribute("aria-expanded", "false"); }

    function run(showEmpty) {
      var q = ui.input.value.trim();
      if (!q && !showEmpty) { close(); return; }
      ui.results.innerHTML = "";
      ui.results.appendChild(el("p", { "class": "ss-status", role: "status" }, "Searching\u2026"));
      open();
      loadIndex().then(function () {
        if (ui.input.value.trim() !== q) return;          // stale
        render(ui.results, q, MAX_DROPDOWN);
        open();
      }, function () {
        ui.results.innerHTML = "";
        ui.results.appendChild(el("p", { "class": "ss-status", role: "status" }, "Sorry, the search index could not be loaded. Check your connection and try again."));
        open();
      });
    }

    var timer = null;
    ui.input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { run(false); }, 160);
    });
    ["focus", "touchstart", "mouseenter"].forEach(function (ev) {
      ui.input.addEventListener(ev, function () { loadIndex().catch(function () {}); }, { passive: true });
    });
    ui.form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearTimeout(timer);
      var q = ui.input.value.trim();
      if (pageBox) {
        history.replaceState(null, "", RESULTS_URL + (q ? "?q=" + encodeURIComponent(q) : ""));
        runPage(q);
        return;
      }
      run(true);
    });
    ui.input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); }
      else if (e.key === "ArrowDown" && !ui.results.hidden) {
        var first = ui.results.querySelector("a"); if (first) { e.preventDefault(); first.focus(); }
      }
    });
    ui.results.addEventListener("keydown", function (e) {
      var links = Array.prototype.slice.call(ui.results.querySelectorAll("a"));
      var i = links.indexOf(document.activeElement);
      if (e.key === "ArrowDown" && i < links.length - 1) { e.preventDefault(); links[i + 1].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (i > 0) links[i - 1].focus(); else ui.input.focus(); }
      else if (e.key === "Escape") { close(); ui.input.focus(); }
    });
    document.addEventListener("click", function (e) { if (!ui.wrap.contains(e.target)) close(); });
    document.addEventListener("touchstart", function (e) { if (!ui.wrap.contains(e.target)) close(); }, { passive: true });

    function runPage(q) {
      pageBox.innerHTML = "";
      pageBox.appendChild(el("p", { "class": "ss-status", role: "status" }, q ? "Searching\u2026" : "Type a word in the search bar above, e.g. sphere, balun or Hively."));
      if (!q) return;
      loadIndex().then(function () { render(pageBox, q, 0); }, function () {
        pageBox.innerHTML = "";
        pageBox.appendChild(el("p", { "class": "ss-status", role: "status" }, "Sorry, the search index could not be loaded."));
      });
    }
    if (pageBox) {
      var q0 = params.get("q") || "";
      ui.input.value = q0;
      runPage(q0.trim());
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
