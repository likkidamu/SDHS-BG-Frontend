import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TopNavbar, Footer } from '../components';
import { colors, fonts, borderRadius, shadows } from '../theme';
import api from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

interface Volunteer {
  volunteerId: string;
  name: string;
  enrollmentType: string;
  trackType: string | null;
  status: string;
  createdAt: string | null;
}

type Props = NativeStackScreenProps<any, any>;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

function TypeBadge({ enrollmentType }: { enrollmentType: string }) {
  const isTeacher = enrollmentType?.toUpperCase() === 'T';
  return (
    <View style={[badge.pill, { backgroundColor: isTeacher ? colors.greenBg : colors.blueBg }]}>
      <Text style={[badge.text, { color: isTeacher ? colors.green : colors.blue }]}>
        {isTeacher ? 'Teacher' : 'Student'}
      </Text>
    </View>
  );
}

function TrackBadge({ trackType }: { trackType: string | null }) {
  if (!trackType) return null;
  const t = trackType.toUpperCase();
  return (
    <View style={[badge.pill, { backgroundColor: t === 'MEM' ? colors.blueBg : colors.purpleBg, marginLeft: 6 }]}>
      <Text style={[badge.text, { color: t === 'MEM' ? colors.blue : colors.purple }]}>
        {t === 'MEM' ? 'Memorization' : 'Fluent'}
      </Text>
    </View>
  );
}

const badge = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 11, ...fonts.semiBold },
});

function VolunteerRow({ v }: { v: Volunteer }) {
  const isActive = v.status?.toUpperCase() === 'ACTIVE';
  return (
    <View style={row.container}>
      <View style={row.top}>
        <Text style={row.name}>{v.name}</Text>
        <View style={[row.statusDot, { backgroundColor: isActive ? colors.successText : colors.textMuted }]} />
      </View>
      <View style={row.meta}>
        <TypeBadge enrollmentType={v.enrollmentType} />
        {v.enrollmentType?.toUpperCase() === 'S' && <TrackBadge trackType={v.trackType} />}
      </View>
      <Text style={row.date}>Joined {fmtDate(v.createdAt)}</Text>
    </View>
  );
}

const row = StyleSheet.create({
  container: {
    backgroundColor: colors.white, paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 15, ...fonts.semiBold, color: colors.textDark, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  date: { fontSize: 11, ...fonts.regular, color: colors.textMuted, marginTop: 4 },
});

export default function AdminGroupDetailScreen({ navigation, route }: Props) {
  const { groupId, groupName } = route.params as { groupId: string; groupName: string | null };
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/volunteers?groupId=${encodeURIComponent(groupId)}&status=ACTIVE`);
      setVolunteers(res.data.volunteers ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, []);

  const students = volunteers.filter(v => v.enrollmentType?.toUpperCase() === 'S');
  const teachers = volunteers.filter(v => v.enrollmentType?.toUpperCase() === 'T');

  return (
    <View style={styles.page}>
      <TopNavbar
        title={groupName ?? groupId}
        actions={[{ label: 'Back', onPress: () => navigation.goBack() }]}
      />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Summary row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCount}>{students.length}</Text>
              <Text style={styles.summaryLabel}>Students</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCount}>{teachers.length}</Text>
              <Text style={styles.summaryLabel}>Teachers</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryCount, { color: colors.blue }]}>
                {students.filter(s => s.trackType?.toUpperCase() === 'MEM').length}
              </Text>
              <Text style={styles.summaryLabel}>MEM</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryCount, { color: colors.purple }]}>
                {students.filter(s => s.trackType?.toUpperCase() === 'FLUENT').length}
              </Text>
              <Text style={styles.summaryLabel}>Fluent</Text>
            </View>
          </View>

          {/* Students */}
          {students.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Students ({students.length})</Text>
              <View style={styles.tableContainer}>
                {students.map(v => <VolunteerRow key={v.volunteerId} v={v} />)}
              </View>
            </>
          )}

          {/* Teachers */}
          {teachers.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Teachers ({teachers.length})</Text>
              <View style={styles.tableContainer}>
                {teachers.map(v => <VolunteerRow key={v.volunteerId} v={v} />)}
              </View>
            </>
          )}

          {volunteers.length === 0 && (
            <Text style={styles.emptyText}>No volunteers in this group.</Text>
          )}

          <Footer />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  summaryRow: {
    flexDirection: 'row', gap: 10, marginBottom: 4,
  },
  summaryCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.md,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.card,
  },
  summaryCount: { fontSize: 24, ...fonts.extraBold, color: colors.navy },
  summaryLabel: { fontSize: 10, ...fonts.semiBold, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase' },
  sectionLabel: {
    fontSize: 11, ...fonts.semiBold, color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 8,
  },
  tableContainer: {
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  emptyText: { fontSize: 13, ...fonts.regular, color: colors.textMuted, marginTop: 24, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, ...fonts.regular, color: colors.textMuted },
  errorCard: {
    margin: 16, backgroundColor: colors.errorBg, borderRadius: borderRadius.md,
    padding: 16, borderWidth: 1, borderColor: colors.errorBorder, alignItems: 'center',
  },
  errorText: { fontSize: 14, ...fonts.regular, color: colors.errorText, textAlign: 'center' },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.errorText, borderRadius: 8 },
  retryText: { fontSize: 13, ...fonts.semiBold, color: colors.white },
});
