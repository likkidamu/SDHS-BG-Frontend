import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { colors, shadows, borderRadius, fonts } from '../theme';
import { AlertBox, Footer } from '../components';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [volunteerId, setVolunteerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!volunteerId.trim() || !password.trim()) {
      setError('Please enter Volunteer ID and Password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(volunteerId.trim(), password);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>SDHS Bhagavad Gita Memorization</Text>
      </View>

      <ScrollView contentContainerStyle={styles.hero} keyboardShouldPersistTaps="handled">
        {/* Login Card */}
        <View style={styles.loginCard}>
          <View style={styles.labelRow}>
            <View style={styles.labelDash} />
            <Text style={styles.label}>VOLUNTEER PORTAL</Text>
          </View>
          <Text style={styles.title}>Sign in to your account</Text>
          <Text style={styles.desc}>
            Access your dashboard to manage schedules, track progress, and view assignments.
          </Text>

          {error ? <AlertBox type="error" message={error} /> : null}

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Enter your Volunteer ID"
              placeholderTextColor="#bbb"
              value={volunteerId}
              onChangeText={setVolunteerId}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Default password is your <Text style={styles.hintBold}>Volunteer ID</Text>.
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.contactCard}>
          <View style={styles.contactIcon}>
            <Text style={styles.contactIconText}>{'📞'}</Text>
          </View>
          <View style={styles.contactBody}>
            <Text style={styles.contactTitle}>Want to join SDHS Volunteers?</Text>
            <Text style={styles.contactText}>
              Reach out to learn more about volunteering opportunities with Sri Datta Human Services.
            </Text>
          </View>
        </View>

        <Footer />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    backgroundColor: colors.navy,
    paddingTop: 48,
    paddingBottom: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  topBarText: {
    color: '#fff',
    fontSize: 17,
    ...fonts.bold,
  },
  hero: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  loginCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
    padding: 36,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  labelDash: {
    width: 20,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  label: {
    fontSize: 11,
    ...fonts.bold,
    letterSpacing: 1.5,
    color: colors.primary,
  },
  title: {
    fontSize: 24,
    ...fonts.extraBold,
    color: colors.textDark,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 14,
    color: colors.textBody,
    marginBottom: 28,
    lineHeight: 22,
    ...fonts.regular,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#eee',
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    ...fonts.medium,
    color: colors.textDark,
    backgroundColor: '#fafafa',
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeText: {
    color: '#bbb',
    fontSize: 13,
    ...fonts.semiBold,
  },
  submitBtn: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    ...fonts.bold,
    letterSpacing: 0.3,
  },
  hint: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.regular,
  },
  hintBold: {
    color: colors.textBody,
    ...fonts.semiBold,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 20,
    marginTop: 20,
    gap: 16,
    ...shadows.card,
  },
  contactIcon: {
    width: 44,
    height: 44,
    backgroundColor: colors.navy,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIconText: {
    fontSize: 18,
  },
  contactBody: {
    flex: 1,
  },
  contactTitle: {
    ...fonts.bold,
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
});
