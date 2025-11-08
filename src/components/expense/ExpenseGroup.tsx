import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import ExpenseItemCard from '@/components/expense/ExpenseItemCard';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SwipeActions } from '@/components/expense/SwipeActions';
import { Expense } from '@/database/models/Expense';
import { IoniconName } from '@/constants/categoryColors';

type TExpenseGroupProps = {
  date: string;
  expenses: Expense[];
  getCategoryIcon: (category: string) => string;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
};

export const ExpenseGroup = ({
  date,
  expenses,
  getCategoryIcon,
  onEdit,
  onDelete,
}: TExpenseGroupProps) => (
  <View className="mb-6">
    <View className="flex-row justify-between items-center py-2 px-3 bg-light-secondary dark:bg-dark-secondary rounded-lg mb-3">
      <AppText className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
        {date}
      </AppText>
      <AppText className="text-sm font-semibold text-light-primary dark:text-dark-primary">
        LKR {expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
      </AppText>
    </View>

    {expenses.map((expense, idx) => (
      <View key={expense.id} className={idx > 0 ? 'mt-2.5' : ''}>
        <Swipeable
          renderRightActions={(progress) => (
            <SwipeActions
              progress={progress}
              expense={expense}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
          overshootRight={false}
        >
          <ExpenseItemCard
            icon={getCategoryIcon(expense.category) as IoniconName}
            label={expense.category}
            amount={`LKR ${expense.amount.toFixed(2)}`}
            description={expense.description}
          />
        </Swipeable>
      </View>
    ))}
  </View>
);
