import type { Question, PreTestScore, FinalTestScore } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.error ?? 'Something went wrong', res.status);
  return data as T;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const api = {
  previewUrl(url: string): Promise<{ wordCount: number; estimatedQuestions: number }> {
    return request('/api/quiz/preview', { method: 'POST', body: JSON.stringify({ url }) });
  },

  sendOtp(email: string): Promise<{ success: boolean }> {
    return request('/api/auth/otp/send', { method: 'POST', body: JSON.stringify({ email }) });
  },

  verifyOtp(email: string, code: string): Promise<{ success: boolean }> {
    return request('/api/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, code }) });
  },

  generateQuiz(url: string): Promise<{ schedule_id: string; questions: Question[] }> {
    return request('/api/quiz/generate', { method: 'POST', body: JSON.stringify({ url }) });
  },

  gradeAnswer(scheduleId: string, questionId: string, answer: string): Promise<{ correct: boolean }> {
    return request(`/api/quiz/${scheduleId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    });
  },

  submitPreAnswers(scheduleId: string, answers: string[]): Promise<PreTestScore> {
    return request(`/api/quiz/${scheduleId}/pre-answers`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  scheduleStudy(scheduleId: string, studyDelayHours: number): Promise<{ study_at: string }> {
    return request(`/api/quiz/${scheduleId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ study_delay_hours: studyDelayHours }),
    });
  },

  markStudied(scheduleId: string, testDelayDays: number): Promise<{ test_at: string }> {
    return request(`/api/quiz/${scheduleId}/studied`, {
      method: 'POST',
      body: JSON.stringify({ test_delay_days: testDelayDays }),
    });
  },

  getFinalQuestions(scheduleId: string): Promise<{ questions: Question[] }> {
    return request(`/api/quiz/${scheduleId}/final`);
  },

  submitFinalAnswers(scheduleId: string, answers: string[]): Promise<FinalTestScore> {
    return request(`/api/quiz/${scheduleId}/final-answers`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },
};
