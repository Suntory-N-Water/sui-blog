import { Card } from '@/components/ui/card';
import type { ScenarioComparisonSectionData } from '@/types/diagram';
import { FormattedText, Icon } from './content-common';

export function ScenarioComparisonSection({
  data,
}: {
  data: ScenarioComparisonSectionData;
}) {
  return (
    <div className='bg-background border-4 border-primary'>
      <div className='w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='p-4 sm:p-6 mx-auto w-full sm:max-w-6xl text-center'>
          <div className='flex flex-col sm:flex-row items-center justify-center mb-8'>
            {data.icon && (
              <Icon
                name={data.icon}
                size={40}
                className='mb-2 sm:mb-0 sm:mr-4 text-primary'
              />
            )}
            <h2 className='font-bold text-2xl lg:text-4xl text-center text-primary mb-0'>
              {data.title}
            </h2>
          </div>

          {data.introText && (
            <p className='text-base sm:text-lg lg:text-xl w-full sm:max-w-4xl mx-auto leading-relaxed font-medium mb-8 text-foreground'>
              <FormattedText text={data.introText} />
            </p>
          )}

          <div className='grid md:grid-cols-2 gap-6'>
            {data.scenarios.map((scenario, i) => (
              <Card
                key={i}
                className={`p-6 shadow-none ${
                  scenario.isGood
                    ? 'bg-muted border-primary border-2'
                    : 'bg-muted/50 border-border border-2'
                }`}
              >
                <div className='flex items-center justify-center mb-4'>
                  {scenario.icon && (
                    <Icon
                      name={scenario.icon}
                      size={24}
                      className={`mr-3 ${scenario.isGood ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  )}
                  <h3
                    className={`font-bold text-base sm:text-lg ${
                      scenario.isGood ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {scenario.title}
                  </h3>
                </div>

                <ol className='list-decimal list-inside mb-4 space-y-2'>
                  {scenario.steps.map((step, j) => (
                    <li key={j} className='text-sm sm:text-base text-left'>
                      {step}
                    </li>
                  ))}
                </ol>

                <p
                  className={`font-bold ${
                    scenario.isGood ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {scenario.result}
                </p>
              </Card>
            ))}
          </div>

          {data.summaryText && (
            <p className='mt-8 text-base sm:text-lg font-medium text-foreground'>
              <FormattedText text={data.summaryText} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
