"""检查 MicrossAPI 的 SQLite 数据库初始化情况。"""

import sys
import sqlite3
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DB_PATH = r"e:\xWorkshop\micross-api\one-api.db"

if not os.path.exists(DB_PATH):
    print(f"[FAIL] 数据库文件不存在: {DB_PATH}")
    sys.exit(1)

print(f"数据库文件: {DB_PATH}")
print(f"文件大小  : {os.path.getsize(DB_PATH)} bytes")
print()

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# 1. 表清单
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print(f"=== 表总数: {len(tables)} ===")
for t in tables:
    print(f"  - {t}")
print()

# 2. 关键表行数
print("=== 关键表行数 ===")
for t in ["users", "tokens", "channels", "options", "abilities", "logs", "redemptions"]:
    if t in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        print(f"  {t:16s} = {cur.fetchone()[0]}")
    else:
        print(f"  {t:16s} = [表不存在]")
print()

# 3. users 表内容
if "users" in tables:
    cur.execute("PRAGMA table_info(users)")
    cols = [r[1] for r in cur.fetchall()]
    print(f"=== users 表字段 ({len(cols)}) ===")
    print("  " + ", ".join(cols))
    show = [c for c in ["id", "username", "display_name", "role", "status", "quota", "group"] if c in cols]
    quoted = ", ".join(f'"{c}"' for c in show)
    cur.execute(f'SELECT {quoted} FROM users')
    rows = cur.fetchall()
    print(f"=== users 数据 ({len(rows)} 行) ===")
    print("  " + " | ".join(show))
    for r in rows:
        print("  " + " | ".join(str(v) for v in r))
    print()

# 4. options 关键项
if "options" in tables:
    cur.execute("PRAGMA table_info(options)")
    ocols = [r[1] for r in cur.fetchall()]
    print(f"=== options 表字段: {ocols} ===")
    key_col = "key" if "key" in ocols else ocols[0]
    val_col = "value" if "value" in ocols else ocols[-1]
    cur.execute(f'SELECT COUNT(*) FROM options')
    print(f"options 总行数 = {cur.fetchone()[0]}")
    wanted = [
        "SystemName", "Logo", "Footer", "ServerAddress", "DocsLink",
        "PasswordLoginEnabled", "RegisterEnabled", "SelfUseModeEnabled",
        "Setup", "QuotaPerUnit", "DisplayInCurrencyEnabled",
    ]
    print()
    print("=== options 关键配置 ===")
    for k in wanted:
        cur.execute(f'SELECT "{val_col}" FROM options WHERE "{key_col}" = ?', (k,))
        row = cur.fetchone()
        if row is None:
            print(f"  {k:28s} = [未设置]")
        else:
            v = str(row[0])
            if len(v) > 120:
                v = v[:120] + "..."
            print(f"  {k:28s} = {v!r}")
    print()

conn.close()
print("检查完成。")
