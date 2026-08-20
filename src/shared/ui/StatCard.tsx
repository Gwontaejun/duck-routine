import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, type TextStyle, View } from 'react-native';

import { colors } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';

export function StatCard({
  icon,
  label,
  value,
  valueStyle,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  valueStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.card}>
      <View>
        <Text numberOfLines={1} style={[styles.value, valueStyle]}>
          {value}
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      {icon && (
        <View style={styles.iconWrap}>
          {typeof icon === 'string' ? <Text style={styles.icon}>{icon}</Text> : icon}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: { fontSize: 22 },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  value: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 13 },
});
