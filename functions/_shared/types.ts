export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
  APP_URL: string;
}

export interface Question {
  id: string;
  type: 'mcq' | 'free_recall' | 'concept';
  question: string;
  options?: string[];
  answer: string;
}

export interface QuestionForClient extends Omit<Question, 'answer'> {
  answer?: never;
}

export interface AnswerResult {
  id: string;
  correct: boolean;
}

export interface StoredAnswer {
  questionId: string;
  answer: string;
  correct: boolean;
}

export interface FinalResult {
  id: string;
  question: string;
  pre_answer: string;
  pre_correct: boolean;
  final_answer: string;
  final_correct: boolean;
  model_answer: string;
}
