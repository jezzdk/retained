import { useState } from 'react';
import type { AppState } from '../types';
import { api, ApiError } from '../api';

interface Props {
  onNext: (state: AppState) => void;
}

const steps = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="22" className="fill-indigo-100" />
        <path
          d="M24 12c-4.97 0-9 4.03-9 9 0 3.1 1.57 5.84 3.97 7.49L18 32h12l-.97-3.51C31.43 26.84 33 24.1 33 21c0-4.97-4.03-9-9-9z"
          className="fill-indigo-500"
          opacity=".9"
        />
        <rect x="18" y="32" width="12" height="2.5" rx="1.25" className="fill-indigo-400" />
        <rect x="19.5" y="35.5" width="9" height="2" rx="1" className="fill-indigo-300" />
        <circle cx="24" cy="21" r="3" className="fill-white" opacity=".7" />
        <path d="M22 21h4M24 19v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: 'Pre-test',
    title: 'Answer before you read',
    body: "You'll get questions about the article before reading it. Getting them wrong on purpose is the point — it primes your brain to absorb the material.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="22" className="fill-violet-100" />
        <rect x="13" y="14" width="22" height="20" rx="3" className="fill-violet-500" opacity=".9" />
        <rect x="17" y="19" width="14" height="2" rx="1" className="fill-white" opacity=".8" />
        <rect x="17" y="23" width="10" height="2" rx="1" className="fill-white" opacity=".6" />
        <rect x="17" y="27" width="12" height="2" rx="1" className="fill-white" opacity=".6" />
        <circle cx="33" cy="32" r="6" className="fill-amber-400" />
        <path d="M30.5 32l1.8 1.8 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Study',
    title: 'Read with focus',
    body: 'Because you already saw the questions, your brain knows what matters. You read with sharper attention and form stronger memories.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="22" className="fill-emerald-100" />
        <path
          d="M24 14l2.47 7.6h7.99l-6.46 4.7 2.47 7.6L24 29.2l-6.47 4.7 2.47-7.6L13.54 21.6h7.99L24 14z"
          className="fill-emerald-500"
          opacity=".9"
        />
      </svg>
    ),
    label: 'Final test',
    title: 'Cement it later',
    body: 'Days later you take the same quiz again. The time gap — called spaced repetition — is what moves knowledge from short-term to long-term memory.',
  },
];

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
      setError(
        err instanceof ApiError ? err.message : 'Could not reach that URL. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
          Science-backed learning
        </div>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          Read once.{' '}
          <span className="text-indigo-600">Remember for weeks.</span>
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-lg">
          Paste any article and Retained turns it into a spaced-retrieval study session — using the
          same memory science top students use.
        </p>
      </div>

      {/* URL input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            autoFocus
            required
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-indigo-600 text-white px-5 py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
          >
            {loading ? 'Fetching…' : 'Start →'}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
      </form>

      {/* How it works */}
      <div className="space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
          How it works
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-4 items-start bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="shrink-0 mt-0.5">{step.icon}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Step {i + 1} · {step.label}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention curve */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Memory over time
          </h2>
          <RetentionCurve />
        </div>
        <p className="text-xs text-gray-400 text-center">
          Schematic based on Kornell et al. (2009) &amp; Richland et al. (2009)
        </p>
      </div>

      {/* Science callout */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm.75 11.25a.75.75 0 01-1.5 0V9a.75.75 0 011.5 0v4.25zm-.75-6a.875.875 0 110-1.75.875.875 0 010 1.75z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900 text-sm pt-1.5">The pretesting effect</p>
        </div>

        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            When you attempt to recall something <em>before</em> you've learned it, your brain flags
            the gap. That flag — called a "desirable difficulty" — makes the information far more
            memorable when you encounter it moments later.
          </p>
          <p>
            Studies show pre-tested students retain up to{' '}
            <strong className="text-gray-800">50% more</strong> material than those who only study
            or re-read. Even wrong answers on the pre-test improve final retention.
          </p>
        </div>

        <a
          href="https://chapterly.ai/blog/pretesting-effect-learning"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors"
        >
          Read the full research breakdown
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function RetentionCurve() {
  return (
    <svg viewBox="0 0 340 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Background grid */}
      <line x1="48" y1="10" x2="48" y2="82" stroke="#f3f4f6" strokeWidth="1" />
      <line x1="48" y1="82" x2="316" y2="82" stroke="#f3f4f6" strokeWidth="1" />
      <line x1="48" y1="46" x2="316" y2="46" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 3" />

      {/* Y axis labels */}
      <text x="44" y="85" fontSize="8" fill="#9ca3af" textAnchor="end">0%</text>
      <text x="44" y="49" fontSize="8" fill="#9ca3af" textAnchor="end">50%</text>
      <text x="44" y="14" fontSize="8" fill="#9ca3af" textAnchor="end">100%</text>

      {/* WITHOUT pretesting — standard forgetting curve (gray dashed) */}
      <path
        d="M48,12 C85,12 108,32 138,52 C162,68 195,74 316,79"
        stroke="#d1d5db"
        strokeWidth="2"
        strokeDasharray="5 4"
        fill="none"
      />

      {/* WITH pretesting — dip at pre-test, rises after reading, slower decay */}
      <path
        d="M48,12 C65,20 75,52 92,58 C108,64 122,32 152,24 C175,18 208,26 248,34 C272,39 295,42 316,44"
        stroke="#4f46e5"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />

      {/* Pre-test event line */}
      <line x1="92" y1="10" x2="92" y2="82" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
      <circle cx="92" cy="58" r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
      <text x="92" y="7" fontSize="7.5" fill="#4f46e5" textAnchor="middle" fontWeight="600">Pre-test</text>

      {/* Read event line */}
      <line x1="152" y1="10" x2="152" y2="82" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
      <circle cx="152" cy="24" r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
      <text x="152" y="7" fontSize="7.5" fill="#4f46e5" textAnchor="middle" fontWeight="600">Read</text>

      {/* Final test event line */}
      <line x1="248" y1="10" x2="248" y2="82" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
      <circle cx="248" cy="34" r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
      <text x="248" y="7" fontSize="7.5" fill="#4f46e5" textAnchor="middle" fontWeight="600">Final test</text>

      {/* Legend */}
      <line x1="130" y1="99" x2="148" y2="99" stroke="#4f46e5" strokeWidth="2.5" />
      <text x="151" y="102" fontSize="7.5" fill="#4f46e5">With pretesting</text>
      <line x1="220" y1="99" x2="238" y2="99" stroke="#d1d5db" strokeWidth="2" strokeDasharray="5 4" />
      <text x="241" y="102" fontSize="7.5" fill="#9ca3af">Without</text>
    </svg>
  );
}
