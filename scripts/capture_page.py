import asyncio
import json
import os
import sys
import base64

sys.stdout.reconfigure(encoding='utf-8')

try:
    import websockets
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
    import websockets

WS_URL = "ws://127.0.0.1:9222/devtools/page/B6AF2BF0C2E76BDBC4451114BBF86751"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "captured")
os.makedirs(OUTPUT_DIR, exist_ok=True)

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
    async with websockets.connect(WS_URL, max_size=50*1024*1024) as ws:
        # 1. Screenshot
        print("Taking screenshot...")
        result = await send_cmd(ws, "Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True})
        with open(os.path.join(OUTPUT_DIR, "screenshot.png"), "wb") as f:
            f.write(base64.b64decode(result["data"]))
        print("  -> screenshot.png saved")

        # 2. Full page HTML
        print("Getting page HTML...")
        doc = await send_cmd(ws, "DOM.getDocument", {"depth": -1})
        root_id = doc["root"]["nodeId"]
        html_result = await send_cmd(ws, "DOM.getOuterHTML", {"nodeId": root_id})
        with open(os.path.join(OUTPUT_DIR, "page.html"), "w", encoding="utf-8") as f:
            f.write(html_result["outerHTML"])
        print("  -> page.html saved")

        # 3. Get all stylesheets
        print("Getting stylesheets...")
        await send_cmd(ws, "CSS.enable")
        # Get computed styles via JS
        styles_js = """
        (() => {
            const sheets = [];
            for (const sheet of document.styleSheets) {
                try {
                    const rules = [];
                    for (const rule of sheet.cssRules) {
                        rules.push(rule.cssText);
                    }
                    sheets.push({
                        href: sheet.href,
                        rules: rules.join('\\n')
                    });
                } catch(e) {
                    sheets.push({href: sheet.href, rules: '/* cross-origin */'});
                }
            }
            return JSON.stringify(sheets);
        })()
        """
        css_result = await send_cmd(ws, "Runtime.evaluate", {"expression": styles_js, "returnByValue": True})
        css_data = json.loads(css_result["result"]["value"])
        all_css = ""
        for i, sheet in enumerate(css_data):
            all_css += f"/* === Sheet {i}: {sheet.get('href', 'inline')} === */\n"
            all_css += sheet["rules"] + "\n\n"
        with open(os.path.join(OUTPUT_DIR, "styles.css"), "w", encoding="utf-8") as f:
            f.write(all_css)
        print(f"  -> styles.css saved ({len(css_data)} sheets)")

        # 4. Get page structure info via JS
        print("Analyzing page structure...")
        structure_js = """
        (() => {
            function getStructure(el, depth) {
                if (depth > 6) return null;
                const info = {
                    tag: el.tagName,
                    id: el.id || undefined,
                    classes: el.className ? (typeof el.className === 'string' ? el.className.split(' ').filter(Boolean) : []) : [],
                    text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.childNodes[0].textContent.trim().substring(0, 100) : undefined,
                    children: []
                };
                const style = window.getComputedStyle(el);
                info.display = style.display;
                info.position = style.position;
                if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') info.bg = style.backgroundColor;
                if (el.children.length > 0) {
                    for (const child of el.children) {
                        const c = getStructure(child, depth + 1);
                        if (c) info.children.push(c);
                    }
                }
                return info;
            }
            return JSON.stringify(getStructure(document.body, 0), null, 2);
        })()
        """
        struct_result = await send_cmd(ws, "Runtime.evaluate", {"expression": structure_js, "returnByValue": True})
        with open(os.path.join(OUTPUT_DIR, "structure.json"), "w", encoding="utf-8") as f:
            f.write(struct_result["result"]["value"])
        print("  -> structure.json saved")

        # 5. Get all visible text content and layout info
        print("Getting layout info...")
        layout_js = """
        (() => {
            const sidebar = document.querySelector('.layui-side, .layui-nav-tree, [class*=sidebar], [class*=menu], nav');
            const header = document.querySelector('.layui-header, header, [class*=header]');
            const body = document.querySelector('.layui-body, .layui-main, main, [class*=content]');

            function getInfo(el, name) {
                if (!el) return {name, found: false};
                const rect = el.getBoundingClientRect();
                return {
                    name,
                    found: true,
                    tag: el.tagName,
                    classes: el.className,
                    rect: {x: rect.x, y: rect.y, w: rect.width, h: rect.height},
                    html: el.outerHTML.substring(0, 5000)
                };
            }

            return JSON.stringify({
                title: document.title,
                url: location.href,
                viewport: {w: window.innerWidth, h: window.innerHeight},
                sidebar: getInfo(sidebar, 'sidebar'),
                header: getInfo(header, 'header'),
                body: getInfo(body, 'body'),
                bodyClasses: document.body.className,
                bodyHTML: document.body.innerHTML.substring(0, 3000)
            }, null, 2);
        })()
        """
        layout_result = await send_cmd(ws, "Runtime.evaluate", {"expression": layout_js, "returnByValue": True})
        with open(os.path.join(OUTPUT_DIR, "layout.json"), "w", encoding="utf-8") as f:
            f.write(layout_result["result"]["value"])
        print("  -> layout.json saved")

        # 6. Get full body innerHTML
        print("Getting full body HTML...")
        body_js = "document.body.outerHTML"
        body_result = await send_cmd(ws, "Runtime.evaluate", {"expression": body_js, "returnByValue": True})
        with open(os.path.join(OUTPUT_DIR, "body.html"), "w", encoding="utf-8") as f:
            f.write(body_result["result"]["value"])
        print("  -> body.html saved")

        # 7. Get all links/navigation items
        print("Getting navigation...")
        nav_js = """
        (() => {
            const items = [];
            document.querySelectorAll('a, [class*=nav] li, [class*=menu] li').forEach(el => {
                const text = el.textContent.trim().substring(0, 100);
                const href = el.getAttribute('href') || '';
                if (text) items.push({text, href, tag: el.tagName, classes: el.className});
            });
            return JSON.stringify(items, null, 2);
        })()
        """
        nav_result = await send_cmd(ws, "Runtime.evaluate", {"expression": nav_js, "returnByValue": True})
        with open(os.path.join(OUTPUT_DIR, "navigation.json"), "w", encoding="utf-8") as f:
            f.write(nav_result["result"]["value"])
        print("  -> navigation.json saved")

        print("\nDone! All files saved to:", OUTPUT_DIR)

asyncio.run(main())
