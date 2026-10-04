/* SLW Hub Round 1: Joule-loss page calculators. Needs r1-joulelib.js, r1-rangelib.js (parseTable) and r1-plot.js. */
(function () {
  "use strict";
  var J = window.R1Joule, R = window.R1Range, P = window.R1Plot;
  function $(id) { return document.getElementById(id); }
  function num(id) { return parseFloat($(id).value); }
  function f(x, d) { return isFinite(x) ? Number(x).toFixed(d == null ? 3 : d) : "n/a"; }
  function pct(x) { return isFinite(x) ? (100 * x).toFixed(2) + " %" : "n/a"; }
  function show(el, html, bad) { el.innerHTML = html; el.classList.toggle("bad", !!bad); }
  function warns(ws) { return ws && ws.length ? "<ul>" + ws.map(function (w) { return "<li class=\"bad\">" + w + "</li>"; }).join("") + "</ul>" : ""; }

  /* ---- A ---- */
  $("run-frac").addEventListener("click", function () {
    var a = num("s11"), b = num("s21");
    if (!isFinite(a) || !isFinite(b)) return show($("out-frac"), "Enter both S11 and S21 in dB.", true);
    var r = J.dissipatedFraction(a, b);
    show($("out-frac"), "<table><tbody><tr><th scope=\"row\">Reflected |S11|&sup2;</th><td>" + pct(r.reflected) + "</td></tr><tr><th scope=\"row\">Transmitted |S21|&sup2;</th><td>" + pct(r.transmitted) + "</td></tr><tr><th scope=\"row\">Not returned to either port</th><td>" + pct(r.unaccounted) + (isFinite(r.unaccounted_dB) ? " (" + f(r.unaccounted_dB, 2) + " dB)" : "") + "</td></tr></tbody></table>" + warns(r.warnings) + "<p class=\"footnote\">Closed two-port only. In open air this includes radiation to everywhere else.</p>", r.warnings.length > 0);
  });

  /* ---- B ---- */
  $("run-inout").addEventListener("click", function () {
    var v = ["io-s21out", "io-s21in", "io-s11out", "io-s11in"].map(num);
    if (v.some(function (x) { return !isFinite(x); })) return show($("out-inout"), "Fill in all four values (dB).", true);
    var r = J.rodsInOut(v[0], v[1], v[2], v[3]), w = [];
    if (r.insertionLoss_dB < 0) w.push("Rods-in level is higher than rods-out: check the labels.");
    show($("out-inout"), "<table><tbody><tr><th scope=\"row\">Insertion loss of the rods</th><td>" + f(r.insertionLoss_dB, 2) + " dB</td></tr><tr><th scope=\"row\">Fraction of received power removed</th><td>" + pct(r.removedFractionOfReceived) + "</td></tr><tr><th scope=\"row\">Change in input reflection (fraction of incident)</th><td>" + (100 * r.deltaReflFractionOfIncident).toFixed(3) + " %</td></tr><tr><th scope=\"row\">Removed from RX path but not seen as extra input reflection</th><td>" + (100 * r.notReturnedToPorts).toExponential(2) + " of incident</td></tr></tbody></table>" + warns(w) + "<p class=\"footnote\">The last line is absorbed plus scattered away. S-parameters cannot split the two (section 6).</p>", w.length > 0);
  });

  /* ---- C ---- */
  var stored = { brass: null, w1: null }, lastFit = null, lastData = null;
  var seed = 4242; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; }
  function bandF() { return parseFloat($("fit-band").value) * 1e6; }
  function runFit() {
    var rows = R.parseTable($("in-fit").value).filter(function (r) { return r.length >= 2; });
    var out = $("out-fit");
    if (rows.length < 5) { lastFit = null; show(out, "Paste at least 5 rows of <code>angle_deg, level_dB</code>.", true); draw(); return null; }
    var a = rows.map(function (r) { return r[0]; }), l = rows.map(function (r) { return r[1]; });
    var fit = J.fitPolarizer(a, l);
    if (fit.error) { lastFit = null; show(out, fit.error, true); draw(); return null; }
    lastFit = fit; lastData = { a: a, l: l };
    var f0 = bandF(), lam = 299792458 / f0;
    var scale = "";
    show(out, "<table><tbody><tr><th scope=\"row\">&kappa;</th><td>" + f(fit.kappa, 3) + " &plusmn; " + f(fit.sKappa, 3) + "</td></tr><tr><th scope=\"row\">Loss at aligned angle</th><td>" + f(fit.maxLoss_dB, 1) + " dB (T = " + f(fit.T_aligned, 4) + ")</td></tr><tr><th scope=\"row\">Aligned angle &phi;<sub>0</sub></th><td>" + f(fit.phi0_deg, 1) + "&deg;</td></tr><tr><th scope=\"row\">Reference level L<sub>0</sub> (rods crossed)</th><td>" + f(fit.L0_dB, 2) + " dB</td></tr><tr><th scope=\"row\">RMS residual, R&sup2;, points</th><td>" + f(fit.rms_dB, 2) + " dB, " + f(fit.r2, 3) + ", " + fit.n + "</td></tr></tbody></table><p class=\"footnote\">Band " + f(f0 / 1e6, 2) + " MHz (&lambda;/2 = " + f(lam * 500, 2) + " mm). M&amp;W published &kappa; = 4.4 for brass at 433.59 MHz. If the residual is large compared with the points' scatter, the form is not a good description.</p>");
    draw(); return fit;
  }
  function draw() {
    var c = $("plot-fit"); if (!P) return;
    var series = [];
    if (lastData) {
      series.push({ x: lastData.a, y: lastData.l, type: "points", color: "#7fd0ff", label: "data" });
      if (lastFit) {
        var xs = [], ys = [];
        for (var p = 0; p <= 180; p += 2) { xs.push(p); ys.push(lastFit.L0_dB - J.LOG10E10 * lastFit.kappa * Math.pow(Math.cos((p - lastFit.phi0_deg) * Math.PI / 180), 2)); }
        series.push({ x: xs, y: ys, type: "line", color: "#ffb454", label: "fit" });
      }
    }
    P.draw(c, { series: series, xlabel: "rod angle (deg)", ylabel: "level (dB)" });
  }
  function compare() {
    var out = $("out-cmp");
    if (!stored.brass || !stored.w1) { show(out, "Stored: brass " + (stored.brass ? "yes" : "no") + ", W1 " + (stored.w1 ? "yes" : "no") + ". Store both to compare."); return; }
    var sw = parseFloat($("fit-w1").value), sb = J.MATERIALS.brass.sigma;
    var c = J.compareMaterials(stored.brass, stored.w1, sb, sw);
    show(out, "<table><tbody><tr><th scope=\"row\">&kappa;(brass)</th><td>" + f(stored.brass.kappa, 3) + " &plusmn; " + f(stored.brass.sKappa, 3) + "</td></tr><tr><th scope=\"row\">&kappa;(W1)</th><td>" + f(stored.w1.kappa, 3) + " &plusmn; " + f(stored.w1.sKappa, 3) + "</td></tr><tr><th scope=\"row\">Ratio &kappa;(W1)/&kappa;(brass)</th><td>" + f(c.ratio, 3) + " &plusmn; " + f(c.sRatio, 3) + "</td></tr><tr><th scope=\"row\">Literal Joule prediction (&sigma; ratio)</th><td>" + f(c.predLiteral, 3) + " (z = " + f(c.zLiteral, 1) + ")</td></tr><tr><th scope=\"row\">Material-independent prediction</th><td>1.000 (z = " + f(c.zIndependent, 1) + ")</td></tr></tbody></table><p><strong>" + c.verdict + "</strong></p><p class=\"footnote\">Uncertainty is the fit's statistical error only. Fixture repeatability (re-seat the rods, re-run) is usually larger; run each scan at least twice.</p>");
  }
  $("run-fit").addEventListener("click", runFit);
  $("store-brass").addEventListener("click", function () { var r = runFit(); if (r) { stored.brass = r; compare(); } });
  $("store-w1").addEventListener("click", function () { var r = runFit(); if (r) { stored.w1 = r; compare(); } });
  $("fit-w1").addEventListener("change", compare);
  $("clear-fit").addEventListener("click", function () { stored.brass = stored.w1 = null; compare(); });
  $("ex-fit").addEventListener("click", function () {
    var s = "# SYNTHETIC example (kappa 4.4, phi0 20 deg). Not a measurement.\n# angle_deg, level_dB\n";
    for (var p = 0; p <= 180; p += 10) s += p + ", " + (-40 - J.LOG10E10 * 4.4 * Math.pow(Math.cos((p - 20) * Math.PI / 180), 2) + 0.4 * rnd()).toFixed(2) + "\n";
    $("in-fit").value = s; runFit();
  });

  /* ---- D ---- */
  var qp = /[?&]f=([0-9.]+)/.exec(location.search);
  var RODL = { "433.59": 346.0, "1296": 115.66, "2450": 61.18 };
  if (qp) { $("sk-f").value = qp[1]; if (RODL[qp[1]]) $("sk-L").value = RODL[qp[1]]; $("fit-band").value = (["433.59", "1296", "2450"].indexOf(qp[1]) >= 0 ? qp[1] : "433.59"); }
  function runSkin() {
    var fm = num("sk-f"), s = num("sk-sigma"), mu = num("sk-mur") || 1, L = num("sk-L") / 1000, d = num("sk-d") / 1000;
    if (!(fm > 0 && s > 0 && L > 0 && d > 0)) return show($("out-skin"), "All inputs must be positive.", true);
    var fh = fm * 1e6, del = J.skinDepth_m(fh, s, mu), rs = J.surfaceResistance(fh, s, mu), rr = J.rodResistance(L, d, fh, s, mu), fr = J.rodAbsorbedFractionTEM(L, d, fh, s, mu);
    var w = del > d / 4 ? ["Skin depth is not small compared with the rod radius: the formula is not valid here."] : [];
    show($("out-skin"), "<table><tbody><tr><th scope=\"row\">Skin depth &delta;</th><td>" + f(del * 1e6, 2) + " &micro;m (" + f(del / (d / 2) * 100, 2) + " % of rod radius)</td></tr><tr><th scope=\"row\">Surface resistance R<sub>s</sub></th><td>" + f(rs * 1000, 2) + " m&Omega;/sq</td></tr><tr><th scope=\"row\">End-to-end rod AC resistance</th><td>" + f(rr, 3) + " &Omega;</td></tr><tr><th scope=\"row\">Heat fraction of intercepted power, resonant half-wave rod (R<sub>eff</sub>/73.1 &Omega;)</th><td>" + pct(fr) + "</td></tr></tbody></table>" + warns(w) + "<p class=\"footnote\">Transverse-EM reasoning, not applicable under the SLW hypothesis: a control number. Valid only for a single resonant half-wave rod; the 3 x 3 array couples. For W1 &mu;<sub>r</sub> is unmeasured; try 1 and 100 to see the range.</p>", w.length > 0);
  }
  $("run-skin").addEventListener("click", runSkin);

  /* ---- E ---- */
  $("run-oven").addEventListener("click", function () {
    var m = num("ov-m"), dt = num("ov-dt"), t = num("ov-t"), dbm = num("ov-dbm"), att = num("ov-att") || 0;
    var h = "", bad = false;
    if (m > 0 && t > 0 && isFinite(dt)) h += "<p>Water calorimetry: P = " + f(J.calorimetryPower(m, dt, t), 0) + " W absorbed in the load (c = 4186 J/(kg&middot;K), ignoring container and losses).</p>"; else { h += "<p class=\"bad\">Enter mass, rise and time for calorimetry.</p>"; bad = true; }
    if (isFinite(dbm)) { var at = dbm + att; h += "<p>Analyzer " + f(dbm, 1) + " dBm = " + J.dbmToMW(dbm).toExponential(2) + " mW. Referred to the sphere output (adding " + f(att, 1) + " dB): " + f(at, 1) + " dBm = " + J.dbmToMW(at).toExponential(2) + " mW. Relative only: the sphere is not a calibrated antenna.</p>"; }
    show($("out-oven"), h, bad);
  });

  window.addEventListener("resize", draw); compare(); draw(); runSkin();
})();
