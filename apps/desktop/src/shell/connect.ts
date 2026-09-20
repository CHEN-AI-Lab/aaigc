import { errorText } from './error-text'
import { t } from './i18n'
import { getSiteOrigin, probeSite } from './native'

export type ConnectResult =
  | { readonly ok: true; readonly origin: string }
  | { readonly ok: false; readonly detail: string }

/**
 * 连接远程站点：先确认两侧注入的站点地址一致，再探测可达性。
 *
 * 站点地址有两个构建期注入点 —— vite 给壳 UI 的 `__SITE_ORIGIN__`，
 * 和 Rust `build.rs` 给外壳的 `AAIGC_SITE_ORIGIN`。二者都来自
 * `NEXT_PUBLIC_APP_URL`，但不一致就说明两次构建用了不同的值；
 * 这种情况直接判为配置错误，而不是「随便挑一个」继续跑。
 *
 * `detail` 会显示在本地「无法连接」页上，所以文案走壳 UI 的 i18n。
 */
export async function connectToSite(): Promise<ConnectResult> {
  let shellOrigin: string

  try {
    shellOrigin = await getSiteOrigin()
  } catch (error) {
    return { ok: false, detail: t('desktop.connect.readOriginFailed', { error: errorText(error) }) }
  }

  if (shellOrigin !== __SITE_ORIGIN__) {
    return {
      ok: false,
      detail: t('desktop.connect.originMismatch', { shell: shellOrigin, ui: __SITE_ORIGIN__ }),
    }
  }

  try {
    await probeSite()
  } catch (error) {
    return { ok: false, detail: errorText(error) }
  }

  return { ok: true, origin: shellOrigin }
}
