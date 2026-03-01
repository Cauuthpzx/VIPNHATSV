#!/usr/bin/env python3
"""
Quick fix script to handle the remaining problematic pages:
- getRebateOddsPanel: needs SPA iframe with longer wait
- reportFunds: check for dynamically loaded filters
- betOrder: check for any filters
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

class CDPClient:
    def __init__(self):
        self.ws = None
        self.msg_id = 0

    def connect(self):
        resp = requests.get(f"{CDP_HTTP}/json")
        for t in resp.json():
            if t.get("type") == "page":
                ws_url = t["webSocketDebuggerUrl"]
                break
        self.ws = websocket.create_connection(ws_url, timeout=30, suppress_origin=True)
        print("Connected!")

    def send(self, method, params=None):
        self.msg_id += 1
        msg = {"id": self.msg_id, "method": method}
        if params: msg["params"] = params
        self.ws.send(json.dumps(msg))
        while True:
            resp = json.loads(self.ws.recv())
            if resp.get("id") == self.msg_id: return resp

    def navigate(self, url):
        return self.send("Page.navigate", {"url": url})

    def evaluate(self, expr, ctx=None):
        p = {"expression": expr, "returnByValue": True, "awaitPromise": False}
        if ctx: p["contextId"] = ctx
        return self.send("Runtime.evaluate", p)

    def close(self):
        if self.ws: self.ws.close()


def parse_result(r):
    if r and "result" in r:
        res = r["result"].get("result", {})
        if res.get("type") == "string":
            try: return json.loads(res["value"])
            except: pass
        return res.get("value", None)
    return None

def get_frames(cdp):
    r = cdp.send("Page.getFrameTree")
    frames = []
    if r and "result" in r:
        ft = r["result"].get("frameTree", {})
        mf = ft.get("frame", {})
        frames.append(("main", mf.get("id",""), mf.get("url","")))
        for c in ft.get("childFrames", []):
            cf = c.get("frame", {})
            frames.append(("iframe", cf.get("id",""), cf.get("url","")))
    return frames

def extract_all(cdp, js):
    results = []
    frames = get_frames(cdp)
    r = cdp.evaluate(js)
    d = parse_result(r)
    if isinstance(d, list): results.extend(d)
    for ft, fid, fu in frames:
        if ft != "main" and fid:
            try:
                wr = cdp.send("Page.createIsolatedWorld", {"frameId": fid, "worldName": "ext"})
                if wr and "result" in wr:
                    ctx = wr["result"].get("executionContextId")
                    if ctx:
                        ir = cdp.evaluate(js, ctx=ctx)
                        id2 = parse_result(ir)
                        if isinstance(id2, list): results.extend(id2)
            except: pass
    return results

def deduplicate(filters):
    result = []
    seen = set()
    for f in filters:
        label = f.get("label","")
        name = f.get("name","")
        opts = f.get("options",[])
        ftype = f.get("type","")
        best = label
        if best.startswith(("hs_select_filter","hs_lottery_filter","hs_play_filter","select_","layui_select_")):
            if name: best = name
        if ftype == "layui_select":
            dup = False
            for rf in result:
                if len(rf.get("options",[])) == len(opts) and opts and rf.get("options",[]):
                    if rf["options"][0].get("text") == opts[0].get("text"):
                        dup = True; break
            if dup: continue
        dk = f"{name or best}|{len(opts)}"
        if dk in seen: continue
        seen.add(dk)
        clean = {"label": best, "options": opts}
        if name: clean["name"] = name
        if f.get("id"): clean["id"] = f["id"]
        if f.get("layFilter"): clean["layFilter"] = f["layFilter"]
        result.append(clean)
    return result

def safe_print(t):
    try: print(t)
    except: print(t.encode('ascii','replace').decode('ascii'))


def main():
    print("Fixing remaining pages...")
    cdp = CDPClient()
    cdp.connect()
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")

    # Load existing results
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        all_results = json.load(f)

    # Fix getRebateOddsPanel - navigate to SPA, set iframe, wait longer
    print("\n=== getRebateOddsPanel ===")
    cdp.navigate(f"{BASE_URL}/")
    time.sleep(3)
    # Set iframe src
    cdp.evaluate("""
        (function() {
            var iframe = document.querySelector('iframe');
            if (iframe) { iframe.src = '/agent/getRebateOddsPanel.html'; }
        })();
    """)
    time.sleep(7)  # Longer wait for this page
    frames = get_frames(cdp)
    for ft, fid, fu in frames:
        print(f"  [{ft}] {fu}")
    filters = extract_all(cdp, EXTRACT_JS)
    print(f"  Found {len(filters)} raw elements")
    deduped = deduplicate(filters)
    if deduped:
        all_results["getRebateOddsPanel"] = {
            "url": f"{BASE_URL}/agent/getRebateOddsPanel.html",
            "filters": deduped
        }
        for f in deduped:
            safe_print(f"  - {f['label']}: {len(f['options'])} opts")

    # Also try navigating directly to getRebateOddsPanel if above didn't work
    if not deduped:
        print("  Direct nav fallback...")
        cdp.navigate(f"{BASE_URL}/agent/getRebateOddsPanel.html")
        time.sleep(6)
        frames = get_frames(cdp)
        for ft, fid, fu in frames:
            print(f"  [{ft}] {fu}")
        filters = extract_all(cdp, EXTRACT_JS)
        print(f"  Found {len(filters)} raw elements")
        deduped = deduplicate(filters)
        if deduped:
            all_results["getRebateOddsPanel"] = {
                "url": f"{BASE_URL}/agent/getRebateOddsPanel.html",
                "filters": deduped
            }

    # Check reportFunds more carefully
    print("\n=== reportFunds ===")
    cdp.navigate(f"{BASE_URL}/agent/reportFunds.html")
    time.sleep(6)
    frames = get_frames(cdp)
    for ft, fid, fu in frames:
        print(f"  [{ft}] {fu}")

    # Check what's on the page
    page_info = cdp.evaluate("""
        (function() {
            return JSON.stringify({
                title: document.title,
                url: location.href,
                bodyText: document.body ? document.body.textContent.substring(0, 500) : '',
                selectCount: document.querySelectorAll('select').length,
                formCount: document.querySelectorAll('form, .layui-form').length,
                formItemCount: document.querySelectorAll('.layui-form-item').length,
                inputCount: document.querySelectorAll('input').length
            });
        })();
    """)
    info = parse_result(page_info)
    if isinstance(info, dict):
        safe_print(f"  Title: {info.get('title')}")
        safe_print(f"  URL: {info.get('url')}")
        safe_print(f"  Selects: {info.get('selectCount')}, Forms: {info.get('formCount')}, Inputs: {info.get('inputCount')}")

    filters = extract_all(cdp, EXTRACT_JS)
    print(f"  Found {len(filters)} raw elements")
    deduped = deduplicate(filters)
    if len(deduped) > len(all_results.get("reportFunds", {}).get("filters", [])):
        all_results["reportFunds"] = {
            "url": f"{BASE_URL}/agent/reportFunds.html",
            "filters": deduped
        }
    for f in deduped:
        safe_print(f"  - {f['label']}: {len(f['options'])} opts")

    # Check betOrder
    print("\n=== betOrder ===")
    cdp.navigate(f"{BASE_URL}/agent/betOrder.html")
    time.sleep(6)
    frames = get_frames(cdp)
    for ft, fid, fu in frames:
        print(f"  [{ft}] {fu}")
    page_info2 = cdp.evaluate("""
        (function() {
            return JSON.stringify({
                title: document.title,
                url: location.href,
                selectCount: document.querySelectorAll('select').length,
                formItemCount: document.querySelectorAll('.layui-form-item').length,
                bodySnippet: document.body ? document.body.innerHTML.substring(0, 1000) : ''
            });
        })();
    """)
    info2 = parse_result(page_info2)
    if isinstance(info2, dict):
        safe_print(f"  Title: {info2.get('title')}")
        safe_print(f"  Selects: {info2.get('selectCount')}")

    filters = extract_all(cdp, EXTRACT_JS)
    print(f"  Found {len(filters)} raw elements")
    deduped = deduplicate(filters)
    if len(deduped) > len(all_results.get("betOrder", {}).get("filters", [])):
        all_results["betOrder"] = {
            "url": f"{BASE_URL}/agent/betOrder.html",
            "filters": deduped
        }
    for f in deduped:
        safe_print(f"  - {f['label']}: {len(f['options'])} opts")

    cdp.close()

    # Save updated results
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\nSaved updated results to {OUTPUT_FILE}")

    # Final summary
    print("\n" + "="*70)
    print("UPDATED SUMMARY")
    print("="*70)
    total = 0
    for pk in [p["key"] for p in PAGES]:
        data = all_results.get(pk, {})
        filters = data.get("filters", [])
        total += len(filters)
        safe_print(f"\n--- {pk} ({len(filters)} filters) ---")
        for f in filters:
            opts = f.get("options", [])
            safe_print(f"  [{f['label']}] - {len(opts)} options:")
            for o in opts:
                safe_print(f"    value='{o.get('value','')}' text='{o.get('text','')}'")
    print(f"\nTotal: {total} unique filters across {len(PAGES)} pages")


if __name__ == "__main__":
    main()
