import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { showConfirmationDialog, TopNavbar } from '../components';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import type { BulkBookingEntry, Chapter, ExistingBooking, Slot, StudentSearchResult, TrackType } from '../features/admin/bulkBooking/models';
import {
  deleteAdminBulkBooking,
  getAdminAllowedSlokas,
  getAdminBulkBooking,
  saveAdminBulkBookings,
  searchAdminBookingStudents,
} from '../features/admin/bulkBooking/service';
import type { AdminScreenProps } from '../navigation/types';
import { getApiErrorMessage } from '../utils/apiError';

type Props = AdminScreenProps<'AdminBulkBooking'>;

interface BookingEditor {
  volunteerId: string;
  studentName: string;
  slotId: string;
  chapterId: string;
  slokaCount: string;
  useSecondChapter: boolean;
  chapterId2: string;
  slokaCount2: string;
}

interface StagedBooking extends BulkBookingEntry {
  studentName: string;
}

interface Notice {
  type: 'success' | 'error';
  summary: string;
  messages?: string[];
}

function currentOrNextSunday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const emptyEditor = (): BookingEditor => ({
  volunteerId: '', studentName: '', slotId: '', chapterId: '', slokaCount: '',
  useSecondChapter: false, chapterId2: '', slokaCount2: '',
});

function isSupplementalChapter(chapterName?: string) {
  return chapterName === 'Dhyana Slokas' || chapterName === 'Gita Mahatyam';
}

function existingChapterLabel(booking: ExistingBooking) {
  if (isSupplementalChapter(booking.chapterName)) return booking.chapterName;
  const label = [booking.chapterNumber, booking.chapterName].filter(value => value !== undefined && value !== null && value !== '').join(' ');
  return label || '-';
}

function failedStagedEntries(entries: StagedBooking[], messages: string[], failed: number) {
  const remaining = [...entries];
  const failures: StagedBooking[] = [];
  messages.forEach((message) => {
    const volunteerId = message.split(':', 1)[0]?.trim();
    const index = remaining.findIndex(entry => entry.volunteerId.toUpperCase() === volunteerId?.toUpperCase());
    if (index >= 0) failures.push(...remaining.splice(index, 1));
  });
  return failures.length === failed ? failures : entries;
}

