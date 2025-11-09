import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/AppText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type THeaderProps = {
  title: string;
  description: string;
};

export const Header = ({ title, description }: THeaderProps) => {
  const router = useRouter();

  return (
    <View className="bg-light-secondary dark:bg-dark-primary px-5 pt-14 pb-10">
      <View className="flex-row justify-between items-center mb-4">
        <AppText className="text-2xl font-bold text-light-text-primary">Expense Tracker</AppText>
        <TouchableOpacity
          onPress={() => router.push('/category-management')}
          className="p-2 rounded-lg bg-white/20"
        >
          <Ionicons name={'book-outline'} size={20} />
        </TouchableOpacity>
      </View>
      <View className="flex-col items-start rounded-lg gap-1">
        <AppText className="text-light-text-primary font-bold" style={{fontSize: 34}}>
          {title}
        </AppText>
        <AppText className="text-light-text-secondary dark:text-dark-secondary text-base font-semibold">
          {description}
        </AppText>
      </View>
    </View>
  );
};
