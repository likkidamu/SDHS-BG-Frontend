import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { TopNavbar, ContentCard, GradeBadge, Footer } from '../components';
import { colors, shadows, borderRadius, fonts, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Grade = {
  id: number;
  date: string;
  formattedDate: string;
  cancelled: boolean;
  slotName: string;
  chapterNumber: number;
  chapterName: string;
  slokaCount: number;
  memorizationGrade: string | null;
  pronunciationGrade: string | null;
  teacherComment: string | null;
  assignedTeacherName: string | null;
};

type GradesResponse = {
  volunteerId: string;
  studentName: string;
  grades: Grade[];
};

type Props = { navigation: NativeStackNavigationProp<any> };

export default function StudentGradesScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchGrades = useCallback(async () => {
    try {
      setError('');
      const res = await api.get<GradesResponse>('/student/grades');
      setGrades(res.data.grades);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load grade history');
    }
  }, []);

  useEffect(() => {
    fetchGrades().finally(() => setLoading(false));
  }, [fetchGrades]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGrades();
    setRefreshing(false);
  }, [fetchGrades]);

  const renderLoading = () => (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.navy} />
      <Text style={styles.loadingText}>Loading grades...</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Exam Results Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your grade history will appear here after you complete exams.
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  const renderGradeCard = (grade: Grade) => (
    <View
      key={grade.id}
      style={[styles.gradeCard, grade.cancelled && styles.gradeCardCancelled]}
    >
      {grade.cancelled && (
        <View style={styles.cancelledBadge}>
          <Text style={styles.cancelledBadgeText}>Cancelled</Text>
        </View>
      )}

      <View style={styles.gradeCardHeader}>
        <Text style={styles.gradeDate}>{grade.formattedDate}</Text>
        <Text style={styles.gradeSlot}>{grade.slotName}</Text>
      </View>

      <View style={styles.chapterRow}>
        <Text style={styles.chapterLabel}>Chapter {grade.chapterNumber}</Text>
        <Text style={styles.chapterName}>{grade.chapterName}</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Slokas</Text>
          <Text style={styles.detailValue}>{grade.slokaCount}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Memorization</Text>
          <GradeBadge grade={grade.memorizationGrade} />
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Pronunciation</Text>
          <GradeBadge grade={grade.pronunciationGrade} />
        </View>
      </View>

      {grade.assignedTeacherName && (
        <View style={styles.teacherRow}>
          <Text style={styles.teacherLabel}>Teacher:</Text>
          <Text style={styles.teacherName}>{grade.assignedTeacherName}</Text>
        </View>
      )}

      {grade.teacherComment ? (
        <View style={styles.commentRow}>
          <Text style={styles.commentLabel}>Comment:</Text>
          <Text style={styles.commentText}>{grade.teacherComment}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Grade History"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : (
          <ContentCard
            title="Exam Results"
            rightLabel={`${grades.length} exam${grades.length !== 1 ? 's' : ''}`}
          >
            {grades.length === 0
              ? renderEmpty()
              : grades.map(renderGradeCard)}
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.medium,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    color: colors.textDark,
    ...fonts.bold,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.regular,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Error state
  errorContainer: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  errorText: {
    color: colors.errorText,
    fontSize: 14,
    ...fonts.medium,
    textAlign: 'center',
  },

  // Grade card
  gradeCard: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gradeCardCancelled: {
    opacity: 0.6,
    borderColor: colors.errorBorder,
  },
  cancelledBadge: {
    backgroundColor: colors.errorBg,
    borderRadius: borderRadius.sm,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  cancelledBadgeText: {
    color: colors.errorText,
    fontSize: 11,
    ...fonts.bold,
  },

  // Card header (date + slot)
  gradeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gradeDate: {
    fontSize: 14,
    color: colors.navy,
    ...fonts.bold,
  },
  gradeSlot: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.medium,
    backgroundColor: colors.white,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },

  // Chapter row
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chapterLabel: {
    fontSize: 13,
    color: colors.primary,
    ...fonts.bold,
  },
  chapterName: {
    fontSize: 13,
    color: colors.textBody,
    ...fonts.medium,
    flex: 1,
  },

  // Details row (slokas + grades)
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flex: 1,
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    ...fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: colors.textDark,
    ...fonts.bold,
  },

  // Teacher row
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  teacherLabel: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.medium,
  },
  teacherName: {
    fontSize: 12,
    color: colors.textBody,
    ...fonts.semiBold,
  },

  // Comment row
  commentRow: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  commentLabel: {
    fontSize: 11,
    color: colors.textMuted,
    ...fonts.semiBold,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: colors.textBody,
    ...fonts.regular,
    fontStyle: 'italic',
  },
});
