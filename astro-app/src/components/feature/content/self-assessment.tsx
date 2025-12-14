import { useState } from 'react';
import type { SelfAssessmentData } from '@/types/self-assessment';

type Props = {
  selfAssessment: SelfAssessmentData;
};

export function SelfAssessment({ selfAssessment }: Props) {
  return (
    <div className='my-8 space-y-6'>
      <h2 className='text-2xl font-bold'>理解度チェック</h2>
      {selfAssessment.quizzes.map((quiz, index) => (
        <QuizItem
          key={`quiz-${quiz.question.slice(0, 20)}-${index}`}
          quiz={quiz}
          quizNumber={index + 1}
        />
      ))}
    </div>
  );
}

type QuizItemProps = {
  quiz: SelfAssessmentData['quizzes'][number];
  quizNumber: number;
};

function QuizItem({ quiz, quizNumber }: QuizItemProps) {
  return (
    <div className='flex flex-col justify-center'>
      <h3 className='rounded-t-md bg-gray-200 px-4 py-8 text-lg font-medium dark:bg-zinc-600'>
        問題{quizNumber}: {quiz.question}
      </h3>
      <ul className='flex flex-col justify-center'>
        {quiz.answers.map((answer, index) => (
          <li key={`answer-${answer.text.slice(0, 20)}-${index}`}>
            <AnswerItem answer={answer} />
          </li>
        ))}
      </ul>
    </div>
  );
}

type AnswerItemProps = {
  answer: SelfAssessmentData['quizzes'][number]['answers'][number];
};

function AnswerItem({ answer }: AnswerItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      className='group border border-t-0 border-gray-300 font-medium text-gray-900 dark:border-zinc-600 dark:text-gray-50'
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
    >
      <summary className='flex cursor-pointer items-center gap-3 p-4 text-lg hover:bg-gray-100 dark:hover:bg-zinc-700 [&::-webkit-details-marker]:hidden'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 20 20'
          fill='currentColor'
          className='h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-90'
          aria-hidden='true'
        >
          <path
            fillRule='evenodd'
            d='M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z'
            clipRule='evenodd'
          />
        </svg>
        <span>{answer.text}</span>
      </summary>
      <div className='animate-in fade-in-50 slide-in-from-top-2 border-t border-gray-200 bg-gray-50 p-4 duration-300 dark:border-zinc-700 dark:bg-zinc-800/50'>
        <p>
          {answer.correct ? (
            <span className='flex items-center gap-1 text-green-500'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
                className='h-6 w-6'
                aria-label='正解アイコン'
              >
                <title>正解</title>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
                  clipRule='evenodd'
                />
              </svg>
              正解です！
            </span>
          ) : (
            <span className='flex items-center gap-2 text-amber-600 dark:text-amber-500'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
                className='h-6 w-6'
                aria-label='不正解アイコン'
              >
                <title>不正解</title>
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z'
                  clipRule='evenodd'
                />
              </svg>
              もう一度考えてみましょう！
            </span>
          )}
        </p>
        {answer.explanation && <p className='mt-4'>{answer.explanation}</p>}
      </div>
    </details>
  );
}
