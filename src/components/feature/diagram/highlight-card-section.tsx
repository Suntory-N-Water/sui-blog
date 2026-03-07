import { Card } from '@/components/ui/card';
import type { HighlightCardSectionData } from '@/types/diagram';
import { FormattedText, resolveColor } from './content-common';

export function HighlightCardSection({
  data,
}: {
  data: HighlightCardSectionData;
}) {
  const accentBg = resolveColor(data.accentColor);

  return (
    <div className='bg-background'>
      <div className='w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='p-4 sm:p-6 mx-auto w-full sm:max-w-6xl text-center'>
          <Card
            className='bg-muted border-2 border-primary shadow-none p-8 sm:p-12 lg:p-16'
            style={{
              borderColor: accentBg,
            }}
          >
            <p className='text-2xl sm:text-3xl lg:text-4xl font-bold leading-relaxed text-foreground'>
              <FormattedText text={data.phrase} />
            </p>
            {data.subText && (
              <p className='mt-4 text-base sm:text-lg text-muted-foreground'>
                <FormattedText text={data.subText} />
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
