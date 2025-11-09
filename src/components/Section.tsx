import { TouchableOpacity, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { IoniconName } from '@/constants/categoryColors';
import type { ReactNode } from 'react';

type TRightButton = {
  label: string;
  icon?: IoniconName;
  onPress?: () => void;
};

type TSectionProps = {
  title: string;
  rightButton?: TRightButton;
  children?: ReactNode;
};

export const Section = ({ title, rightButton, children }: TSectionProps) => (
  <View className="flex-col gap-3 mt-4">
    <View className="flex-row justify-between items-center">
      <AppText className="text-xl dark:text-dark-text-primary">{title}</AppText>
      {rightButton && (
        <TouchableOpacity
          onPress={rightButton.onPress}
          className="flex-row gap-2 bg-light-primary py-2 px-4 rounded-full items-center"
        >
          <Ionicons name={rightButton.icon} size={18} color="#fff" />
          <AppText className="text-white font-medium">{rightButton.label}</AppText>
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);
