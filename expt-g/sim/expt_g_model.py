#!/usr/bin/env python3
"""Experiment G reference model (expt-g-v0.1) - Python twin of js/expt-g.js and wolfram/ExptG.wl.

Undersea SLW link via hydrogen 2S tickled relaxation.  Every formula below is cited; labels:
  FACT  = textbook / primary-source physics or lab value (cited)
  HYP   = Hively EED / SLW hypothesis (not established physics)
  ASSUMPTION (ours) = a modelling choice made on this page, swept where it matters.
Sources: Lamb & Retherford PR 72, 241 (1947); PR 79, 549 (1950) Eqs 25-27, 42; PR 81, 222 (1951);
Bethe & Salpeter (1957) Sec. 67; Klarsfeld PL 30A, 382 (1969); Nussbaumer & Schmutz A&A 138, 495 (1984);
NIST ASD H I; Parthey et al. PRL 107, 203001 (2011); Landhuis et al. arXiv:physics/0210019;
Hively & Loebl, Phys. Essays 32, 112 (2019) Eqs 37, 38, 44 + Erratum Phys. Essays 35, 320 (2022);
Meissner & Wentz, IEEE TGRS 42, 1836 (2004) Eqs 6-8, 11-17, Tables III, VI;
FX-1 openEMS results (sim-lab/fx1/openems/results.json).
"""
import math, cmath, json

# ---------------- constants (CODATA 2018, exact where defined) ----------------
C = dict(
    e=1.602176634e-19, hbar=1.054571817e-34, a0=5.29177210903e-11, c=299792458.0,
    eps0=8.8541878128e-12, mu0=1.25663706212e-6, kB=1.380649e-23, mH=1.6735575e-27, h=6.62607015e-34,
    # FACT NIST ASD H I level energies (cm^-1)
    E2S=82258.9543992821, E2P12=82258.9191133, E2P32=82259.2850014,
    gam=6.2648e8,          # FACT NIST ASD A(2p 2P1/2 -> 1s) s^-1  (2P decay rate gamma)
    A2E1=8.2283,           # FACT Klarsfeld 1969 2S two-photon rate s^-1
    NS_C=202.0, NS_alpha=0.88, NS_beta=1.53, NS_gamma=0.8,   # FACT Nussbaumer & Schmutz 1984 fit
    lamLya_nm=121.567,     # FACT NIST ASD 1s-2p vacuum wavelength (fine-structure average, 3 s.f. after point)
    f1S2S_Hz=2466061413187035.0,  # FACT Parthey 2011 1S-2S frequency
    landhuis_k=2800.0,     # FACT Landhuis: Stark quench rate gamma_s = 2800 E^2 (E in V/cm) s^-1 (cross-check)
)
C["eta0"] = C["mu0"] * C["c"]
CM1_MHZ = 29979.2458
L_MHZ = (C["E2S"] - C["E2P12"]) * CM1_MHZ
S32_MHZ = (C["E2P32"] - C["E2S"]) * CM1_MHZ
WL = 2 * math.pi * L_MHZ * 1e6
W32 = 2 * math.pi * S32_MHZ * 1e6
FWHM_MHZ = C["gam"] / (2 * math.pi) / 1e6

def x(E):   # e a0 E / hbar  [s^-1]
    return C["e"] * C["a0"] * E / C["hbar"]

# ---------------- 2S chain ----------------
def rate_ac(E0, f_Hz):
    """FACT: Lamb & Retherford 1950 Eq. 25 in SI, V = sqrt(3) e a0 E0/2 (|<e.r>|^2 = 3 a0^2, Eq. 27),
    both rotating terms, plus 2S1/2->2P3/2 path |z|^2 = 6 a0^2 (ASSUMPTION: same gamma). E0 = PEAK amplitude."""
    w = 2 * math.pi * f_Hz; g = C["gam"]; xx = x(E0) ** 2
    r = g * 3 * xx / 4 * (1 / ((WL - w) ** 2 + g * g / 4) + 1 / ((WL + w) ** 2 + g * g / 4))
    r += g * 6 * xx / 4 * (1 / ((W32 + w) ** 2 + g * g / 4) + 1 / ((W32 - w) ** 2 + g * g / 4))
    return r

