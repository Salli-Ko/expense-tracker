import * as SQLite from 'expo-sqlite';
import { Expense } from '@/database/models/Expense';
import { CategoryKeyword } from '@/database/models/CategoryKeyword';
import { IDatabase } from '@/database/types';
import { DEFAULT_CATEGORIES } from "@/constants/defaultCategories";

class DatabaseServiceNative implements IDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  async openDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.db && this.isInitialized) {
      console.log('📦 SQLite: Database already open');
      return this.db;
    }

    try {
      console.log('📦 SQLite: Opening database...');

      this.db = await SQLite.openDatabaseAsync('expenseTracker.db');

      this.isInitialized = true;
      console.log('✅ SQLite: Database opened successfully');
      return this.db;
    } catch (error) {
      console.error('❌ SQLite: Error opening database:', error);
      this.isInitialized = false;
      throw new Error(`Failed to open SQLite database: ${error}`);
    }
  }

  private ensureDbReady(): void {
    if (!this.db || !this.isInitialized) {
      throw new Error('SQLite database not opened. Call openDatabase() first.');
    }
  }

  async createTables(): Promise<void> {
    this.ensureDbReady();

    try {
      console.log('📦 SQLite: Creating tables...');

      // Create expenses table
      await this.db!.execAsync(
        `CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          description TEXT
        )`
      );

      // Create category_keywords table
      await this.db!.execAsync(
        `CREATE TABLE IF NOT EXISTS category_keywords (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          keyword TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL,
          confidence INTEGER DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`
      );

      console.log('✅ SQLite: Tables created successfully');

      // Initialize default keywords if table is empty
      await this.initializeDefaultKeywords();
    } catch (error) {
      console.error('❌ SQLite: Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Initialize default category keywords if the table is empty
   */
  private async initializeDefaultKeywords(): Promise<void> {
    try {
      // Check if we already have keywords
      const existingCount = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM category_keywords'
      );

      if (existingCount && existingCount.count > 0) {
        console.log('📦 SQLite: Category keywords already initialized');
        return;
      }

      console.log('📦 SQLite: Initializing default category keywords...');
      const now = new Date().toISOString();
      let insertedCount = 0;

      // Insert all default keywords
      for (const [category, keywords] of Object.entries(DEFAULT_CATEGORIES)) {
        for (const keyword of keywords) {
          try {
            await this.db!.runAsync(
              'INSERT INTO category_keywords (keyword, category, confidence, createdAt, updatedAt) VALUES (?, ?, 1, ?, ?)',
              [keyword.toLowerCase().trim(), category, now, now]
            );
            insertedCount++;
          } catch (error) {
            // Skip duplicates or errors
            console.warn(`⚠️ SQLite: Could not insert keyword "${keyword}":`, error);
          }
        }
      }

      console.log(`✅ SQLite: Initialized ${insertedCount} default category keywords`);
    } catch (error) {
      console.error('❌ SQLite: Error initializing default keywords:', error);
      // Don't throw - this is not critical for app functionality
    }
  }

  // ==================== EXPENSE METHODS ====================

  async insertExpense(expense: Omit<Expense, 'id'>): Promise<number> {
    this.ensureDbReady();

    try {
      console.log('📦 SQLite: Inserting expense:', expense);

      const result = await this.db!.runAsync(
        'INSERT INTO expenses (category, amount, date, description) VALUES (?, ?, ?, ?)',
        [expense.category, expense.amount, expense.date, expense.description || null]
      );

      console.log('✅ SQLite: Expense inserted with ID:', result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('❌ SQLite: Error inserting expense:', error);
      throw error;
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    this.ensureDbReady();

    try {
      console.log('📦 SQLite: Fetching all expenses...');

      const expenses = await this.db!.getAllAsync<Expense>(
        'SELECT * FROM expenses ORDER BY date DESC'
      );

      console.log(`✅ SQLite: Fetched ${expenses.length} expenses`);
      return expenses;
    } catch (error) {
      console.error('❌ SQLite: Error getting expenses:', error);
      throw error;
    }
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    this.ensureDbReady();

    try {
      const expenses = await this.db!.getAllAsync<Expense>(
        'SELECT * FROM expenses WHERE category = ? ORDER BY date DESC',
        [category]
      );

      return expenses;
    } catch (error) {
      console.error('❌ SQLite: Error getting expenses by category:', error);
      throw error;
    }
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    this.ensureDbReady();

    try {
      const expenses = await this.db!.getAllAsync<Expense>(
        'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
        [startDate, endDate]
      );

      return expenses;
    } catch (error) {
      console.error('❌ SQLite: Error getting expenses by date range:', error);
      throw error;
    }
  }

  async getTotalExpenses(): Promise<number> {
    this.ensureDbReady();

    try {
      const result = await this.db!.getFirstAsync<{ total: number }>(
        'SELECT SUM(amount) as total FROM expenses'
      );
      return result?.total || 0;
    } catch (error) {
      console.error('❌ SQLite: Error getting total expenses:', error);
      throw error;
    }
  }

  async getTotalByCategory(category: string): Promise<number> {
    this.ensureDbReady();

    try {
      const result = await this.db!.getFirstAsync<{ total: number }>(
        'SELECT SUM(amount) as total FROM expenses WHERE category = ?',
        [category]
      );
      return result?.total || 0;
    } catch (error) {
      console.error('❌ SQLite: Error getting total by category:', error);
      throw error;
    }
  }

  async updateExpense(expense: Expense): Promise<void> {
    this.ensureDbReady();

    if (!expense.id) {
      throw new Error('Expense ID is required for update');
    }

    try {
      await this.db!.runAsync(
        'UPDATE expenses SET category = ?, amount = ?, date = ?, description = ? WHERE id = ?',
        [expense.category, expense.amount, expense.date, expense.description || null, expense.id]
      );
      console.log('✅ SQLite: Expense updated');
    } catch (error) {
      console.error('❌ SQLite: Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
      console.log('✅ SQLite: Expense deleted');
    } catch (error) {
      console.error('❌ SQLite: Error deleting expense:', error);
      throw error;
    }
  }

  async deleteAllExpenses(): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.runAsync('DELETE FROM expenses');
      console.log('✅ SQLite: All expenses deleted');
    } catch (error) {
      console.error('❌ SQLite: Error deleting all expenses:', error);
      throw error;
    }
  }

  // ==================== CATEGORY KEYWORD METHODS ====================

  /**
   * Get all learned category keywords
   */
  async getAllCategoryKeywords(): Promise<CategoryKeyword[]> {
    this.ensureDbReady();

    try {
      console.log('📦 SQLite: Fetching all category keywords...');

      const keywords = await this.db!.getAllAsync<CategoryKeyword>(
        'SELECT * FROM category_keywords ORDER BY confidence DESC, keyword ASC'
      );

      console.log(`✅ SQLite: Fetched ${keywords.length} category keywords`);
      return keywords;
    } catch (error) {
      console.error('❌ SQLite: Error getting category keywords:', error);
      throw error;
    }
  }

  /**
   * Find a category keyword by keyword string
   */
  async findCategoryKeyword(keyword: string): Promise<CategoryKeyword | null> {
    this.ensureDbReady();

    try {
      const result = await this.db!.getFirstAsync<CategoryKeyword>(
        'SELECT * FROM category_keywords WHERE LOWER(keyword) = LOWER(?)',
        [keyword]
      );

      return result || null;
    } catch (error) {
      console.error('❌ SQLite: Error finding category keyword:', error);
      throw error;
    }
  }

  /**
   * Save or update a category keyword association
   * If the keyword exists and category is different, update it
   * If the keyword exists and category is same, increment confidence
   * If the keyword doesn't exist, create it
   */
  async saveCategoryKeyword(keyword: string, category: string): Promise<void> {
    this.ensureDbReady();

    try {
      const normalizedKeyword = keyword.toLowerCase().trim();
      const existing = await this.findCategoryKeyword(normalizedKeyword);
      const now = new Date().toISOString();

      if (existing) {
        if (existing.category === category) {
          // Same category - increment confidence
          await this.db!.runAsync(
            'UPDATE category_keywords SET confidence = confidence + 1, updatedAt = ? WHERE id = ?',
            [now, existing.id]
          );
          console.log(`✅ SQLite: Incremented confidence for "${normalizedKeyword}" -> ${category}`);
        } else {
          // Different category - update and reset confidence
          await this.db!.runAsync(
            'UPDATE category_keywords SET category = ?, confidence = 1, updatedAt = ? WHERE id = ?',
            [category, now, existing.id]
          );
          console.log(`✅ SQLite: Updated "${normalizedKeyword}" from ${existing.category} to ${category}`);
        }
      } else {
        // New keyword - insert
        await this.db!.runAsync(
          'INSERT INTO category_keywords (keyword, category, confidence, createdAt, updatedAt) VALUES (?, ?, 1, ?, ?)',
          [normalizedKeyword, category, now, now]
        );
        console.log(`✅ SQLite: Created new keyword "${normalizedKeyword}" -> ${category}`);
      }
    } catch (error) {
      console.error('❌ SQLite: Error saving category keyword:', error);
      throw error;
    }
  }

  /**
   * Delete a category keyword by ID
   */
  async deleteCategoryKeyword(id: number): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.runAsync('DELETE FROM category_keywords WHERE id = ?', [id]);
      console.log('✅ SQLite: Category keyword deleted');
    } catch (error) {
      console.error('❌ SQLite: Error deleting category keyword:', error);
      throw error;
    }
  }

  /**
   * Get all keywords for a specific category
   */
  async getKeywordsForCategory(category: string): Promise<CategoryKeyword[]> {
    this.ensureDbReady();

    try {
      const keywords = await this.db!.getAllAsync<CategoryKeyword>(
        'SELECT * FROM category_keywords WHERE category = ? ORDER BY confidence DESC',
        [category]
      );

      return keywords;
    } catch (error) {
      console.error('❌ SQLite: Error getting keywords for category:', error);
      throw error;
    }
  }

  /**
   * Search for a category based on learned keywords in the given text
   * Returns the category with highest confidence if found
   */
  async searchLearnedCategory(text: string): Promise<string | null> {
    this.ensureDbReady();

    try {
      const lowerText = text.toLowerCase();
      const keywords = await this.getAllCategoryKeywords();

      // Find matching keywords
      const matches = keywords.filter(kw =>
        lowerText.includes(kw.keyword.toLowerCase())
      );

      if (matches.length === 0) {
        return null;
      }

      // Return category with highest confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      console.log(`✅ SQLite: Found learned category "${matches[0].category}" for text (confidence: ${matches[0].confidence})`);
      return matches[0].category;
    } catch (error) {
      console.error('❌ SQLite: Error searching learned category:', error);
      throw error;
    }
  }

  /**
   * Delete all learned category keywords
   */
  async deleteAllCategoryKeywords(): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.runAsync('DELETE FROM category_keywords');
      console.log('✅ SQLite: All category keywords deleted');
    } catch (error) {
      console.error('❌ SQLite: Error deleting all category keywords:', error);
      throw error;
    }
  }

  /**
   * Get statistics about learned keywords
   */
  async getCategoryKeywordStats(): Promise<{
    totalKeywords: number;
    totalCategories: number;
    averageConfidence: number;
  }> {
    this.ensureDbReady();

    try {
      const totalResult = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM category_keywords'
      );

      const categoriesResult = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(DISTINCT category) as count FROM category_keywords'
      );

      const avgResult = await this.db!.getFirstAsync<{ avg: number }>(
        'SELECT AVG(confidence) as avg FROM category_keywords'
      );

      return {
        totalKeywords: totalResult?.count || 0,
        totalCategories: categoriesResult?.count || 0,
        averageConfidence: avgResult?.avg || 0,
      };
    } catch (error) {
      console.error('❌ SQLite: Error getting keyword stats:', error);
      throw error;
    }
  }

  // ==================== DATABASE MANAGEMENT ====================

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      console.log('✅ SQLite: Database closed');
      this.db = null;
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

// Export instance
export default new DatabaseServiceNative();