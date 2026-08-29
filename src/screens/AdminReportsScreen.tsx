import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AsyncState, ContentCard, Footer, StatCard, TopNavbar } from '../components';
import type { AttendanceConfigurationGroup } from '../features/admin/enrollments/models';
import type { AdminReportsData } from '../features/admin/reports/models';
import { getAdminReports } from '../features/admin/reports/service';
import type { AdminVolunteer } from '../features/admin/volunteers/models';
import { borderRadius, colors, fonts, spacing } from '../theme';
import { getApiErrorMessage } from '../utils/apiError';

type Props = { navigation: NativeStackNavigationProp<any> };

function countStudents(students: AdminVolunteer[], groupId: string, trackType?: string): number {
  return students.filter(
    (student) => student.groupId === groupId
      && (!trackType || student.trackType === trackType),
  ).length;
}

function GroupReportCard({
  group,
  students,
  onPress,
}: {
  group: AttendanceConfigurationGroup;
  students: AdminVolunteer[];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.groupCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.groupHeader}>
        <View style={styles.groupIdentity}>
          <Text style={styles.groupName}>{group.groupName ?? `Group ${group.groupId}`}</Text>
          <Text style={styles.groupMeta}>{group.groupId} · {group.status}</Text>
        </View>
        <Text style={styles.groupArrow}>›</Text>
      </View>
      <View style={styles.groupMetrics}>
        <View style={styles.groupMetric}>
          <Text style={styles.groupMetricValue}>{countStudents(students, group.groupId)}</Text>
          <Text style={styles.groupMetricLabel}>Students</Text>
        </View>
        <View style={styles.groupMetric}>
          <Text style={styles.groupMetricValue}>{countStudents(students, group.groupId, 'MEM')}</Text>
          <Text style={styles.groupMetricLabel}>MEM</Text>
        </View>
        <View style={styles.groupMetric}>
          <Text style={styles.groupMetricValue}>{countStudents(students, group.groupId, 'FLUENT')}</Text>
          <Text style={styles.groupMetricLabel}>FLUENT</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminReportsScreen({ navigation }: Props) {
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setData(await getAdminReports());
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Failed to load reports.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => {
    const students = data?.volunteers.volunteers ?? [];
    return {
      activeStudents: students.filter((student) => student.status === 'ACTIVE').length,
      memorizationStudents: students.filter((student) => student.trackType === 'MEM').length,
      fluentStudents: students.filter((student) => student.trackType === 'FLUENT').length,
      activeGroups: data?.config.groups.filter((group) => group.status === 'ACTIVE').length ?? 0,
    };
  }, [data]);

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Reports & Analytics"
        actions={[{ label: 'Back', onPress: () => navigation.goBack() }]}
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
        <AsyncState loading={loading} error={!loading ? error : false} onRetry={() => void load()} loadingMessage="Loading reports..." />

        {!loading && data ? (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Learning Overview</Text>
              <Text style={styles.sectionDescription}>Current student and configured-group coverage.</Text>
            </View>
            <View style={styles.statGrid}>
              <StatCard value={data.volunteers.total} label="Total Students" iconLabel="👥" iconBg={colors.blueBg} iconColor={colors.blue} />
              <StatCard value={metrics.activeStudents} label="Active Students" iconLabel="✓" iconBg={colors.greenBg} iconColor={colors.green} />
              <StatCard value={data.config.groups.length} label="Configured Groups" iconLabel="G" iconBg={colors.orangeBg} iconColor={colors.primary} />
              <StatCard value={metrics.activeGroups} label="Active Groups" iconLabel="●" iconBg={colors.purpleBg} iconColor={colors.purple} />
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Volunteer Statistics</Text>
              <Text style={styles.sectionDescription}>Student distribution by learning track.</Text>
            </View>
            <View style={styles.statGrid}>
              <StatCard value={metrics.memorizationStudents} label="Memorization" iconLabel="M" iconBg={colors.blueBg} iconColor={colors.blue} />
              <StatCard value={metrics.fluentStudents} label="Fluent Reading" iconLabel="F" iconBg={colors.purpleBg} iconColor={colors.purple} />
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Report Navigation</Text>
              <Text style={styles.sectionDescription}>Open the report views currently available.</Text>
            </View>
            <ContentCard title="Group Reports" rightLabel={`${data.config.groups.length} Groups`}>
              {data.config.groups.length === 0 ? (
                <AsyncState empty emptyMessage="No configured groups are available for reporting." />
              ) : (
                <View style={styles.groupList}>
                  {data.config.groups.map((group) => (
                    <GroupReportCard
                      key={group.groupId}
                      group={group}
                      students={data.volunteers.volunteers}
                      onPress={() => navigation.navigate('AdminGroupDetail', {
                        groupId: group.groupId,
                        groupName: group.groupName,
                      })}
                    />
                  ))}
                </View>
              )}
            </ContentCard>

            <ContentCard title="Volunteer Analytics" rightLabel="Individual Report">
              <Text style={styles.analyticsTitle}>Volunteer learning and examination analytics</Text>
              <Text style={styles.analyticsDescription}>
                Select a volunteer from Manage Volunteers to review bookings, grading, slokas, and assigned teachers.
              </Text>
              <TouchableOpacity
                style={styles.analyticsButton}
                onPress={() => navigation.navigate('AdminVolunteers')}
              >
                <Text style={styles.analyticsButtonText}>Select Volunteer</Text>
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
  sectionHeading: { gap: spacing.xs, marginTop: spacing.xs },
  sectionTitle: { color: colors.navy, fontSize: 18, ...fonts.bold },
  sectionDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  groupList: { gap: spacing.sm },
  groupCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupIdentity: { flex: 1 },
  groupName: { color: colors.navy, fontSize: 14, ...fonts.bold },
  groupMeta: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  groupArrow: { color: colors.textMuted, fontSize: 24 },
  groupMetrics: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  groupMetric: { flex: 1, alignItems: 'center' },
  groupMetricValue: { color: colors.textDark, fontSize: 18, ...fonts.extraBold },
  groupMetricLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2, ...fonts.semiBold },
  analyticsTitle: { color: colors.textDark, fontSize: 14, ...fonts.bold },
  analyticsDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  analyticsButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  analyticsButtonText: { color: colors.white, fontSize: 13, ...fonts.bold },
});
