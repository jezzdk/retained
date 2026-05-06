import { useState, useEffect } from 'react';
import type { AppState } from './types';
import { api, ApiError } from './api';

import UrlEntry from './views/UrlEntry';
import UrlTeaser from './views/UrlTeaser';
import OtpEntry from './views/OtpEntry';
import QuizLoading from './views/QuizLoading';
import PreTest from './views/PreTest';
import PreResults from './views/PreResults';
import StudyComplete from './views/StudyComplete';
import FinalTest from './views/FinalTest';
import FinalResults from './views/FinalResults';
import Completed from './views/Completed';
import ErrorView from './views/ErrorView';

export default function App() {
  const [state, setState] = useState<AppState>({ view: 'url_entry' });

  // Detect entry from email links on mount
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const scheduleId = params.get('id');

    if (path === '/studied' && scheduleId) {
      setState({ view: 'study_complete', scheduleId });
      // Clean URL
      window.history.replaceState({}, '', '/');
    } else if (path === '/final' && scheduleId) {
      loadFinalTest(scheduleId);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  async function loadFinalTest(scheduleId: string) {
    setState({ view: 'final_loading' });
    try {
      const { questions } = await api.getFinalQuestions(scheduleId);
      setState({
        view: 'final_test',
        scheduleId,
        questions,
        currentIndex: 0,
        answers: [],
        results: [],
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        setState({ view: 'completed' });
      } else {
        setState({
          view: 'error',
          message: err instanceof Error ? err.message : 'Failed to load final test.',
        });
      }
    }
  }

  const go = (next: AppState) => setState(next);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path d="M10 3C7.24 3 5 5.24 5 8c0 1.86.99 3.49 2.47 4.38L7 15h6l-.47-2.62A5 5 0 0015 8c0-2.76-2.24-5-5-5z" fill="white" opacity=".9"/>
                <rect x="7.5" y="15" width="5" height="1.5" rx=".75" fill="white" opacity=".7"/>
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900">Retained</span>
          </div>
          <span className="text-gray-300 text-sm">·</span>
          <span className="text-gray-400 text-sm">spaced retrieval learning</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        {state.view === 'url_entry' && <UrlEntry onNext={go} />}
        {state.view === 'url_teaser' && <UrlTeaser state={state} onNext={go} />}
        {state.view === 'otp_entry' && <OtpEntry state={state} onNext={go} />}
        {state.view === 'quiz_loading' && <QuizLoading state={state} onNext={go} />}
        {state.view === 'final_loading' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-lg font-semibold text-gray-800">Loading your final test…</p>
          </div>
        )}
        {state.view === 'pre_test' && <PreTest state={state} onNext={go} />}
        {state.view === 'pre_results' && <PreResults state={state} onNext={go} />}
        {state.view === 'study_complete' && <StudyComplete state={state} onNext={go} />}
        {state.view === 'final_test' && <FinalTest state={state} onNext={go} />}
        {state.view === 'final_results' && <FinalResults state={state} />}
        {state.view === 'completed' && <Completed />}
        {state.view === 'error' && <ErrorView state={state} onNext={go} />}
      </main>
    </div>
  );
}
