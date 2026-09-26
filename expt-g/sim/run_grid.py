#!/usr/bin/env python3
"""Evaluate the shared grid (grid_spec.json) with the Python model -> py_outputs.json."""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from expt_g_model import *
G = json.load(open(os.path.join(os.path.dirname(__file__), "grid_spec.json")))
out = {"water": [], "rate_ac": [], "rate_static": [], "rate_mag": [], "f2": [], "rate_hf": [], "bbr": [], "link": [], "ptx": [], "maxrange": []}
KW = ["ep", "epp", "sigma", "sigH", "tand", "alpha_tem", "beta_tem", "eta_abs", "eta_phase", "Zslw", "alpha_J"]
for f, T, S in G["water"]:
    w = water(f, T, S); out["water"].append([w[k] for k in KW])
for E, f in G["rate_ac"]: out["rate_ac"].append(rate_ac(E, f))
for E in G["rate_static"]: out["rate_static"].append(rate_static(E))
for E, f, B in G["rate_mag"]: out["rate_mag"].append(rate_mag(E, f, B))
for W, sh in G["f2"]: out["f2"].append(F2E1(W, sh))
for E, f, hf in G["rate_hf"]: out["rate_hf"].append(rate_hf(E, f, hf))
for T in G["bbr"]: out["bbr"].append(rate_bbr(T))
LK = ["E_det_slw", "E_det_tem", "G_sig", "G_dc", "G_bbr", "F2", "dep", "Rb", "snr", "G_req", "E_req_det", "E_req_out", "N_req", "cps"]
RK = ["sig", "tem_leak", "twoE1", "stark", "bbr", "ads", "gps", "wifi", "dme", "dark"]
for p in G["link"]:
    L = link(p); out["link"].append([L[k] for k in LK] + [L["R"][k] for k in RK])
wt = water(L_MHZ * 1e6, 15, 35); E0 = link()["E_req_out"]
for r, m in G["ptx"]: out["ptx"].append(ptx_required(r, E0, wt, m))
for P, m in G["maxrange"]: out["maxrange"].append(max_range(P, E0, wt, m))
json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else "py_outputs.json", "w"), indent=0)
print("wrote py_outputs.json")
