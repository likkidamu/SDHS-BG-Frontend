import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { TopNavbar, StatCard, ContentCard, AlertBox, Footer } from '../components';
import { colors, shadows, borderRadius, fonts, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Booking = {
  id: number;
  date: string;
  formattedDate: string;
  cancelled: boolean;
  slotName: string;
  chapterNumber: number;
  chapterName: string;
  slokaCount: number;
  memorizationGrade: string;
  pronunciationGrade: string;
  teacherComment: string;
  studentName: string;
  studentPhone: string;
  studentVolunteerId: string;
};

type DashboardData = {
  volunteerId: string;
  bookings: Booking[];
  gradesList: string[];
};

type BookingEdits = {
  memorizationGrade: string;
  pronunciationGrade: string;
  comment: string;
};

type RowFeedback = {
  type: 'success' | 'error';
  message: string;
};

type Props = { navigation: NativeStackNavigationProp<any> };

export default function TeacherDashboardScreen({ navigation }: Props) {
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [gradesList, setGradesList] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  // Track edits per booking id
  const [edits, setEdits] = useState<Record<number, BookingEdits>>({});
  // Track saving state per booking id
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  // Track feedback per booking id
  const [feedback, setFeedback] = useState<Record<number, RowFeedback>>({});

  // Grade picker modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerBookingId, setPickerBookingId] = useState<number | null>(null);
  const [pickerField, setPickerField] = useState<'memorizationGrade' | 'pronunciationGrade'>('memorizationGrade');

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      const res = await api.get<DashboardData>('/teacher/dashboard');
      const data = res.data;
      setBookings(data.bookings || []);
      setGradesList(data.gradesList || []);

      // Initialize edits from server data
      const initialEdits: Record<number, BookingEdits> = {};
      (data.bookings || []).forEach((b) => {
        initialEdits[b.id] = {
          memorizationGrade: b.memorizationGrade || '',
          pronunciationGrade: b.pronunciationGrade || '',
          comment: b.teacherComment || '',
        };
      });
      setEdits(initialEdits);
      setFeedback({});
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load dashboard');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchDashboard();
      setLoading(false);
    })();
  }, [fetchDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    if (!searchText.trim()) return bookings;
    const q = searchText.trim().toLowerCase();
    return bookings.filter((b) => b.studentName.toLowerCase().includes(q));
  }, [bookings, searchText]);

  // Stats
  const totalBookings = bookings.length;
  const gradedCount = bookings.filter(
    (b) => b.memorizationGrade && b.memorizationGrade.trim() !== ''
  ).length;
  const pendingCount = totalBookings - gradedCount;

  // Check if a booking row has changes compared to server data
  const hasChanges = useCallback(
    (booking: Booking): boolean => {
      const edit = edits[booking.id];
      if (!edit) return false;
      return (
        edit.memorizationGrade !== (booking.memorizationGrade || '') ||
        edit.pronunciationGrade !== (booking.pronunciationGrade || '') ||
        edit.comment !== (booking.teacherComment || '')
      );
    },
    [edits]
  );

  // Update an edit field
  const updateEdit = (bookingId: number, field: keyof BookingEdits, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [field]: value,
      },
    }));
    // Clear feedback when user makes changes
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[bookingId];
      return next;
    });
  };

  // Open grade picker
  const openPicker = (bookingId: number, field: 'memorizationGrade' | 'pronunciationGrade') => {
    setPickerBookingId(bookingId);
    setPickerField(field);
    setPickerVisible(true);
  };

  // Select a grade from picker
  const selectGrade = (grade: string) => {
    if (pickerBookingId !== null) {
      updateEdit(pickerBookingId, pickerField, grade);
    }
    setPickerVisible(false);
  };

  // Save grading for a booking
  const saveGrade = async (booking: Booking) => {
    const edit = edits[booking.id];
    if (!edit) return;

    setSaving((prev) => ({ ...prev, [booking.id]: true }));
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[booking.id];
      return next;
    });

    try {
      const res = await api.post<{ ok: boolean; message: string }>('/teacher/grade', {
        bookingId: booking.id,
        memorizationGrade: edit.memorizationGrade,
        pronunciationGrade: edit.pronunciationGrade,
        comment: edit.comment,
      });

      if (res.data.ok) {
        // Update local booking data to reflect saved state
        setBookings((prev) =>
          prev.map((b) =>
            b.id === booking.id
              ? {
                  ...b,
                  memorizationGrade: edit.memorizationGrade,
                  pronunciationGrade: edit.pronunciationGrade,
                  teacherComment: edit.comment,
                }
              : b
          )
        );
        setFeedback((prev) => ({
          ...prev,
          [booking.id]: { type: 'success', message: res.data.message || 'Saved successfully' },
        }));
      } else {
        setFeedback((prev) => ({
          ...prev,
          [booking.id]: { type: 'error', message: res.data.message || 'Failed to save' },
        }));
      }
    } catch (e: any) {
      setFeedback((prev) => ({
        ...prev,
        [booking.id]: {
          type: 'error',
          message: e?.response?.data?.message || 'Failed to save grade',
        },
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [booking.id]: false }));
    }
  };

  const isGraded = (booking: Booking): boolean =>
    !!(booking.memorizationGrade && booking.memorizationGrade.trim() !== '');

  const renderBookingCard = (booking: Booking) => {
    const edit = edits[booking.id] || {
      memorizationGrade: '',
      pronunciationGrade: '',
      comment: '',
    };
    const graded = isGraded(booking);
    const changed = hasChanges(booking);
    const isSaving = saving[booking.id] || false;
    const rowFeedback = feedback[booking.id];

    return (
      <View key={booking.id} style={styles.bookingCard}>
        {/* Header row */}
        <View style={styles.bookingHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{booking.studentName}</Text>
            <Text style={styles.studentId}>ID: {booking.studentVolunteerId}</Text>
          </View>
          {graded && !changed && (
            <View style={styles.gradedBadge}>
              <Text style={styles.gradedBadgeText}>Graded</Text>
            </View>
          )}
          {booking.cancelled && (
            <View style={styles.cancelledBadge}>
              <Text style={styles.cancelledBadgeText}>Cancelled</Text>
            </View>
          )}
        </View>

        {/* Details row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{booking.formattedDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Slot</Text>
            <Text style={styles.detailValue}>{booking.slotName}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Chapter</Text>
            <Text style={styles.detailValue}>
              Ch.{booking.chapterNumber} - {booking.chapterName}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Slokas</Text>
            <Text style={styles.detailValue}>{booking.slokaCount}</Text>
          </View>
        </View>

        {/* Grade selectors */}
        <View style={styles.gradeRow}>
          <View style={styles.gradeField}>
            <Text style={styles.gradeLabel}>Memorization</Text>
            <TouchableOpacity
              style={[
                styles.gradeSelector,
                edit.memorizationGrade ? styles.gradeSelectorFilled : null,
              ]}
              onPress={() => openPicker(booking.id, 'memorizationGrade')}
            >
              <Text
                style={[
                  styles.gradeSelectorText,
                  edit.memorizationGrade ? styles.gradeSelectorTextFilled : null,
                ]}
              >
                {edit.memorizationGrade || 'Select Grade'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gradeField}>
            <Text style={styles.gradeLabel}>Pronunciation</Text>
            <TouchableOpacity
              style={[
                styles.gradeSelector,
                edit.pronunciationGrade ? styles.gradeSelectorFilled : null,
              ]}
              onPress={() => openPicker(booking.id, 'pronunciationGrade')}
            >
              <Text
                style={[
                  styles.gradeSelectorText,
                  edit.pronunciationGrade ? styles.gradeSelectorTextFilled : null,
                ]}
              >
                {edit.pronunciationGrade || 'Select Grade'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comment input */}
        <View style={styles.commentSection}>
          <Text style={styles.gradeLabel}>Comment</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Enter comment (optional)"
            placeholderTextColor={colors.textMuted}
            value={edit.comment}
            onChangeText={(text) => updateEdit(booking.id, 'comment', text)}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Row feedback */}
        {rowFeedback && (
          <AlertBox type={rowFeedback.type} message={rowFeedback.message} />
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!changed || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={() => saveGrade(booking)}
          disabled={!changed || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Grade'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.page}>
        <TopNavbar
          title="Exam Grading"
          actions={[
            { label: 'Back', onPress: () => navigation.goBack() },
            { label: 'Logout', onPress: logout, variant: 'logout' },
          ]}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Exam Grading"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {error ? <AlertBox type="error" message={error} /> : null}

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <StatCard
              value={totalBookings}
              label="Total Bookings"
              iconLabel="📚"
              iconBg={colors.blueBg}
              iconColor={colors.blue}
            />
          </View>
          <View style={styles.statItem}>
            <StatCard
              value={gradedCount}
              label="Graded"
              iconLabel="✅"
              iconBg={colors.greenBg}
              iconColor={colors.green}
              valueColor={colors.green}
            />
          </View>
          <View style={styles.statItem}>
            <StatCard
              value={pendingCount}
              label="Pending"
              iconLabel="⏳"
              iconBg={colors.orangeBg}
              iconColor={colors.primary}
              valueColor={colors.primary}
            />
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity style={styles.clearSearch} onPress={() => setSearchText('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bookings list */}
        {filteredBookings.length === 0 ? (
          <ContentCard title="No Bookings Found">
            <Text style={styles.emptyText}>
              {searchText.trim()
                ? 'No bookings match your search.'
                : 'No bookings assigned to you yet.'}
            </Text>
          </ContentCard>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}

        <Footer />
      </ScrollView>

      {/* Grade Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pickerField === 'memorizationGrade' ? 'Memorization Grade' : 'Pronunciation Grade'}
            </Text>
            <View style={styles.gradeChipsContainer}>
              {gradesList.map((grade) => {
                const isSelected =
                  pickerBookingId !== null &&
                  edits[pickerBookingId]?.[pickerField] === grade;
                return (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.gradeChip, isSelected && styles.gradeChipSelected]}
                    onPress={() => selectGrade(grade)}
                  >
                    <Text
                      style={[
                        styles.gradeChipText,
                        isSelected && styles.gradeChipTextSelected,
                      ]}
                    >
                      {grade}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.medium,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
  },

  // Search
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 40,
    fontSize: 14,
    color: colors.textDark,
    ...fonts.regular,
    ...shadows.card,
  },
  clearSearch: {
    position: 'absolute',
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.bold,
  },

  // Booking card
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 16,
    color: colors.navy,
    ...fonts.bold,
  },
  studentId: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.medium,
    marginTop: 2,
  },
  gradedBadge: {
    backgroundColor: colors.greenBg,
    borderWidth: 1,
    borderColor: colors.greenLight,
    borderRadius: borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  gradedBadgeText: {
    fontSize: 11,
    color: colors.green,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelledBadge: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 6,
  },
  cancelledBadgeText: {
    fontSize: 11,
    color: colors.errorText,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Details row
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    padding: 12,
  },
  detailItem: {
    minWidth: '45%',
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textMuted,
    ...fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailValue: {
    fontSize: 13,
    color: colors.textDark,
    ...fonts.semiBold,
    marginTop: 2,
  },

  // Grade row
  gradeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gradeField: {
    flex: 1,
  },
  gradeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    ...fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  gradeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  gradeSelectorFilled: {
    borderColor: colors.navy,
    backgroundColor: '#f0f0ff',
  },
  gradeSelectorText: {
    fontSize: 13,
    color: colors.textMuted,
    ...fonts.medium,
  },
  gradeSelectorTextFilled: {
    color: colors.navy,
    ...fonts.bold,
  },
  dropdownArrow: {
    fontSize: 8,
    color: colors.textMuted,
    marginLeft: 4,
  },

  // Comment
  commentSection: {},
  commentInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.textDark,
    ...fonts.regular,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Save button
  saveButton: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveButtonDisabled: {
    backgroundColor: '#b0b0c0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    ...fonts.bold,
  },

  // Empty state
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.regular,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 360,
    ...shadows.cardHover,
  },
  modalTitle: {
    fontSize: 16,
    color: colors.navy,
    ...fonts.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  gradeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  gradeChip: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  gradeChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  gradeChipText: {
    fontSize: 14,
    color: colors.textDark,
    ...fonts.semiBold,
  },
  gradeChipTextSelected: {
    color: '#fff',
  },
  modalCancelBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.semiBold,
  },
});
