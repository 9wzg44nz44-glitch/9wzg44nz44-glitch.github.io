#!/usr/bin/env python3
"""
Experiment H, Configuration 6: which electret (if any) to buy.
Simple, documented models. Every input is tagged:
  [S] sourced (see SOURCES at the bottom / README), [A] assumption, [D] derived here.
Run:  python3 tools/exp-h-electret-compare.py  -> writes PNGs, results.json, tables.md to ./exp-h-electret-out (or $OUT_DIR).
Needs numpy and matplotlib. Published with Experiment H, Configuration 6 (experiment-h.html#config6-compare).
No hypothesis-specific coupling is known from the published framework, so the
"charge-coupled" stimulus below is a DEFINED test stimulus, not a prediction.
"""
import json, math, os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = os.environ.get("OUT_DIR", os.path.join(os.getcwd(), "exp-h-electret-out"))
os.makedirs(OUT, exist_ok=True)
eps0 = 8.854e-12
F0 = 109e3                    # target drive frequency [A, Dan's plan]
w0 = 2*math.pi*F0
rho_air, c_air = 1.2, 343.0   # [A] room air

# ---------------- drive sources ----------------
TINYSA_DBM = -19.0                                   # [S] tinysa.org spec, max level
P = 1e-3*10**(TINYSA_DBM/10)
V_TINY_EMF = 2*math.sqrt(P*50)                       # [D] EMF behind 50 ohm, ~50.2 mV rms
R_SRC = 50.0                                         # [A] 50 ohm output (wiki gives 50 ohm for the input; output assumed same)
N_STEP = 4                                           # [A] 1:4 ideal toroid step-up (hub section 5)
Q_COIL = 30.0                                        # [A] Glarks iron-powder coil Q at 109 kHz (unmeasured)
V_FY_EMF = 20/(2*math.sqrt(2))                       # [S] FY6900-20M max 20 Vpp (open circuit) -> 7.07 V rms; [A] 50 ohm out
CAP_VPP = 30.0                                       # Dan's ceiling, no HV

def v_direct(C, f=F0, emf=V_TINY_EMF):
    Z = 1/(1j*2*math.pi*f*C)
    return abs(emf*Z/(R_SRC+Z))

def v_stepup(C, f=F0, emf=V_TINY_EMF, n=N_STEP):
    Zl = 1/(1j*2*math.pi*f*C)
    Zr = Zl/n**2
    return abs(n*emf*Zr/(R_SRC+Zr))

def v_lc(C, f=F0, emf=V_TINY_EMF, q=Q_COIL):
    X = 1/(2*math.pi*f*C)
    L = 1/((2*math.pi*f)**2*C)
    RL = X/q
    return emf*X/(R_SRC+RL), L

# ---------------- PVDF reference numbers (TE/MSI manual) ----------------
PVDF = dict(eps_r=12.0,      # [S] MSI manual 12-13
            d33=33e-12,      # [S] |d33| 33 pC/N
            d31=23e-12,      # [S]
            g33=0.330,       # [S] V m/N
            kt=0.14, k31=0.12,   # [S]
            v_thick=2200.0, v_stretch=1500.0, rho=1780.0, E=3e9,  # [S] (E: 2-4 GPa, mid)
            tan_d=0.02,      # [S]
            Pr=0.065)        # [S] remanent polarization 50-80 mC/m^2 (Polymers 2018; Nat Commun 2021), mid value

# Emfit HS ferroelectret film (70 um), Doring et al. WCNDT 2008 + Yasuno ICA 2010
EMFIT = dict(t=70e-6,           # [S] 70-80 um
             eps_r=1.15,        # [S] 1.1-1.2
             d33=140e-12,       # [S] dynamic value at 600 kHz (Neugschwandtner 2001); quasi-static 250; lit range 25-700
             d33_lo=25e-12, d33_hi=250e-12,
             k33=0.06,          # [S] Doring 2008 (0.05-0.06); Yasuno 0.064-0.094
             rho=330.0, v3=100.0,   # [S] 330 kg/m3, 85-120 m/s
             f_thick=(600e3, 850e3),  # [S] unloaded thickness resonance
             e33=280e-6,        # [S] 231-330 uC/m2 (Yasuno 2010)
             sigma=0.4e-3,      # [S] effective void charge 0.23-0.63 mC/m2 (Ortega Brana 2017)
             tan_d=0.008)       # [S] 0.005-0.012

