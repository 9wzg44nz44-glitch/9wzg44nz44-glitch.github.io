"""Experiment G check (pattern: Expt D sim/detectors_check.py).
 1. Re-computes every quoted number (expt_g_numbers.X, from expt_g_model.py) and checks each formatted string
    appears verbatim in experiment-g.html (and every {{key}} in the templates is covered).
 2. Checks required framing / scope strings are on the page.
 3. Runs the PY-vs-JS engine compare (node dump_js_outputs.js + compare_outputs.py).  WL compare reported OWED.
 4. Cross-checks shared atomic numbers against Expt D's detectors_numbers.json (if present).
Usage: python3 expt_g_check.py [path/to/experiment-g.html] [path/to/expt-g-engine.js]      Exit 1 on any failure."""
import os, re, sys, json, subprocess, math
d = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, d)
import expt_g_numbers as NUM
from expt_g_model import L_MHZ, FWHM_MHZ, BC_G, rate_ac, rate_static, v_th
def _first(*ps):
    for p in ps:
        if os.path.exists(p): return p
    return ps[0]
page = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else _first(os.path.join(d, "..", "web", "experiment-g.html"), os.path.join(d, "..", "..", "experiment-g.html"))
eng = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else _first(os.path.join(d, "..", "web", "js", "expt-g-engine.js"), os.path.join(d, "..", "..", "js", "expt-g-engine.js"))
html = open(page, encoding="utf-8").read()
fail = 0
# 1. quoted numbers
tdir = os.path.join(d, "..", "web")
used = set()
if os.path.isdir(tdir):
    for f in os.listdir(tdir):
        if f.startswith("template_") and f.endswith(".html"):
            used |= set(re.findall(r"\{\{([^}]+)\}\}", open(os.path.join(tdir, f), encoding="utf-8").read()))
keys = sorted(used) if used else sorted(NUM.X)
unk = [k for k in keys if k not in NUM.X]
miss = [f"{k}: {NUM.X[k]}" for k in keys if k in NUM.X and str(NUM.X[k]) not in html]
print(f"[1] quoted numbers: {len(keys) - len(miss) - len(unk)}/{len(keys)} found on page" + (f"; unknown keys {unk}" if unk else ""))
for m in miss: print("    MISSING", m)
fail += len(miss) + len(unk)
if "{{" in html: print("    leftover {{ placeholder on page"); fail += 1
# 2. required statements
REQ = ["two 243", "972", "Faraday cage", "no cable crosses the cage wall", "fibre", "HYP", "Cloud twin pending sync (expt-g-v0.1)",
       "G0", "G1", "G2", "G3", "1057.8", "(44)", "not subject to resistive loss", "Meissner", "Klarsfeld",
       "experiment-c.html", "Experiment-F-Hydrogen-Scalar-Wave", "OWED",
       # Joule-loss default (hub rule 2026-09-25) + Erratum toggle + conflict flag
       "With the Joule-loss term, a ~1&nbsp;GHz SLW falls by a factor e every", "so the range is centimetres",
       "no eddy / no classical skin barrier; SLW still has linear Ohmic loss; SW has neither", "Joule density <strong>σE∥²</strong>",
       "Erratum α = 0: a non-default toggle", "This Erratum corrects errors in Appendix A", "Open conflict, flagged and not resolved here",
       "TEM-equal (classical comparison)", 'data-v="joule" aria-pressed="true"', 'data-v="errata0" aria-pressed="false"']
low = html.lower(); rmiss = [s for s in REQ if s.lower() not in low]
print(f"[2] required statements: {len(REQ) - len(rmiss)}/{len(REQ)} present" + (f"; missing {rmiss}" if rmiss else ""))
fail += len(rmiss)
# 2b. default SLW mode is Joule-literal in all three twins
from expt_g_model import DEFAULTS as PYDEF
_js = open(eng, encoding="utf-8").read(); _wlp = _first(os.path.join(d, "..", "wolfram", "ExptG.wl"), os.path.join(d, "..", "..", "wolfram", "ExptG.wl"))
_wl = open(_wlp, encoding="utf-8").read()
dchk = [("PY DEFAULTS", PYDEF["slw_mode"] == "joule"), ("JS DEFAULTS", 'slw_mode: "joule"' in _js), ("WL gDefaults", '"slw_mode" -> "joule"' in _wl)]
dbad = [k for k, ok in dchk if not ok]
print(f"[2b] default slw_mode = joule: {len(dchk) - len(dbad)}/{len(dchk)} twins" + (f"; not joule in {dbad}" if dbad else ""))
fail += len(dbad)
# 3. PY vs JS
subprocess.run([sys.executable, os.path.join(d, "run_grid.py")], check=True, cwd=d, stdout=subprocess.DEVNULL)
subprocess.run(["node", os.path.join(d, "dump_js_outputs.js"), eng, os.path.join(d, "grid_spec.json"), os.path.join(d, "js_outputs.json")], check=True, cwd=d, stdout=subprocess.DEVNULL)
r = subprocess.run([sys.executable, os.path.join(d, "compare_outputs.py")], cwd=d, capture_output=True, text=True)
print("[3] " + r.stdout.strip().replace("\n", "\n    ")); fail += (r.returncode != 0)
# 4. Expt D cross-check
dn = None
for p in ["/workspace/sim-lab/expt-d/detectors/sim/detectors_numbers.json", os.path.join(d, "detectors_numbers.json")]:
    if os.path.exists(p): dn = json.load(open(p))["numbers"]; break
