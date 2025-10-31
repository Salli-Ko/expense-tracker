# 💰 Expense Tracker

A smart expense tracking app built with React Native and Expo that learns from your spending habits and automatically categorizes expenses from bank SMS messages.

## ✨ Features

### 🎯 Core Features
- **Expense Management**: Add, view, edit, and delete expenses
- **Category System**: Pre-defined categories (Food, Transportation, Health, etc.)
- **Custom Categories**: Create your own categories with keywords
- **SMS Parsing**: Automatically extract transaction details from bank SMS
- **Smart Learning**: category suggestions that improve over time
- **Total Tracking**: Real-time expense totals and summaries
- **📊 Analytics Dashboard**: Visual insights into your spending patterns
- **Cross-Platform**: Works on iOS, Android, and Web

### 📊 Charts & Analytics
- **Weekly Spending Bar Chart**: Track spending across weeks of the month
- **Category Breakdown Pie Chart**: Visualize spending distribution by category
- **Summary Statistics**: Total, highest week, and average spending
- **Progress Bars**: Visual representation of category spending percentages
- **Transaction Counts**: See how many transactions per category
- **Auto-Refresh**: Charts update automatically when you switch tabs

### 📱 SMS Parser
- Extracts merchant name, amount, date, and transaction type
- Supports multiple bank SMS formats
- Suggests categories based on learned patterns
- Manual correction teaches the system

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build tooling
- **TypeScript** - Type-safe development
- **React Navigation** - Screen navigation
- **React Native Gifted Charts** - Beautiful charts and data visualization

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
│   │   ├── index.tsx            # Home screen with expenses
│   │   └── charts.tsx           # Analytics dashboard
│   ├── category-management.tsx  # Learned keywords screen
│   └── _layout.tsx              # Root layout with error boundary
├── components/
│   ├── ExpenseForm.tsx          # Add expense form
│   └── ExpenseList.tsx          # List of expenses
├── database/
│   ├── DatabaseServiceNative.ts # SQLite service (mobile)
│   ├── DatabaseServiceWeb.ts    # IndexedDB service (web)
│   ├── StorageService.ts        # Platform router
│   ├── models/
│   │   ├── Expense.ts           # Expense model
│   │   ├── Category.ts          # Category entity model
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
# or
yarn install
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
1. Open the "Expenses" tab
2. Tap "Parse Bank SMS" to expand the form
3. Select category
4. Enter amount
5. Add optional description and date
6. Tap "Add Expense"

**SMS Parsing:**
1. Copy a bank transaction SMS
2. Tap "Parse Bank SMS" button
3. Paste the SMS message
4. Tap "Parse SMS"
5. Review and adjust category if needed
6. Tap "Add Expense"

### Creating Custom Categories

1. Tap "+ New Category" in the expense form
2. Enter category name (e.g., "ENTERTAINMENT")
3. Add keywords (e.g., "netflix, spotify, cinema")
4. Tap "Create Category"
5. The category is now available for all expenses

### Viewing Analytics

1. Navigate to the "Charts" tab
2. View weekly spending breakdown (bar chart)
3. See category distribution (pie chart)
4. Check summary statistics
5. Scroll through detailed breakdown
6. Charts auto-refresh when you add expenses

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

### Categories Table
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

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
  categoryId INTEGER NOT NULL,
  confidence INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
);
```

## 🧩 Key Components

### Charts Screen
Interactive analytics dashboard with:
- **Weekly Bar Chart**: Shows spending for each week of the current month
- **Category Pie Chart**: Donut chart with percentage breakdown
- **Summary Cards**: Total, highest week, and average spending
- **Detailed Breakdown**: Progress bars and transaction counts
- **Auto-refresh**: Updates when screen comes into focus

**Database Methods:**
```typescript
// Get weekly spending data
const weeklyData = await StorageService.getExpensesByWeekCurrentMonth();

// Get category breakdown for a month
const categoryData = await StorageService.getExpensesByCategoryForMonth(2025, 1);
```

### useInitDatabase Hook
Handles all database initialization and data loading:
- Opens database connection
- Creates tables (categories, expenses, category_keywords)
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
  refreshExpenses,
  refetchCategories
} = useInitDatabase();
```

