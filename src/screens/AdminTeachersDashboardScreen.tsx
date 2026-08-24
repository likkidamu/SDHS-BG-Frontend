import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Modal, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertBox, StatCard, TopNavbar } from '../components';
import { useAuth } from '../context/AuthContext';
import type { AdminTeacherDashboardBooking, AdminTeacherDashboardResponse } from '../features/admin/teacherDashboard/models';
import {
  deleteAdminTeacherDashboardRow, getAdminTeacherDashboard, saveAdminTeacherDashboardRow,
} from '../features/admin/teacherDashboard/service';
import { borderRadius, colors, fonts, shadows, spacing } from '../theme';

type Props = { navigation: NativeStackNavigationProp<any> };
type Notice = { type: 'success' | 'error'; message: string };

function currentOrNextSunday(): string {
  const date = new Date();
  date.setDate(date.getDate() + ((7 - date.getDay()) % 7));
  return date.toISOString().slice(0, 10);
}

function apiError(error: any, fallback: string): string {
  return error.response?.data?.error ?? error.response?.data?.message ?? fallback;
}

function chapterLabel(booking: AdminTeacherDashboardBooking): string {
  const supplemental = booking.chapterName === 'Dhyana Slokas' || booking.chapterName === 'Gita Mahatyam';
  const chapter = supplemental ? booking.chapterName : `Ch ${booking.chapterNumber ?? '-'}`;
  return `${chapter ?? 'Chapter unavailable'} · ${booking.slokaCount ?? '-'} slokas`;
}

function gradeColor(grade: string | null): string {
  const normalized = grade?.trim().toUpperCase();
  if (normalized === 'A+') return colors.gradeAPlus;
  if (normalized === 'A') return colors.gradeA;
  if (normalized === 'B') return colors.gradeB;
  if (normalized === 'C') return colors.gradeC;
  if (normalized === 'RETEST') return colors.gradeRetest;
  return colors.textMuted;
}

