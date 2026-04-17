import Anthropic from '@anthropic-ai/sdk';
import type { Question } from './types';

const GENERATION_MODEL = 'claude-sonnet-4-6';
const GRADING_MODEL = 'claude-haiku-4-5-20251001';

const questionSchema = {
  type: 'object' as const,
  properties: {
    questions: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          type: { type: 'string' as const, enum: ['mcq', 'free_recall', 'concept'] },
          question: { type: 'string' as const },
          options: { type: 'array' as const, items: { type: 'string' as const } },
          answer: { type: 'string' as const },
        },
        required: ['id', 'type', 'question', 'answer'],
      },
      minItems: 4,
      maxItems: 8,
    },
  },
  required: ['questions'],
};

export async function generateQuestions(apiKey: string, content: string): Promise<Question[]> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 2000,
    tools: [
      {
        name: 'generate_questions',
        description:
          'Generate quiz questions from article content to help readers retain information',
        input_schema: questionSchema,
      },
    ],
    tool_choice: { type: 'tool', name: 'generate_questions' },
    messages: [
      {
        role: 'user',
        content: `Generate between 4 and 8 quiz questions from this article to help readers learn and retain the key information. Use a mix of question types: multiple choice (MCQ, 4 options), free recall, and concept explanation. At least one of each type must be present. The exact number should reflect the length and complexity of the content.

Requirements:
- Questions must be answerable from the article alone — no prior knowledge assumed
- Each question must include a model answer (the full correct answer)
- For MCQ, the answer field must be the exact text of the correct option, and distractors must be plausible
- Do not ask about the author, publication date, or article metadata

Article content:
${content}`,
      },
    ],
  });

  const toolUse = response.content.find(b => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return structured questions');
  }

  const input = toolUse.input as { questions: Question[] };
  return input.questions;
}

export async function gradeAnswer(
  apiKey: string,
  question: string,
  modelAnswer: string,
  userAnswer: string
): Promise<boolean> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: GRADING_MODEL,
    max_tokens: 10,
    messages: [
      {
        role: 'user',
        content: `Question: ${question}
Model answer: ${modelAnswer}
Student's answer: ${userAnswer}

Is the student's answer substantially correct? Be generous with partial understanding. Reply with only YES or NO.`,
      },
    ],
  });

  const text = response.content[0];
  if (text.type !== 'text') return false;
  return text.text.trim().toUpperCase().startsWith('YES');
}
