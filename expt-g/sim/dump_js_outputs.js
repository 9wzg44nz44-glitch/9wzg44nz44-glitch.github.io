// node dump_js_outputs.js <engine.js> <grid_spec.json> <out.json>  - JS twin of run_grid.py
const G = require(require("path").resolve(process.argv[2]));
const spec = require(require("path").resolve(process.argv[3]));
const out = { water: [], rate_ac: [], rate_static: [], rate_mag: [], f2: [], rate_hf: [], bbr: [], link: [], ptx: [], maxrange: [] };
const KW = ["ep", "epp", "sigma", "sigH", "tand", "alpha_tem", "beta_tem", "eta_abs", "eta_phase", "Zslw", "alpha_J"];
for (const [f, T, S] of spec.water) { const w = G.water(f, T, S); out.water.push(KW.map(k => w[k])); }
for (const [E, f] of spec.rate_ac) out.rate_ac.push(G.rate_ac(E, f));
for (const E of spec.rate_static) out.rate_static.push(G.rate_static(E));
for (const [E, f, B] of spec.rate_mag) out.rate_mag.push(G.rate_mag(E, f, B));
for (const [W, sh] of spec.f2) out.f2.push(G.F2E1(W, sh));
for (const [E, f, hf] of spec.rate_hf) out.rate_hf.push(G.rate_hf(E, f, hf));
for (const T of spec.bbr) out.bbr.push(G.rate_bbr(T));
const LK = ["E_det_slw", "E_det_tem", "G_sig", "G_dc", "G_bbr", "F2", "dep", "Rb", "snr", "G_req", "E_req_det", "E_req_out", "N_req", "cps"];
const RK = ["sig", "tem_leak", "twoE1", "stark", "bbr", "ads", "gps", "wifi", "dme", "dark"];
for (const p of spec.link) { const L = G.link(p); out.link.push(LK.map(k => L[k]).concat(RK.map(k => L.R[k]))); }
const wt = G.water(G.L_MHZ * 1e6, 15, 35), E0 = G.link().E_req_out;
for (const [r, m] of spec.ptx) out.ptx.push(G.ptx_required(r, E0, wt, m));
for (const [P, m] of spec.maxrange) out.maxrange.push(G.max_range(P, E0, wt, m));
require("fs").writeFileSync(process.argv[4], JSON.stringify(out, (k, v) => (typeof v === "number" && !isFinite(v)) ? (isNaN(v) ? "NaN" : (v > 0 ? "Infinity" : "-Infinity")) : v));
console.log("wrote", process.argv[4]);
