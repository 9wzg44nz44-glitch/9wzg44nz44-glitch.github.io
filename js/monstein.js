(function () {
  const curve = document.getElementById("ucurve");
  const bench = document.getElementById("bench");
  if (!curve || !curve.getContext) return;
  const cctx = curve.getContext("2d");
  const bctx = bench && bench.getContext("2d");
  const phiEl = document.getElementById("phi");
  const kappaEl = document.getElementById("kappa");
  const hystEl = document.getElementById("hyst");
  const showEl = document.getElementById("showBench");
  const phiOut = document.getElementById("phiOut");
  const kappaOut = document.getElementById("kappaOut");
  const tOut = document.getElementById("tOut");
  const KAPPA_HYST = 12;

  function T(phiRad, k) {
    const c = Math.cos(phiRad);
    return Math.exp(-k * c * c);
  }

  function drawCurve() {
    const W = curve.width, H = curve.height;
    const k = parseFloat(kappaEl.value);
    const phiDeg = parseFloat(phiEl.value);
    const showHyst = hystEl.checked;
    cctx.fillStyle = "#0b1020";
    cctx.fillRect(0, 0, W, H);
    cctx.strokeStyle = "#445";
    cctx.lineWidth = 1;
    cctx.beginPath();
    cctx.moveTo(40, H - 30);
    cctx.lineTo(W - 16, H - 30);
    cctx.moveTo(40, 20);
    cctx.lineTo(40, H - 30);
    cctx.stroke();
    cctx.fillStyle = "#9ab";
    cctx.font = "12px sans-serif";
    cctx.fillText("φ (deg)", W / 2 - 20, H - 8);
    cctx.fillText("T", 8, 24);
    cctx.fillText("0", 36, H - 14);
    cctx.fillText("180", 40 + 180 / 360 * (W - 60) - 10, H - 14);
    cctx.fillText("360", W - 40, H - 14);

    function plot(kappa, color, dash) {
      cctx.strokeStyle = color;
      cctx.setLineDash(dash || []);
      cctx.lineWidth = 2;
      cctx.beginPath();
      for (let i = 0; i <= 360; i++) {
        const x = 40 + (i / 360) * (W - 60);
        const y = (H - 30) - T((i * Math.PI) / 180, kappa) * (H - 60);
        if (i === 0) cctx.moveTo(x, y);
        else cctx.lineTo(x, y);
      }
      cctx.stroke();
    }
    plot(k, "#3dd6c6");
    if (showHyst) plot(KAPPA_HYST, "#f0a030", [6, 4]);
    cctx.setLineDash([]);
    const mx = 40 + (phiDeg / 360) * (W - 60);
    const my = (H - 30) - T((phiDeg * Math.PI) / 180, k) * (H - 60);
    cctx.fillStyle = "#f3ead8";
    cctx.beginPath();
    cctx.arc(mx, my, 5, 0, Math.PI * 2);
    cctx.fill();
    cctx.fillStyle = "#3dd6c6";
    cctx.fillText("κ=" + k.toFixed(1) + " brass (MW eq. 9)", 50, 40);
    if (showHyst) {
      cctx.fillStyle = "#f0a030";
      cctx.fillText("κ=" + KAPPA_HYST + " cartoon hysteresis (not a MW figure)", 50, 58);
    }
  }

  function drawBench() {
    if (!bctx) return;
    const W = bench.width, H = bench.height;
    bctx.fillStyle = "#0b1020";
    bctx.fillRect(0, 0, W, H);
    if (showEl && !showEl.checked) {
      bench.style.display = "none";
      return;
    }
    bench.style.display = "block";
    const phi = (parseFloat(phiEl.value) * Math.PI) / 180;
    const cy = H / 2 + 6;
    function ball(x, label) {
      bctx.fillStyle = "#c5d0d8";
      bctx.beginPath();
      bctx.arc(x, cy, 22, 0, Math.PI * 2);
      bctx.fill();
      bctx.strokeStyle = "#8aa";
      bctx.lineWidth = 2;
      bctx.stroke();
      bctx.fillStyle = "#9ab";
      bctx.font = "12px sans-serif";
      bctx.textAlign = "center";
      bctx.fillText(label, x, cy + 42);
    }
    ball(80, "TX ball");
    ball(W - 80, "RX ball");
    bctx.strokeStyle = "#556";
    bctx.setLineDash([4, 4]);
    bctx.beginPath();
    bctx.moveTo(110, cy);
    bctx.lineTo(W - 110, cy);
    bctx.stroke();
    bctx.setLineDash([]);
    bctx.fillStyle = "#9ab";
    bctx.textAlign = "center";
    bctx.fillText("k̂  (TX → RX)", W / 2, 18);

    const cx = W / 2, cube = 54;
    bctx.save();
    bctx.translate(cx, cy);
    bctx.rotate(phi);
    bctx.strokeStyle = "#d4b483";
    bctx.lineWidth = 2;
    bctx.strokeRect(-cube, -cube, cube * 2, cube * 2);
    bctx.strokeStyle = "#f0c060";
    bctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      const x = i * 22;
      bctx.beginPath();
      bctx.moveTo(x, -cube + 6);
      bctx.lineTo(x, cube - 6);
      bctx.stroke();
    }
    bctx.restore();
    bctx.fillStyle = "#9ab";
    bctx.fillText("rod cube  φ=" + parseFloat(phiEl.value).toFixed(0) + "°", cx, H - 12);
    bctx.font = "11px sans-serif";
    bctx.fillText("educational 2D cartoon · not Three.js · not a field solver", cx, 34);
  }

  function update() {
    const phiDeg = parseFloat(phiEl.value);
    const k = parseFloat(kappaEl.value);
    const tBrass = T((phiDeg * Math.PI) / 180, k);
    phiOut.textContent = phiDeg.toFixed(0) + "°";
    kappaOut.textContent = k.toFixed(1);
    let msg = "T(φ) = exp[−κ cos²φ] = " + tBrass.toFixed(3) + "  (educational; SLW / longitudinal E not settled physics).";
    if (hystEl.checked) {
      const tH = T((phiDeg * Math.PI) / 180, KAPPA_HYST);
      msg += " Cartoon hysteresis T = " + tH.toFixed(3) + " at κ=" + KAPPA_HYST + " (Hively 2026 pers. comm., unpublished).";
    }
    tOut.textContent = msg;
    drawCurve();
    drawBench();
  }

  ["input", "change"].forEach(function (ev) {
    phiEl.addEventListener(ev, update);
    kappaEl.addEventListener(ev, update);
    hystEl.addEventListener(ev, update);
    if (showEl) showEl.addEventListener(ev, update);
  });
  update();
})();
