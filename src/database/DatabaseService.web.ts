import { Expense } from '@/database/models/Expense';
import { IDatabase } from '@/database/types';

class DatabaseServiceWeb implements IDatabase {
  private db: IDBDatabase | null = null;
  private isInitialized: boolean = false;
  private readonly DB_NAME = 'ExpenseTrackerDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'expenses';

  async openDatabase(): Promise<IDBDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes for faster queries
          objectStore.createIndex('category', 'category', { unique: false });
          objectStore.createIndex('date', 'date', { unique: false });

          console.log('IndexedDB object store created');
        }
      };
    });
  }

  private ensureDbReady(): void {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not opened. Call openDatabase() first.');
    }
  }

  async createTables(): Promise<void> {
    // Tables are created in openDatabase's onupgradeneeded
    // This method exists for interface compatibility
    return Promise.resolve();
  }

  async insertExpense(expense: Omit<Expense, 'id'>): Promise<number> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(expense);

      request.onsuccess = () => {
        console.log('Expense inserted with ID:', request.result);
        resolve(request.result as number);
      };

      request.onerror = () => {
        console.error('Error inserting expense:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllExpenses(): Promise<Expense[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const expenses = request.result as Expense[];
        // Sort by date descending
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(expenses);
      };

      request.onerror = () => {
        console.error('Error getting expenses:', request.error);
        reject(request.error);
      };
    });
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('category');
      const request = index.getAll(category);

      request.onsuccess = () => {
        const expenses = request.result as Expense[];
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(expenses);
      };

      request.onerror = () => {
        console.error('Error getting expenses by category:', request.error);
        reject(request.error);
      };
    });
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('date');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => {
        const expenses = request.result as Expense[];
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(expenses);
      };

      request.onerror = () => {
        console.error('Error getting expenses by date range:', request.error);
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
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(expense);

      request.onsuccess = () => {
        console.log('Expense updated');
        resolve();
      };

      request.onerror = () => {
        console.error('Error updating expense:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteExpense(id: number): Promise<void> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Expense deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting expense:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteAllExpenses(): Promise<void> {
    this.ensureDbReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('All expenses deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting all expenses:', request.error);
        reject(request.error);
      };
    });
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      console.log('Database closed');
      this.db = null;
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

export default new DatabaseServiceWeb();