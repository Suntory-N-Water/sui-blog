import { Card } from '@/components/ui/card';
import type { ProblemSectionData } from '@/types/diagram';
import { FormattedText, Icon, resolveColor } from './content-common';

export function ProblemSection({ data }: { data: ProblemSectionData }) {
  const variant = data.variant ?? 'simple';
  const isHighlight = variant === 'highlight';

  // 2枚→2列、3枚→3列、4枚→2列(2x2)、5枚以上→3列
  const gridCols =
    data.cards.length === 2 || data.cards.length === 4
      ? 'md:grid-cols-2'
      : 'md:grid-cols-3';

  // 外枠のスタイル: highlight版は枠線付き、simple版は背景色のみ
  const containerClass = isHighlight
    ? 'bg-background border-4 border-primary'
    : 'bg-muted';

  return (
    <div className={containerClass}>
      <div className='w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='p-4 sm:p-6 mx-auto w-full sm:max-w-6xl text-center'>
          <div className='flex flex-col sm:flex-row items-center justify-center mb-8'>
            <Icon
              name={data.icon ?? 'alert'}
              size={40}
              className='mb-2 sm:mb-0 sm:mr-4 text-primary'
            />
            <h2 className='font-bold text-2xl sm:text-2xl lg:text-4xl text-center text-primary mb-0'>
              {data.title}
            </h2>
          </div>

          <p className='text-base sm:text-lg lg:text-xl w-full sm:max-w-5xl mx-auto leading-relaxed font-medium mb-8 text-foreground'>
            <FormattedText text={data.introText} />
          </p>

          <div className={`grid grid-cols-1 ${gridCols} gap-6 mb-8`}>
            {data.cards.map((card, i) => {
              const color = resolveColor(card.accentColor);
              return (
                <Card
                  key={i}
                  className={`bg-background p-6 rounded-sm border-2 shadow-none ${card.isHighlight ? 'border-primary' : 'border-border'}`}
                  style={{
                    borderColor: color,
                  }}
                >
                  <div className='flex items-center justify-center mb-4'>
                    <Icon
                      name={card.icon}
                      size={32}
                      className={`mr-1 sm:mr-3 ${card.isHighlight ? 'text-primary' : 'text-muted-foreground'}`}
                      style={{
                        color,
                      }}
                    />
                    <h3
                      className={`text-base sm:text-lg font-bold ${card.isHighlight ? 'text-primary' : 'text-muted-foreground'}`}
                      style={{
                        color,
                      }}
                    >
                      {card.title}
                    </h3>
                  </div>
                  <p className='leading-relaxed font-medium mb-3 text-sm sm:text-base text-foreground'>
                    {card.subtitle}
                  </p>
                  <div
                    className={`p-4 rounded-lg ${card.isHighlight ? 'bg-muted' : 'bg-muted/50'}`}
                  >
                    <p
                      className={`text-sm leading-relaxed ${card.isHighlight ? 'text-primary' : 'text-muted-foreground'}`}
                      style={{
                        color,
                      }}
                    >
                      <FormattedText text={card.description} />
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          {(data.summaryTitle || data.summaryText) && (
            <Card className='bg-background p-6 sm:p-8 rounded-sm border-2 border-primary shadow-none'>
              {data.summaryTitle && (
                <p className='text-lg sm:text-xl font-bold mb-4 text-primary'>
                  {data.summaryTitle}
                </p>
              )}
              {data.summaryText && (
                <p className='text-sm sm:text-base leading-relaxed text-foreground'>
                  <FormattedText text={data.summaryText} />
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
