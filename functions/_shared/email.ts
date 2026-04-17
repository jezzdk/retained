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

export function otpEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:0 24px;color:#1a1a1a">
  <h1 style="font-size:24px;margin-bottom:8px">Your Retained verification code</h1>
  <p style="color:#555;margin-bottom:32px">Enter this code to verify your email address. It expires in 10 minutes.</p>
  <div style="background:#f4f4f5;border-radius:12px;padding:32px;text-align:center;margin-bottom:32px">
    <span style="font-size:48px;font-weight:700;letter-spacing:12px;font-family:monospace">${code}</span>
  </div>
  <p style="color:#888;font-size:14px">If you didn't request this, you can safely ignore this email.</p>
</body>
</html>`;
}

export function otpEmailText(code: string): string {
  return `Your Retained verification code: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.`;
}

export function studyReminderHtml(
  articleUrl: string,
  articleDomain: string,
  studiedUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#1a1a1a">
  <h1 style="font-size:24px;margin-bottom:8px">Time to study</h1>
  <p style="color:#555;margin-bottom:24px">
    You're ready to read the article. Remember: you already took a pre-test, so your brain is primed to notice and encode the key ideas as you read.
  </p>
  <p style="margin-bottom:32px">
    <a href="${articleUrl}" style="color:#4f46e5;font-weight:600">${articleDomain}</a>
  </p>
  <a href="${studiedUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
    I've finished studying
  </a>
  <p style="color:#888;font-size:13px;margin-top:32px">
    When you click the button above, you'll choose when to take your final test.
  </p>
</body>
</html>`;
}

export function studyReminderText(articleUrl: string, studiedUrl: string): string {
  return `Time to study\n\nRead the article here: ${articleUrl}\n\nWhen you're done, click this link to schedule your final test:\n${studiedUrl}\n\nWhen you click the link above, you'll choose when to take your final test.`;
}

export function finalTestEmailHtml(finalUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:0 24px;color:#1a1a1a">
  <h1 style="font-size:24px;margin-bottom:8px">Your final test is ready</h1>
  <p style="color:#555;margin-bottom:32px">
    Let's see how much you retained. You'll answer the same questions as before — this time, see how much your studying paid off.
  </p>
  <a href="${finalUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
    Take the final test
  </a>
</body>
</html>`;
}

export function finalTestEmailText(finalUrl: string): string {
  return `Your final test is ready\n\nLet's see how much you retained.\n\nTake your final test here:\n${finalUrl}`;
}
