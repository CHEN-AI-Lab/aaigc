// Email sending service abstraction.
// In development, logs the code to console.
// In production, sends via Resend (requires RESEND_API_KEY env var).

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const isDev = process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY

  if (isDev) {
    console.log(`[DEV] Verification code for ${to}: ${code}`)
    return { success: true }
  }

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
        subject: 'Verify your email',
        html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Verify your email</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f5f5f5; border-radius: 8px; margin: 16px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
        </div>`,
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