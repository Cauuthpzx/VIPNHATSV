"""
Export essential data (roles, users, agents with cookies) from local DB to remote server.
"""
import psycopg2
import paramiko
import json
import sys
import os
from datetime import datetime, date
from decimal import Decimal

os.environ["PYTHONIOENCODING"] = "utf-8"
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

LOCAL_DB = {
    "host": "localhost", "port": 5432,
    "dbname": "fastify_skeleton", "user": "postgres", "password": "hiepmun2021",
}
SSH_HOST = "160.25.77.94"
SSH_PORT = 58687
SSH_USER = "root"
SSH_PASSWORD = "Nhattruong070219@"

# Only essential tables
TABLES = ["roles", "users", "agents"]

def get_column_types(cur, table):
    cur.execute("""
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position
    """, (table,))
    return {row[0]: (row[1], row[2]) for row in cur.fetchall()}

def escape_val(val, data_type, udt_name):
    if val is None:
        return "NULL"
    if udt_name == 'bool':
        return "TRUE" if val else "FALSE"
    if udt_name in ('int2', 'int4', 'int8', 'float4', 'float8', 'numeric'):
        return str(val)
    if data_type == 'ARRAY' and udt_name == '_text':
        if isinstance(val, list):
            items = ", ".join([f"'{str(v).replace(chr(39), chr(39)+chr(39))}'" for v in val])
            return f"ARRAY[{items}]::text[]"
        s = str(val).replace("'", "''")
        return f"'{s}'"
    if udt_name in ('jsonb', 'json'):
        if isinstance(val, (dict, list)):
            s = json.dumps(val, ensure_ascii=False, default=str).replace("'", "''")
        else:
            s = str(val).replace("'", "''")
        return f"'{s}'::jsonb"
    if udt_name in ('timestamp', 'timestamptz'):
        if isinstance(val, (datetime, date)):
            return f"'{val.isoformat()}'"
        return f"'{str(val)}'"
    if isinstance(val, Decimal):
        return str(val)
    s = str(val).replace("'", "''")
    return f"'{s}'"

def main():
    print("=== Exporting essential data (roles, users, agents) ===")
    conn = psycopg2.connect(**LOCAL_DB)
    cur = conn.cursor()

    all_sql = []
    for table in reversed(TABLES):
        all_sql.append(f'DELETE FROM "{table}" CASCADE;')
    all_sql.append("")

    for table in TABLES:
        col_types = get_column_types(cur, table)
        cur.execute(f'SELECT * FROM "{table}"')
        cols = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        print(f"  {table}: {len(rows)} rows")

        all_sql.append(f"-- {table}: {len(rows)} rows")
        for row in rows:
            vals = []
            for i, col in enumerate(cols):
                dt, udt = col_types.get(col, ("text", "text"))
                vals.append(escape_val(row[i], dt, udt))
            cols_str = ", ".join([f'"{c}"' for c in cols])
            vals_str = ", ".join(vals)
            all_sql.append(f'INSERT INTO "{table}" ({cols_str}) VALUES ({vals_str});')
        all_sql.append("")

    cur.close()
    conn.close()

    sql = "\n".join(all_sql)
    print(f"\nSQL size: {len(sql)} bytes")

    # Upload and execute
    print("\n=== Uploading to server ===")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASSWORD, timeout=15)

    sftp = client.open_sftp()
    with sftp.file("/tmp/db_restore.sql", "w") as f:
        f.write(sql)
    sftp.close()
    print(f"Uploaded {len(sql)} bytes")

    print("Executing SQL...")
    cmd = f'PGPASSWORD=hiepmun2021 psql -h localhost -U postgres -d fastify_skeleton -f /tmp/db_restore.sql 2>&1'
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode(errors='replace').strip()
    if out: print(out)

    # Verify
    verify = 'PGPASSWORD=hiepmun2021 psql -h localhost -U postgres -d fastify_skeleton -c "SELECT name, session_cookie IS NOT NULL as has_cookie, is_active FROM agents ORDER BY name;"'
    stdin2, stdout2, _ = client.exec_command(verify, timeout=15)
    print("\n--- Agents on server ---")
    print(stdout2.read().decode(errors='replace').strip())

    client.exec_command("rm /tmp/db_restore.sql")
    client.close()
    print("\nDone!")

if __name__ == "__main__":
    main()
