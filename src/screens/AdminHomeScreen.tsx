import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActionGrid, AlertBox, ContentCard, Footer, StatCard, TopNavbar } from '../components';
import { useAuth } from '../context/AuthContext';
import type { AdminDashboardData, AdminDashboardVolunteer } from '../features/admin/dashboard/models';
import { getAdminDashboard } from '../features/admin/dashboard/service';
import { borderRadius, colors, fonts, spacing } from '../theme';

const bgAdmin = require('../../assets/bg_admin.png');

type Props = { navigation: NativeStackNavigationProp<any> };

function errorMessage(error: any): string {
  return error.response?.data?.error
    ?? error.response?.data?.message
    ?? 'Failed to load the admin dashboard.';
}

function formatDate(value: string | null): string {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function VolunteerRow({ volunteer }: { volunteer: AdminDashboardVolunteer }) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listIdentity}>
        <Text style={styles.listTitle}>{volunteer.name}</Text>
        <Text style={styles.listMeta}>{volunteer.volunteerId}</Text>
      </View>
      <View style={styles.listEnd}>
        <Text style={styles.listDate}>{formatDate(volunteer.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function AdminHomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setData(await getAdminDashboard());
    } catch (requestError: any) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const volunteerSummary = useMemo(() => {
    const volunteers = data?.volunteers.volunteers ?? [];
    return {
      active: volunteers.filter((volunteer) => volunteer.status === 'ACTIVE'),
      inactive: volunteers.filter((volunteer) => volunteer.status === 'INACTIVE'),
      dropped: volunteers.filter((volunteer) => volunteer.status === 'DROPPED'),
      recent: volunteers
        .filter((volunteer) => volunteer.createdAt)
        .sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? ''))
        .slice(0, 4),
    };
  }, [data?.volunteers.volunteers]);

  const actions = useMemo(() => [
    {
      title: 'Syllabus', description: 'Configure chapters & sloka ranges', iconLabel: '📖',
      iconBg: colors.primary, iconColor: colors.white, onPress: () => navigation.navigate('AdminSyllabus'),
    },
    {
      title: 'Teacher Availability', description: 'View & manage teacher schedules', iconLabel: '📅',
      iconBg: colors.navy, iconColor: colors.white, onPress: () => navigation.navigate('AdminTeacherAvailability'),
    },
    {
      title: 'Student Slot Booking', description: 'Bulk book student exam slots', iconLabel: '👥',
      iconBg: colors.primaryDark, iconColor: colors.white, onPress: () => navigation.navigate('AdminBulkBooking'),
    },
    {
      title: 'Teachers Dashboard', description: "View all teachers' performance", iconLabel: '📊',
      iconBg: colors.navyLight, iconColor: colors.white, onPress: () => navigation.navigate('AdminTeachersDashboard'),
    },
    {
      title: 'New Enrollments', description: 'Review student enrollment requests', iconLabel: '🙋',
      iconBg: colors.teal, iconColor: colors.white, onPress: () => navigation.navigate('AdminEnrollments'),
    },
    {
      title: 'Manage Volunteers', description: 'Drop / Reactivate volunteers', iconLabel: '⚙️',
      iconBg: colors.maroon, iconColor: colors.white, onPress: () => navigation.navigate('AdminVolunteers'),
    },
    {
      title: 'Attendance Config', description: 'Configure group attendance settings', iconLabel: '✅',
      iconBg: colors.gold, iconColor: colors.white, onPress: () => navigation.navigate('AdminAttendanceConfig'),
    },
    {
      title: 'Reports', description: 'Teachers & students reports', iconLabel: '📋',
      iconBg: colors.purple, iconColor: colors.white, onPress: () => navigation.navigate('AdminReports'),
    },
    {
      title: 'Account Settings', description: 'Review and update your contact information', iconLabel: '⚙️',
      iconBg: colors.teal, iconColor: colors.white, onPress: () => navigation.navigate('AccountSettings'),
    },
  ], [navigation]);

  return (
    <ImageBackground source={bgAdmin} style={styles.page} resizeMode="cover" imageStyle={styles.bgImage}>
      <View style={styles.overlay}>
        <TopNavbar
          title="SDHS BG Admin"
          actions={[
            { label: 'Switch User', onPress: logout },
            { label: 'Logout', onPress: logout, variant: 'logout' },
          ]}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={[colors.primary]} tintColor={colors.white} />}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Admin Console</Text>
            <Text style={styles.heroSubtitle}>Welcome, <Text style={styles.heroBold}>{user?.name}</Text></Text>
            <View style={styles.heroDivider} />
          </View>

          {loading ? <ActivityIndicator size="large" color={colors.gold} /> : null}
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
              <Text style={styles.sectionLabel}>TODAY&apos;S OVERVIEW</Text>
              <View style={styles.statGrid}>
                <StatCard value={data.enrollments.total} label="Pending Enrollments" iconLabel="🙋" iconBg={colors.orangeBg} iconColor={colors.primary} />
                <StatCard value={volunteerSummary.active.length} label="Active Volunteers" iconLabel="👥" iconBg={colors.greenBg} iconColor={colors.green} />
                <StatCard value={data.availability.summary.submitted} label="Teachers Available" iconLabel="🗓️" iconBg={colors.blueBg} iconColor={colors.blue} />
                <StatCard value={data.availability.date || 'Not scheduled'} label="Upcoming Examination" iconLabel="📅" iconBg={colors.purpleBg} iconColor={colors.purple} />
              </View>

              <ContentCard title="Pending Enrollments" rightLabel={String(data.enrollments.total)}>
                {data.enrollments.enrollments.length > 0
                  ? data.enrollments.enrollments.slice(0, 4).map((enrollment) => (
                    <View key={enrollment.enrollmentId} style={styles.listRow}>
                      <View style={styles.listIdentity}>
                        <Text style={styles.listTitle}>{enrollment.volunteerName}</Text>
                        <Text style={styles.listMeta}>{enrollment.volunteerId}</Text>
                      </View>
                      <Text style={styles.programText}>{enrollment.programType}</Text>
                    </View>
                  ))
                  : <Text style={styles.emptyText}>No enrollment requests are pending.</Text>}
              </ContentCard>

              <ContentCard title="Teacher Availability Pending" rightLabel={`${data.availability.summary.pending} of ${data.availability.summary.teachers}`}>
                <Text style={styles.summaryValue}>{data.availability.summary.pending}</Text>
                <Text style={styles.summaryLabel}>of {data.availability.summary.teachers} teachers pending</Text>
                <Text style={styles.guidance}>{data.availability.summary.pending === 0
                  ? 'All active teachers have submitted availability.'
                  : `${data.availability.summary.pending} teachers still need to submit availability.`}</Text>
              </ContentCard>

              <ContentCard title="Inactive Volunteers" rightLabel={String(volunteerSummary.inactive.length)}>
                <Text style={styles.summaryValue}>{volunteerSummary.inactive.length}</Text>
                <Text style={styles.summaryLabel}>inactive volunteer accounts</Text>
                <Text style={styles.guidance}>Review volunteer status and reactivate accounts when appropriate.</Text>
              </ContentCard>

              <ContentCard title="Volunteer Operations" rightLabel={String(data.volunteers.total)}>
                <View style={styles.metricRow}><Text style={styles.metricLabel}>Total Volunteers</Text><Text style={styles.metricValue}>{data.volunteers.total}</Text></View>
                <View style={styles.metricRow}><Text style={styles.metricLabel}>Active</Text><Text style={styles.metricValue}>{volunteerSummary.active.length}</Text></View>
                <View style={styles.metricRow}><Text style={styles.metricLabel}>Inactive</Text><Text style={styles.metricValue}>{volunteerSummary.inactive.length}</Text></View>
                <View style={styles.metricRow}><Text style={styles.metricLabel}>Dropped</Text><Text style={styles.metricValue}>{volunteerSummary.dropped.length}</Text></View>
              </ContentCard>

              <ContentCard title="Recent Activity" rightLabel={String(volunteerSummary.recent.length)}>
                {volunteerSummary.recent.length > 0
                  ? volunteerSummary.recent.map((volunteer) => <VolunteerRow key={volunteer.volunteerId} volunteer={volunteer} />)
                  : <Text style={styles.emptyText}>No recent volunteer activity is available.</Text>}
              </ContentCard>

              <ContentCard title="Teacher Readiness" rightLabel={data.availability.date || 'Not scheduled'}>
                <View style={styles.metricRow}><Text style={styles.metricLabel}>Submitted</Text><Text style={styles.metricValue}>{data.availability.summary.submitted}</Text></View>
                <View style={styles.metricRow}><Text style={styles.metricLabel}>Pending</Text><Text style={styles.metricValue}>{data.availability.summary.pending}</Text></View>
                <View style={styles.metricRow}><Text style={styles.metricLabel}>Availability Windows</Text><Text style={styles.metricValue}>{data.availability.summary.availabilityWindows}</Text></View>
              </ContentCard>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <ActionGrid actions={actions} columns={4} />
          <Footer />
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: '100%', height: '100%' },
  bgImage: { width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  content: { padding: spacing.md, gap: spacing.md },
  heroCard: { backgroundColor: colors.primary, borderRadius: borderRadius.xxl, padding: 36, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: colors.gold },
  heroTitle: { color: colors.white, fontSize: 28, ...fonts.extraBold, letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 16, marginTop: 8, ...fonts.regular },
  heroBold: { ...fonts.bold, color: colors.white },
  heroDivider: { width: 60, height: 3, backgroundColor: colors.gold, borderRadius: 2, marginTop: 14 },
  sectionLabel: { fontSize: 12, ...fonts.bold, letterSpacing: 1.5, color: 'rgba(255,255,255,0.75)', paddingLeft: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  errorState: { alignItems: 'center' },
  retryButton: { backgroundColor: colors.navy, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.white, ...fonts.bold },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  listIdentity: { flex: 1 },
  listEnd: { alignItems: 'flex-end' },
  listTitle: { color: colors.textDark, fontSize: 14, ...fonts.bold },
  listMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  listDate: { color: colors.textBody, fontSize: 12, marginTop: 3 },
  programText: { color: colors.navy, fontSize: 12, ...fonts.bold },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: spacing.md },
  summaryValue: { color: colors.navy, fontSize: 30, ...fonts.extraBold },
  summaryLabel: { color: colors.textBody, fontSize: 14 },
  guidance: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  metricLabel: { color: colors.textBody, fontSize: 14 },
  metricValue: { color: colors.navy, fontSize: 16, ...fonts.extraBold },
});
