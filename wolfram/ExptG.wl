(* ::Package:: *)
(* Experiment G  -  Undersea SLW link via hydrogen 2S tickled relaxation.  WL twin of
   sim/expt_g_model.py and js/expt-g-engine.js, version expt-g-v0.1.
   STATUS: written BY HAND (not AI-drafted), NOT YET RUN (no Wolfram Cloud key on the build box).
   The JS <-> WL compare is OWED; run ExptG_RunGrid.wl to produce wl_outputs.json, then
   python3 sim/compare_outputs.py.  No equation here is new: each mirrors a cited line of the Python model.
   Labels: FACT (cited physics), HYP (Hively EED/SLW hypothesis), ASSUMPTION (ours).
   Sources: Lamb & Retherford PR 79, 549 (1950) Eqs 25-27, 42; Klarsfeld PL 30A, 382 (1969);
   Nussbaumer & Schmutz A&A 138, 495 (1984); NIST ASD H I; Hively & Loebl Phys. Essays 32, 112 (2019)
   Eqs 36-38, 44 + Erratum Phys. Essays 35, 320 (2022); Meissner & Wentz IEEE TGRS 42, 1836 (2004). *)

BeginPackage["ExptG`"];
gC::usage = "constants"; gLMHz::usage = "Lamb shift MHz"; gFWHMMHz::usage = "2P width MHz";
rateAC::usage = "rateAC[E0, fHz]"; rateStatic::usage = "rateStatic[E]"; lorentzFactor::usage = "lorentzFactor[dfMHz]";
nsA::usage = "nsA[y]"; nsInt::usage = "nsInt[y1,y2]"; twoE1Band::usage = "twoE1Band[fwhm, lamc]";
rateMag::usage = "rateMag[Eperp, fdrive, B]"; rateHF::usage = "rateHF[E0, f, hf]"; rateBBR::usage = "rateBBR[T]";
filtT::usage = "filtT[lam, W, shape]"; f2E1::usage = "f2E1[W, shape] 2E1 photons per decay through filter"; vth::usage = "vth[T]"; mwSigma::usage = "mwSigma[T,S]";
mwEps::usage = "mwEps[fGHz,T,S]"; water::usage = "water[fHz,T,S]"; alphaSLW::usage = "alphaSLW[mode, wt, custom]";
fieldAt::usage = "fieldAt[r,P,alpha,Z,costh]"; powerFor::usage = "powerFor[E,r,alpha,Z,costh] (log10 W)";
gDefaults::usage = "default link parameters (LAB preset)"; link::usage = "link[assoc]";
ptxRequired::usage = "ptxRequired[r, Ereq, wt, mode]"; maxRange::usage = "maxRange[P, Ereq, wt, mode]";
Begin["`Private`"];

gC = <|"e" -> 1.602176634*^-19, "hbar" -> 1.054571817*^-34, "a0" -> 5.29177210903*^-11, "c" -> 299792458.,
  "eps0" -> 8.8541878128*^-12, "mu0" -> 1.25663706212*^-6, "kB" -> 1.380649*^-23, "mH" -> 1.6735575*^-27,
  "E2S" -> 82258.9543992821, "E2P12" -> 82258.9191133, "E2P32" -> 82259.2850014,   (* FACT NIST ASD, cm^-1 *)
  "gam" -> 6.2648*^8, (* FACT NIST ASD A(2P1/2->1S) *)  "A2E1" -> 8.2283, (* FACT Klarsfeld 1969 *)
  "NSC" -> 202.0, "NSalpha" -> 0.88, "NSbeta" -> 1.53, "NSgamma" -> 0.8,        (* FACT NS 1984 fit *)
  "lamLya" -> 121.567|>;
gC["eta0"] = gC["mu0"] gC["c"];
cm1MHz = 29979.2458;
gLMHz = (gC["E2S"] - gC["E2P12"]) cm1MHz;  s32MHz = (gC["E2P32"] - gC["E2S"]) cm1MHz;
wL = 2 Pi gLMHz 10^6 // N;  w32 = 2 Pi s32MHz 10^6 // N;
gFWHMMHz = gC["gam"]/(2 Pi)/10^6 // N;
xx[e_] := gC["e"] gC["a0"] e/gC["hbar"];

