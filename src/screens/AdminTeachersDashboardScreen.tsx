import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { TopNavbar } from '../components';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

interface Booking {
  id: number;
  volunteerId: string;
  studentName: string;
  slotName: string;
  chapterId: number;
  chapterNumber: number;
  chapterName: string;
  slokaCount: number;
  memorizationGrade: string;
  pronunciationGrade: string;
  teacherComment: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
}

interface Teacher { volunteerId: string; name: string; }

const GRADES = ['A+', 'A', 'B', 'C', 'Retest', 'Not Answered'];

function nextSunday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d.toISOString().split('T')[0];
}

export default function AdminTeachersDashboardScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [date, setDate] = useState(nextSunday());
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({ memorizationGrade: '', pronunciationGrade: '', comment: '', assignedTeacherId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const params: any = { date };
      if (selectedTeacherId) params.teacherId = selectedTeacherId;
      const res = await api.get('/admin/teachers-dashboard', { params });
      setBookings(res.data.bookings || []);
      setTeachers(res.data.teachers || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally { setLoading(false); }
  }, [date, selectedTeacherId]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (b: Booking) => {
    setSelected(b);
    setEditForm({ memorizationGrade: b.memorizationGrade || '', pronunciationGrade: b.pronunciationGrade || '', comment: b.teacherComment || '', assignedTeacherId: b.assignedTeacherId || '' });
    setEditModal(true);
  };

  const saveRow = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post('/admin/teachers-dashboard/save-one', { bookingId: selected.id, ...editForm });
      setEditModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const deleteRow = (b: Booking) => {
    Alert.alert('Delete Booking', `Delete booking for ${b.studentName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.post('/admin/teachers-dashboard/delete', { bookingId: b.id });
          load();
        } catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
      }},
    ]);
  };

  const gradeColor = (g: string) => {
    if (!g) return colors.textMuted;
    const u = g.trim().toUpperCase();
    if (u === 'A+') return colors.gradeAPlus;
    if (u === 'A') return colors.gradeA;
    if (u === 'B') return colors.gradeB;
    if (u === 'C') return colors.gradeC;
    if (u === 'RETEST') return colors.gradeRetest;
    return colors.textMuted;
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="Teachers Dashboard" actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]} />

      <View style={styles.filterBar}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Date</Text>
          <TextInput style={styles.dateInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" returnKeyType="done" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teacherScroll}>
          {[{ volunteerId: '', name: 'All Teachers' }, ...teachers].map(t => (
            <TouchableOpacity key={t.volunteerId} style={[styles.teacherChip, selectedTeacherId === t.volunteerId && styles.teacherChipActive]} onPress={() => setSelectedTeacherId(t.volunteerId)}>
              <Text style={[styles.teacherChipText, selectedTeacherId === t.volunteerId && styles.teacherChipTextActive]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.loadBtn} onPress={load}>
          <Text style={styles.loadBtnText}>Load</Text>
        </TouchableOpacity>
      </View>

      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.countText}>{bookings.length} bookings for {date}</Text>
          {bookings.length === 0 && <Text style={styles.emptyText}>No bookings found for this date/teacher.</Text>}
          {bookings.map(b => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{b.studentName}</Text>
                  <Text style={styles.vid}>{b.volunteerId} • {b.slotName}</Text>
                  <Text style={styles.chapter}>Ch {b.chapterNumber}: {b.chapterName} — {b.slokaCount} slokas</Text>
                </View>
                <View style={styles.gradeCol}>
                  <Text style={[styles.grade, { color: gradeColor(b.memorizationGrade) }]}>{b.memorizationGrade || '—'}</Text>
                  <Text style={[styles.grade, { color: gradeColor(b.pronunciationGrade) }]}>{b.pronunciationGrade || '—'}</Text>
                </View>
              </View>
              {b.assignedTeacherName ? <Text style={styles.teacher}>Teacher: {b.assignedTeacherName}</Text> : null}
              {b.teacherComment ? <Text style={styles.comment}>💬 {b.teacherComment}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.navy }]} onPress={() => openEdit(b)}>
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.maroon }]} onPress={() => deleteRow(b)}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Booking</Text>
            <Text style={styles.modalSub}>{selected?.studentName} • {selected?.slotName}</Text>

            <Text style={styles.fieldLabel}>Memorization Grade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={styles.gradeRow}>
                {GRADES.map(g => (
                  <TouchableOpacity key={g} style={[styles.gradeChip, editForm.memorizationGrade === g && styles.gradeChipActive]} onPress={() => setEditForm(f => ({ ...f, memorizationGrade: g }))}>
                    <Text style={[styles.gradeChipText, editForm.memorizationGrade === g && styles.gradeChipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Pronunciation Grade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={styles.gradeRow}>
                {GRADES.map(g => (
                  <TouchableOpacity key={g} style={[styles.gradeChip, editForm.pronunciationGrade === g && styles.gradeChipActive]} onPress={() => setEditForm(f => ({ ...f, pronunciationGrade: g }))}>
                    <Text style={[styles.gradeChipText, editForm.pronunciationGrade === g && styles.gradeChipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Comment</Text>
            <TextInput style={[styles.fieldInput, { height: 60 }]} value={editForm.comment} onChangeText={v => setEditForm(f => ({ ...f, comment: v }))} multiline placeholder="Examiner suggestion..." />

            <Text style={styles.fieldLabel}>Assign Teacher (VID)</Text>
            <TextInput style={styles.fieldInput} value={editForm.assignedTeacherId} onChangeText={v => setEditForm(f => ({ ...f, assignedTeacherId: v }))} autoCapitalize="characters" placeholder="Teacher VID" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.borderLight }]} onPress={() => setEditModal(false)}>
                <Text style={{ color: colors.textDark, ...fonts.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.navy }]} onPress={saveRow} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', ...fonts.semiBold }}>Save</Text>}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: { backgroundColor: colors.white, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterLabel: { fontSize: 13, color: colors.textMuted, width: 36, ...fonts.medium },
  dateInput: { flex: 1, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14 },
  teacherScroll: { marginVertical: 4 },
  teacherChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight, marginRight: 6 },
  teacherChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  teacherChipText: { fontSize: 12, color: colors.textBody },
  teacherChipTextActive: { color: '#fff', ...fonts.semiBold },
  loadBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.md, alignSelf: 'flex-start' },
  loadBtnText: { color: '#fff', ...fonts.semiBold },
  errorBanner: { backgroundColor: colors.errorBg, padding: spacing.sm, paddingHorizontal: spacing.md },
  errorText: { color: colors.errorText, fontSize: 13 },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  countText: { fontSize: 12, color: colors.textMuted, marginBottom: 4, ...fonts.medium },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card },
  cardHeader: { flexDirection: 'row', gap: 8 },
  studentName: { fontSize: 15, color: colors.textDark, ...fonts.semiBold },
  vid: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  chapter: { fontSize: 12, color: colors.textBody, marginTop: 1 },
  gradeCol: { alignItems: 'flex-end', gap: 4 },
  grade: { fontSize: 14, ...fonts.bold },
  teacher: { fontSize: 12, color: colors.textBody, marginTop: 6 },
  comment: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.sm },
  btnText: { color: '#fff', fontSize: 12, ...fonts.semiBold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '90%' },
  modalTitle: { fontSize: 18, color: colors.textDark, ...fonts.bold },
  modalSub: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4, ...fonts.medium },
  fieldInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, marginBottom: 12 },
  gradeRow: { flexDirection: 'row', gap: 6 },
  gradeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  gradeChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  gradeChipText: { fontSize: 12, color: colors.textBody },
  gradeChipTextActive: { color: '#fff', ...fonts.semiBold },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, padding: 14, borderRadius: borderRadius.md, alignItems: 'center' },
});
