#!/usr/bin/env python3
"""
CDP-based script to extract ALL filter/search dropdown options from every page.
Uses Page.navigate (not window.location) to avoid losing session cookies.
Single persistent WebSocket connection throughout.
"""

import json
import sys
import io
import time
import websocket
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

CDP_HTTP = "http://127.0.0.1:9222"
BASE_URL = "https://a2u4k.ee88dly.com"
OUTPUT_FILE = r"c:\Users\Admin\Desktop\MAXHUB\captured\filter_options.json"

PAGES = [
    {"key": "user",              "path": "agent/user.html"},
    {"key": "reportLottery",     "path": "agent/reportLottery.html"},
    {"key": "bet",               "path": "agent/bet.html"},
    {"key": "reportFunds",       "path": "agent/reportFunds.html"},
    {"key": "depositAndWithdrawal", "path": "agent/depositAndWithdrawal.html"},
    {"key": "withdrawalsRecord", "path": "agent/withdrawalsRecord.html"},
    {"key": "reportThirdGame",   "path": "agent/reportThirdGame.html"},
    {"key": "betOrder",          "path": "agent/betOrder.html"},
    {"key": "getRebateOddsPanel","path": "agent/getRebateOddsPanel.html"},
]

EXTRACT_JS = r"""
(function() {
    var results = [];

    var selects = document.querySelectorAll('select');
    for (var i = 0; i < selects.length; i++) {
        var sel = selects[i];
        var name = sel.name || '';
        var id = sel.id || '';
        var layFilter = sel.getAttribute('lay-filter') || '';
        var label = findLabel(sel, i);
        var options = [];
        var opts = sel.querySelectorAll('option');
        for (var j = 0; j < opts.length; j++) {
            options.push({ value: opts[j].value, text: opts[j].textContent.trim() });
        }
        results.push({ type: 'native_select', label: label, name: name, id: id, layFilter: layFilter, options: options });
    }

    var layuiSelects = document.querySelectorAll('.layui-form-select');
    for (var k = 0; k < layuiSelects.length; k++) {
        var ls = layuiSelects[k];
        var inputEl = ls.querySelector('.layui-select-title input');
        var selectedText = inputEl ? inputEl.value : '';
        var label2 = findLayuiLabel(ls, k);
        var ddOptions = [];
        var dds = ls.querySelectorAll('dl dd');
        for (var m = 0; m < dds.length; m++) {
            ddOptions.push({ value: dds[m].getAttribute('lay-value') || '', text: dds[m].textContent.trim() });
        }
        results.push({ type: 'layui_select', label: label2, selectedText: selectedText, options: ddOptions });
    }

    function findLabel(sel, idx) {
        var label = '', name = sel.name || '', id = sel.id || '';
        if (id) { var lbl = document.querySelector('label[for="' + id + '"]'); if (lbl) label = lbl.textContent.trim(); }
        if (!label) { var ip = sel.closest('.layui-inline'); if (ip) { var il = ip.querySelector('.layui-form-label'); if (il) label = il.textContent.trim(); } }
        if (!label) { var fi = sel.closest('.layui-form-item'); if (fi) { var fl = fi.querySelector('.layui-form-label'); if (fl) label = fl.textContent.trim(); } }
        if (!label) { var ii = sel.closest('.layui-input-inline, .layui-input-block'); if (ii) { var p = ii.previousElementSibling; while (p) { if (p.classList && (p.classList.contains('layui-form-label') || p.tagName === 'LABEL')) { label = p.textContent.trim(); break; } p = p.previousElementSibling; } } }
        if (!label) { var p2 = sel.previousElementSibling; if (p2 && p2.textContent && p2.textContent.trim().length < 50) label = p2.textContent.trim(); }
        if (!label && name) label = name;
        if (!label) label = sel.getAttribute('lay-filter') || id || ('select_' + idx);
        return label.replace(/[:：\s]+$/g, '').trim();
    }

    function findLayuiLabel(ls, idx) {
        var label = '';
        var ip = ls.closest('.layui-inline'); if (ip) { var il = ip.querySelector('.layui-form-label'); if (il) label = il.textContent.trim(); }
        if (!label) { var fi = ls.closest('.layui-form-item'); if (fi) { var fl = fi.querySelector('.layui-form-label'); if (fl) label = fl.textContent.trim(); } }
        if (!label) { var ii = ls.closest('.layui-input-inline, .layui-input-block'); if (ii) { var p = ii.previousElementSibling; while (p) { if (p.classList && (p.classList.contains('layui-form-label') || p.tagName === 'LABEL')) { label = p.textContent.trim(); break; } p = p.previousElementSibling; } } }
        if (!label) { var parent = ls.parentElement; if (parent) { var us = parent.querySelector('select'); if (us) label = us.name || us.getAttribute('lay-filter') || us.id || ''; } }
        if (!label) label = 'layui_select_' + idx;
        return label.replace(/[:：\s]+$/g, '').trim();
    }

    return JSON.stringify(results);
})();
"""


