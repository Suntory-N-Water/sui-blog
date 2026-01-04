import { Card } from '@/components/ui/card';
import type { ScoreComparisonSectionData } from '@/types/diagram';
import { Icon, resolveColor } from './content-common';

export function ScoreComparisonSection({
  data,
}: {
  data: ScoreComparisonSectionData;
}) {
  return (
    <div className='bg-muted'>
      <div className='w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='p-4 sm:p-6 mx-auto w-full sm:max-w-6xl text-center'>
          <div className='flex flex-col sm:flex-row items-center justify-center mb-8'>
            <Icon
              name='users'
              size={40}
              className='mb-2 sm:mb-0 sm:mr-4 text-primary'
            />
            <h2 className='font-bold text-2xl sm:text-2xl lg:text-4xl text-center text-primary mb-0'>
              {data.title}
            </h2>
          </div>

          {data.introText && (
            <p className='text-lg sm:text-xl font-bold mb-6 text-primary'>
              {data.introText}
            </p>
          )}

          <div className='grid md:grid-cols-2 gap-8'>
            {data.scores.map((item, i) => {
              const color = resolveColor(item.accentColor);
              return (
                <Card
                  key={i}
                  className='bg-background p-6 border-2 border-border shadow-none'
                >
                  <div className='flex items-center justify-center mb-4'>
                    <h3 className='font-bold text-lg text-muted-foreground'>
                      {item.title}
                    </h3>
                  </div>
                  <div className='flex items-center justify-center mb-4'>
                    <div
                      className='text-5xl sm:text-6xl font-bold'
                      style={{
                        color,
                      }}
                    >
                      {item.value}
                    </div>
                    <span
                      className='text-2xl ml-2'
                      style={{
                        color,
                      }}
                    >
                      {item.unit}
                    </span>
                  </div>
                  {item.description && (
                    <p className='text-sm font-bold text-muted-foreground'>
                      {item.description}
                    </p>
                  )}

                  <div className='mt-4 bg-muted rounded-full h-4 w-full'>
                    <div
                      className='rounded-full h-4 transition-all duration-1000 ease-out'
                      style={{
                        width: `${item.barPercentage}%`,
                        backgroundColor: color,
                      }}
                    ></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
