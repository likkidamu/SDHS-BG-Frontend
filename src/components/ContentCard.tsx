import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius, spacing, typography } from '../theme';

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
  const headerBg = headerVariant === 'orange' ? colors.accentSoft : colors.surfaceHeader;

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
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    minHeight: 52,
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.mdl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  headerText: {
    color: colors.textDark,
    ...typography.cardTitle,
  },
  headerBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.smd,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerBadgeText: {
    color: colors.textBody,
    ...typography.label,
  },
  body: {
    padding: spacing.mdl,
  },
});
