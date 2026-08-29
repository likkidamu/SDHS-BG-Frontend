import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, fonts, spacing } from '../theme';
import AlertBox from './AlertBox';

type Props = {
  loading?: boolean;
  error?: boolean | string | null;
  empty?: boolean;
  fill?: boolean;
  onRetry?: () => void;
  loadingMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
};

export default function AsyncState({
  loading = false,
  error = false,
  empty = false,
  fill = false,
  onRetry,
  loadingMessage = 'Loading...',
  emptyMessage = 'No information is available.',
  errorMessage = 'Unable to load information.',
}: Props) {
  if (loading) {
    return (
      <View style={[styles.state, styles.loadingState, fill && styles.fill]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  if (error) {
    const message = typeof error === 'string' ? error : errorMessage;
    return (
      <View style={styles.state}>
        <AlertBox type="error" message={message} />
        {onRetry ? (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (empty) {
    return <Text style={styles.emptyText}>{emptyMessage}</Text>;
  }

  return null;
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: spacing.sm },
  loadingState: { paddingVertical: spacing.xl },
  fill: { flex: 1, justifyContent: 'center' },
  loadingText: { color: colors.textMuted, fontSize: 14, ...fonts.medium },
  retryButton: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { color: colors.white, fontSize: 13, ...fonts.bold },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
