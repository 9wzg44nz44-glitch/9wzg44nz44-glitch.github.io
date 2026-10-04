/* SLW Hub Round 1: tiny canvas plot helper (no dependencies).
 * R1Plot.draw(canvas, {series:[{x:[],y:[],type:'line'|'points',color,label}], xlabel, ylabel, vlines:[{x,label}], xlog:false})
 */
(function (root) {
  "use strict";
  function niceStep(span, n) {
    var raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var m = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
    return m * p;
  }
  function fmt(v) {
    var a = Math.abs(v);
    if (a !== 0 && (a >= 1e5 || a < 1e-3)) return v.toExponential(1);
    return String(Math.round(v * 1e6) / 1e6);
  }
  function draw(canvas, o) {
    var dpr = Math.max(1, Math.min(3, root.devicePixelRatio || 1));
    var cssW = canvas.clientWidth || 600, cssH = canvas.clientHeight || 280;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    var g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, cssW, cssH);
    var padL = 54, padR = 12, padT = 12, padB = 40;
    var pw = cssW - padL - padR, ph = cssH - padT - padB;
    var xs = [], ys = [];
    (o.series || []).forEach(function (s) {
      s.x.forEach(function (v, i) { if (isFinite(v) && isFinite(s.y[i])) { xs.push(v); ys.push(s.y[i]); } });
    });
    (o.vlines || []).forEach(function (v) { if (isFinite(v.x)) xs.push(v.x); });
    g.font = "12px 'IBM Plex Mono', ui-monospace, monospace";
    g.fillStyle = "#b7ab95"; g.strokeStyle = "#5a4e3c";
    if (!xs.length) {
      g.fillText("No data to plot yet", padL + 10, padT + 24);
      return;
    }
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (o.ymin != null) y0 = o.ymin; if (o.ymax != null) y1 = o.ymax;
    if (o.xmin != null) x0 = o.xmin; if (o.xmax != null) x1 = o.xmax;
    if (x1 === x0) { x1 += 1; x0 -= 1; }
    if (y1 === y0) { y1 += 1; y0 -= 1; }
    var yp = (y1 - y0) * 0.06; if (o.ymin == null) y0 -= yp; if (o.ymax == null) y1 += yp;
    function X(v) { return padL + (v - x0) / (x1 - x0) * pw; }
    function Y(v) { return padT + ph - (v - y0) / (y1 - y0) * ph; }
    g.lineWidth = 1;
    var sx = niceStep(x1 - x0, 6), sy = niceStep(y1 - y0, 5), v;
    g.strokeStyle = "#3a3328"; g.textAlign = "center";
    for (v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-12; v += sx) {
      g.beginPath(); g.moveTo(X(v), padT); g.lineTo(X(v), padT + ph); g.stroke();
      g.fillText(fmt(v), X(v), padT + ph + 15);
    }
    g.textAlign = "right";
    for (v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-12; v += sy) {
      g.beginPath(); g.moveTo(padL, Y(v)); g.lineTo(padL + pw, Y(v)); g.stroke();
      g.fillText(fmt(v), padL - 6, Y(v) + 4);
    }
    g.strokeStyle = "#7d7363"; g.strokeRect(padL, padT, pw, ph);
    g.textAlign = "center"; g.fillStyle = "#f3ead8";
    if (o.xlabel) g.fillText(o.xlabel, padL + pw / 2, cssH - 6);
    if (o.ylabel) { g.save(); g.translate(13, padT + ph / 2); g.rotate(-Math.PI / 2); g.fillText(o.ylabel, 0, 0); g.restore(); }
    (o.vlines || []).forEach(function (vl) {
      if (!isFinite(vl.x) || vl.x < x0 || vl.x > x1) return;
      g.strokeStyle = vl.color || "#c45c4a"; g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(X(vl.x), padT); g.lineTo(X(vl.x), padT + ph); g.stroke(); g.setLineDash([]);
      if (vl.label) { g.fillStyle = vl.color || "#c45c4a"; g.textAlign = "left"; g.fillText(vl.label, X(vl.x) + 4, padT + 12); }
    });
    g.save(); g.beginPath(); g.rect(padL, padT, pw, ph); g.clip();
    (o.series || []).forEach(function (s) {
      g.strokeStyle = s.color || "#d4b483"; g.fillStyle = s.color || "#d4b483"; g.lineWidth = s.width || 1.6;
      if (s.type === "points") {
        s.x.forEach(function (xv, i) {
          if (!isFinite(xv) || !isFinite(s.y[i])) return;
          g.beginPath(); g.arc(X(xv), Y(s.y[i]), 3.2, 0, 6.2832); g.fill();
        });
      } else {
        g.beginPath(); var started = false;
        s.x.forEach(function (xv, i) {
          if (!isFinite(xv) || !isFinite(s.y[i])) { started = false; return; }
          if (!started) { g.moveTo(X(xv), Y(s.y[i])); started = true; } else g.lineTo(X(xv), Y(s.y[i]));
        });
        g.stroke();
      }
    });
    g.restore();
    // legend
    var lx = padL + 8, ly = padT + ph - 8 - (o.series.length - 1) * 15;
    g.textAlign = "left";
    (o.series || []).forEach(function (s, i) {
      if (!s.label) return;
      g.fillStyle = s.color || "#d4b483"; g.fillRect(lx, ly + i * 15 - 8, 10, 3);
      g.fillStyle = "#b7ab95"; g.fillText(s.label, lx + 15, ly + i * 15);
    });
  }
  root.R1Plot = { draw: draw };
})(typeof window !== "undefined" ? window : globalThis);
