// @vitest-environment jsdom
// BrowserCompatGate 单测（Hard Rule 1.4 旧浏览器全屏遮罩）
//
// 组件是 Server Component，输出单条内联 <script>。这里分两层测：
//   1. 渲染层 —— 脚本是否被正确内联、文案是否被安全转义
//   2. 行为层 —— 在 jsdom 里真跑脚本，模拟达标 / 不达标 / 已关闭 / storage 抛错
// 不改生产代码：从渲染产物里取脚本内容。

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import BrowserCompatGate from '@/components/BrowserCompatGate'
import type { CompatNoticeTexts } from '@/components/BrowserCompatGate'

const DISMISS_KEY = 'aaigc-compat-dismissed'

const TEXTS: CompatNoticeTexts = {
  title: '浏览器过旧',
  desc: '请升级后访问',
  reqTitle: '最低要求',
  reqIOS: 'iOS 16+',
  reqAndroid: 'Android 10+',
  reqDesktop: 'Chrome 111+',
  howTitle: '如何升级',
  how: '打开系统设置',
  details: '查看详情',
  dismiss: '我知道了',
}

/** 渲染组件并抽出内联脚本源码 */
function extractScript(texts: CompatNoticeTexts = TEXTS): string {
  const html = renderToStaticMarkup(React.createElement(BrowserCompatGate, { texts }))
  const match = html.match(/^<script>([\s\S]*)<\/script>$/)
  if (!match?.[1]) throw new Error('未渲染出内联 script: ' + html.slice(0, 120))
  return match[1]
}

/** 执行脚本（jsdom 不自动执行 innerHTML 里的 script，这里手动跑） */
function runScript(src: string): void {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(src)()
}

/** 取出遮罩节点（脚本挂在 documentElement 下，z-index 最高） */
function overlay(): HTMLElement | null {
  return document.documentElement.querySelector<HTMLElement>('div[style*="z-index:2147483647"]')
}

/** 让 CSS.supports 全部通过 / 全部不通过 */
function stubCssSupports(result: boolean): void {
  ;(window as unknown as { CSS: unknown }).CSS = { supports: vi.fn(() => result) }
}

/** 让 @layer / @property 探针实读计算值返回指定结果 */
function stubLayerProbe(layerOk: boolean, propOk: boolean): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    ((el: Element) => ({
      getPropertyValue: (name: string) => {
        if (el.id === 'cm-layer-probe') return layerOk ? 'yes' : ''
        if (el.id === 'cm-prop-probe') return propOk ? 'rgb(11, 22, 33)' : ''
        return ''
      },
    })) as unknown as typeof window.getComputedStyle,
  )
}

beforeEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
})

afterEach(() => {
  overlay()?.remove()
  document.getElementById('cm-layer-probe')?.remove()
  document.getElementById('cm-prop-probe')?.remove()
  document.querySelectorAll('style').forEach((s) => s.remove())
  delete (window as unknown as { CSS?: unknown }).CSS
  sessionStorage.clear()
})

// ─────────────────────────────────────────────────────────────────────
describe('渲染层', () => {
  it('输出单条内联 <script>', () => {
    expect(extractScript().startsWith('(function () {')).toBe(true)
  })

  it('文案以 JSON 字面量内联，4 语言 key 全部落进产物', () => {
    const src = extractScript()
    for (const value of Object.values(TEXTS)) {
      expect(src).toContain(JSON.stringify(value).slice(1, -1))
    }
  })

  it('文案里的 < 被转成 \\u003c，HTML parser 不会误判 script 结束', () => {
    const html = renderToStaticMarkup(
      React.createElement(BrowserCompatGate, {
        texts: { ...TEXTS, desc: '</script><img src=x onerror=alert(1)>' },
      }),
    )
    expect(html).not.toContain('</script><img')
    expect(html).toContain('\\u003c')
  })

  it('诊断页链接指向 /ipad-check.html 且带 noopener', () => {
    const src = extractScript()
    expect(src).toContain('"/ipad-check.html"')
    expect(src).toContain('"noopener"')
  })

  it('零 Tailwind 类名 —— 出现 Tailwind 失效则提示自己也失效', () => {
    // 脚本里所有样式都走 setAttribute('style', ...)，不应出现 class=" 赋值
    expect(extractScript()).not.toMatch(/class="[^"]*(flex|grid|text-|bg-|p-\d)/)
  })
})

