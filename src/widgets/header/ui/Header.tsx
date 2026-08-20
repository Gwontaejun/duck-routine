import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { screenStyles } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';

type HeaderProps = { eyebrow: string; right?: ReactNode; title: string };

export function Header({ eyebrow, right, title }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={screenStyles.eyebrow}>{eyebrow}</Text>
        <Text style={screenStyles.title}>{title}</Text>
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: { flex: 1, minWidth: 0 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  right: { flexShrink: 0 },
});
