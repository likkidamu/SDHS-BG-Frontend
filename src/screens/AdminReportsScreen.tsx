import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal,
} from 'react-native';
import { TopNavbar, Footer } from '../components';
import { colors, fonts, borderRadius, shadows } from '../theme';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ---- Types ----
interface Student {
  volunteerId: string;
  name: string;
  groupId: string | null;
  groupName: string | null;
  trackType: string | null;
  status: string;
}

interface Group {
  groupId: string;
  groupName: string | null;
  status: string;
  studentCount: number; // derived on frontend
}

type Props = { navigation: NativeStackNavigationProp<any> };

// ---- Sub-components ----
function SectionCountCard({ count, label, color, onPress, active }: {
  count: number; label: string; color?: string; onPress?: () => void; active?: boolean;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[cc.card, active && { borderColor: color, borderWidth: 2 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[cc.count, color ? { color } : {}]}>{count}</Text>
      <Text style={cc.label}>{label}</Text>
      {onPress ? <Text style={[cc.tap, active && { color: color ?? colors.primary }]}>
        {active ? '✓ filtered' : 'tap to filter ↓'}
      </Text> : null}
    </Wrapper>
  );
}

const cc = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight,
    ...shadows.card,
  },
  count: { fontSize: 32, ...fonts.extraBold, color: colors.navy },
  label: { fontSize: 12, ...fonts.semiBold, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  tap: { fontSize: 10, ...fonts.regular, color: colors.primary, marginTop: 6 },
});

