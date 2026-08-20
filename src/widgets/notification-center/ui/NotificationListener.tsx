import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useNotification } from '@/entities/notification';
import {
  addRoutineNotificationReceivedListener,
  addRoutineNotificationResponseListener,
  getPresentedRoutineNotifications,
  initializeRoutineNotifications,
  requestRoutineNotificationPermission,
} from '@/shared/lib';

type NativeNotification = Parameters<typeof addRoutineNotificationReceivedListener>[0] extends (
  notification: infer Notification,
) => void
  ? Notification
  : never;

export function NotificationListener() {
  const { addNotification, markReadByNativeId } = useNotification();
  const addNotificationRef = useRef(addNotification);
  const markReadByNativeIdRef = useRef(markReadByNativeId);
  const handledNotificationIds = useRef(new Set<string>());
  const handledResponseIds = useRef(new Set<string>());

  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  useEffect(() => {
    markReadByNativeIdRef.current = markReadByNativeId;
  }, [markReadByNativeId]);

  const addToNotificationList = useCallback((notification: NativeNotification) => {
    const { content } = notification.request;
    const routineId = content.data?.routineId;
    const scheduleId = content.data?.scheduleId;

    if (
      typeof routineId !== 'string' ||
      handledNotificationIds.current.has(notification.request.identifier)
    ) {
      return;
    }

    handledNotificationIds.current.add(notification.request.identifier);
    addNotificationRef.current({
      body: content.body ?? '루틴을 시작할 시간이에요.',
      nativeNotificationId: notification.request.identifier,
      routineId,
      scheduleId: typeof scheduleId === 'string' ? scheduleId : undefined,
      title: content.title ?? '루틴 시작 알림',
      type: 'schedule',
    });
  }, []);

  useEffect(() => {
    void (async () => {
      await initializeRoutineNotifications();
      await requestRoutineNotificationPermission();
      const notifications = await getPresentedRoutineNotifications();

      notifications.forEach(addToNotificationList);
    })();

    const removeReceivedListener = addRoutineNotificationReceivedListener(addToNotificationList);
    const removeResponseListener = addRoutineNotificationResponseListener((notification) => {
      if (handledResponseIds.current.has(notification.request.identifier)) return;

      handledResponseIds.current.add(notification.request.identifier);
      addToNotificationList(notification);
      markReadByNativeIdRef.current(notification.request.identifier);

      const routineId = notification.request.content.data?.routineId;
      const scheduleId = notification.request.content.data?.scheduleId;

      if (typeof routineId === 'string') {
        setTimeout(() => {
          router.navigate({
            pathname: '/home',
            params: { routineId, ...(typeof scheduleId === 'string' ? { scheduleId } : {}) },
          });
        }, 0);
      }
    });

    return () => {
      removeReceivedListener();
      removeResponseListener();
    };
  }, [addToNotificationList]);

  return null;
}
