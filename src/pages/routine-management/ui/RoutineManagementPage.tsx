import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { type Routine, starterRoutines, useRoutineStore } from '@/entities/routine';
import { useRoutineSheet } from '@/features/routine-sheet';
import { colors, screenStyles } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useToast } from '@/shared/ui/Toast';
import { FeedbackPressable as Pressable } from '@/shared/ui/FeedbackPressable';
import { Header, RoutineList } from '@/widgets';

const starterRoutineIds = new Set(starterRoutines.map((routine) => routine.id));

export function RoutineManagementPage() {
  const { routines, toggleRoutineVisibility } = useRoutineStore();
  const { openRoutineSheet } = useRoutineSheet();
  const { showToast } = useToast();
  const scrollRef = useRef<ScrollView>(null);
  const myRoutines = routines.filter((routine) => !starterRoutineIds.has(routine.id));
  const defaultRoutines = routines.filter((routine) => starterRoutineIds.has(routine.id));
  const openEditor = (routineId?: string) =>
    router.push(
      routineId ? { pathname: '/create-routine', params: { id: routineId } } : '/create-routine',
    );

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
    }, []),
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[screenStyles.content, styles.scrollContent]}
      >
        <Header eyebrow="나만의 루틴을 만들어보세요!" title="루틴 관리" />
        <RoutineSection
          count={`${myRoutines.length}개`}
          emptyText="새 루틴을 만들어 나만의 목록을 채워보세요."
          label="내가 만든 루틴"
          onPressRoutine={(routine) => openEditor(routine.id)}
          routines={myRoutines}
        />
        <RoutineSection
          count={`기본 제공 · ${defaultRoutines.length}개`}
          label="루틴 목록"
          onPressRoutine={(routine) =>
            openRoutineSheet(routine, {
              rightAction: (
                <VisibilityToggleButton
                  hidden={Boolean(routine.isHidden)}
                  onToggle={(nextHidden) => {
                    showToast(nextHidden ? '루틴 목록에서 숨겼어요.' : '루틴 목록에 표시했어요.');
                    setTimeout(() => toggleRoutineVisibility(routine.id), 130);
                    return true;
                  }}
                />
              ),
              showAction: false,
              showFavorite: false,
              showMascot: false,
            })
          }
          renderRight={(routine) => <VisibilityIcon hidden={Boolean(routine.isHidden)} />}
          routines={defaultRoutines}
        />
      </ScrollView>
      <Pressable onPress={() => openEditor()} style={[styles.createButton, { bottom: 86 }]}>
        <Text style={styles.createIcon}>＋</Text>
        <Text style={styles.createText}>새 루틴</Text>
      </Pressable>
    </View>
  );
}

type RoutineSectionProps = {
  count: string;
  emptyText?: string;
  label: string;
  onPressRoutine: (routine: Routine) => void;
  renderRight?: (routine: Routine) => ReactNode;
  routines: Routine[];
};

function RoutineSection({
  count,
  emptyText,
  label,
  onPressRoutine,
  renderRight,
  routines,
}: RoutineSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{label}</Text>
        <Text style={styles.count}>{count}</Text>
      </View>
      {routines.length ? (
        <RoutineList
          onPressRoutine={onPressRoutine}
          renderRight={renderRight}
          routines={routines}
        />
      ) : (
        <EmptyState text={emptyText ?? ''} />
      )}
    </View>
  );
}

function VisibilityToggleButton({
  hidden,
  onToggle,
}: {
  hidden: boolean;
  onToggle: (nextHidden: boolean) => boolean;
}) {
  const [isHidden, setIsHidden] = useState(hidden);
  const hiddenRef = useRef(hidden);
  const lockRef = useRef(false);

  useEffect(() => {
    hiddenRef.current = hidden;
    setIsHidden(hidden);
  }, [hidden]);

  return (
    <Pressable
      onPress={() => {
        if (lockRef.current) return;
        lockRef.current = true;
        const nextHidden = !hiddenRef.current;

        if (!onToggle(nextHidden)) {
          lockRef.current = false;
          return;
        }

        hiddenRef.current = nextHidden;
        setIsHidden(nextHidden);
        setTimeout(() => {
          lockRef.current = false;
        }, 300);
      }}
      style={styles.sheetAction}
    >
      <VisibilityIcon hidden={isHidden} size={28} />
    </Pressable>
  );
}

function VisibilityIcon({ hidden, size = 21 }: { hidden: boolean; size?: number }) {
  const color = hidden ? '#B5BDC5' : colors.primary;

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M2.5 12S5.9 6.5 12 6.5 21.5 12 21.5 12 18.1 17.5 12 17.5 2.5 12 2.5 12Z"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M12 14.7A2.7 2.7 0 1 0 12 9.3a2.7 2.7 0 0 0 0 5.4Z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
      {hidden && (
        <Path d="M4 4 20 20" fill="none" stroke={color} strokeLinecap="round" strokeWidth={2} />
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  count: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  createButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    elevation: 5,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'absolute',
    shadowColor: '#C94A36',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 9,
  },
  createIcon: { color: '#FFFFFF', fontSize: 22, fontWeight: '400', lineHeight: 22 },
  createText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  scrollContent: { paddingBottom: 188 },
  section: { gap: 10, marginTop: 10 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: '#111111', fontSize: 16, fontWeight: '900' },
  sheetAction: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
});
