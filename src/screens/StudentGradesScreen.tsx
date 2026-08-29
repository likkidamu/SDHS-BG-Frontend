import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import type { StudentScreenProps } from '../navigation/types';
import { ContentCard, Footer, GradeBadge, TopNavbar } from '../components';
import { useAuth } from '../context/AuthContext';
import {
  enrollmentProgram, enrollmentStatus, type LearningEnrollment, type ProgramType,
} from '../features/enrollment/models';
import { useSelectedEnrollment } from '../features/enrollment/SelectedEnrollmentContext';
import { getLearningEnrollments } from '../features/enrollment/service';
import type { StudentGrade, StudentGradesResponse } from '../features/student/examHistory/models';
import { getStudentExamHistory } from '../features/student/examHistory/service';
import { borderRadius, colors, fonts, spacing } from '../theme';
import { getApiErrorMessage } from '../utils/apiError';

type Props = StudentScreenProps<'StudentGrades'>;

const PROGRAM_LABELS: Record<ProgramType, string> = {
  MEMORIZATION: 'Memorization', REVISION: 'Revision', FLUENT: 'Fluent Reading',
};

function getEnrollmentId(enrollment: LearningEnrollment) {
  return enrollment.enrollmentId ?? enrollment.id;
}

function isUnavailableEnrollmentError(error: any) {
  return error.response?.status === 403
    && error.response?.data?.error === 'The selected learning enrollment is unavailable.';
}

function isSupplementalChapter(name?: string) {
  return name === 'Dhyana Slokas' || name === 'Gita Mahatyam';
}

function chapterLabel(grade: StudentGrade, prefix: 'Chapter' | 'Ch' = 'Chapter') {
  if (isSupplementalChapter(grade.chapterName)) return grade.chapterName ?? '';
  return `${prefix} ${grade.chapterNumber ?? '-'}${
    grade.chapterName ? ` — ${grade.chapterName}` : ''
  }`;
}