def rate_res_simple(E0):
    """FACT: L&R 1950 Eq. 26 in SI: 3 (e a0 E0/hbar)^2 / gamma (single resonant term)."""
    return 3 * x(E0) ** 2 / C["gam"]

def rate_static(E):
    """FACT: L&R 1950 Eq. 42 (static field), V = sqrt(3) e a0 E, plus 2P3/2 term (V^2 = 6 e^2 a0^2 E^2).
    Cross-check: Landhuis 2800 E^2 (V/cm) s^-1."""
    g = C["gam"]
    return g * x(E) ** 2 * (3 / (WL ** 2 + g * g / 4) + 6 / (W32 ** 2 + g * g / 4))

def lorentz_factor(df_MHz):
    """FACT: resonant Lorentzian (L&R Eq. 25 single term) relative to line centre."""
    hw = FWHM_MHZ / 2
    return hw * hw / (df_MHz ** 2 + hw * hw)

# ---- hyperfine structure (FACT: Bullis et al. PRL 130, 203001 (2023) 2S HFS; Lundeen, Jessop & Pipkin PRL 34, 377 (1975) 2P1/2 HFS;
#      component positions & branching (Wigner 6j, J=J'=I=1/2) as in sim-lab/snr-2s-vs-sphere/compare.py; 909.87 MHz vs 909.894(20) PRA 98, 012509)
HFS_2S = 177.55683887; HFS_2P12 = 59.22
def _hf_shift(F, A): return A / 4 if F == 1 else -3 * A / 4
HF_COMP = {"F1": [((L_MHZ + _hf_shift(1, HFS_2S) - _hf_shift(1, HFS_2P12)) * 1e6, 2 / 3),
                  ((L_MHZ + _hf_shift(1, HFS_2S) - _hf_shift(0, HFS_2P12)) * 1e6, 1 / 3)],
           "F0": [((L_MHZ + _hf_shift(0, HFS_2S) - _hf_shift(1, HFS_2P12)) * 1e6, 1.0)]}
def rate_hf(E0, f_Hz, hf="F1"):
    """rate_ac with the resonant 2S1/2-2P1/2 term split into its hyperfine components (FACT/ours). hf = 'F1' (trapped
    2S F=1 atoms, Landhuis), 'F0', or 'centroid' (hyperfine ignored, = rate_ac)."""
    r = rate_ac(E0, f_Hz)
    if hf not in HF_COMP: return r
    w = 2 * math.pi * f_Hz; g = C["gam"]; k = g * 3 * x(E0) ** 2 / 4
    r -= k / ((WL - w) ** 2 + g * g / 4)
    for fc, b in HF_COMP[hf]:
        r += b * k / ((2 * math.pi * fc - w) ** 2 + g * g / 4)
    return r

def rate_bbr(T):
    """Thermal (blackbody) quench of 2S inside the cage, 2P1/2 + 2P3/2 paths: 0.5 (e/hbar)^2 sum |z|^2 u_nu(nu0)/eps0 (ours;
    Planck spectrum, Lamb matrix elements; Gallagher & Cooke PRL 42, 835 (1979); same formula as snr-2s-vs-sphere/compare.py)."""
    if T <= 0: return 0.0
    def U(nu): return 8 * math.pi * C["h"] * nu ** 3 / C["c"] ** 3 / math.expm1(C["h"] * nu / (C["kB"] * T)) / C["eps0"]
    return 0.5 * (C["e"] / C["hbar"]) ** 2 * (3 * C["a0"] ** 2 * U(L_MHZ * 1e6) + 6 * C["a0"] ** 2 * U(S32_MHZ * 1e6))

