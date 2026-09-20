import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // 这里**故意**直读 env，不接 siteOrigin()：
  // 「未配置」在本文件是承重的判定条件 —— 未配置 = 直接 disallow 全部，
  // 防止 Preview / 未配置环境把 sitemap 指向生产站并被搜索引擎收录。
  // siteOrigin() 永远非空（会回落到公开站 origin），一旦接上就会吃掉这个状态。
  // 需要判断「配没配」请用 isSiteOriginConfigured()（shared/constants/domains）。
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!baseUrl) {
    // No public URL configured — disallow all crawlers
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/api/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}