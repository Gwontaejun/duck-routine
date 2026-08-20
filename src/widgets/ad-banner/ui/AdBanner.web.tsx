import { StyleSheet, View } from 'react-native';

import { colors } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';

export function AdBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>AD</Text>
      <Text style={styles.text}>광고는 앱에서 표시됩니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderColor: '#E8E8E4',
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    justifyContent: 'center',
    minHeight: 82,
  },
  label: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  text: { color: colors.muted, fontSize: 12 },
});
