import React from 'react';
import { View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { AppText } from '@/components/AppText';

type TPieDatum = {
  value: number;
  color: string;
  text?: string;
  label?: string;
};

type TCategoryPieChartProps = {
  data: TPieDatum[];
  total: number;
};

const CategoryPieChart = ({ data, total }: TCategoryPieChartProps) => {
  return (
    <PieChart
      data={data}
      donut
      radius={100}
      innerRadius={60}
      centerLabelComponent={() => (
        <View className="items-center">
          <AppText className="text-lg font-semibold text-gray-900">LKR {total.toFixed(0)}</AppText>
          <AppText className="text-sm text-gray-500 mt-1">Total</AppText>
        </View>
      )}
      isAnimated
      animationDuration={800}
    />
  );
};

export default CategoryPieChart;
