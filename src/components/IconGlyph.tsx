import React from 'react';
import { Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ICON_NAMES: Record<string, string> = {
  '📖': 'book-open-page-variant-outline',
  '📅': 'calendar-month-outline',
  '👥': 'account-group-outline',
  '📊': 'chart-box-outline',
  '🙋': 'account-plus-outline',
  '⚙️': 'cog-outline',
  '✅': 'check-circle-outline',
  '📋': 'clipboard-text-outline',
  '🗓️': 'calendar-check-outline',
  '✏️': 'pencil-outline',
  '🏆': 'trophy-outline',
  '📞': 'phone-outline',
  '👩‍🏫': 'human-male-board',
  '🕐': 'clock-outline',
  '📚': 'bookshelf',
  '←': 'arrow-left',
  '✓': 'check',
  '●': 'circle',
  '×': 'close',
  '↗': 'trending-up',
  '…': 'dots-horizontal',
};

type Props = {
  glyph: string;
  size: number;
  color: string;
};

export default function IconGlyph({ glyph, size, color }: Props) {
  const iconName = ICON_NAMES[glyph];
  if (iconName) return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  return <Text style={{ color, fontSize: size }}>{glyph}</Text>;
}
