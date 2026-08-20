import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  formatScheduleTime,
  getScheduleEntries,
  type Schedule,
  useRoutineStore,
} from '@/entities/routine';
import { useUser } from '@/entities/user';
import { colors, screenStyles } from '@/shared/config/theme';
import { minuteOptions, periodOptions, twelveHourOptions } from '@/shared/config/timeOptions';
import { AppText as Text } from '@/shared/ui/AppText';
import {
  cancelRoutineNotifications,
  hasRoutineNotificationPermission,
  scheduleRoutineNotifications,
} from '@/shared/lib';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useToast } from '@/shared/ui/Toast';
import { GestureWheelPicker } from '@/shared/ui/GestureWheelPicker';
import { TrashIcon } from '@/shared/ui/TrashIcon';
import { FeedbackPressable as Pressable } from '@/shared/ui/FeedbackPressable';
import { Header, RoutineCompletionOverlay, RoutineList } from '@/widgets';

import { repeatOptions, type RepeatType, weekdays } from '../model/options';
import { ScheduleCalendar } from './ScheduleCalendar';

const copy = {
  dateRoutines: '에 할 루틴',
  description: '루틴을 누르면 이 날짜에 추가되고, 시작 시간을 지정할 수 있어요.',
  eyebrow: '계획적인 루틴 설계를 할 수 있어요!',
  title: '일정',
};
export function SchedulePage() {
  const { completions, removeSchedule, routines, saveSchedule, scheduleItems } = useRoutineStore();
  const { notificationSettings } = useUser();
  const { showToast } = useToast();
  const [month, setMonth] = useState(dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [draftRoutineId, setDraftRoutineId] = useState<string | null>(null);
  const [draftTime, setDraftTime] = useState('09:00');
  const [rangeEnd, setRangeEnd] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  const [rangeStart, setRangeStart] = useState(dayjs().format('YYYY-MM-DD'));
  const [isRangeStartPickerOpen, setIsRangeStartPickerOpen] = useState(false);
  const [isRangeEndPickerOpen, setIsRangeEndPickerOpen] = useState(false);
  const [repeat, setRepeat] = useState<RepeatType>('once');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const notificationSyncingScheduleIds = useRef(new Set<string>());
  const scheduleItemsRef = useRef(scheduleItems);
  const scrollRef = useRef<ScrollView>(null);
  const isEditingSchedule = Boolean(editingScheduleId);
  const resetScheduleDraft = useCallback(() => {
    setDraftRoutineId(null);
    setDraftTime('09:00');
    setEditingScheduleId(null);
    setIsRangeEndPickerOpen(false);
    setIsRangeStartPickerOpen(false);
    setRangeEnd(dayjs(selectedDate).add(7, 'day').format('YYYY-MM-DD'));
    setRangeStart(selectedDate);
    setRepeat('once');
    setRepeatDays([1, 2, 3, 4, 5]);
  }, [selectedDate]);
  const changeDraftPeriod = useCallback((period: 'AM' | 'PM') => {
    setDraftTime((time) => {
      const hour = Number(time.slice(0, 2)) % 12;
      return `${String(period === 'PM' ? hour + 12 : hour).padStart(2, '0')}:${time.slice(3)}`;
    });
  }, []);
  const changeDraftHour = useCallback((hour: number) => {
    setDraftTime((time) => {
      const period = Number(time.slice(0, 2)) >= 12 ? 'PM' : 'AM';
      return `${String(period === 'PM' ? (hour % 12) + 12 : hour % 12).padStart(2, '0')}:${time.slice(3)}`;
    });
  }, []);
  const changeDraftMinute = useCallback((minute: number) => {
    setDraftTime((time) => `${time.slice(0, 2)}:${String(minute).padStart(2, '0')}`);
  }, []);
  const draftPeriod = Number(draftTime.slice(0, 2)) >= 12 ? 'PM' : 'AM';
  const selectedScheduleEntries = useMemo(
    () =>
      getScheduleEntries({
        completions,
        date: selectedDate,
        routines,
        schedules: scheduleItems,
      }),
    [completions, routines, scheduleItems, selectedDate],
  );
  const scheduleEntryById = useMemo(
    () => new Map(selectedScheduleEntries.map((entry) => [entry.schedule.id, entry])),
    [selectedScheduleEntries],
  );
  const selectedDateRoutines = useMemo(
    () =>
      selectedScheduleEntries.map(({ routine, schedule }) => ({
        ...routine,
        id: schedule.id,
      })),
    [selectedScheduleEntries],
  );
  const isScheduledRoutineCompleted = (scheduleId: string) =>
    Boolean(scheduleEntryById.get(scheduleId)?.isCompleted);
  const updateScheduleCache = useCallback((schedule: Schedule) => {
    scheduleItemsRef.current = scheduleItemsRef.current.some((item) => item.id === schedule.id)
      ? scheduleItemsRef.current.map((item) => (item.id === schedule.id ? schedule : item))
      : [...scheduleItemsRef.current, schedule];
  }, []);
  const syncScheduleNotifications = useCallback(
    async (scheduleId: string) => {
      if (notificationSyncingScheduleIds.current.has(scheduleId)) return;

      notificationSyncingScheduleIds.current.add(scheduleId);

      try {
        while (true) {
          const schedule = scheduleItemsRef.current.find((item) => item.id === scheduleId);

          if (
            !schedule ||
            (!schedule.notificationSyncPending && schedule.notificationIds !== undefined)
          ) {
            return;
          }

          const routine = routines.find((item) => item.id === schedule.routineId);

          if (!routine) return;

          const revision = schedule.notificationSyncRevision;

          await cancelRoutineNotifications(schedule.notificationIds);

          const notificationResult = await scheduleRoutineNotifications(routine, schedule);
          const latestSchedule = scheduleItemsRef.current.find((item) => item.id === scheduleId);

          if (!latestSchedule) {
            await cancelRoutineNotifications(notificationResult.notificationIds);
            return;
          }

          if (latestSchedule.notificationSyncRevision !== revision) {
            await cancelRoutineNotifications(notificationResult.notificationIds);
            continue;
          }

          const syncedSchedule = {
            ...latestSchedule,
            notificationIds: notificationResult.notificationIds,
            notificationSyncPending: false,
          };

          updateScheduleCache(syncedSchedule);
          await saveSchedule(syncedSchedule);

          if (!notificationResult.permissionGranted) {
            showToast('일정은 저장했어요. 알림 권한을 허용하면 시작 시간에 알려드려요.');
          }

          return;
        }
      } catch (error) {
        console.warn('Routine notification sync failed:', error);
      } finally {
        notificationSyncingScheduleIds.current.delete(scheduleId);
      }
    },
    [routines, saveSchedule, showToast, updateScheduleCache],
  );

  useFocusEffect(
    useCallback(() => {
      const today = dayjs();

      setMonth(today.startOf('month'));
      setSelectedDate(today.format('YYYY-MM-DD'));
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
    }, []),
  );

  useEffect(() => {
    scheduleItemsRef.current = scheduleItems;
  }, [scheduleItems]);

  useEffect(() => {
    if (!notificationSettings.routineReminders) return;

    const schedulesToSync = scheduleItems.filter(
      (schedule) => schedule.notificationSyncPending || schedule.notificationIds === undefined,
    );

    if (!schedulesToSync.length) return;

    void hasRoutineNotificationPermission().then((permissionGranted) => {
      if (!permissionGranted) return;

      schedulesToSync.forEach((schedule) => {
        void syncScheduleNotifications(schedule.id);
      });
    });
  }, [notificationSettings.routineReminders, scheduleItems, syncScheduleNotifications]);

  const applySchedule = async () => {
    if (!draftRoutineId) return;
    const isEditing = !!editingScheduleId;
    const normalizedRangeEnd = dayjs(rangeEnd).isBefore(rangeStart, 'day') ? rangeStart : rangeEnd;
    const schedule: Schedule = {
      id: editingScheduleId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      routineId: draftRoutineId,
      time: draftTime,
      type: repeat,
      startDate: repeat === 'range' ? rangeStart : selectedDate,
      ...(repeat === 'range' ? { endDate: normalizedRangeEnd } : {}),
      ...(repeat === 'weekdays' ? { days: repeatDays } : {}),
    };
    const previousSchedule = scheduleItemsRef.current.find((item) => item.id === editingScheduleId);
    const routine = routines.find((item) => item.id === draftRoutineId);
    const shouldSyncNotifications = notificationSettings.routineReminders && Boolean(routine);
    const savedSchedule: Schedule = {
      ...schedule,
      notificationIds: shouldSyncNotifications ? previousSchedule?.notificationIds : [],
      notificationSyncPending: shouldSyncNotifications,
      ...(shouldSyncNotifications
        ? {
            notificationSyncRevision: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          }
        : {}),
    };

    updateScheduleCache(savedSchedule);
    await saveSchedule(savedSchedule);
    setIsEditorOpen(false);
    showToast(isEditing ? '일정을 수정했어요.' : '일정을 추가했어요.');

    if (shouldSyncNotifications) void syncScheduleNotifications(savedSchedule.id);
  };
  const deleteSchedule = async () => {
    if (!editingScheduleId) return;

    const schedule = scheduleItemsRef.current.find((item) => item.id === editingScheduleId);

    scheduleItemsRef.current = scheduleItemsRef.current.filter(
      (item) => item.id !== editingScheduleId,
    );
    await removeSchedule(editingScheduleId);
    setEditingScheduleId(null);
    setIsEditorOpen(false);
    showToast('일정을 삭제했어요.');

    void cancelRoutineNotifications(schedule?.notificationIds);
  };

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={screenStyles.content}>
      <Header eyebrow={copy.eyebrow} title={copy.title} />
      <ScheduleCalendar
        month={month}
        onChangeMonth={setMonth}
        onSelectDate={setSelectedDate}
        schedules={scheduleItems}
        selectedDate={selectedDate}
      />
      <Pressable
        onPress={() => {
          resetScheduleDraft();
          setIsEditorOpen(true);
        }}
        style={styles.addScheduleButton}
      >
        <Text style={styles.addScheduleText}>+ 일정 추가</Text>
      </Pressable>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{dayjs(selectedDate).format('MM.DD')} 일정</Text>
        {selectedScheduleEntries.length > 0 ? (
          <RoutineList
            itemStyle={(routine) =>
              isScheduledRoutineCompleted(routine.id) && styles.completedRoutine
            }
            isRoutineDisabled={(routine) => isScheduledRoutineCompleted(routine.id)}
            renderOverlay={(routine) =>
              isScheduledRoutineCompleted(routine.id) ? <RoutineCompletionOverlay /> : null
            }
            routines={selectedDateRoutines}
            onPressRoutine={(routine) => {
              const schedule = scheduleEntryById.get(routine.id)?.schedule;

              if (!schedule || isScheduledRoutineCompleted(routine.id)) {
                showToast('완료한 일정은 수정할 수 없어요.');
                return;
              }

              setDraftRoutineId(schedule.routineId);
              setEditingScheduleId(schedule.id);
              setRepeat(schedule.type);
              setRangeStart(schedule.startDate);
              setRangeEnd(
                schedule.endDate ?? dayjs(selectedDate).add(7, 'day').format('YYYY-MM-DD'),
              );
              setRepeatDays(schedule.days ?? [1, 2, 3, 4, 5]);
              setDraftTime(schedule.time);
              setIsEditorOpen(true);
            }}
            renderRight={(routine) => (
              <Text style={styles.timeText}>
                {formatScheduleTime(scheduleEntryById.get(routine.id)?.schedule.time ?? '00:00')}
              </Text>
            )}
          />
        ) : (
          <EmptyState text="아직 등록한 루틴이 없어요." />
        )}
      </View>
      {isEditorOpen && (
        <BottomSheet onClose={() => setIsEditorOpen(false)} scrollable visible>
          <BottomSheetScrollView contentContainerStyle={styles.sheet}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {dayjs(selectedDate).format('M월 D일')}
                {copy.dateRoutines}
              </Text>
              <Text style={styles.description}>{copy.description}</Text>
              {draftRoutineId && (
                <RoutineList
                  routines={routines.filter((routine) => routine.id === draftRoutineId)}
                  onPressRoutine={() => !isEditingSchedule && setDraftRoutineId(null)}
                  renderRight={() =>
                    !isEditingSchedule ? (
                      <Text style={styles.changeRoutineText}>다시 선택</Text>
                    ) : (
                      <></>
                    )
                  }
                />
              )}
              {draftRoutineId && (
                <View style={styles.repeatCard}>
                  <Text style={styles.repeatTitle}>반복 설정</Text>
                  <View style={styles.repeatOptions}>
                    {repeatOptions.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => setRepeat(option.id)}
                        style={[
                          styles.repeatOption,
                          repeat === option.id && styles.repeatOptionActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.repeatOptionText,
                            repeat === option.id && styles.repeatOptionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {repeat === 'weekdays' && (
                    <View style={styles.dayOptions}>
                      {weekdays.map((day, index) => (
                        <Pressable
                          key={day}
                          onPress={() =>
                            setRepeatDays((days) =>
                              days.includes(index)
                                ? days.filter((value) => value !== index)
                                : [...days, index],
                            )
                          }
                          style={[
                            styles.dayOption,
                            repeatDays.includes(index) && styles.dayOptionActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayOptionText,
                              repeatDays.includes(index) && styles.dayOptionTextActive,
                            ]}
                          >
                            {day}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {repeat === 'range' && (
                    <View style={styles.rangeRow}>
                      <Pressable
                        onPress={() => setIsRangeStartPickerOpen(true)}
                        style={styles.rangeDate}
                      >
                        <Text style={styles.rangeLabel}>시작</Text>
                        <Text style={styles.rangeValue}>
                          {dayjs(rangeStart).format('YY/MM/DD')}
                        </Text>
                      </Pressable>
                      <Text style={styles.rangeDash}>~</Text>
                      <Pressable
                        onPress={() => setIsRangeEndPickerOpen(true)}
                        style={styles.rangeDate}
                      >
                        <Text style={styles.rangeLabel}>종료</Text>
                        <Text style={styles.rangeValue}>{dayjs(rangeEnd).format('YY/MM/DD')}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
              {draftRoutineId && (
                <View style={styles.wheelCard}>
                  <Text style={styles.timeSettingLabel}>시작 시간</Text>
                  <View style={styles.wheels}>
                    <GestureWheelPicker
                      data={periodOptions}
                      itemHeight={46}
                      onValueChange={changeDraftPeriod}
                      value={draftPeriod}
                      width={84}
                    />
                    <GestureWheelPicker
                      data={twelveHourOptions}
                      itemHeight={46}
                      onValueChange={changeDraftHour}
                      value={Number(draftTime.slice(0, 2)) % 12 || 12}
                      width={84}
                    />
                    <Text style={styles.timeColon}>:</Text>
                    <GestureWheelPicker
                      data={minuteOptions}
                      itemHeight={46}
                      onValueChange={changeDraftMinute}
                      value={Number(draftTime.slice(3))}
                      width={84}
                    />
                  </View>
                </View>
              )}
              {!draftRoutineId && (
                <RoutineList
                  routines={routines}
                  onPressRoutine={(routine) => setDraftRoutineId(routine.id)}
                />
              )}
              {draftRoutineId && (
                <View style={styles.actionButtons}>
                  <Pressable onPress={applySchedule} style={styles.confirmButton}>
                    <Text style={styles.confirmText}>루틴 설정 완료</Text>
                  </Pressable>
                  {isEditingSchedule && (
                    <Pressable
                      accessibilityLabel="일정 삭제"
                      onPress={deleteSchedule}
                      style={styles.deleteButton}
                    >
                      <TrashIcon />
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      )}
      {isRangeStartPickerOpen && (
        <DateTimePicker
          mode="date"
          onChange={(_, date) => {
            setIsRangeStartPickerOpen(false);
            if (date) {
              const start = dayjs(date).format('YYYY-MM-DD');
              setRangeStart(start);
              if (dayjs(rangeEnd).isBefore(start)) setRangeEnd(start);
            }
          }}
          value={dayjs(rangeStart).toDate()}
        />
      )}
      {isRangeEndPickerOpen && (
        <DateTimePicker
          minimumDate={dayjs(rangeStart).toDate()}
          mode="date"
          onChange={(_, date) => {
            setIsRangeEndPickerOpen(false);
            if (date) {
              const end = dayjs(date).format('YYYY-MM-DD');

              setRangeEnd(dayjs(end).isBefore(rangeStart, 'day') ? rangeStart : end);
            }
          }}
          value={dayjs(rangeEnd).toDate()}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addScheduleButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: 8,
    paddingVertical: 15,
  },
  addScheduleText: { color: colors.card, fontSize: 15, fontWeight: '800' },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmText: { color: colors.card, fontSize: 15, fontWeight: '800' },
  completedRoutine: { opacity: 0.14 },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderColor: '#FFD1D1',
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  dayOption: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  dayOptionActive: { backgroundColor: colors.primary },
  dayOptionText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  dayOptionTextActive: { color: colors.card },
  dayOptions: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
  },
  changeRoutineText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 13 },
  rangeDash: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  rangeDate: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 9,
  },
  rangeLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  rangeRow: { alignItems: 'center', flexDirection: 'row', gap: 8, height: 48 },
  rangeValue: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  repeatCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    gap: 10,
    padding: 14,
  },
  repeatOption: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 9,
  },
  repeatOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  repeatOptionText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  repeatOptionTextActive: { color: colors.card },
  repeatOptions: { flexDirection: 'row', gap: 7 },
  repeatTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  section: { gap: 8 },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  sheet: { gap: 16, minHeight: '72%', padding: 20, paddingTop: 0, paddingBottom: 40 },
  timeText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  timeColon: { color: colors.muted, fontSize: 20, fontWeight: '700' },
  timeSettingLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  wheelCard: { backgroundColor: '#F5F7FA', borderRadius: 16, gap: 8, padding: 14 },
  wheels: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center' },
});
