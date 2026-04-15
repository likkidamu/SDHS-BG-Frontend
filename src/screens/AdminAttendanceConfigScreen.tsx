import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { TopNavbar } from '../components';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

interface GroupConfig { groupId: string; startDate: string; endDate: string; status: string; }

const STATUS_OPTS = ['ACTIVE', 'COMPLETED'];

export default function AdminAttendanceConfigScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [groups, setGroups] = useState<GroupConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newGroup, setNewGroup] = useState({ groupId: '', startDate: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await api.get('/admin/attendance-config');
      setGroups(res.data.groups || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateGroup = (idx: number, field: keyof GroupConfig, val: string) => {
    setGroups(gs => gs.map((g, i) => i === idx ? { ...g, [field]: val } : g));
  };

  const save = async () => {
    const toSave = [...groups];
    if (newGroup.groupId.trim() && newGroup.startDate.trim()) {
      toSave.push({ groupId: newGroup.groupId.trim(), startDate: newGroup.startDate.trim(), endDate: '', status: 'ACTIVE' });
    }
    if (toSave.length === 0) { Alert.alert('Nothing to save'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post('/admin/attendance-config/save', { groups: toSave });
      setSuccess('Saved successfully.');
      setNewGroup({ groupId: '', startDate: '' });
      load();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="Attendance Config" actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]} />

      {success ? <View style={styles.successBanner}><Text style={styles.successText}>{success}</Text></View> : null}
      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>Each group needs a Start Date. End Date is set when the group completes.</Text>
          </View>

          {groups.map((g, idx) => (
            <View key={g.groupId} style={styles.card}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupId}>{g.groupId}</Text>
                <View style={[styles.badge, { backgroundColor: g.status === 'ACTIVE' ? colors.successBg : colors.bg }]}>
                  <Text style={[styles.badgeText, { color: g.status === 'ACTIVE' ? colors.successText : colors.textMuted }]}>{g.status}</Text>
                </View>
              </View>

              <View style={styles.datesRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Start Date</Text>
                  <TextInput style={styles.dateInput} value={g.startDate || ''} onChangeText={v => updateGroup(idx, 'startDate', v)} placeholder="YYYY-MM-DD" />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>End Date</Text>
                  <TextInput style={styles.dateInput} value={g.endDate || ''} onChangeText={v => updateGroup(idx, 'endDate', v)} placeholder="YYYY-MM-DD (optional)" />
                </View>
              </View>

              <View style={styles.statusRow}>
                {STATUS_OPTS.map(s => (
                  <TouchableOpacity key={s} style={[styles.statusChip, g.status === s && styles.statusChipActive]} onPress={() => updateGroup(idx, 'status', s)}>
                    <Text style={[styles.statusChipText, g.status === s && styles.statusChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Add new group */}
          <View style={styles.newCard}>
            <Text style={styles.newTitle}>Add New Group</Text>
            <View style={styles.datesRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Group ID</Text>
                <TextInput style={styles.dateInput} value={newGroup.groupId} onChangeText={v => setNewGroup(n => ({ ...n, groupId: v }))} placeholder="e.g. GRP-A" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>Start Date</Text>
                <TextInput style={styles.dateInput} value={newGroup.startDate} onChangeText={v => setNewGroup(n => ({ ...n, startDate: v }))} placeholder="YYYY-MM-DD" />
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successBanner: { backgroundColor: colors.successBg, padding: spacing.sm, paddingHorizontal: spacing.md },
  successText: { color: colors.successText, fontSize: 13 },
  errorBanner: { backgroundColor: colors.errorBg, padding: spacing.sm, paddingHorizontal: spacing.md },
  errorText: { color: colors.errorText, fontSize: 13 },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  infoBanner: { backgroundColor: colors.infoBg, borderRadius: borderRadius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.infoBorder },
  infoText: { fontSize: 13, color: colors.infoText },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card, gap: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupId: { fontSize: 16, color: colors.textDark, ...fonts.bold },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm },
  badgeText: { fontSize: 11, ...fonts.bold },
  datesRow: { flexDirection: 'row' },
  fieldLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4, ...fonts.medium },
  dateInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.sm, padding: 8, fontSize: 13 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  statusChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  statusChipText: { fontSize: 13, color: colors.textBody },
  statusChipTextActive: { color: '#fff', ...fonts.semiBold },
  newCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.primaryLight, ...shadows.card },
  newTitle: { fontSize: 14, color: colors.primary, ...fonts.bold, marginBottom: 10 },
  saveBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, ...fonts.bold },
});
