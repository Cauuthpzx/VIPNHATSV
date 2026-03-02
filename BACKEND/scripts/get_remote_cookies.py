#!/usr/bin/env python3
"""Fetch agent cookies from remote server via SSH + psql."""
import subprocess
import sys
import json
import os

# Fix Windows encoding
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.190.80.159"
PORT = 43932
USER = "root"
PASS = "MXmgAn#0!l6k"
DB_USER = "agenthub"
DB_PASS = "agenthub123"
DB_NAME = "agenthub"

SQL = "SELECT name, session_cookie, cookie_expires FROM agents WHERE is_active = true ORDER BY name;"

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "remote_cookies.json")

def main():
    try:
        import paramiko
    except ImportError:
        print("Installing paramiko...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
        import paramiko

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"Connecting to {HOST}:{PORT}...")
    client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    print("Connected!")

    cmd = f'PGPASSWORD={DB_PASS} psql -U {DB_USER} -d {DB_NAME} -t -A -F "|||" -c "{SQL}"'
    stdin, stdout, stderr = client.exec_command(cmd, timeout=15)

    output = stdout.read().decode('utf-8').strip()
    errors = stderr.read().decode('utf-8').strip()

    if errors:
        print(f"Stderr: {errors}")

    if not output:
        print("No output from query!")
        client.close()
        return

    agents = []
    for line in output.split("\n"):
        line = line.strip()
        if not line:
            continue
        parts = line.split("|||")
        if len(parts) >= 3:
            agents.append({
                "name": parts[0].strip(),
                "session_cookie": parts[1].strip(),
                "cookie_expires": parts[2].strip(),
            })

    # Save to JSON file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(agents, f, ensure_ascii=False, indent=2)

    print(f"\nFound {len(agents)} agents:")
    for a in agents:
        cookie = a["session_cookie"]
        cookie_short = cookie[:50] + "..." if len(cookie) > 50 else cookie
        print(f"  {a['name']}: expires={a['cookie_expires']}, cookie={cookie_short}")

    print(f"\nSaved to {OUTPUT_FILE}")
    client.close()

if __name__ == "__main__":
    main()
