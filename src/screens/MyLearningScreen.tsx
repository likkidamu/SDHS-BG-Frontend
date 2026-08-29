import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AlertBox, Footer, TopNavbar } from '../components';
import { useAuth } from '../context/AuthContext';
import {
  enrollmentProgram,
  enrollmentStatus,
  type EnrollmentStatus,
  type LearningEnrollment,
  type ProgramType,
} from '../features/enrollment/models';
import { useSelectedEnrollment } from '../features/enrollment/SelectedEnrollmentContext';
import { getLearningEnrollments } from '../features/enrollment/service';
import { borderRadius, colors, fonts, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<any, 'MyLearning'>;

const SECTIONS: ReadonlyArray<{ status: EnrollmentStatus; title: string }> = [
  { status: 'ACTIVE', title: 'Active Learning' },
  { status: 'PENDING', title: 'Pending Approvals' },
  { status: 'COMPLETED', title: 'Completed' },
  { status: 'DROPPED', title: 'Dropped' },
  { status: 'REJECTED', title: 'Rejected' },
];

const PROGRAM_LABELS: Record<ProgramType, string> = {
  MEMORIZATION: 'Memorization',
  FLUENT: 'Fluent Reading',
  REVISION: 'Revision',
};

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped',
  REJECTED: 'Rejected',
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EnrollmentCard({
  enrollment,
  onBookSlot,
  onOpenDashboard,
}: {
  enrollment: LearningEnrollment;
  onBookSlot: () => void;
  onOpenDashboard: () => void;
}) {
  const program = enrollmentProgram(enrollment);
  const status = enrollmentStatus(enrollment);
  const isDefault = enrollment.isDefault ?? enrollment.defaultEnrollment;
  const group = enrollment.groupName?.trim() || enrollment.groupId?.trim();
  const center = enrollment.centerName?.trim();
  const teacher = enrollment.teacherName?.trim();
  const enrollmentDate = formatDate(enrollment.enrollmentDate);
  const completionDate = formatDate(enrollment.completionDate);
  const decisionDate = formatDate(enrollment.decisionDate);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, styles.programBadge]}><Text style={styles.programBadgeText}>{PROGRAM_LABELS[program]}</Text></View>
        <View style={[styles.badge, styles.statusBadge]}><Text style={styles.statusBadgeText}>{STATUS_LABELS[status]}</Text></View>
      </View>

      <View style={styles.details}>
        {teacher ? <Detail label="Teacher" value={teacher} /> : null}
        {group ? <Detail label="Group" value={group} /> : null}
        {center ? <Detail label="Center" value={center} /> : null}
        {enrollmentDate ? <Detail label="Enrollment Date" value={enrollmentDate} /> : null}
        {completionDate ? <Detail label="Completion Date" value={completionDate} /> : null}
        {decisionDate && (status === 'REJECTED' || status === 'DROPPED') ? <Detail label="Decision Date" value={decisionDate} /> : null}
      </View>

      <View style={styles.timeline}>
        <View style={styles.timelineStep}><View style={styles.timelineDot} /><Text style={styles.timelineLabel}>Created</Text>{enrollmentDate ? <Text style={styles.timelineDate}>{enrollmentDate}</Text> : null}</View>
        <View style={styles.timelineLine} />
        <View style={styles.timelineStep}><View style={[styles.timelineDot, styles.timelineDotCurrent]} /><Text style={styles.timelineLabel}>{status === 'PENDING' ? 'Pending Approval' : STATUS_LABELS[status]}</Text>{completionDate && status === 'COMPLETED' ? <Text style={styles.timelineDate}>{completionDate}</Text> : null}{decisionDate && (status === 'REJECTED' || status === 'DROPPED') ? <Text style={styles.timelineDate}>{decisionDate}</Text> : null}</View>
      </View>

      {status === 'REJECTED' ? <Text style={styles.decisionNote}>No additional comments were recorded for this rejection.</Text> : null}

      <View style={styles.indicators}>
        <Text style={[styles.indicator, isDefault && styles.indicatorActive]}>{isDefault ? 'Default Enrollment' : 'Additional Enrollment'}</Text>
        <Text style={[styles.indicator, enrollment.slotEligible && styles.indicatorEligible]}>{enrollment.slotEligible ? 'Slot Eligible' : 'Slot Not Eligible'}</Text>
      </View>

      {status === 'ACTIVE' ? (
        <View style={styles.actions}>
          {program !== 'FLUENT' ? <ActionButton label="Book Slot" secondary onPress={onBookSlot} /> : null}
          <ActionButton label="Open Dashboard" onPress={onOpenDashboard} />
        </View>
      ) : status === 'PENDING' ? <Text style={styles.pending}>Waiting for Admin Approval</Text> : null}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

