// The on-screen keyboard. It takes the status of all used letters as a prop (to color the keys) and emits onKeyClick events (e.g., onKeyClick("A"), onKeyClick("Enter")).

import { X, CornerDownLeft } from 'lucide-react';

const keys = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
];

// Define the statuses your keys can have
type KeyStatus = 'correct' | 'present' | 'absent' | 'default';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  letterStatuses: Record<string, KeyStatus>; // e.g., { 'A': 'correct', 'B': 'absent' }
}

const statusColors: Record<KeyStatus, string> = {
  correct: 'bg-emerald-500 text-white',
  present: 'bg-yellow-400 text-white',
  absent: 'bg-gray-600 text-white',
  default: 'bg-gray-300 hover:bg-gray-400',
};

export const Keyboard = ({ onKeyPress, letterStatuses }: KeyboardProps) => {
  return (
    <div className="w-full max-w-lg mx-auto">
      {keys.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 sm:gap-1.5 mb-1.5">
          {row.map(key => {
            const keyUpper = key.toUpperCase();
            const status = letterStatuses[keyUpper] || 'default';
            
            return (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className={`h-14 rounded font-semibold uppercase p-2 transition-colors
                          ${key.length > 1 ? 'flex-[1.5] text-xs' : 'flex-1 text-lg'}
                          ${statusColors[status]}`}
              >
                {key === 'Backspace' ? <X className="mx-auto" /> : key === 'Enter' ? <CornerDownLeft className="mx-auto" /> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};