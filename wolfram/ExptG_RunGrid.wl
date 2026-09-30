(* Experiment G WL twin grid runner (expt-g-v0.1).  STATUS: written by hand, NOT YET RUN.
   Usage (desktop or Cloud):  wolframscript -file ExptG_RunGrid.wl <grid_spec.json> <wl_outputs.json>
   Output layout matches sim/run_grid.py so sim/compare_outputs.py can diff PY / JS / WL. *)
Get[FileNameJoin[{DirectoryName[$InputFileName], "ExptG.wl"}]];
args = If[Length[$ScriptCommandLine] >= 3, Rest[$ScriptCommandLine], {"expt-g-grid.json", "wl_outputs.json"}];
g = Import[args[[1]], "RawJSON"];
kw = {"ep", "epp", "sigma", "sigH", "tand", "alpha_tem", "beta_tem", "eta_abs", "eta_phase", "Zslw", "alpha_J"};
lk = {"E_det_slw", "E_det_tem", "G_sig", "G_dc", "G_bbr", "F2", "dep", "Rb", "snr", "G_req", "E_req_det", "E_req_out", "N_req", "cps"};
rk = {"sig", "tem_leak", "twoE1", "stark", "bbr", "ads", "gps", "wifi", "dme", "dark"};
toA[p_] := Association[KeyValueMap[#1 -> If[NumberQ[#2], N[#2], #2] &, p]];
wt0 = water[gLMHz 10^6, 15., 35.]; e0 = link[]["E_req_out"];
out = <|
  "water" -> (Lookup[water @@ N[#], kw] & /@ g["water"]),
  "rate_ac" -> (rateAC @@ N[#] & /@ g["rate_ac"]),
  "rate_static" -> (rateStatic[N[#]] & /@ g["rate_static"]),
  "rate_mag" -> (rateMag @@ N[#] & /@ g["rate_mag"]),
  "f2" -> (f2E1[N[#[[1]]], #[[2]]] & /@ g["f2"]),
  "rate_hf" -> (rateHF[N[#[[1]]], N[#[[2]]], #[[3]]] & /@ g["rate_hf"]),
  "bbr" -> (rateBBR[N[#]] & /@ g["bbr"]),
  "link" -> (With[{l = link[toA[#]]}, Join[Lookup[l, lk], Lookup[l["R"], rk]]] & /@ g["link"]),
  "ptx" -> (ptxRequired[N[#[[1]]], e0, wt0, #[[2]]] & /@ g["ptx"]),
  "maxrange" -> (maxRange[N[#[[1]]], e0, wt0, #[[2]]] & /@ g["maxrange"])|>;
Export[args[[2]], out /. Infinity -> "Infinity", "RawJSON"];
Print["wrote ", args[[2]]];
