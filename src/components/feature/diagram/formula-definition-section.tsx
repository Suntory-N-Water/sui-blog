import { Card } from '@/components/ui/card';
import type { FormulaDefinitionSectionData } from '@/types/diagram';
import { FormattedText, Icon } from './content-common';

export function FormulaDefinitionSection({
  data,
}: {
  data: FormulaDefinitionSectionData;
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

          {/* 数式カード */}
          <Card className='bg-muted border-2 border-primary shadow-none p-6 sm:p-8 mb-8'>
            <p className='text-xl sm:text-2xl lg:text-3xl font-mono font-bold text-foreground'>
              {data.formula}
            </p>
          </Card>

          {/* 変数一覧 */}
          {data.variables && data.variables.length > 0 && (
            <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
              {data.variables.map((v, i) => (
                <Card
                  key={i}
                  className='bg-background border-2 border-border shadow-none p-4'
                >
                  <p className='font-mono font-bold text-primary text-lg mb-1'>
                    {v.symbol}
                  </p>
                  <p className='text-sm text-muted-foreground'>{v.label}</p>
                </Card>
              ))}
            </div>
          )}

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
