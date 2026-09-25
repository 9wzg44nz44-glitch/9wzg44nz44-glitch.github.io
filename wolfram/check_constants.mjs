// check_constants.mjs — asserts the JS constants block (js/fx1-snr.js) and the WL block (FX1SNR.wl)
// both equal physics-constants-fx1.json "engine" exactly (deep equality, numbers bit-exact).
// Usage: node check_constants.mjs [path/to/fx1-snr.js] [path/to/FX1SNR.wl] [path/to/physics-constants-fx1.json]
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const here = path.dirname(new URL(import.meta.url).pathname);
const pick = (...c) => c.find((p) => fs.existsSync(p)) || c[0];  // sim-lab layout first, then repo layout (wolfram/ next to ../js)
const jsPath = process.argv[2] || pick(path.join(here, "web/js/fx1-snr.js"), path.join(here, "../js/fx1-snr.js"));
const wlPath = process.argv[3] || pick(path.join(here, "wolfram/FX1SNR.wl"), path.join(here, "FX1SNR.wl"));
const jsonPath = process.argv[4] || pick(path.join(here, "physics-constants-fx1.json"), path.join(here, "../physics-constants-fx1.json"));

const J = JSON.parse(fs.readFileSync(jsonPath, "utf8")).engine;
let fails = 0, checks = 0;
function deepEq(a, b, p, tag) {
  checks++;
  if (typeof a === "number" && typeof b === "number") {
    if (!Object.is(a, b)) { fails++; console.error(`[${tag}] MISMATCH ${p}: ${a} vs ${b}`); }
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) { fails++; console.error(`[${tag}] LENGTH/TYPE ${p}`); return; }
    a.forEach((x, i) => deepEq(x, b[i], p + "[" + i + "]", tag)); return;
  }
  if (a && typeof a === "object") {
    if (!b || typeof b !== "object") { fails++; console.error(`[${tag}] TYPE ${p}`); return; }
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (ka.join("|") !== kb.join("|")) { fails++; console.error(`[${tag}] KEYS ${p}: ${ka} vs ${kb}`); }
    ka.forEach((k) => { if (k in b) deepEq(a[k], b[k], p + "." + k, tag); }); return;
  }
  if (a !== b) { fails++; console.error(`[${tag}] MISMATCH ${p}: ${a} vs ${b}`); }
}

// ---- JS: load module, compare exported K ----
delete require.cache[jsPath];
const FX1 = require(jsPath);
deepEq(J, FX1.K, "K", "JS");
const jsVer = FX1.K.PHYSICS_VERSION;

// ---- WL: parse the FX1Const association literal ----
function parseWL(src) {
  let i = 0;
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  function val() {
    ws();
    if (src.startsWith("<|", i)) {
      i += 2; const o = {}; ws();
      if (src.startsWith("|>", i)) { i += 2; return o; }
      for (;;) {
        ws(); const k = str(); ws();
        if (!src.startsWith("->", i)) throw new Error("expected -> at " + i); i += 2;
        o[k] = val(); ws();
        if (src[i] === ",") { i++; continue; }
        if (src.startsWith("|>", i)) { i += 2; return o; }
        throw new Error("bad assoc at " + i);
      }
    }
    if (src[i] === "{") {
      i++; const a = []; ws();
      if (src[i] === "}") { i++; return a; }
      for (;;) { a.push(val()); ws(); if (src[i] === ",") { i++; continue; } if (src[i] === "}") { i++; return a; } throw new Error("bad list at " + i); }
    }
    if (src[i] === '"') return str();
    for (const [w, v] of [["True", true], ["False", false], ["Null", null]]) if (src.startsWith(w, i)) { i += w.length; return v; }
    const m = /^-?\d+(\.\d*)?(`)?(\*\^-?\d+)?/.exec(src.slice(i));
    if (!m) throw new Error("bad token at " + i + ": " + src.slice(i, i + 20));
    i += m[0].length;
    let t = m[0].replace("`", "");
    if (t.includes("*^")) { const [mm, ee] = t.split("*^"); t = mm + "e" + ee; }
    return Number(t);
  }
  function str() { ws(); if (src[i] !== '"') throw new Error("expected string at " + i); let j = i + 1, out = ""; while (src[j] !== '"') { if (src[j] === "\\") { out += src[j + 1]; j += 2; } else out += src[j++]; } i = j + 1; return out; }
  const v = val(); return v;
}
const wl = fs.readFileSync(wlPath, "utf8");
const b = wl.indexOf("FX1Const = "), e = wl.indexOf("(* END FX1 CONSTANTS *)");
if (b < 0 || e < 0) { console.error("WL constants block not found"); process.exit(2); }
const W = parseWL(wl.slice(b + "FX1Const = ".length, e).trim().replace(/;$/, ""));
deepEq(J, W, "FX1Const", "WL");
const wlVerOk = /PhysicsVersion = FX1Const\["PHYSICS_VERSION"\]/.test(wl);
if (!wlVerOk) { fails++; console.error("WL PhysicsVersion not bound to FX1Const"); }

console.log(`check_constants: ${checks} comparisons · JS version ${jsVer} · WL version ${W.PHYSICS_VERSION} · JSON ${J.PHYSICS_VERSION}`);
if (fails) { console.error(`FAIL: ${fails} mismatches`); process.exit(1); }
console.log("PASS: JS and WL constant blocks are bit-identical to physics-constants-fx1.json");
