// Email sending service abstraction.
// In development, logs the code to console.
// In production, sends via Resend (requires RESEND_API_KEY env var).

import { t } from 'shared/i18n'

export async function sendVerificationEmail(
  to: string,
  code: string,
  locale: string = 'zh-CN'
): Promise<{ success: boolean; error?: string }> {
  const isDev = process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY

  if (isDev) {
    console.log(`[DEV] Verification code for ${to}: ${code}`)
    return { success: true }
  }

  const subject = t(locale, 'AAIGC 验证码', 'AAIGC verification code')
  const title = t(locale, '验证您的邮箱', 'Verify your email')
  const desc = t(locale, '请输入以下验证码完成验证：', 'Enter the code below to verify your email:')
  const expireWarning = t(locale, '验证码 10 分钟内有效，请勿泄露给他人。', 'This code expires in 10 minutes. Do not share it with anyone.')

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
        from: 'AAIGC <noreply@aaigc.online>',
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