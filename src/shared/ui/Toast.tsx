import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Toast, { type ToastConfig } from 'react-native-toast-message';

import { AppText as Text } from '@/shared/ui/AppText';

type ToastStore = { showToast: (message: string) => void };

const ToastContext = createContext<ToastStore | null>(null);
const toastAnimation = {
  enter: { duration: 120, type: 'timing' as const },
  exit: { duration: 160, type: 'timing' as const },
};
const toastConfig: ToastConfig = {
  duck: ({ text1 }) => (
    <View style={styles.toast}>
      <Text style={styles.text}>{text1}</Text>
    </View>
  ),
};

export function ToastProvider({ children }: PropsWithChildren) {
  const showToast = useCallback(
    (message: string) =>
      Toast.show({ position: 'bottom', text1: message, type: 'duck', visibilityTime: 2200 }),
    [],
  );
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast animationConfig={toastAnimation} bottomOffset={104} config={toastConfig} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const store = useContext(ToastContext);
  if (!store) throw new Error('useToast must be used inside ToastProvider');
  return store;
}

const styles = StyleSheet.create({
  text: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  toast: {
    alignSelf: 'center',
    backgroundColor: '#273647',
    borderRadius: 99,
    maxWidth: '82%',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
});
