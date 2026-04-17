import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { TopNavbar } from '../components';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

interface Volunteer {
  volunteerId: string;
  name: string;
  groupId: string;
  groupName: string;
  enrollmentType: string;
  trackType: string;
  status: string;
  statusReason: string;
  slotEligible: boolean;
  email: string;
  phoneNumber: string;
}

const TRACK_TYPES = ['MEM', 'FLUENT'];

const TYPE_OPTIONS = [
  { key: 'S', label: 'Student' },
  { key: 'T', label: 'Teacher' },
  { key: 'A', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'INACTIVE', label: 'Inactive' },
  { key: 'DROPPED', label: 'Dropped' },
];

// ── Multi-select dropdown ────────────────────────────────────────────────────
interface MultiSelectProps {
  label: string;
  options: { key: string; label: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  };

  const displayLabel = selected.length === 0 || selected.length === options.length
    ? `All`
    : selected.map(k => options.find(o => o.key === k)?.label ?? k).join(', ');

  return (
    <>
      <TouchableOpacity style={styles.ddTrigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.ddTriggerText} numberOfLines={1}>{displayLabel}</Text>
        <Text style={styles.ddArrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.ddOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.ddSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.ddSheetTitle}>{label}</Text>
            {options.map(opt => {
              const checked = selected.includes(opt.key);
              return (
                <TouchableOpacity key={opt.key} style={styles.ddRow} onPress={() => toggle(opt.key)}>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.ddRowLabel}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.ddActions}>
              <TouchableOpacity style={styles.ddClear} onPress={() => onChange([])}>
                <Text style={styles.ddClearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ddDone} onPress={() => setOpen(false)}>
                <Text style={styles.ddDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminVolunteersScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [allVolunteers, setAllVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [dropModal, setDropModal] = useState(false);
  const [selected, setSelected] = useState<Volunteer | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phoneNumber: '', email: '', groupId: '', trackType: '', enrollmentType: '', slotEligible: false });
  const [dropReason, setDropReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/volunteers');
      setAllVolunteers(res.data.volunteers || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Client-side filtering
  const volunteers = allVolunteers.filter(v => {
    const q = search.trim().toLowerCase();
    if (q && !v.name?.toLowerCase().includes(q) && !v.volunteerId?.toLowerCase().includes(q)) return false;
    if (filterTypes.length > 0 && !filterTypes.includes(v.enrollmentType)) return false;
    if (filterStatuses.length > 0 && !filterStatuses.includes(v.status)) return false;
    return true;
  });

  const openEdit = (v: Volunteer) => {
    setSelected(v);
    setEditForm({ name: v.name || '', phoneNumber: v.phoneNumber || '', email: v.email || '', groupId: v.groupId || '', trackType: v.trackType || '', enrollmentType: v.enrollmentType || '', slotEligible: !!v.slotEligible });
    setEditModal(true);
  };

  const openDrop = (v: Volunteer) => { setSelected(v); setDropReason(''); setDropModal(true); };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post(`/admin/volunteers/${selected.volunteerId}/edit`, editForm);
      setEditModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const confirmDrop = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post(`/admin/volunteers/${selected.volunteerId}/drop`, { reason: dropReason });
      setDropModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Drop failed');
    } finally { setSaving(false); }
  };

  const reactivate = async (v: Volunteer) => {
    const label = v.status === 'INACTIVE' ? 'Activate' : 'Reactivate';
    Alert.alert(label, `${label} ${v.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: label, onPress: async () => {
        try {
          await api.post(`/admin/volunteers/${v.volunteerId}/reactivate`);
          load();
        } catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
      }},
    ]);
  };

  const viewAnalytics = (v: Volunteer) => {
    navigation.navigate('AdminVolunteerAnalytics', { vid: v.volunteerId });
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="Manage Volunteers" actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]} />

      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name / VID…"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <View style={styles.dropdownRow}>
          <View style={styles.dropdownWrap}>
            <Text style={styles.dropdownLabel}>ENROLLMENT TYPE</Text>
            <MultiSelect
              label="Enrollment Type"
              options={TYPE_OPTIONS}
              selected={filterTypes}
              onChange={setFilterTypes}
            />
          </View>
          <View style={styles.dropdownWrap}>
            <Text style={styles.dropdownLabel}>STATUS</Text>
            <MultiSelect
              label="Status"
              options={STATUS_OPTIONS}
              selected={filterStatuses}
              onChange={setFilterStatuses}
            />
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.countText}>{volunteers.length} of {allVolunteers.length} volunteers</Text>
          {volunteers.map(v => (
            <View key={v.volunteerId} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{v.name}</Text>
                  <Text style={styles.vid}>{v.volunteerId} • {v.enrollmentType} • {v.trackType}</Text>
                  {v.groupId ? <Text style={styles.meta}>Group: {v.groupName || v.groupId}</Text> : null}
                </View>
                <View style={[styles.badge, v.status === 'ACTIVE' ? styles.badgeActive : v.status === 'INACTIVE' ? styles.badgeInactive : styles.badgeDropped]}>
                  <Text style={[styles.badgeText, v.status === 'ACTIVE' ? styles.badgeTextActive : v.status === 'INACTIVE' ? styles.badgeTextInactive : styles.badgeTextDropped]}>{v.status}</Text>
                </View>
              </View>
              {v.statusReason ? <Text style={styles.reason}>Reason: {v.statusReason}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.navy }]} onPress={() => openEdit(v)}>
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.blue }]} onPress={() => viewAnalytics(v)}>
                  <Text style={styles.btnText}>Analytics</Text>
                </TouchableOpacity>
                {v.status === 'ACTIVE' ? (
                  <TouchableOpacity style={[styles.btn, { backgroundColor: colors.maroon }]} onPress={() => openDrop(v)}>
                    <Text style={styles.btnText}>Drop</Text>
                  </TouchableOpacity>
                ) : v.status === 'INACTIVE' ? (
                  <TouchableOpacity style={[styles.btn, { backgroundColor: colors.teal }]} onPress={() => reactivate(v)}>
                    <Text style={styles.btnText}>Activate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.btn, { backgroundColor: colors.teal }]} onPress={() => reactivate(v)}>
                    <Text style={styles.btnText}>Reactivate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit {selected?.volunteerId}</Text>
            <ScrollView>
              {[['Name', 'name'], ['Phone', 'phoneNumber'], ['Email', 'email'], ['Group ID', 'groupId']].map(([label, key]) => (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput style={styles.fieldInput} value={(editForm as any)[key]} onChangeText={v => setEditForm(f => ({ ...f, [key]: v }))} />
                </View>
              ))}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Track Type</Text>
                <View style={styles.segRow}>
                  {TRACK_TYPES.map(t => (
                    <TouchableOpacity key={t} style={[styles.seg, editForm.trackType === t && styles.segActive]} onPress={() => setEditForm(f => ({ ...f, trackType: t }))}>
                      <Text style={[styles.segText, editForm.trackType === t && styles.segTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Slot Eligible</Text>
                <TouchableOpacity style={[styles.toggle, editForm.slotEligible && styles.toggleOn]} onPress={() => setEditForm(f => ({ ...f, slotEligible: !f.slotEligible }))}>
                  <Text style={styles.toggleText}>{editForm.slotEligible ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.borderLight }]} onPress={() => setEditModal(false)}>
                <Text style={{ color: colors.textDark, ...fonts.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.navy }]} onPress={saveEdit} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', ...fonts.semiBold }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Drop Modal */}
      <Modal visible={dropModal} transparent animationType="slide" onRequestClose={() => setDropModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Drop {selected?.name}?</Text>
            <TextInput style={[styles.fieldInput, { marginTop: 12 }]} placeholder="Reason (optional)" value={dropReason} onChangeText={setDropReason} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.borderLight }]} onPress={() => setDropModal(false)}>
                <Text style={{ color: colors.textDark, ...fonts.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.maroon }]} onPress={confirmDrop} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', ...fonts.semiBold }}>Drop</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { color: colors.errorText, fontSize: 14, textAlign: 'center' },
  retryText: { color: colors.navy, marginTop: 12, ...fonts.semiBold },

  // Filter bar
  filterRow: { backgroundColor: colors.white, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 10 },
  searchInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, backgroundColor: colors.bg },
  dropdownRow: { flexDirection: 'row', gap: 10 },
  dropdownWrap: { flex: 1, gap: 4 },
  dropdownLabel: { fontSize: 10, color: colors.textMuted, ...fonts.semiBold, letterSpacing: 0.8 },

  // Dropdown trigger
  ddTrigger: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.bg },
  ddTriggerText: { flex: 1, fontSize: 13, color: colors.textDark, ...fonts.medium },
  ddArrow: { fontSize: 12, color: colors.textMuted, marginLeft: 4 },

  // Dropdown sheet
  ddOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 40 },
  ddSheet: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg },
  ddSheetTitle: { fontSize: 15, color: colors.textDark, ...fonts.bold, marginBottom: 12 },
  ddRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.navy, borderColor: colors.navy },
  checkmark: { color: '#fff', fontSize: 12, ...fonts.bold },
  ddRowLabel: { fontSize: 14, color: colors.textDark },
  ddActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  ddClear: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center' },
  ddClearText: { fontSize: 13, color: colors.textMuted, ...fonts.semiBold },
  ddDone: { flex: 2, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: colors.navy, alignItems: 'center' },
  ddDoneText: { fontSize: 13, color: '#fff', ...fonts.semiBold },

  // List
  list: { padding: spacing.md, gap: spacing.sm },
  countText: { fontSize: 12, color: colors.textMuted, marginBottom: 4, ...fonts.medium },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 15, color: colors.textDark, ...fonts.semiBold },
  vid: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textBody, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm },
  badgeText: { fontSize: 11, ...fonts.bold },
  badgeActive: { backgroundColor: colors.successBg },
  badgeInactive: { backgroundColor: '#e5e7eb' },
  badgeDropped: { backgroundColor: colors.errorBg },
  badgeTextActive: { color: colors.successText },
  badgeTextInactive: { color: '#6b7280' },
  badgeTextDropped: { color: colors.errorText },
  reason: { fontSize: 12, color: colors.warningText, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm },
  btnText: { color: '#fff', fontSize: 12, ...fonts.semiBold },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '90%' },
  modalTitle: { fontSize: 18, color: colors.textDark, ...fonts.bold, marginBottom: 12 },
  fieldRow: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4, ...fonts.medium },
  fieldInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14 },
  segRow: { flexDirection: 'row', gap: 8 },
  seg: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.borderLight },
  segActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  segText: { fontSize: 13, color: colors.textBody },
  segTextActive: { color: '#fff', ...fonts.semiBold },
  toggle: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, alignSelf: 'flex-start' },
  toggleOn: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
  toggleText: { fontSize: 13, ...fonts.semiBold, color: colors.textDark },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, padding: 14, borderRadius: borderRadius.md, alignItems: 'center' },
});
