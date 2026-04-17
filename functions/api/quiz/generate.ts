import type { Env } from '../../_shared/types';
import { getSession, jsonError, jsonOk } from '../../_shared/auth';
import { fetchArticleContent, validateWordCount, truncateContent } from '../../_shared/content';
import { generateQuestions } from '../../_shared/claude';

export const onRequestPost: PagesFunction<Env> = async context => {
  const { request, env } = context;

  const session = await getSession(request, env);
  if (!session) return jsonError('Unauthorized', 401);

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const url = body.url?.trim();
  if (!url) return jsonError('URL is required', 400);

  let text: string;
  let wordCount: number;
  try {
    const result = await fetchArticleContent(url);
    text = result.text;
    wordCount = result.wordCount;
  } catch {
    return jsonError('Could not fetch the article. Please check the URL and try again.', 422);
  }

  const contentError = validateWordCount(wordCount);
  if (contentError) return jsonError(contentError, 422);

  const content = truncateContent(text);

  let questions;
  try {
    questions = await generateQuestions(env.ANTHROPIC_API_KEY, content);
  } catch (err) {
    console.error('Claude API error:', err);
    return jsonError('Failed to generate questions. Please try again.', 500);
  }

  const scheduleId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    'INSERT INTO schedules (id, session_id, email, url, questions_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(scheduleId, session.id, session.email, url, JSON.stringify(questions), now)
    .run();

  const questionsForClient = questions.map(({ answer: _answer, ...q }) => q);

  return jsonOk({ schedule_id: scheduleId, questions: questionsForClient });
};
