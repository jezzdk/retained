import { useState } from 'react';
import type { AppState } from '../types';
import { api, ApiError } from '../api';

interface Props {
  onNext: (state: AppState) => void;
}

export default function UrlEntry({ onNext }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let parsed: URL;
    try {
      parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setLoading(true);
    try {
      const { estimatedQuestions } = await api.previewUrl(parsed.href);
      onNext({ view: 'url_teaser', url: parsed.href, estimatedQuestions });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach that URL. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Learn more. Retain more.</h1>
        <p className="text-gray-500 text-lg">
          Paste an article URL and we'll turn it into a spaced-retrieval study session using the science of pretesting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Article URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/article"
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
          disabled={loading || !url.trim()}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Fetching article…' : 'Analyse article →'}
        </button>
      </form>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">How it works</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-3"><span className="text-indigo-500 font-bold">1.</span> Take a pre-test before reading — this primes your brain</li>
          <li className="flex gap-3"><span className="text-indigo-500 font-bold">2.</span> Read the article, knowing exactly what to focus on</li>
          <li className="flex gap-3"><span className="text-indigo-500 font-bold">3.</span> Take a final test days later — cement what you learned</li>
        </ol>
      </div>
    </div>
  );
}
