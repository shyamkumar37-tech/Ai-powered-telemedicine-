import { useEffect, useRef } from "react";

/**
 * Custom React hook for automated idle session termination.
 * Conforms to HIPAA Security Rule §164.312(a)(2)(iii) workstation automatic logoff standard.
 *
 * @param onIdle Callback triggered when user is idle for timeoutMs
 * @param timeoutMs Timeout duration in milliseconds (default: 15 minutes = 900,000 ms)
 */
export function useIdleTimer(onIdle: () => void, timeoutMs: number = 15 * 60 * 1000) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onIdle();
    }, timeoutMs);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [onIdle, timeoutMs]);
}
