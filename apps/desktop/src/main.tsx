import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { syncNativeLocale, t } from './shell/i18n'
import './styles.css'

const container = document.getElementById('root')

if (container === null) {
  throw new Error(t('desktop.boot.mountMissing'))
}

// 先把系统语言同步给外壳（原生菜单 / 托盘 / 窗口标题），再渲染壳 UI。
syncNativeLocale()

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
