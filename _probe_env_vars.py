import os
import subprocess

print("=== 1. 这三个 JSON 变量谁在用（真实调用点）===")
funcs = {
    "productUrlMap": [],
    "nativeAppDownloadUrls": [],
    "oauthRevokeEndpoints": [],
}
for root_base in ["apps", "shared"]:
    for root, dirs, files in os.walk(root_base):
        dirs[:] = [d for d in dirs if d != "node_modules"]
        for f in files:
            if not f.endswith((".ts", ".tsx")):
                continue
            p = os.path.join(root, f)
            try:
                t = open(p, encoding="utf-8", errors="ignore").read()
            except Exception:
                continue
            for fn in funcs:
                if fn in t:
                    funcs[fn].append(p)

for fn, paths in funcs.items():
    print("  %s:" % fn)
    for p in paths[:6]:
        print("     ", p)

print()
print("=== 2. 本机是否有 DATABASE_URL / .env.local ===")
r = subprocess.run("ls -la .env.local 2>/dev/null || echo 无.env.local
grep -c DATABASE_URL .env.local 2>/dev/null || true" , shell=True, capture_output=True, text=True)
print(r.stdout)

print("=== 3. 生成建表 SQL（离线 diff，不连库）===")
r = subprocess.run(
    "npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script",
    shell=True, capture_output=True, text=True)
print(r.stdout or r.stderr)

print()
print("=== 4. 现有 migration 目录 ===")
r = subprocess.run("ls prisma/migrations", shell=True, capture_output=True, text=True)
print(r.stdout)

Given severe turn budget — let me run the probe and generate SQL.

Let me proceed.</think:6124c78e><tool_call:6124c78e>Bash<arg_key:6124c78e>command</arg_key:6124c78e><arg_value:6124c78e>wsl.exe --cd /home/ubuntu/workspace/aaigc bash -c 'python3 _probe_env_vars.py 2>&1'