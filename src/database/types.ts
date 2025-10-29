import {Expense} from "@/database/models/Expense";

export interface DatabaseParams {
  name: string;
  location: string;
}

export interface SQLiteResult {
  insertId?: number;
  rowsAffected: number;
  rows: {
    length: number;
    item: (index: number) => any;
  };
}

export interface IDatabase {
  openDatabase(): Promise<any>;
  createTables(): Promise<void>;
  insertExpense(expense: Omit<Expense, 'id'>): Promise<number>;
  getAllExpenses(): Promise<Expense[]>;
  getExpensesByCategory(category: string): Promise<Expense[]>;
  getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]>;
  getTotalExpenses(): Promise<number>;
  getTotalByCategory(category: string): Promise<number>;
  updateExpense(expense: Expense): Promise<void>;
  deleteExpense(id: number): Promise<void>;
  deleteAllExpenses(): Promise<void>;
  closeDatabase(): Promise<void>;
  isReady(): boolean;
}