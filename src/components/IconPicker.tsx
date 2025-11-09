import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';

interface IconPickerProps {
  selectedIcon?: string;
  onSelectIcon: (iconName: string) => void;
}

const ICONS = [
  'fast-food',
  'restaurant',
  'cafe',
  'pizza',
  'beer',
  'car',
  'bus',
  'train',
  'airplane',
  'bicycle',
  'cart',
  'bag-handle',
  'gift',
  'shirt',
  'home',
  'medical',
  'fitness',
  'heart',
  'bandage',
  'pulse',
  'game-controller',
  'musical-notes',
  'film',
  'book',
  'trophy',
  'school',
  'library',
  'bulb',
  'flask',
  'calculator',
  'wallet',
  'cash',
  'card',
  'pricetag',
  'trending-up',
  'phone-portrait',
  'laptop',
  'watch',
  'camera',
  'headset',
  'hammer',
  'build',
  'construct',
  'cut',
  'color-palette',
  'leaf',
  'flower',
  'sunny',
  'water',
  'flame',
  'business',
  'briefcase',
  'document',
  'folder',
  'archive',
  'paw',
  'fish',
  'baseball',
  'football',
  'tennisball',
];

const IconPicker = ({ selectedIcon, onSelectIcon }: IconPickerProps) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = search
    ? ICONS.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()))
    : ICONS;

  const handleSelect = (icon: string) => {
    onSelectIcon(icon);
    setVisible(false);
    setSearch('');
  };

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center p-3 border border-light-secondary dark:border-dark-secondary rounded-2xl bg-light-background dark:bg-dark-background mb-4"
        onPress={() => setVisible(true)}
      >
        <View className="w-10 h-10 justify-center items-center bg-white dark:bg-dark-secondary rounded-md mr-3">
          <Ionicons
            name={(selectedIcon as any) || 'add-circle-outline'}
            size={28}
            color={selectedIcon ? '#5E9978' : '#B0B0B0'}
          />
        </View>
        <AppText className="text-base text-light-text-primary dark:text-dark-text-primary">
          {selectedIcon ? 'Change Icon' : 'Select Icon'}
        </AppText>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 justify-end bg-[rgba(0,0,0,0.5)]">
          <View className="bg-light-background dark:bg-dark-background rounded-t-2xl max-h-[75%] pb-5">
            <View className="flex-row justify-between items-center px-5 py-4 border-b border-light-secondary dark:border-gray-700">
              <AppText className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                Select Icon
              </AppText>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="mx-4 my-3 px-4 py-3 border border-light-secondary dark:border-gray-700 rounded-lg text-base text-light-text-primary dark:text-dark-text-primary"
              placeholder="Search icons..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap px-4">
                {filteredIcons.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    className={`w-1/5 aspect-square justify-center items-center rounded-xl border-2 mb-2 ${
                      selectedIcon === icon
                        ? 'border-light-primary dark:border-dark-primary bg-[#E3F2FD]/50'
                        : 'border-transparent'
                    }`}
                    onPress={() => handleSelect(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={28}
                      color={selectedIcon === icon ? '#5E9978' : '#2c3e50'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default IconPicker;
