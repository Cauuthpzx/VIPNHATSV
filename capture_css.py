"""
Capture EXACT CSS computed styles from every element on each page of the original site.
Measures: dimensions, padding, margin, font, color, border, background, etc.
"""
import asyncio
import json
import sys
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

CDP_HTTP = "http://127.0.0.1:9222"
SITE = "https://a2u4k.ee88dly.com/"

PAGES = [
    {"name": "user", "url": "agent/user.html"},
    {"name": "inviteList", "url": "agent/inviteList.html"},
    {"name": "reportLottery", "url": "agent/reportLottery.html"},
    {"name": "reportFunds", "url": "agent/reportFunds.html"},
    {"name": "reportThirdGame", "url": "agent/reportThirdGame.html"},
    {"name": "bankList", "url": "agent/bankList.html"},
    {"name": "depositAndWithdrawal", "url": "agent/depositAndWithdrawal.html"},
    {"name": "withdrawalsRecord", "url": "agent/withdrawalsRecord.html"},
    {"name": "withdraw", "url": "agent/withdraw.html"},
    {"name": "bet", "url": "agent/bet.html"},
    {"name": "betOrder", "url": "agent/betOrder.html"},
    {"name": "editPassword", "url": "agent/editPassword.html"},
    {"name": "editFundPassword", "url": "agent/editFundPassword.html"},
    {"name": "getRebateOddsPanel", "url": "agent/getRebateOddsPanel.html"},
]

msg_id = 0
def next_id():
    global msg_id
    msg_id += 1
    return msg_id

async def cdp_send(ws, method, params=None):
    cid = next_id()
    msg = {"id": cid, "method": method}
    if params:
        msg["params"] = params
    await ws.send(json.dumps(msg))
    return cid

async def cdp_recv(ws, cid, timeout=15):
    events = []
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=2)
            data = json.loads(raw)
            if data.get("id") == cid:
                return data, events
            events.append(data)
        except asyncio.TimeoutError:
            continue
    return None, events

async def drain(ws, dur=2):
    deadline = asyncio.get_event_loop().time() + dur
    while asyncio.get_event_loop().time() < deadline:
        try:
            await asyncio.wait_for(ws.recv(), timeout=0.3)
        except asyncio.TimeoutError:
            continue

async def js_eval(ws, expr):
    cid = await cdp_send(ws, "Runtime.evaluate", {
        "expression": expr,
        "returnByValue": True,
        "awaitPromise": True,
    })
    result, _ = await cdp_recv(ws, cid, timeout=20)
    if result and "result" in result:
        return result["result"].get("result", {}).get("value", "")
    return ""

