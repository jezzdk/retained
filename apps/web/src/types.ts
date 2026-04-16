export interface Question {
  id: string;
  type: 'mcq' | 'free_recall' | 'concept';
  question: string;
  options?: string[];
}

export interface AnswerResult {
  id: string;
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

export interface PreTestScore {
  score: number;
  total: number;
  results: AnswerResult[];
}

export interface FinalTestScore {
  pre_score: number;
  final_score: number;
  total: number;
  delta: number;
  results: FinalResult[];
}

// ---- State machine ----

export type AppState =
  | { view: 'url_entry' }
  | { view: 'url_teaser'; url: string; estimatedQuestions: number }
  | { view: 'otp_entry'; url: string; estimatedQuestions: number; email: string }
  | { view: 'quiz_loading'; url: string }
  | {
      view: 'pre_test';
      scheduleId: string;
      questions: Question[];
      currentIndex: number;
      answers: string[];
      results: (boolean | null)[];
    }
  | { view: 'pre_results'; scheduleId: string; score: number; total: number }
  | { view: 'study_complete'; scheduleId: string }
  | {
      view: 'final_test';
      scheduleId: string;
      questions: Question[];
      currentIndex: number;
      answers: string[];
      results: (boolean | null)[];
    }
  | { view: 'final_results'; data: FinalTestScore }
  | { view: 'completed' }
  | { view: 'error'; message: string };
