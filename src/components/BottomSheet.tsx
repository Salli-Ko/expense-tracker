import React from 'react';
import { Modal, View, TouchableOpacity, ScrollView, DimensionValue } from 'react-native';
import { AppText } from '@/components/AppText';

type TBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: DimensionValue | undefined;
}

export const BottomSheet = ({
  visible,
  onClose,
  title,
  children,
  height = '70%',
}: TBottomSheetProps) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View
          className={`bg-white dark:bg-dark-background rounded-t-3xl p-6`}
          style={{ maxHeight: height }}
        >
          <View className="flex-row justify-between items-center mb-4">
            {title ? (
              <AppText className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                {title}
              </AppText>
            ) : (
              <View className="h-2 w-12 bg-gray-300 rounded-full self-center" />
            )}

            <TouchableOpacity onPress={onClose}>
              <AppText className="text-xl text-gray-600 dark:text-gray-300">✕</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-grow">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
