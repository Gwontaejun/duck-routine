import { StyleSheet, View } from 'react-native';

import DoneIcon from '@/assets/images/doneIcon.svg';
import { AppText as Text } from '@/shared/ui/AppText';

export function RoutineCompletionOverlay() {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.badge}>
        <DoneIcon height={21} width={21} />
        <Text style={styles.label}>완료</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  label: { color: '#6CA74A', fontSize: 13, fontWeight: '800' },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
});
