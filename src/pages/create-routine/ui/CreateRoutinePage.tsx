import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, LogBox, StyleSheet, View } from 'react-native';
import {
  NestedReorderableList,
  reorderItems,
  ScrollViewContainer,
  useReorderableDrag,
} from 'react-native-reorderable-list';

import { type Routine, type Step, useRoutineStore } from '@/entities/routine';
import { colors } from '@/shared/config/theme';
import { minuteOptions } from '@/shared/config/timeOptions';
import { AppText as Text } from '@/shared/ui/AppText';
import { AppTextInput } from '@/shared/ui/AppTextInput';
import { formatDuration, useBackToHome } from '@/shared/lib';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { GestureWheelPicker } from '@/shared/ui/GestureWheelPicker';
import { TrashIcon } from '@/shared/ui/TrashIcon';
import { useToast } from '@/shared/ui/Toast';
import { FeedbackPressable as Pressable } from '@/shared/ui/FeedbackPressable';
import { BackHeader } from '@/widgets';

const icons = ['🌱', '☕', '🎧', '📝', '🧹', '🌙'];
const initialSteps = [
  { durationSec: 120, title: '준비물을 꺼내 책상 위에 올려두어요.' },
  { durationSec: 180, title: '가장 작은 부분부터 살짝 시작해요.' },
  { durationSec: 300, title: '5분 동안 집중해서 이어가요.' },
];

const createStep = (index: number): Step => ({
  durationSec: 60,
  id: `${Date.now()}-${index}`,
  title: '새로운 작은 행동을 적어주세요.',
});

