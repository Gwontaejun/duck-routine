import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

type NotificationRoutine = {
  icon: string;
  id: string;
  title: string;
};

type NotificationSchedule = {
  days?: number[];
  endDate?: string;
  id: string;
  routineId: string;
  startDate: string;
  time: string;
  type: 'once' | 'range' | 'weekdays';
};

type ScheduleNotificationResult = {
  notificationIds: string[];
  permissionGranted: boolean;
};

const channelId = 'routine-reminders';
const notificationBatchSize = 20;
let isInitialized = false;

const getDateTime = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  return new Date(year, month - 1, day, hour, minute);
};

const getTimeParts = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);

  return { hour, minute };
};

const getRangeDates = (startDate: string, endDate: string, time: string) => {
  const dates: Date[] = [];
  const currentDate = getDateTime(startDate, time);
  const lastDate = getDateTime(endDate, time);

  while (currentDate <= lastDate) {
    if (currentDate > new Date()) dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

const getContent = (routine: NotificationRoutine, schedule: NotificationSchedule) => ({
  body: '등록한 일정을 시작할 시간이에요.',
  data: { routineId: schedule.routineId, scheduleId: schedule.id },
  sound: 'default' as const,
  title: `${routine.icon} ${routine.title}`,
});

export async function initializeRoutineNotifications() {
  if (Platform.OS === 'web' || isInitialized) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#FF7A24',
      name: '루틴 시작 알림',
      sound: 'default',
      vibrationPattern: [0, 220, 160, 220],
    });
  }

  isInitialized = true;
}

export async function requestRoutineNotificationPermission() {
  if (Platform.OS === 'web') return false;

  await initializeRoutineNotifications();
  const permissions = await Notifications.getPermissionsAsync();

  if (permissions.status === 'granted') return true;

  return (await Notifications.requestPermissionsAsync()).status === 'granted';
}

export async function hasRoutineNotificationPermission() {
  if (Platform.OS === 'web') return false;

  await initializeRoutineNotifications();

  return (await Notifications.getPermissionsAsync()).status === 'granted';
}

export async function scheduleRoutineNotifications(
  routine: NotificationRoutine,
  schedule: NotificationSchedule,
): Promise<ScheduleNotificationResult> {
  const permissionGranted = await requestRoutineNotificationPermission();

  if (!permissionGranted) return { notificationIds: [], permissionGranted };

  const content = getContent(routine, schedule);
  const { hour, minute } = getTimeParts(schedule.time);
  const scheduleNotification = (trigger: Notifications.NotificationTriggerInput) =>
    Notifications.scheduleNotificationAsync({ content, trigger });

  if (schedule.type === 'once') {
    const date = getDateTime(schedule.startDate, schedule.time);
    const notificationIds =
      date > new Date()
        ? [
            await scheduleNotification({
              channelId,
              date,
              type: Notifications.SchedulableTriggerInputTypes.DATE,
            }),
          ]
        : [];

    return { notificationIds, permissionGranted };
  }

  if (schedule.type === 'weekdays') {
    const notificationIds = await Promise.all(
      (schedule.days ?? []).map((day) =>
        scheduleNotification({
          channelId,
          hour,
          minute,
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1,
        }),
      ),
    );

    return { notificationIds, permissionGranted };
  }

  const dates = getRangeDates(
    schedule.startDate,
    schedule.endDate ?? schedule.startDate,
    schedule.time,
  );
  const notificationIds: string[] = [];

  for (let index = 0; index < dates.length; index += notificationBatchSize) {
    const batchIds = await Promise.all(
      dates.slice(index, index + notificationBatchSize).map((date) =>
        scheduleNotification({
          channelId,
          date,
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        }),
      ),
    );

    notificationIds.push(...batchIds);
  }

  return { notificationIds, permissionGranted };
}

export async function cancelRoutineNotifications(notificationIds?: string[]) {
  await Promise.all(
    (notificationIds ?? []).map((notificationId) =>
      Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined),
    ),
  );
}

export function addRoutineNotificationReceivedListener(
  onReceive: (notification: Notifications.Notification) => void,
) {
  if (Platform.OS === 'web') return () => undefined;

  const subscription = Notifications.addNotificationReceivedListener(onReceive);

  return () => subscription.remove();
}

export function addRoutineNotificationResponseListener(
  onRespond: (notification: Notifications.Notification) => void,
) {
  if (Platform.OS === 'web') return () => undefined;

  const handleResponse = (response: Notifications.NotificationResponse | null) => {
    if (response) onRespond(response.notification);
  };
  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

  void Notifications.getLastNotificationResponseAsync()
    .then(handleResponse)
    .catch(() => undefined);

  return () => subscription.remove();
}

export async function getPresentedRoutineNotifications() {
  if (Platform.OS === 'web') return [];

  return Notifications.getPresentedNotificationsAsync();
}
