import React from 'react';
import { View, FlatList } from 'react-native';
import { AppText } from '@/components/AppText';
import { ExpenseGroup } from '@/components/expense/ExpenseGroup';
import { Expense } from '@/database/models/Expense';
import { Category } from '@/database/models/Category';
import { groupExpensesByDate } from '@/util/expenses';

type TExpenseListProps = {
  expenses: Expense[];
  categories: Category[];
  onDeleteExpense: (id: number) => void;
  onEditExpense: (expense: Expense) => void;
};

export default function ExpenseList({
  expenses,
  categories,
  onDeleteExpense,
  onEditExpense,
}: TExpenseListProps) {
  const getCategoryIcon = (categoryName: string): string =>
    categories.find((category) => category.name === categoryName)?.icon || 'pricetag';

  const groupedExpenses = groupExpensesByDate(expenses);

  if (expenses.length === 0) {
    return (
      <View className="flex items-center justify-center py-16">
        <AppText className="text-5xl mb-3">📭</AppText>
        <AppText className="text-base text-light-text-secondary dark:text-dark-text-secondary">
          No expenses yet
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={groupedExpenses}
      keyExtractor={(item) => item.date}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <ExpenseGroup
          date={item.date}
          expenses={item.expenses}
          getCategoryIcon={getCategoryIcon}
          onEdit={onEditExpense}
          onDelete={onDeleteExpense}
        />
      )}
    />
  );
}
