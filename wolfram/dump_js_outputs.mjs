// dump_js_outputs.mjs — evaluates the JS engine (js/fx1-snr.js) on the fixed lockstep test grid and writes js_outputs.json.
// Grid (identical to FX1Grid[] in FX1SNR.wl): f = 433.59 MHz; radii {bowls_11in, KB2016_2p5in, KB1820_0p75in} (default shell/seam per radius);
// drives {tinysa_plus_zeenko (+2 dBm), tinysa_alone (−19 dBm)}; factor source {manual, faq}; RBW 10 kHz, LNA off;
// interior r/R ∈ interior_grid_rR; exterior: all STACK_PRESETS × all distance presets; probes E5/H10/H20/H5.
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
const f = K.freq_presets_Hz.f433;
const recs = [];
function applyStackPreset(base, sk) {
  const s = FX1.STACK_PRESETS[sk];
  return Object.assign({}, base, { tents: s.tents, stack: Object.assign({}, s.stack), errata: s.errata, cageOhm: s.cageOhm });
}
for (const rk of radiusKeys) for (const dk of driveKeys) for (const src of srcs) {
  const base = Object.assign(FX1.defaults(), {
    f: f, R: K.radius_presets_m[rk], shellMat: K.radius_default_shell[rk], seamOn: K.radius_default_seam[rk],
    P_dBm: K.drive.presets_dBm[dk], factorSrc: src
  });
  for (const x of K.interior_grid_rR) {
    const s = FX1.compute(Object.assign({}, base, { rR: x }));
    const probes = {};
    for (const pr of FX1.PROBES) {
      const q = s.probes[pr];
      probes[pr] = { K: num(q.K), label: q.label, std: num(q.int_std.dBm), hyp: num(q.int_hyp.dBm), std_snr: num(q.int_std.snr), hyp_snr: num(q.int_hyp.snr) };
    }
    recs.push({ kind: "interior", radius: rk, drive: dk, factorSrc: src, rR: x, V0: num(s.V0), E_ref: num(s.interior.E_ref),
      SE_shell: num(s.shell.SE), E_leak: num(s.interior.E_leak), B_leak: num(s.interior.B_leak), E_hyp: num(s.interior.E_hyp),
      floor_dBm: num(s.floor_dBm), probes });
  }
  for (const sk of Object.keys(FX1.STACK_PRESETS)) for (const dp of FX1.distancePresets(f)) {
    const s = FX1.compute(Object.assign(applyStackPreset(base, sk), { d: dp.d }));
    const probes = {};
    for (const pr of FX1.PROBES) {
      const q = s.probes[pr];
      probes[pr] = { K: num(q.K), label: q.label, std_A: num(q.ext_std_A.dBm), std_B: num(q.ext_std_B.dBm), std_C: num(q.ext_std_C.dBm), hyp: num(q.ext_hyp.dBm) };
    }
    const ex = s.exterior;
    recs.push({ kind: "exterior", radius: rk, drive: dk, factorSrc: src, stack: sk, dist: dp.id, d_m: dp.d,
      E_A: num(ex.A.E), E_B: ex.B ? num(ex.B.E) : null, B_B: ex.B ? num(ex.B.B) : null, E_C: ex.C ? num(ex.C.E) : null, B_C: ex.C ? num(ex.C.B) : null,
      E_hyp: num(ex.E_hyp), stack_std_dB: num(s.stack.stdDb), alphaL: num(s.stack.alphaL), mP: num(s.stack.mP), floor_dBm: num(s.floor_dBm), probes });
  }
}
const out = { version: K.PHYSICS_VERSION, f_Hz: f, rbw_Hz: K.tinysa_floor.rbw_default_Hz, lna: false, records: recs };
fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`wrote ${outPath}: ${recs.length} records, version ${out.version}`);
