/* Shared chrome */
(function () {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.querySelector("nav.primary");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("nav.primary a").forEach((a) => {
    const href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
    if (href === path || (path === "" && href === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });
})();

const C = 299792458;
const MU0 = 4 * Math.PI * 1e-7;
const EPS0 = 8.854187817e-12;
const Z0 = Math.sqrt(MU0 / EPS0); // ~376.73
const SIGMA_CU = 5.8e7;

function skinDepth(fHz, sigma = SIGMA_CU, mu = MU0) {
  return 1 / Math.sqrt(Math.PI * fHz * mu * sigma);
}
function fmt(x, digits) {
  if (!isFinite(x)) return "—";
  const ax = Math.abs(x);
  if (ax !== 0 && (ax < 1e-3 || ax >= 1e4)) return x.toExponential(digits);
  return x.toFixed(digits);
}
function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}


/* Hash-deep-linkable experiment tabs on index.html */
(function () {
  const list = document.querySelector("[data-expt-tabs]");
  if (!list) return;
  const tabs = [...list.querySelectorAll("[role=tab]")];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  const hashes = { "expt-a": 0, "expt-b": 1, kit: 2 };

  function select(i, pushHash) {
    tabs.forEach((t, n) => {
      const on = n === i;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (panels[n]) panels[n].hidden = !on;
    });
    const id = tabs[i] && tabs[i].dataset.hash;
    if (pushHash && id) {
      history.replaceState(null, "", "#" + id);
    }
    const on = tabs[i];
    if (on) on.focus({ preventScroll: true });
  }

  function fromHash() {
    const h = (location.hash || "").replace(/^#/, "").toLowerCase();
    if (h in hashes) select(hashes[h], false);
  }

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(i, true));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        select((i + dir + tabs.length) % tabs.length, true);
      }
    });
  });
  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