def ns_A(y):
    """FACT: Nussbaumer & Schmutz 1984 two-photon spectral rate per unit y = nu/nu_Lya (photons per atom per s per unit y)."""
    if y <= 0 or y >= 1: return 0.0
    w = y * (1 - y); q = (4 * w) ** C["NS_gamma"]
    return C["NS_C"] * (w * (1 - q) + C["NS_alpha"] * w ** C["NS_beta"] * q)

def ns_int(y1, y2, n=4000):
    """Simpson integral of ns_A over [y1, y2]."""
    y1 = max(0.0, y1); y2 = min(1.0, y2)
    if y2 <= y1: return 0.0
    if n % 2: n += 1
    h = (y2 - y1) / n; s = ns_A(y1) + ns_A(y2)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * ns_A(y1 + i * h)
    return s * h / 3

def twoE1_band(fwhm_nm, lam_c_nm=121.6, det_lo_nm=115.0, det_hi_nm=200.0):
    """ASSUMPTION (ours): top-hat filter of width fwhm centred at lam_c; detector (CsI) responds det_lo..det_hi (R6835).
    Returns (F_band, F_oob) = 2E1 photons per atom per s inside the filter band, and inside detector range but outside band."""
    lam = C["lamLya_nm"]
    y_lo_band = lam / (lam_c_nm + fwhm_nm / 2); y_hi_band = min(1.0, lam / (lam_c_nm - fwhm_nm / 2))
    F_band = ns_int(y_lo_band, y_hi_band)
    y_lo_det = lam / det_hi_nm; y_hi_det = min(1.0, lam / det_lo_nm)
    F_oob = ns_int(y_lo_det, y_hi_det) - F_band
    return F_band, F_oob

def filt_T(lam_nm, W, shape, lc=121.6, block=1e-4):
    """ASSUMPTION (as snr-2s-vs-sphere): Lorentzian or Gaussian passband of FWHM W centred at 121.6 nm (FN122-XN spec 122+/-2.5 nm),
    out-of-band floor 'block' for 115-200 nm (Pelham visible rejection ~1e-4; VUV blocking not verified), block/8500 above 200 nm
    (Hamamatsu R13194 121.6/300 nm sensitivity ratio), 0 below 115 nm (MgF2 cut-on)."""
    if lam_nm < 115.0: return 0.0
    if shape == "gauss": t = math.exp(-4 * math.log(2) * (lam_nm - lc) ** 2 / (W * W))
    else: t = 1 / (1 + 4 * (lam_nm - lc) ** 2 / (W * W))
    return max(t, block if lam_nm <= 200.0 else block / 8500)

_A_INT = None
def F2E1(W, shape, n=20000):
    """2E1 photons per 2S decay passing the filter, relative to the filter transmission at Lyman-alpha (ours; NS84 shape).
    Simpson on [0, y200] and [y200, 1] (y200 = lamLya/200 nm, where the floor steps)."""
    global _A_INT
    if _A_INT is None: _A_INT = ns_int(0.0, 1.0, n)
    lam = C["lamLya_nm"]; y200 = lam / 200.0
    f = lambda y: ns_A(y) * filt_T(lam / y, W, shape) if y > 0 else 0.0
    def simp(a, b):
        h = (b - a) / n; t = f(a) + f(b)
        for i in range(1, n): t += (4 if i % 2 else 2) * f(a + i * h)
        return t * h / 3
    return 2 * (simp(1e-12, y200) + simp(y200, 1.0 - 1e-12)) / _A_INT / filt_T(lam, W, shape)

# magnetic-tuning option (reused from Expt D detectors_check.py; hyperfine ignored = ASSUMPTION)
BC_G = 573.5; SLOPE_MHZ_G = 1.82   # FACT (ours, diagonalisation) - recomputed in expt_g_check.py via detectors_check
def rate_mag(E_perp, f_drive_Hz, B_G, Bc=BC_G, slope=SLOPE_MHZ_G):
    """ASSUMPTION (ours): near the beta-e crossing the splitting is linear, f_be = slope*(Bc-B);
    on-resonance rate 6 (e a0 E/hbar)^2/gamma (Expt D check) times the Lorentzian in (f_drive - |f_be|)."""
    fbe = slope * (Bc - B_G) * 1e6
    d = abs(f_drive_Hz) - abs(fbe); g = C["gam"]
    return 6 * x(E_perp) ** 2 / g * (g * g / 4) / ((2 * math.pi * d) ** 2 + g * g / 4)

