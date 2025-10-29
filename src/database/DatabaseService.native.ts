import * as SQLite from 'expo-sqlite';
import { Expense } from '@/database/models/Expense';
import { IDatabase } from '@/database/types';

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

      await this.db!.execAsync(
        `CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          description TEXT
        )`
      );

      console.log('✅ SQLite: Tables created successfully');
    } catch (error) {
      console.error('❌ SQLite: Error creating tables:', error);
      throw error;
    }
  }

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