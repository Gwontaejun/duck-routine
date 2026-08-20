import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { parseStoredJson } from '@/shared/lib';

import { starterRoutineHistoryIds, starterRoutines } from './presets';
import type { Completion, Routine, Schedule } from './types';

type RoutineStore = {
  addRoutine: (routine: Routine) => void;
  completeRoutine: (routineId: string, scheduleId?: string) => void;
  completions: Completion[];
  removeRoutine: (routineId: string) => void;
  removeSchedule: (id: string) => Promise<void>;
  routines: Routine[];
  saveSchedule: (schedule: Schedule) => Promise<void>;
  scheduleItems: Schedule[];
  toggleFavorite: (routineId: string) => void;
  toggleRoutineVisibility: (routineId: string) => void;
  updateRoutine: (routine: Routine) => void;
};

type StoredRoutineData = Pick<RoutineStore, 'completions' | 'routines' | 'scheduleItems'>;

const RoutineContext = createContext<RoutineStore | null>(null);
const storageKey = '@duck-routine/routines';

function mergeStarterRoutines(storedRoutines: Routine[]) {
  const storedById = new Map(storedRoutines.map((routine) => [routine.id, routine]));
  const customRoutines = storedRoutines.filter(
    (routine) => !starterRoutineHistoryIds.has(routine.id),
  );
  const refreshedStarters = starterRoutines.map((routine) => {
    const storedRoutine = storedById.get(routine.id);

    return {
      ...routine,
      ...(storedRoutine?.isFavorite !== undefined ? { isFavorite: storedRoutine.isFavorite } : {}),
      ...(storedRoutine?.isHidden !== undefined ? { isHidden: storedRoutine.isHidden } : {}),
    };
  });

  return [...customRoutines, ...refreshedStarters];
}

export function RoutineProvider({ children }: PropsWithChildren) {
  const [routines, setRoutines] = useState<Routine[]>(starterRoutines);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [scheduleItems, setScheduleItems] = useState<Schedule[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const dataRef = useRef<StoredRoutineData>({
    completions: [],
    routines: starterRoutines,
    scheduleItems: [],
  });
  const storageWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const persistData = useCallback((data: StoredRoutineData) => {
    const serialized = JSON.stringify(data);
    const write = storageWriteQueueRef.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(storageKey, serialized));

    storageWriteQueueRef.current = write;
    return write;
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        const data = parseStoredJson<StoredRoutineData>(stored, {
          completions: [],
          routines: starterRoutines,
          scheduleItems: [],
        });
        const nextData = {
          completions: data.completions ?? [],
          routines: mergeStarterRoutines(data.routines ?? starterRoutines),
          scheduleItems: data.scheduleItems ?? [],
        };

        dataRef.current = nextData;
        setRoutines(nextData.routines);
        setCompletions(nextData.completions);
        setScheduleItems(nextData.scheduleItems);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const data: StoredRoutineData = { completions, routines, scheduleItems };

    dataRef.current = data;
    void persistData(data);
  }, [completions, hydrated, persistData, routines, scheduleItems]);

  const addRoutine = useCallback(
    (routine: Routine) => setRoutines((items) => [routine, ...items]),
    [],
  );
  const updateRoutine = useCallback(
    (routine: Routine) =>
      setRoutines((items) => items.map((item) => (item.id === routine.id ? routine : item))),
    [],
  );
  const removeRoutine = useCallback((routineId: string) => {
    setCompletions((items) => items.filter((item) => item.routineId !== routineId));
    setRoutines((items) => items.filter((item) => item.id !== routineId));
    setScheduleItems((items) => items.filter((item) => item.routineId !== routineId));
  }, []);
  const completeRoutine = useCallback((routineId: string, scheduleId?: string) => {
    setCompletions((items) => [
      ...items,
      { finishedAt: Date.now(), routineId, ...(scheduleId ? { scheduleId } : {}) },
    ]);
  }, []);
  const toggleFavorite = useCallback((routineId: string) => {
    setRoutines((items) =>
      items.map((routine) =>
        routine.id === routineId ? { ...routine, isFavorite: !routine.isFavorite } : routine,
      ),
    );
  }, []);
  const toggleRoutineVisibility = useCallback((routineId: string) => {
    setRoutines((items) =>
      items.map((routine) =>
        routine.id === routineId ? { ...routine, isHidden: !routine.isHidden } : routine,
      ),
    );
  }, []);
  const removeSchedule = useCallback(
    (id: string) => {
      const scheduleItems = dataRef.current.scheduleItems.filter((item) => item.id !== id);
      const data = { ...dataRef.current, scheduleItems };

      dataRef.current = data;
      setScheduleItems(scheduleItems);
      return persistData(data);
    },
    [persistData],
  );
  const saveSchedule = useCallback(
    (schedule: Schedule) => {
      const scheduleItems = dataRef.current.scheduleItems.some((item) => item.id === schedule.id)
        ? dataRef.current.scheduleItems.map((item) => (item.id === schedule.id ? schedule : item))
        : [...dataRef.current.scheduleItems, schedule];
      const data = { ...dataRef.current, scheduleItems };

      dataRef.current = data;
      setScheduleItems(scheduleItems);
      return persistData(data);
    },
    [persistData],
  );
  const value = useMemo(
    () => ({
      addRoutine,
      completeRoutine,
      completions,
      removeRoutine,
      removeSchedule,
      routines,
      saveSchedule,
      scheduleItems,
      toggleFavorite,
      toggleRoutineVisibility,
      updateRoutine,
    }),
    [
      addRoutine,
      completeRoutine,
      completions,
      removeRoutine,
      removeSchedule,
      routines,
      saveSchedule,
      scheduleItems,
      toggleFavorite,
      toggleRoutineVisibility,
      updateRoutine,
    ],
  );

  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>;
}

export function useRoutineStore() {
  const store = useContext(RoutineContext);

  if (!store) throw new Error('useRoutineStore must be used inside RoutineProvider');

  return store;
}
