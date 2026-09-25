(* ::Package:: *)
(* ============================================================================
   FX1SNR.wl — FX-1 driven Faraday sphere SNR simulator (Wolfram twin of fx1-snr.html)
   PhysicsVersion: fx1-snr-v0.1 (Pages live; Cloud twin pending sync)
   Cloud target:  https://www.wolframcloud.com/obj/danbritton5/FX1SNR  (FX1SNR_Publish.wl)
   Author: Daniel Britton — hub JS/WL lockstep (js/fx1-snr.js)
   Constants block is GENERATED from physics-constants-fx1.json (gen_constants.mjs);
   check_constants.mjs asserts the JS and WL blocks equal the JSON.
   DO NOT invent physics. Every formula is cited in physics-constants-fx1.json -> formulas/labels.
   FACT = sourced value / textbook form.  HYP = EED/SLW (future-scalar-ab.html) or SleeveBalunSNR carry-over.
   ASSUMPTION = modelling choice (labelled).  Self-contained: only built-ins; no Get/Import needed
   (except FX1ExportGrid, which writes a JSON file when you call it).
   ============================================================================ *)

ClearAll[FX1Const, PhysicsVersion, fx1WFromDbm, fx1Drive, fx1LayerSE, fx1SeamSE, fx1MeshSE, fx1ShellSE,
  fx1ProbeFactor, fx1Floor, fx1ErHyp, fx1HertzSum, fx1LineRadPowerFull, fx1ExteriorStd, fx1PowerLimit,
  fx1StackItems, fx1Stack, fx1Reading, fx1ProbeDbm, fx1Probes, fx1Compute, fx1Defaults, fx1DistancePresets,
  fx1StackPresets, fx1ApplyStackPreset, fx1NumOrNull, FX1Grid, FX1ExportGrid, FX1OpenEMSReference, FX1SNRManipulate];

(* BEGIN FX1 CONSTANTS (generated — do not edit by hand) *)
FX1Const = <|
  "PHYSICS_VERSION" -> "fx1-snr-v0.1",
  "C0" -> 299792458.,
  "MU0" -> 1.2566370614359173`*^-6,
  "EPS0" -> 8.854187817`*^-12,
  "Z0" -> 3.7673031346177`*^2,
  "RL" -> 50.,
  "freq_presets_Hz" -> <|
    "f433" -> 433590000.,
    "f1296" -> 1296000000.,
    "f2450" -> 2450000000.
  |>,
  "freq_free_min_Hz" -> 100000000.,
  "freq_free_max_Hz" -> 3000000000.,
  "drive" -> <|
    "tinysa_gen_min_dBm" -> -115.,
    "tinysa_gen_max_dBm" -> -19.,
    "zeenko_gain_dB" -> 21.,
    "presets_dBm" -> <|
      "tinysa_alone" -> -19.,
      "tinysa_plus_zeenko" -> 2.
    |>,
    "default_dBm" -> 2.
  |>,
  "radius_presets_m" -> <|
    "bowls_11in" -> 1.4`*^-1,
    "KB2016_2p5in" -> 3.175`*^-2,
    "KB1820_0p75in" -> 9.525`*^-3
  |>,
  "radius_default_shell" -> <|
    "bowls_11in" -> "ss304",
    "KB2016_2p5in" -> "al3003",
    "KB1820_0p75in" -> "al3003"
  |>,
  "radius_default_seam" -> <|
    "bowls_11in" -> True,
    "KB2016_2p5in" -> False,
    "KB1820_0p75in" -> False
  |>,
  "materials" -> <|
    "ss304" -> <|
      "sigma" -> 1.388888888888889`*^6,
      "mu_r" -> 1.02`*^0,
      "eps_r" -> 1.,
      "tan_d" -> 0.
    |>,
    "al3003" -> <|
      "sigma" -> 2.4038461538461536`*^7,
      "mu_r" -> 1.,
      "eps_r" -> 1.,
      "tan_d" -> 0.
    |>,
    "copper" -> <|
      "sigma" -> 58000000.,
      "mu_r" -> 1.,
      "eps_r" -> 1.,
      "tan_d" -> 0.
    |>,
    "steel" -> <|
      "sigma" -> 5000000.,
      "mu_r" -> 1.,
      "eps_r" -> 1.,
      "tan_d" -> 0.
    |>,
    "seawater" -> <|
      "sigma" -> 4.,
      "mu_r" -> 1.,
      "eps_r" -> 80.,
      "tan_d" -> 0.
    |>,
    "air" -> <|
      "sigma" -> 1.`*^-14,
      "mu_r" -> 1.,
      "eps_r" -> 1.0006`*^0,
      "tan_d" -> 0.
    |>,
    "hdpe" -> <|
      "sigma" -> 0.,
      "mu_r" -> 1.,
      "eps_r" -> 2.29`*^0,
      "tan_d" -> 5.`*^-4
    |>
  |>,
  "shell" -> <|
    "t_wall_default_m" -> 5.`*^-4,
    "seam_gap_default_m" -> 5.`*^-3,
    "seam_n_default" -> 1.,
    "mesh_SE" -> <|
      "f_lo_Hz" -> 1000000000.,
      "SE_lo_dB" -> 60.,
      "f_hi_Hz" -> 1300000000.,
      "SE_hi_dB" -> 50.
    |>
  |>,
  "counterpoise_gap_default_m" -> 2.`*^-1,
  "lineN" -> 400.,
  "tents_att_dB" -> <|
    "open" -> 0.,
    "slotted" -> 25.,
    "sealed" -> 55.
  |>,
  "sub_len_m" -> <|
    "copper_wall" -> 3.175`*^-3,
    "air_inside" -> 1.00584`*^2,
    "steel_wall" -> 7.62`*^-2,
    "seawater_exit" -> 9.144`*^1,
    "ocean_air_toy" -> 1.,
    "free_space" -> 0.
  |>,
  "hdpe_t_default_m" -> 5.`*^-2,
  "ohmic" -> <|
    "alpha_toy_default" -> 5.`*^-2,
    "cage_path_default_m" -> 1.
  |>,
  "cavity_roots" -> <|
    "TM101" -> 2.744`*^0,
    "TE101" -> 4.493`*^0
  |>,
  "hyp_resonance_flag_abs_sin_kR" -> 5.`*^-2,
  "probe_anchor_MHz" -> <|
    "E5" -> {3.`*^-1, 1., 3., 6., 10., 100., 300., 500., 800., 1100., 1200., 1300., 1400., 1700., 2000., 2500., 3000.},
    "H20" -> {3.`*^-1, 5.`*^-1, 1., 6., 10., 100., 300., 500., 800., 1100., 1200., 1300., 1400., 1700., 2000.},
    "H10" -> {3.`*^-1, 5.`*^-1, 1., 6., 10., 100., 300., 500., 800., 1100., 1200., 1300., 1400., 1700., 2000., 2500., 3000.},
    "H5" -> {3.`*^-1, 5.`*^-1, 1., 6., 10., 100., 300., 500., 800., 1100., 1200., 1300., 1400., 1700., 2000., 2500., 3000.}
  |>,
  "probe_anchor_dBm" -> <|
    "E5" -> {-120., -115., -104., -97., -93., -72., -62., -57., -54., -50., -4.98`*^1, -49., -48., -46., -4.65`*^1, -4.45`*^1, -45.},
    "H20" -> {-50., -45., -39., -23., -1.85`*^1, -3., 1., -1., -4., -12., -20., -12., -10., 0., 5.},
    "H10" -> {-69., -6.35`*^1, -57., -42., -37., -18., -10., -6., -4., -4., -4., -4.5`*^0, -5., -5., -8., -10., -15.},
    "H5" -> {-90., -86., -80., -65., -60., -40., -30., -25., -21., -18., -1.85`*^1, -17., -15., -14., -13., -13., -14.}
  |>,
  "probe_ref" -> <|
    "E5" -> 1.,
    "H20" -> 1.`*^-6,
    "H10" -> 1.`*^-6,
    "H5" -> 1.`*^-6
  |>,
  "probe_kind" -> <|
    "E5" -> "E",
    "H20" -> "B",
    "H10" -> "B",
    "H5" -> "B"
  |>,
  "faq_v11" -> <|
    "E5_scale" -> 1.125`*^2,
    "S" -> <|
      "H20" -> 80.,
      "H10" -> 62.,
      "H5" -> 40.
    |>,
    "f_max_MHz" -> 6000.
  |>,
  "tinysa_floor" -> <|
    "noLNA" -> <|
      "lds_dBm" -> -102.,
      "rbw_Hz" -> 30000.
    |>,
    "LNA" -> <|
      "lds_dBm" -> -145.,
      "rbw_Hz" -> 200.
    |>,
    "rbw_options_Hz" -> {200., 1000., 3000., 10000., 30000., 100000., 300000., 600000., 850000.},
    "rbw_default_Hz" -> 10000.,
    "best_below_dBm" -> -25.,
    "p1dB_dBm" -> -1.,
    "abs_max_dBm" -> 6.
  |>,
  "distances" -> <|
    "bench_cm" -> {5., 10., 20., 50., 100.},
    "home_garage_m" -> 10.,
    "home_outdoor_m" -> 50.
  |>,
  "interior_grid_rR" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.`*^-1}
