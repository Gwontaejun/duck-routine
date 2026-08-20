import { StyleSheet } from 'react-native';

import { colors } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';
import { FeedbackPressable } from '@/shared/ui/FeedbackPressable';

type EmptyStateProps = { actionLabel?: string; onPress?: () => void; text: string };

export function EmptyState({ actionLabel, onPress, text }: EmptyStateProps) {
  return (
    <FeedbackPressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{text}</Text>
      {actionLabel && <Text style={styles.action}>{actionLabel}</Text>}
    </FeedbackPressable>
  );
}

const styles = StyleSheet.create({
  action: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    padding: 18,
  },
  pressed: { backgroundColor: '#F4F7FA' },
  text: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