export default function AdminTeachersDashboardScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [date, setDate] = useState(currentOrNextSunday());
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [data, setData] = useState<AdminTeacherDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState<AdminTeacherDashboardBooking | null>(null);
  const [editForm, setEditForm] = useState({ memorizationGrade: '', pronunciationGrade: '', comment: '', assignedTeacherId: '' });
  const [working, setWorking] = useState<number | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setData(await getAdminTeacherDashboard({ date, ...(selectedTeacherId ? { teacherId: selectedTeacherId } : {}) }));
    } catch (requestError: any) {
      setError(apiError(requestError, 'Failed to load teachers dashboard.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, selectedTeacherId]);

  useEffect(() => { void load(); }, [load]);

  const summary = useMemo(() => {
    const bookings = data?.bookings ?? [];
    return {
      assigned: bookings.filter((booking) => Boolean(booking.assignedTeacherId || booking.assignedTeacherName)).length,
      pending: bookings.filter((booking) => !booking.memorizationGrade?.trim()).length,
      graded: bookings.filter((booking) => Boolean(booking.memorizationGrade?.trim())).length,
    };
  }, [data?.bookings]);

  const openEdit = (booking: AdminTeacherDashboardBooking) => {
    setNotice(null);
    setSelected(booking);
    setEditForm({
      memorizationGrade: booking.memorizationGrade ?? '', pronunciationGrade: booking.pronunciationGrade ?? '',
      comment: booking.teacherComment ?? '', assignedTeacherId: booking.assignedTeacherId ?? '',
    });
    setEditModal(true);
  };

  const saveRow = async () => {
    if (!selected || working !== null) return;
    setWorking(selected.id);
    setNotice(null);
    try {
      const response = await saveAdminTeacherDashboardRow({ bookingId: selected.id, ...editForm });
      setNotice({ type: 'success', message: response.message });
      setEditModal(false);
      await load();
    } catch (requestError: any) {
      setNotice({ type: 'error', message: apiError(requestError, 'Failed to save booking.') });
    } finally {
      setWorking(null);
    }
  };

  const deleteRow = (booking: AdminTeacherDashboardBooking) => {
    if (working !== null) return;
    Alert.alert('Delete Booking', `Delete booking for ${booking.studentName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setWorking(booking.id);
        setNotice(null);
        try {
          const response = await deleteAdminTeacherDashboardRow(booking.id);
          setNotice({ type: 'success', message: response.message });
          await load();
        } catch (requestError: any) {
          setNotice({ type: 'error', message: apiError(requestError, 'Failed to delete booking.') });
        } finally {
          setWorking(null);
        }
      } },
    ]);
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="Teachers Dashboard" actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={[colors.primary]} tintColor={colors.primary} />}>
        <View style={styles.filterBar}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Date</Text>
            <TextInput style={styles.dateInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" returnKeyType="done" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teacherScroll}>
            {[{ volunteerId: '', name: 'All Teachers' }, ...(data?.teachers ?? [])].map((teacher) => (
              <TouchableOpacity key={teacher.volunteerId} style={[styles.teacherChip, selectedTeacherId === teacher.volunteerId && styles.teacherChipActive]} onPress={() => setSelectedTeacherId(teacher.volunteerId)}>
                <Text style={[styles.teacherChipText, selectedTeacherId === teacher.volunteerId && styles.teacherChipTextActive]}>{teacher.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.loadButton} onPress={() => void load()} disabled={loading}><Text style={styles.loadButtonText}>Load</Text></TouchableOpacity>
        </View>

        {notice ? <AlertBox type={notice.type} message={notice.message} /> : null}
        {loading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
        {!loading && error ? <View style={styles.errorState}><AlertBox type="error" message={error} /><TouchableOpacity style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View> : null}

        {!loading && data ? <>
          <Text style={styles.sectionTitle}>Teacher Operations</Text>
          <View style={styles.statGrid}>
            <StatCard value={data.teachers.length} label="Teachers" iconLabel="👩‍🏫" iconBg={colors.blueBg} iconColor={colors.blue} />
            <StatCard value={data.bookings.length} label="Upcoming Teaching" iconLabel="📅" iconBg={colors.orangeBg} iconColor={colors.primary} />
            <StatCard value={summary.assigned} label="Teacher Ready" iconLabel="✓" iconBg={colors.greenBg} iconColor={colors.green} />
            <StatCard value={`${summary.graded}/${summary.pending}`} label="Graded / Pending" iconLabel="✏️" iconBg={colors.purpleBg} iconColor={colors.purple} />
          </View>
          <Text style={styles.countText}>{data.bookings.length} bookings for {data.date || date}</Text>
          {data.bookings.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>No bookings found for this date and teacher.</Text></View> : data.bookings.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.studentColumn}>
                  <Text style={styles.studentName}>{booking.studentName}</Text>
                  <Text style={styles.vid}>{booking.volunteerId}</Text>
                  {booking.studentPhone ? <TouchableOpacity onPress={() => void Linking.openURL(`tel:${booking.studentPhone}`)}><Text style={styles.phone}>{booking.studentPhone}</Text></TouchableOpacity> : null}
                  <Text style={styles.vid}>{booking.slotName ?? 'No slot'}</Text>
                  <Text style={styles.chapter}>{chapterLabel(booking)}</Text>
                </View>
                <View style={styles.gradeColumn}><Text style={[styles.grade, { color: gradeColor(booking.memorizationGrade) }]}>{booking.memorizationGrade || '—'}</Text><Text style={[styles.grade, { color: gradeColor(booking.pronunciationGrade) }]}>{booking.pronunciationGrade || '—'}</Text></View>
              </View>
              <Text style={styles.teacher}>Teacher: {booking.assignedTeacherName ?? 'Unassigned'}</Text>
              {booking.teacherComment ? <Text style={styles.comment}>💬 {booking.teacherComment}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => openEdit(booking)} disabled={working !== null}><Text style={styles.buttonText}>{working === booking.id ? 'Working…' : 'Edit'}</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => deleteRow(booking)} disabled={working !== null}><Text style={styles.buttonText}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </> : null}
      </ScrollView>

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Edit Booking</Text><Text style={styles.modalSubtitle}>{selected?.studentName} • {selected?.slotName ?? 'No slot'}</Text>
          {notice?.type === 'error' ? <AlertBox type="error" message={notice.message} /> : null}
          <Text style={styles.fieldLabel}>Teacher</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}><View style={styles.optionRow}>{[{ volunteerId: '', name: 'Unassigned' }, ...(data?.teachers ?? [])].map((teacher) => <TouchableOpacity key={teacher.volunteerId} style={[styles.optionChip, editForm.assignedTeacherId === teacher.volunteerId && styles.optionChipActive]} onPress={() => setEditForm((form) => ({ ...form, assignedTeacherId: teacher.volunteerId }))}><Text style={[styles.optionChipText, editForm.assignedTeacherId === teacher.volunteerId && styles.optionChipTextActive]}>{teacher.name}</Text></TouchableOpacity>)}</View></ScrollView>
          <Text style={styles.fieldLabel}>Memorization Grade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}><View style={styles.optionRow}>{['', ...(data?.grades ?? [])].map((grade) => <TouchableOpacity key={`m-${grade}`} style={[styles.optionChip, editForm.memorizationGrade === grade && styles.optionChipActive]} onPress={() => setEditForm((form) => ({ ...form, memorizationGrade: grade }))}><Text style={[styles.optionChipText, editForm.memorizationGrade === grade && styles.optionChipTextActive]}>{grade || 'Not graded'}</Text></TouchableOpacity>)}</View></ScrollView>
          <Text style={styles.fieldLabel}>Pronunciation Grade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}><View style={styles.optionRow}>{['', ...(data?.grades ?? [])].map((grade) => <TouchableOpacity key={`p-${grade}`} style={[styles.optionChip, editForm.pronunciationGrade === grade && styles.optionChipActive]} onPress={() => setEditForm((form) => ({ ...form, pronunciationGrade: grade }))}><Text style={[styles.optionChipText, editForm.pronunciationGrade === grade && styles.optionChipTextActive]}>{grade || 'Not graded'}</Text></TouchableOpacity>)}</View></ScrollView>
          <Text style={styles.fieldLabel}>Comment</Text><TextInput style={styles.commentInput} value={editForm.comment} onChangeText={(comment) => setEditForm((form) => ({ ...form, comment }))} multiline placeholder="Examiner suggestion..." />
          <View style={styles.modalActions}><TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModal(false)} disabled={working !== null}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={() => void saveRow()} disabled={working !== null}>{working !== null ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.buttonText}>Save</Text>}</TouchableOpacity></View>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg }, content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  filterBar: { backgroundColor: colors.white, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, gap: spacing.sm },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, filterLabel: { fontSize: 13, color: colors.textMuted, width: 36, ...fonts.medium },
  dateInput: { flex: 1, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14 }, teacherScroll: { marginVertical: 4 },
  teacherChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight, marginRight: 6 }, teacherChipActive: { backgroundColor: colors.navy, borderColor: colors.navy }, teacherChipText: { fontSize: 12, color: colors.textBody }, teacherChipTextActive: { color: colors.white, ...fonts.semiBold },
  loadButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.md, alignSelf: 'flex-start' }, loadButtonText: { color: colors.white, ...fonts.semiBold },
  errorState: { alignItems: 'center' }, retryButton: { backgroundColor: colors.navy, borderRadius: borderRadius.md, paddingHorizontal: 20, paddingVertical: 10 }, retryText: { color: colors.white, ...fonts.bold },
  sectionTitle: { color: colors.navy, fontSize: 18, ...fonts.extraBold, marginTop: spacing.sm }, statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, countText: { fontSize: 12, color: colors.textMuted, marginVertical: spacing.sm, ...fonts.medium },
  emptyCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.xl, ...shadows.card }, emptyText: { textAlign: 'center', color: colors.textMuted },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card }, cardHeader: { flexDirection: 'row', gap: spacing.sm }, studentColumn: { flex: 1 }, studentName: { fontSize: 15, color: colors.textDark, ...fonts.semiBold }, vid: { fontSize: 12, color: colors.textMuted, marginTop: 2 }, phone: { fontSize: 12, color: colors.navy, marginTop: 2, textDecorationLine: 'underline' }, chapter: { fontSize: 12, color: colors.textBody, marginTop: 2 }, gradeColumn: { alignItems: 'flex-end', gap: 4 }, grade: { fontSize: 14, ...fonts.bold }, teacher: { fontSize: 12, color: colors.textBody, marginTop: 6 }, comment: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: 10 }, button: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.sm }, editButton: { backgroundColor: colors.navy }, deleteButton: { backgroundColor: colors.maroon }, buttonText: { color: colors.white, fontSize: 12, ...fonts.semiBold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, modalBox: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '90%' }, modalTitle: { fontSize: 18, color: colors.textDark, ...fonts.bold }, modalSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md }, fieldLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4, ...fonts.medium }, optionScroll: { marginBottom: 12 }, optionRow: { flexDirection: 'row', gap: 6 }, optionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight }, optionChipActive: { backgroundColor: colors.navy, borderColor: colors.navy }, optionChipText: { fontSize: 12, color: colors.textBody }, optionChipTextActive: { color: colors.white, ...fonts.semiBold }, commentInput: { height: 60, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, marginBottom: 12 }, modalActions: { flexDirection: 'row', gap: 12, marginTop: spacing.md }, modalButton: { flex: 1, padding: 14, borderRadius: borderRadius.md, alignItems: 'center' }, cancelButton: { backgroundColor: colors.borderLight }, saveButton: { backgroundColor: colors.navy }, cancelText: { color: colors.textDark, ...fonts.semiBold },
});
