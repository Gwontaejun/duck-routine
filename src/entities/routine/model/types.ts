export type Step = {
  id: string;
  title: string;
  durationSec: number;
  hint?: string;
};

export type Routine = {
  id: string;
  title: string;
  icon: string;
  isFavorite?: boolean;
  isHidden?: boolean;
  description: string;
  steps: Step[];
};

export type Completion = {
  routineId: string;
  finishedAt: number;
  scheduleId?: string;
};

export type Schedule = {
  id: string;
  routineId: string;
  time: string;
  type: 'once' | 'range' | 'weekdays';
  startDate: string;
  endDate?: string;
  days?: number[];
  notificationIds?: string[];
  notificationSyncPending?: boolean;
  notificationSyncRevision?: string;
};
