import dayjs from 'dayjs';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BackHandler, Platform, ScrollView, StyleSheet, ToastAndroid, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { Header, NotificationButton, RoutineCompletionOverlay, RoutineList } from '@/widgets';
import { useUser } from '@/entities/user';
import {
  calculateStreak,
  formatScheduleTime,
  getScheduleEntries,
  type Routine,
  useRoutineStore,
} from '@/entities/routine';
import { AppText as Text } from '@/shared/ui/AppText';
import { StatCard } from '@/shared/ui/StatCard';
import { AppUpdatePrompt } from '@/features/app-update';
import { colors, screenStyles } from '@/shared/config/theme';
import { EmptyState } from '@/shared/ui/EmptyState';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { useRoutineSheet } from '@/features/routine-sheet';
import BackIcon from '@/assets/images/backIcon.svg';
import DoneIcon from '@/assets/images/doneIcon.svg';
import FireIcon from '@/assets/images/fireIcon.svg';
import { FeedbackPressable } from '@/shared/ui/FeedbackPressable';

const copy = {
  emptyFavorites: '루틴에서 ★를 눌러 즐겨찾기에 추가해보세요.',
  favorites: '즐겨찾기',
  general: '일반 루틴',
  openSchedule: '일정 열기 →',
  streak: '연속 일수',
  today: '오늘 완료',
  todayRoutines: '오늘의 루틴',
};
const routinePreviewCount = 3;
const generalRoutinePreviewCount = 5;

export function HomePage() {
  const { name } = useUser();
  const { completions, routines, scheduleItems } = useRoutineStore();
  const { openRoutineSheet } = useRoutineSheet();
  const { routineId, scheduleId } = useLocalSearchParams<{
    routineId?: string;
    scheduleId?: string;
  }>();
  const [expandedRoutineList, setExpandedRoutineList] = useState<
    'favorites' | 'general' | 'today' | null
  >(null);

  const lastBackPress = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const visibleRoutines = useMemo(
    () => routines.filter((routine) => !routine.isHidden),
    [routines],
  );
  const todayScheduleEntries = useMemo(
    () =>
      getScheduleEntries({
        completions,
        date: dayjs(),
        routines,
        schedules: scheduleItems,
      }),
    [completions, routines, scheduleItems],
  );
  const todayEntryById = useMemo(
    () => new Map(todayScheduleEntries.map((entry) => [entry.schedule.id, entry])),
    [todayScheduleEntries],
  );
  const scheduledRoutines = useMemo(
    () =>
      todayScheduleEntries.map(({ routine, schedule }) => ({
        ...routine,
        id: schedule.id,
      })),
    [todayScheduleEntries],
  );
  const isTodayScheduleCompleted = (scheduleId: string) =>
    Boolean(todayEntryById.get(scheduleId)?.isCompleted);
  const openScheduledRoutine = (scheduledRoutine: Routine) => {
    const entry = todayEntryById.get(scheduledRoutine.id);

    if (entry) openRoutineSheet(entry.routine, { scheduleId: entry.schedule.id });
  };
  const favoriteRoutines = useMemo(
    () => visibleRoutines.filter((routine) => routine.isFavorite),
    [visibleRoutines],
  );
  const today = useMemo(
    () => completions.filter((item) => dayjs(item.finishedAt).isSame(dayjs(), 'day')).length,
    [completions],
  );
  const expandedRoutines =
    expandedRoutineList === 'today'
      ? scheduledRoutines
      : expandedRoutineList === 'favorites'
        ? favoriteRoutines
        : visibleRoutines;
  const expandedTitle =
    expandedRoutineList === 'today'
      ? copy.todayRoutines
      : expandedRoutineList === 'favorites'
        ? copy.favorites
        : copy.general;
  const renderScheduleRight = (routine: Routine) => (
    <Text style={styles.scheduleTime}>
      {formatScheduleTime(todayEntryById.get(routine.id)?.schedule.time ?? '00:00')}
    </Text>
  );
  const renderCompletedOverlay = (routine: Routine) =>
    isTodayScheduleCompleted(routine.id) ? <RoutineCompletionOverlay /> : null;

  useEffect(() => {
    if (!routineId) return;

    const routine = routines.find((item) => item.id === routineId);

    if (!routine) return;

    const schedule = scheduleItems.find((item) => item.id === scheduleId);

    openRoutineSheet(
      routine,
      schedule?.routineId === routine.id ? { scheduleId: schedule.id } : undefined,
    );
    router.setParams({ routineId: '', scheduleId: '' });
  }, [openRoutineSheet, routineId, routines, scheduleId, scheduleItems]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
      if (Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (Date.now() - lastBackPress.current < 2000) return (BackHandler.exitApp(), true);
        lastBackPress.current = Date.now();
        ToastAndroid.show('한 번 더 누르면 종료됩니다.', ToastAndroid.SHORT);
        return true;
      });
      return () => subscription.remove();
    }, []),
  );

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={screenStyles.content}>
      <AppUpdatePrompt />
      <Header
        eyebrow={`어서오세요! ${name}님,`}
        right={
          <NotificationButton
            onPressRoutine={(routineId, scheduleId) => {
              const routine = routines.find((item) => item.id === routineId);

              if (routine) openRoutineSheet(routine, scheduleId ? { scheduleId } : undefined);
            }}
          />
        }
        title="오늘도 가볍게 시작해봐요!"
      />
      <View style={screenStyles.statsRow}>
        <StatCard
          icon={<FireIcon height={36} width={36} />}
          value={`${String(calculateStreak(completions))}일`}
          label={copy.streak}
          valueStyle={styles.statValue}
        />
        <StatCard
          icon={<DoneIcon height={36} width={36} />}
          value={`${String(today)}회`}
          label={copy.today}
          valueStyle={styles.statValue}
        />
      </View>
      {scheduledRoutines.length > 0 && (
        <RoutineSection
          icon="🗓️"
          itemStyle={(routine) => isTodayScheduleCompleted(routine.id) && styles.completedRoutine}
          isRoutineDisabled={(routine) => isTodayScheduleCompleted(routine.id)}
          label={copy.todayRoutines}
          onPressRoutine={openScheduledRoutine}
          onShowMore={() => setExpandedRoutineList('today')}
          renderRight={renderScheduleRight}
          renderOverlay={renderCompletedOverlay}
          routines={scheduledRoutines}
        />
      )}
      <RoutineSection
        emptyText={copy.emptyFavorites}
        icon="⭐"
        label={copy.favorites}
        onPressRoutine={openRoutineSheet}
        onShowMore={() => setExpandedRoutineList('favorites')}
        routines={favoriteRoutines}
      />
      <RoutineSection
        icon="📋"
        label={copy.general}
        onPressRoutine={openRoutineSheet}
        onShowMore={() => setExpandedRoutineList('general')}
        previewCount={generalRoutinePreviewCount}
        routines={visibleRoutines}
      />
      {expandedRoutineList && (
        <BottomSheet onClose={() => setExpandedRoutineList(null)} scrollable visible>
          <BottomSheetScrollView contentContainerStyle={styles.routineListSheet}>
            <Text style={styles.routineListSheetTitle}>{expandedTitle}</Text>
            <RoutineList
              itemStyle={(routine) =>
                expandedRoutineList === 'today' &&
                isTodayScheduleCompleted(routine.id) &&
                styles.completedRoutine
              }
              isRoutineDisabled={(routine) =>
                expandedRoutineList === 'today' && isTodayScheduleCompleted(routine.id)
              }
              renderRight={expandedRoutineList === 'today' ? renderScheduleRight : undefined}
              renderOverlay={expandedRoutineList === 'today' ? renderCompletedOverlay : undefined}
              routines={expandedRoutines}
              onPressRoutine={(routine) => {
                setExpandedRoutineList(null);
                setTimeout(
                  () =>
                    expandedRoutineList === 'today'
                      ? openScheduledRoutine(routine)
                      : openRoutineSheet(routine),
                  180,
                );
              }}
            />
          </BottomSheetScrollView>
        </BottomSheet>
      )}
    </ScrollView>
  );
}

