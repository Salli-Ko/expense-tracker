import { Expense } from '@/database/models/Expense';

export const groupExpensesByDate = (expenses: Expense[]) => {
  const grouped: Record<string, Expense[]> = {};

  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(expense);
  });

  return Object.entries(grouped)
    .map(([date, expenses]) => ({
      date,
      expenses: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }))
    .sort((a, b) => {
      const dateA = new Date(a.expenses[0].date);
      const dateB = new Date(b.expenses[0].date);
      return dateB.getTime() - dateA.getTime();
    });
};

export const formatAmount = (amount: number): string => amount.toFixed(2);
