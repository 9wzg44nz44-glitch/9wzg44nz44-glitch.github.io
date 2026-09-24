/*! sleeve-balun-snr.js — v0.2 (live E∥ map + distance_presets)
 * Formulas ONLY from hub js/fields.js + experiment-c-snr.html + Linearly Resistive LEN.
 * TinySA Ultra gen max −19 dBm (tinysa.org TinySA4). No RG-450; RG-405 host / RG-316 jumpers.
 * Patent λ/4 sphere ≠ LAB KB-1820 / KB-2016. US 12,562,930 not used for balun dims.
 * Dual Ohmic: Errata α=0 (EED) vs Exp-C Ohmic (empirical/HYP). No attenFactor 0.95.
 */
(function () {
  "use strict";

  const C = 299792458;
  const MU0 = 4 * Math.PI * 1e-7;
  const Z0 = 376.73031346177;
  const RL = 50;
  const B_HZ = 1e5;
  const N0 = -174;
  const A_EFF = Math.PI * 0.05 ** 2;
  const ETA = 0.5;
  const R_RESP = 264030;
  const ATT = { open: 0, slotted: 25, sealed: 55 };
  const GTX = 1.5;

  /** Linearly Resistive LEN — FACT fixed lengths (not invented) */
  const SUB_LEN = {
    copper_wall: 0.003175,
    air_inside: 100.584,
    steel_wall: 0.0762,
    seawater_exit: 91.44
  };

  /** TinySA Ultra ZS406 — FACT from tinysa.org TinySA4.Specification */
  const TINYSA = {
    pMin: -115,
    pMax: -19,
    pDefault: -10,
    analyzerAbsMax: 6,
    IrmsAtM19: 0.0005018722172637806,
    IpkAtM19: 0.0007097545848498854
  };

  const SPHERE_LAB = {
    1296000000: { id: "KB-1820", kind: "LAB", diaIn: 0.75, note: "LAB ¾″ Al · Exp A — NOT patent λ/4 sphere", od_m: 0.01905 },
    2450000000: { id: "KB-1820", kind: "LAB", diaIn: 0.75, note: "LAB ¾″ Al · 2.45 GHz — NOT patent λ/4 sphere", od_m: 0.01905 },
    433590000: { id: "KB-2016", kind: "LAB", diaIn: 2.5, note: "LAB 2.50″ Al · Exp B — NOT patent λ/4 sphere", od_m: 0.0635 }
  };

  const PHYSICS_VERSION = "snr-dual-sim-params-v0.2";
  const FT_TO_M = 0.3048;
  const GAP_M = 0.001;
  const RG405_OD_M = 0.086 * 0.0254;
  const COAX_R = RG405_OD_M / 2;
  const SLEEVE_R = COAX_R + 0.0005;
  const SLEEVE_MM = { 1296000000: 57.8, 2450000000: 30.6, 433590000: 172.9 };

  /** JSON distance_presets — LOCK exact numbers */
  function distancePresetRM(id, f) {
    const lam = C / f;
    const sphere = SPHERE_LAB[f] || SPHERE_LAB[1296000000];
    const D = sphere.od_m;
    switch (id) {
      case "near_far_lambda": return lam;
      case "fraunhofer_2D2_over_lambda": return 2 * D * D / lam;
      case "home_garage": return 10;
      case "home_outdoor": return 50;
      case "ship_20km": return 20000;
      case "aircraft_slant_30km_35kft":
        return Math.sqrt(30000 * 30000 + (35000 * FT_TO_M) * (35000 * FT_TO_M));
      case "leo_500km": return 500000;
      case "geo_35786km": return 35786000;
      default: return lam;
    }
  }

  function patentSphereDiaM(f) {
    return (C / f) / 2; // diameter = 2*(λ/4) = λ/2
  }

  const $ = (id) => document.getElementById(id);

  function wattsFromDbm(dbm) { return Math.pow(10, (dbm - 30) / 10); }
  function dbmFromWatts(w) { return w <= 0 ? -999 : 10 * Math.log10(w * 1000); }
  function meshPower(attEach) { return Math.pow(10, (-2 * attEach) / 10); }
  function sleeveQuarterM(f, vf) { return ((C / f) / 4) * (vf || 1); }

  /** Ohmic: Errata/SW → α=0; Exp-C Ohmic ON → HYP α·L stack */
  function readOhmic(sw, errataAlpha0) {
    if (sw || errataAlpha0) {
      return {
        alphaEff: 0,
        parts: [sw
          ? "SW mode → α forced 0 (experiment-c framing)"
          : "Errata 2022 / EED prediction → α=0 (no resistive loss for irrotational SLW)"]
      };
    }
    const parts = [];
    let aL = 0;
    const aToy = $("alphaToy") ? +$("alphaToy").value : 0.05;

    function addSeg(checked, L, name) {
      if (!checked) return;
      aL += aToy * L;
      parts.push(name + " L=" + L + " m · α=" + aToy.toFixed(3) + " (HYP Exp-C Ohmic)");
    }

    addSeg($("med_air") && $("med_air").checked, 0, "air");
    addSeg($("med_copper") && $("med_copper").checked, SUB_LEN.copper_wall, "copper wall ⅛″");
    addSeg($("med_air_inside") && $("med_air_inside").checked, SUB_LEN.air_inside, "air inside sub 330 ft");
    addSeg($("med_steel") && $("med_steel").checked, SUB_LEN.steel_wall, "steel 3″");
    addSeg($("med_seawater") && $("med_seawater").checked, SUB_LEN.seawater_exit, "seawater exit 300 ft");
    addSeg($("med_ocean_air") && $("med_ocean_air").checked, 1, "ocean–air interface toy L=1 m");
    addSeg($("med_free_space") && $("med_free_space").checked, 0, "free-space");

    if ($("cageOhm") && $("cageOhm").checked) {
      const Lper = $("cagePath") ? +$("cagePath").value : 1;
      const Lboth = 2 * Lper;
      aL += aToy * Lboth;
      parts.push("RadioScreen cage Ohmic TX+RX L=" + Lboth.toFixed(2) + " m (HYP; separate from TEM mesh ATT)");
    }

    const aExtra = $("alphaExtra") ? +$("alphaExtra").value : 0;
    const Lextra = $("Lextra") ? +$("Lextra").value : 0;
    if (aExtra > 0 && Lextra > 0) {
      aL += aExtra * Lextra;
      parts.push("extra α=" + aExtra.toFixed(3) + " · L=" + Lextra.toFixed(2) + " m (HYP)");
    }

    return {
      alphaEff: aL,
      parts: parts.length ? parts : ["Exp-C Ohmic ON but no segments selected (αL=0)"]
    };
  }

  function compute() {
    const f = +$("freq").value;
    const highI = $("highI").checked;
    let Ptx_dBm, Irms, Ipk, P;
    if (highI) {
      Ipk = +$("Iexplore").value;
      Irms = Ipk / Math.SQRT2;
      P = Irms * Irms * RL;
      Ptx_dBm = dbmFromWatts(P);
    } else {
      Ptx_dBm = +$("ptx").value;
      if (Ptx_dBm > TINYSA.pMax) Ptx_dBm = TINYSA.pMax;
      P = wattsFromDbm(Ptx_dBm);
      Irms = Math.sqrt(P / RL);
      Ipk = Irms * Math.SQRT2;
    }
    let r;
    if ($("log10r")) {
      r = Math.pow(10, +$("log10r").value);
      if ($("r")) $("r").value = String(r);
    } else {
      r = +$("r").value;
    }
    const cage = $("cage").value;
    const att = ATT[cage] || 0;
    const mP = meshPower(att);
    const mode = $("mode").value;
    const sw = mode === "sw";
    const errataAlpha0 = $("errataAlpha0") ? $("errataAlpha0").checked : false;
    const lnaOn = $("lna").checked;
    const nf = lnaOn ? 5 : 3;
    const lnaGain = lnaOn ? 20 : 0;
    const noise = N0 + 10 * Math.log10(B_HZ) + nf;

    const LAMBDA = C / f;
    const K0 = 2 * Math.PI * f / C;
    const D = 0.25 * LAMBDA;
    const far = 2 * D * D / LAMBDA;
    const near = r < far;

    const AeffTem = 3 * LAMBDA * LAMBDA / (8 * Math.PI);
    const PrxTem = P * GTX * AeffTem / (4 * Math.PI * r * r) * mP;
    const snrTem = dbmFromWatts(PrxTem * Math.pow(10, lnaGain / 10)) - noise;

    const Prad = (Ipk * Ipk / (4 * Math.PI)) * Z0;
    const Sgeom = Prad / (4 * Math.PI * r * r);

    const ohm = readOhmic(sw, errataAlpha0);
    const Surv = Math.exp(-ohm.alphaEff);
    const S = Sgeom * Surv;
    const ohmDb = 4.343 * ohm.alphaEff;

    const Pload = S * A_EFF * ETA * mP * Math.pow(10, lnaGain / 10);
    const snrH = dbmFromWatts(Pload) - noise;

    const Am = (MU0 * Ipk) / (2 * Math.PI * K0 * r);
    const Pnz = Math.pow((R_RESP / Math.SQRT2) * Am, 2) * RL * mP * Math.pow(10, lnaGain / 10) * Surv;
    const Az = 1e-10 * (Ipk / 0.028) * (1.5 / r) * (1.3 / (f / 1e9));
    const Pz = Math.pow(420000 * Az, 2) * RL * mP * Math.pow(10, lnaGain / 10) * Surv;

    const Epar = Math.sqrt(Math.max(S, 0) * Z0);

    const sphere = SPHERE_LAB[f] || SPHERE_LAB[1296000000];
    const sleeveM = sleeveQuarterM(f, 1);
    const patentDiaM = patentSphereDiaM(f);

    return {
      f, Ptx_dBm, P, Irms, Ipk, r, att, mP, sw, errataAlpha0, nf, noise, lnaGain,
      near, far, LAMBDA, PrxTem, snrTem, Prad, Sgeom, S, Surv, ohmDb, ohm,
      Pload, snrH, Am, Pnz, Az, Pz, Epar, sphere, sleeveM, patentDiaM, highI, cage
    };
  }

  function fmt(x, d) { return Number.isFinite(x) ? x.toExponential(d) : "\u2014"; }
  function fmtN(x, d) { return Number.isFinite(x) ? Number(x).toFixed(d) : "\u2014"; }

  function cableWarnings(s) {
    const w = [];
    if (!s.highI) {
      if (s.Ptx_dBm > TINYSA.pMax + 1e-9) {
        w.push("HARD: TinySA Ultra generator max listed step is −19 dBm (tinysa.org TinySA4). Slider clamped.");
      }
      w.push("Ultra alone @ " + fmtN(s.Ptx_dBm, 1) + " dBm → I_rms≈" + fmtN(s.Irms * 1e3, 3) +
        " mA into 50 Ω. Cable thermal limit is never the bottleneck at Ultra levels (≪ RG-316 / RG-405 ratings).");
      if (s.Ptx_dBm >= TINYSA.pMax - 0.01) {
        w.push("At −19 dBm: I_rms≈0.50 mA · I_peak≈0.71 mA (50 Ω). Analyzer abs max +6 dBm @ 0 dB atten — separate from generator.");
      }
    } else {
      w.push("Exploratory high-I (I_pk=" + fmtN(s.Ipk, 2) + " A) implies external PA — NOT TinySA Ultra. " +
        "Re-rate RG-405 host / RG-316 jumpers, connectors, BPF, legal ERP. Ultra alone never reaches these currents.");
      const Pdbm = s.Ptx_dBm;
      if (Pdbm > 30) w.push("Implied P≈" + fmtN(Pdbm, 1) + " dBm — HARD: thicker coax / PA path required.");
    }
    return w;
  }

  function render(s) {
    $("ptxOut").textContent = fmtN(s.Ptx_dBm, 1) + " dBm (Ultra max −19)";
    $("rOut").textContent = s.r.toExponential(4) + " m · " + fmtN(s.r / FT_TO_M, 1) + " ft · log10=" + fmtN(Math.log10(s.r), 2);
    $("Iout").textContent = "I_rms=" + fmt(s.Irms, 3) + " A · I_pk=" + fmt(s.Ipk, 3) + " A" +
      (s.highI ? "" : "  (at −19 dBm: ≈0.50 mA rms / 0.71 mA pk)");
    $("sphereOut").textContent = s.sphere.id + " · " + s.sphere.diaIn + "″ · " + s.sphere.note;
    $("patentOut").textContent = "PATENT US 12,525,711 optional sphere Ø=λ/2 ≈ " +
      fmtN(s.patentDiaM * 1000, 1) + " mm (" + fmtN(s.patentDiaM / 0.0254, 2) + "″) — NOT the LAB ball";
    $("sleeveOut").textContent = "λ/4 sleeve on RG-405/U (VF=1) ≈ " + fmtN(s.sleeveM * 1000, 1) +
      " mm · λ=" + fmtN(s.LAMBDA * 1000, 1) + " mm";

    if ($("IexploreOut")) $("IexploreOut").textContent = fmtN(+$("Iexplore").value, 2) + " A pk";
    if ($("alphaExtraOut")) $("alphaExtraOut").textContent = (+$("alphaExtra").value).toFixed(3) + " Np/m";
    if ($("LextraOut")) $("LextraOut").textContent = (+$("Lextra").value).toFixed(2) + " m";
    if ($("cagePathOut")) $("cagePathOut").textContent = (+$("cagePath").value).toFixed(2) + " m/tent";
    if ($("alphaToyOut")) $("alphaToyOut").textContent = (+$("alphaToy").value).toFixed(3) + " Np/m (HYP)";

    const nearNote = s.near
      ? " <em>r</em> inside ~" + fmtN(s.far, 3) + " m far-field estimate — Friis is a caveat, not a measurement."
      : "";

    $("temOut").innerHTML =
      "I<sub>rms</sub>=" + fmt(s.Irms, 3) + " A · P<sub>rx,TEM</sub>(mesh)=" + fmtN(dbmFromWatts(s.PrxTem), 1) + " dBm<br>" +
      "SNR<sub>TEM</sub>≈<strong>" + fmtN(s.snrTem, 1) + " dB</strong> (B=100 kHz, NF=" + s.nf + " dB" +
      (s.lnaGain ? ", LNA +20 dB" : "") + ")." + nearNote;

    const ohmLabel = s.sw ? "SW α=0" : (s.errataAlpha0 ? "Errata α=0 (EED)" : "Exp-C Ohmic HYP");
    $("slwOut").innerHTML =
      "P<sub>rad</sub> (Eq.15)=" + fmt(s.Prad, 3) + " W · S<sub>geom</sub>=" + fmt(s.Sgeom, 3) + " W/m²<br>" +
      "Ohmic [" + ohmLabel + "] survival=" + fmtN(100 * s.Surv, 2) + "% (" + fmtN(s.ohmDb, 2) + " dB) · S=" + fmt(s.S, 3) + " W/m²<br>" +
      "E∥≈√(S·Z<sub>0</sub>)=<strong>" + fmt(s.Epar, 3) + " V/m</strong> <em>(illustrative cartoon)</em><br>" +
      "A<sub>m</sub>(NZ)=" + fmt(s.Am, 3) + " Wb/m · A<sub>z</sub>(Z)=" + fmt(s.Az, 3) + " Wb/m<br>" +
      "SNR<sub>Hively</sub>≈<strong>" + fmtN(s.snrH, 1) + " dB</strong> · P<sub>load</sub>=" + fmtN(dbmFromWatts(s.Pload), 1) +
      " dBm · P<sub>sig,NZ</sub>=" + fmtN(dbmFromWatts(s.Pnz), 1) + " · P<sub>sig,Z</sub>=" + fmtN(dbmFromWatts(s.Pz), 1) + "<br>" +
      "Two tents × " + s.att + " dB → power × " + fmt(s.mP, 2) + ".<br>" +
      "<span class=\"footnote\">Ohmic stack: " + s.ohm.parts.join("; ") + "</span>";

    const warns = cableWarnings(s);
    const box = $("cableWarn");
    box.innerHTML = "<strong>Cable / drive</strong><ul>" + warns.map(function (t) { return "<li>" + t + "</li>"; }).join("") +
      "</ul><p class=\"footnote\" style=\"margin:.4rem 0 0\">Sleeve host <strong>RG-405/U</strong>; jumpers <strong>RG-316-class</strong>. " +
      "There is <strong>no</strong> standard RG-450/U. US&nbsp;12,562,930 is sensor/DAQ — not balun dims.</p>";
    box.hidden = false;

    $("meterE").textContent = fmt(s.Epar, 3) + " V/m";
    $("meterAm").textContent = fmt(s.Am, 3) + " Wb/m";
    $("meterAz").textContent = fmt(s.Az, 3) + " Wb/m";
    $("meterSnr").textContent = fmtN(s.snrH, 1) + " dB";
    $("meterPload").textContent = fmtN(dbmFromWatts(s.Pload), 1) + " dBm";
    $("meterOhm").textContent = fmtN(s.ohmDb, 2) + " dB";
  }

  function canvas(id) {
    const c = $(id);
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || 330;
    const h = c.clientHeight || 260;
    c.width = Math.max(1, w * d);
    c.height = Math.max(1, h * d);
    const x = c.getContext("2d");
    x.setTransform(d, 0, 0, d, 0, 0);
    x.fillStyle = "#0b1020";
    x.fillRect(0, 0, w, h);
    return { x: x, w: w, h: h };
  }
  function axes(g, titleX, titleY) {
    const x = g.x, w = g.w, h = g.h;
    x.strokeStyle = "#75839e"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(52, 15); x.lineTo(52, h - 40); x.lineTo(w - 12, h - 40); x.stroke();
    x.fillStyle = "#a9b7cc"; x.font = "11px IBM Plex Mono, monospace";
    x.fillText(titleY, 6, 13); x.fillText(titleX, w - 110, h - 12);
  }
  function labels(g, minY, maxY) {
    const x = g.x, w = g.w, h = g.h;
    x.fillStyle = "#a9b7cc"; x.font = "10px IBM Plex Mono, monospace";
    for (let i = 0; i <= 4; i++) {
      const v = minY + i * (maxY - minY) / 4;
      const py = h - 40 - i * (h - 55) / 4;
      const t = Math.abs(v) >= 1000 || (Math.abs(v) > 0 && Math.abs(v) < 0.01) ? v.toExponential(1) : v.toFixed(1);
      x.fillText(t, 2, py + 3);
      x.strokeStyle = "rgba(255,255,255,.08)";
      x.beginPath(); x.moveTo(52, py); x.lineTo(w - 12, py); x.stroke();
    }
  }
  function plotLine(g, pts, minY, maxY, color) {
    const x = g.x, w = g.w, h = g.h;
    const L = 52, R = w - 12, T = 18, B = h - 40;
    x.strokeStyle = color; x.lineWidth = 2; x.beginPath();
    pts.forEach(function (v, i) {
      const px = L + i * (R - L) / (pts.length - 1);
      const py = B - (v - minY) / (maxY - minY || 1) * (B - T);
      if (i) x.lineTo(px, py); else x.moveTo(px, py);
    });
    x.stroke();
  }
  function dualX(g, rMin, rMax) {
    const x = g.x, w = g.w, h = g.h;
    x.fillStyle = "#8aa"; x.font = "9px IBM Plex Mono, monospace";
    for (let i = 0; i <= 4; i++) {
      const rm = rMin + i * (rMax - rMin) / 4;
      const px = 52 + i * (w - 64) / 4;
      x.fillText(rm.toFixed(0) + "m", px - 8, h - 28);
      x.fillText((rm * 3.28084).toFixed(0) + "ft", px - 10, h - 16);
    }
  }


  function turbo(t) {
    t = Math.max(0, Math.min(1, t));
    const r = Math.max(0, Math.min(1, 0.13572138 + t * (4.61539260 + t * (-42.73933202 + t * (132.13108234 + t * (-152.94239396 + t * 59.28637943))))));
    const g = Math.max(0, Math.min(1, 0.09140261 + t * (2.21555694 + t * (4.07525298 + t * (-24.08076409 + t * (34.01357394 + t * -13.74514578))))));
    const b = Math.max(0, Math.min(1, 0.10667330 + t * (12.20615972 + t * (-60.50009986 + t * (110.23206676 + t * (-89.57544944 + t * 27.34824973))))));
    return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
  }

  function makeMapBand(s) {
    const f = s.f;
    const lam = s.LAMBDA;
    const sleeveL = (SLEEVE_MM[f] != null ? SLEEVE_MM[f] : (lam * 1000 / 4)) / 1000;
    const sphereR = ((s.sphere.od_m) || (s.sphere.diaIn * 0.0254)) / 2;
    const zTip = -sphereR;
    const zSleeveOpen = -(sphereR + GAP_M);
    const zSleeveClosed = zSleeveOpen - sleeveL;
    const zCoaxEnd = zSleeveClosed - 0.15 * lam;
    const win = 3.2 * lam;
    return {
      f, lam, sleeveL, sphereR, sphereD: 2 * sphereR,
      ipk: s.Ipk, prad: s.Prad,
      zTip, zSleeveOpen, zSleeveClosed, zCoaxEnd, win,
      rReactive: lam / (2 * Math.PI),
      rFresnel: lam,
      rFraunhofer: 2 * (2 * sphereR) * (2 * sphereR) / lam,
      r2lam: 2 * lam,
      r3lam: 3 * lam
    };
  }

  function maskMetal(band, x, z) {
    const rAbs = Math.abs(x);
    const rs = band.sphereR;
    if (x * x + z * z <= rs * rs) return true;
    if (rAbs <= COAX_R && z >= band.zCoaxEnd && z <= band.zTip) return true;
    if (rAbs > COAX_R && rAbs <= SLEEVE_R && z >= band.zSleeveClosed && z <= band.zSleeveOpen) return true;
    if (rAbs <= SLEEVE_R && rAbs >= COAX_R * 0.5 && Math.abs(z - band.zSleeveClosed) <= 0.00025) return true;
    return false;
  }

  function EparAtR(prad, r) {
    if (r < 1e-12) return 0;
    const S = prad / (4 * Math.PI * r * r);
    return Math.sqrt(Math.max(S, 0) * Z0);
  }

  function drawRing(ctx, sx, sy, r, color, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    // approximate circle in plot coords via many segments
    const n = 96;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = r * Math.cos(a), z = r * Math.sin(a);
      if (i === 0) ctx.moveTo(sx(x), sy(z)); else ctx.lineTo(sx(x), sy(z));
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawEfieldMap(s) {
    const canvas = $("efieldMap");
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 640;
    const cssH = cssW;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const band = makeMapBand(s);
    const pad = 36;
    const plotW = cssW - 2 * pad;
    const plotH = cssH - 2 * pad;
    const win = band.win;
    const sx = (x) => pad + ((x + win) / (2 * win)) * plotW;
    const sy = (z) => pad + ((win - z) / (2 * win)) * plotH;

    const eMax = EparAtR(band.prad, Math.max(band.sphereR * 1.08, 0.002));
    const eMin = Math.max(EparAtR(band.prad, 3 * band.lam), eMax * 1e-6);

    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, cssW, cssH);

    const step = Math.max(3, Math.floor(Math.min(plotW, plotH) / 120));
    for (let py = 0; py < plotH; py += step) {
      for (let px = 0; px < plotW; px += step) {
        const x = -win + (px / plotW) * 2 * win;
        const z = win - (py / plotH) * 2 * win;
        if (maskMetal(band, x, z)) {
          ctx.fillStyle = "#4a3a5a";
          ctx.fillRect(pad + px, pad + py, step, step);
          continue;
        }
        const rr = Math.hypot(x, z);
        const E = EparAtR(band.prad, rr);
        const t = (Math.log10(Math.max(E, eMin * 0.5)) - Math.log10(eMin)) /
                  (Math.log10(eMax) - Math.log10(eMin) || 1);
        const [cr, cg, cb] = turbo(t);
        ctx.fillStyle = "rgb(" + cr + "," + cg + "," + cb + ")";
        ctx.fillRect(pad + px, pad + py, step, step);
      }
    }

    // antenna cartoon
    ctx.fillStyle = "rgba(180,120,200,0.85)";
    ctx.beginPath();
    ctx.arc(sx(0), sy(0), Math.max(2, (band.sphereR / (2 * win)) * plotW), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7a2a9a";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // markers
    drawRing(ctx, sx, sy, band.rReactive, "rgba(160,80,200,0.9)", [4, 3]);
    drawRing(ctx, sx, sy, band.rFresnel, "rgba(40,160,80,0.9)", [5, 3]);
    if (band.rFraunhofer > band.sphereR && band.rFraunhofer < win * 1.05)
      drawRing(ctx, sx, sy, band.rFraunhofer, "rgba(220,60,60,0.85)", [3, 3]);
    drawRing(ctx, sx, sy, band.r3lam, "rgba(220,140,40,0.85)", [6, 3]);

    // selected r
    let offMap = false;
    if (s.r <= win * 1.02) {
      drawRing(ctx, sx, sy, s.r, "#ff3030", [8, 4]);
    } else {
      offMap = true;
    }

    const eAtLam = EparAtR(band.prad, band.lam) * Math.sqrt(s.Surv); // Surv=1 usually; E∥ no mP
    // E∥ uses S = Sgeom*Surv — match compute Epar which already has Surv
    const eAtR = s.Epar;
    const eAtLamExact = Math.sqrt(Math.max(s.Prad / (4 * Math.PI * band.lam * band.lam) * s.Surv, 0) * Z0);

    ctx.fillStyle = "#d7e0f2";
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.fillText("E∥ map · " + PHYSICS_VERSION, pad, 18);
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.fillStyle = "#f0c14b";
    ctx.fillText("I_pk=" + s.Ipk.toExponential(3) + "  E∥(λ)=" + eAtLamExact.toExponential(3) +
      "  E∥(r)=" + eAtR.toExponential(3), pad, cssH - 12);

    if ($("emapCaption")) {
      $("emapCaption").innerHTML =
        "f=" + (s.f / 1e6).toFixed(2) + " MHz · λ=" + (band.lam * 1000).toFixed(1) + " mm · " +
        "I<sub>pk</sub>=" + s.Ipk.toExponential(3) + " A · " +
        "E∥(λ)=<strong>" + eAtLamExact.toExponential(3) + "</strong> V/m · " +
        "E∥(r)=<strong>" + eAtR.toExponential(3) + "</strong> V/m" +
        (offMap
          ? " · <span class=\"hyp\">selected r off-map (r=" + s.r.toExponential(4) + " m); E∥(r) still in numeric strip</span>"
          : " · red dashed = selected r") +
        "<br><span class=\"footnote\">HYP / illustrative / not Maxwell near-field · LAB Keyport ≠ US 9,306,527 FIG.2B · E∥ NO mP</span>";
    }
  }

  function rangeBounds() {
    const scen = $("scenario").value;
    let rCur = $("log10r") ? Math.pow(10, +$("log10r").value) : +$("r").value;
    let rMin, rMax;
    if (scen === "garage") { rMin = 0.05; rMax = 20; }
    else if (scen === "outdoor") { rMin = 0.05; rMax = 200; }
    else if (scen === "sub") { rMin = 0.5; rMax = 5000; }
    else { rMin = 0.05; rMax = 30; }
    rMax = Math.max(rMax, rCur * 1.15);
    rMin = Math.min(rMin, Math.max(rCur / 50, 1e-3));
    return { rMin: rMin, rMax: rMax };
  }

  function sampleVsRange(s0, N) {
    const b = rangeBounds();
    const pts = { r: [], E: [], Am: [], Az: [], snr: [], Pdbm: [] };
    const f = s0.f;
    const K0 = 2 * Math.PI * f / C;
    const SurvFixed = Math.exp(-s0.ohm.alphaEff);
    const useLog = (b.rMax / b.rMin) > 50;
    for (let i = 0; i < N; i++) {
      const r = useLog
        ? Math.pow(10, Math.log10(b.rMin) + i * (Math.log10(b.rMax) - Math.log10(b.rMin)) / (N - 1))
        : b.rMin + i * (b.rMax - b.rMin) / (N - 1);
      const Sgeom = s0.Prad / (4 * Math.PI * r * r);
      const S = Sgeom * SurvFixed;
      const Epar = Math.sqrt(Math.max(S, 0) * Z0);
      const Am = (MU0 * s0.Ipk) / (2 * Math.PI * K0 * r);
      const Az = 1e-10 * (s0.Ipk / 0.028) * (1.5 / r) * (1.3 / (f / 1e9));
      const Pload = S * A_EFF * ETA * s0.mP * Math.pow(10, s0.lnaGain / 10);
      const snrH = dbmFromWatts(Pload) - s0.noise;
      pts.r.push(r); pts.E.push(Epar); pts.Am.push(Am); pts.Az.push(Az);
      pts.snr.push(snrH); pts.Pdbm.push(dbmFromWatts(Pload));
    }
    pts.b = b;
    return pts;
  }

  function drawPlots(s) {
    const N = 120;
    const pts = sampleVsRange(s, N);
    const b = pts.b;

    const g1 = canvas("plotE");
    const Edb = pts.E.map(function (v) { return 20 * Math.log10(Math.max(v, 1e-30)); });
    let mn = Math.min.apply(null, Edb) - 3, mx = Math.max.apply(null, Edb) + 3;
    if (!Number.isFinite(mn)) { mn = -200; mx = 0; }
    axes(g1, "range →", "E∥ dB(V/m)"); labels(g1, mn, mx);
    plotLine(g1, Edb, mn, mx, "#ff9f43"); dualX(g1, b.rMin, b.rMax);

    const g2 = canvas("plotA");
    const AmDb = pts.Am.map(function (v) { return 20 * Math.log10(Math.max(v, 1e-30)); });
    const AzDb = pts.Az.map(function (v) { return 20 * Math.log10(Math.max(v, 1e-30)); });
    mn = Math.min(Math.min.apply(null, AmDb), Math.min.apply(null, AzDb)) - 3;
    mx = Math.max(Math.max.apply(null, AmDb), Math.max.apply(null, AzDb)) + 3;
    if (!Number.isFinite(mn)) { mn = -300; mx = -100; }
    axes(g2, "range →", "A dB(Wb/m)"); labels(g2, mn, mx);
    plotLine(g2, AmDb, mn, mx, "#55d6be"); plotLine(g2, AzDb, mn, mx, "#a979ff");
    dualX(g2, b.rMin, b.rMax);
    g2.x.fillStyle = "#55d6be"; g2.x.fillText("A_m NZ", 60, 28);
    g2.x.fillStyle = "#a979ff"; g2.x.fillText("A_z Zim", 120, 28);
    g2.x.fillStyle = "#8aa"; g2.x.font = "9px IBM Plex Mono, monospace";
    g2.x.fillText("Φ/C educational only — no separate Φ formula", 60, 42);

    const g3 = canvas("plotSnr");
    mn = Math.min.apply(null, pts.snr) - 5; mx = Math.max.apply(null, pts.snr) + 5;
    if (!Number.isFinite(mn)) { mn = -100; mx = 0; }
    axes(g3, "range →", "SNR_Hively dB"); labels(g3, mn, mx);
    plotLine(g3, pts.snr, mn, mx, "#55d6be"); dualX(g3, b.rMin, b.rMax);
    const frac = (s.r - b.rMin) / (b.rMax - b.rMin || 1);
    const px = 52 + Math.max(0, Math.min(1, frac)) * (g3.w - 64);
    g3.x.strokeStyle = "#f0c14b"; g3.x.setLineDash([4, 3]);
    g3.x.beginPath(); g3.x.moveTo(px, 18); g3.x.lineTo(px, g3.h - 40); g3.x.stroke();
    g3.x.setLineDash([]);
  }

  function applyScenario() {
    const scen = $("scenario").value;
    if (scen === "garage") {
      // media garage — r owned by distance preset
      $("cage").value = "sealed";
      $("errataAlpha0").checked = true;
      $("cageOhm").checked = false;
      $("med_air").checked = true;
      $("med_copper").checked = false;
      $("med_air_inside").checked = false;
      $("med_steel").checked = false;
      $("med_seawater").checked = false;
      $("med_ocean_air").checked = false;
      $("med_free_space").checked = false;
      $("highI").checked = false;
      $("ptx").value = -19;
    } else if (scen === "outdoor") {
      // media outdoor — r owned by distance preset
      $("cage").value = "open";
      $("errataAlpha0").checked = true;
      $("cageOhm").checked = false;
      $("med_air").checked = true;
      $("med_free_space").checked = true;
      $("med_copper").checked = false;
      $("med_air_inside").checked = false;
      $("med_steel").checked = false;
      $("med_seawater").checked = false;
      $("med_ocean_air").checked = false;
      $("highI").checked = false;
    } else if (scen === "sub") {
      // media sub — r owned by distance preset
      $("cage").value = "sealed";
      $("errataAlpha0").checked = true;
      $("cageOhm").checked = false;
      $("med_air").checked = true;
      $("med_copper").checked = true;
      $("med_air_inside").checked = true;
      $("med_steel").checked = true;
      $("med_seawater").checked = true;
      $("med_ocean_air").checked = true;
      $("med_free_space").checked = true;
      $("highI").checked = false;
      $("ptx").value = -19;
    }
    syncHighI();
    syncOhmicUI();
    applyDistancePreset(false);
  }


  function applyDistancePreset(fromUser) {
    const el = $("distPreset");
    if (!el) return;
    const f = +$("freq").value;
    const id = el.value;
    const rM = distancePresetRM(id, f);
    if ($("log10r")) {
      const lo = Math.log10(Math.max(rM, 1e-6));
      $("log10r").value = String(Math.max(-2, Math.min(7.6, lo)));
    }
    if ($("r")) $("r").value = String(rM);
    if ($("distNote")) {
      const lam = C / f;
      let extra = "";
      if (id === "aircraft_slant_30km_35kft") {
        extra = " Slant = √(30000² + (35000×0.3048)²) = " + rM.toFixed(3) + " m (horiz 30 km · alt 35000 ft).";
      }
      if (id === "fraunhofer_2D2_over_lambda") {
        const sphere = SPHERE_LAB[f] || SPHERE_LAB[1296000000];
        const Rs = sphere.od_m / 2;
        if (rM < Rs) extra = " WARN: 2D²/λ is INSIDE LAB sphere R=" + Rs.toExponential(3) + " m.";
      }
      $("distNote").textContent =
        "Preset " + id + " → r=" + rM.toExponential(4) + " m (" + (rM / FT_TO_M).toFixed(1) + " ft). λ=" +
        lam.toExponential(4) + " m." + extra +
        " Media Ohmic L_eff unchanged (no invented seawater α for free-space long paths).";
    }
  }

  function syncHighI() {
    const on = $("highI").checked;
    $("ptx").disabled = on;
    $("Iexplore").disabled = !on;
    $("highIbox").classList.toggle("warn-on", on);
  }

  function syncOhmicUI() {
    const sw = $("mode").value === "sw";
    const errata = $("errataAlpha0").checked;
    const lock = sw || errata;
    ["cageOhm", "alphaToy", "cagePath", "alphaExtra", "Lextra",
      "med_air", "med_copper", "med_air_inside", "med_steel", "med_seawater", "med_ocean_air", "med_free_space"
    ].forEach(function (id) {
      const el = $(id);
      if (el) el.disabled = lock && id !== "med_air" && id !== "med_free_space" ? lock : (lock && (id === "cageOhm" || id === "alphaToy" || id === "cagePath" || id === "alphaExtra" || id === "Lextra" || id.indexOf("med_") === 0));
    });
    // simpler: disable ohmic controls when α forced 0
    const ids = ["cageOhm", "alphaToy", "cagePath", "alphaExtra", "Lextra",
      "med_copper", "med_air_inside", "med_steel", "med_seawater", "med_ocean_air"];
    ids.forEach(function (id) { const el = $(id); if (el) el.disabled = lock; });
    if ($("ohmicNote")) {
      $("ohmicNote").textContent = lock
        ? (sw ? "SW → α=0 locked." : "Errata α=0 (EED) locked — uncheck to enable Exp-C Ohmic HYP sensitivity.")
        : "Exp-C Ohmic HYP ON — α·L uses Linearly Resistive fixed lengths; NOT attenFactor 0.95.";
    }
  }

  function syncFreq() {
    const f = +$("freq").value;
    const sp = SPHERE_LAB[f];
    if (sp) $("sphereOut").textContent = sp.id + " · " + sp.diaIn + "″ · " + sp.note;
  }

  function tick() {
    syncOhmicUI();
    const s = compute();
    render(s);
    drawPlots(s);
    drawEfieldMap(s);
  }

  const ids = [
    "freq", "ptx", "r", "log10r", "distPreset", "cage", "mode", "lna", "scenario", "highI", "Iexplore",
    "errataAlpha0", "cageOhm", "cagePath", "alphaExtra", "Lextra", "alphaToy",
    "med_air", "med_copper", "med_air_inside", "med_steel", "med_seawater", "med_ocean_air", "med_free_space"
  ];
  ids.forEach(function (id) {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", tick);
    el.addEventListener("change", tick);
  });
  $("scenario").addEventListener("change", function () { applyScenario(); tick(); });
  $("highI").addEventListener("change", function () { syncHighI(); tick(); });
  $("freq").addEventListener("change", function () {
    syncFreq();
    const id = $("distPreset") ? $("distPreset").value : "";
    if (id === "near_far_lambda" || id === "fraunhofer_2D2_over_lambda") applyDistancePreset(false);
    tick();
  });
  if ($("distPreset")) {
    $("distPreset").addEventListener("change", function () { applyDistancePreset(true); tick(); });
  }
  $("mode").addEventListener("change", function () { syncOhmicUI(); tick(); });
  $("errataAlpha0").addEventListener("change", function () { syncOhmicUI(); tick(); });
  window.addEventListener("resize", tick);

  syncHighI();
  syncFreq();
  syncOhmicUI();
  applyDistancePreset(false);
  tick();
})();
