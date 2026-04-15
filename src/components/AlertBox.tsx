import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, fonts } from '../theme';

type AlertType = 'error' | 'success' | 'info' | 'warning';

type Props = {
  type: AlertType;
  message: string;
};

const alertStyles: Record<AlertType, { bg: string; text: string; border: string }> = {
  error: { bg: colors.errorBg, text: colors.errorText, border: colors.errorBorder },
  success: { bg: colors.successBg, text: colors.successText, border: colors.successBorder },
  info: { bg: colors.infoBg, text: colors.infoText, border: colors.infoBorder },
  warning: { bg: colors.warningBg, text: colors.warningText, border: colors.warningBorder },
};

export default function AlertBox({ type, message }: Props) {
  const s = alertStyles[type];
  return (
    <View style={[styles.container, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.text, { color: s.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    ...fonts.medium,
  },
});
