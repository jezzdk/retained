import { useState } from 'react';
import type { AppState } from '../types';
import { api, ApiError } from '../api';

interface Props {
  state: Extract<AppState, { view: 'study_complete' }>;
  onNext: (state: AppState) => void;
}

const DELAY_OPTIONS = [
  { label: '1 day', days: 1 },
  { label: '2 days', days: 2 },
  { label: '3 days (recommended)', days: 3 },
  { label: '5 days', days: 5 },
  { label: '7 days', days: 7 },
];

export default function StudyComplete({ state, onNext }: Props) {
  const [delayDays, setDelayDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduled, setScheduled] = useState<string | null>(null);

  async function handleSchedule() {
    setError('');
    setLoading(true);
    try {
      const { test_at } = await api.markStudied(state.scheduleId, delayDays);
      setScheduled(test_at);
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        onNext({ view: 'completed' });
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to schedule. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (scheduled) {
    const date = new Date(scheduled);
    const formatted = date.toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    return (
      <div className="space-y-6 text-center py-10">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">Final test scheduled</h1>
        <p className="text-gray-600">
          We'll email you your final test on <strong>{formatted}</strong>. Check your inbox then to see how much you retained.
        </p>
        <p className="text-gray-400 text-sm">You can close this tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="text-4xl mb-2">📚</div>
        <h1 className="text-2xl font-bold text-gray-900">Great work — study session logged!</h1>
        <p className="text-gray-500">
          You've finished studying. Now choose when you'd like to take your final test. Waiting at least a few days
          maximises the spaced-retrieval benefit.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-gray-800">When should we send your final test?</h2>
        <div className="grid grid-cols-1 gap-2">
          {DELAY_OPTIONS.map(opt => (
            <label
              key={opt.days}
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                delayDays === opt.days
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <input
                type="radio"
                name="delay"
                value={opt.days}
                checked={delayDays === opt.days}
                onChange={() => setDelayDays(opt.days)}
                className="accent-indigo-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        onClick={handleSchedule}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Scheduling…' : 'Schedule my final test →'}
      </button>
    </div>
  );
}
