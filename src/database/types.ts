import { Expense } from '@/database/models/Expense';
import { Category } from '@/database/models/Category';
import { CategoryKeyword } from '@/database/models/CategoryKeyword';

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
  // ==================== DATABASE MANAGEMENT ====================
  openDatabase(): Promise<any>;
  createTables(): Promise<void>;
  closeDatabase(): Promise<void>;
  isReady(): boolean;

  // ==================== CATEGORY METHODS ====================
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | null>;
  getCategoryByName(name: string): Promise<Category | null>;
  insertCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: number): Promise<void>;

  // ==================== EXPENSE METHODS ====================
  insertExpense(expense: Omit<Expense, 'id'>): Promise<number>;
  getAllExpenses(): Promise<Expense[]>;
  getExpensesByCategory(category: string): Promise<Expense[]>;
  getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]>;
  getTotalExpenses(): Promise<number>;
  getTotalByCategory(category: string): Promise<number>;
  updateExpense(expense: Expense): Promise<void>;
  deleteExpense(id: number): Promise<void>;
  deleteAllExpenses(): Promise<void>;

  // ==================== CATEGORY KEYWORD METHODS ====================
  getAllCategoryKeywords(): Promise<CategoryKeyword[]>;
  findCategoryKeyword(keyword: string): Promise<CategoryKeyword | null>;
  saveCategoryKeyword(keyword: string, categoryId: number): Promise<void>;
  deleteCategoryKeyword(id: number): Promise<void>;
  getKeywordsForCategory(categoryId: number): Promise<CategoryKeyword[]>;
  searchLearnedCategory(text: string): Promise<number | null>;
  deleteAllCategoryKeywords(): Promise<void>;
  getCategoryKeywordStats(): Promise<{
    totalKeywords: number;
    totalCategories: number;
    averageConfidence: number;
  }>;
}