import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Modal } from 'react-native';

import { AppSplash } from './AppSplash';
import { backgroundSplashDelay, splashDuration } from '../model/config';

export function ResumeSplash() {
  const appState = useRef(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      const previousState = appState.current;

      appState.current = nextState;

      if (nextState === 'background' || nextState === 'inactive') {
        if (previousState === 'active' && backgroundedAt.current === null) {
          backgroundedAt.current = Date.now();
        }

        return;
      }

      if (nextState !== 'active' || previousState === 'active') return;

      const backgroundStartedAt = backgroundedAt.current;

      backgroundedAt.current = null;

      if (
        backgroundStartedAt === null ||
        Date.now() - backgroundStartedAt < backgroundSplashDelay
      ) {
        return;
      }

      if (hideTimer.current) clearTimeout(hideTimer.current);

      setVisible(true);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        hideTimer.current = null;
      }, splashDuration);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <Modal animationType="none" presentationStyle="fullScreen" visible={visible}>
      <AppSplash />
    </Modal>
  );
}
