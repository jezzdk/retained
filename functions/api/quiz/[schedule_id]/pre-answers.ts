import type { Env, Question, StoredAnswer } from '../../../_shared/types';
import { getSession, jsonError, jsonOk } from '../../../_shared/auth';
import { gradeAnswer } from '../../../_shared/claude';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const scheduleId = params.schedule_id as string;

  const session = await getSession(request, env);
  if (!session) return jsonError('Unauthorized', 401);

  let body: { answers?: string[] };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  if (!Array.isArray(body.answers)) return jsonError('answers must be an array', 400);

  const row = await env.DB.prepare(
    'SELECT questions_json, pre_answers_json, completed_at FROM schedules WHERE id = ? AND session_id = ?'
  ).bind(scheduleId, session.id).first<{ questions_json: string; pre_answers_json: string | null; completed_at: number | null }>();

  if (!row) return jsonError('Schedule not found', 404);
  if (row.completed_at) return jsonError('This session has been completed', 410);
  if (row.pre_answers_json) return jsonError('Pre-test answers already submitted', 409);

  const questions: Question[] = JSON.parse(row.questions_json);
  if (body.answers.length !== questions.length) {
    return jsonError(`Expected ${questions.length} answers, got ${body.answers.length}`, 400);
  }

  const storedAnswers: StoredAnswer[] = [];
  const results: { id: string; correct: boolean }[] = [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const userAnswer = body.answers[i];
    let correct: boolean;

    if (question.type === 'mcq') {
      correct = userAnswer.trim() === question.answer.trim();
    } else {
      correct = await gradeAnswer(env.ANTHROPIC_API_KEY, question.question, question.answer, userAnswer);
    }

    storedAnswers.push({ questionId: question.id, answer: userAnswer, correct });
    results.push({ id: question.id, correct });
  }

  const score = results.filter(r => r.correct).length;

  await env.DB.prepare(
    'UPDATE schedules SET pre_answers_json = ? WHERE id = ?'
  ).bind(JSON.stringify(storedAnswers), scheduleId).run();

  return jsonOk({ score, total: questions.length, results });
};
