// This file automatically imports the correct implementation based on platform
// No platform checks needed - React Native handles it!

// For web: imports from DatabaseService.web.ts (which doesn't exist, so it falls back)
// For iOS/Android: imports from DatabaseService.native.ts
import DatabaseService from './DatabaseService';

console.log('StorageService loaded (platform-specific)');

export default DatabaseService;
