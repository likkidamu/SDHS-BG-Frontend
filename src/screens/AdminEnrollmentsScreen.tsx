import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { TopNavbar } from '../components';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

interface Enrollment {
  id: number;
  name: string;
  volunteerId: string;
  whatsappPhone: string;
  emailId: string;
  trackType: string;
  sessionSlot: string;
  hasPastMem: boolean;
  pastChaptersCsv: string;
  status: string;
  createdAt: string;
}

export default function AdminEnrollmentsScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approveModal, setApproveModal] = useState(false);
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [groupId, setGroupId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/enrollments');
      setEnrollments(res.data.enrollments || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openApprove = (e: Enrollment) => { setSelected(e); setGroupId(''); setApproveModal(true); };

  const confirmApprove = async () => {
    if (!selected) return;
    if (!groupId.trim()) { Alert.alert('Error', 'Group ID is required'); return; }
    setSaving(true);
    try {
      await api.post(`/admin/enrollments/${selected.id}/approve`, { groupId: groupId.trim() });
      setApproveModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Approval failed');
    } finally { setSaving(false); }
  };

  const reject = (e: Enrollment) => {
    Alert.alert('Reject Enrollment', `Reject ${e.name}'s enrollment?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await api.post(`/admin/enrollments/${e.id}/reject`);
          load();
        } catch (err: any) { Alert.alert('Error', err.response?.data?.error || 'Failed'); }
      }},
    ]);
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="New Enrollments" actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : enrollments.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>No pending enrollments</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.countText}>{enrollments.length} pending</Text>
          {enrollments.map(e => (
            <View key={e.id} style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{e.name}</Text>
                  <Text style={styles.vid}>{e.volunteerId}</Text>
                </View>
                {e.trackType ? (
                  <View style={[styles.badge, { backgroundColor: e.trackType === 'MEM' ? colors.infoBg : colors.purpleBg }]}>
                    <Text style={[styles.badgeText, { color: e.trackType === 'MEM' ? colors.infoText : colors.purple }]}>{e.trackType}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.metaGrid}>
                <Text style={styles.metaItem}>📱 {e.whatsappPhone}</Text>
                {e.emailId ? <Text style={styles.metaItem}>✉️ {e.emailId}</Text> : null}
                {e.sessionSlot ? <Text style={styles.metaItem}>🕐 {e.sessionSlot}</Text> : null}
                {e.hasPastMem != null && (
                  <Text style={styles.metaItem}>Past Mem: {e.hasPastMem ? `Yes (Ch: ${e.pastChaptersCsv || '-'})` : 'No'}</Text>
                )}
              </View>
              {e.createdAt ? <Text style={styles.dateText}>Submitted: {e.createdAt.split('T')[0]}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.teal }]} onPress={() => openApprove(e)}>
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.maroon }]} onPress={() => reject(e)}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={approveModal} transparent animationType="slide" onRequestClose={() => setApproveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Approve {selected?.name}</Text>
            <Text style={styles.modalSubtitle}>Assign a Group ID to complete enrollment</Text>
            <TextInput
              style={styles.groupInput}
              placeholder="Group ID (required)"
              value={groupId}
              onChangeText={setGroupId}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.borderLight }]} onPress={() => setApproveModal(false)}>
                <Text style={{ color: colors.textDark, ...fonts.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.teal }]} onPress={confirmApprove} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', ...fonts.semiBold }}>Approve</Text>}
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
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, color: colors.textDark, ...fonts.bold },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  list: { padding: spacing.md, gap: spacing.sm },
  countText: { fontSize: 12, color: colors.textMuted, marginBottom: 4, ...fonts.medium },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 15, color: colors.textDark, ...fonts.semiBold },
  vid: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm },
  badgeText: { fontSize: 11, ...fonts.bold },
  metaGrid: { marginTop: 10, gap: 4 },
  metaItem: { fontSize: 13, color: colors.textBody },
  dateText: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.sm },
  btnText: { color: '#fff', fontSize: 13, ...fonts.semiBold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg },
  modalTitle: { fontSize: 18, color: colors.textDark, ...fonts.bold },
  modalSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 16 },
  groupInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, padding: 14, borderRadius: borderRadius.md, alignItems: 'center' },
});
