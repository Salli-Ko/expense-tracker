import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#E6F2FF', // Soft Blue
  Fuel: '#FFF5E6',      // Light Peach
  Dining: '#FFEEF0',    // Blush Pink
  Transport: '#E6F9F3',   // Pale Green
  Utilities: '#F5EEFF',   // Muted Lavender
  Healthcare: '#FFFCE6',  // Creamy Yellow
  Shopping: '#F0F4F8',    // Pale Grey-Blue
  Entertainment: '#DFF9FF', // Slightly more vibrant light blue
  Food: '#FFEBE6',      // Soft Coral/Orange
  Other: '#F8F8F2',       // Very light grey (neutral for 'Other')
};
