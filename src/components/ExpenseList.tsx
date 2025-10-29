import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Expense } from '../database/models/Expense';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: number) => void;
  onEditExpense?: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
                                                   expenses,
                                                   onDeleteExpense,
                                                   onEditExpense,
                                                 }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseInfo}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
      </View>
      <View style={styles.actions}>
        {onEditExpense && (
          <TouchableOpacity
            onPress={() => onEditExpense(item)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => item.id && onDeleteExpense(item.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={expenses}
      keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
      renderItem={renderExpenseItem}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No expenses yet</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  expenseItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseInfo: {
    marginBottom: 8,
  },
  category: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  amount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e74c3c',
    marginVertical: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default ExpenseList;