import * as SQLite from 'expo-sqlite';
import { Expense } from '@/database/models/Expense';
import { Category } from '@/database/models/Category';
import { CategoryKeyword } from '@/database/models/CategoryKeyword';
import { IDatabase } from '@/database/types';
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';

class DatabaseServiceNative implements IDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  async openDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    try {
      console.log('SQLite: Opening database...');
      this.db = await SQLite.openDatabaseAsync('expenseTracker.db');
      this.isInitialized = true;
      console.log('SQLite: Database opened successfully');
      return this.db;
    } catch (error) {
      console.error('SQLite: Error opening database:', error);
      this.isInitialized = false;
      throw new Error(`Failed to open SQLite database: ${error}`);
    }
  }

  private ensureDbReady(): void {
    if (!this.db || !this.isInitialized) {
      throw new Error('SQLite database not opened. Call openDatabase() first.');
    }
  }

  async clearDatabase(): Promise<void> {
    this.ensureDbReady();

    try {
      console.log('SQLite: Clearing database...');

      // Drop all tables
      await this.db!.execAsync('DROP TABLE IF EXISTS category_keywords');
      await this.db!.execAsync('DROP TABLE IF EXISTS expenses');
      await this.db!.execAsync('DROP TABLE IF EXISTS categories');

      console.log('SQLite: All tables dropped');

      // Optionally recreate tables
      // await this.createTables();
    } catch (error) {
      console.error('SQLite: Error clearing database:', error);
      throw error;
    }
  }

  async createTables(): Promise<void> {
    this.ensureDbReady();

    try {
      console.log('SQLite: Creating tables...');

      // Create categories table
      await this.db!.execAsync(
        `CREATE TABLE IF NOT EXISTS categories
         (
             id
             INTEGER
             PRIMARY
             KEY
             AUTOINCREMENT,
             name
             TEXT
             NOT
             NULL
             UNIQUE,
             icon
             TEXT,
             color
             TEXT,
             createdAt
             TEXT
             NOT
             NULL,
             updatedAt
             TEXT
             NOT
             NULL
         )`,
      );

      // Create expenses table
      await this.db!.execAsync(
        `CREATE TABLE IF NOT EXISTS expenses
         (
             id
             INTEGER
             PRIMARY
             KEY
             AUTOINCREMENT,
             category
             TEXT
             NOT
             NULL,
             amount
             REAL
             NOT
             NULL,
             date
             TEXT
             NOT
             NULL,
             description
             TEXT
         )`,
      );

      // Create category_keywords table
      await this.db!.execAsync(
        `CREATE TABLE IF NOT EXISTS category_keywords
        (
            id
            INTEGER
            PRIMARY
            KEY
            AUTOINCREMENT,
            keyword
            TEXT
            NOT
            NULL
            UNIQUE,
            categoryId
            INTEGER
            NOT
            NULL,
            confidence
            INTEGER
            DEFAULT
            1,
            createdAt
            TEXT
            NOT
            NULL,
            updatedAt
            TEXT
            NOT
            NULL,
            FOREIGN
            KEY
         (
            categoryId
         ) REFERENCES categories
         (
             id
         ) ON DELETE CASCADE
            )`,
      );

      console.log('SQLite: Tables created successfully');

      // Initialize default categories and keywords
      await this.initializeDefaultCategories();
    } catch (error) {
      console.error('SQLite: Error creating tables:', error);
      throw error;
    }
  }

  private async initializeDefaultCategories(): Promise<void> {
    try {
      const existingCount = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM categories'
      );

      if (existingCount && existingCount.count > 0) {
        console.log('SQLite: Categories already initialized');
        return;
      }

      const now = new Date().toISOString();
      let categoryCount = 0;
      let keywordCount = 0;

      for (const [categoryName, categoryData] of Object.entries(DEFAULT_CATEGORIES)) {
        try {
          // Insert category with icon
          const result = await this.db!.runAsync(
            'INSERT INTO categories (name, icon, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
            [categoryName, categoryData.icon, now, now]
          );

          const categoryId = result.lastInsertRowId;
          categoryCount++;

          // Insert keywords for this category
          for (const keyword of categoryData.keywords) {
            try {
              await this.db!.runAsync(
                'INSERT INTO category_keywords (keyword, categoryId, confidence, createdAt, updatedAt) VALUES (?, ?, 1, ?, ?)',
                [keyword.toLowerCase().trim(), categoryId, now, now]
              );
              keywordCount++;
            } catch (error) {
              console.warn(`SQLite: Could not insert keyword "${keyword}"`);
            }
          }
        } catch (error) {
          console.warn(`SQLite: Could not insert category "${categoryName}"`);
        }
      }

      console.log(`SQLite: Initialized ${categoryCount} categories and ${keywordCount} keywords`);
    } catch (error) {
      console.error('SQLite: Error initializing default categories:', error);
    }
  }

  // ==================== CATEGORY METHODS ====================

  async getAllCategories(): Promise<Category[]> {
    this.ensureDbReady();

    try {
      const categories = await this.db!.getAllAsync<Category>(
        'SELECT * FROM categories ORDER BY name ASC',
      );
      return categories;
    } catch (error) {
      console.error('SQLite: Error getting categories:', error);
      throw error;
    }
  }

  async getCategoryById(id: number): Promise<Category | null> {
    this.ensureDbReady();

    try {
      const category = await this.db!.getFirstAsync<Category>(
        'SELECT * FROM categories WHERE id = ?',
        [id],
      );
      return category || null;
    } catch (error) {
      console.error('SQLite: Error getting category by ID:', error);
      throw error;
    }
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    this.ensureDbReady();

    try {
      const category = await this.db!.getFirstAsync<Category>(
        'SELECT * FROM categories WHERE LOWER(name) = LOWER(?)',
        [name],
      );
      return category || null;
    } catch (error) {
      console.error('SQLite: Error getting category by name:', error);
      throw error;
    }
  }

  async insertCategory(category: Omit<Category, 'id'>, keywords?: string[]): Promise<Category> {
    this.ensureDbReady();

    try {
      // Check if category already exists
      const existing = await this.getCategoryByName(category.name);

      if (existing && existing.id) {
        console.log(`SQLite: Category "${category.name}" already exists with ID: ${existing.id}`);

        // If keywords provided, add them to existing category
        if (keywords && keywords.length > 0) {
          const now = new Date().toISOString();
          let addedCount = 0;

          for (const keyword of keywords) {
            try {
              await this.saveCategoryKeyword(keyword.toLowerCase().trim(), existing.id);
              addedCount++;
            } catch (error) {
              console.warn(`SQLite: Could not add keyword "${keyword}" to existing category`);
            }
          }

          console.log(
            `SQLite: Added ${addedCount} keyword(s) to existing category "${category.name}"`,
          );
        }

        return existing;
      }

      // Insert new category
      const result = await this.db!.runAsync(
        'INSERT INTO categories (name, icon, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [
          category.name,
          category.icon || null,
          category.color || null,
          category.createdAt,
          category.updatedAt,
        ],
      );

      const categoryId = result.lastInsertRowId;
      console.log('SQLite: Category inserted with ID:', categoryId);

      // Add keywords to new category
      if (keywords && keywords.length > 0) {
        const now = new Date().toISOString();
        let addedCount = 0;

        for (const keyword of keywords) {
          try {
            await this.saveCategoryKeyword(keyword.toLowerCase().trim(), categoryId);
            addedCount++;
          } catch (error) {
            console.warn(`SQLite: Could not add keyword "${keyword}"`);
          }
        }

        console.log(`SQLite: Added ${addedCount} keyword(s) to new category "${category.name}"`);
      }

      return categoryId;
    } catch (error) {
      console.error('SQLite: Error inserting category:', error);
      throw error;
    }
  }

  async updateCategory(category: Category): Promise<void> {
    this.ensureDbReady();

    if (!category.id) {
      throw new Error('Category ID is required for update');
    }

    try {
      await this.db!.runAsync(
        'UPDATE categories SET name = ?, icon = ?, color = ?, updatedAt = ? WHERE id = ?',
        [
          category.name,
          category.icon || null,
          category.color || null,
          category.updatedAt,
          category.id,
        ],
      );
      console.log('SQLite: Category updated');
    } catch (error) {
      console.error('SQLite: Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.runAsync('DELETE FROM categories WHERE id = ?', [id]);
      console.log('SQLite: Category deleted (keywords cascade deleted)');
    } catch (error) {
      console.error('SQLite: Error deleting category:', error);
      throw error;
    }
  }

  // ==================== EXPENSE METHODS ====================

  async insertExpense(expense: Omit<Expense, 'id'>): Promise<number> {
    this.ensureDbReady();

    try {
      const result = await this.db!.runAsync(
        'INSERT INTO expenses (category, amount, date, description) VALUES (?, ?, ?, ?)',
        [expense.category, expense.amount, expense.date, expense.description || null],
      );
      console.log('SQLite: Expense inserted with ID:', result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('SQLite: Error inserting expense:', error);
      throw error;
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    this.ensureDbReady();

    try {
      const expenses = await this.db!.getAllAsync<Expense>(
        'SELECT * FROM expenses ORDER BY date DESC',
      );
      return expenses;
    } catch (error) {
      console.error('SQLite: Error getting expenses:', error);
      throw error;
    }
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    this.ensureDbReady();

    try {
      const expenses = await this.db!.getAllAsync<Expense>(
        'SELECT * FROM expenses WHERE category = ? ORDER BY date DESC',
        [category],
      );
      return expenses;
    } catch (error) {
      console.error('SQLite: Error getting expenses by category:', error);
      throw error;
    }
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    this.ensureDbReady();

    try {
      const expenses = await this.db!.getAllAsync<Expense>(
        'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
        [startDate, endDate],
      );
      return expenses;
    } catch (error) {
      console.error('SQLite: Error getting expenses by date range:', error);
      throw error;
    }
  }

  async getTotalExpenses(): Promise<number> {
    this.ensureDbReady();

    try {
      const result = await this.db!.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total
         FROM expenses
         WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`,
      );
      return result?.total || 0;
    } catch (error) {
      console.error('SQLite: Error getting total expenses:', error);
      throw error;
    }
  }

  async getTotalByCategory(category: string): Promise<number> {
    this.ensureDbReady();

    try {
      const result = await this.db!.getFirstAsync<{ total: number }>(
        'SELECT SUM(amount) as total FROM expenses WHERE category = ?',
        [category],
      );
      return result?.total || 0;
    } catch (error) {
      console.error('SQLite: Error getting total by category:', error);
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
        [expense.category, expense.amount, expense.date, expense.description || null, expense.id],
      );
      console.log('SQLite: Expense updated');
    } catch (error) {
      console.error('SQLite: Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
      console.log('SQLite: Expense deleted');
    } catch (error) {
      console.error('SQLite: Error deleting expense:', error);
      throw error;
    }
  }

  async deleteAllExpenses(): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.runAsync('DELETE FROM expenses');
      console.log('SQLite: All expenses deleted');
    } catch (error) {
      console.error('SQLite: Error deleting all expenses:', error);
      throw error;
    }
  }

  // ==================== CATEGORY KEYWORD METHODS ====================

  async getAllCategoryKeywords(): Promise<CategoryKeyword[]> {
    this.ensureDbReady();

    try {
      const keywords = await this.db!.getAllAsync<CategoryKeyword>(
        'SELECT * FROM category_keywords ORDER BY confidence DESC, keyword ASC',
      );
      return keywords;
    } catch (error) {
      console.error('SQLite: Error getting category keywords:', error);
      throw error;
    }
  }

  async findCategoryKeyword(keyword: string): Promise<CategoryKeyword | null> {
    this.ensureDbReady();

    try {
      const result = await this.db!.getFirstAsync<CategoryKeyword>(
        'SELECT * FROM category_keywords WHERE LOWER(keyword) = LOWER(?)',
        [keyword],
      );
      return result || null;
    } catch (error) {
      console.error('SQLite: Error finding category keyword:', error);
      throw error;
    }
  }

  async saveCategoryKeyword(keyword: string, categoryId: number): Promise<void> {
    this.ensureDbReady();

    try {
      const normalizedKeyword = keyword.toLowerCase().trim();
      const existing = await this.findCategoryKeyword(normalizedKeyword);
      const now = new Date().toISOString();

      if (existing) {
        if (existing.categoryId === categoryId) {
          // Same category - increment confidence
          await this.db!.runAsync(
            'UPDATE category_keywords SET confidence = confidence + 1, updatedAt = ? WHERE id = ?',
            [now, existing.id],
          );
          console.log(
            `SQLite: Incremented confidence for "${normalizedKeyword}" -> category ${categoryId}`,
          );
        } else {
          // Different category - update and reset confidence
          await this.db!.runAsync(
            'UPDATE category_keywords SET categoryId = ?, confidence = 1, updatedAt = ? WHERE id = ?',
            [categoryId, now, existing.id],
          );
          console.log(
            `SQLite: Updated "${normalizedKeyword}" from category ${existing.categoryId} to ${categoryId}`,
          );
        }
      } else {
        // New keyword - insert
        await this.db!.runAsync(
          'INSERT INTO category_keywords (keyword, categoryId, confidence, createdAt, updatedAt) VALUES (?, ?, 1, ?, ?)',
          [normalizedKeyword, categoryId, now, now],
        );
        console.log(`SQLite: Created new keyword "${normalizedKeyword}" -> category ${categoryId}`);
      }
    } catch (error) {
      console.error('SQLite: Error saving category keyword:', error);
      throw error;
    }
  }

  async deleteCategoryKeyword(id: number): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.runAsync('DELETE FROM category_keywords WHERE id = ?', [id]);
      console.log('SQLite: Category keyword deleted');
    } catch (error) {
      console.error('SQLite: Error deleting category keyword:', error);
      throw error;
    }
  }

  async getKeywordsForCategory(categoryId: number): Promise<CategoryKeyword[]> {
    this.ensureDbReady();

    try {
      const keywords = await this.db!.getAllAsync<CategoryKeyword>(
        'SELECT * FROM category_keywords WHERE categoryId = ? ORDER BY confidence DESC',
        [categoryId],
      );
      return keywords;
    } catch (error) {
      console.error('SQLite: Error getting keywords for category:', error);
      throw error;
    }
  }

  async searchLearnedCategory(text: string): Promise<number | null> {
    this.ensureDbReady();

    try {
      const lowerText = text.toLowerCase();
      const keywords = await this.getAllCategoryKeywords();

      // Find matching keywords
      const matches = keywords.filter((kw) => lowerText.includes(kw.keyword.toLowerCase()));

      if (matches.length === 0) {
        return null;
      }

      // Return categoryId with highest confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      console.log(
        `SQLite: Found learned category ${matches[0].categoryId} for text (confidence: ${matches[0].confidence})`,
      );
      return matches[0].categoryId;
    } catch (error) {
      console.error('SQLite: Error searching learned category:', error);
      throw error;
    }
  }

  async deleteAllCategoryKeywords(): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.runAsync('DELETE FROM category_keywords');
      console.log('SQLite: All category keywords deleted');
    } catch (error) {
      console.error('SQLite: Error deleting all category keywords:', error);
      throw error;
    }
  }

  async getCategoryKeywordStats(): Promise<{
    totalKeywords: number;
    totalCategories: number;
    averageConfidence: number;
  }> {
    this.ensureDbReady();

    try {
      const totalResult = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM category_keywords',
      );

      const categoriesResult = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(DISTINCT categoryId) as count FROM category_keywords',
      );

      const avgResult = await this.db!.getFirstAsync<{ avg: number }>(
        'SELECT AVG(confidence) as avg FROM category_keywords',
      );

      return {
        totalKeywords: totalResult?.count || 0,
        totalCategories: categoriesResult?.count || 0,
        averageConfidence: avgResult?.avg || 0,
      };
    } catch (error) {
      console.error('SQLite: Error getting keyword stats:', error);
      throw error;
    }
  }

  /**
   * Get expenses grouped by week for the current month
   */
  async getExpensesByWeekCurrentMonth(): Promise<Array<{
    week: number;
    weekStart: string;
    weekEnd: string;
    total: number;
  }>> {
    this.ensureDbReady();

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Get first and last day of current month
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      const expenses = await this.db!.getAllAsync<Expense>(
        `SELECT * FROM expenses 
       WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
       ORDER BY date ASC`
      );

      // Group expenses by week
      const weeklyData: { [key: number]: { total: number; dates: Date[] } } = {};

      expenses.forEach((expense) => {
        const expenseDate = new Date(expense.date);
        const dayOfMonth = expenseDate.getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7);

        if (!weeklyData[weekNumber]) {
          weeklyData[weekNumber] = { total: 0, dates: [] };
        }

        weeklyData[weekNumber].total += expense.amount;
        weeklyData[weekNumber].dates.push(expenseDate);
      });

      // Convert to array format
      const result = Object.entries(weeklyData).map(([week, data]) => {
        const dates = data.dates.sort((a, b) => a.getTime() - b.getTime());
        const weekStart = dates[0] || firstDay;
        const weekEnd = dates[dates.length - 1] || weekStart;

        return {
          week: parseInt(week),
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          total: data.total,
        };
      });

      // Ensure all weeks are present (1-5)
      const allWeeks = [];
      for (let i = 1; i <= 5; i++) {
        const existing = result.find((r) => r.week === i);
        if (existing) {
          allWeeks.push(existing);
        } else {
          // Calculate week start/end for empty weeks
          const weekStart = new Date(year, month - 1, (i - 1) * 7 + 1);
          const weekEnd = new Date(year, month - 1, i * 7);
          allWeeks.push({
            week: i,
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            total: 0,
          });
        }
      }

      return allWeeks;
    } catch (error) {
      console.error('SQLite: Error getting expenses by week:', error);
      throw error;
    }
  }

  /**
   * Get expenses by category for a specific month
   */
  async getExpensesByCategoryForMonth(year: number, month: number): Promise<Array<{
    category: string;
    total: number;
    count: number;
  }>> {
    this.ensureDbReady();

    try {
      const monthStr = month.toString().padStart(2, '0');
      const yearMonth = `${year}-${monthStr}`;

      const results = await this.db!.getAllAsync<{
        category: string;
        total: number;
        count: number;
      }>(
        `SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count
       FROM expenses
       WHERE strftime('%Y-%m', date) = ?
       GROUP BY category
       ORDER BY total DESC`,
        [yearMonth]
      );

      return results;
    } catch (error) {
      console.error('SQLite: Error getting expenses by category for month:', error);
      throw error;
    }
  }

  // ==================== DATABASE MANAGEMENT ====================

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      console.log('SQLite: Database closed');
      this.db = null;
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

export default new DatabaseServiceNative();