function ActionButton({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <TouchableOpacity style={[styles.actionButton, secondary && styles.actionButtonSecondary]} onPress={onPress}><Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text></TouchableOpacity>;
}

export default function MyLearningScreen({ navigation, route }: Props) {
  const { logout } = useAuth();
  const { selectEnrollment } = useSelectedEnrollment();
  const [enrollments, setEnrollments] = useState<LearningEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setEnrollments(await getLearningEnrollments());
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.error
          ?? requestError.response?.data?.message
          ?? 'Unable to load learning enrollments.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (route.params?.enrollmentRequestSuccess) {
      setNotice('Enrollment request submitted successfully.');
      navigation.setParams({ enrollmentRequestSuccess: undefined });
    }
  }, [navigation, route.params?.enrollmentRequestSuccess]);

  const grouped = useMemo(() => {
    const result = new Map<EnrollmentStatus, LearningEnrollment[]>();
    SECTIONS.forEach(({ status }) => result.set(status, []));
    enrollments.forEach((enrollment) => result.get(enrollmentStatus(enrollment))?.push(enrollment));
    return result;
  }, [enrollments]);

  const open = (enrollment: LearningEnrollment, route: 'StudentSlots' | 'StudentDashboard') => {
    selectEnrollment(enrollment);
    navigation.navigate(route);
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="My Learning" actions={[{ label: 'Logout', onPress: logout, variant: 'logout' }]} />
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
          <View style={styles.headingRow}>
            <View style={styles.headingText}>
              <Text style={styles.title}>My Learning</Text>
              <Text style={styles.subtitle}>Select a learning enrollment to open your dashboard.</Text>
            </View>
            <TouchableOpacity
              style={styles.newEnrollmentButton}
              onPress={() => navigation.navigate('StudentNewEnrollment')}
            >
              <Text style={styles.newEnrollmentText}>New Enrollment</Text>
            </TouchableOpacity>
          </View>
          {notice ? <AlertBox type="success" message={notice} /> : null}
          {error ? (
            <View style={styles.errorState}>
              <AlertBox type="error" message={error} />
              <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {!error && enrollments.length === 0 ? <Text style={styles.empty}>You do not have a learning enrollment yet. Select New Enrollment to request a learning program.</Text> : null}
          {!error ? SECTIONS.map(({ status, title }) => {
            const items = grouped.get(status) ?? [];
            if (items.length === 0) return null;
            return <View key={status} style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{status === 'PENDING' ? <Text style={styles.sectionGuidance}>These requests are waiting for administrator approval.</Text> : null}{items.map((enrollment) => <EnrollmentCard key={enrollment.enrollmentId ?? enrollment.id} enrollment={enrollment} onBookSlot={() => open(enrollment, 'StudentSlots')} onOpenDashboard={() => open(enrollment, 'StudentDashboard')} />)}</View>;
          }) : null}
          <Footer />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, gap: spacing.md },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headingText: { flex: 1, gap: spacing.sm },
  title: { fontSize: 26, color: colors.textDark, ...fonts.extraBold },
  subtitle: { fontSize: 14, color: colors.textMuted },
  newEnrollmentButton: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.navy, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10 },
  newEnrollmentText: { color: colors.navy, fontSize: 13, ...fonts.bold },
  errorState: { gap: spacing.sm },
  retryButton: { alignSelf: 'flex-start', backgroundColor: colors.navy, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  retryText: { color: colors.white, fontSize: 13, ...fonts.bold },
  empty: { padding: spacing.lg, textAlign: 'center', color: colors.textMuted, backgroundColor: colors.white, borderRadius: borderRadius.lg },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 19, color: colors.navy, ...fonts.bold, marginTop: spacing.sm },
  sectionGuidance: { fontSize: 13, color: colors.textMuted },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.md, ...shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.sm },
  programBadge: { backgroundColor: colors.orangeBg },
  programBadgeText: { color: colors.primaryDark, fontSize: 12, ...fonts.bold },
  statusBadge: { backgroundColor: colors.infoBg },
  statusBadgeText: { color: colors.infoText, fontSize: 12, ...fonts.bold },
  details: { gap: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  detailLabel: { color: colors.textMuted, fontSize: 13 },
  detailValue: { color: colors.textDark, fontSize: 13, ...fonts.semiBold, textAlign: 'right', flex: 1 },
  timeline: { paddingLeft: spacing.xs },
  timelineStep: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.borderLight },
  timelineDotCurrent: { backgroundColor: colors.primary },
  timelineLine: { width: 2, height: 14, backgroundColor: colors.borderLight, marginLeft: 3.5 },
  timelineLabel: { color: colors.textBody, fontSize: 12, ...fonts.semiBold },
  timelineDate: { color: colors.textMuted, fontSize: 11, marginLeft: 'auto' },
  decisionNote: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  indicators: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  indicator: { color: colors.textMuted, backgroundColor: colors.bg, paddingHorizontal: 9, paddingVertical: 5, borderRadius: borderRadius.sm, fontSize: 11, ...fonts.semiBold },
  indicatorActive: { color: colors.navy, backgroundColor: colors.blueBg },
  indicatorEligible: { color: colors.green, backgroundColor: colors.greenBg },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: spacing.sm },
  actionButton: { backgroundColor: colors.navy, paddingHorizontal: 15, paddingVertical: 10, borderRadius: borderRadius.sm },
  actionButtonSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.navy },
  actionText: { color: colors.white, fontSize: 13, ...fonts.bold },
  actionTextSecondary: { color: colors.navy },
  pending: { color: colors.primary, fontSize: 13, ...fonts.semiBold, textAlign: 'right' },
});
