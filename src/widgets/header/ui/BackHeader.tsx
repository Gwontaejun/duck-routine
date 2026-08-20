import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import BackIcon from '@/assets/images/backIcon.svg';
import { colors } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';
import { FeedbackPressable } from '@/shared/ui/FeedbackPressable';

type BackHeaderProps = {
  accessibilityLabel?: string;
  onBack: () => void;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function BackHeader({
  accessibilityLabel = '이전 화면으로 돌아가기',
  onBack,
  style,
  title,
}: BackHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <FeedbackPressable
        accessibilityLabel={accessibilityLabel}
        hitSlop={10}
        onPress={onBack}
        style={styles.side}
      >
        <BackIcon height={22} width={22} />
      </FeedbackPressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
  },
  side: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800' },
});
