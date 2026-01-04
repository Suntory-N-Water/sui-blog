import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { ListStepsSectionData } from '@/types/diagram';
import { FormattedText, Icon } from './content-common';

export function ListStepsSection({ data }: { data: ListStepsSectionData }) {
  return (
    <div className='bg-muted'>
      <div className='w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='p-4 sm:p-6 mx-auto w-full sm:max-w-6xl text-center'>
          <div className='flex flex-col sm:flex-row items-center justify-center mb-8'>
            <Icon
              name='check'
              size={40}
              className='mb-2 sm:mb-0 sm:mr-4 text-primary'
            />
            <h2 className='font-bold text-2xl sm:text-2xl lg:text-4xl text-center text-primary mb-0'>
              {data.title}
            </h2>
          </div>

          {data.introText && (
            <p className='text-base sm:text-lg lg:text-xl w-full sm:max-w-5xl mx-auto leading-relaxed font-medium mb-8 text-foreground'>
              <FormattedText text={data.introText} />
            </p>
          )}

          <div className='flex flex-col justify-center items-center space-y-6 w-full sm:max-w-4xl mx-auto mb-8'>
            {data.steps.map((step, i) => (
              <Card
                key={i}
                className='w-full p-4 sm:p-6 bg-background border-2 border-primary shadow-none'
              >
                <div className='flex items-start'>
                  <Badge className='flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg mr-4 shrink-0 px-0 py-0'>
                    {step.badge}
                  </Badge>
                  <div className='text-left w-full'>
                    <p className='text-sm sm:text-base font-bold mb-2 text-primary'>
                      {step.title}
                    </p>
                    {step.subtitle && (
                      <p className='text-xs sm:text-sm text-muted-foreground mb-2'>
                        {step.subtitle}
                      </p>
                    )}
                    <div className='bg-muted p-3 rounded-lg'>
                      <p className='text-xs sm:text-sm text-primary'>
                        <FormattedText text={step.description} />
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {(data.summaryTitle || data.summaryText) && (
            <Card className='bg-background p-6 sm:p-8 rounded-sm border-2 border-primary shadow-none'>
              {data.summaryTitle && (
                <p className='text-lg sm:text-xl font-bold mb-4 text-primary'>
                  {data.summaryTitle}
                </p>
              )}
              {data.summaryText && (
                <p className='text-sm sm:text-base leading-relaxed text-foreground'>
                  <FormattedText text={data.summaryText} />
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
