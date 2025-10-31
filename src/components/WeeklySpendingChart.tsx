import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import StorageService from '@/database/StorageService';

interface WeeklySpendingChartProps {
  isDbReady: boolean;
}

const WeeklySpendingChart: React.FC<WeeklySpendingChartProps> = ({ isDbReady }) => {
  const [weeklyData, setWeeklyData] = useState<Array<{
    week: number;
    weekStart: string;
    weekEnd: string;
    total: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (isDbReady) {
      loadWeeklyData();
    }
  }, [isDbReady]);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      const data = await StorageService.getExpensesByWeekCurrentMonth();
      setWeeklyData(data);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (weeklyData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Weekly Spending</Text>
        <Text style={styles.noData}>No expenses this month</Text>
      </View>
    );
  }

  const chartData = {
    labels: weeklyData.map((w) => `W${w.week}`),
    datasets: [
      {
        data: weeklyData.map((w) => w.total),
      },
    ],
  };

  const maxValue = Math.max(...weeklyData.map((w) => w.total));
  const totalSpending = weeklyData.reduce((sum, w) => sum + w.total, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Spending - {new Date().toLocaleString('default', { month: 'long' })}</Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>LKR {totalSpending.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Highest Week</Text>
          <Text style={styles.summaryValue}>LKR {maxValue.toFixed(2)}</Text>
        </View>
      </View>

      <BarChart
        data={chartData}
        width={screenWidth - 48}
        height={220}
        yAxisLabel="LKR "
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#e0e0e0',
            strokeWidth: 1,
          },
          propsForLabels: {
            fontSize: 12,
          },
        }}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
      />

      <View style={styles.weekDetailsContainer}>
        {weeklyData.map((week) => (
          <View key={week.week} style={styles.weekDetail}>
            <Text style={styles.weekLabel}>Week {week.week}</Text>
            <Text style={styles.weekAmount}>LKR {week.total.toFixed(2)}</Text>
            <Text style={styles.weekDate}>
              {new Date(week.weekStart).getDate()} - {new Date(week.weekEnd).getDate()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  weekDetailsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weekDetail: {
    width: '30%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  weekAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  weekDate: {
    fontSize: 12,
    color: '#666',
  },
  noData: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default WeeklySpendingChart;