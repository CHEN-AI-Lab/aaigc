// web URL helper —— 拼出 web 工具页 / 产品页的完整 URL
//
// 规则（与 web 端路由对齐）：
//   /[locale]/tools/[toolId]
//   /[locale]/products/[productId]
//
// ⚠️ 必须从 shared/constants/domains 读 PUBLIC_SITE_ORIGIN，
//    **不**允许硬编码域名（SK-8 铁律）。
//    这里在 ArkTS 里**没有** process.env 概念 —— 用 build hook 注入。
//    当前骨架用 readDomain() 函数占位：返回 '' 表明"未注入"，调用方应该明确处理。

import type { Locale } from 'shared/types'
import { PUBLIC_SITE_ORIGIN } from 'shared/constants/domains'

/** 拼工具页 URL */
export function toolUrl(toolId: string, locale: Locale): string {
  return `${PUBLIC_SITE_ORIGIN}/${locale}/tools/${toolId}`
}

/** 拼产品页 URL */
export function productUrl(productId: string, locale: Locale): string {
  return `${PUBLIC_SITE_ORIGIN}/${locale}/products/${productId}`
}

/** 检查 URL 是否能生成（域名是否已注入） */
export function isWebConfigured(): boolean {
  return PUBLIC_SITE_ORIGIN.length > 0
}