# ---------------- candidates ----------------
A_EL = 12e-3*30e-3   # DT1 electrode area 12 x 30 mm [S]; electrets cut to the same area for a fair compare [A]
cands = []
def add(**k): cands.append(k)

add(key="DT1-028K", name="TE DT1-028K/L PVDF 28 um (1-1002908-0)", kind="pvdf_thick",
    C=1.38e-9, t=28e-6, A=A_EL, d=PVDF["d33"], k=PVDF["kt"], g=PVDF["g33"], sigma=PVDF["Pr"],
    e33=PVDF["d33"]*PVDF["rho"]*PVDF["v_thick"]**2, electret=False, hv=False, drive_elec=True)
add(key="DT1-052K", name="TE DT1-052K/L PVDF 52 um (2-1002908-0)", kind="pvdf_thick",
    C=0.74e-9, t=52e-6, A=A_EL, d=PVDF["d33"], k=PVDF["kt"], g=PVDF["g33"], sigma=PVDF["Pr"],
    e33=PVDF["d33"]*PVDF["rho"]*PVDF["v_thick"]**2, electret=False, hv=False, drive_elec=True)
add(key="LDT0-028K", name="TE LDT0-028K PVDF on 125 um PET (1002794-0)", kind="pvdf_bend",
    C=480e-12, t=28e-6, A=480e-12*28e-6/(eps0*12), d=PVDF["d33"], k=PVDF["k31"], g=PVDF["g33"], sigma=PVDF["Pr"],
    e33=PVDF["d33"]*PVDF["rho"]*PVDF["v_thick"]**2, electret=False, hv=False, drive_elec=True)
CE = eps0*EMFIT["eps_r"]*A_EL/EMFIT["t"]
add(key="Emfit-HS", name="Emfit ferroelectret film HS 70 um, metallized (research sheet)", kind="fe_thick",
    C=CE, t=EMFIT["t"], A=A_EL, d=EMFIT["d33"], k=EMFIT["k33"], g=EMFIT["d33"]/(eps0*EMFIT["eps_r"]),
    sigma=EMFIT["sigma"], e33=EMFIT["e33"], electret=True, hv=False, drive_elec=True)
add(key="Emfit-S", name="Emfit S-series sample 10x20 mm (custom laminate)", kind="fe_thick",
    C=eps0*EMFIT["eps_r"]*200e-6/EMFIT["t"]*0.8, t=EMFIT["t"], A=200e-6, d=EMFIT["d33"], k=EMFIT["k33"],
    g=EMFIT["d33"]/(eps0*EMFIT["eps_r"]), sigma=EMFIT["sigma"], e33=EMFIT["e33"], electret=True, hv=False, drive_elec=True)
    # [A] laminate capacitance ~0.8x bare film (polyester layers in series); not published
CL = 22e-12/1e-4*A_EL                                     # [S] 22 pF/cm2
add(key="Emfit-L", name="Emfit L-series 0.4 mm laminate (25 pC/N)", kind="fe_thick",
    C=CL, t=0.4e-3, A=A_EL, d=25e-12, k=EMFIT["k33"]*25/140,  # [D/A] k scaled with d33
    g=25e-12/(eps0*1.1), sigma=EMFIT["sigma"], e33=EMFIT["e33"]*25/140, electret=True, hv=False, drive_elec=True)
# capsules: electret membrane behind a JFET, not electrically drivable; sensitivities from datasheets
add(key="CMA-4544", name="Same Sky CMA-4544PF-W electret capsule", kind="capsule",
    C=None, t=None, A=math.pi*(4.85e-3)**2, sens_audio=10**(-44/20), sens_109=None, f_max=20e3,
    sigma=0.3e-3, electret=True, hv=False, drive_elec=False)
