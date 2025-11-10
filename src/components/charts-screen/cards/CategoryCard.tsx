import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';

type TCategoryCardProps = {
  title: string;
  value: string;
  transactions: number;
  percentage: number;
  backgroundColor: string;
  progressBarColor: string;
};

const CategoryCard = ({
  title,
  value,
  transactions,
  percentage,
  backgroundColor,
  progressBarColor,
}: TCategoryCardProps) => (
  <View className="rounded-2xl p-4 mb-3 dark:bg-dark-card" style={{ backgroundColor }}>
    <View className="flex-row justify-between items-center mb-2">
      <AppText className="text-base font-medium text-black dark:text-white">{title}</AppText>
      <AppText className="text-base font-semibold text-black dark:text-white">{value}</AppText>
    </View>

    <View className="w-full h-[6px] bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{
          width: `${percentage}%`,
          backgroundColor: progressBarColor,
        }}
      />
    </View>

    <View className="flex-row justify-between items-center mt-2">
      <AppText className="text-sm text-gray-500 dark:text-dark-text-primary">
        {transactions} {transactions === 1 ? 'Transaction' : 'Transactions'}
      </AppText>
      <AppText className="text-sm text-gray-500 dark:text-dark-text-primary">{percentage}%</AppText>
    </View>
  </View>
);

export default CategoryCard;
