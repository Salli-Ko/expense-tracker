import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import StatCard from '@/components/StatCard';
import WeeklyBarChart, { TBarDatum } from '@/components/WeeklyBarChart';
import { formatCurrency } from '@/util/common-utils';

type TWeeklySpendingSectionProps = {
  onRefresh: () => void;
  total: number;
  average: number;
  highest: number;
  barData: TBarDatum[];
};

export const WeeklySpendingSection = ({
  onRefresh,
  total,
  average,
  highest,
  barData,
}: TWeeklySpendingSectionProps) => {
  return (
    <View className="mt-8 space-y-4">
      <View className="flex-row justify-between items-center">
        <AppText className="text-2xl font-semibold text-gray-900 dark:text-white">
          Weekly Spending
        </AppText>
        <Ionicons name="refresh-outline" size={24} color="#666" onPress={onRefresh} />
      </View>

      <View className="mt-4 gap-3">
        <View className="flex-row gap-3 justify-between">
          <StatCard title="Total Spendings" value={formatCurrency(total)} />
          <StatCard title="Average Spendings" value={formatCurrency(average)} />
        </View>
        <StatCard title="Highest Week" value={formatCurrency(highest)} />
      </View>

      <View className="flex-1 mt-6 items-center">
        {barData.length > 0 ? (
          <WeeklyBarChart data={barData} />
        ) : (
          <AppText className="text-center text-lg text-gray-500 mt-8">
            No expenses recorded this month
          </AppText>
        )}
      </View>
    </View>
  );
};
