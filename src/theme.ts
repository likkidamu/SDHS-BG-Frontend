import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#e65100',
  primaryDark: '#bf360c',
  primaryLight: '#ff9800',
  navy: '#1a237e',
  navyLight: '#283593',
  gold: '#f9a825',
  cream: '#fff8f0',
  bg: '#f8f4f0',
  bgGradientStart: '#fdf6f0',
  bgGradientEnd: '#e8ddd2',
  white: '#ffffff',
  textDark: '#2d3436',
  textBody: '#4a4a5a',
  textMuted: '#636e72',
  borderLight: '#e8e0d8',

  // Grade colors
  gradeAPlus: '#1b5e20',
  gradeA: '#4caf50',
  gradeB: '#ff9800',
  gradeC: '#ff5722',
  gradeRetest: '#d32f2f',

  // Action card icon backgrounds
  blue: '#1565c0',
  blueBg: '#e3f2fd',
  blueLight: '#bbdefb',
  green: '#2e7d32',
  greenBg: '#e8f5e9',
  greenLight: '#c8e6c9',
  orangeBg: '#fff3e0',
  orangeLight: '#ffe0b2',
  purple: '#8e24aa',
  purpleBg: '#f3e5f5',
  purpleLight: '#e1bee7',
  teal: '#00897b',
  tealBg: '#e0f2f1',
  tealLight: '#b2dfdb',
  maroon: '#880e4f',
  maroonBg: '#fce4ec',

  // Alert colors
  errorBg: '#fef2f2',
  errorText: '#dc2626',
  errorBorder: '#fecaca',
  successBg: '#f0fdf4',
  successText: '#16a34a',
  successBorder: '#bbf7d0',
  infoBg: '#eff6ff',
  infoText: '#2563eb',
  infoBorder: '#bfdbfe',
  warningBg: '#fff3e0',
  warningText: '#e65100',
  warningBorder: '#ffe0b2',
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  navbar: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 20,
};

export const fonts = {
  regular: { fontFamily: 'System', fontWeight: '400' as const },
  medium: { fontFamily: 'System', fontWeight: '500' as const },
  semiBold: { fontFamily: 'System', fontWeight: '600' as const },
  bold: { fontFamily: 'System', fontWeight: '700' as const },
  extraBold: { fontFamily: 'System', fontWeight: '800' as const },
};
