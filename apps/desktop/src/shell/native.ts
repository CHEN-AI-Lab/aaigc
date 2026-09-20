import { invoke } from '@tauri-apps/api/core'

/** 外壳自带的面板窗口。 */
export type PanelView = 'settings' | 'about'

/** 外壳构建期注入的站点 origin。 */
export function getSiteOrigin(): Promise<string> {
  return invoke<string>('site_origin')
}

/** 探测站点是否可达；不可达时 reject 的是给用户看的原因。 */
export function probeSite(): Promise<void> {
  return invoke<void>('probe_site')
}

/** 用系统默认浏览器打开链接（外壳侧只放行 http / https / mailto / tel）。 */
export function openExternal(url: string): Promise<void> {
  return invoke<void>('open_external', { url })
}

/** 打开或前置一个本地面板窗口。 */
export function openPanel(view: PanelView): Promise<void> {
  return invoke<void>('open_panel', { view })
}

/**
 * 弹出原生保存对话框并写入诊断报告。
 * 返回落盘路径；用户取消时返回 null。
 */
export function exportDiagnostics(content: string): Promise<string | null> {
  return invoke<string | null>('export_diagnostics', { content })
}
