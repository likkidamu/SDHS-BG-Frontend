import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';

type NavAction = {
  label: string;
  icon?: string;
  onPress: () => void;
  variant?: 'default' | 'logout';
};

type Props = {
  title: string;
  icon?: string;
  actions?: NavAction[];
};

export default function TopNavbar({ title, actions = [] }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.smd }]} accessibilityRole="header">
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <View style={styles.inner}>
        <Text style={styles.brand} numberOfLines={2}>{title}</Text>
        <View style={styles.actions}>
          {actions.map((action, i) => (
            <Pressable
              key={`${action.label}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityHint={action.label === 'Back' ? 'Returns to the previous screen' : action.label === 'Logout' ? 'Signs out of the application' : undefined}
              style={({ pressed }) => [
                styles.navBtn,
                action.variant === 'logout' && styles.navBtnLogout,
                pressed && styles.navBtnPressed,
              ]}
              onPress={action.onPress}
            >
              <Text style={styles.navBtnText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.gradientBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy,
    paddingBottom: spacing.smd,
    ...shadows.navbar,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  brand: {
    color: colors.textOnPrimary,
    ...typography.appTitle,
    letterSpacing: -0.3,
    flex: 1,
    marginRight: spacing.smd,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  navBtn: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.controlOnPrimary,
    borderWidth: 1,
    borderColor: colors.controlOnPrimaryBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.smd,
  },
  navBtnLogout: {
    backgroundColor: colors.controlAccentOnPrimary,
    borderColor: colors.controlAccentBorder,
  },
  navBtnPressed: { opacity: 0.72 },
  navBtnText: {
    color: colors.textOnPrimary,
    ...typography.button,
  },
  gradientBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.accent,
  },
});
