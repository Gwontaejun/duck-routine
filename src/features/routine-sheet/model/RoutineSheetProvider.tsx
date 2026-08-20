import {
  type PropsWithChildren,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { Routine } from '@/entities/routine';
import { RoutineBottomSheet } from '@/features/home';

type RoutineSheetOptions = {
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  rightAction?: ReactNode;
  scheduleId?: string;
  showAction?: boolean;
  showFavorite?: boolean;
  showMascot?: boolean;
};

type RoutineSheetState = RoutineSheetOptions & { routine: Routine };

type RoutineSheetContextValue = {
  closeRoutineSheet: () => void;
  openRoutineSheet: (routine: Routine, options?: RoutineSheetOptions) => void;
};

const RoutineSheetContext = createContext<RoutineSheetContextValue | null>(null);

export function RoutineSheetProvider({ children }: PropsWithChildren) {
  const [sheet, setSheet] = useState<RoutineSheetState | null>(null);
  const sheetRef = useRef<RoutineSheetState | null>(null);

  useEffect(() => {
    sheetRef.current = sheet;
  }, [sheet]);

  const closeRoutineSheet = useCallback(() => {
    const onClose = sheetRef.current?.onClose;
    sheetRef.current = null;
    setSheet(null);
    onClose?.();
  }, []);

  const openRoutineSheet = useCallback((routine: Routine, options: RoutineSheetOptions = {}) => {
    const nextSheet = { routine, ...options };
    sheetRef.current = nextSheet;
    setSheet(nextSheet);
  }, []);

  const value = useMemo(
    () => ({ closeRoutineSheet, openRoutineSheet }),
    [closeRoutineSheet, openRoutineSheet],
  );

  return (
    <RoutineSheetContext.Provider value={value}>
      {children}
      <RoutineBottomSheet
        actionLabel={sheet?.actionLabel}
        onAction={sheet?.onAction}
        onClose={closeRoutineSheet}
        rightAction={sheet?.rightAction}
        routine={sheet?.routine ?? null}
        scheduleId={sheet?.scheduleId}
        showAction={sheet?.showAction}
        showFavorite={sheet?.showFavorite}
        showMascot={sheet?.showMascot}
      />
    </RoutineSheetContext.Provider>
  );
}

export function useRoutineSheet() {
  const context = useContext(RoutineSheetContext);

  if (!context) throw new Error('useRoutineSheet must be used within RoutineSheetProvider.');

  return context;
}
