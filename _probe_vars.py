import os
import subprocess

def sh(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return (r.stdout or "") + (r.stderr or "")

print("=== 1. 这三个 JSON 变量到底谁在调用（真实业务代码）===")
for fn in ["productUrlMap", "nativeAppDownloadUrls", "oauthRevokeEndpoints"]:
    hits = []
    for base in ["apps", "shared"]:
        for root, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if d != "node_modules"]
            for f in files:
                if not f.endswith((".ts", ".tsx")):
                    continue
                p = os.path.join(root, f)
                try:
                    t = open(p, encoding="utf-8", errors="ignore").read()
                except Exception:
                    continue
                if fn + "(" in t:
                    hits.append(p)
    print("  %s -> %s" % (fn, hits if hits else "【无人调用】"))

print()
print("=== 2. 本机数据库凭据 ===")
print("  .env.local 存在:", os.path.exists(".env.local"))
print("  DATABASE_URL 设置:", bool(os.environ.get("DATABASE_URL")))
if os.path.exists(".env.local"):
    t = open(".env.local", encoding="utf-8", errors="ignore").read()
    print("  .env.local 含 DATABASE_URL:", "DATABASE_URL" in t)

print()
print("=== 3. 生成建表 SQL（从 migrations 历史 → 当前 schema，离线不连库）===")
out = sh("npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script")
print(out[:3000])

print()
print("=== 4. 现有 migrations ===")
print(sh("ls prisma/migrations"))
