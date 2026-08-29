import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AdminScreenProps } from '../navigation/types';
import { AlertBox, showConfirmationDialog, TopNavbar } from '../components';
import { useAuth } from '../context/AuthContext';
import type {
  AdminEnrollmentManagementData,
  AttendanceConfigurationGroup,
  EnrollmentProgramType,
} from '../features/admin/enrollments/models';
import {
  approveAdminEnrollment,
  completeAdminEnrollment,
  dropActiveAdminEnrollment,
  getAdminEnrollmentManagement,
  makeAdminEnrollmentDefault,
  rejectAdminEnrollment,
} from '../features/admin/enrollments/service';
import { borderRadius, colors, fonts, shadows, spacing } from '../theme';
import { getApiErrorMessage } from '../utils/apiError';

type Props = AdminScreenProps<'AdminEnrollments'>;

interface ApprovalDraft {
  groupId: string;
  slotEligible: boolean;
  rejectionReason: string;
}

type EnrollmentAction = 'approve' | 'reject' | 'default' | 'complete' | 'drop';

const emptyDraft: ApprovalDraft = { groupId: '', slotEligible: false, rejectionReason: '' };

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatPrograms(programs: EnrollmentProgramType[]): string {
  return programs.length > 0 ? programs.join(', ') : 'None';
}

