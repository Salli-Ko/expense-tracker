import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { AppText, AppTextInput } from '@/components/AppText';
import IconPicker from '@/components/IconPicker';

interface INewCategorySheetProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
  newCategoryName: string;
  setNewCategoryName: (value: string) => void;
  newCategoryKeywords: string;
  setNewCategoryKeywords: (value: string) => void;
  newCategoryIcon: string;
  setNewCategoryIcon: (value: string) => void;
}

export const NewCategorySheet = ({
  visible,
  onClose,
  onCreate,
  newCategoryName,
  setNewCategoryName,
  newCategoryKeywords,
  setNewCategoryKeywords,
  newCategoryIcon,
  setNewCategoryIcon,
}: INewCategorySheetProps) => {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add New Category" height="80%">
      <AppText className="text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
        Category Icon (Optional)
      </AppText>
      <IconPicker selectedIcon={newCategoryIcon} onSelectIcon={setNewCategoryIcon} />

      <AppText className="text-base font-medium text-gray-700 dark:text-gray-200 mt-5 mb-2">
        Category Name
      </AppText>
      <AppTextInput
        className="border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-dark-card"
        placeholder="e.g., GROCERIES, ENTERTAINMENT"
        placeholderTextColor="#999"
        value={newCategoryName}
        onChangeText={setNewCategoryName}
        autoCapitalize="characters"
      />

      <AppText className="text-base font-medium text-gray-700 dark:text-gray-200 mt-6 mb-2">
        Keywords (comma-separated)
      </AppText>
      <AppText className="text-sm text-gray-500 italic mb-2">
        Add words that identify this category (e.g., store names, merchant types)
      </AppText>
      <AppTextInput
        className="border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-dark-card h-28"
        multiline
        placeholder="e.g., keells, cargills, arpico"
        placeholderTextColor="#999"
        value={newCategoryKeywords}
        onChangeText={setNewCategoryKeywords}
      />

      <View className="flex-row justify-between space-x-3 mt-6">
        <TouchableOpacity
          onPress={onClose}
          className="flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-xl items-center"
        >
          <AppText className="text-gray-800 dark:text-gray-100 font-semibold">Cancel</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCreate}
          className="flex-1 bg-light-primary py-3 rounded-xl items-center"
        >
          <AppText className="text-white font-semibold">Create</AppText>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};
