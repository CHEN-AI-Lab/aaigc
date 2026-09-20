import io
import os
import re

DIST = "apps/weapp/dist"
SRC = "shared/tools/base64.ts"

# shared/tools/base64.ts 里导出的函数名
names = []
with io.open(SRC, encoding="utf-8") as f:
    for line in f:
        m = re.search(r"export\s+(?:function|const)\s+([A-Za-z0-9_]+)", line)
        if m:
            names.append(m.group(1))

print("shared/tools/base64.ts 导出:", names)

# 收集 dist 下所有 js 文本
blob_parts = []
for dirpath, _, filenames in os.walk(DIST):
    for n in filenames:
        if n.endswith(".js"):
            p = os.path.join(dirpath, n)
            try:
                blob_parts.append(io.open(p, encoding="utf-8", errors="ignore").read())
            except Exception:
                pass
blob = "\n".join(blob_parts)
print("dist js 总体积:", len(blob), "字符")

print()
print("=== 函数名命中（webpack 会改名，所以再看逻辑特征） ===")
for n in names:
    print("  %-20s %s" % (n, "命中" if n in blob else "未命中"))

print()
print("=== 逻辑特征串命中（这些来自 shared/tools/base64.ts 的实现细节） ===")
with io.open(SRC, encoding="utf-8") as f:
    src_text = f.read()
# 取源码里若干较长的字符串常量作为指纹
fingerprints = re.findall(r"'([^'\n]{12,60})'|\"([^\"\n]{12,60})\"", src_text)
flat = [a or b for a, b in fingerprints]
seen = set()
for s in flat:
    if s in seen:
        continue
    seen.add(s)
    if s in blob:
        print("  ✅ 命中特征串: %r" % s)

print()
print("=== 是否残留对 shared 的外部引用（有则说明没内联） ===")
ext = re.findall(r"require\(\s*['\"]([^'\"]*shared[^'\"]*)['\"]", blob)
if ext:
    for e in sorted(set(ext))[:10]:
        print("  ⚠️ 外部引用:", e)
else:
    print("  无 require('shared...') 残留 → 已内联进产物")

print()
print("=== dist 文件清单 ===")
for dirpath, _, filenames in os.walk(DIST):
    for n in sorted(filenames):
        p = os.path.join(dirpath, n)
        print("  %8d  %s" % (os.path.getsize(p), p))
