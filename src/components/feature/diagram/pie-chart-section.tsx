import type { PieChartSectionData } from '@/types/diagram';
import { FormattedText, Icon } from './content-common';

export function PieChartSection({ data }: { data: PieChartSectionData }) {
  const total = data.segments.reduce((sum, s) => sum + s.value, 0);
  const size = 400;
  const center = size / 2;
  const radius = 180;

  // 各セグメントのパスとラベル位置を計算
  let currentAngle = -90; // 12時の位置から開始

  const segmentData = data.segments.map((segment, index) => {
    const angle = (segment.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // SVGアークのパス計算
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    // ラベル位置(セグメント中央)
    const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
    const labelRadius = radius * 0.6;
    const labelX = center + labelRadius * Math.cos(midAngle);
    const labelY = center + labelRadius * Math.sin(midAngle);

    return { path, labelX, labelY, segment, index };
  });

  return (
    <div className='bg-muted'>
      <div className='w-full sm:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12'>
        <div className='mx-auto w-full sm:max-w-6xl text-center'>
          {/* タイトル */}
          <div className='flex flex-col sm:flex-row items-center justify-center mb-8'>
            <Icon
              name={data.icon ?? 'pieChart'}
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

          {/* 円グラフ */}
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className='w-80 h-80 sm:w-96 sm:h-96 mx-auto'
            role='img'
            aria-labelledby='pie-chart-title'
          >
            <title id='pie-chart-title'>{data.title}</title>
            {segmentData.map(({ path, labelX, labelY, segment, index }) => (
              <g key={index}>
                {/* セグメント */}
                <path d={path} className={`pie-segment-${index + 1}`} />

                {/* ラベル */}
                <text
                  x={labelX}
                  y={labelY - 8}
                  textAnchor='middle'
                  className='fill-white text-sm font-bold'
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {segment.label}
                </text>
                <text
                  x={labelX}
                  y={labelY + 12}
                  textAnchor='middle'
                  className='fill-white text-lg font-bold'
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {segment.value}%
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
