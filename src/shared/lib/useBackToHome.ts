import { router, type Href, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';

export function useBackToHome(destination: Href = '/home') {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace(destination);
        return true;
      });
      return () => subscription.remove();
    }, [destination]),
  );
}
