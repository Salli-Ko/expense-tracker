export interface Expense {
  id?: number;
  category: string;
  amount: number;
  date: string; // ISO date string
  description?: string;
}

export enum ExpenseCategory {
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  ENTERTAINMENT = 'Entertainment',
  UTILITIES = 'Utilities',
  HEALTHCARE = 'Healthcare',
  SHOPPING = 'Shopping',
  OTHER = 'Other',
}