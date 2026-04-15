import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius, fonts } from '../theme';

type Props = {
  title: string;
  headerVariant?: 'navy' | 'orange';
  rightLabel?: string;
  children: React.ReactNode;
};

export default function ContentCard({
  title,
  headerVariant = 'navy',
  rightLabel,
  children,
}: Props) {
  const headerBg = headerVariant === 'orange' ? colors.primary : colors.navy;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: headerBg }]}>
        <Text style={styles.headerText}>{title}</Text>
        {rightLabel && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{rightLabel}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    ...shadows.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    color: '#fff',
    fontSize: 15,
    ...fonts.bold,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    ...fonts.bold,
  },
  body: {
    padding: 24,
  },
});
