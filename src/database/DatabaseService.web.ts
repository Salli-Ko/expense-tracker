import { Expense } from '@/database/models/Expense';
import { Category } from '@/database/models/Category';
import { CategoryKeyword } from '@/database/models/CategoryKeyword';
import { IDatabase } from '@/database/types';
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';

class DatabaseServiceWeb implements IDatabase {
  private db: IDBDatabase | null = null;
  private isInitialized: boolean = false;
  private readonly DB_NAME = 'ExpenseTrackerDB';
  private readonly DB_VERSION = 3;
  private readonly CATEGORIES_STORE = 'categories';
  private readonly EXPENSES_STORE = 'expenses';
  private readonly KEYWORDS_STORE = 'category_keywords';

  async openDatabase(): Promise<IDBDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB: Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB: Database opened successfully');

        // Initialize default categories if needed
        this.initializeDefaultCategories().catch((err) =>
          console.warn('IndexedDB: Could not initialize default categories:', err),
        );

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        console.log(`IndexedDB: Upgrading from version ${oldVersion} to ${this.DB_VERSION}`);

        // Create categories store
        if (!db.objectStoreNames.contains(this.CATEGORIES_STORE)) {
          const categoriesStore = db.createObjectStore(this.CATEGORIES_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          categoriesStore.createIndex('name', 'name', { unique: true });
          console.log('IndexedDB: Categories store created');
        }

        // Create expenses store
        if (!db.objectStoreNames.contains(this.EXPENSES_STORE)) {
          const expensesStore = db.createObjectStore(this.EXPENSES_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          expensesStore.createIndex('category', 'category', { unique: false });
          expensesStore.createIndex('date', 'date', { unique: false });
          console.log('IndexedDB: Expenses store created');
        }

        // Create category_keywords store
        if (!db.objectStoreNames.contains(this.KEYWORDS_STORE)) {
          const keywordsStore = db.createObjectStore(this.KEYWORDS_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          keywordsStore.createIndex('keyword', 'keyword', { unique: true });
          keywordsStore.createIndex('categoryId', 'categoryId', { unique: false });
          keywordsStore.createIndex('confidence', 'confidence', { unique: false });
          console.log('IndexedDB: Category keywords store created');
        }
      };
    });
  }

  private ensureDbReady(): void {
    if (!this.db || !this.isInitialized) {
      throw new Error('IndexedDB database not opened. Call openDatabase() first.');
    }
  }

  async createTables(): Promise<void> {
    // Tables are created in openDatabase's onupgradeneeded
    await this.initializeDefaultCategories();
    return Promise.resolve();
  }

  private async initializeDefaultCategories(): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      const existingCategories = await this.getAllCategories();

      if (existingCategories.length > 0) {
        console.log('IndexedDB: Categories already initialized');
        return;
      }

      const now = new Date().toISOString();
      let categoryCount = 0;
      let keywordCount = 0;

      for (const [categoryName, categoryData] of Object.entries(DEFAULT_CATEGORIES)) {
        try {
          // Insert category with icon
          const categoryId = await this.insertCategory({
            name: categoryName,
            icon: categoryData.icon,
            createdAt: now,
            updatedAt: now,
          });
          categoryCount++;

          // Insert keywords for this category
          const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readwrite');
          const store = transaction.objectStore(this.KEYWORDS_STORE);

          for (const keyword of categoryData.keywords) {
            try {
              const newKeyword: Omit<CategoryKeyword, 'id'> = {
                keyword: keyword.toLowerCase().trim(),
                categoryId,
                confidence: 1,
                createdAt: now,
                updatedAt: now,
              };
              store.add(newKeyword);
              keywordCount++;
            } catch (error) {
              console.warn(`IndexedDB: Could not insert keyword "${keyword}"`);
            }
          }

          await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
          });
        } catch (error) {
          console.warn(`IndexedDB: Could not insert category "${categoryName}"`);
        }
      }

      console.log(
        `IndexedDB: Initialized ${categoryCount} categories and ${keywordCount} keywords`,
      );
    } catch (error) {
      console.error('IndexedDB: Error initializing default categories:', error);
    }
  }

  // ==================== CATEGORY METHODS ====================

  async getAllCategories(): Promise<Category[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CATEGORIES_STORE], 'readonly');
      const store = transaction.objectStore(this.CATEGORIES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const categories = request.result as Category[];
        categories.sort((a, b) => a.name.localeCompare(b.name));
        resolve(categories);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting categories:', request.error);
        reject(request.error);
      };
    });
  }

  async getCategoryById(id: number): Promise<Category | null> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CATEGORIES_STORE], 'readonly');
      const store = transaction.objectStore(this.CATEGORIES_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as Category) || null);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting category by ID:', request.error);
        reject(request.error);
      };
    });
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CATEGORIES_STORE], 'readonly');
      const store = transaction.objectStore(this.CATEGORIES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const categories = request.result as Category[];
        // Case-insensitive search
        const category = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
        resolve(category || null);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting category by name:', request.error);
        reject(request.error);
      };
    });
  }

  async insertCategory(category: Omit<Category, 'id'>, keywords?: string[]): Promise<Category> {
    this.ensureDbReady();

    try {
      // Check if category already exists
      const existing = await this.getCategoryByName(category.name);

      if (existing && existing.id) {
        console.log(
          `IndexedDB: Category "${category.name}" already exists with ID: ${existing.id}`,
        );

        // If keywords provided, add them to existing category
        if (keywords && keywords.length > 0) {
          let addedCount = 0;

          for (const keyword of keywords) {
            try {
              await this.saveCategoryKeyword(keyword.toLowerCase().trim(), existing.id);
              addedCount++;
            } catch (error) {
              console.warn(`IndexedDB: Could not add keyword "${keyword}" to existing category`);
            }
          }

          console.log(
            `IndexedDB: Added ${addedCount} keyword(s) to existing category "${category.name}"`,
          );
        }

        return existing;
      }

      // Insert new category
      const categoryId = await new Promise<number>((resolve, reject) => {
        const transaction = this.db!.transaction([this.CATEGORIES_STORE], 'readwrite');
        const store = transaction.objectStore(this.CATEGORIES_STORE);
        const request = store.add(category);

        request.onsuccess = () => {
          console.log('IndexedDB: Category inserted with ID:', request.result);
          resolve(request.result as number);
        };

        request.onerror = () => {
          console.error('IndexedDB: Error inserting category:', request.error);
          reject(request.error);
        };
      });

      // Add keywords to new category
      if (keywords && keywords.length > 0) {
        let addedCount = 0;

        for (const keyword of keywords) {
          try {
            await this.saveCategoryKeyword(keyword.toLowerCase().trim(), categoryId);
            addedCount++;
          } catch (error) {
            console.warn(`IndexedDB: Could not add keyword "${keyword}"`);
          }
        }

        console.log(`IndexedDB: Added ${addedCount} keyword(s) to new category "${category.name}"`);
      }

      // Return the complete category object
      const newCategory: Category = {
        id: categoryId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      };

      return newCategory;
    } catch (error) {
      console.error('IndexedDB: Error inserting category:', error);
      throw error;
    }
  }

  async updateCategory(category: Category): Promise<void> {
    this.ensureDbReady();

    if (!category.id) {
      throw new Error('Category ID is required for update');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CATEGORIES_STORE], 'readwrite');
      const store = transaction.objectStore(this.CATEGORIES_STORE);
      const request = store.put(category);

      request.onsuccess = () => {
        console.log('IndexedDB: Category updated');
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Error updating category:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteCategory(id: number): Promise<void> {
    this.ensureDbReady();

    return new Promise(async (resolve, reject) => {
      try {
        // First delete all keywords for this category
        const keywords = await this.getKeywordsForCategory(id);
        const transaction = this.db!.transaction(
          [this.CATEGORIES_STORE, this.KEYWORDS_STORE],
          'readwrite',
        );

        // Delete keywords
        const keywordsStore = transaction.objectStore(this.KEYWORDS_STORE);
        for (const keyword of keywords) {
          if (keyword.id) {
            keywordsStore.delete(keyword.id);
          }
        }

        // Delete category
        const categoriesStore = transaction.objectStore(this.CATEGORIES_STORE);
        categoriesStore.delete(id);

        transaction.oncomplete = () => {
          console.log('IndexedDB: Category and its keywords deleted');
          resolve();
        };

        transaction.onerror = () => {
          console.error('IndexedDB: Error deleting category:', transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error('IndexedDB: Error in deleteCategory:', error);
        reject(error);
      }
    });
  }

  // ==================== EXPENSE METHODS ====================

  async insertExpense(expense: Omit<Expense, 'id'>): Promise<number> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.EXPENSES_STORE], 'readwrite');
      const store = transaction.objectStore(this.EXPENSES_STORE);
      const request = store.add(expense);

      request.onsuccess = () => {
        console.log('IndexedDB: Expense inserted with ID:', request.result);
        resolve(request.result as number);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error inserting expense:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllExpenses(): Promise<Expense[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.EXPENSES_STORE], 'readonly');
      const store = transaction.objectStore(this.EXPENSES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const expenses = request.result as Expense[];
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(expenses);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting expenses:', request.error);
        reject(request.error);
      };
    });
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.EXPENSES_STORE], 'readonly');
      const store = transaction.objectStore(this.EXPENSES_STORE);
      const index = store.index('category');
      const request = index.getAll(category);

      request.onsuccess = () => {
        const expenses = request.result as Expense[];
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(expenses);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting expenses by category:', request.error);
        reject(request.error);
      };
    });
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.EXPENSES_STORE], 'readonly');
      const store = transaction.objectStore(this.EXPENSES_STORE);
      const index = store.index('date');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => {
        const expenses = request.result as Expense[];
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(expenses);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting expenses by date range:', request.error);
        reject(request.error);
      };
    });
  }

  async getTotalExpenses(): Promise<number> {
    const expenses = await this.getAllExpenses();
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  async getTotalByCategory(category: string): Promise<number> {
    const expenses = await this.getExpensesByCategory(category);
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  async updateExpense(expense: Expense): Promise<void> {
    this.ensureDbReady();

    if (!expense.id) {
      throw new Error('Expense ID is required for update');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.EXPENSES_STORE], 'readwrite');
      const store = transaction.objectStore(this.EXPENSES_STORE);
      const request = store.put(expense);

      request.onsuccess = () => {
        console.log('IndexedDB: Expense updated');
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Error updating expense:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteExpense(id: number): Promise<void> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.EXPENSES_STORE], 'readwrite');
      const store = transaction.objectStore(this.EXPENSES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('IndexedDB: Expense deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Error deleting expense:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteAllExpenses(): Promise<void> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.EXPENSES_STORE], 'readwrite');
      const store = transaction.objectStore(this.EXPENSES_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('IndexedDB: All expenses deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Error deleting all expenses:', request.error);
        reject(request.error);
      };
    });
  }

  // ==================== CATEGORY KEYWORD METHODS ====================

  async getAllCategoryKeywords(): Promise<CategoryKeyword[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readonly');
      const store = transaction.objectStore(this.KEYWORDS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const keywords = request.result as CategoryKeyword[];
        keywords.sort((a, b) => {
          if (b.confidence !== a.confidence) {
            return b.confidence - a.confidence;
          }
          return a.keyword.localeCompare(b.keyword);
        });
        resolve(keywords);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting category keywords:', request.error);
        reject(request.error);
      };
    });
  }

  async findCategoryKeyword(keyword: string): Promise<CategoryKeyword | null> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readonly');
      const store = transaction.objectStore(this.KEYWORDS_STORE);
      const index = store.index('keyword');
      const normalizedKeyword = keyword.toLowerCase().trim();
      const request = index.get(normalizedKeyword);

      request.onsuccess = () => {
        resolve((request.result as CategoryKeyword) || null);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error finding category keyword:', request.error);
        reject(request.error);
      };
    });
  }

  async saveCategoryKeyword(keyword: string, categoryId: number): Promise<void> {
    this.ensureDbReady();

    try {
      const normalizedKeyword = keyword.toLowerCase().trim();
      const existing = await this.findCategoryKeyword(normalizedKeyword);
      const now = new Date().toISOString();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readwrite');
        const store = transaction.objectStore(this.KEYWORDS_STORE);

        if (existing) {
          // Update existing keyword
          const updated: CategoryKeyword = {
            ...existing,
            categoryId,
            confidence: existing.categoryId === categoryId ? existing.confidence + 1 : 1,
            updatedAt: now,
          };

          const request = store.put(updated);

          request.onsuccess = () => {
            if (existing.categoryId === categoryId) {
              console.log(
                `IndexedDB: Incremented confidence for "${normalizedKeyword}" -> category ${categoryId}`,
              );
            } else {
              console.log(
                `IndexedDB: Updated "${normalizedKeyword}" from category ${existing.categoryId} to ${categoryId}`,
              );
            }
            resolve();
          };

          request.onerror = () => {
            console.error('IndexedDB: Error updating category keyword:', request.error);
            reject(request.error);
          };
        } else {
          // Create new keyword
          const newKeyword: Omit<CategoryKeyword, 'id'> = {
            keyword: normalizedKeyword,
            categoryId,
            confidence: 1,
            createdAt: now,
            updatedAt: now,
          };

          const request = store.add(newKeyword);

          request.onsuccess = () => {
            console.log(
              `IndexedDB: Created new keyword "${normalizedKeyword}" -> category ${categoryId}`,
            );
            resolve();
          };

          request.onerror = () => {
            console.error('IndexedDB: Error creating category keyword:', request.error);
            reject(request.error);
          };
        }
      });
    } catch (error) {
      console.error('IndexedDB: Error in saveCategoryKeyword:', error);
      throw error;
    }
  }

  async deleteCategoryKeyword(id: number): Promise<void> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readwrite');
      const store = transaction.objectStore(this.KEYWORDS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('IndexedDB: Category keyword deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Error deleting category keyword:', request.error);
        reject(request.error);
      };
    });
  }

  async getKeywordsForCategory(categoryId: number): Promise<CategoryKeyword[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readonly');
      const store = transaction.objectStore(this.KEYWORDS_STORE);
      const index = store.index('categoryId');
      const request = index.getAll(categoryId);

      request.onsuccess = () => {
        const keywords = request.result as CategoryKeyword[];
        keywords.sort((a, b) => b.confidence - a.confidence);
        resolve(keywords);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting keywords for category:', request.error);
        reject(request.error);
      };
    });
  }

  async searchLearnedCategory(text: string): Promise<number | null> {
    this.ensureDbReady();

    try {
      const lowerText = text.toLowerCase();
      const keywords = await this.getAllCategoryKeywords();

      const matches = keywords.filter((kw) => lowerText.includes(kw.keyword.toLowerCase()));

      if (matches.length === 0) {
        return null;
      }

      matches.sort((a, b) => b.confidence - a.confidence);

      console.log(
        `IndexedDB: Found learned category ${matches[0].categoryId} for text (confidence: ${matches[0].confidence})`,
      );
      return matches[0].categoryId; // Return categoryId, not the whole object
    } catch (error) {
      console.error('IndexedDB: Error searching learned category:', error);
      throw error;
    }
  }

  async deleteAllCategoryKeywords(): Promise<void> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readwrite');
      const store = transaction.objectStore(this.KEYWORDS_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('IndexedDB: All category keywords deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB: Error deleting all category keywords:', request.error);
        reject(request.error);
      };
    });
  }

  async getCategoryKeywordStats(): Promise<{
    totalKeywords: number;
    totalCategories: number;
    averageConfidence: number;
  }> {
    this.ensureDbReady();

    try {
      const keywords = await this.getAllCategoryKeywords();
      const uniqueCategories = new Set(keywords.map((k) => k.categoryId));
      const totalConfidence = keywords.reduce((sum, k) => sum + k.confidence, 0);

      return {
        totalKeywords: keywords.length,
        totalCategories: uniqueCategories.size,
        averageConfidence: keywords.length > 0 ? totalConfidence / keywords.length : 0,
      };
    } catch (error) {
      console.error('IndexedDB: Error getting keyword stats:', error);
      throw error;
    }
  }

  /**
   * Get expenses grouped by week for the current month
   */
  async getExpensesByWeekCurrentMonth(): Promise<
    Array<{
      week: number;
      weekStart: string;
      weekEnd: string;
      total: number;
    }>
  > {
    this.ensureDbReady();

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      // Get first and last day of current month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const allExpenses = await this.getAllExpenses();

      // Filter expenses for current month
      const expenses = allExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
      });

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
          const weekStart = new Date(year, month, (i - 1) * 7 + 1);
          const weekEnd = new Date(year, month, i * 7);
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
      console.error('IndexedDB: Error getting expenses by week:', error);
      throw error;
    }
  }

  /**
   * Get expenses by category for a specific month
   */
  async getExpensesByCategoryForMonth(
    year: number,
    month: number,
  ): Promise<
    Array<{
      category: string;
      total: number;
      count: number;
    }>
  > {
    this.ensureDbReady();

    try {
      const allExpenses = await this.getAllExpenses();

      // Filter expenses for the specified month
      const monthExpenses = allExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month - 1 && expenseDate.getFullYear() === year;
      });

      // Group by category
      const categoryMap: { [category: string]: { total: number; count: number } } = {};

      monthExpenses.forEach((expense) => {
        if (!categoryMap[expense.category]) {
          categoryMap[expense.category] = { total: 0, count: 0 };
        }
        categoryMap[expense.category].total += expense.amount;
        categoryMap[expense.category].count += 1;
      });

      // Convert to array and sort by total
      const results = Object.entries(categoryMap).map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
      }));

      results.sort((a, b) => b.total - a.total);

      return results;
    } catch (error) {
      console.error('IndexedDB: Error getting expenses by category for month:', error);
      throw error;
    }
  }

  // ==================== DATABASE MANAGEMENT ====================

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      console.log('IndexedDB: Database closed');
      this.db = null;
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

export default new DatabaseServiceWeb();
