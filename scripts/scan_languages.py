"""
scan_languages.py - Scan all 3 languages from the original website using CDP.

Connects to Chrome DevTools Protocol at ws://127.0.0.1:9222,
finds the tab with "ee88dly" in the URL, switches between all 3 languages
(Vietnamese, English, Chinese), and extracts all visible UI text from:
  - Sidebar menu (groups and items)
  - Header (buttons, user menu, controls)
  - Search form labels, placeholders, select options
  - Action buttons
  - Table headers
  - Pagination text

Saves structured JSON to captured/languages_data.json
"""

import asyncio
import json
import sys
import os
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

try:
    import websockets
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
    import websockets

BASE_URL = "https://a2u4k.ee88dly.com"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "captured")
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "languages_data.json")

# Language codes used by the site's switchLang API
LANGUAGES = {
    "vi": "vi-vn",
    "en": "en",
    "zh": "zh-cn",
}

msg_id = 0
pending_events = []


async def send_cmd(ws, method, params=None):
    """Send a CDP command and wait for its response.
    Buffers any event messages received while waiting."""
    global msg_id, pending_events
    msg_id += 1
    cmd = {"id": msg_id, "method": method}
    if params:
        cmd["params"] = params
    await ws.send(json.dumps(cmd))
    target_id = msg_id
    while True:
        raw = await ws.recv()
        resp = json.loads(raw)
        if resp.get("id") == target_id:
            if "error" in resp:
                print(f"  [CDP Error] {method}: {resp['error']}")
            return resp.get("result", {})
        else:
            # Buffer event messages
            pending_events.append(resp)


async def navigate_and_wait(ws, url, wait_seconds=5):
    """Navigate to a URL and wait for the page to settle."""
    await send_cmd(ws, "Page.navigate", {"url": url})
    await asyncio.sleep(wait_seconds)


async def wait_for_element(ws, selector, timeout=20):
    """Poll until a DOM element matching the selector exists, up to timeout seconds."""
    check_js = f"!!document.querySelector('{selector}')"
    for _ in range(timeout * 2):  # Check every 0.5 seconds
        result = await send_cmd(ws, "Runtime.evaluate", {
            "expression": check_js,
            "returnByValue": True,
        })
        if result.get("result", {}).get("value") is True:
            return True
        await asyncio.sleep(0.5)
    return False


async def switch_language(ws, lang_code):
    """Switch the site language using native fetch API (no jQuery dependency)."""
    switch_js = (
        "(async function() {"
        "  try {"
        "    const resp = await fetch('/agent/switchLang?lang=" + lang_code + "', {"
        "      credentials: 'include'"
        "    });"
        "    const text = await resp.text();"
        "    if (text) {"
        "      try { return JSON.stringify(JSON.parse(text)); } catch(e) { return JSON.stringify({raw: text}); }"
        "    } else {"
        "      return JSON.stringify({status: resp.status, ok: resp.ok});"
        "    }"
        "  } catch(e) {"
        "    return JSON.stringify({error: e.message});"
        "  }"
        "})()"
    )
    result = await send_cmd(ws, "Runtime.evaluate", {
        "expression": switch_js,
        "returnByValue": True,
        "awaitPromise": True,
    })
    resp_raw = result.get("result", {}).get("value")
    if resp_raw is None:
        print(f"  WARNING: No value in evaluate result. Full result: {json.dumps(result, ensure_ascii=False)}")
        resp_raw = "{}"

    if isinstance(resp_raw, str):
        try:
            resp_data = json.loads(resp_raw)
        except (json.JSONDecodeError, TypeError):
            resp_data = {"raw": resp_raw}
    elif isinstance(resp_raw, dict):
        resp_data = resp_raw
    else:
        resp_data = {"raw": str(resp_raw)}
    print(f"  Switch API response: {json.dumps(resp_data, ensure_ascii=False)}")
    return resp_data


# ===================================================================
# JavaScript extraction functions (as raw strings to avoid escaping)
# ===================================================================

