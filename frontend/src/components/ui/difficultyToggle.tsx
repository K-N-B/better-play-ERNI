// src/components/ui/difficultyToggle.tsx - UPDATED WITH DISABLED STATE
import React, { useState, useEffect } from "react";

interface DifficultyToggleProps {
  onToggle: (isHard: boolean) => void;
  initialIsHard?: boolean;
  disabled?: boolean; // ✅ NEW: Add disabled prop
  color?: string;
  darkColor?: string;
}

const DifficultyToggle: React.FC<DifficultyToggleProps> = ({
  onToggle,
  initialIsHard = false,
  disabled = false, // ✅ NEW: Default to false
  color = "bg-primary",
}) => {
  const [isHard, setIsHard] = useState(initialIsHard);

  useEffect(() => {
    setIsHard(initialIsHard);
  }, [initialIsHard]);

  const handleToggle = () => {
    // ✅ Don't toggle if disabled
    if (disabled) {
      console.log("[DifficultyToggle] Toggle disabled");
      return;
    }

    const newValue = !isHard;
    setIsHard(newValue);
    onToggle(newValue);
  };

  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Easy Label */}
      <span
        className={`text-lg font-semibold transition-colors ${
          !isHard ? "text-primary-700" : "text-gray-400"
        }`}
      >
        Easy
      </span>

      {/* Toggle Switch */}
      <button
        onClick={handleToggle}
        disabled={disabled} // ✅ Disable the button
        className={`relative w-16 h-8 rounded-full transition-all $ shadow-xs ${
          disabled
            ? "cursor-not-allowed opacity-50 bg-gray-300" // ✅ Disabled styles
            : isHard
              ? `bg-white `
              : `bg-white `
        }`}
        aria-label={`Toggle difficulty to ${isHard ? "easy" : "hard"}`}
        title={disabled ? "Difficulty locked for challenge" : undefined}
      >
        {/* Sliding Circle */}
        <span
          className={`absolute top-1 left-1 w-6 h-6 ${color} rounded-full shadow-md transform transition-transform ${
            isHard ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </button>

      {/* Hard Label */}
      <span
        className={`text-lg font-semibold transition-colors ${
          isHard ? "text-primary-700" : "text-gray-400"
        }`}
      >
        Hard
      </span>
    </div>
  );
};

export default DifficultyToggle;
