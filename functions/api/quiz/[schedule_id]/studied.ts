import type { Env } from '../../../_shared/types';
import { jsonError, jsonOk } from '../../../_shared/auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const scheduleId = params.schedule_id as string;

  let body: { test_delay_days?: number };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const delayDays = Math.max(1, Math.min(30, body.test_delay_days ?? 3));

  const row = await env.DB.prepare(
    'SELECT completed_at, pre_answers_json FROM schedules WHERE id = ?'
  ).bind(scheduleId).first<{ completed_at: number | null; pre_answers_json: string | null }>();

  if (!row) return jsonError('Schedule not found', 404);
  if (row.completed_at) return jsonError('This session has been completed', 410);
  if (!row.pre_answers_json) return jsonError('Pre-test not completed', 409);

  const now = Math.floor(Date.now() / 1000);
  const testAt = now + delayDays * 86400;

  await env.DB.prepare(
    'UPDATE schedules SET studied_at = ?, test_at = ? WHERE id = ?'
  ).bind(now, testAt, scheduleId).run();

  return jsonOk({ test_at: new Date(testAt * 1000).toISOString() });
};
