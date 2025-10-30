import {Expense} from "@/database/models/Expense";
import {CategoryKeyword} from "@/database/models/CategoryKeyword";

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

  /**
   * Get all learned category keywords
   * @returns Array of all category keywords sorted by confidence (desc) and keyword (asc)
   */
  getAllCategoryKeywords(): Promise<CategoryKeyword[]>;

  /**
   * Find a specific category keyword by keyword string
   * @param keyword - The keyword to search for (case-insensitive)
   * @returns The category keyword if found, null otherwise
   */
  findCategoryKeyword(keyword: string): Promise<CategoryKeyword | null>;

  /**
   * Save or update a category keyword association
   * - If keyword exists with same category: increment confidence
   * - If keyword exists with different category: update category and reset confidence to 1
   * - If keyword doesn't exist: create new with confidence 1
   * @param keyword - The merchant/keyword name (will be normalized to lowercase)
   * @param category - The category to associate with the keyword
   */
  saveCategoryKeyword(keyword: string, category: string): Promise<void>;

  /**
   * Delete a category keyword by ID
   * @param id - The ID of the keyword to delete
   */
  deleteCategoryKeyword(id: number): Promise<void>;

  /**
   * Get all keywords for a specific category
   * @param category - The category to filter by
   * @returns Array of keywords for the category, sorted by confidence (desc)
   */
  getKeywordsForCategory(category: string): Promise<CategoryKeyword[]>;

  /**
   * Search for a learned category based on text content
   * Checks if any learned keywords appear in the text
   * @param text - The text to search (e.g., SMS message, merchant name)
   * @returns The category with highest confidence if found, null otherwise
   */
  searchLearnedCategory(text: string): Promise<string | null>;

  /**
   * Delete all learned category keywords
   * Use with caution - this removes all learning data
   */
  deleteAllCategoryKeywords(): Promise<void>;

  /**
   * Get statistics about learned keywords
   * @returns Object containing total keywords, categories, and average confidence
   */
  getCategoryKeywordStats(): Promise<{
    totalKeywords: number;
    totalCategories: number;
    averageConfidence: number;
  }>;
}