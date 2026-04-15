import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TopNavbar } from '../components';
import { colors, fonts, borderRadius, shadows } from '../theme';

type Props = {
  route: { name: string };
};

export default function PlaceholderScreen({ route }: Props) {
  return (
    <View style={styles.page}>
      <TopNavbar title={route.name} actions={[]} />
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.icon}>🚧</Text>
          <Text style={styles.title}>{route.name}</Text>
          <Text style={styles.sub}>Coming soon...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    ...shadows.card,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { ...fonts.bold, fontSize: 20, color: colors.navy },
  sub: { color: colors.textMuted, marginTop: 8, fontSize: 14 },
});
