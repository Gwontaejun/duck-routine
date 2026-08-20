import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseStoredJson } from '@/shared/lib';

type NotificationSettings = {
  routineReminders: boolean;
};

type UserStore = {
  name: string;
  notificationSettings: NotificationSettings;
  setName: (name: string) => void;
  setNotificationSettings: (settings: NotificationSettings) => void;
};

const UserContext = createContext<UserStore | null>(null);
const nameStorageKey = '@duck-routine/user-name';
const notificationSettingsStorageKey = '@duck-routine/notification-settings';
const defaultNotificationSettings: NotificationSettings = {
  routineReminders: true,
};

export function UserProvider({ children }: PropsWithChildren) {
  const [name, setName] = useState('나');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    defaultNotificationSettings,
  );

  useEffect(() => {
    AsyncStorage.getItem(nameStorageKey).then((stored) => stored && setName(stored));
    AsyncStorage.getItem(notificationSettingsStorageKey).then((stored) => {
      if (stored) {
        const storedSettings = parseStoredJson<Partial<NotificationSettings>>(stored, {});

        setNotificationSettings({ ...defaultNotificationSettings, ...storedSettings });
      }
    });
  }, []);

  const updateName = useCallback((nextName: string) => {
    setName(nextName);
    void AsyncStorage.setItem(nameStorageKey, nextName);
  }, []);
  const updateNotificationSettings = useCallback((nextSettings: NotificationSettings) => {
    setNotificationSettings(nextSettings);
    void AsyncStorage.setItem(notificationSettingsStorageKey, JSON.stringify(nextSettings));
  }, []);
  const value = useMemo(
    () => ({
      name,
      notificationSettings,
      setName: updateName,
      setNotificationSettings: updateNotificationSettings,
    }),
    [name, notificationSettings, updateName, updateNotificationSettings],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const store = useContext(UserContext);
  if (!store) throw new Error('useUser must be used inside UserProvider');
  return store;
}
