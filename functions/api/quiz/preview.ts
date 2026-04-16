import type { Env } from '../../_shared/types';
import { jsonError, jsonOk } from '../../_shared/auth';
import { fetchArticleContent, validateWordCount, estimateQuestionCount } from '../../_shared/content';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request } = context;

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const url = body.url?.trim();
  if (!url) return jsonError('URL is required', 400);

  try {
    new URL(url);
  } catch {
    return jsonError('Invalid URL', 400);
  }

  let wordCount: number;
  try {
    const result = await fetchArticleContent(url);
    wordCount = result.wordCount;
  } catch {
    return jsonError('Could not fetch the article. Please check the URL and try again.', 422);
  }

  const error = validateWordCount(wordCount);
  if (error) return jsonError(error, 422);

  return jsonOk({
    wordCount,
    estimatedQuestions: estimateQuestionCount(wordCount),
  });
};
