import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import ActionCard from './ActionCard';

type ActionItem = {
  title: string;
  description: string;
  iconLabel: string;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
  disabled?: boolean;
};

type Props = {
  actions: ActionItem[];
  columns?: number;
};

export default function ActionGrid({ actions, columns = 2 }: Props) {
  const { width } = useWindowDimensions();
  const cols = width > 768 ? Math.min(columns, 4) : 2;

  return (
    <View style={styles.grid}>
      {actions.map((action, i) => (
        <View key={i} style={[styles.cell, { width: `${(100 / cols) - 2}%` as any }]}>
          <ActionCard {...action} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    flexGrow: 1,
    minWidth: 140,
  },
});
