import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';

type TStatCardProps = {
  title: string;
  value: string;
  timeline?: string;
};

const StatCard = ({ title, value, timeline }: TStatCardProps) => {
  return (
    <View className="flex-1 bg-light-background p-3 flex-col gap-2 rounded-2xl">
      <View className="flex-row justify-between">
        <AppText className="text-light-text-secondary">{title}</AppText>
        {timeline && (
          <AppText className="text-light-text-secondary" style={{ fontSize: 10 }}>
            {timeline}
          </AppText>
        )}
      </View>
      <View className="flex-row gap-2 ml-2">
        <View className="border border-l border-light-primary" />
        <AppText className="text-2xl">{value}</AppText>
      </View>
    </View>
  );
};

export default StatCard;
