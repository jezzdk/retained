import type { Env } from './types';

export async function getSession(request: Request, env: Env): Promise<{ id: string; email: string } | null> {
  const cookie = request.headers.get('Cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return null;

  const token = match[1];
  const now = Math.floor(Date.now() / 1000);

  const row = await env.DB.prepare(
    'SELECT id, email FROM sessions WHERE id = ? AND expires_at > ?'
  ).bind(token, now).first<{ id: string; email: string }>();

  return row ?? null;
}

export function sessionCookie(token: string): string {
  return `session=${token}; HttpOnly; SameSite=Strict; Secure; Path=/`;
}

export async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
