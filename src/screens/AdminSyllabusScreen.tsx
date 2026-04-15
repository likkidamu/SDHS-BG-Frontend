import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { TopNavbar } from '../components';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

interface ChapterEntry {
  id: number;
  chapterNumber: number;
  chapterName: string;
  totalSlokas: number;
  allowedSlokas: string;
  enabled: boolean;
}

function nextSunday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d.toISOString().split('T')[0];
}

export default function AdminSyllabusScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [date, setDate] = useState(nextSunday());
  const [chapters, setChapters] = useState<ChapterEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true); setError(''); setSuccess('');
      const res = await api.get('/admin/syllabus', { params: { date } });
      setChapters(res.data.chapters || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load syllabus');
    } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const toggleChapter = (id: number) => {
    setChapters(cs => cs.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const setAllowed = (id: number, val: string) => {
    setChapters(cs => cs.map(c => c.id === id ? { ...c, allowedSlokas: val } : c));
  };

  const autoFill = (id: number, total: number) => {
    const steps: number[] = [];
    for (let i = 5; i <= total; i += 5) steps.push(i);
    setChapters(cs => cs.map(c => c.id === id ? { ...c, allowedSlokas: steps.join(',') } : c));
  };

  const save = async () => {
    const entries = chapters
      .filter(c => c.enabled && c.allowedSlokas.trim())
      .map(c => ({ chapterId: c.id, allowedSlokas: c.allowedSlokas.trim() }));

    if (entries.length === 0) {
      Alert.alert('Nothing to save', 'Enable at least one chapter with allowed slokas.'); return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post('/admin/syllabus/save', { date, entries });
      setSuccess(`Syllabus saved for ${date}`);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.page}>
      <TopNavbar title="Syllabus Config" actions={[{ label: '← Back', onPress: () => navigation.goBack() }, { label: 'Logout', onPress: logout, variant: 'logout' }]} />

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Session Date</Text>
        <TextInput style={styles.dateInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" onSubmitEditing={load} returnKeyType="done" />
        <TouchableOpacity style={styles.loadBtn} onPress={load}>
          <Text style={styles.loadBtnText}>Load</Text>
        </TouchableOpacity>
      </View>

      {success ? <View style={styles.successBanner}><Text style={styles.successText}>{success}</Text></View> : null}
      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {chapters.map(c => (
            <View key={c.id} style={[styles.card, !c.enabled && styles.cardDisabled]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chapterName}>Ch {c.chapterNumber}: {c.chapterName}</Text>
                  <Text style={styles.chapterMeta}>{c.totalSlokas} total slokas</Text>
                </View>
                <Switch value={c.enabled} onValueChange={() => toggleChapter(c.id)} trackColor={{ true: colors.teal }} thumbColor={c.enabled ? colors.white : '#ccc'} />
              </View>
              {c.enabled && (
                <View style={styles.slokaRow}>
                  <TextInput
                    style={styles.slokaInput}
                    placeholder="e.g. 5,10,15,20"
                    value={c.allowedSlokas}
                    onChangeText={v => setAllowed(c.id, v)}
                  />
                  <TouchableOpacity style={styles.autoBtn} onPress={() => autoFill(c.id, c.totalSlokas)}>
                    <Text style={styles.autoBtnText}>5s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.clearBtn} onPress={() => setAllowed(c.id, '')}>
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Syllabus</Text>}
          </TouchableOpacity>
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
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.card },
  cardDisabled: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chapterName: { fontSize: 14, color: colors.textDark, ...fonts.semiBold },
  chapterMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  slokaRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  slokaInput: { flex: 1, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 13 },
  autoBtn: { backgroundColor: colors.teal, paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm },
  autoBtnText: { color: '#fff', fontSize: 12, ...fonts.bold },
  clearBtn: { backgroundColor: colors.errorBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm },
  clearBtnText: { color: colors.errorText, fontSize: 12, ...fonts.bold },
  saveBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, ...fonts.bold },
});
