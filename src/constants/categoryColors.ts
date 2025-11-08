import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#E8F1FF',      // Soft Cool Blue
  Fuel: '#FFF3E6',           // Gentle Light Orange
  Dining: '#FFE8EB',         // Soft Pink
  Transport: '#E6F8F2',      // Pale Mint
  Utilities: '#F3EDFF',      // Subtle Lavender
  Healthcare: '#FFFBE6',     // Creamy Light Yellow
  Shopping: '#EEF3F6',       // Misty Grey-Blue
  Entertainment: '#E6F7FB',  // Light Cyan Blue
  Food: '#FFEAE2',           // Soft Peach
  Other: '#F7F7F2',          // Neutral Off White
};

export const CATEGORY_PROGRESS_COLORS: Record<string, string> = {
  Groceries: '#4F8DFE',      // Clean Sky Blue
  Fuel: '#FFB74D',           // Warm Sunset Orange
  Dining: '#FF7A8A',         // Soft Rose Pink
  Transport: '#2DC9A7',      // Balanced Aqua Green
  Utilities: '#A185FF',      // Calm Lavender Purple
  Healthcare: '#F3C43F',     // Subtle Golden Yellow
  Shopping: '#8AA2B0',       // Gentle Slate Blue
  Entertainment: '#4AC9F6',  // Fresh Cyan
  Food: '#FF8660',           // Mild Coral Orange
  Other: '#C6C6C6',          // Light Grey Neutral
};
