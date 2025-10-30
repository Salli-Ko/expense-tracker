import { Expense } from '@/database/models/Expense';
import { CategoryKeyword } from '@/database/models/CategoryKeyword';
import { IDatabase } from '@/database/types';
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';

class DatabaseServiceWeb implements IDatabase {
  private db: IDBDatabase | null = null;
  private isInitialized: boolean = false;
  private readonly DB_NAME = 'ExpenseTrackerDB';
  private readonly DB_VERSION = 2; // Incremented for category_keywords store
  private readonly EXPENSES_STORE = 'expenses';
  private readonly KEYWORDS_STORE = 'category_keywords';

  async openDatabase(): Promise<IDBDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB: Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('✅ IndexedDB: Database opened successfully');

        // Initialize default keywords if needed (async, don't wait)
        this.initializeDefaultKeywords().catch((err) =>
          console.warn('⚠️ IndexedDB: Could not initialize default keywords:', err),
        );

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        console.log(`📦 IndexedDB: Upgrading from version ${oldVersion} to ${this.DB_VERSION}`);

        // Create expenses store
        if (!db.objectStoreNames.contains(this.EXPENSES_STORE)) {
          const expensesStore = db.createObjectStore(this.EXPENSES_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes for faster queries
          expensesStore.createIndex('category', 'category', { unique: false });
          expensesStore.createIndex('date', 'date', { unique: false });

          console.log('✅ IndexedDB: Expenses store created');
        }

        // Create category_keywords store
        if (!db.objectStoreNames.contains(this.KEYWORDS_STORE)) {
          const keywordsStore = db.createObjectStore(this.KEYWORDS_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes
          keywordsStore.createIndex('keyword', 'keyword', { unique: true });
          keywordsStore.createIndex('category', 'category', { unique: false });
          keywordsStore.createIndex('confidence', 'confidence', { unique: false });

          console.log('✅ IndexedDB: Category keywords store created');
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
    // Initialize default keywords if needed
    await this.initializeDefaultKeywords();
    return Promise.resolve();
  }

  /**
   * Initialize default category keywords if database is empty
   */
  private async initializeDefaultKeywords(): Promise<void> {
    this.ensureDbReady();

    try {
      const existingKeywords = await this.getAllCategoryKeywords();

      if (existingKeywords.length > 0) {
        console.log('✅ IndexedDB: Keywords already exist, skipping initialization');
        return;
      }

      console.log('📦 IndexedDB: Initializing default category keywords...');

      const now = new Date().toISOString();
      const promises: Promise<void>[] = [];

      for (const [category, keywords] of Object.entries(DEFAULT_CATEGORIES)) {
        for (const keyword of keywords) {
          const categoryKeyword: Omit<CategoryKeyword, 'id'> = {
            keyword: keyword.toLowerCase().trim(),
            category,
            confidence: 1,
            createdAt: now,
            updatedAt: now,
          };

          const promise = new Promise<void>((resolve, reject) => {
            const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readwrite');
            const store = transaction.objectStore(this.KEYWORDS_STORE);
            const request = store.add(categoryKeyword);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });

          promises.push(promise);
        }
      }

      await Promise.all(promises);
      console.log(`✅ IndexedDB: Initialized ${promises.length} default keywords`);
    } catch (error) {
      console.error('❌ IndexedDB: Error initializing default keywords:', error);
      throw error;
    }
  }

  /**
   * Initialize default category keywords if the table is empty
   */
  private async initializeDefaultKeywords(): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      // Check if we already have keywords
      const existingKeywords = await this.getAllCategoryKeywords();

      if (existingKeywords.length > 0) {
        console.log('📦 IndexedDB: Category keywords already initialized');
        return;
      }

      console.log('📦 IndexedDB: Initializing default category keywords...');
      const now = new Date().toISOString();
      let insertedCount = 0;

      // Insert all default keywords
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readwrite');
      const store = transaction.objectStore(this.KEYWORDS_STORE);

      for (const [category, keywords] of Object.entries(DEFAULT_CATEGORIES)) {
        for (const keyword of keywords) {
          try {
            const newKeyword: Omit<CategoryKeyword, 'id'> = {
              keyword: keyword.toLowerCase().trim(),
              category,
              confidence: 1,
              createdAt: now,
              updatedAt: now,
            };

            store.add(newKeyword);
            insertedCount++;
          } catch (error) {
            // Skip duplicates or errors
            console.warn(`⚠️ IndexedDB: Could not insert keyword "${keyword}"`);
          }
        }
      }

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`✅ IndexedDB: Initialized ${insertedCount} default category keywords`);
          resolve();
        };
        transaction.onerror = () => {
          console.warn('⚠️ IndexedDB: Error during default keywords initialization');
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('❌ IndexedDB: Error initializing default keywords:', error);
      // Don't throw - this is not critical for app functionality
    }
  }

  // ==================== EXPENSE METHODS ====================

  async insertExpense(expense: Omit<Expense, 'id'>): Promise<number> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.EXPENSES_STORE], 'readwrite');
      const store = transaction.objectStore(this.EXPENSES_STORE);
      const request = store.add(expense);

      request.onsuccess = () => {
        console.log('✅ IndexedDB: Expense inserted with ID:', request.result);
        resolve(request.result as number);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error inserting expense:', request.error);
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
        // Sort by date descending
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        console.log(`✅ IndexedDB: Fetched ${expenses.length} expenses`);
        resolve(expenses);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error getting expenses:', request.error);
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
        console.error('❌ IndexedDB: Error getting expenses by category:', request.error);
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
        console.error('❌ IndexedDB: Error getting expenses by date range:', request.error);
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
        console.log('✅ IndexedDB: Expense updated');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error updating expense:', request.error);
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
        console.log('✅ IndexedDB: Expense deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error deleting expense:', request.error);
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
        console.log('✅ IndexedDB: All expenses deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error deleting all expenses:', request.error);
        reject(request.error);
      };
    });
  }

  // ==================== CATEGORY KEYWORD METHODS ====================

  /**
   * Get all learned category keywords
   */
  async getAllCategoryKeywords(): Promise<CategoryKeyword[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readonly');
      const store = transaction.objectStore(this.KEYWORDS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const keywords = request.result as CategoryKeyword[];
        // Sort by confidence descending, then keyword ascending
        keywords.sort((a, b) => {
          if (b.confidence !== a.confidence) {
            return b.confidence - a.confidence;
          }
          return a.keyword.localeCompare(b.keyword);
        });
        console.log(`✅ IndexedDB: Fetched ${keywords.length} category keywords`);
        resolve(keywords);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error getting category keywords:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Find a category keyword by keyword string
   */
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
        console.error('❌ IndexedDB: Error finding category keyword:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save or update a category keyword association
   */
  async saveCategoryKeyword(keyword: string, category: string): Promise<void> {
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
            category,
            confidence: existing.category === category ? existing.confidence + 1 : 1,
            updatedAt: now,
          };

          const request = store.put(updated);

          request.onsuccess = () => {
            if (existing.category === category) {
              console.log(
                `✅ IndexedDB: Incremented confidence for "${normalizedKeyword}" -> ${category}`,
              );
            } else {
              console.log(
                `✅ IndexedDB: Updated "${normalizedKeyword}" from ${existing.category} to ${category}`,
              );
            }
            resolve();
          };

          request.onerror = () => {
            console.error('❌ IndexedDB: Error updating category keyword:', request.error);
            reject(request.error);
          };
        } else {
          // Create new keyword
          const newKeyword: Omit<CategoryKeyword, 'id'> = {
            keyword: normalizedKeyword,
            category,
            confidence: 1,
            createdAt: now,
            updatedAt: now,
          };

          const request = store.add(newKeyword);

          request.onsuccess = () => {
            console.log(`✅ IndexedDB: Created new keyword "${normalizedKeyword}" -> ${category}`);
            resolve();
          };

          request.onerror = () => {
            console.error('❌ IndexedDB: Error creating category keyword:', request.error);
            reject(request.error);
          };
        }
      });
    } catch (error) {
      console.error('❌ IndexedDB: Error in saveCategoryKeyword:', error);
      throw error;
    }
  }

  /**
   * Delete a category keyword by ID
   */
  async deleteCategoryKeyword(id: number): Promise<void> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readwrite');
      const store = transaction.objectStore(this.KEYWORDS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('✅ IndexedDB: Category keyword deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error deleting category keyword:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all keywords for a specific category
   */
  async getKeywordsForCategory(category: string): Promise<CategoryKeyword[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readonly');
      const store = transaction.objectStore(this.KEYWORDS_STORE);
      const index = store.index('category');
      const request = index.getAll(category);

      request.onsuccess = () => {
        const keywords = request.result as CategoryKeyword[];
        // Sort by confidence descending
        keywords.sort((a, b) => b.confidence - a.confidence);
        resolve(keywords);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error getting keywords for category:', request.error);
        reject(request.error);
      };
    });
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
      const matches = keywords.filter((kw) => lowerText.includes(kw.keyword.toLowerCase()));

      if (matches.length === 0) {
        return null;
      }

      // Return category with highest confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      console.log(
        `✅ IndexedDB: Found learned category "${matches[0].category}" for text (confidence: ${matches[0].confidence})`,
      );
      return matches[0].category;
    } catch (error) {
      console.error('❌ IndexedDB: Error searching learned category:', error);
      throw error;
    }
  }

  /**
   * Delete all learned category keywords
   */
  async deleteAllCategoryKeywords(): Promise<void> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.KEYWORDS_STORE], 'readwrite');
      const store = transaction.objectStore(this.KEYWORDS_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('✅ IndexedDB: All category keywords deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error deleting all category keywords:', request.error);
        reject(request.error);
      };
    });
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
      const keywords = await this.getAllCategoryKeywords();
      const uniqueCategories = new Set(keywords.map((k) => k.category));
      const totalConfidence = keywords.reduce((sum, k) => sum + k.confidence, 0);

      return {
        totalKeywords: keywords.length,
        totalCategories: uniqueCategories.size,
        averageConfidence: keywords.length > 0 ? totalConfidence / keywords.length : 0,
      };
    } catch (error) {
      console.error('❌ IndexedDB: Error getting keyword stats:', error);
      throw error;
    }
  }

  // ==================== DATABASE MANAGEMENT ====================

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      console.log('✅ IndexedDB: Database closed');
      this.db = null;
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

export default new DatabaseServiceWeb();