# The big JS that extracts ALL styles from every visible element
EXTRACT_JS = r"""
(function() {
    var results = {
        pageTitle: document.title,
        bodyStyles: {},
        elements: []
    };

    // Get body computed style
    var bodyCS = window.getComputedStyle(document.body);
    results.bodyStyles = {
        backgroundColor: bodyCS.backgroundColor,
        fontFamily: bodyCS.fontFamily,
        fontSize: bodyCS.fontSize,
        color: bodyCS.color,
        margin: bodyCS.margin,
        padding: bodyCS.padding,
        width: document.body.offsetWidth,
        height: document.body.offsetHeight,
    };

    // Get ALL visible elements and their computed styles
    var allElements = document.querySelectorAll('*');
    var seen = new Set();

    for (var i = 0; i < allElements.length; i++) {
        var el = allElements[i];
        var tag = el.tagName.toLowerCase();

        // Skip script/style/meta/head tags
        if (['script','style','meta','link','head','title','br','hr','noscript'].indexOf(tag) !== -1) continue;

        var rect = el.getBoundingClientRect();
        // Skip invisible elements
        if (rect.width === 0 && rect.height === 0) continue;
        // Skip elements outside viewport (far off)
        if (rect.top > 3000 || rect.left > 3000) continue;

        var cs = window.getComputedStyle(el);

        // Build a unique selector
        var selector = tag;
        if (el.id) selector += '#' + el.id;
        if (el.className && typeof el.className === 'string') {
            var classes = el.className.trim().split(/\s+/).filter(function(c) { return c.length > 0; });
            if (classes.length > 0) selector += '.' + classes.slice(0, 3).join('.');
        }

        // Skip duplicates
        var key = selector + '|' + Math.round(rect.left) + '|' + Math.round(rect.top);
        if (seen.has(key)) continue;
        seen.add(key);

        var info = {
            tag: tag,
            selector: selector,
            id: el.id || '',
            classes: (typeof el.className === 'string') ? el.className.trim() : '',
            text: (el.childNodes.length <= 2 && el.textContent) ? el.textContent.trim().substring(0, 80) : '',
            // Position & dimensions
            rect: {
                x: Math.round(rect.left),
                y: Math.round(rect.top),
                w: Math.round(rect.width),
                h: Math.round(rect.height),
            },
            // Box model
            display: cs.display,
            position: cs.position,
            float: cs.float,
            overflow: cs.overflow,
            boxSizing: cs.boxSizing,
            // Spacing
            margin: cs.margin,
            padding: cs.padding,
            marginTop: cs.marginTop,
            marginRight: cs.marginRight,
            marginBottom: cs.marginBottom,
            marginLeft: cs.marginLeft,
            paddingTop: cs.paddingTop,
            paddingRight: cs.paddingRight,
            paddingBottom: cs.paddingBottom,
            paddingLeft: cs.paddingLeft,
            // Size
            width: cs.width,
            height: cs.height,
            minWidth: cs.minWidth,
            maxWidth: cs.maxWidth,
            minHeight: cs.minHeight,
            maxHeight: cs.maxHeight,
            lineHeight: cs.lineHeight,
            // Typography
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            color: cs.color,
            textAlign: cs.textAlign,
            textDecoration: cs.textDecoration,
            letterSpacing: cs.letterSpacing,
            whiteSpace: cs.whiteSpace,
            // Background
            backgroundColor: cs.backgroundColor,
            backgroundImage: cs.backgroundImage,
            // Border
            border: cs.border,
            borderTop: cs.borderTop,
            borderRight: cs.borderRight,
            borderBottom: cs.borderBottom,
            borderLeft: cs.borderLeft,
            borderRadius: cs.borderRadius,
            // Flex/Grid
            flexDirection: cs.flexDirection,
            justifyContent: cs.justifyContent,
            alignItems: cs.alignItems,
            flexWrap: cs.flexWrap,
            gap: cs.gap,
            // Other
            zIndex: cs.zIndex,
            opacity: cs.opacity,
            cursor: cs.cursor,
            boxShadow: cs.boxShadow,
            transition: cs.transition,
        };

        results.elements.push(info);

        // Limit to avoid huge payloads
        if (results.elements.length > 500) break;
    }

    return JSON.stringify(results);
})()
"""

# Focused extraction for key UI components
EXTRACT_LAYOUT_JS = r"""
(function() {
    var result = {};

    // Helper to get full computed style for a selector
    function getStyles(selector, label) {
        var el = document.querySelector(selector);
        if (!el) return null;
        var cs = window.getComputedStyle(el);
        var rect = el.getBoundingClientRect();
        return {
            label: label,
            selector: selector,
            rect: {x: rect.left, y: rect.top, w: rect.width, h: rect.height},
            width: cs.width, height: cs.height,
            padding: cs.padding, margin: cs.margin,
            fontSize: cs.fontSize, fontWeight: cs.fontWeight,
            fontFamily: cs.fontFamily, color: cs.color,
            backgroundColor: cs.backgroundColor,
            border: cs.border,
            borderRadius: cs.borderRadius,
            boxShadow: cs.boxShadow,
            display: cs.display, position: cs.position,
            lineHeight: cs.lineHeight,
            textAlign: cs.textAlign,
            gap: cs.gap || 'N/A',
        };
    }

    // Page title
    result.pageTitle = getStyles('.page-title, .layui-card-header, h2, h3', 'Page Title');

    // Search form area
    result.searchForm = getStyles('.layui-form, .search-form, .form-item', 'Search Form');

    // Search form inline items
    result.formInline = getStyles('.layui-form-item, .layui-inline, .form-inline, .form-item .form-inline', 'Form Inline Item');

    // Input fields
    result.input = getStyles('.layui-input, input[type="text"]', 'Input Field');

    // Select dropdowns
    result.select = getStyles('.layui-select, select', 'Select Dropdown');

    // Buttons
    result.btnSearch = getStyles('.layui-btn, .layui-btn-normal', 'Search Button');
    result.btnDefault = getStyles('.layui-btn-primary, .layui-btn[class*="primary"]', 'Default Button');

    // Table
    result.table = getStyles('.layui-table, table', 'Table');
    result.tableHeader = getStyles('.layui-table thead th, .layui-table-header th', 'Table Header Cell');
    result.tableCell = getStyles('.layui-table tbody td, .layui-table-body td', 'Table Body Cell');

    // Pagination
    result.pagination = getStyles('.layui-laypage, .layui-table-page', 'Pagination');

    // Cards
    result.card = getStyles('.layui-card, .layui-card-body', 'Card');
    result.cardBody = getStyles('.layui-card-body', 'Card Body');

    // Labels
    result.label = getStyles('.layui-form-label, label', 'Form Label');

    // Get ALL layui-input dimensions specifically
    var inputs = document.querySelectorAll('.layui-input');
    result.allInputs = [];
    for (var i = 0; i < inputs.length && i < 10; i++) {
        var cs = window.getComputedStyle(inputs[i]);
        var r = inputs[i].getBoundingClientRect();
        result.allInputs.push({
            placeholder: inputs[i].placeholder || '',
            rect: {w: r.width, h: r.height},
            width: cs.width, height: cs.height,
            padding: cs.padding, fontSize: cs.fontSize,
            border: cs.border, borderRadius: cs.borderRadius,
            backgroundColor: cs.backgroundColor,
        });
    }

    // Get ALL buttons
    var btns = document.querySelectorAll('.layui-btn');
    result.allButtons = [];
    for (var i = 0; i < btns.length && i < 10; i++) {
        var cs = window.getComputedStyle(btns[i]);
        var r = btns[i].getBoundingClientRect();
        result.allButtons.push({
            text: btns[i].textContent.trim().substring(0, 30),
            classes: btns[i].className,
            rect: {w: r.width, h: r.height},
            width: cs.width, height: cs.height,
            padding: cs.padding, fontSize: cs.fontSize,
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            border: cs.border, borderRadius: cs.borderRadius,
            lineHeight: cs.lineHeight,
        });
    }

    // Get table column widths
    var ths = document.querySelectorAll('.layui-table thead th, .layui-table-header th');
    result.tableColumns = [];
    for (var i = 0; i < ths.length; i++) {
        var cs = window.getComputedStyle(ths[i]);
        var r = ths[i].getBoundingClientRect();
        result.tableColumns.push({
            text: ths[i].textContent.trim().substring(0, 40),
            rect: {w: r.width, h: r.height},
            padding: cs.padding,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            textAlign: cs.textAlign,
            borderBottom: cs.borderBottom,
        });
    }

    return JSON.stringify(result);
})()
"""

