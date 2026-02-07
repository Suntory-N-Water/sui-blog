import { z } from 'zod';
import { ICON_NAMES } from '../components/feature/diagram/icon-config';

// IconName型のZodスキーマ(icon-config.tsのICON_NAMESから直接生成)
const IconNameSchema = z.enum(ICON_NAMES);

// ColorKey型のZodスキーマ
const ColorKeySchema = z.enum(['GOLD', 'RED']);

// 1. HeroSection
export const HeroSectionSchema = z.object({
  type: z.literal('hero'),
  date: z.string(),
  title: z.string(),
  subtitle: z.string(),
});

// 2. ProblemSection
export const ProblemCardSchema = z.object({
  icon: IconNameSchema,
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  isHighlight: z.boolean().optional(),
  accentColor: ColorKeySchema.optional(),
});

export const ProblemSectionSchema = z.object({
  type: z.literal('problem'),
  variant: z.enum(['highlight', 'simple']).default('simple').optional(),
  icon: IconNameSchema.optional(),
  title: z.string(),
  introText: z.string(),
  cards: z.array(ProblemCardSchema),
  summaryTitle: z.string().optional(),
  summaryText: z.string().optional(),
});

// 3. CoreMessageSection
export const ComparisonItemSchema = z.object({
  icon: IconNameSchema,
  title: z.string(),
  text: z.string(),
  isGood: z.boolean(),
});

export const CoreMessageSectionSchema = z.object({
  type: z.literal('core_message'),
  variant: z.enum(['highlight', 'simple']).default('highlight').optional(),
  icon: IconNameSchema.optional(),
  title: z.string(),
  mainMessage: z.string(),
  comparisons: z.array(ComparisonItemSchema).optional(),
  coreHighlight: z
    .object({
      title: z.string(),
      text: z.string(),
      accentColor: ColorKeySchema.optional(),
    })
    .optional(),
});

// 4. StepsSection
export const StepItemSchema = z.object({
  number: z.number(),
  title: z.string(),
  text: z.string(),
  detailTitle: z.string().optional(),
  details: z.array(z.string()).optional(),
  detailText: z.string().optional(),
});

export const StepsSectionSchema = z.object({
  type: z.literal('steps'),
  title: z.string(),
  introText: z.string(),
  steps: z.array(StepItemSchema),
});

// 5. ActionSection
export const ActionStepSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const ActionSectionSchema = z.object({
  type: z.literal('action'),
  title: z.string(),
  mainText: z.string(),
  actionStepsTitle: z.string(),
  actionSteps: z.array(ActionStepSchema),
  pointText: z.string(),
  footerText: z.string(),
  subFooterText: z.string(),
  accentColor: ColorKeySchema.optional(),
});

// 6. TransitionSection
export const TransitionSectionSchema = z.object({
  type: z.literal('transition'),
});

// 7. ScoreComparisonSection
export const ScoreItemSchema = z.object({
  title: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string(),
  barPercentage: z.number(),
  description: z.string().optional(),
  accentColor: ColorKeySchema.optional(),
});

export const ScoreComparisonSectionSchema = z.object({
  type: z.literal('score_comparison'),
  title: z.string(),
  introText: z.string().optional(),
  scores: z.array(ScoreItemSchema),
});

// 8. ListStepsSection
export const ListStepItemSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string(),
  badge: z.string(),
  badgeColor: z.string().optional(),
});

export const ListStepsSectionSchema = z.object({
  type: z.literal('list_steps'),
  title: z.string(),
  introText: z.string().optional(),
  steps: z.array(ListStepItemSchema),
  summaryTitle: z.string().optional(),
  summaryText: z.string().optional(),
});

// 9. FlowChartSection
export const FlowItemSchema = z.object({
  label: z.string(),
  subLabel: z.string().optional(),
  highlight: z.boolean().optional(),
  accentColor: ColorKeySchema.optional(),
});

export const FlowChartSectionSchema = z.object({
  type: z.literal('flow_chart'),
  title: z.string(),
  introText: z.string().optional(),
  flows: z.array(FlowItemSchema),
});

// カード単体の定義
export const GroupCardItemSchema = z.object({
  title: z.string(),
  text: z.string(), // 箇条書きの場合は改行コードで表現
  isHighlight: z.boolean().optional(),
  accentColor: ColorKeySchema.optional(),
  bgColor: z.enum(['white', 'muted', 'gray']).default('white').optional(),
});

// グループ(サブセクション)の定義
export const ContentGroupSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  cards: z.array(GroupCardItemSchema),
  bgColor: z.enum(['white', 'muted']).default('white').optional(),
  isHighlight: z.boolean().optional(),
  footerText: z.string().optional(),
});

// 新しいセクション全体の定義
export const GroupedContentSectionSchema = z.object({
  type: z.literal('grouped_content'),
  title: z.string(),
  introText: z.string().optional(),
  icon: IconNameSchema.optional(),
  sectionBgColor: z.enum(['white', 'muted']).default('muted').optional(),
  groups: z.array(ContentGroupSchema),
});

// 10. TimelineProcessSection
export const TimelineEventSchema = z.object({
  time: z.string(),
  title: z.string(),
  description: z.string(),
  isHighlight: z.boolean().optional(),
  accentColor: ColorKeySchema.optional(),
});

export const TimelineProcessSectionSchema = z.object({
  type: z.literal('timeline_process'),
  title: z.string(),
  introText: z.string().optional(),
  icon: IconNameSchema.optional(),
  events: z.array(TimelineEventSchema).min(2).max(8),
});

const MetricItemSchema = z.object({
  value: z.string(),
  unit: z.string().optional(),
  label: z.string(),
  description: z.string().optional(),
  accentColor: ColorKeySchema.optional(),
});

export const MetricsImpactSectionSchema = z.object({
  type: z.literal('metrics_impact'),
  title: z.string(),
  introText: z.string().optional(),
  icon: IconNameSchema.optional(),
  metrics: z.array(MetricItemSchema).min(1).max(4),
  layout: z.enum(['horizontal', 'vertical']).default('horizontal').optional(),
});

const PieSegmentSchema = z.object({
  label: z.string(),
  value: z.number().min(0).max(100),
});

export const PieChartSectionSchema = z.object({
  type: z.literal('pie_chart'),
  title: z.string(),
  introText: z.string().optional(),
  icon: IconNameSchema.optional(),
  segments: z.array(PieSegmentSchema).min(2).max(5),
});

// Union型で全セクションをまとめる
export const DiagramSectionSchema = z.discriminatedUnion('type', [
  HeroSectionSchema,
  ProblemSectionSchema,
  CoreMessageSectionSchema,
  StepsSectionSchema,
  ActionSectionSchema,
  TransitionSectionSchema,
  ScoreComparisonSectionSchema,
  ListStepsSectionSchema,
  FlowChartSectionSchema,
  GroupedContentSectionSchema,
  TimelineProcessSectionSchema,
  MetricsImpactSectionSchema,
  PieChartSectionSchema,
]);

// 型エクスポート
export type DiagramSection = z.infer<typeof DiagramSectionSchema>;
