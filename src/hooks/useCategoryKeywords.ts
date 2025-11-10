import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import StorageService from '@/database/StorageService';
import { CategoryKeyword } from '@/database/models/CategoryKeyword';
import { handleDeleteCategoryKeyword } from '@/controllers/categoryController';

export const useCategoryKeywords = () => {
  const [keywords, setKeywords] = useState<CategoryKeyword[]>([]);
  const [groupedKeywords, setGroupedKeywords] = useState<Record<string, CategoryKeyword[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadKeywords = useCallback(async () => {
    try {
      setIsLoading(true);
      const allKeywords = await StorageService.getAllCategoryKeywords();
      setKeywords(allKeywords);

      const grouped = allKeywords.reduce(
        (acc: Record<string, CategoryKeyword[]>, keyword: any) => {
          const key = keyword.category || `Category ${keyword.categoryId || '?'}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(keyword);
          return acc;
        },
        {} as Record<string, CategoryKeyword[]>,
      );

      setGroupedKeywords(grouped);
    } catch (error) {
      console.error('Error loading keywords:', error);
      Alert.alert('Error', 'Failed to load learned categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteKeyword = useCallback(
    async (keyword: CategoryKeyword) => {
      await handleDeleteCategoryKeyword(keyword, loadKeywords);
    },
    [loadKeywords],
  );

  useEffect(() => {
    void loadKeywords();
  }, [loadKeywords]);

  return { keywords, groupedKeywords, isLoading, deleteKeyword, loadKeywords };
};
