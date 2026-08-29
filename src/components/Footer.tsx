import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export default function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        © 2025 <Text style={styles.highlight}>Sri Datta Human Services</Text> · SDHS Bhagavad Gita Program
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.mdl,
    alignItems: 'center',
  },
  text: {
    color: colors.textMuted,
    letterSpacing: 0.3,
    ...typography.caption,
  },
  highlight: {
    color: colors.primary,
    ...typography.label,
  },
});
