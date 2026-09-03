Live site: https://9wzg44nz44-glitch.github.io/

# SLW Hub

Educational static site unifying Dan Britton’s Scalar Longitudinal Wave (SLW) GitHub Pages. Two separate benches: **Experiment A** 1296 MHz Faraday-cage (sleeve-balun stub + bifilar pancake) and **Experiment B** 433.59 MHz balls + polarizer rods (**no balun**), plus a shared field-kit write-up.

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
| `index.html` | Master two-experiment page (hash tabs `#expt-a` `#expt-b` `#kit`) |
| `kit.html` | Shared field kit (TX/RX cubes, sequential, harmonics, ballast, depth, Pelican SKUs) |
| `learn.html` | Briefing (N–Z vs Hively vs Meyl), detectors, Zimmerman 1296 MHz TM01 hardware, patents |
| `compare.html` | Side-by-side table + illustrative SNR toy |
| `tools.html` | Bifilar pancake + RG-405 stub/skirt calculator, **default 1.300 GHz**, presets 1296 MHz and 1.30 GHz |
| `lab.html` | Experiment A Faraday protocol, HAM legal box, skin-depth table, BOM, controls, CSV log, safety |
| `library.html` | Six bundled PDFs with genre labels |
| `papers/` | Verbatim PDFs (not rewritten) |
| `css/style.css`, `js/*.js`, `assets/mark.svg` | Chrome |

## Physics constants used

Skin depth **δ = 1 / √(π f μ σ)** with **σ_Cu ≈ 5.8×10⁷ S/m**, **μ = μ₀**.  
At 1.300 GHz, δ ≈ **1.833 µm**; at 8 GHz, δ ≈ **0.739 µm**.  
At 1296.000 MHz, λ ≈ 231.3 mm; λ/4 sleeve ≈ 57.8 mm air (trim if VF < 1); first-article stub λ/10 ≈ 23.1 mm. Build a sleeve balun, not a fat skirt.  
Patent Eq. 15: P_rad = I² Z₀ / (4π) with Z₀ ≈ 376.73 Ω.

## Tone

Educational only. SLW is **not** presented as settled physics. No medical, free-energy, or magnetron-oven protocol. 23 cm transmit requires a license; 1296 MHz is a calling frequency.

## Original GitHub Pages fetch (31 Aug 2026)

Fetched successfully (github.io): Educational Briefing; Bifilar Pancake Calculator; Interactive SNR; Combined SNR; Cross-Sectional SNR; Hively SNR Simulator; Mix-and-match antennas; Plasma-tube detector; Why bifilar interacts; No-Skin-effect-3D-plots; RG-405 skirt balun; N–Z 2007 simulation; Meyl–Hively–N–Z; Meyl theory detailed; Linearly Resistive Media; Proposed Experiment — Hively and Microwave Oven.

**404 Pages:** 3D-Field-Patterns-of-SLW-for-Nikolova-Zimmerman-and-Hively; Nikolova-Zimmerman-SLW-florescent-light-bulb---2007-paper; Nikolova-Zimmerman-2007-Light-Bulb; Proposed-Experiment-with-Hively-transmitter-hardware-and-microwave-oven-idea.; Light-bulbs.

No repositories were git-cloned.

© 2026 Dan Britton — research & education.
