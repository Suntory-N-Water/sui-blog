import { Card } from '@/components/ui/card';
import type { BeforeAfterTransformSectionData } from '@/types/diagram';
import { FormattedText, Icon } from './content-common';

export function BeforeAfterTransformSection({
  data,
}: {
  data: BeforeAfterTransformSectionData;
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

          <div className='space-y-4'>
            {data.items.map((item, i) => (
              <Card
                key={i}
                className='bg-background border-2 border-border p-4 sm:p-6 shadow-none'
              >
                {/* ドメイン + アイコン */}
                <div className='flex items-center gap-2 mb-3'>
                  {item.icon && (
                    <Icon name={item.icon} size={24} className='text-primary' />
                  )}
                  <p className='font-bold text-primary text-sm sm:text-base'>
                    {item.domain}
                  </p>
                </div>

                {/* Before → After */}
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3'>
                  <div className='bg-muted/50 rounded-lg p-3 sm:flex-1 text-center'>
                    <p className='text-sm text-muted-foreground'>
                      <FormattedText text={item.before} />
                    </p>
                  </div>
                  <Icon
                    name='arrowRight'
                    size={20}
                    className='text-primary shrink-0 self-center rotate-90 sm:rotate-0'
                  />
                  <div className='bg-primary/10 rounded-lg p-3 sm:flex-1 text-center'>
                    <p className='text-sm font-medium text-primary'>
                      <FormattedText text={item.after} />
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {data.summaryText && (
            <Card className='mt-8 bg-muted border-2 border-primary shadow-none p-6 sm:p-8'>
              <p className='text-lg sm:text-xl font-bold text-primary'>
                <FormattedText text={data.summaryText} />
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
