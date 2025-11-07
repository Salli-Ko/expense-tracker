import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Button,
} from 'react-native';
import { useRouter } from 'expo-router';
import StorageService from '@/database/StorageService';
import { Expense } from '@/database/models/Expense';
import ExpenseList from '@/components/expense/ExpenseList';
import ExpenseForm from '@/components/ExpenseForm';
import { useInitDatabase } from '@/hooks/useInitDatabase';
import { AppText } from '@/components/AppText';

const HomeScreen: React.FC = () => {
  const router = useRouter();

  const {
    isDbReady,
    isLoading,
    error,
    expenses,
    totalExpenses,
    categories,
    retryInit,
    refreshExpenses,
    refetchCategories,
  } = useInitDatabase();

  const handleDeleteExpense = async (id: number) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await StorageService.deleteExpense(id);
            await refreshExpenses();
            Alert.alert('Success', 'Expense deleted');
          } catch (error) {
            console.error('Error deleting expense:', error);
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  const handleEditExpense = (expense: Expense) => {
    Alert.alert('Edit Mode', 'Edit functionality coming soon!', [{ text: 'OK' }]);
  };

  if (error && !isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AppText style={styles.errorIcon}>❌</AppText>
        <AppText style={styles.errorText}>{error}</AppText>
        <Button title="Retry" onPress={retryInit} color="#3498db" />
      </View>
    );
  }

  if (isLoading || !isDbReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <AppText style={styles.loadingText}>Loading database...</AppText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <AppText style={styles.title}>Expense Tracker</AppText>
          <TouchableOpacity
            onPress={() => router.push('/category-management')}
            style={styles.settingsButton}
          >
            <AppText style={styles.settingsIcon}>🎓</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.totalContainer}>
          <AppText style={styles.totalLabel}>Month&#39;s Expenses:</AppText>
          <AppText style={styles.totalAmount}>LKR {totalExpenses.toFixed(2)}</AppText>
        </View>
      </View>

      <ExpenseForm
        categories={categories}
        isDbReady={isDbReady}
        onExpenseAdded={refreshExpenses}
        refetchCategories={refetchCategories}
      />

      <View style={styles.expensesList}>
        <AppText style={styles.subtitle}>Recent Expenses</AppText>
        <ExpenseList
          expenses={expenses}
          categories={categories}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
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
