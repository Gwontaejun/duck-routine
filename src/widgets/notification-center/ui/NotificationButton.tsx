import dayjs from 'dayjs';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useNotification } from '@/entities/notification';
import { colors } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { FeedbackPressable as Pressable } from '@/shared/ui/FeedbackPressable';
import NotificationIcon from '@/shared/ui/icons/NotificationIcon.svg';

type NotificationButtonProps = { onPressRoutine: (routineId: string, scheduleId?: string) => void };

const formatReceivedAt = (createdAt: string) => {
  const receivedAt = dayjs(createdAt);
  const hour = receivedAt.hour();
  const time = `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${receivedAt.format('mm')}`;
  return receivedAt.isSame(dayjs(), 'day')
    ? `오늘 ${time}`
    : `${receivedAt.format('M월 D일')} ${time}`;
};

export function NotificationButton({ onPressRoutine }: NotificationButtonProps) {
  const { markAllRead, markRead, notifications } = useNotification();
  const [open, setOpen] = useState(false);
  const unread = notifications.some((item) => !item.read);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.button}>
        <NotificationIcon color={colors.ink} height={30} width={30} />
        {unread && <View style={styles.dot} />}
      </Pressable>
      {open && (
        <BottomSheet onClose={() => setOpen(false)} visible>
          <View style={styles.sheet}>
            <View style={styles.row}>
              <Text style={styles.title}>알림</Text>
              {unread && (
                <Pressable onPress={markAllRead}>
                  <Text style={styles.read}>모두 읽음</Text>
                </Pressable>
              )}
            </View>
            {notifications.length ? (
              notifications.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    markRead(item.id);
                    if (!item.routineId) return;
                    setOpen(false);
                    onPressRoutine(item.routineId, item.scheduleId);
                  }}
                  style={[
                    styles.item,
                    item.read && styles.readItem,
                    !item.read && styles.unreadItem,
                  ]}
                >
                  {item.type !== 'schedule' && (
                    <Text style={styles.icon}>{item.type === 'recommendation' ? '✨' : '👏'}</Text>
                  )}
                  <View style={styles.copy}>
                    <Text style={[styles.itemTitle, !item.read && styles.unreadTitle]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.body, !item.read && styles.unreadBody]}>{item.body}</Text>
                    <Text style={styles.receivedAt}>{formatReceivedAt(item.createdAt)}</Text>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </Pressable>
              ))
            ) : (
              <View style={styles.empty}>
                <NotificationIcon color={colors.muted} height={26} width={26} />
                <Text style={styles.emptyTitle}>새 알림이 없어요</Text>
                <Text style={styles.emptyDescription}>일정과 추천 알림이 이곳에 쌓여요.</Text>
              </View>
            )}
          </View>
        </BottomSheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.muted, fontSize: 13 },
  button: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: { flex: 1, gap: 3 },
  dot: {
    backgroundColor: '#F05B57',
    borderColor: colors.background,
    borderRadius: 5,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 5,
    top: 5,
    width: 10,
  },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 38 },
  emptyDescription: { color: colors.muted, fontSize: 13 },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 4 },
  icon: { fontSize: 22 },
  item: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  itemTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  read: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  readItem: { opacity: 0.56 },
  receivedAt: { color: colors.muted, fontSize: 11, marginTop: 2 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sheet: { gap: 12, paddingBottom: 32, paddingHorizontal: 20 },
  title: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  unreadBody: { color: '#53677C' },
  unreadDot: { backgroundColor: colors.primary, borderRadius: 4, height: 8, width: 8 },
  unreadItem: { backgroundColor: '#F1F8FF', borderColor: '#CAE5FA' },
  unreadTitle: { color: '#244B6E' },
});
