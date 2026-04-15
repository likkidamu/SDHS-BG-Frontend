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

interface StudentOption { volunteerId: string; name: string; }
interface SlotOption { id: number; name: string; }
interface ChapterOption { id: number; chapterNumber: number; chapterName: string; allowedSlokas: string; }
interface Booking { id: number; volunteerId: string; studentName: string; slotId: number; slotName: string; chapterId: number; chapterNumber: number; chapterName: string; slokaCount: number; assignedTeacherName: string; }

interface BookingEntry { volunteerId: string; studentName: string; slotId: string; chapterId: string; slokaCount: string; }

function nextSunday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d.toISOString().split('T')[0];
}

const emptyEntry = (): BookingEntry => ({ volunteerId: '', studentName: '', slotId: '', chapterId: '', slokaCount: '' });

export default function AdminBulkBookingScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [date, setDate] = useState(nextSunday());
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [entries, setEntries] = useState<BookingEntry[]>([emptyEntry()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true); setError(''); setSuccess('');
      const res = await api.get('/admin/bulk-booking', { params: { date } });
      setStudents(res.data.students || []);
      setSlots(res.data.slots || []);
      setChapters(res.data.chapters || []);
      setBookings(res.data.bookings || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const updateEntry = (idx: number, field: keyof BookingEntry, val: string) => {
    setEntries(es => es.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  };

  // Auto-fill student name when VID typed
  const onVidChange = (idx: number, val: string) => {
    updateEntry(idx, 'volunteerId', val.toUpperCase());
    const found = students.find(s => s.volunteerId.toUpperCase() === val.toUpperCase());
    if (found) updateEntry(idx, 'studentName', found.name);
  };

  const allowedSlokas = (chapterId: string): number[] => {
    const c = chapters.find(ch => ch.id === parseInt(chapterId));
    if (!c || !c.allowedSlokas) return [];
    return c.allowedSlokas.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)).sort((a, b) => a - b);
  };

  const save = async () => {
    const valid = entries.filter(e => e.volunteerId && e.slotId && e.chapterId && e.slokaCount);
    if (valid.length === 0) { Alert.alert('Nothing to save', 'Fill in at least one row.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/admin/bulk-booking/save', {
        entries: valid.map(e => ({
          volunteerId: e.volunteerId, date,
          slotId: parseInt(e.slotId), chapterId: parseInt(e.chapterId), slokaCount: parseInt(e.slokaCount),
        }))
      });
      setSuccess(`${res.data.saved} saved, ${res.data.failed} failed.`);
      if (res.data.messages?.length) setError(res.data.messages.join(' | '));
      setEntries([emptyEntry()]);
      load();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const deleteBooking = (b: Booking) => {
    Alert.alert('Delete', `Delete booking for ${b.studentName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.post('/admin/bulk-booking/delete', { bookingId: b.id }); load(); }
        catch (e: any) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
      }},
    ]);
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="Student Slot Booking" actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]} />

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Date</Text>
        <TextInput style={styles.dateInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" returnKeyType="done" />
        <TouchableOpacity style={styles.loadBtn} onPress={load}><Text style={styles.loadBtnText}>Load</Text></TouchableOpacity>
      </View>

      {success ? <View style={styles.successBanner}><Text style={styles.successText}>{success}</Text></View> : null}
      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>

          {/* Add Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Bookings</Text>
            {entries.map((entry, idx) => (
              <View key={idx} style={styles.entryCard}>
                <View style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Student VID</Text>
                    <TextInput style={styles.fieldInput} value={entry.volunteerId} onChangeText={v => onVidChange(idx, v)} autoCapitalize="characters" placeholder="VID" />
                  </View>
                  <View style={{ flex: 2, marginLeft: 8 }}>
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput style={styles.fieldInput} value={entry.studentName} onChangeText={v => updateEntry(idx, 'studentName', v)} placeholder="Student name" />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Slot</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={styles.chipRow}>
                    {slots.map(s => (
                      <TouchableOpacity key={s.id} style={[styles.chip, entry.slotId === String(s.id) && styles.chipActive]} onPress={() => updateEntry(idx, 'slotId', String(s.id))}>
                        <Text style={[styles.chipText, entry.slotId === String(s.id) && styles.chipTextActive]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.fieldLabel}>Chapter</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={styles.chipRow}>
                    {chapters.map(c => (
                      <TouchableOpacity key={c.id} style={[styles.chip, entry.chapterId === String(c.id) && styles.chipActive]} onPress={() => { updateEntry(idx, 'chapterId', String(c.id)); updateEntry(idx, 'slokaCount', ''); }}>
                        <Text style={[styles.chipText, entry.chapterId === String(c.id) && styles.chipTextActive]}>Ch {c.chapterNumber}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {entry.chapterId ? (
                  <>
                    <Text style={styles.fieldLabel}>Slokas</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                      <View style={styles.chipRow}>
                        {allowedSlokas(entry.chapterId).map(n => (
                          <TouchableOpacity key={n} style={[styles.chip, entry.slokaCount === String(n) && styles.chipActive]} onPress={() => updateEntry(idx, 'slokaCount', String(n))}>
                            <Text style={[styles.chipText, entry.slokaCount === String(n) && styles.chipTextActive]}>{n}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                ) : null}

                {idx > 0 && (
                  <TouchableOpacity onPress={() => setEntries(es => es.filter((_, i) => i !== idx))} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remove row</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addRowBtn} onPress={() => setEntries(es => [...es, emptyEntry()])}>
              <Text style={styles.addRowText}>+ Add Another Student</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save All</Text>}
            </TouchableOpacity>
          </View>

          {/* Existing bookings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Existing Bookings ({bookings.length})</Text>
            {bookings.length === 0 && <Text style={styles.emptyText}>No bookings for {date}</Text>}
            {bookings.map(b => (
              <View key={b.id} style={styles.bookingCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingName}>{b.studentName}</Text>
                  <Text style={styles.bookingMeta}>{b.volunteerId} • {b.slotName}</Text>
                  <Text style={styles.bookingMeta}>Ch {b.chapterNumber}: {b.chapterName} — {b.slokaCount} slokas</Text>
                  {b.assignedTeacherName ? <Text style={styles.bookingMeta}>Teacher: {b.assignedTeacherName}</Text> : null}
                </View>
                <TouchableOpacity style={[styles.delBtn]} onPress={() => deleteBooking(b)}>
                  <Text style={styles.delBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, color: colors.textDark, ...fonts.bold, marginBottom: 4 },
  entryCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card, gap: 4 },
  entryRow: { flexDirection: 'row' },
  fieldLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 3, ...fonts.medium },
  fieldInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.sm, padding: 8, fontSize: 13, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, color: colors.textBody },
  chipTextActive: { color: '#fff', ...fonts.semiBold },
  removeBtn: { alignSelf: 'flex-start', marginTop: 4 },
  removeBtnText: { fontSize: 12, color: colors.errorText },
  addRowBtn: { backgroundColor: colors.infoBg, borderWidth: 1, borderColor: colors.infoBorder, borderRadius: borderRadius.md, padding: 12, alignItems: 'center' },
  addRowText: { color: colors.infoText, ...fonts.semiBold },
  saveBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, ...fonts.bold },
  bookingCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.sm, ...shadows.card, alignItems: 'center' },
  bookingName: { fontSize: 14, color: colors.textDark, ...fonts.semiBold },
  bookingMeta: { fontSize: 12, color: colors.textMuted },
  emptyText: { textAlign: 'center', color: colors.textMuted },
  delBtn: { padding: 8, backgroundColor: colors.errorBg, borderRadius: borderRadius.sm },
  delBtnText: { color: colors.errorText, ...fonts.bold },
});
