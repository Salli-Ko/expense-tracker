import React from "react";
import { View } from "react-native";
import { AppText } from "@/components/AppText";

type Props = { totalExpenses: number };

export const TotalCard = ({ totalExpenses }: Props) => {
  return (
    <View className="flex-row justify-between items-center bg-white/20 p-3 rounded-lg mx-1">
      <AppText className="text-light-secondary dark:text-dark-secondary text-base font-semibold text-white">
        Month’s Expenses:
      </AppText>
      <AppText className="text-white text-2xl font-bold">
        LKR {totalExpenses.toFixed(2)}
      </AppText>
    </View>
  );
};
