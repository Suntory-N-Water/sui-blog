import { Card } from '@/components/ui/card';
import type { NumericSimulationSectionData } from '@/types/diagram';
import { FormattedText, Icon, resolveColor } from './content-common';

export function NumericSimulationSection({
  data,
}: {
  data: NumericSimulationSectionData;
}) {
  return (
    <div className='bg-muted'>
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

          <div className='space-y-6'>
            {data.items.map((item, i) => {
              const color = resolveColor(item.accentColor);
              return (
                <Card
                  key={i}
                  className='bg-background border-2 border-border p-6 shadow-none'
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-bold text-base sm:text-lg text-foreground'>
                      {item.label}
                    </span>
                    <span
                      className='text-2xl sm:text-3xl font-bold'
                      style={{ color }}
                    >
                      {item.value}
                    </span>
                  </div>

                  {item.description && (
                    <p className='text-sm text-muted-foreground mt-1 text-left'>
                      <FormattedText text={item.description} />
                    </p>
                  )}

                  <div className='bg-muted rounded-full h-4 w-full mt-3'>
                    <div
                      className='rounded-full h-4 transition-all duration-1000 ease-out'
                      style={{
                        width: `${item.barPercentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </Card>
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
