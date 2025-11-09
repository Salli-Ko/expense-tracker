import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import CategoryPieChart from '@/components/charts-screen/charts/CategoryPieChart';
import CategoryCard from '@/components/charts-screen/cards/CategoryCard';
import { CATEGORY_COLORS, CATEGORY_PROGRESS_COLORS } from '@/constants/categoryColors';
import { formatCurrency } from '@/util/common-utils';
import { TCategoryData } from '@/util/chart-utils';

type TCategoryBreakdownSectionProps = {
  categoryData: TCategoryData[];
  categoryPieData: any[];
  totalSpending: number;
};

export const CategoryBreakdownSection = ({
  categoryData,
  categoryPieData,
  totalSpending,
}: TCategoryBreakdownSectionProps) => {
  if (categoryData.length === 0)
    return (
      <View className="my-8">
        <AppText className="text-center text-lg text-gray-500">No Category Data Available</AppText>
      </View>
    );

  return (
    <View className="mt-8">
      <AppText className="text-2xl font-semibold text-gray-900 dark:text-white">
        Category Breakdown
      </AppText>

      <View className="my-8 items-center">
        <CategoryPieChart data={categoryPieData} total={totalSpending} />
      </View>

      <View className="mt-4">
        {categoryData.map((category) => {
          const percentage = ((category.total / totalSpending) * 100).toFixed(1);
          const backgroundColor = CATEGORY_COLORS[category.category] || CATEGORY_COLORS['Other'];
          const progressBarColor =
            CATEGORY_PROGRESS_COLORS[category.category] || CATEGORY_PROGRESS_COLORS['Other'];

          return (
            <CategoryCard
              key={category.category}
              title={category.category}
              value={formatCurrency(category.total)}
              transactions={category.count}
              percentage={Number(percentage)}
              backgroundColor={backgroundColor}
              progressBarColor={progressBarColor}
            />
          );
        })}
      </View>
    </View>
  );
};
