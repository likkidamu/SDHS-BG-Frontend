import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertBox, ContentCard, Footer, StatCard, TopNavbar } from '../components';
import { useAuth } from '../context/AuthContext';
import type { TeacherAvailabilityResponse } from '../features/teacher/availability/models';
import {
  getTeacherAvailability,
  saveTeacherAvailability,
} from '../features/teacher/availability/service';
import { borderRadius, colors, fonts, spacing } from '../theme';

type Props = { navigation: NativeStackNavigationProp<any> };
type Notice = { type: 'success' | 'error'; message: string };

function apiErrorMessage(error: any, fallback: string): string {
  return error.response?.data?.error ?? error.response?.data?.message ?? fallback;
}

export default function TeacherAvailabilityScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [data, setData] = useState<TeacherAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setData(await getTeacherAvailability());
    } catch (requestError: any) {
      setError(apiErrorMessage(requestError, 'Failed to load your availability.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleSlot = (slotId: number) => {
    if (saving) return;
    setNotice(null);
    setData((current) => current ? {
      ...current,
      selectedSlotIds: current.selectedSlotIds.includes(slotId)
        ? current.selectedSlotIds.filter((id) => id !== slotId)
        : [...current.selectedSlotIds, slotId],
    } : current);
  };

  const save = async () => {
    if (!data || saving) return;
    if (!data.examDate) {
      setNotice({ type: 'error', message: 'An official exam date is required.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const response = await saveTeacherAvailability({
        examDate: data.examDate,
        slotIds: data.selectedSlotIds,
      });
      setData(await getTeacherAvailability());
      setNotice({ type: 'success', message: response.message });
    } catch (saveError: any) {
      setNotice({
        type: 'error',
        message: apiErrorMessage(saveError, 'Failed to save your availability.'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <TopNavbar
        title="My Availability"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <View>
          <Text style={styles.title}>My Availability</Text>
          <Text style={styles.subtitle}>Choose the time windows when you can conduct the upcoming examination.</Text>
        </View>

        {notice ? <AlertBox type={notice.type} message={notice.message} /> : null}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Loading your availability...</Text>
          </View>
        ) : null}
        {!loading && error ? (
          <View style={styles.centerState}>
            <AlertBox type="error" message={error} />
            <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && data ? (
          <>
            <Text style={styles.sectionTitle}>Availability Status</Text>
            <Text style={styles.sectionSubtitle}>Your readiness for the upcoming Sunday examination.</Text>
            <View style={styles.statGrid}>
              <StatCard value={data.examDate || 'Not scheduled'} label="Upcoming Sunday" iconLabel="📅" iconBg={colors.blueBg} iconColor={colors.blue} />
              <StatCard value={data.selectedSlotIds.length > 0 ? 'Submitted' : 'Pending'} label="Status" iconLabel="✓" iconBg={colors.greenBg} iconColor={colors.green} />
              <StatCard value={data.selectedSlotIds.length} label="Selected Windows" iconLabel="🕐" iconBg={colors.orangeBg} iconColor={colors.primary} />
            </View>

            <ContentCard title="Edit Availability" rightLabel={data.examDate}>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Official Exam Date</Text>
                <Text style={styles.dateValue}>{data.examDate || 'No upcoming exam is scheduled'}</Text>
              </View>
              <Text style={styles.slotsTitle}>Available time windows</Text>
              {data.availableSlots.length > 0 ? data.availableSlots.map((slot) => {
                const selected = data.selectedSlotIds.includes(slot.id);
                return (
                  <TouchableOpacity
                    key={slot.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected, disabled: saving }}
                    disabled={saving}
                    style={[styles.slotOption, selected && styles.slotOptionSelected]}
                    onPress={() => toggleSlot(slot.id)}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                    <Text style={[styles.slotName, selected && styles.slotNameSelected]}>{slot.name}</Text>
                  </TouchableOpacity>
                );
              }) : <Text style={styles.emptyText}>No availability time windows are configured for the upcoming examination.</Text>}

              <Text style={styles.guidance}>Clear every selection to remove your availability for this exam.</Text>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                disabled={saving}
                onPress={() => void save()}
              >
                {saving ? <ActivityIndicator size="small" color={colors.white} /> : null}
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Availability'}</Text>
              </TouchableOpacity>
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
  title: { color: colors.navy, fontSize: 24, ...fonts.extraBold },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  sectionTitle: { color: colors.navy, fontSize: 20, ...fonts.extraBold },
  sectionSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: -spacing.sm },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  centerState: { alignItems: 'center', paddingVertical: spacing.xl },
  stateText: { color: colors.textMuted, marginTop: spacing.sm },
  retryButton: { backgroundColor: colors.navy, borderRadius: borderRadius.md, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.white, ...fonts.bold },
  dateRow: { paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dateLabel: { color: colors.textMuted, fontSize: 12, textTransform: 'uppercase', ...fonts.bold },
  dateValue: { color: colors.navy, fontSize: 18, marginTop: spacing.xs, ...fonts.extraBold },
  slotsTitle: { color: colors.textDark, fontSize: 15, marginTop: spacing.lg, marginBottom: spacing.sm, ...fonts.bold },
  slotOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.white },
  slotOptionSelected: { borderColor: colors.navy, backgroundColor: colors.blueBg },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: colors.textMuted, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  checkmark: { color: colors.white, fontSize: 14, ...fonts.bold },
  slotName: { color: colors.textBody, fontSize: 14, ...fonts.medium },
  slotNameSelected: { color: colors.navy, ...fonts.bold },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center', paddingVertical: spacing.lg },
  guidance: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  saveButton: { backgroundColor: colors.navy, borderRadius: borderRadius.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, paddingVertical: 13, marginTop: spacing.md },
  buttonDisabled: { opacity: 0.65 },
  saveButtonText: { color: colors.white, fontSize: 14, ...fonts.bold },
});
