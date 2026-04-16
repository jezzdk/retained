import type { AppState } from '../types';
import { api, ApiError } from '../api';
import QuestionCard from '../components/QuestionCard';
import ProgressIndicator from '../components/ProgressIndicator';

interface Props {
  state: Extract<AppState, { view: 'pre_test' }>;
  onNext: (state: AppState) => void;
}

export default function PreTest({ state, onNext }: Props) {
  const { scheduleId, questions, currentIndex, answers, results } = state;
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  function handleAnswered(answer: string, correct: boolean) {
    const newAnswers = [...answers, answer];
    const newResults = [...results, correct];

    if (isLast) {
      // All answered — submit to server for official scoring
      onNext({
        view: 'pre_test',
        scheduleId,
        questions,
        currentIndex,
        answers: newAnswers,
        results: newResults,
      });

      // Kick off submission after a short pause to let user see last result
      setTimeout(() => {
        api.submitPreAnswers(scheduleId, newAnswers).then(score => {
          onNext({ view: 'pre_results', scheduleId, score: score.score, total: score.total });
        }).catch(err => {
          onNext({ view: 'error', message: err instanceof ApiError ? err.message : 'Failed to submit answers.' });
        });
      }, 1200);
    } else {
      setTimeout(() => {
        onNext({
          view: 'pre_test',
          scheduleId,
          questions,
          currentIndex: currentIndex + 1,
          answers: newAnswers,
          results: newResults,
        });
      }, 1000);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-gray-900">Pre-test</h1>
        <p className="text-gray-500 text-sm">
          Answer as best you can — you haven't read the article yet, and that's intentional. This primes your brain.
        </p>
      </div>

      <ProgressIndicator current={currentIndex + 1} total={questions.length} />

      <QuestionCard
        key={question.id}
        question={question}
        scheduleId={scheduleId}
        onAnswered={handleAnswered}
      />
    </div>
  );
}