def v_th(T):   # sqrt(kT/m) (same definition as Expt D check)
    return math.sqrt(C["kB"] * T / C["mH"])

# ---------------- seawater (Meissner & Wentz 2004) ----------------
MW_A = [5.7230e+00, 2.2379e-02, -7.1237e-04, 5.0478e+00, -7.0315e-02, 6.0059e-04, 3.6143e+00,
        2.8841e-02, 1.3652e-01, 1.4825e-03, 2.4166e-04]                   # Table III a0..a10
MW_B = [-3.56417e-03, 4.74868e-06, 1.15574e-05, 2.39357e-03, -3.13530e-05, 2.52477e-07,
        -6.28908e-03, 1.76032e-04, -9.22144e-05, -1.99723e-02, 1.81176e-04, -2.04265e-03, 1.57883e-04]  # Table VI b0..b12

def mw_sigma(T, S):
    """FACT: MW2004 Eqs 11-16 (Stogryn et al. regression), S/m."""
    s35 = 2.903602 + 8.607e-2 * T + 4.738817e-4 * T ** 2 - 2.991e-6 * T ** 3 + 4.3047e-9 * T ** 4
    R15 = S * (37.5109 + 5.45216 * S + 1.4409e-2 * S ** 2) / (1004.75 + 182.283 * S + S ** 2)
    a0 = (6.9431 + 3.2841 * S - 9.9486e-2 * S ** 2) / (84.850 + 69.024 * S + S ** 2)
    a1 = 49.843 - 0.2276 * S + 0.198e-2 * S ** 2
    return s35 * R15 * (1 + a0 * (T - 15) / (a1 + T))

def mw_eps(f_GHz, T, S):
    """FACT: MW2004 Eq. 6 double Debye (Im < 0 convention), Eqs 7, 8, 17. Valid -2..29 C (sea), S 0..40, f <= 90 GHz."""
    a = MW_A; b = MW_B
    es0 = (3.70886e4 - 8.2168e1 * T) / (4.21854e2 + T)
    e10 = a[0] + a[1] * T + a[2] * T ** 2
    n10 = (45 + T) / (a[3] + a[4] * T + a[5] * T ** 2)
    einf0 = a[6] + a[7] * T
    n20 = (45 + T) / (a[8] + a[9] * T + a[10] * T ** 2)
    es = es0 * math.exp(b[0] * S + b[1] * S ** 2 + b[2] * T * S)
    n1 = n10 * (1 + S * (b[3] + b[4] * T + b[5] * T ** 2))
    e1 = e10 * math.exp(b[6] * S + b[7] * S ** 2 + b[8] * T * S)
    n2 = n20 * (1 + S * (b[9] + b[10] * T))
    einf = einf0 * (1 + S * (b[11] + b[12] * T))
    sig = mw_sigma(T, S) if S > 0 else 0.0
    eps = (es - e1) / (1 + 1j * f_GHz / n1) + (e1 - einf) / (1 + 1j * f_GHz / n2) + einf \
          - 1j * sig / (2 * math.pi * C["eps0"] * f_GHz * 1e9)
    return eps, sig

