import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StudentScreenProps } from '../navigation/types';
import { AlertBox, ContentCard, TopNavbar } from '../components';
import type { ProgramType } from '../features/enrollment/models';
import type { EnrollmentProgramOption } from '../features/student/enrollmentRequest/models';
import { createStudentEnrollment } from '../features/student/enrollmentRequest/service';
import { borderRadius, colors, fonts, spacing } from '../theme';
import { getApiErrorMessage } from '../utils/apiError';

type Props = StudentScreenProps<'StudentNewEnrollment'>;

const PROGRAMS: ReadonlyArray<EnrollmentProgramOption> = [
  { value: 'FLUENT', label: 'Fluent Reading' },
  { value: 'MEMORIZATION', label: 'Memorization' },
  { value: 'REVISION', label: 'Revision' },
];

export default function StudentNewEnrollmentScreen({ navigation }: Props) {
  const [programType, setProgramType] = useState<ProgramType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!programType || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await createStudentEnrollment({ programType });
      navigation.replace('MyLearning', { enrollmentRequestSuccess: true });
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to submit enrollment request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.page}>
      <TopNavbar
        title="New Enrollment"
        actions={[{ label: 'Back', onPress: () => navigation.goBack() }]}
      />
      <View style={styles.content}>
        <Text style={styles.subtitle}>Select the learning program you would like to request.</Text>
        {error ? <AlertBox type="error" message={error} /> : null}
        <ContentCard title="Available Programs">
          <View style={styles.options}>
            {PROGRAMS.map((program) => {
              const selected = programType === program.value;
              return (
                <TouchableOpacity
                  key={program.value}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => { setProgramType(program.value); setError(''); }}
                  disabled={submitting}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {program.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!programType || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={() => void submit()}
              disabled={!programType || submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Text style={styles.submitText}>Submit</Text>}
            </TouchableOpacity>
          </View>
        </ContentCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  optionSelected: { borderColor: colors.navy, backgroundColor: colors.blueBg },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.navy },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy },
  optionText: { color: colors.textDark, fontSize: 14, ...fonts.semiBold },
  optionTextSelected: { color: colors.navy },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  cancelButton: {
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  cancelText: { color: colors.navy, fontSize: 13, ...fonts.bold },
  submitButton: {
    minWidth: 100,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  submitButtonDisabled: { opacity: 0.55 },
  submitText: { color: colors.white, fontSize: 13, ...fonts.bold },
});
