import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: Props) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && !unavailable && styles.pressed,
        unavailable && styles.disabled,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={variant === 'primary' ? colors.textOnPrimary : colors.primary} /> : null}
      <Text style={[styles.label, variant !== 'primary' && styles.labelDark, variant === 'danger' && styles.labelDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  outline: { backgroundColor: 'transparent', borderColor: colors.primary },
  danger: { backgroundColor: 'transparent', borderColor: colors.errorBorder },
  pressed: { opacity: 0.78 },
  disabled: { backgroundColor: colors.disabledBg, borderColor: colors.divider, opacity: 0.58 },
  label: { color: colors.textOnPrimary, ...typography.button },
  labelDark: { color: colors.textDark },
  labelDanger: { color: colors.errorText },
});