export function CreateRoutinePage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addRoutine, removeRoutine, routines, updateRoutine } = useRoutineStore();
  const { showToast } = useToast();
  const existingRoutine = useMemo(() => routines.find((item) => item.id === id), [id, routines]);
  const [durationDraft, setDurationDraft] = useState<{ minutes: number; seconds: number } | null>(
    null,
  );
  const [icon, setIcon] = useState(existingRoutine?.icon ?? icons[0]);
  const [scrollContentHeight, setScrollContentHeight] = useState(0);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const [selectedDurationStepId, setSelectedDurationStepId] = useState<string | null>(null);
  const [description, setDescription] = useState(existingRoutine?.description ?? '');
  const [title, setTitle] = useState(existingRoutine?.title ?? '');
  const [steps, setSteps] = useState<Step[]>(
    existingRoutine?.steps ?? initialSteps.map((step, index) => ({ ...step, id: `new-${index}` })),
  );
  const isEditing = Boolean(existingRoutine);
  const changeDurationMinutes = useCallback((minutes: number) => {
    setDurationDraft((value) => value && { ...value, minutes });
  }, []);
  const changeDurationSeconds = useCallback((seconds: number) => {
    setDurationDraft((value) => value && { ...value, seconds });
  }, []);

  useBackToHome('/routine-management');
  useEffect(() => {
    LogBox.ignoreLogs(['VirtualizedLists should never be nested inside plain ScrollViews']);
  }, []);

  const updateStep = (stepId: string, patch: Partial<Step>) =>
    setSteps((items) => items.map((step) => (step.id === stepId ? { ...step, ...patch } : step)));
  const canSave = Boolean(title.trim() && steps.length);
  const selectedDurationStep = steps.find((step) => step.id === selectedDurationStepId);
  const isScrollable = scrollContentHeight > scrollViewportHeight + 1;
  const closeDurationSheet = () => {
    setDurationDraft(null);
    setSelectedDurationStepId(null);
  };
  const openDurationSheet = (step: Step) => {
    setDurationDraft({
      minutes: Math.floor(step.durationSec / 60),
      seconds: step.durationSec % 60,
    });
    setSelectedDurationStepId(step.id);
  };
  const saveDuration = () => {
    if (!selectedDurationStep || !durationDraft) return;

    updateStep(selectedDurationStep.id, {
      durationSec: durationDraft.minutes * 60 + durationDraft.seconds,
    });
    closeDurationSheet();
  };
  const save = () => {
    const nextTitle = title.trim();
    const nextDescription = description.trim() || '작은 단계로 시작해요.';
    if (!nextTitle || !steps.length) return;

    const routine: Routine = {
      description: nextDescription,
      icon,
      id: existingRoutine?.id ?? String(Date.now()),
      isFavorite: existingRoutine?.isFavorite,
      isHidden: existingRoutine?.isHidden,
      steps,
      title: nextTitle,
    };

    if (isEditing) {
      updateRoutine(routine);
      showToast('루틴을 수정했어요.');
    } else {
      addRoutine(routine);
      showToast('새 루틴을 만들었어요.');
    }
    router.replace('/routine-management');
  };
  const remove = () => {
    if (!existingRoutine) return;

    Alert.alert('루틴을 삭제할까요?', '등록된 일정과 완료 기록도 함께 삭제돼요.', [
      { style: 'cancel', text: '취소' },
      {
        onPress: () => {
          removeRoutine(existingRoutine.id);
          showToast('루틴을 삭제했어요.');
          router.replace('/routine-management');
        },
        style: 'destructive',
        text: '삭제',
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <BackHeader
        onBack={() => router.replace('/routine-management')}
        style={styles.pageHeader}
        title={isEditing ? '루틴 수정' : '루틴 만들기'}
      />
      <ScrollViewContainer
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={(_, height) => setScrollContentHeight(height)}
        onLayout={({ nativeEvent }) => setScrollViewportHeight(nativeEvent.layout.height)}
        overScrollMode="never"
        scrollEnabled={isScrollable}
        style={styles.scroll}
      >
        <View style={styles.titleRow}>
          <View style={styles.selectedIcon}>
            <Text style={styles.selectedIconText}>{icon}</Text>
          </View>
          <AppTextInput
            onChangeText={setTitle}
            placeholder="루틴 이름을 입력해요"
            placeholderTextColor="#B4B4B4"
            style={styles.titleInput}
            value={title}
          />
        </View>
        <View style={styles.iconRow}>
          {icons.map((item) => (
            <Pressable
              key={item}
              onPress={() => setIcon(item)}
              style={[styles.iconButton, item === icon && styles.activeIcon]}
            >
              <Text style={styles.iconText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <AppTextInput
          maxLength={50}
          onChangeText={setDescription}
          placeholder="이 루틴을 한 줄로 소개해 주세요"
          placeholderTextColor="#A3A3A3"
          style={styles.descriptionInput}
          value={description}
        />

        <Text style={styles.sectionLabel}>스텝 정하기</Text>
        <View style={styles.stepsEditor}>
          <NestedReorderableList
            data={steps}
            keyExtractor={(step) => step.id}
            onReorder={({ from, to }) => setSteps((items) => reorderItems(items, from, to))}
            renderItem={({ item, index }) => (
              <SortableStepCard
                index={index}
                isFirst={index === 0}
                onChange={(value) => updateStep(item.id, { title: value })}
                onRemove={() => setSteps((items) => items.filter((step) => step.id !== item.id))}
                showDivider={index < steps.length - 1}
                step={item}
              />
            )}
            scrollable={false}
            style={styles.stepList}
            contentContainerStyle={styles.stepListContent}
          />
          <Pressable
            onPress={() => setSteps((items) => [...items, createStep(items.length)])}
            style={styles.addStep}
          >
            <Text style={styles.addStepText}>＋ 스텝 추가하기</Text>
          </Pressable>
        </View>

        <View style={styles.timeHeading}>
          <Text style={styles.sectionLabel}>스텝별 시간 지정</Text>
        </View>
        <View style={styles.timeSection}>
          <View style={styles.timeList}>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.timeStep}>
                {index < steps.length - 1 && <View style={styles.timeConnector} />}
                <View style={[styles.stepNumber, styles.timeStepNumber]}>
                  <Text style={[styles.stepNumberText, styles.timeStepNumberText]}>
                    {index + 1}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.timeTitle}>
                  {step.title}
                </Text>
                <Pressable onPress={() => openDurationSheet(step)} style={styles.durationSelect}>
                  <Text style={styles.durationValue}>{formatDuration(step.durationSec)}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollViewContainer>
      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <Pressable
            disabled={!canSave}
            onPress={save}
            style={[styles.saveButton, !canSave && styles.saveDisabled]}
          >
            <Text style={styles.saveText}>{isEditing ? '루틴 수정 완료' : '루틴 만들기'}</Text>
          </Pressable>
          {isEditing && (
            <Pressable accessibilityLabel="루틴 삭제" onPress={remove} style={styles.deleteButton}>
              <TrashIcon />
            </Pressable>
          )}
        </View>
      </View>
      {selectedDurationStep && durationDraft && (
        <BottomSheet onClose={closeDurationSheet} visible>
          <View style={styles.durationSheet}>
            <Text style={styles.durationSheetTitle}>시간 선택</Text>
            <Text style={styles.durationSheetDescription}>{selectedDurationStep.title}</Text>
            <View style={styles.durationWheels}>
              <GestureWheelPicker
                data={minuteOptions}
                itemHeight={48}
                onValueChange={changeDurationMinutes}
                value={durationDraft.minutes}
                width={96}
              />
              <Text style={styles.durationColon}>:</Text>
              <GestureWheelPicker
                data={minuteOptions}
                itemHeight={48}
                onValueChange={changeDurationSeconds}
                value={durationDraft.seconds}
                width={96}
              />
            </View>
            <Pressable onPress={saveDuration} style={styles.durationDone}>
              <Text style={styles.durationDoneText}>완료</Text>
            </Pressable>
          </View>
        </BottomSheet>
      )}
    </View>
  );
}

function SortableStepCard({
  index,
  isFirst,
  onChange,
  onRemove,
  showDivider,
  step,
}: {
  index: number;
  isFirst: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
  showDivider: boolean;
  step: Step;
}) {
  const drag = useReorderableDrag();

  return (
    <View style={[styles.stepCard, isFirst && styles.stepFirst, showDivider && styles.stepDivider]}>
      <Pressable delayLongPress={180} onLongPress={drag} style={styles.dragHandle}>
        <Text style={styles.drag}>⠿</Text>
      </Pressable>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{index + 1}</Text>
      </View>
      <AppTextInput onChangeText={onChange} style={styles.stepInput} value={step.title} />
      <Pressable hitSlop={8} onPress={onRemove}>
        <Text style={styles.remove}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  activeIcon: { backgroundColor: colors.soft, borderColor: colors.primary, borderWidth: 2 },
  addStep: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderRadius: 14,
    justifyContent: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    minHeight: 43,
  },
  addStepText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  container: { backgroundColor: '#FFFFFF', flex: 1 },
  content: { gap: 14, padding: 20 },
  drag: { color: '#B5B5B5', fontSize: 17, letterSpacing: -3 },
  dragHandle: { alignItems: 'center', justifyContent: 'center', minHeight: 42, width: 18 },
  durationColon: { color: '#202020', fontSize: 23, fontWeight: '800' },
  durationDone: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
  },
  durationDoneText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9D9D5',
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    height: 46,
    paddingHorizontal: 16,
  },
  durationSelect: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    // minWidth: 78,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  durationSheet: { gap: 14, paddingHorizontal: 24, paddingBottom: 18 },
  durationSheetDescription: { color: '#727272', fontSize: 13 },
  durationSheetTitle: { color: '#202020', fontSize: 18, fontWeight: '800' },
  durationValue: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  durationWheels: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center' },
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
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E8E8E4',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footerActions: { flexDirection: 'row', gap: 10 },
  pageHeader: { marginTop: 20, paddingHorizontal: 20 },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CFCFCF',
    borderRadius: 9,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconText: { fontSize: 22 },
  remove: { color: '#A8A8A8', fontSize: 23, fontWeight: '300', lineHeight: 23 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  saveDisabled: { backgroundColor: '#C9C9C9' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  scroll: { flex: 1 },
  sectionLabel: { color: '#252522', fontSize: 15, fontWeight: '800', marginTop: 8 },
  selectedIcon: {
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderColor: '#111111',
    borderRadius: 12,
    // borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  selectedIconText: { fontSize: 29 },
  stepCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    gap: 10,
    minHeight: 62,
    paddingHorizontal: 14,
  },
  stepDivider: { borderBottomColor: '#F4F7FA', borderBottomWidth: 2 },
  stepFirst: { borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  stepInput: { color: '#252522', flex: 1, fontSize: 14, fontWeight: '600', paddingVertical: 7 },
  stepList: { marginHorizontal: -12, overflow: 'visible' },
  stepListContent: { overflow: 'visible', paddingHorizontal: 12 },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderColor: 'transparent',
    borderRadius: 13,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  stepNumberText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  timeConnector: {
    backgroundColor: colors.primary,
    height: 32,
    left: 13,
    position: 'absolute',
    top: 26,
    width: 1,
  },
  timeStep: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 40,
    position: 'relative',
  },
  timeHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeList: { gap: 8 },
  timeSection: {
    borderColor: '#81817E',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  timeStepNumber: { backgroundColor: colors.soft, borderColor: 'transparent' },
  timeStepNumberText: { color: colors.primary },
  timeTitle: { color: '#252522', flex: 1, fontSize: 13, fontWeight: '600' },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#81817E',
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    height: 56,
    paddingHorizontal: 16,
  },
  titleRow: { flexDirection: 'row', gap: 12 },
  stepsEditor: {
    borderColor: '#81817E',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'visible',
    paddingBottom: 12,
    paddingTop: 4,
  },
});
