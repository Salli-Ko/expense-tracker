import { Platform } from 'react-native';
import DatabaseService from '@/database/DatabaseService';
import WebDatabaseService from '@/database/WebDatabaseService';
import { IDatabase } from '@/database/types';

const IS_WEB = Platform.OS === 'web';

// Automatically switch between SQLite (mobile) and IndexedDB (web)
const StorageService: IDatabase = IS_WEB
  ? WebDatabaseService
  : DatabaseService;

console.log(`📦 Using ${IS_WEB ? 'IndexedDB' : 'SQLite'} storage on ${Platform.OS}`);

// Validate the service loaded correctly
if (!StorageService) {
  throw new Error('Failed to initialize StorageService');
}

export default StorageService;