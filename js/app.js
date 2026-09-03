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
  const exptMap = {
    "setup.html": "a",
    "fields.html": "a",
    "lab.html": "a",
    "monstein.html": "b",
    "sphere.html": "b",
    "kit.html": "kit"
  };
  const which = exptMap[path];
  document.querySelectorAll(".expt-nav a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (which === "a" && href.indexOf("#expt-a") >= 0) a.setAttribute("aria-current", "true");
    if (which === "b" && href.indexOf("#expt-b") >= 0) a.setAttribute("aria-current", "true");
    if (which === "kit" && (href.indexOf("kit.html") >= 0 || href.indexOf("#kit") >= 0)) {
      a.setAttribute("aria-current", "true");
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
