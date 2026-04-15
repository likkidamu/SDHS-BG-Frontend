import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { TopNavbar } from '../components';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

interface SlotOption { id: number; name: string; }
interface TeacherRow { volunteerId: string; name: string; selectedSlotIds: number[]; }

function nextSunday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d.toISOString().split('T')[0];
}

export default function AdminTeacherAvailabilityScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [date, setDate] = useState(nextSunday());
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true); setError(''); setSuccess('');
      const res = await api.get('/admin/teacher-availability', { params: { date } });
      setSlots(res.data.slots || []);
      setTeachers(res.data.teachers || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const toggleSlot = (vid: string, slotId: number) => {
    setTeachers(ts => ts.map(t => {
      if (t.volunteerId !== vid) return t;
      const has = t.selectedSlotIds.includes(slotId);
      return { ...t, selectedSlotIds: has ? t.selectedSlotIds.filter(id => id !== slotId) : [...t.selectedSlotIds, slotId] };
    }));
  };

  const save = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const entries = teachers.map(t => ({ volunteerId: t.volunteerId, slotIds: t.selectedSlotIds }));
      await api.post('/admin/teacher-availability/save', { date, entries });
      setSuccess('Availability saved for ' + date);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="Teacher Availability" actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]} />

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Date</Text>
        <TextInput style={styles.dateInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" onSubmitEditing={load} returnKeyType="done" />
        <TouchableOpacity style={styles.loadBtn} onPress={load}>
          <Text style={styles.loadBtnText}>Load</Text>
        </TouchableOpacity>
      </View>

      {success ? <View style={styles.successBanner}><Text style={styles.successText}>{success}</Text></View> : null}
      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {teachers.length === 0 && <Text style={styles.emptyText}>No teachers found.</Text>}
          {teachers.map(t => (
            <View key={t.volunteerId} style={styles.card}>
              <Text style={styles.teacherName}>{t.name}</Text>
              <Text style={styles.teacherVid}>{t.volunteerId}</Text>
              <View style={styles.slotsGrid}>
                {slots.map(s => {
                  const active = t.selectedSlotIds.includes(s.id);
                  return (
                    <TouchableOpacity key={s.id} style={[styles.slotChip, active && styles.slotChipActive]} onPress={() => toggleSlot(t.volunteerId, s.id)}>
                      <Text style={[styles.slotText, active && styles.slotTextActive]}>{s.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {teachers.length > 0 && (
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Availability</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dateLabel: { fontSize: 13, color: colors.textMuted, ...fonts.medium },
  dateInput: { flex: 1, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14 },
  loadBtn: { backgroundColor: colors.navy, paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.md },
  loadBtnText: { color: '#fff', ...fonts.semiBold },
  successBanner: { backgroundColor: colors.successBg, padding: spacing.sm, paddingHorizontal: spacing.md },
  successText: { color: colors.successText, fontSize: 13 },
  errorBanner: { backgroundColor: colors.errorBg, padding: spacing.sm, paddingHorizontal: spacing.md },
  errorText: { color: colors.errorText, fontSize: 13 },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card },
  teacherName: { fontSize: 15, color: colors.textDark, ...fonts.semiBold },
  teacherVid: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  slotChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  slotText: { fontSize: 13, color: colors.textBody, ...fonts.medium },
  slotTextActive: { color: '#fff', ...fonts.semiBold },
  saveBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, ...fonts.bold },
});
