import dayjs, { type Dayjs } from 'dayjs';

import type { Completion, Routine, Schedule } from './types';

type SchedulePeriod = Pick<Schedule, 'days' | 'endDate' | 'startDate' | 'type'>;

type GetScheduleEntriesParams = {
  completions: Completion[];
  date: Dayjs | string;
  routines: Routine[];
  schedules: Schedule[];
};

export type ScheduleEntry = {
  isCompleted: boolean;
  routine: Routine;
  schedule: Schedule;
};

export function formatScheduleTime(time: string) {
  const [hour, minute] = time.split(':').map(Number);

  return `${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(minute).padStart(2, '0')}`;
}

export function isScheduleActiveOnDate(schedule: SchedulePeriod, date: Dayjs | string) {
  const targetDate = dayjs(date);

  if (targetDate.isBefore(schedule.startDate, 'day')) return false;
  if (schedule.type === 'once') return targetDate.isSame(schedule.startDate, 'day');
  if (schedule.type === 'range') {
    const endDate = schedule.endDate ?? schedule.startDate;

    return !targetDate.isAfter(endDate, 'day');
  }

  return Boolean(schedule.days?.includes(targetDate.day()));
}

export function getScheduleEntries({
  completions,
  date,
  routines,
  schedules,
}: GetScheduleEntriesParams): ScheduleEntry[] {
  const routineById = new Map(routines.map((routine) => [routine.id, routine]));
  const completedScheduleIds = new Set(
    completions
      .filter((completion) => dayjs(completion.finishedAt).isSame(date, 'day'))
      .flatMap((completion) => (completion.scheduleId ? [completion.scheduleId] : [])),
  );

  return schedules
    .filter((schedule) => isScheduleActiveOnDate(schedule, date))
    .flatMap((schedule) => {
      const routine = routineById.get(schedule.routineId);

      return routine
        ? [{ isCompleted: completedScheduleIds.has(schedule.id), routine, schedule }]
        : [];
    })
    .sort((left, right) => {
      const completionOrder = Number(left.isCompleted) - Number(right.isCompleted);

      return completionOrder || left.schedule.time.localeCompare(right.schedule.time);
    });
}
