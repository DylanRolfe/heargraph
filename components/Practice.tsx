'use client';

import { useId, useState } from 'react';
import { checkAnswer } from '@/lib/questions';
import type { CheckResult, Question } from '@/lib/types';

function QuestionCard({ question, number }: { question: Question; number: number }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [tries, setTries] = useState(0);
  const id = useId();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(checkAnswer(question, value));
    setTries((t) => t + 1);
  };

  const feedbackClass = result ? (result.correct ? 'feedback good' : result.understood ? 'feedback retry' : 'feedback') : 'feedback';

  return (
    <li className="question">
      <form onSubmit={onSubmit} noValidate>
        {question.kind === 'choice' ? (
          <fieldset>
            <legend>
              <span className="q-number">Question {number}.</span> {question.prompt}
            </legend>
            {question.choices.map((choice, i) => (
              <div className="choice" key={i}>
                <input
                  type="radio"
                  id={`${id}-c${i}`}
                  name={`${id}-choice`}
                  value={choice}
                  checked={value === choice}
                  onChange={() => setValue(choice)}
                />
                <label htmlFor={`${id}-c${i}`}>{choice}</label>
              </div>
            ))}
          </fieldset>
        ) : (
          <div className="field">
            <label htmlFor={`${id}-input`}>
              <span className="q-number">Question {number}.</span> {question.prompt}
              {question.kind === 'number' && question.unit ? (
                <span className="q-unit"> Answer in {question.unit}.</span>
              ) : null}
            </label>
            <input
              id={`${id}-input`}
              type="text"
              inputMode={question.kind === 'number' ? 'text' : undefined}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-describedby={`${id}-feedback`}
            />
          </div>
        )}
        <button type="submit">Check answer</button>
        <p id={`${id}-feedback`} className={feedbackClass} role="status" aria-live="polite" aria-atomic="true">
          {result ? (
            <>
              {result.feedback}
              {/* Changes on every try so a repeated message is announced again. */}
              {tries % 2 === 0 ? ' ' : ''}
            </>
          ) : null}
        </p>
      </form>
    </li>
  );
}

export function Practice({ questions, resetKey }: { questions: Question[]; resetKey: string }) {
  if (questions.length === 0) {
    return <p>There are no practice questions for this graph.</p>;
  }
  return (
    <>
      <p>
        There is no timer and no score is kept. You can go back to the graph or the table at any time, and you can
        try a question as many times as you like.
      </p>
      <ol className="questions" key={resetKey}>
        {questions.map((q, i) => (
          <QuestionCard key={i} question={q} number={i + 1} />
        ))}
      </ol>
    </>
  );
}
