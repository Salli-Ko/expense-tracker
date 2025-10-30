export interface CategoryKeyword {
  id?: number;
  keyword: string;
  categoryId: number; // Foreign key to categories table
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export const CategoryKeywordSchema = {
  name: 'category_keywords',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    keyword: 'TEXT NOT NULL UNIQUE',
    categoryId: 'INTEGER NOT NULL',
    confidence: 'INTEGER DEFAULT 1',
    createdAt: 'TEXT NOT NULL',
    updatedAt: 'TEXT NOT NULL',
  },
  foreignKeys: {
    categoryId: 'FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE',
  },
};