import subprocess
import os
import json
import urllib.request
import time

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chrome_profile")
CDP_PORT = 9222

os.makedirs(PROFILE_DIR, exist_ok=True)

cmd = [
    CHROME_PATH,
    f"--remote-debugging-port={CDP_PORT}",
    f"--user-data-dir={PROFILE_DIR}",
]

print(f"Profile: {PROFILE_DIR}")
print(f"CDP port: {CDP_PORT}")
print("Opening Chrome...")

process = subprocess.Popen(cmd)

time.sleep(2)

try:
    with urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/version") as resp:
        info = json.loads(resp.read())
        ws_url = info.get("webSocketDebuggerUrl", "")
        print(f"\nCDP WebSocket URL: {ws_url}")
        print(f"CDP HTTP: http://127.0.0.1:{CDP_PORT}")
except Exception:
    print(f"\nChrome is running. Try: http://127.0.0.1:{CDP_PORT}/json/version")

print(f"\nPID: {process.pid}")
