import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import StatCard from '@/components/charts-screen/cards/StatCard';
import { formatCurrency } from '@/util/common-utils';
import { TWeeklyData } from '@/util/chart-utils';

type TWeeklyBreakdownGridProps = {
  weeklyData: TWeeklyData[];
};

export const WeeklyBreakdownGrid = ({ weeklyData }: TWeeklyBreakdownGridProps) => {
  if (weeklyData.length === 0)
    return (
      <View className="my-8">
        <AppText className="text-center text-lg text-gray-500">No Weekly Data Available</AppText>
      </View>
    );

  return (
    <View className="mt-8">
      {weeklyData.map((week, index) => {
        if (index % 2 === 0) {
          return (
            <View key={index} className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <StatCard
                  title={`Week ${week.week}`}
                  value={formatCurrency(week.total)}
                  timeline={`${new Date(week.weekStart).getDate()} - ${new Date(
                    week.weekEnd,
                  ).getDate()}`}
                />
              </View>
              {weeklyData[index + 1] && (
                <View className="flex-1">
                  <StatCard
                    title={`Week ${weeklyData[index + 1].week}`}
                    value={formatCurrency(weeklyData[index + 1].total)}
                    timeline={`${new Date(weeklyData[index + 1].weekStart).getDate()} - ${new Date(
                      weeklyData[index + 1].weekEnd,
                    ).getDate()}`}
                  />
                </View>
              )}
            </View>
          );
        }
        return null;
      })}
    </View>
  );
};
