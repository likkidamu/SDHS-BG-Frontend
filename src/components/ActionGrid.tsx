import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import type { DimensionValue } from 'react-native';
import ActionCard from './ActionCard';
import { spacing } from '../theme';

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

function ActionGrid({ actions, columns = 2 }: Props) {
  const { width } = useWindowDimensions();
  const cols = width > 768 ? Math.min(columns, 4) : 2;

  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <View key={action.title} style={[styles.cell, { width: `${(100 / cols) - 2}%` as DimensionValue }]}>
          <ActionCard {...action} />
        </View>
      ))}
    </View>
  );
}

export default React.memo(ActionGrid);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.smd,
  },
  cell: {
    flexGrow: 1,
    minWidth: 140,
  },
});
