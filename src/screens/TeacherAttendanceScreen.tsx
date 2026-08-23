import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { TopNavbar, ContentCard, AlertBox, Footer, StatCard } from '../components';
import { colors, shadows, borderRadius, fonts, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import type { TeacherAttendanceResponse } from '../features/teacher/attendance/models';
import {
  buildTeacherAttendanceRequest,
  getTeacherAttendance,
  saveTeacherAttendance,
} from '../features/teacher/attendance/service';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

function getSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getDayAbbr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getDay()];
}

export default function TeacherAttendanceScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const [groupId, setGroupId] = useState<string>(user?.groupId || '');
  const [groupInputValue, setGroupInputValue] = useState<string>(user?.groupId || '');
  const [weekStart, setWeekStart] = useState<string>(formatDateISO(getSunday(new Date())));
  const [data, setData] = useState<TeacherAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Local state for attendance checkboxes: key = "YYYY-MM-DD|studentVid" -> boolean
  const [presentState, setPresentState] = useState<Record<string, boolean>>({});
  // Local state for no-class toggles: key = "YYYY-MM-DD" -> boolean
  const [noClassState, setNoClassState] = useState<Record<string, boolean>>({});

  const fetchAttendance = useCallback(async (
    gId: string,
    ws: string,
    refresh = false,
    preserveAlert = false,
  ) => {
    if (!gId.trim()) {
      setAlert({ type: 'info', message: 'Please enter a Group ID and press Load.' });
      return;
    }
    refresh ? setRefreshing(true) : setLoading(true);
    setLoadFailed(false);
    if (!preserveAlert) setAlert(null);
    try {
      const d = await getTeacherAttendance({ groupId: gId.trim(), ...(ws ? { weekStart: ws } : {}) });
      setData(d);

      // Initialize local state from server data
      setPresentState(d.presentMap || {});
      setNoClassState(d.noClassMap || {});

      if (d.students.length === 0) {
        setAlert({ type: 'info', message: 'No students found for this group/week.' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to load attendance data.';
      setAlert({ type: 'error', message: msg });
      setLoadFailed(true);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-load when group and weekStart are ready (initial load)
  useEffect(() => {
    if (groupId.trim()) {
      fetchAttendance(groupId, weekStart);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoad = () => {
    const gId = groupInputValue.trim();
    if (!gId) {
      setAlert({ type: 'error', message: 'Please enter a Group ID.' });
      return;
    }
    setGroupId(gId);
    fetchAttendance(gId, weekStart);
  };

  const handlePrevWeek = () => {
    const current = new Date(weekStart + 'T00:00:00');
    current.setDate(current.getDate() - 7);
    const newWs = formatDateISO(current);
    setWeekStart(newWs);
    if (groupId.trim()) fetchAttendance(groupId, newWs);
  };

  const handleNextWeek = () => {
    const current = new Date(weekStart + 'T00:00:00');
    current.setDate(current.getDate() + 7);
    const newWs = formatDateISO(current);
    setWeekStart(newWs);
    if (groupId.trim()) fetchAttendance(groupId, newWs);
  };

  const togglePresent = (dateStr: string, studentVid: string) => {
    const key = `${dateStr}|${studentVid}`;
    setPresentState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleNoClass = (dateStr: string) => {
    const markedNoClass = !noClassState[dateStr];
    setNoClassState((prev) => ({ ...prev, [dateStr]: markedNoClass }));
    if (markedNoClass) {
      setPresentState((current) => Object.fromEntries(
        Object.entries(current).filter(([key]) => !key.startsWith(`${dateStr}|`)),
      ));
    }
  };

  const markAll = (dateStr: string, markedPresent: boolean) => {
    if (!data || isDateDisabled(dateStr) || noClassState[dateStr]) return;
    setPresentState((current) => {
      const updated = { ...current };
      data.students.forEach((student) => {
        updated[`${dateStr}|${student.volunteerId}`] = markedPresent;
      });
      return updated;
    });
  };

  const attendanceSummary = (dateStr: string) => {
    if (!data || noClassState[dateStr]) return { presentCount: 0, absentCount: 0 };
    const presentCount = data.students.reduce(
      (count, student) => count + (presentState[`${dateStr}|${student.volunteerId}`] ? 1 : 0),
      0,
    );
    return { presentCount, absentCount: data.students.length - presentCount };
  };

  const handleSave = async () => {
    if (!data || !groupId.trim()) return;

    setSaving(true);
    setAlert(null);

    try {
      const request = buildTeacherAttendanceRequest(
        groupId.trim(), data.weekStart, presentState, noClassState,
      );
      const response = await saveTeacherAttendance(request);

      // Refresh data
      setAlert({ type: 'success', message: response.message });
      await fetchAttendance(groupId, weekStart, false, true);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to save attendance.';
      setAlert({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const isDateDisabled = (dateStr: string): boolean => {
    if (!data) return true;
    const today = data.today;
    if (dateStr > today) return true;
    if (data.groupStartDate && dateStr < data.groupStartDate) return true;
    if (data.groupEndDate && dateStr > data.groupEndDate) return true;
    return false;
  };

  const weekDates = data?.weekDates || [];
  const students = data?.students || [];
  const dateLabels = data?.dateLabels || {};
  const todaySummary = data ? attendanceSummary(data.today) : { presentCount: 0, absentCount: 0 };
  const todayInSelectedWeek = data?.weekDates.includes(data.today) ?? false;
  const markedPresent = data?.weekDates.reduce(
    (total, date) => total + attendanceSummary(date).presentCount,
    0,
  ) ?? 0;

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Record Attendance"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          if (groupId.trim()) void fetchAttendance(groupId, weekStart, true);
        }} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {alert && <AlertBox type={alert.type} message={alert.message} />}
        {loadFailed && groupId.trim() ? (
          <TouchableOpacity style={styles.retryBtn} onPress={() => void fetchAttendance(groupId, weekStart)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        ) : null}

        {/* Group Selector */}
        <ContentCard title="Select Group" headerVariant="navy">
          <View style={styles.groupRow}>
            <TextInput
              style={styles.groupInput}
              value={groupInputValue}
              onChangeText={setGroupInputValue}
              placeholder="Enter Group ID"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.loadBtn} onPress={handleLoad} disabled={loading}>
              <Text style={styles.loadBtnText}>{loading ? 'Loading...' : 'Load'}</Text>
            </TouchableOpacity>
          </View>

          {/* Show available groups if returned by API */}
          {data?.groups && data.groups.length > 0 && (
            <View style={styles.groupChipsContainer}>
              <Text style={styles.groupChipsLabel}>Available groups:</Text>
              <View style={styles.groupChips}>
                {data.groups.map((gid) => (
                  <TouchableOpacity
                    key={gid}
                    style={[
                      styles.groupChip,
                      gid === groupId && styles.groupChipActive,
                    ]}
                    onPress={() => {
                      setGroupInputValue(gid);
                      setGroupId(gid);
                      fetchAttendance(gid, weekStart);
                    }}
                  >
                    <Text
                      style={[
                        styles.groupChipText,
                        gid === groupId && styles.groupChipTextActive,
                      ]}
                    >
                      {gid}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ContentCard>

        {/* Week Navigation */}
        <ContentCard title="Week" headerVariant="orange" rightLabel={groupId || 'No Group'}>
          <View style={styles.weekNav}>
            <TouchableOpacity style={styles.weekBtn} onPress={handlePrevWeek} disabled={loading}>
              <Text style={styles.weekBtnText}>{'< Prev Week'}</Text>
            </TouchableOpacity>
            <View style={styles.weekRange}>
              <Text style={styles.weekRangeText}>
                {data ? `${formatDateDisplay(data.weekStart)} - ${formatDateDisplay(data.weekEnd)}` : weekStart}
              </Text>
            </View>
            <TouchableOpacity style={styles.weekBtn} onPress={handleNextWeek} disabled={loading}>
              <Text style={styles.weekBtnText}>{'Next Week >'}</Text>
            </TouchableOpacity>
          </View>
        </ContentCard>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading attendance data...</Text>
          </View>
        )}

        {!loading && data && students.length > 0 && (
          <ContentCard title="Attendance Summary" headerVariant="navy">
            <View style={styles.summaryGrid}>
              <StatCard value={students.length} label="Students" iconLabel="👥" iconBg={colors.blueBg} iconColor={colors.blue} />
              <StatCard value={todayInSelectedWeek ? todaySummary.presentCount : '—'} label="Present Today" iconLabel="✓" iconBg={colors.greenBg} iconColor={colors.green} />
              <StatCard value={markedPresent} label="Present Marks This Week" iconLabel="📋" iconBg={colors.orangeBg} iconColor={colors.primary} />
            </View>
          </ContentCard>
        )}

        {/* Attendance Grid */}
        {!loading && data && students.length > 0 && (
          <ContentCard title="Attendance Grid" headerVariant="navy" rightLabel={`${students.length} students`}>
            {/* No-class toggles row */}
            <Text style={styles.sectionLabel}>Mark "No Class" for dates:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noClassRow}>
              {weekDates.map((dateStr) => {
                const disabled = isDateDisabled(dateStr);
                const isNoClass = noClassState[dateStr] || false;
                return (
                  <TouchableOpacity
                    key={`nc-${dateStr}`}
                    style={[
                      styles.noClassChip,
                      isNoClass && styles.noClassChipActive,
                      disabled && styles.chipDisabled,
                    ]}
                    onPress={() => !disabled && toggleNoClass(dateStr)}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        styles.noClassChipText,
                        isNoClass && styles.noClassChipTextActive,
                        disabled && styles.chipTextDisabled,
                      ]}
                    >
                      {getDayAbbr(dateStr)} {dateStr.slice(8)}
                    </Text>
                    {isNoClass && <Text style={styles.noClassBadge}>NC</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Attendance table */}
            <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableScroll}>
              <View>
                {/* Header Row */}
                <View style={styles.tableRow}>
                  <View style={styles.studentNameCell}>
                    <Text style={styles.tableHeaderText}>Student</Text>
                  </View>
                  {weekDates.map((dateStr) => (
                    <View key={`hdr-${dateStr}`} style={styles.dateCell}>
                      <Text style={styles.dateHeaderDay}>{getDayAbbr(dateStr)}</Text>
                      <Text style={styles.dateHeaderDate}>{dateLabels[dateStr] ?? dateStr.slice(5)}</Text>
                      {!noClassState[dateStr] ? (
                        <Text style={styles.dateSummary}>{attendanceSummary(dateStr).presentCount} P · {attendanceSummary(dateStr).absentCount} A</Text>
                      ) : <Text style={styles.dateSummary}>No Class</Text>}
                      {!isDateDisabled(dateStr) && !noClassState[dateStr] ? (
                        <View style={styles.markAllRow}>
                          <TouchableOpacity style={styles.markAllButton} onPress={() => markAll(dateStr, true)}>
                            <Text style={styles.markAllText}>All P</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.markAllButton} onPress={() => markAll(dateStr, false)}>
                            <Text style={styles.markAllText}>All A</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>

                {/* Student Rows */}
                {students.map((student, idx) => (
                  <View
                    key={student.volunteerId}
                    style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
                  >
                    <View style={styles.studentNameCell}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {student.name}
                      </Text>
                      <Text style={styles.studentVid}>{student.volunteerId}</Text>
                    </View>
                    {weekDates.map((dateStr) => {
                      const key = `${dateStr}|${student.volunteerId}`;
                      const disabled = isDateDisabled(dateStr) || (noClassState[dateStr] || false);
                      const isPresent = presentState[key] || false;
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.checkboxCell,
                            disabled && styles.checkboxCellDisabled,
                          ]}
                          onPress={() => !disabled && togglePresent(dateStr, student.volunteerId)}
                          disabled={disabled}
                          activeOpacity={0.6}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              isPresent && styles.checkboxChecked,
                              disabled && styles.checkboxDisabled,
                            ]}
                          >
                            {isPresent && <Text style={styles.checkmark}>{'✓'}</Text>}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.saveGuidance}>Future dates and dates outside the active group period are locked.</Text>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Saving...' : 'Save Attendance'}
              </Text>
            </TouchableOpacity>
          </ContentCard>
        )}

        {/* No data state */}
        {!loading && data && students.length === 0 && (
          <ContentCard title="Attendance" headerVariant="navy">
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No students found for this group and week.</Text>
              <Text style={styles.emptySubtext}>
                The group may be inactive or have no enrolled students.
              </Text>
            </View>
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

  // Group selector
  groupRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  groupInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textDark,
    backgroundColor: colors.white,
    ...fonts.medium,
  },
  loadBtn: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  loadBtnText: {
    color: '#fff',
    fontSize: 14,
    ...fonts.bold,
  },
  retryBtn: {
    alignSelf: 'center',
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryBtnText: {
    color: colors.white,
    fontSize: 14,
    ...fonts.bold,
  },
  groupChipsContainer: {
    marginTop: spacing.md,
  },
  groupChipsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.medium,
    marginBottom: spacing.xs,
  },
  groupChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  groupChip: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  groupChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  groupChipText: {
    fontSize: 13,
    color: colors.textBody,
    ...fonts.semiBold,
  },
  groupChipTextActive: {
    color: '#fff',
  },

  // Week navigation
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  weekBtn: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  weekBtnText: {
    color: '#fff',
    fontSize: 12,
    ...fonts.bold,
  },
  weekRange: {
    flex: 1,
    alignItems: 'center',
  },
  weekRangeText: {
    fontSize: 13,
    color: colors.textDark,
    ...fonts.semiBold,
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.medium,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  // Section label
  sectionLabel: {
    fontSize: 13,
    color: colors.textBody,
    ...fonts.semiBold,
    marginBottom: spacing.sm,
  },

  // No-class row
  noClassRow: {
    marginBottom: spacing.md,
  },
  noClassChip: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noClassChipActive: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  noClassChipText: {
    fontSize: 12,
    color: colors.textBody,
    ...fonts.medium,
  },
  noClassChipTextActive: {
    color: colors.errorText,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipTextDisabled: {
    color: colors.textMuted,
  },
  noClassBadge: {
    fontSize: 10,
    color: colors.errorText,
    ...fonts.bold,
    backgroundColor: colors.errorBorder,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: 'hidden',
  },

  // Table
  tableScroll: {
    marginBottom: spacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tableRowAlt: {
    backgroundColor: colors.cream,
  },
  studentNameCell: {
    width: 140,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  tableHeaderText: {
    fontSize: 13,
    color: colors.navy,
    ...fonts.bold,
  },
  studentName: {
    fontSize: 13,
    color: colors.textDark,
    ...fonts.semiBold,
  },
  studentVid: {
    fontSize: 10,
    color: colors.textMuted,
    ...fonts.regular,
    marginTop: 2,
  },
  dateCell: {
    width: 84,
    alignItems: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  dateHeaderDay: {
    fontSize: 11,
    color: colors.navy,
    ...fonts.bold,
  },
  dateHeaderDate: {
    fontSize: 10,
    color: colors.textMuted,
    ...fonts.medium,
    textAlign: 'center',
  },
  dateSummary: {
    fontSize: 9,
    color: colors.textBody,
    ...fonts.semiBold,
    marginTop: 3,
  },
  markAllRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  markAllButton: {
    backgroundColor: colors.blueBg,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  markAllText: {
    color: colors.blue,
    fontSize: 8,
    ...fonts.bold,
  },
  checkboxCell: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  checkboxCellDisabled: {
    backgroundColor: '#f0ece8',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkboxDisabled: {
    backgroundColor: '#e8e0d8',
    borderColor: '#d0c8c0',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    ...fonts.bold,
  },

  // Save button
  saveGuidance: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.card,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    ...fonts.bold,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textBody,
    ...fonts.semiBold,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    ...fonts.regular,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
