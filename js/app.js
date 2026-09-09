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

/* Sticky A / B / C jump bar on every page */
(function () {
  if (document.getElementById("expt-abc")) return;
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const hash = (location.hash || "").replace(/^#/, "").toLowerCase();

  const groupA = new Set(["setup.html", "fields.html", "lab.html"]);
  const groupB = new Set(["monstein.html", "sphere.html"]);
  const groupC = new Set([
    "experiment-c.html",
    "experiment-c-snr.html",
    "experiment-c-cart.html",
  ]);

  let active = "";
  if (groupC.has(file) || file === "c-nuclei.html" || file === "c-nuclei-archive.html") active = "c";
  else if (groupB.has(file)) active = "b";
  else if (groupA.has(file)) active = "a";
  else if (file === "index.html") {
    if (hash === "expt-b") active = "b";
    else if (hash === "expt-c") active = "c";
    else if (hash === "expt-a" || hash === "kit" || !hash) active = hash === "expt-c" ? "c" : hash === "expt-b" ? "b" : hash === "expt-a" ? "a" : "";
  }

  const nav = document.createElement("nav");
  nav.id = "expt-abc";
  nav.className = "expt-abc";
  nav.setAttribute("aria-label", "Jump to Experiment A, B, or C");
  nav.innerHTML =
    '<span class="expt-abc-label">Experiments</span>' +
    '<a class="expt-abc-btn" data-expt="a" href="index.html#expt-a"><span class="k">A</span> 1296 MHz cage</a>' +
    '<a class="expt-abc-btn" data-expt="b" href="index.html#expt-b"><span class="k">B</span> 433 MHz</a>' +
    '<a class="expt-abc-btn" data-expt="c" href="experiment-c.html"><span class="k">C</span> atomic 1S–2S</a>' +
    '<a class="expt-abc-sub" href="setup.html">A setup</a>' +
    '<a class="expt-abc-sub" href="monstein.html">B monstein</a>' +
    '<a class="expt-abc-sub" href="experiment-c-snr.html">C SNR</a>' +
    '<a class="expt-abc-sub" href="experiment-c-cart.html">C cart</a>' +
    '<a class="expt-abc-sub" href="kit.html">Kit</a>' +
    '<a class="expt-abc-sub" href="index.html">Home</a>';

  nav.querySelectorAll("[data-expt]").forEach((a) => {
    if (a.getAttribute("data-expt") === active) {
      a.setAttribute("aria-current", "page");
      a.classList.add("is-active");
    }
  });
  nav.querySelectorAll("a.expt-abc-sub").forEach((a) => {
    const href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
    if (href === file) a.setAttribute("aria-current", "page");
  });

  const header = document.querySelector("header.site-header, header.site");
  if (header) header.insertAdjacentElement("afterend", nav);
  else document.body.insertAdjacentElement("afterbegin", nav);

  window.addEventListener("hashchange", () => {
    if (file !== "index.html") return;
    const h = (location.hash || "").replace(/^#/, "").toLowerCase();
    const map = { "expt-a": "a", "expt-b": "b", "expt-c": "c" };
    const next = map[h] || "";
    nav.querySelectorAll("[data-expt]").forEach((a) => {
      const on = a.getAttribute("data-expt") === next;
      a.toggleAttribute("aria-current", on);
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  });
})();


/* Keep A/B/C bar pinned just under the site header */
(function () {
  const header = document.querySelector("header.site-header, header.site");
  const abc = document.getElementById("expt-abc");
  if (!header || !abc) return;
  const sync = () => {
    abc.style.top = Math.ceil(header.getBoundingClientRect().height) + "px";
  };
  sync();
  window.addEventListener("resize", sync);
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
  const hashes = { "expt-a": 0, "expt-b": 1, "expt-c": 2, kit: 3 };

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
