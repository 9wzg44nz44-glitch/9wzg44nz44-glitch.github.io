/* SLW Hub Round 1 to-do list. State is kept in this browser only (localStorage key slw-r1-todo-v1). */
(function () {
  "use strict";
  var KEY = "slw-r1-todo-v1";
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { state = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var items = Array.prototype.slice.call(document.querySelectorAll(".todo-item"));

  function apply(li) {
    var id = li.getAttribute("data-id"), s = state[id] || {};
    var done = s.done != null ? s.done : li.getAttribute("data-done") === "1";
    var owner = s.owner || li.getAttribute("data-owner") || "TBD";
    var status = s.status || (done ? "done" : "todo");
    li.querySelector("input[type=checkbox]").checked = done;
    li.querySelector(".ow").value = owner;
    li.querySelector(".st").value = status;
    li.classList.toggle("done", done);
    li.setAttribute("data-status", status);
  }
  function set(li, patch) {
    var id = li.getAttribute("data-id"), s = state[id] || {};
    for (var k in patch) s[k] = patch[k];
    state[id] = s; save(); apply(li); progress();
  }
  function bar(el, done, total) {
    var pct = total ? Math.round(100 * done / total) : 0;
    var span = el.querySelector(".todo-prog > span"); if (span) span.style.width = pct + "%";
    var pb = el.querySelector("[role=progressbar]"); if (pb) pb.setAttribute("aria-valuenow", String(pct));
  }
  function progress() {
    var D = 0, T = 0;
    Array.prototype.forEach.call(document.querySelectorAll(".todo-group"), function (g) {
      var lis = g.querySelectorAll(".todo-item"), d = 0;
      Array.prototype.forEach.call(lis, function (li) { if (li.querySelector("input[type=checkbox]").checked) d++; });
      g.querySelector(".todo-count").textContent = d + " of " + lis.length + " done";
      bar(g.querySelector(".todo-bar"), d, lis.length); D += d; T += lis.length;
    });
    var tot = document.getElementById("todo-total");
    if (tot) tot.textContent = D + " of " + T + " done";
    bar(document.getElementById("todo-all"), D, T);
  }
  items.forEach(function (li) {
    apply(li);
    li.querySelector("input[type=checkbox]").addEventListener("change", function (e) {
      set(li, { done: e.target.checked, status: e.target.checked ? "done" : "todo" });
    });
    li.querySelector(".ow").addEventListener("change", function (e) { set(li, { owner: e.target.value }); });
    li.querySelector(".st").addEventListener("change", function (e) {
      set(li, { status: e.target.value, done: e.target.value === "done" });
    });
  });
  progress();

  function csvCell(v) { v = String(v).replace(/\s+/g, " ").trim(); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  var ex = document.getElementById("todo-export");
  if (ex) ex.addEventListener("click", function () {
    var rows = [["group", "id", "task", "done", "owner", "status"]];
    Array.prototype.forEach.call(document.querySelectorAll(".todo-group"), function (g) {
      var gt = g.querySelector("h2").textContent;
      Array.prototype.forEach.call(g.querySelectorAll(".todo-item"), function (li) {
        rows.push([gt, li.getAttribute("data-id"), li.querySelector(".t b").textContent,
          li.querySelector("input[type=checkbox]").checked ? "yes" : "no", li.querySelector(".ow").value, li.querySelector(".st").value]);
      });
    });
    var text = rows.map(function (r) { return r.map(csvCell).join(","); }).join("\n") + "\n";
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    a.download = "slw-round1-todo-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  });
  var rs = document.getElementById("todo-reset");
  if (rs) rs.addEventListener("click", function () {
    if (!window.confirm("Clear every tick, owner and status you set in this browser?")) return;
    state = {}; save(); items.forEach(apply); progress();
  });
})();
