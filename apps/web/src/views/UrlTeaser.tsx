import { useState } from 'react';
import type { AppState } from '../types';
import { api, ApiError } from '../api';

interface Props {
  state: Extract<AppState, { view: 'url_teaser' }>;
  onNext: (state: AppState) => void;
}

export default function UrlTeaser({ state, onNext }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const domain = (() => {
    try { return new URL(state.url).hostname.replace(/^www\./, ''); }
    catch { return state.url; }
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.sendOtp(email.trim().toLowerCase());
      onNext({ view: 'otp_entry', url: state.url, estimatedQuestions: state.estimatedQuestions, email: email.trim().toLowerCase() });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 space-y-2">
        <p className="text-indigo-700 font-medium text-sm uppercase tracking-wide">Ready</p>
        <p className="text-gray-900 text-xl font-semibold">{domain}</p>
        <p className="text-gray-600">
          We found enough content to generate{' '}
          <span className="font-bold text-indigo-600">{state.estimatedQuestions} questions</span>.
          Enter your email to get started — we'll send your study reminder and final test link there.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
            required
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending code…' : 'Send verification code →'}
        </button>
      </form>

      <button
        onClick={() => onNext({ view: 'url_entry' })}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← Use a different URL
      </button>
    </div>
  );
}