JS_EXTRACT_MAIN_PAGE = r"""
(() => {
    const data = {};

    // ========== SIDEBAR ==========
    const sidebarMenu = document.querySelector('#LAY-system-side-menu');
    data.sidebar = { menuGroups: [] };
    if (sidebarMenu) {
        const topItems = sidebarMenu.querySelectorAll(':scope > li.layui-nav-item');
        topItems.forEach(li => {
            const cite = li.querySelector(':scope > a cite');
            const groupName = cite ? cite.textContent.trim() : '';
            const icon = li.querySelector(':scope > a i.layui-icon');
            const iconClass = icon ? icon.className : '';
            const children = [];
            li.querySelectorAll('dl.layui-nav-child dd a').forEach(a => {
                children.push({
                    text: a.textContent.trim(),
                    href: a.getAttribute('lay-href') || a.getAttribute('href') || ''
                });
            });
            data.sidebar.menuGroups.push({
                groupName: groupName,
                iconClass: iconClass,
                items: children
            });
        });
    }

    // ========== HEADER ==========
    data.header = {};

    // Logo / system name
    const logo = document.querySelector('.layui-logo span');
    data.header.systemName = logo ? logo.textContent.trim() : '';

    // Left nav items (flexible, refresh, etc.)
    const leftNav = document.querySelector('.layui-layout-left');
    data.header.leftNavItems = [];
    if (leftNav) {
        leftNav.querySelectorAll('a[title]').forEach(a => {
            data.header.leftNavItems.push({
                title: a.getAttribute('title') || '',
                text: a.textContent.trim()
            });
        });
    }

    // Right nav items (fullscreen, user menu, language switch)
    const rightNav = document.querySelector('.layui-layout-right');
    data.header.rightNavItems = [];
    data.header.userMenu = [];
    data.header.languageSwitchText = '';
    if (rightNav) {
        rightNav.querySelectorAll(':scope > li').forEach(li => {
            const link = li.querySelector('a');
            if (!link) return;
            const title = link.getAttribute('title') || '';
            const event = link.getAttribute('layadmin-event') || '';
            const text = link.textContent.trim();

            if (event === 'switchLang') {
                data.header.languageSwitchText = text;
            } else if (event === 'fullscreen') {
                data.header.rightNavItems.push({ title: title, event: event });
            } else {
                // User dropdown
                const cite = link.querySelector('cite');
                if (cite) {
                    data.header.username = cite.textContent.trim();
                }
                li.querySelectorAll('dl.layui-nav-child dd a, dl.layui-nav-child dd[layadmin-event] a').forEach(ddA => {
                    const ddText = ddA.textContent.trim();
                    if (ddText) data.header.userMenu.push(ddText);
                });
                const logoutDd = li.querySelector('dd[layadmin-event="logout"] a');
                if (logoutDd) {
                    data.header.logoutText = logoutDd.textContent.trim();
                }
            }
        });
    }

    // ========== PAGE TABS ==========
    data.header.pageTabs = {};
    const tabsSelect = document.querySelector('.layadmin-tabs-select');
    if (tabsSelect) {
        tabsSelect.querySelectorAll('dd a').forEach(a => {
            const dd = a.closest('dd');
            const event = dd ? (dd.getAttribute('layadmin-event') || '') : '';
            data.header.pageTabs[event || a.textContent.trim()] = a.textContent.trim();
        });
    }

    return JSON.stringify(data, null, 2);
})()
"""