if dn:
    pairs = [("L_MHz", L_MHZ), ("fwhm_MHz", FWHM_MHZ), ("rate_res_1uV", rate_ac(1e-6, L_MHZ * 1e6)),
             ("check_10Vcm_tau_us", 1e6 / rate_static(1000.0)), ("Emot_100uK_Vm", v_th(100e-6) * BC_G * 1e-4),
             ("Emot_300K_Vm", v_th(300.0) * BC_G * 1e-4), ("Bcross_G", BC_G)]
    tol = {"Bcross_G": 1e-3, "Emot_100uK_Vm": 1e-3, "Emot_300K_Vm": 1e-3, "rate_res_1uV": 2e-3, "check_10Vcm_tau_us": 2e-3}
    bad = []
    for k, v in pairs:
        ref = dn[k]; rel = abs(v - ref) / abs(ref)
        if rel > tol.get(k, 1e-6): bad.append((k, v, ref, rel))
    print(f"[4] Expt D cross-check: {len(pairs) - len(bad)}/{len(pairs)} shared numbers agree" + "".join(f"\n    DIFF {b}" for b in bad))
    fail += len(bad)
else:
    print("[4] Expt D cross-check: detectors_numbers.json not found (skipped)")
# 4b. consistency with the side calculation sim-lab/snr-2s-vs-sphere (results.json), if present
SC = None
for p_ in ["/workspace/sim-lab/snr-2s-vs-sphere/results.json", os.path.join(d, "snr2s_results.json")]:
    if os.path.exists(p_): SC = json.load(open(p_)); break
if SC:
    from expt_g_model import F2E1, rate_bbr, rate_hf, rate_ac, C as CC
    tp = SC["two_photon"]["photons_per_decay_in_filter"]
    pairs = [("F2 10nm lorentz", F2E1(10, "lorentz"), tp["FN122-XN 10nm lorentz"]), ("F2 10nm gauss", F2E1(10, "gauss"), tp["FN122-XN 10nm gauss"]),
             ("F2 20nm lorentz", F2E1(20, "lorentz"), tp["122-NB 20nm lorentz"]), ("F2 1nm gauss", F2E1(1, "gauss"), tp["hypothetical 1nm gauss"]),
             ("BBR 290 K", rate_bbr(290.0), SC["bbr"]["rate_290K"]), ("BBR 4 K", rate_bbr(4.0), SC["bbr"]["rate_4K"]),
             ("hf F1 @1057.8", rate_hf(1e-6, L_MHZ * 1e6, "F1") / rate_ac(1e-6, L_MHZ * 1e6), SC["hyperfine"]["F1_factor_at_ftick"]),
             ("hf F1 @1090", rate_hf(1e-6, 1090e6, "F1") / rate_ac(1e-6, L_MHZ * 1e6), SC["hyperfine"]["F1_factor_at_1090"])]
    # reproduce their A1 and A3c thresholds (their conventions: RMS field, centroid rate, SNR = S/sqrt(S+B) = 1, t = 1 s)
    def th(N, eps, F2, D, Gst):
        f0 = L_MHZ * 1e6; Gb = rate_bbr(290.0); Ga = rate_ac(math.sqrt(2) * SC["adsb"]["E_out_avg_default_Vm"] * 10 ** (-55 / 20), 1090e6)
        G0 = CC["A2E1"] + Gb + Gst + Ga
        def snr(lE):
            Gs = rate_ac(math.sqrt(2) * 10 ** lE, f0); Np = N * G0 / (G0 + Gs)
            S_ = Np * Gs * eps; B_ = Np * eps * (CC["A2E1"] * F2 + Gb + Gst + Ga) + D; return S_ / math.sqrt(S_ + B_)
        lo, hi = -12.0, 3.0
        for _ in range(200):
            m = (lo + hi) / 2
            if snr(m) >= 1: hi = m
            else: lo = m
        return 10 ** hi
    thr = SC["thresholds_Vm"]
    pairs.append(("A1 threshold (their conv.)", th(5e7, 2e-6, tp["FN122-XN 10nm lorentz"], 0.05, 1 / 0.1 - CC["A2E1"]),
                  thr["A1 lab-demonstrated (Landhuis N=5e7, eps=2e-6), 10 nm filter, stray<=1.77/s"]["t=1"]))
    pairs.append(("A3c threshold (their conv.)", th(SC["A3c_N"], 0.039, tp["FN122-XN 10nm gauss"], 0.02, rate_static(0.010)),
                  thr["A3c best physical, one CEM (<=15 Mcps): N capped"]["t=1"]))
    bad = [(k, a, b) for k, a, b in pairs if abs(a - b) / abs(b) > 0.01]
    print(f"[4b] side-calc (snr-2s-vs-sphere) consistency: {len(pairs) - len(bad)}/{len(pairs)} agree within 1 %" + "".join(f"\n    DIFF {b}" for b in bad))
    fail += len(bad)
else:
    print("[4b] side-calc results.json not found (skipped)")
print("[5] JS vs WL compare: OWED (WL twin wolfram/ExptG.wl written by hand, not yet run; Wolfram Cloud key not on box)")
print("RESULT:", "PASS" if fail == 0 else f"FAIL ({fail})"); sys.exit(1 if fail else 0)
