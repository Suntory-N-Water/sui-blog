import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { StepsSectionData } from '@/types/diagram';
import { FormattedText, Icon } from './content-common';

export function StepsSection({ data }: { data: StepsSectionData }) {
  return (
    <div className='bg-muted'>
      <div className='w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='p-4 sm:p-6 mx-auto w-full sm:max-w-6xl text-center'>
          <div className='flex flex-col sm:flex-row items-center justify-center mb-8'>
            <Icon
              name='search'
              size={40}
              className='mb-2 sm:mb-0 sm:mr-4 text-primary'
            />
            <h2 className='font-bold text-2xl sm:text-2xl lg:text-4xl text-center text-primary mb-0'>
              {data.title}
            </h2>
          </div>

          <p className='text-base sm:text-lg lg:text-xl w-full sm:max-w-5xl mx-auto leading-relaxed font-medium mb-8 text-foreground'>
            <FormattedText text={data.introText} />
          </p>

          <div className='flex flex-col items-center space-y-6'>
            {data.steps.map((step, i) => {
              const isLast = i === data.steps.length - 1;
              const isHighlight = isLast;

              return (
                <React.Fragment key={i}>
                  <Card
                    className={`w-full p-6 sm:p-8 shadow-none ${isHighlight ? 'bg-primary border-primary' : 'bg-background border-2 border-primary'}`}
                  >
                    <div className='flex items-center justify-center mb-4'>
                      <Badge
                        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold mr-3 text-lg px-0 py-0 ${isHighlight ? 'bg-background text-primary' : 'bg-primary text-primary-foreground'}`}
                      >
                        {step.number}
                      </Badge>
                      <h3
                        className={`font-bold text-lg sm:text-xl ${isHighlight ? 'text-primary-foreground' : 'text-primary'}`}
                      >
                        {step.title}
                      </h3>
                    </div>

                    <p
                      className={`text-sm sm:text-base leading-relaxed mb-4 ${isHighlight ? 'text-primary-foreground/90' : 'text-foreground'}`}
                    >
                      {step.text}
                    </p>

                    {(step.details || step.detailText) && (
                      <div
                        className={`p-4 rounded-lg text-left ${isHighlight ? 'bg-background/10' : 'bg-muted'}`}
                      >
                        {step.detailTitle && (
                          <p
                            className={`text-sm sm:text-base font-bold mb-3 ${isHighlight ? 'text-primary-foreground' : 'text-primary'}`}
                          >
                            {step.detailTitle}
                          </p>
                        )}

                        {step.details && (
                          <div className='space-y-2'>
                            {step.details.map((detail, k) => (
                              <div key={k} className='flex items-start'>
                                <span
                                  className={`w-2 h-2 rounded-full mr-3 mt-2 shrink-0 ${isHighlight ? 'bg-background' : 'bg-primary'}`}
                                ></span>
                                <p
                                  className={`text-sm sm:text-base ${isHighlight ? 'text-primary-foreground/90' : 'text-foreground'}`}
                                >
                                  {detail}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {step.detailText && (
                          <p
                            className={`text-sm sm:text-base leading-relaxed ${isHighlight ? 'text-primary-foreground/90' : 'text-foreground'}`}
                          >
                            <FormattedText text={step.detailText} />
                          </p>
                        )}
                      </div>
                    )}
                  </Card>

                  {!isLast && (
                    <div className='text-primary'>
                      <Icon name='arrow' size={32} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
