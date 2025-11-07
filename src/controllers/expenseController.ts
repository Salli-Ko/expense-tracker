import { Alert } from "react-native";
import StorageService from "@/database/StorageService";
import { Expense } from "@/database/models/Expense";

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