import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { CATEGORY_COLORS, IoniconName } from '@/constants/categoryColors';

type TExpenseItemCardProps = {
  icon: IoniconName;
  label: string;
  amount: string;
  description?: string;
  isSelected?: boolean;
};

export default function ExpenseItemCard({
  icon,
  label,
  amount,
  description,
  isSelected = false,
}: TExpenseItemCardProps) {
  const backgroundColor = CATEGORY_COLORS[label];

  return (
    <View
      style={{ backgroundColor }}
      className={`
        flex-row items-center justify-between rounded-2xl px-5 py-4
        bg-light-background dark:bg-dark-background
        ${isSelected ? 'border border-light-primary dark:border-dark-primary' : ''}
      `}
    >
      <View className="flex-1 flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-xl items-center justify-center">
          <Ionicons name={icon} size={24} color="#1A1A1A" />
        </View>

        <View className="flex-1">
          <AppText className="text-light-text-primary dark:text-dark-text-primary text-base font-medium">
            {label}
          </AppText>
          {description && (
            <AppText
              className="text-light-text-secondary dark:text-dark-text-secondary text-sm mt-0.5"
              numberOfLines={1}
            >
              {description}
            </AppText>
          )}
        </View>
      </View>

      <AppText className="text-light-text-primary dark:text-dark-text-primary text-base font-semibold ml-2">
        {amount}
      </AppText>
    </View>
  );
}
