import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { parseStoredJson } from '@/shared/lib';

type AppNotification = {
  body: string;
  createdAt: string;
  id: string;
  nativeNotificationId?: string;
  read: boolean;
  routineId?: string;
  scheduleId?: string;
  title: string;
  type: 'schedule' | 'recommendation' | 'cheer';
};
type NotificationStore = {
  addNotification: (notification: Omit<AppNotification, 'createdAt' | 'id' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  markReadByNativeId: (nativeNotificationId: string) => void;
  notifications: AppNotification[];
};

const NotificationContext = createContext<NotificationStore | null>(null);
const sampleNotificationIds = new Set(['sample-schedule', 'sample-recommendation']);
const storageKey = '@duck-routine/notifications';

export function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        const parsedNotifications = parseStoredJson<unknown>(stored, []);
        const storedNotifications = (Array.isArray(parsedNotifications) ? parsedNotifications : [])
          .filter(
            (item: AppNotification) =>
              item.title !== '일정이 등록됐어요.' && !sampleNotificationIds.has(item.id),
          )
          .map((item: AppNotification) => ({
            ...item,
            createdAt: item.createdAt ?? new Date().toISOString(),
          }));

        setNotifications((currentNotifications) => [
          ...currentNotifications,
          ...storedNotifications.filter(
            (storedNotification: AppNotification) =>
              !currentNotifications.some(
                (currentNotification) =>
                  currentNotification.id === storedNotification.id ||
                  (storedNotification.nativeNotificationId &&
                    currentNotification.nativeNotificationId ===
                      storedNotification.nativeNotificationId),
              ),
          ),
        ]);
      })
      .finally(() => setHydrated(true));
  }, []);
  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [hydrated, notifications]);
  const addNotification: NotificationStore['addNotification'] = useCallback(
    (notification) =>
      setNotifications((items) => {
        if (
          notification.nativeNotificationId &&
          items.some((item) => item.nativeNotificationId === notification.nativeNotificationId)
        ) {
          return items;
        }

        return [
          {
            ...notification,
            createdAt: new Date().toISOString(),
            id: notification.nativeNotificationId ?? `${Date.now()}`,
            read: false,
          },
          ...items,
        ];
      }),
    [],
  );
  const markAllRead = useCallback(
    () => setNotifications((items) => items.map((item) => ({ ...item, read: true }))),
    [],
  );
  const markRead = useCallback(
    (id: string) =>
      setNotifications((items) =>
        items.map((item) => (item.id === id ? { ...item, read: true } : item)),
      ),
    [],
  );
  const markReadByNativeId = useCallback(
    (nativeNotificationId: string) =>
      setNotifications((items) =>
        items.map((item) =>
          item.nativeNotificationId === nativeNotificationId ? { ...item, read: true } : item,
        ),
      ),
    [],
  );
  const value = useMemo(
    () => ({ addNotification, markAllRead, markRead, markReadByNativeId, notifications }),
    [addNotification, markAllRead, markRead, markReadByNativeId, notifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const store = useContext(NotificationContext);
  if (!store) throw new Error('useNotification must be used inside NotificationProvider');
  return store;
}
