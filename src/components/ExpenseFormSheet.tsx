import React, { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText, AppTextInput } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { CategorySheet } from '@/components/CategorySheet';
import { PLATFORM } from '@/constants/platformConstants';
import { Category } from '@/database/models/Category';
import { TExpenseFormState } from '@/hooks/useExpenseFormState';
import { Section } from '@/components/Section';
import { handleAddExpense } from '@/controllers/expenseController';
import { handleAddCategory } from '@/controllers/categoryController';
import { suggestKeywordsFromDescription } from '@/util/category-utils';
import { formatDateForInput } from '@/util/date-utils';

type TExpenseFormSheetProps = {
  form: TExpenseFormState;
  setForm: (updates: Partial<TExpenseFormState>) => void;
  resetForm: () => void;
  categories: Category[];
  refetchCategories: () => void;
  isSheetVisible: boolean;
  setIsSheetVisible: (isVisible: boolean) => void;
  isDbReady: boolean;
  setSmsMessage: (message: string) => void;
  onExpenseAdded: () => Promise<void>;
};

export const ExpenseFormSheet = ({
  form,
  setForm,
  resetForm,
  categories,
  refetchCategories,
  isSheetVisible,
  setIsSheetVisible,
  isDbReady,
  setSmsMessage,
  onExpenseAdded,
}: TExpenseFormSheetProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', keywords: '', icon: '' });

  const clearForm = () => {
    Alert.alert('Clear Form', 'Are you sure you want to clear all fields?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          resetForm();
          setSmsMessage('');
          setIsSheetVisible(false);
        },
      },
    ]);
  };

  const addExpense = () => {
    if (!isDbReady) {
      return Alert.alert('Please Wait', 'Database is still initializing...');
    }

    void handleAddExpense(
      form,
      categories,
      resetForm,
      setSmsMessage,
      setIsSheetVisible,
      onExpenseAdded,
    );
  };

  const addCategory = () => {
    void handleAddCategory(
      newCategory,
      categories,
      refetchCategories,
      setForm,
      setShowNewCategoryModal,
      setNewCategory,
    );
  };

  const handleSuggestCategory = () =>
    suggestKeywordsFromDescription(form.description, setNewCategory, setShowNewCategoryModal);

  return (
    <BottomSheet visible={isSheetVisible} onClose={clearForm} height="85%">
      <View className="flex-col gap-3">
        <View className="flex-row justify-between items-center">
          <AppText className="text-xl">Category</AppText>
          <TouchableOpacity
            className="flex-row gap-2 bg-light-primary py-3 px-4 rounded-full items-center"
            onPress={() => setShowNewCategoryModal(true)}
          >
            <Ionicons name="add-outline" size={20} color="#fff" />
            <AppText className="text-white font-medium">New Category</AppText>
          </TouchableOpacity>
        </View>

        <View className="border border-gray-300 rounded-2xl overflow-hidden">
          <Picker
            selectedValue={form.category}
            onValueChange={(selectedCategoryName) => setForm({ category: selectedCategoryName })}
            style={{ height: 56 }}
          >
            {categories.map((category) => (
              <Picker.Item
                key={category.id || category.name}
                label={category.name}
                value={category.name}
              />
            ))}
          </Picker>
        </View>

        <Section title="Amount (LKR)">
          <AppTextInput
            placeholder="0.00"
            keyboardType="numeric"
            value={form.amount}
            onChangeText={(enteredAmount) => setForm({ amount: enteredAmount })}
            className="border border-gray-300 p-3 rounded-2xl"
          />
        </Section>

        <Section
          title="Description"
          rightButton={{
            label: 'Suggest Category',
            icon: 'sparkles-outline',
            onPress: handleSuggestCategory,
          }}
        >
          <AppTextInput
            placeholder="Add a note..."
            value={form.description}
            onChangeText={(text) => setForm({ description: text })}
            className="border rounded-xl border-gray-300 p-3 h-36"
            multiline
            textAlignVertical="top"
          />
        </Section>

        <Section title="Date">
          {PLATFORM.IS_WEB ? (
            <input
              type="date"
              value={formatDateForInput(form.date)}
              onChange={(event) => setForm({ date: new Date(event.target.value) })}
              className="border border-gray-300 p-3 bg-white"
            />
          ) : (
            <TouchableOpacity
              onPress={() => setShowDatePicker(!showDatePicker)}
              className="border rounded-xl border-gray-300 p-3 h-12 bg-white justify-center"
            >
              <AppText>{form.date ? form.date.toDateString() : 'Select Date'}</AppText>
            </TouchableOpacity>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={form.date || new Date()}
              mode="date"
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setForm({ date: selectedDate });
                }
              }}
            />
          )}
        </Section>

        <TouchableOpacity
          onPress={addExpense}
          className="bg-light-primary py-3 rounded-xl mt-4 items-center"
        >
          <AppText className="text-white font-semibold">Add Expense</AppText>
        </TouchableOpacity>
      </View>

      <CategorySheet
        visible={showNewCategoryModal}
        onClose={() => setShowNewCategoryModal(false)}
        onCreate={addCategory}
        newCategoryName={newCategory.name}
        setNewCategoryName={(name) => setNewCategory((prev) => ({ ...prev, name }))}
        newCategoryKeywords={newCategory.keywords}
        setNewCategoryKeywords={(keywords) => setNewCategory((prev) => ({ ...prev, keywords }))}
        newCategoryIcon={newCategory.icon}
        setNewCategoryIcon={(icon) => setNewCategory((prev) => ({ ...prev, icon }))}
      />
    </BottomSheet>
  );
};
