#!/usr/bin/env python3
"""Compute every number quoted on experiment-g.html and its exact formatted string (EXPECT).
build_page.py fills the page template from EXPECT; expt_g_check.py re-computes and verifies each string is on the page."""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from expt_g_model import *

HERE = os.path.dirname(os.path.abspath(__file__))
FX1 = "/workspace/sim-lab/fx1/openems/results.json"
LAB = dict(N2S=5e7, eps_det=3e-7, R_dark=1.66, filt_shape="lorentz", E_stray=0.0, G_stray=1.7717)
# ^ Landhuis N2S; Landhuis 2e-6 (no filter) x FN122-XN 0.15; MCP 0.4/cm2/s x 4.15 cm2; stray = Landhuis best compensation
OPT = dict(N2S=2.2e9, eps_det=0.039, R_dark=0.02, filt_shape="gauss", E_stray=0.01, G_stray=0.0)
# ^ snr-2s-vs-sphere case A3c: eps ceiling 0.039 (4pi x 0.15 x 0.26 CsI), N capped so no-signal rate = one CEM's 15 Mcps; CEM dark 0.02/s
RANGES = [0.01, 0.1, 1.0, 100.0, 1000.0]
MODES = ["errata0", "joule", "tem"]

def sci(v, d=2):
    if v == 0: return "0"
    m, ex = f"{v:.{d-1}e}".split("e"); ex = int(ex)
    sup = str(ex).replace("-", "⁻").translate(str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹"))
    return f"{m}×10{sup}"
def g3(v):
    if v != 0 and (abs(v) < 0.01 or abs(v) >= 1e4): return sci(v)
    return f"{float(f'{v:.3g}'):.0f}" if abs(v) >= 1000 else f"{v:.3g}"
def pw(lp):   # power from log10(P/W) -> readable
    if lp < -2.5 or lp > 5.5: return f"10<sup>{lp:.0f}</sup> W" if abs(lp) >= 10 else f"{sci(10 ** lp)} W"
    P = 10 ** lp
    if P < 1: return f"{P*1e3:.3g} mW"
    if P < 1e3: return f"{P:.3g} W"
    return f"{P/1e3:.3g} kW"
def rng(r):
    if r <= 0: return "&lt;1 mm"
    if r < 1: return f"{r*100:.3g} cm"
    if r < 1e3: return f"{r:.3g} m"
    return f"{r/1e3:.3g} km"
def fE(E):
    if E >= 1: return f"{E:.3g} V/m"
    if E >= 1e-3: return f"{E*1e3:.3g} mV/m"
    if E >= 1e-6: return f"{E*1e6:.3g} µV/m"
    return f"{sci(E)} V/m"

N = {}; X = {}
f0 = L_MHZ * 1e6
wt = water(f0, 15, 35)
N["L"] = L_MHZ; X["L"] = f"{L_MHZ:.1f} MHz"
N["fwhm"] = FWHM_MHZ; X["fwhm"] = f"{FWHM_MHZ:.1f} MHz"
X["tau2S"] = f"{1/C['A2E1']:.4f} s"; X["tau2P"] = f"{1e9/C['gam']:.2f} ns"
hc_eV = lambda lam: C["h"] * C["c"] / lam / C["e"]
lam243 = C["c"] / (C["f1S2S_Hz"] / 2); lam972 = 4 * lam243
X["lam243"] = f"{lam243*1e9:.2f} nm"; X["lam972"] = f"{lam972*1e9:.1f} nm"
X["E972"] = f"{hc_eV(lam972):.3f} eV"; X["E243"] = f"{hc_eV(lam243):.3f} eV"
X["E1S2S"] = f"{C['h']*C['f1S2S_Hz']/C['e']:.3f} eV"; X["E2x972"] = f"{2*hc_eV(lam972):.2f} eV"
N["rate1u"] = rate_ac(1e-6, f0); X["rate1u"] = sci(N["rate1u"])
X["rate1u_simple"] = sci(rate_res_simple(1e-6))
X["tau10"] = f"{1e6/rate_static(1000.0):.2f} µs"; X["tauLand"] = f"{1e6/(C['landhuis_k']*100):.2f} µs"
X["NSint"] = f"{ns_int(0,1)/2:.3f}"
F2v = {k: F2E1(W, sh) for k, (W, sh) in {"10L": (10, "lorentz"), "10G": (10, "gauss"), "20L": (20, "lorentz"), "20G": (20, "gauss"), "1G": (1, "gauss")}.items()}
for k, v in F2v.items(): X["F2_" + k] = f"{v:.3f}" if v >= 0.01 else sci(v, 2); X["R2E1pa_" + k] = f"{C['A2E1']*v:.3g}"
X["bbr290"] = sci(rate_bbr(290.0)); X["bbr4"] = sci(rate_bbr(4.0))
X["Gstray"] = f"{DEFAULTS['G_stray']:.2f}"
# hyperfine (trapped F=1 atoms)
X["hfc11"] = f"{HF_COMP['F1'][0][0]/1e6:.2f} MHz"; X["hfc10"] = f"{HF_COMP['F1'][1][0]/1e6:.2f} MHz"; X["hfc01"] = f"{HF_COMP['F0'][0][0]/1e6:.2f} MHz"
N["hfF1"] = rate_hf(1e-6, f0, "F1") / rate_ac(1e-6, f0); X["hfF1"] = f"{N['hfF1']:.3f}"; X["hfF1dB"] = f"{10*math.log10(N['hfF1']):.1f} dB"
X["hfF1_1087"] = f"{rate_hf(1e-6, HF_COMP['F1'][0][0], 'F1')/rate_ac(1e-6, f0):.3f}"
X["hf_ads_df"] = f"{1090.0 - HF_COMP['F1'][0][0]/1e6:.1f} MHz"
for key, fM in [("ads", 1090.0), ("gps", 1227.6), ("wifi", 2437.0), ("ssr", 1030.0)]:
    r = rate_ac(1e-6, fM * 1e6) / N["rate1u"]; N["lz_" + key] = r
    X["lz_" + key] = f"{r:.3g}" if r > 0.01 else sci(r, 3); X["lzdB_" + key] = f"{10*math.log10(r):.1f} dB"
    X["df_" + key] = f"{fM - L_MHZ:+.1f} MHz"
    rF = rate_hf(1e-6, fM * 1e6, "F1") / N["rate1u"]; X["lzF1_" + key] = f"{rF:.3g}" if rF > 0.01 else sci(rF, 3)
for key, df in [("p300", 300), ("m300", -300), ("p500", 500), ("m500", -500)]:
    r = rate_ac(1e-6, (L_MHZ + df) * 1e6) / N["rate1u"]; X["lz_" + key] = f"{r:.4f}"; X["lzdB_" + key] = f"{10*math.log10(r):.1f} dB"
    rF = rate_hf(1e-6, (L_MHZ + df) * 1e6, "F1") / N["rate1u"]; X["lzF1_" + key] = f"{rF:.4f}"
    X["dF1_" + key] = f"{10*math.log10(rF / (rate_hf(1e-6, f0, 'F1') / N['rate1u'])):.1f} dB"
# seawater at 15 C, 35 ppt
X["ep"] = f"{wt['ep']:.1f}"; X["epp"] = f"{wt['epp']:.1f}"; X["sig"] = f"{wt['sigma']:.2f} S/m"; X["tand"] = f"{wt['tand']:.2f}"
X["aT"] = f"{wt['alpha_tem']:.1f} Np/m"; X["aTdB"] = f"{wt['alpha_tem']*NP2DB:.0f} dB/m"; X["dT"] = f"{100/wt['alpha_tem']:.2f} cm"
X["lamw"] = f"{wt['lam_water']*100:.2f} cm"; X["eta"] = f"{wt['eta_abs']:.1f} Ω"; X["Z"] = f"{wt['Zslw']:.1f} Ω"
X["sigH"] = f"{wt['sigH']:.2f} S/m"; X["aJ"] = f"{wt['alpha_J']:.1f} Np/m"; X["aJdB"] = f"{wt['alpha_J']*NP2DB:.0f} dB/m"
X["dJ"] = f"{100/wt['alpha_J']:.2f} cm"
X["dT_10cm_dB"] = f"{wt['alpha_tem']*NP2DB*0.1:.0f} dB"; X["dJ_10cm_dB"] = f"{wt['alpha_J']*NP2DB*0.1:.0f} dB"
for T in [0, 10, 20, 29]:
    w = water(f0, T, 35); X[f"dT_{T}"] = f"{100/w['alpha_tem']:.2f} cm"; X[f"dJ_{T}"] = f"{100/w['alpha_J']:.2f} cm"; X[f"sig_{T}"] = f"{w['sigma']:.2f}"
for S in [0, 10]:
    w = water(f0, 20, S); X[f"dT_S{S}"] = (f"{100/w['alpha_tem']:.2f} cm" if 100/w['alpha_tem'] < 100 else f"{1/w['alpha_tem']:.2f} m")
    X[f"dJ_S{S}"] = (f"{100/w['alpha_J']:.2f} cm" if 100/w['alpha_J'] < 100 else f"{1/w['alpha_J']:.2f} m")
# detector presets, required field
for tag, pre in [("lab", LAB), ("opt", OPT)]:
    Lk = link(pre); N["Ereq_" + tag] = Lk["E_req_det"]; X["Ereq_" + tag] = fE(Lk["E_req_det"])
    L0 = link(dict(pre, P_tx=1e-30))     # no-signal background
    X["Rb_" + tag] = g3(L0["Rb"]) + " /s"; X["R2E1_" + tag] = g3(L0["R"]["twoE1"]) + " /s"
    X["Rstark_" + tag] = g3(L0["R"]["stark"]) + " /s"; X["Rbbr_" + tag] = g3(L0["R"]["bbr"]) + " /s"; X["Rdark_" + tag] = g3(pre["R_dark"]) + " /s"
    Gq = Lk["G_req"]; Sreq = pre["N2S"] * pre["eps_det"] * Gq * L0["G0"] / (L0["G0"] + Gq)
    X["Rreq_" + tag] = g3(Sreq) + " /s"; X["Greq_" + tag] = g3(Gq) + " s⁻¹"; X["dep_" + tag] = f"{L0['G0']/(L0['G0']+Gq):.2f}"
    X["gb_" + tag] = f"{L0['g_b']:.3g}"; X["G0_" + tag] = f"{L0['G0']:.3g}"
    # N2S needed for 1 uV/m (peak) at the atoms (depletion negligible)
    a = pre["eps_det"] * L0["K1"]; b = pre["eps_det"] * L0["g_b"]; d = pre["R_dark"]; K = 5; T = 1
    Nn = (K*K*(a+2*b) + math.sqrt(K**4*(a+2*b)**2 + 8*T/2*a*a*K*K*d)) / (T*a*a)
    N["N1u_" + tag] = Nn; X["N1u_" + tag] = sci(Nn)
    X["cps0_" + tag] = g3(L0["cps"]) + " /s"
    Ereq_out = Lk["E_req_out"]
    for r in RANGES:
        for m in MODES:
            X[f"P_{tag}_{m}_{r:g}"] = pw(ptx_required(r, Ereq_out, wt, m))
        tau = Lk["tau_wa"]
        X[f"P_{tag}_TEMcage_{r:g}"] = pw(ptx_required(r, Ereq_out * 10 ** (80 / 20) / tau, wt, "TEM"))
    for P in [1.0, 1000.0]:
        for m in MODES:
            X[f"rmax_{tag}_{m}_{P:g}"] = rng(max_range(P, Ereq_out, wt, m))
        X[f"rmax_{tag}_TEMcage_{P:g}"] = rng(max_range(P, Ereq_out * 1e4 / Lk["tau_wa"], wt, "TEM"))
X["N1u_ratio_lab"] = sci(N["N1u_lab"] / 5e7)
# example scenario: Erratum alpha=0, 1 W, 10 m, lab preset
Ls = link(dict(LAB, slw_mode="errata0", P_tx=1.0, r=10.0))
X["ex_E"] = fE(Ls["E_det_slw"]); X["ex_sig"] = f"{Ls['R']['sig']:.3g} /s"; X["ex_bkg"] = f"{Ls['Rb']:.3g} /s"; X["ex_snr"] = f"{Ls['snr']:.3g}"
X["ex_G"] = f"{Ls['G_sig']:.3g} s⁻¹"; X["ex_dep"] = f"{Ls['dep']:.2f}"
Lj = link(dict(LAB, slw_mode="joule", P_tx=1.0, r=10.0)); X["exJ_E"] = fE(Lj["E_det_slw"]) if Lj["E_det_slw"] > 1e-300 else "0 (underflow)"
# default worked example: Joule-literal (page default), 1 W, 5 cm and 10 cm, lab preset
Ld = link(dict(LAB, slw_mode="joule", P_tx=1.0, r=0.05))
X["exD_E"] = fE(Ld["E_det_slw"]); X["exD_sig"] = f"{Ld['R']['sig']:.3g} /s"; X["exD_bkg"] = f"{Ld['Rb']:.3g} /s"; X["exD_snr"] = f"{Ld['snr']:.3g}"
X["exD_G"] = f"{Ld['G_sig']:.3g} s⁻¹"; X["exD_dep"] = f"{Ld['dep']:.2f}"
Ld10 = link(dict(LAB, slw_mode="joule", P_tx=1.0, r=0.1)); X["exD10_E"] = fE(Ld10["E_det_slw"]); X["exD10_snr"] = f"{Ld10['snr']:.3g}"
assert DEFAULTS["slw_mode"] == "joule"
X["exJ_log10E"] = f"10<sup>{math.log10(field_at(1.0,1.0,0,wt['Zslw'])/10)-wt['alpha_J']*10/math.log(10):.0f}</sup> V/m"
# ADS-B / GPS / DME / Wi-Fi fields (FACT free-space far field, ASSUMPTION isotropic antennas)
E_ads10 = math.sqrt(2 * C["eta0"] * 500 / (4 * math.pi * 1e8)); E_ads1 = E_ads10 * 10
lam2 = C["c"] / 1227.6e6; E_gps = math.sqrt(2 * C["eta0"] * 1e-16 / (2 * lam2 ** 2 / (4 * math.pi)))
E_dme = math.sqrt(2 * C["eta0"] * 300 / (4 * math.pi * 1e8)); E_wifi = math.sqrt(2 * C["eta0"] * 0.1 / (4 * math.pi * 9))
X["E_ads10"] = fE(E_ads10); X["E_ads1"] = fE(E_ads1); X["E_gps"] = fE(E_gps); X["E_dme"] = fE(E_dme); X["E_wifi"] = fE(E_wifi)
emit = [("ads", E_ads10, 1090e6), ("gps", E_gps, 1227.6e6), ("dme", E_dme, 1058e6), ("wifi", E_wifi, 2437e6)]
for key, E, f in emit:
    fac = math.sqrt(rate_hf(1e-6, f, "F1") / rate_hf(1e-6, f0, "F1"))   # F=1 atoms, relative to the F=1 rate at 1057.8 MHz
    for SE in [0, 40, 80]:
        X[f"eq_{key}_{SE}"] = fE(E * 10 ** (-SE / 20) * fac)
    # SE needed so equivalent field < 10 % of optimistic E_req (peak, no duty-cycle credit)
    need = 20 * math.log10(E * fac / (0.1 * N["Ereq_opt"])); X[f"SEneed_{key}"] = f"{max(0, need):.0f} dB"
# FX-1 seam proxies
if os.path.exists(FX1):
    ext, se = fx1_seam_SE(FX1)
else:   # snapshot of the same four inputs (fx1_seam_inputs.json, extracted from the full FX-1 openEMS output)
    _s = json.load(open(os.path.join(HERE, "fx1_seam_inputs.json"))); ext = _s["E_ext_5cm_Vpm"]
    se = {k: 20 * math.log10(ext / v) for k, v in _s["E_int_centre_max4dir_Vpm"].items()}
X["fx1_ext"] = f"{ext:.2f} V/m"
for k, v in se.items(): X["se_" + k] = f"{v:.1f} dB"
# magnetic option
X["Bc"] = f"{BC_G:.1f} G"; X["slope"] = f"{SLOPE_MHZ_G:.2f} MHz/G"
for tag, T in [("100uK", 100e-6), ("5K8", 5.8), ("300K", 300.0)]:
    Em = v_th(T) * BC_G * 1e-4; X["Emot_" + tag] = fE(Em); X["Gmot_" + tag] = sci(rate_mag(Em, 0, BC_G)) + " s⁻¹"
X["Gmag1u"] = sci(rate_mag(1e-6, 0, BC_G))
# G2 control (a): TEM TX 1 W, 5 cm seawater, Fresnel tau, cage 80 dB
Lc = link(dict(LAB, P_tx=1.0, r=0.05, SE_cage=80.0))
X["ctlA_Eout"] = fE(Lc["E_out_tem"]); X["ctlA_Edet"] = fE(Lc["E_det_tem"]); X["ctlA_R"] = sci(Lc["R"]["tem_leak"]) + " /s"
X["tau_wa"] = f"{Lc['tau_wa']:.2f}"
Lc2 = link(dict(LAB, P_tx=1.0, r=0.05, SE_cage=40.0)); X["ctlA_Edet40"] = fE(Lc2["E_det_tem"])
X["Tint_scale"] = f"{3600**-0.25:.2f}"
# Prior claim check: Tomilin, Lukin & Gulkov 2021 (27.4 MHz, 470 m, 8 C; S not stated -> 35 ASSUMPTION)
wtom = water(27.4e6, 8, 35)
X["tom_dT"] = f"{100/wtom['alpha_tem']:.1f} cm"; X["tom_dJ"] = f"{100/wtom['alpha_J']:.0f} cm"
X["tom_dB"] = f"{470*wtom['alpha_tem']*NP2DB:,.0f} dB"
if __name__ == "__main__":
    json.dump({"expect": X}, open(os.path.join(HERE, "expt_g_numbers.json"), "w"), indent=1, ensure_ascii=False)
    for k, v in X.items(): print(f"{k:22s} {v}")
