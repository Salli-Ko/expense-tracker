import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import StorageService from '@/database/StorageService';
import { Expense, ExpenseCategory } from '@/database/models/Expense';
import { transactionParser } from '@/transaction-parser/TransactionParser';

interface ExpenseFormProps {
  categories: string[];
  isDbReady: boolean;
  onExpenseAdded: () => Promise<void>;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ categories, isDbReady, onExpenseAdded }) => {
  // Form states
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState<string>('');
  const [smsMessage, setSmsMessage] = useState<string>('');
  const [isSmsExpanded, setIsSmsExpanded] = useState<boolean>(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);

  // Track parsed data for learning
  const [parsedMerchant, setParsedMerchant] = useState<string>('');
  const [originalCategory, setOriginalCategory] = useState<string>('');

  const handleParseSMS = async () => {
    if (!smsMessage.trim()) {
      Alert.alert('Error', 'Please paste an SMS message');
      return;
    }

    try {
      const parsed = await transactionParser.parse(smsMessage);

      if (parsed.amount === 0) {
        Alert.alert('Error', 'Could not extract amount from the message');
        return;
      }

      // Use the category directly from parser (it uses database keywords)
      const suggestedCategory = parsed.category;

      // Set the suggested category (user can change it)
      setCategory(suggestedCategory);
      setAmount(parsed.amount.toString());
      setDescription(parsed.merchant || '');
      setDate(parsed.date);

      // Store parsed data
      setParsedMerchant(parsed.merchant || '');
      setOriginalCategory(parsed.category);

      // Build optional date text
      const dateText = parsed.date ? `\nDate: ${parsed.date}` : '';

      Alert.alert(
        'SMS Parsed Successfully',
        `Category: ${parsed.category}
          Amount: ${parsed.amount}
          Merchant: ${parsed.merchant || 'N/A'}${dateText}

          You can change the category if needed. The app will learn from your corrections.`,
        [{ text: 'OK' }],
      );
    } catch (error) {
      console.error('Error parsing SMS:', error);
      Alert.alert('Error', 'Failed to parse SMS message');
    }
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
        date: date ? date.toISOString() : new Date().toISOString(),
        description: description || undefined,
      };

      await StorageService.insertExpense(newExpense);

      // Learn from category correction if user changed it
      if (parsedMerchant && originalCategory) {
        // If user changed the category, learn the new association
        if (category !== originalCategory) {
          try {
            await transactionParser.learnCategory(parsedMerchant, category);
            console.log(`✅ Learned: ${parsedMerchant} -> ${category}`);
          } catch (error) {
            console.error('Error learning category:', error);
          }
        } else {
          // Even if category wasn't changed, reinforce the association
          try {
            await transactionParser.learnCategory(parsedMerchant, category);
            console.log(`✅ Reinforced: ${parsedMerchant} -> ${category}`);
          } catch (error) {
            console.error('Error reinforcing category:', error);
          }
        }
      }

      // Reset form and learning data
      setAmount('');
      setDescription('');
      setSmsMessage('');
      setCategory(categories[0] || ExpenseCategory.FOOD);
      setParsedMerchant('');
      setOriginalCategory('');

      // Notify parent to refresh data
      await onExpenseAdded();

      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add expense';
      Alert.alert('Error', errorMessage);
    }
  };

  const renderCategoryPicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.categoryButtonText}>{category}</Text>
            <Text style={styles.categoryButtonIcon}>▼</Text>
          </TouchableOpacity>

          <Modal
            visible={showCategoryPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCategoryPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Category</Text>
                  <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                    <Text style={styles.modalDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={category}
                  onValueChange={(value) => setCategory(value)}
                  style={styles.iosPicker}
                >
                  {categories.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>
          </Modal>
        </>
      );
    }

    // Android - use default picker
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value)}
          style={styles.picker}
        >
          {categories.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>
    );
  };

  return (
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
        <Text style={styles.smsToggleIcon}>{isSmsExpanded ? '▼' : '▶'}</Text>
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
            <Button title="Parse SMS" onPress={handleParseSMS} color="#27ae60" />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Category</Text>
          {parsedMerchant && originalCategory && (
            <Text style={styles.learningHint}>💡 Change category to teach the app</Text>
          )}

          {renderCategoryPicker()}

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
            <Button title="Add Expense" onPress={handleAddExpense} color="#3498db" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  learningHint: {
    fontSize: 13,
    color: '#27ae60',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  // iOS Category Button
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#333',
  },
  categoryButtonIcon: {
    fontSize: 16,
    color: '#666',
  },
  // iOS Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
  // Android Picker
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
});

export default ExpenseForm;