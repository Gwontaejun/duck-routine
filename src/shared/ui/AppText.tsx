import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';

import { getFontFamily } from '@/shared/config/theme';

export function AppText({ style, ...props }: TextProps) {
  const fontFamily = getFontFamily(StyleSheet.flatten(style)?.fontWeight);

  return <NativeText {...props} style={[style, { fontFamily, fontWeight: '400' }]} />;
}
