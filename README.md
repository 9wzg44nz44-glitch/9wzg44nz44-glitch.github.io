Live site: https://9wzg44nz44-glitch.github.io/

# SLW Hub

Educational static site unifying Dan Britton’s Scalar Longitudinal Wave (SLW) GitHub Pages, plus a **1.3 GHz Faraday-cage lab** (Hively US 9,306,527 scaled off 8 GHz).

**Author:** Dan Britton · BrittonSolutions@icloud.com  
**Source repos:** https://github.com/9wzg44nz44-glitch  
**Prior interactive pages:** built with Grok (xAI), re-homed here as one site.

## How to open

This is vanilla HTML/CSS/JS. No build step.

- Unzip `slw-hub.zip` (or use this folder).
- Open `index.html` in a browser (double-click, or `python3 -m http.server` from this directory and visit `/`).
- Tools, Compare, and the Lab CSV log need JavaScript. The Lab log is stored in `localStorage` until you export CSV.

## Pages

| File | Contents |
|---|---|
| `index.html` | Master two-experiment page (JS tabs `#expt-a` `#expt-b` `#kit`) |
| `learn.html` | Briefing (N–Z vs Hively vs Meyl), detectors, Zimmerman 1296 MHz TM01 hardware, patents |
| `compare.html` | Side-by-side table + illustrative SNR toy |
| `tools.html` | Bifilar pancake + RG-405 length calculator, **default 1.300 GHz**; 1.3 GHz *build* is a sleeve, see `setup.html#sleeve` |
| `setup.html` | Experiment A bench: pancake, mesh tents, **sleeve (not skirt)** how-to `#sleeve` |
| `fields.html` | 1296 MHz TEM vs SLW cartoon |
| `monstein.html` | Experiment B: 433.59 MHz balls + rods, **no balun** |
| `sphere.html` | Fig. 1 vs catalog spheres; **no balun** |
| `kit.html` | Shared submersible field kit (planned; not a claim it has been built) |
| `lab.html` | 1.3 GHz Faraday protocol, HAM legal box, skin-depth table, BOM, controls, CSV log, safety |
| `library.html` | Six bundled PDFs with genre labels |
| `papers/` | Verbatim PDFs (not rewritten) |
| `css/style.css`, `js/*.js`, `assets/mark.svg` | Chrome |

## Physics constants used

Skin depth **δ = 1 / √(π f μ σ)** with **σ_Cu ≈ 5.8×10⁷ S/m**, **μ = μ₀**.  
At 1.300 GHz, δ ≈ **1.833 µm**; at 8 GHz, δ ≈ **0.739 µm**.  
At 1296.000 MHz, λ ≈ 231.3 mm; λ/4 sleeve ≈ 57.8 mm in air; first-article stub λ/10 ≈ 23.1 mm. Patent Fig. 2A skirt is historical; the 1.3 GHz build is a close-fitting sleeve.  
Patent Eq. 15: P_rad = I² Z₀ / (4π) with Z₀ ≈ 376.73 Ω.

## Tone

Educational only. SLW is **not** presented as settled physics. No medical, free-energy, or magnetron-oven protocol. 23 cm transmit requires a license; 1296 MHz is a calling frequency.

## Original GitHub Pages fetch (31 Aug 2026)

Fetched successfully (github.io): Educational Briefing; Bifilar Pancake Calculator; Interactive SNR; Combined SNR; Cross-Sectional SNR; Hively SNR Simulator; Mix-and-match antennas; Plasma-tube detector; Why bifilar interacts; No-Skin-effect-3D-plots; RG-405 skirt balun; N–Z 2007 simulation; Meyl–Hively–N–Z; Meyl theory detailed; Linearly Resistive Media; Proposed Experiment — Hively and Microwave Oven.

**404 Pages:** 3D-Field-Patterns-of-SLW-for-Nikolova-Zimmerman-and-Hively; Nikolova-Zimmerman-SLW-florescent-light-bulb---2007-paper; Nikolova-Zimmerman-2007-Light-Bulb; Proposed-Experiment-with-Hively-transmitter-hardware-and-microwave-oven-idea.; Light-bulbs.

No repositories were git-cloned.

© 2026 Dan Britton — research & education.
