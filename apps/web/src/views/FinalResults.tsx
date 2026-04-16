import type { AppState, FinalResult } from '../types';

interface Props {
  state: Extract<AppState, { view: 'final_results' }>;
}

export default function FinalResults({ state }: Props) {
  const { pre_score, final_score, total, delta, results } = state.data;
  const improved = delta > 0;
  const same = delta === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Final results</h1>
        <p className="text-gray-500">Here's how your pre-test and final test compare, with model answers.</p>
      </div>

      {/* Score summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500 mb-1">Pre-test</p>
            <p className="text-3xl font-bold text-gray-700">{pre_score}<span className="text-gray-400 text-xl">/{total}</span></p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-gray-500 mb-1">Change</p>
            <p className={`text-3xl font-bold ${improved ? 'text-green-600' : same ? 'text-gray-500' : 'text-red-500'}`}>
              {improved ? `+${delta}` : delta}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Final test</p>
            <p className="text-3xl font-bold text-indigo-600">{final_score}<span className="text-indigo-300 text-xl">/{total}</span></p>
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center border-t border-gray-100 pt-4">
          {improved
            ? `You improved by ${delta} question${delta > 1 ? 's' : ''} — that's spaced retrieval working.`
            : same
            ? 'You held your ground. Consider spacing your next review further out.'
            : 'Scores can vary — keep practising with spaced retrieval.'}
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-800">Question breakdown</h2>
        {results.map((result, i) => (
          <ResultCard key={result.id} result={result} index={i + 1} />
        ))}
      </div>

      <div className="border-t border-gray-200 pt-6 text-center">
        <a href="/" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
          Study another article →
        </a>
      </div>
    </div>
  );
}

function ResultCard({ result, index }: { result: FinalResult; index: number }) {
  const { question, pre_answer, pre_correct, final_answer, final_correct, model_answer } = result;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <p className="font-medium text-gray-900">
        <span className="text-gray-400 mr-2">Q{index}.</span>{question}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-lg p-3 border ${pre_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-500">Pre-test</p>
          <p className={`text-sm font-medium ${pre_correct ? 'text-green-700' : 'text-red-700'}`}>
            {pre_correct ? '✓' : '✗'} {pre_answer || <em className="opacity-60">No answer</em>}
          </p>
        </div>
        <div className={`rounded-lg p-3 border ${final_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-500">Final test</p>
          <p className={`text-sm font-medium ${final_correct ? 'text-green-700' : 'text-red-700'}`}>
            {final_correct ? '✓' : '✗'} {final_answer || <em className="opacity-60">No answer</em>}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">Model answer</p>
        <p className="text-sm text-gray-700">{model_answer}</p>
      </div>
    </div>
  );
}
