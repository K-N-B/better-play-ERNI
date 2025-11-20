// src/components/ui/potentialScoreBar.tsx

interface PotentialScoreBarProps {
    currentScore: number;
    maxScore: number;
    basePoints: number;
    speedBonus: number;
    penaltyValue: number;
    penaltyLabel: string; // e.g., "Attempts Penalty" or "Hint Penalty"
    color: string;
}

export const PotentialScoreBar = ({
    currentScore,
    maxScore,
    basePoints,
    speedBonus,
    penaltyValue,
    penaltyLabel,
    color
}: PotentialScoreBarProps) => {

    // Calculate percentage for width
    const progressPercentage = maxScore > 0
        ? (currentScore / maxScore) * 100
        : 0;

    return (
        <div className="mb-6 w-full">
            {/* Header: Label and Score */}
            <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                <span>Potential Score</span>
                <span>
                    {Math.round(currentScore)} / {maxScore} pts
                </span>
            </div>

            {/* The Progress Bar */}
            <div className="w-full bg-white rounded-full h-4 overflow-hidden">
                <div
                    className={`${color} h-4 rounded-full transition-all duration-700 ease-in-out relative`}
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Footer: Breakdown of points */}
            <div className="flex justify-between text-xs mt-1 text-gray-500 font-medium">
                <span className="text-primary-600">Base: {basePoints}</span>
                <span className="text-green-700">Speed bonus: +{speedBonus}</span>
                <span
                    className={`${penaltyValue > 0 ? "text-red-700 font-medium" : "text-gray-400"
                        }`}
                >
                    {penaltyLabel}: -{penaltyValue}
                </span>
            </div>
        </div>
    );
};