|>;
(* END FX1 CONSTANTS *)

PhysicsVersion = FX1Const["PHYSICS_VERSION"];

fx1NumOrNull[x_] := If[NumericQ[x] && Abs[x] < Infinity, N[x], Null];

(* ---- drive (page: +2 dBm -> ~0.4 V; -19 dBm -> 35 mV) ---- *)
fx1WFromDbm[d_] := 10.^((d - 30.)/10.);
fx1Drive[pdbm_] := Module[{p = fx1WFromDbm[pdbm], rl = FX1Const["RL"]},
  <|"P" -> p, "V0" -> Sqrt[2. rl p], "Ipk" -> Sqrt[2. p/rl]|>];

(* ---- Schelkunoff slab SE (plane wave, normal incidence): A + R + B ---- *)
fx1LayerSE[mat_Association, t_, f_] := If[!(t > 0),
  <|"A" -> 0., "R" -> 0., "B" -> 0., "SE" -> 0.|>,
  Module[{w = 2. Pi f, mu, epsp, sigt, g, eta, eta0 = FX1Const["Z0"], s, a, r, gg, e2, b},
    mu = FX1Const["MU0"] mat["mu_r"];
    epsp = FX1Const["EPS0"] mat["eps_r"];
    sigt = mat["sigma"] + w FX1Const["EPS0"] mat["eps_r"] mat["tan_d"];
    g = Sqrt[-w^2 mu epsp + I w mu sigt];              (* principal branch, as JS csqrt *)
    eta = I w mu/g;
    s = eta0 + eta;
    a = (20./Log[10.]) Re[g] t;
    r = 20. Log10[Abs[s^2]/(4. Abs[eta0 eta])];
    gg = (eta0 - eta)/s;
    e2 = If[2. Re[g] t > 700., 0., Exp[-2. g t]];       (* JS Math.exp underflows to 0 *)
    b = 20. Log10[Abs[1. - gg^2 e2]];
    <|"A" -> a, "R" -> r, "B" -> b, "SE" -> a + r + b|>]];

(* ---- seam / aperture (Ott 2009 section 6.6) ---- *)
fx1SeamSE[f_, l_, n_] := Module[{lam = FX1Const["C0"]/f},
  If[!(l > 0) || l >= lam/2., 0., Max[0., 20. Log10[lam/(2. l)] - 10. Log10[Max[1., n]]]]];

(* ---- RadioScreen mesh sphere: page catalog figures ---- *)
fx1MeshSE[f_] := Module[{m = FX1Const["shell"]["mesh_SE"], t},
  Which[
    f <= m["f_lo_Hz"], <|"SE" -> m["SE_lo_dB"], "label" -> "FACT (page catalog ~60 dB below 1 GHz)"|>,
    f < m["f_hi_Hz"], t = (f - m["f_lo_Hz"])/(m["f_hi_Hz"] - m["f_lo_Hz"]);
      <|"SE" -> m["SE_lo_dB"] + t (m["SE_hi_dB"] - m["SE_lo_dB"]), "label" -> "INTERPOLATED between page catalog points"|>,
    f == m["f_hi_Hz"], <|"SE" -> m["SE_hi_dB"], "label" -> "FACT (page catalog ~50 dB at 1.3 GHz)"|>,
    True, <|"SE" -> m["SE_hi_dB"], "label" -> "ASSUMPTION (not published above 1.3 GHz; held at 50 dB)"|>]];

fx1ShellSE[p_Association, f_] := Module[{m, wall, seam, sum, se},
  If[p["shellType"] === "mesh",
    m = fx1MeshSE[f]; <|"wall" -> Null, "seam" -> Null, "SE" -> m["SE"], "label" -> m["label"]|>,
    wall = fx1LayerSE[FX1Const["materials"][p["shellMat"]], p["tWall"], f];
    seam = If[TrueQ[p["seamOn"]], fx1SeamSE[f, p["seamL"], p["seamN"]], Infinity];
    sum = 10.^(-wall["SE"]/10.) + If[TrueQ[p["seamOn"]], 10.^(-seam/10.), 0.];
    se = If[sum > 0., -10. Log10[sum], Infinity];
    <|"wall" -> wall, "seam" -> seam, "SE" -> se,
      "label" -> If[TrueQ[p["seamOn"]], "wall \[CirclePlus] seam (power sum)", "wall only (no seam aperture)"]|>]];

