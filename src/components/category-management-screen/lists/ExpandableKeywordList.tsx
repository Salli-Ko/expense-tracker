import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { MiniListItem } from '@/components/category-management-screen/lists/MiniListItem';
import { CategoryKeyword } from '@/database/models/CategoryKeyword';

type TGroupedKeywords = Record<string, CategoryKeyword[]>;

type TExpandableKeywordListProps = {
  groupedKeywords: TGroupedKeywords;
  onDeleteKeyword: (keyword: CategoryKeyword) => void;
};

export const ExpandableKeywordList = ({
  groupedKeywords,
  onDeleteKeyword,
}: TExpandableKeywordListProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <View className="mt-8 mb-8">
      {Object.entries(groupedKeywords).map(([category, keywords]) => {
        const isExpanded = expandedCategories.has(category);
        return (
          <View
            key={category}
            className="bg-light-background dark:bg-dark-background mb-5 rounded-2xl px-5 py-4 shadow-sm border border-gray-300 dark:border-gray-700"
          >
            <TouchableOpacity
              onPress={() => toggleCategory(category)}
              activeOpacity={0.8}
              className="flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-3">
                <AppText className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                  {category}
                </AppText>

                <View className="bg-light-primary dark:bg-dark-primary px-4 py-2 rounded-full items-center justify-center">
                  <AppText className="text-xs font-medium text-white dark:text-light-text-primary">
                    {keywords.length}
                  </AppText>
                </View>
              </View>

              <View className="text-light-text-secondary dark:text-dark-text-secondary">
                <Ionicons
                  name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={20}
                  color="#666"
                />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View className="mt-4 flex-col space-y-2">
                {keywords.map((keyword) => (
                  <MiniListItem
                    key={String(keyword.id)}
                    title={keyword.keyword}
                    count={keyword.confidence}
                    onDelete={() => onDeleteKeyword(keyword)}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};
