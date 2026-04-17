import type { AppState } from '../types';
import { api, ApiError } from '../api';
import QuestionCard from '../components/QuestionCard';
import ProgressIndicator from '../components/ProgressIndicator';

interface Props {
  state: Extract<AppState, { view: 'final_test' }>;
  onNext: (state: AppState) => void;
}

export default function FinalTest({ state, onNext }: Props) {
  const { scheduleId, questions, currentIndex, answers, results } = state;
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  function handleAnswered(answer: string, correct: boolean) {
    const newAnswers = [...answers, answer];
    const newResults = [...results, correct];

    if (isLast) {
      onNext({
        view: 'final_test',
        scheduleId,
        questions,
        currentIndex,
        answers: newAnswers,
        results: newResults,
      });

      setTimeout(() => {
        api
          .submitFinalAnswers(scheduleId, newAnswers)
          .then(data => {
            onNext({ view: 'final_results', data });
          })
          .catch(err => {
            onNext({
              view: 'error',
              message: err instanceof ApiError ? err.message : 'Failed to submit answers.',
            });
          });
      }, 1200);
    } else {
      setTimeout(() => {
        onNext({
          view: 'final_test',
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
        <h1 className="text-xl font-bold text-gray-900">Final test</h1>
        <p className="text-gray-500 text-sm">
          Same questions as your pre-test. Let's see how much you retained.
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
