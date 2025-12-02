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
  className?: string; // Added for flexibility
}

export const NumberPad = ({
  onNumberClick,
  onEraseClick,
  onNoteToggle,
  isNoteMode,
  className = "",
}: NumberPadProps) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const playClick = useSound([click1, click2, click3], 0.5);

  // Common button height class to ensure alignment with external buttons
  const btnHeightClass = "h-10 w-10 lg:h-12 lg:w-12 sm:h-14 sm:w-14";

  return (
    // Removed 'mt-4' and 'mx-auto' to let Parent control layout
    <div className={`grid grid-cols-6 gap-2 md:gap-4 w-full max-w-sm ${className} md:mx-auto`}>
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => {
            playClick();
            onNumberClick(num);
          }}
          className={`${btnHeightClass} rounded-lg bg-primary-500 shadow-primary-800 text-white text-xl font-bold shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all`}
        >
          {num}
        </button>
      ))}
      <button
        onClick={() => {
          playClick();
          onNoteToggle();
        }}
        className={`${btnHeightClass} rounded-lg text-lg font-bold 
                  ${
                    isNoteMode
                      ? "bg-yellow-400 shadow-yellow-600 shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all text-black"
                      : "bg-gray-300 shadow-gray-600 shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all"
                  }`}
      >
        <Edit className="mx-auto" />
      </button>
      <button
        onClick={() => {
          playClick();
          onEraseClick();
        }}
        className={`${btnHeightClass} rounded-lg bg-red-500 shadow-red-800 text-white text-lg font-bold shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all`}
      >
        <Eraser className="mx-auto" />
      </button>
    </div>
  );
};