(* ---- Tekbox probe factor K(f): dBm at ref field (1 V/m or 1 uT) ---- *)
fx1ProbeFactor[probe_String, f_, src_String] := Module[{ff = f/1.*^6, xs, ys, n, pos, i, t},
  If[src === "faq",
    Which[
      ff > FX1Const["faq_v11"]["f_max_MHz"], <|"K" -> Null, "label" -> "NOT_PUBLISHED"|>,
      probe === "E5", <|"K" -> -FX1Const["faq_v11"]["E5_scale"] + 20. Log10[ff], "label" -> "FAQ_V1.1_FORMULA"|>,
      True, <|"K" -> 20. Log10[FX1Const["probe_ref"][probe]] + FX1Const["faq_v11"]["S"][probe] + 20. Log10[ff],
        "label" -> "FAQ_V1.1_FORMULA"|>],
    xs = FX1Const["probe_anchor_MHz"][probe]; ys = FX1Const["probe_anchor_dBm"][probe]; n = Length[xs];
    pos = FirstPosition[xs, x_ /; Abs[ff - x] <= 1.*^-9 x, None, {1}];
    Which[
      ff < xs[[1]] (1. - 1.*^-12) || ff > xs[[n]] (1. + 1.*^-12), <|"K" -> Null, "label" -> "NOT_PUBLISHED"|>,
      pos =!= None, <|"K" -> ys[[First[pos]]], "label" -> "DATA"|>,
      True,
        i = LengthWhile[xs, # < ff &];
        t = (Log10[ff] - Log10[xs[[i]]])/(Log10[xs[[i + 1]]] - Log10[xs[[i]]]);
        <|"K" -> ys[[i]] + t (ys[[i + 1]] - ys[[i]]), "label" -> "INTERPOLATED"|>]]];

fx1Floor[rbw_, lna_] := Module[{r = If[TrueQ[lna], FX1Const["tinysa_floor"]["LNA"], FX1Const["tinysa_floor"]["noLNA"]]},
  r["lds_dBm"] + 10. Log10[rbw/r["rbw_Hz"]]];

(* ---- HYP interior (future-scalar-ab.html #eed, exactly) ---- *)
fx1ErHyp[v0_, rr_, k_, r_] := Module[{kr = k r, skr = Sin[k rr]},
  Which[!(r > 0), 0., kr < 1.*^-4, v0 rr k^3 r/(3. skr), True, v0 rr (Sin[kr] - kr Cos[kr])/(r^2 skr)]];

(* ---- Hertzian element sum (Balanis Eq. 4-8/4-10), observation at (rho, z) ---- *)
fx1HertzSum[elems_List, rho_, z_, k_] := Module[
  {erho = 0. + 0. I, ez = 0. + 0. I, h = 0. + 0. I, zi, il, dz, rr, ct, st, kr, ph, fr, fth, er, eth, hp, z0 = FX1Const["Z0"]},
  Do[
    zi = el[[1]]; il = el[[2]];
    dz = z - zi; rr = Sqrt[rho^2 + dz^2]; ct = dz/rr; st = rho/rr; kr = k rr;
    ph = Exp[-I kr];
    fr = 1. - I/kr;
    fth = (1. - 1./kr^2) - I/kr;
    er = fr ph z0 il ct/(2. Pi rr^2);
    eth = I fth ph z0 k il st/(4. Pi rr);
    hp = I fr ph k il st/(4. Pi rr);
    erho += er st + eth ct;
    ez += er ct - eth st;
    h += hp,
    {el, elems}];
  <|"E" -> Sqrt[Abs[erho]^2 + Abs[ez]^2], "B" -> FX1Const["MU0"] Abs[h]|>];

(* uniform-current line of length L (full space): far-field line-source integral; midpoint rule, 5*lineN points *)
fx1LineRadPowerFull[i0_, len_, k_] := Module[{m = 5 FX1Const["lineN"], acc},
  acc = Total[Table[
      Module[{th = (j + 0.5) Pi/m, u, sc},
        u = k len Cos[th]/2.;
        sc = If[Abs[u] < 1.*^-12, 1., Sin[u]/u];
        Sin[th]^3 sc^2],
      {j, 0, m - 1}]] Pi/m;
  FX1Const["Z0"] k^2 i0^2 len^2/(32. Pi^2) 2. Pi acc];

fx1ExteriorStd[v0_, rr_, f_, hc_, rc_, cp_] := Module[
  {w = 2. Pi f, k, q, a, nn = FX1Const["lineN"], dz, i0, elems, bm, cm, len, pb, pc, il},
  k = w/FX1Const["C0"];
  q = 4. Pi FX1Const["EPS0"] rr v0;
  a = <|"E" -> v0 rr/rc^2, "B" -> 0.|>;
  If[!TrueQ[cp],
    <|"Q" -> q, "A" -> a, "B" -> Null, "C" -> Null, "I0" -> w q|>,
    dz = 2. hc/nn; i0 = w q;
    elems = Table[{-hc + (j + 0.5) dz, i0 dz}, {j, 0, nn - 1}];
    bm = fx1HertzSum[elems, rc, hc, k];
    cm = fx1HertzSum[{{0., w q 2. hc}}, rc, hc, k];
    len = 2. hc;
    pb = 0.5 fx1LineRadPowerFull[i0, len, k];
    il = w q len;
    pc = 0.5 FX1Const["Z0"] Pi/3. (il k/(2. Pi))^2;
    <|"Q" -> q, "A" -> a, "B" -> Append[bm, "Prad" -> pb], "C" -> Append[cm, "Prad" -> pc], "I0" -> i0|>]];

fx1PowerLimit[fld_, pdrive_, on_] := If[fld === Null, Null,
  Module[{s = If[TrueQ[on] && fld["Prad"] > pdrive, Sqrt[pdrive/fld["Prad"]], 1.]},
    <|"E" -> fld["E"] s, "B" -> fld["B"] s, "Prad" -> fld["Prad"], "scale" -> s,
      "E_unscaled" -> fld["E"], "B_unscaled" -> fld["B"]|>]];

(* ---- media stack (SleeveBalunSNR carry-over + FX-1 items); order identical to JS STACK_ITEMS ---- *)
fx1StackItems = {
  {"med_air", Null, 0, "air (garage / cage interior) L=0"},
  {"med_copper", "copper", "copper_wall", "copper wall 1/8 in"},
  {"med_air_inside", "air", "air_inside", "air inside sub 330 ft"},
  {"med_steel", "steel", "steel_wall", "steel hull 3 in"},
  {"med_seawater", "seawater", "seawater_exit", "seawater exit 300 ft"},
  {"med_ocean_air", Null, "ocean_air_toy", "ocean-air interface (TOY L=1 m)"},
  {"med_free_space", Null, "free_space", "free-space"},
  {"med_hdpe", "hdpe", "HDPE", "HDPE block"}};

fx1Stack[p_Association, f_] := Module[{s = p["stack"], stdDb = 0., len = 0., parts = {}, lenI, se, att, mp, alphaL = 0.},
  Do[
    If[TrueQ[Lookup[s, it[[1]], False]],
      lenI = Which[it[[3]] === "HDPE", p["hdpeT"], it[[3]] === 0, 0., True, FX1Const["sub_len_m"][it[[3]]]];
      len += lenI;
      If[it[[2]] =!= Null,
        se = fx1LayerSE[FX1Const["materials"][it[[2]]], lenI, f];
        stdDb += se["SE"];
        AppendTo[parts, it[[4]] <> ": std " <> ToString[NumberForm[se["SE"], {Infinity, 2}]] <> " dB"],
        AppendTo[parts, it[[4]] <> ": std 0 dB (none defined)"]]],
    {it, fx1StackItems}];
  att = FX1Const["tents_att_dB"][Lookup[p, "tents", "open"]];
  stdDb += 2. att;
  mp = 10.^(-2. att/10.);
  If[!TrueQ[p["errata"]],
    alphaL = p["alphaToy"] len;
    If[TrueQ[p["cageOhm"]], alphaL += p["alphaToy"] 2. p["cagePath"]];
    If[p["alphaExtra"] > 0 && p["Lextra"] > 0, alphaL += p["alphaExtra"] p["Lextra"]]];
  <|"stdDb" -> stdDb, "att" -> att, "mP" -> mp, "L" -> len, "alphaL" -> alphaL, "surv" -> Exp[-alphaL], "parts" -> parts|>];

fx1Reading[dbm_, floor_] := Module[{rd, flag = ""},
  If[dbm === Null || !(NumericQ[dbm] && Abs[dbm] < Infinity),
    <|"dBm" -> Null, "snr" -> Null, "reading" -> floor, "flag" -> "no signal \[RightArrow] floor"|>,
    rd = 10. Log10[10.^(dbm/10.) + 10.^(floor/10.)];
    flag = Which[
      dbm > FX1Const["tinysa_floor"]["abs_max_dBm"], "ABOVE ABS MAX +6 dBm",
      dbm > FX1Const["tinysa_floor"]["p1dB_dBm"], "above P1dB (-1 dBm)",
      dbm > FX1Const["tinysa_floor"]["best_below_dBm"], "above -25 dBm best-measurement level",
      True, ""];
    <|"dBm" -> dbm, "snr" -> dbm - floor, "reading" -> rd, "flag" -> flag|>]];

fx1ProbeDbm[pf_Association, field_, ref_] := If[pf["K"] === Null || !(field > 0), Null, pf["K"] + 20. Log10[field/ref]];

fx1Probes = {"E5", "H10", "H20", "H5"};

fx1Compute[p_Association] := Module[
  {f = p["f"], lam, k, rr = p["R"], dr, v0, sh, ri, eref, eleak, bleak, ers, ehyp, hc, rc, ex0, ex, st, ipk, prad, shyp, epar,
   floor, probes, skr},
  lam = FX1Const["C0"]/f; k = 2. Pi f/FX1Const["C0"];
  dr = fx1Drive[p["P_dBm"]]; v0 = dr["V0"];
  sh = fx1ShellSE[p, f];
  ri = p["rR"] rr;
  eref = v0/rr;
  eleak = If[NumericQ[sh["SE"]] && Abs[sh["SE"]] < Infinity, eref 10.^(-sh["SE"]/20.), 0.];
  bleak = eleak/FX1Const["C0"];
  ers = fx1ErHyp[v0, rr, k, ri];
  ehyp = If[p["orient"] === "tangential", 0., Abs[ers]];
  hc = p["gap"] + rr; rc = rr + p["d"];
  ex0 = fx1ExteriorStd[v0, rr, f, hc, rc, p["counterpoise"]];
  ex = <|"Q" -> ex0["Q"], "I0" -> ex0["I0"], "A" -> ex0["A"],
    "B" -> fx1PowerLimit[ex0["B"], dr["P"], p["powerLimit"]], "C" -> fx1PowerLimit[ex0["C"], dr["P"], p["powerLimit"]]|>;
  st = fx1Stack[p, f];
  ipk = dr["Ipk"];
  prad = ipk^2 FX1Const["Z0"]/(4. Pi);
  shyp = prad/(4. Pi rc^2) st["surv"];
  epar = Sqrt[shyp FX1Const["Z0"]];
  floor = fx1Floor[p["rbw"], p["lna"]];
  probes = Association[Table[
    Module[{pf = fx1ProbeFactor[pr, f, p["factorSrc"]], ref = FX1Const["probe_ref"][pr], isE = FX1Const["probe_kind"][pr] === "E",
        intStd, intHyp, extStd, extHypRaw, extHyp, sel},
      intStd = fx1ProbeDbm[pf, If[isE, eleak, bleak], ref];
      intHyp = If[isE, fx1ProbeDbm[pf, ehyp, ref], Null];
      extStd = Association[Table[
        Module[{fld = ex[m], v},
          v = If[fld === Null, Null, fx1ProbeDbm[pf, If[isE, fld["E"], fld["B"]], ref]];
          m -> If[v === Null, Null, v - st["stdDb"]]],
        {m, {"A", "B", "C"}}]];
      extHypRaw = If[isE, fx1ProbeDbm[pf, epar, ref], Null];
      extHyp = If[extHypRaw === Null, Null, extHypRaw + 10. Log10[st["mP"]]];
      sel = If[ex[p["extModel"]] =!= Null, extStd[p["extModel"]], extStd["A"]];
      pr -> <|"K" -> pf["K"], "label" -> pf["label"],
        "int_std" -> fx1Reading[intStd, floor], "int_hyp" -> fx1Reading[intHyp, floor],
        "ext_std" -> fx1Reading[sel, floor],
        "ext_std_A" -> fx1Reading[extStd["A"], floor], "ext_std_B" -> fx1Reading[extStd["B"], floor],
        "ext_std_C" -> fx1Reading[extStd["C"], floor], "ext_hyp" -> fx1Reading[extHyp, floor]|>],
    {pr, fx1Probes}]];
  skr = Sin[k rr];
  <|"version" -> PhysicsVersion, "f" -> f, "lam" -> lam, "k" -> k, "kR" -> k rr, "P_W" -> dr["P"], "V0" -> v0, "Ipk" -> ipk, "R" -> rr,
    "flags" -> <|"f_TM101_Hz" -> FX1Const["cavity_roots"]["TM101"] FX1Const["C0"]/(2. Pi rr),
      "f_TE101_Hz" -> FX1Const["cavity_roots"]["TE101"] FX1Const["C0"]/(2. Pi rr),
      "f_EED_Hz" -> FX1Const["C0"]/(2. rr),
      "hypResonance" -> Abs[skr] < FX1Const["hyp_resonance_flag_abs_sin_kR"],
      "probeFitsInside" -> rr >= 0.05, "dipoleLen_over_lambda" -> 2. hc/lam, "kr_ext" -> k rc|>,
    "shell" -> sh,
    "interior" -> <|"rR" -> p["rR"], "r" -> ri, "E_ref" -> eref, "E_std_ideal" -> 0., "B_std_ideal" -> 0.,
      "E_leak" -> eleak, "B_leak" -> bleak, "E_hyp_signed" -> ers, "E_hyp" -> ehyp, "B_hyp" -> 0.,
      "ratio_hyp_dB" -> If[ehyp > 0, 20. Log10[ehyp/eref], Null], "ratio_leak_dB" -> If[eleak > 0, 20. Log10[eleak/eref], Null]|>,
    "exterior" -> <|"d" -> p["d"], "rc" -> rc, "hc" -> hc, "Q" -> ex["Q"], "I0" -> ex["I0"], "A" -> ex["A"], "B" -> ex["B"], "C" -> ex["C"],
      "model" -> p["extModel"], "E_hyp" -> epar, "Prad" -> prad, "S_hyp" -> shyp, "P_drive" -> dr["P"]|>,
    "stack" -> st, "floor_dBm" -> floor, "probes" -> probes|>];

fx1Defaults[] := <|
  "f" -> FX1Const["freq_presets_Hz"]["f433"], "P_dBm" -> FX1Const["drive"]["default_dBm"], "R" -> FX1Const["radius_presets_m"]["bowls_11in"],
  "shellMat" -> "ss304", "shellType" -> "solid", "tWall" -> FX1Const["shell"]["t_wall_default_m"],
  "seamOn" -> True, "seamL" -> FX1Const["shell"]["seam_gap_default_m"], "seamN" -> FX1Const["shell"]["seam_n_default"],
  "counterpoise" -> True, "gap" -> FX1Const["counterpoise_gap_default_m"], "powerLimit" -> True,
  "rR" -> 0.7, "orient" -> "radial", "d" -> 0.05, "extModel" -> "B", "factorSrc" -> "manual",
  "rbw" -> FX1Const["tinysa_floor"]["rbw_default_Hz"], "lna" -> False,
  "tents" -> "open", "stack" -> <|"med_air" -> True|>, "hdpeT" -> FX1Const["hdpe_t_default_m"],
  "errata" -> True, "alphaToy" -> FX1Const["ohmic"]["alpha_toy_default"], "cageOhm" -> False, "cagePath" -> FX1Const["ohmic"]["cage_path_default_m"],
  "alphaExtra" -> 0., "Lextra" -> 0.|>;

fx1DistancePresets[f_] := Join[
  Table[<|"id" -> "bench_" <> ToString[Round[cm]] <> "cm", "label" -> ToString[Round[cm]] <> " cm from wall", "d" -> cm/100.|>,
    {cm, FX1Const["distances"]["bench_cm"]}],
  {<|"id" -> "near_far_lambda", "label" -> "\[Lambda] (near-far, HYP/educational)", "d" -> FX1Const["C0"]/f|>,
   <|"id" -> "home_garage", "label" -> "home garage 10 m", "d" -> FX1Const["distances"]["home_garage_m"]|>,
   <|"id" -> "home_outdoor", "label" -> "home outdoor 50 m", "d" -> FX1Const["distances"]["home_outdoor_m"]|>}];

(* same keys/contents and order as JS STACK_PRESETS *)
fx1StackPresets = <|
  "open_air" -> <|"label" -> "open air (no stack)", "tents" -> "open", "stack" -> <|"med_air" -> True|>, "errata" -> True, "cageOhm" -> False|>,
  "tents_slotted" -> <|"label" -> "two tents slotted (25 dB/tent)", "tents" -> "slotted", "stack" -> <|"med_air" -> True|>, "errata" -> True, "cageOhm" -> False|>,
  "tents_sealed" -> <|"label" -> "two tents sealed (55 dB/tent)", "tents" -> "sealed", "stack" -> <|"med_air" -> True|>, "errata" -> True, "cageOhm" -> False|>,
  "hdpe_block" -> <|"label" -> "HDPE block in path", "tents" -> "open", "stack" -> <|"med_air" -> True, "med_hdpe" -> True|>, "errata" -> True, "cageOhm" -> False|>,
  "copper_wall" -> <|"label" -> "copper wall 1/8 in", "tents" -> "open", "stack" -> <|"med_copper" -> True|>, "errata" -> True, "cageOhm" -> False|>,
  "steel_hull" -> <|"label" -> "steel hull 3 in", "tents" -> "open", "stack" -> <|"med_steel" -> True|>, "errata" -> True, "cageOhm" -> False|>,
  "submarine" -> <|"label" -> "submarine stack (copper+air 330 ft+steel+seawater)", "tents" -> "open",
    "stack" -> <|"med_copper" -> True, "med_air_inside" -> True, "med_steel" -> True, "med_seawater" -> True|>, "errata" -> True, "cageOhm" -> False|>,
  "expC_ohmic_sealed" -> <|"label" -> "Exp-C Ohmic HYP toy (alpha=0.05) + sealed tents + cage path", "tents" -> "sealed",
    "stack" -> <|"med_air" -> True|>, "errata" -> False, "cageOhm" -> True|>|>;

fx1ApplyStackPreset[p_Association, key_String] := Module[{s = fx1StackPresets[key]},
  Join[p, <|"tents" -> s["tents"], "stack" -> s["stack"], "errata" -> s["errata"], "cageOhm" -> s["cageOhm"]|>]];

(* ---- fixed test grid (identical to dump_js_outputs.mjs) ---- *)
FX1Grid[] := Module[{recs = {}, radiusKeys = {"bowls_11in", "KB2016_2p5in", "KB1820_0p75in"},
    driveKeys = {"tinysa_plus_zeenko", "tinysa_alone"}, srcs = {"manual", "faq"}, base, p, s, pr},
  Do[
    base = Join[fx1Defaults[], <|"f" -> FX1Const["freq_presets_Hz"]["f433"], "R" -> FX1Const["radius_presets_m"][rk],
      "shellMat" -> FX1Const["radius_default_shell"][rk], "seamOn" -> FX1Const["radius_default_seam"][rk],
      "P_dBm" -> FX1Const["drive"]["presets_dBm"][dk], "factorSrc" -> src|>];
    Do[
      s = fx1Compute[Join[base, <|"rR" -> x|>]];
      AppendTo[recs, <|"kind" -> "interior", "radius" -> rk, "drive" -> dk, "factorSrc" -> src, "rR" -> x,
        "V0" -> s["V0"], "E_ref" -> s["interior"]["E_ref"], "SE_shell" -> fx1NumOrNull[s["shell"]["SE"]],
        "E_leak" -> s["interior"]["E_leak"], "B_leak" -> s["interior"]["B_leak"], "E_hyp" -> s["interior"]["E_hyp"],
        "floor_dBm" -> s["floor_dBm"],
        "probes" -> Association[Table[pr -> <|"K" -> s["probes"][pr]["K"], "label" -> s["probes"][pr]["label"],
            "std" -> s["probes"][pr]["int_std"]["dBm"], "hyp" -> s["probes"][pr]["int_hyp"]["dBm"],
            "std_snr" -> s["probes"][pr]["int_std"]["snr"], "hyp_snr" -> s["probes"][pr]["int_hyp"]["snr"]|>, {pr, fx1Probes}]]|>],
      {x, FX1Const["interior_grid_rR"]}];
    Do[
      Do[
        p = Join[fx1ApplyStackPreset[base, sk], <|"d" -> dp["d"]|>];
        s = fx1Compute[p];
        AppendTo[recs, <|"kind" -> "exterior", "radius" -> rk, "drive" -> dk, "factorSrc" -> src, "stack" -> sk, "dist" -> dp["id"],
          "d_m" -> dp["d"], "E_A" -> s["exterior"]["A"]["E"], "E_B" -> s["exterior"]["B"]["E"], "B_B" -> s["exterior"]["B"]["B"],
          "E_C" -> s["exterior"]["C"]["E"], "B_C" -> s["exterior"]["C"]["B"], "E_hyp" -> s["exterior"]["E_hyp"],
          "stack_std_dB" -> fx1NumOrNull[s["stack"]["stdDb"]], "alphaL" -> s["stack"]["alphaL"], "mP" -> s["stack"]["mP"],
          "floor_dBm" -> s["floor_dBm"],
          "probes" -> Association[Table[pr -> <|"K" -> s["probes"][pr]["K"], "label" -> s["probes"][pr]["label"],
              "std_A" -> s["probes"][pr]["ext_std_A"]["dBm"], "std_B" -> s["probes"][pr]["ext_std_B"]["dBm"],
              "std_C" -> s["probes"][pr]["ext_std_C"]["dBm"], "hyp" -> s["probes"][pr]["ext_hyp"]["dBm"]|>, {pr, fx1Probes}]]|>],
        {dp, fx1DistancePresets[FX1Const["freq_presets_Hz"]["f433"]]}],
      {sk, Keys[fx1StackPresets]}],
    {rk, radiusKeys}, {dk, driveKeys}, {src, srcs}];
  <|"version" -> PhysicsVersion, "f_Hz" -> FX1Const["freq_presets_Hz"]["f433"], "rbw_Hz" -> FX1Const["tinysa_floor"]["rbw_default_Hz"],
    "lna" -> False, "records" -> recs|>];

FX1ExportGrid[path_String] := Export[path, FX1Grid[], "RawJSON"];

(* ---- openEMS reference (FDTD of the real sphere + counterpoise; separate worker). Data, not engine physics:
   written by merge_openems.mjs from /workspace/sim-lab/fx1/openems/results.json. Missing[...] until available. ---- *)
(* BEGIN FX1 OPENEMS (generated by merge_openems.mjs — do not edit by hand) *)
FX1OpenEMSReference = <|
  "summary" -> "FDTD (openEMS) of PEC sphere R=0.14 m + 0.35 m square counterpoise, 10 mm feed gap; Zin=15.2+j25.1 ohm, S11=-4.24 dB; normalisation per_2dBm_available_50ohm",
  "normalisation" -> "per_2dBm_available_50ohm",
  "source" -> "/workspace/sim-lab/fx1/openems/results.json",
  "source_mtime" -> "2026-09-25T11:02:19.331Z",
  "gap_openEMS_m" -> 1.`*^-2,
  "exterior_equatorial" -> {<|
    "id" -> "bench_5cm",
    "d_m" -> 5.`*^-2,
    "E_Vpm" -> 1.61487`*^0,
    "B_T" -> 6.04132`*^-9,
    "probes_dBm" -> <|
      "E5" -> -5.423`*^1,
      "H10" -> -5.149`*^1,
      "H20" -> -4.482`*^1,
      "H5" -> -7.077`*^1
    |>
  |>, <|
    "id" -> "bench_10cm",
    "d_m" -> 1.`*^-1,
    "E_Vpm" -> 1.22128`*^0,
    "B_T" -> 4.60932`*^-9,
    "probes_dBm" -> <|
      "E5" -> -5.666`*^1,
      "H10" -> -5.384`*^1,
      "H20" -> -4.717`*^1,
      "H5" -> -7.312`*^1
    |>
  |>, <|
    "id" -> "bench_20cm",
    "d_m" -> 2.`*^-1,
    "E_Vpm" -> 8.42175`*^-1,
    "B_T" -> 3.01221`*^-9,
    "probes_dBm" -> <|
      "E5" -> -5.989`*^1,
      "H10" -> -5.754`*^1,
      "H20" -> -5.086`*^1,
      "H5" -> -7.682`*^1
    |>
  |>, <|
    "id" -> "bench_50cm",
    "d_m" -> 5.`*^-1,
    "E_Vpm" -> 4.22622`*^-1,
    "B_T" -> 1.42714`*^-9,
    "probes_dBm" -> <|
      "E5" -> -6.588`*^1,
      "H10" -> -6.403`*^1,
      "H20" -> -5.735`*^1,
      "H5" -> -8.331`*^1
    |>
  |>, <|
    "id" -> "bench_100cm",
    "d_m" -> 1.,
    "E_Vpm" -> 2.29927`*^-1,
    "B_T" -> 7.74038`*^-10,
    "probes_dBm" -> <|
      "E5" -> -7.116`*^1,
      "H10" -> -6.934`*^1,
      "H20" -> -6.267`*^1,
      "H5" -> -8.862`*^1
    |>
  |>},
  "far_field" -> {<|
    "id" -> "r_3m",
    "r_m" -> 3.,
    "E_Vpm" -> 1.00546`*^-1,
    "B_T" -> 3.35384`*^-10
  |>, <|
    "id" -> "r_10m",
    "r_m" -> 10.,
    "E_Vpm" -> 3.01637`*^-2,
    "B_T" -> 1.00615`*^-10
  |>},
  "interior_equatorial" -> <|
    "closed_pec_r10mm" -> <|
      "r_over_R" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 8.229799015573509`*^-1},
      "E_Vpm" -> {0., 0., 0., 0., 0.},
      "B_T" -> {0., 0., 0., 0., 0.}
    |>,
    "closed_pec_r5mm" -> <|
      "r_over_R" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
      "E_Vpm" -> {0., 0., 0., 0., 0.},
      "B_T" -> {0., 0., 0., 0., 0.}
    |>,
    "closed_pec_r5mm_compact" -> <|
      "r_over_R" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
      "E_Vpm" -> {0., 0., 0., 0., 0.},
      "B_T" -> {0., 0., 0., 0., 0.}
    |>,
    "ring_slot_1mm" -> <|
      "r_over_R" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
      "E_Vpm" -> {1.45153`*^-1, 1.50014`*^-1, 1.72573`*^-1, 2.44743`*^-1, 7.5708`*^0},
      "B_T" -> {1.46011`*^-15, 7.79243`*^-11, 1.61`*^-10, 2.42005`*^-10, 4.7088`*^-10}
    |>,
    "arc_slot_1mm_x30mm" -> <|
      "r_over_R" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
      "E_Vpm" -> {1.71351`*^-4, 3.25553`*^-4, 7.68832`*^-4, 2.43479`*^-3, 2.6706`*^-1},
      "B_T" -> {7.68189`*^-13, 1.47176`*^-12, 4.41985`*^-12, 2.03961`*^-11, 2.67457`*^-10}
    |>
  |>
|>;
(* END FX1 OPENEMS *)

(* ---- Manipulate (Cloud) ---- *)
FX1SNRManipulate = Manipulate[
  Module[{f, rr, p, s, pr, dps, intRows, extRows, fmt, cellF, xsI, hyI, sdI, xsE, sdE, hyE},
    f = If[fsel === "free", ffree 1.*^6, fsel];
    rr = If[rsel === "free", rfree/1000., FX1Const["radius_presets_m"][rsel]];
    p = Join[fx1ApplyStackPreset[fx1Defaults[], spreset], <|
      "f" -> f, "P_dBm" -> pdbm, "R" -> rr, "shellMat" -> shellMat, "shellType" -> shellType, "tWall" -> tw/1000.,
      "seamOn" -> seamOn, "seamL" -> seamL/1000., "seamN" -> seamN, "counterpoise" -> cp, "gap" -> gapcm/100., "powerLimit" -> plim,
      "rR" -> rR, "orient" -> orient, "d" -> If[dsel === "free", dfree/100., SelectFirst[fx1DistancePresets[f], #["id"] === dsel &]["d"]],
      "extModel" -> extModel, "factorSrc" -> fsrc, "rbw" -> rbw, "lna" -> lna, "hdpeT" -> hdpecm/100., "alphaToy" -> atoy,
      "cagePath" -> cpath|>];
    If[errataOverride =!= "preset", p = Join[p, <|"errata" -> (errataOverride === "on")|>]];
    s = fx1Compute[p];
    fmt[x_] := If[x === Null, "floor", ToString[NumberForm[x, {Infinity, 1}]]];
    cellF[rd_] := If[rd["dBm"] === Null, Style["floor " <> ToString[NumberForm[rd["reading"], {Infinity, 1}]], Gray],
      Row[{NumberForm[rd["dBm"], {Infinity, 1}], " (", NumberForm[rd["snr"], {Infinity, 1}], " dB)"}]];
    intRows = Table[With[{sx = fx1Compute[Join[p, <|"rR" -> x|>]]},
        Join[{x}, Flatten[Table[{cellF[sx["probes"][q]["int_std"]], cellF[sx["probes"][q]["int_hyp"]]}, {q, fx1Probes}]]]],
      {x, FX1Const["interior_grid_rR"]}];
    dps = fx1DistancePresets[f];
    extRows = Table[With[{sx = fx1Compute[Join[p, <|"d" -> dp["d"]|>]]},
        Join[{dp["label"]}, Flatten[Table[{cellF[sx["probes"][q]["ext_std"]], cellF[sx["probes"][q]["ext_hyp"]]}, {q, fx1Probes}]]]],
      {dp, dps}];
    xsI = Range[0., 0.99, 0.01];
    (* interior curves: HYP E_r is the closed-form page formula (no need to rerun the whole engine); STD leak is uniform in r (ASSUMPTION) *)
    hyI = Table[With[{e = Abs[fx1ErHyp[s["V0"], rr, s["k"], x rr]]}, {x, If[e > 0, 20. Log10[e], Missing[]]}], {x, xsI}];
    sdI = With[{e = s["interior"]["E_leak"]}, If[e > 0, {{0., 20. Log10[e]}, {0.99, 20. Log10[e]}}, {}]];
    xsE = 10.^Range[Log10[0.02], Log10[100.], (Log10[100.] - Log10[0.02])/30.];
    sdE = Table[{Log10[d], Replace[fx1Compute[Join[p, <|"d" -> d|>]]["probes"][probe]["ext_std"]["dBm"], Null -> Missing[]]}, {d, xsE}];
    hyE = Table[{Log10[d], Replace[fx1Compute[Join[p, <|"d" -> d|>]]["probes"][probe]["ext_hyp"]["dBm"], Null -> Missing[]]}, {d, xsE}];
    Column[{
      Style["FX-1 SNR \[LongDash] Physics " <> PhysicsVersion <> " \[CenterDot] FACT vs HYP \[CenterDot] not a measurement", Bold, 13],
      Row[{"f = ", NumberForm[f/1.*^6, {Infinity, 2}], " MHz \[CenterDot] kR = ", NumberForm[s["kR"], 4], " \[CenterDot] V0 = ", ScientificForm[s["V0"], 3],
        " V pk (50 \[CapitalOmega] identity, ASSUMPTION) \[CenterDot] floor = ", NumberForm[s["floor_dBm"], {Infinity, 1}], " dBm"}],
      Row[{"Cavity TM101 = ", NumberForm[s["flags"]["f_TM101_Hz"]/1.*^9, 4], " GHz (FACT) \[CenterDot] EED kR=\[Pi] at ",
        NumberForm[s["flags"]["f_EED_Hz"]/1.*^9, 4], " GHz (HYP)", If[s["flags"]["hypResonance"], Style["  \[FilledSmallSquare] near HYP resonance", Red], ""],
        If[s["flags"]["probeFitsInside"], "", Style["  \[FilledSmallSquare] R < 5 cm: probe cannot fit inside", Red]]}],
      Row[{"Shell SE = ", NumberForm[s["shell"]["SE"], {Infinity, 1}], " dB (", s["shell"]["label"], ") \[CenterDot] interior: STD leak E = ",
        ScientificForm[s["interior"]["E_leak"], 3], " V/m, HYP E_r = ", ScientificForm[s["interior"]["E_hyp"], 3], " V/m, B_HYP = 0"}],
      Row[{"Exterior d = ", NumberForm[p["d"] 100., {Infinity, 1}], " cm: A |E| = ", ScientificForm[s["exterior"]["A"]["E"], 3],
        If[s["exterior"]["B"] =!= Null, Row[{" \[CenterDot] B |E| = ", ScientificForm[s["exterior"]["B"]["E"], 3], " |B| = ", ScientificForm[s["exterior"]["B"]["B"], 3], " T (scale ", NumberForm[s["exterior"]["B"]["scale"], 3], ")"}], ""],
        " \[CenterDot] HYP E\[DoubleVerticalBar] = ", ScientificForm[s["exterior"]["E_hyp"], 3], " V/m"}],
      Row[{"Probe K(", probe, ") = ", fmt[s["probes"][probe]["K"]], " dBm @ ref \[CenterDot] ", s["probes"][probe]["label"]}],
      Style["Interior (r/R): STD | HYP per probe, dBm (SNR)", Bold],
      Grid[Prepend[intRows, Join[{"r/R"}, Flatten[Table[{q <> " STD", q <> " HYP"}, {q, fx1Probes}]]]], Frame -> All, BaseStyle -> 9],
      Style["Exterior (from wall): STD-" <> extModel <> " | HYP per probe, dBm (SNR)", Bold],
      Grid[Prepend[extRows, Join[{"distance"}, Flatten[Table[{q <> " STD", q <> " HYP"}, {q, fx1Probes}]]]], Frame -> All, BaseStyle -> 9],
      Row[{
        ListLinePlot[{hyI, sdI}, PlotStyle -> {Orange, Directive[Darker[Cyan], Dashed]}, Frame -> True,
          FrameLabel -> {"r/R", "dB(V/m)"}, PlotLabel -> "Interior: HYP E_r (orange) vs STD leak (dashed)", ImageSize -> 360],
        ListLinePlot[{sdE, hyE, {{Log10[0.02], s["floor_dBm"]}, {Log10[100.], s["floor_dBm"]}}},
          PlotStyle -> {Darker[Cyan], Directive[Orange, Dashed], Directive[Gray, Dotted]}, Frame -> True,
          FrameLabel -> {"log10(d/m) from wall", "dBm (" <> probe <> ")"}, PlotLabel -> "Exterior: STD / HYP / floor", ImageSize -> 360]}],
      Style["Sources: future-scalar-ab.html#home-experiment; SleeveBalunSNR (snr-dual-sim-params-v0.2) stack; Tekbox TBPS01 manual V2.2 pp.2\[Dash]3 / FAQ V1.1 p.2; tinysa.org TinySA4 spec; Ott 2009 ch.6; Balanis Antenna Theory 3e \[Section]4.2. openEMS reference: " <> If[AssociationQ[FX1OpenEMSReference], FX1OpenEMSReference["summary"], "pending"] <> ".", 8, Gray]
    }]],
  {{fsel, 433590000., "Frequency"}, {433590000. -> "433.59 MHz", 1296000000. -> "1296 MHz", 2450000000. -> "2450 MHz", "free" -> "free"}},
  {{ffree, 433.59, "free f (MHz)"}, 100., 3000.},
  {{pdbm, 2., "Drive dBm (+2 = TinySA+Zeenko; -19 = TinySA alone)"}, -40., 10., 1.},
  {{rsel, "bowls_11in", "Radius"}, {"bowls_11in" -> "bowls R 0.14 m", "KB2016_2p5in" -> "KB-2016 2.5 in", "KB1820_0p75in" -> "KB-1820 0.75 in", "free" -> "free (mm)"}},
  {{rfree, 140., "free R (mm)"}, 5., 300.},
  {{shellType, "solid", "Shell"}, {"solid", "mesh"}},
  {{shellMat, "ss304", "Metal"}, {"ss304", "al3003", "copper"}},
  {{tw, 0.5, "wall (mm) ASSUMPTION"}, 0.1, 2.},
  {{seamOn, True, "seam gap"}, {True, False}},
  {{seamL, 5., "seam gap l (mm)"}, 0.5, 100.},
  {{seamN, 1, "n gaps"}, 1, 20, 1},
  {{cp, True, "counterpoise"}, {True, False}},
  {{gapcm, 20., "gap to counterpoise (cm)"}, 5., 60., 1.},
  {{plim, True, "power-limit B/C"}, {True, False}},
  {{rR, 0.7, "interior r/R"}, 0., 0.99},
  {{orient, "radial", "orientation"}, {"radial", "tangential"}},
  {{dsel, "bench_5cm", "distance"}, {"bench_5cm" -> "5 cm", "bench_10cm" -> "10 cm", "bench_20cm" -> "20 cm", "bench_50cm" -> "50 cm",
     "bench_100cm" -> "100 cm", "near_far_lambda" -> "\[Lambda]", "home_garage" -> "10 m", "home_outdoor" -> "50 m", "free" -> "free (cm)"}},
  {{dfree, 30., "free d (cm)"}, 1., 10000.},
  {{extModel, "B", "exterior model"}, {"B", "A", "C"}},
  {{probe, "E5", "probe"}, {"E5", "H10", "H20", "H5"}},
  {{fsrc, "manual", "factor source"}, {"manual", "faq"}},
  {{rbw, 10000., "RBW (Hz)"}, {200., 1000., 3000., 10000., 30000., 100000., 300000., 600000., 850000.}},
  {{lna, False, "TinySA LNA"}, {True, False}},
  {{spreset, "open_air", "stack preset"}, {"open_air", "tents_slotted", "tents_sealed", "hdpe_block", "copper_wall", "steel_hull", "submarine", "expC_ohmic_sealed"}},
  {{errataOverride, "preset", "Errata \[Alpha]=0"}, {"preset", "on", "off"}},
  {{atoy, 0.05, "\[Alpha]_toy (Np/m, HYP)"}, 0., 2.},
  {{cpath, 1., "cage path (m/tent)"}, 0.1, 5.},
  {{hdpecm, 5., "HDPE (cm)"}, 0.5, 30.},
  ControlPlacement -> Left, ContinuousAction -> False, SaveDefinitions -> True];
