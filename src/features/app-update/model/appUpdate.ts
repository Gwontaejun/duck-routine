import { Platform } from 'react-native';

export type AppUpdateInfo = {
  required: boolean;
  storeVersion: string;
};

export async function checkForAppUpdate(): Promise<AppUpdateInfo | null> {
  if (__DEV__ || Platform.OS !== 'android') return null;

  try {
    const { checkForUpdate } = await import('expo-in-app-updates');
    const result = await checkForUpdate();

    if (!result.updateAvailable) return null;

    const required =
      result.immediateAllowed === true && result.serverUpdateType === 'IMMEDIATE';

    if (!required && result.flexibleAllowed === false) return null;

    return { required, storeVersion: result.storeVersion };
  } catch (error) {
    console.warn('App update check failed:', error);
    return null;
  }
}

export async function startAppUpdate(required: boolean) {
  const { startUpdate } = await import('expo-in-app-updates');

  return startUpdate(required);
}
