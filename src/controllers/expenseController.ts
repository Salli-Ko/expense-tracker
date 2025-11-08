import { Alert } from "react-native";
import StorageService from "@/database/StorageService";
import { Expense } from "@/database/models/Expense";
import { TExpenseFormState } from '@/hooks/useExpenseFormState';
import { Category } from '@/database/models/Category';

/**
 * Handles deleting an expense with confirmation and refresh callback.
 */
export const handleDeleteExpense = async (
  id: number,
  refreshExpenses: () => Promise<void>
) => {
  Alert.alert("Delete Expense", "Are you sure you want to delete this expense?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          await StorageService.deleteExpense(id);
          await refreshExpenses();
          Alert.alert("Success", "Expense deleted successfully");
        } catch (error) {
          console.error("Error deleting expense:", error);
          Alert.alert("Error", "Failed to delete expense");
        }
      },
    },
  ]);
};

/**
 * Handles edit expense logic.
 * For now, it's a placeholder for future edit functionality.
 */
export const handleEditExpense = (expense: Expense) => {
  Alert.alert("Edit Mode", "Edit functionality coming soon!", [{ text: "OK" }]);
};

export const handleAddExpense = async (
  form: TExpenseFormState,
  categories: Category[],
  resetForm: () => void,
  setSmsMessage: (msg: string) => void,
  setIsSheetVisible: (v: boolean) => void,
  onExpenseAdded: () => Promise<void>,
) => {
  const amount = parseFloat(form.amount);
  if (!form.category) return Alert.alert('Error', 'Select a category');
  if (isNaN(amount) || amount <= 0) return Alert.alert('Error', 'Enter valid amount');

  try {
    const expense: Omit<Expense, 'id'> = {
      category: form.category,
      amount,
      date: (form.date || new Date()).toISOString(),
      description: form.description || undefined,
    };

    await StorageService.insertExpense(expense);
    const cat = categories.find(c => c.name === form.category);

    if (cat?.id) {
      const keywords = [form.parsedMerchant, form.description?.trim().toLowerCase()].filter(Boolean) as string[];
      for (const word of keywords) await StorageService.saveCategoryKeyword(word, cat.id);
    }

    resetForm();
    setSmsMessage('');
    setIsSheetVisible(false);
    await onExpenseAdded();
    Alert.alert('Success', 'Expense added successfully!');
  } catch (err) {
    console.error(err);
    Alert.alert('Error', 'Failed to add expense');
  }
};