add(key="EM258", name="Primo EM258 electret capsule (ultrasonic to ~95 kHz)", kind="capsule",
    C=None, t=None, A=math.pi*(3e-3)**2, sens_audio=10**(-32/20), sens_109=None, f_max=95e3,
    sigma=0.3e-3, electret=True, hv=False, drive_elec=False)
add(key="SPU0410", name="Knowles SPU0410LR5H-QB MEMS (reference, NOT electret)", kind="mems",
    C=None, t=None, A=None, sens_audio=10**(-38/20), f_max=80e3, sigma=0.0, electret=False, hv=False, drive_elec=False)
add(key="SensComp7000", name="SensComp Series 7000 electrostatic 50 kHz", kind="electrostatic",
    C=650e-12, t=None, A=None, sigma=None, electret=False, hv=True, drive_elec=True)   # [S] 150 VDC bias, 300 Vpp: FAIL
add(key="DIY-corona", name="Home corona-charged PTFE/FEP", kind="diy", C=None, t=None, A=None,
    sigma=None, electret=True, hv=True, drive_elec=False)
# capsule electret charge [D]: FEP charged to -300 V (Gerlach et al. 2020), sigma = eps0*2.1*300/t for t = 12.5 to 25 um
SIG_FEP = (eps0*2.1*300/25e-6, eps0*2.1*300/12.5e-6)

# ---------------- 1. mechanical modes ----------------
def cantilever_f(n, L, t, E, rho):
    beta = [1.875104, 4.694091, 7.854757, 10.995541][n-1] if n <= 4 else (2*n-1)*math.pi/2
    return beta**2/(2*math.pi)*(t/math.sqrt(12))*math.sqrt(E/rho)/L**2
modes = {}
# DT1: film 28 um + ~12 um coating = 40 um total [S total thickness]; free length ~30 mm beyond rivets [A]
modes["DT1-028K"] = dict(
    bend_f1=cantilever_f(1, 30e-3, 40e-6, PVDF["E"], PVDF["rho"]),
    length_modes=[(2*n-1)*PVDF["v_stretch"]/(4*30e-3) for n in range(1, 10)],
    thickness=PVDF["v_thick"]/(2*28e-6))
modes["DT1-052K"] = dict(
    bend_f1=cantilever_f(1, 30e-3, 64e-6, PVDF["E"], PVDF["rho"]),
    length_modes=[(2*n-1)*PVDF["v_stretch"]/(4*30e-3) for n in range(1, 10)],
    thickness=PVDF["v_thick"]/(2*52e-6))
modes["LDT0-028K"] = dict(bend_f1=180.0, clamp7mm=1000.0,              # [S] datasheet
    L_for_109k=7e-3*math.sqrt(1000/F0))                                # [D] f ~ 1/L^2
modes["Emfit-HS"] = dict(thickness=EMFIT["f_thick"], stack_n_for_109k=EMFIT["f_thick"][0]/F0)
modes["Emfit-L"] = dict(note="resonances 'well above 20 kHz' (Emfit); exact value not published")
modes["CMA-4544"] = dict(f_max=20e3)
modes["EM258"] = dict(f_max_claimed=95e3)
modes["SPU0410"] = dict(f_rated=80e3)

# number of bending modes near 109 kHz for the floppy DT1 film (Euler-Bernoulli, high n)
f1 = modes["DT1-028K"]["bend_f1"]
n109 = 0.5 + math.sqrt(F0/f1)*1.875104/math.pi
spacing = 2*F0/(n109-0.5)
modes["DT1-028K"]["bend_mode_index_at_109k"] = n109
modes["DT1-028K"]["bend_mode_spacing_at_109k"] = spacing

