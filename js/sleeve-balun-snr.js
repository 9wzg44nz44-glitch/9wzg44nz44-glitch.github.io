/*! sleeve-balun-snr.js — v0.3 (Joule-literal SLW loss is the DEFAULT; Erratum α=0 is a labelled toggle)
 * v0.3 (2026-09-25): default Ohmic mode = Joule-literal (Hively & Loebl 2019 Eq. 44 J·E, hub rule), TEM-equal shown as
 * classical comparison, Erratum α=0 (Phys. Essays 35, 320, 2022) kept as non-default toggle, old Exp-C α toy kept as option.
 * Seawater α_J / α_TEM: code copied verbatim from js/expt-g-engine.js (expt-g-v0.1; Meissner & Wentz 2004), 15 °C, S = 35.
 * Formulas ONLY from hub js/fields.js + experiment-c-snr.html + Linearly Resistive LEN.
 * TinySA Ultra gen max −19 dBm (tinysa.org TinySA4). No RG-450; RG-405 host / RG-316 jumpers.
 * Patent λ/4 sphere ≠ LAB KB-1820 / KB-2016. US 12,562,930 not used for balun dims.
 * Dual Ohmic: Errata α=0 (EED) vs Exp-C Ohmic (empirical/HYP). No attenFactor 0.95.
 */
