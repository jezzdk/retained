import { useState } from 'react';
import type { AppState } from '../types';
import { api, ApiError } from '../api';

interface Props {
  state: Extract<AppState, { view: 'pre_results' }>;
  onNext: (state: AppState) => void;
}

const DELAY_OPTIONS = [
  { label: 'In 1 hour', hours: 1 },
  { label: 'In 4 hours', hours: 4 },
  { label: 'Tomorrow (24 h)', hours: 24 },
  { label: 'In 2 days', hours: 48 },
  { label: 'In 3 days', hours: 72 },
];

export default function PreResults({ state, onNext }: Props) {
  const { scheduleId, score, total } = state;
  const [delayHours, setDelayHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  const pct = Math.round((score / total) * 100);

  async function handleSchedule() {
    setError('');
    setLoading(true);
    try {
      const { study_at } = await api.scheduleStudy(scheduleId, delayHours);
      setScheduledAt(study_at);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Success state — shown after scheduling
  if (scheduledAt) {
    const date = new Date(scheduledAt);
    const formatted = date.toLocaleString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
    return (
      <div className="space-y-6 text-center py-10">
        <div className="text-5xl">📬</div>
        <h1 className="text-2xl font-bold text-gray-900">Study reminder scheduled</h1>
        <p className="text-gray-600 max-w-sm mx-auto">
          We'll email you your study reminder on{' '}
          <strong className="text-gray-800">{formatted}</strong>.
          The email will include the article link and a button to record when you've finished reading.
        </p>
        <p className="text-gray-400 text-sm">You can close this tab.</p>
        <button
          onClick={() => onNext({ view: 'url_entry' })}
          className="text-sm text-indigo-600 hover:underline"
        >
          Study another article →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Pre-test complete</h1>
        <p className="text-gray-500">Don't worry about the score — most people struggle before reading. That's the point.</p>
      </div>

      {/* Score card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold text-gray-900">{score}</span>
          <span className="text-2xl text-gray-400 mb-1">/ {total}</span>
          <span className="text-gray-500 mb-1 text-lg">({pct}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-indigo-500 h-3 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          Your pre-test score. After studying, you'll take the same quiz again and see how much you improved.
        </p>
      </div>

      {/* Study reminder scheduling */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-800">When would you like your study reminder?</h2>
        <div className="grid grid-cols-1 gap-2">
          {DELAY_OPTIONS.map(opt => (
            <label
              key={opt.hours}
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                delayHours === opt.hours
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <input
                type="radio"
                name="delay"
                value={opt.hours}
                checked={delayHours === opt.hours}
                onChange={() => setDelayHours(opt.hours)}
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
        {loading ? 'Scheduling…' : 'Schedule my study reminder →'}
      </button>
    </div>
  );
}
