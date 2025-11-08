import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import StorageService from '@/database/StorageService';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '@/components/AppText';
import { Header } from '@/components/home/Header';
import Body from '@/components/Body';
import { Ionicons } from '@expo/vector-icons';
import { formatCompactNumber, formatCurrency } from '@/util/common-utils';
import { CATEGORY_COLORS, CATEGORY_PROGRESS_COLORS } from '@/constants/categoryColors';

type TWeeklyData = {
  week: number;
  weekStart: string;
  weekEnd: string;
  total: number;
};

type TCategoryData = {
  category: string;
  total: number;
  count: number;
};

type TStatCardProps = {
  title: string;
  value: string;
  timeline?: string;
};

type TCategoryCardProps = {
  title: string;
  value: string;
  transactions: number;
  percentage: number;
  backgroundColor: string;
  progressBarColor: string;
};

const ChartsScreen: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<TWeeklyData[]>([]);
  const [categoryData, setCategoryData] = useState<TCategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChartsData = async () => {
    try {
      setLoading(true);
      const weekly = await StorageService.getExpensesByWeekCurrentMonth();
      setWeeklyData(weekly);

      const now = new Date();
      const category = await StorageService.getExpensesByCategoryForMonth(
        now.getFullYear(),
        now.getMonth() + 1,
      );
      setCategoryData(category);
    } catch (error) {
      console.error('Error loading charts data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChartsData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadChartsData();
      return () => {};
    }, []),
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f5f6fa]">
        <ActivityIndicator size="large" color="#3498db" />
        <AppText className="mt-3 text-base text-gray-600">Loading charts...</AppText>
      </View>
    );
  }

  const weeklyBarData = weeklyData.map((week) => ({
    value: week.total,
    label: `W${week.week}`,
    frontColor: '#3498db',
    topLabelComponent: () => (
      <AppText className="text-xs text-gray-500">
        {week.total > 0 ? formatCompactNumber(week.total) : ''}
      </AppText>
    ),
  }));

  const totalWeeklySpending = weeklyData.reduce((sum, w) => sum + w.total, 0);
  const maxWeekSpending = Math.max(...weeklyData.map((w) => w.total));
  const avgWeekSpending = totalWeeklySpending / (weeklyData.filter((w) => w.total > 0).length || 1);

  const totalCategorySpending = categoryData.reduce((sum, cat) => sum + cat.total, 0);

  const categoryPieData = categoryData.map((cat) => ({
    value: cat.total,
    color: CATEGORY_PROGRESS_COLORS[cat.category] || CATEGORY_PROGRESS_COLORS['Other'],
    text: `${((cat.total / totalCategorySpending) * 100).toFixed(1)}%`,
    label: cat.category,
  }));

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const StatCard = ({ title, value, timeline }: TStatCardProps) => {
    return (
      <View className="flex-1 bg-light-background p-3 flex-col gap-2 rounded-2xl">
        <View className="flex-row justify-between">
          <AppText className="text-light-text-secondary">{title}</AppText>
          {timeline && (
            <AppText className="text-light-text-secondary" style={{ fontSize: 10 }}>
              {timeline}
            </AppText>
          )}
        </View>
        <View className="flex-row gap-2 ml-2">
          <View className="border border-l border-light-primary" />
          <AppText className="text-2xl">{value}</AppText>
        </View>
      </View>
    );
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
        <AppText className="text-sm text-gray-500 dark:text-gray-400">
          {transactions} {transactions === 1 ? 'Transaction' : 'Transactions'}
        </AppText>
        <AppText className="text-sm text-gray-500 dark:text-gray-400">{percentage}%</AppText>
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-[#f5f6fa]" showsVerticalScrollIndicator={false}>
      <Header title="Spending Analytics" description={currentMonth} />

      <Body>
        <View className="mt-8 space-y-4">
          <View className="flex-row justify-between items-center">
            <AppText className="text-2xl font-semibold text-gray-900 dark:text-white">
              Weekly Spending
            </AppText>
            <Ionicons name="refresh-outline" size={24} color="#666" onPress={loadChartsData} />
          </View>

          <View className="mt-4 space-y-3">
            <View className="flex-row gap-3 justify-between">
              <StatCard title="Total Spendings" value={formatCurrency(totalWeeklySpending)} />
              <StatCard title="Average Spendings" value={formatCurrency(avgWeekSpending)} />
            </View>
            <StatCard title="Highest Week" value={formatCurrency(maxWeekSpending)} />
          </View>
        </View>

        <View className="flex-1 mt-6 items-center">
          {weeklyBarData.length > 0 ? (
            <BarChart
              data={weeklyBarData}
              height={220}
              roundedTop
              yAxisThickness={0}
              xAxisThickness={0}
              yAxisTextStyle={{ color: '#9CA3AF', fontSize: 11 }}
              xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 12, fontWeight: '500' }}
              noOfSections={5}
              maxValue={Math.max(...weeklyBarData.map((d) => d.value)) * 1.2}
              isAnimated
              yAxisLabelTexts={Array.from({ length: 6 }).map((_, i) =>
                formatCompactNumber(
                  ((Math.max(...weeklyBarData.map((d) => d.value)) * 1.2) / 5) * i,
                ),
              )}
              animationDuration={800}
              yAxisLabelWidth={40}
              barBorderRadius={6}
              frontColor="#5A8F7B"
              showGradient
              gradientColor="#C8E3D3"
              disableScroll
            />
          ) : (
            <View className="mt-8">
              <AppText className="text-center text-lg text-gray-500">
                No expenses recorded this month
              </AppText>
            </View>
          )}
        </View>

        <View className="mt-8">
          {weeklyData.map((week, index) => {
            if (index % 2 === 0) {
              return (
                <View key={index} className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <StatCard
                      title={`Week ${weeklyData[index].week}`}
                      value={formatCurrency(week.total)}
                      timeline={`${new Date(week.weekStart).getDate()} - ${new Date(week.weekEnd).getDate()}`}
                    />
                  </View>
                  {weeklyData[index + 1] && (
                    <View className="flex-1">
                      <StatCard
                        title={`Week ${weeklyData[index + 1].week}`}
                        value={formatCurrency(weeklyData[index + 1].total)}
                        timeline={`${new Date(weeklyData[index + 1].weekStart).getDate()} - ${new Date(weeklyData[index + 1].weekEnd).getDate()}`}
                      />
                    </View>
                  )}
                </View>
              );
            }
            return null;
          })}
        </View>

        <View className="mt-8">
          <AppText className="text-2xl font-semibold text-gray-900 dark:text-white">
            Category Breakdown
          </AppText>

          {categoryPieData.length > 0 ? (
            <>
              <View className="my-8 items-center">
                <PieChart
                  data={categoryPieData}
                  donut
                  radius={100}
                  innerRadius={60}
                  centerLabelComponent={() => (
                    <View className="items-center">
                      <AppText className="text-lg font-semibold text-gray-900">
                        LKR {totalCategorySpending.toFixed(0)}
                      </AppText>
                      <AppText className="text-sm text-gray-500 mt-1">Total</AppText>
                    </View>
                  )}
                  isAnimated
                  animationDuration={800}
                />
              </View>

              <View className="mt-4">
                {categoryData.map((category) => {
                  const percentage = ((category.total / totalCategorySpending) * 100).toFixed(1);
                  const backgroundColor =
                    CATEGORY_COLORS[category.category] || CATEGORY_COLORS['Other'];
                  const progressBarColor =
                    CATEGORY_PROGRESS_COLORS[category.category] ||
                    CATEGORY_PROGRESS_COLORS['Other'];

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
            </>
          ) : (
            <View className="my-8">
              <AppText className="text-center text-lg text-gray-500">
                No Category Data Available
              </AppText>
            </View>
          )}
        </View>
      </Body>
    </ScrollView>
  );
};

export default ChartsScreen;