// A simple display component that uses the useTimer hook to show the elapsed time.

import { Clock } from 'lucide-react';

// Helper function to format milliseconds into MM:SS
const formatTime = (timeMs: number) => {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // padStart ensures it's "02:05" instead of "2:5"
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

interface TimerProps {
  timeMs: number;
}

export const Timer = ({ timeMs }: TimerProps) => {
  return (
    <div className="flex items-center justify-center space-x-2 bg-gray-100 p-2 rounded-lg shadow-inner">
      <Clock className="text-gray-600" size={20} />
      <span className="text-xl font-semibold text-gray-800 tabular-nums w-16">
        {formatTime(timeMs)}
      </span>
    </div>
  );
};