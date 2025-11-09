import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { AppText, AppTextInput } from '@/components/AppText';
import IconPicker from '@/components/IconPicker';
import { Section } from '@/components/Section';

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

export const CategorySheet = ({
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
    <BottomSheet visible={visible} onClose={onClose} height="80%">
      <Section title="Category Icon (Optional)">
        <IconPicker selectedIcon={newCategoryIcon} onSelectIcon={setNewCategoryIcon} />
      </Section>

      <Section title="Category Name">
        <AppTextInput
          className="border border-gray-300 p-3 rounded-2xl"
          placeholder="e.g., GROCERIES, ENTERTAINMENT"
          placeholderTextColor="#999"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          autoCapitalize="characters"
        />
      </Section>

      <Section title="Keywords (comma-separated)">
        <AppText className="text-sm text-gray-500 italic mb-2">
          Add words that identify this category (e.g., store names, merchant types)
        </AppText>

        <AppTextInput
          className="border rounded-xl border-gray-300 p-3"
          multiline
          placeholder="e.g., keells, cargills, arpico"
          placeholderTextColor="#999"
          value={newCategoryKeywords}
          onChangeText={setNewCategoryKeywords}
        />
      </Section>

      <Section title="">
        <View className="flex-row justify-between space-x-3 mt-2">
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
      </Section>
    </BottomSheet>
  );
};
