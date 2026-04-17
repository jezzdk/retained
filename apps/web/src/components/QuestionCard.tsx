import { useState } from 'react';
import type { Question } from '../types';
import { api, ApiError } from '../api';

interface Props {
  question: Question;
  scheduleId: string;
  onAnswered: (answer: string, correct: boolean) => void;
}

export default function QuestionCard({ question, scheduleId, onAnswered }: Props) {
  if (question.type === 'mcq') {
    return <McqCard question={question} scheduleId={scheduleId} onAnswered={onAnswered} />;
  }
  return <FreeTextCard question={question} scheduleId={scheduleId} onAnswered={onAnswered} />;
}

// ---- MCQ ----------------------------------------------------------------

function McqCard({ question, scheduleId, onAnswered }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSelect(index: number) {
    if (selected !== null || loading) return;
    setSelected(index);
    setLoading(true);

    const answer = question.options![index];
    try {
      const result = await api.gradeAnswer(scheduleId, question.id, answer);
      setCorrect(result.correct);
      setTimeout(() => onAnswered(answer, result.correct), 900);
    } catch (err) {
      // Fallback: proceed without grading feedback
      console.error('Grade error:', err);
      onAnswered(answer, false);
    } finally {
      setLoading(false);
    }
  }

  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      <p className="text-gray-900 font-medium text-lg leading-snug">{question.question}</p>

      <div className="space-y-2">
        {question.options!.map((option, i) => {
          let cls =
            'flex items-center gap-3 w-full p-4 rounded-lg border text-left transition-colors ';
          if (selected === null) {
            cls +=
              'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer text-gray-700';
          } else if (selected === i) {
            cls += correct
              ? 'border-green-500 bg-green-50 text-green-800 cursor-default'
              : 'border-red-500 bg-red-50 text-red-800 cursor-default';
          } else {
            cls += 'border-gray-100 bg-gray-50 text-gray-400 cursor-default';
          }

          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  selected === i
                    ? correct
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {selected === i && correct !== null ? (correct ? '✓' : '✗') : labels[i]}
              </span>
              <span className="text-sm">{option}</span>
            </button>
          );
        })}
      </div>

      {correct !== null && (
        <p className={`text-sm font-medium ${correct ? 'text-green-600' : 'text-red-600'}`}>
          {correct ? '✓ Correct' : '✗ Incorrect'} — moving on…
        </p>
      )}
    </div>
  );
}

// ---- Free text (free_recall / concept) ----------------------------------

function FreeTextCard({ question, scheduleId, onAnswered }: Props) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const label = question.type === 'concept' ? 'Explain the concept' : 'Your answer';
  const placeholder =
    question.type === 'concept'
      ? 'Describe the concept in your own words…'
      : 'Type your answer here…';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || submitted || loading) return;
    setError('');
    setLoading(true);

    try {
      const result = await api.gradeAnswer(scheduleId, question.id, answer.trim());
      setCorrect(result.correct);
      setSubmitted(true);
      setTimeout(() => onAnswered(answer.trim(), result.correct), 1100);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        // Proceed without feedback on unexpected error
        onAnswered(answer.trim(), false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
          {question.type === 'concept' ? 'Concept explanation' : 'Free recall'}
        </span>
        <p className="text-gray-900 font-medium text-lg leading-snug">{question.question}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder={placeholder}
            rows={4}
            disabled={submitted}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500 text-sm"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {correct !== null ? (
          <p className={`text-sm font-medium ${correct ? 'text-green-600' : 'text-red-600'}`}>
            {correct ? '✓ Correct — moving on…' : '✗ Incorrect — moving on…'}
          </p>
        ) : (
          <button
            type="submit"
            disabled={!answer.trim() || loading || submitted}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Checking…' : 'Submit answer →'}
          </button>
        )}
      </form>
    </div>
  );
}
