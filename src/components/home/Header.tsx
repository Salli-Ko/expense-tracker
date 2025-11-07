import React from "react";
import { View, TouchableOpacity } from "react-native";
import { AppText } from "@/components/AppText";
import { useRouter } from "expo-router";

export const Header = () => {
  const router = useRouter();

  return (
    <View className="bg-light-primary dark:bg-dark-primary px-5 pt-14 pb-6 rounded-b-2xl">
      <View className="flex-row justify-between items-center mb-4">
        <AppText className="text-2xl font-bold text-white">Expense Tracker</AppText>
        <TouchableOpacity
          onPress={() => router.push("/category-management")}
          className="p-2 rounded-lg bg-white/20"
        >
          <AppText className="text-xl">🎓</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
