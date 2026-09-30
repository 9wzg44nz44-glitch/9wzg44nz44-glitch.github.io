#!/usr/bin/env python3
"""Build /search-index.json for the SLW Hub site search.

Usage (from the repo root or anywhere):
    python3 tools/build_search_index.py          # rewrite search-index.json
    python3 tools/build_search_index.py --check  # exit 1 if index is stale or a
                                                 # page lacks the search/responsive tags

Stdlib only. Scans every *.html page in the repo (except search.html and
anything under .git / node_modules), extracts the page title, h1-h3 headings,
meta description and visible body text (minus <script>, <style>, the site
header/nav, footer and SVG drawings), and writes a compact JSON array:

    [{"url": "/ranging/", "title": "...", "headings": ["..."],
      "description": "...", "text": "..."}, ...]

Rerun this whenever a hub page is added or edited (same PR), and make sure the
new page carries, in <head>, the viewport meta plus these two lines:
    <link rel="stylesheet" href="/assets/site-responsive.css">
    <script src="/assets/site-search.js" defer></script>
"""
import html
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "search-index.json")
SCRIPT_TAG = '<script src="/assets/site-search.js" defer></script>'
CSS_TAG = '<link rel="stylesheet" href="/assets/site-responsive.css">'
EXCLUDE_FILES = {"search.html"}
EXCLUDE_DIRS = {".git", "node_modules", ".github"}
# Source fragments used to assemble a page (not pages themselves):
EXCLUDE_PREFIXES = ("expt-g/web/",)
MAX_TEXT = 40000          # characters of body text kept per page
TITLE_SUFFIX = re.compile(r"\s*·\s*SLW Hub\s*$")
SKIP_TAGS = {"script", "style", "noscript", "template", "svg", "nav", "footer",
             "head", "select", "canvas", "math"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}
BLOCK = {"p", "div", "section", "article", "li", "ul", "ol", "table", "tr",
         "td", "th", "h1", "h2", "h3", "h4", "h5", "h6", "br", "hr", "pre",
         "blockquote", "figure", "figcaption", "dt", "dd", "details",
         "summary", "main", "aside", "caption", "label", "header"}


class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.description = ""
        self.headings = []
        self.parts = []
        self.skip = []          # stack of tags that start a skipped region
        self.in_title = False
        self.head_buf = None    # (tag, [text]) while inside h1-h3

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta" and (a.get("name") or "").lower() == "description":
            self.description = (a.get("content") or "").strip()
        if tag == "title":
            self.in_title = True
        if tag in VOID:
            if tag in BLOCK and not self.skip:
                self.parts.append(" ")
            return
        cls = (a.get("class") or "").split()
        site_header = tag == "header" and ("site-header" in cls or "site" in cls)
        skip_link = tag == "a" and "skip" in cls
        if self.skip or tag in SKIP_TAGS or site_header or skip_link or \
                a.get("aria-hidden") == "true" or "hidden" in a:
            self.skip.append(tag)
            return
        if tag in ("h1", "h2", "h3"):
            self.head_buf = (tag, [])
        if tag in BLOCK:
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if self.skip:
            # pop to the matching opener (tolerates sloppy nesting)
            if tag in self.skip:
                while self.skip:
                    if self.skip.pop() == tag:
                        break
            return
        if self.head_buf and tag == self.head_buf[0]:
            t = norm("".join(self.head_buf[1]))
            if t and t not in self.headings:
                self.headings.append(t)
            self.head_buf = None
        if tag in BLOCK:
            self.parts.append(" ")

    def handle_data(self, data):
        if self.in_title:
            self.title += data
            return
        if self.skip:
            return
        self.parts.append(data)
        if self.head_buf:
            self.head_buf[1].append(data)


def norm(s):
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def page_url(rel):
    rel = rel.replace(os.sep, "/")
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def find_pages():
    pages = []
    for d, dirs, files in os.walk(ROOT):
        dirs[:] = sorted(x for x in dirs if x not in EXCLUDE_DIRS)
        for f in sorted(files):
            if f.endswith(".html"):
                rel = os.path.relpath(os.path.join(d, f), ROOT)
                if rel.replace(os.sep, "/") not in EXCLUDE_FILES and not rel.replace(os.sep, "/").startswith(EXCLUDE_PREFIXES):
                    pages.append(rel)
    # home page first, then alphabetical
    pages.sort(key=lambda r: (r != "index.html", r))
    return pages


def build():
    out = []
    for rel in find_pages():
        with open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace") as fh:
            src = fh.read()
        p = Extractor()
        p.feed(src)
        p.close()
        title = TITLE_SUFFIX.sub("", norm(p.title)) or rel
        text = norm("".join(p.parts))
        if len(text) > MAX_TEXT:
            cut = text.rfind(" ", 0, MAX_TEXT)
            text = text[: cut if cut > 0 else MAX_TEXT] + " …"
        out.append({
            "url": page_url(rel),
            "title": title,
            "headings": p.headings[:80],
            "description": p.description,
            "text": text,
        })
    return out


def serialise(data):
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"


def main():
    check = "--check" in sys.argv
    data = serialise(build())
    if check:
        ok = True
        try:
            with open(OUT, encoding="utf-8") as fh:
                if fh.read() != data:
                    print("search-index.json is stale: rerun python3 tools/build_search_index.py")
                    ok = False
        except FileNotFoundError:
            print("search-index.json missing")
            ok = False
        for rel in find_pages() + ["search.html"]:
            path = os.path.join(ROOT, rel)
            if os.path.exists(path):
                with open(path, encoding="utf-8", errors="replace") as fh:
                    src = fh.read()
                for tag, what in ((SCRIPT_TAG, "search script tag"), (CSS_TAG, "responsive CSS link")):
                    if tag not in src:
                        print("missing %s:" % what, rel)
                        ok = False
                if 'name="viewport"' not in src:
                    print("missing viewport meta:", rel)
                    ok = False
        print("OK" if ok else "FAILED")
        sys.exit(0 if ok else 1)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(data)
    n = len(json.loads(data))
    print(f"wrote {OUT} ({n} pages, {len(data.encode('utf-8'))/1024:.0f} KiB)")


if __name__ == "__main__":
    main()