# 1D length-extensional response of a clamped-free PVDF strip driven by d31 (modal sum), Q assumed
Q_PVDF = 10.0  # [A] PVDF mechanical Q ~ 10 (tan d_m ~ 0.1)
def strip_tip_disp(f, V, L=30e-3, t=28e-6, Q=Q_PVDF):
    S0 = PVDF["d31"]*V/t                  # free strain
    x0 = S0*L                             # quasi-static tip displacement
    resp = 0
    for n in range(1, 60):
        fn = (2*n-1)*PVDF["v_stretch"]/(4*L)
        wgt = 8/((2*n-1)**2*math.pi**2)   # modal participation for uniform end-force drive
        resp += wgt/(1-(f/fn)**2 + 1j*(f/fn)/Q)
    return abs(x0*resp)

# ---------------- 2. TX electric drive ----------------
tx = {}
for c in cands:
    if not c.get("drive_elec") or c["C"] is None:
        continue
    C = c["C"]
    Z = 1/(w0*C)
    vd = v_direct(C); vs = v_stepup(C); vl, L = v_lc(C)
    vfy = v_direct(C, emf=V_FY_EMF)
    r = dict(C_pF=C*1e12, Z_ohm=Z, V_tinysa=vd, V_step=vs, V_lc=vl, L_lc_mH=L*1e3, V_fy=vfy)
    if c["kind"] in ("pvdf_thick", "fe_thick", "pvdf_bend"):
        for lab, V in (("tinysa", vd), ("step", vs), ("lc", vl), ("fy", vfy)):
            r[f"disp_nm_{lab}"] = c["d"]*V*1e9                     # thickness change, sub-resonant [D]
            Qm = c["k"]**2*C*V                                     # motional (moved bound) charge [D]
            r[f"Qm_pC_{lab}"] = Qm*1e12
            r[f"dipole_pCm_{lab}"] = Qm*c["t"]*1e12                # pC*m
    tx[c["key"]] = r

# useful drive voltage: no framework target exists, so use 1 V rms across the element [A]
V_USEFUL = 1.0

# ---------------- 3. RX ----------------
# noise: TinySA at 109 kHz, 200 Hz RBW, LNA on. Spec -145 dBm at 30 MHz [S]; degrade 10 dB below 0.1-0.2 MHz [A]
FLOOR_DBM = -135.0; RBW = 200.0
v_tiny_noise = math.sqrt(1e-3*10**(FLOOR_DBM/10)*50)
EN_BF862 = 0.8e-9; EN_ADA4817 = 4e-9     # [S] datasheet en (nV/rtHz)
C_IN = 10e-12                             # [A] buffer input + wiring
def rx_noise(en=EN_BF862):
    return math.sqrt(v_tiny_noise**2 + (en*math.sqrt(RBW))**2)
VN = rx_noise()
rx = {}
P_TEST = 1.0                 # 1 Pa
P_60 = 20e-6*10**(60/20)     # 60 dB SPL = 0.02 Pa
for c in cands:
    k = c["key"]
    if c["kind"] in ("pvdf_thick", "fe_thick", "pvdf_bend"):
        att = c["C"]/(c["C"]+C_IN)
        v_pa = c["g"]*P_TEST*c["t"]*att            # backed film, thickness stress = p  [D]
        rx[k] = dict(V_per_Pa=v_pa, V_60dB=v_pa*P_60, SNR_1Pa_dB=20*math.log10(v_pa/VN),
                     SNR_60dB_dB=20*math.log10(v_pa*P_60/VN))
    elif c["kind"] in ("capsule", "mems"):
        s = c["sens_audio"]
        # 109 kHz: CMA out of band (assume <= -20 dB) [A]; EM258 'useful' to 95 kHz (assume -10 dB at 109k) [A]; SPU0410 rated 80 kHz (assume -10 dB) [A]
        s109 = s*10**({"CMA-4544": -20, "EM258": -10, "SPU0410": -10}[k]/20)
        rx[k] = dict(V_per_Pa_audio=s, V_per_Pa_109k=s109,
                     SNR_1Pa_109k_dB=20*math.log10(s109/VN), SNR_60dB_109k_dB=20*math.log10(s109*P_60/VN))

