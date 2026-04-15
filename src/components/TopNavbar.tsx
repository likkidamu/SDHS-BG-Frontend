import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { colors, shadows, fonts } from '../theme';

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
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      <View style={styles.inner}>
        <Text style={styles.brand}>{title}</Text>
        <View style={styles.actions}>
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.navBtn,
                action.variant === 'logout' && styles.navBtnLogout,
              ]}
              onPress={action.onPress}
            >
              <Text style={styles.navBtnText}>{action.label}</Text>
            </TouchableOpacity>
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
    paddingTop: 48,
    paddingBottom: 14,
    ...shadows.navbar,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brand: {
    color: '#fff',
    fontSize: 17,
    ...fonts.extraBold,
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  navBtnLogout: {
    backgroundColor: 'rgba(230,81,0,0.25)',
    borderColor: 'rgba(230,81,0,0.4)',
  },
  navBtnText: {
    color: '#fff',
    fontSize: 13,
    ...fonts.semiBold,
  },
  gradientBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
});