// ---- Student autocomplete ----
function StudentAutocomplete({
  selectedVolunteerId, selectedName, onSelect, onClear,
}: {
  selectedVolunteerId: string;
  selectedName: string;
  onSelect: (student: StudentSearchResult) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestSequence = useRef(0);

  useEffect(() => {
    setQuery(selectedVolunteerId ? `${selectedName} (${selectedVolunteerId})` : '');
  }, [selectedName, selectedVolunteerId]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    if (selectedVolunteerId || normalizedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    const timeout = setTimeout(() => {
      void searchAdminBookingStudents(normalizedQuery)
        .then((students) => {
          if (requestSequence.current === sequence) {
            setResults(students);
            setOpen(true);
          }
        })
        .catch((requestError: any) => {
          if (requestSequence.current === sequence) {
            setResults([]);
            setError(requestError.response?.data?.error ?? requestError.response?.data?.message ?? 'Unable to search students.');
          }
        })
        .finally(() => {
          if (requestSequence.current === sequence) setLoading(false);
        });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, selectedVolunteerId]);

  return (
    <View style={{ position: 'relative', zIndex: 10 }}>
      <TextInput
        style={styles.fieldInput}
        value={query}
        onChangeText={(value) => {
          if (selectedVolunteerId) onClear();
          setQuery(value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoCapitalize="characters"
        placeholder="Type VID or name…"
        returnKeyType="done"
        onSubmitEditing={() => setOpen(false)}
      />
      <Text style={styles.searchHelp}>Enter at least 2 characters.</Text>
      {loading ? <Text style={styles.searchStatus}>Searching students...</Text> : null}
      {error ? <Text style={styles.searchError}>{error}</Text> : null}
      {open && results.length > 0 && (
        <View style={ac.dropdown}>
          {results.map((student) => (
            <TouchableOpacity
              key={student.volunteerId}
              style={ac.item}
              onPress={() => { onSelect(student); setQuery(`${student.name} (${student.volunteerId})`); setResults([]); setError(''); setOpen(false); }}
            >
              <Text style={ac.vid}>{student.volunteerId}</Text>
              <View style={ac.identity}>
                <Text style={ac.name}>{student.name}</Text>
                {student.groupId ? <Text style={ac.group}>{student.groupId}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const ac = StyleSheet.create({
  dropdown: {
    position: 'absolute', top: 40, left: 0, right: 0, zIndex: 999,
    backgroundColor: colors.white, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.borderLight,
    ...shadows.card, overflow: 'hidden',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  vid: { fontSize: 12, ...fonts.bold, color: colors.navy, minWidth: 72 },
  name: { fontSize: 13, ...fonts.regular, color: colors.textBody, flex: 1 },
  identity: { flex: 1 },
  group: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});

export default function AdminBulkBookingScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [date, setDate] = useState(currentOrNextSunday());
  const [trackType, setTrackType] = useState<TrackType | ''>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bookings, setBookings] = useState<ExistingBooking[]>([]);
  const [editor, setEditor] = useState<BookingEditor>(emptyEditor());
  const [stagedEntries, setStagedEntries] = useState<StagedBooking[]>([]);
  const [allowedSlokas, setAllowedSlokas] = useState<number[]>([]);
  const [allowedSlokas2, setAllowedSlokas2] = useState<number[]>([]);
  const [slokaLoading, setSlokaLoading] = useState(false);
  const [slokaLoading2, setSlokaLoading2] = useState(false);
  const [slokaError, setSlokaError] = useState('');
  const [slokaError2, setSlokaError2] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const slokaRequest = useRef(0);
  const slokaRequest2 = useRef(0);
  const saveInProgress = useRef(false);
  const deleteInProgress = useRef(false);

  const load = useCallback(async (showLoading = true) => {
    if (!date) return;
    try {
      if (showLoading) setLoading(true);
      setLoadError('');
      const response = await getAdminBulkBooking(date);
      setSlots(response.slots);
      setChapters(response.chapters);
      setBookings(response.bookings);
    } catch (e: any) {
      setLoadError(getApiErrorMessage(e, 'Failed to load bulk booking.'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const resetEditor = () => {
    slokaRequest.current += 1;
    slokaRequest2.current += 1;
    setEditor(emptyEditor());
    setAllowedSlokas([]);
    setAllowedSlokas2([]);
    setSlokaLoading(false);
    setSlokaLoading2(false);
    setSlokaError('');
    setSlokaError2('');
  };

  const fetchSlokas = async (volunteerId: string, chapterId: string, second = false) => {
    const requestRef = second ? slokaRequest2 : slokaRequest;
    const request = requestRef.current + 1;
    requestRef.current = request;
    const setAllowed = second ? setAllowedSlokas2 : setAllowedSlokas;
    const setLoadingState = second ? setSlokaLoading2 : setSlokaLoading;
    const setErrorState = second ? setSlokaError2 : setSlokaError;
    if (!volunteerId || !chapterId) {
      setAllowed([]);
      setErrorState('');
      return;
    }
    setLoadingState(true);
    setAllowed([]);
    setErrorState('');
    try {
      const response = await getAdminAllowedSlokas(volunteerId, date, parseInt(chapterId, 10));
      if (requestRef.current === request) setAllowed(response.allowed);
    } catch (requestError: any) {
      if (requestRef.current === request) {
        setErrorState(requestError.response?.data?.error ?? requestError.response?.data?.message ?? 'Unable to load allowed slokas.');
      }
    } finally {
      if (requestRef.current === request) setLoadingState(false);
    }
  };

  const onStudentSelect = (student: StudentSearchResult) => {
    setEditor(current => ({ ...current, volunteerId: student.volunteerId, studentName: student.name, slokaCount: '', slokaCount2: '' }));
    if (editor.chapterId) void fetchSlokas(student.volunteerId, editor.chapterId);
    if (editor.useSecondChapter && editor.chapterId2) void fetchSlokas(student.volunteerId, editor.chapterId2, true);
  };

  const onChapterSelect = (chapterId: string, second = false) => {
    setEditor(current => second
      ? { ...current, chapterId2: chapterId, slokaCount2: '' }
      : { ...current, chapterId, slokaCount: '' });
    if (editor.volunteerId) void fetchSlokas(editor.volunteerId, chapterId, second);
  };

  const changeTrack = (track: TrackType) => {
    if (track === trackType) return;
    setTrackType(track);
    setStagedEntries([]);
    resetEditor();
    setNotice(null);
  };

  const changeDate = (value: string) => {
    setDate(value);
    setStagedEntries([]);
    resetEditor();
  };

  const addToBatch = () => {
    setNotice(null);
    if (!trackType) {
      setNotice({ type: 'error', summary: 'Track Type is required.' });
      return;
    }
    if (!editor.volunteerId || !editor.slotId || !editor.chapterId || !editor.slokaCount) {
      setNotice({ type: 'error', summary: 'Student, slot, chapter, and sloka count are required.' });
      return;
    }
    const slokaCount = parseInt(editor.slokaCount, 10);
    if (!allowedSlokas.includes(slokaCount)) {
      setNotice({ type: 'error', summary: allowedSlokas.length ? `Allowed sloka counts: ${allowedSlokas.join(', ')}` : 'No allowed sloka count is available.' });
      return;
    }
    if (editor.useSecondChapter && (!editor.chapterId2 || !editor.slokaCount2)) {
      setNotice({ type: 'error', summary: 'Second chapter and sloka count are required.' });
      return;
    }
    const chapterId2 = editor.chapterId2 ? parseInt(editor.chapterId2, 10) : undefined;
    const slokaCount2 = editor.slokaCount2 ? parseInt(editor.slokaCount2, 10) : undefined;
    if (editor.useSecondChapter && slokaCount2 !== undefined && !allowedSlokas2.includes(slokaCount2)) {
      setNotice({ type: 'error', summary: allowedSlokas2.length ? `Allowed second-chapter sloka counts: ${allowedSlokas2.join(', ')}` : 'No allowed sloka count is available for the second chapter.' });
      return;
    }
    if (editor.useSecondChapter && chapterId2 === parseInt(editor.chapterId, 10) && slokaCount2 === slokaCount) {
      setNotice({ type: 'error', summary: 'The second chapter/sloka selection must differ from the first.' });
      return;
    }
    setStagedEntries(current => [...current, {
      volunteerId: editor.volunteerId,
      studentName: editor.studentName,
      date,
      slotId: parseInt(editor.slotId, 10),
      chapterId: parseInt(editor.chapterId, 10),
      slokaCount,
      ...(editor.useSecondChapter ? { chapterId2, slokaCount2 } : {}),
    }]);
    resetEditor();
  };

  const saveBatch = async () => {
    if (saveInProgress.current || stagedEntries.length === 0 || !trackType) return;
    saveInProgress.current = true;
    const submittedEntries = [...stagedEntries];
    setSaving(true);
    setNotice(null);
    try {
      const response = await saveAdminBulkBookings({
        trackType,
        entries: submittedEntries.map(entry => ({
          volunteerId: entry.volunteerId,
          date: entry.date,
          slotId: entry.slotId,
          chapterId: entry.chapterId,
          slokaCount: entry.slokaCount,
          ...(entry.chapterId2 !== undefined ? { chapterId2: entry.chapterId2 } : {}),
          ...(entry.slokaCount2 !== undefined ? { slokaCount2: entry.slokaCount2 } : {}),
        })),
      });
      setNotice({
        type: response.failed > 0 ? 'error' : 'success',
        summary: `${response.saved} saved, ${response.failed} failed.`,
        messages: response.messages,
      });
      if (response.saved === submittedEntries.length) {
        setStagedEntries([]);
      } else if (response.failed > 0) {
        setStagedEntries(failedStagedEntries(submittedEntries, response.messages, response.failed));
      }
      await load(false);
    } catch (saveError: any) {
      setNotice({ type: 'error', summary: getApiErrorMessage(saveError, 'Failed to save bookings.') });
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  };

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  };

  const deleteBooking = (b: ExistingBooking) => {
    if (deletingBookingId !== null) return;
    showConfirmationDialog({
      title: 'Delete',
      message: `Delete booking for ${b.studentName}?`,
      confirmLabel: 'Delete',
      destructive: true,
      confirm: async () => {
        if (deleteInProgress.current) return;
        deleteInProgress.current = true;
        setDeletingBookingId(b.id);
        setNotice(null);
        try {
          const response = await deleteAdminBulkBooking({ bookingId: b.id });
          setNotice({ type: 'success', summary: response.message });
          await load(false);
        } catch (deleteError: any) {
          setNotice({ type: 'error', summary: getApiErrorMessage(deleteError, 'Failed to delete booking.') });
        } finally {
          deleteInProgress.current = false;
          setDeletingBookingId(null);
        }
      },
    });
  };

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Student Slot Booking"
        actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]}
      />

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Date</Text>
        <TextInput style={styles.dateInput} value={date} onChangeText={changeDate} placeholder="YYYY-MM-DD" returnKeyType="done" />
        <TouchableOpacity style={styles.loadBtn} onPress={() => void load()}><Text style={styles.loadBtnText}>Load</Text></TouchableOpacity>
      </View>

      {notice ? (
        <View style={notice.type === 'success' ? styles.successBanner : styles.errorBanner}>
          <Text style={notice.type === 'success' ? styles.successText : styles.errorText}>{notice.summary}</Text>
          {notice.messages?.map((message, index) => (
            <Text key={`${message}-${index}`} style={notice.type === 'success' ? styles.successText : styles.errorText}>{message}</Text>
          ))}
        </View>
      ) : null}
      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} />}
        >

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Track</Text>
            <View style={styles.chipRow}>
              {(['MEMORIZATION', 'REVISION'] as TrackType[]).map(track => (
                <TouchableOpacity
                  key={track}
                  style={[styles.chip, trackType === track && styles.chipActive]}
                  onPress={() => changeTrack(track)}
                >
                  <Text style={[styles.chipText, trackType === track && styles.chipTextActive]}>{track}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Booking</Text>
            <View style={styles.entryCard}>
                <Text style={styles.fieldLabel}>Student (VID or Name)</Text>
                <StudentAutocomplete
                  selectedVolunteerId={editor.volunteerId}
                  selectedName={editor.studentName}
                  onSelect={onStudentSelect}
                  onClear={() => {
                    setEditor(current => ({ ...current, volunteerId: '', studentName: '', slokaCount: '', slokaCount2: '' }));
                    setAllowedSlokas([]);
                    setAllowedSlokas2([]);
                  }}
                />
                {editor.studentName ? (
                  <Text style={styles.resolvedName}>{editor.studentName}</Text>
                ) : null}

                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Slot</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={styles.chipRow}>
                    {slots.map(s => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.chip, editor.slotId === String(s.id) && styles.chipActive]}
                        onPress={() => setEditor(current => ({ ...current, slotId: String(s.id) }))}
                      >
                        <Text style={[styles.chipText, editor.slotId === String(s.id) && styles.chipTextActive]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.fieldLabel}>Chapter</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={styles.chipRow}>
                    {chapters.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, editor.chapterId === String(c.id) && styles.chipActive]}
                        onPress={() => onChapterSelect(String(c.id))}
                      >
                        <Text style={[styles.chipText, editor.chapterId === String(c.id) && styles.chipTextActive]}>Ch {c.chapterNumber}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {editor.chapterId ? (
                  <>
                    <Text style={styles.fieldLabel}>Slokas (1–N)</Text>
                    {slokaLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginBottom: 8 }} />
                    ) : allowedSlokas.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        <View style={styles.chipRow}>
                          {allowedSlokas.map(n => (
                            <TouchableOpacity
                              key={n}
                              style={[styles.chip, editor.slokaCount === String(n) && styles.chipActive]}
                              onPress={() => setEditor(current => ({ ...current, slokaCount: String(n) }))}
                            >
                              <Text style={[styles.chipText, editor.slokaCount === String(n) && styles.chipTextActive]}>1–{n}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    ) : (
                      <Text style={styles.noSlokasText}>
                        {slokaError || (editor.volunteerId ? 'No slokas available (check syllabus for this date)' : 'Select a student first to load slokas')}
                      </Text>
                    )}
                  </>
                ) : null}

                <TouchableOpacity
                  style={styles.secondChapterToggle}
                  onPress={() => {
                    if (editor.useSecondChapter) {
                      slokaRequest2.current += 1;
                      setAllowedSlokas2([]);
                      setSlokaError2('');
                    }
                    setEditor(current => ({
                      ...current,
                      useSecondChapter: !current.useSecondChapter,
                      chapterId2: '',
                      slokaCount2: '',
                    }));
                  }}
                >
                  <Text style={styles.addRowText}>{editor.useSecondChapter ? '− Remove Second Chapter' : '+ Add Second Chapter'}</Text>
                </TouchableOpacity>

                {editor.useSecondChapter ? (
                  <View style={styles.secondChapterSection}>
                    <Text style={styles.fieldLabel}>Chapter 2</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                      <View style={styles.chipRow}>
                        {chapters.map(c => (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.chip, editor.chapterId2 === String(c.id) && styles.chipActive]}
                            onPress={() => onChapterSelect(String(c.id), true)}
                          >
                            <Text style={[styles.chipText, editor.chapterId2 === String(c.id) && styles.chipTextActive]}>Ch {c.chapterNumber}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                    {editor.chapterId2 ? (
                      <>
                        <Text style={styles.fieldLabel}>Sloka Count 2</Text>
                        {slokaLoading2 ? (
                          <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginBottom: 8 }} />
                        ) : allowedSlokas2.length > 0 ? (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                            <View style={styles.chipRow}>
                              {allowedSlokas2.map(n => (
                                <TouchableOpacity
                                  key={n}
                                  style={[styles.chip, editor.slokaCount2 === String(n) && styles.chipActive]}
                                  onPress={() => setEditor(current => ({ ...current, slokaCount2: String(n) }))}
                                >
                                  <Text style={[styles.chipText, editor.slokaCount2 === String(n) && styles.chipTextActive]}>1–{n}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </ScrollView>
                        ) : (
                          <Text style={styles.noSlokasText}>{slokaError2 || (editor.volunteerId ? 'No slokas available for this chapter' : 'Select a student first to load slokas')}</Text>
                        )}
                      </>
                    ) : null}
                  </View>
                ) : null}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={addToBatch}>
              <Text style={styles.saveBtnText}>Add to Batch</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Batch ({stagedEntries.length})</Text>
            {stagedEntries.length === 0 ? <Text style={styles.emptyText}>No bookings added to this batch.</Text> : null}
            {stagedEntries.map((entry, index) => {
              const slot = slots.find(item => item.id === entry.slotId);
              const chapter = chapters.find(item => item.id === entry.chapterId);
              const chapter2 = chapters.find(item => item.id === entry.chapterId2);
              return (
                <View key={`${entry.volunteerId}-${index}`} style={styles.bookingCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingName}>{entry.studentName}</Text>
                    <Text style={styles.bookingMeta}>{entry.volunteerId} • {trackType === 'MEMORIZATION' ? 'Memorization' : 'Revision'}</Text>
                    <Text style={styles.bookingMeta}>{slot?.name ?? `Slot ${entry.slotId}`}</Text>
                    <Text style={styles.bookingMeta}>Ch {chapter?.chapterNumber ?? entry.chapterId} — 1–{entry.slokaCount}</Text>
                    {entry.chapterId2 && entry.slokaCount2 ? (
                      <Text style={styles.bookingMeta}>Ch {chapter2?.chapterNumber ?? entry.chapterId2} — 1–{entry.slokaCount2}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity style={styles.delBtn} onPress={() => setStagedEntries(current => current.filter((_, itemIndex) => itemIndex !== index))}>
                    <Text style={styles.delBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity
              style={[styles.saveBtn, (saving || stagedEntries.length === 0) && styles.buttonDisabled]}
              onPress={() => void saveBatch()}
              disabled={saving || stagedEntries.length === 0}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Bookings</Text>}
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
                  <Text style={styles.bookingMeta}>{b.volunteerId} • {b.slotName ?? '-'}</Text>
                  <Text style={styles.bookingMeta}>{existingChapterLabel(b)} — {b.slokaCount === null ? '-' : `1–${b.slokaCount}`}</Text>
                  <Text style={styles.bookingMeta}>Teacher: {b.assignedTeacherName ?? '-'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.delBtn, deletingBookingId !== null && styles.buttonDisabled]}
                  onPress={() => deleteBooking(b)}
                  disabled={deletingBookingId !== null}
                >
                  {deletingBookingId === b.id
                    ? <ActivityIndicator size="small" color={colors.errorText} />
                    : <Text style={styles.delBtnText}>✕</Text>}
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
  successBanner: { backgroundColor: colors.successBg, padding: spacing.sm, paddingHorizontal: spacing.md, gap: 2 },
  successText: { color: colors.successText, fontSize: 13 },
  errorBanner: { backgroundColor: colors.errorBg, padding: spacing.sm, paddingHorizontal: spacing.md },
  errorText: { color: colors.errorText, fontSize: 13 },
  retryBtn: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.errorText, borderRadius: borderRadius.sm },
  retryText: { color: colors.errorText, fontSize: 12, ...fonts.semiBold },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, color: colors.textDark, ...fonts.bold, marginBottom: 4 },
  entryCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card, gap: 4 },
  fieldLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 3, ...fonts.medium },
  fieldInput: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.sm, padding: 8, fontSize: 13, marginBottom: 4 },
  searchHelp: { color: colors.textMuted, fontSize: 10, marginBottom: 3 },
  searchStatus: { color: colors.infoText, fontSize: 11, marginBottom: 3 },
  searchError: { color: colors.errorText, fontSize: 11, marginBottom: 3 },
  resolvedName: { fontSize: 12, color: colors.primary, ...fonts.semiBold, marginBottom: 6 },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, color: colors.textBody },
  chipTextActive: { color: '#fff', ...fonts.semiBold },
  noSlokasText: { fontSize: 12, color: colors.textMuted, ...fonts.regular, marginBottom: 8, fontStyle: 'italic' },
  secondChapterToggle: { backgroundColor: colors.infoBg, borderWidth: 1, borderColor: colors.infoBorder, borderRadius: borderRadius.md, padding: 10, alignItems: 'center', marginTop: 4 },
  secondChapterSection: { marginTop: 8 },
  addRowText: { color: colors.infoText, ...fonts.semiBold },
  saveBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, ...fonts.bold },
  buttonDisabled: { opacity: 0.55 },
  bookingCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.sm, ...shadows.card, alignItems: 'center' },
  bookingName: { fontSize: 14, color: colors.textDark, ...fonts.semiBold },
  bookingMeta: { fontSize: 12, color: colors.textMuted },
  emptyText: { textAlign: 'center', color: colors.textMuted },
  delBtn: { padding: 8, backgroundColor: colors.errorBg, borderRadius: borderRadius.sm },
  delBtnText: { color: colors.errorText, ...fonts.bold },
});
