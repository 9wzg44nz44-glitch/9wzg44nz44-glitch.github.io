/* 1.3 GHz Faraday-cage lab log + live skin-depth table */
(function () {
  const fLab = document.getElementById("labF");
  const logBody = document.getElementById("logBody");
  if (!logBody) return;

  const DEPTHS = [10, 100, 1000, 2885];
  function paintSkin() {
    const f = parseFloat((fLab && fLab.value) || 1.3) * 1e9;
    const d = skinDepth(f);
    set("labDelta", fmt(d * 1e6, 4) + " µm");
    const tb = document.getElementById("skinBody");
    if (!tb) return;
    const rows = [
      { f: 8e9, lab: "8.000 GHz (Hively IARD 2020)" },
      { f: 1.3e9, lab: "1.300 GHz (this lab)" },
      { f: 1.296e9, lab: "1.296 GHz (23 cm calling)" },
    ];
    tb.innerHTML = rows
      .map((row) => {
        const dd = skinDepth(row.f);
        const cells = DEPTHS.map((n) => {
          const tmm = n * dd * 1e3;
          return "<td class='num'>" + tmm.toFixed(4) + " mm</td>";
        }).join("");
        return (
          "<tr><td>" +
          row.lab +
          "</td><td class='num'>" +
          (dd * 1e6).toFixed(4) +
          " µm</td>" +
          cells +
          "</tr>"
        );
      })
      .join("");
  }
  function set(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }

  const KEY = "slw-lab-log-v1";
  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (e) {
    rows = [];
  }

  const fields = [
    "run_id",
    "config",
    "f_MHz",
    "P_dBm",
    "r_m",
    "orientation_deg",
    "cage_state",
    "detector",
    "reading_dBm",
    "notes",
  ];

  function nowISO() {
    const d = new Date();
    return d.toISOString();
  }

  function render() {
    logBody.innerHTML = rows
      .map((r, i) => {
        return (
          "<tr>" +
          "<td class='num'>" +
          (i + 1) +
          "</td>" +
          "<td>" +
          (r.timestamp || "") +
          "</td>" +
          fields
            .map((k) => "<td>" + (r[k] || "") + "</td>")
            .join("") +
          "<td><button data-del='" +
          i +
          "' type='button'>Remove</button></td></tr>"
        );
      })
      .join("");
    logBody.querySelectorAll("[data-del]").forEach((b) => {
      b.addEventListener("click", () => {
        rows.splice(+b.dataset.del, 1);
        save();
      });
    });
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify(rows));
    render();
  }

  document.getElementById("addRow").addEventListener("click", () => {
    const rec = { timestamp: nowISO() };
    fields.forEach((k) => {
      const el = document.getElementById("f_" + k);
      rec[k] = el ? el.value : "";
    });
    rows.push(rec);
    save();
  });
  document.getElementById("exportCsv").addEventListener("click", () => {
    const header = ["timestamp"].concat(fields);
    const csv = [header.join(",")]
      .concat(
        rows.map((r) =>
          header
            .map((k) => {
              const v = String(r[k] == null ? "" : r[k]).replace(/"/g, '""');
              return /[",\n]/.test(v) ? '"' + v + '"' : v;
            })
            .join(",")
        )
      )
      .join("\n");
    downloadText("slw-lab-log-1p3ghz.csv", csv, "text/csv");
  });
  document.getElementById("clearLog").addEventListener("click", () => {
    if (confirm("Clear all in-page log rows? CSV schema is unchanged.")) {
      rows = [];
      save();
    }
  });

  if (fLab) fLab.addEventListener("input", paintSkin);
  paintSkin();
  render();
})();
