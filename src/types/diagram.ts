import type { z } from 'zod';
import type {
  ActionSectionSchema,
  CoreMessageSectionSchema,
  DiagramSectionSchema,
  FlowChartSectionSchema,
  GroupedContentSectionSchema,
  HeroSectionSchema,
  ListStepsSectionSchema,
  MetricsImpactSectionSchema,
  PieChartSectionSchema,
  ProblemSectionSchema,
  ScoreComparisonSectionSchema,
  StepsSectionSchema,
  TimelineProcessSectionSchema,
} from './diagram-schemas';

// 各セクション型を個別スキーマから直接生成
export type HeroSectionData = z.infer<typeof HeroSectionSchema>;
export type ProblemSectionData = z.infer<typeof ProblemSectionSchema>;
export type CoreMessageSectionData = z.infer<typeof CoreMessageSectionSchema>;
export type StepsSectionData = z.infer<typeof StepsSectionSchema>;
export type ActionSectionData = z.infer<typeof ActionSectionSchema>;
export type ScoreComparisonSectionData = z.infer<
  typeof ScoreComparisonSectionSchema
>;
export type ListStepsSectionData = z.infer<typeof ListStepsSectionSchema>;
export type FlowChartSectionData = z.infer<typeof FlowChartSectionSchema>;

export type GroupedContentSectionData = z.infer<
  typeof GroupedContentSectionSchema
>;
export type TimelineProcessSectionData = z.infer<
  typeof TimelineProcessSectionSchema
>;
export type MetricsImpactSectionData = z.infer<
  typeof MetricsImpactSectionSchema
>;
export type PieChartSectionData = z.infer<typeof PieChartSectionSchema>;

// Union Type for all sections
export type ArticleSection = z.infer<typeof DiagramSectionSchema>;

export const COLORS = {
  GOLD: '#D99834',
  RED: '#D94141',
} as const;

export type ColorKey = keyof typeof COLORS;
