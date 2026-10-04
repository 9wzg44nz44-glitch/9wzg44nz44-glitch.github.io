/* SLW Hub Round 1: range-finder page UI. Needs r1-rangelib.js and r1-plot.js. */
(function () {
  "use strict";
  var R = window.R1Range, P = window.R1Plot, C = R.C;
  function $(id) { return document.getElementById(id); }
  function num(id) { return parseFloat($(id).value); }
  function f4(x, d) { return isFinite(x) ? Number(x).toFixed(d == null ? 4 : d) : "n/a"; }
  function msg(el, html, bad) { el.innerHTML = html; el.classList.toggle("bad", !!bad); }
  function warnList(ws) { return ws && ws.length ? "<ul>" + ws.map(function (w) { return "<li class=\"bad\">" + w + "</li>"; }).join("") + "</ul>" : ""; }
  function fHz() { return num("carrier") * 1e6; }

  /* ---------- tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-rtab]"));
  function selectTab(name) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-rtab") === name;
      t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      $("panel-" + t.getAttribute("data-rtab")).hidden = !on;
    });
    redrawAll();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t.getAttribute("data-rtab")); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault(); var n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        tabs[n].focus(); selectTab(tabs[n].getAttribute("data-rtab"));
      }
    });
  });

  /* ---------- carrier preset ---------- */
  var qp = /[?&]f=([0-9.]+)/.exec(location.search);
  if (qp) $("carrier").value = qp[1];
  Array.prototype.forEach.call(document.querySelectorAll("[data-carrier]"), function (b) {
    b.addEventListener("click", function () { $("carrier").value = b.getAttribute("data-carrier"); updateBand(); });
  });
  function updateBand() {
    var f = fHz(), lam = C / f;
    $("band-info").textContent = "lambda = " + f4(lam * 1000, 2) + " mm, lambda/2 = " + f4(lam * 500, 2) + " mm, lambda/(2 pi) = " + f4(lam * 1000 / (2 * Math.PI), 1) + " mm";
  }
  $("carrier").addEventListener("input", updateBand); updateBand();

  /* ---------- synthetic data helpers ---------- */
  var seed = 12345;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; }
  function wrap(p) { return ((p + 180) % 360 + 360) % 360 - 180; }

  /* ---------- 1 phase slope ---------- */
  var pCanvas = $("plot-phase"), lastPhase = null;
  function runPhase() {
    var rows = R.parseTable($("in-phase").value).filter(function (r) { return r.length >= 2; });
    var unit = parseFloat($("phase-unit").value);
    var out = $("out-phase");
    if (rows.length < 2) { msg(out, "Paste at least two rows of <code>frequency, phase_deg</code>.", true); lastPhase = null; draw(); return; }
    rows.sort(function (a, b) { return a[0] - b[0]; });
    var f = rows.map(function (r) { return r[0] * unit; }), ph = rows.map(function (r) { return r[1]; });
    var res = R.phaseSlopeRange(f, ph, { sign: $("phase-sign").value, offset_m: num("phase-offset") || 0 });
    if (res.error) { msg(out, res.error, true); return; }
    var tape = num("phase-tape"), cmp = "";
    if (isFinite(tape)) cmp = "<tr><th scope=\"row\">Tape measure</th><td>" + f4(tape, 4) + " m</td></tr><tr><th scope=\"row\">Estimate minus tape</th><td>" + f4(res.range_m - tape, 4) + " m (" + f4((res.range_m - tape) / res.rangeStatErr_m, 1) + " statistical sigma)</td></tr>";
    msg(out, "<table><tbody><tr><th scope=\"row\">Estimated range r</th><td><strong>" + f4(res.range_m, 4) + " m</strong> &plusmn; " + f4(res.rangeStatErr_m, 4) + " m (statistical only)</td></tr>" + cmp +
      "<tr><th scope=\"row\">Fit quality</th><td>RMS residual " + f4(res.rms_deg, 2) + " deg, R<sup>2</sup> " + f4(res.r2, 5) + ", " + res.n + " points</td></tr>" +
      "<tr><th scope=\"row\">Sweep</th><td>span " + f4(res.span_Hz / 1e6, 2) + " MHz, step " + f4(res.step_Hz / 1e6, 3) + " MHz; unambiguous to " + f4(res.unambiguousRange_m, 1) + " m; two paths closer than c/B = " + f4(res.resolutionRule_m, 2) + " m bias the slope</td></tr></tbody></table>" +
      warnList(res.warnings) + "<p class=\"footnote\">Systematic errors (cable delay not removed by calibration, phase centre of a sphere or dipole, multipath, near-field phase) are not in the &plusmn;. Calibrate against the tape.</p>");
    lastPhase = { f: f, u: res.unwrapped, fit: res.fit }; draw();
    $("log-method").value = "phase slope"; $("log-est").value = f4(res.range_m, 4); if (isFinite(tape)) $("log-tape").value = tape;
  }
  $("run-phase").addEventListener("click", runPhase);
  $("ex-phase").addEventListener("click", function () {
    var r0 = 1.5, f0 = fHz(), lines = ["# SYNTHETIC EXAMPLE, not measured: true r = 1.500 m, 51 points, 3 deg noise"];
    var span = Math.min(0.1 * f0, 100e6);
    for (var i = 0; i < 51; i++) { var fi = f0 - span / 2 + i * span / 50; lines.push((fi / 1e6).toFixed(3) + ", " + wrap(-360 * fi * r0 / C + 25 + 3 * rnd()).toFixed(2)); }
    $("in-phase").value = lines.join("\n"); $("phase-unit").value = "1e6"; $("phase-tape").value = "1.500"; runPhase();
  });

  /* ---------- 2 time domain ---------- */
  var tCanvas = $("plot-time"), lastTime = null;
  function runTime() {
    var rows = R.parseTable($("in-time").value).filter(function (r) { return r.length >= 3; });
    var out = $("out-time"), unit = parseFloat($("time-unit").value);
    if (rows.length < 8) { msg(out, "Paste at least 8 rows of <code>frequency, S21_dB, S21_phase_deg</code>.", true); lastTime = null; draw(); return; }
    rows.sort(function (a, b) { return a[0] - b[0]; });
    var f = rows.map(function (r) { return r[0] * unit; });
    var res = R.impulseResponse(f, rows.map(function (r) { return r[1]; }), rows.map(function (r) { return r[2]; }), { maxRange_m: num("time-max") || 30 });
    var tape = num("time-tape"), t = "<table><thead><tr><th scope=\"col\">Peak</th><th scope=\"col\">Range</th><th scope=\"col\">Relative level</th><th scope=\"col\">Extra path vs first peak</th></tr></thead><tbody>";
    var firstByRange = res.peaks.slice().sort(function (a, b) { return a.range_m - b.range_m; })[0];
    res.peaks.forEach(function (p, i) { t += "<tr><td>" + (i + 1) + (i === 0 ? " (strongest)" : "") + "</td><td>" + f4(p.range_m, 3) + " m</td><td>" + f4(p.rel_dB, 1) + " dB</td><td>" + f4(p.range_m - firstByRange.range_m, 3) + " m</td></tr>"; });
    t += "</tbody></table><p>Resolution about c/B = " + f4(res.resolution_m, 2) + " m (about " + f4(res.hannResolution_m, 2) + " m with the Hann window used here). Paths closer than that merge into one peak. Unambiguous to " + f4(res.unambiguous_m, 1) + " m.</p>";
    if (isFinite(tape)) t += "<p>Strongest peak minus tape: " + f4(res.peaks[0].range_m - tape, 3) + " m.</p>";
    t += "<p class=\"footnote\">The strongest peak is not always the direct path. Pick the earliest peak that survives when you change the antenna positions slightly. Convention: S21 phase = -360 f r / c.</p>";
    msg(out, t); lastTime = res; draw();
    if (res.peaks.length) { $("log-method").value = "time domain"; $("log-est").value = f4(firstByRange.range_m, 4); if (isFinite(tape)) $("log-tape").value = tape; }
  }
  $("run-time").addEventListener("click", runTime);
  $("ex-time").addEventListener("click", function () {
    var f0 = fHz(), lines = ["# SYNTHETIC EXAMPLE, not measured: direct path 3.00 m, ground bounce 4.60 m at 0.5 relative amplitude"];
    var span = Math.min(0.3 * f0, 400e6), n = 201;
    for (var i = 0; i < n; i++) {
      var fi = f0 - span / 2 + i * span / (n - 1), re = 0, im = 0;
      [[1 / 3.0, 3.0], [0.5 / 4.6, 4.6]].forEach(function (p) { var a = -2 * Math.PI * fi * p[1] / C; re += p[0] * Math.cos(a); im += p[0] * Math.sin(a); });
      lines.push((fi / 1e6).toFixed(3) + ", " + (20 * Math.log10(Math.hypot(re, im)) + 0.05 * rnd()).toFixed(3) + ", " + wrap(Math.atan2(im, re) * 180 / Math.PI + 1.5 * rnd()).toFixed(2));
    }
    $("in-time").value = lines.join("\n"); $("time-unit").value = "1e6"; $("time-tape").value = "3.000"; $("time-max").value = "12"; runTime();
  });

  /* ---------- 3 two-frequency / coarse-fine ---------- */
  $("run-two").addEventListener("click", function () {
    var out = $("out-two"), u = parseFloat($("two-unit").value);
    var f1 = num("two-f1") * u, f2 = num("two-f2") * u, p1 = num("two-p1"), p2 = num("two-p2"), mx = num("two-max") || 30;
    if (![f1, f2, p1, p2].every(isFinite) || f1 === f2) { msg(out, "Enter two different frequencies and both phases.", true); return; }
    var r = R.twoFrequency(f1, p1, f2, p2, mx);
    var h = "<p>Path candidates (phase difference only): " + r.candidates_m.map(function (x) { return f4(x, 3) + " m"; }).join(", ") + ". Ambiguity spacing c/|&Delta;f| = " + f4(r.ambiguity_m, 2) + " m. Use a tape or a closer second frequency to pick one.</p>";
    var coarse = num("two-coarse");
    if (isFinite(coarse)) {
      var fc = R.fineFromCoarse(f1, p1, coarse);
      h += "<p>Fine range at f1 with the coarse value " + f4(coarse, 3) + " m: <strong>" + f4(fc.range_m, 4) + " m</strong> (" + fc.wholeWavelengths + " whole wavelengths of " + f4(fc.lambda_m * 1000, 2) + " mm" + (fc.ok ? "" : "; shift larger than lambda/2, the coarse value is not good enough") + ").</p>";
      $("log-method").value = "coarse + fine"; $("log-est").value = f4(fc.range_m, 4);
    }
    msg(out, h);
  });

  /* ---------- 4 null spacing ---------- */
  $("run-nulls").addEventListener("click", function () {
    var out = $("out-nulls"), rows = R.parseTable($("in-nulls").value).map(function (r) { return r[0]; });
    var unit = parseFloat($("nulls-unit").value);
    var s = R.nullSpacing(rows.map(function (v) { return v * unit; }), fHz());
    if (s.error) { msg(out, s.error, true); return; }
    msg(out, "<table><tbody><tr><th scope=\"row\">Mean null spacing</th><td><strong>" + f4(s.mean_m * 1000, 2) + " mm</strong> &plusmn; " + f4(s.sem_m * 1000, 2) + " mm (SEM, " + s.spacings_m.length + " gaps)</td></tr>" +
      "<tr><th scope=\"row\">Expected lambda/2 at " + f4(num("carrier"), 2) + " MHz</th><td>" + f4(s.lambdaHalf_m * 1000, 2) + " mm</td></tr>" +
      "<tr><th scope=\"row\">Ratio measured / expected</th><td>" + f4(s.ratioToHalfLambda, 4) + "</td></tr>" +
      "<tr><th scope=\"row\">Frequency implied by the spacing (free space)</th><td>" + f4(s.impliedFreq_Hz / 1e6, 2) + " MHz</td></tr></tbody></table>" +
      "<p class=\"footnote\">Spacing near lambda/2 means a standing wave between the antenna pair and a reflector (or between the two antennas). It tells you the length scale, not r. To get r, count nulls from a position you have measured, or combine with the phase methods.</p>");
  });

  /* ---------- 5 two-ray ---------- */
  var nullCanvas = $("plot-tworay"), lastTwo = null;
  function runTwo() {
    var out = $("out-tworay"), f = fHz(), lam = C / f;
    var h1 = num("tr-h1"), h2 = num("tr-h2"), nmax = Math.max(1, Math.min(12, Math.round(num("tr-n") || 5))), mode = $("tr-mode").value;
    if ($("tr-eff").checked) { h1 += lam / 2; h2 += lam / 2; }
    if (!(h1 > 0 && h2 > 0)) { msg(out, "Enter positive heights.", true); return; }
    var model = R.twoRayNulls(f, h1, h2, nmax, mode);
    if (!model.length) { msg(out, "No nulls for these heights and frequency.", true); return; }
    var meas = R.parseTable($("in-tworay").value).map(function (r) { return r[0]; });
    var match = meas.length ? R.matchNulls(meas, model) : [];
    var t = "<p>Effective heights used: h1 = " + f4(h1, 3) + " m, h2 = " + f4(h2, 3) + " m (" + ($("tr-eff").checked ? "physical + lambda/2, the Monstein and Wesley convention" : "as entered") + ").</p>" +
      "<table><thead><tr><th scope=\"col\">n</th><th scope=\"col\">Path difference</th><th scope=\"col\">Null at x</th>" + (meas.length ? "<th scope=\"col\">Nearest measured</th><th scope=\"col\">Residual</th>" : "") + "</tr></thead><tbody>";
    model.forEach(function (m) {
      var near = null; match.forEach(function (q) { if (q.n === m.n) near = q; });
      t += "<tr><td>" + m.n + "</td><td>" + f4(m.d_m, 4) + " m</td><td>" + f4(m.x_m, 3) + " m</td>" + (meas.length ? "<td>" + (near ? f4(near.measured_m, 3) + " m" : "-") + "</td><td>" + (near ? f4(near.resid_m, 3) + " m (" + f4(near.resid_pct, 1) + "%)" : "-") + "</td>" : "") + "</tr>";
    });
    t += "</tbody></table>";
    if (meas.length >= 3) {
      var sr = R.nullSeries(meas, f);
      if (!sr.error) t += "<p>Series test on your measured nulls (far-field approximation): h1 h2 = " + f4(sr.H_m2, 2) + " m&sup2;" + (isFinite(sr.sH_m2) ? " &plusmn; " + f4(sr.sH_m2, 2) : "") + ", first index n0 = " + f4(sr.n0, 2) + " (" + (sr.cleanSeries ? "<span class=\"good\">close to an integer: consistent with a two-ray pattern</span>" : "<span class=\"bad\">not close to an integer or poor fit: not a clean two-ray series</span>") + "). Nearer nulls bias h1 h2 low; trust it only for nulls well beyond h1 + h2.</p>";
    }
    var dm = num("tr-delta");
    if (isFinite(dm) && dm > 0) {
      var rd = R.rangeFromDelta(dm, h1, h2);
      t += rd.error ? "<p class=\"bad\">" + rd.error + "</p>" : "<p>From an extra path of " + f4(dm, 4) + " m (ripple period c/&Delta;f): horizontal distance x = <strong>" + f4(rd.x_m, 3) + " m</strong>, direct path R = " + f4(rd.R_m, 3) + " m.</p>";
    }
    t += "<p class=\"footnote\">Mode \"Monstein and Wesley Eq. 17\": nulls where R' - R = (2n+1) lambda/2. Mode \"ideal ground\": reflection coefficient -1, nulls at whole wavelengths. The signal-model amplitude B/A and ground losses move the depth, not the positions.</p>";
    msg(out, t);
    lastTwo = { model: model, meas: meas }; draw();
  }
  $("run-tworay").addEventListener("click", runTwo);
  $("ex-tworay").addEventListener("click", function () {
    $("carrier").value = "433.59"; updateBand(); $("tr-h1").value = "4.0"; $("tr-h2").value = "4.4"; $("tr-eff").checked = true; $("tr-mode").value = "MW"; $("tr-n").value = "5";
    $("in-tworay").value = "# Monstein and Wesley 2002 observed minima (Table I discussion): 39 m and 23 m\n39\n23"; runTwo();
  });
  $("tr-eff").checked = true;

  /* ---------- 6 DF ---------- */
  var dCanvas = $("plot-df"), lastDF = null;
  function runDF() {
    var out = $("out-df"), rows = R.parseTable($("in-df").value).filter(function (r) { return r.length >= 2; });
    if (rows.length < 4) { msg(out, "Paste at least 4 rows of <code>angle_deg, level_dB</code>.", true); lastDF = null; draw(); return; }
    var a = rows.map(function (r) { return r[0]; }), l = rows.map(function (r) { return r[1]; });
    var fit = R.fitFigureEight(a, l);
    if (fit.error) { msg(out, fit.error, true); return; }
    var br = num("df-bearing"), h = "<table><tbody><tr><th scope=\"row\">Axis angle of maximum</th><td><strong>" + f4(fit.thetaMax_deg, 1) + " deg</strong> (mod 180)</td></tr>" +
      "<tr><th scope=\"row\">Axis angle of the null</th><td>" + f4(fit.thetaNull_deg, 1) + " deg</td></tr>" +
      "<tr><th scope=\"row\">Maximum to minimum</th><td>" + (isFinite(fit.maxToMin_dB) ? f4(fit.maxToMin_dB, 1) + " dB" : "very deep (fit minimum is zero)") + "</td></tr>" +
      "<tr><th scope=\"row\">Fit residual</th><td>" + f4(fit.rmsResid_dB, 2) + " dB RMS</td></tr></tbody></table>";
    if (isFinite(br)) {
      var c = R.classifyPeak(fit.thetaMax_deg, br);
      h += "<p>Known source bearing " + f4(br, 1) + " deg: the peak is <strong>" + c.label + "</strong> (" + f4(c.offsetFromEndOn_deg, 1) + " deg from end-on, " + f4(c.offsetFromBroadside_deg, 1) + " deg from broadside).</p>" +
        "<p class=\"footnote\">Declared predictions, both to be tested: transverse E along the dipole peaks broadside; an E component along the propagation direction (the SLW claim) peaks end-on. An ordinary source also has a radial E inside a few wavelengths, so repeat at several ranges and watch how the end-on part falls with distance.</p>";
    } else h += "<p class=\"footnote\">Enter the known bearing of the source (same angle scale as the turntable) to classify the peak. Without a calibration on a known source, the 180 degree ambiguity and the polarisation assumption make a bearing unreliable.</p>";
    msg(out, h); lastDF = { a: a, l: l, fit: fit }; draw();
  }
  $("run-df").addEventListener("click", runDF);
  $("ex-df").addEventListener("click", function () {
    var lines = ["# SYNTHETIC EXAMPLE, not measured: transverse-like, peak broadside to a source at bearing 40 deg (peak at 130 deg)"];
    for (var a = 0; a < 360; a += 15) lines.push(a + ", " + (-60 + 10 * Math.log10(0.03 + Math.pow(Math.cos((a - 130) * Math.PI / 180), 2)) + 0.3 * rnd()).toFixed(2));
    $("in-df").value = lines.join("\n"); $("df-bearing").value = "40"; runDF();
  });
  $("run-tri").addEventListener("click", function () {
    var out = $("out-tri"), p1 = [num("tri-x1"), num("tri-y1")], p2 = [num("tri-x2"), num("tri-y2")], b1 = num("tri-b1"), b2 = num("tri-b2"), s = num("tri-s") || 0;
    if (![p1[0], p1[1], p2[0], p2[1], b1, b2].every(isFinite)) { msg(out, "Fill in both station positions and both bearings.", true); return; }
    var t = R.triangulateSpread(p1, b1, p2, b2, s);
    if (t.error) { msg(out, t.error, true); return; }
    msg(out, "<p>Source at x = <strong>" + f4(t.x, 3) + " m</strong>, y = <strong>" + f4(t.y, 3) + " m</strong>. Range from station 1: <strong>" + f4(t.r1_m, 3) + " m</strong> (" + f4(t.r1_lo_m, 2) + " to " + f4(t.r1_hi_m, 2) + " m for &plusmn;" + s + " deg bearing error). From station 2: " + f4(t.r2_m, 3) + " m." + (t.valid ? "" : " <span class=\"bad\">A bearing points away from the intersection; check the bearing convention.</span>") + "</p>" +
      "<p class=\"footnote\">Bearings are clockwise from +Y (forward). Poor geometry (a short baseline, or a source nearly in line with both stations) inflates the range error quickly.</p>");
  });

  /* ---------- calibration log ---------- */
  var KEY = "slw-r1-rangelog-v1", log = [];
  try { log = JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { log = []; }
  var lCanvas = $("plot-log");
  function saveLog() { try { localStorage.setItem(KEY, JSON.stringify(log)); } catch (e) {} }
  function renderLog() {
    var tb = $("log-body"); tb.innerHTML = "";
    log.forEach(function (r, i) {
      var tr = document.createElement("tr");
      [r.band, r.method, f4(r.est, 4), f4(r.tape, 4), f4(r.est - r.tape, 4)].forEach(function (v) { var td = document.createElement("td"); td.textContent = v; tr.appendChild(td); });
      var td = document.createElement("td"), b = document.createElement("button"); b.type = "button"; b.textContent = "Remove"; b.setAttribute("aria-label", "Remove row " + (i + 1));
      b.addEventListener("click", function () { log.splice(i, 1); saveLog(); renderLog(); }); td.appendChild(b); tr.appendChild(td); tb.appendChild(tr);
    });
    var s = $("log-summary");
    if (log.length >= 3) {
      var fit = R.linfit(log.map(function (r) { return r.tape; }), log.map(function (r) { return r.est; }));
      s.innerHTML = "Estimate = " + f4(fit.slope, 4) + " &times; tape + " + f4(fit.intercept, 4) + " m; RMS scatter " + f4(fit.rms, 4) + " m. A slope other than 1 within its uncertainty (&plusmn;" + f4(fit.sSlope, 4) + ") or a large scatter fails the 'range finder works' test; a constant offset is a calibration (phase centre, cable) and can be subtracted.";
    } else s.textContent = log.length ? "Add at least 3 points to fit estimate versus tape." : "No rows yet.";
    draw();
  }
  $("log-add").addEventListener("click", function () {
    var est = num("log-est"), tape = num("log-tape");
    if (!isFinite(est) || !isFinite(tape)) { alert("Enter an estimate and a tape-measured range."); return; }
    log.push({ band: f4(num("carrier"), 2) + " MHz", method: $("log-method").value || "manual", est: est, tape: tape }); saveLog(); renderLog();
  });
  $("log-clear").addEventListener("click", function () { if (log.length && confirm("Delete all rows in this table?")) { log = []; saveLog(); renderLog(); } });
  $("log-csv").addEventListener("click", function () {
    var t = "band,method,estimate_m,tape_m,error_m\n" + log.map(function (r) { return [r.band, r.method, r.est, r.tape, r.est - r.tape].join(","); }).join("\n") + "\n";
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv" })); a.download = "slw-range-calibration.csv"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });

  /* ---------- plots ---------- */
  function draw() {
    if (!pCanvas.parentNode.parentNode.hidden) {
      if (lastPhase) {
        var x = lastPhase.f.map(function (v) { return v / 1e6; });
        P.draw(pCanvas, { xlabel: "frequency (MHz)", ylabel: "unwrapped phase (deg)", series: [
          { x: x, y: lastPhase.u, type: "points", color: "#d4b483", label: "S21 phase" },
          { x: x, y: lastPhase.f.map(function (v) { return lastPhase.fit.intercept + lastPhase.fit.slope * v; }), color: "#6aaa6a", label: "linear fit" }] });
      } else P.draw(pCanvas, { series: [] });
    }
    if (!tCanvas.parentNode.parentNode.hidden) {
      if (lastTime) P.draw(tCanvas, { xlabel: "range (m)", ylabel: "|impulse response| (relative)", series: [{ x: lastTime.range_m, y: lastTime.mag, color: "#d4b483", label: "time domain" }],
        vlines: lastTime.peaks.slice(0, 2).map(function (p, i) { return { x: p.range_m, label: f4(p.range_m, 2) + " m", color: i ? "#7a8bc4" : "#c45c4a" }; }) });
      else P.draw(tCanvas, { series: [] });
    }
    if (!nullCanvas.parentNode.parentNode.hidden) {
      if (lastTwo) {
        var f = fHz(), lam = C / f, h1 = num("tr-h1") + ($("tr-eff").checked ? lam / 2 : 0), h2 = num("tr-h2") + ($("tr-eff").checked ? lam / 2 : 0);
        var xs = [], ys = [], x0 = Math.max(1, Math.min.apply(null, lastTwo.model.map(function (m) { return m.x_m; })) * 0.6), x1 = Math.max.apply(null, lastTwo.model.map(function (m) { return m.x_m; })) * 1.3, ba = 0.694;
        for (var i = 0; i <= 600; i++) {
          var xv = x0 * Math.pow(x1 / x0, i / 600), R1 = Math.sqrt(xv * xv + (h2 - h1) * (h2 - h1)), R2 = Math.sqrt(xv * xv + (h2 + h1) * (h2 + h1));
          var sgn = $("tr-mode").value === "PEC" ? -1 : 1, F = 1 + ba * ba + 2 * ba * sgn * Math.cos(2 * Math.PI * (R2 - R1) / lam);
          xs.push(xv); ys.push(10 * Math.log10(Math.max(F, 1e-4)));
        }
        P.draw(nullCanvas, { xlabel: "horizontal distance x (m)", ylabel: "multipath factor (dB re direct)", ymin: -20, series: [{ x: xs, y: ys, color: "#d4b483", label: "model, B/A = 0.694 (M&W fit)" }],
          vlines: lastTwo.meas.map(function (v) { return { x: v, color: "#6aaa6a" }; }).concat(lastTwo.model.slice(0, 6).map(function (m) { return { x: m.x_m, color: "#5a4e3c" }; })) });
      } else P.draw(nullCanvas, { series: [] });
    }
    if (!dCanvas.parentNode.parentNode.hidden) {
      if (lastDF) P.draw(dCanvas, { xlabel: "dipole axis angle on turntable (deg)", ylabel: "level (dB)", series: [
        { x: lastDF.a, y: lastDF.l, type: "points", color: "#d4b483", label: "measured" }, { x: lastDF.a, y: lastDF.fit.fitDB, type: "points", color: "#6aaa6a", label: "figure-eight fit" }] });
      else P.draw(dCanvas, { series: [] });
    }
    var pts = log.map(function (r) { return r.tape; }), est = log.map(function (r) { return r.est; });
    var mx = Math.max.apply(null, pts.concat(est).concat([1]));
    P.draw(lCanvas, { xlabel: "tape-measured range (m)", ylabel: "estimated range (m)", xmin: 0, ymin: 0, xmax: mx * 1.05, ymax: mx * 1.05, series: [
      { x: [0, mx * 1.05], y: [0, mx * 1.05], color: "#5a4e3c", label: "1:1" }, { x: pts, y: est, type: "points", color: "#d4b483", label: "runs" }] });
  }
  function redrawAll() { draw(); }
  window.addEventListener("resize", redrawAll);
  renderLog(); selectTab("phase");
})();
