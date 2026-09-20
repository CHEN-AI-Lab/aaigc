# shared/i18n

> ⚠️ 本目录**不再提供** `t(locale, zh, en)` 两语 helper（已在 T02 收尾时删除）。
>
> 删除原因：它只有 `en` / 非 `en` 两个分支，**日语（ja）会静默拿到中文文案**，zh-TW 也没有独立分支——
> 属于「不报错、但用户看到的语种是错的」的静默故障，最难排查。删除时全仓 0 调用点，
> 留着只会让下一个人以为有现成的 `t()` 可用，从而把故障复制一遍。

## 跨端文案一律走 `shared/messages`

- **唯一真源**：`shared/messages/{en,zh-CN,zh-TW,ja}.json`
- 4 语种齐备，由 `python3 scripts/check-translations.py --strict` 强制 key 对齐
- **不要再造两语 / 三语 helper**。需要新文案就往 `shared/messages` 加 key，4 语种同步补
  （错误码即 key：见 `shared/constants/error-codes.ts`，`ApiErrorCode` 必须命中 `errors.*`）
- Web：客户端 `useTranslations('namespace')`；服务端 `getTranslations({ locale, namespace })`
- CLI / 桌面端等非 React 端：直接按 locale 读取 `shared/messages/<locale>.json`，
  不要自己攒一份 `*-strings.ts`——那会让 `shared/messages` 不再是唯一真源

## 目录为什么还在

`scripts/check-structure.sh` 的 Check 2 要求 `shared/i18n` 目录必须存在。
**删文件可以，不要删目录**（空目录在 git 里不入库，所以保留本说明文件占位）。
