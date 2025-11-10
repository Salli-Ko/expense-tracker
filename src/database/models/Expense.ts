export interface Expense {
  id?: number;
  category: string;
  amount: number;
  date: string; // ISO date string
  description?: string;
}