import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppTextInput } from '@/components/AppText';
import { ExpenseFormSheet } from '@/components/ExpenseFormSheet';
import { useExpenseFormState } from '@/hooks/useExpenseFormState';
import { Category } from '@/database/models/Category';
import { useSmsParser } from '@/hooks/useSMSParser';

type TSmsParserInputProps = {
  categories: Category[];
  refetchCategories: () => void;
  isDbReady: boolean;
  onExpenseAdded: () => Promise<void>;
};

export const SmsParserInput = ({
  categories,
  refetchCategories,
  isDbReady,
  onExpenseAdded,
}: TSmsParserInputProps) => {
  const [smsMessage, setSmsMessage] = useState('');
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const { error, parseSms } = useSmsParser();
  const { form, setForm, resetForm } = useExpenseFormState();

  const handleParseSMS = async () => {
    const parsed = await parseSms(smsMessage);
    if (!parsed) return;

    setForm({
      category: parsed.categoryName,
      amount: parsed.amount.toString(),
      description: parsed.merchant || '',
      date: parsed.date,
      parsedMerchant: parsed.merchant || '',
      originalCategory: parsed.categoryName,
    });

    setIsSheetVisible(true);
  };

  return (
    <View className="flex-col gap-3 mt-8">
      <AppText className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary">
        Add New Expense
      </AppText>

      <AppText className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
        Copy your bank SMS and paste it below. We’ll detect the amount automatically.
      </AppText>

      <AppTextInput
        placeholder="Paste your bank SMS here..."
        placeholderTextColor="#999"
        multiline
        textAlignVertical="top"
        className="border rounded-xl border-gray-300 p-3 h-36 bg-white dark:bg-dark-card"
        value={smsMessage}
        onChangeText={setSmsMessage}
      />

      {error && <AppText className="text-red-500 text-sm">{error}</AppText>}

      <TouchableOpacity
        onPress={handleParseSMS}
        activeOpacity={0.8}
        className="bg-light-primary py-3 rounded-xl mt-2 items-center"
      >
        <AppText className="text-white font-semibold text-base">Parse SMS</AppText>
      </TouchableOpacity>

      <ExpenseFormSheet
        isSheetVisible={isSheetVisible}
        setIsSheetVisible={setIsSheetVisible}
        categories={categories}
        refetchCategories={refetchCategories}
        isDbReady={isDbReady}
        onExpenseAdded={onExpenseAdded}
        setSmsMessage={setSmsMessage}
        form={form}
        setForm={setForm}
        resetForm={resetForm}
      />
    </View>
  );
};
