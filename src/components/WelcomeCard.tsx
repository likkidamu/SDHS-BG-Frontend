import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius, fonts } from '../theme';

type Badge = {
  label: string;
};

type Props = {
  greeting?: string;
  name: string;
  badges?: Badge[];
};

export default function WelcomeCard({ greeting = 'Welcome back', name, badges = [] }: Props) {
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    ...shadows.card,
    padding: 28,
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
    backgroundColor: colors.primary,
  },
  decorCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(230,81,0,0.04)',
  },
  greeting: {
    fontSize: 12,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.primary,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    ...fonts.extraBold,
    color: colors.navy,
    lineHeight: 30,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#e8eaf6',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  badgeText: {
    color: colors.navy,
    fontSize: 12,
    ...fonts.bold,
  },
});