(* FACT: L&R 1950 Eq. 25 (SI), V = Sqrt[3] e a0 E0/2 (Eq. 27), both rotating terms, + 2P3/2 path (|z|^2 = 6 a0^2) *)
rateAC[e0_, f_] := Module[{w = 2. Pi f, g = gC["gam"], x2 = xx[e0]^2},
  g 3 x2/4 (1/((wL - w)^2 + g^2/4) + 1/((wL + w)^2 + g^2/4)) +
  g 6 x2/4 (1/((w32 + w)^2 + g^2/4) + 1/((w32 - w)^2 + g^2/4))];
(* FACT: L&R 1950 Eq. 42 static field + 2P3/2 term *)
rateStatic[e_] := Module[{g = gC["gam"]}, g xx[e]^2 (3/(wL^2 + g^2/4) + 6/(w32^2 + g^2/4))];
lorentzFactor[df_] := Module[{hw = gFWHMMHz/2}, hw^2/(df^2 + hw^2)];
(* FACT: Nussbaumer & Schmutz 1984 two-photon spectrum per unit y = nu/nu_Lya *)
nsA[y_?NumericQ] := If[y <= 0 || y >= 1, 0.,
  Module[{w = y (1 - y), q}, q = (4 w)^gC["NSgamma"]; gC["NSC"] (w (1 - q) + gC["NSalpha"] w^gC["NSbeta"] q)]];
(* Simpson, n = 4000, identical to Python/JS *)
nsInt[y1in_, y2in_, n_: 4000] := Module[{y1 = Max[0., y1in], y2 = Min[1., y2in], h, s},
  If[y2 <= y1, Return[0.]]; h = (y2 - y1)/n;
  s = nsA[y1] + nsA[y2] + Sum[If[OddQ[i], 4, 2] nsA[y1 + i h], {i, 1, n - 1}]; s h/3];
(* ASSUMPTION (ours): top-hat filter; CsI detector 115-200 nm (R6835) *)
twoE1Band[fw_, lc_: 121.6, dlo_: 115., dhi_: 200.] := Module[{lam = gC["lamLya"], fb, fo},
  fb = nsInt[lam/(lc + fw/2), Min[1., lam/(lc - fw/2)]];
  fo = nsInt[lam/dhi, Min[1., lam/dlo]] - fb; {fb, fo}];
(* FACT: hyperfine intervals Bullis et al. PRL 130, 203001 (2023); Lundeen, Jessop & Pipkin PRL 34, 377 (1975); branching 2/3, 1/3 *)
hfs2S = 177.55683887; hfs2P = 59.22;
hfShift[1, a_] := a/4; hfShift[0, a_] := -3 a/4;
hfComp = <|"F1" -> {{(gLMHz + hfShift[1, hfs2S] - hfShift[1, hfs2P]) 10^6, 2/3.}, {(gLMHz + hfShift[1, hfs2S] - hfShift[0, hfs2P]) 10^6, 1/3.}},
   "F0" -> {{(gLMHz + hfShift[0, hfs2S] - hfShift[1, hfs2P]) 10^6, 1.}}|>;
