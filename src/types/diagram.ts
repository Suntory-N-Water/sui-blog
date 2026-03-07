import type { z } from 'zod';
import type {
  ActionSectionSchema,
  AnalogyEquationSectionSchema,
  BeforeAfterTransformSectionSchema,
  CoreMessageSectionSchema,
  DiagramSectionSchema,
  FlowChartSectionSchema,
  FormulaDefinitionSectionSchema,
  FunnelFlowSectionSchema,
  GroupedContentSectionSchema,
  HeroSectionSchema,
  HighlightCardSectionSchema,
  ListStepsSectionSchema,
  MetaphorDiagramSectionSchema,
  MetricsImpactSectionSchema,
  NumericSimulationSectionSchema,
  PieChartSectionSchema,
  ProblemSectionSchema,
  QuoteReflectionSectionSchema,
  ScenarioComparisonSectionSchema,
  ScoreComparisonSectionSchema,
  StepsSectionSchema,
  TimelineProcessSectionSchema,
  TwoColumnContrastSectionSchema,
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
export type TwoColumnContrastSectionData = z.infer<
  typeof TwoColumnContrastSectionSchema
>;
export type AnalogyEquationSectionData = z.infer<
  typeof AnalogyEquationSectionSchema
>;
export type HighlightCardSectionData = z.infer<
  typeof HighlightCardSectionSchema
>;
export type FormulaDefinitionSectionData = z.infer<
  typeof FormulaDefinitionSectionSchema
>;
export type ScenarioComparisonSectionData = z.infer<
  typeof ScenarioComparisonSectionSchema
>;
export type NumericSimulationSectionData = z.infer<
  typeof NumericSimulationSectionSchema
>;
export type FunnelFlowSectionData = z.infer<typeof FunnelFlowSectionSchema>;
export type QuoteReflectionSectionData = z.infer<
  typeof QuoteReflectionSectionSchema
>;
export type MetaphorDiagramSectionData = z.infer<
  typeof MetaphorDiagramSectionSchema
>;
export type BeforeAfterTransformSectionData = z.infer<
  typeof BeforeAfterTransformSectionSchema
>;

// Union Type for all sections
export type ArticleSection = z.infer<typeof DiagramSectionSchema>;

export const COLORS = {
  GOLD: '#D99834',
  RED: '#D94141',
} as const;

export type ColorKey = keyof typeof COLORS;