def water(f_Hz, T, S):
    """Seawater propagation numbers at f.  TEM: FACT plane wave in lossy dielectric.
    SLW: HYP Hively & Loebl 2019 Eq. 37 (far field, mu'=1); Joule-literal alpha: ASSUMPTION (ours)."""
    eps, sig = mw_eps(f_Hz / 1e9, T, S)
    ep, epp = eps.real, -eps.imag
    w = 2 * math.pi * f_Hz
    sq = cmath.sqrt(ep - 1j * epp)            # e^{j(wt - kz)}: k = (w/c) sqrt(eps' - j eps'')
    alpha_tem = -(w / C["c"]) * sq.imag       # Np/m
    beta_tem = (w / C["c"]) * sq.real
    eta = C["eta0"] / sq                       # complex intrinsic impedance
    tand = epp / ep
    Zslw = C["eta0"] / math.sqrt(ep) / abs(1 - 1j * tand)   # |Z| Eq. 37, kr -> infinity
    sigH = C["eps0"] * epp * w                 # Hively's sigma = eps0 eps'' omega (text after Eq. 36)
    alpha_J = sigH * Zslw / 2                  # ASSUMPTION (ours): dS/dr = -J.E = -sigma E^2, S = E^2/|Z|
    return dict(ep=ep, epp=epp, sigma=sig, sigH=sigH, tand=tand, alpha_tem=alpha_tem, beta_tem=beta_tem,
                lam_water=2 * math.pi / beta_tem, eta_abs=abs(eta), eta_phase=cmath.phase(eta),
                Zslw=Zslw, alpha_J=alpha_J)

NP2DB = 20 / math.log(10)

def alpha_slw(mode, wt, custom=0.0):
    if mode == "errata0": return 0.0          # HYP Hively & Loebl 2022 Erratum: no resistive loss
    if mode == "joule": return wt["alpha_J"]  # ASSUMPTION (ours): J.E term taken literally
    if mode == "tem": return wt["alpha_tem"]  # TEM-equal case (brief section 4)
    return custom

def field_at(r, P, alpha, Zabs, costh=1.0):
    """ASSUMPTION (ours): isotropic point source, far-field, S = E_pk^2 cos(th)/(2|Z|), power decays exp(-2 alpha r)."""
    return math.sqrt(2 * Zabs * P / (4 * math.pi * r * r * costh)) * math.exp(-alpha * r)

def power_for(E, r, alpha, Zabs, costh=1.0):
    """Inverse of field_at; returns log10(P/W) to avoid overflow."""
    return (math.log10(E * E * 4 * math.pi * r * r * costh / (2 * Zabs)) + 2 * alpha * r / math.log(10))

# ---------------- FX-1 openEMS seam proxy ----------------
def fx1_seam_SE(results_json_path):
    d = json.load(open(results_json_path))
    ext = d["exterior"]["433.59MHz"]["near_field_by_distance"]["equatorial_+x"]["E_Vpm_per_0p4V_peak_gap"][0]
    t = d["hyp_vs_fdtd_interior_433MHz"]; out = {}
    for case in ["ring_slot_1mm", "ring_slot_0p1mm", "arc_slot_1mm_x30mm", "arc_slot_0p1mm_x30mm"]:
        Ei = t["E_FDTD_max_over_4_directions_Vpm_at_0p4V_" + case][0]
        out[case] = 20 * math.log10(ext / Ei)
    return ext, out

# ---------------- link budget ----------------
DEFAULTS = dict(
    f_d=L_MHZ * 1e6, eta_c=1.0, T_w=15.0, S=35.0, r=1.0, P_tx=1.0, slw_mode="joule", alpha_custom=0.0,   # default: Joule-literal (Dan rule 2026-09-25); Erratum alpha=0 is a toggle
    T_hull=1.0, T_cage=1.0, SE_cage=80.0, SE_hull_tem=0.0,
    hf="F1",                                   # FACT Landhuis: trapped 2S atoms are F=1 (m_F=1)
    N2S=5e7, eps_det=3e-7, R_dark=1.66,        # LAB preset (see page): Landhuis N; 2e-6 (no filter) x 0.15 filter; MCP 0.4/cm2/s x 4.15 cm2
    filt_fwhm=10.0, filt_shape="lorentz", block=1e-4,   # FN122-XN (Teledyne Acton) 10 nm, T>=15 %; shape ASSUMPTION
    E_stray=0.0, G_stray=1.7717, B_stray=1e-3, T_atom=100e-6, T_bbr=290.0,   # G_stray: Landhuis best compensation 1/0.1 s - 8.2283
    SNR=5.0, T_int=1.0, cps_max=15e6,          # Sjuts EDR CEM 15 Mcps (FACT, via snr-2s-vs-sphere)
    E_ads_ext=0.0173, duty_ads=1e-3, E_gps_ext=2.82e-6, E_wifi_ext=0.0, duty_wifi=1.0, E_dme_ext=0.0, duty_dme=1e-3,
)
F_ADS = 1090e6; F_GPS_L2 = 1227.6e6; F_WIFI = 2437e6; F_DME = 1058e6

