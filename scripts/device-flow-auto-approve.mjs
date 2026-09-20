#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// device flow 自动放行脚本 —— **仅供本地开发与 CI 使用**
//
//   ⚠️ 绝对禁止在任何部署环境（Vercel Preview / Production、预发、线上）启用。
//      它会把「用户必须在浏览器里亲手确认设备码」这一步自动化掉；
//      放在线上等于给攻击者一个免人工确认的授权通道。
//
// 它做什么：替一个**已登录的真人账号**完成 device flow 的授权那一步，
// 好让 CLI 的 e2e 测试不必有人守着浏览器点「确认」。
//
// 它怎么做（全部走既有鉴权链路，**不改动 approve 路由的鉴权逻辑**）：
//   1. POST /api/auth/send-verification  { email, purpose: 'login' }
//        → dev 模式下（ALLOW_DEV_CODE=true）响应里带 devCode，免收邮件
//   2. POST /api/auth/token              { grantType: 'email-code', email, code, clientId }
//        → TokenPair（Bearer）。approve 路由接受 Bearer，且 Bearer 通道豁免同源校验
//   3. POST /api/auth/device/approve     { userCode } + Authorization: Bearer …
//        → { ok: true }
//
// 三重保险（任一不满足即拒绝执行）：
//   A. 必须显式设 ALLOW_DEVICE_FLOW_AUTO_APPROVE=1（不设 = 直接退出）
//   B. 目标站点必须是本机（localhost / 127.0.0.1 / ::1）—— 指向远端一律拒绝
//   C. 目标邮箱必须已注册（脚本不做注册），且该账号在本机 dev 库里
//
// 用法：
//   ALLOW_DEVICE_FLOW_AUTO_APPROVE=1 \
//     node scripts/device-flow-auto-approve.mjs <userCode> \
//       [--base-url http://localhost:3000] [--email you@example.com]
//
// 前置条件：
//   · 本机 dev server 已启动，且 .env.local 里 ALLOW_DEV_CODE=true
//   · --email 指向一个**已注册**的账号（登录用途的验证码只发给已注册邮箱）
//
// 退出码：0 放行成功 / 1 任一环节失败（原因写 stderr）/ 2 用法错误
// ─────────────────────────────────────────────────────────────────────────────

const EXIT_OK = 0
const EXIT_FAIL = 1
const EXIT_USAGE = 2

