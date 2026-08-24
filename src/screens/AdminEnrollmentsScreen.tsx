import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertBox, TopNavbar } from '../components';
import { useAuth } from '../context/AuthContext';
import type { AdminEnrollmentManagementData, EnrollmentProgramType } from '../features/admin/enrollments/models';
import { getAdminEnrollmentManagement } from '../features/admin/enrollments/service';
import { borderRadius, colors, fonts, shadows, spacing } from '../theme';

type Props = { navigation: NativeStackNavigationProp<any> };

function errorMessage(error: any): string {
  return error.response?.data?.error
    ?? error.response?.data?.message
    ?? 'Failed to load enrollments.';
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatPrograms(programs: EnrollmentProgramType[]): string {
  return programs.length > 0 ? programs.join(', ') : 'None';
}

export default function AdminEnrollmentsScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [data, setData] = useState<AdminEnrollmentManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getAdminEnrollmentManagement());
    } catch (requestError: any) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pendingEnrollments = data?.enrollments.enrollments ?? [];

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Enrollment Management"
        actions={[
          { label: '← Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading enrollments...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <AlertBox type="error" message={error} />
          <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{pendingEnrollments.length}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{data?.enrollments.activeEnrollments.length ?? 0}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Pending Enrollments</Text>
          <Text style={styles.countText}>{data?.enrollments.total ?? 0} pending</Text>

          {pendingEnrollments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No pending enrollments</Text>
            </View>
          ) : pendingEnrollments.map((enrollment) => (
            <View key={enrollment.enrollmentId} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.identity}>
                  <Text style={styles.name}>{enrollment.volunteerName}</Text>
                  <Text style={styles.volunteerId}>{enrollment.volunteerId}</Text>
                </View>
                <View style={styles.programBadge}>
                  <Text style={styles.programBadgeText}>{enrollment.programType}</Text>
                </View>
              </View>
              <View style={styles.details}>
                <Text style={styles.detailLabel}>Requested On</Text>
                <Text style={styles.detailValue}>{formatDate(enrollment.requestedDate)}</Text>
                <Text style={styles.detailLabel}>Current Active Programs</Text>
                <Text style={styles.detailValue}>{formatPrograms(enrollment.currentActivePrograms)}</Text>
                <Text style={styles.detailLabel}>Current Pending Programs</Text>
                <Text style={styles.detailValue}>{formatPrograms(enrollment.currentPendingPrograms)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
  retryButton: { backgroundColor: colors.navy, borderRadius: borderRadius.md, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.white, ...fonts.semiBold },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  summaryCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: colors.navy, fontSize: 24, ...fonts.extraBold },
  summaryLabel: { color: colors.textMuted, fontSize: 11, textTransform: 'uppercase', marginTop: 2, ...fonts.semiBold },
  summaryDivider: { width: 1, backgroundColor: colors.borderLight },
  sectionTitle: { color: colors.navy, fontSize: 18, marginTop: spacing.sm, ...fonts.extraBold },
  countText: { fontSize: 12, color: colors.textMuted, ...fonts.medium },
  emptyCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', ...shadows.card },
  emptyIcon: { fontSize: 40, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 18, color: colors.textDark, ...fonts.bold },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  identity: { flex: 1 },
  name: { fontSize: 15, color: colors.textDark, ...fonts.semiBold },
  volunteerId: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  programBadge: { backgroundColor: colors.infoBg, borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  programBadgeText: { color: colors.infoText, fontSize: 10, ...fonts.bold },
  details: { marginTop: spacing.md, gap: 3 },
  detailLabel: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', marginTop: 5, ...fonts.semiBold },
  detailValue: { color: colors.textBody, fontSize: 13 },
});
