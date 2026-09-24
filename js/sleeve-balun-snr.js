/*! sleeve-balun-snr.js — FIRST DRAFT
 * Formulas ONLY from hub js/fields.js + experiment-c-snr.html.
 * Media α presets + E∥ cartoon are labeled HYP/illustrative (see physics-constants.json).
 * SLW is not settled physics. Educational / not a measurement.
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

  /** Illustrative HYP α_ohm (Np/m power) — NOT attenFactor 0.95 */
  const MEDIA_ALPHA = {
    air: { alpha: 0, L: 0, label: "air (illustrative α=0)" },
    steel: { alpha: 2.0, L: 0.0762, label: "3″ steel hull (HYP α=2 Np/m · L=0.0762 m)" },
    seawater: { alpha: 0.05, L: 100, label: "seawater (HYP α=0.05 · L default 100 m)" },
    ocean_air: { alpha: 0.02, L: 1, label: "ocean–air interface (HYP α=0.02 · L=1 m)" },
    free_space: { alpha: 0, L: 0, label: "free-space (illustrative α=0)" }
  };

  const CABLE = {
    flexSMA: 0.5,
    rg405: 1.5,
    rg450: 3.0,
    tinysaCleanDbm: 10,
    tinysaFlagDbm: 15
  };

  const SPHERE = {
    1296000000: { id: "KB-1820", diaIn: 0.75, note: "¾″ hollow Al · Exp A / 1.3 GHz" },
    2450000000: { id: "KB-1820", diaIn: 0.75, note: "¾″ hollow Al · 2.45 GHz" },
    433590000: { id: "KB-2016", diaIn: 2.5, note: "2.5″ hollow Al · Exp B ≈433.59 MHz" }
  };

  const $ = (id) => document.getElementById(id);

  function wattsFromDbm(dbm) { return Math.pow(10, (dbm - 30) / 10); }
  function dbmFromWatts(w) { return w <= 0 ? -999 : 10 * Math.log10(w * 1000); }
  function meshPower(attEach) { return Math.pow(10, (-2 * attEach) / 10); }

  function sleeveQuarterM(f, vf) {
    return ((C / f) / 4) * (vf || 1);
  }

  function readMediaAlpha(sw) {
    if (sw) return { alphaEff: 0, Ltot: 0, parts: ["SW mode → α forced 0"] };
    const parts = [];
    let aL = 0;
    ["air", "steel", "seawater", "ocean_air", "free_space"].forEach(function (key) {
      const el = $("med_" + key);
      if (el && el.checked) {
        const m = MEDIA_ALPHA[key];
        aL += m.alpha * m.L;
        parts.push(m.label + " (αL=" + (m.alpha * m.L).toFixed(4) + ")");
      }
    });
    // Cage Ohmic path at BOTH TX and RX (separate from TEM mesh ATT)
    const cageOhm = $("cageOhm");
    const cagePath = $("cagePath");
    if (cageOhm && cageOhm.checked) {
      const aCage = 0.05; // HYP radioscreen_cage_path
      const Lper = cagePath ? +cagePath.value : 1;
      const Lboth = 2 * Lper;
      aL += aCage * Lboth;
      parts.push("RadioScreen cage Ohmic TX+RX (HYP α=0.05 · L=" + Lboth.toFixed(2) + " m)");
    }
    // Optional custom path overlay (garage walls etc.)
    const aExtra = $("alphaExtra") ? +$("alphaExtra").value : 0;
    const Lextra = $("Lextra") ? +$("Lextra").value : 0;
    if (aExtra > 0 && Lextra > 0) {
      aL += aExtra * Lextra;
      parts.push("extra path α=" + aExtra.toFixed(3) + " · L=" + Lextra.toFixed(2) + " m (illustrative)");
    }
    return { alphaEff: aL, Ltot: 1, parts: parts.length ? parts : ["no Ohmic media selected (αL=0)"] };
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
      P = wattsFromDbm(Ptx_dBm);
      Irms = Math.sqrt(P / RL);
      Ipk = Irms * Math.SQRT2;
    }
    const r = +$("r").value;
    const cage = $("cage").value;
    const att = ATT[cage] || 0;
    const mP = meshPower(att);
    const mode = $("mode").value;
    const sw = mode === "sw";
    const lnaOn = $("lna").checked;
    const nf = lnaOn ? 5 : 3;
    const lnaGain = lnaOn ? 20 : 0;
    const noise = N0 + 10 * Math.log10(B_HZ) + nf;

    const LAMBDA = C / f;
    const K0 = 2 * Math.PI * f / C;
    const D = 0.25 * LAMBDA;
    const far = 2 * D * D / LAMBDA;
    const near = r < far;

    // TEM Friis (fields.js) — far-field caveat
    const AeffTem = 3 * LAMBDA * LAMBDA / (8 * Math.PI);
    const PrxTem = P * GTX * AeffTem / (4 * Math.PI * r * r) * mP;
    const snrTem = dbmFromWatts(PrxTem * Math.pow(10, lnaGain / 10)) - noise;

    // Hively Eq.15 chain (fields.js)
    const Prad = (Ipk * Ipk / (4 * Math.PI)) * Z0;
    const Sgeom = Prad / (4 * Math.PI * r * r);

    const ohm = readMediaAlpha(sw);
    // experiment-c-snr: S = S_geom * exp(-α L); here alphaEff already = Σ α_i L_i
    const Surv = Math.exp(-ohm.alphaEff);
    const S = Sgeom * Surv;
    const ohmDb = 4.343 * ohm.alphaEff;

    const Pload = S * A_EFF * ETA * mP * Math.pow(10, lnaGain / 10);
    const snrH = dbmFromWatts(Pload) - noise;

    // NZ Am + Zimmerman Az (fields.js)
    const Am = (MU0 * Ipk) / (2 * Math.PI * K0 * r);
    const Pnz = Math.pow((R_RESP / Math.SQRT2) * Am, 2) * RL * mP * Math.pow(10, lnaGain / 10) * Surv;
    const Az = 1e-10 * (Ipk / 0.028) * (1.5 / r) * (1.3 / (f / 1e9));
    const Pz = Math.pow(420000 * Az, 2) * RL * mP * Math.pow(10, lnaGain / 10) * Surv;

    // E∥ illustrative from Hively S / Z0 cartoon
    const Epar = Math.sqrt(Math.max(S, 0) * Z0);

    const sphere = SPHERE[f] || SPHERE[1296000000];
    const sleeveM = sleeveQuarterM(f, 1);

    return {
      f, Ptx_dBm, P, Irms, Ipk, r, att, mP, sw, nf, noise, lnaGain,
      near, far, LAMBDA, PrxTem, snrTem, Prad, Sgeom, S, Surv, ohmDb, ohm,
      Pload, snrH, Am, Pnz, Az, Pz, Epar, sphere, sleeveM, highI, cage
    };
  }

  function fmt(x, d) { return Number.isFinite(x) ? x.toExponential(d) : "\u2014"; }
  function fmtN(x, d) { return Number.isFinite(x) ? Number(x).toFixed(d) : "\u2014"; }

  function cableWarnings(s) {
    const w = [];
    if (s.Irms > CABLE.flexSMA) {
      w.push("HARD: I_rms=" + fmtN(s.Irms, 3) + " A exceeds thin flexible SMA caution (~" + CABLE.flexSMA + " A). Use heavier coax / external PA.");
    }
    if (s.Irms > CABLE.rg405) {
      w.push("HARD: I_rms exceeds educational RG-405 caution (~" + CABLE.rg405 + " A).");
    }
    if (s.Irms > CABLE.rg450) {
      w.push("HARD: I_rms exceeds educational RG-450-class caution (~" + CABLE.rg450 + " A). Stop — redesign feed.");
    }
    if (!s.highI && s.Ptx_dBm > CABLE.tinysaFlagDbm) {
      w.push("TinySA Ultra typically milliwatts; P_tx=" + fmtN(s.Ptx_dBm, 1) + " dBm is beyond clean generator output (flag >" + CABLE.tinysaFlagDbm + " dBm).");
    } else if (!s.highI && s.Ptx_dBm > CABLE.tinysaCleanDbm) {
      w.push("Caution: P_tx above typical TinySA Ultra clean max (~" + CABLE.tinysaCleanDbm + " dBm).");
    }
    if (s.highI && s.Ipk >= 10) {
      w.push("Exploratory high-I mode (I_pk=" + fmtN(s.Ipk, 2) + " A). Educational only — cable / PA / license limits apply. Not a TinySA drive.");
    }
    return w;
  }

  function render(s) {
    $("ptxOut").textContent = fmtN(s.Ptx_dBm, 1) + " dBm";
    $("rOut").textContent = fmtN(s.r, 2) + " m · " + fmtN(s.r * 3.280839895, 1) + " ft";
    $("Iout").textContent = "I_rms=" + fmt(s.Irms, 3) + " A · I_pk=" + fmt(s.Ipk, 3) + " A";
    $("sphereOut").textContent = s.sphere.id + " · " + s.sphere.diaIn + "″ · " + s.sphere.note;
    $("sleeveOut").textContent = "λ/4 sleeve (VF=1) ≈ " + fmtN(s.sleeveM * 1000, 1) + " mm · λ=" + fmtN(s.LAMBDA * 1000, 1) + " mm";

    if ($("IexploreOut")) $("IexploreOut").textContent = fmtN(+$("Iexplore").value, 2) + " A pk";
    if ($("alphaExtraOut")) $("alphaExtraOut").textContent = (+$("alphaExtra").value).toFixed(3) + " Np/m";
    if ($("LextraOut")) $("LextraOut").textContent = (+$("Lextra").value).toFixed(2) + " m";
    if ($("cagePathOut")) $("cagePathOut").textContent = (+$("cagePath").value).toFixed(2) + " m/tent";

    const nearNote = s.near
      ? " <em>r</em> inside ~" + fmtN(s.far, 3) + " m far-field estimate — Friis is a caveat, not a measurement."
      : "";

    $("temOut").innerHTML =
      "I<sub>rms</sub>=" + fmt(s.Irms, 3) + " A · P<sub>rx,TEM</sub>(mesh)=" + fmtN(dbmFromWatts(s.PrxTem), 1) + " dBm<br>" +
      "SNR<sub>TEM</sub>≈<strong>" + fmtN(s.snrTem, 1) + " dB</strong> (B=100 kHz, NF=" + s.nf + " dB" +
      (s.lnaGain ? ", LNA +20 dB" : "") + ")." + nearNote;

    $("slwOut").innerHTML =
      "P<sub>rad</sub> (Eq.15)=" + fmt(s.Prad, 3) + " W · S<sub>geom</sub>=" + fmt(s.Sgeom, 3) + " W/m²<br>" +
      "Ohmic survival=" + fmtN(100 * s.Surv, 2) + "% (" + fmtN(s.ohmDb, 2) + " dB) · S=" + fmt(s.S, 3) + " W/m²<br>" +
      "E∥≈√(S·Z<sub>0</sub>)=<strong>" + fmt(s.Epar, 3) + " V/m</strong> <em>(illustrative cartoon)</em><br>" +
      "A<sub>m</sub>(NZ)=" + fmt(s.Am, 3) + " Wb/m · A<sub>z</sub>(Z)=" + fmt(s.Az, 3) + " Wb/m<br>" +
      "SNR<sub>Hively</sub>≈<strong>" + fmtN(s.snrH, 1) + " dB</strong> · P<sub>load</sub>=" + fmtN(dbmFromWatts(s.Pload), 1) +
      " dBm · P<sub>sig,NZ</sub>=" + fmtN(dbmFromWatts(s.Pnz), 1) + " · P<sub>sig,Z</sub>=" + fmtN(dbmFromWatts(s.Pz), 1) + "<br>" +
      "Two tents × " + s.att + " dB → power × " + fmt(s.mP, 2) + ". Mode: " + (s.sw ? "SW (α=0)" : "SLW") + ".<br>" +
      "<span class=\"footnote\">Ohmic stack: " + s.ohm.parts.join("; ") + "</span>";

    const warns = cableWarnings(s);
    const box = $("cableWarn");
    if (warns.length) {
      box.innerHTML = "<strong>Cable / drive warnings</strong><ul>" + warns.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
      box.hidden = false;
    } else {
      box.innerHTML = "<strong>Cable guidance:</strong> I_rms within educational thin-SMA caution (≤" + CABLE.flexSMA + " A). TinySA milliwatt drive OK if P_tx ≲ " + CABLE.tinysaCleanDbm + " dBm.";
      box.hidden = false;
    }

    $("meterE").textContent = fmt(s.Epar, 3) + " V/m";
    $("meterAm").textContent = fmt(s.Am, 3) + " Wb/m";
    $("meterAz").textContent = fmt(s.Az, 3) + " Wb/m";
    $("meterSnr").textContent = fmtN(s.snrH, 1) + " dB";
    $("meterPload").textContent = fmtN(dbmFromWatts(s.Pload), 1) + " dBm";
    $("meterOhm").textContent = fmtN(s.ohmDb, 2) + " dB";
  }

  /* ---- canvas plots (experiment-c-snr chrome) ---- */
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
    x.strokeStyle = "#75839e";
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(52, 15);
    x.lineTo(52, h - 40);
    x.lineTo(w - 12, h - 40);
    x.stroke();
    x.fillStyle = "#a9b7cc";
    x.font = "11px IBM Plex Mono, monospace";
    x.fillText(titleY, 6, 13);
    x.fillText(titleX, w - 110, h - 12);
  }
  function labels(g, minY, maxY) {
    const x = g.x, w = g.w, h = g.h;
    x.fillStyle = "#a9b7cc";
    x.font = "10px IBM Plex Mono, monospace";
    for (let i = 0; i <= 4; i++) {
      const v = minY + i * (maxY - minY) / 4;
      const py = h - 40 - i * (h - 55) / 4;
      const t = Math.abs(v) >= 1000 || (Math.abs(v) > 0 && Math.abs(v) < 0.01) ? v.toExponential(1) : v.toFixed(1);
      x.fillText(t, 2, py + 3);
      x.strokeStyle = "rgba(255,255,255,.08)";
      x.beginPath();
      x.moveTo(52, py);
      x.lineTo(w - 12, py);
      x.stroke();
    }
  }
  function plotLine(g, pts, minY, maxY, color) {
    const x = g.x, w = g.w, h = g.h;
    const L = 52, R = w - 12, T = 18, B = h - 40;
    x.strokeStyle = color;
    x.lineWidth = 2;
    x.beginPath();
    pts.forEach(function (v, i) {
      const px = L + i * (R - L) / (pts.length - 1);
      const py = B - (v - minY) / (maxY - minY || 1) * (B - T);
      if (i) x.lineTo(px, py); else x.moveTo(px, py);
    });
    x.stroke();
  }
  function dualX(g, rMin, rMax) {
    const x = g.x, w = g.w, h = g.h;
    x.fillStyle = "#8aa";
    x.font = "9px IBM Plex Mono, monospace";
    for (let i = 0; i <= 4; i++) {
      const rm = rMin + i * (rMax - rMin) / 4;
      const px = 52 + i * (w - 64) / 4;
      x.fillText(rm.toFixed(0) + "m", px - 8, h - 28);
      x.fillText((rm * 3.28084).toFixed(0) + "ft", px - 10, h - 16);
    }
  }

  function rangeBounds() {
    const scen = $("scenario").value;
    if (scen === "garage") return { rMin: 1, rMax: 20 };
    if (scen === "outdoor") return { rMin: 5, rMax: 200 };
    if (scen === "sub") return { rMin: 10, rMax: 5000 };
    return { rMin: 0.5, rMax: Math.max(+$("r").value * 2, 30) };
  }

  function sampleVsRange(s0, N) {
    const b = rangeBounds();
    const pts = { r: [], E: [], Am: [], Az: [], snr: [], Pdbm: [] };
    const f = s0.f;
    const LAMBDA = C / f;
    const K0 = 2 * Math.PI * f / C;
    const sw = s0.sw;
    const ohmAL = s0.ohm.alphaEff;
    const SurvFixed = sw ? 1 : Math.exp(-ohmAL); // media αL treated as path-integrated (not ∝ r) for stack presets
    for (let i = 0; i < N; i++) {
      const r = b.rMin + i * (b.rMax - b.rMin) / (N - 1);
      const Prad = s0.Prad;
      const Sgeom = Prad / (4 * Math.PI * r * r);
      const S = Sgeom * SurvFixed;
      const Epar = Math.sqrt(Math.max(S, 0) * Z0);
      const Am = (MU0 * s0.Ipk) / (2 * Math.PI * K0 * r);
      const Az = 1e-10 * (s0.Ipk / 0.028) * (1.5 / r) * (1.3 / (f / 1e9));
      const Pload = S * A_EFF * ETA * s0.mP * Math.pow(10, s0.lnaGain / 10);
      const snrH = dbmFromWatts(Pload) - s0.noise;
      pts.r.push(r);
      pts.E.push(Epar);
      pts.Am.push(Am);
      pts.Az.push(Az);
      pts.snr.push(snrH);
      pts.Pdbm.push(dbmFromWatts(Pload));
    }
    pts.b = b;
    return pts;
  }

  function drawPlots(s) {
    const N = 120;
    const pts = sampleVsRange(s, N);
    const b = pts.b;

    // 1 · E∥ vs range
    const g1 = canvas("plotE");
    const Edb = pts.E.map(function (v) { return 20 * Math.log10(Math.max(v, 1e-30)); });
    let mn = Math.min.apply(null, Edb) - 3, mx = Math.max.apply(null, Edb) + 3;
    if (!Number.isFinite(mn)) { mn = -200; mx = 0; }
    axes(g1, "range →", "E∥ dB(V/m)");
    labels(g1, mn, mx);
    plotLine(g1, Edb, mn, mx, "#ff9f43");
    dualX(g1, b.rMin, b.rMax);

    // 2 · A_m / A_z amplitudes
    const g2 = canvas("plotA");
    const AmDb = pts.Am.map(function (v) { return 20 * Math.log10(Math.max(v, 1e-30)); });
    const AzDb = pts.Az.map(function (v) { return 20 * Math.log10(Math.max(v, 1e-30)); });
    mn = Math.min(Math.min.apply(null, AmDb), Math.min.apply(null, AzDb)) - 3;
    mx = Math.max(Math.max.apply(null, AmDb), Math.max.apply(null, AzDb)) + 3;
    if (!Number.isFinite(mn)) { mn = -300; mx = -100; }
    axes(g2, "range →", "A dB(Wb/m)");
    labels(g2, mn, mx);
    plotLine(g2, AmDb, mn, mx, "#55d6be");
    plotLine(g2, AzDb, mn, mx, "#a979ff");
    dualX(g2, b.rMin, b.rMax);
    g2.x.fillStyle = "#55d6be";
    g2.x.fillText("A_m NZ", 60, 28);
    g2.x.fillStyle = "#a979ff";
    g2.x.fillText("A_z Zim", 120, 28);
    g2.x.fillStyle = "#8aa";
    g2.x.font = "9px IBM Plex Mono, monospace";
    g2.x.fillText("Φ/C: educational framing only — no separate Φ formula", 60, 42);

    // 3 · Detector SNR / P_load
    const g3 = canvas("plotSnr");
    mn = Math.min.apply(null, pts.snr) - 5;
    mx = Math.max.apply(null, pts.snr) + 5;
    if (!Number.isFinite(mn)) { mn = -100; mx = 0; }
    axes(g3, "range →", "SNR_Hively dB");
    labels(g3, mn, mx);
    plotLine(g3, pts.snr, mn, mx, "#55d6be");
    dualX(g3, b.rMin, b.rMax);
    // mark current r
    const frac = (s.r - b.rMin) / (b.rMax - b.rMin || 1);
    const px = 52 + Math.max(0, Math.min(1, frac)) * (g3.w - 64);
    g3.x.strokeStyle = "#f0c14b";
    g3.x.setLineDash([4, 3]);
    g3.x.beginPath();
    g3.x.moveTo(px, 18);
    g3.x.lineTo(px, g3.h - 40);
    g3.x.stroke();
    g3.x.setLineDash([]);
  }

  function applyScenario() {
    const scen = $("scenario").value;
    if (scen === "garage") {
      $("r").min = 1; $("r").max = 20; $("r").value = 10;
      $("cage").value = "sealed";
      $("cageOhm").checked = true;
      $("med_air").checked = true;
      $("med_steel").checked = false;
      $("med_seawater").checked = false;
      $("med_ocean_air").checked = false;
      $("med_free_space").checked = false;
      $("highI").checked = false;
    } else if (scen === "outdoor") {
      $("r").min = 5; $("r").max = 200; $("r").value = 50;
      $("cage").value = "open";
      $("cageOhm").checked = false;
      $("med_air").checked = true;
      $("med_free_space").checked = true;
      $("med_steel").checked = false;
      $("med_seawater").checked = false;
      $("med_ocean_air").checked = false;
    } else if (scen === "sub") {
      $("r").min = 10; $("r").max = 5000; $("r").value = 1000;
      $("cage").value = "sealed";
      $("cageOhm").checked = true;
      $("med_air").checked = true;
      $("med_steel").checked = true;
      $("med_seawater").checked = true;
      $("med_ocean_air").checked = true;
      $("med_free_space").checked = true;
      $("highI").checked = true;
      $("Iexplore").value = 10;
    }
    syncHighI();
  }

  function syncHighI() {
    const on = $("highI").checked;
    $("ptx").disabled = on;
    $("Iexplore").disabled = !on;
    $("highIbox").classList.toggle("warn-on", on);
  }

  function syncFreq() {
    const f = +$("freq").value;
    const sp = SPHERE[f];
    if (sp) $("sphereOut").textContent = sp.id + " · " + sp.diaIn + "″ · " + sp.note;
  }

  function tick() {
    const s = compute();
    render(s);
    drawPlots(s);
  }

  const ids = [
    "freq", "ptx", "r", "cage", "mode", "lna", "scenario", "highI", "Iexplore",
    "cageOhm", "cagePath", "alphaExtra", "Lextra",
    "med_air", "med_steel", "med_seawater", "med_ocean_air", "med_free_space"
  ];
  ids.forEach(function (id) {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", tick);
    el.addEventListener("change", tick);
  });
  $("scenario").addEventListener("change", function () { applyScenario(); tick(); });
  $("highI").addEventListener("change", function () { syncHighI(); tick(); });
  $("freq").addEventListener("change", function () { syncFreq(); tick(); });
  window.addEventListener("resize", tick);

  syncHighI();
  syncFreq();
  tick();
})();
