import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';
import IconGlyph from './IconGlyph';

type Props = {
  value: string | number;
  label: string;
  iconLabel: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
};

function StatCard({
  value,
  label,
  iconLabel,
  iconBg,
  iconColor,
  valueColor = colors.navy,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <IconGlyph glyph={iconLabel} size={19} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default React.memo(StatCard);

const styles = StyleSheet.create({
  container: {
    minHeight: 102,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.pageTitle,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginTop: 4,
    ...typography.label,
    textAlign: 'center',
  },
});
