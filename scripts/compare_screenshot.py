"""Take screenshots of both original site pages and our app pages for comparison."""
import asyncio
import json
import sys
import base64
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

CDP_HTTP = "http://127.0.0.1:9222"
ORIGINAL_SITE = "https://a2u4k.ee88dly.com/"
OUR_APP = "http://localhost:5175/"

PAGES = [
    {"name": "user", "original": "agent/user.html", "ours": "agent/user"},
    {"name": "reportLottery", "original": "agent/reportLottery.html", "ours": "agent/report-lottery"},
    {"name": "bet", "original": "agent/bet.html", "ours": "agent/bet"},
    {"name": "editPassword", "original": "agent/editPassword.html", "ours": "agent/edit-password"},
    {"name": "reportFunds", "original": "agent/reportFunds.html", "ours": "agent/report-funds"},
    {"name": "bankList", "original": "agent/bankList.html", "ours": "agent/bank-list"},
    {"name": "rebateOdds", "original": "agent/getRebateOddsPanel.html", "ours": "agent/rebate-odds"},
]

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
    events = []
    while asyncio.get_event_loop().time() < deadline:
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=2)
            data = json.loads(raw)
            if data.get("id") == cid: return data, events
            events.append(data)
        except asyncio.TimeoutError: continue
    return None, events

async def drain(ws, dur=2):
    deadline = asyncio.get_event_loop().time() + dur
    while asyncio.get_event_loop().time() < deadline:
        try: await asyncio.wait_for(ws.recv(), timeout=0.3)
        except asyncio.TimeoutError: continue

async def screenshot(ws, path):
    cid = await cdp_send(ws, "Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
    result, _ = await cdp_recv(ws, cid)
    if result and "result" in result:
        data = base64.b64decode(result["result"]["data"])
        with open(path, "wb") as f:
            f.write(data)
        print(f"  Saved: {path} ({len(data)} bytes)")

async def main():
    print("=== Screenshot Comparison ===\n")

    # Get the original site tab
    resp = urllib.request.urlopen(f"{CDP_HTTP}/json/list")
    tabs = json.loads(resp.read().decode())

    original_tab = None
    our_tab = None
    for t in tabs:
        if "ee88dly" in t.get("url", ""): original_tab = t
        if "localhost:5175" in t.get("url", ""): our_tab = t

    if not original_tab:
        req = urllib.request.Request(f"{CDP_HTTP}/json/new?{ORIGINAL_SITE}", method="PUT")
        resp = urllib.request.urlopen(req)
        original_tab = json.loads(resp.read().decode())

    # Screenshot original pages
    print("Original site screenshots:")
    async with websockets.connect(original_tab["webSocketDebuggerUrl"], max_size=50*1024*1024) as ws:
        cid = await cdp_send(ws, "Page.enable")
        await cdp_recv(ws, cid)

        for page in PAGES:
            url = ORIGINAL_SITE + page["original"]
            print(f"\n  Navigating: {url}")
            cid = await cdp_send(ws, "Page.navigate", {"url": url})
            await cdp_recv(ws, cid)
            await asyncio.sleep(4)
            await drain(ws, 2)
            await screenshot(ws, f"c:\\Users\\Admin\\Desktop\\MAXHUB\\captured\\original_{page['name']}.png")

    # Screenshot our app pages
    if our_tab:
        print("\n\nOur app screenshots:")
        async with websockets.connect(our_tab["webSocketDebuggerUrl"], max_size=50*1024*1024) as ws:
            cid = await cdp_send(ws, "Page.enable")
            await cdp_recv(ws, cid)

            for page in PAGES:
                url = OUR_APP + page["ours"]
                print(f"\n  Navigating: {url}")
                cid = await cdp_send(ws, "Page.navigate", {"url": url})
                await cdp_recv(ws, cid)
                await asyncio.sleep(3)
                await drain(ws, 2)
                await screenshot(ws, f"c:\\Users\\Admin\\Desktop\\MAXHUB\\captured\\ours_{page['name']}.png")
    else:
        print("\nNo localhost:5175 tab found. Open one in Chrome first.")

    print("\n\nDone! Compare screenshots in captured/ folder.")

if __name__ == "__main__":
    asyncio.run(main())
