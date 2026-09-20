// user-agent-parser —— T1 纯计算：UA 串解析（结果以稳定 ID + i18n key 返回）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readString } from './common'

export type BrowserId = 'chrome' | 'edge' | 'firefox' | 'safari' | 'opera' | 'bot' | 'unknown'
export type OsId = 'windows' | 'macos' | 'android' | 'ios' | 'linux' | 'unknown'
export type DeviceId = 'mobile' | 'tablet' | 'desktop'

export interface UserAgentInput {
  userAgent: string
}

export interface UserAgentOutput {
  browser: BrowserId
  browserKey: string
  os: OsId
  osKey: string
  device: DeviceId
  deviceKey: string
  raw: string
}

const BROWSER_KEYS: Record<BrowserId, string> = {
  chrome: 'tools.uaChrome',
  edge: 'tools.uaEdge',
  firefox: 'tools.uaFirefox',
  safari: 'tools.uaSafari',
  opera: 'tools.uaOpera',
  bot: 'tools.uaBot',
  unknown: 'tools.uaUnknown',
}

const OS_KEYS: Record<OsId, string> = {
  windows: 'tools.uaWindows',
  macos: 'tools.uaMacos',
  android: 'tools.uaAndroid',
  ios: 'tools.uaIos',
  linux: 'tools.uaLinux',
  unknown: 'tools.uaUnknown',
}

const DEVICE_KEYS: Record<DeviceId, string> = {
  mobile: 'tools.uaMobile',
  tablet: 'tools.uaTablet',
  desktop: 'tools.uaDesktop',
}

export function detectBrowser(ua: string): BrowserId {
  if (/bot|crawler|spider|crawling/i.test(ua)) return 'bot'
  if (ua.includes('Edg/')) return 'edge'
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'opera'
  if (ua.includes('Firefox/')) return 'firefox'
  if (ua.includes('Chrome/')) return 'chrome'
  if (ua.includes('Safari/')) return 'safari'
  return 'unknown'
}

export function detectOs(ua: string): OsId {
  if (/Windows/i.test(ua)) return 'windows'
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macos'
  if (/Linux/i.test(ua)) return 'linux'
  return 'unknown'
}

export function detectDevice(ua: string, os: OsId): DeviceId {
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobi|Android/i.test(ua)) return os === 'android' || os === 'ios' ? 'mobile' : 'mobile'
  return 'desktop'
}

export function parseUserAgentParser(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<UserAgentInput> {
  const userAgent = (readString(raw, 'userAgent') ?? '').trim()
  if (userAgent.length === 0) return toolFail('emptyInput', 'tools.emptyInput')
  return toolOk({ userAgent })
}

export function runUserAgentParser(
  input: UserAgentInput,
  _ctx: ToolContext,
): ToolOutcome<UserAgentOutput> {
  const browser = detectBrowser(input.userAgent)
  const os = detectOs(input.userAgent)
  const device = detectDevice(input.userAgent, os)
  return toolOk({
    browser,
    browserKey: BROWSER_KEYS[browser],
    os,
    osKey: OS_KEYS[os],
    device,
    deviceKey: DEVICE_KEYS[device],
    raw: input.userAgent,
  })
}

export function renderUserAgentParser(out: UserAgentOutput, _ctx: ToolContext): string {
  return [`browser\t${out.browser}`, `os\t${out.os}`, `device\t${out.device}`].join('\n')
}

export const userAgentParserTool: ToolDefinition<UserAgentInput, UserAgentOutput> = {
  id: 'user-agent-parser',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'userAgent', kind: 'textarea', required: true, labelKey: 'tools.uaPlaceholder' },
  ],
  parse: parseUserAgentParser,
  run: runUserAgentParser,
  render: renderUserAgentParser,
}
