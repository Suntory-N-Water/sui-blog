import type { ArticleSection } from '@/types/diagram';
import { ActionSection } from './action-section';
import { AnalogyEquationSection } from './analogy-equation-section';
import { BeforeAfterTransformSection } from './before-after-transform-section';
import { CoreMessageSection } from './core-message-section';
import { FlowChartSection } from './flow-chart-section';
import { FormulaDefinitionSection } from './formula-definition-section';
import { FunnelFlowSection } from './funnel-flow-section';
import { GroupedContentSection } from './grouped-content-section';
import { HeroSection } from './hero-section';
import { HighlightCardSection } from './highlight-card-section';
import { ListStepsSection } from './list-steps-section';
import { MetaphorDiagramSection } from './metaphor-diagram-section';
import { MetricsImpactSection } from './metrics-impact-section';
import { NumericSimulationSection } from './numeric-simulation-section';
import { PieChartSection } from './pie-chart-section';
import { ProblemSection } from './problem-section';
import { QuoteReflectionSection } from './quote-reflection-section';
import { ScenarioComparisonSection } from './scenario-comparison-section';
import { ScoreComparisonSection } from './score-comparison-section';
import { StepsSection } from './steps-section';
import { TimelineProcessSection } from './timeline-process-section';
import { TransitionSection } from './transition-section';
import { TwoColumnContrastSection } from './two-column-contrast-section';

type DynamicPageBuilderProps = {
  data: ArticleSection[];
};

export default function DynamicPageBuilder({ data }: DynamicPageBuilderProps) {
  return (
    <div className='min-h-screen font-sans'>
      {data.map((section, index) => {
        const key = `${section.type}-${index}`;
        switch (section.type) {
          case 'hero':
            return <HeroSection key={key} data={section} />;
          case 'problem':
            return <ProblemSection key={key} data={section} />;
          case 'transition':
            return <TransitionSection key={key} />;
          case 'core_message':
            return <CoreMessageSection key={key} data={section} />;
          case 'steps':
            return <StepsSection key={key} data={section} />;
          case 'action':
            return <ActionSection key={key} data={section} />;
          case 'score_comparison':
            return <ScoreComparisonSection key={key} data={section} />;
          case 'list_steps':
            return <ListStepsSection key={key} data={section} />;
          case 'flow_chart':
            return <FlowChartSection key={key} data={section} />;
          case 'grouped_content':
            return <GroupedContentSection key={key} data={section} />;
          case 'timeline_process':
            return <TimelineProcessSection key={key} data={section} />;
          case 'metrics_impact':
            return <MetricsImpactSection key={key} data={section} />;
          case 'pie_chart':
            return <PieChartSection key={key} data={section} />;
          case 'two_column_contrast':
            return <TwoColumnContrastSection key={key} data={section} />;
          case 'analogy_equation':
            return <AnalogyEquationSection key={key} data={section} />;
          case 'highlight_card':
            return <HighlightCardSection key={key} data={section} />;
          case 'formula_definition':
            return <FormulaDefinitionSection key={key} data={section} />;
          case 'scenario_comparison':
            return <ScenarioComparisonSection key={key} data={section} />;
          case 'numeric_simulation':
            return <NumericSimulationSection key={key} data={section} />;
          case 'funnel_flow':
            return <FunnelFlowSection key={key} data={section} />;
          case 'quote_reflection':
            return <QuoteReflectionSection key={key} data={section} />;
          case 'metaphor_diagram':
            return <MetaphorDiagramSection key={key} data={section} />;
          case 'before_after_transform':
            return <BeforeAfterTransformSection key={key} data={section} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
