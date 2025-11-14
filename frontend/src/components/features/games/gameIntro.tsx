// src/components/features/games/gameIntro.tsx - UPDATED WITH CHALLENGE SUPPORT
import DifficultyToggle from "../../ui/difficultyToggle";
import type { Difficulty } from '../../../pages/gamePage';

export interface PuzzleIntroProps {
  title: string; // e.g. "ERNIgram"
  description: string; // Intro text (the first block)
  howToPlay: string; // Instruction content
  pointsInfo: string; // Main points description
  hintInfo: string; // Hint/bonus info
  onStart: () => void; // Function when "Start" button is clicked
  onDifficultyChange: (difficulty: Difficulty) => void;
  initialDifficulty: Difficulty; // This prop now represents the current selection
  disableDifficultyChange?: boolean; // ✅ NEW: Disable difficulty selection for challenges
  color?: string; // Tailwind color for the toggle knob, e.g. "bg-sky-500"
  darkColor?: string;
  children?: React.ReactNode; // +++ ADD THIS LINE +++
}

export default function GameIntro({
  title,
  description,
  howToPlay,
  pointsInfo,
  hintInfo,
  onStart,
  onDifficultyChange,
  initialDifficulty,
  disableDifficultyChange = false, // ✅ NEW: Default to false
  color = "bg-primary-500", // default color
  darkColor = "bg-primary-900",
  children,
}: PuzzleIntroProps) {
  
  // ✅ Handle difficulty change with disabled check
  const handleDifficultyToggle = (isHard: boolean) => {
    if (disableDifficultyChange) {
      console.log('[GameIntro] Difficulty change disabled - challenge mode');
      return; // Don't allow changes in challenge mode
    }
    onDifficultyChange(isHard ? "hard" : "easy");
  };

  return (
    <div id="gameIntro" className="h-full text-center grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT SIDE */}
      <div className="hidden lg:block place-content-center p-20 text-xl leading-6 bg-white h-full rounded-3xl">
        <div
          className="font-medium"
          dangerouslySetInnerHTML={{ __html: description }}
        ></div>
        <div className="font-semibold mt-8">How to play:</div>
        <div
          className="mt-2 text-gray-700 whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: howToPlay }}
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="place-content-center p-20 text-xl leading-5">
        <div className="text-5xl font-bold">{title}</div>

        <div className="mt-10 font-medium">
          <div dangerouslySetInnerHTML={{ __html: pointsInfo }} />
          <div
            className="mt-10"
            dangerouslySetInnerHTML={{ __html: hintInfo }}
          />
        </div>

        <div className="mt-6 text-xl">
          {/* ✅ Show challenge notice or difficulty selector */}
          {disableDifficultyChange ? (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-semibold text-base">
                  🎯 Challenge Mode
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  Playing on <span className="uppercase font-bold">{initialDifficulty}</span> difficulty
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="font-semibold text-black mb-4">
                Choose a difficulty:
              </div>

              <DifficultyToggle
                onToggle={handleDifficultyToggle}
                initialIsHard={initialDifficulty === 'hard'}
                disabled={disableDifficultyChange} // ✅ Pass disabled state to toggle
                color={color}
                darkColor={darkColor}
              />
            </>
          )}

          <div className="difficulty-buttons mt-10">
            <button
              onClick={onStart}
              className={`font-semibold text-primary text-4xl leading-none px-6 py-4 rounded-2xl ${color} ${darkColor} text-white shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all`}
            >
              Start
            </button>
          </div>

          <div className="mt-6 lg:hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}