#!/usr/bin/env python3
"""
CDP filter extraction - V2
Handles SPA pages that redirect by navigating through the main SPA shell.
Focuses on the 3 problem pages: reportFunds, betOrder, getRebateOddsPanel
Plus re-scans all pages for completeness.
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


class CDPClient:
    def __init__(self):
        self.ws = None
        self.msg_id = 0

    def connect(self):
        resp = requests.get(f"{CDP_HTTP}/json")
        targets = resp.json()
        ws_url = None
        for t in targets:
            if t.get("type") == "page":
                ws_url = t["webSocketDebuggerUrl"]
                break
        if not ws_url:
            raise Exception("No page target")
        print(f"Connecting to: {ws_url}")
        self.ws = websocket.create_connection(ws_url, timeout=30, suppress_origin=True)
        print("Connected!")

    def send(self, method, params=None):
        self.msg_id += 1
        msg = {"id": self.msg_id, "method": method}
        if params: msg["params"] = params
        self.ws.send(json.dumps(msg))
        while True:
            resp = json.loads(self.ws.recv())
            if resp.get("id") == self.msg_id:
                return resp

    def navigate(self, url):
        return self.send("Page.navigate", {"url": url})

    def evaluate(self, expression, context_id=None):
        params = {"expression": expression, "returnByValue": True, "awaitPromise": False}
        if context_id: params["contextId"] = context_id
        return self.send("Runtime.evaluate", params)

    def close(self):
        if self.ws: self.ws.close()


def parse_result(result):
    if result and "result" in result:
        res = result["result"].get("result", {})
        if res.get("type") == "string":
            try: return json.loads(res["value"])
            except: pass
        return res.get("value", None)
    return None


def get_frames(cdp):
    result = cdp.send("Page.getFrameTree")
    frames = []
    if result and "result" in result:
        ft = result["result"].get("frameTree", {})
        mf = ft.get("frame", {})
        frames.append(("main", mf.get("id", ""), mf.get("url", "")))
        for child in ft.get("childFrames", []):
            cf = child.get("frame", {})
            frames.append(("iframe", cf.get("id", ""), cf.get("url", "")))
    return frames


def extract_from_all_frames(cdp, js):
    results = []
    frames = get_frames(cdp)

    # Main frame
    r = cdp.evaluate(js)
    data = parse_result(r)
    if isinstance(data, list) and data:
        results.extend(data)

    # Iframes
    for ftype, fid, furl in frames:
        if ftype != "main" and fid:
            try:
                wr = cdp.send("Page.createIsolatedWorld", {"frameId": fid, "worldName": "ext"})
                if wr and "result" in wr:
                    ctx = wr["result"].get("executionContextId")
                    if ctx:
                        ir = cdp.evaluate(js, context_id=ctx)
                        idata = parse_result(ir)
                        if isinstance(idata, list) and idata:
                            results.extend(idata)
            except: pass

    return results


def deduplicate(filters):
    result = []
    seen = set()
    for f in filters:
        label = f.get("label", "")
        name = f.get("name", "")
        opts = f.get("options", [])
        ftype = f.get("type", "")

        best_label = label
        if best_label.startswith(("hs_select_filter", "hs_lottery_filter", "hs_play_filter", "select_", "layui_select_")):
            if name: best_label = name

        # Skip layui dups
        if ftype == "layui_select":
            is_dup = False
            for rf in result:
                if len(rf.get("options", [])) == len(opts) and opts and rf.get("options", []):
                    if rf["options"][0].get("text") == opts[0].get("text"):
                        is_dup = True
                        break
            if is_dup: continue

        dk = f"{name or best_label}|{len(opts)}"
        if dk in seen: continue
        seen.add(dk)

        clean = {"label": best_label, "options": opts}
        if name: clean["name"] = name
        if f.get("id"): clean["id"] = f["id"]
        if f.get("layFilter"): clean["layFilter"] = f["layFilter"]
        result.append(clean)

    return result


def safe_print(t):
    try: print(t)
    except: print(t.encode('ascii','replace').decode('ascii'))


def main():
    print("=" * 70)
    print("CDP Filter Extraction Script V2")
    print("=" * 70)

    cdp = CDPClient()
    cdp.connect()
    cdp.send("Page.enable")
    cdp.send("Runtime.enable")

    all_results = {}

    for page in PAGES:
        pk = page["key"]
        pp = page["path"]
        url = f"{BASE_URL}/{pp}"

        print(f"\n{'='*50}")
        print(f"Processing: {pk} ({pp})")
        print(f"{'='*50}")

        try:
            # Navigate directly
            print(f"  Navigating to: {url}")
            cdp.navigate(url)
            time.sleep(5)

            frames = get_frames(cdp)
            main_url = ""
            for ft, fid, fu in frames:
                if ft == "main": main_url = fu
                print(f"    [{ft}] {fu[:80]}")

            # Check if we got redirected to SPA shell
            page_in_iframe = False
            if "/" + pp not in main_url and not main_url.endswith(pp):
                print(f"  Direct navigation landed at {main_url} - trying SPA iframe approach...")

                # First go to the SPA main page
                cdp.navigate(BASE_URL)
                time.sleep(3)

                # Now set the iframe src
                nav_js = f"""
                (function() {{
                    var iframe = document.querySelector('iframe');
                    if (iframe) {{
                        iframe.src = '/{pp}';
                        return 'ok: iframe src set to /{pp}';
                    }}
                    return 'no iframe found';
                }})();
                """
                nr = cdp.evaluate(nav_js)
                nav_val = parse_result(nr)
                print(f"  SPA nav result: {nav_val}")
                time.sleep(5)

                page_in_iframe = True
                frames = get_frames(cdp)
                for ft, fid, fu in frames:
                    print(f"    [{ft}] {fu[:80]}")

            # Extract filters
            filters = extract_from_all_frames(cdp, EXTRACT_JS)
            native_ct = sum(1 for f in filters if f.get("type") == "native_select")
            layui_ct = sum(1 for f in filters if f.get("type") == "layui_select")
            print(f"  Found: {native_ct} native + {layui_ct} layui = {len(filters)} total")

            deduped = deduplicate(filters)
            all_results[pk] = {"url": url, "filters": deduped}

            safe_print(f"\n  Summary for {pk}: {len(deduped)} unique filters")
            for f in deduped:
                opts = f.get("options", [])
                safe_print(f"    - {f['label']}: {len(opts)} options")
                for o in opts[:3]:
                    safe_print(f"        [{o.get('value','')}] {o.get('text','')}")
                if len(opts) > 3:
                    safe_print(f"        ... and {len(opts)-3} more")

        except Exception as e:
            print(f"  ERROR: {e}")
            import traceback; traceback.print_exc()
            all_results[pk] = {"url": url, "filters": [], "error": str(e)}

    cdp.close()

    # Save
    print(f"\n{'='*70}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"Saved to {OUTPUT_FILE}")

    # Summary
    print(f"\n{'='*70}")
    print("FULL SUMMARY")
    print(f"{'='*70}")
    total = 0
    for pk, data in all_results.items():
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
