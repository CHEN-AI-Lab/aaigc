import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'

import { t } from './i18n'

/**
 * 发一条系统通知。
 *
 * 权限只在前端显式申请，且 capabilities 里也只放开了
 * `notification:allow-notify` / `allow-is-permission-granted` /
 * `allow-request-permission` 三条，插件其余能力（频道、监听、批量……）都没开。
 */
export async function notify(title: string, body: string): Promise<void> {
  let granted = await isPermissionGranted()

  if (!granted) {
    granted = (await requestPermission()) === 'granted'
  }

  if (!granted) {
    throw new Error(t('desktop.notify.permissionDenied'))
  }

  sendNotification({ title, body })
}
