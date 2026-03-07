import { Fragment } from 'react';
import { Card } from '@/components/ui/card';
import type { FunnelFlowSectionData } from '@/types/diagram';
import { FormattedText, Icon, resolveColor } from './content-common';

export function FunnelFlowSection({ data }: { data: FunnelFlowSectionData }) {
  return (
    <div className='bg-muted'>
      <style
        dangerouslySetInnerHTML={{
          __html: data.stages
            .map(
              (stage, i) =>
                `@media (min-width: 640px) { .funnel-stage-${i} { width: ${stage.widthPercent}%; } }`,
            )
            .join('\n'),
        }}
      />
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

          <div className='flex flex-col items-center gap-4'>
            {data.stages.map((stage, i) => {
              const isLast = i === data.stages.length - 1;
              const color = resolveColor(stage.accentColor);
              const isAccented = isLast || stage.accentColor;

              return (
                <Fragment key={i}>
                  <Card
                    className={`funnel-stage-${i} w-full p-4 sm:p-6 shadow-none ${
                      isAccented
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-2 border-border'
                    }`}
                    style={
                      color
                        ? { backgroundColor: color, borderColor: color }
                        : undefined
                    }
                  >
                    <p
                      className={`font-bold ${
                        isAccented
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {stage.label}
                    </p>
                    {stage.value && (
                      <p
                        className={`text-xl font-bold ${
                          isAccented
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {stage.value}
                      </p>
                    )}
                    {stage.description && (
                      <p
                        className={`text-sm ${
                          isAccented
                            ? 'text-primary-foreground/90'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {stage.description}
                      </p>
                    )}
                  </Card>

                  {!isLast && (
                    <div className='text-primary'>
                      <Icon name='arrowDown' size={24} />
                    </div>
                  )}
                </Fragment>
              );
            })}
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
