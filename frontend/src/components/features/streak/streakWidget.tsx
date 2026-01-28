// src/components/features/streak/streakWidget.tsx
import { useAuth } from "../../../hooks/authContext";
import { CROP_ROTATION } from "../../../data/crops";


export const StreakWidget = () => {
  const { user } = useAuth();
  const streak = user?.current_streak_count || 0;


  // LOGIC: Calculate which crop and which stage
  // Safety: If streak is 0, treat it visually as day 1 (show seed) to avoid crash
  const displayStreak = Math.max(streak, 1);
  const cropIndex = Math.floor((displayStreak - 1) / 7) % CROP_ROTATION.length;
  const currentCrop = CROP_ROTATION[cropIndex];
  const dayInCycle = (displayStreak - 1) % 7;
  const currentImage = currentCrop.stages[dayInCycle];
  const isHarvestDay = dayInCycle === 6;

  return (
    <div
      className={`relative rounded-3xl overflow-hidden shadow-sm flex flex-col p-5 sm:p-6  ${currentCrop.bgColor}`}
    >
      {/* 1. HEADER (Top) */}
      <h3 className="text-stone-800 font-bold text-base xl:text-lg flex items-center gap-2 w-full">
        Current Crop:{" "}
        <span className={currentCrop.color}>{currentCrop.name}</span>
      </h3>

      {/* 2. CONTENT ROW (Left & Right Split) */}
      <div className="flex flex-row justify-between items-center w-full">
        
        {/* Left Side: Stats */}
        <div className="flex flex-col items-start z-10">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-stone-800">{streak}</span>
            <span className="text-stone-500 font-bold text-lg">Days</span>
          </div>

          <p className="text-xs text-stone-500 mt-2 font-medium">
            {isHarvestDay
              ? "🎉 Harvest Day! +100 Pts"
              : `Watering... ${6 - dayInCycle} days until harvest.`}
          </p>
        </div>

        {/* Right Side: Image */}
        <div className="relative z-10">
          <div className="absolute inset-0 bg-white/40 rounded-full blur-xl scale-75"></div>
          
            <img
              src={currentImage}
              alt="Current Crop Stage"
              className="pixel-art w-16 h-16 object-contain drop-shadow-md transform rotate-3 transition-transform hover:rotate-0"
              style={{ imageRendering: "pixelated" }}
            />

            {isHarvestDay && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-20"></span>
              </div>
            )}
        </div>

      </div>

      {/* 3. FOOTER: Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-black/5">
        <div
          className={`h-full transition-all duration-500 ${currentCrop.color.replace("text-", "bg-")}`}
          style={{ width: `${((dayInCycle + 1) / 7) * 100}%` }}
        />
      </div>
    </div>
  );
};