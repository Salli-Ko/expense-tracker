import { useCallback, useState } from 'react';
import StorageService from '@/database/StorageService';
import { TCategoryData, TWeeklyData } from '@/util/chart-utils';

const useChartsData = () => {
  const [weeklyData, setWeeklyData] = useState<TWeeklyData[]>([]);
  const [categoryData, setCategoryData] = useState<TCategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChartsData = useCallback(async () => {
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
  }, []);

  return { weeklyData, categoryData, loading, loadChartsData };
};

export default useChartsData;
