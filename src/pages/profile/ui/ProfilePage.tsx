import dayjs from 'dayjs';
import { useCallback, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BarChart } from 'react-native-gifted-charts';

import { AdBanner, Header, RoutineList } from '@/widgets';
import { formatCompactDuration } from '@/shared/lib';
import { calculateTotalDuration, type Routine, useRoutineStore } from '@/entities/routine';
import { AppText as Text } from '@/shared/ui/AppText';
import { StatCard } from '@/shared/ui/StatCard';
import { colors, screenStyles } from '@/shared/config/theme';
import { EmptyState } from '@/shared/ui/EmptyState';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import DoneIcon from '@/assets/images/doneIcon.svg';
import TimeIcon from '@/assets/images/timeIcon.svg';
import { FeedbackPressable as Pressable } from '@/shared/ui/FeedbackPressable';
import SettingsIcon from '@/assets/images/settingsIcon.svg';

const formatCompletedAt = (finishedAt: string | number) =>
  new Date(finishedAt).toLocaleString('ko-KR', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'numeric',
  });

type CompletedRoutine = Routine & { finishedAt: number };

export function ProfilePage() {
  const { width } = useWindowDimensions();
  const { completions, routines } = useRoutineStore();
  const scrollRef = useRef<ScrollView>(null);
  const totalCompletedDurationSec = useMemo(
    () => calculateTotalDuration(completions, routines),
    [completions, routines],
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const chartWidth = width - 76;
  const chartSpacing = Math.max(12, (chartWidth - 16 - 7 * 22) / 6);
  const weeklyValues = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = dayjs().subtract(6 - index, 'day');

        return completions.filter((completion) => dayjs(completion.finishedAt).isSame(date, 'day'))
          .length;
      }),
    [completions],
  );
  const highestValue = Math.max(...weeklyValues);
  const weeklyData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = dayjs().subtract(6 - index, 'day');

        return {
          frontColor:
            weeklyValues[index] === highestValue && highestValue > 0 ? '#F5AE28' : '#B9DDF8',
          label: date.format('M/D'),
          labelTextStyle: { color: colors.muted, fontSize: 11, fontWeight: '700' as const },
          onPress: () => setSelectedDate(date.format('YYYY-MM-DD')),
          value: weeklyValues[index],
        };
      }),
    [highestValue, weeklyValues],
  );
  const allCompletedRoutines = useMemo<CompletedRoutine[]>(() => {
    const routineById = new Map(routines.map((routine) => [routine.id, routine]));

    return completions
      .slice()
      .reverse()
      .flatMap((completion) => {
        const routine = routineById.get(completion.routineId);

        return routine
          ? [
              {
                ...routine,
                finishedAt: completion.finishedAt,
                id: `${routine.id}-${completion.finishedAt}`,
              },
            ]
          : [];
      });
  }, [completions, routines]);
  const completedRoutines = allCompletedRoutines.slice(0, 10);
  const selectedRoutines = selectedDate
    ? allCompletedRoutines.filter((routine) =>
        dayjs(routine.finishedAt).isSame(selectedDate, 'day'),
      )
    : [];
  const completedAtById = useMemo(
    () => new Map(allCompletedRoutines.map((routine) => [routine.id, routine.finishedAt])),
    [allCompletedRoutines],
  );

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
    }, []),
  );

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={screenStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Header
        eyebrow="지금까지의 내 이력을 볼 수 있어요!"
        right={
          <Pressable
            accessibilityLabel="설정 열기"
            hitSlop={10}
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <SettingsIcon height={30} width={30} />
          </Pressable>
        }
        title="내 정보"
      />
      <Text style={styles.activityTitle}>활동 기록</Text>
      <View style={screenStyles.statsRow}>
        <StatCard
          icon={<TimeIcon height={36} width={36} />}
          label="누적 완료 시간"
          value={formatCompactDuration(totalCompletedDurationSec)}
          valueStyle={styles.totalDurationValue}
        />
        <StatCard
          icon={<DoneIcon height={36} width={36} />}
          label="총 완료"
          value={`${completions.length}회`}
          valueStyle={styles.totalDurationValue}
        />
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>최근 7일</Text>
        <BarChart
          barWidth={22}
          data={weeklyData}
          endSpacing={4}
          height={150}
          hideRules
          hideYAxisText
          initialSpacing={8}
          isAnimated
          maxValue={Math.max(...weeklyValues, 3)}
          noOfSections={3}
          overflowTop={28}
          roundedTop
          showValuesAsTopLabel
          spacing={chartSpacing}
          topLabelTextStyle={styles.barValue}
          width={chartWidth}
          xAxisColor="transparent"
          xAxisThickness={0}
          yAxisColor="transparent"
          yAxisLabelWidth={0}
          yAxisThickness={0}
        />
      </View>

      <AdBanner />

      <View style={styles.recentHeading}>
        <Text style={styles.recentTitle}>최근 완료</Text>
        <Text style={styles.recentLimit}>최대 10개</Text>
      </View>
      {completedRoutines.length ? (
        <RoutineList
          isRoutineDisabled={() => true}
          onPressRoutine={() => {}}
          renderRight={(routine) => (
            <Text style={styles.completedAt}>
              {formatCompletedAt(completedAtById.get(routine.id) ?? '')}
            </Text>
          )}
          routines={completedRoutines}
        />
      ) : (
        <EmptyState text="아직 완료한 루틴이 없어요." />
      )}
      {selectedDate && (
        <BottomSheet onClose={() => setSelectedDate(null)} scrollable visible>
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{dayjs(selectedDate).format('M월 D일')} 완료 기록</Text>
            {selectedRoutines.length ? (
              <RoutineList
                isRoutineDisabled={() => true}
                onPressRoutine={() => {}}
                renderRight={(routine) => (
                  <Text style={styles.completedAt}>
                    {formatCompletedAt(completedAtById.get(routine.id) ?? '')}
                  </Text>
                )}
                routines={selectedRoutines}
              />
            ) : (
              <EmptyState text="이날은 완료한 루틴이 없어요." />
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  activityTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 10 },
  barValue: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  chartCard: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  chartTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  completedAt: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  recentTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 4 },
  recentHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  recentLimit: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  settingsButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  sheetContent: { gap: 14, paddingBottom: 32, paddingHorizontal: 20 },
  sheetTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  totalDurationValue: { fontSize: 20 },
});
