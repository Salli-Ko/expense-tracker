import { Alert } from 'react-native';
import { Category } from '@/database/models/Category';
import React from 'react';

export const parseCategoryKeywords = (keywords: string): string[] =>
  keywords
    .split(',')
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 1);

/**
 * Validates new category input.
 * Returns `true` if valid, otherwise shows an alert and returns `false`.
 */
export const validateNewCategory = (
  name: string,
  keywords: string[],
  categories: Category[],
): boolean => {
  if (!name.trim()) {
    Alert.alert('Error', 'Enter a category name');
    return false;
  }

  if (categories.some((category) => category.name === name.toUpperCase())) {
    Alert.alert('Error', 'Category already exists');
    return false;
  }

  if (keywords.length === 0) {
    Alert.alert('Error', 'Add at least one keyword');
    return false;
  }

  return true;
};

export const suggestKeywordsFromDescription = (
  description: string,
  setNewCategory: React.Dispatch<
    React.SetStateAction<{ name: string; keywords: string; icon: string }>
  >,
  setShowNewCategoryModal: (visible: boolean) => void,
) => {
  if (!description.trim()) {
    return Alert.alert('Hint', 'Please add a description first.');
  }

  const potentialKeywords = description
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  setNewCategory((previousCategory) => ({
    ...previousCategory,
    keywords: potentialKeywords.join(', '),
  }));

  setShowNewCategoryModal(true);
};