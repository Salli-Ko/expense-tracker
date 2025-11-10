import React from 'react';
import { BarChart } from 'react-native-gifted-charts';
import { formatCompactNumber } from '@/util/common-utils';

export type TBarDatum = {
  value: number;
  label: string;
  frontColor?: string;
  topLabelComponent?: () => React.ReactNode;
};

type TWeeklyBarChartProps = {
  data: TBarDatum[];
};

const WeeklyBarChart = ({ data }: TWeeklyBarChartProps) => {
  const maxVal = Math.max(...data.map((d) => d.value), 0);
  const maxForChart = maxVal * 1.2;

  return (
    <BarChart
      data={data}
      height={220}
      roundedTop
      yAxisThickness={0}
      xAxisThickness={0}
      yAxisTextStyle={{ color: '#9CA3AF', fontSize: 11 }}
      xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 12, fontWeight: '500' }}
      noOfSections={5}
      maxValue={maxForChart}
      isAnimated
      yAxisLabelTexts={Array.from({ length: 6 }).map((_, i) =>
        formatCompactNumber((maxForChart / 5) * i),
      )}
      animationDuration={800}
      yAxisLabelWidth={40}
      barBorderRadius={6}
      frontColor="#5A8F7B"
      showGradient
      gradientColor="#C8E3D3"
      disableScroll
    />
  );
};

export default WeeklyBarChart;
