# PHYSICS_LOCK: FX1SNR.wl ↔ js/fx1-snr.js (fx1-snr.html)

**Date:** 2026-09-25 (America/New_York)
**PhysicsVersion:** `fx1-snr-v0.2` (v0.1 → v0.2 on 2026-09-25: openEMS FDTD tables became engine physics)
**Single source of truth:** `physics-constants-fx1.json` (repo root; working copy `/workspace/sim-lab/fx1/physics-constants-fx1.json`), section `engine`.
Both twins carry a **generated** copy of `engine`, injected by `gen_constants.mjs` between these markers:
- JS: `/* BEGIN FX1 CONSTANTS … */` … `/* END FX1 CONSTANTS */` (const `K`)
- WL: `(* BEGIN FX1 CONSTANTS … *)` … `(* END FX1 CONSTANTS *)` (`FX1Const`, machine-precision literals `x.xxx`*^n`)

`check_constants.mjs` asserts that both blocks are **bit-identical** to the JSON (2146 comparisons in v0.2, including every embedded openEMS table value; exit 1 on any mismatch).
**CloudPublish:** PENDING SYNC. Target `CloudObject["FX1SNR"]` → https://www.wolframcloud.com/obj/danbritton5/FX1SNR, via `FX1SNR_Publish.wl` (All→Read+Interact). The page shows "Cloud twin pending sync (fx1-snr-v0.2)" (small note at the top and in the Version & sync tab).
**Publishing rule (relaxed 2026-09-25):** the GitHub Pages twin may go live ahead of Cloud. The gap is tracked in `/workspace/sim-lab/SYNC_LEDGER.md`. Re-sync steps: (1) CloudPublish from this exact `FX1SNR.wl`; (2) run `FX1SNR_RunGrid.wl` → `wl_outputs.json`, then `node compare_outputs.mjs js_outputs.json wl_outputs.json` (rel tol 1e-9); (3) remove the "pending sync" note.
**Independent cross-check (done, v0.2):** `py_check.py`, a separate Python implementation from the cited formulas, the JSON and (for the openEMS tables) a direct read of `openems/results.json`, matches `js_outputs.json` on the full v0.2 grid: 2304 records (interior 1260, exterior 768, exterior_sweep 192, interior_interp 84): PASS 104132 / FAIL 0 (rel tol 1e-9, worst 1.35e-14). It also confirms that the 22 engine.openems tables equal the independent results.json read.

**No invented equations.** Every formula below is either a textbook form (FACT, cited), the page's HYP formula copied verbatim, a SleeveBalunSNR (snr-dual-sim-params-v0.2) carry-over, or a labelled ASSUMPTION.

---

## Tags

| Tag | Meaning |
|-----|---------|
| **FACT** | Sourced value, or textbook formula form (cited) |
| **DATA / DIGITIZED** | Tekbox chart data points extracted from the PDF vector paths |
| **INTERPOLATED** | Linear in log10(f) between published points. Always labelled in the UI and in the outputs |
| **NOT_PUBLISHED** | No vendor factor at that frequency. Output is null ("floor") and nothing is extrapolated |
| **ASSUMPTION** | Modelling choice (geometry, reference point, rms/peak, leakage combination) |
| **HYP** | EED/SLW hypothesis (future-scalar-ab.html #eed / #home-experiment) or SleeveBalunSNR HYP carry-over |

---

## Constants (engine), with sources

| Key | Value | Tag / source |
|-----|-------|--------------|
| C0, MU0, EPS0, Z0 | 299792458; 4π·1e-7; 8.854187817e-12; 376.73031346177 | FACT, hub physics-constants.json |
| RL | 50 Ω | FACT for the port; applying it to the shell (V0 = √(2·50·P)) is an ASSUMPTION, as on the page |
| Frequencies | 433.59 MHz, 1.296 GHz, 2.45 GHz; free 100–3000 MHz | page / hub |
| Drive | +2 dBm (TinySA + Zeenko ZK06-UM 21 dB, default); −19 dBm (TinySA alone, generator max) | page; tinysa.org TinySA4 spec |
| Radius | bowls 0.14 m (304 SS, seam on); KB-2016 0.03175 m and KB-1820 0.009525 m (3003 Al, no seam) | page; hub setup.html |
| 304 SS | ρ = 72 µΩ·cm → σ = 1.389e6 S/m; μr 1.02 | UPMET 304 datasheet |
| 3003 Al | ρ = 4.16 µΩ·cm → σ = 2.404e7 S/m | MatWeb 3003-H14 |
| Copper / steel / seawater / air | σ 5.8e7 / 5e6 / 4 (εr 80) / ~0 | copied from hub physics-constants.json (SleeveBalunSNR) |
| HDPE | εr 2.29, tanδ 5e-4 | Polymers 2021 13(16):2658, Table 1 |
| Wall thickness | 0.5 mm | ASSUMPTION (slider) |
| Seam gap l, n | 5 mm, 1 | ASSUMPTION; v0.2: used only by seam option `analytic` and the analytic fallback |
| openEMS exterior (engine.openems.exterior) | gap200_433 (page geometry, DEFAULT), gap10_433, gap10_1296, gap10_2450: equatorial |E|, |B| at d = 0.05–1.0 m + NF2FF r = 3, 10 m, per +2 dBm available (50 Ω) | FACT (openEMS FDTD, results.json); ±15% mesh uncertainty |
| openEMS interior (engine.openems.interior.cases) | closed, arc_0p1x30, arc_1x30, ring_0p1, ring_1 (2.5 mm mesh), ring_1_m5 (5 mm mesh); |E|, |B| at r/R 0–0.9 in 3 directions; unresolved flags | FACT, order of magnitude (PEC, stair-stepped, not converged; 10 mm feed-gap runs) |
| Seam default | arc_1x30 (one 30 mm × 1 mm gap) | ASSUMPTION (replaces v0.1's 5 mm analytic seam) |
| Mesh sphere SE | 60 dB below 1 GHz, 50 dB at 1.3 GHz, interpolated between, held above | page catalog; INTERPOLATED / ASSUMPTION |
| Counterpoise gap | 0.20 m (sphere bottom to baking sheet) | page ("at least 20 cm"); reference point is an ASSUMPTION |
| Tents | open 0 / slotted 25 / sealed 55 dB per tent, two tents | SleeveBalunSNR carry-over |
| Sub / seawater lengths, α_toy 0.05 Np/m, cage path 1 m | as in SleeveBalunSNR | carry-over (TOY/HYP) |
| Cavity roots | TM101 2.744, TE101 4.493 | FACT (Harrington 1961 §6-9; Balanis AEE §10.4) |
| Tekbox probe anchors | E5 (dBm @ 1 V/m), H20/H10/H5 (dBm @ 1 µT) | DIGITIZED, TBPS01/TBWA2 manual V2.2, p.2 Picture 2 and p.3 Picture 3 |
| Tekbox FAQ V1.1 | E5 scale 112.5; S: H20 80, H10 62, H5 40 | FACT, FAQ Near Field Probes V1.1 (26-Jan-2022) p.2 |
| TinySA floor | −102 dBm @ 30 kHz RBW (no LNA); −145 dBm @ 200 Hz (LNA, NF 5 dB); P1dB −1; abs max +6; best < −25 dBm | FACT, tinysa.org TinySA4 spec (30 MHz). Applying it at UHF is an ASSUMPTION |

The full values, with the text of every label, are in `physics-constants-fx1.json` → `engine`, `labels`, `formulas`.

---

## Formulas (exact lock; identical code in both twins)

### Drive
```
P = 10^((P_dBm−30)/10);  V0 = sqrt(2·RL·P)  (ASSUMPTION, page);  I_pk = sqrt(2P/RL)  (hub identity)
```
### Exterior, standard — DEFAULT (v0.2): openEMS table (FACT ±15%)
```
dataset = first engine.openems.exterior entry with |f−f_i| ≤ 1e-6 f_i, |R−R_i| ≤ 1e-6 m, counterpoise ON, |gap−gap_i| ≤ 1e-6 m
points = equatorial samples (d_m, E, B) ∪ far-field (ff_r_m − R, ff_E, ff_B), sorted by d
d < d_first → none (analytic);  exact sample → sample;  d > d_last → E_last·(R+d_last)/(R+d) (far field 1/r);  else ln E, ln B linear in ln d
scale s = 10^((P_dBm − 2)/20)  (fields ∝ source EMF; tables per +2 dBm available from 50 Ω)
extModel "auto" = openEMS if available, else B (counterpoise) / A
```
### Interior, standard — DEFAULT (v0.2): openEMS seam tables (FACT, order of magnitude)
```
applies if f = 433.59 MHz, R = 0.14 m (tol as above), solid shell, seam ∈ engine.openems.interior.cases
|E|(r/R), |B|(r/R) along dir ∈ {eq (toward seam), axis, obl}: exact sample (|x−x_i| ≤ 1e-9) → sample; x ≤ x_1 → first; x ≥ x_n → last (clamped);
  else ln|E| linear in r/R when both neighbours > 0, otherwise linear;  unresolved flag = either neighbour flagged
E_leak = s·|E|,  B_leak = s·|B|;  otherwise (or seam "analytic"): v0.1 analytic model below, labelled "analytic only"
```
### Interior, standard — analytic fallback (v0.1 model)
```
Ideal closed conductor: E = 0, B = 0
E_ref = V0/R
SE_wall = A + R + B   (Schelkunoff; Ott 2009 ch.6; exact complex γ, η; plane wave, normal incidence)
SE_seam = max(0, 20log10(λ/2l) − 10log10 n), for l < λ/2   (Ott 2009 §6.6)
SE_shell = −10log10(10^(−SE_wall/10) + 10^(−SE_seam/10))   (ASSUMPTION: incoherent power sum)
E_leak = E_ref·10^(−SE_shell/20), uniform in r (ASSUMPTION);  B_leak = E_leak/C0 (ASSUMPTION)
```
### Interior, HYP (verbatim from the page)
```
E_r = V0 cos(Ωt) R [sin kr − kr cos kr]/(r² sin kR)   (amplitude at cos Ωt = 1; series V0 R k³ r/(3 sin kR) near r = 0)
B = 0; tangential E = 0   (page: "radial (longitudinal), zero at the center, and has B = 0")
```
### Exterior, standard — analytic comparison models (v0.1; fallback when no openEMS data)
```
Q = 4π ε0 R V0                               (FACT; ignores counterpoise proximity = ASSUMPTION)
A: E = V0 R / r_c², B = 0                    (FACT quasi-static; valid for r ≪ λ/2π)
B (fallback default): line current I0 = ωQ from −h_c to +h_c, 400 Hertzian elements   (Balanis 3e Eq. 4-8/4-10; current model = ASSUMPTION)
C: single Hertzian dipole I·l = ω·2h_c·Q at the plane                       (ASSUMPTION)
P_rad (half-space): B by the line-source integral, C = 0.5·Z0·(π/3)(Il/λ)²
Power limit (ON): scale B/C by sqrt(P_drive/P_rad) if P_rad > P_drive   (ASSUMPTION energy bound)
h_c = gap + R;  r_c = R + d
```
### Exterior, HYP (SleeveBalunSNR carry-over)
```
P_rad = I_pk² Z0/(4π);  S = P_rad/(4π r_c²)·exp(−αL);  E∥ = sqrt(S·Z0);  detector power × mP;  B = 0
```
### Stack
```
Standard: Σ SE_layer (same Schelkunoff form) + 2·att_tent   (layers in series, no inter-layer reflections = ASSUMPTION)
HYP: Errata α = 0 (default) → no loss; Ohmic ON → αL = α_toy·ΣL (+ α_toy·2·cage_path) (+ α_extra·L_extra)   (carry-over)
```
### Probe → TinySA
```
P_probe = K(f) + 20log10(field/ref) − stack_dB    (ref = 1 V/m for E5, 1 µT for H probes; field treated as peak = ASSUMPTION)
K(f): manual V2.2 curve (DATA at anchors, INTERPOLATED in log f, NOT_PUBLISHED outside) or FAQ V1.1 formula
floor = LDS + 10log10(RBW/RBW_ref);  SNR = P_probe − floor;  reading = 10log10(10^(P/10) + 10^(floor/10))
```

---

## Lockstep procedure
1. Edit `make_constants.py`, then run `python3 make_constants.py`, `node gen_constants.mjs`, `node check_constants.mjs`.
2. Engine code changes must be made in **both** `js/fx1-snr.js` and `FX1SNR.wl` (same function names: drive/layerSE/seamSE/…/compute ↔ fx1Drive/fx1LayerSE/…/fx1Compute).
3. Run `node dump_js_outputs.mjs` → `js_outputs.json`. In Wolfram, run `wolframscript -file FX1SNR_RunGrid.wl` → `wl_outputs.json`. Then run `node compare_outputs.mjs`.
4. Bump `PHYSICS_VERSION` for any physics change. Publish the Cloud twin (`FX1SNR_Publish.wl`) and update the sync ledger.
5. v0.2: openEMS numbers used by the engine live in `engine.openems`, generated by `make_constants.py` from `openems/results.json`; regenerating them is a physics change (bump the version). `fx1-openems-reference.json` / `FX1OpenEMSReference` / the page's v0.1 reference dump (10 mm geometry) are still regenerated by `merge_openems.mjs` as reference data.
6. Grid v0.2 (`dump_js_outputs.mjs` = `FX1Grid[]` = `py_check.py`): interior radii × drives × factor source × 7 seam options × 3 directions × 5 r/R; exterior radii × drives × factor source × 8 stacks × 8 distances; exterior sweep f ∈ {433.59, 1296, 2450} MHz × gap ∈ {0.01, 0.20} m; interior interpolation r/R ∈ {0.1, 0.6, 0.8, 0.95}.
