import { useEffect } from 'react';
import { router } from 'expo-router';

import { AppSplash, splashDuration } from '@/features/app-splash';

export default function Index() {
  useEffect(() => {
    const timeout = setTimeout(() => router.replace('/home'), splashDuration);

    return () => clearTimeout(timeout);
  }, []);

  return <AppSplash />;
}
