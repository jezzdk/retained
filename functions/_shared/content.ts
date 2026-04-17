const MAX_TOKENS = 8000;
const CHARS_PER_TOKEN = 4;
const MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN;
const MIN_WORDS = 1500;

export async function fetchArticleContent(
  url: string
): Promise<{ text: string; wordCount: number }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Retained/1.0)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);

  const html = await res.text();
  const text = stripHtml(html);
  const wordCount = countWords(text);
  return { text, wordCount };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

export function validateWordCount(wordCount: number): string | null {
  if (wordCount < MIN_WORDS) {
    return `This article is too short to generate a meaningful quiz (${wordCount} words found, minimum is ${MIN_WORDS}).`;
  }
  return null;
}

export function truncateContent(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  return text.slice(0, MAX_CHARS);
}

export function estimateQuestionCount(wordCount: number): number {
  if (wordCount < 2000) return 4;
  if (wordCount < 3500) return 5;
  if (wordCount < 5000) return 6;
  if (wordCount < 7000) return 7;
  return 8;
}
