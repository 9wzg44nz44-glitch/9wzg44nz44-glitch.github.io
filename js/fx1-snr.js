/*! fx1-snr.js — PHYSICS_VERSION fx1-snr-v0.1 (DRAFT · Cloud publish pending)
 * FX-1 driven Faraday sphere: standard-physics (FACT forms + labelled ASSUMPTIONS) vs EED/SLW (HYP) predictions,
 * Tekbox TBPS01 probe (E5/H10/H20/H5) → TinySA Ultra dBm → SNR at chosen RBW.
 * Lockstep twin: Wolfram FX1SNR.wl (https://www.wolframcloud.com/obj/danbritton5/FX1SNR — publish pending).
 * Constants block below is GENERATED from physics-constants-fx1.json (gen_constants.mjs); check_constants.mjs asserts equality.
 * No invented equations: every formula is cited in physics-constants-fx1.json → formulas / labels.
 */
(function (root) {
  "use strict";

  /* BEGIN FX1 CONSTANTS (generated — do not edit by hand) */
  const K = {
   "PHYSICS_VERSION": "fx1-snr-v0.1",
   "C0": 299792458,
   "MU0": 0.0000012566370614359173,
   "EPS0": 8.854187817e-12,
   "Z0": 376.73031346177,
   "RL": 50,
   "freq_presets_Hz": {
    "f433": 433590000,
    "f1296": 1296000000,
    "f2450": 2450000000
   },
   "freq_free_min_Hz": 100000000,
   "freq_free_max_Hz": 3000000000,
   "drive": {
    "tinysa_gen_min_dBm": -115,
    "tinysa_gen_max_dBm": -19,
    "zeenko_gain_dB": 21,
    "presets_dBm": {
     "tinysa_alone": -19,
     "tinysa_plus_zeenko": 2
    },
    "default_dBm": 2
   },
   "radius_presets_m": {
    "bowls_11in": 0.14,
    "KB2016_2p5in": 0.03175,
    "KB1820_0p75in": 0.009525
   },
   "radius_default_shell": {
    "bowls_11in": "ss304",
    "KB2016_2p5in": "al3003",
    "KB1820_0p75in": "al3003"
   },
   "radius_default_seam": {
    "bowls_11in": true,
    "KB2016_2p5in": false,
    "KB1820_0p75in": false
   },
   "materials": {
    "ss304": {
     "sigma": 1388888.888888889,
     "mu_r": 1.02,
     "eps_r": 1,
     "tan_d": 0
    },
    "al3003": {
     "sigma": 24038461.538461536,
     "mu_r": 1,
     "eps_r": 1,
     "tan_d": 0
    },
    "copper": {
     "sigma": 58000000,
     "mu_r": 1,
     "eps_r": 1,
     "tan_d": 0
    },
    "steel": {
     "sigma": 5000000,
     "mu_r": 1,
     "eps_r": 1,
     "tan_d": 0
    },
    "seawater": {
     "sigma": 4,
     "mu_r": 1,
     "eps_r": 80,
     "tan_d": 0
    },
    "air": {
     "sigma": 1e-14,
     "mu_r": 1,
     "eps_r": 1.0006,
     "tan_d": 0
    },
    "hdpe": {
     "sigma": 0,
     "mu_r": 1,
     "eps_r": 2.29,
     "tan_d": 0.0005
    }
   },
   "shell": {
    "t_wall_default_m": 0.0005,
    "seam_gap_default_m": 0.005,
    "seam_n_default": 1,
    "mesh_SE": {
     "f_lo_Hz": 1000000000,
     "SE_lo_dB": 60,
     "f_hi_Hz": 1300000000,
     "SE_hi_dB": 50
    }
   },
   "counterpoise_gap_default_m": 0.2,
   "lineN": 400,
   "tents_att_dB": {
    "open": 0,
    "slotted": 25,
    "sealed": 55
   },
   "sub_len_m": {
    "copper_wall": 0.003175,
    "air_inside": 100.584,
    "steel_wall": 0.0762,
    "seawater_exit": 91.44,
    "ocean_air_toy": 1,
    "free_space": 0
   },
   "hdpe_t_default_m": 0.05,
   "ohmic": {
    "alpha_toy_default": 0.05,
    "cage_path_default_m": 1
   },
   "cavity_roots": {
    "TM101": 2.744,
    "TE101": 4.493
   },
   "hyp_resonance_flag_abs_sin_kR": 0.05,
   "probe_anchor_MHz": {
    "E5": [
     0.3,
     1,
     3,
     6,
     10,
     100,
     300,
     500,
     800,
     1100,
     1200,
     1300,
     1400,
     1700,
     2000,
     2500,
     3000
    ],
    "H20": [
     0.3,
     0.5,
     1,
     6,
     10,
     100,
     300,
     500,
     800,
     1100,
     1200,
     1300,
     1400,
     1700,
     2000
    ],
    "H10": [
     0.3,
     0.5,
     1,
     6,
     10,
     100,
     300,
     500,
     800,
     1100,
     1200,
     1300,
     1400,
     1700,
     2000,
     2500,
     3000
    ],
    "H5": [
     0.3,
     0.5,
     1,
     6,
     10,
     100,
     300,
     500,
     800,
     1100,
     1200,
     1300,
     1400,
     1700,
     2000,
     2500,
     3000
    ]
   },
   "probe_anchor_dBm": {
    "E5": [
     -120,
     -115,
     -104,
     -97,
     -93,
     -72,
     -62,
     -57,
     -54,
     -50,
     -49.8,
     -49,
     -48,
     -46,
     -46.5,
     -44.5,
     -45
    ],
    "H20": [
     -50,
     -45,
     -39,
     -23,
     -18.5,
     -3,
     1,
     -1,
     -4,
     -12,
     -20,
     -12,
     -10,
     0,
     5
    ],
    "H10": [
     -69,
     -63.5,
     -57,
     -42,
     -37,
     -18,
     -10,
     -6,
     -4,
     -4,
     -4,
     -4.5,
     -5,
     -5,
     -8,
     -10,
     -15
    ],
    "H5": [
     -90,
     -86,
     -80,
     -65,
     -60,
     -40,
     -30,
     -25,
     -21,
     -18,
     -18.5,
     -17,
     -15,
     -14,
     -13,
     -13,
     -14
    ]
   },
   "probe_ref": {
    "E5": 1,
    "H20": 0.000001,
    "H10": 0.000001,
    "H5": 0.000001
   },
   "probe_kind": {
    "E5": "E",
    "H20": "B",
    "H10": "B",
    "H5": "B"
   },
   "faq_v11": {
    "E5_scale": 112.5,
    "S": {
     "H20": 80,
     "H10": 62,
     "H5": 40
    },
    "f_max_MHz": 6000
   },
   "tinysa_floor": {
    "noLNA": {
     "lds_dBm": -102,
     "rbw_Hz": 30000
    },
    "LNA": {
     "lds_dBm": -145,
     "rbw_Hz": 200
    },
    "rbw_options_Hz": [
     200,
     1000,
     3000,
     10000,
     30000,
     100000,
     300000,
     600000,
     850000
    ],
    "rbw_default_Hz": 10000,
    "best_below_dBm": -25,
    "p1dB_dBm": -1,
    "abs_max_dBm": 6
   },
   "distances": {
    "bench_cm": [
     5,
     10,
     20,
     50,
     100
    ],
    "home_garage_m": 10,
    "home_outdoor_m": 50
   },
   "interior_grid_rR": [
    0,
    0.25,
    0.5,
    0.7,
    0.9
   ]
  };
  /* END FX1 CONSTANTS */

  const PI = Math.PI;
  const DB_NP = 20 / Math.LN10; // 8.6858896… dB per neper (field)
  const log10 = Math.log10;

  function wFromDbm(d) { return Math.pow(10, (d - 30) / 10); }
  function dbmFromW(w) { return w > 0 ? 10 * log10(w * 1000) : -Infinity; }

  /* ---- minimal complex arithmetic ---- */
  function cx(re, im) { return { re: re, im: im || 0 }; }
  function cadd(a, b) { return cx(a.re + b.re, a.im + b.im); }
  function csub(a, b) { return cx(a.re - b.re, a.im - b.im); }
  function cmul(a, b) { return cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function cscale(a, s) { return cx(a.re * s, a.im * s); }
  function cdiv(a, b) { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function cabs(a) { return Math.hypot(a.re, a.im); }
  function csqrt(z) { // principal branch (same as Mathematica Sqrt)
    const r = Math.hypot(z.re, z.im);
    const a = Math.sqrt((r + z.re) / 2);
    let b = Math.sqrt(Math.max(0, (r - z.re) / 2));
    if (z.im < 0) b = -b;
    return cx(a, b);
  }
  function cexp(z) { const e = Math.exp(z.re); return cx(e * Math.cos(z.im), e * Math.sin(z.im)); }

  /* ---- drive (page: +2 dBm → ~0.4 V; −19 dBm → 35 mV) ---- */
  function drive(P_dBm) {
    const P = wFromDbm(P_dBm);
    return { P: P, V0: Math.sqrt(2 * K.RL * P), Ipk: Math.sqrt(2 * P / K.RL) };
  }

  /* ---- Schelkunoff slab SE (plane wave, normal incidence): A + R + B ---- */
  function layerSE(mat, t, f) {
    if (!(t > 0)) return { A: 0, R: 0, B: 0, SE: 0 };
    const w = 2 * PI * f;
    const mu = K.MU0 * mat.mu_r;
    const epsp = K.EPS0 * mat.eps_r;
    const sigt = mat.sigma + w * K.EPS0 * mat.eps_r * mat.tan_d;
    const g = csqrt(cx(-w * w * mu * epsp, w * mu * sigt));
    const eta = cdiv(cx(0, w * mu), g);
    const eta0 = cx(K.Z0, 0);
    const s = cadd(eta0, eta);
    const A = DB_NP * g.re * t;
    const R = 20 * log10(cabs(cmul(s, s)) / (4 * cabs(cmul(eta0, eta))));
    const G = cdiv(csub(eta0, eta), s);
    const e2 = cexp(cscale(g, -2 * t));
    const B = 20 * log10(cabs(csub(cx(1, 0), cmul(cmul(G, G), e2))));
    return { A: A, R: R, B: B, SE: A + R + B };
  }

  /* ---- seam / aperture (Ott 2009 §6.6) ---- */
  function seamSE(f, l, n) {
    const lam = K.C0 / f;
    if (!(l > 0) || l >= lam / 2) return 0;
    return Math.max(0, 20 * log10(lam / (2 * l)) - 10 * log10(Math.max(1, n)));
  }

  /* ---- RadioScreen mesh sphere: page catalog figures ---- */
  function meshSE(f) {
    const m = K.shell.mesh_SE;
    if (f <= m.f_lo_Hz) return { SE: m.SE_lo_dB, label: "FACT (page catalog ~60 dB below 1 GHz)" };
    if (f < m.f_hi_Hz) {
      const t = (f - m.f_lo_Hz) / (m.f_hi_Hz - m.f_lo_Hz);
      return { SE: m.SE_lo_dB + t * (m.SE_hi_dB - m.SE_lo_dB), label: "INTERPOLATED between page catalog points" };
    }
    if (f === m.f_hi_Hz) return { SE: m.SE_hi_dB, label: "FACT (page catalog ~50 dB at 1.3 GHz)" };
    return { SE: m.SE_hi_dB, label: "ASSUMPTION (not published above 1.3 GHz; held at 50 dB)" };
  }

  function shellSE(p, f) {
    if (p.shellType === "mesh") {
      const m = meshSE(f);
      return { wall: null, seam: null, SE: m.SE, label: m.label };
    }
    const wall = layerSE(K.materials[p.shellMat], p.tWall, f);
    const seam = p.seamOn ? seamSE(f, p.seamL, p.seamN) : Infinity;
    const sum = Math.pow(10, -wall.SE / 10) + (p.seamOn ? Math.pow(10, -seam / 10) : 0);
    const SE = sum > 0 ? -10 * log10(sum) : Infinity;
    return { wall: wall, seam: seam, SE: SE, label: p.seamOn ? "wall ⊕ seam (power sum)" : "wall only (no seam aperture)" };
  }

  /* ---- Tekbox probe factor K(f): dBm at ref field (1 V/m or 1 µT) ---- */
  function probeFactor(probe, f, src) {
    const F = f / 1e6;
    if (src === "faq") {
      if (F > K.faq_v11.f_max_MHz) return { K: null, label: "NOT_PUBLISHED" };
      if (probe === "E5") return { K: -K.faq_v11.E5_scale + 20 * log10(F), label: "FAQ_V1.1_FORMULA" };
      return { K: 20 * log10(K.probe_ref[probe]) + K.faq_v11.S[probe] + 20 * log10(F), label: "FAQ_V1.1_FORMULA" };
    }
    const xs = K.probe_anchor_MHz[probe], ys = K.probe_anchor_dBm[probe];
    const n = xs.length;
    if (F < xs[0] * (1 - 1e-12) || F > xs[n - 1] * (1 + 1e-12)) return { K: null, label: "NOT_PUBLISHED" };
    for (let i = 0; i < n; i++) {
      if (Math.abs(F - xs[i]) <= 1e-9 * xs[i]) return { K: ys[i], label: "DATA" };
    }
    for (let i = 0; i < n - 1; i++) {
      if (F > xs[i] && F < xs[i + 1]) {
        const t = (log10(F) - log10(xs[i])) / (log10(xs[i + 1]) - log10(xs[i]));
        return { K: ys[i] + t * (ys[i + 1] - ys[i]), label: "INTERPOLATED" };
      }
    }
    return { K: null, label: "NOT_PUBLISHED" };
  }

  function floorDbm(rbw, lna) {
    const r = lna ? K.tinysa_floor.LNA : K.tinysa_floor.noLNA;
    return r.lds_dBm + 10 * log10(rbw / r.rbw_Hz);
  }

  /* ---- HYP interior (page §EED, exactly) ---- */
  function ErHyp(V0, R, k, r) {
    if (!(r > 0)) return 0;
    const kr = k * r, sKR = Math.sin(k * R);
    if (kr < 1e-4) return V0 * R * k * k * k * r / (3 * sKR);
    return V0 * R * (Math.sin(kr) - kr * Math.cos(kr)) / (r * r * sKR);
  }

  /* ---- Hertzian element sum (Balanis Eq. 4-8/4-10), obs at (rho, z) ---- */
  function hertzSum(elems, rho, z, k) {
    let Erho = cx(0), Ez = cx(0), H = cx(0);
    for (let i = 0; i < elems.length; i++) {
      const zi = elems[i][0], Il = elems[i][1];
      const dz = z - zi;
      const Rr = Math.hypot(rho, dz);
      const ct = dz / Rr, st = rho / Rr, kr = k * Rr;
      const ph = cexp(cx(0, -kr));
      const fr = cx(1, -1 / kr);
      const fth = cx(1 - 1 / (kr * kr), -1 / kr);
      const Er = cscale(cmul(fr, ph), K.Z0 * Il * ct / (2 * PI * Rr * Rr));
      const Eth = cmul(cx(0, 1), cscale(cmul(fth, ph), K.Z0 * k * Il * st / (4 * PI * Rr)));
      const Hp = cmul(cx(0, 1), cscale(cmul(fr, ph), k * Il * st / (4 * PI * Rr)));
      Erho = cadd(Erho, cadd(cscale(Er, st), cscale(Eth, ct)));
      Ez = cadd(Ez, csub(cscale(Er, ct), cscale(Eth, st)));
      H = cadd(H, Hp);
    }
    return { E: Math.sqrt(cabs(Erho) * cabs(Erho) + cabs(Ez) * cabs(Ez)), B: K.MU0 * cabs(H) };
  }

  function exteriorStd(V0, R, f, hc, rc, counterpoise) {
    const w = 2 * PI * f, k = w / K.C0;
    const Q = 4 * PI * K.EPS0 * R * V0;
    const A = { E: V0 * R / (rc * rc), B: 0 };
    if (!counterpoise) return { Q: Q, A: A, B: null, C: null };
    const N = K.lineN, dz = 2 * hc / N, I0 = w * Q;
    const elems = [];
    for (let i = 0; i < N; i++) elems.push([-hc + (i + 0.5) * dz, I0 * dz]);
    const Bm = hertzSum(elems, rc, hc, k);
    const Cm = hertzSum([[0, w * Q * 2 * hc]], rc, hc, k);
    // radiated power of each model (image theory: real half-space power = full-space dipole power / 2)
    const L = 2 * hc;
    const PB = 0.5 * lineRadPowerFull(I0, L, k);
    const Il = w * Q * L;
    const PC = 0.5 * K.Z0 * PI / 3 * Math.pow(Il * k / (2 * PI), 2);
    Bm.Prad = PB; Cm.Prad = PC;
    return { Q: Q, A: A, B: Bm, C: Cm, I0: I0 };
  }

  /* uniform-current line of length L (full space): P = eta k^2 I^2 L^2/(32 pi^2) * 2pi * Int_0^pi sin^3(th) sinc^2(k L cos(th)/2) dth
     (far-field of a uniform line source; reduces to Balanis Eq. 4-16 for kL << 1). Midpoint rule, K.lineN*5 points. */
  function lineRadPowerFull(I, L, k) {
    const M = K.lineN * 5;
    let acc = 0;
    for (let i = 0; i < M; i++) {
      const th = (i + 0.5) * PI / M;
      const u = k * L * Math.cos(th) / 2;
      const sc = Math.abs(u) < 1e-12 ? 1 : Math.sin(u) / u;
      const sn = Math.sin(th);
      acc += sn * sn * sn * sc * sc;
    }
    acc *= PI / M;
    return K.Z0 * k * k * I * I * L * L / (32 * PI * PI) * 2 * PI * acc;
  }

  function powerLimit(fld, Pdrive, on) {
    if (!fld) return null;
    const s = (on && fld.Prad > Pdrive) ? Math.sqrt(Pdrive / fld.Prad) : 1;
    return { E: fld.E * s, B: fld.B * s, Prad: fld.Prad, scale: s, E_unscaled: fld.E, B_unscaled: fld.B };
  }

  /* ---- media stack (SleeveBalunSNR carry-over + FX-1 items) ---- */
  const STACK_ITEMS = [
    // id, material (standard), length key, label
    ["med_air", null, 0, "air (garage / cage interior) L=0"],
    ["med_copper", "copper", "copper_wall", "copper wall ⅛″"],
    ["med_air_inside", "air", "air_inside", "air inside sub 330 ft"],
    ["med_steel", "steel", "steel_wall", "steel hull 3″"],
    ["med_seawater", "seawater", "seawater_exit", "seawater exit 300 ft"],
    ["med_ocean_air", null, "ocean_air_toy", "ocean–air interface (TOY L=1 m)"],
    ["med_free_space", null, "free_space", "free-space"],
    ["med_hdpe", "hdpe", "HDPE", "HDPE block"]
  ];

  function stack(p, f) {
    const s = p.stack || {};
    let stdDb = 0, L = 0;
    const parts = [];
    STACK_ITEMS.forEach(function (it) {
      if (!s[it[0]]) return;
      const len = it[2] === "HDPE" ? p.hdpeT : (it[2] === 0 ? 0 : K.sub_len_m[it[2]]);
      L += len;
      if (it[1]) {
        const se = layerSE(K.materials[it[1]], len, f);
        stdDb += se.SE;
        parts.push(it[3] + ": std " + (Number.isFinite(se.SE) ? se.SE.toFixed(2) : "∞") + " dB");
      } else {
        parts.push(it[3] + ": std 0 dB (none defined)");
      }
    });
    const att = K.tents_att_dB[p.tents || "open"];
    stdDb += 2 * att;
    const mP = Math.pow(10, -2 * att / 10);
    let alphaL = 0;
    if (!p.errata) {
      alphaL = p.alphaToy * L;
      if (p.cageOhm) alphaL += p.alphaToy * 2 * p.cagePath;
      if (p.alphaExtra > 0 && p.Lextra > 0) alphaL += p.alphaExtra * p.Lextra;
    }
    return { stdDb: stdDb, att: att, mP: mP, L: L, alphaL: alphaL, surv: Math.exp(-alphaL), parts: parts };
  }

  function reading(dbm, floor) {
    if (dbm === null || !Number.isFinite(dbm)) return { dBm: null, snr: null, reading: floor, flag: "no signal → floor" };
    const rd = 10 * log10(Math.pow(10, dbm / 10) + Math.pow(10, floor / 10));
    let flag = "";
    if (dbm > K.tinysa_floor.abs_max_dBm) flag = "ABOVE ABS MAX +6 dBm";
    else if (dbm > K.tinysa_floor.p1dB_dBm) flag = "above P1dB (−1 dBm)";
    else if (dbm > K.tinysa_floor.best_below_dBm) flag = "above −25 dBm best-measurement level";
    return { dBm: dbm, snr: dbm - floor, reading: rd, flag: flag };
  }

  function probeDbm(pf, field, ref) {
    if (pf.K === null || !(field > 0)) return null;
    return pf.K + 20 * log10(field / ref);
  }

  const PROBES = ["E5", "H10", "H20", "H5"];

  function compute(p) {
    const f = p.f, lam = K.C0 / f, k = 2 * PI * f / K.C0, R = p.R;
    const dr = drive(p.P_dBm);
    const V0 = dr.V0;
    // interior
    const sh = shellSE(p, f);
    const rI = p.rR * R;
    const Eref = V0 / R;
    const Eleak = Number.isFinite(sh.SE) ? Eref * Math.pow(10, -sh.SE / 20) : 0;
    const Bleak = Eleak / K.C0;
    const ErS = ErHyp(V0, R, k, rI);
    const Ehyp = p.orient === "tangential" ? 0 : Math.abs(ErS);
    // exterior
    const hc = p.gap + R, rc = R + p.d;
    const ex0 = exteriorStd(V0, R, f, hc, rc, p.counterpoise);
    const ex = { Q: ex0.Q, I0: ex0.I0, A: ex0.A, B: powerLimit(ex0.B, dr.P, p.powerLimit), C: powerLimit(ex0.C, dr.P, p.powerLimit) };
    const sel = ex[p.extModel] || ex.A;
    const st = stack(p, f);
    const Ipk = dr.Ipk;
    const Prad = Ipk * Ipk * K.Z0 / (4 * PI);
    const Shyp = Prad / (4 * PI * rc * rc) * st.surv;
    const Epar = Math.sqrt(Shyp * K.Z0);
    const floor = floorDbm(p.rbw, p.lna);
    const probes = {};
    PROBES.forEach(function (pr) {
      const pf = probeFactor(pr, f, p.factorSrc);
      const ref = K.probe_ref[pr], isE = K.probe_kind[pr] === "E";
      const intStd = probeDbm(pf, isE ? Eleak : Bleak, ref);
      const intHyp = isE ? probeDbm(pf, Ehyp, ref) : null;
      const extStd = {};
      ["A", "B", "C"].forEach(function (m) {
        const fld = ex[m];
        const v = fld ? probeDbm(pf, isE ? fld.E : fld.B, ref) : null;
        extStd[m] = v === null ? null : v - st.stdDb;
      });
      const extHypRaw = isE ? probeDbm(pf, Epar, ref) : null;
      const extHyp = extHypRaw === null ? null : extHypRaw + 10 * log10(st.mP);
      probes[pr] = {
        K: pf.K, label: pf.label,
        int_std: reading(intStd, floor), int_hyp: reading(intHyp, floor),
        ext_std: reading(ex[p.extModel] ? extStd[p.extModel] : extStd.A, floor),
        ext_std_A: reading(extStd.A, floor), ext_std_B: reading(extStd.B, floor), ext_std_C: reading(extStd.C, floor),
        ext_hyp: reading(extHyp, floor)
      };
    });
    const sKR = Math.sin(k * R);
    return {
      version: K.PHYSICS_VERSION, f: f, lam: lam, k: k, kR: k * R, P_W: dr.P, V0: V0, Ipk: Ipk, R: R,
      flags: {
        f_TM101_Hz: K.cavity_roots.TM101 * K.C0 / (2 * PI * R),
        f_TE101_Hz: K.cavity_roots.TE101 * K.C0 / (2 * PI * R),
        f_EED_Hz: K.C0 / (2 * R),
        hypResonance: Math.abs(sKR) < K.hyp_resonance_flag_abs_sin_kR,
        probeFitsInside: R >= 0.05,
        dipoleLen_over_lambda: 2 * hc / lam,
        kr_ext: k * rc
      },
      shell: sh,
      interior: { rR: p.rR, r: rI, E_ref: Eref, E_std_ideal: 0, B_std_ideal: 0, E_leak: Eleak, B_leak: Bleak,
        E_hyp_signed: ErS, E_hyp: Ehyp, B_hyp: 0,
        ratio_hyp_dB: Ehyp > 0 ? 20 * log10(Ehyp / Eref) : null,
        ratio_leak_dB: Eleak > 0 ? 20 * log10(Eleak / Eref) : null },
      exterior: { d: p.d, rc: rc, hc: hc, Q: ex.Q, I0: ex.I0, A: ex.A, B: ex.B, C: ex.C, model: p.extModel, E_hyp: Epar, Prad: Prad, S_hyp: Shyp, P_drive: dr.P },
      stack: st, floor_dBm: floor, probes: probes
    };
  }

  function defaults() {
    return {
      f: K.freq_presets_Hz.f433, P_dBm: K.drive.default_dBm, R: K.radius_presets_m.bowls_11in,
      shellMat: "ss304", shellType: "solid", tWall: K.shell.t_wall_default_m,
      seamOn: true, seamL: K.shell.seam_gap_default_m, seamN: K.shell.seam_n_default,
      counterpoise: true, gap: K.counterpoise_gap_default_m, powerLimit: true,
      rR: 0.7, orient: "radial", d: 0.05, extModel: "B", factorSrc: "manual",
      rbw: K.tinysa_floor.rbw_default_Hz, lna: false,
      tents: "open", stack: { med_air: true }, hdpeT: K.hdpe_t_default_m,
      errata: true, alphaToy: K.ohmic.alpha_toy_default, cageOhm: false, cagePath: K.ohmic.cage_path_default_m,
      alphaExtra: 0, Lextra: 0
    };
  }

  function distancePresets(f) {
    const out = K.distances.bench_cm.map(function (cm) { return { id: "bench_" + cm + "cm", label: cm + " cm from wall", d: cm / 100 }; });
    out.push({ id: "near_far_lambda", label: "λ (near↔far, HYP/educational)", d: K.C0 / f });
    out.push({ id: "home_garage", label: "home garage 10 m", d: K.distances.home_garage_m });
    out.push({ id: "home_outdoor", label: "home outdoor 50 m", d: K.distances.home_outdoor_m });
    return out;
  }

  const STACK_PRESETS = {
    open_air: { label: "open air (no stack)", tents: "open", stack: { med_air: true }, errata: true, cageOhm: false },
    tents_slotted: { label: "two tents slotted (25 dB/tent)", tents: "slotted", stack: { med_air: true }, errata: true, cageOhm: false },
    tents_sealed: { label: "two tents sealed (55 dB/tent)", tents: "sealed", stack: { med_air: true }, errata: true, cageOhm: false },
    hdpe_block: { label: "HDPE block in path", tents: "open", stack: { med_air: true, med_hdpe: true }, errata: true, cageOhm: false },
    copper_wall: { label: "copper wall ⅛″", tents: "open", stack: { med_copper: true }, errata: true, cageOhm: false },
    steel_hull: { label: "steel hull 3″", tents: "open", stack: { med_steel: true }, errata: true, cageOhm: false },
    submarine: { label: "submarine stack (copper+air 330 ft+steel+seawater)", tents: "open", stack: { med_copper: true, med_air_inside: true, med_steel: true, med_seawater: true }, errata: true, cageOhm: false },
    expC_ohmic_sealed: { label: "Exp-C Ohmic HYP toy (α=0.05) + sealed tents + cage path", tents: "sealed", stack: { med_air: true }, errata: false, cageOhm: true }
  };

  const API = { K: K, compute: compute, defaults: defaults, distancePresets: distancePresets, probeFactor: probeFactor,
    floorDbm: floorDbm, layerSE: layerSE, seamSE: seamSE, meshSE: meshSE, ErHyp: ErHyp, PROBES: PROBES, STACK_PRESETS: STACK_PRESETS };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.FX1 = API;

  /* =================== UI (browser only) =================== */
  if (typeof document === "undefined") return;
  const $ = function (id) { return document.getElementById(id); };
  function fe(x, d) { return (x === null || x === undefined || !Number.isFinite(x)) ? "—" : x.toExponential(d === undefined ? 3 : d); }
  function fn(x, d) { return (x === null || x === undefined || !Number.isFinite(x)) ? "—" : x.toFixed(d === undefined ? 1 : d); }
  function tagFor(label) {
    if (label === "DATA") return '<span class="fact">DATA</span>';
    if (label === "INTERPOLATED") return '<span class="hyp">INTERPOLATED</span>';
    if (label === "NOT_PUBLISHED") return '<span class="warn">NOT PUBLISHED</span>';
    return '<span class="fact">' + label + "</span>";
  }

  function readParams() {
    const p = defaults();
    const fsel = $("freqSel").value;
    p.f = fsel === "free" ? +$("freqFree").value * 1e6 : +fsel;
    p.P_dBm = +$("pdbm").value;
    const rsel = $("radSel").value;
    p.R = rsel === "free" ? +$("radFree").value / 1000 : K.radius_presets_m[rsel];
    p.shellMat = $("shellMat").value;
    p.shellType = $("shellType").value;
    p.tWall = +$("tWall").value / 1000;
    p.seamOn = $("seamOn").checked;
    p.seamL = +$("seamL").value / 1000;
    p.seamN = +$("seamN").value;
    p.counterpoise = $("cpOn").checked;
    p.gap = +$("gap").value / 100;
    p.powerLimit = $("powerLimit").checked;
    p.rR = +$("rR").value;
    p.orient = $("orient").value;
    const dsel = $("distSel").value;
    const dp = distancePresets(p.f).filter(function (x) { return x.id === dsel; })[0];
    p.d = dsel === "free" ? +$("distFree").value / 100 : dp.d;
    p.extModel = $("extModel").value;
    p.factorSrc = $("factorSrc").value;
    p.rbw = +$("rbw").value;
    p.lna = $("lna").checked;
    p.tents = $("tents").value;
    p.stack = {};
    STACK_ITEMS.forEach(function (it) { if ($(it[0])) p.stack[it[0]] = $(it[0]).checked; });
    p.hdpeT = +$("hdpeT").value / 100;
    p.errata = $("errata").checked;
    p.alphaToy = +$("alphaToy").value;
    p.cageOhm = $("cageOhm").checked;
    p.cagePath = +$("cagePath").value;
    p.alphaExtra = +$("alphaExtra").value;
    p.Lextra = +$("Lextra").value;
    p.probe = $("probe").value;
    return p;
  }

  function applyRadiusDefaults() {
    const rsel = $("radSel").value;
    if (rsel === "free") return;
    $("shellMat").value = K.radius_default_shell[rsel];
    $("seamOn").checked = K.radius_default_seam[rsel];
  }

  function applyStackPreset() {
    const s = STACK_PRESETS[$("stackPreset").value];
    if (!s) return;
    $("tents").value = s.tents;
    STACK_ITEMS.forEach(function (it) { if ($(it[0])) $(it[0]).checked = !!s.stack[it[0]]; });
    $("errata").checked = s.errata;
    $("cageOhm").checked = s.cageOhm;
  }

  function cell(rd, hyp) {
    if (rd.dBm === null) return '<td class="mono dim">floor ' + fn(rd.reading, 1) + "</td>";
    const cls = hyp ? "hypc" : "stdc";
    return '<td class="mono ' + cls + '">' + fn(rd.dBm, 1) + " <small>(" + fn(rd.snr, 1) + " dB)</small>" + (rd.flag ? ' <span class="warn">!</span>' : "") + "</td>";
  }

  function render() {
    const p = readParams();
    const s = compute(p);
    $("pdbmOut").textContent = fn(p.P_dBm, 0) + " dBm → V0 = " + fe(s.V0, 3) + " V pk (50 Ω identity, ASSUMPTION) · I_pk = " + fe(s.Ipk, 3) + " A";
    $("rROut").textContent = "r/R = " + fn(p.rR, 2) + " (r = " + fn(s.interior.r * 1000, 1) + " mm)";
    $("seamLOut").textContent = fn(p.seamL * 1000, 1) + " mm";
    $("seamNOut").textContent = String(p.seamN);
    $("tWallOut").textContent = fn(p.tWall * 1000, 2) + " mm";
    $("gapOut").textContent = fn(p.gap * 100, 0) + " cm";
    $("hdpeTOut").textContent = fn(p.hdpeT * 100, 1) + " cm";
    $("alphaToyOut").textContent = fn(p.alphaToy, 3) + " Np/m (HYP)";
    $("cagePathOut").textContent = fn(p.cagePath, 1) + " m/tent";
    $("alphaExtraOut").textContent = fn(p.alphaExtra, 3) + " Np/m";
    $("LextraOut").textContent = fn(p.Lextra, 1) + " m";
    $("distOut").textContent = "d = " + fn(p.d * 100, 1) + " cm from wall · r_c = " + fn(s.exterior.rc, 3) + " m from centre · kr_c = " + fn(s.flags.kr_ext, 2);
    $("freqOut").textContent = "f = " + fn(s.f / 1e6, 2) + " MHz · λ = " + fn(s.lam * 100, 2) + " cm · kR = " + fn(s.kR, 3);

    const fl = s.flags, warn = [];
    warn.push("Standard cavity: TM101 ≈ " + fn(fl.f_TM101_Hz / 1e9, 3) + " GHz, TE101 ≈ " + fn(fl.f_TE101_Hz / 1e9, 3) + " GHz (FACT). EED kR = π at " + fn(fl.f_EED_Hz / 1e9, 3) + " GHz (HYP).");
    if (fl.hypResonance) warn.push("HYP formula near kR = π resonance — E_r diverges (|sin kR| < 0.05).");
    if (!fl.probeFitsInside) warn.push("R < 5 cm: a TinySA + probe cannot physically sit inside — interior numbers are formula values only.");
    if (p.counterpoise && fl.dipoleLen_over_lambda > 0.1) warn.push("Line/point-dipole length 2h_c = " + fn(fl.dipoleLen_over_lambda, 2) + " λ — not electrically short; exterior Models B/C are order-of-magnitude (ASSUMPTION). Compare the openEMS reference section.");
    if (!p.counterpoise) warn.push("No counterpoise: only Model A (isolated sphere, quasi-static) is defined.");
    $("flags").innerHTML = "<ul>" + warn.map(function (w) { return "<li>" + w + "</li>"; }).join("") + "</ul>";

    const sh = s.shell;
    $("shellOut").innerHTML = (sh.wall ? ("Wall (Schelkunoff): A = " + fn(sh.wall.A, 1) + " dB, R = " + fn(sh.wall.R, 1) + " dB, B = " + fn(sh.wall.B, 2) + " dB → " + fn(sh.wall.SE, 1) + " dB · ") : "") +
      (sh.seam !== null && sh.seam !== undefined && Number.isFinite(sh.seam) ? ("seam 20log(λ/2l) − 10log n = " + fn(sh.seam, 1) + " dB · ") : "") +
      "<strong>shell SE = " + fn(sh.SE, 1) + " dB</strong> (" + sh.label + ")";

    const it = s.interior;
    $("intOut").innerHTML =
      "<span class='fact'>FACT</span> ideal closed conductor: E = 0, B = 0 · E_ref = V0/R = " + fe(it.E_ref, 3) + " V/m<br>" +
      "<span class='fact'>STD leakage (ASSUMPTION model)</span>: E ≈ " + fe(it.E_leak, 3) + " V/m (" + fn(it.ratio_leak_dB, 1) + " dB re V0/R), B ≈ " + fe(it.B_leak, 3) + " T<br>" +
      "<span class='hyp'>HYP EED</span>: E_r(" + fn(p.rR, 2) + "R) = " + fe(it.E_hyp_signed, 3) + " V/m (" + p.orient + " → " + fe(it.E_hyp, 3) + "), B = 0 · inside/outside = " + fn(it.ratio_hyp_dB, 1) + " dB";

    const ex = s.exterior;
    $("extOut").innerHTML =
      "Q = 4πε0RV0 = " + fe(ex.Q, 3) + " C · h_c = " + fn(ex.hc, 3) + " m<br>" +
      "<span class='fact'>STD</span> A (isolated sphere): |E| = " + fe(ex.A.E, 3) + " V/m, B = 0 · " +
      "B (line+image): " + (ex.B ? "|E| = " + fe(ex.B.E, 3) + " V/m, |B| = " + fe(ex.B.B, 3) + " T" : "n/a") + " · " +
      "C (point dipole): " + (ex.C ? "|E| = " + fe(ex.C.E, 3) + " V/m, |B| = " + fe(ex.C.B, 3) + " T" : "n/a") + "<br>" +
      "<span class='hyp'>HYP</span> SleeveBalunSNR carry-over: P_rad = " + fe(ex.Prad, 3) + " W → E∥ = √(S·Z0) = " + fe(ex.E_hyp, 3) + " V/m, B = 0<br>" +
      "Stack: std " + fn(s.stack.stdDb, 1) + " dB (tents 2×" + s.stack.att + " dB) · HYP αL = " + fn(s.stack.alphaL, 3) + " Np (survival " + fn(100 * s.stack.surv, 2) + "%) · mP = " + fe(s.stack.mP, 2) +
      (s.stack.parts.length ? "<br><span class='footnote'>" + s.stack.parts.join("; ") + "</span>" : "");

    $("floorOut").textContent = "TinySA floor @ RBW " + (p.rbw >= 1000 ? (p.rbw / 1000) + " kHz" : p.rbw + " Hz") + (p.lna ? " (LNA)" : " (no LNA)") + " = " + fn(s.floor_dBm, 1) + " dBm";

    // meters for selected probe
    const pr = s.probes[p.probe];
    $("mK").innerHTML = fn(pr.K, 2) + " dBm @ " + (p.probe === "E5" ? "1 V/m" : "1 µT") + "<br>" + tagFor(pr.label);
    $("mIntStd").textContent = pr.int_std.dBm === null ? "floor" : fn(pr.int_std.dBm, 1) + " dBm";
    $("mIntHyp").textContent = pr.int_hyp.dBm === null ? "floor" : fn(pr.int_hyp.dBm, 1) + " dBm";
    $("mExtStd").textContent = pr.ext_std.dBm === null ? "floor" : fn(pr.ext_std.dBm, 1) + " dBm";
    $("mExtHyp").textContent = pr.ext_hyp.dBm === null ? "floor" : fn(pr.ext_hyp.dBm, 1) + " dBm";

    // results tables
    let h = "<tr><th>Probe</th><th>K(f)</th><th>source</th>";
    K.interior_grid_rR.forEach(function (x) { h += "<th>STD r/R=" + x + "</th><th>HYP r/R=" + x + "</th>"; });
    h += "</tr>";
    PROBES.forEach(function (probe) {
      let row = "<tr><td>" + probe + "</td><td class='mono'>" + fn(s.probes[probe].K, 2) + "</td><td>" + tagFor(s.probes[probe].label) + "</td>";
      K.interior_grid_rR.forEach(function (x) {
        const q = Object.assign({}, p, { rR: x });
        const sx = compute(q).probes[probe];
        row += cell(sx.int_std, false) + cell(sx.int_hyp, true);
      });
      h += row + "</tr>";
    });
    $("tblInt").innerHTML = h;

    let e = "<tr><th>Distance (from wall)</th>";
    PROBES.forEach(function (probe) { e += "<th>" + probe + " STD-" + p.extModel + "</th><th>" + probe + " HYP</th>"; });
    e += "</tr>";
    distancePresets(p.f).forEach(function (dp) {
      const sx = compute(Object.assign({}, p, { d: dp.d }));
      let row = "<tr><td>" + dp.label + "</td>";
      PROBES.forEach(function (probe) { row += cell(sx.probes[probe].ext_std, false) + cell(sx.probes[probe].ext_hyp, true); });
      e += row + "</tr>";
    });
    $("tblExt").innerHTML = e;

    plotInterior(p);
    plotExterior(p, s);
    $("verOut").textContent = K.PHYSICS_VERSION;
  }

  function canvas(id) {
    const c = $(id);
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || 360, h = c.clientHeight || 260;
    c.width = Math.max(1, w * d); c.height = Math.max(1, h * d);
    const x = c.getContext("2d");
    x.setTransform(d, 0, 0, d, 0, 0);
    x.fillStyle = "#0b1020"; x.fillRect(0, 0, w, h);
    return { x: x, w: w, h: h };
  }
  function frame(g, minY, maxY, xl, yl, xticks) {
    const x = g.x, w = g.w, h = g.h;
    x.strokeStyle = "#75839e"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(52, 15); x.lineTo(52, h - 36); x.lineTo(w - 10, h - 36); x.stroke();
    x.fillStyle = "#a9b7cc"; x.font = "10px IBM Plex Mono, monospace";
    for (let i = 0; i <= 4; i++) {
      const v = minY + i * (maxY - minY) / 4, py = h - 36 - i * (h - 51) / 4;
      x.fillText(v.toFixed(0), 4, py + 3);
      x.strokeStyle = "rgba(255,255,255,.08)"; x.beginPath(); x.moveTo(52, py); x.lineTo(w - 10, py); x.stroke();
    }
    (xticks || []).forEach(function (t) { x.fillText(t[1], 52 + t[0] * (w - 62) - 8, h - 22); });
    x.fillText(yl, 4, 11); x.fillText(xl, w - 150, h - 8);
  }
  function line(g, xs, ys, minY, maxY, color, dash) {
    const x = g.x, w = g.w, h = g.h;
    x.strokeStyle = color; x.lineWidth = 2; x.setLineDash(dash || []);
    x.beginPath(); let started = false;
    for (let i = 0; i < xs.length; i++) {
      if (ys[i] === null || !Number.isFinite(ys[i])) { started = false; continue; }
      const px = 52 + xs[i] * (w - 62), py = h - 36 - (Math.max(minY, Math.min(maxY, ys[i])) - minY) / (maxY - minY) * (h - 51);
      if (!started) { x.moveTo(px, py); started = true; } else x.lineTo(px, py);
    }
    x.stroke(); x.setLineDash([]);
  }
  function plotInterior(p) {
    const g = canvas("plotInt");
    const xs = [], hy = [], sd = [];
    for (let i = 0; i <= 100; i++) {
      const x = i / 100 * 0.999;
      const s = compute(Object.assign({}, p, { rR: x, orient: "radial" }));
      xs.push(x); hy.push(s.interior.E_hyp > 0 ? 20 * log10(s.interior.E_hyp) : null); sd.push(s.interior.E_leak > 0 ? 20 * log10(s.interior.E_leak) : null);
    }
    const all = hy.concat(sd).filter(function (v) { return v !== null; });
    let mx = Math.ceil((Math.max.apply(null, all) + 5) / 10) * 10, mn = mx - 100;
    frame(g, mn, mx, "r/R →", "dB(V/m)", [[0, "0"], [0.25, ".25"], [0.5, ".5"], [0.75, ".75"], [1, "1"]]);
    line(g, xs, hy, mn, mx, "#ff9f43");
    line(g, xs, sd, mn, mx, "#55d6be", [5, 4]);
  }
  function plotExterior(p, s0) {
    const g = canvas("plotExt");
    const xs = [], sd = [], hy = [];
    const lo = Math.log10(0.02), hi = Math.log10(100);
    for (let i = 0; i <= 120; i++) {
      const d = Math.pow(10, lo + (hi - lo) * i / 120);
      const s = compute(Object.assign({}, p, { d: d }));
      const pr = s.probes[p.probe];
      xs.push(i / 120); sd.push(pr.ext_std.dBm); hy.push(pr.ext_hyp.dBm);
    }
    const mn = Math.floor((s0.floor_dBm - 30) / 10) * 10, mx = mn + 120;
    frame(g, mn, mx, "d from wall (log) →", "dBm (" + p.probe + ")", [[0, "2cm"], [(Math.log10(0.1) - lo) / (hi - lo), "10cm"], [(0 - lo) / (hi - lo), "1m"], [(1 - lo) / (hi - lo), "10m"], [1, "100m"]]);
    line(g, xs, xs.map(function () { return s0.floor_dBm; }), mn, mx, "#8899aa", [2, 3]);
    line(g, xs, sd, mn, mx, "#55d6be");
    line(g, xs, hy, mn, mx, "#ff9f43", [6, 3]);
  }

  function init() {
    if (!$("freqSel")) return;
    const ids = ["freqSel", "freqFree", "pdbm", "radSel", "radFree", "shellMat", "shellType", "tWall", "seamOn", "seamL", "seamN", "cpOn", "gap", "powerLimit",
      "rR", "orient", "distSel", "distFree", "extModel", "factorSrc", "rbw", "lna", "tents", "hdpeT", "errata", "alphaToy", "cageOhm",
      "cagePath", "alphaExtra", "Lextra", "probe"].concat(STACK_ITEMS.map(function (it) { return it[0]; }));
    ids.forEach(function (id) { const el = $(id); if (el) { el.addEventListener("input", render); el.addEventListener("change", render); } });
    $("radSel").addEventListener("change", function () { applyRadiusDefaults(); render(); });
    $("stackPreset").addEventListener("change", function () { applyStackPreset(); render(); });
    $("drivePreset").addEventListener("change", function () { const v = $("drivePreset").value; if (v !== "custom") $("pdbm").value = K.drive.presets_dBm[v]; render(); });
    window.addEventListener("resize", render);
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
