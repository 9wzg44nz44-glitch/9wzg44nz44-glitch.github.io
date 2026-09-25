(* FX1SNR_Publish.wl — syntax-check + CloudPublish (modelled on SleeveBalunSNR_Publish.wl)
   Target: CloudObject["FX1SNR"] -> https://www.wolframcloud.com/obj/danbritton5/FX1SNR
   Run:    wolframscript -file FX1SNR_Publish.wl   (after CloudConnect as danbritton5)
   Lockstep: publish ONLY when physics-constants-fx1.json PHYSICS_VERSION == PhysicsVersion below == js/fx1-snr.js. *)
Print["$Version = ", $Version];
Print["$CloudConnected = ", $CloudConnected];
Print["$CloudUserID = ", $CloudUserID];
If[!TrueQ[$CloudConnected],
  Print["ERROR: Cloud not connected. Aborting publish."];
  Exit[1]
];

Get[FileNameJoin[{DirectoryName[$InputFileName], "FX1SNR.wl"}]];
Print["Loaded PhysicsVersion = ", PhysicsVersion];
If[PhysicsVersion =!= "fx1-snr-v0.2",
  Print["ERROR: PhysicsVersion mismatch (expected fx1-snr-v0.2), got ", PhysicsVersion];
  Exit[3]
];

(* smoke test: default compute must return numbers *)
Module[{s = fx1Compute[fx1Defaults[]]},
  Print["Smoke: V0 = ", s["V0"], " V; shell SE = ", s["shell"]["SE"], " dB; floor = ", s["floor_dBm"], " dBm; E5 int HYP = ",
    s["probes"]["E5"]["int_hyp"]["dBm"], " dBm; E5 ext STD-B = ", s["probes"]["E5"]["ext_std"]["dBm"], " dBm"];
  If[!NumericQ[s["V0"]] || !NumericQ[s["floor_dBm"]],
    Print["ERROR: smoke test failed"];
    Exit[4]
  ];
];

Module[{obj},
  obj = FX1SNRManipulate;
  Print["Manipulate Head = ", Head[obj]];
  If[Head[obj] =!= Manipulate,
    Print["ERROR: expected Manipulate, got ", Head[obj]];
    Exit[2]
  ];
];

named = CloudObject["FX1SNR"];
Print["Publishing to ", named];

cloudObj = CloudPublish[
  FX1SNRManipulate,
  named,
  Permissions -> "Public"
];
Print["CloudPublish result = ", InputForm[cloudObj]];

SetPermissions[cloudObj, "All" -> {"Read", "Interact"}];
Print["Permissions = ", Permissions[cloudObj]];

If[Head[cloudObj] === CloudObject,
  Print["CloudPlayer URL candidate = https://www.wolframcloud.com/obj/", StringReplace[cloudObj[[1]], "https://www.wolframcloud.com/objects/" -> ""]],
  Print["Unexpected cloudObj head"]
];
Print["URLRaw = ", cloudObj[[1]]];
Print["CloudObjectInformation:"];
Print[CloudObjectInformation[cloudObj]];
Exit[0];
