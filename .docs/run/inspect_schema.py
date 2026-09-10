import sys
import sqlite3

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DB = r"e:\xWorkshop\micross-api\one-api.db"
conn = sqlite3.connect(DB)

tables = [
    r[0]
    for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
]
print(f"TABLE_COUNT={len(tables)}")
print()

for t in tables:
    cols = list(conn.execute(f'PRAGMA table_info("{t}")'))
    idx = list(conn.execute(f'PRAGMA index_list("{t}")'))
    try:
        cnt = list(conn.execute(f'SELECT COUNT(*) FROM "{t}"'))[0][0]
    except Exception as e:
        cnt = f"err:{e}"
    names = ", ".join(c[1] for c in cols)
    pk = ", ".join(c[1] for c in cols if c[5]) or "-"
    print(f"[{t}] rows={cnt} cols={len(cols)} pk={pk}")
    print(f"    {names}")

conn.close()
