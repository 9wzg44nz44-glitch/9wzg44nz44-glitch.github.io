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

  function calorimetryPower(mass_kg, deltaT_K, time_s, cp) { return mass_kg * (cp || 4186) * deltaT_K / time_s; }
  function dbmToMW(dBm) { return Math.pow(10, dBm / 10); }
  function mwToDbm(mW) { return 10 * Math.log10(mW); }

  root.R1Joule = { MATERIALS: MATERIALS, skinDepth_m: skinDepth_m, surfaceResistance: surfaceResistance, rodResistance: rodResistance, rodAbsorbedFractionTEM: rodAbsorbedFractionTEM,
    dissipatedFraction: dissipatedFraction, rodsInOut: rodsInOut, fitPolarizer: fitPolarizer, compareMaterials: compareMaterials,
    calorimetryPower: calorimetryPower, dbmToMW: dbmToMW, mwToDbm: mwToDbm, LOG10E10: LOG10E10 };
  if (typeof module !== "undefined" && module.exports) module.exports = root.R1Joule;
})(typeof window !== "undefined" ? window : globalThis);
