import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { TopNavbar, StatCard, ContentCard, Footer } from '../components';
import { colors, shadows, borderRadius, fonts, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AttendanceRecord = {
  id: number;
  present: boolean;
  classDate: string;
  groupId: number;
  noClass: boolean;
};

type AttendanceData = {
  volunteerId: string;
  studentName: string;
  groupId: number;
  present: number;
  total: number;
  percent: string;
  groupStartDate: string;
  groupEndDate: string;
  groupStatus: string;
  history: AttendanceRecord[];
};

type Props = { navigation: NativeStackNavigationProp<any> };

export default function StudentAttendanceScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/student/attendance');
      setData(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.noClass) {
      return { label: 'No Class', bg: '#fff3e0', text: '#e65100' };
    }
    if (record.present) {
      return { label: 'Present', bg: '#e8f5e9', text: '#1b5e20' };
    }
    return { label: 'Absent', bg: '#ffebee', text: '#b71c1c' };
  };

  const getGroupStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { bg: '#e8f5e9', text: '#1b5e20' };
      case 'completed':
        return { bg: '#e3f2fd', text: '#1565c0' };
      default:
        return { bg: '#fff3e0', text: '#e65100' };
    }
  };

  if (loading) {
    return (
      <View style={styles.page}>
        <TopNavbar
          title="My Attendance"
          actions={[
            { label: 'Back', onPress: () => navigation.goBack() },
            { label: 'Logout', onPress: logout, variant: 'logout' },
          ]}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.page}>
        <TopNavbar
          title="My Attendance"
          actions={[
            { label: 'Back', onPress: () => navigation.goBack() },
            { label: 'Logout', onPress: logout, variant: 'logout' },
          ]}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const statusColor = getGroupStatusColor(data?.groupStatus || '');

  return (
    <View style={styles.page}>
      <TopNavbar
        title="My Attendance"
        actions={[
          { label: 'Back', onPress: () => navigation.goBack() },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.studentName}>{data?.studentName}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>{data?.volunteerId}</Text>
            </View>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>Group {data?.groupId}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
                {data?.groupStatus}
              </Text>
            </View>
          </View>
          <Text style={styles.dateRange}>
            {formatDate(data?.groupStartDate || '')} - {formatDate(data?.groupEndDate || '')}
          </Text>
        </View>

        {/* Stat Cards Row */}
        <View style={styles.statsRow}>
          <View style={styles.statWrapper}>
            <StatCard
              value={data?.present ?? 0}
              label="Present"
              iconLabel="✓"
              iconBg={colors.greenBg}
              iconColor={colors.green}
              valueColor={colors.green}
            />
          </View>
          <View style={styles.statWrapper}>
            <StatCard
              value={data?.total ?? 0}
              label="Total Classes"
              iconLabel="📚"
              iconBg={colors.blueBg}
              iconColor={colors.blue}
              valueColor={colors.navy}
            />
          </View>
          <View style={styles.statWrapper}>
            <StatCard
              value={data?.percent ?? '0%'}
              label="Percentage"
              iconLabel="%"
              iconBg={colors.orangeBg}
              iconColor={colors.primary}
              valueColor={colors.primary}
            />
          </View>
        </View>

        {/* Attendance History */}
        <ContentCard title="Attendance History" rightLabel={`${data?.history?.length ?? 0} Records`}>
          {data?.history && data.history.length > 0 ? (
            data.history.map((record, index) => {
              const badge = getStatusBadge(record);
              return (
                <View
                  key={record.id}
                  style={[
                    styles.historyRow,
                    index < data.history.length - 1 && styles.historyRowBorder,
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formatDate(record.classDate)}</Text>
                    <Text style={styles.historyGroup}>Group {record.groupId}</Text>
                  </View>
                  <View style={[styles.attendanceBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.attendanceBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No attendance records found.</Text>
          )}
        </ContentCard>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            Attendance percentage is calculated based on the number of classes you were present
            out of the total classes held. Classes marked as "No Class" are excluded from the
            calculation.
          </Text>
        </View>

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
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.medium,
  },
  errorText: {
    fontSize: 14,
    color: colors.errorText,
    ...fonts.medium,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  studentName: {
    fontSize: 20,
    ...fonts.bold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  idBadge: {
    backgroundColor: colors.blueBg,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  idBadgeText: {
    fontSize: 12,
    ...fonts.semiBold,
    color: colors.blue,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 12,
    ...fonts.semiBold,
  },
  dateRange: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.medium,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statWrapper: {
    flex: 1,
  },

  // History
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    ...fonts.semiBold,
    color: colors.textDark,
  },
  historyGroup: {
    fontSize: 12,
    color: colors.textMuted,
    ...fonts.regular,
    marginTop: 2,
  },
  attendanceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  attendanceBadgeText: {
    fontSize: 12,
    ...fonts.bold,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    ...fonts.medium,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Info Note
  infoNote: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  infoNoteText: {
    fontSize: 12,
    color: colors.infoText,
    ...fonts.medium,
    lineHeight: 18,
  },
});
