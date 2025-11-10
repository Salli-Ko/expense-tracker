import React from 'react';
import { View, ScrollView } from 'react-native';
import { AppText } from '@/components/AppText';
import { Loader } from '@/components/Loader';
import { Header } from '@/components/Header';
import Body from '@/components/Body';
import { ExpandableKeywordList } from '@/components/category-management-screen/lists/ExpandableKeywordList';
import { useCategoryKeywords } from '@/hooks/useCategoryKeywords';

const CategoryInsights: React.FC = () => {
  const { keywords, groupedKeywords, isLoading, deleteKeyword } = useCategoryKeywords();

  if (isLoading) return <Loader title="Loading learned categories..." />;

  if (keywords.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f5f6fa] px-6">
        <AppText className="text-6xl mb-4">🎓</AppText>
        <AppText className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          No Learned Categories Yet
        </AppText>
        <AppText className="text-center text-gray-500 dark:text-gray-400">
          Parse SMS messages and adjust categories to teach the app your preferences.
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#f5f6fa]" showsVerticalScrollIndicator={false}>
      <Header
        title="Learned Categories"
        description={`${keywords.length} merchant${keywords.length !== 1 ? 's' : ''} learned`}
      />

      <Body>
        <View className="flex-col gap-3 mt-8">
          <AppText className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary">
            How it works
          </AppText>
          <AppText className="text-sm text-light-text-secondary dark:text-dark-text-secondary leading-5">
            When you parse an SMS and change the category before saving, the app learns your
            preference. Higher confidence means more consistent categorization.
          </AppText>
        </View>

        <ExpandableKeywordList groupedKeywords={groupedKeywords} onDeleteKeyword={deleteKeyword} />
      </Body>
    </ScrollView>
  );
};

export default CategoryInsights;
