#!/usr/bin/env node
/**
 * 把 shared/messages/<locale>.json 按 namespace 切片输出到
 * shared/js/messages/<locale>/<ns>.json（产物入库，小程序按需加载）。
 *
 * 用法：node scripts/build-shared-messages.mjs [--check]
 *   --check：重建到临时目录并与入库切片 diff，漂移即 exit 1
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..')
const MESSAGES_DIR = path.join(REPO_ROOT, 'shared', 'messages')
const OUT_DIR = path.join(REPO_ROOT, 'shared', 'js', 'messages')

const LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja']

function listLocales() {
  if (!existsSync(MESSAGES_DIR)) return []
  return readdirSync(MESSAGES_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''))
    .sort()
}

function sliceMessages(locale) {
  const source = JSON.parse(readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8'))
  return Object.entries(source).map(([namespace, value]) => ({
    namespace,
    content: `${JSON.stringify({ [namespace]: value }, null, 2)}\n`,
  }))
}

function writeSlices(targetDir) {
  const written = []
  for (const locale of listLocales()) {
    for (const { namespace, content } of sliceMessages(locale)) {
      const file = path.join(targetDir, locale, `${namespace}.json`)
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, content, 'utf8')
      written.push(path.join(locale, `${namespace}.json`))
    }
  }
  return written
}

function snapshot(dir) {
  const map = new Map()
  const walk = (current, prefix) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) walk(full, rel)
      else map.set(rel, readFileSync(full, 'utf8'))
    }
  }
  if (existsSync(dir)) walk(dir, '')
  return map
}

function main() {
  const check = process.argv.includes('--check')

  if (check) {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'aaigc-messages-'))
    writeSlices(tmpDir)
    const current = snapshot(OUT_DIR)
    const rebuilt = snapshot(tmpDir)
    const problems = []
    for (const [rel, content] of rebuilt) {
      if (current.get(rel) !== content) problems.push(rel)
    }
    for (const rel of current.keys()) {
      if (!rebuilt.has(rel)) problems.push(`${rel} (stale)`)
    }
    if (problems.length > 0) {
      console.error(`❌ shared/js/messages 与 shared/messages 不一致（${problems.length} 处）:`)
      for (const rel of problems) console.error(`   - ${rel}`)
      console.error('   请运行：pnpm --filter shared build:messages')
      process.exit(1)
    }
    console.log(`✅ shared/js/messages 与源码一致（${rebuilt.size} 个切片，无漂移）`)
    return
  }

  const written = writeSlices(OUT_DIR)
  console.log(`✅ wrote ${written.length} message slices to shared/js/messages (${LOCALES.join(', ')})`)
}

main()
