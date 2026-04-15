import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { TopNavbar, AlertBox } from '../components';
import { colors, shadows, borderRadius, fonts } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ChangePasswordScreen() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        volunteerId: user?.volunteerId,
        currentPassword,
        newPassword,
      });
      setSuccess('Password changed! Please login again.');
      setTimeout(() => logout(), 2000);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="Change Password" actions={[]} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {user?.defaultPassword && (
            <AlertBox
              type="warning"
              message="You are using the default password. Please change it to continue."
            />
          )}

          {error ? <AlertBox type="error" message={error} /> : null}
          {success ? <AlertBox type="success" message={success} /> : null}

          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor="#bbb"
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Enter new password"
            placeholderTextColor="#bbb"
          />

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm new password"
            placeholderTextColor="#bbb"
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? 'Changing...' : 'Change Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    ...shadows.card,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  label: {
    fontSize: 13,
    ...fonts.semiBold,
    color: colors.textDark,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
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
  submitBtn: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    ...fonts.bold,
  },
});
