/* Illustrative SNR educational model from the briefing + paper formulas.
   Clearly labeled: NOT a validated link budget. */
(function () {
  const itx = document.getElementById("itx");
  const rkm = document.getElementById("rkm");
  const itxVal = document.getElementById("itxVal");
  const rkmVal = document.getElementById("rkmVal");
  const canvas = document.getElementById("snrPlot");
  if (!itx || !canvas) return;

  const NZ_R = 264030; // m/H modeled plasma responsivity (CEM-R-46)
  const A_EFF = 78.5e-4; // m^2 palm coil
  const ETA = 0.5;
  const RLOAD = 50;
  const F = 1.3e9;

  function briefingModel(I, r) {
    // From Educational Briefing slide 07 (illustrative scaling)
    const A = 2.5e-7 * (I / 5) * (50e3 / r); // arb. scaled to briefing 5A @ 50 km
    const IdetNZ = 0.53e-6 * (I / 5) * (50e3 / r);
    const Elong = 15e-6 * (I / 5) * Math.pow(50e3 / r, 1.05);
    const IdetH = 0.94e-6 * (I / 5) * Math.pow(50e3 / r, 0.9);
    const noiseNZ = IdetNZ / Math.pow(10, 20.5 / 20) * (5 / I) * (r / 50e3) * (I / 5) * (50e3 / r);
    // Use briefing formula SNR = 20 log10(Idet / noise) with floors chosen for dynamic range
    const nNZ = 5e-8;
    const nH = 3e-8;
    return {
      power: I * I * 25, // illustrative radiation resistance ~25 Ω
      A,
      IdetNZ,
      Elong,
      IdetH,
      snrNZ: 20 * Math.log10(Math.max(IdetNZ, 1e-18) / nNZ),
      snrH: 20 * Math.log10(Math.max(IdetH, 1e-18) / nH),
    };
  }

  function paperModel(I, r) {
    const k0 = (2 * Math.PI * F) / C;
    const Am = (MU0 * I) / (2 * Math.PI * k0 * r);
    const IrmsNZ = NZ_R * (Am / Math.SQRT2);
    const Prad = ((I * I) / (4 * Math.PI)) * Z0; // US 9,306,527 Eq. 15
    const S = Prad / (4 * Math.PI * r * r);
    const Pload = S * A_EFF * ETA;
    const IoutH = Math.sqrt(Math.max(Pload, 0) / RLOAD);
    const NF = 3;
    const BW = 1e5;
    const noiseDbm = -174 + 10 * Math.log10(BW) + NF;
    const PnzDbm = 10 * Math.log10((IrmsNZ * IrmsNZ * 50) / 1e-3 + 1e-30);
    const PhDbm = 10 * Math.log10(Pload / 1e-3 + 1e-30);
    return {
      Am,
      IrmsNZ,
      PnzDbm,
      snrNZ: PnzDbm - noiseDbm,
      Prad,
      S,
      Pload,
      IoutH,
      snrH: PhDbm - noiseDbm,
    };
  }

  function paint() {
    const I = parseFloat(itx.value);
    const r = parseFloat(rkm.value) * 1000;
    itxVal.textContent = I.toFixed(2) + " A";
    rkmVal.textContent = parseFloat(rkm.value).toFixed(1) + " km";
    const b = briefingModel(I, r);
    const p = paperModel(I, r);
    set("nzPower", fmt(b.power, 0) + " W");
    set("nzA", fmt(b.A, 2) + " arb.");
    set("nzIdet", fmt(b.IdetNZ * 1e6, 2) + " µA");
    set("nzSnr", fmt(b.snrNZ, 1) + " dB");
    set("hPower", fmt(b.power, 0) + " W");
    set("hE", fmt(b.Elong * 1e6, 2) + " µV/m");
    set("hIdet", fmt(b.IdetH * 1e6, 2) + " µA");
    set("hSnr", fmt(b.snrH, 1) + " dB");
    set("paperAm", fmt(p.Am, 3) + " Wb/m");
    set("paperIrms", fmt(p.IrmsNZ * 1e6, 2) + " µA");
    set("paperPrad", fmt(p.Prad, 1) + " W");
    set("paperS", fmt(p.S * 1e6, 2) + " µW/m²");
    draw(I);
  }

  function set(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }

  function draw(I) {
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.clientWidth * 2);
    const h = (canvas.height = 240 * 2);
    ctx.scale(2, 2);
    const W = w / 2, H = h / 2;
    ctx.fillStyle = "#0c0b09";
    ctx.fillRect(0, 0, W, H);
    const rMin = 1, rMax = 500;
    let minS = 1e9, maxS = -1e9;
    const n = 80;
    const nz = [], hv = [];
    for (let i = 0; i < n; i++) {
      const r = Math.exp(Math.log(rMin) + (i / (n - 1)) * (Math.log(rMax) - Math.log(rMin)));
      const b = briefingModel(I, r * 1000);
      nz.push({ r, s: b.snrNZ });
      hv.push({ r, s: b.snrH });
      minS = Math.min(minS, b.snrNZ, b.snrH);
      maxS = Math.max(maxS, b.snrNZ, b.snrH);
    }
    minS = Math.min(minS, -10);
    maxS = Math.max(maxS, 40);
    const x = (r) => 48 + ((Math.log(r) - Math.log(rMin)) / (Math.log(rMax) - Math.log(rMin))) * (W - 64);
    const y = (s) => H - 28 - ((s - minS) / (maxS - minS)) * (H - 48);
    ctx.strokeStyle = "#3a3328";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, 12);
    ctx.lineTo(48, H - 28);
    ctx.lineTo(W - 12, H - 28);
    ctx.stroke();
    ctx.fillStyle = "#7d7363";
    ctx.font = "11px IBM Plex Mono, monospace";
    [1, 10, 50, 100, 500].forEach((r) => {
      ctx.fillText(r + " km", x(r) - 10, H - 10);
    });
    function stroke(arr, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      arr.forEach((p, i) => (i ? ctx.lineTo(x(p.r), y(p.s)) : ctx.moveTo(x(p.r), y(p.s))));
      ctx.stroke();
    }
    stroke(nz, "#4a9b88");
    stroke(hv, "#d4923a");
    const rNow = parseFloat(rkm.value);
    ctx.strokeStyle = "#d4b483";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x(rNow), 12);
    ctx.lineTo(x(rNow), H - 28);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#b7ab95";
    ctx.fillText("N–Z", W - 70, 22);
    ctx.fillStyle = "#d4923a";
    ctx.fillText("Hively", W - 70, 38);
  }

  document.querySelectorAll("[data-preset]").forEach((b) => {
    b.addEventListener("click", () => {
      const [I, r] = b.dataset.preset.split(",").map(Number);
      itx.value = I;
      rkm.value = r;
      paint();
    });
  });
  itx.addEventListener("input", paint);
  rkm.addEventListener("input", paint);
  window.addEventListener("resize", paint);
  paint();
})();
