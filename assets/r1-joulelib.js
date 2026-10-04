/* SLW Hub Round 1: Joule-loss / power-balance math (pure functions, no DOM, no dependencies).
 * Everything here is bookkeeping for measured numbers. None of it proves a loss mechanism.
 */
(function (root) {
  "use strict";
  var MU0 = 4e-7 * Math.PI, LOG10E10 = 10 * Math.log10(Math.E);   // 4.3429 dB per unit of kappa
  var MATERIALS = {
    brass:   { name: "Brass C36000 (26% IACS)", sigma: 1.508e7, src: "Aviva Metals / MakeItFrom: 6.63 microhm-cm, 26% IACS at 20 C" },
    w1_ann:  { name: "W1 tool steel, annealed", sigma: 5.4e6,  src: "EngMats C80W1: 0.185 microhm-m (htsteelmill datasheet: 0.20 ohm mm2/m = 5.0e6 S/m)" },
    w1_hard: { name: "W1 tool steel, hardened", sigma: 4.1e6,  src: "MakeItFrom Hardened W1: 7.1% IACS (the hub rod-thermal page uses 3.3e6 from MatWeb 30 microhm-cm)" },
    copper:  { name: "Copper (annealed standard)", sigma: 5.8e7, src: "IACS definition, 58.0 to 58.1 MS/m" }
  };

  function skinDepth_m(fHz, sigma, mur) { return 1 / Math.sqrt(Math.PI * fHz * MU0 * (mur || 1) * sigma); }
  function surfaceResistance(fHz, sigma, mur) { return 1 / (sigma * skinDepth_m(fHz, sigma, mur)); }
  function rodResistance(L_m, d_m, fHz, sigma, mur) {
    var del = skinDepth_m(fHz, sigma, mur), dc = L_m / (sigma * Math.PI * d_m * d_m / 4);
    if (del < d_m / 4) return Math.max(dc, L_m * surfaceResistance(fHz, sigma, mur) / (Math.PI * d_m));
    return dc;
  }
  /* TEM control only: fraction of intercepted power a resonant half-wave rod turns into heat, about R_eff / R_rad.
   * R_eff = half the end-to-end skin-effect resistance (sinusoidal current), R_rad = 73.1 ohm (thin half-wave dipole). */
  function rodAbsorbedFractionTEM(L_m, d_m, fHz, sigma, mur) { return rodResistance(L_m, d_m, fHz, sigma, mur) / 2 / 73.1; }
  function dbToLin(dB) { return Math.pow(10, dB / 10); }

  /* Fraction of incident power not returned to either port: 1 - |S11|^2 - |S21|^2 (S in dB). */
  function dissipatedFraction(s11dB, s21dB) {
    var refl = dbToLin(s11dB), trans = dbToLin(s21dB), rest = 1 - refl - trans;
    var w = [];
    if (rest < 0) w.push("Reflected plus transmitted exceeds 100%: measurement error, a gain stage, or mixed-up reference planes.");
    return { reflected: refl, transmitted: trans, unaccounted: rest, unaccounted_dB: rest > 0 ? 10 * Math.log10(rest) : -Infinity, warnings: w };
  }

  /* Rods in versus rods out, same geometry, same cal. S in dB. */
  function rodsInOut(s21out_dB, s21in_dB, s11out_dB, s11in_dB) {
    var tOut = dbToLin(s21out_dB), tIn = dbToLin(s21in_dB);
    var removed = (tOut - tIn) / tOut;             // fraction of the received power the rods took out of the path
    var dRefl = dbToLin(s11in_dB) - dbToLin(s11out_dB);   // change in input reflection, fraction of incident power
    var nm = (tOut - tIn) - dRefl;                 // incident-power fraction removed but NOT seen as extra input reflection
    return { insertionLoss_dB: s21out_dB - s21in_dB, removedFractionOfReceived: removed,
      removedFractionOfIncident: tOut - tIn, deltaReflFractionOfIncident: dRefl, notReturnedToPorts: nm };
  }

  /* Fit L(phi) = L0 - 4.3429 * kappa * cos^2(phi - phi0)  (dB), the Monstein and Wesley form T = exp(-kappa cos^2 phi).
   * phi0 is scanned; L0 and kappa are linear least squares. Input: angles (deg) and level (dB or dBm, relative is fine). */
  function fitPolarizer(anglesDeg, levelDB) {
    var n = anglesDeg.length;
    if (n < 5) return { error: "Need at least 5 angles; 12 or more over 0 to 180 degrees is better." };
    var best = null, ph0;
    function lsq(p0) {
      var Sx = 0, Sy = 0, Sxx = 0, Sxy = 0, i, x = [];
      for (i = 0; i < n; i++) { var c = Math.cos((anglesDeg[i] - p0) * Math.PI / 180); x.push(c * c); Sx += x[i]; Sy += levelDB[i]; Sxx += x[i] * x[i]; Sxy += x[i] * levelDB[i]; }
      var den = n * Sxx - Sx * Sx; if (Math.abs(den) < 1e-12) return null;
      var b = (n * Sxy - Sx * Sy) / den, a = (Sy - b * Sx) / n, ss = 0;
      for (i = 0; i < n; i++) { var e = levelDB[i] - (a + b * x[i]); ss += e * e; }
      return { a: a, b: b, ss: ss, den: den, Sxx: Sxx, Sx: Sx, p0: p0 };
    }
    for (ph0 = 0; ph0 < 180; ph0 += 0.5) { var f = lsq(ph0); if (f && f.b < 0 && (!best || f.ss < best.ss)) best = f; }
    if (!best) return { error: "No fit with loss at the aligned angle: the level never dips as the rods turn. Check the angle zero and the sign of the level column." };
    var lo = best.p0 - 0.5, hi = best.p0 + 0.5, k;
    for (k = 0; k < 40; k++) { var m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; var q1 = lsq(m1), q2 = lsq(m2); if (!q1 || q1.b >= 0) { lo = m1; continue; } if (!q2 || q2.b >= 0) { hi = m2; continue; } if (q1.ss < q2.ss) hi = m2; else lo = m1; }
    var fin = lsq((lo + hi) / 2); if (fin && fin.b < 0) best = fin;
    var kappa = -best.b / LOG10E10, dof = n - 3 > 0 ? n - 3 : NaN, s2 = best.ss / dof;
    var sB = Math.sqrt(s2 * n / best.den), sKappa = sB / LOG10E10;
    var mean = 0, i; for (i = 0; i < n; i++) mean += levelDB[i]; mean /= n;
    var sst = 0; for (i = 0; i < n; i++) sst += (levelDB[i] - mean) * (levelDB[i] - mean);
    var phi0 = ((best.p0 % 180) + 180) % 180;
    if (kappa < 0) return { error: "Fitted kappa is negative: the level rises when the rods are aligned. Check the angle zero and the sign of the level column." };
    return { kappa: kappa, sKappa: sKappa, L0_dB: best.a, phi0_deg: phi0, maxLoss_dB: LOG10E10 * kappa, rms_dB: Math.sqrt(best.ss / n),
      r2: sst > 0 ? 1 - best.ss / sst : NaN, n: n, T_aligned: Math.exp(-kappa) };
  }

  /* Compare kappa for two rod materials. Model predictions for kappa_B / kappa_A:
   *   "Joule-literal" (kappa proportional to sigma, M&W Eq. 7 to 9 taken literally): sigma_B / sigma_A
   *   "material-independent" (energy-capped Joule, or scattering by good conductors): 1.0 */
  function compareMaterials(fitA, fitB, sigmaA, sigmaB) {
    var ratio = fitB.kappa / fitA.kappa;
    var sRatio = ratio * Math.sqrt(Math.pow(fitA.sKappa / fitA.kappa, 2) + Math.pow(fitB.sKappa / fitB.kappa, 2));
    var pred = { literal: sigmaB / sigmaA, independent: 1 };
    function z(p) { return isFinite(sRatio) && sRatio > 0 ? Math.abs(ratio - p) / sRatio : Infinity; }
    var zl = z(pred.literal), zi = z(pred.independent), verdict;
    if (zl < 2 && zi >= 2) verdict = "Consistent with kappa proportional to sigma (Joule-literal); material-independent is disfavoured.";
    else if (zi < 2 && zl >= 2) verdict = "Consistent with material-independent loss (scattering or energy-capped); Joule-literal is disfavoured.";
    else if (zi < 2 && zl < 2) verdict = "Cannot separate the two predictions at this uncertainty.";
    else verdict = "Matches neither prediction: check fixture repeatability, rod diameter and length, angle zero, and whether W1 is magnetic enough to matter.";
    return { ratio: ratio, sRatio: sRatio, predLiteral: pred.literal, predIndependent: pred.independent, zLiteral: zl, zIndependent: zi, verdict: verdict };
  }


  /* ---- Three-station fixture scan (proposal) ----
   * The same rod-angle scan is run with the rotating fixture at three stations on the TX to RX line:
   * NEAR TX, MIDWAY, NEAR RX. Each station gives a kappa from fitPolarizer. An optional third column
   * (TX S11 in dB, or a monitor level for the oven) is a loading indicator: if it moves with the rod angle,
   * the rods are loading or detuning the source (near-field coupling) and kappa at that station is suspect. */
  function loadingStats(anglesDeg, loadDB, phi0Deg) {
    var n = loadDB.length, i, mn = Infinity, mx = -Infinity, x = [], Sx = 0, Sy = 0;
    for (i = 0; i < n; i++) {
      if (loadDB[i] < mn) mn = loadDB[i]; if (loadDB[i] > mx) mx = loadDB[i];
      var c = Math.cos((anglesDeg[i] - phi0Deg) * Math.PI / 180); x.push(c * c); Sx += x[i]; Sy += loadDB[i];
    }
    var mx_ = Sx / n, my_ = Sy / n, sxx = 0, sxy = 0, syy = 0;
    for (i = 0; i < n; i++) { sxx += (x[i] - mx_) * (x[i] - mx_); sxy += (x[i] - mx_) * (loadDB[i] - my_); syy += (loadDB[i] - my_) * (loadDB[i] - my_); }
    var r2 = sxx > 0 && syy > 0 ? (sxy * sxy) / (sxx * syy) : 0;
    return { p2p: mx - mn, r2: r2, slope: sxx > 0 ? sxy / sxx : 0, n: n };
  }
  /* rows: array of [angle, level] or [angle, level, loading]. thresholdDB: peak-to-peak loading change that raises the flag. */
  function analyseStation(rows, thresholdDB) {
    var thr = thresholdDB > 0 ? thresholdDB : 0.5;
    var good = rows.filter(function (r) { return r.length >= 2; });
    var a = good.map(function (r) { return r[0]; }), l = good.map(function (r) { return r[1]; });
    var fit = fitPolarizer(a, l);
    if (fit.error) return { error: fit.error };
    var withLoad = good.filter(function (r) { return r.length >= 3; });
    var load = null;
    if (withLoad.length >= 5) {
      load = loadingStats(withLoad.map(function (r) { return r[0]; }), withLoad.map(function (r) { return r[2]; }), fit.phi0_deg);
      load.threshold = thr; load.flag = load.p2p > thr;
    }
    return { fit: fit, load: load };
  }
  function ratioInfo(num, den) {
    var ratio = num.kappa / den.kappa;
    var s = ratio * Math.sqrt(Math.pow(num.sKappa / num.kappa, 2) + Math.pow(den.sKappa / den.kappa, 2));
    var z = isFinite(s) && s > 0 ? Math.abs(ratio - 1) / s : Infinity;
    /* "differs" needs both a statistical difference (z >= 2) and at least a 20 % change (proposal thresholds). */
    return { ratio: ratio, sRatio: s, z: z, differs: z >= 2 && Math.abs(ratio - 1) >= 0.2, small: z >= 2 && Math.abs(ratio - 1) < 0.2, bigger: ratio > 1 };
  }
  /* res: {nearTX, mid, nearRX}, each the result of analyseStation. Returns ratios, loading flags and a plain-language verdict. */
  function compareStations(res) {
    var names = ["nearTX", "mid", "nearRX"], i;
    for (i = 0; i < 3; i++) if (!res[names[i]] || res[names[i]].error) return { error: "All three stations need a good fit (station " + names[i] + " does not)." };
    var f = { tx: res.nearTX.fit, mid: res.mid.fit, rx: res.nearRX.fit };
    var rTxMid = ratioInfo(f.tx, f.mid), rRxMid = ratioInfo(f.rx, f.mid), rTxRx = ratioInfo(f.tx, f.rx);
    var flagTX = !!(res.nearTX.load && res.nearTX.load.flag), flagRX = !!(res.nearRX.load && res.nearRX.load.flag), flagMid = !!(res.mid.load && res.mid.load.flag);
    var haveLoad = !!(res.nearTX.load || res.mid.load || res.nearRX.load);
    var code, verdict;
    var txDeepest = rTxMid.differs && rTxMid.bigger && rTxRx.differs && rTxRx.bigger;
    var allSame = !rTxMid.differs && !rRxMid.differs && !rTxRx.differs;
    if (flagTX) { code = "loading-tx"; verdict = "The loading indicator moves with rod angle at NEAR TX by more than the threshold: possible near-field coupling or detuning of the source. Do not read kappa at that station as attenuation until the artefact is understood (move the fixture further out, or re-run with the rods removed and the plates in)."; }
    else if (txDeepest) { code = "tx-deepest"; verdict = "Kappa is deepest at NEAR TX and the source loading looks stable" + (haveLoad ? "" : " (no loading column was supplied, so that is unchecked)") + ". This is the pattern the early-attenuation idea predicts. It is also what ordinary shadowing gives, because the array subtends a larger angle seen from near the source. Treat it as a pattern to repeat (second day, second r, W1), not as a result."; }
    else if (allSame) { code = "position-independent"; verdict = "Kappa agrees across the three stations within the thresholds (z below 2 or a change under 20 %). No support for the early-attenuation idea; the loss looks independent of where the fixture sits."; }
    else { code = "mixed"; verdict = "Kappa differs between stations but not in the NEAR TX deepest pattern. Check the reference level L0 at each station, plates-only baselines, and multipath (move r by a quarter wavelength and repeat): moving the fixture changes which paths cross the array and the standing-wave phase."; }
    var notes = [];
    if (flagRX) notes.push("The loading indicator also moves with rod angle at NEAR RX (RX loading or detuning).");
    if (flagMid) notes.push("The loading indicator moves with rod angle at MIDWAY.");
    return { txMid: rTxMid, rxMid: rRxMid, txRx: rTxRx, flags: { tx: flagTX, mid: flagMid, rx: flagRX }, code: code, verdict: verdict, notes: notes };
  }
  /* Station planner. Assumes the turntable axis passes through the centre of the 3 x 3 array (centre rod mid-length).
   * Envelope radius about that axis in plan view: R = sqrt(2) * (lambda/4), from a corner rod tip (rod half-length lambda/4,
   * outer column offset lambda/4). Closest approach of any rod to the nearer sphere centre = pivot - R.
   * Standoff rule (hub): closest approach >= lambda / (2 pi), measured from the sphere centre. */
  function stationPlan(fHz, r_m, rodLen_mm, factor, pivotOverride_mm) {
    var lam = 299792458 / fHz * 1000;                       /* mm */
    var standoff = lam / (2 * Math.PI), R = Math.SQRT2 * lam / 4;
    var L = rodLen_mm > 0 ? rodLen_mm : lam / 2;
    var minPivot = standoff + R;
    var pivot = pivotOverride_mm > 0 ? pivotOverride_mm : (factor > 0 ? factor : 1.2) * L;
    var closest = pivot - R, rmm = r_m * 1000, warns = [];
    if (closest < standoff) warns.push("Closest approach " + closest.toFixed(1) + " mm is inside the " + standoff.toFixed(1) + " mm standoff. Move the near stations out to at least " + minPivot.toFixed(1) + " mm.");
    if (rmm < 2 * pivot + 2 * R) warns.push("r is too short to fit the near stations and the fixture at both ends. Increase r.");
    else if (rmm / 2 - pivot < R) warns.push("MIDWAY is closer than one fixture radius to a near station: the three positions overlap. Increase r.");
    return { lambda_mm: lam, standoff_mm: standoff, envelopeR_mm: R, minPivot_mm: minPivot, rod_mm: L, pivot_mm: pivot, closest_mm: closest,
      stations_mm: { nearTX: pivot, mid: rmm / 2, nearRX: rmm - pivot }, warnings: warns };
  }

  function calorimetryPower(mass_kg, deltaT_K, time_s, cp) { return mass_kg * (cp || 4186) * deltaT_K / time_s; }
  function dbmToMW(dBm) { return Math.pow(10, dBm / 10); }
  function mwToDbm(mW) { return 10 * Math.log10(mW); }

  root.R1Joule = { MATERIALS: MATERIALS, skinDepth_m: skinDepth_m, surfaceResistance: surfaceResistance, rodResistance: rodResistance, rodAbsorbedFractionTEM: rodAbsorbedFractionTEM,
    dissipatedFraction: dissipatedFraction, rodsInOut: rodsInOut, fitPolarizer: fitPolarizer, compareMaterials: compareMaterials,
    loadingStats: loadingStats, analyseStation: analyseStation, ratioInfo: ratioInfo, compareStations: compareStations, stationPlan: stationPlan,
    calorimetryPower: calorimetryPower, dbmToMW: dbmToMW, mwToDbm: mwToDbm, LOG10E10: LOG10E10 };
  if (typeof module !== "undefined" && module.exports) module.exports = root.R1Joule;
})(typeof window !== "undefined" ? window : globalThis);