JS_EXTRACT_USER_PAGE = r"""
(() => {
    const data = {};

    // ========== FORM LEGEND / SECTION TITLE ==========
    const legend = document.querySelector('legend');
    data.pageTitle = legend ? legend.textContent.trim() : '';

    // ========== SEARCH LABELS ==========
    data.searchLabels = [];
    document.querySelectorAll('#hs-search-form-id label, .layui-form label').forEach(l => {
        const text = l.textContent.trim().replace(/[:\uff1a]\s*$/, '');
        if (text && !data.searchLabels.includes(text)) {
            data.searchLabels.push(text);
        }
    });

    // ========== PLACEHOLDERS ==========
    data.placeholders = [];
    document.querySelectorAll('input[placeholder]').forEach(inp => {
        const ph = inp.placeholder.trim();
        if (ph && ph !== '' && !data.placeholders.includes(ph)) {
            data.placeholders.push(ph);
        }
    });

    // ========== SELECT OPTIONS ==========
    data.selectOptions = {};
    document.querySelectorAll('select[name]').forEach(sel => {
        const name = sel.name;
        const opts = [];
        sel.querySelectorAll('option').forEach(o => {
            opts.push({ value: o.value, text: o.textContent.trim() });
        });
        data.selectOptions[name] = opts;
    });

    // ========== BUTTONS ==========
    data.buttons = [];
    document.querySelectorAll('button.layui-btn, a.layui-btn, .layui-btn').forEach(btn => {
        let text = '';
        btn.childNodes.forEach(n => {
            if (n.nodeType === 3) text += n.textContent;
            else if (n.tagName && n.tagName !== 'I') text += n.textContent;
        });
        text = text.trim();
        if (text && !data.buttons.includes(text)) {
            data.buttons.push(text);
        }
    });

    // ========== TABLE HEADERS ==========
    data.tableHeaders = [];
    // LayUI renders table headers in a specific div structure
    document.querySelectorAll('.layui-table-header th').forEach(th => {
        const cell = th.querySelector('.layui-table-cell');
        if (cell) {
            const span = cell.querySelector('span');
            const text = span ? span.textContent.trim() : cell.textContent.trim();
            if (text && !data.tableHeaders.includes(text)) {
                data.tableHeaders.push(text);
            }
        }
    });

    // ========== PAGINATION ==========
    data.pagination = {};
    const paginator = document.querySelector('.layui-laypage, .layui-table-page');
    if (paginator) {
        data.pagination.fullText = paginator.textContent.trim().replace(/\s+/g, ' ');

        const countEl = paginator.querySelector('.layui-laypage-count');
        if (countEl) data.pagination.totalCount = countEl.textContent.trim();

        const limitsEl = paginator.querySelector('.layui-laypage-limits select');
        if (limitsEl) {
            data.pagination.perPageOptions = [];
            limitsEl.querySelectorAll('option').forEach(o => {
                data.pagination.perPageOptions.push(o.textContent.trim());
            });
        }

        const skipEl = paginator.querySelector('.layui-laypage-skip');
        if (skipEl) {
            data.pagination.skipText = skipEl.textContent.trim();
            const btn = skipEl.querySelector('button');
            if (btn) data.pagination.goButtonText = btn.textContent.trim();
        }

        paginator.querySelectorAll('a').forEach(a => {
            const cls = a.className || '';
            const text = a.textContent.trim();
            if (cls.includes('first')) data.pagination.firstText = text;
            if (cls.includes('last')) data.pagination.lastText = text;
            if (cls.includes('prev')) data.pagination.prevText = text;
            if (cls.includes('next')) data.pagination.nextText = text;
        });
    }

    // ========== TOOLBAR BUTTONS (Add member, etc.) ==========
    data.toolbarButtons = [];
    document.querySelectorAll('.layui-table-tool-temp .layui-btn, .layui-table-tool .layui-btn').forEach(btn => {
        let text = '';
        btn.childNodes.forEach(n => {
            if (n.nodeType === 3) text += n.textContent;
            else if (n.tagName && n.tagName !== 'I') text += n.textContent;
        });
        text = text.trim();
        if (text && !data.toolbarButtons.includes(text)) {
            data.toolbarButtons.push(text);
        }
    });

    // ========== POPUP TITLES (from data attributes) ==========
    data.popupTitles = [];
    document.querySelectorAll('[pop-data]').forEach(el => {
        try {
            const raw = el.getAttribute('pop-data');
            // Handle both JSON and JS-object-like strings
            const cleaned = raw.replace(/'/g, '"');
            const popData = JSON.parse(cleaned);
            if (popData.title) data.popupTitles.push(popData.title);
        } catch(e) {}
    });

    return JSON.stringify(data, null, 2);
})()
"""