rateHF[e0_, f_, hf_: "F1"] := Module[{r = rateAC[e0, f], w = 2. Pi f, g = gC["gam"], k},
  If[! KeyExistsQ[hfComp, hf], Return[r]]; k = g 3 xx[e0]^2/4;
  r - k/((wL - w)^2 + g^2/4) + Total[(#[[2]] k/((2 Pi #[[1]] - w)^2 + g^2/4)) & /@ hfComp[hf]]];
(* ours: Planck spectrum x Lamb matrix elements (Gallagher & Cooke 1979) *)
rateBBR[t_] := If[t <= 0, 0., Module[{u},
  u[nu_] := 8 Pi 6.62607015*^-34 nu^3/gC["c"]^3/(Exp[6.62607015*^-34 nu/(gC["kB"] t)] - 1)/gC["eps0"];
  0.5 (gC["e"]/gC["hbar"])^2 (3 gC["a0"]^2 u[gLMHz 10^6] + 6 gC["a0"]^2 u[s32MHz 10^6])]];
(* ASSUMPTION: Lorentz/Gauss filter, floor 1e-4 (115-200 nm), 1e-4/8500 above 200 nm, 0 below 115 nm *)
filtT[lam_, w_, shape_, lc_: 121.6, blk_: 1.*^-4] := If[lam < 115., 0.,
  Max[If[shape === "gauss", Exp[-4 Log[2.] (lam - lc)^2/w^2], 1/(1 + 4 (lam - lc)^2/w^2)], If[lam <= 200., blk, blk/8500]]];
aInt := aInt = nsInt[0., 1., 20000];
f2E1[w_, shape_, n_: 20000] := f2E1[w, shape, n] = Module[{lam = gC["lamLya"], y200, f, simp},
  y200 = lam/200.; f[y_] := If[y > 0, nsA[y] filtT[lam/y, w, shape], 0.];
  simp[a0_, b0_] := Module[{h = (b0 - a0)/n}, (f[a0] + f[b0] + Sum[If[OddQ[i], 4, 2] f[a0 + i h], {i, 1, n - 1}]) h/3];
  2 (simp[1.*^-12, y200] + simp[y200, 1. - 1.*^-12])/aInt/filtT[lam, w, shape]];
bcG = 573.5; slopeMHzG = 1.82;
(* ASSUMPTION (ours): linear beta-e splitting near the crossing (Expt D check) *)
rateMag[ep_, fd_, b_] := Module[{fbe = slopeMHzG (bcG - b) 10^6, d, g = gC["gam"]},
  d = Abs[fd] - Abs[fbe]; 6 xx[ep]^2/g (g^2/4)/((2 Pi d)^2 + g^2/4)];
vth[t_] := Sqrt[gC["kB"] t/gC["mH"]];

(* FACT: Meissner & Wentz 2004 Table III (a0..a10), Table VI (b0..b12) *)
mwA = {5.7230, 2.2379*^-2, -7.1237*^-4, 5.0478, -7.0315*^-2, 6.0059*^-4, 3.6143, 2.8841*^-2, 1.3652*^-1, 1.4825*^-3, 2.4166*^-4};
mwB = {-3.56417*^-3, 4.74868*^-6, 1.15574*^-5, 2.39357*^-3, -3.13530*^-5, 2.52477*^-7, -6.28908*^-3, 1.76032*^-4,
  -9.22144*^-5, -1.99723*^-2, 1.81176*^-4, -2.04265*^-3, 1.57883*^-4};
a[i_] := mwA[[i + 1]]; b[i_] := mwB[[i + 1]];
(* FACT: MW2004 Eqs 11-16 *)
mwSigma[t_, s_] := Module[{s35, r15, al0, al1},
  s35 = 2.903602 + 8.607*^-2 t + 4.738817*^-4 t^2 - 2.991*^-6 t^3 + 4.3047*^-9 t^4;
  r15 = s (37.5109 + 5.45216 s + 1.4409*^-2 s^2)/(1004.75 + 182.283 s + s^2);
  al0 = (6.9431 + 3.2841 s - 9.9486*^-2 s^2)/(84.850 + 69.024 s + s^2);
  al1 = 49.843 - 0.2276 s + 0.198*^-2 s^2;
  s35 r15 (1 + al0 (t - 15)/(al1 + t))];
(* FACT: MW2004 Eq. 6 (Im < 0), Eqs 7, 8, 17 *)
mwEps[fG_, t_, s_] := Module[{es0, e10, n10, einf0, n20, es, n1, e1, n2, einf, sig},
  es0 = (3.70886*^4 - 8.2168*^1 t)/(4.21854*^2 + t);
  e10 = a[0] + a[1] t + a[2] t^2; n10 = (45 + t)/(a[3] + a[4] t + a[5] t^2);
  einf0 = a[6] + a[7] t; n20 = (45 + t)/(a[8] + a[9] t + a[10] t^2);
  es = es0 Exp[b[0] s + b[1] s^2 + b[2] t s]; n1 = n10 (1 + s (b[3] + b[4] t + b[5] t^2));
  e1 = e10 Exp[b[6] s + b[7] s^2 + b[8] t s]; n2 = n20 (1 + s (b[9] + b[10] t)); einf = einf0 (1 + s (b[11] + b[12] t));
  sig = If[s > 0, mwSigma[t, s], 0.];
  {(es - e1)/(1 + I fG/n1) + (e1 - einf)/(1 + I fG/n2) + einf - I sig/(2 Pi gC["eps0"] fG 10^9), sig}];
(* TEM: FACT plane wave; SLW: HYP Hively & Loebl Eq. 37 far field; alphaJ: ASSUMPTION (ours) *)
water[f_, t_, s_] := Module[{eps, sig, ep, epp, w = 2. Pi f, sq, eta, tand, z, sigH},
  {eps, sig} = mwEps[f/10^9, t, s]; ep = Re[eps]; epp = -Im[eps];
  sq = Sqrt[ep - I epp]; eta = gC["eta0"]/sq; tand = epp/ep;
  z = gC["eta0"]/Sqrt[ep]/Abs[1 - I tand]; sigH = gC["eps0"] epp w;
  <|"ep" -> ep, "epp" -> epp, "sigma" -> sig, "sigH" -> sigH, "tand" -> tand,
    "alpha_tem" -> -(w/gC["c"]) Im[sq], "beta_tem" -> (w/gC["c"]) Re[sq],
    "eta_abs" -> Abs[eta], "eta_phase" -> Arg[eta], "Zslw" -> z, "alpha_J" -> sigH z/2|>];
alphaSLW[mode_, wt_, custom_: 0.] := Switch[mode, "errata0", 0., "joule", wt["alpha_J"], "tem", wt["alpha_tem"], _, custom];
(* ASSUMPTION (ours): isotropic far-field point source *)
fieldAt[r_, p_, al_, z_, c_: 1.] := Sqrt[2 z p/(4 Pi r^2 c)] Exp[-al r];
powerFor[e_, r_, al_, z_, c_: 1.] := Log10[e^2 4 Pi r^2 c/(2 z)] + 2 al r/Log[10.];

gDefaults = <|"f_d" -> gLMHz 10^6, "eta_c" -> 1., "T_w" -> 15., "S" -> 35., "r" -> 1., "P_tx" -> 1., "slw_mode" -> "errata0",
  "alpha_custom" -> 0., "T_hull" -> 1., "T_cage" -> 1., "SE_cage" -> 80., "SE_hull_tem" -> 0., "hf" -> "F1", "N2S" -> 5.*^7,
  "eps_det" -> 3.*^-7, "R_dark" -> 1.66, "filt_fwhm" -> 10., "filt_shape" -> "lorentz", "block" -> 1.*^-4,
  "E_stray" -> 0., "G_stray" -> 1.7717, "B_stray" -> 1.*^-3, "T_atom" -> 100.*^-6, "T_bbr" -> 290., "SNR" -> 5., "T_int" -> 1.,
  "cps_max" -> 15.*^6, "E_ads_ext" -> 0.0173, "duty_ads" -> 1.*^-3, "E_gps_ext" -> 2.82*^-6,
  "E_wifi_ext" -> 0., "duty_wifi" -> 1., "E_dme_ext" -> 0., "duty_dme" -> 1.*^-3|>;
fADS = 1090.*^6; fGPS = 1227.6*^6; fWIFI = 2437.*^6; fDME = 1058.*^6;
snrF[s_, b_, t_] := If[s + b > 0, s Sqrt[t/2]/Sqrt[s + 2 b], 0.];   (* ASSUMPTION: on/off keying *)

link[p_Association: <||>] := Module[{q = Join[gDefaults, p], wt, as, c, eos, eds, eot, etaw, tau, att, edt, n, ep, hf, k1, gs, gt,
    f2, em, edc, gdc, gbbr, gads, ggps, gwifi, gdme, gb, g0, dep, dd, nde, rr, rb, t, k, snr, f, lo, hi, m, greq, ereqd, ereqo, aa, bb, dk, nreq, cps},
  wt = water[q["f_d"], q["T_w"], q["S"]]; as = alphaSLW[q["slw_mode"], wt, q["alpha_custom"]]; c = Cos[wt["eta_phase"]];
  eos = fieldAt[q["r"], q["P_tx"], as, wt["Zslw"]]; eds = eos q["T_hull"] q["T_cage"];
  eot = fieldAt[q["r"], q["P_tx"], wt["alpha_tem"], wt["eta_abs"], c];
  etaw = gC["eta0"]/Sqrt[wt["ep"] - I wt["epp"]]; tau = Abs[2 gC["eta0"]/(gC["eta0"] + etaw)];   (* FACT Fresnel *)
  att = 10^(-(q["SE_hull_tem"] + q["SE_cage"])/20); edt = eot tau att;
  n = q["N2S"]; ep = q["eps_det"]; hf = q["hf"];
  k1 = q["eta_c"] rateHF[10^-6, q["f_d"], hf]; gs = k1 (eds/10^-6)^2; gt = rateHF[edt, q["f_d"], hf];   (* HYP eta *)
  f2 = f2E1[q["filt_fwhm"], q["filt_shape"]];
  em = vth[q["T_atom"]] q["B_stray"] 10^-4; edc = Sqrt[q["E_stray"]^2 + em^2]; gdc = rateStatic[edc] + q["G_stray"];
  gbbr = rateBBR[q["T_bbr"]];
  gads = rateHF[q["E_ads_ext"] att, fADS, hf] q["duty_ads"]; ggps = rateHF[q["E_gps_ext"] att, fGPS, hf];
  gwifi = rateHF[q["E_wifi_ext"] att, fWIFI, hf] q["duty_wifi"]; gdme = rateHF[q["E_dme_ext"] att, fDME, hf] q["duty_dme"];
  gb = gC["A2E1"] f2 + gdc + gbbr + gads + ggps + gwifi + gdme + gt;
  g0 = gC["A2E1"] + gdc + gbbr + gads + ggps + gwifi + gdme + gt;
  dep[x_] := g0/(g0 + x);   (* ASSUMPTION: pumped steady N, signal depletes *)
  dd = dep[gs]; nde = n dd ep;
  rr = <|"sig" -> nde gs, "tem_leak" -> nde gt, "twoE1" -> nde gC["A2E1"] f2, "stark" -> nde gdc, "bbr" -> nde gbbr,
    "ads" -> nde gads, "gps" -> nde ggps, "wifi" -> nde gwifi, "dme" -> nde gdme, "dark" -> q["R_dark"]|>;
  rb = rr["twoE1"] + rr["stark"] + rr["bbr"] + rr["ads"] + rr["gps"] + rr["wifi"] + rr["dme"] + rr["tem_leak"] + rr["dark"];
  t = q["T_int"]; k = q["SNR"]; snr = snrF[rr["sig"], rb, t];
  f[lg_] := With[{g = 10.^lg}, snrF[n ep g dep[g], n ep gb dep[g] + q["R_dark"], t] - k];
  lo = -40.; hi = 12.;
  greq = Which[f[hi] < 0, Infinity, f[lo] >= 0, 10.^lo, True,
    Do[m = (lo + hi)/2; If[f[m] >= 0, hi = m, lo = m], {200}]; 10.^((lo + hi)/2)];
  ereqd = If[greq === Infinity, Infinity, 10^-6 Sqrt[greq/k1]]; ereqo = ereqd/(q["T_hull"] q["T_cage"]);
  aa = ep gs dd; bb = ep gb dd; dk = q["R_dark"];
  nreq = If[aa > 0, (k^2 (aa + 2 bb) + Sqrt[k^4 (aa + 2 bb)^2 + 8 t/2 aa^2 k^2 dk])/(t aa^2), Infinity];
  cps = rr["sig"] + rb;
  <|"wt" -> wt, "alpha_slw" -> as, "E_out_slw" -> eos, "E_det_slw" -> eds, "E_out_tem" -> eot, "tau_wa" -> tau,
    "E_det_tem" -> edt, "G_sig" -> gs, "G_tem" -> gt, "G_dc" -> gdc, "G_bbr" -> gbbr, "F2" -> f2, "dep" -> dd, "R" -> rr, "Rb" -> rb,
    "snr" -> snr, "G_req" -> greq, "E_req_det" -> ereqd, "E_req_out" -> ereqo, "N_req" -> nreq, "cps" -> cps|>];

ptxRequired[r_, e_, wt_, mode_, custom_: 0.] := If[mode === "TEM",
  powerFor[e, r, wt["alpha_tem"], wt["eta_abs"], Cos[wt["eta_phase"]]],
  powerFor[e, r, alphaSLW[mode, wt, custom], wt["Zslw"]]];
(* bisection on log10 r in [-3, 5], 200 steps, mirrors Python/JS *)
maxRange[p_, e_, wt_, mode_, custom_: 0.] := Module[{lp = Log10[p], f, lo = -3., hi = 5., m},
  f[lr_] := ptxRequired[10.^lr, e, wt, mode, custom] - lp;
  If[f[lo] > 0, Return[0.]]; If[f[hi] <= 0, Return[10.^hi]];
  Do[m = (lo + hi)/2; If[f[m] <= 0, lo = m, hi = m], {200}]; 10.^((lo + hi)/2)];

End[]; EndPackage[];
