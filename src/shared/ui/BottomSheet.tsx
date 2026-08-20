import { type PropsWithChildren, type ReactNode, useCallback, useEffect, useRef } from 'react';
import { BackHandler, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  BottomSheetBackdrop,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/shared/config/theme';

type BottomSheetProps = PropsWithChildren<{
  decoration?: ReactNode;
  dismissible?: boolean;
  scrollable?: boolean;
  visible: boolean;
  onClose: () => void;
}>;

export function BottomSheet({
  children,
  decoration,
  dismissible = true,
  onClose,
  scrollable = false,
  visible,
}: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const hasPresentedRef = useRef(false);
  const isDismissingRef = useRef(false);
  const pendingPresentRef = useRef(false);
  const programmaticDismissRef = useRef(false);
  const sheetIsPresentedRef = useRef(false);
  const visibleRef = useRef(visible);
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior={dismissible ? 'close' : 'none'}
        {...props}
      />
    ),
    [dismissible],
  );
  const renderBackground = useCallback(
    (props: BottomSheetBackgroundProps) => (
      <View pointerEvents="none" style={[props.style, styles.background]}>
        {decoration && <View style={styles.decoration}>{decoration}</View>}
      </View>
    ),
    [decoration],
  );

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (isDismissingRef.current) {
        pendingPresentRef.current = true;
        return;
      }

      sheetRef.current?.present();
      hasPresentedRef.current = true;
      sheetIsPresentedRef.current = true;
      return;
    }

    if (hasPresentedRef.current && sheetIsPresentedRef.current) {
      programmaticDismissRef.current = true;
      isDismissingRef.current = true;
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    const wasProgrammatic = programmaticDismissRef.current;
    const shouldReopen = pendingPresentRef.current || visibleRef.current;

    isDismissingRef.current = false;
    pendingPresentRef.current = false;
    programmaticDismissRef.current = false;
    sheetIsPresentedRef.current = false;

    if (!wasProgrammatic) {
      onClose();
      return;
    }

    if (shouldReopen) {
      requestAnimationFrame(() => {
        sheetRef.current?.present();
        sheetIsPresentedRef.current = true;
      });
    }
  }, [onClose]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dismissible) onClose();
      return true;
    });

    return () => subscription.remove();
  }, [dismissible, onClose, visible]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      backdropComponent={renderBackdrop}
      backgroundComponent={renderBackground}
      bottomInset={bottom}
      enableContentPanningGesture={false}
      enableDynamicSizing
      enablePanDownToClose={dismissible}
      handleIndicatorStyle={styles.handle}
      handleStyle={styles.handleArea}
      maxDynamicContentSize={height * 0.78}
      onDismiss={handleDismiss}
    >
      {scrollable ? children : <BottomSheetView style={styles.content}>{children}</BottomSheetView>}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: { overflow: 'visible' },
  decoration: { overflow: 'visible' },
  handle: { backgroundColor: '#D7DEE6', height: 5, width: 42 },
  handleArea: { height: 37, paddingTop: 16 },
});
