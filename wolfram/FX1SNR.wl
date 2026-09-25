(* ::Package:: *)
(* ============================================================================
   FX1SNR.wl — FX-1 driven Faraday sphere SNR simulator (Wolfram twin of fx1-snr.html)
   PhysicsVersion: fx1-snr-v0.2 (Pages live; Cloud twin pending sync)
   v0.2: openEMS FDTD tables embedded in FX1Const["openems"] (generated from openems/results.json) are the
   default exterior model (page 200 mm geometry) and the interior seam options (FACT, order-of-magnitude).
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
  fx1StackPresets, fx1ApplyStackPreset, fx1NumOrNull, FX1Grid, FX1ExportGrid, FX1OpenEMSReference, FX1SNRManipulate,
  fx1OemsDataset, fx1OemsAnyAtFreq, fx1OemsScale, fx1OemsExterior, fx1InterpRR, fx1OemsInteriorApplies, fx1OemsInterior,
  fx1SeamText, fx1Headline, fx1ExtRec];

(* BEGIN FX1 CONSTANTS (generated — do not edit by hand) *)
FX1Const = <|
  "PHYSICS_VERSION" -> "fx1-snr-v0.2",
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
  "interior_grid_rR" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.`*^-1},
  "openems" -> <|
    "P_ref_dBm" -> 2.,
    "norm" -> "per_2dBm_available_50ohm",
    "match_tol" -> <|
      "f_rel" -> 1.`*^-6,
      "R_abs_m" -> 1.`*^-6,
      "gap_abs_m" -> 1.`*^-6
    |>,
    "ext_mesh_uncertainty_rel" -> 1.5`*^-1,
    "exterior" -> {<|
      "id" -> "gap200_433",
      "results_key" -> "433.59MHz_gap200mm",
      "reference_case" -> "gap200_r2p5",
      "f_Hz" -> 433590000.,
      "R_m" -> 1.4`*^-1,
      "gap_m" -> 2.`*^-1,
      "mesh" -> "2.5 mm cells near sphere (finest run; not converged: 5 mm vs 2.5 mm differ 12-17%)",
      "d_m" -> {5.`*^-2, 1.`*^-1, 2.`*^-1, 5.`*^-1, 1.},
      "E" -> {5.183246759537693`*^-1, 4.1304045919127136`*^-1, 3.091578196246085`*^-1, 1.6969770933840234`*^-1, 9.113169524940214`*^-2},
      "B" -> {1.885958167338703`*^-9, 1.5409193443162823`*^-9, 1.1230295689269891`*^-9, 5.769218412525017`*^-10, 3.0511626009714716`*^-10},
      "ff_r_m" -> {3., 10.},
      "ff_E" -> {3.15738304513311`*^-2, 9.472149298980824`*^-3},
      "ff_B" -> {1.0531896186438119`*^-10, 3.1595689104963486`*^-11},
      "Zin_re" -> 3.528887344594165`*^2,
      "Zin_im" -> -7.607523927820674`*^2,
      "S11_dB" -> -4.3465866934182185`*^-1,
      "P_acc_W_at_Pref" -> 1.509427805215738`*^-4,
      "Vgap_pk_V_at_Pref" -> 7.75648146421041`*^-1,
      "Dmax" -> 2.2005087178319807`*^0,
      "note" -> "page geometry: sphere bottom 200 mm above a 0.35 m square counterpoise, thin vertical feed wire, 10 mm port at the sheet"
    |>, <|
      "id" -> "gap10_433",
      "results_key" -> "433.59MHz",
      "reference_case" -> "closed_pec_r2p5mm",
      "f_Hz" -> 433590000.,
      "R_m" -> 1.4`*^-1,
      "gap_m" -> 1.`*^-2,
      "mesh" -> "2.5 mm cells near sphere (finest run)",
      "d_m" -> {5.`*^-2, 1.`*^-1, 2.`*^-1, 5.`*^-1, 1.},
      "E" -> {1.586667627349717`*^0, 1.2061500374422294`*^0, 8.363604502201342`*^-1, 4.2028096014564986`*^-1, 2.2884938073997393`*^-1},
      "B" -> {5.9947553649212115`*^-9, 4.574040324219102`*^-9, 2.9779769951096697`*^-9, 1.414149817875557`*^-9, 7.667630486107056`*^-10},
      "ff_r_m" -> {3., 10.},
      "ff_E" -> {8.698890003077997`*^-2, 2.6096671433620742`*^-2},
      "ff_B" -> {2.901637373104962`*^-10, 8.704912594439164`*^-11},
      "Zin_re" -> 1.4707105040341071`*^1,
      "Zin_im" -> 2.4839703692967774`*^1,
      "S11_dB" -> -4.114853972024244`*^0,
      "P_acc_W_at_Pref" -> 9.704034993882005`*^-4,
      "Vgap_pk_V_at_Pref" -> 3.316124498828192`*^-1,
      "Dmax" -> 1.8285344114895323`*^0,
      "note" -> "10 mm feed gap (sphere driven directly across a 10 mm port), closed PEC shell"
    |>, <|
      "id" -> "gap10_1296",
      "results_key" -> "1.296GHz",
      "reference_case" -> "high_band_closed_r5mm",
      "f_Hz" -> 1296000000.,
      "R_m" -> 1.4`*^-1,
      "gap_m" -> 1.`*^-2,
      "mesh" -> "5 mm cells near sphere, compact domain (d <= 0.5 m usable)",
      "d_m" -> {5.`*^-2, 1.`*^-1, 2.`*^-1, 5.`*^-1},
      "E" -> {1.6490600019763026`*^0, 1.2348923524600208`*^0, 7.455783547918369`*^-1, 2.8871404052363764`*^-1},
      "B" -> {4.906124289729775`*^-9, 3.865879688231345`*^-9, 2.3911413867134885`*^-9, 9.49440944237666`*^-10},
      "ff_r_m" -> {3., 10.},
      "ff_E" -> {4.0416010537201945`*^-2, 1.21248039356567`*^-2},
      "ff_B" -> {1.3481329986360747`*^-10, 4.04439925425232`*^-11},
      "Zin_re" -> 3.2136278463084366`*^1,
      "Zin_im" -> 7.917260942391299`*^1,
      "S11_dB" -> -2.957181713827489`*^0,
      "P_acc_W_at_Pref" -> 7.826947237859563`*^-4,
      "Vgap_pk_V_at_Pref" -> 5.963563493799576`*^-1,
      "Dmax" -> 5.33539305401527`*^0,
      "note" -> "10 mm feed gap geometry, closed PEC shell; NOT the page's 200 mm geometry"
    |>, <|
      "id" -> "gap10_2450",
      "results_key" -> "2.45GHz",
      "reference_case" -> "high_band_closed_r5mm",
      "f_Hz" -> 2450000000.,
      "R_m" -> 1.4`*^-1,
      "gap_m" -> 1.`*^-2,
      "mesh" -> "5 mm cells near sphere, compact domain (d <= 0.5 m usable)",
      "d_m" -> {5.`*^-2, 1.`*^-1, 2.`*^-1, 5.`*^-1},
      "E" -> {1.1941176798619717`*^0, 1.067469701165533`*^0, 7.967474477693274`*^-1, 3.008024924188639`*^-1},
      "B" -> {3.746338310525965`*^-9, 3.470738492185841`*^-9, 2.624914820596074`*^-9, 9.99780095268074`*^-10},
      "ff_r_m" -> {3., 10.},
      "ff_E" -> {4.753504334157681`*^-2, 1.4260513623484362`*^-2},
      "ff_B" -> {1.585598372243801`*^-10, 4.756795323878482`*^-11},
      "Zin_re" -> 6.177394540525377`*^1,
      "Zin_im" -> 1.3076347202160883`*^2,
      "S11_dB" -> -2.347020579643195`*^0,
      "P_acc_W_at_Pref" -> 6.616886301215084`*^-4,
      "Vgap_pk_V_at_Pref" -> 6.693745533367921`*^-1,
      "Dmax" -> 3.1945838865861145`*^0,
      "note" -> "10 mm feed gap geometry, closed PEC shell; NOT the page's 200 mm geometry"
    |>},
    "interior" -> <|
      "f_Hz" -> 433590000.,
      "R_m" -> 1.4`*^-1,
      "cases" -> <|
        "closed" -> <|
          "results_case" -> "closed_pec_r2p5mm",
          "description" -> "closed PEC shell, full domain, 2.5 mm cells near sphere (finest, REFERENCE for exterior[433.59MHz])",
          "eq" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {0., 0., 0., 0., 0.},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {0., 0., 0., 0., 0.},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "axis" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {0., 0., 0., 0., 0.},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {0., 0., 0., 0., 0.},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "obl" -> <|
            "xE" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {0., 0., 0., 0., 0.},
            "xB" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {0., 0., 0., 0., 0.},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "label" -> "closed seam (fully bonded)",
          "mesh" -> "2.5 mm"
        |>,
        "ring_0p1" -> <|
          "results_case" -> "ring_slot_0p1mm",
          "description" -> "full 360-deg equatorial seam slot, 0.1 mm high, compact domain",
          "eq" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {1.7251986680076496`*^-2, 1.783972833667902`*^-2, 2.0604220688231586`*^-2, 2.9367859354822338`*^-2, 8.055726285239867`*^0},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 8.928572142857114`*^-1},
            "B" -> {5.3594909279130575`*^-16, 9.235252279210217`*^-12, 1.8921270088067833`*^-11, 2.7973853457184314`*^-11, 5.290351872458034`*^-11},
            "unresolved" -> {False, False, False, False, True}
          |>,
          "axis" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {1.7251986680076496`*^-2, 1.5477268648079537`*^-2, 1.15373229371246`*^-2, 8.354046451784187`*^-3, 6.184117259711823`*^-3},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 8.92857142857143`*^-1},
            "B" -> {5.3594909279130575`*^-16, 2.5137225219494346`*^-16, 2.6737181616576086`*^-16, 1.6184630638150847`*^-16, 1.9556443681287719`*^-16},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "obl" -> <|
            "xE" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 8.84063842463326`*^-1},
            "E" -> {1.7251986680076496`*^-2, 1.652526739668605`*^-2, 1.410830260136014`*^-2, 1.1019264751793371`*^-2, 8.346006482182955`*^-3},
            "xB" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {5.3594909279130575`*^-16, 6.15251008159067`*^-12, 1.0291742613972772`*^-11, 1.1226438332525613`*^-11, 1.0511442049112692`*^-11},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "label" -> "hairline gap all round (0.1 mm ring slot)",
          "mesh" -> "5 mm, compact"
        |>,
        "ring_1" -> <|
          "results_case" -> "ring_slot_1mm_r2p5mm",
          "description" -> "as ring_slot_1mm but 2.5 mm cells (model wall 3.75 mm thick instead of 7.5 mm): mesh / slot-depth sensitivity",
          "eq" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {2.3009825566527672`*^-1, 2.369759860673116`*^-1, 2.685196878523851`*^-1, 3.582387516376418`*^-1, 1.1871799466919988`*^0},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {1.906341646303909`*^-15, 1.2287429358060702`*^-10, 2.5482371079513454`*^-10, 3.8687100105168564`*^-10, 6.501766984908059`*^-10},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "axis" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {2.3009825566527672`*^-1, 2.0779411267863404`*^-1, 1.5738956790235878`*^-1, 1.1530666563730593`*^-1, 8.224088078705254`*^-2},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {1.906341646303909`*^-15, 3.3035591975939343`*^-16, 6.160796596089336`*^-16, 8.203628312088063`*^-16, 5.790150146464252`*^-16},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "obl" -> <|
            "xE" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {2.3009825566527672`*^-1, 2.208260873565261`*^-1, 1.9035758474890477`*^-1, 1.5079002897639102`*^-1, 1.0597263576817915`*^-1},
            "xB" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {1.906341646303909`*^-15, 8.197247110120411`*^-11, 1.3918779842865592`*^-10, 1.5429033379860028`*^-10, 1.4194845496904313`*^-10},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "label" -> "1 mm gap all round (ring slot)",
          "mesh" -> "2.5 mm, compact"
        |>,
        "arc_1x30" -> <|
          "results_case" -> "arc_slot_1mm_x30mm",
          "description" -> "30 mm long x 1.0 mm high equatorial slot at +x (local tape gap), compact domain",
          "eq" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {1.7135061587944704`*^-4, 3.255533493119933`*^-4, 7.688317003046717`*^-4, 2.434789542463447`*^-3, 2.6705973099746616`*^-1},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 8.928642856857144`*^-1},
            "B" -> {7.681894050166995`*^-13, 1.471764392468963`*^-12, 4.419854450352087`*^-12, 2.0396129491153123`*^-11, 2.6745722719436765`*^-10},
            "unresolved" -> {False, False, False, False, True}
          |>,
          "axis" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {1.7135061587944704`*^-4, 1.5561653017263918`*^-4, 1.1814754853717393`*^-4, 8.55139879467782`*^-5, 6.151002008325171`*^-5},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 8.92857142857143`*^-1},
            "B" -> {7.681894050166995`*^-13, 7.220908966570989`*^-13, 6.130929741282276`*^-13, 5.149201946925792`*^-13, 4.188400423900506`*^-13},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "obl" -> <|
            "xE" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 8.84063842463326`*^-1},
            "E" -> {1.7135061587944704`*^-4, 2.4997118797060917`*^-4, 3.138043006672604`*^-4, 3.0987791570579576`*^-4, 2.6304480945496826`*^-4},
            "xB" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {7.681894050166995`*^-13, 1.1154272098836617`*^-12, 1.5357013058197925`*^-12, 1.704039491951757`*^-12, 1.6313029914053734`*^-12},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "label" -> "one 30 mm long, 1 mm gap in the tape",
          "mesh" -> "5 mm, compact"
        |>,
        "arc_0p1x30" -> <|
          "results_case" -> "arc_slot_0p1mm_x30mm",
          "description" -> "30 mm long x 0.1 mm high equatorial slot at +x, compact domain",
          "eq" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {2.0543383600510317`*^-5, 3.918366367327089`*^-5, 9.31225444253036`*^-5, 2.9361177512386336`*^-4, 2.9607330789668684`*^-1},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 8.928572142857114`*^-1},
            "B" -> {9.245438094358235`*^-14, 1.7654854927690885`*^-13, 5.326828876988878`*^-13, 2.4712057735262165`*^-12, 3.173509701936638`*^-11},
            "unresolved" -> {False, False, False, False, True}
          |>,
          "axis" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {2.0543383600510317`*^-5, 1.8598493108515748`*^-5, 1.4081483205429255`*^-5, 1.0069825812176753`*^-5, 7.226694553285132`*^-6},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 8.92857142857143`*^-1},
            "B" -> {9.245438094358235`*^-14, 8.689208432542263`*^-14, 7.370777928545264`*^-14, 6.175333379242613`*^-14, 5.002811767071994`*^-14},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "obl" -> <|
            "xE" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 8.84063842463326`*^-1},
            "E" -> {2.0543383600510317`*^-5, 2.998546808451322`*^-5, 3.769616786356943`*^-5, 3.715094693900095`*^-5, 3.146172418839303`*^-5},
            "xB" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {9.245438094358235`*^-14, 1.3370760141485838`*^-13, 1.8408407002206346`*^-13, 2.0407679943981664`*^-13, 1.9582946106770143`*^-13},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "label" -> "one 30 mm long hairline (0.1 mm) gap",
          "mesh" -> "5 mm, compact"
        |>,
        "ring_1_m5" -> <|
          "results_case" -> "ring_slot_1mm",
          "description" -> "full 360-deg equatorial seam slot, 1.0 mm high (tape non-conducting), compact domain",
          "eq" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {1.4515302535685295`*^-1, 1.5001374463799594`*^-1, 1.7257254937222563`*^-1, 2.4474303906666622`*^-1, 7.570795980002428`*^0},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 8.928642856857144`*^-1},
            "B" -> {1.4601115860831597`*^-15, 7.792427711448704`*^-11, 1.609997488027868`*^-10, 2.420047365436371`*^-10, 4.708796989650582`*^-10},
            "unresolved" -> {False, False, False, False, True}
          |>,
          "axis" -> <|
            "xE" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "E" -> {1.4515302535685295`*^-1, 1.3024652007580184`*^-1, 9.711566880420991`*^-2, 7.033140861027139`*^-2, 5.2066391063760056`*^-2},
            "xB" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 8.92857142857143`*^-1},
            "B" -> {1.4601115860831597`*^-15, 5.8275777687982`*^-16, 4.417499620282764`*^-16, 1.849782684453709`*^-16, 3.5337716773574684`*^-16},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "obl" -> <|
            "xE" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 8.84063842463326`*^-1},
            "E" -> {1.4515302535685295`*^-1, 1.3905108719078016`*^-1, 1.1872969754717189`*^-1, 9.278316044493165`*^-2, 7.029557586947886`*^-2},
            "xB" -> {0., 2.4999999999999994`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
            "B" -> {1.4601115860831597`*^-15, 5.18671128942297`*^-11, 8.700400089975666`*^-11, 9.510523764285986`*^-11, 8.91321017757433`*^-11},
            "unresolved" -> {False, False, False, False, False}
          |>,
          "label" -> "1 mm ring slot, coarser 5 mm mesh (sensitivity)",
          "mesh" -> "5 mm, compact"
        |>
      |>
    |>,
    "seam_options" -> {"closed", "arc_0p1x30", "arc_1x30", "ring_0p1", "ring_1", "ring_1_m5", "analytic"},
    "seam_front_options" -> {"closed", "arc_0p1x30", "arc_1x30", "ring_0p1", "ring_1"},
    "seam_default" -> "arc_1x30",
    "int_dir_default" -> "eq"
  |>
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


(* ---- openEMS FACT data (v0.2): identical logic to JS oemsDataset / oemsExterior / interpRR / oemsInterior ---- *)
fx1OemsDataset[p_Association] := Module[{o = FX1Const["openems"], t},
  t = o["match_tol"];
  If[!TrueQ[p["counterpoise"]], Null,
    SelectFirst[o["exterior"],
      Abs[p["f"] - #["f_Hz"]] <= t["f_rel"] #["f_Hz"] && Abs[p["R"] - #["R_m"]] <= t["R_abs_m"] && Abs[p["gap"] - #["gap_m"]] <= t["gap_abs_m"] &, Null]]];

fx1OemsAnyAtFreq[f_, rr_] := Module[{o = FX1Const["openems"], t},
  t = o["match_tol"];
  Select[o["exterior"], Abs[f - #["f_Hz"]] <= t["f_rel"] #["f_Hz"] && Abs[rr - #["R_m"]] <= t["R_abs_m"] &]];

fx1OemsScale[pdbm_] := 10.^((pdbm - FX1Const["openems"]["P_ref_dBm"])/20.);

(* log-log interpolation in distance; beyond the last point far-field 1/r; closer than the first point: Null (analytic fallback) *)
fx1OemsExterior[e_Association, rr_, d_, s_] := Module[{pts, n, tol = 1.*^-9, pos, fr, i, t, ee, bb},
  pts = SortBy[Join[Transpose[{e["d_m"], e["E"], e["B"]}], Transpose[{e["ff_r_m"] - rr, e["ff_E"], e["ff_B"]}]], First];
  n = Length[pts];
  pos = FirstPosition[pts[[All, 1]], x_ /; Abs[d - x] <= tol x, None, {1}];
  Which[
    d < pts[[1, 1]] (1. - tol), Null,
    pos =!= None, <|"E" -> pts[[First[pos], 2]] s, "B" -> pts[[First[pos], 3]] s, "how" -> "sample", "id" -> e["id"]|>,
    d > pts[[n, 1]],
      fr = (rr + pts[[n, 1]])/(rr + d);
      <|"E" -> pts[[n, 2]] fr s, "B" -> pts[[n, 3]] fr s, "how" -> "far-field 1/r beyond " <> ToString[Round[rr + pts[[n, 1]]]] <> " m", "id" -> e["id"]|>,
    True,
      i = LengthWhile[pts[[All, 1]], # < d &];
      t = (Log[d] - Log[pts[[i, 1]]])/(Log[pts[[i + 1, 1]]] - Log[pts[[i, 1]]]);
      ee = Exp[Log[pts[[i, 2]]] + t (Log[pts[[i + 1, 2]]] - Log[pts[[i, 2]]])];
      bb = Exp[Log[pts[[i, 3]]] + t (Log[pts[[i + 1, 3]]] - Log[pts[[i, 3]]])];
      <|"E" -> ee s, "B" -> bb s, "how" -> "log-log interpolation", "id" -> e["id"]|>]];

fx1InterpRR[xs_List, ys_List, x_] := Module[{n = Length[xs], pos, i, t},
  pos = FirstPosition[xs, v_ /; Abs[x - v] <= 1.*^-9, None, {1}];
  Which[
    pos =!= None, <|"v" -> ys[[First[pos]]], "i0" -> First[pos], "i1" -> First[pos], "clamped" -> False|>,
    x <= xs[[1]], <|"v" -> ys[[1]], "i0" -> 1, "i1" -> 1, "clamped" -> False|>,
    x >= xs[[n]], <|"v" -> ys[[n]], "i0" -> n, "i1" -> n, "clamped" -> True|>,
    True,
      i = LengthWhile[xs, # < x &];
      t = (x - xs[[i]])/(xs[[i + 1]] - xs[[i]]);
      <|"v" -> If[ys[[i]] > 0 && ys[[i + 1]] > 0, Exp[Log[ys[[i]]] + t (Log[ys[[i + 1]]] - Log[ys[[i]]])], ys[[i]] + t (ys[[i + 1]] - ys[[i]])],
        "i0" -> i, "i1" -> i + 1, "clamped" -> False|>]];

fx1OemsInteriorApplies[p_Association] := Module[{ii = FX1Const["openems"]["interior"], t = FX1Const["openems"]["match_tol"]},
  p["shellType"] =!= "mesh" && Abs[p["f"] - ii["f_Hz"]] <= t["f_rel"] ii["f_Hz"] && Abs[p["R"] - ii["R_m"]] <= t["R_abs_m"] &&
    KeyExistsQ[ii["cases"], p["seam"]]];

fx1OemsInterior[seam_String, dir_String, rR_, s_] := Module[{c = FX1Const["openems"]["interior"]["cases"][seam], q, e, b},
  q = c[dir]; e = fx1InterpRR[q["xE"], q["E"], rR]; b = fx1InterpRR[q["xB"], q["B"], rR];
  <|"E" -> e["v"] s, "B" -> b["v"] s, "unresolved" -> TrueQ[q["unresolved"][[e["i0"]]] || q["unresolved"][[e["i1"]]]],
    "clamped" -> e["clamped"], "caseId" -> c["results_case"], "label" -> c["label"], "mesh" -> c["mesh"]|>];

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
   floor, probes, skr, so, oi, leak, ds, exO, selM, others, selInfo},
  lam = FX1Const["C0"]/f; k = 2. Pi f/FX1Const["C0"];
  dr = fx1Drive[p["P_dBm"]]; v0 = dr["V0"];
  sh = fx1ShellSE[If[p["seam"] === "closed", Join[p, <|"seamOn" -> False|>], p], f];
  ri = p["rR"] rr;
  eref = v0/rr;
  so = fx1OemsScale[p["P_dBm"]];
  If[fx1OemsInteriorApplies[p],
    oi = fx1OemsInterior[p["seam"], p["intDir"], p["rR"], so];
    eleak = oi["E"]; bleak = oi["B"];
    leak = <|"src" -> "openEMS", "caseId" -> oi["caseId"], "label" -> oi["label"], "mesh" -> oi["mesh"], "unresolved" -> oi["unresolved"],
      "clamped" -> oi["clamped"], "tag" -> "FACT (openEMS, order-of-magnitude: PEC walls, stair-stepped, not converged)"|>,
    eleak = If[NumericQ[sh["SE"]] && Abs[sh["SE"]] < Infinity, eref 10.^(-sh["SE"]/20.), 0.];
    bleak = eleak/FX1Const["C0"];
    leak = <|"src" -> "analytic", "caseId" -> Null, "label" -> sh["label"], "mesh" -> Null, "unresolved" -> False, "clamped" -> False,
      "tag" -> If[p["seam"] === "analytic", "ASSUMPTION (v0.1 analytic wall + seam model, selected)",
        "analytic only (no openEMS interior data for this frequency/radius/shell)"]|>];
  ers = fx1ErHyp[v0, rr, k, ri];
  ehyp = If[p["orient"] === "tangential", 0., Abs[ers]];
  hc = p["gap"] + rr; rc = rr + p["d"];
  ex0 = fx1ExteriorStd[v0, rr, f, hc, rc, p["counterpoise"]];
  ex = <|"Q" -> ex0["Q"], "I0" -> ex0["I0"], "A" -> ex0["A"],
    "B" -> fx1PowerLimit[ex0["B"], dr["P"], p["powerLimit"]], "C" -> fx1PowerLimit[ex0["C"], dr["P"], p["powerLimit"]]|>;
  ds = fx1OemsDataset[p];
  exO = If[ds === Null, Null, fx1OemsExterior[ds, rr, p["d"], so]];
  ex = Append[ex, "O" -> exO];
  selM = p["extModel"];
  If[selM === "auto", selM = Which[exO =!= Null, "O", ex["B"] =!= Null, "B", True, "A"]];
  If[!MemberQ[{"A", "B", "C", "O"}, selM] || ex[selM] === Null, selM = If[ex["B"] =!= Null, "B", "A"]];
  others = #["id"] & /@ Select[fx1OemsAnyAtFreq[f, rr], ds === Null || #["id"] =!= ds["id"] &];
  selInfo = <|"model" -> selM, "dataset" -> If[ds === Null, Null, ds["id"]], "other_datasets" -> others,
    "tag" -> If[selM === "O",
      "FACT (openEMS " <> ds["id"] <> ", \[PlusMinus]" <> ToString[Round[100 FX1Const["openems"]["ext_mesh_uncertainty_rel"]]] <> "% mesh uncertainty)",
      "analytic only \[LongDash] openEMS shows the analytic model reads high at 433 MHz (2.3\[Dash]5\[Times])"]|>;
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
        {m, {"A", "B", "C", "O"}}]];
      extHypRaw = If[isE, fx1ProbeDbm[pf, epar, ref], Null];
      extHyp = If[extHypRaw === Null, Null, extHypRaw + 10. Log10[st["mP"]]];
      sel = extStd[selM];
      pr -> <|"K" -> pf["K"], "label" -> pf["label"],
        "int_std" -> fx1Reading[intStd, floor], "int_hyp" -> fx1Reading[intHyp, floor],
        "ext_std" -> fx1Reading[sel, floor],
        "ext_std_A" -> fx1Reading[extStd["A"], floor], "ext_std_B" -> fx1Reading[extStd["B"], floor],
        "ext_std_C" -> fx1Reading[extStd["C"], floor], "ext_std_O" -> fx1Reading[extStd["O"], floor], "ext_hyp" -> fx1Reading[extHyp, floor]|>],
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
      "E_leak" -> eleak, "B_leak" -> bleak, "leak" -> leak, "seam" -> p["seam"], "dir" -> p["intDir"], "E_hyp_signed" -> ers, "E_hyp" -> ehyp, "B_hyp" -> 0.,
      "ratio_hyp_dB" -> If[ehyp > 0, 20. Log10[ehyp/eref], Null], "ratio_leak_dB" -> If[eleak > 0, 20. Log10[eleak/eref], Null]|>,
    "exterior" -> <|"d" -> p["d"], "rc" -> rc, "hc" -> hc, "Q" -> ex["Q"], "I0" -> ex["I0"], "A" -> ex["A"], "B" -> ex["B"], "C" -> ex["C"],
      "O" -> exO, "model" -> selM, "sel" -> selInfo, "scale_openEMS" -> so,
      "ratio_B_over_O" -> If[exO =!= Null && ex["B"] =!= Null, ex["B"]["E"]/exO["E"], Null], "E_hyp" -> epar, "Prad" -> prad, "S_hyp" -> shyp, "P_drive" -> dr["P"]|>,
    "stack" -> st, "floor_dBm" -> floor, "probes" -> probes|>];

fx1Defaults[] := <|
  "f" -> FX1Const["freq_presets_Hz"]["f433"], "P_dBm" -> FX1Const["drive"]["default_dBm"], "R" -> FX1Const["radius_presets_m"]["bowls_11in"],
  "shellMat" -> "ss304", "shellType" -> "solid", "tWall" -> FX1Const["shell"]["t_wall_default_m"],
  "seamOn" -> True, "seamL" -> FX1Const["shell"]["seam_gap_default_m"], "seamN" -> FX1Const["shell"]["seam_n_default"],
  "counterpoise" -> True, "gap" -> FX1Const["counterpoise_gap_default_m"], "powerLimit" -> True,
  "seam" -> FX1Const["openems"]["seam_default"], "intDir" -> FX1Const["openems"]["int_dir_default"],
  "rR" -> 0.7, "orient" -> "radial", "d" -> 0.05, "extModel" -> "auto", "factorSrc" -> "manual",
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

(* ---- fixed test grid v0.2 (identical to dump_js_outputs.mjs and py_check.py; same record order and keys) ---- *)
fx1ExtRec[s_Association, meta_Association] := Join[meta, <|
  "model" -> s["exterior"]["model"], "dataset" -> s["exterior"]["sel"]["dataset"],
  "E_A" -> s["exterior"]["A"]["E"],
  "E_B" -> If[s["exterior"]["B"] === Null, Null, s["exterior"]["B"]["E"]], "B_B" -> If[s["exterior"]["B"] === Null, Null, s["exterior"]["B"]["B"]],
  "E_C" -> If[s["exterior"]["C"] === Null, Null, s["exterior"]["C"]["E"]], "B_C" -> If[s["exterior"]["C"] === Null, Null, s["exterior"]["C"]["B"]],
  "E_O" -> If[s["exterior"]["O"] === Null, Null, s["exterior"]["O"]["E"]], "B_O" -> If[s["exterior"]["O"] === Null, Null, s["exterior"]["O"]["B"]],
  "E_hyp" -> s["exterior"]["E_hyp"], "stack_std_dB" -> fx1NumOrNull[s["stack"]["stdDb"]], "alphaL" -> s["stack"]["alphaL"], "mP" -> s["stack"]["mP"],
  "floor_dBm" -> s["floor_dBm"],
  "probes" -> Association[Table[pr -> <|"K" -> s["probes"][pr]["K"], "label" -> s["probes"][pr]["label"],
      "std" -> s["probes"][pr]["ext_std"]["dBm"],
      "std_A" -> s["probes"][pr]["ext_std_A"]["dBm"], "std_B" -> s["probes"][pr]["ext_std_B"]["dBm"],
      "std_C" -> s["probes"][pr]["ext_std_C"]["dBm"], "std_O" -> s["probes"][pr]["ext_std_O"]["dBm"],
      "hyp" -> s["probes"][pr]["ext_hyp"]["dBm"]|>, {pr, fx1Probes}]]|>];

FX1Grid[] := Module[{recs = {}, radiusKeys = {"bowls_11in", "KB2016_2p5in", "KB1820_0p75in"},
    driveKeys = {"tinysa_plus_zeenko", "tinysa_alone"}, srcs = {"manual", "faq"}, dirs = {"eq", "axis", "obl"},
    f0 = FX1Const["freq_presets_Hz"]["f433"], base, p, s, counts},
  Do[
    base = Join[fx1Defaults[], <|"f" -> f0, "R" -> FX1Const["radius_presets_m"][rk],
      "shellMat" -> FX1Const["radius_default_shell"][rk], "seamOn" -> FX1Const["radius_default_seam"][rk],
      "P_dBm" -> FX1Const["drive"]["presets_dBm"][dk], "factorSrc" -> src|>];
    Do[
      s = fx1Compute[Join[base, <|"rR" -> x, "seam" -> seam, "intDir" -> dir|>]];
      AppendTo[recs, <|"kind" -> "interior", "radius" -> rk, "drive" -> dk, "factorSrc" -> src, "seam" -> seam, "dir" -> dir, "rR" -> x,
        "V0" -> s["V0"], "E_ref" -> s["interior"]["E_ref"], "SE_shell" -> fx1NumOrNull[s["shell"]["SE"]],
        "leak_src" -> s["interior"]["leak"]["src"], "unresolved" -> s["interior"]["leak"]["unresolved"],
        "E_leak" -> s["interior"]["E_leak"], "B_leak" -> s["interior"]["B_leak"], "E_hyp" -> s["interior"]["E_hyp"],
        "floor_dBm" -> s["floor_dBm"],
        "probes" -> Association[Table[pr -> <|"K" -> s["probes"][pr]["K"], "label" -> s["probes"][pr]["label"],
            "std" -> s["probes"][pr]["int_std"]["dBm"], "hyp" -> s["probes"][pr]["int_hyp"]["dBm"],
            "std_snr" -> s["probes"][pr]["int_std"]["snr"], "hyp_snr" -> s["probes"][pr]["int_hyp"]["snr"]|>, {pr, fx1Probes}]]|>],
      {seam, FX1Const["openems"]["seam_options"]}, {dir, dirs}, {x, FX1Const["interior_grid_rR"]}];
    Do[
      p = Join[fx1ApplyStackPreset[base, sk], <|"d" -> dp["d"]|>];
      s = fx1Compute[p];
      AppendTo[recs, fx1ExtRec[s, <|"kind" -> "exterior", "radius" -> rk, "drive" -> dk, "factorSrc" -> src, "stack" -> sk,
        "f_Hz" -> f0, "gap_m" -> base["gap"], "dist" -> dp["id"], "d_m" -> dp["d"]|>]],
      {sk, Keys[fx1StackPresets]}, {dp, fx1DistancePresets[f0]}],
    {rk, radiusKeys}, {dk, driveKeys}, {src, srcs}];
  Do[
    With[{f = FX1Const["freq_presets_Hz"][fk]},
      base = Join[fx1Defaults[], <|"f" -> f, "R" -> FX1Const["radius_presets_m"]["bowls_11in"], "P_dBm" -> FX1Const["drive"]["presets_dBm"][dk],
        "factorSrc" -> src, "gap" -> gap|>];
      Do[
        s = fx1Compute[Join[fx1ApplyStackPreset[base, "open_air"], <|"d" -> dp["d"]|>]];
        AppendTo[recs, fx1ExtRec[s, <|"kind" -> "exterior_sweep", "radius" -> "bowls_11in", "drive" -> dk, "factorSrc" -> src, "stack" -> "open_air",
          "f_Hz" -> f, "gap_m" -> gap, "dist" -> dp["id"], "d_m" -> dp["d"]|>]],
        {dp, fx1DistancePresets[f]}]],
    {dk, driveKeys}, {src, srcs}, {fk, {"f433", "f1296", "f2450"}}, {gap, {0.01, 0.2}}];
  base = Join[fx1Defaults[], <|"f" -> f0, "R" -> FX1Const["radius_presets_m"]["bowls_11in"],
    "P_dBm" -> FX1Const["drive"]["presets_dBm"]["tinysa_plus_zeenko"], "factorSrc" -> "manual"|>];
  Do[
    s = fx1Compute[Join[base, <|"rR" -> x, "seam" -> seam, "intDir" -> dir|>]];
    AppendTo[recs, <|"kind" -> "interior_interp", "seam" -> seam, "dir" -> dir, "rR" -> x, "leak_src" -> s["interior"]["leak"]["src"],
      "unresolved" -> s["interior"]["leak"]["unresolved"], "E_leak" -> s["interior"]["E_leak"], "B_leak" -> s["interior"]["B_leak"],
      "E_hyp" -> s["interior"]["E_hyp"], "E5_std" -> s["probes"]["E5"]["int_std"]["dBm"], "H10_std" -> s["probes"]["H10"]["int_std"]["dBm"]|>],
    {seam, FX1Const["openems"]["seam_options"]}, {dir, dirs}, {x, {0.1, 0.6, 0.8, 0.95}}];
  counts = Counts[#["kind"] & /@ recs];
  <|"version" -> PhysicsVersion, "f_Hz" -> f0, "rbw_Hz" -> FX1Const["tinysa_floor"]["rbw_default_Hz"],
    "lna" -> False, "counts" -> counts, "records" -> recs|>];

FX1ExportGrid[path_String] := Export[path, FX1Grid[], "RawJSON"];

(* ---- openEMS reference (FDTD of the real sphere + counterpoise; separate worker). Data, not engine physics:
   written by merge_openems.mjs from /workspace/sim-lab/fx1/openems/results.json. Missing[...] until available. ---- *)
(* BEGIN FX1 OPENEMS (generated by merge_openems.mjs — do not edit by hand) *)
FX1OpenEMSReference = <|
  "summary" -> "FDTD (openEMS) of PEC sphere R=0.14 m + 0.35 m square counterpoise, 10 mm feed gap; Zin=14.7+j24.8 ohm, S11=-4.11 dB; normalisation per_2dBm_available_50ohm",
  "normalisation" -> "per_2dBm_available_50ohm",
  "source" -> "/workspace/sim-lab/fx1/openems/results.json",
  "source_mtime" -> "2026-09-25T11:38:47.864Z",
  "gap_openEMS_m" -> 1.`*^-2,
  "exterior_equatorial" -> {<|
    "id" -> "bench_5cm",
    "d_m" -> 5.`*^-2,
    "E_Vpm" -> 1.58667`*^0,
    "B_T" -> 5.99476`*^-9,
    "probes_dBm" -> <|
      "E5" -> -5.439`*^1,
      "H10" -> -5.156`*^1,
      "H20" -> -4.489`*^1,
      "H5" -> -7.084`*^1
    |>
  |>, <|
    "id" -> "bench_10cm",
    "d_m" -> 1.`*^-1,
    "E_Vpm" -> 1.20615`*^0,
    "B_T" -> 4.57404`*^-9,
    "probes_dBm" -> <|
      "E5" -> -5.677`*^1,
      "H10" -> -5.391`*^1,
      "H20" -> -4.724`*^1,
      "H5" -> -7.319`*^1
    |>
  |>, <|
    "id" -> "bench_20cm",
    "d_m" -> 2.`*^-1,
    "E_Vpm" -> 8.3636`*^-1,
    "B_T" -> 2.97798`*^-9,
    "probes_dBm" -> <|
      "E5" -> -5.995`*^1,
      "H10" -> -5.764`*^1,
      "H20" -> -5.096`*^1,
      "H5" -> -7.692`*^1
    |>
  |>, <|
    "id" -> "bench_50cm",
    "d_m" -> 5.`*^-1,
    "E_Vpm" -> 4.20281`*^-1,
    "B_T" -> 1.41415`*^-9,
    "probes_dBm" -> <|
      "E5" -> -6.592`*^1,
      "H10" -> -6.411`*^1,
      "H20" -> -5.743`*^1,
      "H5" -> -8.338`*^1
    |>
  |>, <|
    "id" -> "bench_100cm",
    "d_m" -> 1.,
    "E_Vpm" -> 2.28849`*^-1,
    "B_T" -> 7.66763`*^-10,
    "probes_dBm" -> <|
      "E5" -> -7.12`*^1,
      "H10" -> -6.942`*^1,
      "H20" -> -6.275`*^1,
      "H5" -> -8.87`*^1
    |>
  |>},
  "far_field" -> {<|
    "id" -> "r_3m",
    "r_m" -> 3.,
    "E_Vpm" -> 8.69889`*^-2,
    "B_T" -> 2.90164`*^-10
  |>, <|
    "id" -> "r_10m",
    "r_m" -> 10.,
    "E_Vpm" -> 2.60967`*^-2,
    "B_T" -> 8.70491`*^-11
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
    "closed_pec_r2p5mm" -> <|
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
    "ring_slot_1mm_r2p5mm" -> <|
      "r_over_R" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
      "E_Vpm" -> {2.30098`*^-1, 2.36976`*^-1, 2.6852`*^-1, 3.58239`*^-1, 1.18718`*^0},
      "B_T" -> {1.90634`*^-15, 1.22874`*^-10, 2.54824`*^-10, 3.86871`*^-10, 6.50177`*^-10}
    |>,
    "ring_slot_0p1mm" -> <|
      "r_over_R" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
      "E_Vpm" -> {1.7252`*^-2, 1.78397`*^-2, 2.06042`*^-2, 2.93679`*^-2, 8.05573`*^0},
      "B_T" -> {5.35949`*^-16, 9.23525`*^-12, 1.89213`*^-11, 2.79739`*^-11, 5.29035`*^-11}
    |>,
    "arc_slot_1mm_x30mm" -> <|
      "r_over_R" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
      "E_Vpm" -> {1.71351`*^-4, 3.25553`*^-4, 7.68832`*^-4, 2.43479`*^-3, 2.6706`*^-1},
      "B_T" -> {7.68189`*^-13, 1.47176`*^-12, 4.41985`*^-12, 2.03961`*^-11, 2.67457`*^-10}
    |>,
    "arc_slot_0p1mm_x30mm" -> <|
      "r_over_R" -> {0., 2.5`*^-1, 5.`*^-1, 7.`*^-1, 9.000000000000001`*^-1},
      "E_Vpm" -> {2.05434`*^-5, 3.91837`*^-5, 9.31225`*^-5, 2.93612`*^-4, 2.96073`*^-1},
      "B_T" -> {9.24544`*^-14, 1.76549`*^-13, 5.32683`*^-13, 2.47121`*^-12, 3.17351`*^-11}
    |>
  |>
|>;
(* END FX1 OPENEMS *)

(* ---- plain-language headline (same wording rules as the JS front view) ---- *)
fx1SeamText = <|"closed" -> "perfectly sealed seam", "arc_0p1x30" -> "one tiny 0.1 mm \[Times] 30 mm gap", "arc_1x30" -> "one small 1 mm \[Times] 30 mm gap",
  "ring_0p1" -> "a hairline gap all round", "ring_1" -> "a 1 mm gap all round", "ring_1_m5" -> "a 1 mm gap all round (coarse mesh)",
  "analytic" -> "the v0.1 analytic seam"|>;

fx1Headline[p_Association, s_Association, loc_String, probe_String] := Module[{pr = s["probes"][probe], std, hyp, fmtR, verdict, vs, vh, where, hl, mean},
  std = If[loc === "inside", pr["int_std"], pr["ext_std"]]; hyp = If[loc === "inside", pr["int_hyp"], pr["ext_hyp"]];
  fmtR[rd_] := If[rd["dBm"] === Null, "nothing (noise floor only)",
    ToString[NumberForm[rd["dBm"], {Infinity, 1}]] <> " dBm, " <>
      If[rd["snr"] >= 0, ToString[NumberForm[rd["snr"], {Infinity, 1}]] <> " dB above", ToString[NumberForm[-rd["snr"], {Infinity, 1}]] <> " dB below"] <> " the noise floor"];
  verdict[rd_] := Which[rd["dBm"] === Null, "nothing", rd["snr"] >= 10, "clear", rd["snr"] >= 0, "marginal", True, "nothing"];
  vs = verdict[std]; vh = verdict[hyp];
  where = If[loc === "inside", "inside the sphere at r/R = " <> ToString[NumberForm[p["rR"], {Infinity, 2}]],
    If[p["d"] >= 1, ToString[NumberForm[p["d"], {Infinity, 0}]] <> " m", ToString[Round[100 p["d"]]] <> " cm"] <> " from the sphere's surface"];
  If[loc === "inside",
    hl = "Expected reading on the " <> probe <> " probe " <> where <> ": standard physics " <> fmtR[std] <> "; EED " <> fmtR[hyp] <> ".";
    mean = Which[
      vh === "clear" && vs =!= "clear", "What this means: with " <> fx1SeamText[p["seam"]] <> ", ordinary leakage should be " <> If[vs === "nothing", "invisible", "barely visible"] <> " here, so a clear peak that grows from zero at the centre toward the wall would favour EED.",
      vh === "clear", "What this means: with " <> fx1SeamText[p["seam"]] <> ", ordinary leakage is also visible, so the reading alone can't decide. Use the shape: EED is zero at the centre and the same in every direction, while leakage is strongest toward the seam.",
      vh === "nothing" && probe =!= "E5", "What this means: EED predicts no magnetic field (B = 0), so an H probe signal inside can only be ordinary leakage.",
      vh === "nothing" && vs =!= "nothing", "What this means: EED predicts zero at the exact centre, while the leakage through " <> fx1SeamText[p["seam"]] <> " is already there. A signal at the centre means leakage.",
      vh === "nothing", "What this means: both predict nothing at this spot. Move the probe toward the wall (r/R \[TildeTilde] 0.7) where EED predicts its largest signal.",
      True, "What this means: neither prediction is clearly above the noise here. Try the amplifier, a narrower RBW, or a spot nearer the wall."],
    hl = "Expected reading on the " <> probe <> " probe " <> where <> ": " <> fmtR[std] <> ".";
    mean = If[vs === "clear", "What this means: the driven sphere radiates like a small antenna, so the outside probe should see an ordinary signal. This checks the drive and probe chain; it does not test EED.",
      "What this means: at this distance the ordinary signal is " <> If[vs === "marginal", "near", "below"] <> " the analyser's noise, so expect little or nothing. Move closer, add the amplifier, or narrow the RBW."]];
  <|"headline" -> hl, "meaning" -> mean, "std" -> std, "hyp" -> hyp|>];

(* ---- Manipulate (Cloud): simple front (4 controls) + "All controls" opener + TabView details ---- *)
FX1SNRManipulate = Manipulate[
  Module[{f, rr, pd, dd, p, s, h, pr, cellF, fmt, xs, sdC, hyC, plot, intRows, extRows, oemsRows, seamRows, gset, sc, tabs},
    f = If[fsel === "free", ffree 1.*^6, fsel];
    rr = If[rsel === "free", rfree/1000., FX1Const["radius_presets_m"][rsel]];
    pd = Switch[drive, "custom", pdbm, _, FX1Const["drive"]["presets_dBm"][drive]];
    dd = If[useFree, dfree/100., SelectFirst[fx1DistancePresets[f], #["id"] === dsel &]["d"]];
    p = Join[fx1ApplyStackPreset[fx1Defaults[], spreset], <|
      "f" -> f, "P_dBm" -> pd, "R" -> rr, "shellMat" -> shellMat, "shellType" -> shellType, "tWall" -> tw/1000.,
      "seam" -> seam, "intDir" -> intDir, "seamOn" -> (!MemberQ[{"KB2016_2p5in", "KB1820_0p75in"}, rsel] && seam =!= "closed"),
      "seamL" -> seamL/1000., "seamN" -> seamN, "counterpoise" -> cp, "gap" -> gapcm/100., "powerLimit" -> plim,
      "rR" -> rR, "orient" -> orient, "d" -> dd, "extModel" -> extModel, "factorSrc" -> fsrc, "rbw" -> rbw, "lna" -> lna,
      "hdpeT" -> hdpecm/100., "alphaToy" -> atoy, "cagePath" -> cpath|>];
    s = fx1Compute[p];
    h = fx1Headline[p, s, loc, probe];
    fmt[x_] := If[x === Null, "floor", ToString[NumberForm[x, {Infinity, 1}]]];
    cellF[rd_] := If[rd["dBm"] === Null, Style["floor", Gray], Row[{NumberForm[rd["dBm"], {Infinity, 1}], " (", NumberForm[rd["snr"], {Infinity, 1}], ")"}]];
    (* front plot: inside = reading vs r/R (the discriminating shape); outside = reading vs distance *)
    If[loc === "inside",
      xs = Range[0., 0.9, 0.02];
      sdC = Table[{x, Replace[fx1Compute[Join[p, <|"rR" -> x|>]]["probes"][probe]["int_std"]["dBm"], Null -> Missing[]]}, {x, xs}];
      hyC = Table[{x, Replace[fx1Compute[Join[p, <|"rR" -> x|>]]["probes"][probe]["int_hyp"]["dBm"], Null -> Missing[]]}, {x, xs}];
      plot = ListLinePlot[{sdC, hyC, {{0., s["floor_dBm"]}, {0.9, s["floor_dBm"]}}},
        PlotStyle -> {Darker[Cyan], Directive[Orange, Dashed], Directive[Gray, Dotted]}, Frame -> True,
        FrameLabel -> {"r/R (0 = centre, 0.9 = near the wall)", probe <> " reading (dBm)"},
        PlotLegends -> {"standard (leak)", "EED (HYP)", "noise floor"},
        PlotLabel -> "The discriminating measurement: reading from centre to wall", ImageSize -> 520],
      xs = 10.^Range[Log10[0.05], Log10[50.], (Log10[50.] - Log10[0.05])/30.];
      sdC = Table[{Log10[d], Replace[fx1Compute[Join[p, <|"d" -> d|>]]["probes"][probe]["ext_std"]["dBm"], Null -> Missing[]]}, {d, xs}];
      hyC = Table[{Log10[d], Replace[fx1Compute[Join[p, <|"d" -> d|>]]["probes"][probe]["ext_hyp"]["dBm"], Null -> Missing[]]}, {d, xs}];
      plot = ListLinePlot[{sdC, hyC, {{Log10[0.05], s["floor_dBm"]}, {Log10[50.], s["floor_dBm"]}}},
        PlotStyle -> {Darker[Cyan], Directive[Orange, Dashed], Directive[Gray, Dotted]}, Frame -> True,
        FrameLabel -> {"log10(distance from surface / m)", probe <> " reading (dBm)"},
        PlotLegends -> {"standard", "EED carry-over (HYP)", "noise floor"}, PlotLabel -> "Reading vs distance outside the sphere", ImageSize -> 520]];
    intRows = Table[With[{sx = fx1Compute[Join[p, <|"rR" -> x|>]]},
        Join[{x}, Flatten[Table[{cellF[sx["probes"][q]["int_std"]], cellF[sx["probes"][q]["int_hyp"]]}, {q, fx1Probes}]]]],
      {x, FX1Const["interior_grid_rR"]}];
    extRows = Table[With[{sx = fx1Compute[Join[p, <|"d" -> dp["d"]|>]]},
        Join[{dp["label"], sx["exterior"]["model"]}, Flatten[Table[{cellF[sx["probes"][q]["ext_std"]], cellF[sx["probes"][q]["ext_hyp"]]}, {q, fx1Probes}]]]],
      {dp, fx1DistancePresets[f]}];
    gset = First[FX1Const["openems"]["exterior"]]; sc = fx1OemsScale[pd];
    oemsRows = Table[With[{sx = fx1Compute[Join[p, <|"f" -> gset["f_Hz"], "R" -> gset["R_m"], "gap" -> gset["gap_m"], "counterpoise" -> True, "d" -> d|>]]},
        {d, ScientificForm[sx["exterior"]["O"]["E"], 3], ScientificForm[sx["exterior"]["B"]["E"], 3],
         NumberForm[sx["exterior"]["B"]["E"]/sx["exterior"]["O"]["E"], {Infinity, 2}], ScientificForm[sx["exterior"]["O"]["B"], 3],
         fmt[sx["probes"]["E5"]["ext_std_O"]["dBm"]], fmt[sx["probes"]["E5"]["ext_std_B"]["dBm"]]}],
      {d, Join[gset["d_m"], gset["ff_r_m"] - gset["R_m"]]}];
    seamRows = Flatten[Table[
        Join[{If[dir === "eq", FX1Const["openems"]["interior"]["cases"][c]["label"], ""], If[dir === "eq", "toward seam", "vertical axis"]},
          Table[With[{o = fx1OemsInterior[c, dir, x, sc]}, Row[{ScientificForm[o["E"], 2], If[o["unresolved"], " U", ""]}]], {x, FX1Const["interior_grid_rR"]}]],
        {c, Keys[FX1Const["openems"]["interior"]["cases"]]}, {dir, {"eq", "axis"}}], 1];
    tabs = {
      "How it works" -> Column[{
         Row[{"1. Field at the probe: ", If[FX1Const["probe_kind"][probe] === "E",
            ScientificForm[If[loc === "inside", s["interior"]["E_leak"], s["exterior"][s["exterior"]["model"]]["E"]], 3] <> " V/m",
            ScientificForm[If[loc === "inside", s["interior"]["B_leak"], s["exterior"][s["exterior"]["model"]]["B"]], 3] <> " T"]}],
         Row[{"2. Probe factor K(f) for ", probe, ": ", fmt[s["probes"][probe]["K"]], " dBm at 1 V/m (E5) or 1 \[Micro]T (H probes)"}],
         Row[{"3. Probe output on the TinySA: ", fmt[h["std"]["dBm"]], " dBm"}],
         Row[{"4. Noise floor at RBW ", rbw, " Hz: ", NumberForm[s["floor_dBm"], {Infinity, 1}], " dBm \[RightArrow] SNR = output \[Minus] floor"}],
         Style["Words: f = frequency (oscillations per second); \[Lambda] = wavelength = c/f; \[CapitalOmega] = 2\[Pi]f (angular frequency); k = 2\[Pi]/\[Lambda] (wavenumber, phase advance per metre); R = sphere radius; r = distance from the centre; r/R = position as a fraction (0 centre, 1 wall); d = distance from the surface; kR = sphere size in wave units; V0 = peak voltage on the shell (page: \[Sqrt](2\[CenterDot]50 \[CapitalOmega]\[CenterDot]P)); dBm = power in decibels relative to 1 mW; RBW = resolution bandwidth of the analyser; probe factor = dBm out per 1 V/m or 1 \[Micro]T; SNR = signal \[Minus] noise floor in dB; PEC = perfect conductor; FDTD = finite-difference time-domain (openEMS).", 10]}],
      "Standard vs EED" -> Column[{
         Style["Inside: standard physics (FACT) = zero for a sealed shell; leakage through a seam gap is finite at the centre and strongest next to the gap, with B \[NotEqual] 0 near the slot. EED (HYP) = E_r(r) = V0 R [sin kr \[Minus] kr cos kr]/(r\.b2 sin kR): zero at the centre, rising to the wall, the same in every direction, B = 0. Outside, both predict a signal (not discriminating).", 10],
         Style["Interior r/R table (STD | HYP per probe, dBm (SNR))", Bold],
         Grid[Prepend[intRows, Join[{"r/R"}, Flatten[Table[{q <> " STD", q <> " HYP"}, {q, fx1Probes}]]]], Frame -> All, BaseStyle -> 9],
         Style["Exterior table (model, STD | HYP per probe)", Bold],
         Grid[Prepend[extRows, Join[{"distance", "model"}, Flatten[Table[{q <> " STD", q <> " HYP"}, {q, fx1Probes}]]]], Frame -> All, BaseStyle -> 9]}],
      "openEMS cross-check" -> Column[{
         Row[{"Page geometry ", gset["results_key"], ": Zin \[TildeTilde] ", NumberForm[gset["Zin_re"], {Infinity, 1}], " ", NumberForm[gset["Zin_im"], {Infinity, 1}], "j \[CapitalOmega], S11 ",
           NumberForm[gset["S11_dB"], {Infinity, 2}], " dB, accepted ", NumberForm[10.^6 gset["P_acc_W_at_Pref"], {Infinity, 0}], " \[Micro]W at +2 dBm; table scale \[Times]", NumberForm[sc, 4]}],
         Grid[Prepend[oemsRows, {"d (m)", "openEMS |E|", "analytic B |E|", "B/openEMS", "openEMS |B| (T)", "E5 openEMS dBm", "E5 analytic B dBm"}], Frame -> All, BaseStyle -> 9],
         Style["Interior seam leakage |E| (V/m) at the current drive; U = within 2 cells of the slot mouth (unresolved). FACT but order-of-magnitude (PEC walls, stair-stepped, not converged).", 9],
         Grid[Prepend[seamRows, Join[{"seam", "direction"}, ("r/R=" <> ToString[#]) & /@ FX1Const["interior_grid_rR"]]], Frame -> All, BaseStyle -> 9],
         Row[{"Plots: ", Hyperlink["fields vs distance (10 mm vs 200 mm)", "https://9wzg44nz44-glitch.github.io/img/fx1/fields_vs_distance_gap10_vs_gap200_433MHz.png"], " \[CenterDot] ",
           Hyperlink["interior leakage", "https://9wzg44nz44-glitch.github.io/img/fx1/interior_leakage_433MHz.png"]}]}],
      "Assumptions & open questions" -> Style[Column[{
         "\[Bullet] V0 = \[Sqrt](2\[CenterDot]50\[CenterDot]P) (page) sets the EED amplitude; openEMS feed port sees 0.776 V pk at +2 dBm (mismatched wire feed, ~151 \[Micro]W accepted).",
         "\[Bullet] Exterior default: openEMS 2.5 mm mesh, \[PlusMinus]15% (not converged); log-log interpolation; 1/r beyond 10 m; analytic below 5 cm.",
         "\[Bullet] Analytic Model B reads 2.3\[Dash]5\[Times] high at 433 MHz (up to ~7\[Times] in the far field); used only as comparison / fallback.",
         "\[Bullet] Seam default (ASSUMPTION): one 30 mm \[Times] 1 mm gap; slot runs used the 10 mm feed-gap geometry at equal available power (probably overestimates leakage ~2.5\[Dash]3\[Times]).",
         "\[Bullet] PEC walls; B samples ~1e-15 T on the axis are FDTD numerical noise (\[TildeTilde] 0).",
         "\[Bullet] Open: real seam bonding; inside TinySA perturbation; mesh convergence; lossy-wall FDTD; 200 mm geometry at 1296/2450 MHz."}], 10],
      "Sources" -> Style["future-scalar-ab.html#home-experiment and #eed (HYP); openEMS FDTD runs /workspace/sim-lab/fx1/openems (results.json); SleeveBalunSNR (snr-dual-sim-params-v0.2); Tekbox TBPS01 manual V2.2 pp.2\[Dash]3 / FAQ V1.1 p.2; tinysa.org TinySA4 spec; Ott 2009 ch.6; Balanis, Antenna Theory 3e \[Section]4.2.", 10],
      "Version & sync" -> Column[{Row[{"PhysicsVersion ", PhysicsVersion}], Style["Cloud twin pending sync (" <> PhysicsVersion <> ")", Darker[Orange]],
         "Single source of truth: physics-constants-fx1.json (FX1Const, incl. embedded openEMS tables). JS twin: https://9wzg44nz44-glitch.github.io/fx1-snr.html"}]};
    Column[{
      Row[{Style["FX-1: what should the probe read?  ", Bold, 15], Style[PhysicsVersion <> " \[CenterDot] Cloud twin pending sync (" <> PhysicsVersion <> ")", 9, Darker[Orange]]}],
      Style[h["headline"], 14, Bold],
      Style[h["meaning"], 11],
      Row[{Style["Standard physics: ", Darker[Cyan], Bold], If[h["std"]["dBm"] === Null, "noise floor only", Row[{NumberForm[h["std"]["dBm"], {Infinity, 1}], " dBm (", NumberForm[h["std"]["snr"], {Infinity, 1}], " dB)"}]],
        "   ", Style["EED hypothesis (HYP): ", Orange, Bold], If[h["hyp"]["dBm"] === Null, "nothing", Row[{NumberForm[h["hyp"]["dBm"], {Infinity, 1}], " dBm (", NumberForm[h["hyp"]["snr"], {Infinity, 1}], " dB)"}]]}],
      Style[If[loc === "inside", s["interior"]["leak"]["tag"], s["exterior"]["sel"]["tag"]], 9, Gray],
      plot,
      TabView[tabs, Dynamic[tab], ImageSize -> 760]
    }, Spacings -> 0.8]],
  Style["Main controls", Bold],
  {{loc, "inside", "1 \[CenterDot] Where is the probe?"}, {"inside" -> "Inside the sphere", "outside" -> "Outside the sphere"}, ControlType -> SetterBar},
  {{rR, 0.7, "2 \[CenterDot] Inside: r/R (0 = centre, 0.9 = near wall)"}, 0., 0.9, 0.05, Appearance -> "Labeled"},
  {{dsel, "bench_5cm", "2 \[CenterDot] Outside: distance from surface"}, {"bench_5cm" -> "5 cm", "bench_10cm" -> "10 cm", "bench_20cm" -> "20 cm",
     "bench_50cm" -> "50 cm", "bench_100cm" -> "1 m", "home_garage" -> "10 m", "home_outdoor" -> "50 m"}, ControlType -> SetterBar},
  {{seam, FX1Const["openems"]["seam_default"], "3 \[CenterDot] Seam quality"}, {"closed" -> "perfectly sealed", "arc_0p1x30" -> "tiny gap 0.1 \[Times] 30 mm",
     "arc_1x30" -> "small gap 1 \[Times] 30 mm", "ring_0p1" -> "hairline all round (0.1 mm)", "ring_1" -> "1 mm all round",
     "ring_1_m5" -> "1 mm all round (5 mm mesh)", "analytic" -> "v0.1 analytic seam"}, ControlType -> PopupMenu},
  {{drive, "tinysa_plus_zeenko", "4 \[CenterDot] Drive"}, {"tinysa_alone" -> "TinySA alone (\[Minus]19 dBm)", "tinysa_plus_zeenko" -> "TinySA + 21 dB amp (+2 dBm)", "custom" -> "custom"}, ControlType -> SetterBar},
  Delimiter,
  OpenerView[{Style["All controls", Bold], Column[{
    Control[{{probe, "E5", "headline probe"}, {"E5", "H10", "H20", "H5"}}],
    Control[{{fsel, 433590000., "frequency"}, {433590000. -> "433.59 MHz", 1296000000. -> "1296 MHz", 2450000000. -> "2450 MHz", "free" -> "free"}}],
    Control[{{ffree, 433.59, "free f (MHz)"}, 100., 3000.}],
    Control[{{pdbm, 2., "custom drive (dBm)"}, -40., 10., 1.}],
    Control[{{rsel, "bowls_11in", "radius"}, {"bowls_11in" -> "bowls R 0.14 m", "KB2016_2p5in" -> "KB-2016 2.5 in", "KB1820_0p75in" -> "KB-1820 0.75 in", "free" -> "free (mm)"}}],
    Control[{{rfree, 140., "free R (mm)"}, 5., 300.}],
    Control[{{intDir, "eq", "inside direction"}, {"eq" -> "toward seam", "axis" -> "vertical axis", "obl" -> "45\[Degree]"}}],
    Control[{{orient, "radial", "EED component"}, {"radial", "tangential"}}],
    Control[{{useFree, False, "use free distance"}, {True, False}}],
    Control[{{dfree, 30., "free d (cm)"}, 1., 10000.}],
    Control[{{extModel, "auto", "exterior model"}, {"auto" -> "auto (openEMS else B)", "O" -> "openEMS", "B" -> "analytic B", "A" -> "analytic A", "C" -> "analytic C"}}],
    Control[{{cp, True, "counterpoise"}, {True, False}}],
    Control[{{gapcm, 20., "gap to counterpoise (cm)"}, 1., 60., 1.}],
    Control[{{plim, True, "power-limit B/C"}, {True, False}}],
    Control[{{fsrc, "manual", "probe factor source"}, {"manual", "faq"}}],
    Control[{{rbw, 10000., "RBW (Hz)"}, {200., 1000., 3000., 10000., 30000., 100000., 300000., 600000., 850000.}}],
    Control[{{lna, False, "TinySA LNA"}, {True, False}}],
    Control[{{shellType, "solid", "shell"}, {"solid", "mesh"}}],
    Control[{{shellMat, "ss304", "metal (analytic)"}, {"ss304", "al3003", "copper"}}],
    Control[{{tw, 0.5, "wall (mm, analytic)"}, 0.1, 2.}],
    Control[{{seamL, 5., "analytic seam l (mm)"}, 0.5, 100.}],
    Control[{{seamN, 1, "analytic n gaps"}, 1, 20, 1}],
    Control[{{spreset, "open_air", "stack preset"}, {"open_air", "tents_slotted", "tents_sealed", "hdpe_block", "copper_wall", "steel_hull", "submarine", "expC_ohmic_sealed"}}],
    Control[{{atoy, 0.05, "\[Alpha]_toy (Np/m, HYP)"}, 0., 2.}],
    Control[{{cpath, 1., "cage path (m/tent)"}, 0.1, 5.}],
    Control[{{hdpecm, 5., "HDPE (cm)"}, 0.5, 30.}]}]}],
  {{tab, 1}, ControlType -> None},
  ControlPlacement -> Top, ContinuousAction -> False, SaveDefinitions -> True];
