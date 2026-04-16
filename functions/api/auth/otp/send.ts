import type { Env } from '../../../_shared/types';
import { hashCode, jsonError, jsonOk } from '../../../_shared/auth';
import { sendEmail, otpEmailHtml, otpEmailText } from '../../../_shared/email';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('Invalid email address', 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 600;

  const recentCount = await env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM otp_attempts WHERE email = ? AND created_at > ? AND used = 0'
  ).bind(email, windowStart).first<{ cnt: number }>();

  if ((recentCount?.cnt ?? 0) >= 3) {
    return jsonError('Too many verification attempts. Please wait 10 minutes.', 429);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await hashCode(code);
  const id = crypto.randomUUID();
  const expiresAt = now + 600;

  await env.DB.prepare(
    'INSERT INTO otp_attempts (id, email, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, email, codeHash, expiresAt, now).run();

  await sendEmail({
    apiKey: env.RESEND_API_KEY,
    from: env.FROM_EMAIL,
    to: email,
    subject: 'Your Retained verification code',
    html: otpEmailHtml(code),
    text: otpEmailText(code),
  });

  return jsonOk({ success: true });
};
