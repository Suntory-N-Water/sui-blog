import { Card } from '@/components/ui/card';
import type { AnalogyEquationSectionData } from '@/types/diagram';
import { FormattedText, Icon } from './content-common';

export function AnalogyEquationSection({
  data,
}: {
  data: AnalogyEquationSectionData;
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

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8'>
            {/* 左カード */}
            <Card className='bg-background border-2 border-border shadow-none p-6 sm:p-8 flex-1 w-full sm:w-auto text-center'>
              <p className='font-bold text-xl sm:text-2xl lg:text-3xl text-foreground mb-2'>
                {data.leftLabel}
              </p>
              {data.leftDescription && (
                <p className='text-sm sm:text-base text-muted-foreground'>
                  <FormattedText text={data.leftDescription} />
                </p>
              )}
            </Card>

            {/* 演算子 */}
            <span className='text-4xl sm:text-6xl font-bold text-primary'>
              {data.operator}
            </span>

            {/* 右カード */}
            <Card className='bg-primary border-primary shadow-none p-6 sm:p-8 flex-1 w-full sm:w-auto text-center'>
              <p className='font-bold text-xl sm:text-2xl lg:text-3xl text-primary-foreground mb-2'>
                {data.rightLabel}
              </p>
              {data.rightDescription && (
                <p className='text-sm sm:text-base text-primary-foreground/80'>
                  <FormattedText text={data.rightDescription} />
                </p>
              )}
            </Card>
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
