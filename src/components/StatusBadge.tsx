import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../theme';

type StatusTone = { background: string; border: string; text: string };

const STATUS_TONES: Record<string, StatusTone> = {
  ACTIVE: { background: colors.successBg, border: colors.successBorder, text: colors.successText },
  AVAILABLE: { background: colors.successBg, border: colors.successBorder, text: colors.successText },
  COMPLETED: { background: colors.infoBg, border: colors.infoBorder, text: colors.infoText },
  GRADED: { background: colors.successBg, border: colors.successBorder, text: colors.successText },
  PENDING: { background: colors.warningBg, border: colors.warningBorder, text: colors.warningText },
  REJECTED: { background: colors.errorBg, border: colors.errorBorder, text: colors.errorText },
  DROPPED: { background: colors.errorBg, border: colors.errorBorder, text: colors.errorText },
  CANCELLED: { background: colors.errorBg, border: colors.errorBorder, text: colors.errorText },
  INACTIVE: { background: colors.surfaceMuted, border: colors.borderLight, text: colors.textMuted },
  'NOT AVAILABLE': { background: colors.surfaceMuted, border: colors.borderLight, text: colors.textMuted },
};

type Props = { status: string; label?: string };

export default function StatusBadge({ status, label }: Props) {
  const normalized = status.trim().replaceAll('_', ' ').toUpperCase();
  const tone = STATUS_TONES[normalized] ?? STATUS_TONES.INACTIVE;
  return (
    <View style={[styles.badge, { backgroundColor: tone.background, borderColor: tone.border }]}>
      <Text style={[styles.text, { color: tone.text }]}>{label ?? normalized}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 24,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
  },
  text: { textTransform: 'uppercase', letterSpacing: 0.35, ...typography.status },
});
