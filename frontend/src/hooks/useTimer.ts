// A custom hook to manage a stopwatch.
// What you need to do: Use useState for time and useRef for the setInterval ID. Expose functions like startTimer(), stopTimer(), resetTimer(), and the current time value.
import { useState, useRef, useCallback, useEffect } from "react";

export const useTimer = (startTimeMs: number = 0) => {
  const [time, setTime] = useState(startTimeMs);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(time); // Ref to track current time

  // Keep ref in sync with state
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // --- THIS IS THE FIX ---
  // startTimer now uses timeRef.current instead of depending on 'time' state.
  // This makes the function stable (doesn't change on re-renders).
  const startTimer = useCallback(() => {
    if (timerRef.current) return; // Already running

    // Use the ref to get the current time for the offset calculation
    const startTime = Date.now() - timeRef.current;

    timerRef.current = setInterval(() => {
      setTime(Date.now() - startTime);
    }, 1000);
  }, []); // <-- Dependency array is now empty, making it stable
  // --- END FIX ---

  // stopTimer is already stable
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // resetTimer is stable
  const resetTimer = useCallback(() => {
    stopTimer();
    setTime(0);
  }, [stopTimer]);

  // setSavedTime is stable
  const setSavedTime = useCallback(
    (savedTimeMs: number) => {
      stopTimer();
      setTime(savedTimeMs);
    },
    [stopTimer]
  );

  // Cleanup effect is stable
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  return { time, startTimer, stopTimer, resetTimer, setSavedTime };
};
