import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StudentScreenProps } from '../navigation/types';
import { ActionGrid, AlertBox, ContentCard, Footer, StatCard, TopNavbar, WelcomeCard } from '../components';
import { useAuth } from '../context/AuthContext';
import { enrollmentProgram, enrollmentStatus, type LearningEnrollment, type ProgramType } from '../features/enrollment/models';
import { useSelectedEnrollment } from '../features/enrollment/SelectedEnrollmentContext';
import { getLearningEnrollments } from '../features/enrollment/service';
import type { StudentDashboardResponse } from '../features/student/dashboard/models';
import { getStudentDashboard } from '../features/student/dashboard/service';
import { borderRadius, colors, fonts, spacing } from '../theme';

type Props = StudentScreenProps<'StudentDashboard'>;

const PROGRAM_LABELS: Record<ProgramType, string> = {
  MEMORIZATION: 'Bhagavad Gita Memorization Program',
  REVISION: 'Bhagavad Gita Revision Program',
  FLUENT: 'Bhagavad Gita Fluent Reading Program',
};

function getEnrollmentId(enrollment: LearningEnrollment) {
  return enrollment.enrollmentId ?? enrollment.id;
}

function todayIsoDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function StudentHomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { selectedEnrollment, clearSelectedEnrollment } = useSelectedEnrollment();
  const [data, setData] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const returnToMyLearning = useCallback(() => {
    clearSelectedEnrollment();
    navigation.replace('MyLearning');
  }, [clearSelectedEnrollment, navigation]);

  const load = useCallback(async () => {
    if (!selectedEnrollment) {
      navigation.replace('MyLearning');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const currentEnrollments = await getLearningEnrollments();
      const selectedId = getEnrollmentId(selectedEnrollment);
      const currentEnrollment = currentEnrollments.find(
        (enrollment) => getEnrollmentId(enrollment) === selectedId,
      );

      if (!currentEnrollment || enrollmentStatus(currentEnrollment) !== 'ACTIVE') {
        returnToMyLearning();
        return;
      }

      setData(await getStudentDashboard(selectedId));
    } catch (requestError: any) {
      if (requestError.response?.status === 403) {
        returnToMyLearning();
        return;
      }
      setError(requestError.response?.data?.error || 'Failed to load learning progress.');
    } finally {
      setLoading(false);
    }
  }, [navigation, returnToMyLearning, selectedEnrollment]);

  useEffect(() => { void load(); }, [load]);

  const program = selectedEnrollment ? enrollmentProgram(selectedEnrollment) : null;
  const supportsExams = program !== 'FLUENT';
  const upcomingBooking = data?.learningProgress.latestBooking?.date
    && data.learningProgress.latestBooking.date >= todayIsoDate()
    ? data.learningProgress.latestBooking
    : null;
  const upcomingBookingDetails = data?.bookings.find((booking) => booking.id === upcomingBooking?.bookingId);
  const latestResult = data?.learningProgress.latestGradedExam ?? null;
  const latestResultDetails = data?.bookings.find((booking) => booking.id === latestResult?.bookingId);

  const actions = useMemo(() => {
    const examActions = [
      {
        title: 'Book Slot', description: 'Book your exam slot', iconLabel: '📅',
        iconBg: colors.blueBg, iconColor: colors.blue,
        onPress: () => navigation.navigate('StudentSlots'),
      },
      {
        title: 'Exam History', description: 'See your test results', iconLabel: '🏆',
        iconBg: colors.greenBg, iconColor: colors.green,
        onPress: () => navigation.navigate('StudentGrades'),
      },
    ];
    return [
      ...(supportsExams ? examActions : []),
      {
        title: 'Attendance', description: 'Check your attendance', iconLabel: '📋',
        iconBg: colors.orangeBg, iconColor: colors.primary,
        onPress: () => navigation.navigate('StudentAttendance'),
      },
      {
        title: 'Back to My Learning', description: 'Choose another active learning programme', iconLabel: '←',
        iconBg: colors.purpleBg, iconColor: colors.purple,
        onPress: () => navigation.navigate('MyLearning'),
      },
      {
        title: 'Account Settings', description: 'Review and update your contact information', iconLabel: '⚙️',
        iconBg: colors.tealBg, iconColor: colors.teal,
        onPress: () => navigation.navigate('AccountSettings'),
      },
    ];
  }, [navigation, supportsExams]);

  const group = selectedEnrollment?.groupName?.trim() || selectedEnrollment?.groupId?.trim();
  const teacher = selectedEnrollment?.teacherName?.trim();
  const center = selectedEnrollment?.centerName?.trim();
  const badges = [{ label: user?.volunteerId || '' }, ...(group ? [{ label: `Group ${group}` }] : [])];

  if (!selectedEnrollment) return <View style={styles.page} />;

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Student Dashboard"
        actions={[
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <WelcomeCard greeting="Welcome back" name={user?.name || ''} badges={badges} />
        <Text style={styles.programTitle}>{program ? PROGRAM_LABELS[program] : ''}</Text>
        <ActionGrid actions={actions} columns={4} />

        <ContentCard title="Current Learning">
          <Text style={styles.currentLearningProgram}>{program ? PROGRAM_LABELS[program] : ''}</Text>
          {group ? <DetailRow label="Group" value={group} /> : null}
          {teacher ? <DetailRow label="Teacher" value={teacher} /> : null}
          {center ? <DetailRow label="Center" value={center} /> : null}
        </ContentCard>

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
            <ContentCard title="Learning Progress" rightLabel={supportsExams ? `${data.learningProgress.overallProgressPercent}%` : undefined}>
              {supportsExams ? (
                <>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, data.learningProgress.overallProgressPercent))}%` }]} />
                  </View>
                  <View style={styles.statGrid}>
                    <StatCard value={`${data.learningProgress.completedChapters}/${data.learningProgress.totalChapters}`} label="Completed Chapters" iconLabel="📖" iconBg={colors.blueBg} iconColor={colors.blue} />
                    <StatCard value={`${data.learningProgress.completedSlokas}/${data.learningProgress.totalSlokas}`} label="Completed Slokas" iconLabel="✓" iconBg={colors.greenBg} iconColor={colors.green} />
                    <StatCard value={data.learningProgress.remainingSlokas} label="Remaining Slokas" iconLabel="↗" iconBg={colors.orangeBg} iconColor={colors.primary} />
                    <StatCard value={`${data.learningProgress.attendance.percent}%`} label="Attendance" iconLabel="📋" iconBg={colors.purpleBg} iconColor={colors.purple} />
                  </View>
                </>
              ) : <DetailRow label="Attendance" value={`${data.learningProgress.attendance.percent}% (${data.learningProgress.attendance.present} of ${data.learningProgress.attendance.total} classes)`} />}
            </ContentCard>

            <ContentCard title={supportsExams ? 'Upcoming Booking' : 'Upcoming Class'} headerVariant="orange">
              {supportsExams ? upcomingBooking ? (
                <>
                  <DetailRow label="Exam Date" value={upcomingBookingDetails?.formattedDate ?? upcomingBooking.date ?? '-'} />
                  <DetailRow label="Chapter" value={upcomingBooking.chapterName ?? `Chapter ${upcomingBooking.chapterNumber ?? ''}`} />
                  {upcomingBooking.slokaCount ? <DetailRow label="Slokas" value={`1–${upcomingBooking.slokaCount}`} /> : null}
                  {data.learningProgress.currentSyllabus[0] ? <DetailRow label="Study Next" value={data.learningProgress.currentSyllabus[0].chapterName} /> : null}
                  {upcomingBookingDetails?.slotName ? <DetailRow label="Slot" value={upcomingBookingDetails.slotName} /> : null}
                </>
              ) : <Text style={styles.emptyText}>No exam booked yet. Use Book Slot when you are ready.</Text> : (
                <Text style={styles.guidanceText}>Your next class follows your group&apos;s current learning schedule. Review attendance regularly and continue your reading practice.</Text>
              )}
            </ContentCard>

            {supportsExams ? (
              <ContentCard title="Latest Result">
                {latestResult ? (
                  <>
                    <DetailRow label="Exam Date" value={latestResultDetails?.formattedDate ?? latestResult.date ?? '-'} />
                    {latestResultDetails?.assignedTeacherName ? <DetailRow label="Teacher" value={latestResultDetails.assignedTeacherName} /> : null}
                    <DetailRow label="Memorization" value={latestResult.memorizationGrade ?? '-'} />
                    <DetailRow label="Pronunciation" value={latestResult.pronunciationGrade ?? '-'} />
                    {latestResultDetails?.teacherComment ? <DetailRow label="Teacher Comments" value={latestResultDetails.teacherComment} /> : null}
                  </>
                ) : <Text style={styles.emptyText}>No final result yet. Results appear after both grades are submitted.</Text>}
              </ContentCard>
            ) : null}

            <ContentCard title="Statistics">
              <View style={styles.statGrid}>
                <StatCard value={data.totalBookings} label="Total Bookings" iconLabel="📅" iconBg={colors.blueBg} iconColor={colors.blue} />
                <StatCard value={data.gradedCount} label="Graded" iconLabel="✓" iconBg={colors.greenBg} iconColor={colors.green} />
                <StatCard value={data.pendingCount} label="Pending" iconLabel="…" iconBg={colors.orangeBg} iconColor={colors.primary} />
                <StatCard value={data.avgMem} label="Avg Memorization" iconLabel="M" iconBg={colors.purpleBg} iconColor={colors.purple} />
                <StatCard value={data.avgPro} label="Avg Pronunciation" iconLabel="P" iconBg={colors.tealBg} iconColor={colors.teal} />
                <StatCard value={data.totalSlokas} label="Total Slokas" iconLabel="ॐ" iconBg={colors.maroonBg} iconColor={colors.maroon} />
              </View>
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Exam Summary</Text>
                <DetailRow label="Completed Exams" value={data.learningProgress.gradeSummary.completedExams} />
                <DetailRow label="Awaiting Final Grade" value={data.learningProgress.gradeSummary.awaitingFinalGrade} />
                <DetailRow label="Retests" value={data.learningProgress.gradeSummary.retests} />
              </View>
              {Object.keys(data.chapterCounts).length > 0 ? <View style={styles.summarySection}><Text style={styles.summaryTitle}>Chapter Activity</Text>{Object.entries(data.chapterCounts).map(([chapter, count]) => <DetailRow key={chapter} label={chapter} value={count} />)}</View> : null}
              {Object.keys(data.gradeDist).length > 0 ? <View style={styles.summarySection}><Text style={styles.summaryTitle}>Grade Distribution</Text>{Object.entries(data.gradeDist).map(([grade, count]) => <DetailRow key={grade} label={grade} value={count} />)}</View> : null}
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
  programTitle: { color: colors.navy, fontSize: 14, textAlign: 'center', ...fonts.semiBold },
  currentLearningProgram: { color: colors.primary, fontSize: 15, marginBottom: spacing.sm, ...fonts.bold },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.xs },
  detailLabel: { flex: 1, color: colors.textMuted, fontSize: 13 },
  detailValue: { flex: 1, color: colors.textDark, fontSize: 13, textAlign: 'right', ...fonts.semiBold },
  errorState: { gap: spacing.sm },
  retryButton: { alignSelf: 'center', backgroundColor: colors.navy, borderRadius: borderRadius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { color: colors.white, ...fonts.bold },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: colors.borderLight, overflow: 'hidden', marginBottom: spacing.md },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  guidanceText: { color: colors.textBody, lineHeight: 21 },
  summarySection: { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: spacing.md, paddingTop: spacing.md },
  summaryTitle: { color: colors.navy, fontSize: 14, marginBottom: spacing.xs, ...fonts.bold },
});
