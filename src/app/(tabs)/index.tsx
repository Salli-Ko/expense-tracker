import 'setimmediate';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Expense, ExpenseCategory } from '@/database/models/Expense';
import ExpenseList from '@/components/ExpenseList';
import StorageService from '@/database/StorageService'

const HomeScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState<string>(ExpenseCategory.FOOD);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [totalExpenses, setTotalExpenses] = useState<number>(0);

  useEffect(() => {
    initDatabase();
    return () => {
      StorageService.closeDatabase();
    };
  }, []);

  const initDatabase = async () => {
    try {
      await StorageService.openDatabase();
      await StorageService.createTables();
      await loadExpenses();
      await loadTotalExpenses();
    } catch (error) {
      console.error('Database initialization error:', error);
      Alert.alert('Error', 'Failed to initialize database');
    }
  };

  const loadExpenses = async () => {
    try {
      const expenseList = await StorageService.getAllExpenses();
      setExpenses(expenseList);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    }
  };

  const loadTotalExpenses = async () => {
    try {
      const total = await StorageService.getTotalExpenses();
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error loading total expenses:', error);
    }
  };

  const handleAddExpense = async () => {
    const amountNum = parseFloat(amount);

    if (!category || !amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please fill in all fields with valid data');
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
      setCategory(ExpenseCategory.FOOD);

      // Reload data
      await loadExpenses();
      await loadTotalExpenses();

      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expense Tracker</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Expenses:</Text>
          <Text style={styles.totalAmount}>${totalExpenses.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Category</Text>
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value)}
          style={styles.picker}
        >
          {Object.values(ExpenseCategory).map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Add a note..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Button title="Add Expense" onPress={handleAddExpense} />
      </View>

      <View style={styles.expensesList}>
        <Text style={styles.subtitle}>Recent Expenses</Text>
        <ExpenseList
          expenses={expenses}
          onDeleteExpense={handleDeleteExpense}
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
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: 60,
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
  },
  totalLabel: {
    fontSize: 16,
    color: '#fff',
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
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  expensesList: {
    flex: 1,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
    color: '#333',
  },
});

export default HomeScreen;