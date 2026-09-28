#!/usr/bin/env python3
"""TEM (transverse-EM) reference numbers for the scalar-wave radar design brief.
ALL numbers here are CLASSICAL TEM FACT-form, from Skolnik, Introduction to Radar Systems, 2nd ed. (1980):
  Eq. (1.7)  Rmax = [Pt*G*Ae*sigma / ((4*pi)^2 * Smin)]^(1/4)
  Eq. (1.8)  G = 4*pi*Ae/lambda^2
  Eq. (3.2a) fd = 2*vr/lambda
  Eq. (3.11) fb = 4*R*fm*df/c   (triangular FM-CW)
Receiver floor: TinySA Ultra -102 dBm @ 30 kHz RBW (hub/sim-lab FACT), scaled +10log(RBW/30kHz) (expt-d REPORT).
NOT established for SLW. Nothing here says anything about SLW. WL compare OWED."""
import math, json, os
c=299792458.0
F={"433.59 MHz":433.59e6,"1296 MHz":1296e6,"2450 MHz":2450e6}
out={}
for k,f in F.items():
    lam=c/f
    out[k]={"lambda_m":round(lam,4),
            "doppler_Hz_Eq3.2a":{f"{v} m/s":round(2*v/lam,2) for v in (0.1,0.5,1.0,5.0)}}
# FMCW beat, Eq. 3.11
out["fmcw_Eq3.11"]={f"R={R} m, fm={fm} Hz, df={df/1e6:.0f} MHz":round(4*R*fm*df/c,2)
                    for R in (1,3,10) for fm in (100,) for df in (50e6,)}
# Radar equation Eq 1.7 at 2450 MHz, HackRF +13..+15 dBm (GSC docs), sigma=1 m^2 (ASSUMPTION), TinySA floor
def dbm2w(d): return 10**(d/10)/1000
lam=c/2450e6
res={}
for ant,G in (("half-wave dipole, G=1.64 (2.15 dBi)",1.64),("small horn/can, G=10^(15/10) (15 dBi, ASSUMPTION)",10**1.5)):
    Ae=G*lam**2/(4*math.pi)                     # Eq 1.8 rearranged
    for rbw in (30e3,1e3,100.0):
        smin_dbm=-102+10*math.log10(rbw/30e3)   # TinySA floor (no LNA), SNR=0 dB
        for pt_dbm in (13,):
            R=(dbm2w(pt_dbm)*G*Ae*1.0/((4*math.pi)**2*dbm2w(smin_dbm)))**0.25
            res[f"{ant}; Pt={pt_dbm} dBm; RBW={rbw:g} Hz (Smin={smin_dbm:.1f} dBm)"]=round(R,1)
out["TEM_Rmax_m_Eq1.7_2450MHz_sigma1m2"]=res
out["notes"]=["Monostatic Eq. 1.7 assumes one antenna for TX and RX; HackRF One is half-duplex, so a real build is bistatic (HackRF TX + TinySA/second SDR RX) and direct TX->RX leakage, not the floor, usually limits it (ASSUMPTION).",
              "sigma = 1 m^2 is an ASSUMPTION (order of a person/large metal plate is target-dependent)."]
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"radar_numbers.json"),"w"),indent=1)
print(json.dumps(out,indent=1))
