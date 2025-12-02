import { X, CornerDownLeft } from "lucide-react";
import { useSound } from "../../../hooks/useSound";
import click1 from "@/assets/sounds/keyboard_press_1.mp3";
import click2 from "@/assets/sounds/keyboard_press_2.mp3";
import click3 from "@/assets/sounds/keyboard_press_3.mp3";

const keys = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["Enter", "z", "x", "c", "v", "b", "n", "m", "Backspace"],
];

type KeyStatus = "correct" | "present" | "absent" | "default";

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  letterStatuses: Record<string, KeyStatus>;
}

const statusColors: Record<KeyStatus, string> = {
  correct: "bg-emerald-500 text-white shadow-emerald-700",
  present: "bg-yellow-400 text-white shadow-yellow-600",
  absent: "bg-gray-600 text-white shadow-gray-800",
  default: "bg-gray-300 hover:bg-gray-400 shadow-gray-400 text-gray-900",
};

export const Keyboard = ({ onKeyPress, letterStatuses }: KeyboardProps) => {
  const playClick = useSound([click1, click2, click3], 0.5);

  const handlePress = (key: string) => {
    playClick();
    onKeyPress(key);
  };

  return (
    <div className="w-full max-w-2xl mx-auto select-none p-1 md:p-4">
      {keys.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5 md:gap-2 mb-2 w-full">
          {row.map((key) => {
            const keyUpper = key.toUpperCase();
            const status = letterStatuses[keyUpper] || "default";
            const isSpecialKey = key.length > 1;

            return (
              <button
                key={key}
                onClick={() => handlePress(key)}
                aria-label={
                  key === "Backspace"
                    ? "Backspace"
                    : key === "Enter"
                    ? "Enter"
                    : keyUpper
                }
                // --- RESPONSIVE CLASSES ---
                // h-12 (mobile) -> md:h-14 (desktop)
                // text-sm (mobile) -> md:text-xl (desktop)
                // shadow sizes scale with screen
                className={`
                  flex items-center justify-center rounded-lg font-bold uppercase transition-all
                  active:scale-95 active:translate-y-1 active:shadow-none
                  ${
                    isSpecialKey
                      ? "flex-[1.5] text-[8px] sm:text-xs md:text-sm px-1" // Wider for Enter/Back
                      : "flex-1 text-lg md:text-2xl" // Standard letter size
                  }
                  h-8 md:h-14 lg:h-16
                  shadow-[0_3px_0_0] md:shadow-[0_4px_0_0] 
                  ${statusColors[status]}
                `}
              >
                {key === "Backspace" ? (
                  <X className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" strokeWidth={2.5} />
                ) : key === "Enter" ? (
                  <CornerDownLeft className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" strokeWidth={2.5} />
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};