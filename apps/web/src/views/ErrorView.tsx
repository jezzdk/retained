import type { AppState } from '../types';

interface Props {
  state: Extract<AppState, { view: 'error' }>;
  onNext: (state: AppState) => void;
}

export default function ErrorView({ state, onNext }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="text-gray-500 max-w-md">{state.message}</p>
      <button
        onClick={() => onNext({ view: 'url_entry' })}
        className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
      >
        Start over
      </button>
    </div>
  );
}
