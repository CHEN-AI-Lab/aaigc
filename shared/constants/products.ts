// ─────────────────────────────────────────────────────────────────────────────
// 产品跳转地址（11 个产品）
//
// ⚠️ 历史教训（勿重蹈）：这里原本是硬编码在 data/products.ts 里的，后来被改成
//   从 PRODUCT_URL_MAP_JSON 环境变量读取。结果线上从未配置这个变量，
//   productUrlMap() 恒返回 {}，11 个产品的 url/previewUrl/productionUrl 全部为空，
//   产品详情页拿不到地址 → 用户点了没反应（真实回归 bug）。
//
// 现在改回常量：这些是固定部署地址，不随部署环境变化，没有 env 化的必要。
// 域名集中在本文件，业务代码不得重复写死（SK-8）。
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductUrlEntry {
  url?: string
  previewUrl?: string
  productionUrl?: string
}

/** 产品 id → 地址。url 为空表示只有环境专属地址（wip 产品常见）。 */
export const PRODUCT_URLS: Readonly<Record<string, ProductUrlEntry>> = {
  cookmate: {
    url: 'https://cookmate.aaigc.online',
    previewUrl: 'https://cook-pre.aaigc.online',
    productionUrl: 'https://cookmate.aaigc.online',
  },
  aihub: {
    url: 'https://aihub.aaigc.online',
    previewUrl: 'https://aihub-pre.aaigc.online',
    productionUrl: 'https://aihub.aaigc.online',
  },
  'short-drama': {
    url: '',
    previewUrl: 'https://sd-pre.aaigc.online',
    productionUrl: 'https://sd.aaigc.online',
  },
  'resume-optimizer': {
    url: '',
    previewUrl: 'https://resume-pre.aaigc.online',
    productionUrl: 'https://resume.aaigc.online',
  },
  copycraft: {
    url: '',
    previewUrl: 'https://copy-pre.aaigc.online',
    productionUrl: 'https://copy.aaigc.online',
  },
  contentforge: {
    url: '',
    previewUrl: 'https://forge-pre.aaigc.online',
    productionUrl: 'https://forge.aaigc.online',
  },
  postforge: {
    url: '',
    previewUrl: 'https://post-pre.aaigc.online',
    productionUrl: 'https://post.aaigc.online',
  },
  maestro: {
    url: '',
    previewUrl: 'https://maestro-pre.aaigc.online',
    productionUrl: 'https://maestro.aaigc.online',
  },
  'ai-portfolio-studio': {
    url: '',
    previewUrl: 'https://ai-pre.aaigc.online',
    productionUrl: 'https://ai.aaigc.online',
  },
  'ai-toolbox': {
    url: '',
    previewUrl: 'https://toolbox-pre.aaigc.online',
    productionUrl: 'https://toolbox.aaigc.online',
  },
  'content-ai-site': {
    url: '',
    previewUrl: 'https://content-pre.aaigc.online',
    productionUrl: 'https://content.aaigc.online',
  },
}
