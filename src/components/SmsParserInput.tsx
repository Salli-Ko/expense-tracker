import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppTextInput } from '@/components/AppText';
import { transactionParser } from '@/transaction-parser/TransactionParser';
import { ExpenseFormSheet } from '@/components/ExpenseFormSheet';
import { Category } from '@/database/models/Category';

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
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState<string>('');
  const [parsedMerchant, setParsedMerchant] = useState<string>('');
  const [originalCategory, setOriginalCategory] = useState<string>('');

  const handleParseSMS = async () => {
    if (!smsMessage.trim()) {
      alert('Please paste your bank SMS first');
      return;
    }

    try {
      const parsed = await transactionParser.parse(smsMessage);

      if (!parsed || parsed.amount === 0) {
        alert('Could not extract amount or category from this message');
        return;
      }

      // Set category name (for display in picker)
      setCategory(parsed.categoryName);
      setAmount(parsed.amount.toString());
      setDescription(parsed.merchant || '');
      setDate(parsed.date);

      // Store parsed data for learning
      setParsedMerchant(parsed.merchant || '');
      setOriginalCategory(parsed.categoryName);

      setIsSheetVisible(true);
    } catch (error) {
      console.error('Error parsing SMS:', error);
      alert('Failed to parse SMS message');
    }
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
        category={category}
        categories={categories}
        description={description}
        setDescription={setDescription}
        setCategory={setCategory}
        refetchCategories={refetchCategories}
        amount={amount}
        setAmount={setAmount}
        parsedMerchant={parsedMerchant}
        originalCategory={originalCategory}
        setParsedMerchant={setParsedMerchant}
        setOriginalCategory={setOriginalCategory}
        date={date}
        setDate={setDate}
        isDbReady={isDbReady}
        onExpenseAdded={onExpenseAdded}
        setSmsMessage={setSmsMessage}
      />
    </View>
  );
};
