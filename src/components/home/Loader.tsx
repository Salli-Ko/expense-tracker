import React from "react";
import { View, ActivityIndicator } from "react-native";
import { AppText } from "@/components/AppText";

export const Loader = () => (
  <View className="flex-1 justify-center items-center bg-light-background dark:bg-dark-background">
    <ActivityIndicator size="large" color="#5E9978" />
    <AppText className="text-base text-light-text-secondary dark:text-dark-text-secondary mt-3">
      Loading database...
    </AppText>
  </View>
);