// ─────────────────────────────────────────────────────────────────────
describe('行为层：不达标浏览器应显示遮罩', () => {
  it('无 CSS.supports（远古浏览器）→ 判死并显示遮罩', () => {
    delete (window as unknown as { CSS?: unknown }).CSS
    runScript(extractScript())
    expect(overlay()).not.toBeNull()
  })

  it('color-mix 不支持 → 判死（最廉价的一关先打）', () => {
    stubCssSupports(false)
    runScript(extractScript())
    expect(overlay()).not.toBeNull()
  })

  it('color-mix 通过但 @layer 探针失败 → 仍判死', () => {
    stubCssSupports(true)
    stubLayerProbe(false, true)
    runScript(extractScript())
    expect(overlay()).not.toBeNull()
  })

  it('@layer 通过但 @property 探针失败 → 仍判死', () => {
    stubCssSupports(true)
    stubLayerProbe(true, false)
    runScript(extractScript())
    expect(overlay()).not.toBeNull()
  })

  it('遮罩挂在 documentElement 上（body 未就绪也能显示，不打断 hydration）', () => {
    stubCssSupports(false)
    runScript(extractScript())
    expect(overlay()?.parentElement).toBe(document.documentElement)
  })

  it('遮罩内含标题与关键要求文案', () => {
    stubCssSupports(false)
    runScript(extractScript())
    const text = overlay()?.textContent ?? ''
    expect(text).toContain(TEXTS.title)
    expect(text).toContain(TEXTS.reqAndroid)
    expect(text).toContain(TEXTS.dismiss)
  })

  it('探针元素用完即清理，不污染 DOM', () => {
    stubCssSupports(true)
    stubLayerProbe(true, true)
    runScript(extractScript())
    expect(document.getElementById('cm-layer-probe')).toBeNull()
    expect(document.getElementById('cm-prop-probe')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────
describe('行为层：达标浏览器必须零 DOM 变动', () => {
  beforeEach(() => {
    stubCssSupports(true)
    stubLayerProbe(true, true)
  })

  it('四道关全过 → 不显示遮罩', () => {
    runScript(extractScript())
    expect(overlay()).toBeNull()
  })

  it('达标时不读写 sessionStorage（不闪的关键）', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    runScript(extractScript())
    expect(spy).not.toHaveBeenCalled()
    expect(overlay()).toBeNull()
  })

  it('达标时 documentElement 无新增子节点', () => {
    const before = document.documentElement.childNodes.length
    runScript(extractScript())
    expect(document.documentElement.childNodes.length).toBe(before)
  })
})

// ─────────────────────────────────────────────────────────────────────
describe('行为层：用户已关闭过', () => {
  it('sessionStorage 记着已关闭 → 不再显示', () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    stubCssSupports(false)
    runScript(extractScript())
    expect(overlay()).toBeNull()
  })

  it('点「我知道了」→ 写 sessionStorage 并移除遮罩', () => {
    stubCssSupports(false)
    runScript(extractScript())
    const button = overlay()?.querySelector('button')
    expect(button).not.toBeNull()
    button?.click()
    expect(overlay()).toBeNull()
    expect(sessionStorage.getItem(DISMISS_KEY)).toBe('1')
  })

  it('点击后再次执行脚本 → 保持关闭', () => {
    stubCssSupports(false)
    runScript(extractScript())
    overlay()?.querySelector('button')?.click()
    runScript(extractScript())
    expect(overlay()).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────
describe('行为层：sessionStorage 不可用时兜底', () => {
  it('读取抛错 → 不崩，仍显示遮罩', () => {
    stubCssSupports(false)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage disabled')
    })
    expect(() => runScript(extractScript())).not.toThrow()
    expect(overlay()).not.toBeNull()
  })

  it('写入抛错（点关闭）→ 不崩，遮罩仍被移除', () => {
    stubCssSupports(false)
    runScript(extractScript())
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const button = overlay()?.querySelector('button')
    expect(() => button?.click()).not.toThrow()
    expect(overlay()).toBeNull()
  })
})
