(function () {
  const curve = document.getElementById("ucurve");
  const bench = document.getElementById("bench");
  if (!curve || !curve.getContext) return;
  const cctx = curve.getContext("2d");
  const bctx = bench && bench.getContext("2d");
  const phiEl = document.getElementById("phi");
  const kappaEl = document.getElementById("kappa");
  const rEl = document.getElementById("r");
  const hystEl = document.getElementById("hyst");
  const phiOut = document.getElementById("phiOut");
  const kappaOut = document.getElementById("kappaOut");
  const rOut = document.getElementById("rOut");
  const tOut = document.getElementById("tOut");
  const KAPPA_HYST = 12;
  const R_MIN = 3;
  const R_MAX = 25;
  const R_DEFAULT = 12;

  function T(phiRad, k) {
    const c = Math.cos(phiRad);
    return Math.exp(-k * c * c);
  }

  function fitCanvas(el, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(1, el.clientWidth || el.width || 640);
    const cssH = Math.max(1, el.clientHeight || el.height || 200);
    const needW = Math.round(cssW * dpr);
    const needH = Math.round(cssH * dpr);
    if (el.width !== needW || el.height !== needH) {
      el.width = needW;
      el.height = needH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { W: cssW, H: cssH };
  }

  function drawCurve() {
    const { W, H } = fitCanvas(curve, cctx);
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
    cctx.textAlign = "left";
    cctx.fillText("φ (deg)", W / 2 - 20, H - 8);
    cctx.fillText("T", 8, 24);
    cctx.fillText("0", 36, H - 14);
    cctx.fillText("180", 40 + (180 / 360) * (W - 60) - 10, H - 14);
    cctx.fillText("360", W - 40, H - 14);

    function plot(kappa, color, dash) {
      cctx.strokeStyle = color;
      cctx.setLineDash(dash || []);
      cctx.lineWidth = 2;
      cctx.beginPath();
      for (let i = 0; i <= 360; i++) {
        const x = 40 + (i / 360) * (W - 60);
        const y = H - 30 - T((i * Math.PI) / 180, kappa) * (H - 60);
        if (i === 0) cctx.moveTo(x, y);
        else cctx.lineTo(x, y);
      }
      cctx.stroke();
    }
    plot(k, "#3dd6c6");
    if (showHyst) plot(KAPPA_HYST, "#f0a030", [6, 4]);
    cctx.setLineDash([]);
    const mx = 40 + (phiDeg / 360) * (W - 60);
    const my = H - 30 - T((phiDeg * Math.PI) / 180, k) * (H - 60);
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
    if (!bctx || !bench) return;
    bench.style.display = "block";
    const { W, H } = fitCanvas(bench, bctx);
    bctx.fillStyle = "#0b1020";
    bctx.fillRect(0, 0, W, H);

    const phi = (parseFloat(phiEl.value) * Math.PI) / 180;
    let r = rEl ? parseFloat(rEl.value) : R_DEFAULT;
    if (!isFinite(r)) r = R_DEFAULT;
    r = Math.min(R_MAX, Math.max(R_MIN, r));

    // Layout in CSS pixels. Weak r-scaling of TX–RX span; cube stays readable.
    // Padding is sized so floor, balls, 3×3 cube (including rotation), labels, and r bar always fit.
    const padX = Math.max(28, W * 0.04);
    const usableW = Math.max(120, W - 2 * padX);
    const t = (r - R_MIN) / (R_MAX - R_MIN);
    const span = usableW * (0.52 + 0.36 * t);
    const txX = (W - span) / 2;
    const rxX = txX + span;
    const cx = (txX + rxX) / 2;

    const floorY = H - 38;
    const ballR = Math.max(12, Math.min(18, W / 36));
    const cube = Math.max(28, Math.min(46, W / 14));
    const cy = floorY - cube - 18;

    // FLOOR / ground plane
    bctx.fillStyle = "#1a2438";
    bctx.fillRect(0, floorY, W, H - floorY);
    bctx.strokeStyle = "#6a7a90";
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.moveTo(padX * 0.4, floorY);
    bctx.lineTo(W - padX * 0.4, floorY);
    bctx.stroke();
    bctx.fillStyle = "#7a8aa0";
    bctx.font = "11px sans-serif";
    bctx.textAlign = "left";
    bctx.fillText("FLOOR", padX * 0.4 + 4, floorY + 16);

    // Path TX → RX
    bctx.strokeStyle = "#556";
    bctx.setLineDash([4, 4]);
    bctx.lineWidth = 1;
    bctx.beginPath();
    bctx.moveTo(txX + ballR + 4, cy);
    bctx.lineTo(rxX - ballR - 4, cy);
    bctx.stroke();
    bctx.setLineDash([]);

    function ball(x, label) {
      bctx.fillStyle = "#c5d0d8";
      bctx.beginPath();
      bctx.arc(x, cy, ballR, 0, Math.PI * 2);
      bctx.fill();
      bctx.strokeStyle = "#8aa";
      bctx.lineWidth = 2;
      bctx.stroke();
      bctx.fillStyle = "#cde";
      bctx.font = "12px sans-serif";
      bctx.textAlign = "center";
      bctx.fillText(label, x, cy - ballR - 8);
    }
    ball(txX, "TX");
    ball(rxX, "RX");

    // 3×3 rod cube (parasitic polarizer) — always drawn at a readable size
    bctx.save();
    bctx.translate(cx, cy);
    bctx.rotate(phi);
    bctx.strokeStyle = "#d4b483";
    bctx.lineWidth = 2;
    bctx.strokeRect(-cube, -cube, cube * 2, cube * 2);
    bctx.strokeStyle = "#f0c060";
    bctx.lineWidth = 3;
    const pitch = (cube * 2 - 12) / 2;
    for (let i = -1; i <= 1; i++) {
      const x = i * pitch;
      bctx.beginPath();
      bctx.moveTo(x, -cube + 5);
      bctx.lineTo(x, cube - 5);
      bctx.stroke();
    }
    bctx.restore();

    bctx.fillStyle = "#cde";
    bctx.font = "12px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("cube  φ=" + parseFloat(phiEl.value).toFixed(0) + "°", cx, cy + cube + 18);

    // r dimension bar (between balls, above the floor labels)
    const barY = floorY - 12;
    bctx.strokeStyle = "#8ab";
    bctx.lineWidth = 1;
    bctx.beginPath();
    bctx.moveTo(txX, barY);
    bctx.lineTo(rxX, barY);
    bctx.moveTo(txX, barY - 5);
    bctx.lineTo(txX, barY + 5);
    bctx.moveTo(rxX, barY - 5);
    bctx.lineTo(rxX, barY + 5);
    bctx.stroke();
    bctx.fillStyle = "#9ab";
    bctx.font = "12px sans-serif";
    bctx.fillText("r = " + r.toFixed(1) + " m", cx, barY - 6);

    bctx.font = "11px sans-serif";
    bctx.fillStyle = "#7a8aa0";
    bctx.fillText("educational 2D cartoon · not a 3D solver", cx, 16);
    bctx.fillText("k̂  (TX → RX)", cx, 30);
  }

  function update() {
    const phiDeg = parseFloat(phiEl.value);
    const k = parseFloat(kappaEl.value);
    let r = rEl ? parseFloat(rEl.value) : R_DEFAULT;
    if (!isFinite(r)) r = R_DEFAULT;
    const tBrass = T((phiDeg * Math.PI) / 180, k);
    if (phiOut) phiOut.textContent = phiDeg.toFixed(0) + "°";
    if (kappaOut) kappaOut.textContent = k.toFixed(1);
    if (rOut) rOut.textContent = r.toFixed(1) + " m";
    let msg =
      "T(φ) = exp[−κ cos²φ] = " +
      tBrass.toFixed(3) +
      "  (educational; SLW / longitudinal E not settled physics).";
    if (hystEl.checked) {
      const tH = T((phiDeg * Math.PI) / 180, KAPPA_HYST);
      msg +=
        " Cartoon hysteresis T = " +
        tH.toFixed(3) +
        " at κ=" +
        KAPPA_HYST +
        " (Hively 2026 pers. comm., unpublished).";
    }
    if (tOut) tOut.textContent = msg;
    drawCurve();
    drawBench();
  }

  ["input", "change"].forEach(function (ev) {
    phiEl.addEventListener(ev, update);
    kappaEl.addEventListener(ev, update);
    hystEl.addEventListener(ev, update);
    if (rEl) rEl.addEventListener(ev, update);
  });
  window.addEventListener("resize", update);
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(update);
    ro.observe(curve);
    if (bench) ro.observe(bench);
  }
  update();
})();
