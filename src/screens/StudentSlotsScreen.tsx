import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { TopNavbar, AlertBox, ContentCard, Footer } from '../components';
import { colors, shadows, borderRadius, fonts, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

interface Slot {
  id: number;
  name: string;
  duration: string;
  availableCount: number;
}

interface Chapter {
  id: number;
  chapterNumber: number;
  chapterName: string;
  totalSlokas: number;
  allowedSlokas?: number;
}

interface ExistingBooking {
  id: number;
  date: string;
  cancelled: boolean;
  slotId: number;
  slotName: string;
  chapterId: number;
  chapterNumber: number;
  chapterName: string;
  slokaCount: number;
}

interface SlotsData {
  volunteerId: string;
  studentName: string;
  slotEligible: boolean;
  bookingAllowed: boolean;
  date: string;
  formattedDate: string;
  slots: Slot[];
  chapters: Chapter[];
  existingBookings: ExistingBooking[];
  existingBookingsCount: number;
}

export default function StudentSlotsScreen({ navigation }: Props) {
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SlotsData | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [slokaCount, setSlokaCount] = useState('');
  const [addSecondChapter, setAddSecondChapter] = useState(false);
  const [selectedChapter2, setSelectedChapter2] = useState<Chapter | null>(null);
  const [slokaCount2, setSlokaCount2] = useState('');
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  // Dropdown visibility
  const [chapterDropdownVisible, setChapterDropdownVisible] = useState(false);
  const [chapter2DropdownVisible, setChapter2DropdownVisible] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/student/slots');
      setData(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load slot data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleBook = async () => {
    clearMessages();

    if (!selectedSlotId) {
      setError('Please select a time slot.');
      return;
    }
    if (!selectedChapter) {
      setError('Please select a chapter.');
      return;
    }
    const count = parseInt(slokaCount, 10);
    if (!count || count <= 0) {
      setError('Please enter a valid sloka count.');
      return;
    }

    const maxSlokas = selectedChapter.allowedSlokas ?? selectedChapter.totalSlokas;
    if (count > maxSlokas) {
      setError(`Sloka count cannot exceed ${maxSlokas} for Chapter ${selectedChapter.chapterNumber}.`);
      return;
    }

    const body: Record<string, any> = {
      slotId: selectedSlotId,
      chapterId: selectedChapter.id,
      slokaCount: count,
    };

    if (addSecondChapter) {
      if (!selectedChapter2) {
        setError('Please select a second chapter or uncheck the option.');
        return;
      }
      const count2 = parseInt(slokaCount2, 10);
      if (!count2 || count2 <= 0) {
        setError('Please enter a valid sloka count for the second chapter.');
        return;
      }
      const maxSlokas2 = selectedChapter2.allowedSlokas ?? selectedChapter2.totalSlokas;
      if (count2 > maxSlokas2) {
        setError(`Sloka count cannot exceed ${maxSlokas2} for Chapter ${selectedChapter2.chapterNumber}.`);
        return;
      }
      body.chapterId2 = selectedChapter2.id;
      body.slokaCount2 = count2;
    }

    try {
      setBooking(true);
      await api.post('/student/book', body);
      setSuccessMsg('Slot booked successfully!');
      setSelectedSlotId(null);
      setSelectedChapter(null);
      setSlokaCount('');
      setAddSecondChapter(false);
      setSelectedChapter2(null);
      setSlokaCount2('');
      await fetchData();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to book slot.');
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    clearMessages();
    try {
      setCancelling(bookingId);
      await api.post('/student/cancel', { bookingId });
      setSuccessMsg('Booking cancelled successfully.');
      await fetchData();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(null);
    }
  };

  const renderChapterDropdown = (
    visible: boolean,
    setVisible: (v: boolean) => void,
    selected: Chapter | null,
    onSelect: (c: Chapter) => void,
  ) => (
    <View>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(!visible)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownButtonText, !selected && styles.dropdownPlaceholder]}>
          {selected
            ? `Ch ${selected.chapterNumber} - ${selected.chapterName}`
            : 'Select a chapter'}
        </Text>
        <Text style={styles.dropdownArrow}>{visible ? '\u25B2' : '\u25BC'}</Text>
      </TouchableOpacity>
      {visible && (
        <View style={styles.dropdownList}>
          {(data?.chapters || []).map((ch) => (
            <TouchableOpacity
              key={ch.id}
              style={[
                styles.dropdownItem,
                selected?.id === ch.id && styles.dropdownItemSelected,
              ]}
              onPress={() => {
                onSelect(ch);
                setVisible(false);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  selected?.id === ch.id && styles.dropdownItemTextSelected,
                ]}
              >
                Ch {ch.chapterNumber} - {ch.chapterName}
              </Text>
              <Text style={styles.dropdownItemSub}>
                {ch.allowedSlokas ?? ch.totalSlokas} slokas
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.page}>
        <TopNavbar
          title="Book Test Slot"
          actions={[
            { label: 'Back', onPress: () => navigation.goBack() },
            { label: 'Logout', onPress: logout, variant: 'logout' },
          ]}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading slots...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Book Test Slot"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Date badge */}
        {data?.formattedDate && (
          <View style={styles.dateBadgeContainer}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeLabel}>Next Sunday</Text>
              <Text style={styles.dateBadgeValue}>{data.formattedDate}</Text>
            </View>
          </View>
        )}

        {/* Alerts */}
        {error !== '' && <AlertBox type="error" message={error} />}
        {successMsg !== '' && <AlertBox type="success" message={successMsg} />}

        {!data?.slotEligible && (
          <AlertBox
            type="warning"
            message="You are not eligible to book a slot at this time. Please contact your teacher for more information."
          />
        )}

        {data?.slotEligible && !data?.bookingAllowed && (
          <AlertBox
            type="info"
            message="Booking window has closed for this week. Please try again next week before the cutoff time."
          />
        )}

        {/* Booking form - only if eligible and allowed */}
        {data?.slotEligible && data?.bookingAllowed && (
          <ContentCard title="Book a Slot" headerVariant="orange">
            {/* Slot selection */}
            <Text style={styles.fieldLabel}>Select Time Slot</Text>
            <View style={styles.slotGrid}>
              {(data.slots || []).map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                const isUnavailable = slot.availableCount <= 0;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotCard,
                      isSelected && styles.slotCardSelected,
                      isUnavailable && styles.slotCardDisabled,
                    ]}
                    onPress={() => {
                      if (!isUnavailable) {
                        setSelectedSlotId(slot.id);
                        clearMessages();
                      }
                    }}
                    activeOpacity={isUnavailable ? 1 : 0.7}
                    disabled={isUnavailable}
                  >
                    <Text
                      style={[
                        styles.slotCardName,
                        isSelected && styles.slotCardNameSelected,
                        isUnavailable && styles.slotCardTextDisabled,
                      ]}
                    >
                      {slot.name}
                    </Text>
                    <Text
                      style={[
                        styles.slotCardDuration,
                        isSelected && styles.slotCardDurationSelected,
                        isUnavailable && styles.slotCardTextDisabled,
                      ]}
                    >
                      {slot.duration}
                    </Text>
                    <View
                      style={[
                        styles.slotCountBadge,
                        isUnavailable && styles.slotCountBadgeUnavailable,
                        isSelected && styles.slotCountBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotCountText,
                          isUnavailable && styles.slotCountTextUnavailable,
                          isSelected && styles.slotCountTextSelected,
                        ]}
                      >
                        {isUnavailable ? 'Full' : `${slot.availableCount} available`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Chapter selection */}
            <Text style={styles.fieldLabel}>Select Chapter</Text>
            {renderChapterDropdown(
              chapterDropdownVisible,
              setChapterDropdownVisible,
              selectedChapter,
              (ch) => {
                setSelectedChapter(ch);
                clearMessages();
              },
            )}

            {/* Sloka count */}
            <Text style={styles.fieldLabel}>Number of Slokas</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter sloka count"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={slokaCount}
              onChangeText={(val) => {
                setSlokaCount(val.replace(/[^0-9]/g, ''));
                clearMessages();
              }}
            />
            {selectedChapter && (
              <Text style={styles.fieldHint}>
                Max: {selectedChapter.allowedSlokas ?? selectedChapter.totalSlokas} slokas for Ch{' '}
                {selectedChapter.chapterNumber}
              </Text>
            )}

            {/* Second chapter toggle */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                setAddSecondChapter(!addSecondChapter);
                if (addSecondChapter) {
                  setSelectedChapter2(null);
                  setSlokaCount2('');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, addSecondChapter && styles.checkboxChecked]}>
                {addSecondChapter && <Text style={styles.checkmark}>{'\u2713'}</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Add second chapter</Text>
            </TouchableOpacity>

            {addSecondChapter && (
              <View style={styles.secondChapterContainer}>
                <Text style={styles.fieldLabel}>Select Second Chapter</Text>
                {renderChapterDropdown(
                  chapter2DropdownVisible,
                  setChapter2DropdownVisible,
                  selectedChapter2,
                  (ch) => {
                    setSelectedChapter2(ch);
                    clearMessages();
                  },
                )}

                <Text style={styles.fieldLabel}>Number of Slokas (Chapter 2)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter sloka count"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={slokaCount2}
                  onChangeText={(val) => {
                    setSlokaCount2(val.replace(/[^0-9]/g, ''));
                    clearMessages();
                  }}
                />
                {selectedChapter2 && (
                  <Text style={styles.fieldHint}>
                    Max: {selectedChapter2.allowedSlokas ?? selectedChapter2.totalSlokas} slokas for
                    Ch {selectedChapter2.chapterNumber}
                  </Text>
                )}
              </View>
            )}

            {/* Book button */}
            <TouchableOpacity
              style={[styles.bookButton, booking && styles.bookButtonDisabled]}
              onPress={handleBook}
              activeOpacity={0.8}
              disabled={booking}
            >
              {booking ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.bookButtonText}>Book Slot</Text>
              )}
            </TouchableOpacity>
          </ContentCard>
        )}

        {/* Existing bookings */}
        {data && data.existingBookings.length > 0 && (
          <ContentCard
            title="Your Bookings"
            headerVariant="navy"
            rightLabel={`${data.existingBookingsCount}`}
          >
            {data.existingBookings.map((bk) => (
              <View
                key={bk.id}
                style={[styles.bookingRow, bk.cancelled && styles.bookingRowCancelled]}
              >
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingSlot}>{bk.slotName}</Text>
                  <Text style={styles.bookingDetail}>
                    Ch {bk.chapterNumber} - {bk.chapterName}
                  </Text>
                  <Text style={styles.bookingDetail}>
                    {bk.slokaCount} sloka{bk.slokaCount !== 1 ? 's' : ''} &middot; {bk.date}
                  </Text>
                  {bk.cancelled && (
                    <View style={styles.cancelledBadge}>
                      <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                    </View>
                  )}
                </View>
                {!bk.cancelled && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancel(bk.id)}
                    activeOpacity={0.7}
                    disabled={cancelling === bk.id}
                  >
                    {cancelling === bk.id ? (
                      <ActivityIndicator size="small" color={colors.errorText} />
                    ) : (
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ContentCard>
        )}

        <Footer />
      </ScrollView>
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
    color: colors.textMuted,
    fontSize: 14,
    ...fonts.medium,
  },

  // Date badge
  dateBadgeContainer: {
    alignItems: 'center',
  },
  dateBadge: {
    backgroundColor: colors.navy,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  dateBadgeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    ...fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateBadgeValue: {
    color: colors.white,
    fontSize: 18,
    ...fonts.bold,
    marginTop: 2,
  },

  // Field labels
  fieldLabel: {
    fontSize: 14,
    color: colors.textDark,
    ...fonts.semiBold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.regular,
    marginTop: 4,
  },

  // Slot grid
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  slotCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.orangeBg,
  },
  slotCardDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  slotCardName: {
    fontSize: 15,
    color: colors.textDark,
    ...fonts.bold,
  },
  slotCardNameSelected: {
    color: colors.primary,
  },
  slotCardDuration: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.regular,
    marginTop: 2,
  },
  slotCardDurationSelected: {
    color: colors.primaryDark,
  },
  slotCardTextDisabled: {
    color: '#bdbdbd',
  },
  slotCountBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.greenBg,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
  },
  slotCountBadgeUnavailable: {
    backgroundColor: colors.errorBg,
  },
  slotCountBadgeSelected: {
    backgroundColor: colors.orangeLight,
  },
  slotCountText: {
    fontSize: 11,
    color: colors.green,
    ...fonts.semiBold,
  },
  slotCountTextUnavailable: {
    color: colors.errorText,
  },
  slotCountTextSelected: {
    color: colors.primaryDark,
  },

  // Chapter dropdown
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: colors.textDark,
    ...fonts.medium,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: colors.textMuted,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  dropdownList: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderTopWidth: 0,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    maxHeight: 240,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownItemSelected: {
    backgroundColor: colors.orangeBg,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.textDark,
    ...fonts.medium,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    ...fonts.semiBold,
  },
  dropdownItemSub: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.regular,
    marginLeft: spacing.sm,
  },

  // Text input
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.textDark,
    ...fonts.medium,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    ...fonts.bold,
    marginTop: -1,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.textDark,
    ...fonts.medium,
  },

  // Second chapter
  secondChapterContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },

  // Book button
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...shadows.card,
  },
  bookButtonDisabled: {
    opacity: 0.7,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 16,
    ...fonts.bold,
  },

  // Existing bookings
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  bookingRowCancelled: {
    opacity: 0.55,
  },
  bookingInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  bookingSlot: {
    fontSize: 15,
    color: colors.textDark,
    ...fonts.bold,
  },
  bookingDetail: {
    fontSize: 13,
    color: colors.textMuted,
    ...fonts.regular,
    marginTop: 2,
  },
  cancelledBadge: {
    backgroundColor: colors.errorBg,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  cancelledBadgeText: {
    color: colors.errorText,
    fontSize: 11,
    ...fonts.semiBold,
  },
  cancelButton: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.errorText,
    fontSize: 13,
    ...fonts.semiBold,
  },
});