### ExpenseForm Component
Standalone form for adding expenses:
- SMS parsing
- Category selection (iOS/Android optimized)
- Custom category creation
- Learning system integration
- Form validation
- Clear button

**Props:**
```typescript
interface ExpenseFormProps {
  categories: Category[];
  isDbReady: boolean;
  onExpenseAdded: () => Promise<void>;
  refetchCategories: () => Promise<void>;
}
```

### TransactionParser
Smart SMS parsing with learning:
```typescript
const parsed = await transactionParser.parse(smsText);
// Returns: { categoryId, categoryName, amount, merchant, date }

await StorageService.saveCategoryKeyword(merchant, categoryId);
// Saves/updates merchant-category association
```

## 🔧 Configuration

### Categories
Edit `constants/defaultCategories.ts` to customize default keywords:
```typescript
export const DEFAULT_CATEGORIES = {
  FOOD: ['keells', 'cargills', 'arpico', 'restaurant', 'cafe'],
  TRANSPORT: ['uber', 'pickme', 'railway', 'bus'],
  HEALTH: ['pharmacy', 'hospital', 'doctor', 'clinic'],
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

### Manual Testing Checklist
- [ ] Add expenses manually
- [ ] Test SMS parsing with real bank messages
- [ ] Verify category learning
- [ ] Create custom categories
- [ ] Test on multiple platforms (iOS, Android, Web)
- [ ] Check charts update after adding expenses
- [ ] Verify weekly breakdown accuracy
- [ ] Test category pie chart percentages

### Test Scenarios
- **Learning**: Parse SMS → Accept suggestion → Check confidence increases
- **Correction**: Parse SMS → Change category → Next time uses new category
- **Charts**: Add expense → Switch to Charts tab → Verify data updates
- **Persistence**: Delete expenses → Verify total updates → Restart app → Verify data persists
- **Categories**: Create category → Add keywords → Verify appears in picker

### Completed ✅
- [x] Core expense tracking
- [x] SMS parsing
- [x] Machine learning system
- [x] Category management
- [x] Weekly bar chart
- [x] Category pie chart
- [x] Custom categories

## 🎨 Design Features

### UI/UX Highlights
- **Tab Navigation**: Easy switching between Expenses and Charts
- **Card-based Design**: Clean, modern interface
- **Color Coding**: Categories have distinct colors in charts
- **Responsive**: Adapts to different screen sizes
- **Dark Mode Ready**: Prepared for dark theme implementation
- **Smooth Animations**: Chart animations for better UX
- **Loading States**: Clear feedback during data operations

### Accessibility
- Clear labels and descriptions
- Sufficient color contrast
- Touch-friendly button sizes
- Readable font sizes
- Screen reader support (planned)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Update README for new features
- Test on iOS, Android, and Web
- Keep dependencies minimal

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Author

Built with ❤️ using React Native and Expo

## 🙏 Acknowledgments

- React Native community
- Expo team
- React Navigation
- React Native Gifted Charts
- SQLite and IndexedDB maintainers
- All open source contributors

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with details
4. Include device/platform information
5. Attach console logs if possible

---

**Happy Tracking! 💰📊**

### Screenshots
```
┌─────────────────────┐  ┌─────────────────────┐
│   💰 Expenses       │  │   📊 Charts         │
├─────────────────────┤  ├─────────────────────┤
│ Add New Expense     │  │ Weekly Spending     │
│ • SMS Parser        │  │ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐│
│ • Category Picker   │  │ │ │ │ │ │ │ │ │ │ ││
│ • Amount & Date     │  │ └─┘ └─┘ └─┘ └─┘ └─┘│
│                     │  │  W1  W2  W3  W4  W5 │
│ Recent Expenses     │  │                     │
│ • Food - LKR 450    │  │ Category Breakdown  │
│ • Transport - 200   │  │ ┌──────────────┐   │
│ • Health - 1500     │  │ │ 🥧 Pie Chart │   │
└─────────────────────┘  └─────────────────────┘
```