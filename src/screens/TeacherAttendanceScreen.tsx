import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { TopNavbar, ContentCard, AlertBox, Footer } from '../components';
import { colors, shadows, borderRadius, fonts, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

interface StudentInfo {
  volunteerId: string;
  name: string;
}

interface AttendanceData {
  volunteerId: string;
  teacherName: string;
  groupId: string | null;
  groups: string[];
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
  weekDates: string[];
  dateLabels: Record<string, string>; // "YYYY-MM-DD" -> "dd MMM yyyy"
  students: StudentInfo[];
  presentMap: Record<string, boolean>; // "YYYY-MM-DD|studentVid" -> true/false
  noClassMap: Record<string, boolean>; // "YYYY-MM-DD" -> true
  groupStartDate: string | null;
  groupEndDate: string | null;
  today: string;
}

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
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Local state for attendance checkboxes: key = "YYYY-MM-DD|studentVid" -> boolean
  const [presentState, setPresentState] = useState<Record<string, boolean>>({});
  // Local state for no-class toggles: key = "YYYY-MM-DD" -> boolean
  const [noClassState, setNoClassState] = useState<Record<string, boolean>>({});

  const fetchAttendance = useCallback(async (gId: string, ws: string) => {
    if (!gId.trim()) {
      setAlert({ type: 'info', message: 'Please enter a Group ID and press Load.' });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      const params: Record<string, string> = { groupId: gId.trim() };
      if (ws) params.weekStart = ws;
      const res = await api.get('/teacher/attendance', { params });
      const d: AttendanceData = res.data;
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
      setData(null);
    } finally {
      setLoading(false);
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
    setNoClassState((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const handleSave = async () => {
    if (!data || !groupId.trim()) return;

    setSaving(true);
    setAlert(null);

    try {
      // Build attendance list: only entries marked as present
      const attendance: { date: string; studentVid: string }[] = [];
      for (const [key, isPresent] of Object.entries(presentState)) {
        if (isPresent) {
          const [date, studentVid] = key.split('|');
          if (date && studentVid) {
            attendance.push({ date, studentVid });
          }
        }
      }

      // Build noClassDates list
      const noClassDates: string[] = [];
      for (const [dateStr, isNoClass] of Object.entries(noClassState)) {
        if (isNoClass) {
          noClassDates.push(dateStr);
        }
      }

      await api.post('/teacher/attendance/save', {
        groupId: groupId.trim(),
        weekStart: data.weekStart,
        attendance,
        noClassDates,
      });

      setAlert({ type: 'success', message: 'Attendance saved successfully!' });

      // Refresh data
      fetchAttendance(groupId, weekStart);
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

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Record Attendance"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {alert && <AlertBox type={alert.type} message={alert.message} />}

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
                      <Text style={styles.dateHeaderDate}>{dateStr.slice(5)}</Text>
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
    width: 60,
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
  },
  checkboxCell: {
    width: 60,
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
