import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { ActionSectionData } from '@/types/diagram';
import { FormattedText, Icon, resolveColor } from './content-common';

export function ActionSection({ data }: { data: ActionSectionData }) {
  const accentColor = resolveColor(data.accentColor);
  return (
    <div className='relative'>
      <div className='relative w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12 z-10'>
        <div className='text-center flex justify-center sm:block'>
          <Card className='inline-block shadow-xl w-full sm:max-w-3xl mx-1 sm:mx-auto overflow-hidden bg-background border-4 border-primary'>
            <div className='p-4 sm:p-6 bg-background'>
              <Badge
                className='px-3 sm:px-4 py-2 font-bold text-sm sm:text-lg mb-4'
                style={{
                  backgroundColor: accentColor,
                }}
              >
                <Icon
                  name='check'
                  size={20}
                  className='mr-1 sm:mr-2'
                  color='currentColor'
                />
                Next Actions
              </Badge>
              <div className='flex items-center justify-center'>
                <h3 className='text-foreground font-bold text-center text-xl sm:text-2xl lg:text-3xl leading-tight'>
                  {data.title}
                </h3>
              </div>
            </div>

            <div className='p-4 sm:p-6 lg:p-8 bg-background'>
              <p className='text-sm sm:text-lg lg:text-xl text-foreground/90 leading-relaxed mb-6 font-medium'>
                <FormattedText text={data.mainText} />
              </p>

              <Card className='bg-muted/50 p-6 border-2 border-dashed border-primary mb-6 shadow-none'>
                <h4 className='font-bold text-base sm:text-lg mb-4 flex items-center text-primary'>
                  <Icon name='pen' size={24} className='mr-1 sm:mr-2' />
                  {data.actionStepsTitle}
                </h4>
                <div className='space-y-3'>
                  {data.actionSteps.map((step, i) => (
                    <Card
                      key={i}
                      className='bg-background p-4 rounded-sm border-0 border-l-4 border-l-primary text-left shadow-none'
                    >
                      <p className='font-bold text-sm sm:text-base mb-2 text-primary'>
                        {step.title}
                      </p>
                      <p className='text-xs sm:text-sm text-foreground/90'>
                        {step.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </Card>

              <Card className='p-4 sm:p-5 rounded-md mb-6 border-0 border-l-4 border-l-primary bg-muted shadow-none'>
                <p className='text-sm sm:text-base text-foreground/90 leading-relaxed'>
                  <strong className='text-primary'>ポイント:</strong>
                  {data.pointText}
                </p>
              </Card>

              <Card className='mt-6 p-4 text-center bg-primary border-primary shadow-none'>
                <p className='font-bold text-lg text-white dark:text-background'>
                  {data.footerText}
                </p>
                <p className='text-sm mt-2 text-white dark:text-background'>
                  {data.subFooterText}
                </p>
              </Card>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
