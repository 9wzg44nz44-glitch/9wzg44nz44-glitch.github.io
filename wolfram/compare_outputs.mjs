// compare_outputs.mjs — lockstep check: compares js_outputs.json with wl_outputs.json (exported by FX1ExportGrid in the Cloud).
// Usage: node compare_outputs.mjs [js_outputs.json] [wl_outputs.json] [relTol=1e-9] [absTol_dB=1e-6]
import fs from "fs";
const [a = "js_outputs.json", b = "wl_outputs.json", rt = "1e-9", at = "1e-6"] = process.argv.slice(2);
if (!fs.existsSync(b)) { console.error(`${b} not found — run wolfram/FX1SNR_RunGrid.wl in Wolfram Cloud/Desktop first.`); process.exit(2); }
const A = JSON.parse(fs.readFileSync(a, "utf8")), B = JSON.parse(fs.readFileSync(b, "utf8"));
const relTol = +rt, absTol = +at;
let n = 0, bad = 0, worst = 0;
function cmp(x, y, p) {
  if (typeof x === "number" && typeof y === "number") {
    n++; const d = Math.abs(x - y), r = d / Math.max(Math.abs(x), Math.abs(y), 1e-300);
    if (d > absTol && r > relTol) { bad++; if (bad <= 30) console.error(`DIFF ${p}: js=${x} wl=${y} rel=${r.toExponential(2)}`); }
    worst = Math.max(worst, d > absTol ? r : 0); return;
  }
  if (Array.isArray(x)) { if (!Array.isArray(y) || x.length !== y.length) { bad++; console.error(`LEN ${p}: ${x.length} vs ${y && y.length}`); return; } x.forEach((v, i) => cmp(v, y[i], `${p}[${i}]`)); return; }
  if (x && typeof x === "object") { for (const k of new Set([...Object.keys(x), ...Object.keys(y || {})])) { if (!y || !(k in y) || !(k in x)) { bad++; console.error(`KEY ${p}.${k} missing on one side`); continue; } cmp(x[k], y[k], `${p}.${k}`); } return; }
  if (x !== y) { bad++; if (bad <= 30) console.error(`DIFF ${p}: js=${JSON.stringify(x)} wl=${JSON.stringify(y)}`); }
}
cmp(A, B, "$");
console.log(`compared ${n} numbers; mismatches ${bad}; worst rel diff ${worst.toExponential(2)} (versions js=${A.version} wl=${B.version})`);
process.exit(bad ? 1 : 0);
