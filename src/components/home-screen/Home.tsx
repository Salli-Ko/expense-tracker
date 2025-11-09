import React from 'react';
import { ScrollView, View } from 'react-native';
import { useInitDatabase } from '@/hooks/useInitDatabase';
import { AppText } from '@/components/AppText';
import ExpenseList from '@/components/home-screen/expense/ExpenseList';
import { Header } from '@/components/Header';
import { Loader } from '@/components/Loader';
import { ErrorState } from '@/components/ErrorState';
import { handleDeleteExpense, handleEditExpense } from '@/controllers/expenseController';
import Body from '@/components/Body';
import { SmsParserInput } from '@/components/home-screen/expense/SmsParserInput';
import { formatCurrency } from '@/util/common-utils';

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
  if (isLoading || !isDbReady) return <Loader title="Loading database..."/> ;

  return (
    <ScrollView className="flex-1 bg-light-background dark:bg-dark-background">
      <Header title={formatCurrency(totalExpenses)} description="Monthly Expenses" />

      <Body>
        <SmsParserInput
          categories={categories}
          refetchCategories={refetchCategories}
          isDbReady={isDbReady}
          onExpenseAdded={refreshExpenses}
        />

        <View className="mt-8">
          <AppText className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
            Recent Expenses
          </AppText>

          <ExpenseList
            expenses={expenses}
            categories={categories}
            onDeleteExpense={(id) => handleDeleteExpense(id, refreshExpenses)}
            onEditExpense={handleEditExpense}
          />
        </View>
      </Body>
    </ScrollView>
  );
};

export default Home;
