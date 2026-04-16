import type { Env } from '../../../_shared/types';
import { getSession, jsonError, jsonOk } from '../../../_shared/auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const scheduleId = params.schedule_id as string;

  const session = await getSession(request, env);
  if (!session) return jsonError('Unauthorized', 401);

  let body: { study_delay_hours?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const delayHours = Math.max(1, Math.min(168, body.study_delay_hours ?? 24));

  const row = await env.DB.prepare(
    'SELECT url, pre_answers_json, study_at, completed_at FROM schedules WHERE id = ? AND session_id = ?'
  ).bind(scheduleId, session.id).first<{ url: string; pre_answers_json: string | null; study_at: number | null; completed_at: number | null }>();

  if (!row) return jsonError('Schedule not found', 404);
  if (row.completed_at) return jsonError('This session has been completed', 410);
  if (!row.pre_answers_json) return jsonError('Pre-test must be completed first', 409);
  if (row.study_at) return jsonError('Study reminder already scheduled', 409);

  const now = Math.floor(Date.now() / 1000);
  const studyAt = now + delayHours * 3600;

  // Write the scheduled time and leave study_sent = 0.
  // The cron worker (workers/cron/index.ts) will send the email when study_at <= now().
  // This is the only mechanism that respects the user's chosen delay.
  await env.DB.prepare(
    'UPDATE schedules SET study_at = ? WHERE id = ?'
  ).bind(studyAt, scheduleId).run();

  return jsonOk({ study_at: new Date(studyAt * 1000).toISOString() });
};
