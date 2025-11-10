export interface Category {
  id?: number;
  name: string; // e.g., "Food", "Transport", etc.
  icon?: string; // Optional icon name
  color?: string; // Optional color
  createdAt: string;
  updatedAt: string;
}

export const CategorySchema = {
  name: 'categories',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL UNIQUE',
    icon: 'TEXT',
    color: 'TEXT',
    createdAt: 'TEXT NOT NULL',
    updatedAt: 'TEXT NOT NULL',
  },
};