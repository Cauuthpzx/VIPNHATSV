"""Inspect the rendered HTML of select elements on our app."""
import asyncio
import json
import sys
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

CDP_HTTP = "http://127.0.0.1:9222"

msg_id = 0
def next_id():
    global msg_id
    msg_id += 1
    return msg_id

async def cdp_send(ws, method, params=None):
    cid = next_id()
    msg = {"id": cid, "method": method}
    if params: msg["params"] = params
    await ws.send(json.dumps(msg))
    return cid

async def cdp_recv(ws, cid, timeout=15):
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=2)
            data = json.loads(raw)
            if data.get("id") == cid: return data
        except asyncio.TimeoutError: continue
    return None

async def main():
    resp = urllib.request.urlopen(f"{CDP_HTTP}/json/list")
    tabs = json.loads(resp.read().decode())
    our_tab = None
    for t in tabs:
        if "localhost:5175" in t.get("url", ""): our_tab = t
    if not our_tab:
        print("No localhost:5175 tab found")
        return

    async with websockets.connect(our_tab["webSocketDebuggerUrl"], max_size=50*1024*1024) as ws:
        cid = await cdp_send(ws, "Page.enable")
        await cdp_recv(ws, cid)

        # Navigate to user page
        cid = await cdp_send(ws, "Page.navigate", {"url": "http://localhost:5175/agent/user"})
        await cdp_recv(ws, cid)
        await asyncio.sleep(4)

        # Get HTML of select elements
        js = """
        (() => {
            const results = {};

            // 1. Check for nested/duplicate select wrappers
            const selectWrappers = document.querySelectorAll('.layui-select, .layui-form-select, [class*="select"]');
            results.selectWrapperCount = selectWrappers.length;
            results.selectWrapperClasses = Array.from(selectWrappers).map(el => ({
                tagName: el.tagName,
                className: el.className,
                innerHTML: el.innerHTML.substring(0, 200),
                parentClass: el.parentElement?.className || 'none'
            }));

            // 2. Check the pagination area
            const pageArea = document.querySelector('.layui-laypage, [class*="page"]');
            if (pageArea) {
                results.paginationHTML = pageArea.outerHTML.substring(0, 2000);
            }

            // 3. Check for any lay-select rendered HTML
            const laySelectDivs = document.querySelectorAll('.layui-select, .lay-select');
            results.laySelectCount = laySelectDivs.length;

            // 4. Check all select-like elements for nesting
            const allInputs = document.querySelectorAll('input');
            const nestedInputs = [];
            allInputs.forEach(input => {
                const parent = input.closest('.layui-select, .layui-form-select, [class*="layui-select"]');
                if (parent) {
                    const grandparent = parent.parentElement?.closest('.layui-select, .layui-form-select, [class*="layui-select"]');
                    if (grandparent) {
                        nestedInputs.push({
                            inputClass: input.className,
                            parentClass: parent.className,
                            grandparentClass: grandparent.className,
                            html: grandparent.outerHTML.substring(0, 300)
                        });
                    }
                }
            });
            results.nestedInputs = nestedInputs;

            // 5. Look at the search form selects
            const searchWrap = document.querySelector('.search-form-wrap');
            if (searchWrap) {
                const selectElements = searchWrap.querySelectorAll('.layui-select, select, [class*="select"]');
                results.searchSelectElements = Array.from(selectElements).map(el => ({
                    tag: el.tagName,
                    class: el.className,
                    outerHTML: el.outerHTML.substring(0, 500)
                }));
            }

            // 6. Check pagination limits dropdown specifically
            const limitsArea = document.querySelector('.layui-page-limits');
            if (limitsArea) {
                results.limitsHTML = limitsArea.outerHTML.substring(0, 1000);
            }

            return JSON.stringify(results, null, 2);
        })()
        """

        cid = await cdp_send(ws, "Runtime.evaluate", {"expression": js, "returnByValue": True})
        result = await cdp_recv(ws, cid)
        if result and "result" in result:
            data = json.loads(result["result"]["result"]["value"])
            print(json.dumps(data, indent=2, ensure_ascii=False))

asyncio.run(main())
