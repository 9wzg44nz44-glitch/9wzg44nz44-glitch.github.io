/*! sleeve-balun-efield.js — efield-maps-v0 / snr-dual-sim-params-v0.2
 * 2D color-shaded E∥ cartoon around Keyport sleeve + LAB sphere TX.
 * Formulas ONLY from physics-constants.json / js/fields.js / sleeve-balun-snr.js:
 *   P_rad = I_pk² Z0/(4π)  (Hively Eq.15)
 *   S(r)  = P_rad/(4π r²)
 *   E∥(r) ≈ √(S·Z0)        HYP / illustrative isotropic 1/r magnitude
 * NOT a Maxwell near-field solution. TinySA −19 dBm FACT unchanged.
 */
(function () {
  "use strict";

  const C = 299792458;
  const Z0 = 376.73031346177;
  const RL = 50;
  const PHYSICS_VERSION = "snr-dual-sim-params-v0.2";
  const MAPS_ID = "efield-maps-v0";
  const P_DBM = -19; // TinySA Ultra gen max — FACT, unchanged
  const GAP_M = 0.001; // 0.1 cm Keyport
  const RG405_OD_M = 0.086 * 0.0254;
  const COAX_R = RG405_OD_M / 2;
  const SLEEVE_R = COAX_R + 0.0005;

  const BANDS = {
    expB_433: {
      key: "expB_433",
      label: "Exp B · 433.59 MHz · KB-2016 2.50″",
      f: 433590000,
      sphereOD_in: 2.5,
      sphereSku: "KB-2016",
      sleeve_mm: 172.9
    },
    expA_1296: {
      key: "expA_1296",
      label: "Exp A · 1.296 GHz · KB-1820 ¾″",
      f: 1296000000,
      sphereOD_in: 0.75,
      sphereSku: "KB-1820",
      sleeve_mm: 57.8
    },
    ism_2450: {
      key: "ism_2450",
      label: "ISM · 2.45 GHz · KB-1820 ¾″",
      f: 2450000000,
      sphereOD_in: 0.75,
      sphereSku: "KB-1820",
      sleeve_mm: 30.6
    }
  };

  function wattsFromDbm(dbm) { return Math.pow(10, (dbm - 30) / 10); }
  function IpkFromDbm(dbm) {
    const P = wattsFromDbm(dbm);
    const Irms = Math.sqrt(P / RL);
    return Irms * Math.SQRT2;
  }
  function pradHively(ipk) { return (ipk * ipk * Z0) / (4 * Math.PI); }
  function SHively(prad, r) { return prad / (4 * Math.PI * r * r); }
  function EparFromS(S) { return Math.sqrt(Math.max(S, 0) * Z0); }
  function EparAtR(prad, r) {
    if (r < 1e-12) return 0;
    return EparFromS(SHively(prad, r));
  }

  function makeBand(spec) {
    const f = spec.f;
    const lam = C / f;
    const sleeveL = (spec.sleeve_mm != null) ? spec.sleeve_mm / 1000 : lam / 4;
    const sphereR = (spec.sphereOD_in * 0.0254) / 2;
    const sphereD = 2 * sphereR;
    const ipk = IpkFromDbm(P_DBM);
    const prad = pradHively(ipk);
    const zTip = -sphereR;
    const zSleeveOpen = -(sphereR + GAP_M);
    const zSleeveClosed = zSleeveOpen - sleeveL;
    const zCoaxEnd = zSleeveClosed - 0.15 * lam;
    const win = 2.5 * lam;
    return {
      spec, f, lam, sleeveL, sphereR, sphereD, ipk, prad,
      zTip, zSleeveOpen, zSleeveClosed, zCoaxEnd, win,
      rReactive: lam / (2 * Math.PI),
      rFresnel: lam,
      rFraunhofer: 2 * sphereD * sphereD / lam,
      r2lam: 2 * lam
    };
  }

  function maskMetal(band, x, z) {
    const rAbs = Math.abs(x);
    const rs = band.sphereR;
    if (x * x + z * z <= rs * rs) return true;
    const zo = band.zSleeveOpen, zc = band.zSleeveClosed, zTip = band.zTip;
    if (rAbs <= COAX_R && z >= band.zCoaxEnd && z <= zTip) return true;
    if (rAbs > COAX_R && rAbs <= SLEEVE_R && z >= zc && z <= zo) return true;
    if (rAbs <= SLEEVE_R && rAbs >= COAX_R * 0.5 && Math.abs(z - zc) <= 0.00025) return true;
    return false;
  }

  /* Turbo-like perceptual log scale (approx) */
  function turbo(t) {
    t = Math.max(0, Math.min(1, t));
    const r = Math.max(0, Math.min(1, 0.13572138 + t * (4.61539260 + t * (-42.73933202 + t * (132.13108234 + t * (-152.94239396 + t * 59.28637943))))));
    const g = Math.max(0, Math.min(1, 0.09140261 + t * (2.21555694 + t * (4.07525298 + t * (-24.08076409 + t * (34.01357394 + t * -13.74514578))))));
    const b = Math.max(0, Math.min(1, 0.10667330 + t * (12.20615972 + t * (-60.50009986 + t * (110.23206676 + t * (-89.57544944 + t * 27.34824973))))));
    return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
  }

  function fmtSci(x, dig) {
    if (!isFinite(x) || x === 0) return "0";
    return Number(x).toExponential(dig == null ? 2 : dig);
  }
  function fmtN(x, d) {
    if (!isFinite(x)) return "—";
    return Number(x).toFixed(d);
  }

  const $ = (id) => document.getElementById(id);

  let currentKey = "expA_1296";
  let bandCache = {};
  let hover = null;

  function bandOf(key) {
    if (!bandCache[key]) bandCache[key] = makeBand(BANDS[key]);
    return bandCache[key];
  }

  function drawLegend(ctx, x0, y0, h, eMin, eMax) {
    const w = 18;
    for (let i = 0; i < h; i++) {
      const t = 1 - i / (h - 1);
      const [r, g, b] = turbo(t);
      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      ctx.fillRect(x0, y0 + i, w, 2);
    }
    ctx.strokeStyle = "#ccc";
    ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = "#d7e0f2";
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.textAlign = "left";
    const ticks = 6;
    for (let i = 0; i <= ticks; i++) {
      const t = i / ticks;
      const logE = Math.log10(eMax) * (1 - t) + Math.log10(eMin) * t;
      const E = Math.pow(10, logE);
      const y = y0 + t * h;
      ctx.fillText(fmtSci(E, 1) + " V/m", x0 + w + 6, y + 4);
    }
    ctx.fillStyle = "#9ab";
    ctx.font = "10px Source Sans 3, sans-serif";
    ctx.fillText("log₁₀ E∥", x0 - 2, y0 - 8);
  }

  function drawMap() {
    const canvas = $("efieldCanvas");
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 720;
    const cssH = Math.max(420, Math.min(720, cssW * 0.92));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const band = bandOf(currentKey);
    const padL = 48, padR = 110, padT = 28, padB = 42;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;
    const win = band.win;
    const sx = (x) => padL + ((x + win) / (2 * win)) * plotW;
    const sy = (z) => padT + ((win - z) / (2 * win)) * plotH; // +z up

    const eMax = EparAtR(band.prad, Math.max(band.sphereR * 1.05, 0.002));
    const eMin = Math.max(EparAtR(band.prad, 3 * band.lam), eMax * 1e-6);

    // raster
    const step = Math.max(2, Math.floor(Math.min(plotW, plotH) / 220));
    for (let py = 0; py < plotH; py += step) {
      for (let px = 0; px < plotW; px += step) {
        const x = -win + (px / plotW) * 2 * win;
        const z = win - (py / plotH) * 2 * win;
        if (maskMetal(band, x, z)) {
          ctx.fillStyle = "#3a3f4a";
          ctx.fillRect(padL + px, padT + py, step, step);
          continue;
        }
        const r = Math.hypot(x, z);
        const E = EparAtR(band.prad, r);
        const t = (Math.log10(Math.max(E, eMin * 0.5)) - Math.log10(eMin)) /
                  (Math.log10(eMax) - Math.log10(eMin));
        const [cr, cg, cb] = turbo(t);
        ctx.fillStyle = "rgb(" + cr + "," + cg + "," + cb + ")";
        ctx.fillRect(padL + px, padT + py, step, step);
      }
    }

    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(0), padT); ctx.lineTo(sx(0), padT + plotH);
    ctx.moveTo(padL, sy(0)); ctx.lineTo(padL + plotW, sy(0));
    ctx.stroke();

    // marker rings
    function ring(r, color, label, force) {
      if (!force && (r > win * 1.02 || r < band.sphereR * 1.02)) return false;
      if (r > win * 1.05) return false;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      const n = 96;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const xx = sx(r * Math.cos(a));
        const zz = sy(r * Math.sin(a));
        if (i === 0) ctx.moveTo(xx, zz); else ctx.lineTo(xx, zz);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = "10px IBM Plex Mono, monospace";
      const lx = sx(r / Math.SQRT2);
      const ly = sy(r / Math.SQRT2);
      ctx.fillText(label, lx + 4, ly - 4);
      return true;
    }
    ring(band.rReactive, "#c084fc", "λ/(2π)", true);
    ring(band.rFresnel, "#4ade80", "λ", true);
    ring(band.r2lam, "#d4a373", "2λ", true);
    // Fraunhofer may be inside sphere for electrically-small D — still try
    if (band.rFraunhofer > band.sphereR * 1.02) {
      ring(band.rFraunhofer, "#f87171", "2D²/λ", true);
    }

    // antenna overlay
    ctx.setLineDash([]);
    // sphere
    ctx.beginPath();
    ctx.fillStyle = "rgba(180,185,195,0.92)";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1.5;
    const nS = 64;
    for (let i = 0; i <= nS; i++) {
      const a = (i / nS) * Math.PI * 2;
      const xx = sx(band.sphereR * Math.cos(a));
      const zz = sy(band.sphereR * Math.sin(a));
      if (i === 0) ctx.moveTo(xx, zz); else ctx.lineTo(xx, zz);
    }
    ctx.fill(); ctx.stroke();

    // coax rectangle
    ctx.fillStyle = "rgba(90,95,105,0.95)";
    ctx.strokeStyle = "#222";
    ctx.fillRect(sx(-COAX_R), sy(band.zTip), sx(COAX_R) - sx(-COAX_R), sy(band.zCoaxEnd) - sy(band.zTip));
    ctx.strokeRect(sx(-COAX_R), sy(band.zTip), sx(COAX_R) - sx(-COAX_R), sy(band.zCoaxEnd) - sy(band.zTip));

    // sleeve walls
    ctx.fillStyle = "rgba(90,140,220,0.85)";
    ctx.strokeStyle = "#1e3a6e";
    const sleeveH = sy(band.zSleeveClosed) - sy(band.zSleeveOpen);
    ctx.fillRect(sx(COAX_R), sy(band.zSleeveOpen), sx(SLEEVE_R) - sx(COAX_R), sleeveH);
    ctx.fillRect(sx(-SLEEVE_R), sy(band.zSleeveOpen), sx(-COAX_R) - sx(-SLEEVE_R), sleeveH);
    ctx.fillRect(sx(-SLEEVE_R), sy(band.zSleeveClosed + 0.0003), sx(SLEEVE_R) - sx(-SLEEVE_R), sy(band.zSleeveClosed - 0.0003) - sy(band.zSleeveClosed + 0.0003));

    // frame + labels
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);
    ctx.fillStyle = "#d7e0f2";
    ctx.font = "11px Source Sans 3, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("x (m) radial", padL + plotW / 2, cssH - 12);
    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("z (m) axis", 0, 0);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.fillStyle = "#9ab";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.fillText("±" + fmtN(win, 3) + " m  (~2.5 λ)", padL, 16);

    drawLegend(ctx, padL + plotW + 12, padT + 10, plotH - 20, eMin, eMax);

    // hover readout
    if (hover) {
      const { x, z, E } = hover;
      if (!maskMetal(band, x, z)) {
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        const hx = sx(x), hz = sy(z);
        ctx.fillRect(hx + 10, hz - 28, 168, 40);
        ctx.fillStyle = "#fff";
        ctx.font = "11px IBM Plex Mono, monospace";
        ctx.fillText("r=" + fmtN(Math.hypot(x, z), 4) + " m", hx + 16, hz - 12);
        ctx.fillText("E∥≈" + fmtSci(E, 3) + " V/m", hx + 16, hz + 4);
        ctx.beginPath();
        ctx.arc(hx, hz, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    }

    updateReadout(band, eMin, eMax);
  }

  function updateReadout(band) {
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set("outLabel", band.spec.label);
    set("outF", (band.f / 1e6).toFixed(2) + " MHz");
    set("outLam", fmtN(band.lam * 1000, 2) + " mm");
    set("outSleeve", fmtN(band.sleeveL * 1000, 1) + " mm");
    set("outSphere", band.spec.sphereSku + " · " + band.spec.sphereOD_in + "″ OD (LAB)");
    set("outIpk", fmtSci(band.ipk, 3) + " A");
    set("outPrad", fmtSci(band.prad, 3) + " W");
    set("outELam", fmtSci(EparAtR(band.prad, band.lam), 3) + " V/m");
    set("outE10", fmtSci(EparAtR(band.prad, 10), 3) + " V/m");
    set("outRreact", fmtN(band.rReactive, 4) + " m (" + fmtN(band.rReactive / band.lam, 3) + " λ)");
    set("outRfres", fmtN(band.rFresnel, 4) + " m (1 λ)");
    set("outRfrau", fmtN(band.rFraunhofer, 5) + " m (" + fmtN(band.rFraunhofer / band.lam, 4) + " λ)" +
      (band.rFraunhofer < band.sphereR ? " — inside sphere (electrically small D)" : ""));
    set("outR2lam", fmtN(band.r2lam, 4) + " m");
    set("outVersion", PHYSICS_VERSION + " · " + MAPS_ID);
  }

  function onPointer(ev) {
    const canvas = $("efieldCanvas");
    const rect = canvas.getBoundingClientRect();
    const cssW = canvas.clientWidth;
    const cssH = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));
    const padL = 48, padR = 110, padT = 28, padB = 42;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;
    const band = bandOf(currentKey);
    const win = band.win;
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    if (mx < padL || mx > padL + plotW || my < padT || my > padT + plotH) {
      hover = null; drawMap(); return;
    }
    const x = -win + ((mx - padL) / plotW) * 2 * win;
    const z = win - ((my - padT) / plotH) * 2 * win;
    const r = Math.hypot(x, z);
    hover = { x, z, E: EparAtR(band.prad, r) };
    drawMap();
  }

  function wire() {
    const sel = $("bandSelect");
    if (sel) {
      sel.value = currentKey;
      sel.addEventListener("change", () => {
        currentKey = sel.value;
        hover = null;
        drawMap();
      });
    }
    document.querySelectorAll("[data-band]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentKey = btn.getAttribute("data-band");
        if (sel) sel.value = currentKey;
        document.querySelectorAll("[data-band]").forEach((b) =>
          b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
        hover = null;
        drawMap();
      });
    });
    const canvas = $("efieldCanvas");
    if (canvas) {
      canvas.addEventListener("pointermove", onPointer);
      canvas.addEventListener("pointerleave", () => { hover = null; drawMap(); });
    }
    window.addEventListener("resize", () => { drawMap(); });
    drawMap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
