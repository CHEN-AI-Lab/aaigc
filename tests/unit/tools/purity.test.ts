// 纯度门禁：机械保证「纯计算逻辑 100% 在 shared/ 且可脱离 DOM 运行」（G4）
//
// 命中下列任一模式即失败：
//   · 浏览器/平台全局：window document navigator Blob File canvas localStorage
//   · 运行时 IO：require( / node:fs / fetch(
//   · 不可测的时间与随机源：Date.now / new Date() / Math.random
//
// 例外：`context.ts` 是 ToolContext 的唯一注入点（createToolContext 默认实现），
// 它必须读取平台时钟与 CSPRNG —— 这正是「时间与随机由端侧注入」的入口本身，
// 不是工具逻辑，因此单独豁免并单独断言其豁免范围。

import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const TOOLS_DIR = path.resolve(__dirname, '../../../shared/tools')

/** 允许出现平台时钟/随机源的注入点文件（白名单，禁止扩大） */
const INJECTION_POINT_FILES: readonly string[] = ['context.ts']

const BANNED_PATTERNS: readonly { name: string; pattern: RegExp }[] = [
  { name: 'window', pattern: /\bwindow\b/ },
  { name: 'document', pattern: /\bdocument\b/ },
  { name: 'navigator', pattern: /\bnavigator\b/ },
  { name: 'Blob', pattern: /\bBlob\b/ },
  { name: 'File', pattern: /\bFile\b/ },
  { name: 'canvas', pattern: /\bcanvas\b/ },
  { name: 'localStorage', pattern: /\blocalStorage\b/ },
  { name: 'sessionStorage', pattern: /\bsessionStorage\b/ },
  { name: 'require(', pattern: /\brequire\s*\(/ },
  { name: 'node:fs', pattern: /['"]node:fs['"]/ },
  { name: 'fetch(', pattern: /\bfetch\s*\(/ },
  { name: 'Date.now', pattern: /\bDate\.now\b/ },
  { name: 'new Date()', pattern: /new\s+Date\s*\(\s*\)/ },
  { name: 'Math.random', pattern: /\bMath\.random\b/ },
]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => path.join(dir, entry.name))
}

/** 去掉注释与字符串字面量，避免文档/示例文本误报 */
function stripCommentsAndStrings(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
}

describe('shared/tools purity gate', () => {
  const files = sourceFiles(TOOLS_DIR).sort()

  it('should scan every tool module', () => {
    // 38 个工具 + common.ts + registry.ts + index.ts
    expect(files.length).toBeGreaterThanOrEqual(41)
  })

  for (const file of files) {
    const name = path.basename(file)
    it(`${name} contains no platform or non-deterministic APIs`, () => {
      const raw = readFileSync(file, 'utf8')
      const code = stripCommentsAndStrings(raw)
      const patterns = INJECTION_POINT_FILES.includes(name)
        ? BANNED_PATTERNS.filter(
            (entry) => entry.name !== 'Date.now' && entry.name !== 'new Date()' && entry.name !== 'Math.random',
          )
        : BANNED_PATTERNS
      const hits = patterns.filter((entry) => entry.pattern.test(code)).map((entry) => entry.name)
      expect(hits, `${name} 命中禁用模式: ${hits.join(', ')}`).toEqual([])
    })
  }

  it('the injection point file is the only place allowed to read the platform clock', () => {
    for (const name of INJECTION_POINT_FILES) {
      const code = stripCommentsAndStrings(readFileSync(path.join(TOOLS_DIR, name), 'utf8'))
      // 只允许默认实现读时钟；随机必须走 CSPRNG，绝不能退化成 Math.random
      expect(code).toMatch(/Date\.now/)
      expect(code).not.toMatch(/Math\.random/)
    }
    for (const file of files) {
      const name = path.basename(file)
      if (INJECTION_POINT_FILES.includes(name)) continue
      const code = stripCommentsAndStrings(readFileSync(file, 'utf8'))
      expect(code, name).not.toMatch(/\bDate\.now\b/)
      expect(code, name).not.toMatch(/\bMath\.random\b/)
    }
  })

  it('no tool module imports node builtins', () => {
    for (const file of files) {
      const code = stripCommentsAndStrings(readFileSync(file, 'utf8'))
      expect(code).not.toMatch(/from\s+['"]node:/)
      expect(code).not.toMatch(/import\s+['"]node:/)
    }
  })
})
