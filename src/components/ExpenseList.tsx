import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '@/database/models/Expense';
import { Category } from '@/database/models/Category';
import { AppText } from '@/components/AppText';

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[]; // Add categories prop
  onDeleteExpense: (id: number) => void;
  onEditExpense: (expense: Expense) => void;
}

interface GroupedExpenses {
  date: string;
  expenses: Expense[];
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  categories,
  onDeleteExpense,
  onEditExpense,
}) => {
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  // Helper function to get category icon
  const getCategoryIcon = (categoryName: string): string => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.icon || 'pricetag'; // Default icon if not found
  };

  // Group expenses by date
  const groupExpensesByDate = (): GroupedExpenses[] => {
    const grouped: Record<string, Expense[]> = {};

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(expense);
    });

    // Convert to array and sort by date (newest first)
    return Object.entries(grouped)
      .map(([date, expenses]) => ({
        date,
        expenses: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.expenses[0].date);
        const dateB = new Date(b.expenses[0].date);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const handleExpensePress = (expenseId: number) => {
    if (selectedExpenseId === expenseId) {
      setSelectedExpenseId(null); // Deselect if already selected
    } else {
      setSelectedExpenseId(expenseId);
    }
  };

  const formatAmount = (amount: number): string => {
    return amount.toFixed(2);
  };

  const groupedExpenses = groupExpensesByDate();

  if (expenses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AppText style={styles.emptyIcon}>📭</AppText>
        <AppText style={styles.emptyText}>No expenses yet</AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={groupedExpenses}
      keyExtractor={(item) => item.date}
      renderItem={({ item: group }) => (
        <View style={styles.dateGroup}>
          <View style={styles.dateHeader}>
            <AppText style={styles.dateText}>{group.date}</AppText>
            <AppText style={styles.dateTotal}>
              LKR {group.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
            </AppText>
          </View>

          {group.expenses.map((expense) => {
            const isSelected = selectedExpenseId === expense.id;
            const categoryIcon = getCategoryIcon(expense.category);

            return (
              <View key={expense.id}>
                <TouchableOpacity
                  style={[styles.expenseRow, isSelected && styles.expenseRowSelected]}
                  onPress={() => handleExpensePress(expense.id!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.expenseInfo}>
                    <View style={styles.expenseLeft}>
                      {/* Category with Icon */}
                      <View style={styles.categoryContainer}>
                        <Ionicons
                          name={categoryIcon as any}
                          size={20}
                          color="#3498db"
                          style={styles.categoryIcon}
                        />
                        <AppText style={styles.categoryText}>{expense.category}</AppText>
                      </View>

                      {/* Description */}
                      {expense.description && (
                        <AppText style={styles.descriptionText} numberOfLines={1}>
                          {expense.description}
                        </AppText>
                      )}
                    </View>

                    {/* Amount */}
                    <AppText style={styles.amountText}>LKR {formatAmount(expense.amount)}</AppText>
                  </View>
                </TouchableOpacity>

                {isSelected && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        onEditExpense(expense);
                        setSelectedExpenseId(null);
                      }}
                    >
                      <AppText style={styles.actionIcon}>✏️</AppText>
                      <AppText style={styles.actionText}>Edit</AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => {
                        onDeleteExpense(expense.id!);
                        setSelectedExpenseId(null);
                      }}
                    >
                      <AppText style={styles.actionIcon}>🗑️</AppText>
                      <AppText style={styles.actionText}>Delete</AppText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
      scrollEnabled={false}
      nestedScrollEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  dateGroup: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  dateTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
  expenseRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseRowSelected: {
    backgroundColor: '#e8f4f8',
    borderColor: '#3498db',
    borderWidth: 1,
  },
  expenseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  expenseLeft: {
    flex: 1,
    marginRight: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  descriptionText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 28, // Align with category text (icon width + margin)
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
  },
});

export default ExpenseList;
