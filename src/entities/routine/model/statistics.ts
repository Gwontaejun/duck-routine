import type { Completion, Routine } from './types';

export function calculateStreak(completions: Completion[]) {
  const days = new Set(completions.map((item) => new Date(item.finishedAt).toDateString()));
  let cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function calculateTotalDuration(completions: Completion[], routines: Routine[]) {
  const durationByRoutineId = new Map(
    routines.map((routine) => [
      routine.id,
      routine.steps.reduce((total, step) => total + step.durationSec, 0),
    ]),
  );

  return completions.reduce(
    (total, completion) => total + (durationByRoutineId.get(completion.routineId) ?? 0),
    0,
  );
}
