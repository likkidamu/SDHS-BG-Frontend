import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

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
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.3,
    ...fonts.regular,
  },
  highlight: {
    color: colors.primary,
    ...fonts.semiBold,
  },
});
