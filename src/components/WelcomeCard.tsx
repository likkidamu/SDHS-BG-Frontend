import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius, spacing, typography } from '../theme';

type Badge = {
  label: string;
};

type Props = {
  greeting?: string;
  name: string;
  badges?: Badge[];
};

function WelcomeCard({ greeting = 'Welcome back', name, badges = [] }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar} />
      <View style={styles.decorCircle} />
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.name}>{name}</Text>
      {badges.length > 0 && (
        <View style={styles.badgeRow}>
          {badges.map((b, i) => (
            <View key={i} style={styles.badge}>
              <Text style={styles.badgeText}>{b.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default React.memo(WelcomeCard);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: colors.accent,
  },
  decorCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.accentWash,
  },
  greeting: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.accentStrong,
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.navy,
    ...typography.pageTitle,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.smd,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: colors.infoBg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.smd,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  badgeText: {
    color: colors.navy,
    ...typography.label,
  },
});
