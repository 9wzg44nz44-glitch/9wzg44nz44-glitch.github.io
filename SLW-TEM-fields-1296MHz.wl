(* Educational TEM vs SLW cartoon. 1296 MHz TinySA. SLW is not settled physics. *)
Z0 = 376.73031346177;
f = 1.296*^9;
c = 299792458;
mu0 = 4 Pi 10^-7;
k0 = 2 Pi f/c;
cloudObj =
 CloudPublish[
  Manipulate[
   Module[{P, Irms, Ipk, Prad, S, Am, meshP, att},
    att = Switch[cage, "open", 0, "slotted", 25, "sealed", 55];
    meshP = 10^(-2 att/10);
    P = 10^((Pdbm - 30)/10);
    Irms = Sqrt[P/50];
    Ipk = Irms Sqrt[2];
    Prad = Ipk^2 Z0/(4 Pi);
    S = Prad/(4 Pi r^2);
    Am = mu0 Ipk/(2 Pi k0 r);
    Column[{
      Style["Educational only. CED = TEM. SLW disputed. Square-wave TinySA Ultra 406 at 1296 MHz (harmonics/spurs).", 12],
      Row[{"Irms=", ScientificForm[Irms, 3], " A   Prad=", ScientificForm[Prad, 3], " W   S=", ScientificForm[S, 3], " W/m^2   Am=", ScientificForm[Am, 3], " Wb/m   meshP=", ScientificForm[meshP, 3]}],
      Graphics3D[{
        If[show =!= "slw", {Cyan, Opacity[0.35 meshP^(1/4)], Sphere[{0, 0, 0.06}, 0.03 + 0.001 (Pdbm + 20)]}, {}],
        If[show =!= "tem", {Orange, Opacity[0.25 meshP^(1/4)], Sphere[{0, 0, 0}, 0.07/Max[r, 0.05]]}, {}],
        Gray, Cylinder[{{0, 0, -0.02}, {0, 0, 0.05}}, 0.004],
        RGBColor[0.6, 0.7, 0.9], Tube[Table[{0.012 Cos[t], 0.012 Sin[t], -0.015}, {t, 0, 2 Pi, 0.15}]]
        }, Boxed -> False, Lighting -> "Neutral",
       PlotRange -> {{-0.2, 0.2}, {-0.2, 0.2}, {-0.08, 0.18}}, ImageSize -> 420],
      Style["P=10^((Pdbm-30)/10) W; Prad=Ipk^2 Z0/(4Pi)  [US 9,306,527 Eq.15]; Am=mu0 Ipk/(2 Pi k0 r)  [N-Z 2007]; two tents: power * 10^(-2 att/10). Near-field Friis caveat at lab r.", 11]
      }]
    ],
   {{Pdbm, -10, "P_tx dBm"}, -30, 10, 0.5},
   {{r, 0.5, "r (m)"}, 0.05, 3, 0.01},
   {{cage, "sealed", "cage"}, {"open", "slotted", "sealed"}},
   {{show, "both", "fields"}, {"both", "tem", "slw"}}
   ],
  "SLW-TEM-fields-1296MHz",
  Permissions -> "Public"];
cloudObj
