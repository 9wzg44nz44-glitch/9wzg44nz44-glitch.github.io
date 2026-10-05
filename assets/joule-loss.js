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

  function rts(a, l) { var i0 = a.indexOf(0), i3 = a.indexOf(360); return (i0 >= 0 && i3 >= 0) ? l[i3] - l[i0] : NaN; }
  function amax(a) { return Math.max(180, Math.max.apply(null, a)); }
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
    show(out, "<table><tbody><tr><th scope=\"row\">&kappa;</th><td>" + f(fit.kappa, 3) + " &plusmn; " + f(fit.sKappa, 3) + "</td></tr><tr><th scope=\"row\">Loss at aligned angle</th><td>" + f(fit.maxLoss_dB, 1) + " dB (T = " + f(fit.T_aligned, 4) + ")</td></tr><tr><th scope=\"row\">Aligned angle &phi;<sub>0</sub></th><td>" + f(fit.phi0_deg, 1) + "&deg;</td></tr><tr><th scope=\"row\">Reference level L<sub>0</sub> (rods crossed)</th><td>" + f(fit.L0_dB, 2) + " dB</td></tr><tr><th scope=\"row\">RMS residual, R&sup2;, points</th><td>" + f(fit.rms_dB, 2) + " dB, " + f(fit.r2, 3) + ", " + fit.n + "</td></tr>" + (isFinite(rts(a, l)) ? "<tr><th scope=\"row\">Return to start (360&deg; minus 0&deg;)</th><td>" + f(rts(a, l), 2) + " dB</td></tr>" : "") + "</tbody></table><p class=\"footnote\">Band " + f(f0 / 1e6, 2) + " MHz (&lambda;/2 = " + f(lam * 500, 2) + " mm). M&amp;W published &kappa; = 4.4 for brass at 433.59 MHz. If the residual is large compared with the points' scatter, the form is not a good description.</p>");
    draw(); return fit;
  }
  function draw() {
    var c = $("plot-fit"); if (!P) return;
    var series = [];
    if (lastData) {
      series.push({ x: lastData.a, y: lastData.l, type: "points", color: "#7fd0ff", label: "data" });
      if (lastFit) {
        var xs = [], ys = [];
        for (var p = 0, pm = amax(lastData.a); p <= pm; p += 2) { xs.push(p); ys.push(lastFit.L0_dB - J.LOG10E10 * lastFit.kappa * Math.pow(Math.cos((p - lastFit.phi0_deg) * Math.PI / 180), 2)); }
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


  /* ---- F: three-station fixture scan (proposal) ---- */
  var ST = [{ key: "nearTX", id: "st-in-tx", label: "NEAR TX", color: "#7fd0ff" }, { key: "mid", id: "st-in-mid", label: "MIDWAY", color: "#ffb454" }, { key: "nearRX", id: "st-in-rx", label: "NEAR RX", color: "#9be28a" }];
  var stStored = { brass: null, w1: null }, stLast = null;
  function stAnalyse() {
    var out = $("out-st"), thr = num("st-thr"), res = {}, bad = false;
    ST.forEach(function (s) {
      var rows = R.parseTable($(s.id).value).filter(function (r) { return r.length >= 2; });
      if (rows.length < 5) { res[s.key] = { error: "Paste at least 5 rows of angle_deg, level_dB[, loading_dB]." }; bad = true; }
      else { res[s.key] = J.analyseStation(rows, thr); if (res[s.key].error) bad = true; res[s.key].rows = rows; }
    });
    var h = "<table><thead><tr><th scope=\"col\">Station</th><th scope=\"col\">&kappa; &plusmn; s</th><th scope=\"col\">Max loss (dB)</th><th scope=\"col\">&phi;<sub>0</sub> (deg)</th><th scope=\"col\">L<sub>0</sub> (dB)</th><th scope=\"col\">RMS (dB)</th><th scope=\"col\">Loading p-p (dB)</th><th scope=\"col\">Loading R&sup2; vs cos&sup2;</th><th scope=\"col\">Loading flag</th><th scope=\"col\">360&deg; minus 0&deg; (dB)</th></tr></thead><tbody>";
    ST.forEach(function (s) {
      var r = res[s.key];
      if (r.error) { h += "<tr><th scope=\"row\">" + s.label + "</th><td colspan=\"9\" class=\"bad\">" + r.error + "</td></tr>"; return; }
      var fit = r.fit, ld = r.load;
      h += "<tr><th scope=\"row\">" + s.label + "</th><td>" + f(fit.kappa, 3) + " &plusmn; " + f(fit.sKappa, 3) + "</td><td>" + f(fit.maxLoss_dB, 1) + "</td><td>" + f(fit.phi0_deg, 1) + "</td><td>" + f(fit.L0_dB, 2) + "</td><td>" + f(fit.rms_dB, 2) + "</td>" +
        (ld ? "<td>" + f(ld.p2p, 3) + "</td><td>" + f(ld.r2, 2) + "</td><td class=\"" + (ld.flag ? "bad" : "good") + "\">" + (ld.flag ? "FLAG: moves with angle" : "stable") + "</td>" : "<td>n/a</td><td>n/a</td><td>no column</td>") + "<td>" + (function () { var d = rts(r.rows.map(function (q) { return q[0]; }), r.rows.map(function (q) { return q[1]; })); return isFinite(d) ? f(d, 2) : "n/a"; })() + "</td></tr>";
    });
    h += "</tbody></table>";
    var cmp = bad ? null : J.compareStations(res);
    if (cmp && !cmp.error) {
      function rl(name, x) { return "<tr><th scope=\"row\">" + name + "</th><td>" + f(x.ratio, 3) + " &plusmn; " + f(x.sRatio, 3) + "</td><td>" + f(x.z, 1) + "</td><td>" + (x.differs ? "differs" : x.small ? "statistically different but under 20 %, treated as the same" : "same within thresholds") + "</td></tr>"; }
      h += "<table><thead><tr><th scope=\"col\">&kappa; ratio</th><th scope=\"col\">Value</th><th scope=\"col\">z from 1</th><th scope=\"col\">Reading</th></tr></thead><tbody>" + rl("NEAR TX / MIDWAY", cmp.txMid) + rl("NEAR RX / MIDWAY", cmp.rxMid) + rl("NEAR TX / NEAR RX", cmp.txRx) + "</tbody></table>";
      h += "<p><strong>" + cmp.verdict + "</strong></p>";
      if (cmp.notes.length) h += "<ul>" + cmp.notes.map(function (n) { return "<li class=\"bad\">" + n + "</li>"; }).join("") + "</ul>";
      h += "<p class=\"footnote\">Proposal thresholds: differs means z of at least 2 and at least a 20 % change. Standard errors are the fit's only; fixture repeatability is usually larger. This reads a pattern in the data, not a physical cause: absorption and scattering are not separated (section 6), and reflection nulls can mimic a station effect.</p>";
    } else if (cmp && cmp.error) h += "<p class=\"bad\">" + cmp.error + "</p>";
    show(out, h, bad);
    stLast = bad ? null : res; drawSt(); return stLast;
  }
  function drawSt() {
    var c = $("plot-st"); if (!P) return;
    var series = [];
    if (stLast) ST.forEach(function (s) {
      var r = stLast[s.key]; if (!r || r.error) return;
      series.push({ x: r.rows.map(function (q) { return q[0]; }), y: r.rows.map(function (q) { return q[1]; }), type: "points", color: s.color, label: s.label });
      var xs = [], ys = [];
      for (var p = 0, pm = amax(r.rows.map(function (q) { return q[0]; })); p <= pm; p += 2) { xs.push(p); ys.push(r.fit.L0_dB - J.LOG10E10 * r.fit.kappa * Math.pow(Math.cos((p - r.fit.phi0_deg) * Math.PI / 180), 2)); }
      series.push({ x: xs, y: ys, type: "line", color: s.color, label: s.label + " fit" });
    });
    P.draw(c, { series: series, xlabel: "rod angle (deg)", ylabel: "level (dB)" });
  }
  function stCompare() {
    var out = $("out-stcmp");
    if (!stStored.brass || !stStored.w1) { show(out, "Stored: brass " + (stStored.brass ? "yes" : "no") + ", W1 " + (stStored.w1 ? "yes" : "no") + ". Store both to compare station by station."); return; }
    var sw = parseFloat($("fit-w1").value), sb = J.MATERIALS.brass.sigma, h = "<table><thead><tr><th scope=\"col\">Station</th><th scope=\"col\">&kappa;(brass)</th><th scope=\"col\">&kappa;(W1)</th><th scope=\"col\">W1 / brass</th><th scope=\"col\">Literal Joule (&sigma; ratio)</th><th scope=\"col\">Reading</th></tr></thead><tbody>", ratios = [];
    ST.forEach(function (s) {
      var a = stStored.brass[s.key].fit, b = stStored.w1[s.key].fit, c = J.compareMaterials(a, b, sb, sw); ratios.push(c);
      h += "<tr><th scope=\"row\">" + s.label + "</th><td>" + f(a.kappa, 3) + " &plusmn; " + f(a.sKappa, 3) + "</td><td>" + f(b.kappa, 3) + " &plusmn; " + f(b.sKappa, 3) + "</td><td>" + f(c.ratio, 3) + " &plusmn; " + f(c.sRatio, 3) + "</td><td>" + f(c.predLiteral, 3) + "</td><td>" + c.verdict + "</td></tr>";
    });
    h += "</tbody></table>";
    var lo = Math.min.apply(null, ratios.map(function (c) { return c.ratio; })), hi = Math.max.apply(null, ratios.map(function (c) { return c.ratio; })), sMax = Math.max.apply(null, ratios.map(function (c) { return c.sRatio; }));
    h += "<p class=\"footnote\">W1 / brass ratio spans " + f(lo, 3) + " to " + f(hi, 3) + " across the three stations" + ((hi - lo) < Math.max(2 * (isFinite(sMax) ? sMax : 0), 0.05) ? ": the same within about 5 % (or 2 standard errors) at every station." : ": it changes with station by more than about 5 % and 2 standard errors, so check fixture repeatability before reading anything into it.") + "</p>";
    show(out, h);
  }
  function storeSt(kind) { var r = stAnalyse(); if (r) { stStored[kind] = r; stCompare(); } }
  $("run-st").addEventListener("click", stAnalyse);
  $("store-st-brass").addEventListener("click", function () { storeSt("brass"); });
  $("store-st-w1").addEventListener("click", function () { storeSt("w1"); });
  $("clear-st").addEventListener("click", function () { stStored.brass = stStored.w1 = null; stCompare(); });
  $("fit-w1").addEventListener("change", stCompare);
  function stExample(art) {
    var kap = [6.0, 4.4, 4.6], head = "# SYNTHETIC example, not a measurement. Full 0 to 360 deg scan. angle_deg, level_dB, tx_s11_dB\n";
    ST.forEach(function (s, i) {
      var txt = head;
      for (var p = 0; p <= 360; p += 10) {
        var c2 = Math.pow(Math.cos((p - 20) * Math.PI / 180), 2);
        var lvl = -40 - J.LOG10E10 * kap[i] * c2 + 0.3 * rnd();
        var s11 = -12 + (art && i === 0 ? 1.1 * c2 : 0) + 0.06 * rnd();
        txt += p + ", " + lvl.toFixed(2) + ", " + s11.toFixed(3) + "\n";
      }
      $(s.id).value = txt;
    });
    stAnalyse();
  }
  $("ex-st").addEventListener("click", function () { stExample(false); });
  $("ex-st-art").addEventListener("click", function () { stExample(true); });

  /* ---- G: station planner (proposal) ---- */
  var PLAN = { "433.59": { L: 346.0 }, "1296": { L: 115.66 }, "2450": { L: 61.18 } };
  function planDefaults() {
    var b = $("pl-band").value, fm = parseFloat(b) * 1e6;
    $("pl-L").value = PLAN[b].L; $("pl-r").value = (4 * 299792.458 / parseFloat(b) / 1000).toFixed(3);
  }
  function runPlan() {
    var fm = parseFloat($("pl-band").value) * 1e6, r = num("pl-r"), L = num("pl-L"), k = num("pl-k"), o = num("pl-o");
    if (!(r > 0)) return show($("out-plan"), "Enter r in metres.", true);
    var p = J.stationPlan(fm, r, L, k, o);
    var h = "<table><tbody><tr><th scope=\"row\">&lambda;/(2&pi;) standoff</th><td>" + f(p.standoff_mm, 1) + " mm</td></tr><tr><th scope=\"row\">Envelope radius R = &radic;2 &lambda;/4</th><td>" + f(p.envelopeR_mm, 1) + " mm</td></tr><tr><th scope=\"row\">Smallest pivot (standoff + R)</th><td>" + f(p.minPivot_mm, 1) + " mm</td></tr><tr><th scope=\"row\">NEAR pivot used</th><td>" + f(p.pivot_mm, 1) + " mm (closest rod approach " + f(p.closest_mm, 1) + " mm)</td></tr>" +
      "<tr><th scope=\"row\">NEAR TX / MIDWAY / NEAR RX pivot from the TX sphere centre</th><td>" + f(p.stations_mm.nearTX, 1) + " / " + f(p.stations_mm.mid, 1) + " / " + f(p.stations_mm.nearRX, 1) + " mm</td></tr></tbody></table>" + warns(p.warnings) + "<p class=\"footnote\">Pivot means the turntable axis, assumed through the array centre. A proposal for placing the fixture, not a measured requirement.</p>";
    show($("out-plan"), h, p.warnings.length > 0);
  }
  $("run-plan").addEventListener("click", runPlan);
  $("pl-band").addEventListener("change", function () { planDefaults(); runPlan(); });
  if (qp && PLAN[qp[1]]) { $("pl-band").value = qp[1]; $("st-band").value = qp[1]; }
  planDefaults(); runPlan();

  window.addEventListener("resize", function () { draw(); drawSt(); }); compare(); stCompare(); draw(); drawSt(); runSkin();
})();
