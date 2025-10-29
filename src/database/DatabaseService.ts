import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Expense } from '@/database/models/Expense';
import { IDatabase } from '@/database/types';

SQLite.enablePromise(true);

class DatabaseService implements IDatabase {
  private db: SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  async openDatabase(): Promise<SQLiteDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    try {
      this.db = await SQLite.openDatabase({
        name: 'expenseTracker.db',
        location: 'default',
      });
      this.isInitialized = true;
      console.log('SQLite Database opened successfully');
      return this.db;
    } catch (error) {
      console.error('Error opening database:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  private ensureDbReady(): void {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not opened. Call openDatabase() first.');
    }
  }

  async createTables(): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.executeSql(
        `CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          description TEXT
        )`
      );
      console.log('Tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async insertExpense(expense: Omit<Expense, 'id'>): Promise<number> {
    this.ensureDbReady();

    try {
      const result = await this.db!.executeSql(
        'INSERT INTO expenses (category, amount, date, description) VALUES (?, ?, ?, ?)',
        [expense.category, expense.amount, expense.date, expense.description || null]
      );
      return result[0].insertId;
    } catch (error) {
      console.error('Error inserting expense:', error);
      throw error;
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    this.ensureDbReady();

    try {
      const results = await this.db!.executeSql('SELECT * FROM expenses ORDER BY date DESC');
      const expenses: Expense[] = [];

      const rows = results[0].rows;
      for (let i = 0; i < rows.length; i++) {
        expenses.push(rows.item(i));
      }

      return expenses;
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    this.ensureDbReady();

    try {
      const results = await this.db!.executeSql(
        'SELECT * FROM expenses WHERE category = ? ORDER BY date DESC',
        [category]
      );
      const expenses: Expense[] = [];

      const rows = results[0].rows;
      for (let i = 0; i < rows.length; i++) {
        expenses.push(rows.item(i));
      }

      return expenses;
    } catch (error) {
      console.error('Error getting expenses by category:', error);
      throw error;
    }
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    this.ensureDbReady();

    try {
      const results = await this.db!.executeSql(
        'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
        [startDate, endDate]
      );
      const expenses: Expense[] = [];

      const rows = results[0].rows;
      for (let i = 0; i < rows.length; i++) {
        expenses.push(rows.item(i));
      }

      return expenses;
    } catch (error) {
      console.error('Error getting expenses by date range:', error);
      throw error;
    }
  }

  async getTotalExpenses(): Promise<number> {
    this.ensureDbReady();

    try {
      const results = await this.db!.executeSql('SELECT SUM(amount) as total FROM expenses');
      return results[0].rows.item(0).total || 0;
    } catch (error) {
      console.error('Error getting total expenses:', error);
      throw error;
    }
  }

  async getTotalByCategory(category: string): Promise<number> {
    this.ensureDbReady();

    try {
      const results = await this.db!.executeSql(
        'SELECT SUM(amount) as total FROM expenses WHERE category = ?',
        [category]
      );
      return results[0].rows.item(0).total || 0;
    } catch (error) {
      console.error('Error getting total by category:', error);
      throw error;
    }
  }

  async updateExpense(expense: Expense): Promise<void> {
    this.ensureDbReady();

    if (!expense.id) {
      throw new Error('Expense ID is required for update');
    }

    try {
      await this.db!.executeSql(
        'UPDATE expenses SET category = ?, amount = ?, date = ?, description = ? WHERE id = ?',
        [expense.category, expense.amount, expense.date, expense.description || null, expense.id]
      );
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.executeSql('DELETE FROM expenses WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  async deleteAllExpenses(): Promise<void> {
    this.ensureDbReady();

    try {
      await this.db!.executeSql('DELETE FROM expenses');
    } catch (error) {
      console.error('Error deleting all expenses:', error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      console.log('Database closed');
      this.db = null;
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

export default new DatabaseService();