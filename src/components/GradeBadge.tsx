import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme';

type Props = {
  grade: string | null | undefined;
};

const gradeConfig: Record<string, { bg: string; color: string }> = {
  'A+': { bg: '#e8f5e9', color: '#1b5e20' },
  'A': { bg: '#e8f5e9', color: '#1b5e20' },
  'B': { bg: '#fff3e0', color: '#e65100' },
  'C': { bg: '#fce4ec', color: '#c62828' },
  'Retest': { bg: '#ffebee', color: '#b71c1c' },
};

export default function GradeBadge({ grade }: Props) {
  if (!grade) {
    return (
      <View style={[styles.badge, { backgroundColor: '#f5f0eb' }]}>
        <Text style={[styles.text, { color: '#999' }]}>-</Text>
      </View>
    );
  }

  const config = gradeConfig[grade] || { bg: '#f5f0eb', color: '#999' };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{grade}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 13,
    ...fonts.bold,
  },
});
