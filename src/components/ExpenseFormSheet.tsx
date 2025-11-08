import { Alert, TouchableOpacity, View } from 'react-native';
import { AppText, AppTextInput } from '@/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PLATFORM } from '@/constants/platformConstants';
import { BottomSheet } from '@/components/BottomSheet';
import React, { useState } from 'react';
import { Category } from '@/database/models/Category';
import StorageService from '@/database/StorageService';
import { NewCategorySheet } from '@/components/NewCategorySheet';
import { Expense } from '@/database/models/Expense';

type TExpenseFormSheetProps = {
  category: string;
  setCategory: (newCategory: string) => void;
  categories: Category[];
  description: string;
  setDescription: (newDescription: string) => void;
  refetchCategories: () => void;
  amount: string;
  setAmount: (newAmount: string) => void;
  parsedMerchant: string;
  originalCategory: string;
  setOriginalCategory: (newOriginalCategory: string) => void;
  setParsedMerchant: (newParsedMerchant: string) => void;
  date: Date | null;
  setDate: (newDate: Date | null) => void;
  isSheetVisible: boolean;
  isDbReady: boolean;
  setSmsMessage: (msg: string) => void;
  onExpenseAdded: () => Promise<void>;
  setIsSheetVisible: (isSheetVisible: boolean) => void;
};

