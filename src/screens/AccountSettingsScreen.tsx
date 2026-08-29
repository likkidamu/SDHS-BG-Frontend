import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { SharedScreenProps } from '../navigation/types';
import { AlertBox, AsyncState, ContentCard, Footer, TopNavbar } from '../components';
import { useAuth } from '../context/AuthContext';
import type { AccountProfile } from '../features/account/models';
import { getAccountProfile, updateAccountContact } from '../features/account/service';
import { validateAccountContact } from '../features/account/validation';
import { borderRadius, colors, fonts, spacing } from '../theme';
import { getApiErrorMessage } from '../utils/apiError';

type Props = SharedScreenProps<'AccountSettings'>;

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value?.trim() || 'Not provided'}</Text>
    </View>
  );
}

export default function AccountSettingsScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const applyProfile = useCallback((nextProfile: AccountProfile) => {
    setProfile(nextProfile);
    setEmail(nextProfile.email ?? '');
    setPhoneNumber(nextProfile.phoneNumber ?? '');
  }, []);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      applyProfile(await getAccountProfile());
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to load account settings.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyProfile]);

  useEffect(() => { void load(); }, [load]);

  const beginEdit = () => {
    setEmail(profile?.email ?? '');
    setPhoneNumber(profile?.phoneNumber ?? '');
    setError('');
    setNotice('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEmail(profile?.email ?? '');
    setPhoneNumber(profile?.phoneNumber ?? '');
    setError('');
    setEditing(false);
  };

  const save = async () => {
    if (saving) return;
    const validationError = validateAccountContact(email, phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    try {
      applyProfile(await updateAccountContact({
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
      }));
      setEditing(false);
      setNotice('Contact information updated successfully.');
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to update contact information.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Account Settings"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <AsyncState loading={loading} error={!loading && !profile ? error : false} onRetry={() => void load()} loadingMessage="Loading account settings..." />

        {!loading && profile ? (
          <>
            {notice ? <AlertBox type="success" message={notice} /> : null}
            {error ? <AlertBox type="error" message={error} /> : null}

            <ContentCard title="Personal Information">
              <DetailRow label="Volunteer ID" value={profile.volunteerId} />
              <DetailRow label="Name" value={profile.name} />
              <DetailRow label="Role" value={profile.role} />
              {profile.trackType ? <DetailRow label="Track" value={profile.trackType} /> : null}
              {profile.groupId ? <DetailRow label="Group" value={profile.groupId} /> : null}
            </ContentCard>

            <ContentCard title="Contact Information">
              {editing ? (
                <>
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
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={cancelEdit}
                      disabled={saving}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryButton, saving && styles.buttonDisabled]}
                      onPress={() => void save()}
                      disabled={saving}
                    >
                      {saving
                        ? <ActivityIndicator size="small" color={colors.white} />
                        : <Text style={styles.primaryButtonText}>Save</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <DetailRow label="Email" value={profile.email} />
                  <DetailRow label="Phone Number" value={profile.phoneNumber} />
                  <TouchableOpacity style={styles.primaryButton} onPress={beginEdit}>
                    <Text style={styles.primaryButtonText}>Edit Contact Information</Text>
                  </TouchableOpacity>
                </>
              )}
            </ContentCard>
          </>
        ) : null}
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: { flex: 1, color: colors.textMuted, fontSize: 13 },
  detailValue: { flex: 1, color: colors.textDark, fontSize: 13, textAlign: 'right', ...fonts.semiBold },
  fieldLabel: { color: colors.textDark, fontSize: 13, marginBottom: spacing.xs, ...fonts.semiBold },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    color: colors.textDark,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  primaryButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  primaryButtonText: { color: colors.white, fontSize: 13, ...fonts.bold },
  secondaryButton: {
    minHeight: 42,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryButtonText: { color: colors.textDark, fontSize: 13, ...fonts.bold },
  buttonDisabled: { opacity: 0.65 },
});
