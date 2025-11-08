import React, { useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '@/components/home/Header';
import Body from '@/components/Body';
import useChartsData from '@/hooks/useChartsData';
import {
  getWeeklyBarData,
  getTotalWeeklySpending,
  getMaxWeekSpending,
  getAvgWeekSpending,
  getTotalCategorySpending,
  getCategoryPieData,
} from '@/util/chart-utils';
import { WeeklySpendingSection } from '@/components/charts/WeeklySpendingSection';
import { WeeklyBreakdownGrid } from '@/components/charts/WeeklyBreakdownGrid';
import { CategoryBreakdownSection } from '@/components/charts/CategoryBreakdownSection';
import { Loader } from '@/components/home/Loader';

const SpendingAnalytics: React.FC = () => {
  const { weeklyData, categoryData, loading, loadChartsData } = useChartsData();

  useFocusEffect(
    useCallback(() => {
      void loadChartsData();
      return () => {};
    }, [loadChartsData]),
  );

  if (loading) {
    return <Loader title="Loading charts..." />;
  }

  const weeklyBarData = getWeeklyBarData(weeklyData);
  const totalWeeklySpending = getTotalWeeklySpending(weeklyData);
  const maxWeekSpending = getMaxWeekSpending(weeklyData);
  const avgWeekSpending = getAvgWeekSpending(weeklyData);
  const totalCategorySpending = getTotalCategorySpending(categoryData);
  const categoryPieData = getCategoryPieData(categoryData, totalCategorySpending);

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <ScrollView className="flex-1 bg-[#f5f6fa]" showsVerticalScrollIndicator={false}>
      <Header title="Spending Analytics" description={currentMonth} />
      <Body>
        <WeeklySpendingSection
          onRefresh={loadChartsData}
          total={totalWeeklySpending}
          average={avgWeekSpending}
          highest={maxWeekSpending}
          barData={weeklyBarData}
        />
        <WeeklyBreakdownGrid weeklyData={weeklyData} />
        <CategoryBreakdownSection
          categoryData={categoryData}
          categoryPieData={categoryPieData}
          totalSpending={totalCategorySpending}
        />
      </Body>
    </ScrollView>
  );
};

export default SpendingAnalytics;
