import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';

type WheelItem<T extends string | number> = {
  label: string;
  value: T;
};

type GestureWheelPickerProps<T extends string | number> = {
  data: readonly WheelItem<T>[];
  itemHeight?: number;
  onValueChange: (value: T) => void;
  value: T;
  width: number;
};

const visibleItemCount = 3;

function GestureWheelPickerComponent<T extends string | number>({
  data,
  itemHeight = 46,
  onValueChange,
  value,
  width,
}: GestureWheelPickerProps<T>) {
  const valueIndex = Math.max(
    0,
    data.findIndex((item) => item.value === value),
  );
  const minOffset = (1 - (data.length - 1)) * itemHeight;
  const maxOffset = itemHeight;
  const dataRef = useRef(data);
  const onValueChangeRef = useRef(onValueChange);
  const selectedIndexRef = useRef(valueIndex);
  const [selectedIndex, setSelectedIndex] = useState(valueIndex);
  const dragOffset = useSharedValue((1 - valueIndex) * itemHeight);
  const dragStartOffset = useSharedValue((1 - valueIndex) * itemHeight);
  const isDragging = useSharedValue(false);

  dataRef.current = data;
  onValueChangeRef.current = onValueChange;

  const selectIndex = useCallback(
    (nextIndex: number) => {
      isDragging.value = false;
      selectedIndexRef.current = nextIndex;
      setSelectedIndex(nextIndex);
      dragOffset.value = (1 - nextIndex) * itemHeight;

      if (nextIndex !== valueIndex) {
        onValueChangeRef.current(dataRef.current[nextIndex].value);
      }
    },
    [dragOffset, isDragging, itemHeight, valueIndex],
  );

  useEffect(() => {
    if (isDragging.value || valueIndex === selectedIndexRef.current) return;

    selectedIndexRef.current = valueIndex;
    setSelectedIndex(valueIndex);
    dragOffset.value = (1 - valueIndex) * itemHeight;
  }, [dragOffset, isDragging, itemHeight, valueIndex]);

  const listStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragOffset.value }] }));
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(1)
        .shouldCancelWhenOutside(false)
        .onBegin(() => {
          isDragging.value = true;
          dragStartOffset.value = dragOffset.value;
        })
        .onUpdate((event) => {
          dragOffset.value = Math.max(
            minOffset,
            Math.min(maxOffset, dragStartOffset.value + event.translationY),
          );
        })
        .onEnd((event) => {
          const releaseVelocity = event.velocityY;

          dragOffset.value = withDecay(
            {
              clamp: [minOffset, maxOffset],
              deceleration: 0.99,
              velocity: releaseVelocity,
            },
            () => {
              const nextIndex = Math.max(
                0,
                Math.min(data.length - 1, Math.round(1 - dragOffset.value / itemHeight)),
              );

              dragOffset.value = withTiming(
                (1 - nextIndex) * itemHeight,
                { duration: 75 },
                (finished) => {
                  if (finished) runOnJS(selectIndex)(nextIndex);
                },
              );
            },
          );
        })
        .onFinalize((_, success) => {
          if (success) return;

          isDragging.value = false;
          dragOffset.value = withTiming((1 - selectedIndexRef.current) * itemHeight, {
            duration: 140,
          });
        }),
    [
      data.length,
      dragOffset,
      dragStartOffset,
      isDragging,
      itemHeight,
      maxOffset,
      minOffset,
      selectIndex,
    ],
  );
  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((event) => {
        const tappedIndex = Math.max(
          0,
          Math.min(data.length - 1, Math.floor((event.y - dragOffset.value) / itemHeight)),
        );

        dragOffset.value = withTiming(
          (1 - tappedIndex) * itemHeight,
          { duration: 90 },
          (finished) => {
            if (finished) runOnJS(selectIndex)(tappedIndex);
          },
        );
      }),
    [data.length, dragOffset, itemHeight, selectIndex],
  );
  const gesture = useMemo(() => Gesture.Race(panGesture, tapGesture), [panGesture, tapGesture]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        collapsable={false}
        style={[styles.container, { height: itemHeight * visibleItemCount, width }]}
      >
        <View
          pointerEvents="none"
          style={[styles.selected, { height: itemHeight, top: itemHeight }]}
        />
        <Animated.View style={listStyle}>
          {data.map((item, index) => (
            <Text
              key={String(item.value)}
              style={[
                styles.item,
                index === selectedIndex ? styles.value : styles.dimmed,
                { height: itemHeight },
              ]}
            >
              {item.label}
            </Text>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

export const GestureWheelPicker = memo(
  GestureWheelPickerComponent,
  (previous, next) =>
    previous.data === next.data &&
    previous.itemHeight === next.itemHeight &&
    previous.onValueChange === next.onValueChange &&
    previous.value === next.value &&
    previous.width === next.width,
) as typeof GestureWheelPickerComponent;

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  dimmed: { color: colors.ink, opacity: 0.2 },
  item: {
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  selected: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  value: { color: colors.ink, fontSize: 19, fontWeight: '800' },
});