JS_EXTRACT_LANG_TEMPLATE = r"""
(async () => {
    try {
        const resp = await fetch('/agent/getLangTemp');
        const html = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const data = {};

        const label = doc.querySelector('.layui-form-label');
        data.languageLabel = label ? label.textContent.trim() : '';

        data.languageOptions = [];
        doc.querySelectorAll('input[name="lang"]').forEach(inp => {
            data.languageOptions.push({
                value: inp.value,
                title: inp.getAttribute('title') || ''
            });
        });

        const submitBtn = doc.querySelector('button[lay-submit]');
        data.switchButtonText = submitBtn ? submitBtn.textContent.trim() : '';

        return JSON.stringify(data, null, 2);
    } catch(e) {
        return JSON.stringify({error: e.message});
    }
})()
"""


async def js_eval(ws, expression, is_async=False):
    """Evaluate JS expression and return parsed JSON result."""
    params = {"expression": expression, "returnByValue": True}
    if is_async:
        params["awaitPromise"] = True
    result = await send_cmd(ws, "Runtime.evaluate", params)
    value = result.get("result", {}).get("value", "{}")
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return {"_raw": value}
    return value


async def main():
    # 1. Find the tab with "ee88dly" in the URL
    print("Finding Chrome tab with ee88dly...")
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read())

    ws_url = None
    for tab in tabs:
        if "ee88dly" in tab.get("url", ""):
            ws_url = tab["webSocketDebuggerUrl"]
            print(f"  Found tab: {tab['url']}")
            print(f"  WS URL: {ws_url}")
            break

    if not ws_url:
        print("ERROR: No tab found with 'ee88dly' in URL!")
        print("Available tabs:")
        for tab in tabs:
            print(f"  {tab.get('url', 'unknown')}")
        sys.exit(1)

    # 2. Connect to the tab
    print("\nConnecting to Chrome CDP...")
    async with websockets.connect(ws_url, max_size=100 * 1024 * 1024) as ws:
        # Enable page events
        await send_cmd(ws, "Page.enable")
        await send_cmd(ws, "Runtime.enable")

        all_languages_data = {}

        for lang_key, lang_code in LANGUAGES.items():
            print(f"\n{'='*60}")
            print(f"Processing language: {lang_key} (code: {lang_code})")
            print(f"{'='*60}")

            # Step 1: Navigate to main page first (need jQuery for API call)
            print("  [1/6] Navigating to main page...")
            await navigate_and_wait(ws, BASE_URL + "/", wait_seconds=5)

            # Step 2: Switch language via API
            print(f"  [2/6] Switching to language: {lang_code}...")
            await switch_language(ws, lang_code)

            # Step 3: Reload main page to see language change
            print("  [3/6] Reloading main page after language switch...")
            await navigate_and_wait(ws, BASE_URL + "/", wait_seconds=7)

            # Verify language actually changed
            verify_js = """
            (() => {
                const btn = document.querySelector('[layadmin-event="switchLang"]');
                const logo = document.querySelector('.layui-logo span');
                return JSON.stringify({
                    langBtn: btn ? btn.textContent.trim() : 'not found',
                    systemName: logo ? logo.textContent.trim() : 'not found'
                });
            })()
            """
            verify_data = await js_eval(ws, verify_js)
            print(f"         Verification: lang={verify_data.get('langBtn', '?')}, system={verify_data.get('systemName', '?')}")

            # Step 4: Extract main page data (sidebar, header)
            print("  [4/6] Extracting main page data (sidebar, header)...")
            main_data = await js_eval(ws, JS_EXTRACT_MAIN_PAGE)
            sidebar_count = len(main_data.get("sidebar", {}).get("menuGroups", []))
            print(f"         Found {sidebar_count} sidebar groups")

            # Step 5: Extract language template popup data
            print("  [5/6] Extracting language template data...")
            lang_template_data = await js_eval(ws, JS_EXTRACT_LANG_TEMPLATE, is_async=True)

            # Step 6: Navigate to user.html for content page data
            print("  [6/6] Navigating to /agent/user.html and extracting content...")
            await navigate_and_wait(ws, BASE_URL + "/agent/user.html", wait_seconds=3)
            # Wait for the LayUI table to render (it loads data via AJAX)
            table_ready = await wait_for_element(ws, ".layui-table-header th", timeout=20)
            if table_ready:
                print("         Table rendered, extracting data...")
            else:
                print("         WARNING: Table not detected after 20s, extracting what's available...")
            # Extra settle time for pagination to render
            await asyncio.sleep(2)
            user_data = await js_eval(ws, JS_EXTRACT_USER_PAGE)
            print(f"         Found {len(user_data.get('searchLabels', []))} search labels")
            print(f"         Found {len(user_data.get('tableHeaders', []))} table headers")
            print(f"         Found {len(user_data.get('buttons', []))} buttons")

            # Combine all data for this language
            lang_data = {
                "sidebar": main_data.get("sidebar", {}),
                "header": main_data.get("header", {}),
                "languageSwitch": lang_template_data,
                "pageTitle": user_data.get("pageTitle", ""),
                "searchLabels": user_data.get("searchLabels", []),
                "placeholders": user_data.get("placeholders", []),
                "selectOptions": user_data.get("selectOptions", {}),
                "buttons": user_data.get("buttons", []),
                "toolbarButtons": user_data.get("toolbarButtons", []),
                "popupTitles": user_data.get("popupTitles", []),
                "tableHeaders": user_data.get("tableHeaders", []),
                "pagination": user_data.get("pagination", {}),
            }
            all_languages_data[lang_key] = lang_data
            print(f"  Done with {lang_key}!")

        # Switch back to Vietnamese (original language)
        print(f"\n{'='*60}")
        print("Switching back to Vietnamese (original language)...")
        await navigate_and_wait(ws, BASE_URL + "/", wait_seconds=4)
        await switch_language(ws, "vi-vn")
        print("  Done!")

        # Save the output
        print(f"\nSaving data to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(all_languages_data, f, ensure_ascii=False, indent=2)
        print(f"  Saved successfully!")

        # Print summary
        print(f"\n{'='*60}")
        print("SUMMARY")
        print(f"{'='*60}")
        for lang_key in LANGUAGES:
            data = all_languages_data.get(lang_key, {})
            sidebar_groups = data.get("sidebar", {}).get("menuGroups", [])
            total_menu_items = sum(len(g.get("items", [])) for g in sidebar_groups)
            print(f"\n  [{lang_key}]")
            print(f"    System name: {data.get('header', {}).get('systemName', 'N/A')}")
            print(f"    Language button: {data.get('header', {}).get('languageSwitchText', 'N/A')}")
            print(f"    Sidebar groups: {len(sidebar_groups)} ({total_menu_items} total items)")
            for g in sidebar_groups:
                items_str = ", ".join(item["text"] for item in g.get("items", []))
                print(f"      - {g['groupName']}: [{items_str}]")
            print(f"    Page title: {data.get('pageTitle', 'N/A')}")
            print(f"    Search labels: {data.get('searchLabels', [])}")
            print(f"    Buttons: {data.get('buttons', [])}")
            print(f"    Toolbar buttons: {data.get('toolbarButtons', [])}")
            print(f"    Table headers: {data.get('tableHeaders', [])}")
            pagination = data.get("pagination", {})
            if pagination:
                print(f"    Pagination: skip={pagination.get('skipText','N/A')}, go={pagination.get('goButtonText','N/A')}, total={pagination.get('totalCount','N/A')}")

        print(f"\nOutput saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