# charge-coupled DEFINED stimulus: force on stored charge from an effective field Es = 1 V/m -> stress sigma*Es.
# Through the same g*t transducer, the ratio (charge-coupled output)/(acoustic output at 1 Pa) = sigma*Es/1 Pa. [D]
ratio = {}
for c in cands:
    s = c.get("sigma")
    if s is None or s == 0:
        continue
    ratio[c["key"]] = s*1.0/1.0
ratio["CMA-4544"] = ratio["EM258"] = float(np.mean(SIG_FEP))

# ---------------- 4. acoustic false-signal path TX->RX (same element type), 10 cm, open air ----------------
def piston_p(disp, A, r=0.1, f=F0):
    u = 2*math.pi*f*disp
    k = 2*math.pi*f/c_air
    a = math.sqrt(A/math.pi)
    # exact on-axis baffled circular piston pressure amplitude
    return 2*rho_air*c_air*u*abs(math.sin(0.5*k*(math.sqrt(r**2+a**2)-r)))
acoustic = {}
for k in ("DT1-028K", "DT1-052K", "Emfit-HS", "Emfit-L"):
    c = next(x for x in cands if x["key"] == k)
    for lab in ("lc", "fy"):
        disp = tx[k][f"disp_nm_{lab}"]*1e-9
        p = piston_p(disp, c["A"])
        v = rx[k]["V_per_Pa"]*p
        acoustic[f"{k}_{lab}"] = dict(p_Pa=p, SPL_dB=20*math.log10(p/20e-6), V_rx=v, above_floor_dB=20*math.log10(v/VN))
# TX moved bound dipole per unit radiated surface displacement = e33*A [D]
dip_per_disp = {k: next(x for x in cands if x["key"] == k)["e33"] for k in ("DT1-028K", "Emfit-HS", "Emfit-L")}

# ---------------- results ----------------
res = dict(inputs=dict(F0=F0, V_tinysa_emf=V_TINY_EMF, V_fy_emf=V_FY_EMF, N_step=N_STEP, Q_coil=Q_COIL,
                       floor_dbm=FLOOR_DBM, rbw=RBW, rx_noise_V=VN, sigma_fep=SIG_FEP),
           modes=modes, tx=tx, rx=rx, ratio_charge_over_acoustic=ratio, acoustic_10cm=acoustic,
           e33_moved_charge_per_displacement=dip_per_disp)
json.dump(res, open(os.path.join(OUT, "results.json"), "w"), indent=1, default=float)

# ---------------- plots ----------------
plt.rcParams.update({"figure.dpi": 130, "font.size": 9})
# P1 modes
fig, ax = plt.subplots(figsize=(8, 4.2))
rows = [("DT1-028K length modes", modes["DT1-028K"]["length_modes"]),
        ("DT1-028K thickness", [modes["DT1-028K"]["thickness"]]),
        ("DT1-052K thickness", [modes["DT1-052K"]["thickness"]]),
        ("LDT0-028K bend (20 mm / 7 mm)", [180, 1000]),
        ("Emfit HS thickness (unloaded)", list(EMFIT["f_thick"])),
        ("CMA-4544 band top", [20e3]), ("EM258 usable top (vendor)", [95e3]), ("SPU0410 rated top", [80e3])]
for i, (lab, fs) in enumerate(rows):
    ax.scatter(fs, [i]*len(fs), s=25)
ax.set_yticks(range(len(rows))); ax.set_yticklabels([r[0] for r in rows])
ax.set_xscale("log"); ax.axvline(F0, color="r", lw=1.5, label="109 kHz target")
ax.axvspan(100e3, 145e3, color="r", alpha=0.08, label="100-145 kHz strip/beam band")
ax.axvline(39e6, color="g", ls="--", lw=1, label="39 MHz (Config 1)")
ax.set_xlabel("frequency (Hz)"); ax.set_title("Element resonances vs the 109 kHz target (sourced or derived)")
ax.legend(loc="lower right", fontsize=7); fig.tight_layout(); fig.savefig(os.path.join(OUT, "p1_modes.png")); plt.close(fig)

