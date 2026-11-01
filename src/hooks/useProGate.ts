import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useIsPro } from "@/services/pro";

/**
 * Gates a control behind Pro in one line:
 * `const { locked, gate } = useProGate(needsPro); <Row pro={locked} onPress={gate(action)} />`.
 * `locked` is false for Pro users and when `needsPro` is false (so a control
 * the user could already use, or data they already have, is never taken away).
 * `gate(action)` returns a handler that opens the paywall while locked and
 * runs `action` otherwise.
 */
export function useProGate(needsPro = true) {
  const router = useRouter();
  const isPro = useIsPro();
  const locked = needsPro && !isPro;

  const openPaywall = useCallback(() => {
    router.push("/paywall");
  }, [router]);

  const gate = useCallback(
    <A extends unknown[]>(action: (...args: A) => void) =>
      (...args: A) => {
        if (locked) {
          openPaywall();
        } else {
          action(...args);
        }
      },
    [locked, openPaywall]
  );

  return { isPro, locked, gate, openPaywall };
}
