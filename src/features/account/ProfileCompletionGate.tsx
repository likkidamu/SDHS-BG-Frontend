import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertBox } from '../../components';
import { useAuth } from '../../context/AuthContext';
import type { AccountProfile } from './models';
import { getAccountProfile, updateAccountContact } from './service';
import { validateAccountContact } from './validation';
import { borderRadius, colors, fonts, shadows, spacing } from '../../theme';
import { getApiErrorMessage } from '../../utils/apiError';

export default function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loadedIdentity, setLoadedIdentity] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const applyProfile = useCallback((nextProfile: AccountProfile) => {
    setProfile(nextProfile);
    setEmail(nextProfile.email ?? '');
    setPhoneNumber(nextProfile.phoneNumber ?? '');
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      applyProfile(await getAccountProfile());
    } catch (requestError: unknown) {
      setProfile(null);
      setError(getApiErrorMessage(requestError, 'Unable to load your profile.'));
    } finally {
      setLoadedIdentity(user.volunteerId);
      setLoading(false);
    }
  }, [applyProfile, user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoadedIdentity(null);
      setError('');
      return;
    }
    void loadProfile();
  }, [loadProfile, user]);

  const save = async () => {
    if (saving) return;
    const validationError = validateAccountContact(email, phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateAccountContact({
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      applyProfile(await getAccountProfile());
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to update contact information.'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <>{children}</>;

  if (loadedIdentity !== user.volunteerId || loading) {
    return (
      <View style={styles.blockingState}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.blockingState}>
        <AlertBox type="error" message={error || 'Unable to load your profile.'} />
        <View style={styles.stateActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => void logout()}>
            <Text style={styles.secondaryButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={() => void loadProfile()}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      {children}
      <Modal
        visible={profile.profileCompletionRequired}
        transparent
        animationType="fade"
        onRequestClose={() => undefined}
      >
        <View style={styles.backdrop}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.dialog}>
              <Text style={styles.title}>Welcome to SDHS Learning Portal</Text>
              <Text style={styles.description}>
                Please complete your contact information so teachers and administrators can reach you regarding classes, attendance, exams, and important announcements.
              </Text>
              {error ? <AlertBox type="error" message={error} /> : null}
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(value) => { setEmail(value); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={(value) => { setPhoneNumber(value); setError(''); }}
                keyboardType="number-pad"
                editable={!saving}
                placeholder="Phone number"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={() => void save()}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <Text style={styles.primaryButtonText}>Save & Continue</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  blockingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  loadingText: { color: colors.textMuted, fontSize: 14, ...fonts.medium },
  stateActions: { flexDirection: 'row', gap: spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  dialog: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.cardHover,
  },
  title: { color: colors.navy, fontSize: 20, ...fonts.extraBold },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: spacing.sm },
  fieldLabel: { color: colors.textDark, fontSize: 13, ...fonts.semiBold },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    color: colors.textDark,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  primaryButtonText: { color: colors.white, fontSize: 13, ...fonts.bold },
  secondaryButton: {
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  secondaryButtonText: { color: colors.navy, fontSize: 13, ...fonts.bold },
  saveButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.65 },
});
