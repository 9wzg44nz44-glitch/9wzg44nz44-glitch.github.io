/* Experiment G page UI (expt-g-v0.1; default SLW loss = Joule-literal since 2026-09-25). Physics lives in expt-g-engine.js (window.ExptG). */
(function () {
  "use strict";
  var G = window.ExptG; if (!G) return;
  var PRESETS = { lab: { N2S: 5e7, eps_det: 3e-7, R_dark: 1.66, filt_shape: "lorentz", E_stray: 0, G_stray: 1.7717 },
    opt: { N2S: 2.2e9, eps_det: 0.039, R_dark: 0.02, filt_shape: "gauss", E_stray: 0.01, G_stray: 0 } };
  var DET_HINT = { lab: "Landhuis-style trapped H: 5×10⁷ atoms in 2S (FACT), efficiency 3×10⁻⁷ incl. a 10 nm filter, stray-field quench ≤1.77/s (Landhuis best), MCP dark 1.66/s.",
    opt: "Best possible from cited parts: efficiency 0.039 (ceiling), 2.2×10⁹ atoms (the most one 15 Mcps counter can handle), 10 mV/m stray field, dark 0.02/s (ASSUMPTION)." };
  var S = {}; var k; for (k in G.DEFAULTS) S[k] = G.DEFAULTS[k];
  S.det = "lab"; S.r = 0.05; S.P_tx = 1; S.dfMHz = 0;   // front default 5 cm: inside the default (Joule-loss) range
  function applyPreset() { var p = PRESETS[S.det]; for (var kk in p) S[kk] = p[kk]; }
  applyPreset();
  var $ = function (id) { return document.getElementById(id); };

  // ---------- formatting ----------
  var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  function sci(v, d) { d = d || 2; if (v === 0) return "0"; if (!isFinite(v)) return "∞"; var s = v.toExponential(d - 1).split("e"); var ex = String(parseInt(s[1], 10)).split("").map(function (c) { return SUP[c] || c; }).join(""); return s[0] + "×10" + ex; }
  function g3(v) { return (v !== 0 && (Math.abs(v) < 0.01 || Math.abs(v) >= 1e4)) ? sci(v) : String(Number(v.toPrecision(3))); }
  function fE(E) { if (!(E > 0)) return "0"; if (E >= 1) return g3(E) + " V/m"; if (E >= 1e-3) return g3(E * 1e3) + " mV/m"; if (E >= 1e-6) return g3(E * 1e6) + " µV/m"; return sci(E) + " V/m"; }
  function fElog(lg) { return lg > -300 ? fE(Math.pow(10, lg)) : "10<sup>" + lg.toFixed(0) + "</sup> V/m"; }
  function fR(r) { if (r <= 0) return "&lt;1 mm"; if (r < 1) return g3(r * 100) + " cm"; if (r < 1e3) return g3(r) + " m"; return g3(r / 1e3) + " km"; }
  function fP(lp) { if (lp < -2.5 || lp > 5.5) return Math.abs(lp) >= 10 ? "10<sup>" + lp.toFixed(0) + "</sup> W" : sci(Math.pow(10, lp)) + " W"; var P = Math.pow(10, lp); if (P < 1) return g3(P * 1e3) + " mW"; if (P < 1e3) return g3(P) + " W"; return g3(P / 1e3) + " kW"; }
  var MODE_NAME = { joule: "Joule-loss term σE∥² (default)", tem: "TEM-equal loss (classical comparison)", errata0: "Erratum α = 0 (non-default toggle)", custom: "custom α" };

  // ---------- tiny SVG plotter ----------
  function plot(el, o) {
    var W = 800, H = o.h || 330, L = 70, R = 16, T = 14, B = 46;
    var X = function (v) { var t = o.xlog ? (Math.log10(v) - Math.log10(o.x0)) / (Math.log10(o.x1) - Math.log10(o.x0)) : (v - o.x0) / (o.x1 - o.x0); return L + t * (W - L - R); };
    var Y = function (v) { var t = o.ylog ? (v - o.y0) / (o.y1 - o.y0) : (v - o.y0) / (o.y1 - o.y0); return H - B - Math.max(-0.05, Math.min(1.05, t)) * (H - T - B); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Mono, monospace" font-size="13">';
    (o.bands || []).forEach(function (b) { s += '<rect x="' + X(b[0]) + '" y="' + T + '" width="' + Math.max(0, X(b[1]) - X(b[0])) + '" height="' + (H - T - B) + '" fill="' + (b[2] || "rgba(255,255,255,.08)") + '"/>'; });
    (o.xt || []).forEach(function (t) { var x = X(t[0]); s += '<line x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + (H - B) + '" stroke="rgba(255,255,255,.08)"/><text x="' + x + '" y="' + (H - B + 18) + '" fill="#9fb0cc" text-anchor="middle">' + t[1] + '</text>'; });
    (o.yt || []).forEach(function (t) { var y = Y(t[0]); s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="rgba(255,255,255,.08)"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" fill="#9fb0cc" text-anchor="end">' + t[1] + '</text>'; });
    s += '<clipPath id="cp' + el.id + '"><rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '"/></clipPath><g clip-path="url(#cp' + el.id + ')">';
    (o.hl || []).forEach(function (h) { var y = Y(h[0]); s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="' + h[1] + '" stroke-width="2" stroke-dasharray="7 5"/>'; });
    (o.vl || []).forEach(function (v) { var x = X(v[0]); s += '<line x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + (H - B) + '" stroke="' + v[1] + '" stroke-width="1.5" stroke-dasharray="3 4"/>' + (v[2] ? '<text x="' + (x + 3) + '" y="' + (T + 14 + (v[3] || 0)) + '" fill="' + v[1] + '" font-size="12">' + v[2] + '</text>' : ""); });
    o.series.forEach(function (sr) {
      var d = ""; sr.pts.forEach(function (p, i) { if (!isFinite(p[1])) return; d += (d ? "L" : "M") + X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); });
      s += '<path d="' + d + '" fill="none" stroke="' + sr.c + '" stroke-width="' + (sr.w || 2.5) + '"' + (sr.dash ? ' stroke-dasharray="' + sr.dash + '"' : "") + '/>';
    });
    s += '</g><rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" fill="none" stroke="rgba(255,255,255,.25)"/>';
    s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 8) + '" fill="#cdd6ea" text-anchor="middle">' + o.xlabel + '</text>';
    s += '<text x="14" y="' + ((T + H - B) / 2) + '" fill="#cdd6ea" text-anchor="middle" transform="rotate(-90 14 ' + ((T + H - B) / 2) + ')">' + o.ylabel + '</text></svg>';
    el.innerHTML = s;
  }
  function logspace(a, b, n) { var o = []; for (var i = 0; i < n; i++) o.push(Math.pow(10, a + (b - a) * i / (n - 1))); return o; }
  function decTicks(a, b, unitFn) { var o = []; for (var e = Math.ceil(a); e <= Math.floor(b); e++) o.push([e, unitFn(e)]); return o; }

  // ---------- compute & render ----------
  function params() { var p = {}; for (var kk in G.DEFAULTS) p[kk] = S[kk]; p.f_d = (G.L_MHZ + S.dfMHz) * 1e6; return p; }
  function render() {
    var p = params(), L = G.link(p), wt = L.wt;
    $("oR").textContent = fR(S.r).replace("&lt;", "<"); $("oP").innerHTML = fP(Math.log10(S.P_tx));
    $("detHint").textContent = DET_HINT[S.det] || "custom (All controls)";
    // SLW field at detector: use log form to avoid underflow
    var lgE = G.log10_field_at(S.r, S.P_tx, L.alpha_slw, wt.Zslw) + Math.log10(S.T_hull * S.T_cage);
    var lgT = G.log10_field_at(S.r, S.P_tx, wt.alpha_tem, wt.eta_abs, Math.cos(wt.eta_phase)) + Math.log10(L.tau_wa) - (S.SE_hull_tem + S.SE_cage) / 20;
    $("oEslw").innerHTML = fElog(lgE); $("oEslwN").textContent = MODE_NAME[S.slw_mode] + "; needs " + fE(L.E_req_det).replace("&lt;", "<");
    $("oEtem").innerHTML = fElog(lgT);
    $("oCounts").innerHTML = g3(L.R.sig) + " vs " + g3(L.Rb);
    var bnames = { stark: "stray-field quench", twoE1: "2E1 photons through the filter", dark: "detector dark counts", bbr: "blackbody quench", tem_leak: "ordinary-radio leak", ads: "ADS-B leak", dme: "DME leak", wifi: "Wi-Fi leak", gps: "GPS leak" };
    var big = "dark", bk; for (bk in bnames) if (L.R[bk] > L.R[big]) big = bk;
    $("oCountsN").textContent = "signal vs background per second (largest background: " + bnames[big] + ")";
    $("oSNR").textContent = L.snr > 0 ? g3(L.snr) : "0";
    var ok = L.snr >= S.SNR;
    var rMode = fR(G.max_range(S.P_tx, L.E_req_out, wt, S.slw_mode, S.alpha_custom)), rTem = fR(G.max_range(S.P_tx, L.E_req_out, wt, "tem"));
    $("headline").innerHTML = (ok ? "✅ Link works" : "❌ No link") + " at " + fR(S.r) + " with " + fP(Math.log10(S.P_tx)) + " — SLW loss: “" + MODE_NAME[S.slw_mode] + "”. Longest range at this power: <strong>" + rMode + "</strong>" +
      (S.slw_mode === "tem" ? "." : " (TEM-equal, classical comparison: " + rTem + ").") +
      (S.slw_mode === "errata0" ? " <span class=\"errtag\">Erratum toggle: Hively's 2022 no-loss claim, not the default; it conflicts with Experiment C's Joule-loss rule.</span>" : "");
    if (S.slw_mode === "custom") $("headline").innerHTML = (ok ? "✅ Link works" : "❌ No link") + " at " + fR(S.r) + " (custom α = " + g3(S.alpha_custom) + " Np/m).";
    var fl = [];
    if (S.r < wt.lam_water) fl.push("Range is under one wavelength in water (" + g3(wt.lam_water * 100) + " cm): near field, the far-field formula is only indicative (ASSUMPTION).");
    if (L.dep < 0.5) fl.push("The atoms are tickled faster (" + g3(L.G_sig) + " s⁻¹) than the pump replaces them: the cloud is down to " + g3(L.dep) + " of its size and the signal is saturating (ASSUMPTION: pumped steady cloud).");
    if (L.counter_sat) fl.push("Count rate " + g3(L.cps) + " /s is above one counter's 15 Mcps ceiling (FACT, Sjuts EDR CEM): numbers here are not achievable with one detector.");
    if (S.eps_det > 0.039) fl.push("Detection efficiency above 0.039 cannot be reached with the cited filter and photocathode.");
    if (L.R.tem_leak > 0.1 * L.R.sig && L.R.tem_leak > 0) fl.push("Ordinary-radio leakage through the cage gives " + g3(L.R.tem_leak) + " counts/s, comparable to the SLW signal: control (a) would fail.");
    if (S.T_w > 29 || S.T_w < -2) fl.push("Water temperature outside the Meissner–Wentz seawater validity range.");
    $("flags").innerHTML = fl.length ? "<ul><li>" + fl.join("</li><li>") + "</li></ul>" : "";
    // front plot
    var rs = logspace(-2, 3, 160), ymin = -12, ymax = 4;
    var ser = [["errata0", "#ffb86b"], ["tem", "#b9a2ff"], ["joule", "#ff6b6b"]].map(function (m) {
      var a = G.alpha_slw(m[0], wt); return { c: m[1], w: S.slw_mode === m[0] ? 3.5 : 1.8, dash: m[0] === "errata0" ? "6 5" : "", pts: rs.map(function (r) { return [r, Math.max(ymin - 1, G.log10_field_at(r, S.P_tx, a, wt.Zslw) + Math.log10(S.T_hull * S.T_cage))]; }) };
    });
    ser.push({ c: "#55d6be", w: 2, pts: rs.map(function (r) { return [r, Math.max(ymin - 1, G.log10_field_at(r, S.P_tx, wt.alpha_tem, wt.eta_abs, Math.cos(wt.eta_phase)) + Math.log10(L.tau_wa) - (S.SE_hull_tem + S.SE_cage) / 20)]; }) });
    plot($("plotFront"), { xlog: true, x0: 0.01, x1: 1000, y0: ymin, y1: ymax, series: ser, hl: [[Math.log10(L.E_req_det), "#ffffff"]],
      vl: [[S.r, "#9fb0cc", "you: " + fR(S.r)]], bands: [[0.01, wt.lam_water, "rgba(255,255,255,.07)"]],
      xt: [[0.01, "1 cm"], [0.1, "10 cm"], [1, "1 m"], [10, "10 m"], [100, "100 m"], [1000, "1 km"]],
      yt: [[3, "1 kV/m"], [0, "1 V/m"], [-3, "1 mV/m"], [-6, "1 µV/m"], [-9, "1 nV/m"], [-12, "1 pV/m"]],
      xlabel: "seawater range", ylabel: "peak field at the atoms" });
    renderSea(); render2E1(); renderLor(); renderMag(); renderAll(L); renderLinkLive(L);
  }
  function renderSea() {
    var fs = logspace(8, 10, 120), T = S.T_w, Sa = S.S;
    var w0 = G.water(G.L_MHZ * 1e6, T, Sa);
    plot($("plotSea"), { xlog: true, x0: 1e8, x1: 1e10, y0: 0, y1: 4, h: 300,
      series: [{ c: "#55d6be", pts: fs.map(function (f) { return [f, Math.log10(Math.max(1e-9, G.water(f, T, Sa).alpha_tem * G.NP2DB))]; }) },
               { c: "#ff6b6b", pts: fs.map(function (f) { return [f, Math.log10(Math.max(1e-9, G.water(f, T, Sa).alpha_J * G.NP2DB))]; }) }],
      vl: [[G.L_MHZ * 1e6, "#ffb86b", "1057.8 MHz"]], xt: [[1e8, "100 MHz"], [3e8, "300 MHz"], [1e9, "1 GHz"], [3e9, "3 GHz"], [1e10, "10 GHz"]],
      yt: [[0, "1"], [1, "10"], [2, "100"], [3, "1000"], [4, "10⁴"]], xlabel: "frequency", ylabel: "attenuation (dB/m, log)" });
    $("oTw").textContent = T + " °C"; $("oS").textContent = Sa;
    $("seaLive").innerHTML = "At 1057.8 MHz, " + T + " °C, S = " + Sa + ": ε′ = " + w0.ep.toFixed(1) + ", ε″ = " + w0.epp.toFixed(1) + ", σ = " + w0.sigma.toFixed(2) + " S/m. TEM: " + (w0.alpha_tem * G.NP2DB).toFixed(0) + " dB/m (1/e length " + g3(100 / w0.alpha_tem) + " cm). SLW with the Joule-loss term (default): " + (w0.alpha_J * G.NP2DB).toFixed(0) + " dB/m (" + g3(100 / w0.alpha_J) + " cm). SLW, Erratum toggle: 0 dB/m.";
  }
  function render2E1() {
    var ys = [], i; for (i = 0; i <= 200; i++) ys.push(i / 200);
    var lam = G.C.lamLya_nm, T0 = G.filt_T(lam, S.filt_fwhm, S.filt_shape);
    var yf = []; for (i = 0; i <= 400; i++) yf.push(0.6 + 0.4 * i / 400);
    plot($("plot2E1"), { x0: 0, x1: 1, y0: 0, y1: 24, h: 260, series: [{ c: "#b9a2ff", pts: ys.map(function (y) { return [y, G.ns_A(y)]; }) },
        { c: "#ffb86b", dash: "6 4", w: 2, pts: yf.map(function (y) { return [y, 24 * G.filt_T(lam / y, S.filt_fwhm, S.filt_shape) / T0]; }) }],
      vl: [[1, "#ffb86b", "Lyα line", 0]],
      xt: [[0, "0"], [0.25, "0.25"], [0.5, "0.5"], [0.75, "0.75"], [1, "1"]], yt: [[0, "0"], [8, "8"], [16, "16"], [24, "24"]],
      xlabel: "y = photon energy / Lyman-α energy", ylabel: "A(y) photons/atom/s per unit y" });
  }
  function renderLor() {
    var dfs = [], i; for (i = -500; i <= 500; i += 2.5) dfs.push(i);
    var r0 = G.rate_ac(1e-6, G.L_MHZ * 1e6);
    plot($("plotLor"), { x0: -500, x1: 500, y0: -25, y1: 1, h: 280,
      series: [{ c: "#ffb86b", pts: dfs.map(function (d) { return [d, 10 * Math.log10(G.rate_ac(1e-6, (G.L_MHZ + d) * 1e6) / r0)]; }) },
               { c: "#55d6be", pts: dfs.map(function (d) { return [d, 10 * Math.log10(G.rate_hf(1e-6, (G.L_MHZ + d) * 1e6, "F1") / r0)]; }) }],
      bands: [[1025 - G.L_MHZ, 1150 - G.L_MHZ, "rgba(255,107,107,.10)"]],
      vl: [[1030 - G.L_MHZ, "#9fb0cc", "SSR", 0], [1090 - G.L_MHZ, "#55d6be", "ADS-B", 16], [1227.6 - G.L_MHZ, "#b9a2ff", "GPS L2", 0], [300, "#ff6b6b", "(d) +300", 32], [-300, "#ff6b6b", "(d) −300", 32], [S.dfMHz, "#ffffff", "you", 48]],
      xt: [[-500, "−500"], [-250, "−250"], [0, "0"], [250, "+250"], [500, "+500"]], yt: [[0, "0 dB"], [-10, "−10"], [-20, "−20"]],
      xlabel: "detuning from 1057.8 MHz (MHz)   [pink band: DME interrogation 1025–1150 MHz]", ylabel: "relative tickle rate (dB)" });
    $("oDf").textContent = (S.dfMHz > 0 ? "+" : "") + S.dfMHz + " MHz (F=1 atoms: " + (10 * Math.log10(G.rate_hf(1e-6, (G.L_MHZ + S.dfMHz) * 1e6, "F1") / r0)).toFixed(1) + " dB)";
  }
  function renderMag() {
    var Bs = [], i; for (i = 0; i <= 300; i++) Bs.push(540 + 70 * i / 300);
    var lg = function (v) { return v > 0 ? Math.log10(v) : -30; };
    plot($("plotMag"), { x0: 540, x1: 610, y0: -14, y1: 6, h: 280,
      series: [{ c: "#ffb86b", pts: Bs.map(function (B) { return [B, lg(G.rate_mag(1e-6, 241e3, B))]; }) },
               { c: "#55d6be", pts: Bs.map(function (B) { return [B, lg(G.rate_mag(G.v_th(100e-6) * B * 1e-4, 0, B))]; }) },
               { c: "#ff6b6b", pts: Bs.map(function (B) { return [B, lg(G.rate_mag(G.v_th(5.8) * B * 1e-4, 0, B))]; }) }],
      vl: [[G.BC_G, "#ffffff", "573.5 G"]], xt: [[540, "540"], [560, "560"], [573.5, ""], [590, "590"], [610, "610 G"]],
      yt: [[-12, "1e-12"], [-8, "1e-8"], [-4, "1e-4"], [0, "1"], [4, "1e4"]], xlabel: "magnetic field B (gauss)", ylabel: "quench rate per atom (s⁻¹, log)" });
  }
  // ---------- All controls ----------
  var CTL = [
    ["eta_c", "η, SLW-to-atom coupling (HYP)", -12, 0, 0.5, true], ["T_hull", "T_hull, SLW field through hull (HYP)", -12, 0, 0.5, true],
    ["T_cage", "T_cage, SLW field through cage (HYP)", -6, 0, 0.25, true], ["SE_cage", "SE_cage, cage shielding for TEM (dB)", 40, 120, 1, false],
    ["N2S", "N_2S, atoms in 2S", 6, 12, 0.1, true], ["eps_det", "ε_det, detection efficiency", -6, Math.log10(0.3), 0.1, true],
    ["dfMHz", "Δf, detuning from 1057.8 MHz (MHz)", -500, 500, 5, false], ["B_stray", "B_stray, stray magnetic field (G)", -3, 0, 0.1, true],
    ["r", "range (m)", -2, 3, 0.05, true], ["P_tx", "P_TX, transmit power (W)", -3, 4, 0.1, true],
    ["alpha_custom", "α_SLW custom (Np/m); pick “custom” below", -3, 3, 0.1, true], ["E_stray", "E_stray, stray DC field (V/m)", -3, 2, 0.1, true],
    ["R_dark", "dark count rate (/s)", -2, 4, 0.1, true], ["G_stray", "extra stray quench per atom (/s; Landhuis best ≤1.77)", -4, 3, 0.1, true],
    ["T_bbr", "temperature of the cage interior (K), for blackbody quench", 4, 300, 1, false], ["T_int", "counting time T (s)", 0, 4, 0.1, true],
    ["T_w", "water temperature (°C)", -2, 29, 1, false], ["S", "salinity (ppt)", 0, 40, 1, false], ["filt_fwhm", "filter width FWHM (nm)", 1, 20, 1, false]
  ];
  var built = false;
  function buildAll() {
    var h = "";
    CTL.forEach(function (c) {
      var v = c[5] ? Math.log10(S[c[0]]) : S[c[0]];
      h += '<label>' + c[1] + ': <output id="ao_' + c[0] + '"></output><input type="range" data-k="' + c[0] + '" data-log="' + (c[5] ? 1 : 0) + '" min="' + c[2] + '" max="' + c[3] + '" step="' + c[4] + '" value="' + v + '"></label>';
    });
    h += '<label>α_SLW mode: <select id="aMode"><option value="joule">Joule-loss term (default)</option><option value="tem">TEM-equal (classical comparison)</option><option value="errata0">Erratum α = 0 (toggle, not default)</option><option value="custom">custom (slider)</option></select></label>';
    h += '<label>atom temperature (for v×B): <select id="aTat"><option value="0.0001">100 µK trapped</option><option value="5.8">5.8 K beam</option><option value="300">300 K</option></select></label>';
    h += '<label>filter shape: <select id="aShape"><option value="lorentz">Lorentzian (wide wings)</option><option value="gauss">Gaussian</option></select></label>';
    h += '<label>hyperfine state of the atoms: <select id="aHF"><option value="F1">F = 1 (trapped, FACT)</option><option value="F0">F = 0</option><option value="centroid">ignore hyperfine</option></select></label>';
    $("allCtl").innerHTML = h;
    $("allCtl").addEventListener("input", function (e) {
      var t = e.target; if (!t.dataset || !t.dataset.k) return;
      var v = parseFloat(t.value); S[t.dataset.k] = t.dataset.log === "1" ? Math.pow(10, v) : v; S.det = "custom"; syncSeg(); render();
    });
    $("aMode").addEventListener("change", function (e) { S.slw_mode = e.target.value; syncSeg(); render(); });
    $("aTat").addEventListener("change", function (e) { S.T_atom = parseFloat(e.target.value); render(); });
    $("aShape").addEventListener("change", function (e) { S.filt_shape = e.target.value; S.det = "custom"; syncSeg(); render(); });
    $("aHF").addEventListener("change", function (e) { S.hf = e.target.value; render(); });
    built = true;
  }
  function renderAll(L) {
    if (!built) buildAll();
    CTL.forEach(function (c) { var o = $("ao_" + c[0]); if (o) o.textContent = c[5] ? g3(S[c[0]]) : String(S[c[0]]); var inp = document.querySelector('#allCtl input[data-k="' + c[0] + '"]'); if (inp && document.activeElement !== inp) inp.value = c[5] ? Math.log10(S[c[0]]) : S[c[0]]; });
    $("aMode").value = S.slw_mode; $("aShape").value = S.filt_shape; $("aHF").value = S.hf;
    var R = L.R;
    $("allOut").innerHTML = '<div class="tbl-wrap"><table class="res"><tr><th>Quantity</th><th>Value</th></tr>' +
      [["α_SLW used", g3(L.alpha_slw) + " Np/m"], ["α_TEM", g3(L.wt.alpha_tem) + " Np/m"], ["SLW field at hull", fE(L.E_out_slw)], ["SLW field at atoms", fE(L.E_det_slw)],
       ["TEM field at atoms", fE(L.E_det_tem)], ["tickle rate per atom", g3(L.G_sig) + " s⁻¹"], ["signal counts", g3(R.sig) + " /s"],
       ["2E1 background", g3(R.twoE1) + " /s (" + g3(L.F2) + " photons per decay pass the filter)"], ["stray-field quench background", g3(R.stark) + " /s (E_dc = " + fE(L.E_dc) + " plus " + g3(S.G_stray) + " /s per atom)"],
       ["blackbody quench background", g3(R.bbr) + " /s (" + g3(L.G_bbr) + " /s per atom)"],
       ["ADS-B / GPS / Wi-Fi / DME", g3(R.ads) + " / " + g3(R.gps) + " / " + g3(R.wifi) + " / " + g3(R.dme) + " /s"],
       ["dark", g3(R.dark) + " /s"], ["own-TX TEM leak (coherent, control a)", g3(R.tem_leak) + " /s"],
       ["cloud left after depletion", g3(L.dep)], ["total count rate", g3(L.cps) + " /s" + (L.counter_sat ? " (above 15 Mcps!)" : "")], ["SNR in T", g3(L.snr)], ["field needed at atoms", fE(L.E_req_det)], ["N_2S needed at this field", g3(L.N_req)]]
        .map(function (r) { return "<tr><td>" + r[0] + '</td><td class="n">' + r[1] + "</td></tr>"; }).join("") + "</table></div>";
  }
  function renderLinkLive(L) {
    var rows = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 100, 1000].map(function (r) {
      return "<tr><td>" + fR(r) + "</td>" + ["joule", "tem", "errata0"].map(function (m) { return '<td class="n">' + fP(G.ptx_required(r, L.E_req_out, L.wt, m, S.alpha_custom)) + "</td>"; }).join("") +
        '<td class="n">' + fP(G.ptx_required(r, L.E_req_det * Math.sqrt(S.eta_c) * Math.pow(10, (S.SE_hull_tem + S.SE_cage) / 20) / L.tau_wa, L.wt, "TEM")) + "</td></tr>";
    }).join("");
    $("linkLive").innerHTML = "<h3>Live: power needed with your current settings</h3><div class=\"tbl-wrap\"><table class=\"res\"><tr><th>Range</th><th>SLW, Joule loss (default)</th><th>TEM-equal (classical)</th><th>Erratum α=0 (toggle)</th><th>Radio into cage</th></tr>" + rows + "</table></div>";
  }
  // ---------- wiring ----------
  function syncSeg() {
    document.querySelectorAll(".seg").forEach(function (g) { var key = g.dataset.seg, val = key === "det" ? S.det : S[key];
      g.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === val ? "true" : "false"); }); });
  }
  document.querySelectorAll(".seg").forEach(function (g) {
    g.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; var key = g.dataset.seg;
      if (key === "det") { S.det = b.dataset.v; applyPreset(); } else S[key] = b.dataset.v; syncSeg(); render(); });
  });
  $("fR").addEventListener("input", function (e) { S.r = Math.pow(10, parseFloat(e.target.value)); render(); });
  $("fP").addEventListener("input", function (e) { S.P_tx = Math.pow(10, parseFloat(e.target.value)); render(); });
  $("fTw").addEventListener("input", function (e) { S.T_w = parseFloat(e.target.value); render(); });
  $("fS").addEventListener("input", function (e) { S.S = parseFloat(e.target.value); render(); });
  $("fDf").addEventListener("input", function (e) { S.dfMHz = parseFloat(e.target.value); render(); });
  var tabs = document.querySelectorAll('.tabs button[role=tab]');
  function openTab(name, scroll) {
    tabs.forEach(function (b) { var on = b.dataset.tab === name; b.setAttribute("aria-selected", on ? "true" : "false"); var p = $("tab-" + b.dataset.tab); if (p) p.hidden = !on; });
    if (scroll) { var p = $("tab-" + name); if (p) p.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  tabs.forEach(function (b) { b.addEventListener("click", function () { openTab(b.dataset.tab, false); history.replaceState(null, "", "#" + b.dataset.tab); }); });
  document.querySelectorAll("[data-goto]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); openTab(a.dataset.goto, true); }); });
  var h = (location.hash || "").slice(1); openTab(document.getElementById("tab-" + h) ? h : "hively", false);
  syncSeg(); render();
})();
