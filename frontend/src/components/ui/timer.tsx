import { Clock } from "lucide-react";

// Helper function to format milliseconds into MM:SS
const formatTime = (timeMs: number) => {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

interface TimerProps {
  timeMs: number;
}

export const Timer = ({ timeMs }: TimerProps) => {
  return (
    // FIX: Removed 'w-20'. Added 'w-auto' and 'px-4' for better breathing room.
    <div className="flex items-center justify-center w-auto min-w-fit space-x-2 bg-white px-4 py-2 ml-2 self-stretch rounded-xl shadow-sm border border-gray-100">
      <Clock className="text-black" size={16} strokeWidth={2.5} />
      {/* whitespace-nowrap ensures the time never wraps to a new line */}
      <span className="text-sm md:text-xl font-semibold text-gray-800 tabular-nums whitespace-nowrap">
        {formatTime(timeMs)}
      </span>
    </div>
  );
};