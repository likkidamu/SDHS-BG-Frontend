import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { TopNavbar } from '../components';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

interface Booking {
  id: number;
  date: string;
  formattedDate: string;
  slotName: string;
  chapterNumber: number;
  chapterName: string;
  slokaCount: number;
  memorizationGrade: string;
  pronunciationGrade: string;
  teacherComment: string;
  assignedTeacherName: string;
}

interface Analytics {
  volunteer: { volunteerId: string; name: string; groupId: string; status: string; phoneNumber: string; email: string; trackType: string; enrollmentType: string; };
  totalBookings: number;
  gradedCount: number;
  pendingCount: number;
  avgMem: string;
  avgPro: string;
  totalSlokas: number;
  gradeDist: Record<string, number>;
  chapterCounts: Record<string, number>;
  bookings: Booking[];
}

const GRADE_COLORS: Record<string, string> = {
  'A+': colors.gradeAPlus, 'A': colors.gradeA, 'B': colors.gradeB,
  'C': colors.gradeC, 'RETEST': colors.gradeRetest,
};

export default function AdminVolunteerAnalyticsScreen({ navigation, route }: Props) {
  const { logout } = useAuth();
  const vid = route.params?.vid as string;
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/volunteers/${vid}/analytics`);
        setData(res.data);
      } catch (e: any) {
        setError(e.response?.data?.error || 'Failed to load analytics');
      } finally { setLoading(false); }
    })();
  }, [vid]);

  const gradeColor = (g: string) => GRADE_COLORS[g?.trim()?.toUpperCase()] || colors.textMuted;

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Volunteer Analytics"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : data ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{data.volunteer.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{data.volunteer.name}</Text>
              <Text style={styles.profileVid}>{data.volunteer.volunteerId}</Text>
              <View style={[styles.badge, { backgroundColor: data.volunteer.status === 'ACTIVE' ? colors.successBg : colors.errorBg, alignSelf: 'flex-start', marginTop: 4 }]}>
                <Text style={[styles.badgeText, { color: data.volunteer.status === 'ACTIVE' ? colors.successText : colors.errorText }]}>{data.volunteer.status}</Text>
              </View>
            </View>
          </View>
          <View style={styles.profileMeta}>
            {data.volunteer.phoneNumber ? <Text style={styles.metaItem}>📱 {data.volunteer.phoneNumber}</Text> : null}
            {data.volunteer.email ? <Text style={styles.metaItem}>✉️ {data.volunteer.email}</Text> : null}
            {data.volunteer.groupId ? <Text style={styles.metaItem}>👥 Group: {data.volunteer.groupId}</Text> : null}
            <Text style={styles.metaItem}>🏷 {data.volunteer.trackType} • {data.volunteer.enrollmentType}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Total Exams', value: String(data.totalBookings) },
              { label: 'Graded', value: String(data.gradedCount) },
              { label: 'Pending', value: String(data.pendingCount) },
              { label: 'Total Slokas', value: String(data.totalSlokas) },
            ].map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { flex: 1 }]}>
              <Text style={styles.statValue}>{data.avgMem}</Text>
              <Text style={styles.statLabel}>Avg Memorization</Text>
            </View>
            <View style={[styles.statBox, { flex: 1 }]}>
              <Text style={styles.statValue}>{data.avgPro}</Text>
              <Text style={styles.statLabel}>Avg Pronunciation</Text>
            </View>
          </View>

          {/* Grade Distribution */}
          {Object.keys(data.gradeDist).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Grade Distribution</Text>
              <View style={styles.gradeDistRow}>
                {Object.entries(data.gradeDist).map(([grade, count]) => (
                  <View key={grade} style={[styles.gradeDistBox, { borderTopColor: gradeColor(grade) }]}>
                    <Text style={[styles.gradeDistValue, { color: gradeColor(grade) }]}>{count}</Text>
                    <Text style={styles.gradeDistLabel}>{grade}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Chapters Covered */}
          {Object.keys(data.chapterCounts).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chapters Covered</Text>
              <View style={styles.chapterRow}>
                {Object.entries(data.chapterCounts).map(([ch, cnt]) => (
                  <View key={ch} style={styles.chapterChip}>
                    <Text style={styles.chapterChipText}>{ch}</Text>
                    <Text style={styles.chapterChipCount}>{cnt}x</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Exam History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exam History ({data.bookings.length})</Text>
            {data.bookings.slice().reverse().map(b => (
              <View key={b.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingDate}>{b.formattedDate || b.date}</Text>
                  {b.slotName ? <Text style={styles.bookingSlot}>{b.slotName}</Text> : null}
                </View>
                <Text style={styles.bookingChapter}>Ch {b.chapterNumber}: {b.chapterName} — {b.slokaCount} slokas</Text>
                <View style={styles.bookingGrades}>
                  <View style={[styles.gradeTag, { backgroundColor: gradeColor(b.memorizationGrade) + '20' }]}>
                    <Text style={[styles.gradeTagText, { color: gradeColor(b.memorizationGrade) }]}>Mem: {b.memorizationGrade || '—'}</Text>
                  </View>
                  <View style={[styles.gradeTag, { backgroundColor: gradeColor(b.pronunciationGrade) + '20' }]}>
                    <Text style={[styles.gradeTagText, { color: gradeColor(b.pronunciationGrade) }]}>Pro: {b.pronunciationGrade || '—'}</Text>
                  </View>
                </View>
                {b.teacherComment ? <Text style={styles.comment}>💬 {b.teacherComment}</Text> : null}
                {b.assignedTeacherName ? <Text style={styles.teacher}>Teacher: {b.assignedTeacherName}</Text> : null}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { color: colors.errorText, fontSize: 14, textAlign: 'center' },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.md, ...shadows.card, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 24, ...fonts.bold },
  profileName: { fontSize: 18, color: colors.textDark, ...fonts.bold },
  profileVid: { fontSize: 13, color: colors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm },
  badgeText: { fontSize: 11, ...fonts.bold },
  profileMeta: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card, gap: 4 },
  metaItem: { fontSize: 13, color: colors.textBody },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.sm, alignItems: 'center', ...shadows.card },
  statValue: { fontSize: 18, color: colors.navy, ...fonts.bold },
  statLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2, ...fonts.medium },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, color: colors.textDark, ...fonts.bold },
  gradeDistRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradeDistBox: { flex: 1, minWidth: 60, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', borderTopWidth: 3, ...shadows.card },
  gradeDistValue: { fontSize: 20, ...fonts.bold },
  gradeDistLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  chapterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chapterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.white, borderRadius: borderRadius.md, paddingHorizontal: 10, paddingVertical: 6, ...shadows.card },
  chapterChipText: { fontSize: 13, color: colors.navy, ...fonts.semiBold },
  chapterChipCount: { fontSize: 11, color: colors.textMuted },
  bookingCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.sm, ...shadows.card, gap: 4 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingDate: { fontSize: 13, color: colors.textDark, ...fonts.semiBold },
  bookingSlot: { fontSize: 12, color: colors.textMuted },
  bookingChapter: { fontSize: 12, color: colors.textBody },
  bookingGrades: { flexDirection: 'row', gap: 8 },
  gradeTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.sm },
  gradeTagText: { fontSize: 12, ...fonts.semiBold },
  comment: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  teacher: { fontSize: 11, color: colors.textMuted },
});
