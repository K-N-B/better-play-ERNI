// src/components/ui/potentialScoreBar.tsx
interface PotentialScoreBarProps {
  currentScore: number;
  maxScore: number;
  basePoints: number;
  speedBonus: number;
  // Generic props for the variable 3rd item
  bonusOrPenaltyValue: number;
  bonusOrPenaltyLabel: string;
  isPenalty?: boolean; // Default false. If true, shows Red/Negative. If false, shows Purple/Positive.
  color: string; // Optional color override for the bar
}

export const PotentialScoreBar = ({
  currentScore,
  maxScore,
  basePoints,
  speedBonus,
  bonusOrPenaltyValue,
  bonusOrPenaltyLabel,
  isPenalty = false,
  color,
}: PotentialScoreBarProps) => {
  const progressPercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;

  return (
    <div className="mb-2 lg:mb-6 w-full">
      <div className="flex justify-between text-xs md:text-lg font-medium text-black mb-1">
        <span>Potential Score</span>
        <span>
          {Math.round(currentScore)} / {maxScore} pts
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 lg:h-4 shadow-inner overflow-hidden">
        <div
          className={`${color} h-2 lg:h-4 rounded-full transition-all duration-700 ease-in-out relative`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs mt-1 text-gray-500 font-medium">
        <span className="text-primary-600">Base: {basePoints}</span>
        <span className="text-green-600">Speed: +{speedBonus}</span>

        {/* Dynamic 3rd Item */}
        <span
          className={`${
            isPenalty
              ? bonusOrPenaltyValue > 0
                ? "text-red-600"
                : "text-gray-400" // Penalty Style
              : bonusOrPenaltyValue > 0
                ? "text-yellow-700"
                : "text-gray-400" // Bonus Style
          }`}
        >
          {bonusOrPenaltyLabel}: {isPenalty ? "-" : "+"}
          {bonusOrPenaltyValue}
        </span>
      </div>
    </div>
  );
};
