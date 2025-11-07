import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';

interface IconPickerProps {
  selectedIcon?: string;
  onSelectIcon: (iconName: string) => void;
}

// Curated list of useful category icons
const ICONS = [
  'fast-food', 'restaurant', 'cafe', 'pizza', 'beer',
  'car', 'bus', 'train', 'airplane', 'bicycle',
  'cart', 'bag-handle', 'gift', 'shirt', 'home',
  'medical', 'fitness', 'heart', 'bandage', 'pulse',
  'game-controller', 'musical-notes', 'film', 'book', 'trophy',
  'school', 'library', 'bulb', 'flask', 'calculator',
  'wallet', 'cash', 'card', 'pricetag', 'trending-up',
  'phone-portrait', 'laptop', 'watch', 'camera', 'headset',
  'hammer', 'build', 'construct', 'cut', 'color-palette',
  'leaf', 'flower', 'sunny', 'water', 'flame',
  'business', 'briefcase', 'document', 'folder', 'archive',
  'paw', 'fish', 'baseball', 'football', 'tennisball',
];

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelectIcon }) => {
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
      {/* Icon Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
      >
        <View style={styles.iconPreview}>
          <Ionicons
            name={(selectedIcon as any) || 'add-circle-outline'}
            size={28}
            color={selectedIcon ? '#3498db' : '#bdc3c7'}
          />
        </View>
        <AppText style={styles.buttonText}>
          {selectedIcon ? 'Change Icon' : 'Select Icon'}
        </AppText>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <AppText style={styles.title}>Select Icon</AppText>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <TextInput
              style={styles.search}
              placeholder="Search icons..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />

            {/* Icon Grid */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.grid}>
                {filteredIcons.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconItem,
                      selectedIcon === icon && styles.selected,
                    ]}
                    onPress={() => handleSelect(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={28}
                      color={selectedIcon === icon ? '#3498db' : '#2c3e50'}
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

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  iconPreview: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  search: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  iconItem: {
    width: '20%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  selected: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
});

export default IconPicker;