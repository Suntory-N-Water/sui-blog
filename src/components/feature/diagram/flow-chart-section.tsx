import React from 'react';
import { Card } from '@/components/ui/card';
import type { FlowChartSectionData } from '@/types/diagram';
import { Icon, resolveColor } from './content-common';

export function FlowChartSection({ data }: { data: FlowChartSectionData }) {
  return (
    <div className='bg-muted'>
      <div className='w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='p-4 sm:p-6 mx-auto w-full sm:max-w-6xl text-center'>
          {data.title && (
            <p className='text-lg sm:text-xl font-bold mb-6 text-primary'>
              {data.title}
            </p>
          )}

          <div className='flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8'>
            {data.flows.map((item, i) => {
              const isLast = i === data.flows.length - 1;
              const color = resolveColor(item.accentColor);

              return (
                <React.Fragment key={i}>
                  <Card
                    className={`p-4 sm:p-6 w-full lg:w-auto shadow-none ${
                      item.highlight
                        ? 'bg-primary border-primary'
                        : 'bg-background border-2'
                    }`}
                    style={{
                      borderColor: item.highlight ? undefined : color,
                    }}
                  >
                    <p
                      className={`font-bold mb-2 ${item.highlight ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                      {item.label}
                    </p>
                    {item.subLabel && (
                      <p
                        className={`text-sm ${item.highlight ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}
                      >
                        {item.subLabel}
                      </p>
                    )}
                  </Card>

                  {!isLast && (
                    <div className='text-primary'>
                      <Icon
                        name='arrowRight'
                        size={32}
                        className='rotate-90 lg:rotate-0'
                      />
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