# Also capture the main layout (sidebar, header, tabs)
EXTRACT_MAIN_LAYOUT_JS = r"""
(function() {
    var result = {};
    function gs(sel, label) {
        var el = document.querySelector(sel);
        if (!el) return null;
        var cs = window.getComputedStyle(el);
        var r = el.getBoundingClientRect();
        return {
            label: label, selector: sel,
            rect: {x: r.left, y: r.top, w: r.width, h: r.height},
            width: cs.width, height: cs.height,
            padding: cs.padding, margin: cs.margin,
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            fontSize: cs.fontSize, fontFamily: cs.fontFamily,
            fontWeight: cs.fontWeight,
            position: cs.position,
            top: cs.top, left: cs.left, right: cs.right, bottom: cs.bottom,
            zIndex: cs.zIndex,
            border: cs.border,
            boxShadow: cs.boxShadow,
            overflow: cs.overflow,
            display: cs.display,
            lineHeight: cs.lineHeight,
        };
    }

    result.body = gs('body', 'Body');
    result.layout = gs('.layui-layout, .layui-layout-admin', 'Layout');
    result.header = gs('.layui-header', 'Header');
    result.side = gs('.layui-side', 'Sidebar');
    result.sideScroll = gs('.layui-side-scroll', 'Sidebar Scroll');
    result.sideMenu = gs('.layui-nav-tree', 'Nav Tree');
    result.logo = gs('.layui-logo, .layadmin-logo', 'Logo');
    result.body_area = gs('.layui-body, .layadmin-body', 'Body Area');
    result.tabBody = gs('.layadmin-tabsbody-item, .layui-tab-content', 'Tab Body');
    result.footer = gs('.layui-footer', 'Footer');

    // Header elements
    result.headerNav = gs('.layui-header .layui-nav', 'Header Nav');
    result.headerNavLeft = gs('.layui-header .layui-nav:first-child', 'Header Nav Left');
    result.headerNavRight = gs('.layui-header .layui-nav-right, .layui-header .layui-nav:last-child', 'Header Nav Right');

    // Tab bar
    result.tabBar = gs('.layadmin-pagetabs', 'Tab Bar');
    result.tabBarUl = gs('.layadmin-pagetabs .layui-tab-title', 'Tab Bar UL');

    // Sidebar menu items
    var menuItems = document.querySelectorAll('.layui-nav-tree > .layui-nav-item');
    result.menuGroups = [];
    for (var i = 0; i < menuItems.length; i++) {
        var cs = window.getComputedStyle(menuItems[i]);
        var r = menuItems[i].getBoundingClientRect();
        var a = menuItems[i].querySelector('a');
        var aCs = a ? window.getComputedStyle(a) : null;
        result.menuGroups.push({
            text: a ? a.textContent.trim().substring(0, 30) : '',
            rect: {w: r.width, h: r.height},
            padding: cs.padding,
            fontSize: aCs ? aCs.fontSize : '',
            color: aCs ? aCs.color : '',
            lineHeight: aCs ? aCs.lineHeight : '',
            backgroundColor: cs.backgroundColor,
        });
    }

    // Sub-menu items
    var subItems = document.querySelectorAll('.layui-nav-tree dd a');
    result.subMenuItems = [];
    for (var i = 0; i < subItems.length && i < 20; i++) {
        var cs = window.getComputedStyle(subItems[i]);
        var r = subItems[i].getBoundingClientRect();
        result.subMenuItems.push({
            text: subItems[i].textContent.trim().substring(0, 30),
            rect: {w: r.width, h: r.height},
            padding: cs.padding,
            paddingLeft: cs.paddingLeft,
            fontSize: cs.fontSize,
            color: cs.color,
            lineHeight: cs.lineHeight,
            backgroundColor: window.getComputedStyle(subItems[i].closest('dd') || subItems[i]).backgroundColor,
        });
    }

    return JSON.stringify(result);
})()
"""

