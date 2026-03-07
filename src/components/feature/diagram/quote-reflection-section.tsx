import type { QuoteReflectionSectionData } from '@/types/diagram';
import { FormattedText, Icon } from './content-common';

export function QuoteReflectionSection({
  data,
}: {
  data: QuoteReflectionSectionData;
}) {
  return (
    <div>
      {/* 上段(引用) */}
      <div className='bg-primary'>
        <div className='w-full sm:max-w-7xl mx-auto p-8 sm:p-12'>
          <div className='mx-auto w-full sm:max-w-4xl text-center'>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              {data.icon && (
                <Icon
                  name={data.icon}
                  size={32}
                  className='text-primary-foreground/60 shrink-0'
                />
              )}
              <p className='text-xl sm:text-2xl lg:text-3xl font-bold text-primary-foreground leading-relaxed'>
                <FormattedText text={data.quote} />
              </p>
            </div>
            {data.source && (
              <p className='text-sm text-primary-foreground/60 mt-4'>
                — {data.source}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 下段(リフレクション) */}
      <div className='bg-background'>
        <div className='w-full sm:max-w-7xl mx-auto p-8 sm:p-12'>
          <div className='mx-auto w-full max-w-4xl text-center'>
            <p className='text-base sm:text-lg leading-relaxed text-foreground'>
              <FormattedText text={data.reflection} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
