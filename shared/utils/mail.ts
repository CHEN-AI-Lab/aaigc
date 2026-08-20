// Email sending service abstraction.
// In development, returns the code in the response (no email sent).
// In production, sends via Resend (requires RESEND_API_KEY env var).
// Never logs verification codes to console or log files.

import { VERIFICATION_CODE_TTL } from './verification'

/**
 * Email translation helper: zh-* locales get Chinese, everything else gets English.
 * This matches the product requirement: "中文发中文，其他国家发英文".
 */
function emailT(locale: string | undefined, zh: string, en: string): string {
  return locale?.startsWith('zh') ? zh : en
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  locale: string = 'en',
  purpose: string = 'verify'
): Promise<{ success: boolean; error?: string; devCode?: string }> {
  // devCode 仅在显式启用且非部署环境时返回。
  // 防止误配置 NODE_ENV=development 导致生产环境泄露验证码。
  const allowDevCode = process.env.ALLOW_DEV_CODE === 'true' && !process.env.VERCEL_ENV

  if (allowDevCode) {
    // Dev mode: don't log the code anywhere, return it in the response
    // so the frontend can display it for testing
    return { success: true, devCode: code }
  }

  if (!process.env.RESEND_API_KEY) {
    // Production without Resend key — fail loudly instead of silently pretending to send
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  const expireMinutes = Math.floor(VERIFICATION_CODE_TTL / 60000)

  // 按 purpose 定制邮件内容
  let subject: string
  let title: string
  let desc: string
  let expireWarning: string

  if (purpose === 'deleteAccount') {
    subject = emailT(locale, 'AAIGC 账号删除确认验证码', 'AAIGC account deletion confirmation')
    title = emailT(locale, '确认删除账号', 'Confirm account deletion')
    desc = emailT(locale, '您正在申请删除 AAIGC 账号。验证码是：', 'You are requesting to delete your AAIGC account. Enter the code below:')
    expireWarning = emailT(locale, `验证码 ${expireMinutes} 分钟内有效。如非本人操作，请忽略此邮件。`, `This code expires in ${expireMinutes} minutes. If you did not request this, please ignore this email.`)
  } else {
    subject = emailT(locale, 'AAIGC 验证码', 'AAIGC verification code')
    title = emailT(locale, '验证您的邮箱', 'Verify your email')
    desc = emailT(locale, '请输入以下验证码完成验证：', 'Enter the code below to verify your email:')
    expireWarning = emailT(locale, `验证码 ${expireMinutes} 分钟内有效，请勿泄露给他人。`, `This code expires in ${expireMinutes} minutes. Do not share it with anyone.`)
  }

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f4f4;padding:24px">
  <div style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#fa520f,#ffa110);padding:24px;text-align:center">
      <div style="font-size:40px;line-height:1">⚡</div>
      <div style="color:#ffffff;font-size:24px;font-weight:700;margin-top:8px">AAIGC</div>
    </div>
    <div style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:20px;color:#1f1f1f">${title}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#767d88">${desc}</p>
      <div style="font-size:36px;font-weight:700;color:#fa520f;letter-spacing:8px;text-align:center;padding:16px;background:#fff0c2;border-radius:12px;margin:0 0 24px;font-family:monospace">
        ${code}
      </div>
      <p style="margin:0;font-size:13px;color:#767d88">${expireWarning}</p>
    </div>
  </div>
</div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'AAIGC <noreply@aaigc.online>',
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: `Failed to send email: ${err}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: `Failed to send email: ${err}` }
  }
}