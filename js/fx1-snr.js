/*! fx1-snr.js — PHYSICS_VERSION fx1-snr-v0.2 (GitHub ahead · Cloud twin pending sync)
 * FX-1 driven Faraday sphere: standard-physics (FACT forms + labelled ASSUMPTIONS) vs EED/SLW (HYP) predictions,
 * Tekbox TBPS01 probe (E5/H10/H20/H5) → TinySA Ultra dBm → SNR at chosen RBW.
 * v0.2: openEMS FDTD tables (engine.openems) are the default exterior model (page geometry) and the interior seam options.
 * Lockstep twin: Wolfram FX1SNR.wl (https://www.wolframcloud.com/obj/danbritton5/FX1SNR — publish pending).
 * Constants block below is GENERATED from physics-constants-fx1.json (gen_constants.mjs); check_constants.mjs asserts equality.
 * No invented equations: every formula is cited in physics-constants-fx1.json → formulas / labels.
 */
(function (root) {
  "use strict";

  /* BEGIN FX1 CONSTANTS (generated — do not edit by hand) */
  const K = {
   "PHYSICS_VERSION": "fx1-snr-v0.2",
   "C0": 299792458,
   "MU0": 0.0000012566370614359173,
   "EPS0": 8.854187817e-12,
   "Z0": 376.73031346177,
   "RL": 50,
   "freq_presets_Hz": {
    "f433": 433590000,
    "f1296": 1296000000,
    "f2450": 2450000000
   },
   "freq_free_min_Hz": 100000000,
   "freq_free_max_Hz": 3000000000,
   "drive": {
    "tinysa_gen_min_dBm": -115,
    "tinysa_gen_max_dBm": -19,
    "zeenko_gain_dB": 21,
    "presets_dBm": {
     "tinysa_alone": -19,
     "tinysa_plus_zeenko": 2
    },
    "default_dBm": 2
   },
   "radius_presets_m": {
    "bowls_11in": 0.14,
    "KB2016_2p5in": 0.03175,
    "KB1820_0p75in": 0.009525
   },
   "radius_default_shell": {
    "bowls_11in": "ss304",
    "KB2016_2p5in": "al3003",
    "KB1820_0p75in": "al3003"
   },
   "radius_default_seam": {
    "bowls_11in": true,
    "KB2016_2p5in": false,
    "KB1820_0p75in": false
   },
   "materials": {
    "ss304": {
     "sigma": 1388888.888888889,
     "mu_r": 1.02,
     "eps_r": 1,
     "tan_d": 0
    },
    "al3003": {
     "sigma": 24038461.538461536,
     "mu_r": 1,
     "eps_r": 1,
     "tan_d": 0
    },
    "copper": {
     "sigma": 58000000,
     "mu_r": 1,
     "eps_r": 1,
     "tan_d": 0
    },
    "steel": {
     "sigma": 5000000,
     "mu_r": 1,
     "eps_r": 1,
     "tan_d": 0
    },
    "seawater": {
     "sigma": 4,
     "mu_r": 1,
     "eps_r": 80,
     "tan_d": 0
    },
    "air": {
     "sigma": 1e-14,
     "mu_r": 1,
     "eps_r": 1.0006,
     "tan_d": 0
    },
    "hdpe": {
     "sigma": 0,
     "mu_r": 1,
     "eps_r": 2.29,
     "tan_d": 0.0005
    }
   },
   "shell": {
    "t_wall_default_m": 0.0005,
    "seam_gap_default_m": 0.005,
    "seam_n_default": 1,
    "mesh_SE": {
     "f_lo_Hz": 1000000000,
     "SE_lo_dB": 60,
     "f_hi_Hz": 1300000000,
     "SE_hi_dB": 50
    }
   },
   "counterpoise_gap_default_m": 0.2,
   "lineN": 400,
   "tents_att_dB": {
    "open": 0,
    "slotted": 25,
    "sealed": 55
   },
   "sub_len_m": {
    "copper_wall": 0.003175,
    "air_inside": 100.584,
    "steel_wall": 0.0762,
    "seawater_exit": 91.44,
    "ocean_air_toy": 1,
    "free_space": 0
   },
   "hdpe_t_default_m": 0.05,
   "ohmic": {
    "alpha_toy_default": 0.05,
    "cage_path_default_m": 1
   },
   "cavity_roots": {
    "TM101": 2.744,
    "TE101": 4.493
   },
   "hyp_resonance_flag_abs_sin_kR": 0.05,
   "probe_anchor_MHz": {
    "E5": [
     0.3,
     1,
     3,
     6,
     10,
     100,
     300,
     500,
     800,
     1100,
     1200,
     1300,
     1400,
     1700,
     2000,
     2500,
     3000
    ],
    "H20": [
     0.3,
     0.5,
     1,
     6,
     10,
     100,
     300,
     500,
     800,
     1100,
     1200,
     1300,
     1400,
     1700,
     2000
    ],
    "H10": [
     0.3,
     0.5,
     1,
     6,
     10,
     100,
     300,
     500,
     800,
     1100,
     1200,
     1300,
     1400,
     1700,
     2000,
     2500,
     3000
    ],
    "H5": [
     0.3,
     0.5,
     1,
     6,
     10,
     100,
     300,
     500,
     800,
     1100,
     1200,
     1300,
     1400,
     1700,
     2000,
     2500,
     3000
    ]
   },
   "probe_anchor_dBm": {
    "E5": [
     -120,
     -115,
     -104,
     -97,
     -93,
     -72,
     -62,
     -57,
     -54,
     -50,
     -49.8,
     -49,
     -48,
     -46,
     -46.5,
     -44.5,
     -45
    ],
    "H20": [
     -50,
     -45,
     -39,
     -23,
     -18.5,
     -3,
     1,
     -1,
     -4,
     -12,
     -20,
     -12,
     -10,
     0,
     5
    ],
    "H10": [
     -69,
     -63.5,
     -57,
     -42,
     -37,
     -18,
     -10,
     -6,
     -4,
     -4,
     -4,
     -4.5,
     -5,
     -5,
     -8,
     -10,
     -15
    ],
    "H5": [
     -90,
     -86,
     -80,
     -65,
     -60,
     -40,
     -30,
     -25,
     -21,
     -18,
     -18.5,
     -17,
     -15,
     -14,
     -13,
     -13,
     -14
    ]
   },
   "probe_ref": {
    "E5": 1,
    "H20": 0.000001,
    "H10": 0.000001,
    "H5": 0.000001
   },
   "probe_kind": {
    "E5": "E",
    "H20": "B",
    "H10": "B",
    "H5": "B"
   },
   "faq_v11": {
    "E5_scale": 112.5,
    "S": {
     "H20": 80,
     "H10": 62,
     "H5": 40
    },
    "f_max_MHz": 6000
   },
   "tinysa_floor": {
    "noLNA": {
     "lds_dBm": -102,
     "rbw_Hz": 30000
    },
    "LNA": {
     "lds_dBm": -145,
     "rbw_Hz": 200
    },
    "rbw_options_Hz": [
     200,
     1000,
     3000,
     10000,
     30000,
     100000,
     300000,
     600000,
     850000
    ],
    "rbw_default_Hz": 10000,
    "best_below_dBm": -25,
    "p1dB_dBm": -1,
    "abs_max_dBm": 6
   },
   "distances": {
    "bench_cm": [
     5,
     10,
     20,
     50,
     100
    ],
    "home_garage_m": 10,
    "home_outdoor_m": 50
   },
   "interior_grid_rR": [
    0,
    0.25,
    0.5,
    0.7,
    0.9
   ],
   "openems": {
    "P_ref_dBm": 2,
    "norm": "per_2dBm_available_50ohm",
    "match_tol": {
     "f_rel": 0.000001,
     "R_abs_m": 0.000001,
     "gap_abs_m": 0.000001
    },
    "ext_mesh_uncertainty_rel": 0.15,
    "exterior": [
     {
      "id": "gap200_433",
      "results_key": "433.59MHz_gap200mm",
      "reference_case": "gap200_r2p5",
      "f_Hz": 433590000,
      "R_m": 0.14,
      "gap_m": 0.2,
      "mesh": "2.5 mm cells near sphere (finest run; not converged: 5 mm vs 2.5 mm differ 12-17%)",
      "d_m": [
       0.05,
       0.1,
       0.2,
       0.5,
       1
      ],
      "E": [
       0.5183246759537693,
       0.41304045919127136,
       0.3091578196246085,
       0.16969770933840234,
       0.09113169524940214
      ],
      "B": [
       1.885958167338703e-9,
       1.5409193443162823e-9,
       1.1230295689269891e-9,
       5.769218412525017e-10,
       3.0511626009714716e-10
      ],
      "ff_r_m": [
       3,
       10
      ],
      "ff_E": [
       0.0315738304513311,
       0.009472149298980824
      ],
      "ff_B": [
       1.0531896186438119e-10,
       3.1595689104963486e-11
      ],
      "Zin_re": 352.8887344594165,
      "Zin_im": -760.7523927820674,
      "S11_dB": -0.43465866934182185,
      "P_acc_W_at_Pref": 0.0001509427805215738,
      "Vgap_pk_V_at_Pref": 0.775648146421041,
      "Dmax": 2.2005087178319807,
      "note": "page geometry: sphere bottom 200 mm above a 0.35 m square counterpoise, thin vertical feed wire, 10 mm port at the sheet"
     },
     {
      "id": "gap10_433",
      "results_key": "433.59MHz",
      "reference_case": "closed_pec_r2p5mm",
      "f_Hz": 433590000,
      "R_m": 0.14,
      "gap_m": 0.01,
      "mesh": "2.5 mm cells near sphere (finest run)",
      "d_m": [
       0.05,
       0.1,
       0.2,
       0.5,
       1
      ],
      "E": [
       1.586667627349717,
       1.2061500374422294,
       0.8363604502201342,
       0.42028096014564986,
       0.22884938073997393
      ],
      "B": [
       5.9947553649212115e-9,
       4.574040324219102e-9,
       2.9779769951096697e-9,
       1.414149817875557e-9,
       7.667630486107056e-10
      ],
      "ff_r_m": [
       3,
       10
      ],
      "ff_E": [
       0.08698890003077997,
       0.026096671433620742
      ],
      "ff_B": [
       2.901637373104962e-10,
       8.704912594439164e-11
      ],
      "Zin_re": 14.707105040341071,
      "Zin_im": 24.839703692967774,
      "S11_dB": -4.114853972024244,
      "P_acc_W_at_Pref": 0.0009704034993882005,
      "Vgap_pk_V_at_Pref": 0.3316124498828192,
      "Dmax": 1.8285344114895323,
      "note": "10 mm feed gap (sphere driven directly across a 10 mm port), closed PEC shell"
     },
     {
      "id": "gap10_1296",
      "results_key": "1.296GHz",
      "reference_case": "high_band_closed_r5mm",
      "f_Hz": 1296000000,
      "R_m": 0.14,
      "gap_m": 0.01,
      "mesh": "5 mm cells near sphere, compact domain (d <= 0.5 m usable)",
      "d_m": [
       0.05,
       0.1,
       0.2,
       0.5
      ],
      "E": [
       1.6490600019763026,
       1.2348923524600208,
       0.7455783547918369,
       0.28871404052363764
      ],
      "B": [
       4.906124289729775e-9,
       3.865879688231345e-9,
       2.3911413867134885e-9,
       9.49440944237666e-10
      ],
      "ff_r_m": [
       3,
       10
      ],
      "ff_E": [
       0.040416010537201945,
       0.0121248039356567
      ],
      "ff_B": [
       1.3481329986360747e-10,
       4.04439925425232e-11
      ],
      "Zin_re": 32.136278463084366,
      "Zin_im": 79.17260942391299,
      "S11_dB": -2.957181713827489,
      "P_acc_W_at_Pref": 0.0007826947237859563,
      "Vgap_pk_V_at_Pref": 0.5963563493799576,
      "Dmax": 5.33539305401527,
      "note": "10 mm feed gap geometry, closed PEC shell; NOT the page's 200 mm geometry"
     },
     {
      "id": "gap10_2450",
      "results_key": "2.45GHz",
      "reference_case": "high_band_closed_r5mm",
      "f_Hz": 2450000000,
      "R_m": 0.14,
      "gap_m": 0.01,
      "mesh": "5 mm cells near sphere, compact domain (d <= 0.5 m usable)",
      "d_m": [
       0.05,
       0.1,
       0.2,
       0.5
      ],
      "E": [
       1.1941176798619717,
       1.067469701165533,
       0.7967474477693274,
       0.3008024924188639
      ],
      "B": [
       3.746338310525965e-9,
       3.470738492185841e-9,
       2.624914820596074e-9,
       9.99780095268074e-10
      ],
      "ff_r_m": [
       3,
       10
      ],
      "ff_E": [
       0.04753504334157681,
       0.014260513623484362
      ],
      "ff_B": [
       1.585598372243801e-10,
       4.756795323878482e-11
      ],
      "Zin_re": 61.77394540525377,
      "Zin_im": 130.76347202160883,
      "S11_dB": -2.347020579643195,
      "P_acc_W_at_Pref": 0.0006616886301215084,
      "Vgap_pk_V_at_Pref": 0.6693745533367921,
      "Dmax": 3.1945838865861145,
      "note": "10 mm feed gap geometry, closed PEC shell; NOT the page's 200 mm geometry"
     }
    ],
    "interior": {
     "f_Hz": 433590000,
     "R_m": 0.14,
     "cases": {
      "closed": {
       "results_case": "closed_pec_r2p5mm",
       "description": "closed PEC shell, full domain, 2.5 mm cells near sphere (finest, REFERENCE for exterior[433.59MHz])",
       "eq": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0,
         0,
         0,
         0,
         0
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         0,
         0,
         0,
         0,
         0
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "axis": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0,
         0,
         0,
         0,
         0
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         0,
         0,
         0,
         0,
         0
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "obl": {
        "xE": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0,
         0,
         0,
         0,
         0
        ],
        "xB": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         0,
         0,
         0,
         0,
         0
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "label": "closed seam (fully bonded)",
       "mesh": "2.5 mm"
      },
      "ring_0p1": {
       "results_case": "ring_slot_0p1mm",
       "description": "full 360-deg equatorial seam slot, 0.1 mm high, compact domain",
       "eq": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.017251986680076496,
         0.01783972833667902,
         0.020604220688231586,
         0.029367859354822338,
         8.055726285239867
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.8928572142857114
        ],
        "B": [
         5.3594909279130575e-16,
         9.235252279210217e-12,
         1.8921270088067833e-11,
         2.7973853457184314e-11,
         5.290351872458034e-11
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         true
        ]
       },
       "axis": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.017251986680076496,
         0.015477268648079537,
         0.0115373229371246,
         0.008354046451784187,
         0.006184117259711823
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.892857142857143
        ],
        "B": [
         5.3594909279130575e-16,
         2.5137225219494346e-16,
         2.6737181616576086e-16,
         1.6184630638150847e-16,
         1.9556443681287719e-16
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "obl": {
        "xE": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.884063842463326
        ],
        "E": [
         0.017251986680076496,
         0.01652526739668605,
         0.01410830260136014,
         0.011019264751793371,
         0.008346006482182955
        ],
        "xB": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         5.3594909279130575e-16,
         6.15251008159067e-12,
         1.0291742613972772e-11,
         1.1226438332525613e-11,
         1.0511442049112692e-11
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "label": "hairline gap all round (0.1 mm ring slot)",
       "mesh": "5 mm, compact"
      },
      "ring_1": {
       "results_case": "ring_slot_1mm_r2p5mm",
       "description": "as ring_slot_1mm but 2.5 mm cells (model wall 3.75 mm thick instead of 7.5 mm): mesh / slot-depth sensitivity",
       "eq": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.23009825566527672,
         0.2369759860673116,
         0.2685196878523851,
         0.3582387516376418,
         1.1871799466919988
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         1.906341646303909e-15,
         1.2287429358060702e-10,
         2.5482371079513454e-10,
         3.8687100105168564e-10,
         6.501766984908059e-10
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "axis": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.23009825566527672,
         0.20779411267863404,
         0.15738956790235878,
         0.11530666563730593,
         0.08224088078705254
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         1.906341646303909e-15,
         3.3035591975939343e-16,
         6.160796596089336e-16,
         8.203628312088063e-16,
         5.790150146464252e-16
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "obl": {
        "xE": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.23009825566527672,
         0.2208260873565261,
         0.19035758474890477,
         0.15079002897639102,
         0.10597263576817915
        ],
        "xB": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         1.906341646303909e-15,
         8.197247110120411e-11,
         1.3918779842865592e-10,
         1.5429033379860028e-10,
         1.4194845496904313e-10
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "label": "1 mm gap all round (ring slot)",
       "mesh": "2.5 mm, compact"
      },
      "arc_1x30": {
       "results_case": "arc_slot_1mm_x30mm",
       "description": "30 mm long x 1.0 mm high equatorial slot at +x (local tape gap), compact domain",
       "eq": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.00017135061587944704,
         0.0003255533493119933,
         0.0007688317003046717,
         0.002434789542463447,
         0.26705973099746616
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.8928642856857144
        ],
        "B": [
         7.681894050166995e-13,
         1.471764392468963e-12,
         4.419854450352087e-12,
         2.0396129491153123e-11,
         2.6745722719436765e-10
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         true
        ]
       },
       "axis": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.00017135061587944704,
         0.00015561653017263918,
         0.00011814754853717393,
         0.0000855139879467782,
         0.00006151002008325171
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.892857142857143
        ],
        "B": [
         7.681894050166995e-13,
         7.220908966570989e-13,
         6.130929741282276e-13,
         5.149201946925792e-13,
         4.188400423900506e-13
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "obl": {
        "xE": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.884063842463326
        ],
        "E": [
         0.00017135061587944704,
         0.00024997118797060917,
         0.0003138043006672604,
         0.00030987791570579576,
         0.00026304480945496826
        ],
        "xB": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         7.681894050166995e-13,
         1.1154272098836617e-12,
         1.5357013058197925e-12,
         1.704039491951757e-12,
         1.6313029914053734e-12
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "label": "one 30 mm long, 1 mm gap in the tape",
       "mesh": "5 mm, compact"
      },
      "arc_0p1x30": {
       "results_case": "arc_slot_0p1mm_x30mm",
       "description": "30 mm long x 0.1 mm high equatorial slot at +x, compact domain",
       "eq": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.000020543383600510317,
         0.00003918366367327089,
         0.0000931225444253036,
         0.00029361177512386336,
         0.29607330789668684
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.8928572142857114
        ],
        "B": [
         9.245438094358235e-14,
         1.7654854927690885e-13,
         5.326828876988878e-13,
         2.4712057735262165e-12,
         3.173509701936638e-11
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         true
        ]
       },
       "axis": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.000020543383600510317,
         0.000018598493108515748,
         0.000014081483205429255,
         0.000010069825812176753,
         0.000007226694553285132
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.892857142857143
        ],
        "B": [
         9.245438094358235e-14,
         8.689208432542263e-14,
         7.370777928545264e-14,
         6.175333379242613e-14,
         5.002811767071994e-14
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "obl": {
        "xE": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.884063842463326
        ],
        "E": [
         0.000020543383600510317,
         0.00002998546808451322,
         0.00003769616786356943,
         0.00003715094693900095,
         0.00003146172418839303
        ],
        "xB": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         9.245438094358235e-14,
         1.3370760141485838e-13,
         1.8408407002206346e-13,
         2.0407679943981664e-13,
         1.9582946106770143e-13
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "label": "one 30 mm long hairline (0.1 mm) gap",
       "mesh": "5 mm, compact"
      },
      "ring_1_m5": {
       "results_case": "ring_slot_1mm",
       "description": "full 360-deg equatorial seam slot, 1.0 mm high (tape non-conducting), compact domain",
       "eq": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.14515302535685295,
         0.15001374463799594,
         0.17257254937222563,
         0.24474303906666622,
         7.570795980002428
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.8928642856857144
        ],
        "B": [
         1.4601115860831597e-15,
         7.792427711448704e-11,
         1.609997488027868e-10,
         2.420047365436371e-10,
         4.708796989650582e-10
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         true
        ]
       },
       "axis": {
        "xE": [
         0,
         0.25,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "E": [
         0.14515302535685295,
         0.13024652007580184,
         0.09711566880420991,
         0.07033140861027139,
         0.052066391063760056
        ],
        "xB": [
         0,
         0.25,
         0.5,
         0.7,
         0.892857142857143
        ],
        "B": [
         1.4601115860831597e-15,
         5.8275777687982e-16,
         4.417499620282764e-16,
         1.849782684453709e-16,
         3.5337716773574684e-16
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "obl": {
        "xE": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.884063842463326
        ],
        "E": [
         0.14515302535685295,
         0.13905108719078016,
         0.11872969754717189,
         0.09278316044493165,
         0.07029557586947886
        ],
        "xB": [
         0,
         0.24999999999999994,
         0.5,
         0.7,
         0.9000000000000001
        ],
        "B": [
         1.4601115860831597e-15,
         5.18671128942297e-11,
         8.700400089975666e-11,
         9.510523764285986e-11,
         8.91321017757433e-11
        ],
        "unresolved": [
         false,
         false,
         false,
         false,
         false
        ]
       },
       "label": "1 mm ring slot, coarser 5 mm mesh (sensitivity)",
       "mesh": "5 mm, compact"
      }
     }
    },
    "seam_options": [
     "closed",
     "arc_0p1x30",
     "arc_1x30",
     "ring_0p1",
     "ring_1",
     "ring_1_m5",
     "analytic"
    ],
    "seam_front_options": [
     "closed",
     "arc_0p1x30",
     "arc_1x30",
     "ring_0p1",
     "ring_1"
    ],
    "seam_default": "arc_1x30",
    "int_dir_default": "eq"
   }
  };
  /* END FX1 CONSTANTS */

  const PI = Math.PI;
  const DB_NP = 20 / Math.LN10; // 8.6858896… dB per neper (field)
  const log10 = Math.log10;

  function wFromDbm(d) { return Math.pow(10, (d - 30) / 10); }
  function dbmFromW(w) { return w > 0 ? 10 * log10(w * 1000) : -Infinity; }

  /* ---- minimal complex arithmetic ---- */
  function cx(re, im) { return { re: re, im: im || 0 }; }
  function cadd(a, b) { return cx(a.re + b.re, a.im + b.im); }
  function csub(a, b) { return cx(a.re - b.re, a.im - b.im); }
  function cmul(a, b) { return cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function cscale(a, s) { return cx(a.re * s, a.im * s); }
  function cdiv(a, b) { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function cabs(a) { return Math.hypot(a.re, a.im); }
  function csqrt(z) { // principal branch (same as Mathematica Sqrt)
    const r = Math.hypot(z.re, z.im);
    const a = Math.sqrt((r + z.re) / 2);
    let b = Math.sqrt(Math.max(0, (r - z.re) / 2));
    if (z.im < 0) b = -b;
    return cx(a, b);
  }
  function cexp(z) { const e = Math.exp(z.re); return cx(e * Math.cos(z.im), e * Math.sin(z.im)); }

  /* ---- drive (page: +2 dBm → ~0.4 V; −19 dBm → 35 mV) ---- */
  function drive(P_dBm) {
    const P = wFromDbm(P_dBm);
    return { P: P, V0: Math.sqrt(2 * K.RL * P), Ipk: Math.sqrt(2 * P / K.RL) };
  }

  /* ---- Schelkunoff slab SE (plane wave, normal incidence): A + R + B ---- */
  function layerSE(mat, t, f) {
    if (!(t > 0)) return { A: 0, R: 0, B: 0, SE: 0 };
    const w = 2 * PI * f;
    const mu = K.MU0 * mat.mu_r;
    const epsp = K.EPS0 * mat.eps_r;
    const sigt = mat.sigma + w * K.EPS0 * mat.eps_r * mat.tan_d;
    const g = csqrt(cx(-w * w * mu * epsp, w * mu * sigt));
    const eta = cdiv(cx(0, w * mu), g);
    const eta0 = cx(K.Z0, 0);
    const s = cadd(eta0, eta);
    const A = DB_NP * g.re * t;
    const R = 20 * log10(cabs(cmul(s, s)) / (4 * cabs(cmul(eta0, eta))));
    const G = cdiv(csub(eta0, eta), s);
    const e2 = cexp(cscale(g, -2 * t));
    const B = 20 * log10(cabs(csub(cx(1, 0), cmul(cmul(G, G), e2))));
    return { A: A, R: R, B: B, SE: A + R + B };
  }

  /* ---- seam / aperture (Ott 2009 §6.6) ---- */
  function seamSE(f, l, n) {
    const lam = K.C0 / f;
    if (!(l > 0) || l >= lam / 2) return 0;
    return Math.max(0, 20 * log10(lam / (2 * l)) - 10 * log10(Math.max(1, n)));
  }

  /* ---- RadioScreen mesh sphere: page catalog figures ---- */
  function meshSE(f) {
    const m = K.shell.mesh_SE;
    if (f <= m.f_lo_Hz) return { SE: m.SE_lo_dB, label: "FACT (page catalog ~60 dB below 1 GHz)" };
    if (f < m.f_hi_Hz) {
      const t = (f - m.f_lo_Hz) / (m.f_hi_Hz - m.f_lo_Hz);
      return { SE: m.SE_lo_dB + t * (m.SE_hi_dB - m.SE_lo_dB), label: "INTERPOLATED between page catalog points" };
    }
    if (f === m.f_hi_Hz) return { SE: m.SE_hi_dB, label: "FACT (page catalog ~50 dB at 1.3 GHz)" };
    return { SE: m.SE_hi_dB, label: "ASSUMPTION (not published above 1.3 GHz; held at 50 dB)" };
  }

  function shellSE(p, f) {
    if (p.shellType === "mesh") {
      const m = meshSE(f);
      return { wall: null, seam: null, SE: m.SE, label: m.label };
    }
    const wall = layerSE(K.materials[p.shellMat], p.tWall, f);
    const seam = p.seamOn ? seamSE(f, p.seamL, p.seamN) : Infinity;
    const sum = Math.pow(10, -wall.SE / 10) + (p.seamOn ? Math.pow(10, -seam / 10) : 0);
    const SE = sum > 0 ? -10 * log10(sum) : Infinity;
    return { wall: wall, seam: seam, SE: SE, label: p.seamOn ? "wall ⊕ seam (power sum)" : "wall only (no seam aperture)" };
  }

  /* ---- Tekbox probe factor K(f): dBm at ref field (1 V/m or 1 µT) ---- */
  function probeFactor(probe, f, src) {
    const F = f / 1e6;
    if (src === "faq") {
      if (F > K.faq_v11.f_max_MHz) return { K: null, label: "NOT_PUBLISHED" };
      if (probe === "E5") return { K: -K.faq_v11.E5_scale + 20 * log10(F), label: "FAQ_V1.1_FORMULA" };
      return { K: 20 * log10(K.probe_ref[probe]) + K.faq_v11.S[probe] + 20 * log10(F), label: "FAQ_V1.1_FORMULA" };
    }
    const xs = K.probe_anchor_MHz[probe], ys = K.probe_anchor_dBm[probe];
    const n = xs.length;
    if (F < xs[0] * (1 - 1e-12) || F > xs[n - 1] * (1 + 1e-12)) return { K: null, label: "NOT_PUBLISHED" };
    for (let i = 0; i < n; i++) {
      if (Math.abs(F - xs[i]) <= 1e-9 * xs[i]) return { K: ys[i], label: "DATA" };
    }
    for (let i = 0; i < n - 1; i++) {
      if (F > xs[i] && F < xs[i + 1]) {
        const t = (log10(F) - log10(xs[i])) / (log10(xs[i + 1]) - log10(xs[i]));
        return { K: ys[i] + t * (ys[i + 1] - ys[i]), label: "INTERPOLATED" };
      }
    }
    return { K: null, label: "NOT_PUBLISHED" };
  }

  function floorDbm(rbw, lna) {
    const r = lna ? K.tinysa_floor.LNA : K.tinysa_floor.noLNA;
    return r.lds_dBm + 10 * log10(rbw / r.rbw_Hz);
  }

  /* ---- HYP interior (page §EED, exactly) ---- */
  function ErHyp(V0, R, k, r) {
    if (!(r > 0)) return 0;
    const kr = k * r, sKR = Math.sin(k * R);
    if (kr < 1e-4) return V0 * R * k * k * k * r / (3 * sKR);
    return V0 * R * (Math.sin(kr) - kr * Math.cos(kr)) / (r * r * sKR);
  }

  /* ---- Hertzian element sum (Balanis Eq. 4-8/4-10), obs at (rho, z) ---- */
  function hertzSum(elems, rho, z, k) {
    let Erho = cx(0), Ez = cx(0), H = cx(0);
    for (let i = 0; i < elems.length; i++) {
      const zi = elems[i][0], Il = elems[i][1];
      const dz = z - zi;
      const Rr = Math.hypot(rho, dz);
      const ct = dz / Rr, st = rho / Rr, kr = k * Rr;
      const ph = cexp(cx(0, -kr));
      const fr = cx(1, -1 / kr);
      const fth = cx(1 - 1 / (kr * kr), -1 / kr);
      const Er = cscale(cmul(fr, ph), K.Z0 * Il * ct / (2 * PI * Rr * Rr));
      const Eth = cmul(cx(0, 1), cscale(cmul(fth, ph), K.Z0 * k * Il * st / (4 * PI * Rr)));
      const Hp = cmul(cx(0, 1), cscale(cmul(fr, ph), k * Il * st / (4 * PI * Rr)));
      Erho = cadd(Erho, cadd(cscale(Er, st), cscale(Eth, ct)));
      Ez = cadd(Ez, csub(cscale(Er, ct), cscale(Eth, st)));
      H = cadd(H, Hp);
    }
    return { E: Math.sqrt(cabs(Erho) * cabs(Erho) + cabs(Ez) * cabs(Ez)), B: K.MU0 * cabs(H) };
  }

  function exteriorStd(V0, R, f, hc, rc, counterpoise) {
    const w = 2 * PI * f, k = w / K.C0;
    const Q = 4 * PI * K.EPS0 * R * V0;
    const A = { E: V0 * R / (rc * rc), B: 0 };
    if (!counterpoise) return { Q: Q, A: A, B: null, C: null };
    const N = K.lineN, dz = 2 * hc / N, I0 = w * Q;
    const elems = [];
    for (let i = 0; i < N; i++) elems.push([-hc + (i + 0.5) * dz, I0 * dz]);
    const Bm = hertzSum(elems, rc, hc, k);
    const Cm = hertzSum([[0, w * Q * 2 * hc]], rc, hc, k);
    // radiated power of each model (image theory: real half-space power = full-space dipole power / 2)
    const L = 2 * hc;
    const PB = 0.5 * lineRadPowerFull(I0, L, k);
    const Il = w * Q * L;
    const PC = 0.5 * K.Z0 * PI / 3 * Math.pow(Il * k / (2 * PI), 2);
    Bm.Prad = PB; Cm.Prad = PC;
    return { Q: Q, A: A, B: Bm, C: Cm, I0: I0 };
  }

  /* uniform-current line of length L (full space): P = eta k^2 I^2 L^2/(32 pi^2) * 2pi * Int_0^pi sin^3(th) sinc^2(k L cos(th)/2) dth
     (far-field of a uniform line source; reduces to Balanis Eq. 4-16 for kL << 1). Midpoint rule, K.lineN*5 points. */
  function lineRadPowerFull(I, L, k) {
    const M = K.lineN * 5;
    let acc = 0;
    for (let i = 0; i < M; i++) {
      const th = (i + 0.5) * PI / M;
      const u = k * L * Math.cos(th) / 2;
      const sc = Math.abs(u) < 1e-12 ? 1 : Math.sin(u) / u;
      const sn = Math.sin(th);
      acc += sn * sn * sn * sc * sc;
    }
    acc *= PI / M;
    return K.Z0 * k * k * I * I * L * L / (32 * PI * PI) * 2 * PI * acc;
  }

  function powerLimit(fld, Pdrive, on) {
    if (!fld) return null;
    const s = (on && fld.Prad > Pdrive) ? Math.sqrt(Pdrive / fld.Prad) : 1;
    return { E: fld.E * s, B: fld.B * s, Prad: fld.Prad, scale: s, E_unscaled: fld.E, B_unscaled: fld.B };
  }


  /* ---- openEMS FACT data (v0.2) ---- */
  const TOL_X = 1e-9;
  function oemsDataset(p) {
    const o = K.openems, t = o.match_tol;
    if (!p.counterpoise) return null;
    for (let i = 0; i < o.exterior.length; i++) {
      const e = o.exterior[i];
      if (Math.abs(p.f - e.f_Hz) <= t.f_rel * e.f_Hz && Math.abs(p.R - e.R_m) <= t.R_abs_m && Math.abs(p.gap - e.gap_m) <= t.gap_abs_m) return e;
    }
    return null;
  }
  function oemsAnyAtFreq(f, R) { // datasets at this f/R regardless of gap (for the fallback hint)
    const o = K.openems, t = o.match_tol;
    return o.exterior.filter(function (e) { return Math.abs(f - e.f_Hz) <= t.f_rel * e.f_Hz && Math.abs(R - e.R_m) <= t.R_abs_m; });
  }
  function oemsScale(P_dBm) { return Math.pow(10, (P_dBm - K.openems.P_ref_dBm) / 20); }
  // log-log interpolation in distance (points sorted by d)
  function oemsExterior(e, R, d, s) {
    const pts = [];
    for (let i = 0; i < e.d_m.length; i++) pts.push([e.d_m[i], e.E[i], e.B[i]]);
    for (let i = 0; i < e.ff_r_m.length; i++) pts.push([e.ff_r_m[i] - R, e.ff_E[i], e.ff_B[i]]);
    pts.sort(function (a, b) { return a[0] - b[0]; });
    const n = pts.length;
    if (d < pts[0][0] * (1 - TOL_X)) return null;
    for (let i = 0; i < n; i++) if (Math.abs(d - pts[i][0]) <= TOL_X * pts[i][0]) return { E: pts[i][1] * s, B: pts[i][2] * s, how: "sample", id: e.id };
    if (d > pts[n - 1][0]) {
      const fr = (R + pts[n - 1][0]) / (R + d);
      return { E: pts[n - 1][1] * fr * s, B: pts[n - 1][2] * fr * s, how: "far-field 1/r beyond " + (R + pts[n - 1][0]).toFixed(0) + " m", id: e.id };
    }
    for (let i = 0; i < n - 1; i++) {
      if (d > pts[i][0] && d < pts[i + 1][0]) {
        const t = (Math.log(d) - Math.log(pts[i][0])) / (Math.log(pts[i + 1][0]) - Math.log(pts[i][0]));
        const E = Math.exp(Math.log(pts[i][1]) + t * (Math.log(pts[i + 1][1]) - Math.log(pts[i][1])));
        const B = Math.exp(Math.log(pts[i][2]) + t * (Math.log(pts[i + 1][2]) - Math.log(pts[i][2])));
        return { E: E * s, B: B * s, how: "log-log interpolation", id: e.id };
      }
    }
    return null;
  }
  function interpRR(xs, ys, x) {
    const n = xs.length;
    for (let i = 0; i < n; i++) if (Math.abs(x - xs[i]) <= TOL_X) return { v: ys[i], i0: i, i1: i };
    if (x <= xs[0]) return { v: ys[0], i0: 0, i1: 0 };
    if (x >= xs[n - 1]) return { v: ys[n - 1], i0: n - 1, i1: n - 1, clamped: true };
    for (let i = 0; i < n - 1; i++) {
      if (x > xs[i] && x < xs[i + 1]) {
        const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
        const v = (ys[i] > 0 && ys[i + 1] > 0) ? Math.exp(Math.log(ys[i]) + t * (Math.log(ys[i + 1]) - Math.log(ys[i]))) : ys[i] + t * (ys[i + 1] - ys[i]);
        return { v: v, i0: i, i1: i + 1 };
      }
    }
    return { v: ys[n - 1], i0: n - 1, i1: n - 1 };
  }
  function oemsInteriorApplies(p) {
    const I = K.openems.interior, t = K.openems.match_tol;
    return p.shellType !== "mesh" && Math.abs(p.f - I.f_Hz) <= t.f_rel * I.f_Hz && Math.abs(p.R - I.R_m) <= t.R_abs_m && !!I.cases[p.seam];
  }
  function oemsInterior(seam, dir, rR, s) {
    const c = K.openems.interior.cases[seam], q = c[dir];
    const e = interpRR(q.xE, q.E, rR), b = interpRR(q.xB, q.B, rR);
    const unres = !!(q.unresolved[e.i0] || q.unresolved[e.i1]);
    return { E: e.v * s, B: b.v * s, unresolved: unres, clamped: !!e.clamped, caseId: c.results_case, label: c.label, mesh: c.mesh };
  }

  /* ---- media stack (SleeveBalunSNR carry-over + FX-1 items) ---- */
  const STACK_ITEMS = [
    // id, material (standard), length key, label
    ["med_air", null, 0, "air (garage / cage interior) L=0"],
    ["med_copper", "copper", "copper_wall", "copper wall ⅛″"],
    ["med_air_inside", "air", "air_inside", "air inside sub 330 ft"],
    ["med_steel", "steel", "steel_wall", "steel hull 3″"],
    ["med_seawater", "seawater", "seawater_exit", "seawater exit 300 ft"],
    ["med_ocean_air", null, "ocean_air_toy", "ocean–air interface (TOY L=1 m)"],
    ["med_free_space", null, "free_space", "free-space"],
    ["med_hdpe", "hdpe", "HDPE", "HDPE block"]
  ];

  function stack(p, f) {
    const s = p.stack || {};
    let stdDb = 0, L = 0;
    const parts = [];
    STACK_ITEMS.forEach(function (it) {
      if (!s[it[0]]) return;
      const len = it[2] === "HDPE" ? p.hdpeT : (it[2] === 0 ? 0 : K.sub_len_m[it[2]]);
      L += len;
      if (it[1]) {
        const se = layerSE(K.materials[it[1]], len, f);
        stdDb += se.SE;
        parts.push(it[3] + ": std " + (Number.isFinite(se.SE) ? se.SE.toFixed(2) : "∞") + " dB");
      } else {
        parts.push(it[3] + ": std 0 dB (none defined)");
      }
    });
    const att = K.tents_att_dB[p.tents || "open"];
    stdDb += 2 * att;
    const mP = Math.pow(10, -2 * att / 10);
    let alphaL = 0;
    if (!p.errata) {
      alphaL = p.alphaToy * L;
      if (p.cageOhm) alphaL += p.alphaToy * 2 * p.cagePath;
      if (p.alphaExtra > 0 && p.Lextra > 0) alphaL += p.alphaExtra * p.Lextra;
    }
    return { stdDb: stdDb, att: att, mP: mP, L: L, alphaL: alphaL, surv: Math.exp(-alphaL), parts: parts };
  }

  function reading(dbm, floor) {
    if (dbm === null || !Number.isFinite(dbm)) return { dBm: null, snr: null, reading: floor, flag: "no signal → floor" };
    const rd = 10 * log10(Math.pow(10, dbm / 10) + Math.pow(10, floor / 10));
    let flag = "";
    if (dbm > K.tinysa_floor.abs_max_dBm) flag = "ABOVE ABS MAX +6 dBm";
    else if (dbm > K.tinysa_floor.p1dB_dBm) flag = "above P1dB (−1 dBm)";
    else if (dbm > K.tinysa_floor.best_below_dBm) flag = "above −25 dBm best-measurement level";
    return { dBm: dbm, snr: dbm - floor, reading: rd, flag: flag };
  }

  function probeDbm(pf, field, ref) {
    if (pf.K === null || !(field > 0)) return null;
    return pf.K + 20 * log10(field / ref);
  }

  const PROBES = ["E5", "H10", "H20", "H5"];

  function compute(p) {
    const f = p.f, lam = K.C0 / f, k = 2 * PI * f / K.C0, R = p.R;
    const dr = drive(p.P_dBm);
    const V0 = dr.V0;
    // interior
    const sh = shellSE(p.seam === "closed" ? Object.assign({}, p, { seamOn: false }) : p, f);
    const rI = p.rR * R;
    const Eref = V0 / R;
    const sO = oemsScale(p.P_dBm);
    let Eleak, Bleak, leak;
    if (oemsInteriorApplies(p)) {
      const o = oemsInterior(p.seam, p.intDir, p.rR, sO);
      Eleak = o.E; Bleak = o.B;
      leak = { src: "openEMS", caseId: o.caseId, label: o.label, mesh: o.mesh, unresolved: o.unresolved, clamped: o.clamped,
        tag: "FACT (openEMS, order-of-magnitude: PEC walls, stair-stepped, not converged)" };
    } else {
      Eleak = Number.isFinite(sh.SE) ? Eref * Math.pow(10, -sh.SE / 20) : 0;
      Bleak = Eleak / K.C0;
      leak = { src: "analytic", caseId: null, label: sh.label, mesh: null, unresolved: false, clamped: false,
        tag: p.seam === "analytic" ? "ASSUMPTION (v0.1 analytic wall + seam model, selected)" : "analytic only (no openEMS interior data for this frequency/radius/shell)" };
    }
    const ErS = ErHyp(V0, R, k, rI);
    const Ehyp = p.orient === "tangential" ? 0 : Math.abs(ErS);
    // exterior
    const hc = p.gap + R, rc = R + p.d;
    const ex0 = exteriorStd(V0, R, f, hc, rc, p.counterpoise);
    const ex = { Q: ex0.Q, I0: ex0.I0, A: ex0.A, B: powerLimit(ex0.B, dr.P, p.powerLimit), C: powerLimit(ex0.C, dr.P, p.powerLimit) };
    const ds = oemsDataset(p);
    ex.O = ds ? oemsExterior(ds, R, p.d, sO) : null;
    let selM = p.extModel;
    if (selM === "auto") selM = ex.O ? "O" : (ex.B ? "B" : "A");
    if (!ex[selM]) selM = ex.B ? "B" : "A";
    const others = oemsAnyAtFreq(f, R).filter(function (e) { return !ds || e.id !== ds.id; }).map(function (e) { return e.id; });
    const selInfo = { model: selM, dataset: ds ? ds.id : null, other_datasets: others,
      tag: selM === "O" ? "FACT (openEMS " + ds.id + ", ±" + Math.round(100 * K.openems.ext_mesh_uncertainty_rel) + "% mesh uncertainty)"
        : "analytic only — openEMS shows the analytic model reads high at 433 MHz (2.3–5×)" };
    const st = stack(p, f);
    const Ipk = dr.Ipk;
    const Prad = Ipk * Ipk * K.Z0 / (4 * PI);
    const Shyp = Prad / (4 * PI * rc * rc) * st.surv;
    const Epar = Math.sqrt(Shyp * K.Z0);
    const floor = floorDbm(p.rbw, p.lna);
    const probes = {};
    PROBES.forEach(function (pr) {
      const pf = probeFactor(pr, f, p.factorSrc);
      const ref = K.probe_ref[pr], isE = K.probe_kind[pr] === "E";
      const intStd = probeDbm(pf, isE ? Eleak : Bleak, ref);
      const intHyp = isE ? probeDbm(pf, Ehyp, ref) : null;
      const extStd = {};
      ["A", "B", "C", "O"].forEach(function (m) {
        const fld = ex[m];
        const v = fld ? probeDbm(pf, isE ? fld.E : fld.B, ref) : null;
        extStd[m] = v === null ? null : v - st.stdDb;
      });
      const extHypRaw = isE ? probeDbm(pf, Epar, ref) : null;
      const extHyp = extHypRaw === null ? null : extHypRaw + 10 * log10(st.mP);
      probes[pr] = {
        K: pf.K, label: pf.label,
        int_std: reading(intStd, floor), int_hyp: reading(intHyp, floor),
        ext_std: reading(extStd[selM], floor),
        ext_std_A: reading(extStd.A, floor), ext_std_B: reading(extStd.B, floor), ext_std_C: reading(extStd.C, floor), ext_std_O: reading(extStd.O, floor),
        ext_hyp: reading(extHyp, floor)
      };
    });
    const sKR = Math.sin(k * R);
    return {
      version: K.PHYSICS_VERSION, f: f, lam: lam, k: k, kR: k * R, P_W: dr.P, V0: V0, Ipk: Ipk, R: R,
      flags: {
        f_TM101_Hz: K.cavity_roots.TM101 * K.C0 / (2 * PI * R),
        f_TE101_Hz: K.cavity_roots.TE101 * K.C0 / (2 * PI * R),
        f_EED_Hz: K.C0 / (2 * R),
        hypResonance: Math.abs(sKR) < K.hyp_resonance_flag_abs_sin_kR,
        probeFitsInside: R >= 0.05,
        dipoleLen_over_lambda: 2 * hc / lam,
        kr_ext: k * rc
      },
      shell: sh,
      interior: { rR: p.rR, r: rI, E_ref: Eref, E_std_ideal: 0, B_std_ideal: 0, E_leak: Eleak, B_leak: Bleak, leak: leak, seam: p.seam, dir: p.intDir,
        E_hyp_signed: ErS, E_hyp: Ehyp, B_hyp: 0,
        ratio_hyp_dB: Ehyp > 0 ? 20 * log10(Ehyp / Eref) : null,
        ratio_leak_dB: Eleak > 0 ? 20 * log10(Eleak / Eref) : null },
      exterior: { d: p.d, rc: rc, hc: hc, Q: ex.Q, I0: ex.I0, A: ex.A, B: ex.B, C: ex.C, O: ex.O, model: selM, sel: selInfo, scale_openEMS: sO,
        ratio_B_over_O: (ex.O && ex.B) ? ex.B.E / ex.O.E : null, E_hyp: Epar, Prad: Prad, S_hyp: Shyp, P_drive: dr.P },
      stack: st, floor_dBm: floor, probes: probes
    };
  }

  function defaults() {
    return {
      f: K.freq_presets_Hz.f433, P_dBm: K.drive.default_dBm, R: K.radius_presets_m.bowls_11in,
      shellMat: "ss304", shellType: "solid", tWall: K.shell.t_wall_default_m,
      seamOn: true, seamL: K.shell.seam_gap_default_m, seamN: K.shell.seam_n_default,
      counterpoise: true, gap: K.counterpoise_gap_default_m, powerLimit: true,
      seam: K.openems.seam_default, intDir: K.openems.int_dir_default,
      rR: 0.7, orient: "radial", d: 0.05, extModel: "auto", factorSrc: "manual",
      rbw: K.tinysa_floor.rbw_default_Hz, lna: false,
      tents: "open", stack: { med_air: true }, hdpeT: K.hdpe_t_default_m,
      errata: true, alphaToy: K.ohmic.alpha_toy_default, cageOhm: false, cagePath: K.ohmic.cage_path_default_m,
      alphaExtra: 0, Lextra: 0
    };
  }

  function distancePresets(f) {
    const out = K.distances.bench_cm.map(function (cm) { return { id: "bench_" + cm + "cm", label: cm + " cm from wall", d: cm / 100 }; });
    out.push({ id: "near_far_lambda", label: "λ (near↔far, HYP/educational)", d: K.C0 / f });
    out.push({ id: "home_garage", label: "home garage 10 m", d: K.distances.home_garage_m });
    out.push({ id: "home_outdoor", label: "home outdoor 50 m", d: K.distances.home_outdoor_m });
    return out;
  }

  const STACK_PRESETS = {
    open_air: { label: "open air (no stack)", tents: "open", stack: { med_air: true }, errata: true, cageOhm: false },
    tents_slotted: { label: "two tents slotted (25 dB/tent)", tents: "slotted", stack: { med_air: true }, errata: true, cageOhm: false },
    tents_sealed: { label: "two tents sealed (55 dB/tent)", tents: "sealed", stack: { med_air: true }, errata: true, cageOhm: false },
    hdpe_block: { label: "HDPE block in path", tents: "open", stack: { med_air: true, med_hdpe: true }, errata: true, cageOhm: false },
    copper_wall: { label: "copper wall ⅛″", tents: "open", stack: { med_copper: true }, errata: true, cageOhm: false },
    steel_hull: { label: "steel hull 3″", tents: "open", stack: { med_steel: true }, errata: true, cageOhm: false },
    submarine: { label: "submarine stack (copper+air 330 ft+steel+seawater)", tents: "open", stack: { med_copper: true, med_air_inside: true, med_steel: true, med_seawater: true }, errata: true, cageOhm: false },
    expC_ohmic_sealed: { label: "Exp-C Ohmic HYP toy (α=0.05) + sealed tents + cage path", tents: "sealed", stack: { med_air: true }, errata: false, cageOhm: true }
  };

  const API = { K: K, compute: compute, defaults: defaults, distancePresets: distancePresets, probeFactor: probeFactor,
    oemsDataset: oemsDataset, oemsExterior: oemsExterior, oemsInterior: oemsInterior, oemsScale: oemsScale,
    floorDbm: floorDbm, layerSE: layerSE, seamSE: seamSE, meshSE: meshSE, ErHyp: ErHyp, PROBES: PROBES, STACK_PRESETS: STACK_PRESETS };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.FX1 = API;

  /* =================== UI (browser only) — v0.2 novice front + detail tabs =================== */
  if (typeof document === "undefined") return;
  const $ = function (id) { return document.getElementById(id); };
  function fe(x, d) { return (x === null || x === undefined || !Number.isFinite(x)) ? "—" : x.toExponential(d === undefined ? 2 : d); }
  function fn(x, d) { return (x === null || x === undefined || !Number.isFinite(x)) ? "—" : x.toFixed(d === undefined ? 1 : d); }
  function sgn(x, d) { return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(d === undefined ? 1 : d); }
  function dbm(x) { return (x === null || !Number.isFinite(x)) ? "—" : (x < 0 ? "−" : "") + Math.abs(x).toFixed(1) + " dBm"; }

  const D0 = defaults();
  const U = {
    loc: "inside", rR: D0.rR, distId: "bench_5cm", distCm: 30, distUseFree: false, seam: D0.seam, drive: "tinysa_plus_zeenko", pdbm: D0.P_dBm,
    freqSel: String(K.freq_presets_Hz.f433), freqMHz: 433.59, radSel: "bowls_11in", radMm: 140, shellType: "solid", shellMat: "ss304",
    tWallMm: D0.tWall * 1000, seamLmm: D0.seamL * 1000, seamN: D0.seamN, intDir: D0.intDir, orient: "radial", cpOn: true, gapCm: D0.gap * 100,
    extModel: "auto", powerLimit: true, probe: "E5", factorSrc: "manual", rbw: String(D0.rbw), lna: false,
    stackPreset: "open_air", tents: "open", stack: { med_air: true }, hdpeCm: D0.hdpeT * 100, errata: true, alphaToy: D0.alphaToy,
    cageOhm: false, cagePath: D0.cagePath, alphaExtra: 0, Lextra: 0
  };
  const NUMK = { rR: 1, distCm: 1, pdbm: 1, freqMHz: 1, radMm: 1, tWallMm: 1, seamLmm: 1, seamN: 1, gapCm: 1, hdpeCm: 1, alphaToy: 1, cagePath: 1, alphaExtra: 1, Lextra: 1 };
  const SEAM_TXT = { closed: "perfectly sealed seam", arc_0p1x30: "one tiny 0.1 mm × 30 mm gap", arc_1x30: "one small 1 mm × 30 mm gap",
    ring_0p1: "a hairline gap all round", ring_1: "a 1 mm gap all round", ring_1_m5: "a 1 mm gap all round (coarse mesh)", analytic: "the v0.1 analytic seam" };

  function params() {
    const p = defaults();
    p.f = U.freqSel === "free" ? U.freqMHz * 1e6 : +U.freqSel;
    p.P_dBm = U.drive === "custom" ? U.pdbm : K.drive.presets_dBm[U.drive];
    p.R = U.radSel === "free" ? U.radMm / 1000 : K.radius_presets_m[U.radSel];
    p.shellType = U.shellType; p.shellMat = U.shellMat; p.tWall = U.tWallMm / 1000;
    p.seam = U.seam; p.intDir = U.intDir; p.orient = U.orient;
    const ball = U.radSel === "KB2016_2p5in" || U.radSel === "KB1820_0p75in";
    p.seamOn = !ball && U.seam !== "closed"; p.seamL = U.seamLmm / 1000; p.seamN = U.seamN;
    p.counterpoise = U.cpOn; p.gap = U.gapCm / 100; p.powerLimit = U.powerLimit;
    p.rR = U.rR;
    if (U.distUseFree) p.d = U.distCm / 100;
    else { const dp = distancePresets(p.f).filter(function (x) { return x.id === U.distId; })[0]; p.d = dp ? dp.d : 0.05; }
    p.extModel = U.extModel; p.factorSrc = U.factorSrc; p.rbw = +U.rbw; p.lna = U.lna;
    p.tents = U.tents; p.stack = Object.assign({}, U.stack); p.hdpeT = U.hdpeCm / 100;
    p.errata = U.errata; p.alphaToy = U.alphaToy; p.cageOhm = U.cageOhm; p.cagePath = U.cagePath; p.alphaExtra = U.alphaExtra; p.Lextra = U.Lextra;
    return p;
  }

  function syncInputs() {
    document.querySelectorAll("[data-k]").forEach(function (el) {
      const k = el.getAttribute("data-k"); const v = U[k];
      if (el.type === "checkbox") el.checked = !!v; else if (String(el.value) !== String(v)) el.value = v;
    });
    document.querySelectorAll("[data-seg]").forEach(function (g) {
      const k = g.getAttribute("data-seg");
      g.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === String(U[k]) && !(k === "distId" && U.distUseFree))); });
    });
    STACK_ITEMS.forEach(function (it) { const el = $(it[0]); if (el) el.checked = !!U.stack[it[0]]; });
    $("ctlRR").hidden = U.loc !== "inside"; $("ctlDist").hidden = U.loc !== "outside";
    $("ctlSeam").style.opacity = U.loc === "inside" ? "1" : "0.55";
    const fs = $("fSeam");
    if (fs && !Array.prototype.some.call(fs.options, function (o) { return o.value === U.seam; })) fs.value = "";
  }

  function readingText(rd) {
    if (!rd || rd.dBm === null) return "no signal (noise floor only)";
    return dbm(rd.dBm) + " · " + (rd.snr >= 0 ? fn(rd.snr) + " dB above" : fn(-rd.snr) + " dB below") + " the noise floor";
  }
  function verdict(rd) {
    if (!rd || rd.dBm === null) return "nothing";
    if (rd.snr >= 10) return "clear";
    if (rd.snr >= 0) return "marginal";
    return "nothing";
  }

  function headline(p, s) {
    const pr = U.probe, P = s.probes[pr];
    const where = U.loc === "inside" ? "inside, at r/R = " + fn(p.rR, 2) : fn(p.d * 100, p.d < 1 ? 0 : 0) + " cm from the sphere";
    const whereTxt = U.loc === "inside" ? "inside the sphere at r/R = " + fn(p.rR, 2) : (p.d >= 1 ? fn(p.d, 0) + " m" : fn(p.d * 100, 0) + " cm") + " from the sphere's surface";
    const std = U.loc === "inside" ? P.int_std : P.ext_std, hyp = U.loc === "inside" ? P.int_hyp : P.ext_hyp;
    let hl, mean;
    if (U.loc === "inside") {
      hl = "Expected reading on the <strong>" + pr + "</strong> probe " + whereTxt + ": standard physics <strong>" + (std.dBm === null ? "nothing (noise floor)" : dbm(std.dBm) + ", " + (std.snr >= 0 ? fn(std.snr) + " dB above" : fn(-std.snr) + " dB below") + " the noise floor") + "</strong>; EED <span class=\"hy\">" + (hyp.dBm === null ? "nothing" : dbm(hyp.dBm) + " (" + sgn(hyp.snr) + " dB)") + "</span>.";
      const vs = verdict(std), vh = verdict(hyp);
      if (vh === "clear" && vs !== "clear") mean = "What this means: with " + SEAM_TXT[p.seam] + ", ordinary leakage should be " + (vs === "nothing" ? "invisible" : "barely visible") + " here, so a clear peak that grows from zero at the centre toward the wall would favour EED.";
      else if (vh === "clear" && vs === "clear") mean = "What this means: with " + SEAM_TXT[p.seam] + ", ordinary leakage is also visible, so the reading alone can't decide. Use the shape: EED is zero at the centre and the same in every direction, while leakage is strongest toward the seam.";
      else if (vh === "nothing" && pr !== "E5") mean = "What this means: EED predicts no magnetic field (B = 0), so an H probe signal inside can only be ordinary leakage.";
      else if (vh === "nothing" && vs !== "nothing") mean = "What this means: EED predicts zero at the exact centre, while the leakage through " + SEAM_TXT[p.seam] + " is already there. A signal at the centre means leakage.";
      else if (vh === "nothing") mean = "What this means: both predict nothing at this spot. Move the probe toward the wall (r/R ≈ 0.7) where EED predicts its largest signal.";
      else mean = "What this means: neither prediction is clearly above the noise here. Try the amplifier, a narrower RBW, or a spot nearer the wall.";
    } else {
      hl = "Expected reading on the <strong>" + pr + "</strong> probe " + whereTxt + ": <strong>" + readingText(std) + "</strong>.";
      mean = verdict(std) === "clear" ? "What this means: the driven sphere radiates like a small antenna, so the outside probe should see an ordinary signal. This checks the drive and probe chain; it does not test EED."
        : "What this means: at this distance the ordinary signal is " + (verdict(std) === "marginal" ? "near" : "below") + " the analyser's noise, so expect little or nothing. Move closer, add the amplifier, or narrow the RBW.";
    }
    $("headline").innerHTML = hl;
    $("meaning").textContent = mean;
    $("stdVal").textContent = std.dBm === null ? "noise floor only" : dbm(std.dBm) + " (" + sgn(std.snr) + " dB)";
    $("hypVal").textContent = hyp.dBm === null ? "nothing (EED: zero here)" : dbm(hyp.dBm) + " (" + sgn(hyp.snr) + " dB)";
    if (U.loc === "inside") {
      const L = s.interior.leak;
      $("stdTag").textContent = L.src === "openEMS" ? "FACT, openEMS, order of magnitude" : "analytic only";
      $("stdNote").textContent = L.src === "openEMS" ? "Leakage through " + SEAM_TXT[p.seam] + (L.unresolved ? " · next to the slot: unresolved" : "") : L.tag;
      $("hypNote").textContent = pr === "E5" ? "EED radial field, V0 = " + fn(s.V0 * 1000, 0) + " mV peak on the shell" : "EED has B = 0, so H probes see nothing";
    } else {
      const sel = s.exterior.sel;
      $("stdTag").textContent = sel.model === "O" ? "FACT, openEMS ±15%" : "analytic only";
      $("stdNote").textContent = sel.model === "O" ? "openEMS simulation of the page geometry (" + (s.exterior.O ? s.exterior.O.how : "") + ")" : sel.tag;
      $("hypNote").textContent = "Sleeve SNR carry-over formula (illustrative)";
    }
    $("probeRow").innerHTML = "All probes here (standard / EED): " + PROBES.map(function (q) {
      const a = U.loc === "inside" ? s.probes[q].int_std : s.probes[q].ext_std, b = U.loc === "inside" ? s.probes[q].int_hyp : s.probes[q].ext_hyp;
      return "<span><b>" + q + "</b> " + (a.dBm === null ? "floor" : fn(a.dBm)) + " / " + (b.dBm === null ? "floor" : fn(b.dBm)) + "</span>";
    }).join("") + "<span>floor " + fn(s.floor_dBm) + " dBm @ RBW " + (+U.rbw >= 1000 ? (+U.rbw / 1000) + " kHz" : U.rbw + " Hz") + "</span>";
    return where;
  }

  function flags(p, s) {
    const w = [];
    if (s.flags.hypResonance) w.push("kR is near π: the EED formula has a resonance here (numbers blow up). HYP.");
    if (!s.flags.probeFitsInside && U.loc === "inside") w.push("This sphere is too small to hold the probe and a TinySA; inside numbers are for illustration only.");
    if (U.loc === "outside" && s.exterior.sel.model !== "O") w.push("Outside: " + s.exterior.sel.tag + (s.exterior.sel.other_datasets.length ? ". openEMS data exist at this frequency for the 10 mm feed-gap geometry. Set gap = 1 cm in All controls to use them." : "."));
    if (U.loc === "inside" && s.interior.leak.src !== "openEMS") w.push("Inside: " + s.interior.leak.tag + ".");
    PROBES.forEach(function (q) { const r = U.loc === "inside" ? s.probes[q].int_std : s.probes[q].ext_std; if (r.flag) w.push(q + ": " + r.flag); });
    if (s.probes[U.probe].K === null) w.push(U.probe + " probe factor is not published at this frequency.");
    $("flags").innerHTML = w.length ? "<ul>" + w.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" : "";
  }

  /* ---------- plots ---------- */
  function canvas(id) {
    const c = $(id); if (!c || !c.getContext) return null;
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth || 600, h = c.clientHeight || 300;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const x = c.getContext("2d"); if (!x) return null;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    return { x: x, w: w, h: h, L: 52, Rm: 12, T: 14, B: 34 };
  }
  function yv(g, v, mn, mx) { return g.T + (1 - (v - mn) / (mx - mn)) * (g.h - g.T - g.B); }
  function xv(g, t) { return g.L + t * (g.w - g.L - g.Rm); }
  function frame(g, mn, mx, xl, yl, xt) {
    const x = g.x; x.strokeStyle = "#334"; x.fillStyle = "#9fb0cc"; x.font = "11px sans-serif"; x.lineWidth = 1;
    for (let v = Math.ceil(mn / 20) * 20; v <= mx; v += 20) { const y = yv(g, v, mn, mx); x.beginPath(); x.moveTo(g.L, y); x.lineTo(g.w - g.Rm, y); x.stroke(); x.fillText(String(v), 8, y + 4); }
    (xt || []).forEach(function (t) { x.fillText(t[1], xv(g, t[0]) - 10, g.h - 18); });
    x.fillText(xl, g.L, g.h - 4); x.save(); x.translate(12, g.T + 60); x.restore(); x.fillText(yl, g.L + 4, g.T + 10);
  }
  function curve(g, ts, ys, mn, mx, col, dash, wid) {
    const x = g.x; x.strokeStyle = col; x.lineWidth = wid || 2.2; x.setLineDash(dash || []); x.beginPath(); let on = false;
    for (let i = 0; i < ts.length; i++) { const v = ys[i]; if (v === null || !Number.isFinite(v)) { on = false; continue; } const X = xv(g, ts[i]), Y = yv(g, Math.max(mn, Math.min(mx, v)), mn, mx); if (!on) { x.moveTo(X, Y); on = true; } else x.lineTo(X, Y); }
    x.stroke(); x.setLineDash([]);
  }
  function dot(g, t, v, mn, mx, col) { if (v === null || !Number.isFinite(v)) return; const x = g.x; x.fillStyle = col; x.beginPath(); x.arc(xv(g, t), yv(g, Math.max(mn, Math.min(mx, v)), mn, mx), 5, 0, 2 * PI); x.fill(); }
  function legend(g, items) { const x = g.x; x.font = "12px sans-serif"; let X = g.L + 8; items.forEach(function (it) { x.fillStyle = it[1]; x.fillRect(X, g.T + 18, 14, 3); x.fillStyle = "#d7e0f2"; x.fillText(it[0], X + 18, g.T + 23); X += x.measureText(it[0]).width + 34; }); }

  function plotFront(p, s) {
    const g = canvas("plotFront"); if (!g) return;
    const pr = U.probe;
    if (U.loc === "inside") {
      const ts = [], sd = [], hy = [];
      for (let i = 0; i <= 90; i++) { const x = i / 100; const q = Object.assign({}, p, { rR: x }); const r = compute(q); ts.push(x / 0.9); sd.push(r.probes[pr].int_std.dBm); hy.push(r.probes[pr].int_hyp.dBm); }
      const all = sd.concat(hy, [s.floor_dBm]).filter(function (v) { return v !== null && Number.isFinite(v); });
      const mx = Math.ceil((Math.max.apply(null, all) + 8) / 10) * 10, mn = Math.max(mx - 120, Math.floor((Math.min.apply(null, all) - 8) / 10) * 10);
      frame(g, mn, mx, "r/R: centre 0 → 0.9 (near the wall)", pr + " reading, dBm", [[0, "0"], [0.25 / 0.9, "0.25"], [0.5 / 0.9, "0.5"], [0.7 / 0.9, "0.7"], [1, "0.9"]]);
      curve(g, ts, ts.map(function () { return s.floor_dBm; }), mn, mx, "#8899aa", [3, 4], 1.5);
      curve(g, ts, sd, mn, mx, "#55d6be");
      curve(g, ts, hy, mn, mx, "#ffb86b", [7, 4]);
      dot(g, p.rR / 0.9, s.probes[pr].int_std.dBm, mn, mx, "#55d6be"); dot(g, p.rR / 0.9, s.probes[pr].int_hyp.dBm, mn, mx, "#ffb86b");
      legend(g, [["standard (leak)", "#55d6be"], ["EED (HYP)", "#ffb86b"], ["noise floor", "#8899aa"]]);
      $("plotTitle").textContent = "The discriminating measurement: reading from centre to wall";
      $("plotCap").innerHTML = "Orange dashed = EED: zero at the centre, rising toward the wall, the same in every direction" + (pr !== "E5" ? " (H probes: EED has B = 0, so no orange curve)" : "") + ". Teal = ordinary leakage through " + SEAM_TXT[p.seam] + (p.seam === "closed" ? ": exactly zero, so no curve" : ": already present at the centre and strongest next to the seam") + ". Grey dotted = TinySA noise floor. Dots = your probe position.";
    } else {
      const ts = [], sd = [], hy = [], lo = Math.log10(0.05), hi = Math.log10(50);
      for (let i = 0; i <= 80; i++) { const t = i / 80, d = Math.pow(10, lo + t * (hi - lo)); const r = compute(Object.assign({}, p, { d: d })); ts.push(t); sd.push(r.probes[pr].ext_std.dBm); hy.push(r.probes[pr].ext_hyp.dBm); }
      const all = sd.concat(hy, [s.floor_dBm]).filter(function (v) { return v !== null && Number.isFinite(v); });
      const mx = Math.ceil((Math.max.apply(null, all) + 8) / 10) * 10, mn = Math.floor((Math.min.apply(null, all) - 8) / 10) * 10;
      const tk = function (d) { return (Math.log10(d) - lo) / (hi - lo); };
      frame(g, mn, mx, "distance from surface (log scale)", pr + " reading, dBm", [[tk(0.05), "5cm"], [tk(0.2), "20cm"], [tk(1), "1m"], [tk(10), "10m"], [tk(50), "50m"]]);
      curve(g, ts, ts.map(function () { return s.floor_dBm; }), mn, mx, "#8899aa", [3, 4], 1.5);
      if (s.exterior.sel.model === "O") { const u = K.openems.ext_mesh_uncertainty_rel; curve(g, ts, sd.map(function (v) { return v === null ? null : v + 20 * log10(1 + u); }), mn, mx, "rgba(85,214,190,.35)", [], 1); curve(g, ts, sd.map(function (v) { return v === null ? null : v + 20 * log10(1 - u); }), mn, mx, "rgba(85,214,190,.35)", [], 1); }
      curve(g, ts, sd, mn, mx, "#55d6be"); curve(g, ts, hy, mn, mx, "#ffb86b", [7, 4]);
      dot(g, tk(Math.max(0.05, Math.min(50, p.d))), s.probes[pr].ext_std.dBm, mn, mx, "#55d6be");
      legend(g, [["standard", "#55d6be"], ["EED carry-over (HYP)", "#ffb86b"], ["noise floor", "#8899aa"]]);
      $("plotTitle").textContent = "Reading vs distance outside the sphere";
      $("plotCap").innerHTML = "Teal = " + (s.exterior.sel.model === "O" ? "openEMS simulation of the page geometry (thin lines = ±15% mesh uncertainty)" : "analytic model (" + s.exterior.sel.tag + ")") + ". Orange dashed = EED carry-over (illustrative). Grey dotted = noise floor. Beyond 10 m the openEMS far field is extended as 1/distance.";
    }
  }

  /* ---------- detail tables ---------- */
  function cell(rd, hyp) {
    if (!rd || rd.dBm === null) return "<td class=\"dim " + (hyp ? "hypc" : "stdc") + "\">floor</td>";
    return "<td class=\"" + (hyp ? "hypc" : "stdc") + "\">" + fn(rd.dBm) + " (" + fn(rd.snr) + ")" + (rd.flag ? " <span class=\"warn\">!</span>" : "") + "</td>";
  }
  function tables(p, s) {
    let h = "<thead><tr><th>probe</th>";
    K.interior_grid_rR.forEach(function (x) { h += "<th>STD r/R=" + x + "</th><th>HYP r/R=" + x + "</th>"; });
    h += "</tr></thead><tbody>";
    const rows = K.interior_grid_rR.map(function (x) { return compute(Object.assign({}, p, { rR: x })); });
    PROBES.forEach(function (q) { h += "<tr><td>" + q + "</td>"; rows.forEach(function (r) { h += cell(r.probes[q].int_std, false) + cell(r.probes[q].int_hyp, true); }); h += "</tr>"; });
    $("tblInt").innerHTML = h + "</tbody>";
    let e = "<thead><tr><th>distance</th><th>model</th>";
    PROBES.forEach(function (q) { e += "<th>" + q + " STD</th><th>" + q + " HYP</th>"; });
    e += "</tr></thead><tbody>";
    distancePresets(p.f).forEach(function (dp) {
      const r = compute(Object.assign({}, p, { d: dp.d }));
      e += "<tr><td>" + dp.label + "</td><td>" + r.exterior.model + "</td>";
      PROBES.forEach(function (q) { e += cell(r.probes[q].ext_std, false) + cell(r.probes[q].ext_hyp, true); });
      e += "</tr>";
    });
    $("tblExt").innerHTML = e + "</tbody>";
    $("floorOut").textContent = "Noise floor " + fn(s.floor_dBm) + " dBm (RBW " + U.rbw + " Hz" + (U.lna ? ", LNA" : "") + ") · drive " + fn(p.P_dBm, 0) + " dBm → V0 " + fn(s.V0 * 1000, 1) + " mV · f " + fn(p.f / 1e6, 2) + " MHz, λ " + fn(s.lam, 3) + " m, k " + fn(s.k, 3) + " rad/m, kR " + fn(s.kR, 3) + " · stack std " + fn(s.stack.stdDb, 1) + " dB";
    const sh = s.shell;
    $("detailOut").innerHTML = "<p>Inside leak source: <b>" + s.interior.leak.src + "</b> — " + s.interior.leak.tag + (s.interior.leak.caseId ? " (openEMS case <code>" + s.interior.leak.caseId + "</code>, " + s.interior.leak.mesh + " mesh)" : "") + ". Analytic shell SE " + (Number.isFinite(sh.SE) ? fn(sh.SE, 1) + " dB" : "∞") + " (" + sh.label + ").</p>" +
      "<p>Outside model: <b>" + s.exterior.model + "</b> — " + s.exterior.sel.tag + ". Analytic B / openEMS at this distance: " + (s.exterior.ratio_B_over_O ? fn(s.exterior.ratio_B_over_O, 2) + "×" : "—") + ".</p>";
    // shape table (Standard vs EED tab)
    let t = "<thead><tr><th>r/R</th><th>EED E_r (V/m)</th>";
    ["eq", "axis"].forEach(function (d) { t += "<th>leak |E| " + (d === "eq" ? "toward seam" : "vertical axis") + " (V/m)</th><th>leak |B| " + (d === "eq" ? "toward seam" : "axis") + " (T)</th>"; });
    t += "</tr></thead><tbody>";
    K.interior_grid_rR.forEach(function (x) {
      const r1 = compute(Object.assign({}, p, { rR: x, intDir: "eq" })), r2 = compute(Object.assign({}, p, { rR: x, intDir: "axis" }));
      t += "<tr><td>" + x + "</td><td class=\"hypc\">" + fe(r1.interior.E_hyp) + "</td><td class=\"stdc\">" + fe(r1.interior.E_leak) + (r1.interior.leak.unresolved ? " U" : "") + "</td><td class=\"stdc\">" + fe(r1.interior.B_leak) + "</td><td class=\"stdc\">" + fe(r2.interior.E_leak) + "</td><td class=\"stdc\">" + fe(r2.interior.B_leak) + "</td></tr>";
    });
    $("tblShape").innerHTML = t + "</tbody>";
  }

  function oemsTab(p, s) {
    const gset = K.openems.exterior[0];
    const sc = oemsScale(p.P_dBm);
    $("oemsFeed").innerHTML = "<p>Page geometry (<code>" + gset.results_key + "</code>, " + gset.mesh + "): feed impedance Zin ≈ " + fn(gset.Zin_re, 1) + " " + (gset.Zin_im < 0 ? "−" : "+") + " j" + fn(Math.abs(gset.Zin_im), 1) + " Ω, S11 " + fn(gset.S11_dB, 2) + " dB. Accepted power ≈ " + fn(gset.P_acc_W_at_Pref * 1e6, 0) + " µW of 1.58 mW available at +2 dBm, so the sphere is badly mismatched to 50 Ω. Current drive " + fn(p.P_dBm, 0) + " dBm → table scale ×" + fn(sc, 4) + ".</p>";
    const base = Object.assign({}, p, { f: gset.f_Hz, R: gset.R_m, gap: gset.gap_m, counterpoise: true });
    $("oemsExtNote").innerHTML = "Equatorial ray (horizontal, from the sphere centre), page geometry: 433.59 MHz, R = 0.14 m, 20 cm gap, drive " + fn(p.P_dBm, 0) + " dBm. openEMS ±15% vs analytic Model B (line current, power-limited) and Model A. The ratio column shows how far the analytic model reads high.";
    let h = "<thead><tr><th>d from surface</th><th>openEMS |E| V/m</th><th>analytic B |E|</th><th>B ÷ openEMS</th><th>analytic A |E|</th><th>openEMS |B| T</th>";
    PROBES.forEach(function (q) { h += "<th>" + q + " openEMS dBm</th><th>" + q + " analytic B dBm</th>"; });
    h += "</tr></thead><tbody>";
    const ds = gset.d_m.concat(gset.ff_r_m.map(function (r) { return r - gset.R_m; }));
    ds.forEach(function (d, i) {
      const r = compute(Object.assign({}, base, { d: d }));
      const O = r.exterior.O, Bm = r.exterior.B;
      h += "<tr><td>" + (i < gset.d_m.length ? fn(d * 100, 0) + " cm" : fn(d + gset.R_m, 0) + " m from centre (far field)") + "</td><td class=\"stdc\">" + fe(O.E, 3) + "</td><td>" + fe(Bm.E, 3) + "</td><td>" + fn(Bm.E / O.E, 2) + "×</td><td>" + fe(r.exterior.A.E, 3) + "</td><td class=\"stdc\">" + fe(O.B, 3) + "</td>";
      PROBES.forEach(function (q) { h += "<td class=\"stdc\">" + fn(r.probes[q].ext_std_O.dBm) + "</td><td>" + fn(r.probes[q].ext_std_B.dBm) + "</td>"; });
      h += "</tr>";
    });
    $("tblOemsExt").innerHTML = h + "</tbody>";
    // interior seam tables at the current drive
    let t = "<thead><tr><th>seam option</th><th>direction</th>";
    K.interior_grid_rR.forEach(function (x) { t += "<th>|E| r/R=" + x + "</th>"; });
    t += "<th>|B| at r/R=0.7</th></tr></thead><tbody>";
    const ib = Object.assign({}, p, { f: K.openems.interior.f_Hz, R: K.openems.interior.R_m, shellType: "solid" });
    Object.keys(K.openems.interior.cases).forEach(function (c) {
      ["eq", "axis"].forEach(function (d) {
        t += "<tr><td>" + (d === "eq" ? K.openems.interior.cases[c].label + " <span class=\"small\">(" + K.openems.interior.cases[c].mesh + ")</span>" : "") + "</td><td>" + (d === "eq" ? "toward seam" : "vertical axis") + "</td>";
        K.interior_grid_rR.forEach(function (x) { const o = oemsInterior(c, d, x, sc); t += "<td class=\"stdc\">" + fe(o.E) + (o.unresolved ? " U" : "") + "</td>"; });
        t += "<td>" + fe(oemsInterior(c, d, 0.7, sc).B) + "</td></tr>";
      });
    });
    t += "<tr><td>EED hypothesis (HYP)</td><td>any (radial)</td>";
    K.interior_grid_rR.forEach(function (x) { t += "<td class=\"hypc\">" + fe(compute(Object.assign({}, ib, { rR: x })).interior.E_hyp) + "</td>"; });
    t += "<td class=\"hypc\">0 (B = 0)</td></tr>";
    $("tblOemsInt").innerHTML = t + "</tbody>";
    // other datasets
    let o = "<thead><tr><th>dataset</th><th>f</th><th>Zin (Ω)</th>";
    [0.05, 0.1, 0.2, 0.5, 1.0].forEach(function (d) { o += "<th>|E| d=" + d + " m</th>"; });
    o += "<th>far field |E| 3 m / 10 m</th></tr></thead><tbody>";
    K.openems.exterior.forEach(function (e) {
      o += "<tr><td>" + e.id + " (gap " + fn(e.gap_m * 1000, 0) + " mm)</td><td>" + fn(e.f_Hz / 1e6, 2) + " MHz</td><td>" + fn(e.Zin_re, 1) + (e.Zin_im < 0 ? " − j" : " + j") + fn(Math.abs(e.Zin_im), 1) + "</td>";
      [0.05, 0.1, 0.2, 0.5, 1.0].forEach(function (d) { const i = e.d_m.indexOf(d); o += "<td>" + (i >= 0 ? fe(e.E[i] * sc, 3) : "—") + "</td>"; });
      o += "<td>" + e.ff_E.map(function (v) { return fe(v * sc, 3); }).join(" / ") + "</td></tr>";
    });
    $("tblOemsHigh").innerHTML = o + "</tbody>";
  }

  function chain(p, s) {
    const pr = U.probe, P = s.probes[pr], isE = K.probe_kind[pr] === "E";
    const inside = U.loc === "inside";
    const fStd = inside ? (isE ? s.interior.E_leak : s.interior.B_leak) : (isE ? (s.exterior[s.exterior.model] || {}).E : (s.exterior[s.exterior.model] || {}).B);
    const rd = inside ? P.int_std : P.ext_std;
    $("chainOut").innerHTML =
      "<div>1 · Field at the probe (standard)<b>" + (isE ? fe(fStd, 3) + " V/m" : fe(fStd, 3) + " T") + "</b></div>" +
      "<div>2 · Probe factor K(f) for " + pr + " at " + fn(p.f / 1e6, 2) + " MHz<b>" + (P.K === null ? "not published" : fn(P.K, 1) + " dBm @ " + (isE ? "1 V/m" : "1 µT")) + "</b></div>" +
      "<div>3 · Probe output on the TinySA<b>" + dbm(rd.dBm) + "</b></div>" +
      "<div>4 · Noise floor (RBW " + U.rbw + " Hz)<b>" + dbm(s.floor_dBm) + "</b></div>" +
      "<div>SNR = output − floor<b>" + (rd.snr === null ? "—" : sgn(rd.snr) + " dB") + "</b></div>";
  }

  function outputs(p, s) {
    const set = function (id, v) { const el = $(id); if (el) el.textContent = v; };
    set("freqOut", fn(p.f / 1e6, 2) + " MHz"); set("pdbmOut", fn(p.P_dBm, 0) + " dBm"); set("rROut", "r/R = " + fn(U.rR, 2));
    set("gapOut", fn(U.gapCm, 0) + " cm"); set("tWallOut", fn(U.tWallMm, 2) + " mm"); set("seamLOut", fn(U.seamLmm, 1) + " mm"); set("seamNOut", String(U.seamN));
    set("hdpeTOut", fn(U.hdpeCm, 1) + " cm"); set("alphaToyOut", fn(U.alphaToy, 2)); set("cagePathOut", fn(U.cagePath, 1) + " m"); set("alphaExtraOut", fn(U.alphaExtra, 2)); set("LextraOut", fn(U.Lextra, 1) + " m");
    set("rrHint", "r/R = " + fn(U.rR, 2) + ": " + (U.rR === 0 ? "the exact centre" : fn(U.rR * p.R * 100, 1) + " cm from the centre, " + fn((1 - U.rR) * p.R * 100, 1) + " cm from the wall") + " (r = distance from the centre, R = sphere radius " + fn(p.R * 100, 1) + " cm).");
    set("distHint", "d = " + (p.d >= 1 ? fn(p.d, 1) + " m" : fn(p.d * 100, 0) + " cm") + " from the metal surface, level with the sphere's middle.");
    set("verOut", K.PHYSICS_VERSION); set("verOut2", K.PHYSICS_VERSION);
  }

  let busy = false;
  function render() {
    if (busy) return; busy = true;
    try {
      syncInputs();
      const p = params(), s = compute(p);
      outputs(p, s); headline(p, s); flags(p, s); plotFront(p, s); chain(p, s);
      const open = document.querySelector(".panel:not([hidden])");
      if (open) { if (open.id === "tab-all" || open.id === "tab-eed") tables(p, s); if (open.id === "tab-oems") oemsTab(p, s); }
    } finally { busy = false; }
  }

  function setKey(k, raw, el) {
    let v = raw;
    if (el && el.type === "checkbox") v = el.checked;
    else if (NUMK[k]) v = +raw;
    U[k] = v;
    if (k === "radSel" && K.radius_default_shell[v]) { U.shellMat = K.radius_default_shell[v]; }
    if (k === "stackPreset") { const sp = STACK_PRESETS[v]; if (sp) { U.tents = sp.tents; U.stack = Object.assign({}, sp.stack); U.errata = sp.errata; U.cageOhm = sp.cageOhm; } }
    if (k === "pdbm") U.drive = "custom";
    if (k === "distCm") U.distUseFree = true;
  }

  function init() {
    if (!$("headline")) return;
    const mg = $("mediaGrid");
    if (mg) mg.innerHTML = STACK_ITEMS.map(function (it) { return "<label><input type=\"checkbox\" id=\"" + it[0] + "\"> " + it[3] + "</label>"; }).join("");
    STACK_ITEMS.forEach(function (it) { const el = $(it[0]); if (el) el.addEventListener("change", function () { U.stack[it[0]] = el.checked; render(); }); });
    document.querySelectorAll("[data-k]").forEach(function (el) {
      const k = el.getAttribute("data-k");
      const h = function () { setKey(k, el.value, el); render(); };
      let raf = 0;
      const hq = function () { setKey(k, el.value, el); if (raf) return; raf = (window.requestAnimationFrame || setTimeout)(function () { raf = 0; render(); }); };
      el.addEventListener(el.type === "range" ? "input" : "change", el.type === "range" ? hq : h);
      if (el.type === "range") el.addEventListener("change", h);
    });
    document.querySelectorAll("[data-seg]").forEach(function (g) {
      const k = g.getAttribute("data-seg");
      g.addEventListener("click", function (ev) { const b = ev.target.closest("button"); if (!b) return; U[k] = b.getAttribute("data-v"); if (k === "distId") U.distUseFree = false; render(); });
    });
    const tabs = document.querySelectorAll("[data-tab]");
    function openTab(id, scroll) {
      tabs.forEach(function (b) { const on = b.getAttribute("data-tab") === id; b.setAttribute("aria-selected", String(on)); const pn = $("tab-" + b.getAttribute("data-tab")); if (pn) pn.hidden = !on; });
      render();
      if (scroll && id) { const pn = $("tab-" + id); if (pn && pn.scrollIntoView) pn.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }
    tabs.forEach(function (b) { b.addEventListener("click", function () { const id = b.getAttribute("data-tab"); const cur = b.getAttribute("aria-selected") === "true"; openTab(cur ? null : id, !cur); if (history.replaceState) history.replaceState(null, "", cur ? location.pathname : "#tab-" + id); }); });
    const m = /^#tab-(\w+)/.exec(location.hash || ""); if (m) openTab(m[1], false);
    let rt = null; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(render, 150); });
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
