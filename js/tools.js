/* Bifilar pancake + RG-405 stub + skirt balun calculator. Default 1.300 GHz. */
(function () {
  const AWG = {
    18: { bareIn: 0.0403, bareMm: 1.024, odIn: 0.043 },
    20: { bareIn: 0.0320, bareMm: 0.812, odIn: 0.035 },
    22: { bareIn: 0.0253, bareMm: 0.643, odIn: 0.028 },
    24: { bareIn: 0.0201, bareMm: 0.511, odIn: 0.023 },
    26: { bareIn: 0.0159, bareMm: 0.404, odIn: 0.018 },
    28: { bareIn: 0.0126, bareMm: 0.320, odIn: 0.015 },
  };

  const fGHz = document.getElementById("fGHz");
  if (!fGHz) return;

  const els = {
    fGHz,
    fLabel: document.getElementById("fLabel"),
    stubFrac: document.getElementById("stubFrac"),
    stubFracVal: document.getElementById("stubFracVal"),
    vf: document.getElementById("vf"),
    vfVal: document.getElementById("vfVal"),
    odFrac: document.getElementById("odFrac"),
    odFracVal: document.getElementById("odFracVal"),
    awg: document.getElementById("awg"),
    turns: document.getElementById("turns"),
    turnsVal: document.getElementById("turnsVal"),
  };

  function paint() {
    const f = parseFloat(els.fGHz.value) * 1e9;
    const lam = C / f; // m
    const lamMm = lam * 1000;
    const stubFrac = parseFloat(els.stubFrac.value);
    const vf = parseFloat(els.vf.value);
    const odFrac = parseFloat(els.odFrac.value);
    const turns = parseInt(els.turns.value, 10);
    const awgN = els.awg.value;
    const w = AWG[awgN];

    els.fLabel.textContent = parseFloat(els.fGHz.value).toFixed(3) + " GHz";
    els.stubFracVal.textContent = stubFrac.toFixed(2) + " λ";
    els.vfVal.textContent = vf.toFixed(2);
    els.odFracVal.textContent = odFrac.toFixed(2) + " λ";
    els.turnsVal.textContent = turns + " turns";

    const stubMm = stubFrac * lamMm;
    const skirtMm = (lamMm / 4) * vf;
    const odMm = odFrac * lamMm;
    const wireOdMm = w.odIn * 25.4;
    // Each bifilar "turn" is two wires side-by-side radially
    const radialPerTurn = 2 * wireOdMm;
    const radialBuild = turns * radialPerTurn;
    const idMm = Math.max(2, odMm - 2 * radialBuild);
    const meanR = ((odMm + idMm) / 4) / 1000; // m, mean radius
    const lengthPerWire = 2 * Math.PI * meanR * turns; // m (Archimedean approx)
    const totalTwo = 2 * lengthPerWire * 1.12; // 12% extra

    const Dstub = stubMm / 1000;
    const Dcoil = odMm / 1000;
    function nf(D) {
      const reactive = 0.62 * Math.sqrt((D * D * D) / lam);
      const far = (2 * D * D) / lam;
      const rule = lam / (2 * Math.PI);
      return { D, reactive, far, rule };
    }
    const txNF = nf(Dstub);
    const rxNF = nf(Dcoil);

    set("lamMm", fmt(lamMm, 3) + " mm");
    set("stubMm", fmt(stubMm, 2) + " mm");
    set("skirtMm", fmt(skirtMm, 2) + " mm");
    set("elecQtr", fmt(lamMm / 4, 2) + " mm");
    set("odMm", fmt(odMm, 2) + " mm  (" + fmt(odMm / 25.4, 2) + " in)");
    set("idMm", fmt(idMm, 2) + " mm");
    set("wireOd", fmt(wireOdMm, 3) + " mm  (" + awgN + " AWG)");
    set("radialBuild", fmt(radialBuild, 2) + " mm");
    set("lenEach", fmt(lengthPerWire, 2) + " m");
    set("lenTotal", fmt(totalTwo, 2) + " m  (two wires + ~12%)");
    set("deltaUm", fmt(skinDepth(f) * 1e6, 3) + " µm copper");

    fillNF("nfTx", txNF, "TX stub");
    fillNF("nfRx", rxNF, "RX coil");
  }

  function fillNF(id, o, name) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML =
      "<td>" + name + "</td>" +
      "<td class='num'>" + fmt(o.D * 1000, 2) + " mm</td>" +
      "<td class='num'>" + fmt(o.reactive * 1000, 1) + " mm</td>" +
      "<td class='num'>" + fmt(o.far, 4) + " m</td>" +
      "<td class='num'>" + fmt(o.rule * 1000, 1) + " mm</td>";
  }

  function set(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }

  document.querySelectorAll("[data-freq]").forEach((b) => {
    b.addEventListener("click", () => {
      els.fGHz.value = b.dataset.freq;
      paint();
    });
  });
  ["input", "change"].forEach((ev) => {
    Object.values(els).forEach((el) => el && el.addEventListener && el.addEventListener(ev, paint));
  });
  paint();
})();
