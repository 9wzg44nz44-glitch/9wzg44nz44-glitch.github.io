#!/usr/bin/env python3
"""Compare py_outputs.json with js_outputs.json (and wl_outputs.json if present). Relative tolerance 1e-9
(absolute 1e-300 floor).  Exit 1 on any mismatch.  WL compare is reported as OWED when wl_outputs.json is absent."""
import json, sys, os, math
def flat(o, p=""):
    if isinstance(o, dict):
        for k in sorted(o): yield from flat(o[k], f"{p}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from flat(v, f"{p}[{i}]")
    else: yield p, o
def cmp(a, b, tol=1e-9):
    A = dict(flat(a)); B = dict(flat(b)); bad = []; worst = 0.0
    for k in A:
        x, y = A[k], B.get(k)
        if y is None: bad.append((k, x, None)); continue
        if isinstance(x, (int, float)) and isinstance(y, (int, float)):
            if math.isinf(x) or math.isinf(y):
                if x != y: bad.append((k, x, y))
                continue
            d = abs(x - y) / max(abs(x), abs(y), 1e-300); worst = max(worst, d)
            if d > tol: bad.append((k, x, y))
    return len(A), bad, worst
d = os.path.dirname(os.path.abspath(__file__))
py = json.load(open(os.path.join(d, "py_outputs.json"))); js = json.load(open(os.path.join(d, "js_outputs.json")))
n, bad, worst = cmp(py, js)
print(f"PY vs JS: {n - len(bad)}/{n} values agree (rel tol 1e-9), worst rel diff {worst:.2e}")
for b in bad[:20]: print("  MISMATCH", b)
wlp = os.path.join(d, "wl_outputs.json")
if os.path.exists(wlp):
    n2, bad2, w2 = cmp(py, json.load(open(wlp))); print(f"PY vs WL: {n2 - len(bad2)}/{n2} agree, worst {w2:.2e}"); bad += bad2
else:
    print("PY/JS vs WL: OWED - wl_outputs.json not present (Wolfram Cloud key not on box; WL twin unrun)")
sys.exit(1 if bad else 0)
