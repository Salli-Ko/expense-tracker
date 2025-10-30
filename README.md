# 💰 Expense Tracker

A smart expense tracking app built with React Native and Expo that learns from your spending habits and automatically categorizes expenses from bank SMS messages.

## ✨ Features

### 🎯 Core Features
- **Expense Management**: Add, view, edit, and delete expenses
- **Category System**: Pre-defined categories (Food, Transportation, Health, etc.)
- **SMS Parsing**: Automatically extract transaction details from bank SMS
- **Smart Learning**: AI-powered category suggestions that improve over time
- **Total Tracking**: Real-time expense totals and summaries
- **Cross-Platform**: Works on iOS, Android, and Web

### 🧠 Machine Learning
- **Adaptive Learning**: App learns merchant-category associations from your corrections
- **Keyword Database**: Stores learned patterns in SQLite/IndexedDB
- **Confidence Scoring**: Prioritizes suggestions based on usage patterns
- **User Feedback Loop**: Gets smarter with every expense you add

### 📱 SMS Parser
- Extracts merchant name, amount, and transaction type
- Supports multiple bank SMS formats
- Suggests categories based on learned patterns
- Manual correction teaches the system

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build tooling
- **TypeScript** - Type-safe development
- **React Navigation** - Screen navigation

### Database
- **SQLite** (Mobile) - Local storage for iOS/Android
- **IndexedDB** (Web) - Browser storage for web platform
- Unified database interface for cross-platform compatibility

### Architecture
- **Custom Hooks** - Reusable logic (`useInitDatabase`)
- **Component-Based** - Modular, maintainable code
- **Service Layer** - Abstracted database operations
- **Error Boundaries** - Graceful error handling

## 📂 Project Structure

```
expense-tracker/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   └── index.tsx            # Home screen
│   ├── category-management.tsx  # Learned keywords screen
│   └── _layout.tsx              # Root layout with error boundary
├── components/
│   ├── ExpenseForm.tsx          # Add expense form
│   ├── ExpenseList.tsx          # List of expenses
│   └── ErrorBoundary.tsx        # Error boundary component
├── database/
│   ├── DatabaseService.ts       # SQLite service (mobile)
│   ├── DatabaseServiceWeb.ts    # IndexedDB service (web)
│   ├── StorageService.ts        # Platform router
│   ├── models/
│   │   ├── Expense.ts           # Expense model
│   │   └── CategoryKeyword.ts   # Keyword model
│   └── types.ts                 # Database interfaces
├── hooks/
│   └── useInitDatabase.ts       # Database initialization hook
├── transaction-parser/
│   └── TransactionParser.ts     # SMS parsing logic
├── constants/
│   └── defaultCategories.ts     # Default keyword mappings
└── assets/                       # Images, fonts, etc.
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npx expo start
```

4. Run on your platform
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for Web browser
- Scan QR code with Expo Go app for physical device

## 📱 Usage

### Adding an Expense

**Manual Entry:**
1. Tap "Parse Bank SMS" button
2. Select category
3. Enter amount
4. Add optional description
5. Tap "Add Expense"

**SMS Parsing:**
1. Copy a bank transaction SMS
2. Tap "Parse Bank SMS"
3. Paste the SMS message
4. Tap "Parse SMS"
5. Review and adjust if needed
6. Tap "Add Expense"

### Teaching the App

1. Parse an SMS or add an expense
2. If the category suggestion is wrong, change it
3. Save the expense
4. The app learns: `merchant → correct category`
5. Next time, it will suggest the correct category!

### Managing Learned Keywords

1. Tap the 🎓 icon in the header
2. View all learned merchant-category associations
3. See confidence scores
4. Delete incorrect associations if needed

## 🗄️ Database Schema

### Expenses Table
```sql
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  description TEXT
);
```

### Category Keywords Table
```sql
CREATE TABLE category_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  confidence INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 🧩 Key Components

### useInitDatabase Hook
Handles all database initialization and data loading:
- Opens database connection
- Creates tables
- Loads initial data (expenses, categories, totals)
- Provides refresh function
- Handles errors with retry mechanism

**Usage:**
```typescript
const { 
  isDbReady, 
  expenses, 
  totalExpenses, 
  categories,
  refreshExpenses 
} = useInitDatabase();
```

### ExpenseForm Component
Standalone form for adding expenses:
- SMS parsing
- Category selection (iOS/Android optimized)
- Learning system integration
- Form validation

**Props:**
```typescript
interface ExpenseFormProps {
  categories: string[];
  isDbReady: boolean;
  onExpenseAdded: () => Promise<void>;
}
```

### TransactionParser
Smart SMS parsing with learning:
```typescript
const parsed = await transactionParser.parse(smsText);
// Returns: { amount, merchant, category }

await transactionParser.learnCategory(merchant, category);
// Saves/updates merchant-category association
```

## 🔧 Configuration

### Categories
Edit `constants/defaultCategories.ts` to customize default keywords:
```typescript
export const DEFAULT_CATEGORIES = {
  FOOD: ['keells', 'cargills', 'arpico', 'restaurant'],
  TRANSPORTATION: ['uber', 'pickme', 'railway'],
  // Add more...
};
```

### TypeScript
`tsconfig.json` is configured with:
- `strict: false` - Allows flexible typing
- `noImplicitAny: false` - No implicit any errors
- Path aliases: `@/*` → `src/*`

### Prettier
Format code with:
```bash
npm run format
```

Configuration in `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## 🧪 Testing

### Manual Testing
1. Add expenses manually
2. Test SMS parsing with real bank messages
3. Verify category learning
4. Test on multiple platforms (iOS, Android, Web)

### Test Scenarios
- Parse SMS → Accept suggestion → Check confidence increases
- Parse SMS → Change category → Next time uses new category
- Delete expenses → Verify total updates
- Restart app → Verify data persists

## 🐛 Troubleshooting

### Database Not Initializing
- Check console for errors
- Tap "Retry" button
- Clear app data and restart

### SMS Parser Not Working
- Verify SMS format matches parser patterns
- Check console for parsing errors
- Add custom patterns in TransactionParser.ts

### iOS Picker Issues
- Fixed with modal-based picker
- If issues persist, check React Native Picker version

### TypeScript Errors
- Run `npx tsc --noEmit` to check types
- Restart TypeScript server in IDE
- Check tsconfig.json settings

## 📈 Roadmap

- [ ] Export expenses to CSV/PDF
- [ ] Monthly/weekly reports with charts
- [ ] Budget limits and alerts
- [ ] Recurring expense tracking
- [ ] Multiple currency support
- [ ] Cloud sync (optional)
- [ ] Receipt photo attachments
- [ ] Custom categories

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

Built with ❤️ using React Native and Expo

## 🙏 Acknowledgments

- React Native community
- Expo team
- SQLite and IndexedDB maintainers
- All open source contributors

---

**Happy Tracking! 💰📊**