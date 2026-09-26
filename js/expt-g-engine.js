/* Experiment G engine (expt-g-v0.1) - JS twin of sim/expt_g_model.py and wolfram/ExptG.wl.
   Pure functions only (no DOM). Labels: FACT / HYP / ASSUMPTION (ours). Sources: see experiment-g.html#src.
   Loaded in the browser as window.ExptG and in Node via require() for the Python/JS compare. */
(function (root) {
  "use strict";
  var C = {
    e: 1.602176634e-19, hbar: 1.054571817e-34, a0: 5.29177210903e-11, c: 299792458.0,
    eps0: 8.8541878128e-12, mu0: 1.25663706212e-6, kB: 1.380649e-23, mH: 1.6735575e-27, h: 6.62607015e-34,
    E2S: 82258.9543992821, E2P12: 82258.9191133, E2P32: 82259.2850014,   // FACT NIST ASD H I, cm^-1
    gam: 6.2648e8,         // FACT NIST ASD A(2P1/2 -> 1S), s^-1
    A2E1: 8.2283,          // FACT Klarsfeld 1969, s^-1
    NS_C: 202.0, NS_alpha: 0.88, NS_beta: 1.53, NS_gamma: 0.8,          // FACT Nussbaumer & Schmutz 1984
    lamLya_nm: 121.567, f1S2S_Hz: 2466061413187035.0, landhuis_k: 2800.0
  };
  C.eta0 = C.mu0 * C.c;
  var CM1_MHZ = 29979.2458;
  var L_MHZ = (C.E2S - C.E2P12) * CM1_MHZ, S32_MHZ = (C.E2P32 - C.E2S) * CM1_MHZ;
  var WL = 2 * Math.PI * L_MHZ * 1e6, W32 = 2 * Math.PI * S32_MHZ * 1e6;
  var FWHM_MHZ = C.gam / (2 * Math.PI) / 1e6;
  var NP2DB = 20 / Math.log(10);
  function x(E) { return C.e * C.a0 * E / C.hbar; }

  // ---- 2S chain ----
  function rate_ac(E0, f) {           // FACT L&R 1950 Eq.25 (SI), both rotating terms + 2P3/2 path; E0 peak
    var w = 2 * Math.PI * f, g = C.gam, xx = x(E0) * x(E0);
    var r = g * 3 * xx / 4 * (1 / ((WL - w) * (WL - w) + g * g / 4) + 1 / ((WL + w) * (WL + w) + g * g / 4));
    r += g * 6 * xx / 4 * (1 / ((W32 + w) * (W32 + w) + g * g / 4) + 1 / ((W32 - w) * (W32 - w) + g * g / 4));
    return r;
  }
  function rate_res_simple(E0) { return 3 * x(E0) * x(E0) / C.gam; }   // FACT L&R Eq.26
  function rate_static(E) {           // FACT L&R Eq.42 + 2P3/2 term
    var g = C.gam;
    return g * x(E) * x(E) * (3 / (WL * WL + g * g / 4) + 6 / (W32 * W32 + g * g / 4));
  }
  function lorentz_factor(df) { var hw = FWHM_MHZ / 2; return hw * hw / (df * df + hw * hw); }
  // ---- hyperfine (FACT: Bullis et al. PRL 130, 203001 (2023); Lundeen et al. PRL 34, 377 (1975); branching 2/3, 1/3) ----
  var HFS_2S = 177.55683887, HFS_2P12 = 59.22;
  function hfs(F, A) { return F === 1 ? A / 4 : -3 * A / 4; }
  var HF_COMP = { F1: [[(L_MHZ + hfs(1, HFS_2S) - hfs(1, HFS_2P12)) * 1e6, 2 / 3], [(L_MHZ + hfs(1, HFS_2S) - hfs(0, HFS_2P12)) * 1e6, 1 / 3]],
                  F0: [[(L_MHZ + hfs(0, HFS_2S) - hfs(1, HFS_2P12)) * 1e6, 1.0]] };
  function rate_hf(E0, f, hf) {
    if (hf === undefined) hf = "F1";
    var r = rate_ac(E0, f); if (!HF_COMP[hf]) return r;
    var w = 2 * Math.PI * f, g = C.gam, k = g * 3 * x(E0) * x(E0) / 4;
    r -= k / ((WL - w) * (WL - w) + g * g / 4);
    HF_COMP[hf].forEach(function (c) { var d = 2 * Math.PI * c[0] - w; r += c[1] * k / (d * d + g * g / 4); });
    return r;
  }
  function rate_bbr(T) {               // ours: Planck spectrum x Lamb matrix elements (Gallagher & Cooke 1979)
    if (T <= 0) return 0;
    var U = function (nu) { return 8 * Math.PI * C.h * nu * nu * nu / Math.pow(C.c, 3) / Math.expm1(C.h * nu / (C.kB * T)) / C.eps0; };
    return 0.5 * Math.pow(C.e / C.hbar, 2) * (3 * C.a0 * C.a0 * U(L_MHZ * 1e6) + 6 * C.a0 * C.a0 * U(S32_MHZ * 1e6));
  }
  function ns_A(y) {                  // FACT Nussbaumer & Schmutz 1984
    if (y <= 0 || y >= 1) return 0;
    var w = y * (1 - y), q = Math.pow(4 * w, C.NS_gamma);
    return C.NS_C * (w * (1 - q) + C.NS_alpha * Math.pow(w, C.NS_beta) * q);
  }
  function ns_int(y1, y2, n) {
    n = n || 4000; y1 = Math.max(0, y1); y2 = Math.min(1, y2);
    if (y2 <= y1) return 0;
    if (n % 2) n += 1;
    var h = (y2 - y1) / n, s = ns_A(y1) + ns_A(y2);
    for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * ns_A(y1 + i * h);
    return s * h / 3;
  }
  function twoE1_band(fwhm, lamc, detlo, dethi) {   // ASSUMPTION top-hat filter; CsI 115-200 nm (R6835)
    lamc = lamc || 121.6; detlo = detlo || 115.0; dethi = dethi || 200.0;
    var lam = C.lamLya_nm;
    var ylo = lam / (lamc + fwhm / 2), yhi = Math.min(1, lam / (lamc - fwhm / 2));
    var Fb = ns_int(ylo, yhi);
    var Fo = ns_int(lam / dethi, Math.min(1, lam / detlo)) - Fb;
    return [Fb, Fo];
  }
  function filt_T(lam, W, shape, lc, block) {   // ASSUMPTION: Lorentz/Gauss passband, floor 1e-4 (115-200 nm), 1e-4/8500 above 200 nm
    if (lc === undefined) lc = 121.6; if (block === undefined) block = 1e-4;
    if (lam < 115) return 0;
    var t = shape === "gauss" ? Math.exp(-4 * Math.log(2) * (lam - lc) * (lam - lc) / (W * W)) : 1 / (1 + 4 * (lam - lc) * (lam - lc) / (W * W));
    return Math.max(t, lam <= 200 ? block : block / 8500);
  }
  var A_INT = null, F2_CACHE = {};
  function F2E1(W, shape, n) {
    n = n || 20000; var key = W + "|" + shape + "|" + n; if (F2_CACHE[key] !== undefined) return F2_CACHE[key];
    if (A_INT === null) A_INT = ns_int(0, 1, n);
    var lam = C.lamLya_nm, y200 = lam / 200;
    var f = function (y) { return y > 0 ? ns_A(y) * filt_T(lam / y, W, shape) : 0; };
    var simp = function (a, b) { var h = (b - a) / n, t = f(a) + f(b); for (var i = 1; i < n; i++) t += (i % 2 ? 4 : 2) * f(a + i * h); return t * h / 3; };
    var v = 2 * (simp(1e-12, y200) + simp(y200, 1 - 1e-12)) / A_INT / filt_T(lam, W, shape);
    F2_CACHE[key] = v; return v;
  }
  var BC_G = 573.5, SLOPE_MHZ_G = 1.82;
  function rate_mag(Eperp, fdrive, B, Bc, slope) {   // ASSUMPTION linear splitting near crossing
    Bc = Bc || BC_G; slope = slope || SLOPE_MHZ_G;
    var fbe = slope * (Bc - B) * 1e6, d = Math.abs(fdrive) - Math.abs(fbe), g = C.gam;
    return 6 * x(Eperp) * x(Eperp) / g * (g * g / 4) / (Math.pow(2 * Math.PI * d, 2) + g * g / 4);
  }
  function v_th(T) { return Math.sqrt(C.kB * T / C.mH); }

  // ---- seawater: Meissner & Wentz 2004 ----
  var MW_A = [5.7230e+00, 2.2379e-02, -7.1237e-04, 5.0478e+00, -7.0315e-02, 6.0059e-04, 3.6143e+00,
    2.8841e-02, 1.3652e-01, 1.4825e-03, 2.4166e-04];
  var MW_B = [-3.56417e-03, 4.74868e-06, 1.15574e-05, 2.39357e-03, -3.13530e-05, 2.52477e-07,
    -6.28908e-03, 1.76032e-04, -9.22144e-05, -1.99723e-02, 1.81176e-04, -2.04265e-03, 1.57883e-04];
  function mw_sigma(T, S) {
    var s35 = 2.903602 + 8.607e-2 * T + 4.738817e-4 * T * T - 2.991e-6 * T * T * T + 4.3047e-9 * T * T * T * T;
    var R15 = S * (37.5109 + 5.45216 * S + 1.4409e-2 * S * S) / (1004.75 + 182.283 * S + S * S);
    var a0 = (6.9431 + 3.2841 * S - 9.9486e-2 * S * S) / (84.850 + 69.024 * S + S * S);
    var a1 = 49.843 - 0.2276 * S + 0.198e-2 * S * S;
    return s35 * R15 * (1 + a0 * (T - 15) / (a1 + T));
  }
  // complex helpers [re, im]
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
    var re = t1[0] + t2[0] + einf, im = t1[1] + t2[1] - sig / (2 * Math.PI * C.eps0 * fG * 1e9);
    return { re: re, im: im, sigma: sig };
  }
  function water(f, T, S) {
    var e = mw_eps(f / 1e9, T, S), ep = e.re, epp = -e.im, w = 2 * Math.PI * f;
    var sq = csqrt([ep, -epp]);
    var alpha_tem = -(w / C.c) * sq[1], beta_tem = (w / C.c) * sq[0];
    var eta = cdiv([C.eta0, 0], sq);
    var tand = epp / ep;
    var Zslw = C.eta0 / Math.sqrt(ep) / Math.hypot(1, tand);        // HYP Eq.37 far field
    var sigH = C.eps0 * epp * w;                                      // Hively sigma = eps0 eps'' omega
    var alpha_J = sigH * Zslw / 2;                                    // ASSUMPTION (ours)
    return { ep: ep, epp: epp, sigma: e.sigma, sigH: sigH, tand: tand, alpha_tem: alpha_tem, beta_tem: beta_tem,
      lam_water: 2 * Math.PI / beta_tem, eta_abs: Math.hypot(eta[0], eta[1]), eta_phase: Math.atan2(eta[1], eta[0]),
      Zslw: Zslw, alpha_J: alpha_J };
  }
  function alpha_slw(mode, wt, custom) {
    if (mode === "errata0") return 0;
    if (mode === "joule") return wt.alpha_J;
    if (mode === "tem") return wt.alpha_tem;
    return custom || 0;
  }
  function field_at(r, P, alpha, Z, costh) { costh = costh || 1; return Math.sqrt(2 * Z * P / (4 * Math.PI * r * r * costh)) * Math.exp(-alpha * r); }
  function log10_field_at(r, P, alpha, Z, costh) { costh = costh || 1; return 0.5 * Math.log10(2 * Z * P / (4 * Math.PI * r * r * costh)) - alpha * r / Math.LN10; }
  function power_for(E, r, alpha, Z, costh) { costh = costh || 1; return Math.log10(E * E * 4 * Math.PI * r * r * costh / (2 * Z)) + 2 * alpha * r / Math.LN10; }

  var DEFAULTS = { f_d: L_MHZ * 1e6, eta_c: 1.0, T_w: 15.0, S: 35.0, r: 1.0, P_tx: 1.0, slw_mode: "joule", alpha_custom: 0.0, /* default Joule-literal (Dan rule); Erratum = toggle */
    T_hull: 1.0, T_cage: 1.0, SE_cage: 80.0, SE_hull_tem: 0.0, hf: "F1",
    N2S: 5e7, eps_det: 3e-7, R_dark: 1.66, filt_fwhm: 10.0, filt_shape: "lorentz", block: 1e-4,
    E_stray: 0.0, G_stray: 1.7717, B_stray: 1e-3, T_atom: 100e-6, T_bbr: 290.0, SNR: 5.0, T_int: 1.0, cps_max: 15e6,
    E_ads_ext: 0.0173, duty_ads: 1e-3, E_gps_ext: 2.82e-6, E_wifi_ext: 0.0, duty_wifi: 1.0, E_dme_ext: 0.0, duty_dme: 1e-3 };
  var F_ADS = 1090e6, F_GPS_L2 = 1227.6e6, F_WIFI = 2437e6, F_DME = 1058e6;
  function snrf(S, B, T) { return (S + B) > 0 ? S * Math.sqrt(T / 2) / Math.sqrt(S + 2 * B) : 0; }   // ASSUMPTION on/off keying

  function link(p) {
    var q = {}, k; for (k in DEFAULTS) q[k] = DEFAULTS[k]; if (p) for (k in p) q[k] = p[k];
    var wt = water(q.f_d, q.T_w, q.S);
    var a_s = alpha_slw(q.slw_mode, wt, q.alpha_custom);
    var costh = Math.cos(wt.eta_phase);
    var E_out_slw = field_at(q.r, q.P_tx, a_s, wt.Zslw);
    var E_det_slw = E_out_slw * q.T_hull * q.T_cage;
    var E_out_tem = field_at(q.r, q.P_tx, wt.alpha_tem, wt.eta_abs, costh);
    var etaw = cdiv([C.eta0, 0], csqrt([wt.ep, -wt.epp]));
    var den = [C.eta0 + etaw[0], etaw[1]], tauc = cdiv([2 * C.eta0, 0], den), tau = Math.hypot(tauc[0], tauc[1]);
    var att = Math.pow(10, -(q.SE_hull_tem + q.SE_cage) / 20);
    var E_det_tem = E_out_tem * tau * att;
    var N = q.N2S, eps = q.eps_det, hf = q.hf;
    var K1 = q.eta_c * rate_hf(1e-6, q.f_d, hf);                 // HYP eta
    var G_sig = K1 * Math.pow(E_det_slw / 1e-6, 2), G_tem = rate_hf(E_det_tem, q.f_d, hf);
    var F2 = F2E1(q.filt_fwhm, q.filt_shape);
    var E_mot = v_th(q.T_atom) * q.B_stray * 1e-4;
    var E_dc = Math.sqrt(q.E_stray * q.E_stray + E_mot * E_mot);
    var G_dc = rate_static(E_dc) + q.G_stray, G_bbr = rate_bbr(q.T_bbr);
    var G_ads = rate_hf(q.E_ads_ext * att, F_ADS, hf) * q.duty_ads;
    var G_gps = rate_hf(q.E_gps_ext * att, F_GPS_L2, hf);
    var G_wifi = rate_hf(q.E_wifi_ext * att, F_WIFI, hf) * q.duty_wifi;
    var G_dme = rate_hf(q.E_dme_ext * att, F_DME, hf) * q.duty_dme;
    var g_b = C.A2E1 * F2 + G_dc + G_bbr + G_ads + G_gps + G_wifi + G_dme + G_tem;
    var G0 = C.A2E1 + G_dc + G_bbr + G_ads + G_gps + G_wifi + G_dme + G_tem;
    var dep = function (Gs) { return G0 / (G0 + Gs); };
    var D = dep(G_sig), NDe = N * D * eps;
    var R = { sig: NDe * G_sig, tem_leak: NDe * G_tem, twoE1: NDe * C.A2E1 * F2, stark: NDe * G_dc, bbr: NDe * G_bbr,
      ads: NDe * G_ads, gps: NDe * G_gps, wifi: NDe * G_wifi, dme: NDe * G_dme, dark: q.R_dark };
    var Rb = R.twoE1 + R.stark + R.bbr + R.ads + R.gps + R.wifi + R.dme + R.tem_leak + R.dark;
    var T = q.T_int, K = q.SNR;
    var snr = snrf(R.sig, Rb, T);
    var f = function (lg) { var G = Math.pow(10, lg), dd = dep(G); return snrf(N * eps * G * dd, N * eps * g_b * dd + q.R_dark, T) - K; };
    var lo = -40, hi = 12, G_req;
    if (f(hi) < 0) G_req = Infinity;
    else if (f(lo) >= 0) G_req = Math.pow(10, lo);
    else { for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (f(m) >= 0) hi = m; else lo = m; } G_req = Math.pow(10, (lo + hi) / 2); }
    var E_req_det = isFinite(G_req) ? 1e-6 * Math.sqrt(G_req / K1) : Infinity;
    var E_req_out = E_req_det / (q.T_hull * q.T_cage);
    var a = eps * G_sig * D, b = eps * g_b * D, d = q.R_dark;
    var N_req = a > 1e-150 ? /* guard: a^2 underflow */ (K * K * (a + 2 * b) + Math.sqrt(Math.pow(K, 4) * (a + 2 * b) * (a + 2 * b) + 8 * T / 2 * a * a * K * K * d)) / (T * a * a) : Infinity;
    var cps = R.sig + Rb;
    return { q: q, wt: wt, alpha_slw: a_s, E_out_slw: E_out_slw, E_det_slw: E_det_slw, E_out_tem: E_out_tem, tau_wa: tau,
      E_det_tem: E_det_tem, G_sig: G_sig, G_tem: G_tem, G_dc: G_dc, G_bbr: G_bbr, E_mot: E_mot, E_dc: E_dc, F2: F2, g_b: g_b, G0: G0,
      dep: D, R: R, Rb: Rb, snr: snr, G_req: G_req, E_req_det: E_req_det, E_req_out: E_req_out, N_req: N_req,
      cps: cps, counter_sat: cps > q.cps_max, K1: K1 };
  }
  function ptx_required(r, Ereq, wt, mode, custom) {
    if (mode === "TEM") return power_for(Ereq, r, wt.alpha_tem, wt.eta_abs, Math.cos(wt.eta_phase));
    return power_for(Ereq, r, alpha_slw(mode, wt, custom), wt.Zslw);
  }
  function max_range(P, Ereq, wt, mode, custom) {   // largest r in [1e-3, 1e5] m with required power <= P (bisection on log r)
    var lp = Math.log10(P), f = function (lr) { return ptx_required(Math.pow(10, lr), Ereq, wt, mode, custom) - lp; };
    var lo = -3, hi = 5;
    if (f(lo) > 0) return 0;
    if (f(hi) <= 0) return Math.pow(10, hi);
    for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (f(m) <= 0) lo = m; else hi = m; }
    return Math.pow(10, (lo + hi) / 2);
  }
  var api = { C: C, L_MHZ: L_MHZ, S32_MHZ: S32_MHZ, FWHM_MHZ: FWHM_MHZ, NP2DB: NP2DB, BC_G: BC_G, SLOPE_MHZ_G: SLOPE_MHZ_G,
    rate_ac: rate_ac, rate_res_simple: rate_res_simple, rate_static: rate_static, lorentz_factor: lorentz_factor,
    ns_A: ns_A, ns_int: ns_int, twoE1_band: twoE1_band, rate_hf: rate_hf, rate_bbr: rate_bbr, filt_T: filt_T, F2E1: F2E1, HF_COMP: HF_COMP, rate_mag: rate_mag, v_th: v_th, mw_sigma: mw_sigma, mw_eps: mw_eps,
    water: water, alpha_slw: alpha_slw, field_at: field_at, log10_field_at: log10_field_at, power_for: power_for,
    DEFAULTS: DEFAULTS, link: link, ptx_required: ptx_required, max_range: max_range, F_ADS: F_ADS, F_GPS_L2: F_GPS_L2, F_WIFI: F_WIFI, F_DME: F_DME,
    C: C, L_MHZ: L_MHZ, FWHM_MHZ: FWHM_MHZ, NP2DB: NP2DB, BC_G: BC_G, SLOPE_MHZ_G: SLOPE_MHZ_G,
    VERSION: "expt-g-v0.1" };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.ExptG = api;
})(this);
