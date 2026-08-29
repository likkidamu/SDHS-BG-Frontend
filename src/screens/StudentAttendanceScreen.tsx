import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { TopNavbar, StatCard, ContentCard, Footer } from '../components';
import { colors, shadows, borderRadius, fonts, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import type { StudentScreenProps } from '../navigation/types';
import { enrollmentProgram, enrollmentStatus, type LearningEnrollment, type ProgramType } from '../features/enrollment/models';
import { useSelectedEnrollment } from '../features/enrollment/SelectedEnrollmentContext';
import { getLearningEnrollments } from '../features/enrollment/service';
import type { StudentAttendanceRecord, StudentAttendanceResponse } from '../features/student/attendance/models';
import { getStudentAttendance } from '../features/student/attendance/service';
import { getApiErrorMessage } from '../utils/apiError';

type Props = StudentScreenProps<'StudentAttendance'>;

const PROGRAM_LABELS: Record<ProgramType, string> = {
  MEMORIZATION: 'Memorization',
  REVISION: 'Revision',
  FLUENT: 'Fluent Reading',
};

function getEnrollmentId(enrollment: LearningEnrollment) {
  return enrollment.enrollmentId ?? enrollment.id;
}

function isUnavailableEnrollmentError(error: any) {
  return error.response?.status === 403
    && error.response?.data?.error === 'The selected learning enrollment is unavailable.';
}

export default function StudentAttendanceScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const { selectedEnrollment, clearSelectedEnrollment } = useSelectedEnrollment();
  const [data, setData] = useState<StudentAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const returnToMyLearning = useCallback(() => {
    clearSelectedEnrollment();
    navigation.replace('MyLearning');
  }, [clearSelectedEnrollment, navigation]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedEnrollment) {
      navigation.replace('MyLearning');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const selectedId = getEnrollmentId(selectedEnrollment);
      const enrollments = await getLearningEnrollments();
      const currentEnrollment = enrollments.find(
        (enrollment) => getEnrollmentId(enrollment) === selectedId,
      );
      if (!currentEnrollment || enrollmentStatus(currentEnrollment) !== 'ACTIVE') {
        returnToMyLearning();
        return;
      }
      setData(await getStudentAttendance(selectedId));
    } catch (e: any) {
      if (isUnavailableEnrollmentError(e)) {
        returnToMyLearning();
        return;
      }
      setError(getApiErrorMessage(e, 'Failed to load attendance data.'));
    } finally {
      setLoading(false);
    }
  }, [navigation, returnToMyLearning, selectedEnrollment]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T00:00:00Z`);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getStatusBadge = (record: StudentAttendanceRecord) => {
    if (record.noClass) {
      return { label: 'No Class', bg: '#fff3e0', text: '#e65100' };
    }
    if (record.present) {
      return { label: 'Present', bg: '#e8f5e9', text: '#1b5e20' };
    }
    return { label: 'Absent', bg: '#ffebee', text: '#b71c1c' };
  };

  const getGroupStatusColor = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { bg: '#e8f5e9', text: '#1b5e20' };
      case 'completed':
        return { bg: '#e3f2fd', text: '#1565c0' };
      default:
        return { bg: '#fff3e0', text: '#e65100' };
    }
  };

  if (loading) {
    return (
      <View style={styles.page}>
        <TopNavbar
          title="My Attendance"
          actions={[
            { label: 'Back', onPress: () => navigation.goBack() },
            { label: 'Logout', onPress: logout, variant: 'logout' },
          ]}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.page}>
        <TopNavbar
          title="My Attendance"
          actions={[
            { label: 'Back', onPress: () => navigation.goBack() },
            { label: 'Logout', onPress: logout, variant: 'logout' },
          ]}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void fetchAttendance()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusColor = getGroupStatusColor(data?.groupStatus);
  const selectedProgram = selectedEnrollment ? enrollmentProgram(selectedEnrollment) : null;
  const selectedGroup = selectedEnrollment?.groupName?.trim() || selectedEnrollment?.groupId?.trim();
  const selectedTeacher = selectedEnrollment?.teacherName?.trim();
  const selectedCenter = selectedEnrollment?.centerName?.trim();

  return (
    <View style={styles.page}>
      <TopNavbar
        title="My Attendance"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {selectedProgram ? (
          <ContentCard title="Current Learning">
            <Text style={styles.currentProgram}>{PROGRAM_LABELS[selectedProgram]}</Text>
            {selectedGroup ? <View style={styles.currentDetail}><Text style={styles.currentDetailLabel}>Group</Text><Text style={styles.currentDetailValue}>{selectedGroup}</Text></View> : null}
            {selectedTeacher ? <View style={styles.currentDetail}><Text style={styles.currentDetailLabel}>Teacher</Text><Text style={styles.currentDetailValue}>{selectedTeacher}</Text></View> : null}
            {selectedCenter ? <View style={styles.currentDetail}><Text style={styles.currentDetailLabel}>Center</Text><Text style={styles.currentDetailValue}>{selectedCenter}</Text></View> : null}
          </ContentCard>
        ) : null}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.studentName}>{data?.studentName}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>{data?.volunteerId}</Text>
            </View>
            {data?.groupId ? <View style={styles.idBadge}><Text style={styles.idBadgeText}>Group {data.groupId}</Text></View> : null}
            {data?.groupStatus ? <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}><Text style={[styles.statusBadgeText, { color: statusColor.text }]}>{data.groupStatus}</Text></View> : null}
          </View>
          {data?.groupStartDate || data?.groupEndDate ? <Text style={styles.dateRange}>{formatDate(data?.groupStartDate)} - {formatDate(data?.groupEndDate)}</Text> : null}
        </View>

        {/* Stat Cards Row */}
        <View style={styles.statsRow}>
          <View style={styles.statWrapper}>
            <StatCard
              value={data?.present ?? 0}
              label="Present"
              iconLabel="✓"
              iconBg={colors.greenBg}
              iconColor={colors.green}
              valueColor={colors.green}
            />
          </View>
          <View style={styles.statWrapper}>
            <StatCard
              value={data?.total ?? 0}
              label="Total Classes"
              iconLabel="📚"
              iconBg={colors.blueBg}
              iconColor={colors.blue}
              valueColor={colors.navy}
            />
          </View>
          <View style={styles.statWrapper}>
            <StatCard
              value={data?.percent ?? '0%'}
              label="Percentage"
              iconLabel="%"
              iconBg={colors.orangeBg}
              iconColor={colors.primary}
              valueColor={colors.primary}
            />
          </View>
        </View>

        {/* Attendance History */}
        <ContentCard title="Attendance History" rightLabel={`${data?.history?.length ?? 0} Records`}>
          {data?.history && data.history.length > 0 ? (
            data.history.map((record, index) => {
              const badge = getStatusBadge(record);
              return (
                <View
                  key={record.id}
                  style={[
                    styles.historyRow,
                    index < data.history.length - 1 && styles.historyRowBorder,
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formatDate(record.classDate)}</Text>
                    <Text style={styles.historyGroup}>{record.groupId ? `Group ${record.groupId}` : '-'}</Text>
                  </View>
                  <View style={[styles.attendanceBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.attendanceBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No attendance has been recorded yet. Records will appear after your teacher marks attendance for an eligible class date.</Text>
          )}
        </ContentCard>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            Attendance percentage is calculated based on the number of classes you were present
            out of the total classes held. Classes marked as "No Class" are excluded from the
            calculation.
          </Text>
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.medium,
  },
  errorText: {
    fontSize: 14,
    color: colors.errorText,
    ...fonts.medium,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    color: colors.white,
    ...fonts.bold,
  },
  currentProgram: {
    color: colors.primary,
    fontSize: 15,
    marginBottom: spacing.sm,
    ...fonts.bold,
  },
  currentDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  currentDetailLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  currentDetailValue: {
    color: colors.textDark,
    fontSize: 13,
    textAlign: 'right',
    ...fonts.semiBold,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  studentName: {
    fontSize: 20,
    ...fonts.bold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  idBadge: {
    backgroundColor: colors.blueBg,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  idBadgeText: {
    fontSize: 12,
    ...fonts.semiBold,
    color: colors.blue,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 12,
    ...fonts.semiBold,
  },
  dateRange: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.medium,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statWrapper: {
    flex: 1,
  },

  // History
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    ...fonts.semiBold,
    color: colors.textDark,
  },
  historyGroup: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.regular,
    marginTop: 2,
  },
  attendanceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  attendanceBadgeText: {
    fontSize: 12,
    ...fonts.bold,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.medium,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Info Note
  infoNote: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  infoNoteText: {
    fontSize: 12,
    color: colors.infoText,
    ...fonts.medium,
    lineHeight: 18,
  },
});
