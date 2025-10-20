import { useState } from "react";
import clsx from "clsx";

interface DifficultyToggleProps {
  // Callback function when the toggle state changes (true for Hard, false for Easy)
  onToggle: (isHard: boolean) => void;
  // Tailwind background color class for the knob (e.g., "bg-emerald-500")
  color: string;
  // Tailwind shadow color class (e.g., "shadow-emerald-900") used for the bottom border/shadow
  darkColor?: string;
}

export default function DifficultyToggle({
  onToggle,
  color,
  darkColor = "shadow-gray-900", // Default shadow if not provided
}: DifficultyToggleProps) {
  const [isHard, setIsHard] = useState(false);

  const handleToggle = () => {
    const newState = !isHard;
    setIsHard(newState);
    onToggle(newState); // Call the parent component's callback
  };

  // Extract the shadow depth class (e.g., shadow-[0_5px_0_0]) if present
  const shadowDepthClass =
    darkColor.match(/shadow-\[.*?\]/) || "shadow-[0_2px_0_0]";

  return (
    // Use a label to wrap the entire control for better click handling
    <label className="inline-flex items-center cursor-pointer select-none">
      {/* "Easy" Label */}
      <span
        className={clsx(
          "mr-4 text-xl font-medium transition-colors",
          !isHard ? "text-black font-semibold" : "text-gray-500" // Highlight active state
        )}
      >
        Easy
      </span>

      {/* Hidden Checkbox Input (for accessibility and state management) */}
      <input
        type="checkbox"
        className="sr-only peer" // Hides the default checkbox visually
        checked={isHard}
        onChange={handleToggle}
      />

      {/* Toggle Track (the background) */}
      <div
        className={clsx(
          "relative w-[5.5rem] h-11 rounded-full bg-gray-200 border border-gray-300", // Slightly larger track
          "transition-colors duration-300 ease-in-out"
        )}
      >
        {/* Toggle Knob (the moving part) */}
        <div
          className={clsx(
            "absolute top-[2px] left-[2px] h-10 w-10 rounded-full",
            "transition-transform duration-300 ease-in-out",
            "shadow-[0_2px_0_0] peer-checked:shadow-[0_2px_0_0]", // Consistent shadow base
            shadowDepthClass, // Apply dynamic shadow depth
            color, // Apply the main color
            darkColor, // Apply the shadow color
            isHard && "translate-x-full" // Move knob when checked (Hard)
          )}
        ></div>
      </div>

      {/* "Hard" Label */}
      <span
        className={clsx(
          "ml-4 text-xl font-medium transition-colors",
          isHard ? "text-black font-semibold" : "text-gray-500" // Highlight active state
        )}
      >
        Hard
      </span>
    </label>
  );
}