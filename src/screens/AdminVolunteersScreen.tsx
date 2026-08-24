import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertBox, StatCard, TopNavbar } from '../components';
import { useAuth } from '../context/AuthContext';
import type {
  AdminVolunteer, AdminVolunteerListResponse, AdminVolunteerQuery, EditAdminVolunteerRequest,
} from '../features/admin/volunteers/models';
import {
  dropAdminVolunteer, editAdminVolunteer, getAdminVolunteers, reactivateAdminVolunteer,
} from '../features/admin/volunteers/service';
import { borderRadius, colors, fonts, shadows, spacing } from '../theme';

type Props = { navigation: NativeStackNavigationProp<any> };
type VolunteerAction = 'edit' | 'drop' | 'reactivate';
type Notice = { type: 'success' | 'error'; message: string };

const TYPE_OPTIONS = [{ key: 'S', label: 'Student' }, { key: 'T', label: 'Teacher' }, { key: 'A', label: 'Admin' }];
const STATUS_OPTIONS = [{ key: 'ACTIVE', label: 'Active' }, { key: 'INACTIVE', label: 'Inactive' }, { key: 'DROPPED', label: 'Dropped' }];
const TRACK_OPTIONS = [{ key: 'MEM', label: 'MEM' }, { key: 'FLUENT', label: 'FLUENT' }];

function apiError(error: any, fallback: string): string {
  return error.response?.data?.error ?? error.response?.data?.message ?? fallback;
}

function validationErrors(edit: EditAdminVolunteerRequest) {
  const errors: { name?: string; email?: string; phoneNumber?: string } = {};
  if (!edit.name?.trim()) errors.name = 'Name is required.';
  const email = edit.email?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  const phone = edit.phoneNumber?.trim();
  if (phone && !/^[0-9+().\-\s]{7,25}$/.test(phone)) errors.phoneNumber = 'Enter a valid phone number.';
  return errors;
}

