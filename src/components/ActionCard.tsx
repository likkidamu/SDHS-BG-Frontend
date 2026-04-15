import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius, fonts } from '../theme';

type Props = {
  title: string;
  description: string;
  iconLabel: string;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
  disabled?: boolean;
};

export default function ActionCard({
  title,
  description,
  iconLabel,
  iconBg,
  iconColor,
  onPress,
  disabled = false,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Text style={[styles.iconText, { color: iconColor }]}>{iconLabel}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadows.card,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    ...fonts.bold,
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  desc: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.medium,
    textAlign: 'center',
  },
});
