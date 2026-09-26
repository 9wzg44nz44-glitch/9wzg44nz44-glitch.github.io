"""Build experiment-g.html from web/template_*.html, filling {{key}} from expt_g_numbers.EXPECT (recomputed).
Fails if any placeholder is left or unknown.  Usage: python3 build_page.py [out.html]"""
import os, re, sys, json
d = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, d)
import expt_g_numbers as N
EXPECT = N.X   # recomputed on import
w = os.path.join(d, "..", "web")
parts = ["template_head.html"] + [f"template_body{i}.html" for i in range(1, 6)]
html = "".join(open(os.path.join(w, p), encoding="utf-8").read() for p in parts)
missing = sorted(set(k for k in re.findall(r"\{\{([^}]+)\}\}", html) if k not in EXPECT))
if missing: sys.exit("unknown placeholders: " + ", ".join(missing))
html = re.sub(r"\{\{([^}]+)\}\}", lambda m: str(EXPECT[m.group(1)]), html)
if re.search(r"\{\{", html): sys.exit("leftover {{")
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(w, "experiment-g.html")
open(out, "w", encoding="utf-8").write(html); print("wrote", out, len(html), "bytes")