def _snr(S, B, T):   # ASSUMPTION (ours): on/off keying, equal off-time to measure B: SNR = S sqrt(T/2)/sqrt(S+2B)
    return S * math.sqrt(T / 2) / math.sqrt(S + 2 * B) if (S + B) > 0 else 0.0

def link(p=None):
    q = dict(DEFAULTS); q.update(p or {})
    wt = water(q["f_d"], q["T_w"], q["S"])
    a_s = alpha_slw(q["slw_mode"], wt, q["alpha_custom"])
    costh = math.cos(wt["eta_phase"])
    E_out_slw = field_at(q["r"], q["P_tx"], a_s, wt["Zslw"])            # HYP SLW field at hull
    E_det_slw = E_out_slw * q["T_hull"] * q["T_cage"]
    E_out_tem = field_at(q["r"], q["P_tx"], wt["alpha_tem"], wt["eta_abs"], costh)
    eta_w = C["eta0"] / cmath.sqrt(wt["ep"] - 1j * wt["epp"])
    tau = abs(2 * C["eta0"] / (C["eta0"] + eta_w))                        # FACT Fresnel water->air, normal incidence
    att = 10 ** (-(q["SE_hull_tem"] + q["SE_cage"]) / 20)
    E_det_tem = E_out_tem * tau * att
    N, eps, hf = q["N2S"], q["eps_det"], q["hf"]
    K1 = q["eta_c"] * rate_hf(1e-6, q["f_d"], hf)                         # HYP eta; rate per atom at 1 uV/m peak
    G_sig = K1 * (E_det_slw / 1e-6) ** 2
    G_tem = rate_hf(E_det_tem, q["f_d"], hf)
    F2 = F2E1(q["filt_fwhm"], q["filt_shape"])
    E_mot = v_th(q["T_atom"]) * q["B_stray"] * 1e-4
    E_dc = math.sqrt(q["E_stray"] ** 2 + E_mot ** 2)
    G_dc = rate_static(E_dc) + q["G_stray"]
    G_bbr = rate_bbr(q["T_bbr"])
    G_ads = rate_hf(q["E_ads_ext"] * att, F_ADS, hf) * q["duty_ads"]
    G_gps = rate_hf(q["E_gps_ext"] * att, F_GPS_L2, hf)
    G_wifi = rate_hf(q["E_wifi_ext"] * att, F_WIFI, hf) * q["duty_wifi"]
    G_dme = rate_hf(q["E_dme_ext"] * att, F_DME, hf) * q["duty_dme"]
    g_b = C["A2E1"] * F2 + G_dc + G_bbr + G_ads + G_gps + G_wifi + G_dme + G_tem   # background photons per 2S atom per s
    G0 = C["A2E1"] + G_dc + G_bbr + G_ads + G_gps + G_wifi + G_dme + G_tem         # no-signal loss rate per atom
    dep = lambda Gs: G0 / (G0 + Gs)             # ASSUMPTION (as snr-2s-vs-sphere): pump holds N at N*G0; signal depletes
    D = dep(G_sig)
    R = dict(sig=N * D * eps * G_sig, tem_leak=N * D * eps * G_tem, twoE1=N * D * eps * C["A2E1"] * F2,
             stark=N * D * eps * G_dc, bbr=N * D * eps * G_bbr, ads=N * D * eps * G_ads, gps=N * D * eps * G_gps,
             wifi=N * D * eps * G_wifi, dme=N * D * eps * G_dme, dark=q["R_dark"])
    Rb = R["twoE1"] + R["stark"] + R["bbr"] + R["ads"] + R["gps"] + R["wifi"] + R["dme"] + R["tem_leak"] + R["dark"]
    T = q["T_int"]; K = q["SNR"]
    snr = _snr(R["sig"], Rb, T)
    # field needed at atoms: bisection on log10(G_sig) (snr increases monotonically with G_sig)
    f = lambda lg: _snr(N * eps * 10 ** lg * dep(10 ** lg), N * eps * g_b * dep(10 ** lg) + q["R_dark"], T) - K
    lo, hi = -40.0, 12.0
    if f(hi) < 0: G_req = float("inf")
    elif f(lo) >= 0: G_req = 10 ** lo
    else:
        for _ in range(200):
            m = (lo + hi) / 2
            if f(m) >= 0: hi = m
            else: lo = m
        G_req = 10 ** ((lo + hi) / 2)
    E_req_det = 1e-6 * math.sqrt(G_req / K1) if math.isfinite(G_req) else float("inf")
    E_req_out = E_req_det / (q["T_hull"] * q["T_cage"])
    a = eps * G_sig * D; b = eps * g_b * D; d = q["R_dark"]
    N_req = ((K * K * (a + 2 * b) + math.sqrt(K ** 4 * (a + 2 * b) ** 2 + 8 * T / 2 * a * a * K * K * d)) / (T * a * a)) if a > 1e-150 else float("inf")   # guard: a^2 underflows (Joule default at long range)
    cps = R["sig"] + Rb
    return dict(q=q, wt=wt, alpha_slw=a_s, E_out_slw=E_out_slw, E_det_slw=E_det_slw, E_out_tem=E_out_tem,
                tau_wa=tau, E_det_tem=E_det_tem, G_sig=G_sig, G_tem=G_tem, G_dc=G_dc, G_bbr=G_bbr, E_mot=E_mot, E_dc=E_dc,
                F2=F2, g_b=g_b, G0=G0, dep=D, R=R, Rb=Rb, snr=snr, G_req=G_req, E_req_det=E_req_det,
                E_req_out=E_req_out, N_req=N_req, cps=cps, counter_sat=cps > q["cps_max"], K1=K1)

