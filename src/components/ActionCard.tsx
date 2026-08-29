import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, shadows, borderRadius, spacing, typography } from '../theme';
import IconGlyph from './IconGlyph';

type Props = {
  title: string;
  description: string;
  iconLabel: string;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
  disabled?: boolean;
};

function ActionCard({
  title,
  description,
  iconLabel,
  iconBg,
  iconColor,
  onPress,
  disabled = false,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <IconGlyph glyph={iconLabel} size={23} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </Pressable>
  );
}

export default React.memo(ActionCard);

const styles = StyleSheet.create({
  container: {
    minHeight: 148,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.card,
    paddingVertical: spacing.mdl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.52, backgroundColor: colors.disabledBg },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.smd,
  },
  title: {
    color: colors.textDark,
    marginBottom: spacing.xs,
    textAlign: 'center',
    ...typography.cardTitle,
  },
  desc: {
    color: colors.textMuted,
    textAlign: 'center',
    ...typography.caption,
  },
});