function GroupRow({ g, onPress }: { g: Group; onPress: () => void }) {
  const isActive = g.status?.toUpperCase() === 'ACTIVE';
  return (
    <TouchableOpacity style={gr.row} onPress={onPress} activeOpacity={0.7}>
      <View style={gr.info}>
        <Text style={gr.name} numberOfLines={2}>{g.groupName ?? g.groupId}</Text>
      </View>
      <View style={[gr.statusDot, { backgroundColor: isActive ? colors.successText : colors.textMuted }]} />
      <View style={gr.badge}>
        <Text style={gr.badgeText}>{g.studentCount} student{g.studentCount !== 1 ? 's' : ''}</Text>
      </View>
      <Text style={gr.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const gr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  info: { flex: 1 },
  name: { fontSize: 14, ...fonts.semiBold, color: colors.textDark, flexShrink: 1 },
  id: { fontSize: 11, ...fonts.regular, color: colors.textMuted, marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  badge: { backgroundColor: colors.blueBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, ...fonts.semiBold, color: colors.blue },
  arrow: { fontSize: 20, color: colors.textMuted, marginLeft: 8 },
});

function StudentRow({ s }: { s: Student }) {
  const track = s.trackType?.toUpperCase();
  return (
    <View style={sr.row}>
      <View style={sr.info}>
        <Text style={sr.name}>{s.name}</Text>
        <Text style={sr.sub}>{s.volunteerId}{s.groupName ? ` · ${s.groupName}` : ''}</Text>
      </View>
      {track ? (
        <View style={[sr.pill, { backgroundColor: track === 'MEM' ? colors.blueBg : colors.purpleBg }]}>
          <Text style={[sr.pillText, { color: track === 'MEM' ? colors.blue : colors.purple }]}>{track}</Text>
        </View>
      ) : null}
    </View>
  );
}

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  info: { flex: 1 },
  name: { fontSize: 14, ...fonts.semiBold, color: colors.textDark },
  sub: { fontSize: 11, ...fonts.regular, color: colors.textMuted, marginTop: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  pillText: { fontSize: 10, ...fonts.bold },
});

function SectionHeader({ title }: { title: string }) {
  return <Text style={sh.text}>{title}</Text>;
}

const sh = StyleSheet.create({
  text: {
    fontSize: 11, ...fonts.semiBold, color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 10,
  },
});

// ---- Track filter dropdown ----
type TrackFilter = null | 'MEM' | 'FLUENT';

const FILTER_OPTIONS: { value: TrackFilter; label: string; color: string }[] = [
  { value: null,     label: 'All Students',  color: colors.textDark },
  { value: 'MEM',    label: 'Memorization',  color: colors.blue },
  { value: 'FLUENT', label: 'Fluent',        color: colors.purple },
];

function TrackFilterDropdown({ value, onChange }: { value: TrackFilter; onChange: (v: TrackFilter) => void }) {
  const [open, setOpen] = useState(false);
  const active = FILTER_OPTIONS.find(o => o.value === value) ?? FILTER_OPTIONS[0];

  return (
    <View>
      <TouchableOpacity style={dd.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <View style={[dd.dot, { backgroundColor: active.color }]} />
        <Text style={[dd.triggerText, { color: active.color }]}>{active.label}</Text>
        <Text style={dd.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={dd.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={dd.menu}>
            <Text style={dd.menuTitle}>Filter by track</Text>
            {FILTER_OPTIONS.map(opt => {
              const selected = opt.value === value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  style={[dd.option, selected && dd.optionActive]}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <View style={[dd.dot, { backgroundColor: opt.color }]} />
                  <Text style={[dd.optionText, { color: opt.color }]}>{opt.label}</Text>
                  {selected && <Text style={[dd.check, { color: opt.color }]}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const dd = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 6,
    ...shadows.card,
  },
  triggerText: { fontSize: 12, ...fonts.semiBold },
  chevron: { fontSize: 10, color: colors.textMuted, marginLeft: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  menu: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    paddingVertical: 8, width: 220,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.card,
  },
  menuTitle: {
    fontSize: 10, ...fonts.semiBold, color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginBottom: 4,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  optionActive: { backgroundColor: colors.bg },
  optionText: { flex: 1, fontSize: 14, ...fonts.semiBold },
  check: { fontSize: 14, ...fonts.bold },
});

// ---- Students Tab ----
function StudentsTab({
  groups, students, navigation,
  onStudentsSectionLayout, onScrollToStudents,
}: {
  groups: Group[];
  students: Student[];
  navigation: any;
  onStudentsSectionLayout: (y: number) => void;
  onScrollToStudents: () => void;
}) {
  const [trackFilter, setTrackFilter] = useState<null | 'MEM' | 'FLUENT'>(null);

  const activeStudents = students.filter(s => s.status?.toUpperCase() === 'ACTIVE');
  const memStudents    = activeStudents.filter(s => s.trackType?.toUpperCase() === 'MEM');
  const fluentStudents = activeStudents.filter(s => s.trackType?.toUpperCase() === 'FLUENT');

  const visibleStudents = trackFilter === 'MEM'
    ? memStudents
    : trackFilter === 'FLUENT'
    ? fluentStudents
    : activeStudents;

  const sectionTitle = trackFilter === 'MEM'
    ? `Memorization (${memStudents.length})`
    : trackFilter === 'FLUENT'
    ? `Fluent (${fluentStudents.length})`
    : `Active Students (${activeStudents.length})`;

  const handleFilterPress = (filter: 'MEM' | 'FLUENT') => {
    setTrackFilter(filter);
    onScrollToStudents();
  };

  return (
    <>
      {/* Row 1: Groups | Active Students */}
      <View style={styles.countRow}>
        <SectionCountCard count={groups.length} label="Total Groups" color={colors.navy} />
        <View style={{ width: 12 }} />
        <SectionCountCard
          count={activeStudents.length}
          label="Active Students"
          color={colors.primary}
          onPress={() => { setTrackFilter(null); onScrollToStudents(); }}
        />
      </View>

      {/* Row 2: MEM | FLUENT */}
      <View style={styles.countRow}>
        <SectionCountCard
          count={memStudents.length}
          label="Memorization"
          color={colors.blue}
          active={trackFilter === 'MEM'}
          onPress={() => handleFilterPress('MEM')}
        />
        <View style={{ width: 12 }} />
        <SectionCountCard
          count={fluentStudents.length}
          label="Fluent"
          color={colors.purple}
          active={trackFilter === 'FLUENT'}
          onPress={() => handleFilterPress('FLUENT')}
        />
      </View>

      {/* Groups list */}
      <SectionHeader title="Groups" />
      {groups.length === 0 ? (
        <Text style={styles.emptyText}>No groups found.</Text>
      ) : (
        <View style={styles.tableContainer}>
          {groups.map(g => (
            <GroupRow
              key={g.groupId}
              g={g}
              onPress={() => navigation.navigate('AdminGroupDetail', { groupId: g.groupId, groupName: g.groupName })}
            />
          ))}
        </View>
      )}

      {/* Filtered students list */}
      <View onLayout={e => onStudentsSectionLayout(e.nativeEvent.layout.y)}>
        <View style={styles.sectionHeaderRow}>
          <Text style={sh.text}>{sectionTitle}</Text>
          <TrackFilterDropdown
            value={trackFilter}
            onChange={v => { setTrackFilter(v); onScrollToStudents(); }}
          />
        </View>
        {visibleStudents.length === 0 ? (
          <Text style={styles.emptyText}>No students found.</Text>
        ) : (
          <View style={styles.tableContainer}>
            {visibleStudents.map(s => <StudentRow key={s.volunteerId} s={s} />)}
          </View>
        )}
      </View>
    </>
  );
}

// ---- Main screen ----
export default function AdminReportsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers');
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const studentsY = useRef(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both in parallel
      const [groupsRes, studentsRes] = await Promise.all([
        api.get('/admin/attendance-config'),
        api.get('/admin/volunteers?enrollmentType=S'),
      ]);

      const rawStudents: Student[] = studentsRes.data.volunteers ?? [];

      // Count active students per group on the frontend
      const countByGroup = new Map<string, number>();
      for (const s of rawStudents) {
        if (s.groupId && s.status?.toUpperCase() === 'ACTIVE') {
          countByGroup.set(s.groupId, (countByGroup.get(s.groupId) ?? 0) + 1);
        }
      }

      const rawGroups: Group[] = (groupsRes.data.groups ?? []).map((g: any) => ({
        groupId: g.groupId,
        groupName: g.groupName,
        status: g.status,
        studentCount: countByGroup.get(g.groupId) ?? 0,
      }));

      setGroups(rawGroups);
      setStudents(rawStudents);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'students') loadData();
  }, [activeTab]);

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Reports"
        actions={[{ label: 'Back', onPress: () => navigation.goBack() }]}
      />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'teachers' && styles.tabActive]}
          onPress={() => setActiveTab('teachers')}
        >
          <Text style={[styles.tabText, activeTab === 'teachers' && styles.tabTextActive]}>
            👨‍🏫  Teachers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.tabActive]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.tabTextActive]}>
            👨‍🎓  Students
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {activeTab === 'teachers' && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>📊</Text>
            <Text style={styles.placeholderTitle}>Teachers Report</Text>
            <Text style={styles.placeholderSubtitle}>Coming soon</Text>
          </View>
        )}

        {activeTab === 'students' && loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        )}

        {activeTab === 'students' && !loading && error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'students' && !loading && !error && (
          <StudentsTab
            groups={groups}
            students={students}
            navigation={navigation}
            onStudentsSectionLayout={y => { studentsY.current = y; }}
            onScrollToStudents={() => scrollRef.current?.scrollTo({ y: studentsY.current, animated: true })}
          />
        )}

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    ...shadows.card,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 15, ...fonts.semiBold, color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  content: { padding: 16, paddingBottom: 32 },
  countRow: { flexDirection: 'row', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 4 },
  tableContainer: {
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderLight,
    marginBottom: 4,
  },
  emptyText: { fontSize: 13, ...fonts.regular, color: colors.textMuted, marginBottom: 8 },
  placeholderCard: {
    backgroundColor: '#fff', borderRadius: borderRadius.xxl,
    padding: 48, alignItems: 'center', ...shadows.card,
  },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderTitle: { fontSize: 18, ...fonts.bold, color: colors.textDark, marginBottom: 6 },
  placeholderSubtitle: { fontSize: 14, ...fonts.regular, color: colors.textMuted },
  center: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14, ...fonts.regular, color: colors.textMuted },
  errorCard: {
    backgroundColor: colors.errorBg, borderRadius: borderRadius.md,
    padding: 16, borderWidth: 1, borderColor: colors.errorBorder, alignItems: 'center',
  },
  errorText: { fontSize: 14, ...fonts.regular, color: colors.errorText, textAlign: 'center' },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.errorText, borderRadius: 8 },
  retryText: { fontSize: 13, ...fonts.semiBold, color: colors.white },
});
