import { forwardRef } from 'react';
import { StyleSheet, TextInput as NativeTextInput, type TextInputProps } from 'react-native';

import { getFontFamily } from '@/shared/config/theme';

export const AppTextInput = forwardRef<NativeTextInput, TextInputProps>(
  ({ style, ...props }, ref) => {
    const fontFamily = getFontFamily(StyleSheet.flatten(style)?.fontWeight);

    return (
      <NativeTextInput ref={ref} {...props} style={[style, { fontFamily, fontWeight: '400' }]} />
    );
  },
);

AppTextInput.displayName = 'AppTextInput';
