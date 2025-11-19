import { useState, useRef, useCallback, useEffect } from "react";

export const useTimer = (startTimeMs: number = 0) => {
  const [time, setTime] = useState(startTimeMs);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(time);

  // Keep ref in sync with state
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;

    const startTime = Date.now() - timeRef.current;

    timerRef.current = setInterval(() => {
      setTime(Date.now() - startTime);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTime(0);
    timeRef.current = 0; // ✅ Also reset ref
  }, [stopTimer]);

  const setSavedTime = useCallback(
    (savedTimeMs: number) => {
      stopTimer();
      setTime(savedTimeMs);
      timeRef.current = savedTimeMs; // ✅ FIX: Update ref immediately
    },
    [stopTimer]
  );

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return { time, startTimer, stopTimer, resetTimer, setSavedTime };
};
