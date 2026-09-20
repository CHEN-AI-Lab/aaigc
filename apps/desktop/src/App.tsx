import { AboutView } from './views/AboutView'
import { SettingsView } from './views/SettingsView'
import { ShellView } from './views/ShellView'

/**
 * 壳 UI 有三个入口：
 *   * 无 `?view=` —— 主窗口的连接壳（探测站点 → 导航过去 / 停在「无法连接」页）
 *   * `?view=settings` / `?view=about` —— 由外壳菜单打开的本地面板窗口
 */
export function App() {
  const view = new URLSearchParams(window.location.search).get('view')

  if (view === 'settings') {
    return <SettingsView />
  }

  if (view === 'about') {
    return <AboutView />
  }

  return <ShellView />
}
