import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import StorageService from '@/database/StorageService';
import { Expense, ExpenseCategory } from '@/database/models/Expense';
import ExpenseList from '@/components/ExpenseList';
import { transactionParser } from '@/transaction-parser/TransactionParser';

const HomeScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState<string>(ExpenseCategory.FOOD);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [smsMessage, setSmsMessage] = useState<string>('');
  const [isSmsExpanded, setIsSmsExpanded] = useState<boolean>(false);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    initDatabase();

    return () => {
      StorageService.closeDatabase().catch(console.error);
    };
  }, []);

  const initDatabase = async () => {
    try {
      setIsLoading(true);
      setError('');

      await StorageService.openDatabase();
      await StorageService.createTables();

      await loadExpenses();
      await loadTotalExpenses();

      setIsDbReady(true);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
      Alert.alert('Database Error', 'Failed to initialize database. Please restart the app.');
    }
  };

  const loadExpenses = async () => {
    try {
      const expenseList = await StorageService.getAllExpenses();
      setExpenses(expenseList);
    } catch (error) {
      throw error;
    }
  };

  const loadTotalExpenses = async () => {
    try {
      const total = await StorageService.getTotalExpenses();
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error loading total expenses:', error);
      throw error;
    }
  };

  const handleParseSMS = () => {
    if (!smsMessage.trim()) {
      Alert.alert('Error', 'Please paste an SMS message');
      return;
    }

    try {
      const parsed = transactionParser.parse(smsMessage);

      if (parsed.amount === 0) {
        Alert.alert('Error', 'Could not extract amount from the message');
        return;
      }

      // Map parsed category to ExpenseCategory enum
      const mappedCategory = mapToExpenseCategory(parsed.category);

      setCategory(mappedCategory);
      setAmount(parsed.amount.toString());
      setDescription(parsed.merchant || '');

      Alert.alert(
        'SMS Parsed Successfully',
        `Category: ${parsed.category}\nAmount: ${parsed.amount}\nMerchant: ${parsed.merchant || 'N/A'}`,
        [{ text: 'OK' }]
      );

      // Collapse SMS section after parsing
      setIsSmsExpanded(false);
    } catch (error) {
      console.error('Error parsing SMS:', error);
      Alert.alert('Error', 'Failed to parse SMS message');
    }
  };

  const mapToExpenseCategory = (parsedCategory: string): string => {
    const categoryMap: Record<string, string> = {
      'Groceries': ExpenseCategory.FOOD,
      'Food': ExpenseCategory.FOOD,
      'Dining': ExpenseCategory.FOOD,
      'Fuel': ExpenseCategory.TRANSPORTATION,
      'Transport': ExpenseCategory.TRANSPORTATION,
      'Healthcare': ExpenseCategory.HEALTH,
      'Entertainment': ExpenseCategory.ENTERTAINMENT,
      'Shopping': ExpenseCategory.SHOPPING,
      'Utilities': ExpenseCategory.UTILITIES,
      'Other': ExpenseCategory.OTHER,
    };

    return categoryMap[parsedCategory] || ExpenseCategory.OTHER;
  };

  const handleAddExpense = async () => {
    if (!isDbReady) {
      Alert.alert('Please Wait', 'Database is still loading...');
      return;
    }

    const amountNum = parseFloat(amount);

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }

    try {
      const newExpense: Omit<Expense, 'id'> = {
        category,
        amount: amountNum,
        date: new Date().toISOString(),
        description: description || undefined,
      };

      await StorageService.insertExpense(newExpense);

      // Reset form
      setAmount('');
      setDescription('');
      setSmsMessage('');
      setCategory(ExpenseCategory.FOOD);

      // Reload data
      await loadExpenses();
      await loadTotalExpenses();

      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add expense';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteExpense(id);

              await loadExpenses();
              await loadTotalExpenses();

              Alert.alert('Success', 'Expense deleted');
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const handleEditExpense = (expense: Expense) => {
    setCategory(expense.category);
    setAmount(expense.amount.toString());
    setDescription(expense.description || '');

    Alert.alert(
      'Edit Mode',
      'Form populated with expense data. Modify and save to update.',
      [{ text: 'OK' }]
    );
  };

  // Error state
  if (error && !isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={initDatabase} color="#3498db" />
      </View>
    );
  }

  // Loading state
  if (isLoading || !isDbReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading database...</Text>
      </View>
    );
  }

  // Main UI
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expense Tracker</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Expenses:</Text>
          <Text style={styles.totalAmount}>LKR {totalExpenses.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Add New Expense</Text>

        {/* Collapsible SMS Input Section */}
        <TouchableOpacity
          style={styles.smsToggle}
          onPress={() => setIsSmsExpanded(!isSmsExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.smsToggleText}>
            {isSmsExpanded ? '📱 Hide SMS Parser' : '📱 Parse Bank SMS'}
          </Text>
          <Text style={styles.smsToggleIcon}>
            {isSmsExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {isSmsExpanded && (
          <View style={styles.smsSection}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste your bank SMS here..."
              placeholderTextColor="#999"
              value={smsMessage}
              onChangeText={setSmsMessage}
              multiline
              numberOfLines={4}
            />
            <View style={styles.buttonContainer}>
              <Button
                title="Parse SMS"
                onPress={handleParseSMS}
                color="#27ae60"
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(value) => setCategory(value)}
                style={styles.picker}
              >
                {Object.values(ExpenseCategory).map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Amount (LKR)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Add Expense"
                onPress={handleAddExpense}
                color="#3498db"
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.expensesList}>
        <Text style={styles.subtitle}>Recent Expenses</Text>
        <ExpenseList
          expenses={expenses}
          onDeleteExpense={handleDeleteExpense}
          onEditExpense={handleEditExpense}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  smsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  smsToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
  },
  smsToggleIcon: {
    fontSize: 16,
    color: '#27ae60',
  },
  smsSection: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  expensesList: {
    flex: 1,
    marginTop: 8,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12,
    color: '#333',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});

export default HomeScreen;