# P1b strip length-mode response
fs = np.linspace(5e3, 200e3, 2000)
fig, ax = plt.subplots(figsize=(7, 3.4))
ax.semilogy(fs/1e3, [strip_tip_disp(f, 1.0)*1e9 for f in fs])
ax.axvline(109, color="r"); ax.set_xlabel("kHz"); ax.set_ylabel("tip displacement, nm per V rms")
ax.set_title("DT1-028K clamped-free length modes, d31 drive, Q=10 (assumed)")
fig.tight_layout(); fig.savefig(os.path.join(OUT, "p1b_dt1_length_modes.png")); plt.close(fig)

# P2 drive voltages
keys = [k for k in tx]
fig, ax = plt.subplots(figsize=(8, 4))
xs = np.arange(len(keys)); wdt = 0.2
for j, (lab, col) in enumerate((("V_tinysa", "TinySA alone"), ("V_step", "TinySA + 1:4"), ("V_lc", "TinySA + series LC (Q 30)"), ("V_fy", "FY6900 20 Vpp"))):
    ax.bar(xs+(j-1.5)*wdt, [tx[k][lab] for k in keys], wdt, label=col)
ax.axhline(V_USEFUL, color="k", ls="--", lw=1, label="1 V rms 'useful' (assumed)")
ax.set_yscale("log"); ax.set_xticks(xs); ax.set_xticklabels(keys, rotation=20)
ax.set_ylabel("V rms across element at 109 kHz"); ax.set_title("Can the drive reach the element? (SensComp needs 150 V bias: excluded)")
ax.legend(fontsize=7); fig.tight_layout(); fig.savefig(os.path.join(OUT, "p2_drive_voltage.png")); plt.close(fig)

# P3 moved-charge FOM
tk = ["DT1-028K", "DT1-052K", "Emfit-HS", "Emfit-S", "Emfit-L"]
fig, ax = plt.subplots(1, 2, figsize=(9, 3.6))
ax[0].bar(tk, [tx[k]["Qm_pC_fy"] for k in tk]); ax[0].set_yscale("log"); ax[0].set_ylabel("motional charge k^2 C V, pC (FY6900)")
ax[0].tick_params(axis="x", rotation=25); ax[0].set_title("TX moved bound charge per cycle")
ax[1].bar(tk, [tx[k]["dipole_pCm_fy"]*1e6 for k in tk]); ax[1].set_yscale("log"); ax[1].set_ylabel("dipole, pC um (FY6900)")
ax[1].tick_params(axis="x", rotation=25); ax[1].set_title("TX moved dipole per cycle")
fig.tight_layout(); fig.savefig(os.path.join(OUT, "p3_tx_fom.png")); plt.close(fig)

# P4 RX and the selection ratio
rk = ["DT1-028K", "DT1-052K", "Emfit-HS", "Emfit-L"]
fig, ax = plt.subplots(1, 2, figsize=(9, 3.6))
ax[0].bar(rk + ["EM258 @109k", "CMA @109k"], [rx[k]["SNR_1Pa_dB"] for k in rk] + [rx["EM258"]["SNR_1Pa_109k_dB"], rx["CMA-4544"]["SNR_1Pa_109k_dB"]])
ax[0].set_ylabel("SNR for 1 Pa at 109 kHz, dB (200 Hz RBW)"); ax[0].tick_params(axis="x", rotation=30)
ax[0].set_title("Acoustic pickup = false-signal risk")
rr = ["DT1-028K", "Emfit-HS", "Emfit-L", "EM258", "CMA-4544"]
ax[1].bar(rr, [ratio[k] for k in rr]); ax[1].set_yscale("log")
ax[1].set_ylabel("charge-coupled / acoustic output\n(sigma_stored x 1 V/m) / 1 Pa"); ax[1].tick_params(axis="x", rotation=30)
ax[1].set_title("Key selection ratio (higher is better)")
fig.tight_layout(); fig.savefig(os.path.join(OUT, "p4_rx_and_ratio.png")); plt.close(fig)