class CDP:
    def __init__(self):
        self.ws = None
        self.mid = 0

    def connect(self):
        resp = requests.get(f"{CDP_HTTP}/json")
        for t in resp.json():
            if t.get("type") == "page":
                ws_url = t["webSocketDebuggerUrl"]
                break
        self.ws = websocket.create_connection(ws_url, timeout=30, suppress_origin=True)

    def cmd(self, method, params=None):
        self.mid += 1
        msg = {"id": self.mid, "method": method}
        if params:
            msg["params"] = params
        self.ws.send(json.dumps(msg))
        while True:
            r = json.loads(self.ws.recv())
            if r.get("id") == self.mid:
                return r

    def nav(self, url):
        return self.cmd("Page.navigate", {"url": url})

    def js(self, expr, ctx=None):
        p = {"expression": expr, "returnByValue": True, "awaitPromise": False}
        if ctx:
            p["contextId"] = ctx
        return self.cmd("Runtime.evaluate", p)

    def frames(self):
        r = self.cmd("Page.getFrameTree")
        fl = []
        if r and "result" in r:
            ft = r["result"].get("frameTree", {})
            mf = ft.get("frame", {})
            fl.append(("main", mf.get("id", ""), mf.get("url", "")))
            for c in ft.get("childFrames", []):
                cf = c.get("frame", {})
                fl.append(("iframe", cf.get("id", ""), cf.get("url", "")))
        return fl

    def close(self):
        if self.ws:
            self.ws.close()


def parse(r):
    if r and "result" in r:
        v = r["result"].get("result", {})
        if v.get("type") == "string":
            try:
                return json.loads(v["value"])
            except:
                pass
        return v.get("value")
    return None


def extract_all(cdp, js):
    results = []
    frames = cdp.frames()
    for ft, fid, fu in frames:
        print(f"    [{ft}] {fu[:80]}")

    # Main frame
    d = parse(cdp.js(js))
    if isinstance(d, list) and d:
        print(f"    Main: {len(d)} elements")
        results.extend(d)

    # Iframes
    for ft, fid, fu in frames:
        if ft != "main" and fid:
            try:
                wr = cdp.cmd("Page.createIsolatedWorld", {"frameId": fid, "worldName": "ext"})
                if wr and "result" in wr:
                    ctx = wr["result"].get("executionContextId")
                    if ctx:
                        d2 = parse(cdp.js(js, ctx=ctx))
                        if isinstance(d2, list) and d2:
                            print(f"    Iframe: {len(d2)} elements")
                            results.extend(d2)
            except:
                pass
    return results


def dedup(filters):
    result = []
    seen = set()
    for f in filters:
        label = f.get("label", "")
        name = f.get("name", "")
        opts = f.get("options", [])
        ftype = f.get("type", "")

        best = label
        if best.startswith(("hs_select_filter", "hs_lottery_filter", "hs_play_filter",
                           "select_", "layui_select_")):
            if name:
                best = name

        if ftype == "layui_select":
            dup = False
            for rf in result:
                if len(rf.get("options", [])) == len(opts) and opts and rf.get("options", []):
                    if rf["options"][0].get("text") == opts[0].get("text"):
                        dup = True
                        break
            if dup:
                continue

        dk = f"{name or best}|{len(opts)}"
        if dk in seen:
            continue
        seen.add(dk)

        clean = {"label": best, "options": opts}
        if name: clean["name"] = name
        if f.get("id"): clean["id"] = f["id"]
        if f.get("layFilter"): clean["layFilter"] = f["layFilter"]
        result.append(clean)
    return result


def sp(t):
    try: print(t)
    except: print(t.encode('ascii', 'replace').decode('ascii'))


def main():
    print("=" * 70)
    print("CDP Filter Extraction Script")
    print("=" * 70)

    cdp = CDP()
    cdp.connect()
    cdp.cmd("Page.enable")
    cdp.cmd("Runtime.enable")
    print("Connected!")

    all_results = {}

    for page in PAGES:
        pk = page["key"]
        pp = page["path"]
        url = f"{BASE_URL}/{pp}"

        print(f"\n{'='*50}")
        print(f"Processing: {pk}")
        print(f"{'='*50}")

        try:
            cdp.nav(url)
            time.sleep(5)

            # Check where we are
            frames = cdp.frames()
            main_url = ""
            for ft, fid, fu in frames:
                if ft == "main":
                    main_url = fu

            landed = pp in main_url

            if not landed:
                sp(f"  Redirected to {main_url}")
                # For SPA, go to base URL and navigate iframe
                cdp.nav(BASE_URL)
                time.sleep(3)
                cdp.js(f"(function(){{ var f=document.querySelector('iframe'); if(f) f.src='/{pp}'; }})();")
                time.sleep(6)

            # Extract
            sp(f"  Extracting...")
            raw = extract_all(cdp, EXTRACT_JS)
            n = sum(1 for f in raw if f.get("type") == "native_select")
            l = sum(1 for f in raw if f.get("type") == "layui_select")
            sp(f"  Raw: {n} native + {l} layui")

            d = dedup(raw)
            all_results[pk] = {"url": url, "filters": d}

            sp(f"  Result: {len(d)} unique filters")
            for f in d:
                o = f.get("options", [])
                sp(f"    - {f['label']}: {len(o)} opts")

        except Exception as e:
            sp(f"  ERROR: {e}")
            all_results[pk] = {"url": url, "filters": [], "error": str(e)}

    cdp.close()

    # Save
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\nSaved to {OUTPUT_FILE}")

    # Summary
    print(f"\n{'='*70}")
    print("FULL SUMMARY")
    print(f"{'='*70}")
    total = 0
    for pk in [p["key"] for p in PAGES]:
        data = all_results.get(pk, {})
        filters = data.get("filters", [])
        total += len(filters)
        sp(f"\n--- {pk} ({len(filters)} filters) ---")
        for f in filters:
            o = f.get("options", [])
            sp(f"  [{f['label']}] - {len(o)} options:")
            for oo in o:
                sp(f"    value='{oo.get('value','')}' text='{oo.get('text','')}'")
    print(f"\nTotal: {total} filters across {len(PAGES)} pages")


if __name__ == "__main__":
    main()
