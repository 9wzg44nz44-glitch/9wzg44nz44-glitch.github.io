(* FX1SNR_RunGrid.wl — evaluates the fixed lockstep test grid with the Wolfram engine and writes wl_outputs.json
   next to this file (or to the path given as the first script argument).
   Then, on the box:  node compare_outputs.mjs js_outputs.json wl_outputs.json
   Run: wolframscript -file FX1SNR_RunGrid.wl [out.json]   (Desktop or Cloud; no Cloud connection needed) *)
Get[FileNameJoin[{DirectoryName[$InputFileName], "FX1SNR.wl"}]];
Print["PhysicsVersion = ", PhysicsVersion];
out = If[Length[$ScriptCommandLine] >= 2, $ScriptCommandLine[[2]],
  FileNameJoin[{DirectoryName[$InputFileName], "wl_outputs.json"}]];
t = AbsoluteTiming[res = FX1ExportGrid[out]][[1]];
Print["Wrote ", res, " in ", t, " s; records = ", Length[Import[out, "RawJSON"]["records"]]];
Exit[0];
