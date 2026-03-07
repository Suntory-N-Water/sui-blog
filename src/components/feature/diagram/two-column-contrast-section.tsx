import { Card } from '@/components/ui/card';
import type { TwoColumnContrastSectionData } from '@/types/diagram';
import { FormattedText, Icon, resolveColor } from './content-common';

export function TwoColumnContrastSection({
  data,
}: {
  data: TwoColumnContrastSectionData;
}) {
  const columns = [data.left, data.right] as const;

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

          <div className='grid md:grid-cols-2 gap-6'>
            {columns.map((col, i) => {
              const color = resolveColor(col.accentColor);
              const borderColor = color ?? (i === 0 ? '#64748b' : undefined);

              return (
                <Card
                  key={i}
                  className={`p-6 sm:p-8 shadow-none text-left ${
                    i === 1
                      ? 'bg-primary border-primary'
                      : 'bg-background border-2'
                  }`}
                  style={{
                    borderColor: i === 0 ? borderColor : undefined,
                  }}
                >
                  <div className='flex items-center mb-4'>
                    {col.icon && (
                      <Icon
                        name={col.icon}
                        size={24}
                        className={`mr-3 ${i === 1 ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                      />
                    )}
                    <h3
                      className={`font-bold text-lg sm:text-xl ${
                        i === 1
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {col.title}
                    </h3>
                  </div>
                  <p
                    className={`text-sm sm:text-base leading-relaxed ${
                      i === 1
                        ? 'text-primary-foreground/90'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <FormattedText text={col.text} />
                  </p>
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
