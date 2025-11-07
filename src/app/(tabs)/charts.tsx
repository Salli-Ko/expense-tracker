import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import StorageService from '@/database/StorageService';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '@/components/AppText';

interface WeeklyData {
  week: number;
  weekStart: string;
  weekEnd: string;
  total: number;
}

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

const ChartsScreen: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadChartsData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('📊 Charts screen focused - loading data...');
      loadChartsData();

      return () => {
        console.log('📊 Charts screen unfocused');
      };
    }, [])
  );

  const loadChartsData = async () => {
    try {
      setLoading(true);

      // Load weekly data
      const weekly = await StorageService.getExpensesByWeekCurrentMonth();
      setWeeklyData(weekly);

      // Load category data
      const now = new Date();
      const category = await StorageService.getExpensesByCategoryForMonth(
        now.getFullYear(),
        now.getMonth() + 1
      );
      setCategoryData(category);
    } catch (error) {
      console.error('Error loading charts data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <AppText style={styles.loadingText}>Loading charts...</AppText>
      </View>
    );
  }

  // Prepare data for weekly bar chart
  const weeklyBarData = weeklyData.map((week) => ({
    value: week.total,
    label: `W${week.week}`,
    frontColor: '#3498db',
    topLabelComponent: () => (
      <AppText style={styles.barTopLabel}>{week.total > 0 ? week.total.toFixed(0) : ''}</AppText>
    ),
  }));

  const totalWeeklySpending = weeklyData.reduce((sum, w) => sum + w.total, 0);
  const maxWeekSpending = Math.max(...weeklyData.map((w) => w.total));
  const avgWeekSpending = totalWeeklySpending / weeklyData.filter((w) => w.total > 0).length || 0;

  // Prepare data for category pie chart
  const totalCategorySpending = categoryData.reduce((sum, cat) => sum + cat.total, 0);

  const categoryColors = [
    '#3498db',
    '#e74c3c',
    '#2ecc71',
    '#f39c12',
    '#9b59b6',
    '#1abc9c',
    '#e67e22',
    '#34495e',
  ];

  const categoryPieData = categoryData.map((cat, index) => ({
    value: cat.total,
    color: categoryColors[index % categoryColors.length],
    text: `${((cat.total / totalCategorySpending) * 100).toFixed(1)}%`,
    label: cat.category,
  }));

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>Spending Analytics</AppText>
        <AppText style={styles.headerSubtitle}>{currentMonth}</AppText>
      </View>

      {/* Weekly Spending Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <AppText style={styles.chartTitle}>📊 Weekly Spending</AppText>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadChartsData}
          >
            <AppText style={styles.refreshButtonText}>🔄 Refresh</AppText>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryLabel}>Total</AppText>
            <AppText style={styles.summaryValue}>LKR {totalWeeklySpending.toFixed(2)}</AppText>
          </View>
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryLabel}>Highest Week</AppText>
            <AppText style={styles.summaryValue}>LKR {maxWeekSpending.toFixed(2)}</AppText>
          </View>
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryLabel}>Average</AppText>
            <AppText style={styles.summaryValue}>LKR {avgWeekSpending.toFixed(2)}</AppText>
          </View>
        </View>

        {/* Bar Chart */}
        {weeklyBarData.length > 0 ? (
          <View style={styles.chartContainer}>
            <BarChart
              data={weeklyBarData}
              width={screenWidth - 80}
              height={220}
              barWidth={35}
              spacing={18}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={1}
              yAxisThickness={1}
              yAxisTextStyle={styles.yAxisText}
              xAxisLabelTextStyle={styles.xAxisText}
              noOfSections={4}
              maxValue={Math.max(...weeklyBarData.map((d) => d.value)) * 1.2}
              isAnimated
              animationDuration={800}
              initialSpacing={10}
              endSpacing={10}
              yAxisLabelWidth={45}
            />
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <AppText style={styles.noDataText}>No expenses recorded this month</AppText>
          </View>
        )}

        {/* Week Details */}
        <View style={styles.weekDetailsContainer}>
          {weeklyData.map((week) => (
            <View key={week.week} style={styles.weekDetailCard}>
              <AppText style={styles.weekDetailLabel}>Week {week.week}</AppText>
              <AppText style={styles.weekDetailAmount}>
                LKR {week.total.toFixed(2)}
              </AppText>
              <AppText style={styles.weekDetailDate}>
                {new Date(week.weekStart).getDate()} -{' '}
                {new Date(week.weekEnd).getDate()}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.chartCard}>
        <AppText style={styles.chartTitle}>🎯 Category Breakdown</AppText>

        {categoryPieData.length > 0 ? (
          <>
            {/* Pie Chart */}
            <View style={styles.pieChartContainer}>
              <PieChart
                data={categoryPieData}
                donut
                radius={100}
                innerRadius={60}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <AppText style={styles.pieCenterAmount}>
                      LKR {totalCategorySpending.toFixed(0)}
                    </AppText>
                    <AppText style={styles.pieCenterLabel}>Total</AppText>
                  </View>
                )}
                isAnimated
                animationDuration={800}
              />
            </View>

            {/* Category Legend & Details */}
            <View style={styles.categoryListContainer}>
              {categoryData.map((category, index) => {
                const percentage = ((category.total / totalCategorySpending) * 100).toFixed(1);
                const color = categoryColors[index % categoryColors.length];

                return (
                  <View key={category.category} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryLabelContainer}>
                        <View style={[styles.categoryColorDot, { backgroundColor: color }]} />
                        <AppText style={styles.categoryName}>{category.category}</AppText>
                      </View>
                      <AppText style={styles.categoryAmount}>
                        LKR {category.total.toFixed(2)}
                      </AppText>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: `${percentage}%`, backgroundColor: color },
                        ]}
                      />
                    </View>

                    <View style={styles.categoryFooter}>
                      <AppText style={styles.categoryCount}>
                        {category.count} transaction{category.count !== 1 ? 's' : ''}
                      </AppText>
                      <AppText style={styles.categoryPercentage}>{percentage}%</AppText>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Total Summary */}
            <View style={styles.totalContainer}>
              <AppText style={styles.totalLabel}>Total Spending</AppText>
              <AppText style={styles.totalAmount}>
                LKR {totalCategorySpending.toFixed(2)}
              </AppText>
            </View>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <AppText style={styles.noDataText}>No category data available</AppText>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ecf0f1',
  },
  chartCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: -10,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  barTopLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  yAxisText: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  xAxisText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
  },
  weekDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  weekDetailCard: {
    width: '18%',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  weekDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  weekDetailAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  weekDetailDate: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  pieCenterLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  categoryListContainer: {
    marginTop: 16,
  },
  categoryItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#3498db',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
  },
});

export default ChartsScreen;