function SingleSelect({ label, options, selected, onChange }: {
  label: string;
  options: { key: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const displayLabel = options.find((option) => option.key === selected)?.label ?? 'All';
  return <>
    <TouchableOpacity style={styles.selectTrigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
      <Text style={styles.selectTriggerText} numberOfLines={1}>{displayLabel}</Text><Text style={styles.selectArrow}>▾</Text>
    </TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <TouchableOpacity style={styles.selectOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
        <View style={styles.selectSheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.selectTitle}>{label}</Text>
          {[{ key: '', label: 'All' }, ...options].map((option) => (
            <TouchableOpacity key={option.key} style={styles.selectRow} onPress={() => { onChange(option.key); setOpen(false); }}>
              <View style={[styles.radio, selected === option.key && styles.radioSelected]}>{selected === option.key ? <View style={styles.radioDot} /> : null}</View>
              <Text style={styles.selectRowLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  </>;
}

function FormField({ label, value, error, onChangeText, keyboardType }: {
  label: string; value: string; error?: string; onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput style={[styles.fieldInput, error ? styles.fieldInputError : null]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} />
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>;
}

export default function AdminVolunteersScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState<AdminVolunteerQuery>({});
  const [applied, setApplied] = useState<AdminVolunteerQuery>({});
  const [data, setData] = useState<AdminVolunteerListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selected, setSelected] = useState<AdminVolunteer | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [confirmation, setConfirmation] = useState<'drop' | 'reactivate' | null>(null);
  const [edit, setEdit] = useState<EditAdminVolunteerRequest>({});
  const [dropReason, setDropReason] = useState('');
  const [modalError, setModalError] = useState('');
  const [processingAction, setProcessingAction] = useState<VolunteerAction | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setData(await getAdminVolunteers(applied));
    } catch (requestError: any) {
      setError(apiError(requestError, 'Failed to load volunteers.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applied]);

  useEffect(() => { void load(); }, [load]);

  const volunteers = data?.volunteers ?? [];
  const summary = useMemo(() => ({
    total: volunteers.length,
    students: volunteers.filter((volunteer) => volunteer.enrollmentType?.toUpperCase() === 'S').length,
    teachers: volunteers.filter((volunteer) => volunteer.enrollmentType?.toUpperCase() === 'T').length,
    admins: volunteers.filter((volunteer) => volunteer.enrollmentType?.toUpperCase() === 'A').length,
    active: volunteers.filter((volunteer) => volunteer.status.toUpperCase() === 'ACTIVE').length,
    inactive: volunteers.filter((volunteer) => volunteer.status.toUpperCase() === 'INACTIVE').length,
    dropped: volunteers.filter((volunteer) => volunteer.status.toUpperCase() === 'DROPPED').length,
  }), [volunteers]);
  const editErrors = useMemo(() => validationErrors(edit), [edit]);
  const currentAdministrator = Boolean(selected && selected.volunteerId.toLowerCase() === user?.volunteerId?.toLowerCase());

  const choose = (volunteer: AdminVolunteer) => {
    setSelected(volunteer);
    setModalError('');
    setDropReason('');
    setEdit({
      name: volunteer.name, phoneNumber: volunteer.phoneNumber ?? '', email: volunteer.email ?? '',
      groupId: volunteer.groupId ?? '', trackType: volunteer.trackType ?? '',
      enrollmentType: volunteer.enrollmentType ?? '', slotEligible: volunteer.slotEligible ?? false,
    });
    setEditModal(true);
  };

  const closeModals = () => {
    if (processingAction) return;
    setEditModal(false);
    setConfirmation(null);
    setSelected(null);
    setModalError('');
  };

  const act = async (action: VolunteerAction) => {
    if (!selected || processingAction) return;
    if (action === 'edit' && Object.keys(editErrors).length > 0) return;
    if (action !== 'edit' && currentAdministrator) {
      setModalError('You cannot perform this action on your own administrator account.');
      return;
    }
    setProcessingAction(action);
    setNotice(null);
    setModalError('');
    try {
      if (action === 'edit') await editAdminVolunteer(selected.volunteerId, edit);
      else if (action === 'drop') await dropAdminVolunteer(selected.volunteerId, { reason: dropReason });
      else await reactivateAdminVolunteer(selected.volunteerId);
      setNotice({ type: 'success', message: action === 'edit' ? 'Volunteer updated successfully.' : action === 'drop' ? 'Volunteer dropped successfully.' : 'Volunteer reactivated successfully.' });
      setEditModal(false);
      setConfirmation(null);
      setSelected(null);
      await load();
    } catch (requestError: any) {
      setModalError(apiError(requestError, action === 'edit' ? 'Unable to update volunteer.' : action === 'drop' ? 'Unable to drop volunteer.' : 'Unable to reactivate volunteer.'));
    } finally {
      setProcessingAction(null);
    }
  };

  const reset = () => { setQuery({}); setApplied({}); };

  return <View style={styles.page}>
    <TopNavbar title="Manage Volunteers" actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={[colors.primary]} tintColor={colors.primary} />}>
      {notice ? <AlertBox type={notice.type} message={notice.message} /> : null}
      {!loading && data ? <>
        <Text style={styles.sectionTitle}>Volunteer Summary</Text>
        <Text style={styles.sectionSubtitle}>A current view of the loaded volunteer population.</Text>
        <View style={styles.statGrid}>
          <StatCard value={summary.total} label="Total Volunteers" iconLabel="👥" iconBg={colors.blueBg} iconColor={colors.blue} />
          <StatCard value={summary.students} label="Students" iconLabel="S" iconBg={colors.greenBg} iconColor={colors.green} />
          <StatCard value={summary.teachers} label="Teachers" iconLabel="T" iconBg={colors.orangeBg} iconColor={colors.primary} />
          <StatCard value={summary.admins} label="Admins" iconLabel="A" iconBg={colors.purpleBg} iconColor={colors.purple} />
          <StatCard value={summary.active} label="Active" iconLabel="✓" iconBg={colors.greenBg} iconColor={colors.green} />
          <StatCard value={summary.inactive} label="Inactive" iconLabel="—" iconBg={colors.borderLight} iconColor={colors.textMuted} />
          <StatCard value={summary.dropped} label="Dropped" iconLabel="×" iconBg={colors.errorBg} iconColor={colors.errorText} />
        </View>
      </> : null}

      <View style={styles.filterCard}>
        <Text style={styles.cardTitle}>Search & Filters</Text>
        <TextInput style={styles.searchInput} placeholder="Name or Volunteer ID" value={query.q ?? ''} onChangeText={(q) => setQuery((current) => ({ ...current, q }))} returnKeyType="search" onSubmitEditing={() => setApplied(query)} />
        <View style={styles.filterGrid}>
          <View style={styles.filterCell}><Text style={styles.filterLabel}>STATUS</Text><SingleSelect label="Status" options={STATUS_OPTIONS} selected={query.status ?? ''} onChange={(status) => setQuery((current) => ({ ...current, status }))} /></View>
          <View style={styles.filterCell}><Text style={styles.filterLabel}>TYPE</Text><SingleSelect label="Type" options={TYPE_OPTIONS} selected={query.enrollmentType ?? ''} onChange={(enrollmentType) => setQuery((current) => ({ ...current, enrollmentType }))} /></View>
          <View style={styles.filterCell}><Text style={styles.filterLabel}>TRACK</Text><SingleSelect label="Track" options={TRACK_OPTIONS} selected={query.trackType ?? ''} onChange={(trackType) => setQuery((current) => ({ ...current, trackType }))} /></View>
          <View style={styles.filterCell}><Text style={styles.filterLabel}>GROUP</Text><TextInput style={styles.groupInput} value={query.groupId ?? ''} onChangeText={(groupId) => setQuery((current) => ({ ...current, groupId }))} /></View>
        </View>
        <View style={styles.filterActions}><TouchableOpacity style={[styles.actionButton, styles.searchButton]} onPress={() => setApplied({ ...query })}><Text style={styles.actionButtonText}>Search</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={reset}><Text style={styles.resetButtonText}>Reset</Text></TouchableOpacity></View>
      </View>

      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      {!loading && error ? <View style={styles.errorState}><AlertBox type="error" message={error} /><TouchableOpacity style={styles.retryButton} onPress={() => void load()}><Text style={styles.actionButtonText}>Retry</Text></TouchableOpacity></View> : null}
      {!loading && data ? <>
        <Text style={styles.countText}>{data.total} Volunteers</Text>
        {volunteers.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>No volunteers match the selected filters.</Text></View> : volunteers.map((volunteer) => (
          <View key={volunteer.volunteerId} style={styles.volunteerCard}>
            <View style={styles.cardHeader}><View style={styles.identity}><Text style={styles.name}>{volunteer.name}</Text><Text style={styles.vid}>{volunteer.volunteerId}</Text><Text style={styles.meta}>{volunteer.enrollmentType ?? '-'} • {volunteer.trackType ?? '-'}</Text>{volunteer.groupId ? <Text style={styles.meta}>Group: {volunteer.groupName ?? volunteer.groupId}</Text> : null}</View><View style={[styles.badge, volunteer.status === 'ACTIVE' ? styles.activeBadge : volunteer.status === 'INACTIVE' ? styles.inactiveBadge : styles.droppedBadge]}><Text style={[styles.badgeText, volunteer.status === 'ACTIVE' ? styles.activeText : volunteer.status === 'INACTIVE' ? styles.inactiveText : styles.droppedText]}>{volunteer.status}</Text></View></View>
            {volunteer.phoneNumber || volunteer.email ? <View style={styles.contact}>{volunteer.phoneNumber ? <Text style={styles.contactText}>📞 {volunteer.phoneNumber}</Text> : null}{volunteer.email ? <Text style={styles.contactText}>✉ {volunteer.email}</Text> : null}</View> : null}
            {volunteer.statusReason ? <Text style={styles.reason}>Reason: {volunteer.statusReason}</Text> : null}
            <View style={styles.rowActions}><TouchableOpacity style={[styles.smallButton, styles.manageButton]} onPress={() => choose(volunteer)}><Text style={styles.smallButtonText}>Manage</Text></TouchableOpacity><TouchableOpacity style={[styles.smallButton, styles.analyticsButton]} onPress={() => navigation.navigate('AdminVolunteerAnalytics', { vid: volunteer.volunteerId })}><Text style={styles.smallButtonText}>Analytics</Text></TouchableOpacity></View>
          </View>
        ))}
      </> : null}
    </ScrollView>

    <Modal visible={editModal} transparent animationType="slide" onRequestClose={closeModals}>
      <View style={styles.modalOverlay}><View style={styles.modalBox}><ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.modalTitle}>Manage Volunteer</Text><Text style={styles.modalName}>{selected?.name}</Text><Text style={styles.modalMeta}>{selected?.volunteerId} • {selected?.status}</Text>
        {modalError ? <AlertBox type="error" message={modalError} /> : null}
        <FormField label="Name" value={edit.name ?? ''} error={editErrors.name} onChangeText={(name) => setEdit((current) => ({ ...current, name }))} />
        <FormField label="Phone" value={edit.phoneNumber ?? ''} error={editErrors.phoneNumber} keyboardType="phone-pad" onChangeText={(phoneNumber) => setEdit((current) => ({ ...current, phoneNumber }))} />
        <FormField label="Email" value={edit.email ?? ''} error={editErrors.email} keyboardType="email-address" onChangeText={(email) => setEdit((current) => ({ ...current, email }))} />
        <FormField label="Group" value={edit.groupId ?? ''} onChangeText={(groupId) => setEdit((current) => ({ ...current, groupId }))} />
        <Text style={styles.fieldLabel}>Enrollment Type</Text><View style={styles.segmentRow}>{TYPE_OPTIONS.map((option) => <TouchableOpacity key={option.key} style={[styles.segment, edit.enrollmentType === option.key && styles.segmentActive]} onPress={() => setEdit((current) => ({ ...current, enrollmentType: option.key }))}><Text style={[styles.segmentText, edit.enrollmentType === option.key && styles.segmentTextActive]}>{option.label}</Text></TouchableOpacity>)}</View>
        <Text style={styles.fieldLabel}>Track Type</Text><View style={styles.segmentRow}>{[{ key: '', label: 'None' }, ...TRACK_OPTIONS].map((option) => <TouchableOpacity key={option.key} style={[styles.segment, edit.trackType === option.key && styles.segmentActive]} onPress={() => setEdit((current) => ({ ...current, trackType: option.key }))}><Text style={[styles.segmentText, edit.trackType === option.key && styles.segmentTextActive]}>{option.label}</Text></TouchableOpacity>)}</View>
        <Text style={styles.fieldLabel}>Slot Eligible</Text><TouchableOpacity style={[styles.toggle, edit.slotEligible && styles.toggleOn]} onPress={() => setEdit((current) => ({ ...current, slotEligible: !current.slotEligible }))}><Text style={styles.toggleText}>{edit.slotEligible ? 'Yes' : 'No'}</Text></TouchableOpacity>
        <View style={styles.dangerZone}><Text style={styles.dangerTitle}>Actions</Text>{currentAdministrator ? <AlertBox type="info" message="You cannot perform this action on your own administrator account." /> : null}{selected?.status === 'ACTIVE' ? <><FormField label="Drop reason" value={dropReason} onChangeText={setDropReason} /><TouchableOpacity style={[styles.actionButton, styles.dropButton]} disabled={Boolean(processingAction) || currentAdministrator} onPress={() => { setModalError(''); setEditModal(false); setConfirmation('drop'); }}><Text style={styles.actionButtonText}>Drop Volunteer</Text></TouchableOpacity></> : <TouchableOpacity style={[styles.actionButton, styles.searchButton]} disabled={Boolean(processingAction) || currentAdministrator} onPress={() => { setModalError(''); setEditModal(false); setConfirmation('reactivate'); }}><Text style={styles.actionButtonText}>Reactivate Volunteer</Text></TouchableOpacity>}</View>
        <View style={styles.modalActions}><TouchableOpacity style={[styles.modalButton, styles.resetButton]} onPress={closeModals} disabled={Boolean(processingAction)}><Text style={styles.resetButtonText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={() => void act('edit')} disabled={Boolean(processingAction) || Object.keys(editErrors).length > 0}>{processingAction === 'edit' ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.actionButtonText}>Save Changes</Text>}</TouchableOpacity></View>
      </ScrollView></View></View>
    </Modal>

    <Modal visible={confirmation !== null} transparent animationType="fade" onRequestClose={() => { if (!processingAction) { setConfirmation(null); setEditModal(true); } }}>
      <View style={styles.confirmOverlay}><View style={styles.confirmBox}><Text style={styles.modalTitle}>{confirmation === 'drop' ? 'Drop Volunteer?' : 'Reactivate Volunteer?'}</Text>{modalError ? <AlertBox type="error" message={modalError} /> : null}<Text style={styles.confirmText}>{confirmation === 'drop' ? 'The volunteer will immediately lose access to the system. This action can be reversed later by Reactivate.' : 'The volunteer will regain access to the system.'}</Text><View style={styles.modalActions}><TouchableOpacity style={[styles.modalButton, styles.resetButton]} disabled={Boolean(processingAction)} onPress={() => { setConfirmation(null); setEditModal(true); }}><Text style={styles.resetButtonText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.modalButton, confirmation === 'drop' ? styles.dropButton : styles.saveButton]} disabled={Boolean(processingAction)} onPress={() => void act(confirmation ?? 'reactivate')}>{processingAction ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.actionButtonText}>{confirmation === 'drop' ? 'Drop' : 'Reactivate'}</Text>}</TouchableOpacity></View></View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg }, content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  sectionTitle: { color: colors.navy, fontSize: 20, ...fonts.extraBold }, sectionSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: -spacing.sm }, statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card, gap: spacing.sm }, cardTitle: { color: colors.navy, fontSize: 16, ...fonts.bold }, searchInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, backgroundColor: colors.bg }, filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, filterCell: { width: '48%', flexGrow: 1, gap: 4 }, filterLabel: { fontSize: 10, color: colors.textMuted, ...fonts.semiBold, letterSpacing: 0.8 }, groupInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.bg, fontSize: 13 }, filterActions: { flexDirection: 'row', gap: spacing.sm }, actionButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center' }, searchButton: { backgroundColor: colors.navy }, resetButton: { backgroundColor: colors.borderLight }, dropButton: { backgroundColor: colors.maroon }, actionButtonText: { color: colors.white, ...fonts.semiBold }, resetButtonText: { color: colors.textDark, ...fonts.semiBold },
  selectTrigger: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.bg }, selectTriggerText: { flex: 1, fontSize: 13, color: colors.textDark, ...fonts.medium }, selectArrow: { fontSize: 12, color: colors.textMuted }, selectOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 40 }, selectSheet: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg }, selectTitle: { fontSize: 15, color: colors.textDark, ...fonts.bold, marginBottom: 12 }, selectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' }, radioSelected: { borderColor: colors.navy }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy }, selectRowLabel: { fontSize: 14, color: colors.textDark },
  errorState: { alignItems: 'center' }, retryButton: { backgroundColor: colors.navy, borderRadius: borderRadius.md, paddingHorizontal: 20, paddingVertical: 10 }, countText: { fontSize: 12, color: colors.textMuted, ...fonts.medium }, emptyCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.xl, ...shadows.card }, emptyText: { color: colors.textMuted, textAlign: 'center' },
  volunteerCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card }, cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, identity: { flex: 1 }, name: { fontSize: 15, color: colors.textDark, ...fonts.semiBold }, vid: { fontSize: 12, color: colors.textMuted, marginTop: 2 }, meta: { fontSize: 12, color: colors.textBody, marginTop: 2 }, badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm }, badgeText: { fontSize: 11, ...fonts.bold }, activeBadge: { backgroundColor: colors.successBg }, inactiveBadge: { backgroundColor: '#e5e7eb' }, droppedBadge: { backgroundColor: colors.errorBg }, activeText: { color: colors.successText }, inactiveText: { color: '#6b7280' }, droppedText: { color: colors.errorText }, contact: { marginTop: spacing.sm, gap: 2 }, contactText: { fontSize: 12, color: colors.textBody }, reason: { fontSize: 12, color: colors.warningText, marginTop: 6 }, rowActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 10 }, smallButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm }, manageButton: { backgroundColor: colors.navy }, analyticsButton: { backgroundColor: colors.blue }, smallButtonText: { color: colors.white, fontSize: 12, ...fonts.semiBold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, modalBox: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '92%' }, modalTitle: { fontSize: 18, color: colors.textDark, ...fonts.bold }, modalName: { fontSize: 16, color: colors.navy, ...fonts.semiBold, marginTop: 4 }, modalMeta: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md }, fieldRow: { marginBottom: 12 }, fieldLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4, marginTop: 4, ...fonts.medium }, fieldInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14 }, fieldInputError: { borderColor: colors.errorText }, fieldError: { color: colors.errorText, fontSize: 11, marginTop: 3 }, segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: 12 }, segment: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.borderLight }, segmentActive: { backgroundColor: colors.navy, borderColor: colors.navy }, segmentText: { fontSize: 12, color: colors.textBody }, segmentTextActive: { color: colors.white, ...fonts.semiBold }, toggle: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: borderRadius.sm, backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, alignSelf: 'flex-start' }, toggleOn: { backgroundColor: colors.successBg, borderColor: colors.successBorder }, toggleText: { color: colors.textDark, ...fonts.semiBold }, dangerZone: { borderTopWidth: 1, borderTopColor: colors.errorBorder, marginTop: spacing.lg, paddingTop: spacing.md }, dangerTitle: { color: colors.maroon, fontSize: 15, ...fonts.bold, marginBottom: spacing.sm }, modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }, modalButton: { flex: 1, padding: 14, borderRadius: borderRadius.md, alignItems: 'center' }, saveButton: { backgroundColor: colors.navy }, confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }, confirmBox: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg }, confirmText: { color: colors.textBody, fontSize: 14, lineHeight: 20, marginTop: spacing.md },
});
