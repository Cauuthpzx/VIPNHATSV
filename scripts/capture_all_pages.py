import asyncio
import json
import sys
import base64
import os
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

try:
    import websockets
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
    import websockets

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "captured", "pages")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# All pages from the original site (iframe URLs)
PAGES = [
    ("user", "/agent/user.html"),
    ("inviteList", "/agent/inviteList.html"),
    ("reportLottery", "/agent/reportLottery.html"),
    ("reportFunds", "/agent/reportFunds.html"),
    ("reportThirdGame", "/agent/reportThirdGame.html"),
    ("bankList", "/agent/bankList.html"),
    ("depositAndWithdrawal", "/agent/depositAndWithdrawal.html"),
    ("withdrawalsRecord", "/agent/withdrawalsRecord.html"),
    ("withdraw", "/agent/withdraw.html"),
    ("bet", "/agent/bet.html"),
    ("betOrder", "/agent/betOrder.html"),
    ("editPassword", "/agent/editPassword.html"),
    ("editFundPassword", "/agent/editFundPassword.html"),
    ("getRebateOddsPanel", "/agent/getRebateOddsPanel.html"),
]

BASE_URL = "https://a2u4k.ee88dly.com"

msg_id = 0

async def send_cmd(ws, method, params=None):
    global msg_id
    msg_id += 1
    cmd = {"id": msg_id, "method": method}
    if params:
        cmd["params"] = params
    await ws.send(json.dumps(cmd))
    while True:
        resp = json.loads(await ws.recv())
        if resp.get("id") == msg_id:
            return resp.get("result", {})

async def main():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read())
    ws_url = tabs[0]["webSocketDebuggerUrl"]

    async with websockets.connect(ws_url, max_size=100*1024*1024) as ws:
        for name, path in PAGES:
            url = BASE_URL + path
            print(f"Capturing {name}: {url}")

            await send_cmd(ws, "Page.navigate", {"url": url})
            await asyncio.sleep(3)

            # Screenshot
            r = await send_cmd(ws, "Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})
            with open(os.path.join(OUTPUT_DIR, f"{name}.png"), "wb") as f:
                f.write(base64.b64decode(r["data"]))

            # Body HTML
            body_js = "document.body ? document.body.outerHTML : document.documentElement.outerHTML"
            r = await send_cmd(ws, "Runtime.evaluate", {"expression": body_js, "returnByValue": True})
            with open(os.path.join(OUTPUT_DIR, f"{name}.html"), "w", encoding="utf-8") as f:
                f.write(r["result"]["value"])

            print(f"  -> {name}.png + {name}.html saved")

    print(f"\nDone! All pages saved to: {OUTPUT_DIR}")

asyncio.run(main())