type RoutineSectionProps = {
  emptyText?: string;
  icon?: string;
  itemStyle?: (routine: Routine) => React.ComponentProps<typeof View>['style'];
  isRoutineDisabled?: (routine: Routine) => boolean;
  label: string;
  onEmptyPress?: () => void;
  onPressRoutine: (routine: Routine) => void;
  onShowMore?: () => void;
  previewCount?: number;
  renderOverlay?: (routine: Routine) => ReactNode;
  renderRight?: (routine: Routine) => ReactNode;
  routines: Routine[];
};

function RoutineSection({
  emptyText,
  icon,
  itemStyle,
  isRoutineDisabled,
  label,
  onEmptyPress,
  onPressRoutine,
  onShowMore,
  previewCount = routinePreviewCount,
  renderOverlay,
  renderRight,
  routines,
}: RoutineSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleGroup}>
          <Text style={styles.sectionIcon}>{icon ?? '🗓️'}</Text>
          <Text style={styles.sectionTitle}>{label}</Text>
        </View>
        {routines.length > previewCount && onShowMore && (
          <FeedbackPressable onPress={onShowMore} style={styles.showMoreButton}>
            <Text style={styles.showMoreText}>전체보기</Text>
            <BackIcon height={15} style={styles.showMoreIcon} width={15} />
          </FeedbackPressable>
        )}
      </View>
      {routines.length > 0 ? (
        <>
          <RoutineList
            itemStyle={itemStyle}
            isRoutineDisabled={isRoutineDisabled}
            renderRight={renderRight}
            renderOverlay={renderOverlay}
            routines={routines.slice(0, previewCount)}
            onPressRoutine={onPressRoutine}
          />
        </>
      ) : emptyText ? (
        <EmptyState
          actionLabel={onEmptyPress ? copy.openSchedule : undefined}
          onPress={onEmptyPress}
          text={emptyText}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  completedRoutine: { opacity: 0.14 },
  section: { gap: 9 },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    minHeight: 26,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitleGroup: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  scheduleTime: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  routineListSheet: { gap: 14, paddingBottom: 32, paddingHorizontal: 20 },
  routineListSheetTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  showMoreButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    minHeight: 26,
    paddingHorizontal: 4,
  },
  showMoreIcon: { opacity: 0.42, transform: [{ rotate: '180deg' }] },
  showMoreText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  statValue: { fontSize: 20 },
});