# ---------------- decision matrix ----------------
W = dict(charge=0.25, acoustic=0.20, edrive=0.25, control=0.15, cost=0.15)
def sc_charge(k):
    if k not in tx or "Qm_pC_fy" not in tx[k]: return 0.0
    ref = tx["DT1-028K"]["dipole_pCm_fy"]
    return max(0.0, min(5.0, 5 + 1.5*math.log10(tx[k]["dipole_pCm_fy"]/ref)))
def sc_acoustic(k):
    r = ratio.get(k)
    if r is None: return 0.0
    return max(0.0, min(5.0, 5 + 2*math.log10(r/ratio["DT1-028K"])))
EDRIVE = {"DT1-028K": 5, "DT1-052K": 5, "LDT0-028K": 2, "Emfit-HS": 3, "Emfit-S": 2.5, "Emfit-L": 1.5,
          "CMA-4544": 0, "EM258": 0, "SPU0410": 0, "SensComp7000": 0, "DIY-corona": 0}
CONTROL = {"DT1-028K": 3, "DT1-052K": 3, "LDT0-028K": 3, "Emfit-HS": 3.5, "Emfit-S": 3, "Emfit-L": 2.5,
           "CMA-4544": 1, "EM258": 1, "SPU0410": 0, "SensComp7000": 4, "DIY-corona": 5}
COST = {"DT1-028K": 4.5, "DT1-052K": 5, "LDT0-028K": 5, "Emfit-HS": 3, "Emfit-S": 2.5, "Emfit-L": 1,
        "CMA-4544": 5, "EM258": 5, "SPU0410": 4.5, "SensComp7000": 4, "DIY-corona": 3}
matrix = []
for c in cands:
    k = c["key"]
    s = dict(charge=sc_charge(k), acoustic=sc_acoustic(k), edrive=EDRIVE[k], control=CONTROL[k], cost=COST[k])
    if k == "LDT0-028K":
        s["charge"] = sc_charge("DT1-028K") - 1.5   # bending element; 109 kHz far above its modes [A]
    tot = sum(W[x]*s[x] for x in W)
    nohv = "FAIL" if c["hv"] else "pass"
    matrix.append(dict(key=k, name=c["name"], electret=c["electret"], noHV=nohv,
                       **{x: round(v, 2) for x, v in s.items()}, total=round(tot if nohv == "pass" else 0.0, 2)))
matrix.sort(key=lambda r: -r["total"])
json.dump(matrix, open(os.path.join(OUT, "decision_matrix.json"), "w"), indent=1)

fig, ax = plt.subplots(figsize=(8.5, 5))
cols = ["charge", "acoustic", "edrive", "control", "cost", "total"]
data = np.array([[r[c] for c in cols] for r in matrix])
im = ax.imshow(data, cmap="viridis", vmin=0, vmax=5, aspect="auto")
ax.set_xticks(range(len(cols))); ax.set_xticklabels([f"{c}\n({int(W[c]*100)}%)" if c in W else "weighted\ntotal" for c in cols])
ax.set_yticks(range(len(matrix))); ax.set_yticklabels([f'{r["key"]} [{r["noHV"]}]' for r in matrix])
for i in range(data.shape[0]):
    for j in range(data.shape[1]):
        ax.text(j, i, f"{data[i,j]:.1f}", ha="center", va="center", color="w" if data[i, j] < 3 else "k", fontsize=8)
ax.set_title("Decision matrix (0-5; no-HV is pass/fail, FAIL scores 0 total)")
fig.colorbar(im); fig.tight_layout(); fig.savefig(os.path.join(OUT, "p5_decision_matrix.png")); plt.close(fig)

