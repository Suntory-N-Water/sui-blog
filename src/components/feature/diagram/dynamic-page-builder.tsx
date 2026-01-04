import type { ArticleSection } from '@/types/diagram';
import { ActionSection } from './action-section';
import { CoreMessageSection } from './core-message-section';
import { FlowChartSection } from './flow-chart-section';
import { GroupedContentSection } from './grouped-content-section';
import { HeroSection } from './hero-section';
import { ListStepsSection } from './list-steps-section';
import { ProblemSection } from './problem-section';
import { ScoreComparisonSection } from './score-comparison-section';
import { StepsSection } from './steps-section';
import { TransitionSection } from './transition-section';

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
          default:
            return null;
        }
      })}
    </div>
  );
}
