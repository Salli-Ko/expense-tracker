import { CATEGORY_PROGRESS_COLORS } from '@/constants/categoryColors';
import { formatCompactNumber } from '@/util/common-utils';
import { AppText } from '@/components/AppText';

export type TWeeklyData = {
  week: number;
  weekStart: string;
  weekEnd: string;
  total: number;
};

export type TCategoryData = {
  category: string;
  total: number;
  count: number;
};

export const getWeeklyBarData = (weeklyData: TWeeklyData[]) =>
  weeklyData.map((week) => ({
    value: week.total,
    label: `W${week.week}`,
    frontColor: '#3498db',
    topLabelComponent: () =>
      week.total > 0 ? (
        <AppText className="text-xs text-gray-500">{formatCompactNumber(week.total)}</AppText>
      ) : null,
  }));

export const getTotalWeeklySpending = (data: TWeeklyData[]) =>
  data.reduce((sum, w) => sum + w.total, 0);

export const getMaxWeekSpending = (data: TWeeklyData[]) => Math.max(...data.map((w) => w.total), 0);

export const getAvgWeekSpending = (data: TWeeklyData[]) => {
  const validWeeks = data.filter((w) => w.total > 0);
  return getTotalWeeklySpending(data) / (validWeeks.length || 1);
};

export const getTotalCategorySpending = (data: TCategoryData[]) =>
  data.reduce((sum, cat) => sum + cat.total, 0);

export const getCategoryPieData = (data: TCategoryData[], totalSpending: number) =>
  data.map((cat) => ({
    value: cat.total,
    color: CATEGORY_PROGRESS_COLORS[cat.category] || CATEGORY_PROGRESS_COLORS['Other'],
    text: totalSpending > 0 ? `${((cat.total / totalSpending) * 100).toFixed(1)}%` : '0%',
    label: cat.category,
  }));
