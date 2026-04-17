import type { Env, Question, StoredAnswer, FinalResult } from '../../../_shared/types';
import { jsonError, jsonOk } from '../../../_shared/auth';
import { gradeAnswer } from '../../../_shared/claude';

export const onRequestPost: PagesFunction<Env> = async context => {
  const { request, env, params } = context;
  const scheduleId = params.schedule_id as string;

  let body: { answers?: string[] };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  if (!Array.isArray(body.answers)) return jsonError('answers must be an array', 400);

  const row = await env.DB.prepare(
    'SELECT questions_json, pre_answers_json, final_answers_json, completed_at, studied_at, test_sent FROM schedules WHERE id = ?'
  )
    .bind(scheduleId)
    .first<{
      questions_json: string;
      pre_answers_json: string | null;
      final_answers_json: string | null;
      completed_at: number | null;
      studied_at: number | null;
      test_sent: number;
    }>();

  if (!row) return jsonError('Schedule not found', 404);
  if (row.completed_at) return jsonError('This session has been completed', 410);
  if (!row.studied_at) return jsonError('Study not yet completed', 403);
  if (!row.test_sent) return jsonError('Final test not yet sent', 403);
  if (!row.pre_answers_json) return jsonError('Pre-test not completed', 409);
  if (row.final_answers_json) return jsonError('Final answers already submitted', 409);

  const questions: Question[] = JSON.parse(row.questions_json);
  const preAnswers: StoredAnswer[] = JSON.parse(row.pre_answers_json);

  if (body.answers.length !== questions.length) {
    return jsonError(`Expected ${questions.length} answers, got ${body.answers.length}`, 400);
  }

  const finalStoredAnswers: StoredAnswer[] = [];
  const results: FinalResult[] = [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const userAnswer = body.answers[i];
    const preAnswer = preAnswers.find(a => a.questionId === question.id);

    let finalCorrect: boolean;
    if (question.type === 'mcq') {
      finalCorrect = userAnswer.trim() === question.answer.trim();
    } else {
      finalCorrect = await gradeAnswer(
        env.ANTHROPIC_API_KEY,
        question.question,
        question.answer,
        userAnswer
      );
    }

    finalStoredAnswers.push({ questionId: question.id, answer: userAnswer, correct: finalCorrect });

    results.push({
      id: question.id,
      question: question.question,
      pre_answer: preAnswer?.answer ?? '',
      pre_correct: preAnswer?.correct ?? false,
      final_answer: userAnswer,
      final_correct: finalCorrect,
      model_answer: question.answer,
    });
  }

  const preScore = results.filter(r => r.pre_correct).length;
  const finalScore = results.filter(r => r.final_correct).length;
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare('UPDATE schedules SET final_answers_json = ?, completed_at = ? WHERE id = ?')
    .bind(JSON.stringify(finalStoredAnswers), now, scheduleId)
    .run();

  return jsonOk({
    pre_score: preScore,
    final_score: finalScore,
    total: questions.length,
    delta: finalScore - preScore,
    results,
  });
};
