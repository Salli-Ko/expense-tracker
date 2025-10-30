import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import StorageService from '@/database/StorageService';
import { CategoryKeyword } from '@/database/models/CategoryKeyword';

const CategoryManagement: React.FC = () => {
  const [keywords, setKeywords] = useState<CategoryKeyword[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [groupedKeywords, setGroupedKeywords] = useState<Record<string, CategoryKeyword[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      setIsLoading(true);
      const allKeywords = await StorageService.getAllCategoryKeywords();
      setKeywords(allKeywords);

      // Group by category
      const grouped = allKeywords.reduce(
        (acc, keyword) => {
          if (!acc[keyword.category]) {
            acc[keyword.category] = [];
          }
          acc[keyword.category].push(keyword);
          return acc;
        },
        {} as Record<string, CategoryKeyword[]>,
      );

      setGroupedKeywords(grouped);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading keywords:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load learned categories');
    }
  };

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

  const handleDeleteKeyword = (keyword: CategoryKeyword) => {
    Alert.alert(
      'Delete Learned Association',
      `Remove "${keyword.keyword}" from ${keyword.category}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (keyword.id) {
                await StorageService.deleteCategoryKeyword(keyword.id);
                await loadKeywords();
                Alert.alert('Success', 'Association deleted');
              }
            } catch (error) {
              console.error('Error deleting keyword:', error);
              Alert.alert('Error', 'Failed to delete association');
            }
          },
        },
      ],
    );
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 5) return '#27ae60';
    if (confidence >= 3) return '#f39c12';
    return '#95a5a6';
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading learned categories...</Text>
      </View>
    );
  }

  if (keywords.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyIcon}>🎓</Text>
        <Text style={styles.emptyTitle}>No Learned Categories Yet</Text>
        <Text style={styles.emptyText}>
          Parse SMS messages and adjust categories to teach the app your preferences.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learned Categories</Text>
        <Text style={styles.subtitle}>
          {keywords.length} merchant{keywords.length !== 1 ? 's' : ''} learned
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 How it works</Text>
        <Text style={styles.infoText}>
          When you parse an SMS and change the category before saving, the app learns your
          preference. Higher confidence means more consistent categorization.
        </Text>
      </View>

      {Object.entries(groupedKeywords).map(([category, categoryKeywords]) => {
        const isExpanded = expandedCategories.has(category);

        return (
          <View key={category} style={styles.categoryGroup}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryHeaderLeft}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <Text style={styles.categoryCount}>{categoryKeywords.length}</Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {isExpanded &&
              categoryKeywords.map((keyword) => (
                <View key={keyword.id} style={styles.keywordCard}>
                  <View style={styles.keywordInfo}>
                    <Text style={styles.keywordText}>{keyword.keyword}</Text>
                    <View style={styles.confidenceContainer}>
                      <View
                        style={[
                          styles.confidenceBadge,
                          { backgroundColor: getConfidenceColor(keyword.confidence) },
                        ]}
                      >
                        <Text style={styles.confidenceText}>{keyword.confidence}x</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteKeyword(keyword)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  infoBox: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categoryGroup: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expandIcon: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
  },
  keywordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  keywordInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keywordText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  confidenceContainer: {
    marginRight: 12,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
});

export default CategoryManagement;