const ENABLE_FLAG = 'ALLOW_DEVICE_FLOW_AUTO_APPROVE'
const DEFAULT_BASE_URL = 'http://localhost:3000'
/** 只认本机 —— 这是防止脚本被误指向线上站点的最后一道闸 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'])

function fail(message) {
  process.stderr.write(`error: ${message}\n`)
  process.exitCode = EXIT_FAIL
}

function usage(message) {
  process.stderr.write(`error: ${message}\n`)
  process.stderr.write(
    `usage: ${ENABLE_FLAG}=1 node scripts/device-flow-auto-approve.mjs <userCode> ` +
      `[--base-url ${DEFAULT_BASE_URL}] [--email <email>]\n`,
  )
  process.exitCode = EXIT_USAGE
}

function parseArgs(argv) {
  const out = { userCode: '', baseUrl: process.env.AAIGC_E2E_BASE_URL ?? DEFAULT_BASE_URL, email: process.env.AAIGC_E2E_EMAIL ?? '' }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') return { ...out, help: true }
    if (arg === '--base-url') {
      out.baseUrl = argv[i + 1] ?? ''
      i += 1
      continue
    }
    if (arg === '--email') {
      out.email = argv[i + 1] ?? ''
      i += 1
      continue
    }
    if (arg.startsWith('--')) return { ...out, unknown: arg }
    if (out.userCode === '') {
      out.userCode = arg
      continue
    }
    return { ...out, unknown: arg }
  }
  return out
}

/** 统一的 POST：把响应体解析出来，失败时抛出带错误码的 Error */
async function postJson(url, body, extraHeaders = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  })
  let parsed = null
  try {
    parsed = await response.json()
  } catch {
    parsed = null
  }
  if (!response.ok) {
    const code = parsed && typeof parsed.error === 'string' ? parsed.error : `http${response.status}`
    const error = new Error(code)
    error.code = code
    error.body = parsed
    throw error
  }
  return parsed
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    process.stdout.write(
      [
        'device flow 自动放行（仅本地/CI）',
        '',
        `  ${ENABLE_FLAG}=1 node scripts/device-flow-auto-approve.mjs <userCode> [--base-url <url>] [--email <email>]`,
        '',
        `  --base-url   目标站点，必须是本机（默认 ${DEFAULT_BASE_URL}）`,
        '  --email      用于换取 Bearer 的已注册账号（也可用 AAIGC_E2E_EMAIL）',
        '',
      ].join('\n'),
    )
    return EXIT_OK
  }

  // 保险 A：必须显式开启
  if (process.env[ENABLE_FLAG] !== '1') {
    process.stderr.write(
      [
        `${ENABLE_FLAG} 未设为 1，脚本拒绝执行。`,
        '',
        '这是一个会跳过「人工确认设备码」的开发辅助脚本，默认关闭。',
        '⚠️ 仅限本地开发与 CI，禁止在任何部署环境启用。',
        '',
        `确认要用，请显式开启：${ENABLE_FLAG}=1 node scripts/device-flow-auto-approve.mjs <userCode>`,
        '',
      ].join('\n'),
    )
    return EXIT_FAIL
  }

  if (args.unknown !== undefined) return usage(`未知参数：${args.unknown}`)
  if (args.userCode.trim() === '') return usage('缺少 <userCode>')
  if (args.email.trim() === '') return usage('缺少 --email（或用 AAIGC_E2E_EMAIL 指定已注册账号）')

  // 保险 B：只允许本机
  let baseUrl
  try {
    baseUrl = new URL(args.baseUrl)
  } catch {
    return usage(`--base-url 不是合法 URL：${args.baseUrl}`)
  }
  if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
    return usage(`--base-url 必须是 http(s)：${args.baseUrl}`)
  }
  if (!LOCAL_HOSTS.has(baseUrl.hostname)) {
    process.stderr.write(
      [
        `拒绝执行：目标站点 ${baseUrl.origin} 不是本机。`,
        '',
        '该脚本会跳过设备码的人工确认，只允许指向 localhost / 127.0.0.1 / ::1。',
        '如需对远端环境做 e2e，请手工在浏览器里完成授权，不要用本脚本。',
        '',
      ].join('\n'),
    )
    return EXIT_FAIL
  }
  const origin = baseUrl.origin
  const email = args.email.trim()

  try {
    // 1) 取登录验证码（dev 模式下响应里直接带 devCode）
    const sent = await postJson(
      `${origin}/api/auth/send-verification`,
      { email, purpose: 'login', locale: 'en' },
      // 该路由走 isSameOrigin，必须带上与站点一致的 Origin
      { origin },
    )
    const devCode = sent && typeof sent.devCode === 'string' ? sent.devCode : ''
    if (devCode === '') {
      fail(
        '服务端未返回 devCode。请确认本机 dev server 的 .env.local 里 ALLOW_DEV_CODE=true，' +
          '且该邮箱已注册（purpose=login 只发给已注册邮箱）。',
      )
      return EXIT_FAIL
    }

    // 2) 用验证码换 Bearer TokenPair
    const pair = await postJson(`${origin}/api/auth/token`, {
      grantType: 'email-code',
      email,
      code: devCode,
      clientId: 'aaigc-device-flow-auto-approve',
    })
    const accessToken = pair && typeof pair.accessToken === 'string' ? pair.accessToken : ''
    if (accessToken === '') {
      fail('token 接口未返回 accessToken。')
      return EXIT_FAIL
    }

    // 3) 以该账号身份放行设备码（approve 路由接受 Bearer，豁免同源校验）
    await postJson(
      `${origin}/api/auth/device/approve`,
      { userCode: args.userCode.trim() },
      { authorization: `Bearer ${accessToken}` },
    )

    // stdout 只出结果，便于脚本消费
    process.stdout.write(`approved ${args.userCode.trim()} as ${email}\n`)
    return EXIT_OK
  } catch (error) {
    const code = error && typeof error.code === 'string' ? error.code : 'requestFailed'
    fail(`放行失败：${code}${code === 'emailNotRegistered' ? '（该邮箱未注册，脚本不做注册）' : ''}`)
    return EXIT_FAIL
  }
}

process.exitCode = await main()
