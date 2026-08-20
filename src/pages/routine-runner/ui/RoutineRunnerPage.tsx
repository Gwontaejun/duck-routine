import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AdBanner } from '@/widgets';
import { formatDuration } from '@/shared/lib';
import { useToast } from '@/shared/ui/Toast';
import { useRoutineStore } from '@/entities/routine';
import { AppText as Text } from '@/shared/ui/AppText';
import { colors } from '@/shared/config/theme';
import { FavoriteIcon } from '@/shared/ui/FavoriteIcon';
import { PrimaryButton } from '@/shared/ui/PrimaryButton';
import BackIcon from '@/assets/images/backIcon.svg';
import { FeedbackPressable as Pressable } from '@/shared/ui/FeedbackPressable';

import { CelebrationParticles } from './CelebrationParticles';

const timerRadius = 134;
const timerCircumference = 2 * Math.PI * timerRadius;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export function RoutineRunnerPage() {
  const { id, scheduleId } = useLocalSearchParams<{ id: string; scheduleId?: string }>();
  const { completeRoutine, routines, toggleFavorite } = useRoutineStore();
  const { showToast } = useToast();
  const routine = routines.find((item) => item.id === id);
  const [completed, setCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [remainingSec, setRemainingSec] = useState(routine?.steps[0]?.durationSec ?? 0);
  const timerProgress = useSharedValue(1);
  const firstStepDuration = routine?.steps[0]?.durationSec ?? 0;

  const step = routine?.steps[currentIndex];
  const progress = useMemo(
    () => (routine ? ((currentIndex + 1) / routine.steps.length) * 100 : 0),
    [currentIndex, routine],
  );
  const animatedTimerProps = useAnimatedProps(() => ({
    strokeDashoffset: timerCircumference * (1 - timerProgress.value),
  }));

  useEffect(() => {
    setCompleted(false);
    setCurrentIndex(0);
    setIsRunning(true);
    setRemainingSec(firstStepDuration);
    timerProgress.value = 1;
  }, [firstStepDuration, routine?.id, timerProgress]);

  useEffect(() => {
    setIsFavorite(Boolean(routine?.isFavorite));
  }, [routine?.isFavorite]);

  useEffect(() => {
    if (!isRunning || !remainingSec || completed || !step) {
      cancelAnimation(timerProgress);
      return;
    }

    timerProgress.value = withTiming(Math.max(0, remainingSec - 1) / step.durationSec, {
      duration: 1000,
      easing: Easing.linear,
    });
    const timer = setTimeout(() => {
      setRemainingSec((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      cancelAnimation(timerProgress);
      clearTimeout(timer);
    };
  }, [completed, isRunning, remainingSec, step, timerProgress]);

  if (!routine || !step) {
    return (
      <View style={styles.emptyPage}>
        <Text style={styles.emptyTitle}>루틴을 찾지 못했어요.</Text>
        <PrimaryButton label="홈으로 돌아가기" onPress={() => router.replace('/home')} />
      </View>
    );
  }

  const moveNext = () => {
    if (currentIndex === routine.steps.length - 1) {
      completeRoutine(routine.id, scheduleId);
      setCompleted(true);
      setIsRunning(false);
      showToast('루틴을 완료했어요. 오늘도 해냈어요!');
      return;
    }

    const nextStep = routine.steps[currentIndex + 1];
    timerProgress.value = 1;
    setCurrentIndex((value) => value + 1);
    setRemainingSec(nextStep.durationSec);
    setIsRunning(true);
  };

  const movePrevious = () => {
    if (!currentIndex) return;

    const previousStep = routine.steps[currentIndex - 1];
    timerProgress.value = 1;
    setCurrentIndex((value) => value - 1);
    setRemainingSec(previousStep.durationSec);
    setIsRunning(true);
  };

  if (completed) {
    return (
      <View style={styles.completePage}>
        <View style={styles.completeHero}>
          <View style={styles.completeMascot}>
            <CelebrationParticles />
            <Image
              source={require('../../../../assets/images/celebrateDuck.png')}
              style={styles.completeMascotImage}
            />
          </View>
          <View style={styles.completeCopy}>
            <Text style={styles.completeTitle}>루틴을 끝까지 해냈어요!</Text>
            <Text style={styles.completeDescription}>
              {routine.title}을(를){`\n`}끝까지 완료한 자신을 가볍게 칭찬해 주세요!
            </Text>
          </View>
        </View>
        <View style={styles.completeActions}>
          <View style={styles.completeHomeButton}>
            <PrimaryButton label="홈으로 돌아가기" onPress={() => router.replace('/home')} />
          </View>
          <View style={styles.completeSecondaryActions}>
            <Pressable
              accessibilityLabel={isFavorite ? '즐겨찾기에서 해제' : '즐겨찾기에 추가'}
              onPress={() => {
                const nextFavorite = !isFavorite;

                setIsFavorite(nextFavorite);
                toggleFavorite(routine.id);
                showToast(nextFavorite ? '즐겨찾기에 추가했어요.' : '즐겨찾기에서 해제했어요.');
              }}
              style={({ pressed }) => [
                styles.favoriteSecondaryButton,
                isFavorite && styles.favoriteSecondaryButtonActive,
                pressed && styles.pressed,
              ]}
            >
              <FavoriteIcon active={isFavorite} size={19} />
              <Text style={styles.secondaryButtonText}>
                {isFavorite ? '즐겨찾기됨' : '즐겨찾기'}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/profile')} style={styles.profileButton}>
              <Text style={styles.secondaryButtonText}>내 정보</Text>
            </Pressable>
          </View>
          <AdBanner />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="이전으로 돌아가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <BackIcon height={22} width={22} />
        </Pressable>
        <Text numberOfLines={1} style={styles.routineTitle}>
          {routine.icon} {routine.title}
        </Text>
        <Text style={styles.stepCount}>
          {currentIndex + 1}/{routine.steps.length}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressValue, { width: `${progress}%` }]} />
      </View>

      <View style={styles.main}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>STEP {currentIndex + 1}</Text>
        </View>
        <Text style={styles.stepTitle}>{step.title}</Text>

        <View style={styles.timerPanel}>
          <Image
            source={require('../../../../assets/images/focusDuck.png')}
            style={styles.mascot}
          />
          <Svg height={300} viewBox="0 0 300 300" width={300}>
            <Circle
              cx={150}
              cy={150}
              fill={colors.background}
              r={timerRadius}
              stroke="#F0EEE9"
              strokeWidth={10}
            />
            <AnimatedCircle
              cx={150}
              cy={150}
              fill="none"
              r={timerRadius}
              stroke={colors.primary}
              strokeDasharray={timerCircumference}
              strokeLinecap="round"
              strokeWidth={10}
              transform="rotate(-90 150 150)"
              animatedProps={animatedTimerProps}
            />
          </Svg>
          <View pointerEvents="box-none" style={styles.timerContent}>
            <Text style={styles.timerLabel}>{remainingSec ? '남은 시간' : '시간이 끝났어요'}</Text>
            <Text style={styles.timer}>{formatDuration(remainingSec)}</Text>
            <Text style={styles.timerGuidance}>
              {`서두르지 않아도 괜찮아요.\n지금 실행하는게 중요한거에요.`}
            </Text>
            <Pressable
              onPress={() => setIsRunning((value) => !value)}
              style={({ pressed }) => [styles.pauseButton, pressed && styles.pressed]}
            >
              <PauseIcon isRunning={isRunning} />
              <Text style={styles.pauseText}>{isRunning ? '잠깐 멈추기' : '다시 시작하기'}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.nextHint}>
          {currentIndex === routine.steps.length - 1
            ? '마지막 단계예요.'
            : '준비되면 다음 단계로 넘어가세요.'}
        </Text>
        <View style={styles.stepActions}>
          {currentIndex > 0 && (
            <Pressable
              onPress={movePrevious}
              style={({ pressed }) => [styles.previousButton, pressed && styles.pressed]}
            >
              <Text style={styles.previousButtonText}>이전 단계</Text>
            </Pressable>
          )}
          <View style={styles.nextButton}>
            <PrimaryButton
              label={
                currentIndex === routine.steps.length - 1
                  ? '루틴 완료하기'
                  : '이 단계 완료 · 다음으로'
              }
              onPress={moveNext}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function PauseIcon({ isRunning }: { isRunning: boolean }) {
  if (!isRunning) {
    return (
      <Svg height={16} viewBox="0 0 24 24" width={16}>
        <Path d="m8 5 11 7-11 7V5Z" fill={colors.primary} />
      </Svg>
    );
  }

  return (
    <Svg height={16} viewBox="0 0 24 24" width={16}>
      <Path
        d="M8 6v12M16 6v12"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={2.5}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bottom: { gap: 12 },
  closeButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  completeActions: { gap: 12 },
  completeCopy: { alignItems: 'center', gap: 10 },
  completeDescription: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  completeHero: { alignItems: 'center', gap: 12 },
  completeHomeButton: { width: '100%' },
  completeMascot: {
    alignItems: 'center',
    height: 204,
    justifyContent: 'center',
    position: 'relative',
  },
  completeMascotImage: { height: 184, resizeMode: 'contain', width: 184 },
  completePage: {
    backgroundColor: colors.background,
    flex: 1,
    gap: 24,
    justifyContent: 'center',
    padding: 24,
  },
  completeTitle: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  emptyPage: {
    backgroundColor: colors.background,
    flex: 1,
    gap: 22,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  completeSecondaryActions: { flexDirection: 'row', gap: 10 },
  favoriteSecondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E8E4',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 46,
  },
  favoriteSecondaryButtonActive: { backgroundColor: '#FFF8EF', borderColor: '#F5AE28' },
  profileButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E8E4',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  secondaryButtonText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  header: { alignItems: 'center', flexDirection: 'row', height: 56 },
  main: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
  mascot: {
    height: 118,
    position: 'absolute',
    resizeMode: 'contain',
    right: -6,
    top: -24,
    transform: [{ rotate: '24deg' }],
    width: 118,
  },
  nextHint: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  page: { backgroundColor: colors.background, flex: 1, padding: 20 },
  pauseButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.soft,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pauseText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.72 },
  progressTrack: { backgroundColor: '#F0EEE9', borderRadius: 99, height: 6, overflow: 'hidden' },
  progressValue: { backgroundColor: colors.primary, borderRadius: 99, height: '100%' },
  previousButton: {
    alignItems: 'center',
    borderColor: '#E8E8E4',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  previousButtonText: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  routineTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  nextButton: { flex: 1 },
  stepActions: { flexDirection: 'row', gap: 8 },
  stepBadge: {
    backgroundColor: colors.soft,
    borderRadius: 99,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stepBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  stepCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    width: 40,
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 24,
    textAlign: 'center',
  },
  timer: {
    color: colors.ink,
    fontSize: 46,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    letterSpacing: -1,
  },
  timerGuidance: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    maxWidth: 210,
    textAlign: 'center',
  },
  timerLabel: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 86,
  },
  timerPanel: {
    alignItems: 'center',
    height: 308,
    justifyContent: 'center',
    marginTop: 18,
    position: 'relative',
    width: 300,
  },
});