function GroupSelector({ groups, selected, disabled, onChange }: {
  groups: AttendanceConfigurationGroup[];
  selected: string;
  disabled: boolean;
  onChange: (groupId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedGroup = groups.find((group) => group.groupId === selected);
  return <>
    <TouchableOpacity style={[styles.groupSelector, disabled && styles.controlDisabled]} disabled={disabled} onPress={() => setOpen(true)}>
      <Text style={[styles.groupSelectorText, !selectedGroup && styles.placeholderText]} numberOfLines={1}>{selectedGroup?.groupName ?? selectedGroup?.groupId ?? 'Select group'}</Text>
      <Text style={styles.groupSelectorArrow}>▾</Text>
    </TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <TouchableOpacity style={styles.selectorOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
        <View style={styles.selectorSheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.selectorTitle}>Select Group</Text>
          <ScrollView style={styles.selectorList}>
            {groups.length === 0 ? <Text style={styles.noGroupsText}>No configured groups are available.</Text> : groups.map((group) => (
              <TouchableOpacity key={group.groupId} style={styles.selectorRow} onPress={() => { onChange(group.groupId); setOpen(false); }}>
                <View style={[styles.radio, selected === group.groupId && styles.radioSelected]}>{selected === group.groupId ? <View style={styles.radioDot} /> : null}</View>
                <View style={styles.groupIdentity}><Text style={styles.selectorRowTitle}>{group.groupName ?? group.groupId}</Text>{group.groupName ? <Text style={styles.selectorRowMeta}>{group.groupId}</Text> : null}</View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  </>;
}

export default function AdminEnrollmentsScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [data, setData] = useState<AdminEnrollmentManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<number, ApprovalDraft>>({});
  const [working, setWorking] = useState<number | null>(null);
  const [workingAction, setWorkingAction] = useState<EnrollmentAction | null>(null);
  const actionInFlight = useRef(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setData(await getAdminEnrollmentManagement());
    } catch (requestError: any) {
      setError(getApiErrorMessage(requestError, 'Failed to load enrollments.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pendingEnrollments = data?.enrollments.enrollments ?? [];
  const activeEnrollments = data?.enrollments.activeEnrollments ?? [];
  const draftFor = (enrollmentId: number): ApprovalDraft => drafts[enrollmentId] ?? emptyDraft;
  const updateDraft = <K extends keyof ApprovalDraft>(enrollmentId: number, key: K, value: ApprovalDraft[K]) => {
    setDrafts((current) => ({
      ...current,
      [enrollmentId]: { ...(current[enrollmentId] ?? emptyDraft), [key]: value },
    }));
  };

  const approve = async (enrollmentId: number) => {
    if (actionInFlight.current) return;
    const draft = draftFor(enrollmentId);
    if (!draft.groupId) {
      setNotice({ type: 'error', message: 'Group is required for approval.' });
      return;
    }
    actionInFlight.current = true;
    setWorking(enrollmentId);
    setWorkingAction('approve');
    setNotice(null);
    try {
      await approveAdminEnrollment(enrollmentId, {
        groupId: draft.groupId,
        slotEligible: draft.slotEligible,
      });
      setNotice({ type: 'success', message: 'Enrollment approved.' });
      await load(true);
    } catch (requestError: any) {
      setNotice({ type: 'error', message: getApiErrorMessage(requestError, 'Failed to approve enrollment.') });
    } finally {
      actionInFlight.current = false;
      setWorking(null);
      setWorkingAction(null);
    }
  };

  const reject = (enrollmentId: number) => {
    if (actionInFlight.current) return;
    showConfirmationDialog({
      title: 'Reject Enrollment',
      message: 'Reject this enrollment?',
      confirmLabel: 'Reject',
      destructive: true,
      confirm: async () => {
        if (actionInFlight.current) return;
        actionInFlight.current = true;
        setWorking(enrollmentId);
        setWorkingAction('reject');
        setNotice(null);
        try {
          const reason = draftFor(enrollmentId).rejectionReason.trim();
          await rejectAdminEnrollment(enrollmentId, reason ? { reason } : {});
          setNotice({ type: 'success', message: 'Enrollment rejected.' });
          await load(true);
        } catch (requestError: any) {
          setNotice({ type: 'error', message: getApiErrorMessage(requestError, 'Failed to reject enrollment.') });
        } finally {
          actionInFlight.current = false;
          setWorking(null);
          setWorkingAction(null);
        }
      },
    });
  };

  const lifecycleAction = (enrollmentId: number, action: 'default' | 'complete' | 'drop') => {
    if (actionInFlight.current) return;
    const labels = { default: 'make this the default', complete: 'complete', drop: 'drop' };
    showConfirmationDialog({
      title: action === 'default' ? 'Make Default Enrollment' : action === 'complete' ? 'Complete Enrollment' : 'Drop Enrollment',
      message: `Are you sure you want to ${labels[action]} enrollment?`,
      confirmLabel: action === 'default' ? 'Make Default' : action === 'complete' ? 'Complete' : 'Drop',
      destructive: action === 'drop',
      confirm: async () => {
          if (actionInFlight.current) return;
          actionInFlight.current = true;
          setWorking(enrollmentId);
          setWorkingAction(action);
          setNotice(null);
          try {
            if (action === 'default') await makeAdminEnrollmentDefault(enrollmentId);
            if (action === 'complete') await completeAdminEnrollment(enrollmentId);
            if (action === 'drop') await dropActiveAdminEnrollment(enrollmentId);
            const success = action === 'default' ? 'set as default' : action === 'complete' ? 'completed' : 'dropped';
            setNotice({ type: 'success', message: `Enrollment ${success} successfully.` });
            await load(true);
          } catch (requestError: any) {
            setNotice({ type: 'error', message: getApiErrorMessage(requestError, `Unable to ${action} enrollment.`) });
          } finally {
            actionInFlight.current = false;
            setWorking(null);
            setWorkingAction(null);
          }
      },
    });
  };

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
        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={[colors.primary]} tintColor={colors.primary} />}
        >
          {notice ? <AlertBox type={notice.type} message={notice.message} /> : null}
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
              <View style={styles.approvalSection}>
                <Text style={styles.controlLabel}>Configured Group</Text>
                <GroupSelector
                  groups={data?.groups ?? []}
                  selected={draftFor(enrollment.enrollmentId).groupId}
                  disabled={working !== null}
                  onChange={(groupId) => updateDraft(enrollment.enrollmentId, 'groupId', groupId)}
                />
                <Text style={styles.controlLabel}>Slot Eligible</Text>
                <TouchableOpacity
                  style={[styles.slotToggle, draftFor(enrollment.enrollmentId).slotEligible && styles.slotToggleActive, working !== null && styles.controlDisabled]}
                  disabled={working !== null}
                  onPress={() => updateDraft(enrollment.enrollmentId, 'slotEligible', !draftFor(enrollment.enrollmentId).slotEligible)}
                >
                  <Text style={[styles.slotToggleText, draftFor(enrollment.enrollmentId).slotEligible && styles.slotToggleTextActive]}>{draftFor(enrollment.enrollmentId).slotEligible ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
                <Text style={styles.controlLabel}>Rejection Reason (optional)</Text>
                <TextInput
                  style={[styles.reasonInput, working !== null && styles.controlDisabled]}
                  value={draftFor(enrollment.enrollmentId).rejectionReason}
                  editable={working === null}
                  maxLength={400}
                  onChangeText={(rejectionReason) => updateDraft(enrollment.enrollmentId, 'rejectionReason', rejectionReason)}
                  placeholder="Reason for rejection"
                />
                <Text style={styles.characterCount}>{draftFor(enrollment.enrollmentId).rejectionReason.length}/400</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionButton, styles.approveButton, working !== null && styles.controlDisabled]} disabled={working !== null} onPress={() => void approve(enrollment.enrollmentId)}>
                    {working === enrollment.enrollmentId && workingAction === 'approve' ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.actionText}>Approve</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.rejectButton, working !== null && styles.controlDisabled]} disabled={working !== null} onPress={() => reject(enrollment.enrollmentId)}>
                    {working === enrollment.enrollmentId && workingAction === 'reject' ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.actionText}>Reject</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Active Enrollments</Text>
          <Text style={styles.countText}>{activeEnrollments.length} active</Text>
          {activeEnrollments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No active enrollments</Text>
              <Text style={styles.emptySubtitle}>Approved learning enrollments will appear here.</Text>
            </View>
          ) : activeEnrollments.map((enrollment) => (
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
              <View style={styles.activeDetails}>
                <View style={styles.activeDetailRow}><Text style={styles.activeDetailLabel}>Assigned Group</Text><Text style={styles.activeDetailValue}>{enrollment.groupId ?? '—'}</Text></View>
                <View style={styles.activeDetailRow}><Text style={styles.activeDetailLabel}>Slot Eligible</Text><Text style={styles.activeDetailValue}>{enrollment.slotEligible ? 'Yes' : 'No'}</Text></View>
                <View style={styles.activeDetailRow}><Text style={styles.activeDetailLabel}>Default Enrollment</Text><View style={[styles.defaultBadge, enrollment.defaultEnrollment && styles.defaultBadgeActive]}><Text style={[styles.defaultBadgeText, enrollment.defaultEnrollment && styles.defaultBadgeTextActive]}>{enrollment.defaultEnrollment ? 'Yes' : 'No'}</Text></View></View>
              </View>
              <View style={styles.lifecycleActions}>
                {!enrollment.defaultEnrollment ? (
                  <TouchableOpacity style={[styles.lifecycleButton, styles.defaultButton, working !== null && styles.controlDisabled]} disabled={working !== null} onPress={() => lifecycleAction(enrollment.enrollmentId, 'default')}>
                    {working === enrollment.enrollmentId && workingAction === 'default' ? <ActivityIndicator size="small" color={colors.navy} /> : <Text style={styles.defaultButtonText}>Make Default</Text>}
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={[styles.lifecycleButton, styles.completeButton, working !== null && styles.controlDisabled]} disabled={working !== null} onPress={() => lifecycleAction(enrollment.enrollmentId, 'complete')}>
                  {working === enrollment.enrollmentId && workingAction === 'complete' ? <ActivityIndicator size="small" color={colors.navy} /> : <Text style={styles.defaultButtonText}>Complete</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.lifecycleButton, styles.rejectButton, working !== null && styles.controlDisabled]} disabled={working !== null} onPress={() => lifecycleAction(enrollment.enrollmentId, 'drop')}>
                  {working === enrollment.enrollmentId && workingAction === 'drop' ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.actionText}>Drop</Text>}
                </TouchableOpacity>
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
  approvalSection: { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: spacing.md, paddingTop: spacing.md },
  controlLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 4, marginTop: spacing.sm, ...fonts.semiBold },
  groupSelector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.bg },
  groupSelectorText: { flex: 1, color: colors.textDark, fontSize: 13 },
  placeholderText: { color: colors.textMuted },
  groupSelectorArrow: { color: colors.textMuted, fontSize: 12 },
  selectorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.xl },
  selectorSheet: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '70%' },
  selectorTitle: { color: colors.navy, fontSize: 17, marginBottom: spacing.sm, ...fonts.bold },
  selectorList: { flexGrow: 0 },
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.navy },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy },
  groupIdentity: { flex: 1 },
  selectorRowTitle: { color: colors.textDark, fontSize: 14, ...fonts.medium },
  selectorRowMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  noGroupsText: { color: colors.textMuted, fontSize: 13, paddingVertical: spacing.lg, textAlign: 'center' },
  slotToggle: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.sm, backgroundColor: colors.bg, paddingHorizontal: 16, paddingVertical: 8 },
  slotToggleActive: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
  slotToggleText: { color: colors.textMuted, fontSize: 13, ...fonts.semiBold },
  slotToggleTextActive: { color: colors.successText },
  reasonInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, backgroundColor: colors.bg, padding: spacing.sm, fontSize: 13 },
  characterCount: { color: colors.textMuted, fontSize: 10, textAlign: 'right', marginTop: 3 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flex: 1, minHeight: 40, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  approveButton: { backgroundColor: colors.teal },
  rejectButton: { backgroundColor: colors.maroon },
  actionText: { color: colors.white, fontSize: 13, ...fonts.semiBold },
  controlDisabled: { opacity: 0.55 },
  activeDetails: { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: spacing.md, paddingTop: spacing.sm },
  activeDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, paddingVertical: 7 },
  activeDetailLabel: { color: colors.textMuted, fontSize: 12 },
  activeDetailValue: { color: colors.textDark, fontSize: 13, ...fonts.semiBold },
  defaultBadge: { backgroundColor: colors.borderLight, borderRadius: borderRadius.sm, paddingHorizontal: 9, paddingVertical: 3 },
  defaultBadgeActive: { backgroundColor: colors.successBg },
  defaultBadgeText: { color: colors.textMuted, fontSize: 11, ...fonts.bold },
  defaultBadgeTextActive: { color: colors.successText },
  lifecycleActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  lifecycleButton: { minHeight: 38, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  defaultButton: { backgroundColor: colors.blueBg, borderWidth: 1, borderColor: colors.blueLight },
  completeButton: { backgroundColor: colors.orangeBg, borderWidth: 1, borderColor: colors.orangeLight },
  defaultButtonText: { color: colors.navy, fontSize: 12, ...fonts.semiBold },
});
