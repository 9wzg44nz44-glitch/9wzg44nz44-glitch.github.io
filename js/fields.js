(function () {
  const F = 1.296e9;
  const C = 299792458;
  const MU0 = 4 * Math.PI * 1e-7;
  const Z0 = 376.73031346177;
  const RL = 50;
  const B_HZ = 1e5;
  const N0 = -174;
  const A_EFF = Math.PI * 0.05 ** 2;
  const ETA = 0.5;
  const LAMBDA = C / F;
  const K0 = 2 * Math.PI * F / C;
  const R_RESP = 264030;
  const ATT = { open: 0, slotted: 25, sealed: 55 };
  const $ = (id) => document.getElementById(id);
  const ptx = $("ptx"), rEl = $("r"), cage = $("cage"), mode = $("mode");
  const smaLeak = $("smaLeak"), lna = $("lna");
  if (!ptx) return;
  function wattsFromDbm(dbm) { return Math.pow(10, (dbm - 30) / 10); }
  function dbmFromWatts(w) { return w <= 0 ? -999 : 10 * Math.log10(w * 1000); }
  function meshPower(attEach) { return Math.pow(10, (-2 * attEach) / 10); }
  function compute() {
    const Ptx_dBm = +ptx.value;
    const r = +rEl.value;
    const att = ATT[cage.value] || 0;
    const mP = meshPower(att);
    const P = wattsFromDbm(Ptx_dBm);
    const Irms = Math.sqrt(P / RL);
    const Ipk = Irms * Math.SQRT2;
    const nf = lna.checked ? 5 : 3;
    const lnaGain = lna.checked ? 20 : 0;
    const noise = N0 + 10 * Math.log10(B_HZ) + nf;
    const D = 0.25 * LAMBDA;
    const far = 2 * D * D / LAMBDA;
    const near = r < far;
    const Gtx = 1.5;
    const AeffTem = 3 * LAMBDA * LAMBDA / (8 * Math.PI);
    const PrxTem = P * Gtx * AeffTem / (4 * Math.PI * r * r) * mP;
    const snrTem = dbmFromWatts(PrxTem * Math.pow(10, lnaGain / 10)) - noise;
    const Prad = (Ipk * Ipk / (4 * Math.PI)) * Z0;
    const S = Prad / (4 * Math.PI * r * r);
    const Pload = S * A_EFF * ETA * mP * Math.pow(10, lnaGain / 10);
    const snrH = dbmFromWatts(Pload) - noise;
    const Am = (MU0 * Ipk) / (2 * Math.PI * K0 * r);
    const Pnz = Math.pow((R_RESP / Math.SQRT2) * Am, 2) * RL * mP * Math.pow(10, lnaGain / 10);
    const Az = 1e-10 * (Ipk / 0.028) * (1.5 / r) * (1.3 / (F / 1e9));
    const Pz = Math.pow(420000 * Az, 2) * RL * mP * Math.pow(10, lnaGain / 10);
    return { Ptx_dBm, r, att, mP, Irms, nf, noise, near, far, PrxTem, snrTem, Prad, S, Pload, snrH, Am, Pnz, Az, Pz, lnaGain };
  }
  function fmt(x, d) { return Number.isFinite(x) ? x.toExponential(d) : "\u2014"; }
  function fmtN(x, d) { return Number.isFinite(x) ? x.toFixed(d) : "\u2014"; }
  function renderText(s) {
    $("ptxOut").textContent = fmtN(s.Ptx_dBm, 1) + " dBm";
    $("rOut").textContent = fmtN(s.r, 2) + " m";
    const nearNote = s.near ? " <em>r</em> is inside ~" + fmtN(s.far, 3) + " m far-field estimate \u2014 Friis is a caveat, not a measurement." : "";
    $("temOut").innerHTML = "I<sub>rms</sub> = " + fmt(s.Irms, 3) + " A \u00b7 P<sub>rx</sub> (mesh) = " + fmtN(dbmFromWatts(s.PrxTem), 1) + " dBm<br>SNR<sub>TEM</sub> \u2248 <strong>" + fmtN(s.snrTem, 1) + " dB</strong> (B=100 kHz, NF=" + s.nf + " dB" + (s.lnaGain ? ", LNA +20 dB" : "") + ")." + nearNote;
    $("slwOut").innerHTML = "P<sub>rad</sub> (Eq. 15) = " + fmt(s.Prad, 3) + " W \u00b7 S = " + fmt(s.S, 3) + " W/m\u00b2<br>A<sub>m</sub>(r) = " + fmt(s.Am, 3) + " Wb/m \u00b7 A<sub>z</sub>(r) = " + fmt(s.Az, 3) + " Wb/m<br>SNR<sub>Hively</sub> \u2248 <strong>" + fmtN(s.snrH, 1) + " dB</strong> \u00b7 P<sub>sig,NZ</sub> " + fmtN(dbmFromWatts(s.Pnz), 1) + " dBm \u00b7 P<sub>sig,Z</sub> " + fmtN(dbmFromWatts(s.Pz), 1) + " dBm<br>Two tents \u00d7 " + s.att + " dB \u2192 power \u00d7 " + fmt(s.mP, 2) + ".";
  }

  const canvas = $("vizCanvas");
  const ctx = canvas.getContext("2d");
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    canvas.width = Math.max(1, w * dpr);
    canvas.height = Math.max(1, h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }
  function draw(s) {
    const { w, h } = sizeCanvas();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, w, h);
    const fade = Math.pow(10, (-s.att) / 40);
    const x0 = w * 0.22, y0 = h * 0.55;
    const x1 = w * (0.35 + 0.45 * Math.min(s.r / 3, 1));
    const y1 = h * 0.55;
    const pScale = 8 + 0.6 * (s.Ptx_dBm + 30);
    if (mode.value !== "slw") {
      ctx.fillStyle = "rgba(61,214,198," + (0.15 + 0.35 * fade) + ")";
      ctx.beginPath();
      ctx.ellipse(x0, y0 - 18, pScale * 0.55, pScale * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8fd";
      ctx.fillText("TEM lobes", x0 - 24, y0 - pScale * 1.2 - 8);
    }
    if (mode.value !== "tem") {
      ctx.strokeStyle = "rgba(240,160,48," + (0.25 + 0.5 * fade) + ")";
      ctx.lineWidth = 2;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(x0, y0, (pScale * 0.7) * i * (0.4 + 0.15 / Math.max(s.r, 0.08)), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#fc8";
      ctx.fillText("SLW ~ 1/r", x0 - 20, y0 + pScale * 2.2);
    }
    ctx.fillStyle = "#c4a574";
    ctx.fillRect(x0 - 3, y0 - 40, 6, 50);
    ctx.strokeStyle = "#88aacc";
    ctx.lineWidth = 3;
    ctx.strokeRect(x0 - 14, y0 + 2, 28, 18);
    ctx.fillStyle = "#ccc";
    ctx.font = "12px sans-serif";
    ctx.fillText("stub+sleeve", x0 - 32, y0 + 38);
    ctx.beginPath();
    ctx.arc(x1, y1, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#cc8844";
    ctx.fill();
    ctx.fillStyle = "#eee";
    ctx.fillText("pancake", x1 - 22, y1 + 32);
    ctx.strokeStyle = "#667";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#9ab";
    ctx.fillText("r = " + s.r.toFixed(2) + " m", (x0 + x1) / 2 - 30, y0 - 10);
    if (smaLeak.checked) {
      ctx.fillStyle = "#ddd";
      ctx.fillRect(x0 + 28, y0 - 8, 18, 10);
      ctx.fillStyle = "#f0c14b";
      ctx.fillRect(x0 + 44, y0 - 5, 8, 4);
      ctx.fillStyle = "#eee";
      ctx.fillText("SMA leak", x0 + 28, y0 - 14);
    }
    ctx.fillStyle = "#8aa";
    ctx.fillText("1296 MHz square-wave (spurs) · mesh " + s.att + " dB/tent", 12, 20);
  }
  function tick() {
    const s = compute();
    renderText(s);
    draw(s);
    requestAnimationFrame(tick);
  }
  window.addEventListener("resize", function () { draw(compute()); });
  tick();
})();
