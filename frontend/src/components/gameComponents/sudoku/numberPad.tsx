// The UI for input. Renders buttons 1-9, an "Erase" button, and a "Note Mode" toggle. It emits events to the SudokuGame parent.

import { Eraser, Edit } from 'lucide-react';

interface NumberPadProps {
  onNumberClick: (num: number) => void;
  onEraseClick: () => void;
  onNoteToggle: () => void;
  isNoteMode: boolean;
}

export const NumberPad = ({ onNumberClick, onEraseClick, onNoteToggle, isNoteMode }: NumberPadProps) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="grid grid-cols-5 gap-2 w-full max-w-sm mx-auto mt-4">
      {numbers.map(num => (
        <button
          key={num}
          onClick={() => onNumberClick(num)}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-blue-500 text-white text-xl font-bold hover:bg-blue-600"
        >
          {num}
        </button>
      ))}
      <button
        onClick={onNoteToggle}
        className={`h-12 w-12 sm:h-14 sm:w-14 rounded-lg text-lg font-bold 
                    ${isNoteMode ? 'bg-yellow-400 text-black' : 'bg-gray-300 hover:bg-gray-400'}`}
      >
        <Edit className="mx-auto" />
      </button>
      <button
        onClick={onEraseClick}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-red-500 text-white text-lg font-bold hover:bg-red-600"
      >
        <Eraser className="mx-auto" />
      </button>
    </div>
  );
};