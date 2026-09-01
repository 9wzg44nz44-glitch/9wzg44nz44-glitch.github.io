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
  if (!ptx || typeof THREE === "undefined") return;
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
  const host = $("viz");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1020);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 50);
  camera.position.set(0.35, 0.22, 0.55);
  camera.lookAt(0, 0.05, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  host.appendChild(renderer.domElement);
  const light = new THREE.DirectionalLight(0xffffff, 1.1);
  light.position.set(1, 2, 2);
  scene.add(light, new THREE.AmbientLight(0x6688aa, 0.4));
  function cyl(rad, h, color, y) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, h, 24), new THREE.MeshPhongMaterial({ color: color, transparent: true, opacity: 0.95 }));
    m.position.y = y;
    return m;
  }
  const stub = cyl(0.003, 0.058, 0xc4a574, 0.029);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.058, 24, 1, true), new THREE.MeshPhongMaterial({ color: 0x88aacc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
  skirt.position.y = -0.01;
  const sma = new THREE.Group();
  sma.add(cyl(0.0045, 0.012, 0xdddddd, 0.08));
  sma.add(cyl(0.0012, 0.01, 0xf0c14b, 0.09));
  sma.visible = false;
  sma.position.set(0.08, 0, 0);
  scene.add(stub, skirt, sma);
  const temLobe = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x3dd6c6, transparent: true, opacity: 0.28, side: THREE.DoubleSide }));
  temLobe.scale.set(0.12, 0.18, 0.12);
  temLobe.position.y = 0.08;
  const slwCloud = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshPhongMaterial({ color: 0xf0a030, transparent: true, opacity: 0.18 }));
  scene.add(temLobe, slwCloud);
  const pancake = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 8, 32), new THREE.MeshPhongMaterial({ color: 0xcc8844 }));
  pancake.rotation.x = Math.PI / 2;
  scene.add(pancake);
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();
  function updateViz(s) {
    const scale = Math.max(0.04, Math.min(0.35, 0.12 + 0.04 * (s.Ptx_dBm + 20) / 20));
    const attFade = Math.pow(10, (-s.att) / 40);
    const rScale = Math.max(0.15, Math.min(1.2, s.r));
    pancake.position.set(0, 0.04, -rScale * 0.35);
    temLobe.visible = mode.value !== "slw";
    slwCloud.visible = mode.value !== "tem";
    temLobe.scale.set(scale * 0.9, scale * 1.4, scale * 0.9);
    temLobe.material.opacity = 0.12 + 0.25 * attFade;
    slwCloud.scale.setScalar(scale * 1.6 * (0.5 + 0.5 / Math.max(s.r, 0.05)));
    slwCloud.material.opacity = 0.08 + 0.22 * attFade;
    sma.visible = smaLeak.checked;
  }
  function tick() {
    const s = compute();
    renderText(s);
    updateViz(s);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();
