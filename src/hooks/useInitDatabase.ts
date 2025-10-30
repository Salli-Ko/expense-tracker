import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import StorageService from '@/database/StorageService';
import { Expense } from '@/database/models/Expense';
import { Category } from '@/database/models/Category';

interface UseInitDatabaseReturn {
  isDbReady: boolean;
  isLoading: boolean;
  error: string;
  expenses: Expense[];
  totalExpenses: number;
  categories: Category[];
  retryInit: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
  refetchCategories: () => Promise<void>;
}

export const useInitDatabase = (): UseInitDatabaseReturn => {
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Data states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const allCategories = await StorageService.getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      const expenseList = await StorageService.getAllExpenses();
      setExpenses(expenseList);
    } catch (error) {
      console.error('Error loading expenses:', error);
      throw error;
    }
  }, []);

  const loadTotalExpenses = useCallback(async () => {
    try {
      const total = await StorageService.getTotalExpenses();
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error loading total expenses:', error);
      throw error;
    }
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      await Promise.all([loadCategories(), loadExpenses(), loadTotalExpenses()]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load expenses data');
    }
  }, [loadCategories, loadExpenses, loadTotalExpenses]);

  const refreshExpenses = useCallback(async () => {
    try {
      await loadExpenses();
      await loadTotalExpenses();
    } catch (error) {
      console.error('Error refreshing expenses:', error);
      Alert.alert('Error', 'Failed to refresh expenses');
    }
  }, [loadExpenses, loadTotalExpenses]);

  const initDatabase = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Open database
      await StorageService.openDatabase();

      // Create tables (categories, expenses, and category_keywords)
      // This will also initialize default categories and keywords
      await StorageService.createTables();

      console.log('Database initialized successfully');

      await loadAllData();

      setIsDbReady(true);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Database initialization failed:', errorMessage);

      setError(errorMessage);
      setIsLoading(false);
      setIsDbReady(false);

      Alert.alert(
        'Database Error',
        'Failed to initialize database. Please restart the app or try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => initDatabase() },
        ]
      );
    }
  };

  const retryInit = async () => {
    await initDatabase();
  };

  useEffect(() => {
    // Initialize database on mount
    initDatabase();

    // Cleanup function to close database on unmount
    return () => {
      if (StorageService.isReady()) {
        StorageService.closeDatabase()
          .then(() => console.log('Database closed on cleanup'))
          .catch((err) => console.error('Error closing database:', err));
      }
    };
  }, []);

  return {
    isDbReady,
    isLoading,
    error,
    expenses,
    totalExpenses,
    categories,
    retryInit,
    refreshExpenses,
    refetchCategories: loadCategories,
  };
};