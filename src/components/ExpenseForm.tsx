import React, { useCallback, useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import StorageService from '@/database/StorageService';
import { Expense } from '@/database/models/Expense';
import { Category } from '@/database/models/Category';
import { transactionParser } from '@/transaction-parser/TransactionParser';
import IconPicker from '@/components/IconPicker';
import { Ionicons } from '@expo/vector-icons';

interface ExpenseFormProps {
  categories: Category[];
  isDbReady: boolean;
  onExpenseAdded: () => Promise<void>;
  refetchCategories: () => Promise<void>;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  categories,
  isDbReady,
  onExpenseAdded,
  refetchCategories,
}) => {
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState<string>('');
  const [smsMessage, setSmsMessage] = useState<string>('');
  const [isSmsExpanded, setIsSmsExpanded] = useState<boolean>(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // New Category Modal
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryKeywords, setNewCategoryKeywords] = useState('');

  // Learning data
  const [parsedMerchant, setParsedMerchant] = useState<string>('');
  const [originalCategory, setOriginalCategory] = useState<string>('');

  const [newCategoryIcon, setNewCategoryIcon] = useState('');

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

      // Set category name (for display in picker)
      setCategory(parsed.categoryName);
      setAmount(parsed.amount.toString());
      setDescription(parsed.merchant || '');
      setDate(parsed.date);

      // Store parsed data for learning
      setParsedMerchant(parsed.merchant || '');
      setOriginalCategory(parsed.categoryName);

      const dateText = parsed.date ? `\nDate: ${parsed.date.toDateString()}` : '';

      Alert.alert(
        'SMS Parsed Successfully',
        `Category: ${parsed.categoryName}
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

  const handleAddNewCategory = async () => {
    const categoryName = newCategoryName.trim().toUpperCase();
    const keywords = newCategoryKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (!categoryName) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    // Check if category already exists
    const existingCategory = categories.find((c) => c.name === categoryName);
    if (existingCategory) {
      Alert.alert('Error', 'This category already exists');
      return;
    }

    if (keywords.length === 0) {
      Alert.alert('Error', 'Please enter at least one keyword');
      return;
    }

    try {
      const now = new Date().toISOString();

      // Step 1: Insert the category into the database
      const category = await StorageService.insertCategory({
        name: categoryName,
        createdAt: now,
        icon: newCategoryIcon || 'pricetag',
        updatedAt: now,
      });

      // Step 2: Save keywords with the categoryId
      for (const keyword of keywords) {
        await StorageService.saveCategoryKeyword(keyword, category.id);
      }

      // Set the new category as selected
      setCategory(category.name);

      // Reset modal
      setNewCategoryName('');
      setNewCategoryKeywords('');
      setShowNewCategoryModal(false);

      // Refresh categories list
      await refetchCategories();

      Alert.alert(
        'Success',
        `Category "${categoryName}" created with ${keywords.length} keyword(s)`,
      );
    } catch (error) {
      console.error('Error adding new category:', error);
      Alert.alert('Error', 'Failed to create new category');
    }
  };

  const handleSuggestCategory = () => {
    if (!description.trim()) {
      Alert.alert('Hint', 'Add a description first, then we can suggest keywords from it');
      return;
    }

    // Extract potential keywords from description
    const words = description
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2); // Only words with 3+ characters

    setNewCategoryKeywords(words.join(', '));
    setShowNewCategoryModal(true);
  };

  const handleClearForm = () => {
    Alert.alert('Clear Form', 'Are you sure you want to clear all fields?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setAmount('');
          setDescription('');
          setSmsMessage('');
          setCategory('');
          setDate(null);
          setParsedMerchant('');
          setOriginalCategory('');
          setIsSmsExpanded(false);
          console.log('Form cleared');
        },
      },
    ]);
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

      // Category learning - need to get categoryId
      const selectedCategory = categories.find((c) => c.name === category);

      if (selectedCategory?.id) {
        // Learn from parsed merchant
        if (parsedMerchant) {
          await StorageService.saveCategoryKeyword(parsedMerchant, selectedCategory.id);

          if (category !== originalCategory) {
            console.log(`Learned: ${parsedMerchant} -> ${category}`);
          } else {
            console.log(`Reinforced: ${parsedMerchant} -> ${category}`);
          }
        }

        // Learn from description if present
        if (description.trim()) {
          await StorageService.saveCategoryKeyword(
            description.trim().toLowerCase(),
            selectedCategory.id,
          );
          console.log(`Learned from description: ${description} -> ${category}`);
        }
      }

      // Reset form
      setAmount('');
      setDescription('');
      setSmsMessage('');
      setCategory('');
      setDate(null);
      setParsedMerchant('');
      setOriginalCategory('');
      setIsSmsExpanded(false);

      await onExpenseAdded();

      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      const message = error instanceof Error ? error.message : 'Failed to add expense';
      Alert.alert('Error', message);
    }
  };

  const renderCategoryPicker = useCallback(() => {
    if (Platform.OS === 'ios') {
      return (
        <>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={styles.categoryButtonContent}>
              {category && categories.find((c) => c.name === category)?.icon && (
                <Ionicons
                  name={categories.find((c) => c.name === category)?.icon as any}
                  size={20}
                  color="#3498db"
                  style={styles.categoryIcon}
                />
              )}
              <Text style={styles.categoryButtonText}>{category || 'Select Category'}</Text>
            </View>
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
                  <Picker.Item label="Select Category" value="" />
                  {categories.map((c) => (
                    <Picker.Item
                      key={c.id || c.name}
                      label={`${c.icon ? '  ' : ''}${c.name}`}
                      value={c.name}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </Modal>
        </>
      );
    }

    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Category" value="" />
          {categories.map((c) => (
            <Picker.Item key={c.id || c.name} label={c.name} value={c.name} />
          ))}
        </Picker>
      </View>
    );
  }, [categories, category, showCategoryPicker]);

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Add New Expense</Text>

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
            multiline
            numberOfLines={4}
            value={smsMessage}
            onChangeText={setSmsMessage}
          />

          <View style={styles.buttonContainer}>
            <Button title="Parse SMS" onPress={handleParseSMS} color="#27ae60" />
          </View>

          <View style={styles.divider} />

          <View style={styles.categoryHeader}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={() => setShowNewCategoryModal(true)}
            >
              <Text style={styles.addCategoryButtonText}>+ New Category</Text>
            </TouchableOpacity>
          </View>

          {parsedMerchant && originalCategory && (
            <Text style={styles.learningHint}>💡 Change category to teach the app</Text>
          )}

          {renderCategoryPicker()}

          <Text style={styles.label}>Amount (LKR)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
          />

          <View style={styles.descriptionHeader}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TouchableOpacity style={styles.suggestButton} onPress={handleSuggestCategory}>
              <Text style={styles.suggestButtonText}>💡 Suggest Category</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add a note..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Date</Text>

          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={date ? date.toISOString().split('T')[0] : ''}
              onChange={(e) => setDate(new Date(e.target.value))}
              style={styles.webDateInput as any}
            />
          ) : (
            <TouchableOpacity
              onPress={() => setShowDatePicker(!showDatePicker)}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>
                {date ? date.toDateString() : 'Select Date'}
              </Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
            </TouchableOpacity>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearForm}>
              <Text style={styles.clearButtonText}>🗑️ Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
              <Text style={styles.addButtonText}>➕ Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* New Category Modal */}
      <Modal
        visible={showNewCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.newCategoryModal}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Category</Text>
                <TouchableOpacity onPress={() => setShowNewCategoryModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Category Icon (Optional)</Text>
              <IconPicker selectedIcon={newCategoryIcon} onSelectIcon={setNewCategoryIcon} />

              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., GROCERIES, ENTERTAINMENT"
                placeholderTextColor="#999"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Keywords (comma-separated)</Text>
              <Text style={styles.hint}>
                Add keywords that identify this category (e.g., store names, merchant types)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., keells, cargills, arpico"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={newCategoryKeywords}
                onChangeText={setNewCategoryKeywords}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowNewCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategoryKeywords('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createButton} onPress={handleAddNewCategory}>
                  <Text style={styles.createButtonText}>Create Category</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  learningHint: {
    fontSize: 13,
    color: '#27ae60',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addCategoryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addCategoryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  suggestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
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
  modalClose: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  iosPicker: {
    width: '100%',
    height: 200,
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
  webDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    width: '100%',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dateButtonIcon: {
    fontSize: 18,
    color: '#333',
  },
  newCategoryModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bab8b8',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 2,
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 8,
  },
});

export default ExpenseForm;
