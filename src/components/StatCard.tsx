import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius, fonts } from '../theme';

type Props = {
  value: string | number;
  label: string;
  iconLabel: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
};

export default function StatCard({
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
        <Text style={[styles.iconText, { color: iconColor }]}>{iconLabel}</Text>
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    ...shadows.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 18,
  },
  value: {
    fontSize: 24,
    ...fonts.extraBold,
    lineHeight: 28,
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginTop: 4,
    ...fonts.semiBold,
    textAlign: 'center',
  },
});
