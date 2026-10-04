/* SLW Hub Round 1: range-finder math (pure functions, no DOM, no dependencies).
 * Notation: r = straight-line TX to RX separation (sphere centre to sphere centre).
 *           x = horizontal ground distance in the two-ray (Monstein and Wesley) model.
 *           h1, h2 = TX, RX heights. lambda = c / f (free space).
 * Used by range-finder.html and tested with node (tests/ are not shipped; see page for the sample checks).
 */
(function (root) {
  "use strict";
  var C = 299792458;

  function parseTable(text) {
    // Accepts comma, semicolon, tab or space separated numbers. Skips lines that do not start with a number.
    var rows = [];
    String(text || "").split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line || /^[#%!]/.test(line)) return;
      var parts = line.split(/[\s,;]+/).filter(Boolean).map(Number);
      if (!parts.length || parts.some(function (v) { return !isFinite(v); })) return;
      rows.push(parts);
    });
    return rows;
  }

  function linfit(x, y) {
    var n = x.length, sx = 0, sy = 0, i;
    for (i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
    var mx = sx / n, my = sy / n, sxx = 0, sxy = 0, syy = 0;
    for (i = 0; i < n; i++) { sxx += (x[i] - mx) * (x[i] - mx); sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) * (y[i] - my); }
    var slope = sxy / sxx, icpt = my - slope * mx, ss = 0;
    for (i = 0; i < n; i++) { var e = y[i] - (icpt + slope * x[i]); ss += e * e; }
    var dof = n - 2, s2 = dof > 0 ? ss / dof : NaN;
    return { n: n, slope: slope, intercept: icpt, rms: Math.sqrt(ss / n),
      sSlope: dof > 0 ? Math.sqrt(s2 / sxx) : NaN, r2: syy > 0 ? 1 - ss / syy : NaN };
  }

  function unwrapDeg(p) {
    var out = [p[0]], off = 0, maxStep = 0;
    for (var i = 1; i < p.length; i++) {
      var d = p[i] - p[i - 1];
      maxStep = Math.max(maxStep, Math.abs(((d + 540) % 360) - 180));
      if (d > 180) off -= 360 * Math.round(d / 360);
      else if (d < -180) off += 360 * Math.round(-d / 360);
      out.push(p[i] + off);
    }
    return { phase: out, maxStepDeg: maxStep };
  }

  /* Phase-slope ranging. S21 phase of a single free-space path: phi = -360 * f * r / c  (degrees) + constant.
   * So r = -(dphi/df) * c / 360. fHz[] and phaseDeg[] must be sorted by frequency. */
  function phaseSlopeRange(fHz, phaseDeg, opts) {
    opts = opts || {};
    var n = fHz.length;
    if (n < 2) return { error: "Need at least 2 frequency points." };
    var u = unwrapDeg(phaseDeg);
    var fit = linfit(fHz, u.phase);
    var sign = opts.sign === "+" ? -1 : 1;           // "+" = instrument reports phase that increases with delay
    var r = -fit.slope * sign * C / 360;
    var sR = isFinite(fit.sSlope) ? Math.abs(fit.sSlope) * C / 360 : NaN;
    var span = Math.max.apply(null, fHz) - Math.min.apply(null, fHz);
    var step = span / (n - 1);
    var res = {
      n: n, rawRange_m: r, rangeStatErr_m: sR, rms_deg: fit.rms, r2: fit.r2,
      span_Hz: span, step_Hz: step,
      unambiguousRange_m: C / step,                    // phase advances 360 deg per step at this r
      resolutionRule_m: C / span,                      // c / B, scale of multipath-free separation
      maxPhaseStep_deg: u.maxStepDeg, unwrapped: u.phase, fit: fit,
      warnings: []
    };
    if (r < 0) res.warnings.push("Negative range: the phase sign convention is probably the other way round. Flip the sign option.");
    if (u.maxStepDeg > 150) res.warnings.push("Phase steps above 150 degrees between points: unwrapping may be wrong. Use a smaller frequency step.");
    if (n < 5) res.warnings.push("Fewer than 5 points: the statistical error is weak. Use a sweep of 50 or more points.");
    var off = (opts.offset_m || 0);
    res.range_m = Math.abs(r) - off;
    if (off) res.warnings.push("Applied a fixed offset of " + off + " m (cable delay or phase-centre correction from your calibration).");
    return res;
  }

  /* Two-frequency ranging: coarse range from the phase difference, ambiguous by c / |f2 - f1|. */
  function twoFrequency(f1, p1, f2, p2, maxRange_m) {
    var df = f2 - f1, dp = p2 - p1;
    var amb = C / Math.abs(df);
    var base = -(dp / 360) * C / df;                     // from r = -(dphi/df) c / 360
    base = ((base % amb) + amb) % amb;
    var cands = [];
    for (var k = 0; base + k * amb <= (maxRange_m || 100); k++) cands.push(base + k * amb);
    return { ambiguity_m: amb, candidates_m: cands };
  }

  /* Fine range from one frequency's phase, given a coarse estimate good to better than lambda/2. */
  function fineFromCoarse(fHz, phaseDeg, coarse_m) {
    var lam = C / fHz;
    var frac = (((-phaseDeg / 360) % 1) + 1) % 1;
    var n = Math.round((coarse_m - frac * lam) / lam);
    var r = (n + frac) * lam;
    return { lambda_m: lam, wholeWavelengths: n, range_m: r, shiftFromCoarse_m: r - coarse_m,
      ok: Math.abs(r - coarse_m) < lam / 2 + 1e-12 };
  }

  /* Time-domain range from complex S21(f): Hann-windowed inverse DFT onto a delay grid. */
  function impulseResponse(fHz, s21dB, phaseDeg, opts) {
    opts = opts || {};
    var n = fHz.length, i, k;
    var span = fHz[n - 1] - fHz[0], step = span / (n - 1);
    var rMax = Math.min(opts.maxRange_m || 60, C / step);
    var res_m = C / span;
    var dr = Math.max(res_m / 20, 1e-3);
    var nr = Math.floor(rMax / dr) + 1;
    var re = new Array(n), im = new Array(n), w = new Array(n);
    for (i = 0; i < n; i++) {
      var a = Math.pow(10, s21dB[i] / 20), ph = phaseDeg[i] * Math.PI / 180;
      w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1));
      re[i] = a * Math.cos(ph) * w[i]; im[i] = a * Math.sin(ph) * w[i];
    }
    var rr = [], mag = [];
    for (k = 0; k < nr; k++) {
      var r = k * dr, tau = r / C, sr = 0, si = 0;
      for (i = 0; i < n; i++) {
        var arg = 2 * Math.PI * (fHz[i] - fHz[0]) * tau, cs = Math.cos(arg), sn = Math.sin(arg);
        sr += re[i] * cs - im[i] * sn; si += re[i] * sn + im[i] * cs;
      }
      rr.push(r); mag.push(Math.sqrt(sr * sr + si * si) / n);
    }
    var peaks = [];
    for (k = 1; k < nr - 1; k++) {
      if (mag[k] > mag[k - 1] && mag[k] >= mag[k + 1]) {
        var a0 = mag[k - 1], b0 = mag[k], c0 = mag[k + 1], den = a0 - 2 * b0 + c0;
        var d = den !== 0 ? 0.5 * (a0 - c0) / den : 0;
        peaks.push({ range_m: rr[k] + d * dr, mag: b0 });
      }
    }
    peaks.sort(function (p, q) { return q.mag - p.mag; });
    var top = peaks.slice(0, 4);
    var maxm = top.length ? top[0].mag : 0;
    top.forEach(function (p) { p.rel_dB = 20 * Math.log10(p.mag / maxm); });
    return { range_m: rr, mag: mag, peaks: top, resolution_m: res_m, hannResolution_m: 1.44 * res_m,
      unambiguous_m: C / step, bandwidth_Hz: span };
  }

  /* Null spacing along a line of motion (receiver moved in small steps, nulls logged as positions in metres). */
  function nullSpacing(positions_m, fHz) {
    var p = positions_m.slice().sort(function (a, b) { return a - b; });
    if (p.length < 2) return { error: "Need at least two null positions." };
    var d = [], i;
    for (i = 1; i < p.length; i++) d.push(p[i] - p[i - 1]);
    var m = d.reduce(function (a, b) { return a + b; }, 0) / d.length;
    var sd = d.length > 1 ? Math.sqrt(d.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / (d.length - 1)) : NaN;
    var lam = C / fHz;
    return { spacings_m: d, mean_m: m, sd_m: sd, sem_m: d.length > 1 ? sd / Math.sqrt(d.length) : NaN,
      lambdaHalf_m: lam / 2, ratioToHalfLambda: m / (lam / 2), impliedFreq_Hz: C / (2 * m) };
  }

  /* Two-ray null positions. Exact closed form from R'^2 - R^2 = 4 h1 h2 and R' - R = d.
   * mode "MW": nulls at d = (2n+1) lambda/2 (Monstein and Wesley Eq. 17, effective reflecting plane lambda/2 below ground).
   * mode "PEC": ideal ground, horizontal polarisation (reflection coefficient -1): nulls at d = n lambda, n >= 1. */
  function twoRayNulls(fHz, h1, h2, nMax, mode) {
    var lam = C / fHz, out = [], H4 = 4 * h1 * h2, dh = h2 - h1;
    for (var n = 0; n <= nMax; n++) {
      var d = mode === "PEC" ? (n + 1) * lam : (2 * n + 1) * lam / 2;
      var R = (H4 / d - d) / 2;
      if (R * R - dh * dh <= 0 || R <= 0) break;
      out.push({ n: n, d_m: d, x_m: Math.sqrt(R * R - dh * dh), R_m: R });
    }
    return out;
  }

  /* Match measured null positions to the two-ray model; returns nearest predicted null for each. */
  function matchNulls(measured_m, model) {
    return measured_m.map(function (x) {
      var best = null;
      model.forEach(function (m) { if (!best || Math.abs(m.x_m - x) < Math.abs(best.x_m - x)) best = m; });
      return { measured_m: x, n: best ? best.n : null, model_m: best ? best.x_m : NaN, resid_m: best ? x - best.x_m : NaN,
        resid_pct: best ? 100 * (x - best.x_m) / best.x_m : NaN };
    });
  }

  /* Far-field series test. For consecutive two-ray nulls (MW convention), 1/x_k = (2(n0+k)+1) lambda / (4 H), H = h1 h2.
   * Regress 1/x on k (k = 0 at the farthest null). slope s = lambda / (2H); intercept / slope - 1/2 should be an integer n0.
   * Far-field approximation: R' - R = 2 h1 h2 / x, good to a few percent only for x well beyond (h1 + h2); nearer nulls bias H low. */
  function nullSeries(positions_m, fHz) {
    var p = positions_m.slice().sort(function (a, b) { return b - a; });
    if (p.length < 3) return { error: "Need at least three consecutive nulls (farthest to nearest)." };
    var k = p.map(function (_, i) { return i; }), inv = p.map(function (v) { return 1 / v; });
    var f = linfit(k, inv), lam = C / fHz;
    var H = lam / (2 * f.slope), n0 = f.intercept / f.slope - 0.5;
    return { H_m2: H, n0: n0, n0Nearest: Math.round(n0), n0Frac: Math.abs(n0 - Math.round(n0)),
      sH_m2: isFinite(f.sSlope) ? H * f.sSlope / Math.abs(f.slope) : NaN, rmsInv: f.rms, r2: f.r2,
      cleanSeries: Math.abs(n0 - Math.round(n0)) < 0.2 && f.r2 > 0.98 };
  }

  /* Range from the multipath ripple period in |S21| versus frequency (two-ray geometry).
   * ripple period df -> path difference delta = c / df -> x from closed form with known heights. */
  function rangeFromDelta(delta_m, h1, h2) {
    var H4 = 4 * h1 * h2, R = (H4 / delta_m - delta_m) / 2, dh = h2 - h1;
    if (R * R - dh * dh <= 0 || R <= 0) return { error: "No geometric solution for that path difference and these heights." };
    return { x_m: Math.sqrt(R * R - dh * dh), R_m: R };
  }

  /* Dipole direction finding. Received power of a dipole rotated through angle theta follows
   *   P(theta) = a + b cos(2 (theta - theta0)).  Linear least squares in (a, c, s) with c = b cos 2 theta0, s = b sin 2 theta0.
   * anglesDeg: dipole axis angle on the turntable; levelDB: relative level in dB (or dBm). */
  function fitFigureEight(anglesDeg, levelDB) {
    var n = anglesDeg.length;
    if (n < 4) return { error: "Need at least 4 angles (8 or more is better)." };
    var P = levelDB.map(function (d) { return Math.pow(10, d / 10); });
    var S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], T = [0, 0, 0], i, j, k;
    for (i = 0; i < n; i++) {
      var t = 2 * anglesDeg[i] * Math.PI / 180, v = [1, Math.cos(t), Math.sin(t)];
      for (j = 0; j < 3; j++) { T[j] += v[j] * P[i]; for (k = 0; k < 3; k++) S[j][k] += v[j] * v[k]; }
    }
    var sol = solve3(S, T);
    if (!sol) return { error: "Angles do not span enough of the circle for a fit." };
    var a = sol[0], c = sol[1], s = sol[2], b = Math.sqrt(c * c + s * s);
    var theta0 = (0.5 * Math.atan2(s, c) * 180 / Math.PI + 180) % 180;
    var ss = 0, fitDB = anglesDeg.map(function (th, idx) {
      var t2 = 2 * th * Math.PI / 180, pm = a + c * Math.cos(t2) + s * Math.sin(t2);
      var db = 10 * Math.log10(Math.max(pm, 1e-30)); ss += (db - levelDB[idx]) * (db - levelDB[idx]); return db;
    });
    return { thetaMax_deg: theta0, thetaNull_deg: (theta0 + 90) % 180, depth: b / a,
      maxToMin_dB: a - b > 0 ? 10 * Math.log10((a + b) / (a - b)) : Infinity, rmsResid_dB: Math.sqrt(ss / n), fitDB: fitDB };
  }
  function solve3(A, b) {
    var M = A.map(function (r, i) { return r.concat([b[i]]); }), i, j, k;
    for (i = 0; i < 3; i++) {
      var piv = i;
      for (j = i + 1; j < 3; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j;
      if (Math.abs(M[piv][i]) < 1e-12) return null;
      var tmp = M[i]; M[i] = M[piv]; M[piv] = tmp;
      for (j = i + 1; j < 3; j++) { var f = M[j][i] / M[i][i]; for (k = i; k < 4; k++) M[j][k] -= f * M[i][k]; }
    }
    var x = [0, 0, 0];
    for (i = 2; i >= 0; i--) { var s = M[i][3]; for (j = i + 1; j < 3; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }

  /* Compare the fitted peak direction to the known source bearing (both in degrees, axis angles mod 180).
   * Declared predictions (HYPOTHESES to test, not results):
   *   transverse E along the dipole (horizontal polarisation): maximum broadside (about 90 deg from the bearing)
   *   E component along the propagation direction (the SLW claim): maximum end-on (about 0 deg from the bearing)
   * Warning: in the reactive near field (r < lambda / 2 pi) ordinary TEM antennas also have a radial E component. */
  function classifyPeak(thetaMax_deg, bearing_deg) {
    var delta = (((thetaMax_deg - bearing_deg) % 180) + 180) % 180;
    var e = Math.min(delta, 180 - delta);              // 0 = end-on, 90 = broadside
    return { offsetFromEndOn_deg: e, offsetFromBroadside_deg: 90 - e,
      label: e < 20 ? "end-on peak" : e > 70 ? "broadside peak" : "intermediate (mixed or off-axis)" };
  }

  /* Triangulation from two DF fixes. Bearing is clockwise from the +Y axis (forward), positions in metres (x right, y forward). */
  function triangulate(p1, b1deg, p2, b2deg) {
    var a1 = b1deg * Math.PI / 180, a2 = b2deg * Math.PI / 180;
    var d1 = [Math.sin(a1), Math.cos(a1)], d2 = [Math.sin(a2), Math.cos(a2)];
    var det = d1[0] * (-d2[1]) - d1[1] * (-d2[0]);
    if (Math.abs(det) < 1e-9) return { error: "Bearings are parallel: no fix. Move the second station farther sideways." };
    var rx = p2[0] - p1[0], ry = p2[1] - p1[1];
    var t1 = (rx * (-d2[1]) - ry * (-d2[0])) / det, t2 = (d1[0] * ry - d1[1] * rx) / det;
    return { x: p1[0] + t1 * d1[0], y: p1[1] + t1 * d1[1], r1_m: t1, r2_m: t2, valid: t1 > 0 && t2 > 0 };
  }
  function triangulateSpread(p1, b1, p2, b2, sigmaDeg) {
    var lo = Infinity, hi = -Infinity, base = triangulate(p1, b1, p2, b2);
    if (base.error) return base;
    [-1, 1].forEach(function (s1) { [-1, 1].forEach(function (s2) {
      var t = triangulate(p1, b1 + s1 * sigmaDeg, p2, b2 + s2 * sigmaDeg);
      if (!t.error) { lo = Math.min(lo, t.r1_m); hi = Math.max(hi, t.r1_m); }
    }); });
    base.r1_lo_m = lo; base.r1_hi_m = hi; return base;
  }

  root.R1Range = { C: C, parseTable: parseTable, linfit: linfit, unwrapDeg: unwrapDeg, phaseSlopeRange: phaseSlopeRange,
    twoFrequency: twoFrequency, fineFromCoarse: fineFromCoarse, impulseResponse: impulseResponse, nullSpacing: nullSpacing,
    twoRayNulls: twoRayNulls, matchNulls: matchNulls, nullSeries: nullSeries, rangeFromDelta: rangeFromDelta,
    fitFigureEight: fitFigureEight, classifyPeak: classifyPeak, triangulate: triangulate, triangulateSpread: triangulateSpread };
  if (typeof module !== "undefined" && module.exports) module.exports = root.R1Range;
})(typeof window !== "undefined" ? window : globalThis);
