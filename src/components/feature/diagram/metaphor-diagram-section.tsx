import { Card } from '@/components/ui/card';
import type { MetaphorDiagramSectionData } from '@/types/diagram';
import { FormattedText, Icon } from './content-common';

export function MetaphorDiagramSection({
  data,
}: {
  data: MetaphorDiagramSectionData;
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

          {/* メタファーのコアCard */}
          <Card className='bg-muted border-2 border-primary p-6 sm:p-8 mb-8 shadow-none'>
            <p className='text-2xl sm:text-3xl font-bold text-foreground'>
              {data.metaphor}
            </p>
            {data.metaphorDescription && (
              <p className='text-base text-muted-foreground mt-2'>
                <FormattedText text={data.metaphorDescription} />
              </p>
            )}
          </Card>

          {/* パーツグリッド */}
          <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {data.parts.map((part, i) => (
              <Card
                key={i}
                className='bg-background border-2 border-border p-4 shadow-none text-left'
              >
                <div className='flex items-center gap-2'>
                  {part.icon && (
                    <Icon name={part.icon} size={24} className='text-primary' />
                  )}
                  <p className='font-bold text-primary text-base'>
                    {part.partName}
                  </p>
                </div>
                <p className='text-sm text-muted-foreground mt-2'>
                  <FormattedText text={part.meaning} />
                </p>
              </Card>
            ))}
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
