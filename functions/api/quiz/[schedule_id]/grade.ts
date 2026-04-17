import type { Env, Question } from '../../../_shared/types';
import { getSession, jsonError, jsonOk } from '../../../_shared/auth';
import { gradeAnswer } from '../../../_shared/claude';

export const onRequestPost: PagesFunction<Env> = async context => {
  const { request, env, params } = context;
  const scheduleId = params.schedule_id as string;

  const session = await getSession(request, env);
  if (!session) return jsonError('Unauthorized', 401);

  let body: { questionId?: string; answer?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  if (!body.questionId || body.answer === undefined) {
    return jsonError('questionId and answer are required', 400);
  }

  const row = await env.DB.prepare(
    'SELECT questions_json, completed_at FROM schedules WHERE id = ? AND session_id = ?'
  )
    .bind(scheduleId, session.id)
    .first<{ questions_json: string; completed_at: number | null }>();

  if (!row) return jsonError('Schedule not found', 404);
  if (row.completed_at) return jsonError('This session has been completed', 410);

  const questions: Question[] = JSON.parse(row.questions_json);
  const question = questions.find(q => q.id === body.questionId);
  if (!question) return jsonError('Question not found', 404);

  let correct: boolean;
  if (question.type === 'mcq') {
    correct = body.answer.trim() === question.answer.trim();
  } else {
    correct = await gradeAnswer(
      env.ANTHROPIC_API_KEY,
      question.question,
      question.answer,
      body.answer
    );
  }

  return jsonOk({ correct });
};
