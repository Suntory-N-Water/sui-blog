import type { z } from 'astro:content';
import type {
  ActionSectionSchema,
  ActionStepSchema,
  ComparisonItemSchema,
  CoreMessageSectionSchema,
  DiagramSectionSchema,
  FlowChartSectionSchema,
  FlowItemSchema,
  GroupedContentSectionSchema,
  HeroSectionSchema,
  ListStepItemSchema,
  ListStepsSectionSchema,
  ProblemCardSchema,
  ProblemSectionSchema,
  ScoreComparisonSectionSchema,
  ScoreItemSchema,
  StepItemSchema,
  StepsSectionSchema,
  TransitionSectionSchema,
} from '../content.config.ts';

// 各セクション型を個別スキーマから直接生成
export type HeroSectionData = z.infer<typeof HeroSectionSchema>;
export type ProblemSectionData = z.infer<typeof ProblemSectionSchema>;
export type CoreMessageSectionData = z.infer<typeof CoreMessageSectionSchema>;
export type StepsSectionData = z.infer<typeof StepsSectionSchema>;
export type ActionSectionData = z.infer<typeof ActionSectionSchema>;
export type TransitionSectionData = z.infer<typeof TransitionSectionSchema>;
export type ScoreComparisonSectionData = z.infer<
  typeof ScoreComparisonSectionSchema
>;
export type ListStepsSectionData = z.infer<typeof ListStepsSectionSchema>;
export type FlowChartSectionData = z.infer<typeof FlowChartSectionSchema>;

export type ProblemCard = z.infer<typeof ProblemCardSchema>;
export type ComparisonItem = z.infer<typeof ComparisonItemSchema>;
export type StepItem = z.infer<typeof StepItemSchema>;
export type ActionStep = z.infer<typeof ActionStepSchema>;
export type ScoreItem = z.infer<typeof ScoreItemSchema>;
export type ListStepItem = z.infer<typeof ListStepItemSchema>;
export type FlowItem = z.infer<typeof FlowItemSchema>;
export type GroupedContentSectionData = z.infer<
  typeof GroupedContentSectionSchema
>;

// Union Type for all sections
export type ArticleSection = z.infer<typeof DiagramSectionSchema>;

export const COLORS = {
  GOLD: '#D99834',
  RED: '#D94141',
} as const;

export type ColorKey = keyof typeof COLORS;
