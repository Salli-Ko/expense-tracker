import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Expense } from '@/database/models/Expense';

type Props = {
  progress: SharedValue<number>;
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
};

export const SwipeActions = ({ progress, expense, onEdit, onDelete }: Props) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.9, 1]);
    return { transform: [{ scale }] };
  });

  return (
    <View className="flex-row h-full">
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={() => onEdit(expense)}
          activeOpacity={0.85}
          className="w-16 bg-[#6BA989] dark:bg-[#5E9978] items-center justify-center h-full"
        >
          <Ionicons name="create-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={() => onDelete(expense.id!)}
          activeOpacity={0.85}
          className="w-16 bg-[#EF6262] dark:bg-[#D94C4C] items-center justify-center h-full rounded-r-2xl"
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};
