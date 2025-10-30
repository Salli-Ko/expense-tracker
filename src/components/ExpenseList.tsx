import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Expense } from '@/database/models/Expense';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: number) => void;
  onEditExpense: (expense: Expense) => void;
}

interface GroupedExpenses {
  date: string;
  expenses: Expense[];
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense, onEditExpense }) => {
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

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
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No expenses yet</Text>
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
            <Text style={styles.dateText}>{group.date}</Text>
            <Text style={styles.dateTotal}>
              LKR {group.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
            </Text>
          </View>

          {group.expenses.map((expense) => {
            const isSelected = selectedExpenseId === expense.id;

            return (
              <View key={expense.id}>
                <TouchableOpacity
                  style={[styles.expenseRow, isSelected && styles.expenseRowSelected]}
                  onPress={() => handleExpensePress(expense.id!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.expenseInfo}>
                    <View style={styles.expenseLeft}>
                      <Text style={styles.categoryText}>{expense.category}</Text>
                      {expense.description && (
                        <Text style={styles.descriptionText} numberOfLines={1}>
                          {expense.description}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.amountText}>LKR {formatAmount(expense.amount)}</Text>
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
                      <Text style={styles.actionIcon}>✏️</Text>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => {
                        onDeleteExpense(expense.id!);
                        setSelectedExpenseId(null);
                      }}
                    >
                      <Text style={styles.actionIcon}>🗑️</Text>
                      <Text style={styles.actionText}>Delete</Text>
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
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 13,
    color: '#7f8c8d',
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
