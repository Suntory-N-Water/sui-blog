import type { GroupedContentSectionData } from '@/types/diagram';
import { FormattedText, Icon, resolveColor } from './content-common';

export function GroupedContentSection({
  data,
}: {
  data: GroupedContentSectionData;
}) {
  // セクション全体の背景色
  const sectionBgClass =
    data.sectionBgColor === 'white' ? 'bg-background' : 'bg-muted';

  return (
    <div className={sectionBgClass}>
      <div className='w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='p-4 sm:p-6 mx-auto w-full sm:max-w-6xl text-center'>
          <div className='flex flex-col sm:flex-row items-center justify-center mb-8'>
            <Icon
              name={data.icon || 'lightbulb'}
              size={40}
              className='mb-2 sm:mb-0 sm:mr-4 text-primary'
            />
            <h2 className='font-bold text-2xl sm:text-2xl lg:text-4xl text-center text-primary mb-0'>
              {data.title}
            </h2>
          </div>

          {data.introText && (
            <p className='text-base sm:text-lg lg:text-xl w-full sm:max-w-5xl mx-auto leading-relaxed font-medium mb-8 text-foreground'>
              <FormattedText text={data.introText} />
            </p>
          )}

          <div className='space-y-8'>
            {data.groups.map((group, i) => {
              // グループの背景色
              const groupBgClass =
                group.bgColor === 'muted' ? 'bg-muted' : 'bg-background';

              // グループの枠線(ハイライト指定があればprimaryカラー)
              const borderClass = group.isHighlight
                ? 'border-primary'
                : 'border-primary'; // HTMLのデザインに合わせて基本はprimary、必要に応じて調整

              return (
                <div
                  key={i}
                  className={`${groupBgClass} p-6 sm:p-8 rounded-lg border-2 ${borderClass}`}
                >
                  {group.title && (
                    <p className='text-lg sm:text-xl font-bold mb-4 text-primary'>
                      {group.title}
                    </p>
                  )}

                  {group.description && (
                    <p className='text-sm sm:text-base text-foreground leading-relaxed mb-6'>
                      <FormattedText text={group.description} />
                    </p>
                  )}

                  <div
                    className={`grid grid-cols-1 ${
                      group.cards.length === 2
                        ? 'md:grid-cols-2'
                        : 'md:grid-cols-3'
                    } gap-4 ${group.footerText ? 'mb-6' : ''}`}
                  >
                    {group.cards.map((card, j) => {
                      const accentColor = resolveColor(card.accentColor);
                      const cardBgClass =
                        card.bgColor === 'muted'
                          ? 'bg-muted'
                          : card.bgColor === 'white'
                            ? 'bg-background'
                            : 'bg-muted/50'; // ダークモード対応のデフォルト背景

                      const cardBorderClass = card.isHighlight
                        ? 'border-primary'
                        : 'border-border'; // 通常時はグレー、ハイライト時はprimary

                      return (
                        <div
                          key={j}
                          className={`${cardBgClass} p-4 rounded-lg border-2 ${cardBorderClass} text-left`}
                          style={{
                            borderColor: accentColor,
                          }}
                        >
                          <p
                            className={`font-bold mb-2 ${
                              card.isHighlight
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                            style={{ color: accentColor }}
                          >
                            {card.title}
                          </p>

                          <div
                            className={`text-xs sm:text-sm ${
                              card.isHighlight
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                            style={{ color: accentColor }}
                          >
                            <FormattedText text={card.text} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {group.footerText && (
                    <p className='text-sm sm:text-base mt-2 text-foreground font-medium'>
                      <FormattedText text={group.footerText} />
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
