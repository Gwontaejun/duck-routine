import type { Dayjs } from 'dayjs';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Schedule } from '@/entities/routine';
import { isScheduleActiveOnDate } from '@/entities/routine';
import { colors } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';
import { FeedbackPressable as Pressable } from '@/shared/ui/FeedbackPressable';

import { weekdays } from '../model/options';

type ScheduleCalendarProps = {
  month: Dayjs;
  onChangeMonth: (month: Dayjs) => void;
  onSelectDate: (date: string) => void;
  schedules: Schedule[];
  selectedDate: string;
};

const getCalendarDays = (month: Dayjs) =>
  Array.from({ length: 42 }, (_, index) =>
    month.startOf('month').subtract(month.startOf('month').day(), 'day').add(index, 'day'),
  );

export const ScheduleCalendar = memo(function ScheduleCalendar({
  month,
  onChangeMonth,
  onSelectDate,
  schedules,
  selectedDate,
}: ScheduleCalendarProps) {
  return (
    <View style={styles.card}>
      <View style={styles.monthHeader}>
        <Pressable onPress={() => onChangeMonth(month.subtract(1, 'month'))} style={styles.button}>
          <Text style={styles.arrow}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.title}>{month.format('YYYY년 M월')}</Text>
        <Pressable onPress={() => onChangeMonth(month.add(1, 'month'))} style={styles.button}>
          <Text style={styles.arrow}>{'›'}</Text>
        </Pressable>
      </View>
      <View style={styles.weekdays}>
        {weekdays.map((day, index) => (
          <Text
            key={day}
            style={[styles.weekday, index === 0 && styles.sunday, index === 6 && styles.saturday]}
          >
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.days}>
        {getCalendarDays(month).map((date) => {
          const dateKey = date.format('YYYY-MM-DD');
          const isSelected = dateKey === selectedDate;
          const isCurrentMonth = date.month() === month.month();
          const hasPlan = schedules.some((schedule) => isScheduleActiveOnDate(schedule, date));

          return (
            <Pressable key={dateKey} onPress={() => onSelectDate(dateKey)} style={styles.dayCell}>
              <View style={[styles.day, isSelected && styles.selectedDay]}>
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonth && styles.mutedDay,
                    date.day() === 0 && styles.sunday,
                    date.day() === 6 && styles.saturday,
                    isSelected && styles.selectedDayText,
                  ]}
                >
                  {date.date()}
                </Text>
              </View>
              {hasPlan && <View style={[styles.dot, isSelected && styles.selectedDot]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  arrow: { color: colors.ink, fontSize: 28, lineHeight: 28 },
  button: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  day: {
    alignItems: 'center',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 28,
  },
  dayCell: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    position: 'relative',
    width: '14.2857%',
  },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  dayText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  dot: {
    backgroundColor: colors.primaryDark,
    borderRadius: 3,
    bottom: 0,
    height: 5,
    position: 'absolute',
    width: 5,
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mutedDay: { color: '#C7C1B9' },
  saturday: { color: '#4C87D9' },
  selectedDay: { backgroundColor: colors.primary },
  selectedDayText: { color: colors.card },
  selectedDot: { backgroundColor: colors.card },
  sunday: { color: '#E55B5B' },
  title: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  weekday: { color: colors.muted, flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  weekdays: { flexDirection: 'row', marginBottom: 8 },
});
