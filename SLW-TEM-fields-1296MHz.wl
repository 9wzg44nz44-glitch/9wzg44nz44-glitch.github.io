(* Educational TEM vs SLW cartoon. 1296 MHz TinySA. SLW is not settled physics.
   PhysicsVersion: tem-slw-1296-v0.1 (Wolfram twin of fields.html / js/fields.js)
   Cloud: https://www.wolframcloud.com/obj/danbritton5/SLW-TEM-fields-1296MHz  (Cloud copy predates v0.1: pending sync)
   v0.1 (2026-09-25): added the page's detector LNA option (NF 3 -> 5 dB, +20 dB gain) and its SNR/received-power
   readouts (TEM Friis toy, SNR_Hively, P_sig NZ, P_sig Z), transcribed from js/fields.js with no new physics.
   The "SMA-end leak" checkbox is drawing-only on the page (no numeric effect) and is drawing-only here too.
   The -10 dBm default is kept as on the page (flagged: TinySA Ultra generator max is -19 dBm; question for Dan). *)
TEMSLWVersion = "tem-slw-1296-v0.1";
Z0 = 376.73031346177;
f = 1.296*^9;
c = 299792458;
mu0 = 4 Pi 10^-7;
k0 = 2 Pi f/c;
lambda0 = c/f;
RL = 50;
BHz = 1.*^5;          (* js/fields.js B_HZ *)
N0dBmHz = -174;       (* js/fields.js N0 *)
AeffHively = Pi 0.05^2;  (* js/fields.js A_EFF, 10 cm palm coil *)
etaHively = 0.5;      (* js/fields.js ETA *)
RResp = 264030;       (* js/fields.js R_RESP (NZ responsivity) *)
dbmFromWatts[w_] := If[w <= 0, -999, 10 Log10[w 1000]];
cloudObj =
 CloudPublish[
  Manipulate[
   Module[{P, Irms, Ipk, Prad, S, Am, meshP, att, nf, lnaGain, gl, noise, dStub, far, near, gtx, aeffTem, prxTem, snrTem,
     pload, snrH, pnz, az, pz},
    att = Switch[cage, "open", 0, "slotted", 25, "sealed", 55];
    meshP = 10^(-2 att/10);
    P = 10^((Pdbm - 30)/10);
    Irms = Sqrt[P/RL];
    Ipk = Irms Sqrt[2];
    (* detector chain, as js/fields.js compute() *)
    nf = If[TrueQ[lna], 5, 3];
    lnaGain = If[TrueQ[lna], 20, 0];
    gl = 10^(lnaGain/10);
    noise = N0dBmHz + 10 Log10[BHz] + nf;
    dStub = 0.25 lambda0;
    far = 2 dStub^2/lambda0;
    near = r < far;
    gtx = 1.5;
    aeffTem = 3 lambda0^2/(8 Pi);
    prxTem = P gtx aeffTem/(4 Pi r^2) meshP;
    snrTem = dbmFromWatts[prxTem gl] - noise;
    Prad = Ipk^2 Z0/(4 Pi);
    S = Prad/(4 Pi r^2);
    pload = S AeffHively etaHively meshP gl;
    snrH = dbmFromWatts[pload] - noise;
    Am = mu0 Ipk/(2 Pi k0 r);
    pnz = ((RResp/Sqrt[2]) Am)^2 RL meshP gl;
    az = 1.*^-10 (Ipk/0.028) (1.5/r) (1.3/(f/1.*^9));
    pz = (420000 az)^2 RL meshP gl;
    Column[{
      Style["TEM vs SLW \[LongDash] " <> TEMSLWVersion <> " \[CenterDot] Educational only. CED = TEM. SLW disputed. Square-wave TinySA Ultra 406 at 1296 MHz (harmonics/spurs).", 12],
      Row[{"Irms=", ScientificForm[N[Irms], 3], " A   Prad=", ScientificForm[N[Prad], 3], " W   S=", ScientificForm[N[S], 3], " W/m^2   Am=", ScientificForm[N[Am], 3], " Wb/m   meshP=", ScientificForm[N[meshP], 3]}],
      Row[{"TEM: Prx (mesh) = ", NumberForm[N[dbmFromWatts[prxTem]], {Infinity, 1}], " dBm \[CenterDot] SNR_TEM \[TildeTilde] ", NumberForm[N[snrTem], {Infinity, 1}],
        " dB (B=100 kHz, NF=", nf, " dB", If[TrueQ[lna], ", LNA +20 dB", ""], ")",
        If[near, " \[CenterDot] r inside ~" <> ToString[NumberForm[N[far], 3]] <> " m far-field estimate: Friis is a caveat", ""]}],
      Row[{"SLW: SNR_Hively \[TildeTilde] ", NumberForm[N[snrH], {Infinity, 1}], " dB \[CenterDot] Az = ", ScientificForm[N[az], 3], " Wb/m \[CenterDot] P_sig,NZ = ",
        NumberForm[N[dbmFromWatts[pnz]], {Infinity, 1}], " dBm \[CenterDot] P_sig,Z = ", NumberForm[N[dbmFromWatts[pz]], {Infinity, 1}], " dBm"}],
      Graphics3D[{
        If[show =!= "slw", {Cyan, Opacity[0.35 meshP^(1/4)], Sphere[{0, 0, 0.06}, 0.03 + 0.001 (Pdbm + 20)]}, {}],
        If[show =!= "tem", {Orange, Opacity[0.25 meshP^(1/4)], Sphere[{0, 0, 0}, 0.07/Max[r, 0.05]]}, {}],
        Gray, Cylinder[{{0, 0, -0.02}, {0, 0, 0.05}}, 0.004],
        RGBColor[0.6, 0.7, 0.9], Tube[Table[{0.012 Cos[t], 0.012 Sin[t], -0.015}, {t, 0, 2 Pi, 0.15}]],
        If[TrueQ[smaLeak], {RGBColor[0.94, 0.76, 0.29], Cuboid[{0.02, -0.004, -0.02}, {0.035, 0.004, -0.012}],
          Text[Style["SMA leak (visual only)", 9], {0.03, 0, 0.0}]}, {}]
        }, Boxed -> False, Lighting -> "Neutral",
       PlotRange -> {{-0.2, 0.2}, {-0.2, 0.2}, {-0.08, 0.18}}, ImageSize -> 420],
      Style["P=10^((Pdbm-30)/10) W; Prad=Ipk^2 Z0/(4Pi)  [US 9,306,527 Eq.15]; Am=mu0 Ipk/(2 Pi k0 r)  [N-Z 2007]; two tents: power * 10^(-2 att/10). Near-field Friis caveat at lab r.", 11],
      Style["SNR = P_dBm - (-174 + 10 log10(B) + NF), B = 100 kHz, NF 3 dB (5 dB + 20 dB gain with LNA); Friis toy Gtx 1.5, Aeff 3 lambda^2/(8 Pi); Hively load Aeff = Pi 0.05^2, eta 0.5 (as js/fields.js).", 10, Gray]
      }]
    ],
   {{Pdbm, -10, "P_tx dBm"}, -30, 10, 0.5},
   {{r, 0.5, "r (m)"}, 0.05, 3, 0.01},
   {{cage, "sealed", "cage"}, {"open", "slotted", "sealed"}},
   {{show, "both", "fields"}, {"both", "tem", "slw"}},
   {{lna, False, "Detector LNA (~20 dB, NF 5 dB)"}, {False, True}},
   {{smaLeak, False, "SMA-end leak (visual only)"}, {False, True}},
   SaveDefinitions -> True
   ],
  "SLW-TEM-fields-1296MHz",
  Permissions -> "Public"];
cloudObj
