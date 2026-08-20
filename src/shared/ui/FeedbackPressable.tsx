import * as Haptics from 'expo-haptics';
import { Pressable as NativePressable, type PressableProps, StyleSheet } from 'react-native';

type FeedbackPressableProps = PressableProps;

export function FeedbackPressable({
  disabled,
  onPressIn,
  style,
  ...props
}: FeedbackPressableProps) {
  return (
    <NativePressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        onPressIn?.(event);
      }}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && !disabled && styles.pressed,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
