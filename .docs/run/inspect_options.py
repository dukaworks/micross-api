import sys
import sqlite3

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DB = r"e:\xWorkshop\micross-api\one-api.db"
conn = sqlite3.connect(DB)

print("=== options 全部内容 ===")
for r in conn.execute('SELECT "key", "value" FROM options'):
    v = str(r[1])
    if len(v) > 200:
        v = v[:200] + "..."
    print(f"  {r[0]!r} = {v!r}")

print()
print("=== setups 全部内容 ===")
cols = [c[1] for c in conn.execute("PRAGMA table_info(setups)")]
print("  字段:", cols)
for r in conn.execute("SELECT * FROM setups"):
    print("  ", r)

print()
print("=== system_instances 行数 ===")
print("  ", list(conn.execute("SELECT COUNT(*) FROM system_instances"))[0][0])

conn.close()
