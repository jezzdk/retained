import { useEffect, useRef } from 'react';
import type { AppState } from '../types';
import { api, ApiError } from '../api';

interface Props {
  state: Extract<AppState, { view: 'quiz_loading' }>;
  onNext: (state: AppState) => void;
}

export default function QuizLoading({ state, onNext }: Props) {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    api
      .generateQuiz(state.url)
      .then(({ schedule_id, questions }) => {
        onNext({
          view: 'pre_test',
          scheduleId: schedule_id,
          questions,
          currentIndex: 0,
          answers: [],
          results: [],
        });
      })
      .catch(err => {
        if (err instanceof ApiError && err.status === 401) {
          onNext({ view: 'error', message: 'Your session expired. Please start over.' });
        } else {
          onNext({
            view: 'error',
            message: err instanceof Error ? err.message : 'Failed to generate quiz.',
          });
        }
      });
    // onNext and state.url are intentionally absent: this must fire exactly once on mount.
    // called.current is the StrictMode guard against double-invocation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-gray-800">Generating your quiz…</p>
        <p className="text-gray-500 text-sm">
          Reading the article and crafting questions. This takes about 10–20 seconds.
        </p>
      </div>
    </div>
  );
}
