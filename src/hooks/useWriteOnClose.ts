import { useCallback, useEffect, useRef } from "react";

/**
 * For a sheet that saves and closes: the write handed to the returned function runs when the
 * sheet unmounts, after its dismiss animation, instead of while it slides away. The sheet then
 * keeps the layout it had when Save was tapped (no button appears or goes because the data
 * changed under it), and the screen behind is focused again when the store changes, so its
 * amounts count to the new values instead of snapping (#187).
 */
export function useWriteOnClose() {
  const pending = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      pending.current?.();
      pending.current = null;
    },
    []
  );
  return useCallback((write: () => void) => {
    pending.current = write;
  }, []);
}
