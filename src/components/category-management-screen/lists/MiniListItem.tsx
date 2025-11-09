import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';

type TMiniListItemProps = {
  title: string;
  count?: number;
  onDelete?: () => void;
};

export const MiniListItem = ({ title, count = 1, onDelete }: TMiniListItemProps) => {
  return (
    <View className="flex-row items-center justify-between p-4 px-1 bg-light-background dark:bg-dark-background rounded-2xl">
      <AppText className="text-base text-light-text-primary dark:text-dark-text-primary flex-1">
        {title}
      </AppText>

      <View className="flex-row items-center gap-3">
        <View className="bg-light-primary dark:bg-dark-primary rounded-2xl px-3 py-2 min-w-[36px] items-center justify-center">
          <AppText className="text-sm font-medium text-white dark:text-light-text-primary">
            {count}X
          </AppText>
        </View>

        <TouchableOpacity
          onPress={onDelete}
          className="p-2 active:opacity-70"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
