// A simple display component that uses the useTimer hook to show the elapsed time.

import { Clock } from "lucide-react";

// Helper function to format milliseconds into MM:SS
const formatTime = (timeMs: number) => {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // padStart ensures it's "02:05" instead of "2:5"
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

interface TimerProps {
  timeMs: number;
}

export const Timer = ({ timeMs }: TimerProps) => {
  return (
    <div className="flex items-center w-20 justify-center space-x-2 bg-white px-3 py-2 ml-2 self-stretch rounded-xl">
      <Clock className="text-black" size={25} strokeWidth={2.5}/>
      <span className="text-sm md:text-xl font-semibold text-gray-800 tabular-nums">
        {formatTime(timeMs)}
      </span>
    </div>
  );
};