(function () {
  "use strict";

  const C = 299792458;
  const MU0 = 4 * Math.PI * 1e-7;
  const Z0 = 376.73031346177;
  const RL = 50;
  const B_HZ = 1e5;
  const N0 = -174;
  const A_EFF = Math.PI * 0.05 ** 2;
  const ETA = 0.5;
  const R_RESP = 264030;
  const ATT = { open: 0, slotted: 25, sealed: 55 };
  const GTX = 1.5;

  /** Linearly Resistive LEN — FACT fixed lengths (not invented) */
  const SUB_LEN = {
    copper_wall: 0.003175,
    air_inside: 100.584,
    steel_wall: 0.0762,
    seawater_exit: 91.44
  };

  /** TinySA Ultra ZS406 — FACT from tinysa.org TinySA4.Specification */
  const TINYSA = {
    pMin: -115,
    pMax: -19,
    pDefault: -10,
    analyzerAbsMax: 6,
    IrmsAtM19: 0.0005017819071656863,
    IpkAtM19: 0.0007096267784671506
  };

  /* ---- Seawater model: copied verbatim from js/expt-g-engine.js (expt-g-v0.1) so both pages give identical numbers.
   * FACT: Meissner & Wentz, IEEE TGRS 42, 1836 (2004) Eqs 6-8, 11-17 (ε′, ε″, σ of seawater).
   * TEM α: FACT plane-wave attenuation.  |Z|: HYP Hively & Loebl 2019 Eq. 37 (far field).
   * α_J = σ_H|Z|/2 with σ_H = ε0 ε″ ω: ASSUMPTION (ours; Joule-literal reading of Eq. 44, see experiment-g.html).
   * These α are FIELD coefficients (E ∝ e^(−αL)). This page's α_ohm multiplies POWER density S, so α_ohm = 2α. */
  const GC = { c: 299792458, eps0: 8.8541878128e-12, mu0: 1.25663706212e-6 };
  GC.eta0 = GC.mu0 * GC.c;
  const SEA_T = 15.0, SEA_S = 35.0;   // ASSUMPTION: same water as Experiment G (15 °C, salinity 35)
  const MW_A = [5.7230e+00, 2.2379e-02, -7.1237e-04, 5.0478e+00, -7.0315e-02, 6.0059e-04, 3.6143e+00,
    2.8841e-02, 1.3652e-01, 1.4825e-03, 2.4166e-04];
  const MW_B = [-3.56417e-03, 4.74868e-06, 1.15574e-05, 2.39357e-03, -3.13530e-05, 2.52477e-07,
    -6.28908e-03, 1.76032e-04, -9.22144e-05, -1.99723e-02, 1.81176e-04, -2.04265e-03, 1.57883e-04];
  function mw_sigma(T, S) {
    var s35 = 2.903602 + 8.607e-2 * T + 4.738817e-4 * T * T - 2.991e-6 * T * T * T + 4.3047e-9 * T * T * T * T;
    var R15 = S * (37.5109 + 5.45216 * S + 1.4409e-2 * S * S) / (1004.75 + 182.283 * S + S * S);
    var a0 = (6.9431 + 3.2841 * S - 9.9486e-2 * S * S) / (84.850 + 69.024 * S + S * S);
    var a1 = 49.843 - 0.2276 * S + 0.198e-2 * S * S;
    return s35 * R15 * (1 + a0 * (T - 15) / (a1 + T));
  }
  function cdiv(a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }
  function csqrt(z) { var r = Math.hypot(z[0], z[1]); var re = Math.sqrt((r + z[0]) / 2); var im = Math.sqrt(Math.max(0, (r - z[0]) / 2)); if (z[1] < 0) im = -im; return [re, im]; }
  function mw_eps(fG, T, S) {
    var a = MW_A, b = MW_B;
    var es0 = (3.70886e4 - 8.2168e1 * T) / (4.21854e2 + T);
    var e10 = a[0] + a[1] * T + a[2] * T * T;
    var n10 = (45 + T) / (a[3] + a[4] * T + a[5] * T * T);
    var einf0 = a[6] + a[7] * T;
    var n20 = (45 + T) / (a[8] + a[9] * T + a[10] * T * T);
    var es = es0 * Math.exp(b[0] * S + b[1] * S * S + b[2] * T * S);
    var n1 = n10 * (1 + S * (b[3] + b[4] * T + b[5] * T * T));
    var e1 = e10 * Math.exp(b[6] * S + b[7] * S * S + b[8] * T * S);
    var n2 = n20 * (1 + S * (b[9] + b[10] * T));
    var einf = einf0 * (1 + S * (b[11] + b[12] * T));
    var sig = S > 0 ? mw_sigma(T, S) : 0;
    var t1 = cdiv([es - e1, 0], [1, fG / n1]), t2 = cdiv([e1 - einf, 0], [1, fG / n2]);
    var re = t1[0] + t2[0] + einf, im = t1[1] + t2[1] - sig / (2 * Math.PI * GC.eps0 * fG * 1e9);
    return { re: re, im: im, sigma: sig };
  }
  function seawater(f) {
    var T = SEA_T, S = SEA_S;
    var e = mw_eps(f / 1e9, T, S), ep = e.re, epp = -e.im, w = 2 * Math.PI * f;
    var sq = csqrt([ep, -epp]);
    var alpha_tem = -(w / GC.c) * sq[1];
    var tand = epp / ep;
    var Zslw = GC.eta0 / Math.sqrt(ep) / Math.hypot(1, tand);        // HYP Eq.37 far field
    var sigH = GC.eps0 * epp * w;                                      // Hively sigma = eps0 eps'' omega
    var alpha_J = sigH * Zslw / 2;                                     // ASSUMPTION (ours)
    return { sigma: e.sigma, ep: ep, epp: epp, alpha_tem: alpha_tem, alpha_J: alpha_J };
  }
  const NP2DB = 20 / Math.log(10);
  const MODE_LABEL = { joule: "Joule-literal (default)", tem: "TEM-equal (classical comparison)", errata0: "Erratum α=0 (non-default toggle)", toy: "Exp-C α toy (HYP)" };

  const SPHERE_LAB = {
    1296000000: { id: "KB-1820", kind: "LAB", diaIn: 0.75, note: "LAB ¾″ Al · Exp A — NOT patent λ/4 sphere", od_m: 0.01905 },
    2450000000: { id: "KB-1820", kind: "LAB", diaIn: 0.75, note: "LAB ¾″ Al · 2.45 GHz — NOT patent λ/4 sphere", od_m: 0.01905 },
    433590000: { id: "KB-2016", kind: "LAB", diaIn: 2.5, note: "LAB 2.50″ Al · Exp B — NOT patent λ/4 sphere", od_m: 0.0635 }
  };

  const PHYSICS_VERSION = "snr-dual-sim-params-v0.2";   // shared base formula lock (physics-constants.json, E-field maps ID) — unchanged
  const PAGE_VERSION = "sleeve-balun-snr-v0.3";           // v0.3: Joule-literal SLW-loss default (+ TEM-equal, Erratum toggle)
  const FT_TO_M = 0.3048;
  const GAP_M = 0.001;
  const RG405_OD_M = 0.086 * 0.0254;
  const COAX_R = RG405_OD_M / 2;
  const SLEEVE_R = COAX_R + 0.0005;
  const SLEEVE_MM = { 1296000000: 57.8, 2450000000: 30.6, 433590000: 172.9 };

  /** JSON distance_presets — LOCK exact numbers */
  function distancePresetRM(id, f) {
    const lam = C / f;
    const sphere = SPHERE_LAB[f] || SPHERE_LAB[1296000000];
    const D = sphere.od_m;
    switch (id) {
      case "near_far_lambda": return lam;
      case "fraunhofer_2D2_over_lambda": return 2 * D * D / lam;
      case "home_garage": return 10;
      case "home_outdoor": return 50;
      case "ship_20km": return 20000;
      case "aircraft_slant_30km_35kft":
        return Math.sqrt(30000 * 30000 + (35000 * FT_TO_M) * (35000 * FT_TO_M));
      case "leo_500km": return 500000;
      case "geo_35786km": return 35786000;
      default: return lam;
    }
  }

  function patentSphereDiaM(f) {
    return (C / f) / 2; // diameter = 2*(λ/4) = λ/2
  }

  const $ = (id) => document.getElementById(id);

  function wattsFromDbm(dbm) { return Math.pow(10, (dbm - 30) / 10); }
  function dbmFromWatts(w) { return w <= 0 ? -999 : 10 * Math.log10(w * 1000); }
  function meshPower(attEach) { return Math.pow(10, (-2 * attEach) / 10); }
  function sleeveQuarterM(f, vf) { return ((C / f) / 4) * (vf || 1); }

  /** Ohmic power exponent aL (S = S_geom·e^(−aL)) for the checked media stack.
   *  joule (DEFAULT): seawater α_ohm = 2α_J; tem: 2α_TEM; air/free space ≈ 0 (ASSUMPTION σ_air ≈ 0);
   *  metal walls: no metal model in Experiment G → UNKNOWN, contributes 0 (flagged);
   *  errata0 / SW → 0; toy → old Exp-C α_toy·L stack (HYP). */
  function readOhmic(sw, ohmMode, f) {
    if (sw || ohmMode === "errata0") {
      return {
        alphaEff: 0, seaOn: !!($("med_seawater") && $("med_seawater").checked), metalOn: false,
        parts: [sw
          ? "SW mode → α forced 0 (Experiment C dictionary: SW has neither skin nor Joule loss)"
          : "Erratum toggle (non-default): α=0 — Hively & Loebl 2022 Erratum says SLW has no resistive loss"]
      };
    }
    const parts = [];
    let aL = 0;
    const seaOn = !!($("med_seawater") && $("med_seawater").checked);
    const metalOn = !!(($("med_copper") && $("med_copper").checked) || ($("med_steel") && $("med_steel").checked));
    if (ohmMode === "joule" || ohmMode === "tem") {
      const wt = seawater(f);
      const aF = ohmMode === "joule" ? wt.alpha_J : wt.alpha_tem;
      const tag = ohmMode === "joule" ? "α_J (Joule-literal)" : "α_TEM (TEM-equal)";
      if (seaOn) {
        aL += 2 * aF * SUB_LEN.seawater_exit;
        parts.push("seawater L=" + SUB_LEN.seawater_exit + " m · " + tag + "=" + aF.toFixed(2) + " Np/m field (" + (100 / aF).toFixed(2) +
          " cm 1/e) → " + (4.343 * 2 * aF * SUB_LEN.seawater_exit).toFixed(0) + " dB (15 °C, S=35, Meissner–Wentz; code from experiment-g)");
      }
      const airOn = ["med_air", "med_air_inside", "med_free_space"].some(function (id) { return $(id) && $(id).checked; }) || ($("cageOhm") && $("cageOhm").checked);
      if (airOn) parts.push("air / free space / cage interior: α≈0 (air hardly conducts; ASSUMPTION σ_air≈0)");
      if (metalOn) parts.push("copper/steel wall: " + tag + " NOT computed — Experiment G has no metal model (UNKNOWN; adds 0 here)");
      if ($("med_ocean_air") && $("med_ocean_air").checked) parts.push("ocean–air interface: a boundary, not a lossy path → 0");
      const aExtraJ = $("alphaExtra") ? +$("alphaExtra").value : 0;
      const LextraJ = $("Lextra") ? +$("Lextra").value : 0;
      if (aExtraJ > 0 && LextraJ > 0) {
        aL += aExtraJ * LextraJ;
        parts.push("extra α=" + aExtraJ.toFixed(3) + " · L=" + LextraJ.toFixed(2) + " m (HYP)");
      }
      return { alphaEff: aL, seaOn: seaOn, metalOn: metalOn, parts: parts.length ? parts : ["no media segments selected (αL=0)"] };
    }
    const aToy = $("alphaToy") ? +$("alphaToy").value : 0.05;

    function addSeg(checked, L, name) {
      if (!checked) return;
      aL += aToy * L;
      parts.push(name + " L=" + L + " m · α=" + aToy.toFixed(3) + " (HYP Exp-C Ohmic)");
    }

    addSeg($("med_air") && $("med_air").checked, 0, "air");
    addSeg($("med_copper") && $("med_copper").checked, SUB_LEN.copper_wall, "copper wall ⅛″");
    addSeg($("med_air_inside") && $("med_air_inside").checked, SUB_LEN.air_inside, "air inside sub 330 ft");
    addSeg($("med_steel") && $("med_steel").checked, SUB_LEN.steel_wall, "steel 3″");
    addSeg($("med_seawater") && $("med_seawater").checked, SUB_LEN.seawater_exit, "seawater exit 300 ft");
    addSeg($("med_ocean_air") && $("med_ocean_air").checked, 1, "ocean–air interface toy L=1 m");
    addSeg($("med_free_space") && $("med_free_space").checked, 0, "free-space");

    if ($("cageOhm") && $("cageOhm").checked) {
      const Lper = $("cagePath") ? +$("cagePath").value : 1;
      const Lboth = 2 * Lper;
      aL += aToy * Lboth;
      parts.push("RadioScreen cage Ohmic TX+RX L=" + Lboth.toFixed(2) + " m (HYP; separate from TEM mesh ATT)");
    }

    const aExtra = $("alphaExtra") ? +$("alphaExtra").value : 0;
    const Lextra = $("Lextra") ? +$("Lextra").value : 0;
    if (aExtra > 0 && Lextra > 0) {
      aL += aExtra * Lextra;
      parts.push("extra α=" + aExtra.toFixed(3) + " · L=" + Lextra.toFixed(2) + " m (HYP)");
    }

    return {
      alphaEff: aL, seaOn: seaOn, metalOn: metalOn,
      parts: parts.length ? parts : ["Exp-C α toy ON but no segments selected (αL=0)"]
    };
  }

  function compute() {
    const f = +$("freq").value;
    const highI = $("highI").checked;
    let Ptx_dBm, Irms, Ipk, P;
    if (highI) {
      Ipk = +$("Iexplore").value;
      Irms = Ipk / Math.SQRT2;
      P = Irms * Irms * RL;
      Ptx_dBm = dbmFromWatts(P);
    } else {
      Ptx_dBm = +$("ptx").value;
      if (Ptx_dBm > TINYSA.pMax) Ptx_dBm = TINYSA.pMax;
      P = wattsFromDbm(Ptx_dBm);
      Irms = Math.sqrt(P / RL);
      Ipk = Irms * Math.SQRT2;
    }
    let r;
    if ($("log10r")) {
      r = Math.pow(10, +$("log10r").value);
      if ($("r")) $("r").value = String(r);
    } else {
      r = +$("r").value;
    }
    const cage = $("cage").value;
    const att = ATT[cage] || 0;
    const mP = meshPower(att);
    const mode = $("mode").value;
    const sw = mode === "sw";
    const ohmMode = $("ohmicMode") ? $("ohmicMode").value : "joule";
    const errataAlpha0 = ohmMode === "errata0";
    const lnaOn = $("lna").checked;
    const nf = lnaOn ? 5 : 3;
    const lnaGain = lnaOn ? 20 : 0;
    const noise = N0 + 10 * Math.log10(B_HZ) + nf;

    const LAMBDA = C / f;
    const K0 = 2 * Math.PI * f / C;
    const D = 0.25 * LAMBDA;
    const far = 2 * D * D / LAMBDA;
    const near = r < far;

    const AeffTem = 3 * LAMBDA * LAMBDA / (8 * Math.PI);
    const PrxTem = P * GTX * AeffTem / (4 * Math.PI * r * r) * mP;
    const snrTem = dbmFromWatts(PrxTem * Math.pow(10, lnaGain / 10)) - noise;

    const Prad = (Ipk * Ipk / (4 * Math.PI)) * Z0;
    const Sgeom = Prad / (4 * Math.PI * r * r);

    const ohm = readOhmic(sw, ohmMode, f);
    const ohmJ = readOhmic(sw, "joule", f), ohmT = readOhmic(sw, "tem", f);   // side-by-side comparison
    const Surv = Math.exp(-ohm.alphaEff);
    const S = Sgeom * Surv;
    const ohmDb = 4.343 * ohm.alphaEff;

    const Pload = S * A_EFF * ETA * mP * Math.pow(10, lnaGain / 10);
    // Same equation in dB when e^(−αL) underflows to 0 (seawater): dBm(P0·e^(−x)) = dBm(P0) − (10/ln10)·x
    const lossDbExact = (10 / Math.LN10) * ohm.alphaEff;
    const dbmS = function (P, P0) { return Surv > 0 ? dbmFromWatts(P) : dbmFromWatts(P0) - lossDbExact; };
    const PloadDbm = dbmS(Pload, Sgeom * A_EFF * ETA * mP * Math.pow(10, lnaGain / 10));
    const snrH = PloadDbm - noise;

    const Am = (MU0 * Ipk) / (2 * Math.PI * K0 * r);
    const Pnz0 = Math.pow((R_RESP / Math.SQRT2) * Am, 2) * RL * mP * Math.pow(10, lnaGain / 10);
    const Pnz = Pnz0 * Surv;
    const Az = 1e-10 * (Ipk / 0.028) * (1.5 / r) * (1.3 / (f / 1e9));
    const Pz0 = Math.pow(420000 * Az, 2) * RL * mP * Math.pow(10, lnaGain / 10);
    const Pz = Pz0 * Surv;
    const PnzDbm = dbmS(Pnz, Pnz0), PzDbm = dbmS(Pz, Pz0);
    const EparLog10 = 0.5 * Math.log10(Math.max(Sgeom, 1e-300) * Z0) - (lossDbExact / 20);

    const Epar = Math.sqrt(Math.max(S, 0) * Z0);

    const sphere = SPHERE_LAB[f] || SPHERE_LAB[1296000000];
    const sleeveM = sleeveQuarterM(f, 1);
    const patentDiaM = patentSphereDiaM(f);

    return {
      f, Ptx_dBm, P, Irms, Ipk, r, att, mP, sw, errataAlpha0, ohmMode, ohmJ, ohmT, nf, noise, lnaGain,
      PloadDbm, PnzDbm, PzDbm, EparLog10,
      near, far, LAMBDA, PrxTem, snrTem, Prad, Sgeom, S, Surv, ohmDb, ohm,
      Pload, snrH, Am, Pnz, Az, Pz, Epar, sphere, sleeveM, patentDiaM, highI, cage
    };
  }

  function fmt(x, d) { return Number.isFinite(x) ? x.toExponential(d) : "\u2014"; }
  function fmtN(x, d) { return Number.isFinite(x) ? Number(x).toFixed(d) : "\u2014"; }

  function cableWarnings(s) {
    const w = [];
    if (!s.highI) {
      if (s.Ptx_dBm > TINYSA.pMax + 1e-9) {
        w.push("HARD: TinySA Ultra generator max listed step is −19 dBm (tinysa.org TinySA4). Slider clamped.");
      }
      w.push("Ultra alone @ " + fmtN(s.Ptx_dBm, 1) + " dBm → I_rms≈" + fmtN(s.Irms * 1e3, 3) +
        " mA into 50 Ω. Cable thermal limit is never the bottleneck at Ultra levels (≪ RG-316 / RG-405 ratings).");
      if (s.Ptx_dBm >= TINYSA.pMax - 0.01) {
        w.push("At −19 dBm: I_rms≈0.50 mA · I_peak≈0.71 mA (50 Ω). Analyzer abs max +6 dBm @ 0 dB atten — separate from generator.");
      }
    } else {
      w.push("Exploratory high-I (I_pk=" + fmtN(s.Ipk, 2) + " A) implies external PA — NOT TinySA Ultra. " +
        "Re-rate RG-405 host / RG-316 jumpers, connectors, BPF, legal ERP. Ultra alone never reaches these currents.");
      const Pdbm = s.Ptx_dBm;
      if (Pdbm > 30) w.push("Implied P≈" + fmtN(Pdbm, 1) + " dBm — HARD: thicker coax / PA path required.");
    }
    return w;
  }

  function renderHeadline(s, dbJ, dbT) {
    const el = $("sbHeadline"); if (!el) return;
    const fM = (s.f / 1e6).toFixed(2) + " MHz";
    if (s.sw) {
      el.innerHTML = "Wave mode is <strong>SW</strong>: per Experiment C's dictionary SW has neither skin nor Joule loss, so α = 0 in every mode. SNR<sub>Hively</sub> ≈ " + fmtN(s.snrH, 1) + " dB.";
      return;
    }
    if (!s.ohm.seaOn || (dbJ === 0 && dbT === 0)) {
      el.innerHTML = "<strong>Default: Hively's Joule-loss term is ON.</strong> On this path there is no seawater, only air, and air hardly conducts electricity (ASSUMPTION: σ<sub>air</sub> ≈ 0). So the Joule loss here is <strong>0 dB</strong>, and the Joule default, the TEM-equal comparison and the Erratum toggle give <strong>the same numbers</strong>: SNR<sub>Hively</sub> ≈ " + fmtN(s.snrH, 1) + " dB at " + fM + ". The choice only matters when seawater is in the path (media scenario “Submarine stack”)." +
        (s.ohm.metalOn ? " Copper/steel walls are ticked, but no metal Joule model exists yet (UNKNOWN), so they add 0 here." : "");
      return;
    }
    el.innerHTML = "<strong>Default: Hively's Joule-loss term is ON.</strong> The path includes " + SUB_LEN.seawater_exit + " m of seawater. At " + fM + " that costs <strong>" + fmtN(dbJ, 0) + " dB</strong> with the Joule loss (TEM-equal, the classical comparison: " + fmtN(dbT, 0) + " dB; Erratum toggle: 0 dB). Selected mode: " + MODE_LABEL[s.ohmMode] + " → SNR<sub>Hively</sub> ≈ " + fmtN(s.snrH, 0) + " dB, i.e. " + (s.snrH < 0 ? "<strong>no detectable SLW signal</strong>" : "detectable") + ". Under the Joule reading a 1&nbsp;GHz-class SLW falls by a factor e every ~1–3&nbsp;cm of seawater (table below).";
  }

  function render(s) {
    $("ptxOut").textContent = fmtN(s.Ptx_dBm, 1) + " dBm (Ultra max −19)";
    $("rOut").textContent = s.r.toExponential(4) + " m · " + fmtN(s.r / FT_TO_M, 1) + " ft · log10=" + fmtN(Math.log10(s.r), 2);
    $("Iout").textContent = "I_rms=" + fmt(s.Irms, 3) + " A · I_pk=" + fmt(s.Ipk, 3) + " A" +
      (s.highI ? "" : "  (at −19 dBm: ≈0.50 mA rms / 0.71 mA pk)");
    $("sphereOut").textContent = s.sphere.id + " · " + s.sphere.diaIn + "″ · " + s.sphere.note;
    $("patentOut").textContent = "PATENT US 12,525,711 optional sphere Ø=λ/2 ≈ " +
      fmtN(s.patentDiaM * 1000, 1) + " mm (" + fmtN(s.patentDiaM / 0.0254, 2) + "″) — NOT the LAB ball";
    $("sleeveOut").textContent = "λ/4 sleeve on RG-405/U (VF=1) ≈ " + fmtN(s.sleeveM * 1000, 1) +
      " mm · λ=" + fmtN(s.LAMBDA * 1000, 1) + " mm";

    if ($("IexploreOut")) $("IexploreOut").textContent = fmtN(+$("Iexplore").value, 2) + " A pk";
    if ($("alphaExtraOut")) $("alphaExtraOut").textContent = (+$("alphaExtra").value).toFixed(3) + " Np/m";
    if ($("LextraOut")) $("LextraOut").textContent = (+$("Lextra").value).toFixed(2) + " m";
    if ($("cagePathOut")) $("cagePathOut").textContent = (+$("cagePath").value).toFixed(2) + " m/tent";
    if ($("alphaToyOut")) $("alphaToyOut").textContent = (+$("alphaToy").value).toFixed(3) + " Np/m (HYP)";

    const nearNote = s.near
      ? " <em>r</em> inside ~" + fmtN(s.far, 3) + " m far-field estimate — Friis is a caveat, not a measurement."
      : "";

    $("temOut").innerHTML =
      "I<sub>rms</sub>=" + fmt(s.Irms, 3) + " A · P<sub>rx,TEM</sub>(mesh)=" + fmtN(dbmFromWatts(s.PrxTem), 1) + " dBm<br>" +
      "SNR<sub>TEM</sub>≈<strong>" + fmtN(s.snrTem, 1) + " dB</strong> (B=100 kHz, NF=" + s.nf + " dB" +
      (s.lnaGain ? ", LNA +20 dB" : "") + ")." + nearNote;

    const ohmLabel = s.sw ? "SW α=0" : MODE_LABEL[s.ohmMode];
    const dbJ = s.sw ? 0 : 4.343 * s.ohmJ.alphaEff, dbT = s.sw ? 0 : 4.343 * s.ohmT.alphaEff;
    const Etxt = s.Surv > 0 ? fmt(s.Epar, 3) : "10^" + s.EparLog10.toFixed(0);
    $("slwOut").innerHTML =
      "P<sub>rad</sub> (Eq.15)=" + fmt(s.Prad, 3) + " W · S<sub>geom</sub>=" + fmt(s.Sgeom, 3) + " W/m²<br>" +
      "Ohmic [" + ohmLabel + "] survival=" + fmtN(100 * s.Surv, 2) + "% (" + fmtN(s.ohmDb, 2) + " dB) · S=" + fmt(s.S, 3) + " W/m²<br>" +
      "Loss on this path: <strong>Joule (default) " + fmtN(dbJ, 1) + " dB</strong> · TEM-equal " + fmtN(dbT, 1) + " dB · Erratum toggle 0 dB<br>" +
      "E∥≈√(S·Z<sub>0</sub>)=<strong>" + Etxt + " V/m</strong> <em>(illustrative cartoon)</em><br>" +
      "A<sub>m</sub>(NZ)=" + fmt(s.Am, 3) + " Wb/m · A<sub>z</sub>(Z)=" + fmt(s.Az, 3) + " Wb/m<br>" +
      "SNR<sub>Hively</sub>≈<strong>" + fmtN(s.snrH, 1) + " dB</strong> · P<sub>load</sub>=" + fmtN(s.PloadDbm, 1) +
      " dBm · P<sub>sig,NZ</sub>=" + fmtN(s.PnzDbm, 1) + " · P<sub>sig,Z</sub>=" + fmtN(s.PzDbm, 1) + "<br>" +
      "Two tents × " + s.att + " dB → power × " + fmt(s.mP, 2) + ".<br>" +
      "<span class=\"footnote\">Ohmic stack: " + s.ohm.parts.join("; ") + "</span>";

    const warns = cableWarnings(s);
    const box = $("cableWarn");
    box.innerHTML = "<strong>Cable / drive</strong><ul>" + warns.map(function (t) { return "<li>" + t + "</li>"; }).join("") +
      "</ul><p class=\"footnote\" style=\"margin:.4rem 0 0\">Sleeve host <strong>RG-405/U</strong>; jumpers <strong>RG-316-class</strong>. " +
      "There is <strong>no</strong> standard RG-450/U. US&nbsp;12,562,930 is sensor/DAQ — not balun dims.</p>";
    box.hidden = false;

    $("meterE").textContent = Etxt + " V/m";
    $("meterAm").textContent = fmt(s.Am, 3) + " Wb/m";
    $("meterAz").textContent = fmt(s.Az, 3) + " Wb/m";
    $("meterSnr").textContent = fmtN(s.snrH, 1) + " dB";
    $("meterPload").textContent = fmtN(s.PloadDbm, 1) + " dBm";
    $("meterOhm").textContent = fmtN(s.ohmDb, 2) + " dB";
    renderHeadline(s, dbJ, dbT);
  }

  function canvas(id) {
    const c = $(id);
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || 330;
    const h = c.clientHeight || 260;
    c.width = Math.max(1, w * d);
    c.height = Math.max(1, h * d);
    const x = c.getContext("2d");
    x.setTransform(d, 0, 0, d, 0, 0);
    x.fillStyle = "#0b1020";
    x.fillRect(0, 0, w, h);
    return { x: x, w: w, h: h };
  }
  function axes(g, titleX, titleY) {
    const x = g.x, w = g.w, h = g.h;
    x.strokeStyle = "#75839e"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(52, 15); x.lineTo(52, h - 40); x.lineTo(w - 12, h - 40); x.stroke();
    x.fillStyle = "#a9b7cc"; x.font = "11px IBM Plex Mono, monospace";
    x.fillText(titleY, 6, 13); x.fillText(titleX, w - 110, h - 12);
  }
  function labels(g, minY, maxY) {
    const x = g.x, w = g.w, h = g.h;
    x.fillStyle = "#a9b7cc"; x.font = "10px IBM Plex Mono, monospace";
    for (let i = 0; i <= 4; i++) {
      const v = minY + i * (maxY - minY) / 4;
      const py = h - 40 - i * (h - 55) / 4;
      const t = Math.abs(v) >= 1000 || (Math.abs(v) > 0 && Math.abs(v) < 0.01) ? v.toExponential(1) : v.toFixed(1);
      x.fillText(t, 2, py + 3);
      x.strokeStyle = "rgba(255,255,255,.08)";
      x.beginPath(); x.moveTo(52, py); x.lineTo(w - 12, py); x.stroke();
    }
  }
  function plotLine(g, pts, minY, maxY, color) {
    const x = g.x, w = g.w, h = g.h;
    const L = 52, R = w - 12, T = 18, B = h - 40;
    x.strokeStyle = color; x.lineWidth = 2; x.beginPath();
    pts.forEach(function (v, i) {
      const px = L + i * (R - L) / (pts.length - 1);
      const py = B - (v - minY) / (maxY - minY || 1) * (B - T);
      if (i) x.lineTo(px, py); else x.moveTo(px, py);
    });
    x.stroke();
  }
  function dualX(g, rMin, rMax) {
    const x = g.x, w = g.w, h = g.h;
    x.fillStyle = "#8aa"; x.font = "9px IBM Plex Mono, monospace";
    for (let i = 0; i <= 4; i++) {
      const rm = rMin + i * (rMax - rMin) / 4;
      const px = 52 + i * (w - 64) / 4;
      x.fillText(rm.toFixed(0) + "m", px - 8, h - 28);
      x.fillText((rm * 3.28084).toFixed(0) + "ft", px - 10, h - 16);
    }
  }


  function turbo(t) {
    t = Math.max(0, Math.min(1, t));
    const r = Math.max(0, Math.min(1, 0.13572138 + t * (4.61539260 + t * (-42.73933202 + t * (132.13108234 + t * (-152.94239396 + t * 59.28637943))))));
    const g = Math.max(0, Math.min(1, 0.09140261 + t * (2.21555694 + t * (4.07525298 + t * (-24.08076409 + t * (34.01357394 + t * -13.74514578))))));
    const b = Math.max(0, Math.min(1, 0.10667330 + t * (12.20615972 + t * (-60.50009986 + t * (110.23206676 + t * (-89.57544944 + t * 27.34824973))))));
    return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
  }

  function makeMapBand(s) {
    const f = s.f;
    const lam = s.LAMBDA;
    const sleeveL = (SLEEVE_MM[f] != null ? SLEEVE_MM[f] : (lam * 1000 / 4)) / 1000;
    const sphereR = ((s.sphere.od_m) || (s.sphere.diaIn * 0.0254)) / 2;
    const zTip = -sphereR;
    const zSleeveOpen = -(sphereR + GAP_M);
    const zSleeveClosed = zSleeveOpen - sleeveL;
    const zCoaxEnd = zSleeveClosed - 0.15 * lam;
    const win = 3.2 * lam;
    return {
      f, lam, sleeveL, sphereR, sphereD: 2 * sphereR,
      ipk: s.Ipk, prad: s.Prad,
      zTip, zSleeveOpen, zSleeveClosed, zCoaxEnd, win,
      rReactive: lam / (2 * Math.PI),
      rFresnel: lam,
      rFraunhofer: 2 * (2 * sphereR) * (2 * sphereR) / lam,
      r2lam: 2 * lam,
      r3lam: 3 * lam
    };
  }

  function maskMetal(band, x, z) {
    const rAbs = Math.abs(x);
    const rs = band.sphereR;
    if (x * x + z * z <= rs * rs) return true;
    if (rAbs <= COAX_R && z >= band.zCoaxEnd && z <= band.zTip) return true;
    if (rAbs > COAX_R && rAbs <= SLEEVE_R && z >= band.zSleeveClosed && z <= band.zSleeveOpen) return true;
    if (rAbs <= SLEEVE_R && rAbs >= COAX_R * 0.5 && Math.abs(z - band.zSleeveClosed) <= 0.00025) return true;
    return false;
  }

  function EparAtR(prad, r) {
    if (r < 1e-12) return 0;
    const S = prad / (4 * Math.PI * r * r);
    return Math.sqrt(Math.max(S, 0) * Z0);
  }

  function drawRing(ctx, sx, sy, r, color, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    // approximate circle in plot coords via many segments
    const n = 96;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = r * Math.cos(a), z = r * Math.sin(a);
      if (i === 0) ctx.moveTo(sx(x), sy(z)); else ctx.lineTo(sx(x), sy(z));
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawEfieldMap(s) {
    const canvas = $("efieldMap");
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 640;
    const cssH = cssW;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const band = makeMapBand(s);
    const pad = 36;
    const plotW = cssW - 2 * pad;
    const plotH = cssH - 2 * pad;
    const win = band.win;
    const sx = (x) => pad + ((x + win) / (2 * win)) * plotW;
    const sy = (z) => pad + ((win - z) / (2 * win)) * plotH;

    const eMax = EparAtR(band.prad, Math.max(band.sphereR * 1.08, 0.002));
    const eMin = Math.max(EparAtR(band.prad, 3 * band.lam), eMax * 1e-6);

    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, cssW, cssH);

    const step = Math.max(3, Math.floor(Math.min(plotW, plotH) / 120));
    for (let py = 0; py < plotH; py += step) {
      for (let px = 0; px < plotW; px += step) {
        const x = -win + (px / plotW) * 2 * win;
        const z = win - (py / plotH) * 2 * win;
        if (maskMetal(band, x, z)) {
          ctx.fillStyle = "#4a3a5a";
          ctx.fillRect(pad + px, pad + py, step, step);
          continue;
        }
        const rr = Math.hypot(x, z);
        const E = EparAtR(band.prad, rr);
        const t = (Math.log10(Math.max(E, eMin * 0.5)) - Math.log10(eMin)) /
                  (Math.log10(eMax) - Math.log10(eMin) || 1);
        const [cr, cg, cb] = turbo(t);
        ctx.fillStyle = "rgb(" + cr + "," + cg + "," + cb + ")";
        ctx.fillRect(pad + px, pad + py, step, step);
      }
    }

    // antenna cartoon
    ctx.fillStyle = "rgba(180,120,200,0.85)";
    ctx.beginPath();
    ctx.arc(sx(0), sy(0), Math.max(2, (band.sphereR / (2 * win)) * plotW), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7a2a9a";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // markers
    drawRing(ctx, sx, sy, band.rReactive, "rgba(160,80,200,0.9)", [4, 3]);
    drawRing(ctx, sx, sy, band.rFresnel, "rgba(40,160,80,0.9)", [5, 3]);
    if (band.rFraunhofer > band.sphereR && band.rFraunhofer < win * 1.05)
      drawRing(ctx, sx, sy, band.rFraunhofer, "rgba(220,60,60,0.85)", [3, 3]);
    drawRing(ctx, sx, sy, band.r3lam, "rgba(220,140,40,0.85)", [6, 3]);

    // selected r
    let offMap = false;
    if (s.r <= win * 1.02) {
      drawRing(ctx, sx, sy, s.r, "#ff3030", [8, 4]);
    } else {
      offMap = true;
    }

    const eAtLam = EparAtR(band.prad, band.lam) * Math.sqrt(s.Surv); // Surv=1 usually; E∥ no mP
    // E∥ uses S = Sgeom*Surv — match compute Epar which already has Surv
    const eAtR = s.Epar;
    const eAtLamExact = Math.sqrt(Math.max(s.Prad / (4 * Math.PI * band.lam * band.lam) * s.Surv, 0) * Z0);

    ctx.fillStyle = "#d7e0f2";
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.fillText("E∥ map · " + PAGE_VERSION + " · " + PHYSICS_VERSION, pad, 18);
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.fillStyle = "#f0c14b";
    ctx.fillText("I_pk=" + s.Ipk.toExponential(3) + "  E∥(λ)=" + eAtLamExact.toExponential(3) +
      "  E∥(r)=" + eAtR.toExponential(3), pad, cssH - 12);

    if ($("emapCaption")) {
      $("emapCaption").innerHTML =
        "f=" + (s.f / 1e6).toFixed(2) + " MHz · λ=" + (band.lam * 1000).toFixed(1) + " mm · " +
        "I<sub>pk</sub>=" + s.Ipk.toExponential(3) + " A · " +
        "E∥(λ)=<strong>" + eAtLamExact.toExponential(3) + "</strong> V/m · " +
        "E∥(r)=<strong>" + eAtR.toExponential(3) + "</strong> V/m" +
        (offMap
          ? " · <span class=\"hyp\">selected r off-map (r=" + s.r.toExponential(4) + " m); E∥(r) still in numeric strip</span>"
          : " · red dashed = selected r") +
        "<br><span class=\"footnote\">HYP / illustrative / not Maxwell near-field · LAB Keyport ≠ US 9,306,527 FIG.2B · E∥ NO mP</span>";
    }
  }

  function rangeBounds() {
    const scen = $("scenario").value;
    let rCur = $("log10r") ? Math.pow(10, +$("log10r").value) : +$("r").value;
    let rMin, rMax;
    if (scen === "garage") { rMin = 0.05; rMax = 20; }
    else if (scen === "outdoor") { rMin = 0.05; rMax = 200; }
    else if (scen === "sub") { rMin = 0.5; rMax = 5000; }
    else { rMin = 0.05; rMax = 30; }
    rMax = Math.max(rMax, rCur * 1.15);
    rMin = Math.min(rMin, Math.max(rCur / 50, 1e-3));
    return { rMin: rMin, rMax: rMax };
  }

  function sampleVsRange(s0, N) {
    const b = rangeBounds();
    const pts = { r: [], E: [], Am: [], Az: [], snr: [], Pdbm: [] };
    const f = s0.f;
    const K0 = 2 * Math.PI * f / C;
    const SurvFixed = Math.exp(-s0.ohm.alphaEff);
    const useLog = (b.rMax / b.rMin) > 50;
    for (let i = 0; i < N; i++) {
      const r = useLog
        ? Math.pow(10, Math.log10(b.rMin) + i * (Math.log10(b.rMax) - Math.log10(b.rMin)) / (N - 1))
        : b.rMin + i * (b.rMax - b.rMin) / (N - 1);
      const Sgeom = s0.Prad / (4 * Math.PI * r * r);
      const S = Sgeom * SurvFixed;
      const Epar = Math.sqrt(Math.max(S, 0) * Z0);
      const Am = (MU0 * s0.Ipk) / (2 * Math.PI * K0 * r);
      const Az = 1e-10 * (s0.Ipk / 0.028) * (1.5 / r) * (1.3 / (f / 1e9));
      const Pload = S * A_EFF * ETA * s0.mP * Math.pow(10, s0.lnaGain / 10);
      // same dB form as compute() when e^(−αL) underflows (seawater)
      const PloadDbm = SurvFixed > 0 ? dbmFromWatts(Pload)
        : dbmFromWatts(Sgeom * A_EFF * ETA * s0.mP * Math.pow(10, s0.lnaGain / 10)) - (10 / Math.LN10) * s0.ohm.alphaEff;
      const snrH = PloadDbm - s0.noise;
      pts.r.push(r); pts.E.push(Epar); pts.Am.push(Am); pts.Az.push(Az);
      pts.snr.push(snrH); pts.Pdbm.push(PloadDbm);
    }
    pts.b = b;
    return pts;
  }

  function drawPlots(s) {
    const N = 120;
    const pts = sampleVsRange(s, N);
    const b = pts.b;

    const g1 = canvas("plotE");
    const Edb = pts.E.map(function (v) { return 20 * Math.log10(Math.max(v, 1e-30)); });
    let mn = Math.min.apply(null, Edb) - 3, mx = Math.max.apply(null, Edb) + 3;
    if (!Number.isFinite(mn)) { mn = -200; mx = 0; }
    axes(g1, "range →", "E∥ dB(V/m)"); labels(g1, mn, mx);
    plotLine(g1, Edb, mn, mx, "#ff9f43"); dualX(g1, b.rMin, b.rMax);

    const g2 = canvas("plotA");
    const AmDb = pts.Am.map(function (v) { return 20 * Math.log10(Math.max(v, 1e-30)); });
    const AzDb = pts.Az.map(function (v) { return 20 * Math.log10(Math.max(v, 1e-30)); });
    mn = Math.min(Math.min.apply(null, AmDb), Math.min.apply(null, AzDb)) - 3;
    mx = Math.max(Math.max.apply(null, AmDb), Math.max.apply(null, AzDb)) + 3;
    if (!Number.isFinite(mn)) { mn = -300; mx = -100; }
    axes(g2, "range →", "A dB(Wb/m)"); labels(g2, mn, mx);
    plotLine(g2, AmDb, mn, mx, "#55d6be"); plotLine(g2, AzDb, mn, mx, "#a979ff");
    dualX(g2, b.rMin, b.rMax);
    g2.x.fillStyle = "#55d6be"; g2.x.fillText("A_m NZ", 60, 28);
    g2.x.fillStyle = "#a979ff"; g2.x.fillText("A_z Zim", 120, 28);
    g2.x.fillStyle = "#8aa"; g2.x.font = "9px IBM Plex Mono, monospace";
    g2.x.fillText("Φ/C educational only — no separate Φ formula", 60, 42);

    const g3 = canvas("plotSnr");
    mn = Math.min.apply(null, pts.snr) - 5; mx = Math.max.apply(null, pts.snr) + 5;
    if (!Number.isFinite(mn)) { mn = -100; mx = 0; }
    axes(g3, "range →", "SNR_Hively dB"); labels(g3, mn, mx);
    plotLine(g3, pts.snr, mn, mx, "#55d6be"); dualX(g3, b.rMin, b.rMax);
    const frac = (s.r - b.rMin) / (b.rMax - b.rMin || 1);
    const px = 52 + Math.max(0, Math.min(1, frac)) * (g3.w - 64);
    g3.x.strokeStyle = "#f0c14b"; g3.x.setLineDash([4, 3]);
    g3.x.beginPath(); g3.x.moveTo(px, 18); g3.x.lineTo(px, g3.h - 40); g3.x.stroke();
    g3.x.setLineDash([]);
  }

  function applyScenario() {
    const scen = $("scenario").value;
    if (scen === "garage") {
      // media garage — r owned by distance preset
      $("cage").value = "sealed";
      if ($("ohmicMode")) $("ohmicMode").value = "joule";   // v0.3: presets use the Joule-literal default
      $("cageOhm").checked = false;
      $("med_air").checked = true;
      $("med_copper").checked = false;
      $("med_air_inside").checked = false;
      $("med_steel").checked = false;
      $("med_seawater").checked = false;
      $("med_ocean_air").checked = false;
      $("med_free_space").checked = false;
      $("highI").checked = false;
      $("ptx").value = -19;
    } else if (scen === "outdoor") {
      // media outdoor — r owned by distance preset
      $("cage").value = "open";
      if ($("ohmicMode")) $("ohmicMode").value = "joule";   // v0.3: presets use the Joule-literal default
      $("cageOhm").checked = false;
      $("med_air").checked = true;
      $("med_free_space").checked = true;
      $("med_copper").checked = false;
      $("med_air_inside").checked = false;
      $("med_steel").checked = false;
      $("med_seawater").checked = false;
      $("med_ocean_air").checked = false;
      $("highI").checked = false;
    } else if (scen === "sub") {
      // media sub — r owned by distance preset
      $("cage").value = "sealed";
      if ($("ohmicMode")) $("ohmicMode").value = "joule";   // v0.3: presets use the Joule-literal default
      $("cageOhm").checked = false;
      $("med_air").checked = true;
      $("med_copper").checked = true;
      $("med_air_inside").checked = true;
      $("med_steel").checked = true;
      $("med_seawater").checked = true;
      $("med_ocean_air").checked = true;
      $("med_free_space").checked = true;
      $("highI").checked = false;
      $("ptx").value = -19;
    }
    syncHighI();
    syncOhmicUI();
    applyDistancePreset(false);
  }


  function applyDistancePreset(fromUser) {
    const el = $("distPreset");
    if (!el) return;
    const f = +$("freq").value;
    const id = el.value;
    const rM = distancePresetRM(id, f);
    if ($("log10r")) {
      const lo = Math.log10(Math.max(rM, 1e-6));
      $("log10r").value = String(Math.max(-2, Math.min(7.6, lo)));
    }
    if ($("r")) $("r").value = String(rM);
    if ($("distNote")) {
      const lam = C / f;
      let extra = "";
      if (id === "aircraft_slant_30km_35kft") {
        extra = " Slant = √(30000² + (35000×0.3048)²) = " + rM.toFixed(3) + " m (horiz 30 km · alt 35000 ft).";
      }
      if (id === "fraunhofer_2D2_over_lambda") {
        const sphere = SPHERE_LAB[f] || SPHERE_LAB[1296000000];
        const Rs = sphere.od_m / 2;
        if (rM < Rs) extra = " WARN: 2D²/λ is INSIDE LAB sphere R=" + Rs.toExponential(3) + " m.";
      }
      $("distNote").textContent =
        "Preset " + id + " → r=" + rM.toExponential(4) + " m (" + (rM / FT_TO_M).toFixed(1) + " ft). λ=" +
        lam.toExponential(4) + " m." + extra +
        " Media Ohmic L_eff unchanged (no invented seawater α for free-space long paths).";
    }
  }

  function syncHighI() {
    const on = $("highI").checked;
    $("ptx").disabled = on;
    $("Iexplore").disabled = !on;
    $("highIbox").classList.toggle("warn-on", on);
  }

  function syncOhmicUI() {
    const sw = $("mode").value === "sw";
    const om = $("ohmicMode") ? $("ohmicMode").value : "joule";
    const errata = om === "errata0";
    const lock = sw || errata;
    // Media stack + cageOhm always clickable (config). Only α magnitude sliders
    // are disabled while Errata/SW force α=0 — otherwise boxes look broken.
    const magIds = ["alphaToy", "cagePath", "alphaExtra", "Lextra"];
    magIds.forEach(function (id) {
      const el = $(id);
      if (el) el.disabled = lock || ((id === "alphaToy" || id === "cagePath") && om !== "toy");
    });
    ["cageOhm", "med_air", "med_copper", "med_air_inside", "med_steel",
      "med_seawater", "med_ocean_air", "med_free_space"].forEach(function (id) {
      const el = $(id);
      if (el) el.disabled = false;
    });
    const grid = document.querySelector(".media-grid");
    if (grid) grid.classList.toggle("ohmic-alpha-locked", lock);
    if ($("ohmicNote")) {
      $("ohmicNote").textContent = sw
        ? "SW → α=0 (Experiment C: SW has neither skin nor Joule loss). Media boxes stay clickable for stack config."
        : ({ joule: "DEFAULT · Joule-literal: seawater uses α_J from Hively's Eq. 37/44 (Experiment G code); air ≈ 0; metal walls not modelled (UNKNOWN, 0).",
             tem: "TEM-equal (classical comparison): seawater uses the ordinary-radio α_TEM; air ≈ 0; metal walls not modelled (UNKNOWN, 0).",
             errata0: "Erratum α=0 toggle (NOT the default): no loss in any medium, per Hively & Loebl's 2022 Erratum. Conflicts with Experiment C's Joule-loss rule.",
             toy: "Exp-C α toy (HYP): old v0.2 option — α_toy·L over the checked Linearly Resistive segments; NOT attenFactor 0.95." })[om];
    }
  }

  function syncFreq() {
    const f = +$("freq").value;
    const sp = SPHERE_LAB[f];
    if (sp) $("sphereOut").textContent = sp.id + " · " + sp.diaIn + "″ · " + sp.note;
  }

  function tick() {
    syncOhmicUI();
    const s = compute();
    render(s);
    drawPlots(s);
    drawEfieldMap(s);
  }

  const ids = [
    "freq", "ptx", "r", "log10r", "distPreset", "cage", "mode", "lna", "scenario", "highI", "Iexplore",
    "ohmicMode", "cageOhm", "cagePath", "alphaExtra", "Lextra", "alphaToy",
    "med_air", "med_copper", "med_air_inside", "med_steel", "med_seawater", "med_ocean_air", "med_free_space"
  ];
  ids.forEach(function (id) {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", tick);
    el.addEventListener("change", tick);
  });
  $("scenario").addEventListener("change", function () { applyScenario(); tick(); });
  $("highI").addEventListener("change", function () { syncHighI(); tick(); });
  $("freq").addEventListener("change", function () {
    syncFreq();
    const id = $("distPreset") ? $("distPreset").value : "";
    if (id === "near_far_lambda" || id === "fraunhofer_2D2_over_lambda") applyDistancePreset(false);
    tick();
  });
  if ($("distPreset")) {
    $("distPreset").addEventListener("change", function () { applyDistancePreset(true); tick(); });
  }
  $("mode").addEventListener("change", function () { syncOhmicUI(); tick(); });
  $("ohmicMode").addEventListener("change", function () { syncOhmicUI(); tick(); });
  window.addEventListener("resize", tick);

  syncHighI();
  syncFreq();
  syncOhmicUI();
  applyDistancePreset(false);
  tick();
})();
