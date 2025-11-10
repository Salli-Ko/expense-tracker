import { Category } from '@/database/models/Category';
import { TExpenseFormState } from '@/hooks/useExpenseFormState';
import StorageService from '@/database/StorageService';
import { Alert } from 'react-native';
import { parseCategoryKeywords, validateNewCategory } from '@/util/category-utils';
import { CategoryKeyword } from '@/database/models/CategoryKeyword';

type TNewCategoryInput = {
  name: string;
  keywords: string;
  icon: string;
};

export const handleAddCategory = async (
  newCategoryInput: TNewCategoryInput,
  existingCategories: Category[],
  refreshCategoryList: () => void,
  updateFormState: (updates: Partial<TExpenseFormState>) => void,
  toggleNewCategoryModal: (isVisible: boolean) => void,
  updateNewCategoryInput: (input: TNewCategoryInput) => void,
) => {
  const categoryName = newCategoryInput.name.trim().toUpperCase();
  const parsedKeywords = parseCategoryKeywords(newCategoryInput.keywords);

  if (!validateNewCategory(categoryName, parsedKeywords, existingCategories)) return;

  try {
    const timestamp = new Date().toISOString();
    const createdCategory = await StorageService.insertCategory({
      name: categoryName,
      icon: newCategoryInput.icon || 'pricetag',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    for (const keyword of parsedKeywords) {
      await StorageService.saveCategoryKeyword(keyword, createdCategory.id);
    }

    updateFormState({ category: createdCategory.name });
    refreshCategoryList();
    toggleNewCategoryModal(false);
    updateNewCategoryInput({ name: '', keywords: '', icon: '' });

    Alert.alert('Category Created', `${categoryName} added successfully.`);
  } catch (error) {
    console.error('Error creating category:', error);
    Alert.alert('Error', 'Failed to create category');
  }
};

/**
 * Handles deletion of a learned category keyword with confirmation prompt.
 */
export const handleDeleteCategoryKeyword = async (
  keyword: CategoryKeyword,
  refreshList: () => Promise<void>,
) => {
  Alert.alert(
    'Delete Learned Association',
    `Remove "${keyword.keyword}" from Categories?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (keyword.id) {
              await StorageService.deleteCategoryKeyword(keyword.id);
              await refreshList();
              Alert.alert('Success', 'Association deleted');
            }
          } catch (error) {
            console.error('Error deleting category keyword:', error);
            Alert.alert('Error', 'Failed to delete association');
          }
        },
      },
    ],
  );
};
