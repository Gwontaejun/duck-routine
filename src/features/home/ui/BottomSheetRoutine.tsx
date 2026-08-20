import { router } from 'expo-router';
import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { type Routine, useRoutineStore } from '@/entities/routine';
import { colors } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';
import { formatDuration } from '@/shared/lib';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { FavoriteIcon } from '@/shared/ui/FavoriteIcon';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';
import { useToast } from '@/shared/ui/Toast';
import { FeedbackPressable as Pressable } from '@/shared/ui/FeedbackPressable';

type RoutineBottomSheetProps = {
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  rightAction?: ReactNode;
  routine: Routine | null;
  scheduleId?: string;
  showAction?: boolean;
  showFavorite?: boolean;
  showMascot?: boolean;
};

export function RoutineBottomSheet({
  actionLabel,
  onAction,
  onClose,
  rightAction,
  routine,
  scheduleId,
  showAction = true,
  showFavorite = true,
  showMascot = true,
}: RoutineBottomSheetProps) {
  const { routines, toggleFavorite } = useRoutineStore();
  const { showToast } = useToast();
  const [cachedRoutine, setCachedRoutine] = useState<Routine | null>(routines[0] ?? null);
  const [isFavorite, setIsFavorite] = useState(false);
  const favoriteRef = useRef(false);
  const favoriteToggleLock = useRef(false);

  useLayoutEffect(() => {
    const favorite = Boolean(
      routine && routines.some((item) => item.id === routine.id && item.isFavorite),
    );
    favoriteRef.current = favorite;
    setIsFavorite(favorite);
  }, [routine, routines]);

  useLayoutEffect(() => {
    if (routine) setCachedRoutine(routine);
  }, [routine]);

  const displayRoutine = routine ?? cachedRoutine;
  const decoration = useMemo(
    () =>
      showMascot ? (
        <Image
          source={require('../../../../assets/images/cheeringDuck.png')}
          style={styles.mascot}
        />
      ) : undefined,
    [showMascot],
  );

  if (!displayRoutine) return null;

  return (
    <BottomSheet decoration={decoration} onClose={onClose} visible={Boolean(routine)}>
      <View style={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.heading}>
            <Text style={styles.title}>
              {displayRoutine.icon} {displayRoutine.title}
            </Text>
            <Text style={styles.description}>
              {displayRoutine.steps.length}단계 · {displayRoutine.description}
            </Text>
          </View>
          {rightAction ??
            (showFavorite && (
              <Pressable
                onPress={() => {
                  if (favoriteToggleLock.current) return;
                  favoriteToggleLock.current = true;
                  const nextFavorite = !favoriteRef.current;
                  favoriteRef.current = nextFavorite;
                  setIsFavorite(nextFavorite);
                  showToast(nextFavorite ? '즐겨찾기에 추가했어요.' : '즐겨찾기에서 해제했어요.');
                  toggleFavorite(displayRoutine.id);
                  setTimeout(() => {
                    favoriteToggleLock.current = false;
                  }, 300);
                }}
                style={styles.favoriteButton}
              >
                <FavoriteIcon active={isFavorite} size={30} />
              </Pressable>
            ))}
        </View>
        <ScrollView contentContainerStyle={styles.steps} showsVerticalScrollIndicator={false}>
          {displayRoutine.steps.map((step, index) => (
            <View key={step.id} style={styles.step}>
              {index < displayRoutine.steps.length - 1 && <View style={styles.connector} />}
              <View style={styles.number}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.duration}>{formatDuration(step.durationSec)}</Text>
            </View>
          ))}
        </ScrollView>
        {showAction && (
          <PrimaryButton
            label={actionLabel ?? '루틴 시작하기 →'}
            onPress={() => {
              if (onAction) {
                onAction();
                return;
              }
              onClose();
              router.push({
                pathname: '/routine/[id]',
                params: { id: displayRoutine.id, ...(scheduleId ? { scheduleId } : {}) },
              });
            }}
          />
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 16, paddingHorizontal: 24 },
  connector: {
    backgroundColor: colors.primary,
    height: 32,
    left: 13,
    position: 'absolute',
    top: 26,
    width: 1,
  },
  description: { color: colors.muted, fontSize: 13 },
  duration: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  favoriteButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  heading: { flex: 1, gap: 3 },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: 12, zIndex: 1 },
  mascot: { height: 116, position: 'absolute', right: 6, top: -86, width: 116 },
  number: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderColor: 'transparent',
    borderRadius: 13,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  numberText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  step: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 40,
    position: 'relative',
  },
  stepTitle: { color: '#252522', flex: 1, fontSize: 14, fontWeight: '600' },
  steps: { gap: 6 },
  title: { color: colors.ink, fontSize: 18, fontWeight: '800' },
});