export const ExpenseFormSheet = ({
  isSheetVisible,
  setIsSheetVisible,
  category,
  setCategory,
  description,
  setDescription,
  categories,
  refetchCategories,
  amount,
  setAmount,
  parsedMerchant,
  originalCategory,
  setOriginalCategory,
  setParsedMerchant,
  date,
  setDate,
  setSmsMessage,
  isDbReady,
  onExpenseAdded,
}: TExpenseFormSheetProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showNewCategoryModal, setShowNewCategoryModal] = useState<boolean>(false);
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryKeywords, setNewCategoryKeywords] = useState('');

  const handleClearForm = () => {
    Alert.alert('Clear Form', 'Are you sure you want to clear all fields?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setAmount('');
          setDescription('');
          setSmsMessage('');
          setCategory('');
          setDate(null);
          setParsedMerchant('');
          setOriginalCategory('');
          setIsSheetVisible(false);
        },
      },
    ]);
  };

  const handleAddExpense = async () => {
    if (!isDbReady) {
      Alert.alert('Please Wait', 'Database is still loading...');
      return;
    }

    const amountNum = parseFloat(amount);

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }

    try {
      const newExpense: Omit<Expense, 'id'> = {
        category,
        amount: amountNum,
        date: date ? date.toISOString() : new Date().toISOString(),
        description: description || undefined,
      };

      await StorageService.insertExpense(newExpense);

      // Category learning - need to get categoryId
      const selectedCategory = categories.find((c) => c.name === category);

      if (selectedCategory?.id) {
        // Learn from parsed merchant
        if (parsedMerchant) {
          await StorageService.saveCategoryKeyword(parsedMerchant, selectedCategory.id);

          if (category !== originalCategory) {
            console.log(`Learned: ${parsedMerchant} -> ${category}`);
          } else {
            console.log(`Reinforced: ${parsedMerchant} -> ${category}`);
          }
        }

        // Learn from description if present
        if (description.trim()) {
          await StorageService.saveCategoryKeyword(
            description.trim().toLowerCase(),
            selectedCategory.id,
          );
          console.log(`Learned from description: ${description} -> ${category}`);
        }
      }

      // Reset form
      setAmount('');
      setDescription('');
      setSmsMessage('');
      setCategory('');
      setDate(null);
      setParsedMerchant('');
      setOriginalCategory('');
      setIsSheetVisible(false);

      await onExpenseAdded();

      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      const message = error instanceof Error ? error.message : 'Failed to add expense';
      Alert.alert('Error', message);
    }
  };

  const handleAddNewCategory = async () => {
    const categoryName = newCategoryName.trim().toUpperCase();
    const keywords = newCategoryKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (!categoryName) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    // Check if category already exists
    const existingCategory = categories.find((c) => c.name === categoryName);
    if (existingCategory) {
      Alert.alert('Error', 'This category already exists');
      return;
    }

    if (keywords.length === 0) {
      Alert.alert('Error', 'Please enter at least one keyword');
      return;
    }

    try {
      const now = new Date().toISOString();

      // Step 1: Insert the category into the database
      const category = await StorageService.insertCategory({
        name: categoryName,
        createdAt: now,
        icon: newCategoryIcon || 'pricetag',
        updatedAt: now,
      });

      // Step 2: Save keywords with the categoryId
      for (const keyword of keywords) {
        await StorageService.saveCategoryKeyword(keyword, category.id);
      }

      // Set the new category as selected
      setCategory(category.name);

      // Reset modal
      setNewCategoryName('');
      setNewCategoryKeywords('');
      setShowNewCategoryModal(false);

      // Refresh categories list
      refetchCategories();

      Alert.alert(
        'Success',
        `Category "${categoryName}" created with ${keywords.length} keyword(s)`,
      );
    } catch (error) {
      console.error('Error adding new category:', error);
      Alert.alert('Error', 'Failed to create new category');
    }
  };

  const handleSuggestCategory = () => {
    if (!description.trim()) {
      Alert.alert('Hint', 'Add a description first, then we can suggest keywords from it');
      return;
    }

    // Extract potential keywords from description
    const words = description
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2); // Only words with 3+ characters

    setNewCategoryKeywords(words.join(', '));
    setShowNewCategoryModal(true);
  };

  return (
    <BottomSheet visible={isSheetVisible} onClose={handleClearForm} height="85%">
      <View className="flex-col gap-3">
        <View className="flex-row justify-between items-center">
          <AppText className="text-xl">Category</AppText>
          <TouchableOpacity
            className="flex-row gap-2 bg-light-primary py-3 px-4 rounded-full items-center"
            onPress={() => setShowNewCategoryModal(true)}
          >
            <Ionicons name="add-outline" size={20} color="#FFFFFF" />
            <AppText className="text-white font-medium text-md">New Category</AppText>
          </TouchableOpacity>
        </View>
        {parsedMerchant && originalCategory && (
          <AppText>💡 Change category to teach the app</AppText>
        )}

        <View className="border border-gray-300 rounded-2xl overflow-hidden justify-center">
          <Picker
            selectedValue={category}
            onValueChange={(value) => setCategory(value)}
            dropdownIconColor="#555"
            style={{ height: 56 }}
          >
            {categories.map((category) => (
              <Picker.Item
                key={category.id || category.name}
                label={`${category.icon ? '  ' : ''}${category.name}`}
                value={category.name}
              />
            ))}
          </Picker>
        </View>

        <View className="flex-col gap-3 mt-4">
          <View className="flex-row justify-between items-center">
            <AppText className="text-xl">Amount (LKR)</AppText>
          </View>

          <AppTextInput
            placeholder="0.00"
            className="border border-gray-300 p-3 rounded-2xl justify-center"
            style={{ height: 56 }}
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View className="flex-col gap-3 mt-4">
          <View className="flex-row justify-between items-center">
            <AppText className="text-xl">Description</AppText>
            <TouchableOpacity
              className="flex-row gap-2 bg-light-primary py-3 px-4 rounded-full items-center"
              onPress={handleSuggestCategory}
            >
              <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />
              <AppText className="font-medium text-md text-white">Suggest Category</AppText>
            </TouchableOpacity>
          </View>

          <AppTextInput
            placeholder="Add a note..."
            className="border rounded-xl border-gray-300 p-3 h-36 bg-white dark:bg-dark-card"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View className="flex-col gap-3 mt-4">
          <View className="flex-row justify-between items-center">
            <AppText className="text-xl">Date</AppText>
          </View>
          {PLATFORM.IS_WEB ? (
            <input
              type="date"
              value={date ? date.toISOString().split('T')[0] : ''}
              onChange={(e) => setDate(new Date(e.target.value))}
              className="border border-gray-300 p-3 h-36 bg-white"
            />
          ) : (
            <TouchableOpacity
              onPress={() => setShowDatePicker(!showDatePicker)}
              className="border rounded-xl border-gray-300 p-3 h-12 bg-white justify-center"
              style={{ height: 56 }}
            >
              <AppText className="text-gray-800 dark:text-gray-200">
                {date ? date.toDateString() : 'Select Date'}
              </AppText>
            </TouchableOpacity>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display={PLATFORM.IS_IOS ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        <TouchableOpacity
          onPress={handleAddExpense}
          activeOpacity={0.8}
          className="bg-light-primary py-3 rounded-xl mt-4 items-center"
        >
          <AppText className="text-white font-semibold text-base">Add Expense</AppText>
        </TouchableOpacity>
      </View>

      <NewCategorySheet
        visible={showNewCategoryModal}
        onClose={() => {
          setShowNewCategoryModal(false);
          setNewCategoryName('');
          setNewCategoryKeywords('');
        }}
        onCreate={handleAddNewCategory}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        newCategoryKeywords={newCategoryKeywords}
        setNewCategoryKeywords={setNewCategoryKeywords}
        newCategoryIcon={newCategoryIcon}
        setNewCategoryIcon={setNewCategoryIcon}
      />
    </BottomSheet>
  );
};