# ---------------- text tables ----------------
L = []
L.append("| Candidate | C (pF) | |Z| at 109 kHz | TinySA alone | +1:4 | +series LC (L) | FY6900 20 Vpp |")
L.append("|---|---|---|---|---|---|---|")
for k, r in tx.items():
    L.append(f"| {k} | {r['C_pF']:.0f} | {r['Z_ohm']:.0f} ohm | {r['V_tinysa']*1e3:.0f} mV | {r['V_step']*1e3:.0f} mV | "
             f"{r['V_lc']:.2f} V ({r['L_lc_mH']:.1f} mH) | {r['V_fy']:.2f} V |")
L.append("")
L.append("| Candidate | disp nm (LC / FY) | moved charge pC (LC / FY) | dipole pC*um (FY) |")
L.append("|---|---|---|---|")
for k, r in tx.items():
    if "disp_nm_fy" in r:
        L.append(f"| {k} | {r['disp_nm_lc']:.3f} / {r['disp_nm_fy']:.3f} | {r['Qm_pC_lc']:.3f} / {r['Qm_pC_fy']:.3f} | {r['dipole_pCm_fy']*1e6:.3g} |")
L.append("")
L.append(f"RX noise (TinySA {FLOOR_DBM} dBm in {RBW:.0f} Hz + BF862): {VN*1e9:.0f} nV rms")
L.append("| Candidate | V per Pa | SNR 1 Pa | SNR 60 dB SPL | charge/acoustic ratio |")
L.append("|---|---|---|---|---|")
for k, r in rx.items():
    if "V_per_Pa" in r:
        L.append(f"| {k} | {r['V_per_Pa']*1e6:.1f} uV | {r['SNR_1Pa_dB']:.0f} dB | {r['SNR_60dB_dB']:.0f} dB | {ratio.get(k, float('nan')):.2e} |")
    else:
        L.append(f"| {k} | {r['V_per_Pa_audio']*1e3:.1f} mV audio, {r['V_per_Pa_109k']*1e3:.2f} mV at 109k (asm) | {r['SNR_1Pa_109k_dB']:.0f} dB | {r['SNR_60dB_109k_dB']:.0f} dB | {ratio.get(k, float('nan')):.2e} |")
L.append("")
L.append("| Acoustic leak, same-type TX->RX, 10 cm, open air | SPL at RX | RX level above floor |")
L.append("|---|---|---|")
for k, r in acoustic.items():
    L.append(f"| {k} | {r['SPL_dB']:.0f} dB SPL | {r['above_floor_dB']:+.0f} dB |")
L.append("")
L.append("| Rank | Candidate | no-HV | charge 25% | acoustic 20% | e-drive 25% | control 15% | cost 15% | total |")
L.append("|---|---|---|---|---|---|---|---|---|")
for i, r in enumerate(matrix, 1):
    L.append(f"| {i} | {r['name']} | {r['noHV']} | {r['charge']} | {r['acoustic']} | {r['edrive']} | {r['control']} | {r['cost']} | {r['total']} |")
L.append("")
L.append(f"DT1 bending f1 (30 mm free, 40 um) = {modes['DT1-028K']['bend_f1']:.1f} Hz; mode index at 109 kHz = {n109:.0f}; spacing {spacing/1e3:.1f} kHz")
L.append(f"DT1 length modes (kHz): {[round(x/1e3,1) for x in modes['DT1-028K']['length_modes']]}")
L.append(f"DT1 tip displacement per V at 109 kHz (Q=10): {strip_tip_disp(F0,1.0)*1e9:.3f} nm; quasi-static {PVDF['d31']/28e-6*30e-3*1e9:.1f} nm")
L.append(f"LDT0 free length needed for a 109 kHz fundamental: {modes['LDT0-028K']['L_for_109k']*1e3:.2f} mm")
L.append(f"Emfit HS layers needed to pull 600 kHz down to 109 kHz: about {modes['Emfit-HS']['stack_n_for_109k']:.1f}")
L.append(f"e33 (moved charge per unit displacement, C/m^2): {dip_per_disp}")
open(os.path.join(OUT, "tables.md"), "w").write("\n".join(L) + "\n")
print("\n".join(L))
