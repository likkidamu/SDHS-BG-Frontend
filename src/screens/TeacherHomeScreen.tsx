import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActionGrid, AlertBox, ContentCard, Footer, StatCard, TopNavbar, WelcomeCard } from '../components';
import { useAuth } from '../context/AuthContext';
import type { TeacherGradingBooking } from '../features/teacher/grading/models';
import type { TeacherHomeData } from '../features/teacher/home/models';
import { getTeacherHome } from '../features/teacher/home/service';
import { colors, fonts, spacing } from '../theme';

type Props = { navigation: NativeStackNavigationProp<any> };

function todayIsoDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function errorMessage(error: any): string {
  return error.response?.data?.error
    ?? error.response?.data?.message
    ?? 'Failed to load teacher dashboard.';
}

function BookingRow({ booking, recent = false }: { booking: TeacherGradingBooking; recent?: boolean }) {
  const chapter = booking.chapterName ?? `Chapter ${booking.chapterNumber ?? ''}`;
  return (
    <View style={styles.listRow}>
      <View style={styles.listIdentity}>
        <Text style={styles.listTitle}>{booking.studentName}</Text>
        {!recent ? <Text style={styles.listMeta}>{booking.studentVolunteerId}</Text> : null}
        {!recent && booking.studentPhone ? (
          <TouchableOpacity onPress={() => void Linking.openURL(`tel:${booking.studentPhone}`)}>
            <Text style={styles.phone}>{booking.studentPhone}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.listDetails}>
        <Text style={styles.listTitle}>{chapter}</Text>
        <Text style={styles.listMeta}>{recent ? booking.formattedDate ?? booking.date ?? '' : booking.slotName ?? 'Time not listed'}</Text>
      </View>
      {!recent ? (
        <View style={styles.listEnd}>
          <Text style={styles.listDate}>{booking.formattedDate ?? booking.date ?? ''}</Text>
          <View style={styles.assignedBadge}><Text style={styles.assignedBadgeText}>Assigned</Text></View>
        </View>
      ) : null}
    </View>
  );
}

export default function TeacherHomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [data, setData] = useState<TeacherHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setData(await getTeacherHome());
    } catch (requestError: any) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const today = todayIsoDate();
  const { todayBookings, upcomingBookings, evaluatedBookings } = useMemo(() => {
    const activeBookings = (data?.grading.bookings ?? []).filter((booking) => !booking.cancelled);
    return {
      todayBookings: activeBookings.filter((booking) => booking.date === today),
      upcomingBookings: [...activeBookings]
        .filter((booking) => Boolean(booking.date) && booking.date! >= today)
        .sort((left, right) => (left.date ?? '').localeCompare(right.date ?? ''))
        .slice(0, 4),
      evaluatedBookings: [...activeBookings]
        .filter((booking) => Boolean(booking.memorizationGrade?.trim()))
        .sort((left, right) => (right.date ?? '').localeCompare(left.date ?? ''))
        .slice(0, 3),
    };
  }, [data?.grading.bookings, today]);

  const actions = useMemo(() => [
    {
      title: 'Attendance', description: 'Record learning-group attendance', iconLabel: '📋',
      iconBg: colors.greenBg, iconColor: colors.green,
      onPress: () => navigation.navigate('TeacherAttendance'),
    },
    {
      title: 'My Availability', description: 'Update upcoming exam availability', iconLabel: '🗓️',
      iconBg: colors.orangeBg, iconColor: colors.primary,
      onPress: () => navigation.navigate('TeacherAvailability'),
    },
    {
      title: 'Pending Grading', description: 'Complete pending student evaluations', iconLabel: '✏️',
      iconBg: colors.blueBg, iconColor: colors.blue,
      onPress: () => navigation.navigate('TeacherDashboard'),
    },
  ], [navigation]);

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Teacher Dashboard"
        actions={[
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <WelcomeCard greeting="Welcome back" name={user?.name || ''} badges={[{ label: user?.volunteerId || '' }]} />
        <ActionGrid actions={actions} columns={3} />

        {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
        {!loading && error ? (
          <View style={styles.errorState}>
            <AlertBox type="error" message={error} />
            <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && data ? (
          <>
            <Text style={styles.sectionTitle}>Today&apos;s Teaching</Text>
            <Text style={styles.sectionSubtitle}>Your current examination and evaluation workload.</Text>
            <View style={styles.statGrid}>
              <StatCard value={todayBookings.length} label="Today's Exams" iconLabel="📅" iconBg={colors.blueBg} iconColor={colors.blue} />
              <StatCard value={data.home.uniqueStudents} label="Assigned Students" iconLabel="👥" iconBg={colors.greenBg} iconColor={colors.green} />
              <StatCard value={data.availability.selectedSlotIds.length > 0 ? 'Submitted' : 'Pending'} label="Availability Status" iconLabel="🗓️" iconBg={colors.orangeBg} iconColor={colors.primary} />
              <StatCard value={data.home.pendingCount} label="Pending Grading" iconLabel="✏️" iconBg={colors.purpleBg} iconColor={colors.purple} />
            </View>

            <ContentCard title="Assigned Exams" rightLabel={`${upcomingBookings.length} upcoming`}>
              {upcomingBookings.length > 0
                ? upcomingBookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)
                : <Text style={styles.emptyText}>No assigned exams are currently waiting for you.</Text>}
            </ContentCard>

            <ContentCard title="Evaluation Summary">
              <View style={styles.metricRow}><Text style={styles.metricLabel}>Waiting for Grading</Text><Text style={styles.metricValue}>{data.home.pendingCount}</Text></View>
              <View style={styles.metricRow}><Text style={styles.metricLabel}>Completed Grading</Text><Text style={styles.metricValue}>{data.home.gradedCount}</Text></View>
              <View style={styles.metricRow}><Text style={styles.metricLabel}>Memorization Average</Text><Text style={styles.metricValue}>{data.home.avgMem}</Text></View>
              <View style={styles.metricRow}><Text style={styles.metricLabel}>Pronunciation Average</Text><Text style={styles.metricValue}>{data.home.avgPro}</Text></View>
            </ContentCard>

            <ContentCard title="Recent Evaluations" rightLabel={String(evaluatedBookings.length)}>
              {evaluatedBookings.length > 0
                ? evaluatedBookings.map((booking) => <BookingRow key={booking.id} booking={booking} recent />)
                : <Text style={styles.emptyText}>No completed evaluations are available yet.</Text>}
            </ContentCard>

            <ContentCard title="Attendance" rightLabel={`${data.home.totalSessions} sessions`}>
              <Text style={styles.summaryValue}>{data.home.totalSessions}</Text>
              <Text style={styles.summaryLabel}>teaching sessions recorded</Text>
              <Text style={styles.guidance}>Open attendance to review the current week and record student participation.</Text>
            </ContentCard>

            <ContentCard title="Availability" rightLabel={data.availability.examDate}>
              <Text style={styles.summaryValue}>{data.availability.selectedSlotIds.length}</Text>
              <Text style={styles.summaryLabel}>time windows selected</Text>
              <Text style={styles.guidance}>{data.availability.selectedSlotIds.length > 0
                ? 'Your availability is submitted for the upcoming examination.'
                : 'Availability is pending. Add your time windows before booking begins.'}</Text>
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
  errorState: { alignItems: 'center' },
  retryButton: { backgroundColor: colors.navy, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.white, ...fonts.bold },
  sectionTitle: { color: colors.navy, fontSize: 20, ...fonts.extraBold },
  sectionSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: -spacing.sm },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  listRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  listIdentity: { flex: 1, minWidth: 120 },
  listDetails: { flex: 1, minWidth: 110 },
  listEnd: { alignItems: 'flex-end', minWidth: 90 },
  listTitle: { color: colors.textDark, fontSize: 14, ...fonts.bold },
  listMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  phone: { color: colors.navy, fontSize: 12, marginTop: 3, textDecorationLine: 'underline' },
  listDate: { color: colors.textBody, fontSize: 12 },
  assignedBadge: { backgroundColor: colors.blueBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5 },
  assignedBadgeText: { color: colors.blue, fontSize: 10, ...fonts.bold },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: spacing.md },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  metricLabel: { color: colors.textBody, fontSize: 14 },
  metricValue: { color: colors.navy, fontSize: 16, ...fonts.extraBold },
  summaryValue: { color: colors.navy, fontSize: 30, ...fonts.extraBold },
  summaryLabel: { color: colors.textBody, fontSize: 14 },
  guidance: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
});
