// src/components/features/streak/streakWidget.tsx
import { useMemo } from "react";
import { useAuth } from "../../../hooks/authContext";

// --- WEEK 1: TURNIPS ---
import turnip1 from "../../../assets/crops/turnip/tile000.png";
import turnip2 from "../../../assets/crops/turnip/tile001.png";
import turnip3 from "../../../assets/crops/turnip/tile002.png";
import turnip4 from "../../../assets/crops/turnip/tile003.png";
import turnip5 from "../../../assets/crops/turnip/tile004.png";
import turnip6 from "../../../assets/crops/turnip/tile005.png";
import turnip7 from "../../../assets/crops/turnip/tile006.png"; 

// --- WEEK 2: PUMPKINS (SQUASH) ---
import pumpkin1 from "../../../assets/crops/squash/tile000.png";
import pumpkin2 from "../../../assets/crops/squash/tile001.png";
import pumpkin3 from "../../../assets/crops/squash/tile002.png";
import pumpkin4 from "../../../assets/crops/squash/tile003.png";
import pumpkin5 from "../../../assets/crops/squash/tile004.png";
import pumpkin6 from "../../../assets/crops/squash/tile005.png";
import pumpkin7 from "../../../assets/crops/squash/tile006.png";

export const StreakWidget = () => {
  const { user } = useAuth();
  const streak = user?.current_streak_count || 0;

  // CONFIG: Define your crops and their stages
  const crops = useMemo(
    () => [
      {
        name: "Turnip",
        stages: [turnip1, turnip2, turnip3, turnip4, turnip5, turnip6, turnip7],
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      },
      {
        name: "Pumpkin",
        stages: [pumpkin1, pumpkin2, pumpkin3, pumpkin4, pumpkin5, pumpkin6, pumpkin7],
        color: "text-orange-500",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      },
    ],
    []
  );

  // LOGIC: Calculate which crop and which stage
  // Safety: If streak is 0, treat it visually as day 1 (show seed) to avoid crash
  const displayStreak = Math.max(streak, 1);

  // 1. Determine which "Week" the user is on (Cycles through the crops array)
  const cropIndex = Math.floor((displayStreak - 1) / 7) % crops.length;
  const currentCrop = crops[cropIndex];

  // 2. Determine the stage (Day 0-6 in the array)
  const dayInCycle = (displayStreak - 1) % 7;
  const currentImage = currentCrop.stages[dayInCycle];

  // 3. Is it harvest day? (Day 7 of the cycle)
  const isHarvestDay = dayInCycle === 6;

  return (
    <div
      className={`relative p-6 rounded-2xl border-2 shadow-sm flex items-center justify-between ${currentCrop.bgColor} ${currentCrop.borderColor}`}
    >
      {/* Left Side: Text Info */}
      <div>
        <h3 className="text-stone-800 font-bold text-lg flex items-center gap-2">
          Current Crop:{" "}
          <span className={currentCrop.color}>{currentCrop.name}</span>
        </h3>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-4xl font-black text-stone-800">{streak}</span>
          <span className="text-stone-500 font-medium">Day Streak</span>
        </div>

        <p className="text-xs text-stone-500 mt-2 font-medium">
          {isHarvestDay
            ? "🎉 Harvest Day! +100 Bonus Points!"
            : `Watering... ${6 - dayInCycle} days until harvest.`}
        </p>
      </div>

      {/* Right Side: The Plant Display */}
      <div className="relative w-24 h-24 flex items-center justify-center bg-white rounded-xl border-2 border-white/50 shadow-inner">
        {/* Pixel Art Class to keep it sharp */}
        <img
          src={currentImage}
          alt="Current Crop Stage"
          className="pixel-art w-16 h-16 object-contain drop-shadow-md"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Particle Effect for Harvest Day */}
        {isHarvestDay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-20"></span>
          </div>
        )}
      </div>

      {/* Bottom: Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/5 overflow-hidden rounded-b-xl">
        <div
          className={`h-full transition-all duration-500 ${currentCrop.color.replace("text-", "bg-")}`}
          style={{ width: `${((dayInCycle + 1) / 7) * 100}%` }}
        />
      </div>
    </div>
  );
};