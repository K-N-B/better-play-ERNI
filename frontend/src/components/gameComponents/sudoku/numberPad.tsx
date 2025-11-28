// The UI for input. Renders buttons 1-9, an "Erase" button, and a "Note Mode" toggle. It emits events to the SudokuGame parent.

import { Eraser, Edit } from "lucide-react";

import click1 from "@/assets/sounds/keyboard_press_1.mp3";
import click2 from "@/assets/sounds/keyboard_press_2.mp3";
import click3 from "@/assets/sounds/keyboard_press_3.mp3";
import { useSound } from "../../../hooks/useSound";

interface NumberPadProps {
  onNumberClick: (num: number) => void;
  onEraseClick: () => void;
  onNoteToggle: () => void;
  isNoteMode: boolean;
}

export const NumberPad = ({
  onNumberClick,
  onEraseClick,
  onNoteToggle,
  isNoteMode,
}: NumberPadProps) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const playClick = useSound([click1, click2, click3], 0.5);

  return (
    <div className="flex flex-row justify-between md:grid md:grid-cols-12  md:grid-cols-5 md:gap-6 lg:gap-2 w-full max-w-sm mx-auto mt-4">
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => {
            playClick();
            onNumberClick(num);
          }}
          aria-label={num.toString()}
          className="h-7 w-7 lg:h-12 lg:w-12 sm:h-14 sm:w-14 rounded-lg bg-primary-500 shadow-primary-800 text-white text-xl font-bold shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all"
        >
          {num}
        </button>
      ))}
      <button
        onClick={() => {
          playClick();
          onNoteToggle();
        }}
        aria-label="Toggle Notes"
        className={`h-7 w-7 lg:h-12 lg:w-12 sm:h-14 sm:w-14 rounded-lg text-lg font-bold 
                    ${isNoteMode ? "bg-yellow-400 shadow-yellow-600 shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all text-black" : "bg-gray-300 shadow-gray-600 shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all"}`}
      >
        <Edit className="mx-auto" />
      </button>
      <button
        onClick={() => {
          playClick();
          onEraseClick();
        }}
        aria-label="Erase"
        className="h-7 w-7 lg:h-12 lg:w-12  sm:h-14 sm:w-14 rounded-lg bg-red-500 shadow-red-800 text-white text-lg font-bold shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all"
      >
        <Eraser className="mx-auto" />
      </button>
    </div>
  );
};
