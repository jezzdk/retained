import type { Env } from '../../../_shared/types';
import { hashCode, sessionCookie, jsonError, jsonOk } from '../../../_shared/auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code || !/^\d{6}$/.test(code)) {
    return jsonError('Invalid request', 400);
  }

  const codeHash = await hashCode(code);
  const now = Math.floor(Date.now() / 1000);

  const attempt = await env.DB.prepare(
    'SELECT id, used FROM otp_attempts WHERE email = ? AND code_hash = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1'
  ).bind(email, codeHash, now).first<{ id: string; used: number }>();

  if (!attempt) {
    return jsonError('Invalid or expired code', 400);
  }

  if (attempt.used) {
    return jsonError('This code has already been used', 410);
  }

  await env.DB.prepare(
    'UPDATE otp_attempts SET used = 1 WHERE id = ?'
  ).bind(attempt.id).run();

  const sessionId = crypto.randomUUID();
  const expiresAt = now + 86400;

  await env.DB.prepare(
    'INSERT INTO sessions (id, email, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(sessionId, email, expiresAt, now).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookie(sessionId),
    },
  });
};
