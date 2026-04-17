import type { Env, Question } from '../../../_shared/types';
import { jsonError, jsonOk } from '../../../_shared/auth';

export const onRequestGet: PagesFunction<Env> = async context => {
  const { env, params } = context;
  const scheduleId = params.schedule_id as string;

  const row = await env.DB.prepare(
    'SELECT questions_json, test_sent, studied_at, completed_at FROM schedules WHERE id = ?'
  )
    .bind(scheduleId)
    .first<{
      questions_json: string;
      test_sent: number;
      studied_at: number | null;
      completed_at: number | null;
    }>();

  if (!row) return jsonError('Schedule not found', 404);
  if (row.completed_at) return jsonError('This session has been completed', 410);
  if (!row.studied_at) return jsonError('Study not yet completed', 403);
  if (!row.test_sent) return jsonError('Final test link is not yet active', 403);

  const questions: Question[] = JSON.parse(row.questions_json);
  const questionsForClient = questions.map(({ answer: _answer, ...q }) => q);

  return jsonOk({ questions: questionsForClient });
};
