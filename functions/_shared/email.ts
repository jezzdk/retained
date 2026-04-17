interface SendEmailParams {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

        <!-- Header -->
        <tr><td style="background:#4f46e5;border-radius:12px 12px 0 0;padding:24px 32px">
          <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px">Retained</span>
          <span style="color:#a5b4fc;font-size:14px;margin-left:8px">· spaced retrieval learning</span>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:36px 32px;color:#111827">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#fff;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 32px">
          <p style="margin:0;color:#9ca3af;font-size:12px">You're receiving this because you used Retained. If this wasn't you, you can safely ignore this email.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function otpEmailHtml(code: string): string {
  return emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827">Verify your email</h1>
    <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6">Enter this code to sign in to Retained. It expires in 10 minutes.</p>
    <div style="background:#f4f4f5;border-radius:10px;padding:28px;text-align:center;margin-bottom:28px">
      <span style="font-size:44px;font-weight:700;letter-spacing:14px;font-family:monospace;color:#111827">${code}</span>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:13px">Didn't request this? No action needed — just ignore this email.</p>
  `);
}

export function otpEmailText(code: string): string {
  return `Your Retained verification code: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.`;
}

export function studyReminderHtml(
  articleUrl: string,
  articleDomain: string,
  studiedUrl: string
): string {
  return emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827">Time to read</h1>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6">
      Your pre-test primed your brain — now it's time to read. You'll absorb the material more deeply because you already know what to look for.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      <tr><td style="background:#f4f4f5;border-radius:8px;padding:14px 18px">
        <a href="${articleUrl}" style="color:#4f46e5;font-weight:600;font-size:15px;text-decoration:none">↗ ${articleDomain}</a>
      </td></tr>
    </table>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">When you're done reading, click below to schedule your final test.</p>
    <a href="${studiedUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
      I've finished reading →
    </a>
  `);
}

export function studyReminderText(articleUrl: string, studiedUrl: string): string {
  return `Time to read\n\nYour pre-test primed your brain — now it's time to read the article.\n\n${articleUrl}\n\nWhen you're done, click this link to schedule your final test:\n${studiedUrl}`;
}

export function finalTestEmailHtml(finalUrl: string): string {
  return emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827">Your final test is ready</h1>
    <p style="margin:0 0 8px;color:#6b7280;font-size:15px;line-height:1.6">
      Time to find out how much you retained. You'll answer the same questions as your pre-test — this time with the material fresh from your reading.
    </p>
    <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6">
      Your results will show both attempts side by side so you can see exactly what changed.
    </p>
    <a href="${finalUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
      Take the final test →
    </a>
  `);
}

export function finalTestEmailText(finalUrl: string): string {
  return `Your final test is ready\n\nTime to find out how much you retained. You'll answer the same questions as your pre-test.\n\nTake your final test here:\n${finalUrl}`;
}
