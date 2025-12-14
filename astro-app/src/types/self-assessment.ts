import * as v from 'valibot';

export const AnswerSchema = v.object({
  text: v.string(),
  correct: v.boolean(),
  explanation: v.nullable(v.string()),
});

export const QuizSchema = v.object({
  question: v.string(),
  answers: v.array(AnswerSchema),
});

export const SelfAssessmentSchema = v.object({
  quizzes: v.array(QuizSchema),
});

export type Answer = v.InferOutput<typeof AnswerSchema>;
export type Quiz = v.InferOutput<typeof QuizSchema>;
export type SelfAssessmentData = v.InferOutput<typeof SelfAssessmentSchema>;
