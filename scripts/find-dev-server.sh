#!/usr/bin/env bash
# scripts/find-dev-server.sh — 自动检测当前项目的 dev server 端口
# 扫描 3000-3009 端口，找到返回 AAIGC 的那个
# 用法: PORT=$(bash scripts/find-dev-server.sh) 或 bash scripts/find-dev-server.sh 直接输出端口

PROJECT_MARKER="${1:-AAIGC}"

for port in $(seq 3000 3009); do
  fuser "$port/tcp" 2>/dev/null >/dev/null || continue
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/en" 2>/dev/null || echo "000")
  if [ "$response" = "200" ]; then
    content=$(curl -s "http://localhost:$port/en" 2>/dev/null | head -c 5000)
    if echo "$content" | grep -q "$PROJECT_MARKER"; then
      echo "$port"
      exit 0
    fi
  fi
done

echo "0"
exit 1