export interface CategoryKeyword {
  id?: number;
  keyword: string; // The merchant name or keyword
  category: string; // The category it belongs to
  confidence: number; // How many times this association was confirmed (starts at 1)
  createdAt: string;
  updatedAt: string;
}

export const CategoryKeywordSchema = {
  name: 'category_keywords',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    keyword: 'TEXT NOT NULL UNIQUE',
    category: 'TEXT NOT NULL',
    confidence: 'INTEGER DEFAULT 1',
    createdAt: 'TEXT NOT NULL',
    updatedAt: 'TEXT NOT NULL',
  },
};