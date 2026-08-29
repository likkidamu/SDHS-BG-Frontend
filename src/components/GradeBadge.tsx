import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../theme';

type Props = {
  grade: string | null | undefined;
};

const gradeConfig: Record<string, { bg: string; color: string }> = {
  'A+': { bg: colors.successBg, color: colors.successText },
  'A': { bg: colors.successBg, color: colors.successText },
  'B': { bg: colors.warningBg, color: colors.warningText },
  'C': { bg: colors.warningBg, color: colors.warningText },
  'Retest': { bg: colors.errorBg, color: colors.errorText },
  'Pending': { bg: colors.surfaceMuted, color: colors.textMuted },
};

export default function GradeBadge({ grade }: Props) {
  const value = grade?.trim() || 'Pending';
  const config = gradeConfig[value] || { bg: colors.surfaceMuted, color: colors.textMuted };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 24,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.smd,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.status,
  },
});
