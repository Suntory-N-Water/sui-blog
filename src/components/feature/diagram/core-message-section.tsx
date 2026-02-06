import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { CoreMessageSectionData } from '@/types/diagram';
import { FormattedText, Icon, resolveColor } from './content-common';

export function CoreMessageSection({ data }: { data: CoreMessageSectionData }) {
  const variant = data.variant ?? 'highlight';
  const isHighlight = variant === 'highlight';
  const badgeColor = data.coreHighlight?.accentColor
    ? resolveColor(data.coreHighlight.accentColor)
    : undefined;

  // 外枠のスタイル: highlight版は太い枠線、simple版は背景色のみ
  const containerClass = isHighlight
    ? 'bg-background relative border-4 border-primary'
    : 'bg-muted';

  return (
    <div className={containerClass}>
      <div className='relative w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='p-4 sm:p-6 mx-auto w-full sm:max-w-5xl text-center mb-8'>
          {/* バッジ: highlight版のみ表示 */}
          {isHighlight && (
            <div className='mb-4'>
              <Badge
                className='px-4 py-2 mb-3 text-sm font-bold uppercase tracking-wider'
                style={{
                  backgroundColor: badgeColor,
                }}
              >
                CORE MESSAGE
              </Badge>
            </div>
          )}

          {/* タイトル + アイコン */}
          <div className='flex flex-col sm:flex-row items-center justify-center mb-6'>
            {data.icon && (
              <Icon
                name={data.icon}
                size={40}
                className='mb-2 sm:mb-0 sm:mr-4 text-primary'
              />
            )}
            <h2 className='font-bold text-2xl sm:text-2xl lg:text-4xl text-center text-primary mb-0'>
              {data.title}
            </h2>
          </div>

          {/* メインメッセージ */}
          <p className='text-base sm:text-lg lg:text-xl w-full sm:max-w-4xl mx-auto leading-relaxed font-medium mb-8 text-foreground'>
            <FormattedText text={data.mainMessage} />
          </p>

          {/* 比較カード(オプション) */}
          {data.comparisons && (
            <div className='grid md:grid-cols-2 gap-6 mb-8'>
              {data.comparisons.map((item, i) => (
                <Card
                  key={i}
                  className={`p-6 border-2 shadow-none ${item.isGood ? 'bg-muted border-primary' : 'bg-muted/50 border-border'}`}
                >
                  <div className='flex items-center justify-center mb-4'>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3 ${item.isGood ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground text-white'}`}
                    >
                      <Icon name={item.isGood ? 'zap' : 'alert'} size={20} />
                    </div>
                    <p
                      className={`font-bold text-base sm:text-lg ${item.isGood ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {item.title}
                    </p>
                  </div>
                  <p
                    className={`text-sm sm:text-base leading-relaxed ${item.isGood ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <FormattedText text={item.text} />
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* コアハイライト(オプション) */}
          {data.coreHighlight && (
            <Card
              className={
                isHighlight
                  ? 'text-primary-foreground p-6 sm:p-8 bg-primary border-primary shadow-none'
                  : 'p-6 sm:p-8 bg-background border-2 border-primary shadow-none'
              }
            >
              <p
                className={`text-xl sm:text-2xl lg:text-3xl font-bold leading-relaxed mb-4 ${isHighlight ? 'text-primary-foreground' : 'text-primary'}`}
              >
                {data.coreHighlight.title}
              </p>
              <p
                className={`sm:text-lg ${isHighlight ? 'text-primary-foreground/80' : 'text-foreground'}`}
              >
                <FormattedText text={data.coreHighlight.text} />
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
