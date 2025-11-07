import React from 'react';
import { ScrollView, View } from 'react-native';
import { useInitDatabase } from '@/hooks/useInitDatabase';
import { AppText } from '@/components/AppText';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/expense/ExpenseList';
import { Header } from '@/components/home/Header';
import { TotalCard } from '@/components/home/TotalCard';
import { Loader } from '@/components/home/Loader';
import { ErrorState } from '@/components/home/ErrorState';
import { handleDeleteExpense, handleEditExpense } from '@/controllers/expenseController';

const Home = () => {
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

  if (error && !isLoading) return <ErrorState error={error} retryInit={retryInit} />;
  if (isLoading || !isDbReady) return <Loader />;

  return (
    <ScrollView className="flex-1 bg-light-background dark:bg-dark-background">
      <Header />
      <View className="px-5 mb-6">
        <TotalCard totalExpenses={totalExpenses} />
      </View>

      <ExpenseForm
        categories={categories}
        isDbReady={isDbReady}
        onExpenseAdded={refreshExpenses}
        refetchCategories={refetchCategories}
      />

      <View className="mt-6 mb-10">
        <AppText className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary ml-4 mb-3">
          Recent Expenses
        </AppText>

        <ExpenseList
          expenses={expenses}
          categories={categories}
          onDeleteExpense={(id) => handleDeleteExpense(id, refreshExpenses)}
          onEditExpense={handleEditExpense}
        />
      </View>
    </ScrollView>
  );
};

export default Home;
