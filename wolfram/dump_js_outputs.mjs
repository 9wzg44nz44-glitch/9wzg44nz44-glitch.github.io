// dump_js_outputs.mjs — evaluates the JS engine (js/fx1-snr.js) on the fixed lockstep test grid and writes js_outputs.json.
// Grid v0.2 (identical to FX1Grid[] in FX1SNR.wl and to py_check.py):
//  A) interior: radii {bowls_11in, KB2016_2p5in, KB1820_0p75in} (default shell/seam per radius) × drives {+2, −19 dBm} × factor source {manual, faq}
//     × seam ∈ openems.seam_options × direction {eq, axis, obl} × r/R ∈ interior_grid_rR   (f = 433.59 MHz, RBW 10 kHz, LNA off)
//  B) exterior: radii × drives × factor source × all STACK_PRESETS × all distance presets (gap 0.20 m, extModel auto)
//  C) exterior geometry/frequency sweep: bowls × drives × factor source × f ∈ {433.59, 1296, 2450} MHz × gap ∈ {0.01, 0.20} m × distance presets, open air
//  D) interior interpolation: bowls, +2 dBm, manual × seam × direction × r/R ∈ {0.1, 0.6, 0.8, 0.95}
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const here = path.dirname(new URL(import.meta.url).pathname);
const pick = (...c) => c.find((p) => fs.existsSync(p)) || c[0];  // sim-lab layout first, then repo layout (wolfram/ next to ../js)
const jsPath = process.argv[2] || pick(path.join(here, "web/js/fx1-snr.js"), path.join(here, "../js/fx1-snr.js"));
const outPath = process.argv[3] || path.join(here, "js_outputs.json");
const FX1 = require(jsPath);
const K = FX1.K;
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : null);
const radiusKeys = ["bowls_11in", "KB2016_2p5in", "KB1820_0p75in"];
const driveKeys = ["tinysa_plus_zeenko", "tinysa_alone"];
const srcs = ["manual", "faq"];
const dirs = ["eq", "axis", "obl"];
const f0 = K.freq_presets_Hz.f433;
const recs = [];
function applyStackPreset(base, sk) {
  const s = FX1.STACK_PRESETS[sk];
  return Object.assign({}, base, { tents: s.tents, stack: Object.assign({}, s.stack), errata: s.errata, cageOhm: s.cageOhm });
}
function extRec(s, meta) {
  const probes = {};
  for (const pr of FX1.PROBES) {
    const q = s.probes[pr];
    probes[pr] = { K: num(q.K), label: q.label, std: num(q.ext_std.dBm), std_A: num(q.ext_std_A.dBm), std_B: num(q.ext_std_B.dBm), std_C: num(q.ext_std_C.dBm), std_O: num(q.ext_std_O.dBm), hyp: num(q.ext_hyp.dBm) };
  }
  const ex = s.exterior;
  return Object.assign(meta, { model: ex.model, dataset: ex.sel.dataset,
    E_A: num(ex.A.E), E_B: ex.B ? num(ex.B.E) : null, B_B: ex.B ? num(ex.B.B) : null, E_C: ex.C ? num(ex.C.E) : null, B_C: ex.C ? num(ex.C.B) : null,
    E_O: ex.O ? num(ex.O.E) : null, B_O: ex.O ? num(ex.O.B) : null,
    E_hyp: num(ex.E_hyp), stack_std_dB: num(s.stack.stdDb), alphaL: num(s.stack.alphaL), mP: num(s.stack.mP), floor_dBm: num(s.floor_dBm), probes });
}
for (const rk of radiusKeys) for (const dk of driveKeys) for (const src of srcs) {
  const base = Object.assign(FX1.defaults(), {
    f: f0, R: K.radius_presets_m[rk], shellMat: K.radius_default_shell[rk], seamOn: K.radius_default_seam[rk],
    P_dBm: K.drive.presets_dBm[dk], factorSrc: src
  });
  for (const seam of K.openems.seam_options) for (const dir of dirs) for (const x of K.interior_grid_rR) {
    const s = FX1.compute(Object.assign({}, base, { rR: x, seam: seam, intDir: dir }));
    const probes = {};
    for (const pr of FX1.PROBES) {
      const q = s.probes[pr];
      probes[pr] = { K: num(q.K), label: q.label, std: num(q.int_std.dBm), hyp: num(q.int_hyp.dBm), std_snr: num(q.int_std.snr), hyp_snr: num(q.int_hyp.snr) };
    }
    recs.push({ kind: "interior", radius: rk, drive: dk, factorSrc: src, seam: seam, dir: dir, rR: x, V0: num(s.V0), E_ref: num(s.interior.E_ref),
      SE_shell: num(s.shell.SE), leak_src: s.interior.leak.src, unresolved: s.interior.leak.unresolved,
      E_leak: num(s.interior.E_leak), B_leak: num(s.interior.B_leak), E_hyp: num(s.interior.E_hyp), floor_dBm: num(s.floor_dBm), probes });
  }
  for (const sk of Object.keys(FX1.STACK_PRESETS)) for (const dp of FX1.distancePresets(f0)) {
    const s = FX1.compute(Object.assign(applyStackPreset(base, sk), { d: dp.d }));
    recs.push(extRec(s, { kind: "exterior", radius: rk, drive: dk, factorSrc: src, stack: sk, f_Hz: f0, gap_m: base.gap, dist: dp.id, d_m: dp.d }));
  }
}
for (const dk of driveKeys) for (const src of srcs) for (const fk of ["f433", "f1296", "f2450"]) for (const gap of [0.01, 0.2]) {
  const f = K.freq_presets_Hz[fk];
  const base = Object.assign(FX1.defaults(), { f: f, R: K.radius_presets_m.bowls_11in, P_dBm: K.drive.presets_dBm[dk], factorSrc: src, gap: gap });
  for (const dp of FX1.distancePresets(f)) {
    const s = FX1.compute(Object.assign({}, applyStackPreset(base, "open_air"), { d: dp.d }));
    recs.push(extRec(s, { kind: "exterior_sweep", radius: "bowls_11in", drive: dk, factorSrc: src, stack: "open_air", f_Hz: f, gap_m: gap, dist: dp.id, d_m: dp.d }));
  }
}
// D) interior interpolation check (between openEMS samples + beyond the last sample): bowls, +2 dBm, manual
{
  const base = Object.assign(FX1.defaults(), { f: f0, R: K.radius_presets_m.bowls_11in, P_dBm: K.drive.presets_dBm.tinysa_plus_zeenko, factorSrc: "manual" });
  for (const seam of K.openems.seam_options) for (const dir of dirs) for (const x of [0.1, 0.6, 0.8, 0.95]) {
    const s = FX1.compute(Object.assign({}, base, { rR: x, seam: seam, intDir: dir }));
    recs.push({ kind: "interior_interp", seam: seam, dir: dir, rR: x, leak_src: s.interior.leak.src, unresolved: s.interior.leak.unresolved,
      E_leak: num(s.interior.E_leak), B_leak: num(s.interior.B_leak), E_hyp: num(s.interior.E_hyp), E5_std: num(s.probes.E5.int_std.dBm), H10_std: num(s.probes.H10.int_std.dBm) });
  }
}
const counts = recs.reduce((a, r) => ((a[r.kind] = (a[r.kind] || 0) + 1), a), {});
const out = { version: K.PHYSICS_VERSION, f_Hz: f0, rbw_Hz: K.tinysa_floor.rbw_default_Hz, lna: false, counts: counts, records: recs };
fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`wrote ${outPath}: ${recs.length} records ${JSON.stringify(counts)}, version ${out.version}`);
