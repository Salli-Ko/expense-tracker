import React from "react";
import { View, Button } from "react-native";
import { AppText } from "@/components/AppText";

type TErrorStateProps = {
  error: string;
  retryInit: () => void;
};

export const ErrorState = ({ error, retryInit }: TErrorStateProps) => (
  <View className="flex-1 justify-center items-center bg-light-background dark:bg-dark-background px-5">
    <AppText className="text-5xl mb-4">❌</AppText>
    <AppText className="text-base text-red-500 text-center mb-5">{error}</AppText>
    <Button title="Retry" onPress={retryInit} color="#5E9978" />
  </View>
);