async def main():
    print("=== CSS Capture from Original Site ===\n")

    resp = urllib.request.urlopen(f"{CDP_HTTP}/json/list")
    tabs = json.loads(resp.read().decode())
    target = None
    for t in tabs:
        if "ee88dly" in t.get("url", ""):
            target = t
            break
    if not target:
        req = urllib.request.Request(f"{CDP_HTTP}/json/new?{SITE}", method="PUT")
        resp = urllib.request.urlopen(req)
        target = json.loads(resp.read().decode())

    ws_url = target["webSocketDebuggerUrl"]
    print(f"Tab: {target['url']}")

    all_css_data = {}

    async with websockets.connect(ws_url, max_size=100*1024*1024) as ws:
        cid = await cdp_send(ws, "Page.enable")
        await cdp_recv(ws, cid)
        cid = await cdp_send(ws, "Runtime.enable")
        await cdp_recv(ws, cid)

        # First capture main layout from the admin dashboard
        print("\n=== MAIN LAYOUT ===")
        cid = await cdp_send(ws, "Page.navigate", {"url": SITE})
        await cdp_recv(ws, cid)
        await asyncio.sleep(5)
        await drain(ws, 3)

        layout_data = await js_eval(ws, EXTRACT_MAIN_LAYOUT_JS)
        if layout_data:
            try:
                parsed = json.loads(layout_data)
                all_css_data["main_layout"] = parsed
                print(json.dumps(parsed, indent=2, ensure_ascii=False)[:5000])
            except:
                print(f"Raw: {layout_data[:2000]}")

        # Now capture each page
        for page in PAGES:
            page_url = SITE + page["url"]
            page_name = page["name"]
            print(f"\n\n=== PAGE: {page_name} ===")
            print(f"URL: {page_url}")

            cid = await cdp_send(ws, "Page.navigate", {"url": page_url})
            await cdp_recv(ws, cid)
            await asyncio.sleep(4)
            await drain(ws, 3)

            # Get focused layout data
            layout = await js_eval(ws, EXTRACT_LAYOUT_JS)
            if layout:
                try:
                    parsed = json.loads(layout)
                    all_css_data[page_name] = parsed
                    # Print key info
                    for key, val in parsed.items():
                        if isinstance(val, dict) and "rect" in val:
                            r = val["rect"]
                            print(f"  {val.get('label', key)}: {r['w']}x{r['h']} | padding={val.get('padding','')} | font={val.get('fontSize','')} {val.get('fontWeight','')} | bg={val.get('backgroundColor','')}")
                        elif isinstance(val, list):
                            print(f"  {key}: {len(val)} items")
                            for item in val[:5]:
                                r = item.get("rect", {})
                                print(f"    - {item.get('text', item.get('placeholder',''))[:30]}: {r.get('w','')}x{r.get('h','')} | padding={item.get('padding','')} | font={item.get('fontSize','')}")
                except:
                    print(f"  Parse error: {layout[:500]}")

    # Save to JSON
    output = r"c:\Users\Admin\Desktop\MAXHUB\captured\css_data.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(all_css_data, f, indent=2, ensure_ascii=False)
    print(f"\n\nSaved to: {output}")
    print(f"Pages captured: {len(all_css_data)}")

if __name__ == "__main__":
    asyncio.run(main())