export default function StudentGradesScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const { selectedEnrollment, clearSelectedEnrollment } = useSelectedEnrollment();
  const [data, setData] = useState<StudentGradesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [expandedGrade, setExpandedGrade] = useState<number | null>(null);

  const returnToMyLearning = useCallback(() => {
    clearSelectedEnrollment();
    navigation.replace('MyLearning');
  }, [clearSelectedEnrollment, navigation]);

  const fetchGrades = useCallback(async () => {
    if (!selectedEnrollment) {
      navigation.replace('MyLearning');
      return;
    }
    setError('');
    try {
      const selectedId = getEnrollmentId(selectedEnrollment);
      const enrollments = await getLearningEnrollments();
      const current = enrollments.find((item) => getEnrollmentId(item) === selectedId);
      if (!current || enrollmentStatus(current) !== 'ACTIVE') {
        returnToMyLearning();
        return;
      }
      setData(await getStudentExamHistory(selectedId));
    } catch (e: any) {
      if (isUnavailableEnrollmentError(e)) {
        returnToMyLearning();
        return;
      }
      setError(getApiErrorMessage(e, 'Failed to load grade history.'));
    }
  }, [navigation, returnToMyLearning, selectedEnrollment]);

  useEffect(() => {
    void fetchGrades().finally(() => setLoading(false));
  }, [fetchGrades]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGrades();
    setRefreshing(false);
  }, [fetchGrades]);

  const dates = useMemo(() => [...new Set(
    (data?.grades ?? []).map((grade) => grade.date)
      .filter((date): date is string => Boolean(date)),
  )].sort((a, b) => b.localeCompare(a)), [data?.grades]);

  const chapters = useMemo(() => [...new Map(
    (data?.grades ?? []).filter((grade) => grade.chapterNumber !== undefined)
      .map((grade) => [String(grade.chapterNumber), chapterLabel(grade)]),
  ).entries()].sort(([a], [b]) => Number(a) - Number(b)), [data?.grades]);

  const grades = useMemo(() => [...(data?.grades ?? [])]
    .filter((grade) => (selectedDate === '' || grade.date === selectedDate)
      && (selectedChapter === '' || String(grade.chapterNumber) === selectedChapter))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.id - a.id),
  [data?.grades, selectedChapter, selectedDate]);

  const selectedProgram = selectedEnrollment ? enrollmentProgram(selectedEnrollment) : null;
  const selectedGroup = selectedEnrollment?.groupName?.trim() || selectedEnrollment?.groupId?.trim();
  const selectedTeacher = selectedEnrollment?.teacherName?.trim();
  const selectedCenter = selectedEnrollment?.centerName?.trim();

  const clearFilters = () => {
    setSelectedDate('');
    setSelectedChapter('');
    setExpandedGrade(null);
  };

  const renderFilter = (
    label: string,
    options: Array<[string, string]>,
    selected: string,
    select: (value: string) => void,
  ) => (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterOptions}>
          {[['', label === 'Exam date' ? 'All dates' : 'All chapters'], ...options].map(
            ([value, optionLabel]) => (
              <TouchableOpacity
                key={value || 'all'}
                style={[styles.filterChip, selected === value && styles.filterChipSelected]}
                onPress={() => {
                  select(value);
                  setExpandedGrade(null);
                }}
              >
                <Text style={[
                  styles.filterChipText,
                  selected === value && styles.filterChipTextSelected,
                ]}>
                  {optionLabel}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </ScrollView>
    </View>
  );

  const renderGrade = (grade: StudentGrade) => {
    const expanded = expandedGrade === grade.id;
    return (
      <View key={grade.id} style={[styles.gradeCard, grade.cancelled && styles.cancelledCard]}>
        <View style={styles.gradeHeader}>
          <View style={styles.gradeHeaderText}>
            <Text style={styles.gradeDate}>{grade.formattedDate ?? grade.date ?? '-'}</Text>
            {grade.cancelled ? <View style={styles.cancelledBadge}>
              <Text style={styles.cancelledBadgeText}>Cancelled</Text>
            </View> : null}
          </View>
          <Text style={styles.chapterTitle}>{chapterLabel(grade, 'Ch')}</Text>
        </View>
        <View style={styles.resultGrid}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Sloka Range</Text>
            <Text style={styles.resultValue}>{grade.slokaCount ?? '-'}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Memorization</Text>
            <GradeBadge grade={grade.memorizationGrade} />
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Pronunciation</Text>
            <GradeBadge grade={grade.pronunciationGrade} />
          </View>
        </View>
        <View style={styles.teacherRow}>
          <Text style={styles.resultLabel}>Teacher</Text>
          <Text style={styles.teacherName}>{grade.assignedTeacherName ?? '-'}</Text>
        </View>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => setExpandedGrade(expanded ? null : grade.id)}
        >
          <Text style={[styles.detailsButtonText, grade.teacherComment && styles.detailsAvailable]}>
            {grade.teacherComment ? '●' : '○'} {expanded ? 'Hide' : 'Details'}
          </Text>
        </TouchableOpacity>
        {expanded ? <View style={styles.expandedDetails}>
          <View style={styles.expandedItem}>
            <Text style={styles.resultLabel}>Teacher remarks</Text>
            <Text style={styles.expandedValue}>
              {grade.teacherComment ?? 'No remarks provided.'}
            </Text>
          </View>
          <View style={styles.expandedItem}>
            <Text style={styles.resultLabel}>Exam slot</Text>
            <Text style={styles.expandedValue}>{grade.slotName ?? '-'}</Text>
          </View>
        </View> : null}
      </View>
    );
  };

  return <View style={styles.page}>
    <TopNavbar title="Exam History" actions={[
      { label: 'Back', onPress: () => navigation.goBack() },
      { label: 'Refresh', onPress: () => void refresh() },
      { label: 'Logout', onPress: logout, variant: 'logout' },
    ]} />
    <ScrollView contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      {selectedProgram ? <ContentCard title="Current Learning">
        <Text style={styles.currentProgram}>{PROGRAM_LABELS[selectedProgram]}</Text>
        {selectedGroup ? <View style={styles.currentDetail}><Text style={styles.currentDetailLabel}>Group</Text><Text style={styles.currentDetailValue}>{selectedGroup}</Text></View> : null}
        {selectedTeacher ? <View style={styles.currentDetail}><Text style={styles.currentDetailLabel}>Teacher</Text><Text style={styles.currentDetailValue}>{selectedTeacher}</Text></View> : null}
        {selectedCenter ? <View style={styles.currentDetail}><Text style={styles.currentDetailLabel}>Center</Text><Text style={styles.currentDetailValue}>{selectedCenter}</Text></View> : null}
      </ContentCard> : null}
      {loading ? <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.loadingText}>Loading grades...</Text>
      </View> : error ? <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void fetchGrades()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View> : data ? <ContentCard title="Exam Results"
        rightLabel={`${grades.length} of ${data.grades.length}`}>
        {data.grades.length === 0 ? <Text style={styles.emptyText}>
          No exam results yet. After you attend a booked examination and your teacher submits grades, the results will appear here.
        </Text> : <>
          <View style={styles.filters}>
            {renderFilter('Exam date', dates.map((date) => [date, date]), selectedDate, setSelectedDate)}
            {renderFilter('Chapter', chapters, selectedChapter, setSelectedChapter)}
            {selectedDate !== '' || selectedChapter !== '' ?
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear filters</Text>
              </TouchableOpacity> : null}
          </View>
          {grades.length === 0
            ? <Text style={styles.emptyText}>No results match the selected filters.</Text>
            : grades.map(renderGrade)}
        </>}
      </ContentCard> : null}
      <Footer />
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: spacing.md, fontSize: 14, color: colors.textMuted, ...fonts.medium },
  errorContainer: { alignItems: 'center', gap: spacing.md, backgroundColor: colors.errorBg,
    borderWidth: 1, borderColor: colors.errorBorder, borderRadius: borderRadius.md, padding: spacing.lg },
  errorText: { color: colors.errorText, fontSize: 14, ...fonts.medium, textAlign: 'center' },
  retryButton: { backgroundColor: colors.navy, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryButtonText: { color: colors.white, ...fonts.bold },
  currentProgram: { color: colors.primary, fontSize: 15, marginBottom: spacing.sm, ...fonts.bold },
  currentDetail: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md,
    paddingVertical: spacing.xs },
  currentDetailLabel: { color: colors.textMuted, fontSize: 13 },
  currentDetailValue: { color: colors.textDark, fontSize: 13, textAlign: 'right', ...fonts.semiBold },
  filters: { gap: spacing.md, marginHorizontal: -spacing.md, marginTop: -spacing.md,
    marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.bg,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  filterGroup: { gap: spacing.xs },
  filterLabel: { color: colors.textMuted, fontSize: 11, letterSpacing: 0.4,
    textTransform: 'uppercase', ...fonts.bold },
  filterOptions: { flexDirection: 'row', gap: spacing.xs },
  filterChip: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.white },
  filterChipSelected: { borderColor: colors.primary, backgroundColor: colors.orangeBg },
  filterChipText: { color: colors.textBody, fontSize: 12, ...fonts.medium },
  filterChipTextSelected: { color: colors.primary, ...fonts.bold },
  clearButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: borderRadius.sm, paddingVertical: 7, paddingHorizontal: 12,
    backgroundColor: colors.white },
  clearButtonText: { color: colors.navy, fontSize: 12, ...fonts.bold },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 20,
    paddingVertical: spacing.lg, textAlign: 'center', ...fonts.medium },
  gradeCard: { backgroundColor: colors.surfaceSubtle, borderRadius: borderRadius.lg, borderWidth: 1,
    borderLeftWidth: 3, borderColor: colors.borderLight, borderLeftColor: colors.primary,
    padding: spacing.md, marginBottom: spacing.sm },
  cancelledCard: { opacity: 0.62 },
  gradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: spacing.sm, marginBottom: spacing.md },
  gradeHeaderText: { alignItems: 'flex-start', gap: spacing.xs },
  gradeDate: { color: colors.navy, fontSize: 14, ...fonts.bold },
  chapterTitle: { flex: 1, color: colors.navy, fontSize: 13, textAlign: 'right', ...fonts.bold },
  cancelledBadge: { backgroundColor: colors.errorBg, borderRadius: borderRadius.sm,
    paddingVertical: 3, paddingHorizontal: 9 },
  cancelledBadgeText: { color: colors.errorText, fontSize: 11, ...fonts.bold },
  resultGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  resultItem: { flex: 1, gap: spacing.xs },
  resultLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.4,
    textTransform: 'uppercase', ...fonts.bold },
  resultValue: { color: colors.textDark, fontSize: 14, ...fonts.bold },
  teacherRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  teacherName: { flex: 1, color: colors.textBody, fontSize: 12, textAlign: 'right', ...fonts.semiBold },
  detailsButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm, paddingRight: spacing.md },
  detailsButtonText: { color: colors.textMuted, fontSize: 12, ...fonts.bold },
  detailsAvailable: { color: colors.navy },
  expandedDetails: { gap: spacing.md, marginHorizontal: -spacing.md, marginBottom: -spacing.md,
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight,
    backgroundColor: colors.white },
  expandedItem: { gap: spacing.xs },
  expandedValue: { color: colors.textBody, fontSize: 13, lineHeight: 19, ...fonts.regular },
});