def ptx_required(r, E_req_out, wt, mode, custom=0.0):
    """log10(P_TX/W) needed to put E_req_out (peak) at the hull at range r, for mode errata0/joule/tem (SLW) or 'TEM' (FACT)."""
    if mode == "TEM":
        return power_for(E_req_out, r, wt["alpha_tem"], wt["eta_abs"], math.cos(wt["eta_phase"]))
    return power_for(E_req_out, r, alpha_slw(mode, wt, custom), wt["Zslw"])

if __name__ == "__main__":
    wt = water(L_MHZ * 1e6, 15, 35)
    print(json.dumps(wt, indent=1))
    L = link(); print({k: L[k] for k in ("E_det_slw", "G_sig", "Rb", "snr", "R_req", "G_req", "E_req_det", "N_req", "saturated")})
    print(L["R"])

def max_range(P, Ereq, wt, mode, custom=0.0):
    """Largest r in [1e-3, 1e5] m for which the required power <= P (bisection on log10 r), mirrors JS."""
    lp = math.log10(P)
    f = lambda lr: ptx_required(10 ** lr, Ereq, wt, mode, custom) - lp
    lo, hi = -3.0, 5.0
    if f(lo) > 0: return 0.0
    if f(hi) <= 0: return 10 ** hi
    for _ in range(200):
        m = (lo + hi) / 2
        if f(m) <= 0: lo = m
        else: hi = m
    return 10 ** ((lo + hi) / 2)
