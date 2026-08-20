import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import BackIcon from '@/assets/images/backIcon.svg';
import type { Routine } from '@/entities/routine';
import { colors, screenStyles } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';
import { FeedbackPressable } from '@/shared/ui/FeedbackPressable';

type RoutineListProps = {
  itemStyle?: (routine: Routine) => StyleProp<ViewStyle>;
  isRoutineDisabled?: (routine: Routine) => boolean;
  renderOverlay?: (routine: Routine) => ReactNode;
  routines: Routine[];
  onPressRoutine: (routine: Routine) => void;
  renderRight?: (routine: Routine) => ReactNode;
};

export function RoutineList({
  isRoutineDisabled,
  itemStyle,
  onPressRoutine,
  renderOverlay,
  renderRight,
  routines,
}: RoutineListProps) {
  return (
    <View style={styles.listCard}>
      {routines.map((routine, index) => (
        <FeedbackPressable
          disabled={isRoutineDisabled?.(routine)}
          key={routine.id}
          onPress={() => onPressRoutine(routine)}
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        >
          <View style={[styles.itemContent, itemStyle?.(routine)]}>
            <Text style={styles.icon}>{routine.icon}</Text>
            <View style={styles.copy}>
              <Text style={styles.itemTitle}>{routine.title}</Text>
              <Text ellipsizeMode="tail" numberOfLines={1} style={screenStyles.muted}>
                {routine.steps.length}단계 · {routine.description}
              </Text>
            </View>
            {renderRight?.(routine) ?? <BackIcon height={22} style={styles.arrow} width={22} />}
          </View>
          {renderOverlay?.(routine)}
          {index < routines.length - 1 && <View style={styles.itemDivider} />}
        </FeedbackPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: { opacity: 0.56, transform: [{ rotate: '180deg' }] },
  copy: { flex: 1 },
  icon: { fontSize: 25 },
  item: { height: 68, paddingHorizontal: 16, position: 'relative' },
  itemContent: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 },
  itemDivider: {
    backgroundColor: '#F4F7FA',
    bottom: 0,
    height: 2,
    left: 48,
    position: 'absolute',
    right: 48,
  },
  itemPressed: { backgroundColor: '#F4F7FA' },
  itemTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
